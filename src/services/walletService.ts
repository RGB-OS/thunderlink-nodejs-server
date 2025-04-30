import { Request, Response } from 'express';
import { decodeInvoice } from '../utils/decodeInvoice';
import { RgbAllocation, RgbTransfer, TransferStatus, Unspent } from '../types/wallet';
import { wallet } from '../lib/wallet';
import { logger } from '../lib/logger';

const invoiceWatchers: Record<string, { transfer: RgbTransfer; timer: NodeJS.Timeout }> = {};

export const decodeRGBInvoice = (req: Request, res: Response) => {
    try {
        const invoice = decodeInvoice(req.body.invoice);
        res.json(invoice);
    } catch (err) {
        logger.error({ err }, 'Failed to decode RGB invoice');
        res.status(500).json({ error: 'Internal Server Error' });
    }
}

export const createInvoice = async (req: Request, res: Response): Promise<any> => {
    try {
        logger.debug({ body: req.body }, 'invoice/create');
        const { asset_id, amount } = req.body;
        const invoice = await wallet.blindRecive({ asset_id, amount });
        logger.info({ invoice }, 'Invoice created');
        const { recipient_id } = invoice;
        const { asset_id: decodedAssetId } = decodeInvoice(invoice.invoice);

        if (!decodedAssetId) throw new Error('Invalid invoice');

        const transfers: RgbTransfer[] = await wallet.listTransfers(decodedAssetId);
        const transfer = transfers.find(t => t.recipient_id === recipient_id);
        if (transfer) {
            const timer = startWatcher(recipient_id, decodedAssetId);
            invoiceWatchers[recipient_id] = { transfer, timer };
        }

        res.json(invoice);
    } catch (err) {
        logger.error({ err }, 'Failed to create invoice');
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

export const getInvoiceStatus = async (req: Request, res: Response): Promise<any> => {
    try {
        logger.debug({ body: req.body }, 'invoice/status');
        const { invoice, } = req.body;
        const { asset_id, recipient_id } = decodeInvoice(invoice);
        if (!asset_id) throw new Error('Invalid invoice');

        const transfers: RgbTransfer[] = await wallet.listTransfers(asset_id);
        const transfer = transfers.find(t => t.recipient_id === recipient_id);

        if (!transfer) return res.status(404).json({ error: 'Transfer not found' });

        if (!invoiceWatchers[recipient_id] && [TransferStatus.WAITING_COUNTERPARTY, TransferStatus.WAITING_CONFIRMATIONS].includes(transfer.status)) {
            const timer = startWatcher(recipient_id, asset_id);
            invoiceWatchers[recipient_id] = { transfer, timer };
        }

        res.json(transfer);
    } catch (err) {
        logger.error({ err }, 'Failed to get invoice status');
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

const startWatcher = (recipient_id: string, asset_id: string) => {
    const timer = setInterval(() => refreshWatcher(recipient_id, asset_id), 10_000);
    logger.info(`[Watcher started] ${recipient_id}`);
    return timer;
};

const stopWatcher = (recipient_id: string) => {
    const watcher = invoiceWatchers[recipient_id];
    if (watcher) {
        clearInterval(watcher.timer);
        delete invoiceWatchers[recipient_id];
        logger.info(`[Watcher stopped] ${recipient_id}`);
    }
};

const refreshWatcher = async (recipient_id: string, asset_id: string) => {
    try {
        await wallet.refreshWallet();
        const transfers: RgbTransfer[] = await wallet.listTransfers(asset_id);
        const updated = transfers.find(t => t.recipient_id === recipient_id);
        if (updated) {
            invoiceWatchers[recipient_id].transfer = updated;
            if ([TransferStatus.SETTLED, TransferStatus.FAILED].includes(updated.status)) {
                stopWatcher(recipient_id);
            }
        }
    } catch (err) {
        logger.error({ err }, `Watcher error for ${recipient_id}`);
    }
};
