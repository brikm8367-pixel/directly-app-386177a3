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

    const prompt = `You are a communication psychologist analyzing a user's messaging patterns. Based on the following data, provide a unique, personalized personality analysis.

DATA:
- Total received messages: ${stats.totalReceived}
- Total sent messages: ${stats.totalSent}
- Work messages: ${stats.workCount} (${stats.workRatio}%)
- Audience messages: ${stats.audienceCount} (${stats.audienceRatio}%)
- Private messages: ${stats.directCount} (${stats.directRatio}%)
- Response rate: ${stats.responseRate}%
- Most active hour: ${stats.mostActiveHour}
- Period: ${stats.period}

RESPOND IN ${isArabic ? 'ARABIC' : 'ENGLISH'} with a JSON object (no markdown, just raw JSON):
{
  "type": "A creative emoji + title for their personality type (max 4 words)",
  "description": "A 2-sentence personalized description of their communication style based on the actual data. Be specific, not generic.",
  "traits": ["trait1", "trait2", "trait3", "trait4"],
  "advice": "One specific, actionable, non-generic tip based on their actual pattern. Reference their data."
}

IMPORTANT:
- Be creative and vary your responses
- Reference specific numbers from the data
- Never give the same generic analysis
- Make it feel personal and insightful
- If data is empty (0 messages), acknowledge that and give an encouraging welcome message`;

    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash-lite',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.8,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited" }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required" }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      throw new Error('AI gateway error');
    }

    const data = await response.json();
    let content = data.choices?.[0]?.message?.content || '';
    
    // Clean up markdown formatting if present
    content = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    
    const analysis = JSON.parse(content);

    return new Response(JSON.stringify(analysis), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in analyze-personality:', error);
    return new Response(JSON.stringify({ 
      error: 'Analysis failed',
      type: '🌟 Wise Balancer',
      description: 'Your communication pattern is still forming. Keep using the app to get personalized insights.',
      traits: ['Curious', 'Growing', 'Mindful', 'Balanced'],
      advice: 'Start by organizing your contacts into the three inboxes to get better insights.'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
