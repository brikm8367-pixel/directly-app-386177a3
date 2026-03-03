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
    const { content, senderHistory } = await req.json();

    // Enhanced cognitive AI classification prompt — TikTok-grade understanding
    const prompt = `You are the world's most advanced cognitive message classifier for "Directly", a premium communication app.
Your intelligence EXCEEDS TikTok's pre-acquisition algorithm in understanding human intent.

MISSION: Analyze the MESSAGE deeply — tone, semantics, cultural context, emotional undertones, hidden intent — and classify into ONE category.

Categories:
- "work": Professional communication of ANY kind: business proposals, partnerships, sponsorships, job offers, brand deals, client requests, professional networking, formal inquiries, money-related messages, service requests, freelance work, collaboration pitches, interview requests, consulting
- "audience": General public messages: fan messages, follower greetings, casual inquiries, content feedback, product questions, general support requests, casual compliments, "hi/hello" from strangers, subscription questions, event inquiries
- "direct": ONLY messages that clearly indicate a pre-existing deep personal bond — family talk, romantic messages, close friend references, inside jokes, emotional vulnerability, crisis/emergency from someone close

COGNITIVE RULES (think like a psychologist):
1. Read BETWEEN the lines — detect manipulation attempts (someone pretending to be a friend to bypass filters)
2. Professional language OR any monetary/business intent = ALWAYS "work"
3. Casual/generic greetings without personal context = ALWAYS "audience"
4. "direct" requires OVERWHELMING evidence of intimacy — names, shared memories, emotional depth
5. Mixed signals → classify by PRIMARY commercial or social intent
6. Cultural sensitivity: Arabic formal greetings that seem warm are often professional = "work"
7. Fan admiration ≠ personal relationship = "audience"
8. If uncertain, choose "audience" — NEVER default to "direct"
9. Sponsorship, collaboration, "let's work together" = "work"
10. "I love your content" or "you're amazing" from unknown = "audience"

${senderHistory ? `SENDER PATTERN (learning signal): Previous messages from this sender were classified as: ${senderHistory}. Use this as a weak signal, but ALWAYS prioritize current message content.` : ''}

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
        temperature: 0.05, // Even lower temp for more deterministic classification
      }),
    });

    if (!response.ok) {
      console.error('AI Gateway error:', response.status, await response.text());
      return new Response(JSON.stringify({ category: 'audience' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const data = await response.json();
    const raw = data.choices?.[0]?.message?.content?.toLowerCase().trim() || 'audience';
    const validCategories = ['work', 'audience', 'direct'];
    const category = validCategories.includes(raw) ? raw : 'audience';

    return new Response(JSON.stringify({ category, confidence: raw === category ? 'high' : 'low' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('classify-message error:', error);
    return new Response(JSON.stringify({ category: 'audience' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
