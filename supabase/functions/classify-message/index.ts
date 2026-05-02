import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

// Simple keyword-based fast paths to skip AI when confidence is high (saves latency & cost)
const WORK_KEYWORDS = /\b(project|proposal|report|meeting|collab|budget|contract|schedule|plan|deal|sponsorship|partnership|invoice|deadline|مشروع|عرض|تقرير|اجتماع|تعاون|ميزانية|عقد|موعد|خطة|صفقة|رعاية|شراكة|فاتورة)\b/i;
const RELATIONSHIP_KEYWORDS = /^(hi|hello|hey|hola|salut|مرحبا|هلا|اهلا|هاي|كيفك|كيف حالك|مساء الخير|صباح الخير|how are you|miss you|love you)/i;
const TOXIC_PATTERNS = /\b(idiot|stupid|hate you|kill yourself|kys|moron|retard|تافه|غبي|احمق|اكرهك|انتحر|قذر)\b/i;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();

  try {
    const { content, senderHistory, lastMessage, timeDiffMinutes, senderId, receiverId } = await req.json();

    // ============ LAYER 0: Behavioral Spam Detection ============
    // إذا نفس المرسل أرسل نفس المحتوى لعدة أشخاص في آخر 5 دقائق → spam
    let isSpam = false;
    let isToxic = false;
    let matchesFilter: string | null = null;

    if (senderId && content) {
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
      const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
      const adminClient = createClient(supabaseUrl, serviceKey);

      // فحص spam: نفس المحتوى المنسوخ
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
      const { count: duplicateCount } = await adminClient
        .from('messages')
        .select('id', { count: 'exact', head: true })
        .eq('sender_id', senderId)
        .gte('created_at', fiveMinutesAgo);

      // إذا أرسل أكثر من 8 رسائل في 5 دقائق نتحقق من التكرار
      if ((duplicateCount ?? 0) > 8) {
        isSpam = true;
      }

      // فحص فلاتر المستقبل
      if (receiverId) {
        const { data: filters } = await adminClient
          .from('recipient_filters')
          .select('filter_type')
          .eq('user_id', receiverId)
          .eq('is_active', true);

        if (filters && filters.length > 0) {
          const lcContent = content.toLowerCase();
          const filterMap: Record<string, RegExp> = {
            marketing: /\b(offer|discount|promo|deal|buy now|free|عرض|خصم|اشتري|مجاني|تخفيض)\b/i,
            real_estate: /\b(apartment|villa|property|rent|sale|شقة|فيلا|عقار|إيجار|بيع)\b/i,
            crypto: /\b(crypto|bitcoin|nft|airdrop|wallet|عملة رقمية|بيتكوين)\b/i,
            mlm: /\b(network marketing|mlm|join my team|تسويق شبكي|انضم لفريقي)\b/i,
          };
          for (const f of filters) {
            const re = filterMap[f.filter_type];
            if (re && re.test(lcContent)) {
              matchesFilter = f.filter_type;
              break;
            }
          }
        }
      }

      // فحص toxicity سريع
      if (TOXIC_PATTERNS.test(content)) {
        isToxic = true;
      }

      // إذا حُجبت — سجّل ولا ترسل للمستقبل
      if (isSpam || isToxic || matchesFilter) {
        await adminClient.from('blocked_content_log').insert({
          sender_id: senderId,
          receiver_id: receiverId,
          reason: isSpam ? 'spam' : isToxic ? 'toxicity' : `filter:${matchesFilter}`,
          content_preview: content.substring(0, 100),
        });

        return new Response(JSON.stringify({
          category: 'audience',
          blocked: true,
          reason: isSpam ? 'spam' : isToxic ? 'toxicity' : 'filter',
          latency_ms: Date.now() - startTime,
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    // ============ LAYER 1: Fast keyword path (no AI call → <50ms) ============
    if (RELATIONSHIP_KEYWORDS.test(content.trim())) {
      return new Response(JSON.stringify({
        category: 'audience', confidence: 'high', source: 'fast-path', latency_ms: Date.now() - startTime,
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // ============ LAYER 2: AI classification ============
    const prompt = `أنت نظام تصنيف رسائل لتطبيق Directly. صنّف إلى "work" أو "audience" فقط.

السياق:
- آخر رسالة: ${lastMessage || 'لا توجد'}
- الوقت منذ آخرها: ${timeDiffMinutes ?? 'غير معروف'} دقيقة
- الرسالة: "${content}"
${senderHistory ? `- تاريخ تصنيف المرسل: ${senderHistory}` : ''}

## الطبقة 1 — كلمات مفتاحية:
عمل: مشروع، عرض، تقرير، اجتماع، تعاون، ميزانية، عقد، موعد، خطة، صفقة، project, proposal, report, meeting, sponsorship, partnership
علاقات: كيف حالك، أحبك، مساء النور، how are you, miss you

## الطبقة 2 — طبيعة الطلب:
طلب محدد قابل للتنفيذ → work
تعبير شعور أو بداية حوار → audience

## الطبقة 3 — عند الشك:
انظر آخر رسالة → نفس التصنيف. لا توجد سابقة → audience.

## 11 حالة خاصة:
1. تحية قصيرة → audience
2. رسالة مبهمة → ينظر للسابقة → audience
3. إيموجي فقط → audience
4. مختلط ("كيف حالك؟ أرسل التقرير") → work — الأقوى يتحكم
5. غير رسمي + عمل → work — المحتوى يتحكم
6. تغيير سياق (عمل→علاقات) → audience — الأخيرة تتحكم
7. تحول تدريجي → آخر 2-3 تحكم
8. لغات مختلطة → work — المحتوى لا اللغة
9. متابع لمشهور → audience
10. تعاون/sponsorship → work دائماً
11. ملف/صورة بعد ساعة+ → مستقلة

## القاعدة الذهبية: عند الشك الكامل → audience.

أجب بكلمة واحدة فقط: work أو audience`;

    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-3.1-flash-image-preview', // fast lite model — fallback handled below
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 10,
        temperature: 0.05,
      }),
    });

    // Fallback to flash-lite if preview model unavailable
    let raw = 'audience';
    if (response.ok) {
      const data = await response.json();
      raw = data.choices?.[0]?.message?.content?.toLowerCase().trim() || 'audience';
    } else {
      // Fallback to known good fast model
      const fb = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${lovableApiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash-lite',
          messages: [{ role: 'user', content: prompt }],
          max_tokens: 10,
          temperature: 0.05,
        }),
      });
      if (fb.ok) {
        const fbData = await fb.json();
        raw = fbData.choices?.[0]?.message?.content?.toLowerCase().trim() || 'audience';
      } else if (fb.status === 429) {
        return new Response(JSON.stringify({ category: 'audience', error: 'rate_limited' }), {
          status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    // Quick keyword override boost for work signal
    if (raw !== 'work' && WORK_KEYWORDS.test(content)) {
      raw = 'work';
    }

    const validCategories = ['work', 'audience'];
    const category = validCategories.includes(raw) ? raw : 'audience';

    return new Response(JSON.stringify({
      category,
      confidence: raw === category ? 'high' : 'low',
      latency_ms: Date.now() - startTime,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('classify-message error:', error);
    return new Response(JSON.stringify({ category: 'audience', error: 'failed' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
