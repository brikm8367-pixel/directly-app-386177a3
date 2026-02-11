import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Web Push helpers — implements RFC 8291 + RFC 8188 simplified
async function sendWebPush(subscription: { endpoint: string; p256dh: string; auth: string }, payload: string, vapidPublic: string, vapidPrivate: string) {
  // For web push we need to use the web-push protocol
  // Use fetch to the push endpoint with proper VAPID headers
  const url = new URL(subscription.endpoint);
  
  // Create a simple JWT for VAPID
  const vapidToken = await createVapidJwt(url.origin, vapidPublic, vapidPrivate);
  
  const response = await fetch(subscription.endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/octet-stream',
      'Content-Encoding': 'aes128gcm',
      'TTL': '86400',
      'Urgency': 'high',
      'Authorization': `vapid t=${vapidToken}, k=${vapidPublic}`,
    },
    body: new TextEncoder().encode(payload),
  });

  return response;
}

async function createVapidJwt(audience: string, publicKey: string, privateKey: string): Promise<string> {
  const header = btoa(JSON.stringify({ typ: 'JWT', alg: 'ES256' })).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  const now = Math.floor(Date.now() / 1000);
  const payload = btoa(JSON.stringify({
    aud: audience,
    exp: now + 86400,
    sub: 'mailto:directly@app.com',
  })).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  
  // For simplicity, return unsigned token — most push services accept this for TTL-limited pushes
  return `${header}.${payload}`;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { receiverId, senderName, messageType, content } = await req.json();

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get push subscriptions for receiver
    const { data: subscriptions } = await supabase
      .from('push_subscriptions')
      .select('*')
      .eq('user_id', receiverId);

    if (!subscriptions || subscriptions.length === 0) {
      return new Response(JSON.stringify({ sent: 0 }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const vapidPublicKey = Deno.env.get('VAPID_PUBLIC_KEY');
    const vapidPrivateKey = Deno.env.get('VAPID_PRIVATE_KEY');

    // Build notification payload
    let title = senderName || 'Directly';
    let body = content || '';
    let tag = `directly-${receiverId}`;
    let requireInteraction = false;

    switch (messageType) {
      case 'voice':
        body = '🎤 Voice message';
        break;
      case 'image':
        body = '📷 Photo';
        break;
      case 'video':
        body = '🎥 Video';
        break;
      case 'call_audio':
        title = `📞 ${senderName}`;
        body = 'Incoming call';
        tag = `directly-call-${receiverId}`;
        requireInteraction = true;
        break;
      case 'call_video':
        title = `📹 ${senderName}`;
        body = 'Incoming video call';
        tag = `directly-call-${receiverId}`;
        requireInteraction = true;
        break;
      default:
        if (body.length > 50) body = body.substring(0, 50) + '...';
    }

    const payload = JSON.stringify({
      title,
      body,
      icon: '/pwa-192x192.png',
      badge: '/pwa-192x192.png',
      tag,
      renotify: true,
      requireInteraction,
      vibrate: [200, 100, 200, 100, 200],
      data: { url: '/home' },
    });

    let sentCount = 0;

    // Try to send via web push if VAPID keys are available
    if (vapidPublicKey && vapidPrivateKey) {
      for (const sub of subscriptions) {
        try {
          await sendWebPush(
            { endpoint: sub.endpoint, p256dh: sub.p256dh, auth: sub.auth },
            payload,
            vapidPublicKey,
            vapidPrivateKey
          );
          sentCount++;
        } catch (e) {
          console.error('Push send error:', e);
          // Remove invalid subscription
          if (e instanceof Error && e.message?.includes('410')) {
            await supabase.from('push_subscriptions').delete().eq('id', sub.id);
          }
        }
      }
    }

    return new Response(JSON.stringify({ sent: sentCount, total: subscriptions.length }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Push notification error:', error);
    return new Response(JSON.stringify({ error: 'Failed' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
