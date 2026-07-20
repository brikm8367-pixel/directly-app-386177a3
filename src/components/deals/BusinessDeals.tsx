import { useState } from 'react';
import { useLanguage } from '@/i18n/LanguageContext';
import { useDealCards, DealCard } from '@/hooks/useDealCards';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Briefcase, Check, X, Share2, Globe, Clock, DollarSign, Sparkles, User, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';

const DECLINE_REASONS = [
  { id: 'budget', ar: 'الميزانية أقل من المتوقع', en: 'Budget below expectations' },
  { id: 'timing', ar: 'التوقيت غير مناسب', en: 'Timing not right' },
  { id: 'conflict', ar: 'تضارب مع التزامات قائمة', en: 'Conflicts with existing commitments' },
  { id: 'brand', ar: 'العلامة التجارية غير ملائمة', en: 'Brand not a fit' },
  { id: 'engaged', ar: 'مرتبط حالياً', en: 'Currently engaged' },
];

const STATUS_STYLE: Record<string, string> = {
  pending: 'text-amber-600 bg-amber-500/10',
  accepted: 'text-emerald-600 bg-emerald-500/10',
  declined: 'text-destructive bg-destructive/10',
  countered: 'text-blue-600 bg-blue-500/10',
};

export function DealCardView({ deal, isRTL }: { deal: DealCard; isRTL: boolean }) {
  return (
    <div className="rounded-2xl bg-background border border-border shadow-sm p-4 space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-[11px] font-medium text-blue-600 uppercase tracking-wide">
            {isRTL ? 'بطاقة عرض عمل' : 'Deal Card'}
          </p>
          <h3 className="text-base font-bold truncate">{deal.company_name || '—'}</h3>
          {deal.website && (
            <a href={deal.website} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-primary truncate">
              <Globe className="h-3 w-3" /> {deal.website}
            </a>
          )}
        </div>
        <span className={cn('text-[10px] font-medium px-2 py-0.5 rounded-full whitespace-nowrap', STATUS_STYLE[deal.status])}>
          {deal.status === 'pending' ? (isRTL ? 'قيد المراجعة' : 'Pending')
            : deal.status === 'accepted' ? (isRTL ? 'مهتم' : 'Interested')
            : deal.status === 'declined' ? (isRTL ? 'غير مناسب' : 'Not suitable')
            : (isRTL ? 'عرض مضاد' : 'Countered')}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2 text-[12px]">
        <Field label={isRTL ? 'نوع التعاون' : 'Type'} value={deal.deal_type_other || deal.deal_type} />
        <Field label={isRTL ? 'المدة' : 'Duration'} value={deal.duration_date || deal.duration || '—'} />
        <Field label={isRTL ? 'الميزانية' : 'Budget'}
          value={deal.budget_amount ? `$${Number(deal.budget_amount).toLocaleString()} · ${deal.budget_cycle_other || deal.budget_cycle || ''}` : '—'} />
        <Field label={isRTL ? 'الحصرية' : 'Exclusivity'} value={deal.exclusivity_category || deal.exclusivity || '—'} />
      </div>

      {deal.campaign_description && (
        <div className="p-3 rounded-xl bg-muted/40">
          <p className="text-[10px] font-medium text-muted-foreground mb-1">{isRTL ? 'وصف الحملة' : 'Campaign description'}</p>
          <p className="text-[12px] leading-relaxed">{deal.campaign_description}</p>
        </div>
      )}

      {deal.commitments && deal.commitments.length > 0 && (
        <div>
          <p className="text-[10px] font-medium text-muted-foreground mb-1">{isRTL ? 'الالتزامات' : 'Commitments'}</p>
          <div className="flex flex-wrap gap-1">
            {deal.commitments.map((c, i) => (
              <span key={i} className="text-[11px] px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-700 dark:text-blue-400">
                {c}
              </span>
            ))}
            {deal.commitment_other && (
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-700 dark:text-blue-400">
                {deal.commitment_other}
              </span>
            )}
          </div>
        </div>
      )}

      {deal.why_talent && (
        <div className="p-3 rounded-xl border border-dashed border-border">
          <p className="text-[10px] font-medium text-muted-foreground mb-1">{isRTL ? 'لماذا هذا الموهوب؟' : 'Why this talent?'}</p>
          <p className="text-[12px] italic">"{deal.why_talent}"</p>
        </div>
      )}

      {deal.status === 'declined' && deal.decline_reason && (
        <div className="p-2 rounded-lg bg-destructive/5 border border-destructive/20 text-[11px] text-destructive">
          {isRTL ? 'سبب الرفض: ' : 'Reason: '}{deal.decline_reason}
        </div>
      )}
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] font-medium text-muted-foreground">{label}</p>
      <p className="text-[12px] font-medium truncate">{value}</p>
    </div>
  );
}

function DealRow({ deal, canManage, onAccept, onDecline, onShare }: {
  deal: DealCard;
  canManage: boolean;
  onAccept: (id: string) => void;
  onDecline: (id: string, reason: string) => void;
  onShare: (deal: DealCard) => void;
}) {
  const { isRTL } = useLanguage();
  const [open, setOpen] = useState(false);
  const [declineOpen, setDeclineOpen] = useState(false);
  const [reason, setReason] = useState('');
  const name = deal.sender_profile?.display_name || deal.sender_profile?.username || (isRTL ? 'مجهول' : 'Unknown');

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <button onClick={() => setOpen(!open)} className="w-full flex items-center gap-2 p-3 text-start hover:bg-muted/30">
        <Avatar className="h-9 w-9">
          <AvatarImage src={deal.sender_profile?.avatar_url || undefined} />
          <AvatarFallback className="bg-blue-500/10 text-blue-600 text-xs">{name[0] || <User className="h-4 w-4" />}</AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{deal.company_name || name}</p>
          <p className="text-[11px] text-muted-foreground truncate">{deal.deal_type_other || deal.deal_type}</p>
        </div>
        <span className={cn('text-[10px] font-medium px-2 py-0.5 rounded-full', STATUS_STYLE[deal.status])}>
          {deal.status === 'pending' ? (isRTL ? 'جديد' : 'New')
            : deal.status === 'accepted' ? (isRTL ? 'مهتم' : 'Interested')
            : deal.status === 'declined' ? (isRTL ? 'مرفوض' : 'Declined') : (isRTL ? 'مضاد' : 'Countered')}
        </span>
        {open ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
      </button>

      {open && (
        <div className="p-3 border-t border-border space-y-3 bg-muted/20">
          <DealCardView deal={deal} isRTL={isRTL} />
          {canManage && deal.status === 'pending' && (
            <div className="grid grid-cols-3 gap-2">
              <Button size="sm" onClick={() => onAccept(deal.id)} className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl">
                <Check className="h-4 w-4 me-1" />{isRTL ? 'مهتم' : 'Interested'}
              </Button>
              <Button size="sm" variant="outline" onClick={() => setDeclineOpen(true)} className="rounded-xl">
                <X className="h-4 w-4 me-1" />{isRTL ? 'غير مناسب' : 'Not suitable'}
              </Button>
              <Button size="sm" variant="outline" onClick={() => onShare(deal)} className="rounded-xl">
                <Share2 className="h-4 w-4 me-1" />{isRTL ? 'مشاركة' : 'Share'}
              </Button>
            </div>
          )}
        </div>
      )}

      <Dialog open={declineOpen} onOpenChange={setDeclineOpen}>
        <DialogContent className="rounded-2xl max-w-sm">
          <DialogHeader><DialogTitle>{isRTL ? 'سبب الرفض' : 'Reason for declining'}</DialogTitle></DialogHeader>
          <div className="space-y-2 py-2">
            {DECLINE_REASONS.map(r => {
              const label = r[isRTL ? 'ar' : 'en'];
              return (
                <button key={r.id} onClick={() => setReason(label)}
                  className={cn('w-full p-3 rounded-xl border text-sm text-start',
                    reason === label ? 'border-primary bg-primary/5 font-medium' : 'border-border hover:bg-muted/40')}>
                  {label}
                </button>
              );
            })}
          </div>
          <DialogFooter>
            <Button disabled={!reason} onClick={() => { onDecline(deal.id, reason); setDeclineOpen(false); }} className="rounded-xl">
              {isRTL ? 'إرسال' : 'Send'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/** Business-box deal cards for the celebrity or their active manager. */
export function BusinessDeals({ celebrityId, canManage }: { celebrityId?: string | null; canManage: boolean }) {
  const { isRTL } = useLanguage();
  const { deals, loading, updateStatus, shareWithTalent } = useDealCards(celebrityId);

  // Keep pending deals visible; also show recent accepted/declined for reference.
  const visible = deals.filter((d) => d.status === 'pending' || d.status === 'accepted');

  if (loading || visible.length === 0) return null;

  return (
    <div className="rounded-2xl border border-blue-500/20 bg-blue-500/[0.03] p-4 space-y-3">
      <div className="flex items-center gap-2">
        <div className="p-2 rounded-xl bg-blue-500/10"><Briefcase className="h-5 w-5 text-blue-500" /></div>
        <div>
          <h3 className="font-semibold text-base">{isRTL ? 'عروض العمل' : 'Deal Cards'}</h3>
          <p className="text-xs text-muted-foreground">{isRTL ? 'عروض منظّمة في صندوق العمل' : 'Structured offers in your Business box'}</p>
        </div>
      </div>
      <div className="space-y-2">
        {visible.map(d => (
          <DealRow
            key={d.id}
            deal={d}
            canManage={canManage}
            onAccept={(id) => updateStatus(id, 'accepted')}
            onDecline={(id, reason) => updateStatus(id, 'declined', { decline_reason: reason })}
            onShare={shareWithTalent}
          />
        ))}
      </div>
    </div>
  );
}
