import { useState } from 'react';
import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * 별점 표시/입력 컴포넌트
 * @param {number} rating - 현재 별점 (1~5)
 * @param {function} onChange - 별점 변경 콜백 (readOnly=false일 때)
 * @param {boolean} readOnly - 읽기 전용 여부
 * @param {string} size - 크기 ('sm' | 'md' | 'lg')
 */
export const RatingStars = ({
  rating = 0,
  onChange,
  readOnly = false,
  size = 'md',
}) => {
  const [hovered, setHovered] = useState(0);

  const sizeMap = { sm: 16, md: 20, lg: 28 };
  const iconSize = sizeMap[size] || sizeMap.md;

  const getStarColor = (index) => {
    const active = hovered || rating;
    if (index <= active) {
      if (active >= 4) return 'text-success fill-success';
      if (active === 3) return 'text-warning fill-warning';
      return 'text-danger fill-danger';
    }
    return 'text-slate-200 fill-slate-200';
  };

  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={readOnly}
          onClick={() => !readOnly && onChange?.(star)}
          onMouseEnter={() => !readOnly && setHovered(star)}
          onMouseLeave={() => !readOnly && setHovered(0)}
          className={cn(
            'transition-colors',
            readOnly ? 'cursor-default' : 'cursor-pointer',
          )}
        >
          <Star
            size={iconSize}
            className={cn('transition-colors', getStarColor(star))}
          />
        </button>
      ))}
      {readOnly && rating > 0 && (
        <span className="ml-1 text-xs font-medium text-slate-500">
          {rating}
        </span>
      )}
    </div>
  );
};
