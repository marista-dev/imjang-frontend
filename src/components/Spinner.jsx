import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * 로딩 스피너 (Lucide Loader2 애니메이션)
 * @param {string} size - 'sm' | 'md' | 'lg'
 * @param {string} className
 */
export const Spinner = ({ size = 'md', className }) => {
  const sizeMap = { sm: 20, md: 32, lg: 48 };

  return (
    <div className={cn('flex items-center justify-center', className)}>
      <Loader2
        size={sizeMap[size]}
        className="animate-spin text-primary"
      />
    </div>
  );
};
