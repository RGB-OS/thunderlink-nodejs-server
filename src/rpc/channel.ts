import amqp, { Channel } from 'amqplib';
import fs from 'fs';

let cachedChannel: Channel | null = null;
let cachedConnection: any = null;
let isConnecting = false;
let heartbeatInterval: NodeJS.Timeout | null = null;
const RABBITMQ_URL = process.env.RABBITMQ_CONNECTION_URL!;

if (!RABBITMQ_URL) {
    throw new Error('RABBITMQ_CONNECTION_URL environment variable is not set');
}

function startHeartbeat() {
    if (heartbeatInterval) {
        clearInterval(heartbeatInterval);
    }
    
    heartbeatInterval = setInterval(async () => {
        try {
            if (cachedChannel && cachedConnection && !cachedConnection.closed) {
                // Send a simple ping to keep the connection alive
                await cachedChannel.assertQueue('rpc.to-server', { durable: true });
            }
        } catch (error) {
            console.log('Heartbeat failed, connection may be broken:', error);
            // Reset connection on heartbeat failure
            cachedConnection = null;
            cachedChannel = null;
            isConnecting = false;
        }
    }, 30000); // Check every 30 seconds
}

function stopHeartbeat() {
    if (heartbeatInterval) {
        clearInterval(heartbeatInterval);
        heartbeatInterval = null;
    }
}

async function createConnection(): Promise<any> {
    console.log('Creating new RabbitMQ connection...');
    const connection = await amqp.connect(RABBITMQ_URL);
    
    // Handle connection errors
    connection.on('error', (err: Error) => {
        console.error('RabbitMQ connection error:', err);
        cachedConnection = null;
        cachedChannel = null;
        isConnecting = false;
        stopHeartbeat();
    });
    
    connection.on('close', () => {
        console.log('RabbitMQ connection closed');
        cachedConnection = null;
        cachedChannel = null;
        isConnecting = false;
        stopHeartbeat();
    });
    
    return connection;
}

async function createChannel(connection: any): Promise<Channel> {
    console.log('Creating new RabbitMQ channel...');
    const channel = await connection.createChannel();
    
    // Handle channel errors
    channel.on('error', (err: Error) => {
        console.error('RabbitMQ channel error:', err);
        cachedChannel = null;
    });
    
    channel.on('close', () => {
        console.log('RabbitMQ channel closed');
        cachedChannel = null;
    });
    
    // Set up queues
    await channel.assertQueue('rpc.to-server', { durable: true });
    await channel.assertQueue('rpc.to-client', { durable: true });
    
    return channel;
}

export async function getChannel(): Promise<Channel> {
    try {
        // Check if we have a valid channel
        if (cachedChannel && cachedConnection && !cachedConnection.closed) {
            return cachedChannel;
        }
        
        // Prevent multiple simultaneous connection attempts
        if (isConnecting) {
            // Wait for the connection to complete
            while (isConnecting) {
                await new Promise(resolve => setTimeout(resolve, 100));
            }
            if (cachedChannel) {
                return cachedChannel;
            }
        }
        
        isConnecting = true;
        
        // If no connection or connection is closed, create a new one
        if (!cachedConnection || cachedConnection.closed) {
            cachedConnection = await createConnection();
        }
        
        // Create a new channel
        cachedChannel = await createChannel(cachedConnection);
        
        // Start heartbeat
        startHeartbeat();
        
        console.log('Successfully connected to RabbitMQ');
        isConnecting = false;
        return cachedChannel;
    } catch (error) {
        console.error('Error getting RabbitMQ channel:', error);
        // Reset cached instances on error
        cachedConnection = null;
        cachedChannel = null;
        isConnecting = false;
        stopHeartbeat();
        throw error;
    }
}

// Graceful shutdown function
export async function closeChannel(): Promise<void> {
    try {
        stopHeartbeat();
        if (cachedChannel) {
            await cachedChannel.close();
            cachedChannel = null;
        }
        if (cachedConnection) {
            await cachedConnection.close();
            cachedConnection = null;
        }
        console.log('RabbitMQ connection and channel closed gracefully');
    } catch (error) {
        console.error('Error closing RabbitMQ connection:', error);
    }
}