import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import invoiceRoutes from './routes/invoice';
import walletRoutes from './routes/wallet';
import webhookRoutes from './routes/webhooks';
import { startCronRunner, stopCronRunner } from './jobs/cronRunner';
import { logger } from './lib/logger';
import { parseBool } from './utils/parseBool';
import { wallet } from './lib/wallet';

const app = express();
const port = process.env.PORT || 4001;

app.use(cors());
app.use(express.json());
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', uptime: process.uptime() });
});

app.use('/api/invoice', invoiceRoutes);
app.use('/api/wallet', walletRoutes);
app.use('/api/webhook', webhookRoutes);

app.listen(port, () => {
  logger.info(`🚀 ThunderLink API running at http://localhost:${port}`);
});


if(parseBool(process.env.ENABLE_CRON)){
  logger.info('Cron enabled');
  startCronRunner();

}

const shutdown = async () => {
  logger.info('\n[Server] Shutting down gracefully...');
  try {
    stopCronRunner();
    logger.info('[Server] All tasks stopped. Exiting.');
    process.exit(0);
  } catch (error) {
    logger.error('[Server] Error during shutdown', error);
    process.exit(1);
  }
};

process.on('SIGINT', shutdown);   // Ctrl+C
process.on('SIGTERM', shutdown);  // Killed, Docker stop, PM2 stop
