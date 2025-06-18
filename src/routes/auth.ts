import express from 'express';
import { createInvoice, decodeRGBInvoice, getInvoiceStatus } from '../services/walletService';
import { auth } from '../middlewares/auth';
import { apiErrorHandler } from '../utils/apiErrorHandler';
import {  sign } from '../services/btcAuth';

const router = express.Router();
// router.post('/challenge', auth, getChallenge);
// router.post('/secure-action', auth, secureAction);
router.post('/sign', auth, sign);

export default router;