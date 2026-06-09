# خطة التنفيذ — Sovereign: الأدوار + الدعوات + Deal Card + Golden Hour

أبني هذا بأولوية **Backend** (قاعدة بيانات + Edge Functions + RLS) ثم **Frontend**، بجودة عالية وأمان حقيقي. نُنفّذ على 4 مراحل متسلسلة.

```text
account_type (بسيط: celebrity | sender=user عادي)  ← ليس مصدر الدور الأساسي
manager_links (active)  ← المصدر الأساسي لحساب الدور ديناميكياً
الدور الفعّال = celebrity? → celebrity | active manager_link? → manager | غير ذلك → sender
```

## المرحلة 1 — نظام دعوة الوكيل (Invitation System) [الأولوية الآن]

### Backend
- جدول جديد `manager_invitations`:
  - `celebrity_id`, `code` (8–10 أحرف)، `token` (NanoID للرابط)، `status` (`pending`/`used`/`revoked`)، `expires_at` (= الآن + 15 دقيقة)، `used_by`، طوابع زمنية.
  - GRANT + RLS: المشهور يقرأ دعواته فقط؛ لا إدراج/تعديل مباشر من العميل (كل العمليات عبر Edge Functions بمفتاح الخدمة).
- دالة تحقق `validate_invitation(code/token)` (SECURITY DEFINER) للتحقق من الصلاحية وعدم الانتهاء.
- **Edge Function `create-manager-invite`**:
  1. يستقبل كلمة مرور المشهور ويتحقق منها فعلياً (إعادة مصادقة عبر `signInWithPassword` على عميل مؤقت).
  2. عند النجاح: يولّد `code` + `token` (NanoID)، ويُنشئ صفاً في `manager_invitations` بصلاحية 15 دقيقة.
  3. يُرجع الكود + الرابط القابل للمشاركة.
- **Edge Function `redeem-manager-invite`**:
  1. يستقبل الكود من الوكيل (مستخدم مسجّل دخول).
  2. يتحقق: موجود، `pending`، غير منتهٍ، والوكيل ليس المشهور نفسه.
  3. يُنشئ `manager_links` (`status='active'`) ويعلّم الدعوة `used` + `used_by`. كله بمفتاح الخدمة (الوكيل لا يكتب مباشرة في `manager_links`).

### Frontend
- في `SovereignRolePanel`: زر **"دعوة وكيل"** → نافذة تطلب كلمة المرور → تستدعي `create-manager-invite` → تعرض الكود + الرابط مع زر نسخ/مشاركة + **عدّاد تنازلي 15 دقيقة**.
- صفحة استقبال الرابط `/m/:token` (NanoID): إن لم يسجّل الدخول → توجيه للمصادقة ثم الرجوع؛ إن سُجِّل → شاشة إدخال الكود (input-otp) → استدعاء `redeem-manager-invite` → نجاح → توجيه للـ Dashboard.
- ذكاء الرابط (App/Store): صفحة وسيطة تكشف المنصة وتوجّه (نسخة الويب الآن؛ روابط Play/App Store كـ placeholders جاهزة للربط لاحقاً).
- تحديث `JoinManager.tsx` الحالي ليستخدم تدفق الكود الآمن بدل الإدراج المباشر.

## المرحلة 2 — طبقة الأدوار الديناميكية (Roles Layer)

- `useRole()` يبقى المصدر الواحد للدور (موجود ويعمل بالمنطق المطلوب: celebrity → manager → sender). نُبقي `account_type` بسيطاً ولا نعتمد عليه إلا لتمييز المشهور.
- **RLS على `messages`**: السماح للوكيل بقراءة (وإدارة) رسائل `category='work'` الخاصة بالمشهور المرتبط به عبر `active_manager_of()` — مع الإبقاء التام على عزل `direct` (Private) عن الوكيل.
- **`Dashboard.tsx`** يعرض الصناديق حسب الدور:
  - **Celebrity**: Private + Fans كاملان، Business **للقراءة فقط (overview)**.
  - **Manager**: **Business فقط** للمشهور/المشاهير المرتبط بهم؛ لا يرى Private إطلاقاً. عند تعدّد، مُحدِّد لاختيار المشهور.
  - **Sender**: لا صناديق داخلية — محادثاته فقط.
- وسم "No AI" يبقى على Private، والـ Classifier يبقى يعمل دون مساس.

## المرحلة 3 — Deal Card (العرض المنظّم)

### Backend
- جدول `deal_cards`:
  - `sender_id`, `celebrity_id`, `message_id` (ربط برسالة في صندوق work)، `deal_type` (أزرار جاهزة: رعاية/ظهور/حضور فعالية/تعاون…)، `budget_range`, `timeline`, `details`, `status` (`pending`/`accepted`/`declined`/`countered`)، طوابع زمنية.
  - GRANT + RLS: المرسِل يرى/ينشئ عروضه؛ المشهور **والوكيل النشِط** يريان ويغيّران حالة عروض ذلك المشهور (عبر `active_manager_of()`).
- Trigger يربط إنشاء Deal Card برسالة `work` (حتى يظهر داخل صندوق العمل ويستفيد من E2E الحالي).

### Frontend
- مكوّن `DealCardComposer`: نموذج بأزرار جاهزة (بدون نص حر مفتوح للحقول الأساسية) لإنشاء عرض منظّم.
- مكوّن `DealCardView`: عرض احترافي للبطاقة داخل Business Box مع أزرار **قبول / رفض / عرض مضاد** (متاحة للمشهور والوكيل).
- دمجه في `MessageComposer`/`InboxSection` لصندوق العمل.

## المرحلة 4 — Golden Hour (نافذة الـ60 دقيقة)

### Backend
- حقول على `deal_cards`: `golden_hour` (boolean)، `golden_hour_expires_at` (= الإنشاء + 60 دقيقة).
- منطق: عرض Golden Hour يُثبَّت أعلى صندوق العمل ويُميَّز حتى انتهاء المؤقّت، ثم يعود لترتيبه الطبيعي. (بدون بوابة دفع الآن — مفعّل منطقياً كأولوية ظهور؛ ربط الدفع مؤجَّل حسب قرار سابق.)
- دالة/فهرسة لترتيب الـwork: Golden Hour النشِط أولاً.

### Frontend
- شارة "Golden Hour" ذهبية + عدّاد 60 دقيقة على البطاقة، وتثبيتها أعلى Business Box.
- خيار تفعيل Golden Hour عند إنشاء Deal Card.

## ملاحظات تقنية وأمان
- كل كتابة حسّاسة (دعوات، ربط الوكيل) تمرّ عبر Edge Functions بمفتاح الخدمة + التحقق من JWT داخل الكود + التحقق من المدخلات بـ Zod.
- لا إدراج مباشر من العميل في `manager_links` ولا `manager_invitations`.
- صلاحية الدعوة 15 دقيقة تُفرض في قاعدة البيانات (تحقق `expires_at`) وليس في الواجهة فقط.
- NanoID للـ token عبر مكتبة `nanoid` (إضافة تبعية).
- الـ Classifier وE2E يبقيان كما هما دون مساس.

أبدأ بالمرحلة 1 (نظام الدعوات) فور موافقتك، ثم أُكمل تباعاً.
