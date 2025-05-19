import { wallet } from 'rgb-connect-nodejs';

const xpub = process.env.XPUB;
const rgbEndpoint = process.env.RGB_MANAGER_ENDPOINT;
const mnemonic = process.env.MNEMONIC!;

if (!xpub) {
  throw new Error('XPUB is missing from environment variables');
}
if (!rgbEndpoint) {
  throw new Error('RGB_MANAGER_ENDPOINT is missing from environment variables');
}

wallet.init(xpub, rgbEndpoint,mnemonic);

export { wallet };