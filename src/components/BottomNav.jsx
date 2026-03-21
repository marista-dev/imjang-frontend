import { useNavigate, useLocation } from 'react-router-dom';
import { Home, Map, Clock, Plus } from 'lucide-react';
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

const BottomNav = () => {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const scrollDir = useScrollDirection(10, pathname);

  if (HIDDEN_PATTERNS.some((p) => p.test(pathname))) return null;

  const isHidden = scrollDir === 'down';

  const isActive = (path) =>
    path === '/' ? pathname === '/' : pathname.startsWith(path);

  return (
    <nav
      className={cn(
        'fixed bottom-1 left-0 right-0 z-50 flex items-center justify-center gap-1.5 pb-safe',
        'transition-all duration-300 ease-out',
        isHidden ? 'translate-y-[calc(100%+24px)] opacity-0' : 'translate-y-0 opacity-100',
      )}
    >
      {/* 탭 pill */}
      <div
        className="inline-flex items-center rounded-full p-[3px]"
        style={{
          background: 'rgba(255,255,255,0.95)',
          boxShadow: '0 4px 20px rgba(0,0,0,0.10), 0 0 0 0.5px rgba(0,0,0,0.06)',
        }}
      >
        {navItems.map(({ path, label, icon: Icon }) => (
          <button
            key={path}
            type="button"
            onClick={() => navigate(path)}
            className={cn(
              'flex w-[88px] flex-col items-center gap-1 rounded-full py-[11px] transition-all duration-200',
              isActive(path) ? 'bg-primary text-white' : 'text-slate-400',
            )}
          >
            <Icon size={20} strokeWidth={1.8} />
            <span className="text-xs font-medium leading-none">{label}</span>
          </button>
        ))}
      </div>

      {/* FAB — pill 우측 */}
      <button
        type="button"
        onClick={() => navigate('/properties/new')}
        aria-label="매물 기록 추가"
        className="flex h-[56px] w-[56px] flex-shrink-0 items-center justify-center rounded-full bg-primary shadow-lg shadow-primary/30 active:scale-95 transition-transform"
      >
        <Plus size={22} strokeWidth={2.2} className="text-white" />
      </button>
    </nav>
  );
};

export default BottomNav;
