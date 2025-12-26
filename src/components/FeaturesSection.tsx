import { FeatureItem } from "./FeatureItem";
import { 
  SlidersHorizontal, 
  Tags, 
  MessageCircle, 
  Bell, 
  Lock, 
  Sparkles 
} from "lucide-react";

export function FeaturesSection() {
  return (
    <section id="features" className="py-24">
      <div className="container px-4">
        <div className="grid gap-16 lg:grid-cols-2 items-center">
          {/* Left side - Visual */}
          <div className="relative order-2 lg:order-1">
            <div className="relative rounded-3xl bg-gradient-to-br from-secondary to-muted p-8 card-shadow-lg">
              {/* Mock UI */}
              <div className="space-y-4">
                {/* Header */}
                <div className="flex items-center justify-between">
                  <div className="h-3 w-20 rounded-full bg-primary/20" />
                  <div className="flex gap-2">
                    <div className="h-8 w-8 rounded-lg bg-work/20" />
                    <div className="h-8 w-8 rounded-lg bg-audience/20" />
                    <div className="h-8 w-8 rounded-lg bg-others/20" />
                  </div>
                </div>
                
                {/* Message previews */}
                {[
                  { color: "work", width: "w-3/4" },
                  { color: "audience", width: "w-full" },
                  { color: "work", width: "w-2/3" },
                  { color: "others", width: "w-4/5" },
                ].map((item, i) => (
                  <div
                    key={i}
                    className={`flex items-center gap-3 rounded-xl bg-card p-4 opacity-0 animate-slide-in`}
                    style={{ animationDelay: `${300 + i * 100}ms`, animationFillMode: "forwards" }}
                  >
                    <div className={`h-10 w-10 rounded-full bg-${item.color}/20 flex-shrink-0`} />
                    <div className="flex-1 space-y-2">
                      <div className={`h-2.5 ${item.width} rounded-full bg-muted`} />
                      <div className="h-2 w-1/2 rounded-full bg-muted/50" />
                    </div>
                    <div className={`h-2 w-2 rounded-full bg-${item.color}`} />
                  </div>
                ))}
              </div>

              {/* Floating notification */}
              <div className="absolute -left-4 top-1/2 -translate-y-1/2 rounded-2xl bg-card p-4 card-shadow animate-float">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center">
                    <Bell className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <div className="text-sm font-medium">رسالة جديدة</div>
                    <div className="text-xs text-muted-foreground">قسم العمل</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Decorative blur */}
            <div className="absolute -z-10 -right-10 -top-10 h-40 w-40 rounded-full bg-primary/10 blur-3xl" />
          </div>

          {/* Right side - Features */}
          <div className="order-1 lg:order-2">
            <h2 className="mb-4 text-3xl font-bold text-foreground md:text-4xl opacity-0 animate-fade-in-up">
              مميزات تمنحك <span className="text-gradient">السيطرة الكاملة</span>
            </h2>
            <p className="mb-10 text-lg text-muted-foreground opacity-0 animate-fade-in-up animation-delay-100">
              كل ما تحتاجه لإدارة تواصلك بذكاء وفعالية
            </p>

            <div className="space-y-8">
              <FeatureItem
                icon={SlidersHorizontal}
                title="تحكم في عدد الرسائل"
                description="حدد عدد الرسائل التي تريد استقبالها في كل قسم حسب أولوياتك"
                delay={200}
              />
              <FeatureItem
                icon={Tags}
                title="تصنيف ذكي"
                description="تصنيف تلقائي للرسائل حسب الموضوعات المحددة مسبقاً"
                delay={300}
              />
              <FeatureItem
                icon={MessageCircle}
                title="تواصل مباشر"
                description="تواصل مع أي شخص دون قيود مع حماية كاملة من الفوضى"
                delay={400}
              />
              <FeatureItem
                icon={Lock}
                title="خصوصية تامة"
                description="رسائلك محمية ومشفرة بأعلى معايير الأمان"
                delay={500}
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
