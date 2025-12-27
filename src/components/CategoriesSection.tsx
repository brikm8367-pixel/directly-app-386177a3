import { CategoryCard } from "./CategoryCard";
import { Briefcase, Users, Heart, Zap } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";

export function CategoriesSection() {
  const { t, language } = useLanguage();

  const sectionTitle = {
    ar: "ثلاثة أقسام تعني",
    en: "Three categories mean",
    fr: "Trois catégories signifient"
  };

  const sectionHighlight = {
    ar: "صفر فوضى",
    en: "Zero chaos",
    fr: "Zéro chaos"
  };

  return (
    <section id="categories" className="py-24 relative">
      {/* Subtle background */}
      <div className="absolute inset-0 bg-secondary/40" />
      
      <div className="container relative z-10 px-4">
        {/* Section header */}
        <div className="mx-auto max-w-2xl text-center mb-16">
          <div className="inline-flex items-center gap-2 mb-4 text-primary text-sm font-medium opacity-0 animate-fade-in-up">
            <Zap className="h-4 w-4" />
            <span>{language === 'ar' ? 'نظام ذكي' : language === 'en' ? 'Smart System' : 'Système Intelligent'}</span>
          </div>
          <h2 className="mb-4 text-3xl font-bold text-foreground md:text-4xl opacity-0 animate-fade-in-up animation-delay-100">
            {sectionTitle[language]} <span className="text-gradient-premium">{sectionHighlight[language]}</span>
          </h2>
          <p className="text-lg text-muted-foreground opacity-0 animate-fade-in-up animation-delay-200">
            {t.categories.subtitle}
          </p>
        </div>

        {/* Category cards */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 max-w-5xl mx-auto">
          <CategoryCard
            title={t.categories.work.title}
            description={t.categories.work.description}
            icon={Briefcase}
            count={12}
            maxCount={20}
            variant="work"
            delay={200}
          />
          <CategoryCard
            title={t.categories.audience.title}
            description={t.categories.audience.description}
            icon={Users}
            count={45}
            maxCount={50}
            variant="audience"
            delay={300}
          />
          <CategoryCard
            title={t.categories.others.title}
            description={t.categories.others.description}
            icon={Heart}
            count={8}
            maxCount={15}
            variant="others"
            delay={400}
          />
        </div>
      </div>
    </section>
  );
}
