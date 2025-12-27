import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight, Sparkles } from "lucide-react";
import { DemoPersonaModal } from "./DemoPersonaModal";
import { useLanguage } from "@/i18n/LanguageContext";

export function CTASection() {
  const [showDemo, setShowDemo] = useState(false);
  const { t, isRTL } = useLanguage();

  const ArrowIcon = isRTL ? ArrowLeft : ArrowRight;

  return (
    <section className="py-24 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-primary" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_hsl(var(--primary-foreground)/0.1)_0%,_transparent_70%)]" />
      
      {/* Floating shapes */}
      <div className="absolute top-10 right-10 h-32 w-32 rounded-full bg-primary-foreground/5 blur-2xl animate-float" />
      <div className="absolute bottom-10 left-10 h-24 w-24 rounded-full bg-primary-foreground/5 blur-2xl animate-float animation-delay-300" />

      <div className="container relative z-10 px-4">
        <div className="mx-auto max-w-3xl text-center">
          {/* Badge */}
          <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-primary-foreground/10 px-4 py-2 text-sm font-medium text-primary-foreground opacity-0 animate-fade-in-up">
            <Sparkles className="h-4 w-4" />
            <span>{t.cta.badge}</span>
          </div>

          <h2 className="mb-6 text-3xl font-bold text-primary-foreground md:text-4xl lg:text-5xl opacity-0 animate-fade-in-up animation-delay-100">
            {t.cta.title}
          </h2>
          <p className="mb-10 text-lg text-primary-foreground/80 opacity-0 animate-fade-in-up animation-delay-200">
            {t.cta.subtitle}
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 opacity-0 animate-fade-in-up animation-delay-300">
            <Button 
              size="xl" 
              className="bg-primary-foreground text-primary hover:bg-primary-foreground/90 shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300"
              onClick={() => setShowDemo(true)}
            >
              {t.cta.button1}
              <ArrowIcon className="h-5 w-5 mx-2" />
            </Button>
            <Button 
              variant="outline" 
              size="xl"
              className="border-2 border-primary-foreground/30 text-primary-foreground bg-transparent hover:bg-primary-foreground/10"
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
