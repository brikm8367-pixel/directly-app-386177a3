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

    // Full 25-factor + 8-section psychological analysis prompt
    const prompt = `You are the world's most brilliant communication psychologist, specializing in deep personality profiling through messaging behavior analysis.

Analyze this user's LAST WEEK messaging data using ALL 25 behavioral factors below to create a UNIQUE, POSITIVE personality profile that makes them feel deeply understood.

=== RAW DATA ===
- Received: ${stats.totalReceived} | Sent: ${stats.totalSent}
- Work: ${stats.workCount} (${stats.workRatio}%) | Relationships: ${stats.audienceCount} (${stats.audienceRatio}%) | Private: ${stats.directCount} (${stats.directRatio}%)
- Response rate: ${stats.responseRate}%
- Peak hour: ${stats.mostActiveHour}
- Conversations initiated: ${stats.initiatedCount || 'N/A'}
- Avg message length: ${stats.avgLength || 'N/A'}
- Unique contacts: ${stats.uniqueContacts || 'N/A'}
- Private circle size: ${stats.privateCircleSize || 'N/A'}
- Active days this week: ${stats.activeDays || 'N/A'}
- Busiest day: ${stats.busiestDay || 'N/A'}

=== 25 BEHAVIORAL FACTORS TO ANALYZE ===
FROM SENDING BEHAVIOR: Who initiates conversations, message length patterns, response speed, formal vs informal tone, organized vs spontaneous messaging.
FROM INBOX DISTRIBUTION: Ratio across Work/Relationships/Private, private circle size, which inbox opens first, activity gap between inboxes.
FROM TIME & RHYTHM: Peak activity hour, most active days, regular vs sporadic communication, weekly activity changes.
FROM RELATIONSHIP NATURE: Number of unique contacts, stable vs rotating relationships, who initiates more, local vs international connections.
FROM LANGUAGE & STYLE: Primary language, emoji usage, repeated words/phrases.
FROM LIMIT FEATURE: Inbox limit level set, speed of consuming limit, behavior when limit is full.
FROM CUMULATIVE ANALYSIS: How behavior changed since joining, how message distribution shifted over time.

=== OUTPUT FORMAT ===
RESPOND IN ${langName}. Return ONLY raw JSON (no markdown, no code blocks):

{
  "type": "emoji + unique 2-3 word identity title (e.g. 🎯 Strategic Architect). MUST be unique — never generic.",
  "description": "ONE powerful sentence (max 20 words) describing WHO this person is as a communicator. Third person. Make them say 'that's exactly me'.",
  "traits": ["trait1", "trait2", "trait3"],
  "stats": {
    "replyRate": "${stats.responseRate}%",
    "avgResponseTime": "estimate based on data (e.g. '< 5 min' or '2-4 hours')",
    "conversationsStarted": "${stats.initiatedCount || stats.totalSent}"
  },
  "comparison": "ONE sentence comparing them to other users (e.g. 'Responds faster than 78% of users'). Use a percentage between 60-95.",
  "analysis": "2-3 sentences of PERSONAL, INTIMATE analysis of their communication pattern. No technical terms. Make it feel like a psychologist who truly knows them.",
  "badge": "A prestigious achievement badge (e.g. 'Elite Responder — Top 15%' or 'Deep Connector — Top 8%'). Use Top X% format.",
  "advice": "ONE sentence telling others HOW to best communicate with this person.",
  "insight": "ONE sentence about their unique response pattern.",
  "nextReportDays": 7
}

=== CRITICAL PSYCHOLOGICAL RULES ===
1. ALWAYS frame POSITIVELY — every behavior has a strength interpretation:
   - Slow responder → "Selective with their time — every reply is intentional"
   - Short messages → "Decisive and direct — their words carry weight"
   - Small private circle → "Deep in relationships — chooses connections with care"
   - Low activity → "Quality over quantity — communicates with purpose"
2. The "type" is their CROWN TITLE — it must feel like a luxury identity card, not a quiz result
3. "comparison" must make them feel ABOVE AVERAGE — never below 60th percentile
4. "badge" is their achievement — make it feel earned and prestigious
5. "analysis" should feel like someone who's been watching them closely and UNDERSTANDS them
6. Every output must pass the TRIPLE TEST:
   - Will they say "that's exactly me"? (Understanding)
   - Will they feel this description is rare? (Exclusivity)  
   - Will they want to share it? (Shareability)
7. NEVER use "your/you" — always THIRD PERSON
8. NEVER mention AI, algorithms, or technical terms
9. If data is minimal (< 5 messages), create a compelling "early signal" analysis — never say "not enough data"
10. This is an EGO TOOL designed for Instagram Stories — make it IRRESISTIBLE to share`;

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
      description: 'A new communicator beginning their journey — full of potential.',
      traits: ['Fresh', 'Curious', 'Open'],
      stats: { replyRate: '—', avgResponseTime: '—', conversationsStarted: '0' },
      comparison: 'Just joined — the journey is about to begin.',
      analysis: 'Every great communicator started somewhere. The first messages reveal more than most people think.',
      badge: '🌱 New Explorer',
      advice: 'Send a few messages to build your profile.',
      insight: 'Every journey starts with one message.',
      nextReportDays: 7,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
