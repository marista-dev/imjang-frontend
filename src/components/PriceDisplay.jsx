import { cn, formatPrice } from '@/lib/utils';

/**
 * 거래 유형별 가격 표시 컴포넌트
 * - 월세: 보증금/월세 (예: "500/50만")
 * - 전세: 보증금 (예: "전세 3.5억")
 * - 매매: 매매가 (예: "매매 5억")
 */
export const PriceDisplay = ({
  priceType,
  deposit,
  monthlyRent,
  salePrice,
  className,
}) => {
  const renderPrice = () => {
    switch (priceType) {
      case 'MONTHLY':
        return (
          <span>
            <span className="text-slate-500">월세 </span>
            <span className="font-semibold">
              {formatPrice(deposit)}/{formatPrice(monthlyRent)}
            </span>
          </span>
        );
      case 'JEONSE':
        return (
          <span>
            <span className="text-slate-500">전세 </span>
            <span className="font-semibold">{formatPrice(deposit)}</span>
          </span>
        );
      case 'SALE':
        return (
          <span>
            <span className="text-slate-500">매매 </span>
            <span className="font-semibold">{formatPrice(salePrice)}</span>
          </span>
        );
      default:
        return <span className="text-slate-400">가격 정보 없음</span>;
    }
  };

  return (
    <div className={cn('text-slate-800', className)}>
      {renderPrice()}
    </div>
  );
};
