import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import invoiceRoutes from './routes/invoice';
import { startCronRunner, stopCronRunner } from './jobs/cronRunner';
import { logger } from './lib/logger';

const app = express();
const port = process.env.PORT || 4001;

app.use(cors());
app.use(express.json());
app.use('/api/invoice', invoiceRoutes);

app.listen(port, () => {
  logger.info(`🚀 ThunderLink API running at http://localhost:${port}`);
});

startCronRunner();

// Graceful shutdown handling
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
