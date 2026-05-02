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
    const { stats, language } = await req.json();
    const langName = language === 'ar' ? 'ARABIC' : language === 'fr' ? 'FRENCH' : language === 'es' ? 'SPANISH' : 'ENGLISH';

    const prompt = `You are a world-class communication psychologist creating a UNIQUE identity card.

ANALYZE these 25 factors from the user's last week:

SENDING BEHAVIOR:
- Messages initiated: ${stats.totalSent} sent / ${stats.totalReceived} received
- Response rate: ${stats.responseRate}%
- Peak hour: ${stats.mostActiveHour}

INBOX DISTRIBUTION:
- Work: ${stats.workCount} (${stats.workRatio}%)
- Relationships: ${stats.audienceCount} (${stats.audienceRatio}%)
- Private: ${stats.directCount} (${stats.directRatio}%)

RESPOND IN ${langName}. Return ONLY raw JSON (no markdown):
{
  "pattern_name": "A UNIQUE 2-4 word name that has NEVER been used before. Not MBTI. Not generic. This person's crown title.",
  "emoji": "ONE emoji that represents this pattern",
  "type": "emoji + pattern_name combined (e.g. 🎯 Strategic Leader)",
  "traits": ["trait1", "trait2", "trait3"],
  "description": "ONE sentence (max 15 words) that makes them say 'That's exactly me.' THIRD PERSON.",
  "main_sentence": "ONE sentence that creates the feeling of RECOGNITION — they knew this about themselves but never had words for it.",
  "inner_sentence": "ONE sentence that makes them feel RARE and unique — their pattern is one-of-a-kind.",
  "advice": "ONE sentence telling others HOW to best communicate with this person.",
  "insight": "ONE sentence about their response pattern others should know.",
  "badge": "An achievement badge title (e.g. 'Elite Responder — Top 20%')",
  "percentile": "A realistic percentile comparison (e.g. 'Responds faster than 73% of users')"
}

THE TRIPLE CRITERIA — ALL THREE MUST BE MET:
1. RECOGNITION: Will they say "That's exactly me"?
2. RARITY: Will they feel this pattern is rare and special?
3. SHAREABILITY: Will they want to show this to people?

If all three aren't met → redo the analysis.

RULES:
- NO technical terms. NO MBTI. NO generic lists.
- Every human is unique — the description reflects THIS person specifically.
- Frame low activity positively ("selective" not "inactive")
- This is a VIP CARD — not a test result
- Write in THIRD PERSON for public visibility
- If data is minimal (< 5 messages), still give a compelling micro-analysis`;

    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-3-flash-preview',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.85,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited" }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      throw new Error('AI gateway error');
    }

    const data = await response.json();
    let content = data.choices?.[0]?.message?.content || '';
    content = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const analysis = JSON.parse(content);

    return new Response(JSON.stringify(analysis), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in analyze-personality:', error);
    return new Response(JSON.stringify({ 
      error: 'Analysis failed',
      type: '🌱 Just Starting',
      description: 'Not enough data yet for a meaningful analysis.',
      traits: ['New', 'Exploring', 'Open'],
      advice: 'Send a few messages to build your profile.',
      insight: 'Every journey starts with one message.',
      badge: 'Explorer — Just Started',
      percentile: 'Building your unique pattern',
      main_sentence: 'Your story is just beginning.',
      inner_sentence: 'The rarest patterns take time to reveal themselves.',
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
