import express from 'express';
import { failTransfers, getAddress, listAssets, listTransfers, listUnspents, registerWallet } from '../services/walletService';
import { auth } from '../middlewares/auth';
import { apiErrorHandler } from '../utils/apiErrorHandler';

const router = express.Router();
router.post('/register', auth, apiErrorHandler(registerWallet));
router.post('/listassets', auth, apiErrorHandler(listAssets));
router.post('/failtransfers', auth, apiErrorHandler(failTransfers));
router.post('/address', auth, apiErrorHandler(getAddress));
router.post('/listunspends', auth, apiErrorHandler(listUnspents));
router.post('/listtransfers', auth, apiErrorHandler(listTransfers));

export default router;
