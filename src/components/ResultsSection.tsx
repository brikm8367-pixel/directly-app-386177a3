import { useLanguage } from "@/i18n/LanguageContext";
import { Crosshair, Eye, Sparkles, Crown } from "lucide-react";

const results = [
  { 
    icon: Crosshair, 
    title: { ar: "تحكم كامل", en: "Full Control", fr: "Contrôle Total" },
    description: { ar: "أنت من يقرر", en: "You decide", fr: "Vous décidez" }
  },
  { 
    icon: Eye, 
    title: { ar: "وضوح شامل", en: "Complete Clarity", fr: "Clarté Totale" },
    description: { ar: "لا شيء يضيع", en: "Nothing gets lost", fr: "Rien n'est perdu" }
  },
  { 
    icon: Sparkles, 
    title: { ar: "تجربة سلسة", en: "Seamless Experience", fr: "Expérience Fluide" },
    description: { ar: "بدون تعقيد", en: "No complexity", fr: "Sans complexité" }
  },
  { 
    icon: Crown, 
    title: { ar: "شعور مميز", en: "Premium Feel", fr: "Sensation Premium" },
    description: { ar: "لأنك تستحق", en: "Because you deserve", fr: "Parce que vous méritez" }
  },
];

export function ResultsSection() {
  const { language } = useLanguage();

  return (
    <section className="py-16 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-primary/3 to-transparent" />
      
      <div className="container px-4 relative z-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {results.map((result, index) => (
            <div 
              key={index}
              className="text-center group opacity-0 animate-fade-in-up"
              style={{ animationDelay: `${index * 100}ms`, animationFillMode: "forwards" }}
            >
              <div className="inline-flex items-center justify-center h-14 w-14 rounded-2xl bg-primary/10 text-primary mb-4 transition-all duration-300 group-hover:bg-primary group-hover:text-primary-foreground group-hover:scale-110">
                <result.icon className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-foreground mb-1">{result.title[language]}</h3>
              <p className="text-sm text-muted-foreground">{result.description[language]}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
