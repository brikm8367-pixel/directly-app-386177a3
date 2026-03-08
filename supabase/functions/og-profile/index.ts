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

  const url = new URL(req.url);
  const username = url.searchParams.get('username')?.replace(/^@/, '');

  if (!username) {
    return new Response(JSON.stringify({ error: 'Missing username' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  // Fetch profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('id, username, display_name, avatar_url, bio, is_public')
    .eq('username', username)
    .single();

  if (!profile || !profile.is_public) {
    return new Response(JSON.stringify({ error: 'Not found' }), {
      status: 404,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // Fetch latest analysis
  let personalityType = '';
  let description = '';
  let traits: string[] = [];

  const { data: analysis } = await supabase
    .from('weekly_analysis')
    .select('analysis')
    .eq('user_id', profile.id)
    .order('week_start', { ascending: false })
    .limit(1);

  if (analysis?.[0]?.analysis) {
    const a = analysis[0].analysis as any;
    personalityType = a.type || a.personalityType || '';
    description = a.description || '';
    traits = a.traits || [];
  }

  const displayName = profile.display_name || username;
  const ogTitle = personalityType
    ? `${displayName} — "${personalityType}" | Directly`
    : `${displayName} | Directly`;
  const ogDescription = description
    || (traits.length > 0 ? traits.join(' · ') : `${displayName}'s communication profile on Directly`);

  // Return HTML with proper OG tags for crawlers
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>${ogTitle}</title>
  <meta name="description" content="${ogDescription}" />
  <meta property="og:title" content="${ogTitle}" />
  <meta property="og:description" content="${ogDescription}" />
  <meta property="og:type" content="profile" />
  <meta property="og:url" content="https://ddirectly-com.lovable.app/@${username}" />
  <meta property="og:image" content="${profile.avatar_url || 'https://ddirectly-com.lovable.app/pwa-512x512.png'}" />
  <meta property="og:image:width" content="512" />
  <meta property="og:image:height" content="512" />
  <meta name="twitter:card" content="summary" />
  <meta name="twitter:title" content="${ogTitle}" />
  <meta name="twitter:description" content="${ogDescription}" />
  <meta name="twitter:image" content="${profile.avatar_url || 'https://ddirectly-com.lovable.app/pwa-512x512.png'}" />
  <meta http-equiv="refresh" content="0;url=https://ddirectly-com.lovable.app/@${username}" />
</head>
<body>
  <p>Redirecting to <a href="https://ddirectly-com.lovable.app/@${username}">${displayName}'s profile</a>...</p>
</body>
</html>`;

  return new Response(html, {
    headers: { ...corsHeaders, 'Content-Type': 'text/html; charset=utf-8' },
  });
});
