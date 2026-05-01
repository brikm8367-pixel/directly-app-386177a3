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
    const { content, senderHistory, lastMessage, timeDiffMinutes } = await req.json();

    // 3-layer classification prompt with 11 special cases
    const prompt = `أنت نظام تصنيف رسائل لتطبيق Directly.
مهمتك: صنّف الرسالة التالية إلى "work" أو "audience" فقط.

السياق:
- المرسل: مشترك
- آخر رسالة بين نفس الشخصين: ${lastMessage || 'لا توجد'}
- الوقت منذ آخر رسالة: ${timeDiffMinutes ?? 'غير معروف'} دقيقة
- الرسالة الحالية: "${content}"
${senderHistory ? `- تاريخ تصنيف هذا المرسل: ${senderHistory}` : ''}

## الطبقة الأولى — الكلمات المفتاحية:
عمل: مشروع، عرض، تقرير، اجتماع، تعاون، ميزانية، عقد، موعد، خطة، صفقة، project, proposal, report, meeting, collaboration, budget, contract, schedule, plan, deal, sponsorship, partnership
علاقات: كيف حالك، وين أنت، أحبك، مساء النور، كيفك، تعال، how are you, miss you, love you

## الطبقة الثانية — طبيعة الطلب:
طلب محدد وقابل للتنفيذ → work
تعبير عن شعور أو بداية حوار → audience

## الطبقة الثالثة — عند الشك:
انظر لآخر رسالة بين نفس الشخصين.
إذا كانت work → work. إذا لم توجد سابقة → audience.

## الحالات الخاصة الـ 11:
1. تحية قصيرة ("هلا"/"مرحبا"/"هي"/"hi") → audience دائماً
2. رسالة مبهمة ("تمام"/"ماشي"/"ok") → ينظر للسابقة → audience
3. إيموجي فقط → audience دائماً
4. محتوى مختلط ("كيف حالك؟ أرسل التقرير") → work — الأقوى يتحكم
5. لغة غير رسمية + محتوى عمل ("يا عمي وين التقرير؟ 😂") → work — المحتوى يتحكم لا الأسلوب
6. تغيير السياق (محادثة عمل → "كيف عيلتك؟") → audience — الأخيرة تتحكم
7. تحول تدريجي (عمل → علاقات تدريجياً) → آخر 2-3 رسائل تحكم
8. لغات مختلطة ("يا man وين التقرير؟") → work — المحتوى لا اللغة
9. متابع لمشهور ("أحب محتواك") → audience دائماً
10. تعاون/sponsorship ("عندنا عرض تجاري") → work دائماً
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
        max_tokens: 10,
        temperature: 0.05,
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
