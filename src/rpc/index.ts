import { RpcMessage } from "../types/rpc";
import { getChannel } from "./channel";
import { methodHandlers } from "./methodHandlers";

async function listenRPC() {
    const channel = await getChannel();
    channel.consume('rpc.to-server', async (msg: any) => {
        if (!msg) return;
        const job: RpcMessage = JSON.parse(msg.content.toString());
        console.log('Backend received from client:', job);
        try {
            const handler = methodHandlers[job.method];
            if (handler) await handler(job, channel);
            else console.warn('No handler for method:', job.method);
            channel.ack(msg);
          } catch (err: any) {
            console.error('Client error:', err.message);
            channel.nack(msg, false, true);
          }
        
    });
}

export const startRPC = async () => {
    try {
        
        await listenRPC();
        console.log('RPC server is listening for messages...');
    } catch (error) {
        console.error('Error starting RPC server:', error);
    }
}