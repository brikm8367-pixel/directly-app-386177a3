import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { subject, content, senderProfile } = await req.json();

    const prompt = `You are a message classifier for a professional communication app. Classify this message into ONE of these categories:

Categories:
- "work": Business, partnerships, projects, clients, professional teams, job offers, collaborations, sponsorships, brand deals, professional inquiries
- "audience": Fans, followers, potential customers, support requests, general public inquiries, feedback, questions about content/products
- "direct": Personal messages (only if sender is explicitly a close friend/family, otherwise default to audience)

Message Details:
Subject: ${subject || 'No subject'}
Content: ${content}
Sender: ${senderProfile?.display_name || 'Unknown'} (@${senderProfile?.username || 'unknown'})

IMPORTANT: 
- Default to "audience" if unsure
- "direct" should only be used for clearly personal/intimate messages
- "work" is for any business/professional context

Respond with ONLY one word: work, audience, or direct`;

    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
    
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'user', content: prompt }
        ],
        max_tokens: 10,
        temperature: 0.1,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI Gateway error:', errorText);
      // Default to audience if AI fails
      return new Response(JSON.stringify({ category: 'audience' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const data = await response.json();
    const classification = data.choices?.[0]?.message?.content?.toLowerCase().trim() || 'audience';
    
    // Validate the response
    const validCategories = ['work', 'audience', 'direct'];
    const category = validCategories.includes(classification) ? classification : 'audience';

    return new Response(JSON.stringify({ category }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in classify-message function:', error);
    // Default to audience on error
    return new Response(JSON.stringify({ category: 'audience' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
