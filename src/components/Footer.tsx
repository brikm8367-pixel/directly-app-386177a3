import { MessageSquare, Twitter, Instagram, Linkedin } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-border bg-secondary/30 py-12">
      <div className="container px-4">
        <div className="grid gap-8 md:grid-cols-4">
          {/* Brand */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <MessageSquare className="h-5 w-5" />
              </div>
              <span className="text-xl font-bold text-foreground">Directly</span>
            </div>
            <p className="text-muted-foreground max-w-sm leading-relaxed">
              نجعل تواصلك واضحاً ومنظماً. تحكم كامل في رسائلك بدون فوضى.
            </p>
          </div>

          {/* Links */}
          <div>
            <h4 className="font-semibold text-foreground mb-4">روابط سريعة</h4>
            <ul className="space-y-3">
              <li><a href="#" className="text-muted-foreground hover:text-foreground transition-colors">الرئيسية</a></li>
              <li><a href="#features" className="text-muted-foreground hover:text-foreground transition-colors">المميزات</a></li>
              <li><a href="#how-it-works" className="text-muted-foreground hover:text-foreground transition-colors">كيف يعمل</a></li>
              <li><a href="#" className="text-muted-foreground hover:text-foreground transition-colors">الأسعار</a></li>
            </ul>
          </div>

          {/* Social */}
          <div>
            <h4 className="font-semibold text-foreground mb-4">تواصل معنا</h4>
            <div className="flex gap-3">
              <a 
                href="#" 
                className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted text-muted-foreground hover:bg-primary hover:text-primary-foreground transition-colors"
              >
                <Twitter className="h-5 w-5" />
              </a>
              <a 
                href="#" 
                className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted text-muted-foreground hover:bg-primary hover:text-primary-foreground transition-colors"
              >
                <Instagram className="h-5 w-5" />
              </a>
              <a 
                href="#" 
                className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted text-muted-foreground hover:bg-primary hover:text-primary-foreground transition-colors"
              >
                <Linkedin className="h-5 w-5" />
              </a>
            </div>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-border text-center text-sm text-muted-foreground">
          <p>© 2024 Directly. جميع الحقوق محفوظة.</p>
        </div>
      </div>
    </footer>
  );
}
