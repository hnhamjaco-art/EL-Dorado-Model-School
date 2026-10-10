/**
 * WebCrypto AES-256-GCM encryption, SHA-256 integrity hashing, and 2FA OTP utilities.
 */

const ENCRYPTION_SALT = 'el-dorado-model-school-2009-savar-dhaka';

async function deriveKey(secretPassphrase: string): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const keyMaterial = await window.crypto.subtle.importKey(
    'raw',
    enc.encode(secretPassphrase.padEnd(32, '0').slice(0, 32)),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );

  return window.crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: enc.encode(ENCRYPTION_SALT),
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

export async function encryptDataAES256(plainText: string, passphrase: string): Promise<string> {
  const key = await deriveKey(passphrase);
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  const encoded = new TextEncoder().encode(plainText);
  const cipherBuffer = await window.crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    encoded
  );

  const combined = new Uint8Array(iv.length + cipherBuffer.byteLength);
  combined.set(iv, 0);
  combined.set(new Uint8Array(cipherBuffer), iv.length);

  let binary = '';
  for (let i = 0; i < combined.byteLength; i++) {
    binary += String.fromCharCode(combined[i]);
  }
  return btoa(binary);
}

export async function decryptDataAES256(cipherBase64: string, passphrase: string): Promise<string> {
  const binary = atob(cipherBase64);
  const combined = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    combined[i] = binary.charCodeAt(i);
  }

  const iv = combined.slice(0, 12);
  const cipherBytes = combined.slice(12);
  const key = await deriveKey(passphrase);

  const decryptedBuffer = await window.crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    key,
    cipherBytes
  );
  return new TextDecoder().decode(decryptedBuffer);
}

export async function computeSHA256Checksum(payload: string): Promise<string> {
  const encoded = new TextEncoder().encode(payload);
  const hashBuffer = await window.crypto.subtle.digest('SHA-256', encoded);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

export function generateTimeBasedOTP(secretSeed = 'ELDORADO2009'): string {
  const timeWindow = Math.floor(Date.now() / 30000);
  let hash = 2166136261;
  const input = `${secretSeed}-${timeWindow}`;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  const code = Math.abs(hash) % 1000000;
  return code.toString().padStart(6, '0');
}
