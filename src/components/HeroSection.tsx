import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight, Shield, Zap, Users, Star, Rocket } from "lucide-react";
import { DemoPersonaModal } from "./DemoPersonaModal";
import { useLanguage } from "@/i18n/LanguageContext";

export function HeroSection() {
  const [showDemo, setShowDemo] = useState(false);
  const { t, isRTL } = useLanguage();

  const ArrowIcon = isRTL ? ArrowLeft : ArrowRight;

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
          {/* Product Hunt Badge */}
          <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-accent/10 px-4 py-2 text-sm font-medium text-accent opacity-0 animate-fade-in-up border border-accent/20">
            <Rocket className="h-4 w-4" />
            <span>🚀 Launching on Product Hunt!</span>
          </div>

          {/* Badge */}
          <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-sm font-medium text-primary opacity-0 animate-fade-in-up animation-delay-100">
            <Zap className="h-4 w-4" />
            <span>{t.hero.badge}</span>
          </div>

          {/* Main heading */}
          <h1 className="mb-6 text-4xl font-bold leading-tight text-foreground sm:text-5xl md:text-6xl lg:text-7xl opacity-0 animate-fade-in-up animation-delay-200">
            {t.hero.title1}
            <br />
            <span className="text-gradient">{t.hero.title2}</span>
          </h1>

          {/* Subtitle */}
          <p className="mb-10 text-lg text-muted-foreground md:text-xl max-w-2xl mx-auto leading-relaxed opacity-0 animate-fade-in-up animation-delay-300">
            {t.hero.subtitle}
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12 opacity-0 animate-fade-in-up animation-delay-400">
            <Button variant="hero" size="xl" onClick={() => setShowDemo(true)}>
              {t.hero.cta1}
              <ArrowIcon className="h-5 w-5 mx-2" />
            </Button>
            <Button variant="heroOutline" size="xl">
              {t.hero.cta2}
            </Button>
          </div>

          {/* Trust indicators */}
          <div className="flex flex-wrap items-center justify-center gap-8 mb-12 opacity-0 animate-fade-in-up animation-delay-500">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Shield className="h-5 w-5 text-primary" />
              <span>{t.hero.trust1}</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Users className="h-5 w-5 text-primary" />
              <span>{t.hero.trust2}</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Zap className="h-5 w-5 text-primary" />
              <span>{t.hero.trust3}</span>
            </div>
          </div>

          {/* Rating badge */}
          <div className="flex items-center justify-center gap-3 opacity-0 animate-fade-in-up animation-delay-500">
            <div className="flex items-center gap-1">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="h-5 w-5 fill-accent text-accent" />
              ))}
            </div>
            <span className="text-sm text-muted-foreground">4.9/5</span>
            <span className="text-sm text-muted-foreground">•</span>
            <span className="text-sm text-muted-foreground">500+ reviews</span>
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
