import { CategoryCard } from "./CategoryCard";
import { Briefcase, Users, Heart } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";

export function CategoriesSection() {
  const { t } = useLanguage();

  return (
    <section id="categories" className="py-24 relative">
      {/* Background */}
      <div className="absolute inset-0 bg-secondary/30" />
      
      <div className="container relative z-10 px-4">
        {/* Section header */}
        <div className="mx-auto max-w-2xl text-center mb-16">
          <h2 className="mb-4 text-3xl font-bold text-foreground md:text-4xl opacity-0 animate-fade-in-up">
            {t.categories.title1} <span className="text-gradient">{t.categories.title2}</span>
          </h2>
          <p className="text-lg text-muted-foreground opacity-0 animate-fade-in-up animation-delay-100">
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
