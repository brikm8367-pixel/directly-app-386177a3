import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight, Sparkles, Lock } from "lucide-react";
import { DemoPersonaModal } from "./DemoPersonaModal";
import { useLanguage } from "@/i18n/LanguageContext";

export function CTASection() {
  const [showDemo, setShowDemo] = useState(false);
  const { t, isRTL, language } = useLanguage();

  const ArrowIcon = isRTL ? ArrowLeft : ArrowRight;

  const ctaMessage = {
    ar: "خذ التحكم الآن",
    en: "Take Control Now",
    fr: "Prenez le Contrôle"
  };

  const subMessage = {
    ar: "لأن وقتك ثمين وتستحق تواصلاً واضحاً",
    en: "Because your time is precious and you deserve clear communication",
    fr: "Parce que votre temps est précieux et vous méritez une communication claire"
  };

  return (
    <section className="py-24 relative overflow-hidden">
      {/* Premium gradient background */}
      <div className="absolute inset-0" style={{ background: "var(--gradient-premium)" }} />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_hsl(0_0%_100%/0.1)_0%,_transparent_50%)]" />
      
      {/* Subtle pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle at 2px 2px, hsl(0 0% 100%) 1px, transparent 0)`,
          backgroundSize: "32px 32px",
        }} />
      </div>

      <div className="container relative z-10 px-4">
        <div className="mx-auto max-w-3xl text-center">
          {/* Badge */}
          <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-white/10 backdrop-blur-sm px-4 py-2 text-sm font-medium text-white/90 opacity-0 animate-fade-in-up">
            <Lock className="h-4 w-4" />
            <span>{t.cta.badge}</span>
          </div>

          <h2 className="mb-4 text-3xl font-bold text-white md:text-4xl lg:text-5xl opacity-0 animate-fade-in-up animation-delay-100">
            {ctaMessage[language]}
          </h2>
          <p className="mb-10 text-lg text-white/80 opacity-0 animate-fade-in-up animation-delay-200">
            {subMessage[language]}
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 opacity-0 animate-fade-in-up animation-delay-300">
            <Button 
              size="xl" 
              className="bg-white text-primary hover:bg-white/95 shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 font-semibold"
              onClick={() => setShowDemo(true)}
            >
              {t.cta.button1}
              <ArrowIcon className="h-5 w-5 mx-2" />
            </Button>
            <Button 
              variant="outline" 
              size="xl"
              className="border-2 border-white/25 text-white bg-transparent hover:bg-white/10 backdrop-blur-sm"
            >
              {t.cta.button2}
            </Button>
          </div>
        </div>
      </div>

      {/* Demo Modal */}
      <DemoPersonaModal open={showDemo} onOpenChange={setShowDemo} />
    </section>
  );
}
