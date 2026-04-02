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
    const isFrench = language === 'fr';
    const isSpanish = language === 'es';

    const langName = isArabic ? 'ARABIC' : isFrench ? 'FRENCH' : isSpanish ? 'SPANISH' : 'ENGLISH';

    // Third-person prompt — the analysis describes the user to OTHERS
    const prompt = `You are a world-class communication psychologist. Analyze this user's LAST WEEK messaging data and create a SHORT, positive, third-person personality card that OTHER people will see on this user's public profile.

DATA (from last week):
- Received: ${stats.totalReceived} | Sent: ${stats.totalSent}
- Work: ${stats.workCount} (${stats.workRatio}%) | Audience: ${stats.audienceCount} (${stats.audienceRatio}%) | Private: ${stats.directCount} (${stats.directRatio}%)
- Response rate: ${stats.responseRate}%
- Peak hour: ${stats.mostActiveHour}

RESPOND IN ${langName}. Return ONLY raw JSON (no markdown):
{
  "type": "emoji + powerful 2-3 word title (e.g. 🎯 Strategic Leader)",
  "description": "ONE sentence (max 15 words) describing this person's communication style IN THIRD PERSON. e.g. 'They communicate with precision and strategic clarity.'",
  "traits": ["trait1", "trait2", "trait3"],
  "advice": "ONE sentence (max 15 words) telling others HOW to best communicate with this person. e.g. 'Be direct and get to the point quickly.'",
  "insight": "ONE sentence (max 15 words) about their response pattern that others should know. e.g. 'Responds fastest during morning hours.'"
}

CRITICAL RULES:
- Write EVERYTHING in THIRD PERSON — this is seen by OTHER people visiting their profile
- Keep it POSITIVE and flattering — this is their public identity card
- The "type" is their crown title — make it memorable and unique
- "advice" is guidance for people who want to talk to this person
- "insight" is about HOW this person responds (pattern)
- traits should be 1-2 words each, punchy
- Frame low activity positively ("selective" not "inactive")
- If data is minimal (< 5 messages), still give a compelling micro-analysis
- NEVER use first-person or second-person (no "your", "you", "أنت", "تواصلك")
- This is an EGO TOOL — users will share this on Instagram Stories`;

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
