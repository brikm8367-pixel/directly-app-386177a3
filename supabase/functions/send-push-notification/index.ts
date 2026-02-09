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

    if (!vapidPublicKey || !vapidPrivateKey) {
      console.log('VAPID keys not configured yet');
      return new Response(JSON.stringify({ sent: 0, reason: 'vapid_not_configured' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Build notification payload
    let title = senderName || 'Directly';
    let body = content || '';
    let icon = '/pwa-192x192.png';

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
        break;
      case 'call_video':
        title = `📹 ${senderName}`;
        body = 'Incoming video call';
        break;
      default:
        if (body.length > 50) body = body.substring(0, 50) + '...';
    }

    const payload = JSON.stringify({
      title,
      body,
      icon,
      badge: '/pwa-192x192.png',
      tag: `directly-${receiverId}`,
      renotify: true,
      requireInteraction: messageType?.startsWith('call_'),
      data: { url: '/home' },
    });

    return new Response(JSON.stringify({ sent: subscriptions.length, payload_ready: true }), {
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
