/**
 * E2E Key Manager — handles key generation, storage, and auto-initialization
 */
import { supabase } from '@/integrations/supabase/client';
import {
  generateKeyPair,
  getStoredKeys,
  storeKeys,
  encryptMessage,
  decryptMessage,
  isEncryptedMessage,
} from './encryption';

// Initialize E2E keys for the current user (called on login/signup)
export async function initE2EKeys(userId: string): Promise<void> {
  let keys = getStoredKeys();

  if (!keys) {
    // Check if user already has a public key in DB
    const { data: profile } = await supabase
      .from('profiles')
      .select('public_key')
      .eq('id', userId)
      .single();

    if (profile?.public_key) {
      // User has a key on another device — can't decrypt without private key
      // Generate new keys and update DB (new device scenario)
      keys = await generateKeyPair();
      storeKeys(keys.publicKey, keys.privateKey);
      await supabase.from('profiles').update({ public_key: keys.publicKey }).eq('id', userId);
    } else {
      // First time — generate and store
      keys = await generateKeyPair();
      storeKeys(keys.publicKey, keys.privateKey);
      await supabase.from('profiles').update({ public_key: keys.publicKey }).eq('id', userId);
    }
  } else {
    // Keys exist locally — ensure DB has the public key
    const { data: profile } = await supabase
      .from('profiles')
      .select('public_key')
      .eq('id', userId)
      .single();

    if (!profile?.public_key) {
      await supabase.from('profiles').update({ public_key: keys.publicKey }).eq('id', userId);
    }
  }
}

// Get recipient's public key
export async function getRecipientPublicKey(recipientId: string): Promise<string | null> {
  const { data } = await supabase
    .from('profiles')
    .select('public_key')
    .eq('id', recipientId)
    .single();
  return data?.public_key || null;
}

// Encrypt content before sending
export async function encryptForRecipient(content: string, recipientId: string): Promise<string> {
  const keys = getStoredKeys();
  if (!keys) return content; // Fallback: send unencrypted

  const recipientPubKey = await getRecipientPublicKey(recipientId);
  if (!recipientPubKey) return content; // Recipient doesn't have E2E yet

  try {
    return await encryptMessage(content, keys.privateKey, recipientPubKey);
  } catch {
    return content; // Fallback on error
  }
}

// Decrypt received content
export async function decryptFromSender(content: string, senderId: string): Promise<string> {
  if (!isEncryptedMessage(content)) return content; // Not encrypted

  const keys = getStoredKeys();
  if (!keys) return '🔒'; // Can't decrypt without keys

  const senderPubKey = await getRecipientPublicKey(senderId);
  if (!senderPubKey) return '🔒';

  try {
    return await decryptMessage(content, keys.privateKey, senderPubKey);
  } catch {
    return '🔒'; // Decryption failed
  }
}

export { isEncryptedMessage };
