import { wallet } from 'rgb-connect-nodejs';

const xpub_van = process.env.XPUB_VAN!;
const xpub_col = process.env.XPUB_COL!;
const rgbEndpoint = process.env.RGB_MANAGER_ENDPOINT;
const master_fingerprint=  process.env.MASTER_FINGERPRINT!
const network = parseInt(process.env.BITCOIN_NETWORK!, 3);

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

wallet.init({xpub_van,xpub_col, rgbEndpoint,master_fingerprint,network});

export { wallet };