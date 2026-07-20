import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/i18n/LanguageContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';
import { Loader2, Briefcase, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { DealCardView } from './BusinessDeals';

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  celebrityId: string;
  celebrityName?: string | null;
  onSent?: () => void;
}

const DEAL_TYPES = [
  { id: 'ad', ar: 'إعلان', en: 'Ad' },
  { id: 'post', ar: 'منشور', en: 'Post' },
  { id: 'event', ar: 'حدث', en: 'Event' },
  { id: 'name_image', ar: 'صورة/اسم', en: 'Name & Image' },
  { id: 'other', ar: 'غير ذلك', en: 'Other' },
];

const BUDGET_CYCLES = [
  { id: 'per_post', ar: 'لكل منشور', en: 'Per post' },
  { id: 'campaign', ar: 'للحملة', en: 'Campaign' },
  { id: 'monthly', ar: 'شهرياً', en: 'Monthly' },
  { id: 'yearly', ar: 'سنوياً', en: 'Yearly' },
  { id: 'other', ar: 'غير ذلك', en: 'Other' },
];

const COMMITMENTS = [
  { id: 'ig_post', ar: 'منشور إنستغرام', en: 'Instagram post' },
  { id: 'tt_3', ar: '3 منشورات تيك توك', en: '3 TikTok posts' },
  { id: 'ad_video', ar: 'فيديو إعلاني', en: 'Ad video' },
  { id: 'travel', ar: 'سفر', en: 'Travel' },
  { id: 'press', ar: 'مؤتمر صحفي', en: 'Press conference' },
  { id: 'other', ar: 'غير ذلك', en: 'Other' },
];

const DURATIONS = [
  { id: '1m', ar: 'شهر', en: '1 month' },
  { id: '3m', ar: '3 أشهر', en: '3 months' },
  { id: '6m', ar: '6 أشهر', en: '6 months' },
  { id: '12m', ar: '12 شهر', en: '12 months' },
  { id: 'date', ar: 'تاريخ محدد', en: 'Specific date' },
];

const EXCLUSIVITY = [
  { id: 'none', ar: 'بدون', en: 'None' },
  { id: 'full', ar: 'كاملة', en: 'Full' },
  { id: 'category', ar: 'فئة', en: 'Category' },
];

type Step = 'form' | 'preview';

export function DealCardComposer({ open, onOpenChange, celebrityId, celebrityName, onSent }: Props) {
  const { user } = useAuth();
  const { isRTL } = useLanguage();
  const [step, setStep] = useState<Step>('form');
  const [sending, setSending] = useState(false);

  const [companyName, setCompanyName] = useState('');
  const [website, setWebsite] = useState('');
  const [dealType, setDealType] = useState('');
  const [dealTypeOther, setDealTypeOther] = useState('');
  const [campaign, setCampaign] = useState('');
  const [budgetAmount, setBudgetAmount] = useState('');
  const [budgetCycle, setBudgetCycle] = useState('');
  const [budgetCycleOther, setBudgetCycleOther] = useState('');
  const [commitments, setCommitments] = useState<string[]>([]);
  const [commitmentOther, setCommitmentOther] = useState('');
  const [duration, setDuration] = useState('');
  const [durationDate, setDurationDate] = useState('');
  const [exclusivity, setExclusivity] = useState('');
  const [exclusivityCat, setExclusivityCat] = useState('');
  const [whyTalent, setWhyTalent] = useState('');

  useEffect(() => {
    if (!open) {
      setStep('form'); setCompanyName(''); setWebsite(''); setDealType(''); setDealTypeOther('');
      setCampaign(''); setBudgetAmount(''); setBudgetCycle(''); setBudgetCycleOther('');
      setCommitments([]); setCommitmentOther(''); setDuration(''); setDurationDate('');
      setExclusivity(''); setExclusivityCat(''); setWhyTalent('');
    }
  }, [open]);

  const validate = (): string | null => {
    if (!companyName.trim()) return isRTL ? 'اسم الشركة مطلوب' : 'Company name required';
    if (!website.trim()) return isRTL ? 'الموقع الإلكتروني مطلوب' : 'Website required';
    if (!dealType) return isRTL ? 'نوع التعاون مطلوب' : 'Deal type required';
    if (dealType === 'other' && !dealTypeOther.trim()) return isRTL ? 'اوصف نوع التعاون' : 'Describe the deal type';
    if (!campaign.trim()) return isRTL ? 'وصف الحملة مطلوب' : 'Campaign description required';
    if (!budgetAmount || Number(budgetAmount) <= 0) return isRTL ? 'الميزانية مطلوبة' : 'Budget required';
    if (!budgetCycle) return isRTL ? 'دورة الميزانية مطلوبة' : 'Budget cycle required';
    if (budgetCycle === 'other' && !budgetCycleOther.trim()) return isRTL ? 'حدد دورة الميزانية' : 'Specify the cycle';
    if (commitments.includes('other') && !commitmentOther.trim()) return isRTL ? 'اوصف الالتزام' : 'Describe the commitment';
    if (!duration) return isRTL ? 'المدة مطلوبة' : 'Duration required';
    if (duration === 'date' && !durationDate) return isRTL ? 'اختر التاريخ' : 'Pick a date';
    if (!exclusivity) return isRTL ? 'الحصرية مطلوبة' : 'Exclusivity required';
    if (exclusivity === 'category' && !exclusivityCat.trim()) return isRTL ? 'حدد الفئة' : 'Specify the category';
    return null;
  };

  const toPreview = () => {
    const err = validate();
    if (err) { toast.error(err); return; }
    setStep('preview');
  };

  const buildPreviewDeal = () => ({
    id: 'preview',
    sender_id: user?.id || '',
    celebrity_id: celebrityId,
    message_id: null,
    deal_type: DEAL_TYPES.find(t => t.id === dealType)?.[isRTL ? 'ar' : 'en'] || dealType,
    deal_type_other: dealTypeOther || null,
    company_name: companyName,
    website,
    campaign_description: campaign,
    budget_amount: Number(budgetAmount),
    budget_cycle: BUDGET_CYCLES.find(b => b.id === budgetCycle)?.[isRTL ? 'ar' : 'en'] || budgetCycle,
    budget_cycle_other: budgetCycleOther || null,
    commitments: commitments.filter(c => c !== 'other').map(id => COMMITMENTS.find(x => x.id === id)?.[isRTL ? 'ar' : 'en'] || id),
    commitment_other: commitmentOther || null,
    duration: DURATIONS.find(d => d.id === duration)?.[isRTL ? 'ar' : 'en'] || duration,
    duration_date: durationDate || null,
    exclusivity: EXCLUSIVITY.find(e => e.id === exclusivity)?.[isRTL ? 'ar' : 'en'] || exclusivity,
    exclusivity_category: exclusivityCat || null,
    why_talent: whyTalent || null,
    details: null,
    status: 'pending' as const,
    seen_at: null,
    decline_reason: null,
    shared_with_talent_at: null,
    created_at: new Date().toISOString(),
  });

  const submit = async () => {
    if (!user) return;
    setSending(true);
    const summary = `${isRTL ? 'بطاقة عرض' : 'Deal card'}: ${companyName} — ${dealTypeOther || dealType}`;

    const { data: msg, error: msgErr } = await supabase
      .from('messages')
      .insert({
        sender_id: user.id,
        receiver_id: celebrityId,
        category: 'work',
        subject: isRTL ? 'بطاقة عرض' : 'Deal Card',
        content: summary,
      } as any)
      .select('id')
      .single();

    if (msgErr) { setSending(false); toast.error(isRTL ? 'تعذّر الإرسال' : 'Could not send'); return; }

    const { error: dealErr } = await (supabase as any).from('deal_cards').insert({
      sender_id: user.id,
      celebrity_id: celebrityId,
      message_id: msg.id,
      deal_type: dealType,
      deal_type_other: dealTypeOther || null,
      company_name: companyName,
      website,
      campaign_description: campaign,
      budget_amount: Number(budgetAmount),
      budget_cycle: budgetCycle,
      budget_cycle_other: budgetCycleOther || null,
      commitments: commitments.filter(c => c !== 'other'),
      commitment_other: commitmentOther || null,
      duration,
      duration_date: durationDate || null,
      exclusivity,
      exclusivity_category: exclusivityCat || null,
      why_talent: whyTalent || null,
    });

    setSending(false);
    if (dealErr) { toast.error(isRTL ? 'تعذّر إنشاء البطاقة' : 'Could not create deal card'); return; }
    toast.success(isRTL ? 'تم إرسال بطاقة العرض' : 'Deal card sent');
    onOpenChange(false);
    onSent?.();
  };

  const toggleCommitment = (id: string) => {
    setCommitments(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-2xl max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Briefcase className="h-4 w-4 text-blue-500" />
            {step === 'preview' ? (isRTL ? 'معاينة البطاقة' : 'Deal preview') : (isRTL ? 'بطاقة عرض عمل' : 'Deal Card')}
          </DialogTitle>
          <DialogDescription>
            {(isRTL ? 'عرض منظّم إلى ' : 'A structured offer to ') + (celebrityName ? `@${celebrityName}` : '')}
          </DialogDescription>
        </DialogHeader>

        {step === 'preview' ? (
          <div className="space-y-4">
            <DealCardView deal={buildPreviewDeal() as any} isRTL={isRTL} />
            <div className="grid grid-cols-2 gap-2">
              <Button variant="outline" onClick={() => setStep('form')} className="rounded-xl">{isRTL ? 'رجوع' : 'Back'}</Button>
              <Button onClick={submit} disabled={sending} className="rounded-xl">
                {sending ? <Loader2 className="h-5 w-5 animate-spin" /> : <><Check className="h-4 w-4 me-2" />{isRTL ? 'إرسال العرض' : 'Send Deal'}</>}
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4 py-1">
            <Field label={isRTL ? 'اسم الشركة *' : 'Company name *'}>
              <Input value={companyName} onChange={e => setCompanyName(e.target.value)} className="rounded-xl" />
            </Field>
            <Field label={isRTL ? 'الموقع الإلكتروني *' : 'Website *'}>
              <Input value={website} onChange={e => setWebsite(e.target.value)} placeholder="https://" className="rounded-xl" />
            </Field>

            <Field label={isRTL ? 'نوع التعاون *' : 'Deal type *'}>
              <div className="grid grid-cols-3 gap-2">
                {DEAL_TYPES.map(t => (
                  <ChoiceBtn key={t.id} active={dealType === t.id} onClick={() => setDealType(t.id)}>
                    {t[isRTL ? 'ar' : 'en']}
                  </ChoiceBtn>
                ))}
              </div>
              {dealType === 'other' && (
                <Input value={dealTypeOther} onChange={e => setDealTypeOther(e.target.value)}
                  placeholder={isRTL ? 'اوصف نوع التعاون' : 'Describe deal type'} className="rounded-xl mt-2" />
              )}
            </Field>

            <Field label={isRTL ? `وصف مختصر للحملة * (${campaign.length}/300)` : `Campaign description * (${campaign.length}/300)`}>
              <Textarea value={campaign} maxLength={300} onChange={e => setCampaign(e.target.value)} rows={3} className="rounded-xl resize-none" />
            </Field>

            <Field label={isRTL ? 'الميزانية المعروضة *' : 'Budget *'}>
              <Input type="number" value={budgetAmount} onChange={e => setBudgetAmount(e.target.value)}
                placeholder="0" className="rounded-xl" />
              <div className="grid grid-cols-3 gap-2 mt-2">
                {BUDGET_CYCLES.map(b => (
                  <ChoiceBtn key={b.id} active={budgetCycle === b.id} onClick={() => setBudgetCycle(b.id)}>
                    {b[isRTL ? 'ar' : 'en']}
                  </ChoiceBtn>
                ))}
              </div>
              {budgetCycle === 'other' && (
                <Input value={budgetCycleOther} onChange={e => setBudgetCycleOther(e.target.value)}
                  placeholder={isRTL ? 'حدد الدورة' : 'Specify cycle'} className="rounded-xl mt-2" />
              )}
            </Field>

            <Field label={isRTL ? 'الالتزامات المطلوبة' : 'Commitments'}>
              <div className="grid grid-cols-2 gap-2">
                {COMMITMENTS.map(c => (
                  <ChoiceBtn key={c.id} active={commitments.includes(c.id)} onClick={() => toggleCommitment(c.id)}>
                    {c[isRTL ? 'ar' : 'en']}
                  </ChoiceBtn>
                ))}
              </div>
              {commitments.includes('other') && (
                <Input value={commitmentOther} onChange={e => setCommitmentOther(e.target.value)}
                  placeholder={isRTL ? 'اوصف الالتزام' : 'Describe commitment'} className="rounded-xl mt-2" />
              )}
            </Field>

            <Field label={isRTL ? 'المدة المتوقعة *' : 'Duration *'}>
              <div className="grid grid-cols-3 gap-2">
                {DURATIONS.map(d => (
                  <ChoiceBtn key={d.id} active={duration === d.id} onClick={() => setDuration(d.id)}>
                    {d[isRTL ? 'ar' : 'en']}
                  </ChoiceBtn>
                ))}
              </div>
              {duration === 'date' && (
                <Input type="date" value={durationDate} onChange={e => setDurationDate(e.target.value)} className="rounded-xl mt-2" />
              )}
            </Field>

            <Field label={isRTL ? 'الحصرية *' : 'Exclusivity *'}>
              <div className="grid grid-cols-3 gap-2">
                {EXCLUSIVITY.map(e => (
                  <ChoiceBtn key={e.id} active={exclusivity === e.id} onClick={() => setExclusivity(e.id)}>
                    {e[isRTL ? 'ar' : 'en']}
                  </ChoiceBtn>
                ))}
              </div>
              {exclusivity === 'category' && (
                <Input value={exclusivityCat} onChange={e => setExclusivityCat(e.target.value)}
                  placeholder={isRTL ? 'حدد الفئة' : 'Specify category'} className="rounded-xl mt-2" />
              )}
            </Field>

            <Field label={isRTL ? `لماذا هذا الموهوب؟ (${whyTalent.length}/200)` : `Why this talent? (${whyTalent.length}/200)`}>
              <Textarea value={whyTalent} maxLength={200} onChange={e => setWhyTalent(e.target.value)} rows={2} className="rounded-xl resize-none" />
            </Field>

            <Button onClick={toPreview} className="w-full h-12 rounded-xl">
              {isRTL ? 'معاينة' : 'Preview'}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-medium mb-2 text-muted-foreground">{label}</p>
      {children}
    </div>
  );
}

function ChoiceBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" onClick={onClick}
      className={cn('p-2 rounded-xl border text-xs text-center transition-colors',
        active ? 'border-blue-500 bg-blue-500/10 font-medium' : 'border-border hover:bg-muted/40')}>
      {children}
    </button>
  );
}
