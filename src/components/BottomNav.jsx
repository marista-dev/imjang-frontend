import { NavLink, useLocation } from 'react-router-dom';
import { Home, Map, PlusCircle, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { path: '/', label: '홈', icon: Home },
  { path: '/map', label: '지도', icon: Map },
  { path: '/properties/new', label: '기록', icon: PlusCircle },
  { path: '/timeline', label: '타임라인', icon: Clock },
];

// BottomNav를 숨길 경로 패턴
const HIDDEN_PATTERNS = [
  /^\/login/,
  /^\/signup/,
  /^\/verify-email/,
  /^\/properties\/new/,
  /^\/properties\/\d+/,
];

const BottomNav = () => {
  const { pathname } = useLocation();

  if (HIDDEN_PATTERNS.some((pattern) => pattern.test(pathname))) {
    return null;
  }

  return (
    <nav className="fixed bottom-0 left-1/2 z-50 w-full max-w-app -translate-x-1/2 border-t border-slate-200 bg-white/95 pb-safe backdrop-blur-sm">
      <div className="flex items-center justify-around py-2">
        {navItems.map(({ path, label, icon: Icon }) => (
          <NavLink
            key={path}
            to={path}
            className={({ isActive }) =>
              cn(
                'flex min-h-[44px] min-w-[44px] flex-col items-center justify-center gap-0.5 text-xs transition-colors',
                isActive
                  ? 'font-semibold text-primary'
                  : 'text-slate-400',
              )
            }
          >
            <Icon size={24} />
            <span>{label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
};

export default BottomNav;
