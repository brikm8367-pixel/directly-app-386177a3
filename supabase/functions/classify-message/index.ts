import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { content } = await req.json();

    const prompt = `You are an intelligent message classifier for a premium communication app called "Directly". 
Your job is to analyze the MESSAGE CONTENT deeply and classify it into exactly one category.

Categories:
- "work": Business communication, professional inquiries, partnerships, projects, collaborations, sponsorships, job offers, client communication, brand deals, formal requests, professional networking
- "audience": Fan messages, follower communication, general public inquiries, support requests, feedback, product questions, casual greetings from unknown people, content-related messages
- "direct": Deeply personal messages that clearly indicate an existing close relationship (family, close friends, romantic partner). Messages with intimate tone, personal references, inside jokes, emotional sharing

Classification Rules:
1. Analyze the TONE, INTENT, and CONTEXT of the message — NOT just keywords
2. If a message tries to disguise its intent (e.g., casual tone but business request), classify by TRUE INTENT
3. Default to "audience" when uncertain — never default to "direct"
4. "direct" requires STRONG evidence of personal closeness
5. Professional language or formal tone = "work"
6. Casual greetings without personal context = "audience"
7. Messages mixing personal and business = classify by PRIMARY intent

Message to classify:
"${content}"

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
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 10,
        temperature: 0.1,
      }),
    });

    if (!response.ok) {
      console.error('AI Gateway error:', await response.text());
      return new Response(JSON.stringify({ category: 'audience' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const data = await response.json();
    const raw = data.choices?.[0]?.message?.content?.toLowerCase().trim() || 'audience';
    const validCategories = ['work', 'audience', 'direct'];
    const category = validCategories.includes(raw) ? raw : 'audience';

    return new Response(JSON.stringify({ category }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('classify-message error:', error);
    return new Response(JSON.stringify({ category: 'audience' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
