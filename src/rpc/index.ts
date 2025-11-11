import { RpcMessage } from "../types/rpc";
import { getChannel } from "./channel";
import { methodHandlers } from "./methodHandlers";
import { logger } from "../lib/logger";

let consumerTag: string | null = null;
let isListening = false;

async function listenRPC() {
    try {
        if (isListening) {
            logger.info('RPC listener already active, skipping...');
            return;
        }
        
        isListening = true;
        const channel = await getChannel();
        
        channel.on('error', async (err: Error) => {
            logger.error({ err }, 'RPC channel error');
            consumerTag = null;
            isListening = false;
            // Try to reconnect after a short delay
            setTimeout(() => {
                logger.info('Attempting to reconnect RPC listener...');
                listenRPC().catch(console.error);
            }, 5000);
        });
        
        channel.on('close', () => {
            logger.warn('RPC channel closed, will attempt to reconnect');
            consumerTag = null;
            isListening = false;
        });
        
        const result = await channel.consume('rpc.to-server', async (msg: any) => {
            if (!msg) {
                logger.warn('Received null message from queue');
                return;
            }
            
            try {
                const job: RpcMessage = JSON.parse(msg.content.toString());
                logger.info({ job }, 'Backend received from client');
                
                const handler = methodHandlers[job.method];
                if (handler) {
                    await handler(job, channel);
                } else {
                    logger.warn({ method: job.method }, 'No handler for method');
                }
                
                channel.ack(msg);
                logger.debug('Message acknowledged successfully');
            } catch (err: any) {
                logger.error({ err: err.message }, 'Error processing RPC message');
                // Don't requeue the message if it's a processing error
                channel.nack(msg, false, false);
            }
        });
        
        consumerTag = result.consumerTag;
        logger.info({ consumerTag }, 'RPC v2 refactored server is listening for messages...');
    } catch (error) {
        logger.error({ error: String(error) }, 'Error setting up RPC listener');
        isListening = false;
        // Try to reconnect after a delay
        setTimeout(() => {
            logger.info('Attempting to reconnect RPC listener...');
            listenRPC().catch(console.error);
        }, 5000);
    }
}

export const startRPC = async () => {
    try {
        // await listenRPC();
    } catch (error) {
        logger.error({ error: String(error) }, 'Error starting RPC server');
        throw error;
    }
}

export const stopRPC = async () => {
    try {
        if (consumerTag) {
            const channel = await getChannel();
            await channel.cancel(consumerTag);
            consumerTag = null;
            isListening = false;
            logger.info('RPC consumer cancelled');
        }
    } catch (error) {
        logger.error({ error: String(error) }, 'Error stopping RPC server');
    }
}