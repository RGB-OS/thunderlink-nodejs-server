import { wallet } from 'rgb-connect-nodejs';

const xpub_van = process.env.XPUB_VAN!;
const xpub_col = process.env.XPUB_COL!;
const rgbEndpoint = process.env.RGB_MANAGER_ENDPOINT;
const mnemonic = process.env.MNEMONIC!;

if (!xpub_van) {
  throw new Error('XPUB_VAN is missing from environment variables');
}
if (!xpub_col) {
  throw new Error('XPUB_COL is missing from environment variables');
}
if (!rgbEndpoint) {
  throw new Error('RGB_MANAGER_ENDPOINT is missing from environment variables');
}

wallet.init(xpub_van,xpub_col, rgbEndpoint,mnemonic);
console.log('Wallet initialized with xpub_van:', xpub_van, 'and xpub_col:', xpub_col);
// console.log(wallet)

export { wallet };