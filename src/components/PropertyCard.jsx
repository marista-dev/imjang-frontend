import { useNavigate } from 'react-router-dom';
import { ImageOff } from 'lucide-react';
import { cn, getRelativeDate } from '@/lib/utils';
import { PriceDisplay } from './PriceDisplay';
import { RatingStars } from './RatingStars';

const MARKER_COLORS = {
  GREEN: 'bg-success',
  YELLOW: 'bg-warning',
  RED: 'bg-danger',
};

/**
 * 매물 목록용 카드 컴포넌트
 * @param {object} property - 매물 데이터
 * @param {string} className - 추가 클래스
 */
export const PropertyCard = ({ property, className }) => {
  const navigate = useNavigate();

  const {
    id,
    address,
    thumbnailUrl,
    priceType,
    deposit,
    monthlyRent,
    salePrice,
    rating,
    visitedAt,
    markerColor,
  } = property;

  return (
    <button
      type="button"
      onClick={() => navigate(`/properties/${id}`)}
      className={cn(
        'card flex w-full gap-3 text-left transition-shadow active:shadow-md',
        className,
      )}
    >
      {/* 썸네일 */}
      <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-xl bg-slate-100">
        {thumbnailUrl ? (
          <img
            src={thumbnailUrl}
            alt={address}
            loading="lazy"
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-slate-300">
            <ImageOff size={32} />
          </div>
        )}
        {markerColor && (
          <div
            className={cn(
              'absolute right-1.5 top-1.5 h-3 w-3 rounded-full border-2 border-white',
              MARKER_COLORS[markerColor],
            )}
          />
        )}
      </div>

      {/* 정보 */}
      <div className="flex min-w-0 flex-1 flex-col justify-center gap-1">
        <p className="truncate text-sm font-semibold text-slate-800">
          {address}
        </p>
        <PriceDisplay
          priceType={priceType}
          deposit={deposit}
          monthlyRent={monthlyRent}
          salePrice={salePrice}
          className="text-sm"
        />
        <div className="flex items-center gap-2">
          <RatingStars rating={rating} size="sm" readOnly />
          <span className="text-xs text-slate-400">
            {getRelativeDate(visitedAt)}
          </span>
        </div>
      </div>
    </button>
  );
};
