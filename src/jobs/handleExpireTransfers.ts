import { wallet } from "rgb-connect-nodejs";
import { RgbTransfer, TransferStatus, Unspent } from "../types/wallet";
import { logger } from "../lib/logger";
import { InvoiceWatcher } from "../services/invoiceWatcherManager";

export const handleExpiredTransfers = async (unsettled: Unspent[]) => {
    const assetIds = Array.from(
        new Set(
            unsettled.flatMap(unspent =>
                unspent.rgb_allocations.filter(allocation => allocation.asset_id).map(allocation => allocation.asset_id)
            )
        )
    );
    logger.info(`[Expire Transfer] unsettled UTXOs: ${unsettled.length}`);
    const now = Math.floor(Date.now() / 1000);
    let count = 0;
    for (const assetId of assetIds) {
        try {
            const transfers: RgbTransfer[] = await wallet.listTransfers(assetId);

            for (const unspent of unsettled) {
                const { utxo } = unspent;

                const { txid: utxoTxid, vout: utxoVout } = utxo.outpoint;
                for (const transfer of transfers) {

                    if (
                        (!transfer.receive_utxo ||
                            transfer.receive_utxo.txid === utxoTxid &&
                            transfer.receive_utxo.vout === utxoVout) &&
                        transfer.status === TransferStatus.WAITING_COUNTERPARTY 
                        &&
                        transfer.expiration < now
                    ) {
                        try {
                            logger.info({ transfer, unspent }, `[Fail Transfer] Batch: ${transfer.batch_transfer_idx}`);
                            await wallet.failTransfers({ batch_transfer_idx: transfer.batch_transfer_idx });
                        } catch (error:any) {
                            logger.error(`[Fail Transfer Error] Batch: ${transfer.batch_transfer_idx}`, error?.data ?? error);
                            // throw error; // rethrow the error to be handled by the caller
                        }
                    }
                    // start watching the transfer if some isnt watched
                    if(InvoiceWatcher.shouldWatch(transfer.recipient_id, transfer)) {
                        logger.info(`[Expire Transfer] Starting watcher for ${transfer.recipient_id}`);
                        InvoiceWatcher.startWatcher(transfer.recipient_id, assetId, transfer);
                    }

                }
            }
        } catch (err) {
            logger.error({ err, assetId }, `[Expire Transfer] Failed to list transfers for asset`);
            // throw err; // rethrow the error to be handled by the caller
        }
    }
}