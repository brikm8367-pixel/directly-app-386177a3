import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight, Shield, Lock, ShieldCheck, Eye } from "lucide-react";
import { DemoPersonaModal } from "./DemoPersonaModal";
import { useLanguage } from "@/i18n/LanguageContext";
import { motion } from "framer-motion";

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

  const trustItems = [
    {
      icon: ShieldCheck,
      label: { ar: "تشفير من طرف لطرف", en: "End-to-End Encrypted", fr: "Chiffrement de bout en bout", es: "Cifrado de extremo a extremo" },
      color: "text-emerald-500"
    },
    {
      icon: Eye,
      label: { ar: "لا تتبع · لا إعلانات", en: "No Tracking · No Ads", fr: "Pas de suivi · Pas de pub", es: "Sin rastreo · Sin anuncios" },
      color: "text-primary"
    },
    {
      icon: Shield,
      label: { ar: "متوافق مع GDPR", en: "GDPR Compliant", fr: "Conforme au RGPD", es: "Cumple con GDPR" },
      color: "text-accent"
    },
  ];

  return (
    <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden pt-16">
      {/* Clean radial background */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_hsl(var(--accent)/0.04)_0%,_transparent_70%)]" />
      
      {/* Geometric shapes */}
      <div className="absolute top-20 right-[15%] h-64 w-64 rounded-full border border-primary/5 animate-pulse-subtle" />
      <div className="absolute bottom-32 left-[10%] h-40 w-40 rounded-full border border-accent/10 animate-pulse-subtle animation-delay-300" />
      
      {/* Access level dots */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-2 h-2 rounded-full bg-work/30 animate-float" />
        <div className="absolute top-1/3 right-1/3 w-2 h-2 rounded-full bg-audience/30 animate-float animation-delay-200" />
        <div className="absolute bottom-1/3 left-1/2 w-2 h-2 rounded-full bg-others/30 animate-float animation-delay-400" />
      </div>

      <div className="container relative z-10 px-4 py-12">
        <div className="mx-auto max-w-3xl text-center">
          
          {/* Gateway icon */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="mb-8 inline-flex items-center justify-center h-20 w-20 rounded-3xl bg-gradient-to-br from-primary to-primary/80 text-primary-foreground shadow-lg"
          >
            <Lock className="h-10 w-10" />
          </motion.div>

          {/* Main headline */}
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="mb-4 text-4xl font-bold leading-tight text-foreground sm:text-5xl md:text-6xl"
          >
            <span className="text-gradient-premium">{headline[language]}</span>
          </motion.h1>

          {/* Sub headline */}
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mb-4 text-xl md:text-2xl text-muted-foreground max-w-lg mx-auto leading-relaxed font-medium"
          >
            {subheadline[language] || subheadline.en}
          </motion.p>

          {/* Tagline */}
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.25 }}
            className="mb-10 text-base md:text-lg text-muted-foreground/80 max-w-md mx-auto leading-relaxed italic"
          >
            {tagline[language] || tagline.en}
          </motion.p>

          {/* CTA */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-14"
          >
            <Button 
              variant="hero" 
              size="xl" 
              onClick={() => setShowDemo(true)} 
              className="shadow-lg hover:shadow-xl transition-shadow"
            >
              {t.hero.cta1}
              <ArrowIcon className="h-5 w-5 mx-2" />
            </Button>
          </motion.div>

          {/* Trust signals — privacy-first badges */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="flex flex-wrap items-center justify-center gap-6"
          >
            {trustItems.map((item, i) => (
              <div key={i} className="flex items-center gap-2 text-muted-foreground">
                <item.icon className={`h-5 w-5 ${item.color}`} />
                <span className="text-sm font-medium">{item.label[language] || item.label.en}</span>
              </div>
            ))}
          </motion.div>
        </div>
      </div>

      {/* Bottom fade */}
      <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-background to-transparent" />

      <DemoPersonaModal open={showDemo} onOpenChange={setShowDemo} />
    </section>
  );
}
