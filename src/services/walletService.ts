import { Request, Response } from 'express';
import { decodeInvoice } from '../utils/decodeInvoice';
import { RgbAllocation, RgbTransfer, TransferStatus, Unspent } from '../types/wallet';
import { wallet } from '../lib/wallet';
import { logger } from '../lib/logger';
import { InvoiceWatcher } from './invoiceWatcherManager';
import { IssueAssetNiaRequestModel } from 'rgb-connect-nodejs';

export const registerWallet = async (req: Request, res: Response): Promise<void> => {
    const registered = await wallet.registerWallet();
    res.json(registered);
}

export const decodeRGBInvoice = async (req: Request, res: Response): Promise<void> => {
    const invoice = await wallet.decodeRGBInvoice(req.body);
    res.json(invoice);

}
export const issueAssetNia = async (req: Request, res: Response): Promise<void> => {
    const {ticker,name, amounts,precision} = req.body as IssueAssetNiaRequestModel;
    const assets = await wallet.issueAssetNia({ticker,name, amounts,precision});
    res.json(assets);
}
export const sendBegin = async (req: Request, res: Response): Promise<void> => {
    const { invoice,amount,asset_id } = req.body;
    logger.debug({ body: req.body }, 'send/begin');
    const rgbinvoice = await wallet.decodeRGBInvoice({invoice,amount,asset_id} as any);
    if (!rgbinvoice) {
        res.status(400).json({ error: 'Invalid invoice' });
        return;
    }
    const psbt = await wallet.sendBegin({invoice,amount,asset_id} as any);
    res.json(psbt);
}

export const sendEnd = async (req: Request, res: Response): Promise<void> => {
    const { signed_psbt } = req.body;
    logger.debug({ body: req.body }, 'send/end');
    try {
        const sendresult = await wallet.sendEnd({ signed_psbt });
        res.json(sendresult);
    } catch (error) {
        logger.error(error, '[send-end] Error sending transaction:');
        res.status(500).json({ error: 'Error sending transaction' });
    }
}
export const listAssets = async (req: Request, res: Response): Promise<void> => {
    const assets = await wallet.listAssets();
    res.json(assets);
}
export const getAssetBalance = async (req: Request, res: Response): Promise<void> => {
    const { asset_id } = req.body;
    const balance = await wallet.getAssetBalance(asset_id);
    res.json(balance);
}
export const failTransfers = async (req: Request, res: Response): Promise<void> => {
    const { batch_transfer_idx } = req.body;

    if (!batch_transfer_idx) {
        res.status(404).json({ error: 'Transfer not found' });
    }

    await wallet.failTransfers({ batch_transfer_idx: batch_transfer_idx });
    res.json({ message: 'Transfer failed' });
}

export const createInvoice = async (req: Request, res: Response): Promise<void> => {
    logger.debug({ body: req.body }, 'invoice/create');
    const { asset_id, amount } = req.body;
    const invoice = await wallet.blindRecive({ asset_id, amount });
    logger.info({ invoice }, 'Invoice created');
    const { recipient_id } = invoice;
    const { asset_id: decodedAssetId } = decodeInvoice(invoice.invoice);

    if (!decodedAssetId) throw new Error('Invalid invoice');

    const transfers: RgbTransfer[] = await wallet.listTransfers(decodedAssetId);
    const transfer = transfers.find(t => t.recipient_id === recipient_id);
    if (transfer && InvoiceWatcher.shouldWatch(recipient_id, transfer)) {
        InvoiceWatcher.startWatcher(recipient_id, asset_id, transfer);
    }
    res.json(invoice);
};

export const getInvoiceStatus = async (req: Request, res: Response): Promise<void> => {
    logger.debug({ body: req.body }, 'invoice/status');
    const { invoice, } = req.body;
    const { asset_id, recipient_id } = decodeInvoice(invoice);
    if (!asset_id) throw new Error('Invalid invoice');

    const transfers: RgbTransfer[] = await wallet.listTransfers(asset_id);
    const transfer = transfers.find(t => t.recipient_id === recipient_id);

    if (!transfer) {
        res.status(404).json({ error: 'Transfer not found' });
        return
    }

    if (InvoiceWatcher.shouldWatch(recipient_id, transfer)) {
        InvoiceWatcher.startWatcher(recipient_id, asset_id, transfer);
    }
    res.json(transfer);
};

export const getBtcBalance = async (req: Request, res: Response): Promise<void> => {
    const balance = await wallet.getBtcBalance();
    res.json(balance);
}
export const getAddress = async (req: Request, res: Response): Promise<void> => {
    const address = await wallet.getAddress();
    res.json(address);
}
export const listUnspents = async (req: Request, res: Response): Promise<void> => {
    const unspent: Unspent[] = await wallet.listUnspents();
    res.json(unspent);
}

export const listTransfers = async (req: Request, res: Response): Promise<void> => {
    const { asset_id } = req.body;
    const transfers: RgbTransfer[] = await wallet.listTransfers(asset_id);
    res.json(transfers);
}

export const refreshWallet = async (req: Request, res: Response): Promise<void> => {
    await wallet.refreshWallet();
    res.json({ message: 'Wallet refreshed' });
}
