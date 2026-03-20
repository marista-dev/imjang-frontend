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
        'fixed bottom-[88px] right-5 z-50',
        'flex h-[52px] w-[52px] items-center justify-center',
        'rounded-2xl bg-primary shadow-lg shadow-primary/30',
        'transition-all duration-300 ease-out active:scale-95',
        isHidden ? 'translate-y-[calc(200%_+_24px)]' : 'translate-y-0',
      )}
    >
      <Plus size={22} className="text-white" />
    </button>
  );
};
