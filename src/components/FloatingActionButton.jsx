import { useNavigate, useLocation } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useScrollDirection } from '@/hooks/useScrollDirection';

const HIDDEN_PATTERNS = [
  /^\/login/,
  /^\/signup/,
  /^\/verify-email/,
  /^\/properties\/new/,
  /^\/properties\/\d+/,
];

export const FloatingActionButton = () => {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const scrollDir = useScrollDirection(10);

  if (HIDDEN_PATTERNS.some((p) => p.test(pathname))) return null;

  const isHidden = scrollDir === 'down';

  return (
    <button
      type="button"
      onClick={() => navigate('/properties/new')}
      aria-label="매물 기록 추가"
      className={cn(
        'fixed bottom-[72px] right-5 z-50',
        'flex h-[50px] w-[50px] items-center justify-center',
        'rounded-full bg-primary shadow-lg shadow-primary/30',
        'transition-all duration-300 ease-out active:scale-95',
        isHidden
          ? 'translate-y-24 opacity-0 pointer-events-none'
          : 'translate-y-0 opacity-100',
      )}
    >
      <Plus size={22} strokeWidth={2.2} className="text-white" />
    </button>
  );
};
