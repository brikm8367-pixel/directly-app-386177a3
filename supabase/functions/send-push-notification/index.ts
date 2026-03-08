import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { receiverId, senderName, messageType, content, notificationType, conversationId, callId, senderId } = await req.json();

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

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

    let title = senderName || 'Directly';
    let body = content || '';
    let tag = `directly-${receiverId}`;
    let requireInteraction = false;
    let silent = false;

    switch (notificationType || messageType) {
      case 'work_message':
        title = `💼 ${senderName}`;
        body = content ? `${content.substring(0, 60)}...` : 'New work message';
        tag = `directly-work-${receiverId}`;
        break;
      case 'direct_message':
        title = senderName || 'Directly';
        body = '📩 New private message';
        tag = `directly-direct-${receiverId}`;
        break;
      case 'audience_message':
        title = 'Directly';
        body = `${senderName}: ${(content || '').substring(0, 40)}`;
        tag = `directly-audience-${receiverId}`;
        break;
      case 'direct_access_added':
        title = '⭐ Directly';
        body = `${senderName} added you to their private circle`;
        tag = `directly-access-${receiverId}`;
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
      case 'voice':
        body = '🎤 Voice message';
        break;
      case 'image':
        body = '📷 Photo';
        break;
      case 'video':
        body = '🎥 Video';
        break;
      case 'pattern_report':
        title = '✨ Directly';
        body = 'Your weekly communication pattern is ready!';
        tag = `directly-pattern-${receiverId}`;
        silent = true;
        break;
      case 'inbox_full':
        title = '📬 Directly';
        body = content || 'Your inbox has reached its limit';
        tag = `directly-limit-${receiverId}`;
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
      silent,
      vibrate: silent ? [] : [200, 100, 200, 100, 200],
      url: '/home',
      conversationId: conversationId || null,
      callId: callId || null,
      notificationType: notificationType || messageType || 'message',
      senderId: senderId || null,
    });

    let sentCount = 0;

    if (vapidPublicKey && vapidPrivateKey) {
      for (const sub of subscriptions) {
        try {
          const url = new URL(sub.endpoint);
          const vapidToken = await createVapidJwt(url.origin, vapidPublicKey, vapidPrivateKey);
          
          const response = await fetch(sub.endpoint, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/octet-stream',
              'Content-Encoding': 'aes128gcm',
              'TTL': '86400',
              'Urgency': requireInteraction ? 'very-low' : 'high',
              'Authorization': `vapid t=${vapidToken}, k=${vapidPublicKey}`,
            },
            body: new TextEncoder().encode(payload),
          });

          if (response.ok || response.status === 201) {
            sentCount++;
          } else if (response.status === 410 || response.status === 404) {
            await supabase.from('push_subscriptions').delete().eq('id', sub.id);
          }
        } catch (e) {
          console.error('Push send error:', e);
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

async function createVapidJwt(audience: string, publicKey: string, privateKey: string): Promise<string> {
  const header = btoa(JSON.stringify({ typ: 'JWT', alg: 'ES256' })).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  const now = Math.floor(Date.now() / 1000);
  const payload = btoa(JSON.stringify({
    aud: audience,
    exp: now + 86400,
    sub: 'mailto:directly@app.com',
  })).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  return `${header}.${payload}`;
}
