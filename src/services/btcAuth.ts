
import { v4 as uuidv4 } from 'uuid';
import bitcoinMessage from 'bitcoinjs-message';
import { Request, Response, NextFunction } from 'express';
import * as bitcoin from 'bitcoinjs-lib';
// import bip32 from 'bip32';
import { schnorr } from '@noble/curves/secp256k1';
import BIP32Factory from 'bip32';
import * as ecc from 'tiny-secp256k1';
import { BIP32Interface } from 'bip32';
import { Signer, SignerAsync, ECPairInterface, ECPairFactory, ECPairAPI, TinySecp256k1Interface } from 'ecpair';
import * as crypto from 'crypto';
import * as bip39 from 'bip39';
const tinysecp: TinySecp256k1Interface = require('tiny-secp256k1');
const bip32 = BIP32Factory(ecc);

export const challenge = async (req: Request, res: Response): Promise<void> => {


}
const nonceStore = new Map();

/**
 * Save nonce to memory with expiry
 */
export function saveNonce(nonce: string, data: any, ttlSeconds = 300) {
    nonceStore.set(nonce, { ...data, createdAt: Date.now() });

    // setTimeout(() => {
    //     nonceStore.delete(nonce);
    // }, ttlSeconds * 1000);
}

/**
 * Get and delete nonce (to ensure one-time use)
 */
export function useNonce(nonce: string): any | null {
    const data = nonceStore.get(nonce);
    if (data) {
        // nonceStore.delete(nonce);
        return data;
    }
    return null;
}
type ChallengeRequest = {
    xpub: string;
    path: string;
    method: string;
    pathUrl: string;
    body?: any;
  };

interface ChallengeParams {
    message: string,
    signature: string,
    address: string,
}

// export async function generateChallenge({ method, pathUrl, body, xpub, path }: ChallengeRequest) {
//     const nonce = uuidv4();
//     const timestamp = new Date().toISOString();
//     const serializedBody = JSON.stringify(body || {});
  
//     const message = `${method}:${pathUrl}\nTimestamp: ${timestamp}\nNonce: ${nonce}\nBody: ${serializedBody}`;
    
//     // Store challenge metadata for nonce-based replay protection
//     saveNonce(nonce, { xpub, path, timestamp });
  
//     return { message };
//   }

// // export async function verifyChallenge({ message, signature, address }: ChallengeParams): Promise<boolean> {
// //     const nonceLine = message.split('\n').find(l => l.startsWith('Nonce: '));
// //     if (!nonceLine) throw new Error('Missing nonce');
// //     const nonce = nonceLine.replace('Nonce: ', '');

// //     const record = useNonce(nonce); // one-time use
// //     if (!record) throw new Error('Invalid or expired nonce');

// //     if (record.address !== address) throw new Error('Address mismatch');

// //     const verified = bitcoinMessage.verify(message, address, signature);
// //     if (!verified) throw new Error('Invalid signature');

// //     return true;
// // }
// /**
//  * Verify Taproot Schnorr signature using derived x-only pubkey from xpub
//  */
// export function verifyChallenge({
//   xpub,
//   path,
//   message,
//   signature,
// }: {
//   xpub: string;               // xpub (e.g., tpub...)
//   path: string;              // derivation path (e.g., "0/0")
//   message: string;           // original signed message
//   signature: string;         // base64 Schnorr signature
// }): boolean {
//   try {
//     // Step 1: derive x-only pubkey from xpub
//     const node = bip32.fromBase58(xpub, bitcoin.networks.regtest); // or regtest
//     const child = node.derivePath(path);
    
//     if (!child.publicKey || child.publicKey.length !== 33) {
//       throw new Error('Invalid or missing compressed public key');
//     }
//     console.log('✅ Derived child public key:',  Buffer.from(child.publicKey).toString('hex'));

//     const xOnlyPubkey = child.publicKey; // Remove 0x02 or 0x03
//     const pubkeyHex = Buffer.from(xOnlyPubkey).toString('hex');

//     const msgBytes = new TextEncoder().encode(message);
//     const messageHex = Buffer.from(msgBytes).toString('hex');

//     const sigBytes = Buffer.from(signature, 'base64');
//     const signatureHex = sigBytes.toString('hex');


//     // Step 3: verify Schnorr signature

//     const verified = schnorr.verify(signatureHex, messageHex, pubkeyHex);
    
//     console.log('✅ Signature verification result:', verified);

//     return verified;
//   } catch (err) {
//     console.error('❌ Signature verification failed:', err);
//     return false;
//   }
// }



export const getChallenge = async (req: Request, res: Response): Promise<void> => {
   const { xpub, path, method, pathUrl, body } = req.body;

    if (!xpub || !path || !method || !pathUrl) {
       res.status(400).json({ error: 'Missing required fields' });
    }
    const result = generateChallenge({ xpub, path, method, pathUrl, body });
    res.json(result);

}
// export const secureAction = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
//     try {
//         const { message, signature, xpub, path } = req.body;

//         const isValid = verifyChallenge({
//           message,
//           signature,
//           xpub,
//           path,
//         });
    
//         if (!isValid) {
//            res.status(401).json({ error: 'Invalid signature or challenge' });
//         }

//         res.json({ success: true });
//     } catch (err: any) {
//         console.error('Challenge verification failed:', err);
//         res.status(401).json({ error: err?.message });
//     }
// }

export const sign = async (req: Request, res: Response): Promise<void> => {
    try {
    const { message,signature } = req.body;
   
    res.json({ signature:Buffer.from(signature).toString('base64')});
    }catch (err: any) {
        console.error('Error signing message:', err);
        res.status(500).json({ error: 'Failed to sign message' });
    }
    // console.log('xOnlyPubkey:', xOnlyPubkey.toString('hex'));
}


// Generate challenge (like backend)
function generateChallenge({
    method,
    pathUrl,
    body,
    xpub,
    path,
  }: {
    method: string;
    pathUrl: string;
    body?: any;
    xpub: string;
    path: string;
  }) {
    const nonce = uuidv4();
    const timestamp = new Date().toISOString();
    const serializedBody = JSON.stringify(body || {});
    const message = `${method}:${pathUrl}\nTimestamp: ${timestamp}\nNonce: ${nonce}\nBody: ${serializedBody}`;
    saveNonce(nonce, { xpub, path, timestamp });
    return { message };
  }
  
  // Verify (like backend)
  function verifyChallenge({
    xpub,
    path,
    message,
    signature,
  }: {
    xpub: string;
    path: string;
    message: string;
    signature: string;
  }): boolean {
    try {
      const nonceLine = message.split('\n').find(l => l.startsWith('Nonce: '));
      if (!nonceLine) throw new Error('Missing nonce');
      const nonce = nonceLine.replace('Nonce: ', '');
  
      const record = useNonce(nonce); // one-time use
        console.log('🔍 Nonce record:', record)
        console.log('🔍 xpub:', xpub);
        console.log('🔍 path:', path);
      if (!record) throw new Error('Invalid or expired nonce');
      if (record.xpub !== xpub || record.path !== path) throw new Error('xpub/path mismatch');
  
      const node = bip32.fromBase58(xpub, bitcoin.networks.regtest);
      const child = node.derivePath(path);
  
      const xOnlyPubkey = child.publicKey.slice(1);
      const pubkeyHex = Buffer.from(xOnlyPubkey).toString('hex');
  
      const msgBytes = new TextEncoder().encode(message);
      const messageHex = Buffer.from(msgBytes).toString('hex');
      const signatureHex = Buffer.from(signature, 'base64').toString('hex');
  
      const verified = schnorr.verify(signatureHex, messageHex, pubkeyHex);
      console.log('✅ Signature verified?', verified);
      return verified;
    } catch (err) {
      console.error('❌ Verification failed:', err);
      return false;
    }
  }
  
  // Sign (like client)
  async function signMessage(message: string, path: string): Promise<{
    xpub: string;
    signature: string;
  }> {
    const seed = bip39.mnemonicToSeedSync('avocado later police relief client define upgrade speed obscure garment pattern trap');
    const root = bip32.fromSeed(seed, bitcoin.networks.regtest);
    const child = root.derivePath(`m/86'/1'/0'/${path}`); // e.g., path = "0/0"
  
    const xpub = root.derivePath("m/86'/1'/0'").neutered().toBase58();
    const msgBytes = new TextEncoder().encode(message);
    const signature = await schnorr.sign(msgBytes, child.privateKey!);
    return { xpub, signature: Buffer.from(signature).toString('base64') };
  }
  
//   // 🧪 Run everything
//   export const sign = async (req: Request, res: Response): Promise<void> => {
//     const method = 'POST';
//     const pathUrl = '/secure-action';
//     const path = '0/9';
//     const body = { shutdown: true };
  
//     const { message } = generateChallenge({
//       xpub: 'tpubD6NzVbkrYhZ4Yii1i6FbLHbhvx7KUveEQ8EHdDZh3iYCDW2nkMGQF9og1sBLGuLzwoaSmexBohqDk9PrC5ZFc8vakemevuSMFW1qKS2KyJ1', // will be replaced later
//       path,
//       method,
//       pathUrl,
//       body,
//     });
  
//     // Sign
//     const { xpub, signature } = await signMessage(message, path);
//     console.log('🧾 Message:\n', message);
//     console.log('✍️ Signature (base64):', signature);
//     console.log('🔑 xpub:', xpub);
  
//     // Now verify using xpub
//     const valid = verifyChallenge({ message, signature, xpub, path });
//     console.log(valid ? '✅ Success' : '❌ Failed');

//     res.json({ message, signature, xpub, valid });
//   }
export const signtest = async (req: Request, res: Response): Promise<void> => {
    const method = 'POST';
    const pathUrl = '/secure-action';
    const path = '0/9';
    const body = { shutdown: true };
  
    // derive xpub from mnemonic
    const seed = bip39.mnemonicToSeedSync('avocado later police relief client define upgrade speed obscure garment pattern trap');
    const root = bip32.fromSeed(seed, bitcoin.networks.regtest);
    const xpub = root.derivePath("m/86'/1'/0'").neutered().toBase58();
    console.log('🔑 Derived xpub:', root.derivePath("m/86'/1'/0'").neutered());
  
    // use correct xpub in challenge generation
    const { message } = generateChallenge({
      xpub,
      path,
      method,
      pathUrl,
      body,
    });
  
    // now sign
    const child = root.derivePath(`m/86'/1'/0'/${path}`);
    const msgBytes = new TextEncoder().encode(message);
    const signature = await schnorr.sign(msgBytes, child.privateKey!);
    const signatureBase64 = Buffer.from(signature).toString('base64');
  
    console.log('🧾 Message:\n', message);
    console.log('✍️ Signature (base64):', signatureBase64);
    console.log('🔑 xpub:', xpub);
  
    const valid = verifyChallenge({ message, signature: signatureBase64, xpub, path });
    console.log(valid ? '✅ Success' : '❌ Failed');
  
    res.json({ message, signature: signatureBase64, xpub, valid });
  };
  