import { Button } from "@/components/ui/button";
import { MessageSquare } from "lucide-react";

export function Header() {
  return (
    <header className="fixed top-0 right-0 left-0 z-50 glass border-b border-border/50">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <MessageSquare className="h-5 w-5" />
          </div>
          <span className="text-xl font-bold text-foreground">Directly</span>
        </div>

        {/* Navigation */}
        <nav className="hidden md:flex items-center gap-8">
          <a href="#features" className="text-muted-foreground hover:text-foreground transition-colors">
            المميزات
          </a>
          <a href="#how-it-works" className="text-muted-foreground hover:text-foreground transition-colors">
            كيف يعمل
          </a>
          <a href="#categories" className="text-muted-foreground hover:text-foreground transition-colors">
            الأقسام
          </a>
        </nav>

        {/* CTA */}
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm">
            تسجيل الدخول
          </Button>
          <Button size="sm">
            ابدأ الآن
          </Button>
        </div>
      </div>
    </header>
  );
}
