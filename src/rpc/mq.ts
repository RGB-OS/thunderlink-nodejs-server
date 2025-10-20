// // mq.ts
// import amqp, { ConfirmChannel, Connection, Options, Replies } from 'amqplib';
// import { setTimeout as wait } from 'node:timers/promises';

// const AMQP_URL =
//   process.env.RABBITMQ_URL ||
//   'amqp://user:pass@host/vhost?heartbeat=30&connection_timeout=10000';

// type Consumer = {
//   queue: string;
//   onMessage: (msg: amqp.ConsumeMessage | null, ch: ConfirmChannel) => Promise<void> | void;
//   options?: Options.Consume;
//   consumerTag?: string;
// };

// let conn: Connection | null = null;
// let ch: ConfirmChannel | null = null;
// let connecting: Promise<void> | null = null;
// const consumers: Consumer[] = [];

// async function _connect() {
//   let attempt = 0;
//   while (true) {
//     try {
//       conn = await amqp.connect(AMQP_URL);
//       conn.on('error', (e) => console.warn('[amqp] conn error:', e.message));
//       conn.on('close', () => {
//         console.warn('[amqp] conn closed — will reconnect');
//         conn = null;
//         ch = null;
//         // kick off reconnect in background
//         connecting = _connect().catch(console.error);
//       });

//       ch = await conn.createConfirmChannel();
//       ch.on('error', (e) => console.warn('[amqp] channel error:', e.message));
//       ch.on('close', () => {
//         console.warn('[amqp] channel closed');
//         ch = null;
//       });

//       // topology (declare/ensure everything you need here)
//       await ch.assertQueue('rpc.to-server', { durable: true });
//       // await ch.assertQueue('rpc.to-client', { durable: true });

//       // re‑attach consumers after reconnect
//       for (const c of consumers) {
//         const { consumerTag } = await ch.consume(
//           c.queue,
//           (msg) => c.onMessage(msg, ch!),
//           c.options
//         );
//         c.consumerTag = consumerTag;
//       }

//       console.info('[amqp] connected and channel ready');
//       return;
//     } catch (e: any) {
//       attempt++;
//       const backoff = Math.min(30000, 500 * 2 ** attempt);
//       console.warn(`[amqp] connect failed (${e.message}); retry in ${backoff}ms`);
//       await wait(backoff);
//     }
//   }
// }

// export async function ensureConnected() {
//   if (ch && conn) return;
//   if (!connecting) connecting = _connect();
//   await connecting;
// }

// export async function getChannel(): Promise<ConfirmChannel> {
//   await ensureConnected();
//   if (!ch) throw new Error('AMQP channel unavailable');
//   return ch;
// }

// export async function registerConsumer(
//   queue: string,
//   onMessage: Consumer['onMessage'],
//   options?: Options.Consume
// ) {
//   await ensureConnected();
//   const entry: Consumer = { queue, onMessage, options };
//   consumers.push(entry);
//   const consumer = await ch!.consume(queue, (msg) => onMessage(msg, ch!), options);
//   entry.consumerTag = consumer.consumerTag;
// }

// export async function sendToQueue(
//   queue: string,
//   content: Buffer,
//   options?: Options.Publish
// ): Promise<void> {
//   const channel = await getChannel();
//   await new Promise<void>((resolve, reject) => {
//     channel.sendToQueue(queue, content, { persistent: true, ...options }, (err) =>
//       err ? reject(err) : resolve()
//     );
//   });
// }

// export async function publish(
//   exchange: string,
//   routingKey: string,
//   content: Buffer,
//   options?: Options.Publish
// ): Promise<void> {
//   const channel = await getChannel();
//   await new Promise<void>((resolve, reject) => {
//     channel.publish(exchange, routingKey, content, { persistent: true, ...options }, (err) =>
//       err ? reject(err) : resolve()
//     );
//   });
// }
