import { wallet } from '../lib/wallet';
import { RgbTransfer, TransferKind, TransferStatus } from '../types/wallet';
import { decodeInvoice } from '../utils/decodeInvoice';
import { logger } from '../lib/logger';

type Watcher = {
    transfer: RgbTransfer;
    timer: NodeJS.Timeout;
};
type CachedTransfers = {
    data: RgbTransfer[];
    timestamp: number; // in milliseconds
};
class InvoiceWatcherManager {
    private watchers: Record<string, Watcher> = {};
    private transfersCache: Map<string, CachedTransfers> = new Map();
    private cacheTTL = 90_000; // 60 seconds

    shouldWatch(recipient_id: string, transfer?: RgbTransfer): boolean {
        if (this.watchers[recipient_id]) return false; // already watching
        if (!transfer) return false; // no transfer to watch
        if (!transfer || [TransferStatus.FAILED, TransferStatus.SETTLED].includes(transfer.status)) return false; // no transfer to watch

        const now = Math.floor(Date.now() / 1000);
        if (transfer.expiration < now && transfer.kind === TransferKind.RECEIVE_BLIND) return false; // expired transfer
        return true;
    }

    startWatcher(recipient_id: string, asset_id: string, transfer: RgbTransfer) {
        const timer = setInterval(() => this.refresh(recipient_id, asset_id), 100_000);
        this.watchers[recipient_id] = { transfer, timer };
        logger.info(`[InvoiceWatcher] Started for ${recipient_id}|${asset_id}`);
    }

    stopWatcher(recipient_id: string) {
        const watcher = this.watchers[recipient_id];
        if (!watcher) return;

        clearInterval(watcher.timer);
        delete this.watchers[recipient_id];
        logger.info(`[InvoiceWatcher] Stopped for ${recipient_id}`);
    }


    async getTransfers(asset_id: string): Promise<RgbTransfer[]> {
        const now = Date.now();
        const cached = this.transfersCache.get(asset_id);

        if (cached && (now - cached.timestamp < this.cacheTTL)) {
            return cached.data;
        }

        await wallet.refreshWallet();
        const fresh = await wallet.listTransfers(asset_id);
        this.transfersCache.set(asset_id, { data: fresh, timestamp: now });

        return fresh;
    }

    async refresh(recipient_id: string, asset_id: string) {
        try {
            const transfers = await this.getTransfers(asset_id);
            const updated = transfers.find(t => t.recipient_id === recipient_id);
            if (updated && this.isWatching(recipient_id)) {
                this.watchers[recipient_id].transfer = updated;
                if ([TransferStatus.SETTLED, TransferStatus.FAILED].includes(updated.status)) {
                    this.stopWatcher(recipient_id);
                }
            }
        } catch (err: any) {
            logger.error({ err: err?.data ?? err }, `[InvoiceWatcher] Refresh failed for ${recipient_id} asset ${asset_id}`);
        }
    }

    isWatching(recipient_id: string): boolean {
        return !!this.watchers[recipient_id];
    }

    getWatcher(recipient_id: string): Watcher | undefined {
        return this.watchers[recipient_id];
    }
}

export const InvoiceWatcher = new InvoiceWatcherManager();
