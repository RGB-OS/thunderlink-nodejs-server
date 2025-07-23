import { listAssets } from './../services/walletService';
import { wallet } from "rgb-connect-nodejs";
import { AssetNia, RgbTransfer, TransferStatus, Unspent } from "../types/wallet";
import { logger } from "../lib/logger";
import { InvoiceWatcher } from "../services/invoiceWatcherManager";

export const handleExpiredTransfers = async () => {

    const listAssets = await wallet.listAssets();
    const assetIds = listAssets.nia?.map((asset) => (asset as unknown as AssetNia).asset_id);


    if (!assetIds || assetIds.length === 0) {
        logger.info(`[Expire Transfer] No assets found to process.`);
        return;
    }
    const now = Math.floor(Date.now() / 1000);
    for (const assetId of assetIds) {
        console.log(`[Expire Transfer] Processing asset: ${assetId}`);
        try {
            const transfers: RgbTransfer[] = await wallet.listTransfers(assetId);
            for (const transfer of transfers) {

                if (
                    transfer.status === TransferStatus.WAITING_COUNTERPARTY
                    &&
                    transfer.expiration &&
                    transfer.expiration < now
                ) {
                    try {
                        logger.info({ transfer }, `[Fail Transfer] Batch: ${transfer.batch_transfer_idx}`);
                        await wallet.failTransfers({ batch_transfer_idx: transfer.batch_transfer_idx });
                    } catch (error: any) {
                        logger.error(`[Fail Transfer Error] Batch: ${transfer.batch_transfer_idx}`, error?.data ?? error);
                        // throw error; // rethrow the error to be handled by the caller
                    }
                }
                // start watching the transfer if some isnt watched
                if (InvoiceWatcher.shouldWatch(transfer.recipient_id, transfer)) {
                    logger.info(`[Expire Transfer] Starting watcher for ${transfer.recipient_id}`);
                    InvoiceWatcher.startWatcher(transfer.recipient_id, assetId, transfer);
                }

            }

        } catch (err) {
            logger.error({ err, assetId }, `[Expire Transfer] Failed to list transfers for asset`);
            // throw err; // rethrow the error to be handled by the caller
        }
    }
}