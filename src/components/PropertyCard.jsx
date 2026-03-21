import { useNavigate } from 'react-router-dom';
import { ImageOff } from 'lucide-react';
import { cn, getRelativeDate } from '@/lib/utils';
import { PriceDisplay } from './PriceDisplay';
import { RatingStars } from './RatingStars';

/**
 * 매물 목록용 세로형 카드 컴포넌트
 * @param {object} property - normalizeProperty()로 정규화된 매물 데이터
 * @param {string} className - 추가 클래스
 */
export const PropertyCard = ({ property, className }) => {
  const navigate = useNavigate();

  const {
    address,
    images,
    priceType,
    deposit,
    monthlyRent,
    salePrice,
    rating,
    visitedAt,
    area,
    floor,
    totalFloors,
    canMoveIn,
  } = property;

  const propertyId = property.id ?? property.propertyId;
  const thumbnailUrl = images?.[0]?.url ?? null;
  const imageCount = images?.length ?? 0;

  const subInfo = [
    area && `${area}m²`,
    floor && totalFloors ? `${floor}/${totalFloors}층` : floor ? `${floor}층` : null,
  ].filter(Boolean).join(' · ');

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => { if (propertyId) navigate(`/properties/${propertyId}`); }}
      onKeyDown={(e) => { if (e.key === 'Enter' && propertyId) navigate(`/properties/${propertyId}`); }}
      className={cn(
        'overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm',
        'cursor-pointer transition-all active:scale-[0.98]',
        className,
      )}
    >
      {/* 사진 영역 */}
      <div className="relative h-40 bg-slate-100">
        {thumbnailUrl ? (
          <img
            src={thumbnailUrl}
            alt={address}
            loading="lazy"
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <ImageOff size={32} className="text-slate-300" />
          </div>
        )}
        {imageCount > 1 && (
          <span className="absolute right-2 top-2 rounded-full bg-black/40 px-2 py-0.5 text-[11px] text-white">
            1/{imageCount}
          </span>
        )}
      </div>

      {/* 텍스트 영역 */}
      <div className="p-4">
        <p className="truncate text-[15px] font-semibold text-slate-800">{address}</p>
        <div className="mt-1.5 flex items-baseline gap-2">
          <PriceDisplay
            priceType={priceType}
            deposit={deposit}
            monthlyRent={monthlyRent}
            salePrice={salePrice}
            className="text-base font-bold text-primary"
          />
          {subInfo && (
            <span className="text-xs text-slate-400">{subInfo}</span>
          )}
        </div>
        <div className="mt-2 flex items-center justify-between">
          <RatingStars rating={rating} size="sm" readOnly />
          <div className="flex items-center gap-1.5">
            {canMoveIn && (
              <span className="rounded-md bg-primary-50 px-2 py-0.5 text-[10px] font-semibold text-primary">
                입주가능
              </span>
            )}
            <span className="text-[11px] text-slate-400">{getRelativeDate(visitedAt)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
