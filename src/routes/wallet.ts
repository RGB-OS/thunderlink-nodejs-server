import express from 'express';
import { decodeRGBInvoice, failTransfers, getAddress, getAssetBalance, getBtcBalance, issueAssetNia, listAssets, listTransfers, listUnspents, refreshWallet, registerWallet } from '../services/walletService';
import { auth } from '../middlewares/auth';
import { apiErrorHandler } from '../utils/apiErrorHandler';

const router = express.Router();
router.post('/register', auth, apiErrorHandler(registerWallet));
router.post('/listassets', auth, apiErrorHandler(listAssets));
router.post('/failtransfers', auth, apiErrorHandler(failTransfers));
router.post('/address', auth, apiErrorHandler(getAddress));
router.post('/assetbalance', auth, apiErrorHandler(getAssetBalance));
router.post('/btcbalance', auth, apiErrorHandler(getBtcBalance));
router.post('/listunspends', auth, apiErrorHandler(listUnspents));
router.post('/listtransfers', auth, apiErrorHandler(listTransfers));
router.post('/issueassetnia', auth, apiErrorHandler(issueAssetNia));
router.post('/decodergbinvoice', auth, apiErrorHandler(decodeRGBInvoice));
router.post('/refresh', auth, apiErrorHandler(refreshWallet));

export default router;
