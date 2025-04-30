import { wallet } from 'thunderlink-sdk';

const xpub = process.env.XPUB;

if (!xpub) {
  throw new Error('XPUB is missing from environment variables');
}

wallet.init(xpub);

export { wallet };