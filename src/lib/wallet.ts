import { createWalletManager, WalletManager } from 'rgb-sdk';

const xpub_van = process.env.XPUB_VAN!;
const xpub_col = process.env.XPUB_COL!;
const rgbEndpoint = process.env.RGB_MANAGER_ENDPOINT;
const master_fingerprint=  process.env.MASTER_FINGERPRINT!
const network = process.env.BITCOIN_NETWORK!;


console.log("BITCOIN_NETWORK raw",network)
if (!network) throw new Error("BITCOIN_NETWORK is not set");

if(!master_fingerprint){
  throw new Error('MASTER_FINGERPRINT is missing from environment variables');
}
if (!xpub_van) {
  throw new Error('XPUB_VAN is missing from environment variables');
}
if (!xpub_col) {
  throw new Error('XPUB_COL is missing from environment variables');
}
if (!rgbEndpoint) {
  throw new Error('RGB_MANAGER_ENDPOINT is missing from environment variables');
}

const wallet = createWalletManager({xpub_van,xpub_col, rgb_node_endpoint: rgbEndpoint,master_fingerprint,network});

export { wallet };