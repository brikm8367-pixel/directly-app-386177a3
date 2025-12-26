import { CategoryCard } from "./CategoryCard";
import { Briefcase, Users, Heart } from "lucide-react";

export function CategoriesSection() {
  return (
    <section id="categories" className="py-24 relative">
      {/* Background */}
      <div className="absolute inset-0 bg-secondary/30" />
      
      <div className="container relative z-10 px-4">
        {/* Section header */}
        <div className="mx-auto max-w-2xl text-center mb-16">
          <h2 className="mb-4 text-3xl font-bold text-foreground md:text-4xl opacity-0 animate-fade-in-up">
            ثلاثة أقسام. <span className="text-gradient">صفر فوضى.</span>
          </h2>
          <p className="text-lg text-muted-foreground opacity-0 animate-fade-in-up animation-delay-100">
            يقوم التطبيق تلقائياً بتقسيم جميع رسائلك الواردة إلى ٣ أقسام واضحة
          </p>
        </div>

        {/* Category cards */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 max-w-5xl mx-auto">
          <CategoryCard
            title="العمل"
            description="رسائل الشركات، فرص التعاون، العروض التجارية، والمراسلات المهنية"
            icon={Briefcase}
            count={12}
            maxCount={20}
            variant="work"
            delay={200}
          />
          <CategoryCard
            title="الجمهور"
            description="المعجبون، المتفاعلون، الأسئلة المختلفة، والتعليقات من متابعيك"
            icon={Users}
            count={45}
            maxCount={50}
            variant="audience"
            delay={300}
          />
          <CategoryCard
            title="آخرون"
            description="الأشخاص الذين اخترت التواصل معهم شخصياً، العائلة والأصدقاء"
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
