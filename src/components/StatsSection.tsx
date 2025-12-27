import { useLanguage } from "@/i18n/LanguageContext";
import { Users, MessageSquare, ThumbsUp, Globe } from "lucide-react";

export function StatsSection() {
  const { t } = useLanguage();

  const stats = [
    { value: "10K+", label: t.stats.users, icon: Users },
    { value: "1M+", label: t.stats.messages, icon: MessageSquare },
    { value: "98%", label: t.stats.satisfaction, icon: ThumbsUp },
    { value: "50+", label: t.stats.countries, icon: Globe },
  ];

  return (
    <section className="py-16 bg-primary/5">
      <div className="container px-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((stat, index) => (
            <div 
              key={index}
              className="text-center opacity-0 animate-fade-in-up"
              style={{ animationDelay: `${index * 100}ms`, animationFillMode: "forwards" }}
            >
              <stat.icon className="h-8 w-8 text-primary mx-auto mb-3" />
              <div className="text-3xl md:text-4xl font-bold text-foreground mb-1">{stat.value}</div>
              <div className="text-sm text-muted-foreground">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
