import { useNavigate, useLocation } from 'react-router-dom';
import { useLanguage } from '@/i18n/LanguageContext';
import { Home, Search, Bell, User } from 'lucide-react';
import { cn } from '@/lib/utils';

interface NavItem {
  id: string;
  icon: React.ComponentType<{ className?: string }>;
  label: { ar: string; en: string };
  path: string;
}

const navItems: NavItem[] = [
  { id: 'home', icon: Home, label: { ar: 'الرئيسية', en: 'Home' }, path: '/home' },
  { id: 'search', icon: Search, label: { ar: 'بحث', en: 'Search' }, path: '/home?tab=search' },
  { id: 'notifications', icon: Bell, label: { ar: 'إشعارات', en: 'Alerts' }, path: '/notifications' },
  { id: 'profile', icon: User, label: { ar: 'حسابي', en: 'Profile' }, path: '/profile' },
];

export function BottomNavigation() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isRTL } = useLanguage();

  const isActive = (path: string) => {
    if (path.includes('?')) {
      return location.pathname + location.search === path;
    }
    return location.pathname === path;
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 safe-area-inset-bottom">
      <div className="bg-card/95 backdrop-blur-lg border-t border-border">
        <div className="max-w-lg mx-auto flex items-center justify-around h-16 px-2">
          {navItems.map((item) => {
            const active = isActive(item.path);
            const Icon = item.icon;
            
            return (
              <button
                key={item.id}
                onClick={() => navigate(item.path)}
                className={cn(
                  'flex flex-col items-center justify-center flex-1 h-full px-3 transition-all touch-feedback',
                  active && 'text-primary'
                )}
              >
                <div className={cn(
                  'flex items-center justify-center w-10 h-10 rounded-xl transition-all',
                  active && 'bg-primary/10'
                )}>
                  <Icon className={cn(
                    'h-6 w-6 transition-all',
                    active ? 'text-primary' : 'text-muted-foreground'
                  )} />
                </div>
                <span className={cn(
                  'text-xs mt-0.5 font-medium transition-all',
                  active ? 'text-primary' : 'text-muted-foreground'
                )}>
                  {isRTL ? item.label.ar : item.label.en}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
