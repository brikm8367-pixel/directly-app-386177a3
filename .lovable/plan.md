## الهدف
بناء **طبقة الأدوار** (Celebrity / Manager / Sender·Fan) وربطها بـ**الصناديق الثلاثة** (Business / Private / Fans) كأساس يبني عليه كل ما بعده (Deal Card, Golden Hour, Kill Switch, Activity Log, Pilot, Scout). هذه المرحلة لا تبني Deal Card ولا Golden Hour بعد — فقط الأساس الصلب.

## الوضع الحالي (المُكتشف)
- `message_category` enum = `work / audience / direct`. سنعتمد التطابق التالي بدون كسر خط الرسائل: **Business = work**، **Fans = audience**، **Private = direct**.
- `app_role` enum = `admin / moderator / user` (يبقى للإدارة فقط، لا يُستخدم لأدوار Sovereign).
- جدول `direct_access` موجود ويصلح ليكون **Whitelist للـ Private Box** (المالك يسمح لأشخاص محددين).
- لا يوجد أي مفهوم Celebrity/Manager/Sender في قاعدة البيانات حالياً.

## ما سنبنيه

### 1. قاعدة البيانات (Migration)
- enum جديد `account_type` بقيم: `celebrity`, `sender` (الافتراضي `sender` للجميع — المعجب والشركة كلاهما sender في الأساس).
- عمود `account_type` على `profiles` (default `'sender'`, NOT NULL).
- جدول `manager_links` لربط الوكيل بالمشهور:
  - `celebrity_id`, `manager_id`, `status` (`active` / `revoked`), `created_at`, `updated_at`.
  - يمثّل صلاحية الوكيل لإدارة Business Box لمشهور محدد، وهو نقطة عمل **Kill Switch** لاحقاً (تحويل الحالة إلى `revoked`).
- دوال SECURITY DEFINER (لتفادي الـ recursion في RLS):
  - `is_celebrity(_uid)` — هل الحساب مشهور.
  - `active_manager_of(_manager, _celebrity)` — هل الوكيل مرتبط فعلياً بالمشهور وبحالة `active`.
  - `my_managed_celebrity(_uid)` — يرجع id المشهور الذي يديره هذا الوكيل (إن وُجد).
- GRANT + RLS لكل جدول جديد (authenticated + service_role).
- سياسات وصول الـ Business Box للوكيل: السماح للوكيل بقراءة رسائل `category='work'` الخاصة بالمشهور المرتبط به طالما الرابط `active`.

### 2. طبقة الأدوار في الواجهة
- `useRole()` hook: يجلب `account_type` + هل هو وكيل لمشهور (عبر `manager_links`) ويُرجع الدور الفعّال: `celebrity | manager | sender`.
- إعادة تسمية/سكين الصناديق في `InboxSection.tsx`:
  - **Business** (أيقونة Briefcase، ذهبي/أزرق) = `work`
  - **Private** (Lock، ذهبي) = `direct`
  - **Fans** (Users، بنفسجي) = `audience`
- `Dashboard.tsx` يعرض الصناديق حسب الدور:
  - **Celebrity**: Private + Fans كاملان، و Business **للقراءة فقط** (overview).
  - **Manager**: **Business فقط** للمشهور المرتبط به (إدارة كاملة)، ولا يرى Private إطلاقاً.
  - **Sender / Fan**: لا صناديق داخلية — يتواصل عبر الرابط العام؛ تظهر له محادثاته فقط.

### 3. اختيار الدور والربط
- في `OnboardingFlow` أو إعداد سريع: اختيار نوع الحساب (**مشهور** أو **حساب عادي/شركة**).
- ربط الوكيل: المشهور يولّد رابط دعوة وكيل؛ عند فتحه يُنشأ صف في `manager_links` بحالة `active`. (واجهة الدعوة المبسطة ضمن هذه المرحلة؛ Kill Switch UI يأتي في المرحلة التالية لكن البنية جاهزة.)
- اعتماد `direct_access` كـ Whitelist للـ Private Box (موجود مسبقاً، نوثّق الاستخدام فقط).

## خارج نطاق هذه المرحلة (المراحل التالية)
Deal Card، Golden Hour، Kill Switch UI، Activity Log، Pilot، Scout، NanoID، الجروبات — كلها تُبنى فوق هذا الأساس لاحقاً.

## ملاحظات تقنية
```text
account_type (profiles): celebrity | sender
manager_links: celebrity_id ── active/revoked ── manager_id   → يحكم وصول Business + Kill Switch
الصناديق:  Business=work · Private=direct · Fans=audience
الرؤية:    Celebrity → Private+Fans+Business(قراءة)
           Manager   → Business فقط (لمشهوره)
           Sender    → بدون صناديق داخلية
Whitelist للـ Private = جدول direct_access الحالي
```
الـ Classifier يبقى يعمل كما هو ولا يُمسّ في هذه المرحلة.