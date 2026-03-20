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
 * 별점 → 마커 컬러
 */
export const getRatingColor = (rating) => {
  if (rating >= 4) return 'success';
  if (rating === 3) return 'warning';
  return 'danger';
};
