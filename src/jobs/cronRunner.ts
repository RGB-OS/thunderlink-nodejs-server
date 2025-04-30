import { wallet } from '../lib/wallet';
import { handleExpiredTransfers } from './handleExpireTransfers';
import { getUnsettledUnspents, handleCreateUTXO } from './handleCreateUTXO';
import { logger } from '../lib/logger';

const CRON_INTERVAL_SECONDS = parseInt(process.env.CRON_INTERVAL_SECONDS || '60', 10);
const CRON_INTERVAL_MS = CRON_INTERVAL_SECONDS * 1000;

let cronRunning = true;
let timeoutHandle: NodeJS.Timeout | null = null;

export const startCronRunner = async () => {
    logger.info(`[CronRunner] Starting with interval ${CRON_INTERVAL_MS / 1000}s`);

    const loop = async () => {
        if (!cronRunning) {
            logger.info('[CronRunner] Cron stopped. Exiting loop.');
            return;
        }

        logger.info(`[CronRunner] Running maintenance tasks at ${new Date().toISOString()}...`);

        try {
            const unspents = await wallet.listUnspents();
            const unsetteled = getUnsettledUnspents(unspents);
            await handleExpiredTransfers(unsetteled);

            await handleCreateUTXO();

            logger.info(`[CronRunner] Tasks completed`);
            timeoutHandle = setTimeout(loop, CRON_INTERVAL_MS); // only schedule next loop if successful
        } catch (error) {
            logger.error({error},'[CronRunner Critical Error]');
            cronRunning = false;
            logger.error('[CronRunner] Cron stopped due to error.');
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

