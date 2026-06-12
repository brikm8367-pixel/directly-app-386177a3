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

  const displayName = profile.display_name || username;
  const ogTitle = `${displayName} | Sovereign`;
  const ogDescription = profile.bio || `${displayName} on Sovereign`;

  const ogImage = profile.avatar_url || 'https://ddirectly-com.lovable.app/pwa-512x512.png';
  const profileUrl = `https://ddirectly-com.lovable.app/@${username}`;


  // Return HTML with proper OG tags for crawlers
  const html = `<!DOCTYPE html>
<html lang="en" prefix="og: https://ogp.me/ns#">
<head>
  <meta charset="UTF-8" />
  <title>${ogTitle}</title>
  <meta name="description" content="${ogDescription}" />
  
  <!-- Open Graph -->
  <meta property="og:title" content="${ogTitle}" />
  <meta property="og:description" content="${ogDescription}" />
  <meta property="og:type" content="profile" />
  <meta property="og:url" content="${profileUrl}" />
  <meta property="og:image" content="${ogImage}" />
  <meta property="og:image:width" content="512" />
  <meta property="og:image:height" content="512" />
  <meta property="og:site_name" content="Sovereign" />
  <meta property="og:locale" content="en_US" />
  <meta property="og:locale:alternate" content="ar_SA" />
  <meta property="og:locale:alternate" content="fr_FR" />
  <meta property="og:locale:alternate" content="es_ES" />
  
  <!-- Twitter Card -->
  <meta name="twitter:card" content="summary" />
  <meta name="twitter:title" content="${ogTitle}" />
  <meta name="twitter:description" content="${ogDescription}" />
  <meta name="twitter:image" content="${ogImage}" />
  <meta name="twitter:site" content="@SovereignApp" />
  
  <!-- Profile structured data -->
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "Person",
    "name": "${displayName}",
    "url": "${profileUrl}",
    "image": "${ogImage}",
    ${profile.bio ? `"description": "${profile.bio.replace(/"/g, '\\"')}",` : ''}
    "sameAs": ["${profileUrl}"]
  }
  </script>
  
  <meta http-equiv="refresh" content="0;url=${profileUrl}" />
</head>
<body>
  <p>Redirecting to <a href="${profileUrl}">${displayName}'s profile</a>...</p>
</body>
</html>`;

  return new Response(html, {
    headers: { ...corsHeaders, 'Content-Type': 'text/html; charset=utf-8' },
  });
});
