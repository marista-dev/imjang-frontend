import { NavLink, useLocation } from 'react-router-dom';
import { Home, Map, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useScrollDirection } from '@/hooks/useScrollDirection';

const navItems = [
  { path: '/', label: '홈', icon: Home },
  { path: '/map', label: '지도', icon: Map },
  { path: '/timeline', label: '타임라인', icon: Clock },
];

const HIDDEN_PATTERNS = [
  /^\/login/,
  /^\/signup/,
  /^\/verify-email/,
  /^\/properties\/new/,
  /^\/properties\/\d+/,
];

const glassStyle = {
  background: 'rgba(255, 255, 255, 0.72)',
  backdropFilter: 'blur(24px)',
  WebkitBackdropFilter: 'blur(24px)',
  border: '0.5px solid rgba(255, 255, 255, 0.6)',
  boxShadow: '0 4px 24px rgba(0, 0, 0, 0.06), 0 0 0 0.5px rgba(0, 0, 0, 0.04)',
};

const BottomNav = () => {
  const { pathname } = useLocation();
  const scrollDir = useScrollDirection(10);

  if (HIDDEN_PATTERNS.some((p) => p.test(pathname))) return null;

  const isHidden = scrollDir === 'down';

  return (
    <nav
      style={glassStyle}
      className={cn(
        'fixed bottom-3 left-1/2 z-50 h-16 w-[calc(100%-24px)] max-w-[406px]',
        '-translate-x-1/2 rounded-[22px]',
        'transition-transform duration-300 ease-out',
        isHidden ? 'translate-y-[calc(100%_+_24px)]' : 'translate-y-0',
      )}
    >
      <div className="flex h-full items-center justify-around px-4">
        {navItems.map(({ path, label, icon: Icon }) => (
          <NavLink
            key={path}
            to={path}
            end={path === '/'}
            className={({ isActive }) =>
              cn(
                'relative flex min-h-[44px] min-w-[44px] flex-col items-center justify-center gap-0.5',
                'text-xs transition-colors',
                isActive ? 'font-semibold text-primary' : 'text-slate-400',
              )
            }
          >
            {({ isActive }) => (
              <>
                <Icon size={22} />
                <span>{label}</span>
                {isActive && (
                  <span className="absolute -bottom-1 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-primary" />
                )}
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
};

export default BottomNav;
