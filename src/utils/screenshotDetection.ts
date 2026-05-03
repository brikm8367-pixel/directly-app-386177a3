/**
 * Screenshot Detection — Capacitor native + PWA heuristics.
 * Notifies the other party via a system message in the conversation.
 */
import { supabase } from '@/integrations/supabase/client';

type Listener = () => void;
const listeners = new Set<Listener>();
let installed = false;

const isNative = (): boolean => {
  // @ts-ignore
  return !!(window as any).Capacitor?.isNativePlatform?.();
};

async function setupNative() {
  try {
    // @ts-ignore — only present in native build
    const mod = await import(/* @vite-ignore */ '@capacitor-community/privacy-screen').catch(() => null);
    if (mod?.PrivacyScreen?.enable) {
      await mod.PrivacyScreen.enable();
    }
    // @ts-ignore — screenshot plugin (optional)
    const detect = await import(/* @vite-ignore */ 'capacitor-plugin-screenshot').catch(() => null);
    if (detect?.Screenshot?.addListener) {
      detect.Screenshot.addListener('screenshotTaken', () => {
        listeners.forEach((l) => l());
      });
    }
  } catch {
    /* graceful degrade */
  }
}

function setupWeb() {
  // Heuristic: macOS/iOS Safari emits no event, but Android Chrome briefly hides via visibilitychange.
  // We treat sudden visibility flicker (<400ms hidden) as a possible screenshot signal.
  let hiddenAt = 0;
  const onVis = () => {
    if (document.visibilityState === 'hidden') {
      hiddenAt = Date.now();
    } else if (hiddenAt && Date.now() - hiddenAt < 400) {
      hiddenAt = 0;
      listeners.forEach((l) => l());
    } else {
      hiddenAt = 0;
    }
  };
  document.addEventListener('visibilitychange', onVis);
}

export function initScreenshotDetection() {
  if (installed) return;
  installed = true;
  if (isNative()) setupNative();
  else setupWeb();
}

export function onScreenshot(cb: Listener): () => void {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

/**
 * Notify the other party that a screenshot was taken in this conversation.
 * Sends a low-priority system message so the receiver sees a clear alert.
 */
export async function notifyScreenshot(opts: {
  senderId: string;
  receiverId: string;
  category: 'work' | 'audience' | 'direct';
}) {
  try {
    await supabase.from('messages').insert({
      sender_id: opts.senderId,
      receiver_id: opts.receiverId,
      category: opts.category,
      content: '📸 ' + 'تم التقاط لقطة شاشة لهذه المحادثة',
      is_important: true,
    });
  } catch {
    /* swallow */
  }
}
