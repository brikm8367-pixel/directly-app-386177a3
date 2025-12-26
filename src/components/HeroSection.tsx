import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Shield, Zap, Users } from "lucide-react";
import { DemoPersonaModal } from "./DemoPersonaModal";

export function HeroSection() {
  const [showDemo, setShowDemo] = useState(false);

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16">
      {/* Background decorations */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_hsl(var(--primary)/0.08)_0%,_transparent_50%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_hsl(var(--accent)/0.06)_0%,_transparent_50%)]" />
      
      {/* Floating shapes */}
      <div className="absolute top-32 right-20 h-64 w-64 rounded-full bg-primary/5 blur-3xl animate-float" />
      <div className="absolute bottom-32 left-20 h-48 w-48 rounded-full bg-accent/10 blur-3xl animate-float animation-delay-300" />

      <div className="container relative z-10 px-4 py-20">
        <div className="mx-auto max-w-4xl text-center">
          {/* Badge */}
          <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-sm font-medium text-primary opacity-0 animate-fade-in-up">
            <Zap className="h-4 w-4" />
            <span>تواصل أذكى. حياة أسهل.</span>
          </div>

          {/* Main heading */}
          <h1 className="mb-6 text-4xl font-bold leading-tight text-foreground sm:text-5xl md:text-6xl lg:text-7xl opacity-0 animate-fade-in-up animation-delay-100">
            رسائلك المهمة
            <br />
            <span className="text-gradient">لن تضيع بعد الآن</span>
          </h1>

          {/* Subtitle */}
          <p className="mb-10 text-lg text-muted-foreground md:text-xl max-w-2xl mx-auto leading-relaxed opacity-0 animate-fade-in-up animation-delay-200">
            يجعل Directly التواصل الخاص بك واضحاً ومنظماً، ويوفر عليك الوقت والجهد 
            في إدارة الرسائل سواء كانت من جمهورك، شركاء عملك، أو الأشخاص المهمين.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16 opacity-0 animate-fade-in-up animation-delay-300">
            <Button variant="hero" size="xl" onClick={() => setShowDemo(true)}>
              ابدأ مجاناً
              <ArrowLeft className="h-5 w-5 mr-2" />
            </Button>
            <Button variant="heroOutline" size="xl">
              شاهد كيف يعمل
            </Button>
          </div>

          {/* Trust indicators */}
          <div className="flex flex-wrap items-center justify-center gap-8 opacity-0 animate-fade-in-up animation-delay-400">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Shield className="h-5 w-5 text-primary" />
              <span>حماية كاملة</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Users className="h-5 w-5 text-primary" />
              <span>+10,000 مستخدم</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Zap className="h-5 w-5 text-primary" />
              <span>تجربة سلسة</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom gradient fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent" />

      {/* Demo Modal */}
      <DemoPersonaModal open={showDemo} onOpenChange={setShowDemo} />
    </section>
  );
}
