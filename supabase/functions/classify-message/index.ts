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
    const { content, senderHistory, lastMessage, timeDiffMinutes, hasMedia, mediaOnly } = await req.json();

    // Quick local heuristics — fastest path (zero AI latency for obvious cases)
    const text = (content || '').trim();
    const lower = text.toLowerCase();

    // Empty / emoji-only / very short greeting → audience (per document Special Case #1, #3)
    const emojiOnly = text.length > 0 && /^[\p{Emoji}\s\p{Extended_Pictographic}\u200d]+$/u.test(text);
    const tinyGreeting = /^(hi|hey|hello|hola|salut|bonjour|hola|هلا|مرحبا|اهلا|أهلا|سلام|هاي)[!.\s]*$/i.test(text);
    if (emojiOnly || tinyGreeting) {
      return new Response(JSON.stringify({ category: 'audience', confidence: 'high', reason: 'greeting/emoji' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Media without text after >1h gap → independent new context, default audience (Special Case #4/#11)
    if (mediaOnly && (timeDiffMinutes ?? 999) > 60) {
      return new Response(JSON.stringify({ category: 'audience', confidence: 'medium', reason: 'media-new-context' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Strong work signals — instant decision (sponsorship, contracts) → Special Case #10
    const workStrong = /(sponsor|sponsorship|partnership|تعاون تجاري|عرض تجاري|عقد|contract|invoice|ميزانية|budget|deliverable|deadline|تقرير|اجتماع|meeting|proposal)/i;
    if (workStrong.test(lower)) {
      return new Response(JSON.stringify({ category: 'work', confidence: 'high', reason: 'work-keyword' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 3-layer classification prompt — full document spec
    const prompt = `أنت نظام تصنيف رسائل لتطبيق Directly. صنّف الرسالة إلى "work" أو "audience" فقط.

السياق:
- آخر رسالة بين نفس الشخصين: ${lastMessage || 'لا توجد'}
- الوقت منذ آخر رسالة: ${timeDiffMinutes ?? 'غير معروف'} دقيقة
- يحتوي وسائط: ${hasMedia ? 'نعم' : 'لا'}
- الرسالة الحالية: "${text}"
${senderHistory ? `- تاريخ تصنيف هذا المرسل: ${senderHistory}` : ''}

## الطبقة 1 — الكلمات المفتاحية:
عمل: مشروع، عرض، تقرير، اجتماع، تعاون، ميزانية، عقد، موعد، خطة، صفقة، project, proposal, report, meeting, collaboration, budget, contract, schedule, plan, deal, sponsorship, partnership, deliverable, deadline, invoice
علاقات: كيف حالك، وين أنت، أحبك، مساء النور، كيفك، تعال، how are you, miss you, love you, family, friends

## الطبقة 2 — طبيعة الطلب:
طلب محدد قابل للتنفيذ → work
تعبير عن شعور أو بداية حوار → audience

## الطبقة 3 — عند الشك:
انظر لآخر رسالة. إذا work → work. إذا لم توجد سابقة → audience.

## الحالات الـ 11:
1. تحية قصيرة → audience
2. رسالة مبهمة (تمام/ok) → ينظر للسابقة → audience افتراضياً
3. إيموجي فقط → audience
4. محتوى مختلط (عمل + اجتماعي) → work (الأقوى يتحكم)
5. لغة غير رسمية + محتوى عمل → work (المحتوى يحكم)
6. تغيير سياق (عمل → "كيف عيلتك؟") → audience (الأخيرة تحكم)
7. تحول تدريجي → آخر 2-3 رسائل تحكم
8. لغات مختلطة → work (المحتوى لا اللغة)
9. متابع لمشهور → audience دائماً
10. تعاون/sponsorship → work دائماً
11. صورة/ملف بعد ساعة+ → رسالة مستقلة جديدة

## القاعدة الذهبية: عند الشك الكامل → audience دائماً.

أجب بكلمة واحدة فقط: work أو audience`;

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
        max_tokens: 8,
        temperature: 0.05,
      }),
    });

    if (!response.ok) {
      console.error('AI Gateway error:', response.status);
      return new Response(JSON.stringify({ category: 'audience', confidence: 'low', reason: 'fallback' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const data = await response.json();
    const raw = data.choices?.[0]?.message?.content?.toLowerCase().trim() || 'audience';
    const category = raw.includes('work') ? 'work' : 'audience';

    return new Response(JSON.stringify({ category, confidence: 'high' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('classify-message error:', error);
    return new Response(JSON.stringify({ category: 'audience', confidence: 'low', reason: 'error' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
