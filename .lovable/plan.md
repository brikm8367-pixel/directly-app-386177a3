تم التحقق من حالة المشروع فعلياً. هذه الخطة تعالج الفجوات التي لم تُغلق بعد.

## ما تمّ تحقيقه فعلياً (مؤكد من الكود والمخطط)
- قاعدة البيانات: أعمدة Golden Hour و max_messages حُذفت فعلياً. جدول `deal_cards` يحتوي على الحقول العشرة الجديدة. جدول `message_limits` يحتوي فقط على `user_id`, `category`, `inbox_mode`.
- `DealCardComposer.tsx`: أُعيد بناؤه بالكامل مع الحقول العشرة ومعاينة غنية.
- `BusinessDeals.tsx`: يعرض البطاقات بشكل Rich Card مع أزرار Interested / Not suitable / Share.
- `useDealCards.tsx`: يطابق الأعمدة الجديدة.
- `InviteManagerDialog.tsx` + `RedeemManagerInvite.tsx`: إدخال كود يسمح باللصق بسهولة.
- `InboxSection.tsx`: أصبح هناك وضعان فقط Unlimited/Closed بدون أشرطة أعداد.
- `MessageComposer.tsx` و `ConversationView.tsx`: لم يعد يتحقق من `can_receive_message`، ويتوقف فقط عند `inbox_mode === 'closed'`.

## الفجوات المؤكدة التي تحتاج إصلاحاً
1. `Dashboard.tsx` يحتوي على `handleSetLimit` يكتب `max_messages` إلى `message_limits`، وهذا العمود حُذف من المخطط. هذا خطأ وظيفي حقيقي: تغيير الإعدادات من Dashboard لن يحفظ.
2. `ManagerActivityLog.tsx` ما زال موجوداً وما زال يُعرض داخل `SovereignRolePanel.tsx` للمشهور. يجب حذفه من الواجهة الأمامية.
3. `Notifications.tsx` ما زال يحتوي على تعريف نوع `inbox_warning` والنصوص المرتبطة به ("صندوقك يقترب من الامتلاء" / "صندوقك ممتلئ"). يجب تنظيفه.
4. بقايا اسم "Directly" ما زالت موجودة في عدة ملفات (`App.tsx`, `Dashboard.tsx`, `shareCard.ts`, `appUrl.ts`, `cryptoHelpers.ts`, `pushNotifications.ts`, `offlineQueue.ts`, `signalProtocol.ts`, `OnboardingFlow.tsx`, `Launch.tsx`, `BugBounty.tsx`, `Profile.tsx`، إلخ). يجب استبدالها بـ "Sovereign".
5. التسجيل الموحد بـ `username@` لم يُطبق بعد. النموذج الحالي يطلب `username` و `display_name` و `email` بشكل منفصل.
6. `InboxSection.tsx` يستورد `Slider` دون استخدامه — مخلف بسيط.
7. `MessageComposer.tsx` يحتوي على منطق `shouldDeductCredit` المسمى باسم سابق، يتعلق بـ "credit" المحذوفة.

## الخطة التنفيذية

### 1. إصلاح حفظ إعدادات الصندوق في Dashboard.tsx
- تعديل `handleSetLimit` لتكتب `inbox_mode` (`'unlimited'` أو `'closed'`) بدلاً من `max_messages`.
- تحديث `limits` state ليكون واضحاً كأنه يمثل الوضع (mode) وليس عدد الرسائل، أو إزالة الحاجة للـ `messageLimit` العددي بالكامل.
- التأكد من أن `InboxSection` يستقبل الوضع الحالي ويعكسه بدقة.

### 2. حذف Activity Log من الواجهة الأمامية
- حذف ملف `src/components/profile/ManagerActivityLog.tsx`.
- إزالة استيراده واستخدامه من `SovereignRolePanel.tsx`.
- تحديث الملصقات والنصوص في `SovereignRolePanel` بحيث لا تشير إلى Activity Log.

### 3. تنظيف Notifications.tsx
- إزالة نوع `inbox_warning` من واجهة `NotificationItem`.
- حذف نصوص `inboxAlmostFull` و `inboxFull` و `adjustLimit` من جميع اللغات.
- حذف منطق الـ click handler لـ `inbox_warning`.
- حذف أيقينة/حالة `inbox_warning` في rendering.

### 4. إزالة بقايا اسم Directly
- البحث عن كل "Directly" في `src/` (بما فيها التعليقات، المتغيرات، localStorage keys، strings).
- استبدالها بـ "Sovereign" مع الحفاظ على المعنى.
- استبدال `localStorage` key `directly_onboarded` بـ `sovereign_onboarded` مع التعامل مع migration.
- تحديث أي نصوص تسويقية أو قانونية (PrivacyPolicy, Launch, BugBounty) تذكر Directly.

### 5. تطبيق التسجيل الموحد بـ username@
- تعديل `Auth.tsx` بحيث يكون `username` هو المعرف الرئيسي ويعرض للمستخدم بصيغة `username@` (مثل `john@`).
- تحديث التحقق (validation) لتسمح بالحروف والأرقام والشرطة السفلية فقط، وعدم طلب `display_name` إذا كان المستخدم يريد التسجيل بـ username@ فقط، أو جعل username@ هو المعرف الوحيد.
- تحديث ملفات البحث والملف الشخصي لعرض المعرف بالشكل الجديد.
- تحديث رسائل الترحيب والأمثلة في الواجهة لتعكس `username@`.
- تحديث نموذج `profiles` إذا لزم الأمر (ربما إضافة `username` formatting helper وليس عمود جديد).

### 6. تنظيف مخلفات صغيرة
- إزالة استيراد `Slider` غير المستخدم من `InboxSection.tsx`.
- إعادة تسمية `shouldDeductCredit` في `MessageComposer.tsx` إلى شيء منطقي للنظام الجديد (مثل `isNewThread`) أو إزالة المنطق إذا لم يعد ضرورياً.
- التأكد من أن `buildShareLink` في `appUrl.ts` يستخدم `VITE_APP_BASE_URL` بشكل صحيح للنطاق المخصص.

### 7. التحقق النهائي
- تشغيل build للتأكد من عدم وجود أخطاء TypeScript.
- البحث مجدداً عن `Directly`, `Golden Hour`, `max_messages`, `inbox_warning`, `ManagerActivityLog` للتأكد من عدم وجود بقايا.
- فحص سريع على Preview لتحديد أن التسجيل وإعدادات الصندوق يعملان.