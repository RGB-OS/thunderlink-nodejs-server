import { Channel } from 'amqplib';
import { RpcMessage } from '../types/rpc';
import { wallet } from 'rgb-connect-nodejs';

const signPsbt = async(unsignedPSBT: string): Promise<string> =>{
  return await new Promise((resolve) => {
    setTimeout(() => {
        // Invoke rgb-signer here
      resolve(`${unsignedPSBT}-signed`);
    }, 1000);
  })
}

export const methodHandlers: Record<string, (msg: RpcMessage, channel: Channel) => void> = {
  'create-utxo-begin': async (msg, ch) => {
    // const psbtBase64 = await wallet.createUtxosBegin({ num: 1 });
    // const signed = await signPsbt(msg.payload);
    sendToClient('sign', 'string_to_sign', ch, msg.txId,'create-utxo-end');
  },
 'create-utxo-end': async (msg, ch) => {
    const signedPsbt = msg.payload;
    // await wallet.createUtxosEnd({ signedPsbt });
    sendToClient('create-utxo-end', 'UTXO created successfully',signedPsbt, msg.txId);
  
 }
 ,
};

export function sendToClient(method: string, payload: string, channel: Channel, txId: string,next: string = ''): void {
  const msg: RpcMessage = { txId, method, payload,next };
  channel.sendToQueue('rpc.to-client', Buffer.from(JSON.stringify(msg)), { persistent: true });
}
