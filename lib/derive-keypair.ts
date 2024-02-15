import { Keypair } from '@solana/web3.js';
import { loadCliWallet } from "./onnyx-advertise-client";
import crypto from 'crypto';

// this will not be the production salt phrase, but can be used for testing
const SALT = "MyNameIsMatt";

export default function deriveKeypair(userPublicKey) {
    const onnyxKp = loadCliWallet('../tests/test-keys.onnyx.json');
    const combined = Buffer.concat([onnyxKp.secretKey, Buffer.from(userPublicKey), Buffer.from(SALT)]);
    const hash = crypto.createHash('sha256').update(combined).digest();
    const derivedSeed = hash.slice(0, 32);
    const derivedKeypair = Keypair.fromSeed(derivedSeed);
    return derivedKeypair;
}