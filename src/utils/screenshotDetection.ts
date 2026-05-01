/**
 * Screenshot Detection — Capacitor integration
 * 
 * Notifies the other party in a chat when a screenshot is captured.
 * Works only on native iOS/Android via Capacitor. No-op on web.
 *
 * To activate (founder action when building native):
 *   1. bun add @capacitor-community/privacy-screen
 *   2. npx cap sync
 *   3. The detector below will automatically register listeners.
 *
 * Why disabled by default in web: browsers cannot detect native OS screenshots.
 */

import { supabase } from '@/integrations/supabase/client';

export interface ScreenshotEvent {
  conversationId: string;
  takenBy: string; // user_id of the one who took the screenshot
  takenAt: string;
}

let isInitialized = false;
let activeConversationId: string | null = null;

export function setActiveConversation(conversationId: string | null) {
  activeConversationId = conversationId;
}

export async function initScreenshotDetection(userId: string): Promise<boolean> {
  if (isInitialized) return true;

  // Web: no-op (graceful)
  if (typeof window === 'undefined' || !('Capacitor' in window)) {
    return false;
  }

  try {
    // Dynamic import — only loaded on native builds. Won't break web.
    // @ts-ignore — optional plugin
    const { PrivacyScreen } = await import('@capacitor-community/privacy-screen').catch(() => ({ PrivacyScreen: null }));
    if (!PrivacyScreen) return false;

    PrivacyScreen.addListener('screenshotTaken', async () => {
      if (!activeConversationId) return;

      // Notify recipient via Supabase Realtime broadcast
      const channel = supabase.channel(`screenshot-${activeConversationId}`);
      await channel.send({
        type: 'broadcast',
        event: 'screenshot_taken',
        payload: { takenBy: userId, takenAt: new Date().toISOString() },
      });
    });

    isInitialized = true;
    return true;
  } catch (e) {
    console.warn('Screenshot detection unavailable on this platform');
    return false;
  }
}

export function listenForScreenshots(
  conversationId: string,
  onScreenshot: (event: ScreenshotEvent) => void
) {
  const channel = supabase
    .channel(`screenshot-${conversationId}`)
    .on('broadcast', { event: 'screenshot_taken' }, ({ payload }) => {
      onScreenshot({ ...payload, conversationId });
    })
    .subscribe();

  return () => { supabase.removeChannel(channel); };
}
