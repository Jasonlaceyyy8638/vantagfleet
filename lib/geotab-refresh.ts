/**
 * Encrypt/decrypt Geotab password for background session refresh.
 * Uses GEOTAB_REFRESH_SECRET (min 32 chars for AES-256) or falls back to CRON_SECRET.
 * Only used server-side; never expose decrypted password to client.
 */

import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from 'crypto';

const ALG = 'aes-256-gcm';
const IV_LEN = 16;
const SALT_LEN = 32;
const TAG_LEN = 16;
const KEY_LEN = 32;

function getSecret(): string | null {
  return (
    process.env.GEOTAB_REFRESH_SECRET?.trim() ||
    process.env.CRON_SECRET?.trim() ||
    null
  );
}

function deriveKey(secret: string, salt: Buffer): Buffer {
  return scryptSync(secret, salt, KEY_LEN);
}

export function encryptGeotabPassword(password: string): string | null {
  const secret = getSecret();
  if (!secret || !password) return null;
  try {
    const salt = randomBytes(SALT_LEN);
    const iv = randomBytes(IV_LEN);
    const key = deriveKey(secret, salt);
    const cipher = createCipheriv(ALG, key, iv);
    const enc = Buffer.concat([
      cipher.update(password, 'utf8'),
      cipher.final(),
    ]);
    const tag = cipher.getAuthTag();
    return Buffer.concat([salt, iv, tag, enc]).toString('base64');
  } catch {
    return null;
  }
}

export function decryptGeotabPassword(encrypted: string): string | null {
  const secret = getSecret();
  if (!secret || !encrypted) return null;
  try {
    const buf = Buffer.from(encrypted, 'base64');
    if (buf.length < SALT_LEN + IV_LEN + TAG_LEN + 1) return null;
    const salt = buf.subarray(0, SALT_LEN);
    const iv = buf.subarray(SALT_LEN, SALT_LEN + IV_LEN);
    const tag = buf.subarray(SALT_LEN + IV_LEN, SALT_LEN + IV_LEN + TAG_LEN);
    const enc = buf.subarray(SALT_LEN + IV_LEN + TAG_LEN);
    const key = deriveKey(secret, salt);
    const decipher = createDecipheriv(ALG, key, iv);
    decipher.setAuthTag(tag);
    return decipher.update(enc) + decipher.final('utf8');
  } catch {
    return null;
  }
}

export function canStoreGeotabPassword(): boolean {
  return !!getSecret();
}
