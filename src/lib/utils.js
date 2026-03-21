import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * shadcn 스타일 className 병합 유틸리티
 * clsx로 조건부 클래스를 처리하고, tailwind-merge로 충돌을 해결한다.
 *
 * @example
 * cn('px-4 py-2', isActive && 'bg-primary', className)
 * cn('text-sm text-slate-500', { 'font-bold': isBold })
 */
export const cn = (...inputs) => {
  return twMerge(clsx(inputs));
};

/**
 * 만원 단위 → 억/만 변환
 * @param {number} manwon - 만원 단위 숫자
 * @returns {string} 포맷된 가격 문자열
 *
 * @example
 * formatPrice(35000) → "3.5억"
 * formatPrice(500) → "500만"
 * formatPrice(100000) → "10억"
 */
export const formatPrice = (manwon) => {
  if (!manwon && manwon !== 0) return '-';
  const num = Number(manwon);
  if (num >= 10000) {
    const eok = Math.floor(num / 10000);
    const remain = num % 10000;
    if (remain === 0) return `${eok}억`;
    return `${eok}.${String(remain).replace(/0+$/, '')}억`;
  }
  return `${num.toLocaleString()}만`;
};

/**
 * 방문일 상대 표시
 * @param {string} dateStr - ISO 날짜 문자열
 * @returns {string} "오늘", "어제", "N일 전" 등
 */
export const getRelativeDate = (dateStr) => {
  if (!dateStr) return '';
  const diff = Math.floor(
    (Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24),
  );
  if (diff === 0) return '오늘';
  if (diff === 1) return '어제';
  if (diff < 30) return `${diff}일 전`;
  if (diff < 365) return `${Math.floor(diff / 30)}개월 전`;
  return `${Math.floor(diff / 365)}년 전`;
};

/**
 * 백엔드 API 응답의 매물 데이터를 프론트엔드 구조로 정규화
 * - priceInfo 중첩 구조 → flat
 * - evaluation 중첩 구조 → flat
 * - 이미지 문자열 배열 → 객체 배열
 * - totalFloor / currentFloor 필드명 통일
 */
export const normalizeProperty = (p) => ({
  ...p,
  // id: propertyId fallback
  id: p.id ?? p.propertyId ?? null,
  // visitedAt: createdAt fallback (백엔드가 createdAt으로 반환)
  visitedAt: p.visitedAt ?? p.createdAt ?? null,
  // 가격 정규화 (priceInfo 중첩 or flat)
  deposit: p.priceInfo?.deposit ?? p.deposit ?? null,
  monthlyRent: p.priceInfo?.monthlyRent ?? p.monthlyRent ?? null,
  salePrice: p.priceInfo?.price ?? p.price ?? p.salePrice ?? null,
  // 층수 정규화
  totalFloors: p.totalFloor ?? p.totalFloors ?? null,
  floor: p.currentFloor ?? p.floor ?? null,
  // 평가 정규화 (evaluation 중첩 or flat)
  canMoveIn: p.evaluation?.moveInAvailable ?? p.canMoveIn ?? null,
  revisitWanted: p.evaluation?.revisitIntention ?? p.revisitWanted ?? null,
  priceRating: p.evaluation?.priceEvaluation ?? p.priceRating ?? null,
  // 이미지 정규화 (문자열 배열 or thumbnailUrl → 객체 배열)
  images: (() => {
    const imgs = p.images ?? [];
    const normalized = imgs.map((img, idx) =>
      typeof img === 'string' ? { id: idx, url: img } : img,
    );
    // 리스트 API가 thumbnailUrl 단일 필드로 반환하는 경우 fallback
    if (normalized.length === 0 && p.thumbnailUrl) {
      return [{ id: 0, url: p.thumbnailUrl }];
    }
    return normalized;
  })(),
});

/**
 * 별점 → 마커 컬러
 */
export const getRatingColor = (rating) => {
  if (rating >= 4) return 'success';
  if (rating === 3) return 'warning';
  return 'danger';
};
