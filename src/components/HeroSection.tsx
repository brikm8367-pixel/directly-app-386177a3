import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight, Shield, MessageCircle, Layers } from "lucide-react";
import { DemoPersonaModal } from "./DemoPersonaModal";
import { useLanguage } from "@/i18n/LanguageContext";

export function HeroSection() {
  const [showDemo, setShowDemo] = useState(false);
  const { t, isRTL, language } = useLanguage();

  const ArrowIcon = isRTL ? ArrowLeft : ArrowRight;

  // 🧠 رسائل قصيرة جداً تخاطب العقل الباطن
  const tagline = {
    ar: "رسائلك. أنت تقرر.",
    en: "Your messages. You decide.",
    fr: "Vos messages. Vous décidez."
  };

  return (
    <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden pt-16">
      {/* خلفية نظيفة مع تدرج خفيف */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_hsl(var(--accent)/0.04)_0%,_transparent_70%)]" />
      
      {/* أشكال هندسية تعطي إحساس بالنظام */}
      <div className="absolute top-20 right-[15%] h-64 w-64 rounded-full border border-primary/5 animate-pulse-subtle" />
      <div className="absolute bottom-32 left-[10%] h-40 w-40 rounded-full border border-accent/10 animate-pulse-subtle animation-delay-300" />
      
      {/* نقاط تمثل الفوضى المنظمة */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-2 h-2 rounded-full bg-work/30 animate-float" />
        <div className="absolute top-1/3 right-1/3 w-2 h-2 rounded-full bg-audience/30 animate-float animation-delay-200" />
        <div className="absolute bottom-1/3 left-1/2 w-2 h-2 rounded-full bg-others/30 animate-float animation-delay-400" />
      </div>

      <div className="container relative z-10 px-4 py-12">
        <div className="mx-auto max-w-3xl text-center">
          
          {/* الأيقونة الرئيسية - تمثل التحكم في الرسائل */}
          <div className="mb-8 inline-flex items-center justify-center h-20 w-20 rounded-3xl bg-gradient-to-br from-primary to-primary/80 text-primary-foreground shadow-lg opacity-0 animate-fade-in-up">
            <MessageCircle className="h-10 w-10" />
          </div>

          {/* العنوان الرئيسي - كلمات قليلة، تأثير كبير */}
          <h1 className="mb-6 text-4xl font-bold leading-tight text-foreground sm:text-5xl md:text-6xl opacity-0 animate-fade-in-up animation-delay-100">
            <span className="text-gradient-premium">{tagline[language]}</span>
          </h1>

          {/* شرح مختصر جداً */}
          <p className="mb-10 text-xl text-muted-foreground max-w-lg mx-auto leading-relaxed opacity-0 animate-fade-in-up animation-delay-200">
            {t.hero.subtitle}
          </p>

          {/* CTA واحد قوي */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-14 opacity-0 animate-fade-in-up animation-delay-300">
            <Button 
              variant="hero" 
              size="xl" 
              onClick={() => setShowDemo(true)} 
              className="shadow-lg hover:shadow-xl transition-shadow"
            >
              {t.hero.cta1}
              <ArrowIcon className="h-5 w-5 mx-2" />
            </Button>
          </div>

          {/* مؤشرات ثقة بصرية بدون كلام كثير */}
          <div className="flex items-center justify-center gap-8 opacity-0 animate-fade-in-up animation-delay-400">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Shield className="h-5 w-5 text-accent" />
              <span className="text-sm">{t.hero.trust1}</span>
            </div>
            <div className="h-4 w-px bg-border" />
            <div className="flex items-center gap-2 text-muted-foreground">
              <Layers className="h-5 w-5 text-primary" />
              <span className="text-sm">{t.hero.trust2}</span>
            </div>
          </div>
        </div>
      </div>

      {/* تلاشي سفلي */}
      <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-background to-transparent" />

      <DemoPersonaModal open={showDemo} onOpenChange={setShowDemo} />
    </section>
  );
}
