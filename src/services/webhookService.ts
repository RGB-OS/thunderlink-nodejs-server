
import { wallet } from '../lib/wallet';
import { InvoiceWatcher } from './invoiceWatcherManager';
const mnemonic = process.env.MNEMONIC!;
export const confirmWebhook = async (req: any, res: any) => {

    try {
        const { asset_id, recipient_id,amount, invoice } = req.body;
        //  bridge work is done successfully then asset should be sent to recipient
        // const transferDetails={
        // recipient_map: Record<string, Recipient[]>;
        // donation?: boolean;            // default: false
        // fee_rate?: number;             // default: 1
        // min_confirmations?: number;    // default: 1
        //   }
        const invoiceData = {
            asset_id, recipient_id, amount, invoice
        }

       const psbt = await wallet.sendBegin(invoiceData);
        console.log('psbt', psbt);
        const signedPsbt = await wallet.signPsbt({ psbtBase64:psbt, mnemonic:mnemonic});
        console.log('signedPsbt', signedPsbt);
        const finishedPsbt = await wallet.sendEnd({ signed_psbt: signedPsbt });
        console.log('finishedPsbt', finishedPsbt);

        // await wallet.send(invoiceData, process.env.MNEMONIC!);
        // await wallet.refreshWallet();
        const transfers = await wallet.listTransfers(asset_id);
        const transfer = transfers.find(t => t.recipient_id === recipient_id);
        if (transfer && InvoiceWatcher.shouldWatch(recipient_id, transfer)) {
            InvoiceWatcher.startWatcher(recipient_id, asset_id, transfer);
        }

        return res.json({ message: 'Transfer sent' });
    } catch (error) {
        console.error('Error confirming transfer:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}