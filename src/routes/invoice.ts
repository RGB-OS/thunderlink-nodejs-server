import express from 'express';
import { createInvoice, decodeRGBInvoice, getInvoiceStatus } from '../services/walletService';
import { auth } from '../middlewares/auth';
import { apiErrorHandler } from '../utils/apiErrorHandler';

const router = express.Router();
// router.post('/create', auth, apiErrorHandler(createInvoice));
router.post('/status', auth, apiErrorHandler(getInvoiceStatus));
router.post('/decode', auth, apiErrorHandler(decodeRGBInvoice));

export default router;
