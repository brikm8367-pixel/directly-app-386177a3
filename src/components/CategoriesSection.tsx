import { CategoryCard } from "./CategoryCard";
import { Briefcase, Users, Heart } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";

export function CategoriesSection() {
  const { t, language } = useLanguage();

  // 🧠 عنوان بصري - يوصل الفكرة بدون شرح
  const sectionTitle = {
    ar: "كل رسالة في مكانها",
    en: "Every message in its place",
    fr: "Chaque message à sa place"
  };

  return (
    <section id="categories" className="py-24 relative overflow-hidden">
      {/* خلفية تعطي إحساس بالتنظيم */}
      <div className="absolute inset-0 bg-secondary/30" />
      
      {/* خطوط دقيقة تمثل التنظيم */}
      <div className="absolute inset-0 opacity-[0.015]" style={{
        backgroundImage: `repeating-linear-gradient(90deg, hsl(var(--foreground)) 0px, hsl(var(--foreground)) 1px, transparent 1px, transparent 80px)`
      }} />
      
      <div className="container relative z-10 px-4">
        {/* عنوان بسيط */}
        <div className="mx-auto max-w-xl text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground opacity-0 animate-fade-in-up">
            {sectionTitle[language]}
          </h2>
        </div>

        {/* البطاقات - تشرح نفسها بصرياً */}
        <div className="grid gap-6 md:grid-cols-3 max-w-4xl mx-auto">
          <CategoryCard
            title={t.categories.work.title}
            description={t.categories.work.description}
            icon={Briefcase}
            count={12}
            maxCount={20}
            variant="work"
            delay={100}
          />
          <CategoryCard
            title={t.categories.audience.title}
            description={t.categories.audience.description}
            icon={Users}
            count={45}
            maxCount={50}
            variant="audience"
            delay={200}
          />
          <CategoryCard
            title={t.categories.others.title}
            description={t.categories.others.description}
            icon={Heart}
            count={8}
            maxCount={15}
            variant="others"
            delay={300}
          />
        </div>
      </div>
    </section>
  );
}
