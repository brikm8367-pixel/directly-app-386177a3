import { cn } from "@/lib/utils";
import { ArrowDown, MessageSquarePlus, Filter, CheckCircle } from "lucide-react";

const steps = [
  {
    icon: MessageSquarePlus,
    title: "استقبال الرسائل",
    description: "تصل جميع رسائلك إلى Directly من مختلف المنصات والقنوات",
  },
  {
    icon: Filter,
    title: "التصنيف التلقائي",
    description: "يقوم التطبيق بتصنيف الرسائل تلقائياً إلى الأقسام الثلاثة",
  },
  {
    icon: CheckCircle,
    title: "تواصل منظم",
    description: "رد على الرسائل المهمة أولاً واستمتع بتواصل خالٍ من الفوضى",
  },
];

export function HowItWorksSection() {
  return (
    <section id="how-it-works" className="py-24 relative overflow-hidden">
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, hsl(var(--foreground)) 1px, transparent 0)`,
          backgroundSize: "40px 40px",
        }} />
      </div>

      <div className="container relative z-10 px-4">
        {/* Section header */}
        <div className="mx-auto max-w-2xl text-center mb-20">
          <h2 className="mb-4 text-3xl font-bold text-foreground md:text-4xl opacity-0 animate-fade-in-up">
            كيف يعمل <span className="text-gradient">Directly</span>؟
          </h2>
          <p className="text-lg text-muted-foreground opacity-0 animate-fade-in-up animation-delay-100">
            ثلاث خطوات بسيطة للحصول على تجربة تواصل مثالية
          </p>
        </div>

        {/* Steps */}
        <div className="mx-auto max-w-4xl">
          <div className="grid gap-8 md:grid-cols-3">
            {steps.map((step, index) => (
              <div key={index} className="relative">
                {/* Connector line */}
                {index < steps.length - 1 && (
                  <div className="hidden md:block absolute top-12 -left-4 w-8 border-t-2 border-dashed border-border" />
                )}

                <div 
                  className="text-center opacity-0 animate-scale-in"
                  style={{ animationDelay: `${200 + index * 150}ms`, animationFillMode: "forwards" }}
                >
                  {/* Step number & icon */}
                  <div className="relative inline-flex mb-6">
                    <div className="flex h-24 w-24 items-center justify-center rounded-2xl bg-primary/10 text-primary transition-transform duration-300 hover:scale-110">
                      <step.icon className="h-10 w-10" />
                    </div>
                    <span className="absolute -top-2 -right-2 flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                      {index + 1}
                    </span>
                  </div>

                  {/* Content */}
                  <h3 className="mb-3 text-xl font-bold text-foreground">{step.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
