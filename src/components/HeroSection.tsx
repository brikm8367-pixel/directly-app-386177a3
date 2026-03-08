import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight, Shield, Lock } from "lucide-react";
import { DemoPersonaModal } from "./DemoPersonaModal";
import { useLanguage } from "@/i18n/LanguageContext";

export function HeroSection() {
  const [showDemo, setShowDemo] = useState(false);
  const { t, isRTL, language } = useLanguage();

  const ArrowIcon = isRTL ? ArrowLeft : ArrowRight;

  const headline = {
    ar: "تحكم بمن يصل إليك",
    en: "Control who reaches you",
    fr: "Contrôlez qui vous contacte",
    es: "Controla quién te contacta"
  };

  const subheadline = {
    ar: "ودع رسائلك تصل دائمًا إلى مكانها الصحيح.",
    en: "Let your messages always land where they belong.",
    fr: "Vos messages arrivent toujours au bon endroit.",
    es: "Tus mensajes siempre llegan donde deben."
  };

  const tagline = {
    ar: "ادعُ فقط من تريد التواصل معه، ودع الباقي على Directly.",
    en: "Invite only who you want to connect with. Let Directly handle the rest.",
    fr: "Invitez seulement ceux que vous voulez. Directly s'occupe du reste.",
    es: "Invita solo a quienes quieres. Directly se encarga del resto."
  };

  return (
    <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden pt-16">
      {/* خلفية نظيفة مع تدرج خفيف */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_hsl(var(--accent)/0.04)_0%,_transparent_70%)]" />
      
      {/* أشكال هندسية تعطي إحساس بالتحكم والبوابة */}
      <div className="absolute top-20 right-[15%] h-64 w-64 rounded-full border border-primary/5 animate-pulse-subtle" />
      <div className="absolute bottom-32 left-[10%] h-40 w-40 rounded-full border border-accent/10 animate-pulse-subtle animation-delay-300" />
      
      {/* نقاط تمثل مستويات الوصول */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-2 h-2 rounded-full bg-work/30 animate-float" />
        <div className="absolute top-1/3 right-1/3 w-2 h-2 rounded-full bg-audience/30 animate-float animation-delay-200" />
        <div className="absolute bottom-1/3 left-1/2 w-2 h-2 rounded-full bg-others/30 animate-float animation-delay-400" />
      </div>

      <div className="container relative z-10 px-4 py-12">
        <div className="mx-auto max-w-3xl text-center">
          
          {/* أيقونة البوابة - تمثل التحكم في الوصول */}
          <div className="mb-8 inline-flex items-center justify-center h-20 w-20 rounded-3xl bg-gradient-to-br from-primary to-primary/80 text-primary-foreground shadow-lg opacity-0 animate-fade-in-up">
            <Lock className="h-10 w-10" />
          </div>

          {/* العنوان الرئيسي - جملة واحدة قوية عن التحكم */}
          <h1 className="mb-4 text-4xl font-bold leading-tight text-foreground sm:text-5xl md:text-6xl opacity-0 animate-fade-in-up animation-delay-100">
            <span className="text-gradient-premium">{headline[language]}</span>
          </h1>

          {/* Sub headline */}
          <p className="mb-4 text-xl md:text-2xl text-muted-foreground max-w-lg mx-auto leading-relaxed opacity-0 animate-fade-in-up animation-delay-200 font-medium">
            {subheadline[language] || subheadline.en}
          </p>

          {/* Tagline - Apple style */}
          <p className="mb-10 text-base md:text-lg text-muted-foreground/80 max-w-md mx-auto leading-relaxed opacity-0 animate-fade-in-up animation-delay-250 italic">
            {tagline[language] || tagline.en}
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

          {/* مؤشرات ثقة - تحكم وحماية */}
          <div className="flex items-center justify-center gap-8 opacity-0 animate-fade-in-up animation-delay-400">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Shield className="h-5 w-5 text-accent" />
              <span className="text-sm">{t.hero.trust1}</span>
            </div>
            <div className="h-4 w-px bg-border" />
            <div className="flex items-center gap-2 text-muted-foreground">
              <Lock className="h-5 w-5 text-primary" />
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
