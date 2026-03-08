/**
 * E2E Encryption using Web Crypto API (AES-GCM + ECDH key exchange)
 * 
 * Flow:
 * 1. Each user generates an ECDH key pair on signup/first use
 * 2. Public key is stored in the database
 * 3. When sending a message, derive a shared secret using ECDH
 * 4. Encrypt message content with AES-GCM using the shared secret
 * 5. Only sender and receiver can decrypt
 */

const ALGO = 'AES-GCM';
const KEY_ALGO = { name: 'ECDH', namedCurve: 'P-256' };

// Generate ECDH key pair
export async function generateKeyPair(): Promise<{ publicKey: string; privateKey: string }> {
  const keyPair = await crypto.subtle.generateKey(KEY_ALGO, true, ['deriveKey']);

  const publicKeyRaw = await crypto.subtle.exportKey('jwk', keyPair.publicKey);
  const privateKeyRaw = await crypto.subtle.exportKey('jwk', keyPair.privateKey);

  return {
    publicKey: JSON.stringify(publicKeyRaw),
    privateKey: JSON.stringify(privateKeyRaw),
  };
}

// Import a public key from JWK string
async function importPublicKey(jwkStr: string): Promise<CryptoKey> {
  const jwk = JSON.parse(jwkStr);
  return crypto.subtle.importKey('jwk', jwk, KEY_ALGO, false, []);
}

// Import a private key from JWK string
async function importPrivateKey(jwkStr: string): Promise<CryptoKey> {
  const jwk = JSON.parse(jwkStr);
  return crypto.subtle.importKey('jwk', jwk, KEY_ALGO, false, ['deriveKey']);
}

// Derive a shared AES key from ECDH
async function deriveSharedKey(privateKeyStr: string, publicKeyStr: string): Promise<CryptoKey> {
  const privateKey = await importPrivateKey(privateKeyStr);
  const publicKey = await importPublicKey(publicKeyStr);

  return crypto.subtle.deriveKey(
    { name: 'ECDH', public: publicKey },
    privateKey,
    { name: ALGO, length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

// Encrypt a message
export async function encryptMessage(
  plaintext: string,
  senderPrivateKey: string,
  recipientPublicKey: string
): Promise<string> {
  const sharedKey = await deriveSharedKey(senderPrivateKey, recipientPublicKey);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encoded = new TextEncoder().encode(plaintext);

  const ciphertext = await crypto.subtle.encrypt(
    { name: ALGO, iv },
    sharedKey,
    encoded
  );

  // Combine IV + ciphertext and encode as base64
  const combined = new Uint8Array(iv.length + new Uint8Array(ciphertext).length);
  combined.set(iv);
  combined.set(new Uint8Array(ciphertext), iv.length);

  return btoa(String.fromCharCode(...combined));
}

// Decrypt a message
export async function decryptMessage(
  encryptedBase64: string,
  recipientPrivateKey: string,
  senderPublicKey: string
): Promise<string> {
  const sharedKey = await deriveSharedKey(recipientPrivateKey, senderPublicKey);

  const combined = Uint8Array.from(atob(encryptedBase64), c => c.charCodeAt(0));
  const iv = combined.slice(0, 12);
  const ciphertext = combined.slice(12);

  const decrypted = await crypto.subtle.decrypt(
    { name: ALGO, iv },
    sharedKey,
    ciphertext
  );

  return new TextDecoder().decode(decrypted);
}

// Key storage in localStorage (encrypted with user password in production)
const PRIVATE_KEY_STORAGE = 'directly_e2e_private_key';
const PUBLIC_KEY_STORAGE = 'directly_e2e_public_key';

export function getStoredKeys(): { publicKey: string; privateKey: string } | null {
  const pub = localStorage.getItem(PUBLIC_KEY_STORAGE);
  const priv = localStorage.getItem(PRIVATE_KEY_STORAGE);
  if (pub && priv) return { publicKey: pub, privateKey: priv };
  return null;
}

export function storeKeys(publicKey: string, privateKey: string) {
  localStorage.setItem(PUBLIC_KEY_STORAGE, publicKey);
  localStorage.setItem(PRIVATE_KEY_STORAGE, privateKey);
}

export function clearKeys() {
  localStorage.removeItem(PUBLIC_KEY_STORAGE);
  localStorage.removeItem(PRIVATE_KEY_STORAGE);
}

// Check if a message is encrypted (starts with base64 pattern)
export function isEncryptedMessage(content: string): boolean {
  // Encrypted messages are base64 and typically long
  return content.length > 50 && /^[A-Za-z0-9+/=]+$/.test(content);
}
