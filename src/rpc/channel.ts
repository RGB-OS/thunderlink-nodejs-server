import amqp, { Channel } from 'amqplib';
import fs from 'fs';

let cachedChannel: Channel;
const RABBITMQ_URL = process.env.RABBITMQ_CONNECTION_URL!;
if (!RABBITMQ_URL) {
    throw new Error('RABBITMQ_CONNECTION_URL environment variable is not set');
}
export async function getChannel(): Promise<Channel> {
    console.log('Connecting to RabbitMQ at', RABBITMQ_URL);
    if (cachedChannel) return cachedChannel;
    const conn = await amqp.connect(
        RABBITMQ_URL,
        // {
        //     ca: [fs.readFileSync('./certs/ca.pem')],
        //     cert: fs.readFileSync('./certs/client-cert.pem'),
        //     passphrase: '12345678',
        //     key: fs.readFileSync('./certs/client-key.pem'),
        //     servername: 'localhost',
        // }
    );
    cachedChannel = await conn.createChannel();
    await cachedChannel.assertQueue('rpc.to-client', { durable: true });
    await cachedChannel.assertQueue('rpc.to-server', { durable: true });
    return cachedChannel;
}