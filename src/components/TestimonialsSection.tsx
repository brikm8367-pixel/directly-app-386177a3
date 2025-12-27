import { Star, Quote } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";

const testimonials = [
  {
    name: "Sarah Johnson",
    role: "Content Creator",
    avatar: "SJ",
    rating: 5,
    text: {
      ar: "Directly غيّر طريقة تعاملي مع رسائل المتابعين. أصبحت أكثر إنتاجية!",
      en: "Directly changed how I handle follower messages. I'm so much more productive now!",
      fr: "Directly a changé ma façon de gérer les messages de mes abonnés. Je suis tellement plus productif!"
    }
  },
  {
    name: "Ahmed Hassan",
    role: "Entrepreneur",
    avatar: "AH",
    rating: 5,
    text: {
      ar: "أخيراً تطبيق يفهم احتياجاتي. رسائل العمل منظمة والفوضى انتهت.",
      en: "Finally an app that understands my needs. Work messages are organized and chaos is over.",
      fr: "Enfin une app qui comprend mes besoins. Les messages pro sont organisés, plus de chaos."
    }
  },
  {
    name: "Marie Dubois",
    role: "Influencer",
    avatar: "MD",
    rating: 5,
    text: {
      ar: "لا أستطيع تخيل حياتي بدون Directly. توفير هائل للوقت!",
      en: "Can't imagine my life without Directly. Huge time saver!",
      fr: "Je ne peux plus imaginer ma vie sans Directly. Un gain de temps énorme!"
    }
  }
];

export function TestimonialsSection() {
  const { t, language } = useLanguage();

  return (
    <section className="py-24 bg-secondary/30">
      <div className="container px-4">
        <div className="mx-auto max-w-2xl text-center mb-16">
          <h2 className="mb-4 text-3xl font-bold text-foreground md:text-4xl opacity-0 animate-fade-in-up">
            {t.testimonials.title1} <span className="text-gradient">{t.testimonials.title2}</span>
          </h2>
          <p className="text-lg text-muted-foreground opacity-0 animate-fade-in-up animation-delay-100">
            {t.testimonials.subtitle}
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3 max-w-5xl mx-auto">
          {testimonials.map((item, index) => (
            <div 
              key={index}
              className="relative bg-card rounded-2xl p-6 card-shadow opacity-0 animate-scale-in"
              style={{ animationDelay: `${200 + index * 100}ms`, animationFillMode: "forwards" }}
            >
              <Quote className="absolute top-4 right-4 h-8 w-8 text-primary/10" />
              
              <div className="flex items-center gap-1 mb-4">
                {[...Array(item.rating)].map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-accent text-accent" />
                ))}
              </div>
              
              <p className="text-foreground mb-6 leading-relaxed">
                "{item.text[language]}"
              </p>
              
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-sm">
                  {item.avatar}
                </div>
                <div>
                  <div className="font-semibold text-foreground">{item.name}</div>
                  <div className="text-sm text-muted-foreground">{item.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
