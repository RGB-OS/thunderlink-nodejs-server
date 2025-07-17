import { wallet } from '../lib/wallet';
import { handleExpiredTransfers } from './handleExpireTransfers';
import { getUnsettledUnspents, handleCreateUTXO } from './handleCreateUTXO';
import { logger } from '../lib/logger';

const CRON_INTERVAL_SECONDS = parseInt(process.env.CRON_INTERVAL_SECONDS || '60', 10);
const CRON_INTERVAL_MS = CRON_INTERVAL_SECONDS * 1000;

let cronRunning = true;
let timeoutHandle: NodeJS.Timeout | null = null;

export const handleWaitingTransfers = async () => {
  await wallet.refreshWallet();
  const unspents = await wallet.listUnspents();
  const unsetteled = getUnsettledUnspents(unspents);
  await handleExpiredTransfers(unsetteled);
}

export const startCronRunner = async () => {
  const loop = async () => {
    if (!cronRunning) {
      logger.info('[CronRunner] Cron stopped. Exiting loop.');
      return;
    }

    logger.info(`[CronRunner]  Starting with interval ${CRON_INTERVAL_MS / 1000}s Running maintenance tasks at ${new Date().toISOString()}`);

    try {

      await wallet.registerWallet()
      const unspents = await wallet.listUnspents();
      const unsetteled = getUnsettledUnspents(unspents);
      await handleExpiredTransfers(unsetteled);
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

