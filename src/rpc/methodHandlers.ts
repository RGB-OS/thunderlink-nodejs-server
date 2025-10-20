import { Channel } from 'amqplib';
import { RpcMessage } from '../types/rpc';
import { wallet } from 'rgb-connect-nodejs';
import { pendingRequests } from './pending';
import { getChannel } from './channel';
import { logger } from '../lib/logger';

export const InvokeRPCMethod = async (
  method: string,
  payload: any,
): Promise<void> => {
  const channel = await getChannel();
  const msg: RpcMessage = {
    method,
    txId: `tx-${Date.now()}`,
    payload: JSON.stringify(payload)
  };
  const handler = methodHandlers[method];

  if (handler) await handler(msg, channel);
  else console.warn('No handler for method:', method);
};

export const methodHandlers: Record<string, (msg: RpcMessage, channel: Channel) => void> = {
  'send-begin': async (msg, ch) => {
    const invoiceData = JSON.parse(msg.payload);
    const rgbinvoice = await wallet.decodeRGBInvoice(invoiceData) as any;
    console.log('rgbinvoice', rgbinvoice);
    const psbt = await wallet.sendBegin(invoiceData);
    sendToClient('sign', psbt, msg.txId, 'send-end');
  },
  'send-end': async (msg, ch) => {
    try {
      const signedPsbt = msg.payload;
      await wallet.sendEnd({ signed_psbt: signedPsbt });
      logger.info(`[Send] Successfully sent transaction. txId: ${msg.txId}`);
    } catch (error: any) {
      logger.error(error?.data || error, '[to-server.send-end] Error sending transaction:');
    }
    sendToClient('send-end', 'Transaction sent successfully', msg.txId);
  },
  'create-utxo-begin': async (msg, ch) => {
    const params = JSON.parse(msg.payload);
    const psbtBase64 = await wallet.createUtxosBegin(params);
    sendToClient('sign', psbtBase64, msg.txId, 'create-utxo-end');
  },
  'create-utxo-end': async (msg, ch) => {
    try {
      const signedPsbt = msg.payload;
      logger.info(`[UTXO Checker] Finalizing UTXO creation. txId: ${msg.txId}`);
      await wallet.createUtxosEnd({ signedPsbt });
      logger.info(`[UTXO Checker] Successfully created UTXOs. txId: ${msg.txId}`);
    } catch (error: any) {
      logger.error(error?.data || error, '[to-server.create-utxo-end] Error creating UTXOs:');
    }
    sendToClient('create-utxo-end', 'UTXO created successfully', msg.txId);
  }
  ,
};

export async function sendToClient(method: string, payload: string, txId: string, next: string = ''): Promise<void> {
  try {
    const sendChannel = await getChannel();
    const msg: RpcMessage = { txId, method, payload, next };
    console.log('sendToClient:', msg);
    await sendChannel.sendToQueue('rpc.to-client', Buffer.from(JSON.stringify(msg)), { persistent: true });
  } catch (error) {
    logger.error({ error: String(error) }, 'Error sending message to client');
    throw error;
  }
}
