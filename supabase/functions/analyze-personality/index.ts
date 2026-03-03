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
    const isArabic = language === 'ar';

    // Simplified, psychologically-driven prompt that produces SHORT, ego-boosting output
    const prompt = `You are a world-class communication psychologist. Analyze this user's messaging data and create a SHORT, psychologically powerful personality card.

DATA:
- Received: ${stats.totalReceived} | Sent: ${stats.totalSent}
- Work: ${stats.workCount} (${stats.workRatio}%) | Audience: ${stats.audienceCount} (${stats.audienceRatio}%) | Private: ${stats.directCount} (${stats.directRatio}%)
- Response rate: ${stats.responseRate}%
- Peak hour: ${stats.mostActiveHour}
- Period: ${stats.period}

RESPOND IN ${isArabic ? 'ARABIC' : 'ENGLISH'}. Return ONLY raw JSON (no markdown):
{
  "type": "emoji + powerful 2-3 word title that makes the user feel special and understood",
  "description": "ONE sentence (max 15 words) — make the user feel seen, validated, and proud. Be specific to their data.",
  "traits": ["trait1", "trait2", "trait3"],
  "advice": "ONE short actionable sentence (max 12 words). Challenge or encourage based on real data.",
  "insight": "ONE surprising psychological observation (max 15 words). Make them think 'wow, that's true about me'."
}

PSYCHOLOGY RULES:
- This is an EGO TOOL — users will SHARE this on Instagram Stories
- The "type" title is their CROWN — make it memorable and unique (not generic like "Good Communicator")
- Keep EVERYTHING ultra-short — like a premium fortune card, not a report
- Be HONEST but frame truths positively (low activity = "selective", not "inactive")
- If data is minimal (< 5 messages), still give a compelling micro-analysis
- NEVER use more than 15 words per field
- traits should be 1-2 words each, punchy and shareable
- Make the user want to screenshot this immediately`;

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
      insight: 'Every journey starts with one message.'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
