import { wallet } from '../lib/wallet';
import { handleExpiredTransfers } from './handleExpireTransfers';
import { getUnsettledUnspents, handleCreateUTXO } from './handleCreateUTXO';
import { logger } from '../lib/logger';
import { notificationService, NotificationType } from '../services/notification';
import { AssetNia } from '../types/wallet';

const CRON_INTERVAL_SECONDS = parseInt(process.env.CRON_INTERVAL_SECONDS || '60', 10);
const CRON_INTERVAL_MS = CRON_INTERVAL_SECONDS * 1000;

let cronRunning = true;
let timeoutHandle: NodeJS.Timeout | null = null;

export const handleWaitingTransfers = async () => {
  await wallet.refreshWallet();
  await handleExpiredTransfers();
}
export const motitorBTCBalance = async () => {
  const balance = await wallet.getBtcBalance();
  const address = await wallet.getAddress();
  const minBalance = parseInt(process.env.MIN_BTC_BALANCE || '10000', 10); 
  console.log('balance', balance.vanilla);
  if (balance.vanilla.spendable < minBalance) {
    logger.warn(`[BTC Balance Monitor] Low BTC Balance: ${balance} sats, below minimum threshold of ${minBalance} sats.`);
    notificationService.notify(NotificationType.InsufficientBTC, {balance:balance.vanilla,address});
  }

}
export const motitorAssetBalance = async () => {
  const list = await wallet.listAssets();
  const assets = list.nia;
  if(!assets || assets.length === 0) {
    logger.info('[Asset Balance Monitor] No assets found. Skipping asset balance check.');
    return;
  }
  for (const asset of assets as unknown as AssetNia[]) {
    const minBalance = parseInt(process.env.MIN_ASSET_BALANCE || '1000', 10); // 100 tokens
    const minRawBalance = minBalance * 10 ** asset.precision; // convert to micro-units
    if (asset.balance.spendable < minRawBalance) {
      logger.warn(`[Asset Balance Monitor] Low Asset Balance for ${asset.name}: ${asset.balance.spendable} units, below minimum threshold of ${minBalance} units.`);
      notificationService.notify(NotificationType.LowAssetBalance, asset);
    } 
  }
}

export const startCronRunner = async () => {
  const loop = async () => {
    if (!cronRunning) {
      logger.info('[CronRunner] Cron stopped. Exiting loop.');
      return;
    }

    logger.info(`[CronRunner]  Starting with interval ${CRON_INTERVAL_MS / 1000}s Running maintenance tasks at ${new Date().toISOString()}`);

    try {
      await motitorBTCBalance();
      await motitorAssetBalance();
      await wallet.registerWallet();
      await handleExpiredTransfers();
      await handleCreateUTXO();

      logger.info(`[CronRunner] Tasks completed`);
      timeoutHandle = setTimeout(loop, CRON_INTERVAL_MS); // only schedule next loop if successful
    } catch (error: any) {
      if (error.response) {
        // Log the real backend error message
        logger.error({
          status: error.response.status,
          data: error.response.data,
        }, '[CronRunner Critical Error] Cron stopped due to backend error');
      } else {
        // Unexpected (network, Axios bug, etc.)
        logger.error({
          message: error.message,
          stack: error.stack,
        }, '[CronRunner Critical Error] Cron stopped due to network or unexpected error');
      }
      // logger.error({error},'[CronRunner Critical Error]  Cron stopped due to error');
      cronRunning = false;
    }
  };

  loop();
};

export const stopCronRunner = () => {
  logger.info('[CronRunner] Stopping cron runner...');
  cronRunning = false;
  if (timeoutHandle) {
    clearTimeout(timeoutHandle);
    timeoutHandle = null;
  }
};

