import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight, Shield, Zap, CheckCircle } from "lucide-react";
import { DemoPersonaModal } from "./DemoPersonaModal";
import { useLanguage } from "@/i18n/LanguageContext";

export function HeroSection() {
  const [showDemo, setShowDemo] = useState(false);
  const { t, isRTL, language } = useLanguage();

  const ArrowIcon = isRTL ? ArrowLeft : ArrowRight;

  const highlights = [
    { ar: "تواصل منظم", en: "Organized communication", fr: "Communication organisée" },
    { ar: "بلا فوضى", en: "No chaos", fr: "Sans chaos" },
    { ar: "بضغطة زر", en: "One click away", fr: "En un clic" },
  ];

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16">
      {/* Premium background */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_hsl(var(--primary)/0.05)_0%,_transparent_50%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,_hsl(var(--accent)/0.03)_0%,_transparent_50%)]" />
      
      {/* Subtle geometric shapes */}
      <div className="absolute top-1/4 right-[10%] h-72 w-72 rounded-full bg-primary/3 blur-3xl animate-pulse-subtle" />
      <div className="absolute bottom-1/4 left-[10%] h-56 w-56 rounded-full bg-accent/5 blur-3xl animate-pulse-subtle animation-delay-300" />

      <div className="container relative z-10 px-4 py-20">
        <div className="mx-auto max-w-4xl text-center">
          {/* Premium badge */}
          <div className="mb-8 inline-flex items-center gap-2 rounded-full bg-primary/5 border border-primary/10 px-5 py-2.5 text-sm font-medium text-primary opacity-0 animate-fade-in-up">
            <Zap className="h-4 w-4" />
            <span>{t.hero.badge}</span>
          </div>

          {/* Main heading - More impactful */}
          <h1 className="mb-6 text-4xl font-bold leading-tight text-foreground sm:text-5xl md:text-6xl lg:text-7xl opacity-0 animate-fade-in-up animation-delay-100">
            {t.hero.title1}
            <br />
            <span className="text-gradient-premium">{t.hero.title2}</span>
          </h1>

          {/* Subtitle - Clearer value prop */}
          <p className="mb-8 text-lg text-muted-foreground md:text-xl max-w-2xl mx-auto leading-relaxed opacity-0 animate-fade-in-up animation-delay-200">
            {t.hero.subtitle}
          </p>

          {/* Quick highlights */}
          <div className="flex flex-wrap items-center justify-center gap-4 mb-10 opacity-0 animate-fade-in-up animation-delay-300">
            {highlights.map((item, index) => (
              <div key={index} className="flex items-center gap-2 text-sm text-foreground/80">
                <CheckCircle className="h-4 w-4 text-primary" />
                <span>{item[language]}</span>
              </div>
            ))}
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12 opacity-0 animate-fade-in-up animation-delay-400">
            <Button variant="hero" size="xl" onClick={() => setShowDemo(true)} className="glow">
              {t.hero.cta1}
              <ArrowIcon className="h-5 w-5 mx-2" />
            </Button>
            <Button variant="heroOutline" size="xl">
              {t.hero.cta2}
            </Button>
          </div>

          {/* Trust signal - Simple and elegant */}
          <div className="inline-flex items-center gap-3 px-5 py-3 rounded-full bg-card border border-border/50 card-shadow opacity-0 animate-fade-in-up animation-delay-500">
            <Shield className="h-5 w-5 text-primary" />
            <span className="text-sm text-muted-foreground">{t.hero.trust1}</span>
            <div className="h-4 w-px bg-border" />
            <span className="text-sm text-muted-foreground">{t.hero.trust2}</span>
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
