import express from 'express';
import { apiErrorHandler } from '../utils/apiErrorHandler';
import { verifyWebhook } from '../middlewares/verifyWebhook';
import { confirmWebhook } from '../services/webhookService';

const router = express.Router();
router.post('/transfer-confirmed', verifyWebhook, apiErrorHandler(confirmWebhook));


export default router;
