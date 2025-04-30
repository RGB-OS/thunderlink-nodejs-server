// import express, { Request, Response } from 'express';
// import { wallet } from 'thunderlink-sdk'; // <-- from local build
// import cors from 'cors';
// const app = express();
// const port = process.env.PORT || 4001;

// app.use(express.json());
// const xpub = 'tpubDCNyfuS6Are75WRm61sf38RKEBbntVbMQyAuTTPAEaVFezU8yPWDreezPf38wxvcLgT3UjH5AsnegrfRniku1HWz9HN2bvCLxxgESeAUqJf'
// const mnemonic = 'melody fee hero onion rapid bullet again exile exact exile slogan grace'
// // const asset_id = 'rgb:49vaJ7XR-U7flPJB-Lb2l7cq-plK7uFu-ZEfls4!-DTECPAw'

// wallet.init(xpub)
// export interface Unspent {
//     utxo: Utxo;
//     rgb_allocations: RgbAllocation[];
// }
// export interface Utxo {
//     outpoint: string;
//     btc_amount: number;
//     colorable: boolean;
// }

// export interface RgbAllocation {
//     asset_id: string;
//     amount: number;
//     settled: boolean;
// }
// const areThereAtLeastTwoFreeUtxos = (unspents: Unspent[]): boolean => {
//     const freeUtxoCount = unspents.filter(
//         (unspent) => !unspent.rgb_allocations || unspent.rgb_allocations.length === 0
//     ).length;
//     return freeUtxoCount >= 2;
// }
// type InvoiceWatcher = {
//     transfer: RgbTransfer;
//     timer: NodeJS.Timeout;
// };

// const invoiceWatchers: Record<string, InvoiceWatcher> = {};
// const startInvoiceWatcher = (recipient_id: string, asset_id: string) => {
//     const timer = setInterval(() => refreshInvoiceStatus(recipient_id, asset_id), 10_000);

//     logger.info(`[Watcher started] ${recipient_id}`);
//     return timer;
// };

// const refreshInvoiceStatus = async (recipient_id: string, asset_id: string) => {
//     try {
//         await wallet.refreshWallet();
//         const updatedTransfers: RgbTransfer[] = await wallet.listTransfers(asset_id);
//         const updated = updatedTransfers.find(t => t.recipient_id === recipient_id);

//         if (updated) {
//             invoiceWatchers[recipient_id].transfer = updated;

//             if (
//                 updated.status === TransferStatus.SETTLED ||
//                 updated.status === TransferStatus.FAILED
//             ) {
//                 stopInvoiceWatcher(recipient_id);
//             }
//         }
//     } catch (err) {
//         logger.error(`[Watcher error] ${recipient_id}:`, err);
//     }
// };
// const stopInvoiceWatcher = (recipient_id: string) => {
//     const watcher = invoiceWatchers[recipient_id];
//     if (watcher) {
//         clearInterval(watcher.timer);
//         delete invoiceWatchers[recipient_id];
//         logger.info(`[Watcher stopped] ${recipient_id}`);
//     }
// };

// app.post('/api/invoice/create', async (req: Request<{asset_id:string,amount:number}>, res: Response): Promise<any> => {
//     try {
//         const { asset_id, amount } = req.body;

//         if (!xpub) {
//             return res.status(400).json({ error: 'Missing xpub header' });
//         }
//         // Step 1: Fetch unspents
//         const unspents = await wallet.listUnspents();

//         if (unspents.length === 0) {
//             // There should be /createutxo endpoint
//             throw new Error('No UTXO found.');
//         }

//         // Step 2: Check if there are at least two free UTXOs
//         if (!areThereAtLeastTwoFreeUtxos(unspents)) {
//             // if no free utxo -> create utxo
//             logger.info('Creating UTXO');
//             const psbtBase64 = await wallet.createUtxosBegin({ num: 10 });
//             const signedPsbt = await wallet.signPsbt({ psbtBase64, mnemonic });
//             const createdUTXO = await wallet.createUtxosEnd({ signedPsbt });
//             logger.info('UTXO CREATED:', createdUTXO);

//         } else {
//             logger.info('Not all UTXOs have rgb_allocations booked. at least 2 free UTXOs available');
//         }


//         // Step 3: Create an invoice
//         const invoice = await wallet.generateInvoice({ asset_id, amount });
//         logger.info('Invoice created:', invoice);
//         const { recipient_id, expiration_timestamp } = invoice;

//         // Start watcher immediately
//         const asset_id_decoded = decodeInvoice(invoice.invoice).asset_id;
//         if (!asset_id_decoded) {
//             throw new Error('Invalid invoice: Missing asset_id.');
//         }
//         (async () => {
//             try {
//                 const transfers: RgbTransfer[] = await wallet.listTransfers(asset_id_decoded);
//                 const transfer = transfers.find(t => t.recipient_id === recipient_id);
//                 if (!transfer) return;

//                 const timer = startInvoiceWatcher(recipient_id, asset_id_decoded);
//                 invoiceWatchers[recipient_id] = { transfer, timer };
//             } catch (err) {
//                 logger.error(`[invoice/create] Watcher setup failed for ${recipient_id}:`, err);
//             }
//         })();

//         return res.json(invoice);
//     } catch (err) {
//         logger.error(err);
//         return res.status(500).json({ error: 'Internal Server Error' });
//     }
// });
// app.post('/api/invoice/status', async (req: Request<InvoiceStatusRequest>, res: Response): Promise<any> => {
//     try {
//         const { recipient_id, invoice } = req.body;
//         const asset_id_decoded = decodeInvoice(invoice).asset_id;
//         if (!asset_id_decoded) {
//             throw new Error('Invalid invoice: Missing asset_id.');
//         }
//         const transfers: RgbTransfer[] = await wallet.listTransfers(asset_id_decoded);

//         const transfer = transfers.find(t => t.recipient_id === recipient_id);

//         if (!transfer) {
//             return res.status(404).json({ error: 'Transfer not found for recipient' });
//         }
//         if (!invoiceWatchers[recipient_id] && [TransferStatus.WAITING_COUNTERPARTY, TransferStatus.WAITING_CONFIRMATIONS].includes(transfer.status)) {
//             (async () => {
//                 try {
//                     const timer = startInvoiceWatcher(recipient_id, asset_id_decoded);
//                     invoiceWatchers[recipient_id] = { transfer, timer };
//                 } catch (err) {
//                     logger.error(`[status] Failed to start watcher for ${recipient_id}:`, err);
//                 }
//             })();
//         }

//         return res.json(transfer);
//     } catch (err) {
//         logger.error(err);
//         return res.status(500).json({ error: 'Internal Server Error' });
//     }
// });
// const decodeInvoice = (_invoice: string) => {
//     const parts: {
//         recipient_id: string | null;
//         asset_iface: string | null;
//         asset_id: string | null;
//         amount: number | null;
//         network: string | null;
//         expiration_timestamp: number | null;
//         transport_endpoints: string[];
//     } = {
//         recipient_id: null,
//         asset_iface: null,
//         asset_id: null,
//         amount: null,
//         network: null,
//         expiration_timestamp: null,
//         transport_endpoints: [],
//     };

//     const [prefixAndRecipient, query] = _invoice.split('?');

//     // Extract asset_id, iface, amount+recipient from prefix
//     const [asset_id, iface, amountAndRecipient] = prefixAndRecipient.split('/');

//     // Parse recipient (after +) and amount (before +)
//     const [amountPart, recipient_id] = amountAndRecipient.split('+');

//     parts.asset_id = asset_id || null;
//     parts.asset_iface = iface || null;
//     parts.recipient_id = recipient_id || null;

//     // const amount = parseInt(amountPart.replace(/[^\d]/g, ''), 10);
//     // parts.amount = isNaN(amount) ? null : amount;
//     try {
//         parts.amount = base58ToNumber(amountPart);
//     } catch {
//         parts.amount = null;
//     }
//     // Guess network based on prefix
//     if (recipient_id?.startsWith('bcrt')) {
//         parts.network = 'Regtest';
//     } else if (recipient_id?.startsWith('tb')) {
//         parts.network = 'Testnet';
//     } else if (recipient_id?.startsWith('bc')) {
//         parts.network = 'Bitcoin';
//     }

//     // Parse query params
//     const params = new URLSearchParams(query);
//     const expiry = params.get('expiry');
//     const endpoints = params.get('endpoints');

//     if (expiry) parts.expiration_timestamp = parseInt(expiry, 10);
//     if (endpoints) parts.transport_endpoints = [endpoints];

//     return parts;
// };

// interface InvoiceStatusRequest {
//     invoice: string;
//     recipient_id: string;
//     expiration_timestamp: number;
//     batch_transfer_idx: number;
// }

// // Start the server
// app.listen(port, () => {
//     logger.info(`🚀 ThunderLink API running on http://localhost:${port}`);
// });

// const BASE58_ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';

// function base58ToNumber(str: string): number {
//     let num = 0;
//     for (let char of str) {
//         const value = BASE58_ALPHABET.indexOf(char);
//         if (value === -1) throw new Error(`Invalid Base58 character: ${char}`);
//         num = num * 58 + value;
//     }
//     return num;
// }

// export interface RgbTransfer {
//     idx: number;
//     batch_transfer_idx: number;
//     created_at: number;
//     updated_at: number;
//     status: TransferStatus;
//     amount: number;
//     kind: number;
//     txid: string | null;
//     recipient_id: string;
//     receive_utxo: {
//         txid: string;
//         vout: number;
//     };
//     change_utxo: {
//         txid: string;
//         vout: number;
//     } | null;
//     expiration: number;
//     transport_endpoints: {
//         endpoint: string;
//         transport_type: number;
//         used: boolean;
//     }[];
// }

// enum TransferStatus {
//     WAITING_COUNTERPARTY = 0,

//     WAITING_CONFIRMATIONS,

//     SETTLED,

//     FAILED
// }