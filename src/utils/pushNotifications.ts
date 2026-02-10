import { supabase } from '@/integrations/supabase/client';

export async function registerPushNotifications() {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;

  try {
    // Register the push service worker
    const registration = await navigator.serviceWorker.register('/sw-push.js', { scope: '/' });
    await navigator.serviceWorker.ready;

    // Request notification permission
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') return;

    // Check if VAPID key is available
    const vapidKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;
    if (!vapidKey) {
      console.log('VAPID public key not configured');
      return;
    }

    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidKey),
    });

    // Save subscription to database
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) return;

    const subJson = subscription.toJSON();
    await supabase.from('push_subscriptions').upsert({
      user_id: auth.user.id,
      endpoint: subJson.endpoint!,
      p256dh: subJson.keys!.p256dh,
      auth: subJson.keys!.auth,
    }, { onConflict: 'user_id,endpoint' as any });
  } catch (error) {
    console.error('Push registration error:', error);
  }
}

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map(c => c.charCodeAt(0)));
}

/** Show in-app notification with sound when a message arrives */
export function showInAppNotification(title: string, body: string) {
  // Browser notification (works even when tab is not focused)
  if (Notification.permission === 'granted') {
    const n = new Notification(title, {
      body,
      icon: '/pwa-192x192.png',
      tag: 'directly-msg',
    });
    // Auto-close after 5s
    setTimeout(() => n.close(), 5000);
  }
}
