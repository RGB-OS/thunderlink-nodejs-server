import express from 'express';
import { createInvoice, decodeRGBInvoice, getInvoiceStatus } from '../services/walletService';
import { auth } from '../middlewares/auth';

const router = express.Router();

router.post('/create', auth, createInvoice);
router.post('/status', auth, getInvoiceStatus);
router.post('/decode', auth, decodeRGBInvoice);

export default router;
