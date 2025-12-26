import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Briefcase, Users, Heart, MessageCircle, Star, TrendingUp } from "lucide-react";

interface DemoPersonaModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// شخصية خيالية: سارة - مؤثرة على السوشيال ميديا
const persona = {
  name: "سارة الأحمد",
  role: "مؤثرة ورائدة أعمال",
  avatar: "👩‍💼",
  followers: "500K",
  quote: "قبل Directly كنت أضيع ساعات في البحث عن رسائل العمل المهمة بين آلاف الرسائل. الآن كل شيء منظم!",
};

const categories = [
  {
    id: "work",
    title: "العمل",
    icon: Briefcase,
    color: "bg-blue-500/10 text-blue-600 border-blue-500/20",
    iconBg: "bg-blue-500/20",
    messages: [
      { sender: "شركة Nike", preview: "نود التعاون معك في حملتنا الجديدة...", time: "منذ 5 دقائق", unread: true },
      { sender: "وكالة تسويق", preview: "عرض شراكة حصري لمدة 6 أشهر...", time: "منذ ساعة", unread: true },
      { sender: "مجلة Forbes", preview: "دعوة لمقابلة حول نجاحك...", time: "منذ 3 ساعات", unread: false },
    ],
    count: 12,
    limit: 15,
  },
  {
    id: "audience",
    title: "الجمهور",
    icon: Users,
    color: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
    iconBg: "bg-emerald-500/20",
    messages: [
      { sender: "أحمد محمد", preview: "محتواك رائع! كيف بدأت رحلتك؟", time: "منذ 10 دقائق", unread: true },
      { sender: "نورة علي", preview: "شكراً على النصائح في الفيديو الأخير 💕", time: "منذ 30 دقيقة", unread: false },
      { sender: "خالد السعيد", preview: "أنت مصدر إلهام لي!", time: "منذ ساعتين", unread: false },
    ],
    count: 248,
    limit: 300,
  },
  {
    id: "others",
    title: "المقربين",
    icon: Heart,
    color: "bg-rose-500/10 text-rose-600 border-rose-500/20",
    iconBg: "bg-rose-500/20",
    messages: [
      { sender: "ماما ❤️", preview: "لا تنسي الغداء يوم الجمعة!", time: "منذ 15 دقيقة", unread: true },
      { sender: "صديقتي منى", preview: "متى نتقابل؟ اشتقتلك!", time: "منذ ساعة", unread: false },
      { sender: "زوجي", preview: "أحبك، لا تتأخري 💑", time: "منذ 4 ساعات", unread: false },
    ],
    count: 5,
    limit: 10,
  },
];

const stats = [
  { label: "رسائل اليوم", value: "265", icon: MessageCircle },
  { label: "رسائل مهمة", value: "12", icon: Star },
  { label: "وقت موفر", value: "3 ساعات", icon: TrendingUp },
];

export function DemoPersonaModal({ open, onOpenChange }: DemoPersonaModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-0 gap-0 bg-background">
        {/* Header with persona info */}
        <DialogHeader className="p-6 pb-4 border-b border-border/50 bg-gradient-to-l from-primary/5 to-transparent">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center text-4xl shadow-soft">
              {persona.avatar}
            </div>
            <div className="flex-1">
              <DialogTitle className="text-xl font-bold text-foreground mb-1">
                {persona.name}
              </DialogTitle>
              <p className="text-muted-foreground text-sm">{persona.role}</p>
              <div className="flex items-center gap-2 mt-2">
                <Badge variant="secondary" className="text-xs">
                  <Users className="h-3 w-3 ml-1" />
                  {persona.followers} متابع
                </Badge>
              </div>
            </div>
          </div>
          
          {/* Quote */}
          <div className="mt-4 p-4 rounded-xl bg-primary/5 border border-primary/10">
            <p className="text-sm text-foreground/80 italic leading-relaxed">
              "{persona.quote}"
            </p>
          </div>
        </DialogHeader>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 p-6 border-b border-border/50">
          {stats.map((stat) => (
            <div key={stat.label} className="text-center p-3 rounded-xl bg-muted/50">
              <stat.icon className="h-5 w-5 mx-auto mb-2 text-primary" />
              <p className="text-lg font-bold text-foreground">{stat.value}</p>
              <p className="text-xs text-muted-foreground">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Categories */}
        <div className="p-6 space-y-6">
          <h3 className="text-sm font-semibold text-muted-foreground">
            صندوق الوارد المنظم لسارة
          </h3>
          
          {categories.map((category) => (
            <div key={category.id} className={`rounded-2xl border p-4 ${category.color}`}>
              {/* Category header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`h-10 w-10 rounded-xl ${category.iconBg} flex items-center justify-center`}>
                    <category.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="font-semibold">{category.title}</h4>
                    <p className="text-xs opacity-70">{category.count} من {category.limit} رسالة</p>
                  </div>
                </div>
                
                {/* Progress bar */}
                <div className="w-24">
                  <div className="h-2 rounded-full bg-current/10 overflow-hidden">
                    <div 
                      className="h-full rounded-full bg-current/50 transition-all duration-500"
                      style={{ width: `${(category.count / category.limit) * 100}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Messages */}
              <div className="space-y-2">
                {category.messages.map((message, idx) => (
                  <div 
                    key={idx}
                    className="flex items-center gap-3 p-3 rounded-xl bg-background/80 hover:bg-background transition-colors cursor-pointer"
                  >
                    <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center text-sm font-bold">
                      {message.sender.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-foreground text-sm">{message.sender}</span>
                        {message.unread && (
                          <span className="h-2 w-2 rounded-full bg-primary" />
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground truncate">{message.preview}</p>
                    </div>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">{message.time}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="p-6 pt-4 border-t border-border/50 bg-muted/30">
          <p className="text-center text-sm text-muted-foreground">
            هكذا تستخدم سارة Directly لإدارة تواصلها بكفاءة. 
            <span className="text-primary font-medium"> جرب الآن مجاناً!</span>
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
