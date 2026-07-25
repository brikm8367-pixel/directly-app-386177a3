/**
 * E2E Key Manager — handles key generation, encrypted-at-rest storage,
 * per-device key registration, and message encrypt/decrypt with detailed status.
 */
import { supabase } from '@/integrations/supabase/client';
import {
  generateKeyPair,
  encryptMessage,
  decryptMessage,
  isEncryptedMessage,
  storeKeysSecure,
  getStoredKeysSecure,
  clearKeysSecure,
  migrateLegacyKeysIfPresent,
} from './encryption';
import { getOrCreateDeviceSecret, getOrCreateDeviceId } from './cryptoHelpers';

export type EncryptResult =
  | { success: true; payload: string }
  | { success: false; reason: 'no_local_keys' | 'recipient_no_e2e' | 'encryption_failed' };

export type DecryptResult =
  | { success: true; plaintext: string }
  | { success: false; reason: 'not_encrypted' | 'no_local_keys' | 'sender_no_key' | 'decryption_failed' };

// Initialize E2E keys on login. Encrypted at rest. Registers public key in device_keys
// (does NOT overwrite profiles.public_key — each device gets its own row).
export async function initE2EKeys(userId: string): Promise<void> {
  // 1. Migrate any legacy plaintext keys.
  await migrateLegacyKeysIfPresent();

  const passphrase = getOrCreateDeviceSecret();
  const deviceId = getOrCreateDeviceId();

  let keys = await getStoredKeysSecure(passphrase);

  if (!keys) {
    keys = await generateKeyPair();
    await storeKeysSecure(keys.publicKey, keys.privateKey, passphrase);
  }

  // Upsert this device's public key (one row per device, never overwrites others).
  try {
    await supabase
      .from('device_keys' as any)
      .upsert(
        {
          user_id: userId,
          device_id: deviceId,
          public_key: keys.publicKey,
          last_seen: new Date().toISOString(),
        },
        { onConflict: 'user_id,device_id' }
      );
  } catch (e) {
    console.warn('[E2E] device_keys upsert failed', e);
  }

  // Backwards compatibility: ensure profiles.public_key has *some* key so older
  // recipients (that read profiles.public_key) can still encrypt to us. Only set
  // if missing, never overwrite.
  try {
    const { data: profile } = await supabase
      .from('profiles')
      .select('public_key')
      .eq('id', userId)
      .maybeSingle();
    if (profile && !profile.public_key) {
      await supabase.from('profiles').update({ public_key: keys.publicKey }).eq('id', userId);
    }
  } catch (e) {
    console.warn('[E2E] profile public_key check failed', e);
  }
}

// Get recipient's most-recently-seen device public key (fallback to profile).
export async function getRecipientPublicKey(recipientId: string): Promise<string | null> {
  try {
    const { data } = await supabase
      .from('device_keys' as any)
      .select('public_key, last_seen')
      .eq('user_id', recipientId)
      .order('last_seen', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (data && (data as any).public_key) return (data as any).public_key;
  } catch {
    /* fall through */
  }
  const { data } = await supabase.from('profiles').select('public_key').eq('id', recipientId).single();
  return data?.public_key || null;
}

// Encrypt — returns explicit status. Caller must handle failure (no silent plaintext fallback).
export async function encryptForRecipient(content: string, recipientId: string): Promise<EncryptResult> {
  const keys = await getStoredKeysSecure();
  if (!keys) return { success: false, reason: 'no_local_keys' };

  const recipientPubKey = await getRecipientPublicKey(recipientId);
  if (!recipientPubKey) return { success: false, reason: 'recipient_no_e2e' };

  try {
    const payload = await encryptMessage(content, keys.privateKey, recipientPubKey);
    return { success: true, payload };
  } catch (err) {
    console.error('[E2E] encryption_failed', err);
    return { success: false, reason: 'encryption_failed' };
  }
}

export async function decryptFromSender(content: string, senderId: string): Promise<DecryptResult> {
  if (!isEncryptedMessage(content)) return { success: false, reason: 'not_encrypted' };

  const keys = await getStoredKeysSecure();
  if (!keys) return { success: false, reason: 'no_local_keys' };

  const senderPubKey = await getRecipientPublicKey(senderId);
  if (!senderPubKey) return { success: false, reason: 'sender_no_key' };

  try {
    const plaintext = await decryptMessage(content, keys.privateKey, senderPubKey);
    return { success: true, plaintext };
  } catch (err) {
    console.error('[E2E] decryption_failed', err);
    return { success: false, reason: 'decryption_failed' };
  }
}

export async function clearE2EKeysOnSignOut(): Promise<void> {
  await clearKeysSecure();
}

export { isEncryptedMessage };
