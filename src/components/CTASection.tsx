import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { DemoPersonaModal } from "./DemoPersonaModal";
import { useLanguage } from "@/i18n/LanguageContext";

export function CTASection() {
  const [showDemo, setShowDemo] = useState(false);
  const { t, isRTL, language } = useLanguage();

  const ArrowIcon = isRTL ? ArrowLeft : ArrowRight;

  // 🧠 رسالة قصيرة تخاطب الرغبة الداخلية
  const ctaMessage = {
    ar: "استعد السيطرة",
    en: "Reclaim Control",
    fr: "Reprenez le Contrôle"
  };

  return (
    <section className="py-24 relative overflow-hidden">
      {/* تدرج يعطي إحساس بالعمق والقوة */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary to-primary/90" />
      
      {/* دوائر تمثل التنظيم */}
      <div className="absolute top-10 right-10 h-32 w-32 rounded-full border border-white/10" />
      <div className="absolute bottom-10 left-10 h-24 w-24 rounded-full border border-white/5" />
      <div className="absolute top-1/2 left-1/4 h-16 w-16 rounded-full bg-accent/20 blur-2xl" />

      <div className="container relative z-10 px-4">
        <div className="mx-auto max-w-2xl text-center">
          {/* رسالة واحدة قوية */}
          <h2 className="mb-8 text-4xl font-bold text-white md:text-5xl opacity-0 animate-fade-in-up">
            {ctaMessage[language]}
          </h2>

          {/* زر واحد واضح */}
          <div className="opacity-0 animate-fade-in-up animation-delay-200">
            <Button 
              size="xl" 
              className="bg-white text-primary hover:bg-white/95 shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 font-bold text-lg px-10"
              onClick={() => setShowDemo(true)}
            >
              {t.cta.button1}
              <ArrowIcon className="h-5 w-5 mx-2" />
            </Button>
          </div>
        </div>
      </div>

      <DemoPersonaModal open={showDemo} onOpenChange={setShowDemo} />
    </section>
  );
}
