import { useState, useEffect, useRef } from 'react';

/**
 * 스크롤 방향 감지 훅
 * - 아래로 스크롤 중 → 'down' (숨김)
 * - 위로 스크롤 중 또는 스크롤 멈춤 → 'up' (표시)
 *
 * @param {number} threshold - 반응 최소 픽셀 (기본 10px)
 * @param {*} resetKey - 이 값이 변경되면 'up'으로 초기화 (페이지 전환 시 pathname 전달)
 * @returns {'up' | 'down'}
 */
export const useScrollDirection = (threshold = 10, resetKey = null) => {
  const [scrollDir, setScrollDir] = useState('up');
  const lastScrollY = useRef(window.scrollY);
  const stopTimerRef = useRef(null);

  // resetKey 변경 시 (페이지 전환) 항상 'up'으로 초기화
  useEffect(() => {
    setScrollDir('up');
  }, [resetKey]);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      // 최상단이면 항상 표시
      if (currentScrollY <= 0) {
        setScrollDir('up');
        lastScrollY.current = 0;
        return;
      }

      const diff = currentScrollY - lastScrollY.current;

      if (Math.abs(diff) >= threshold) {
        setScrollDir(diff > 0 ? 'down' : 'up');
        lastScrollY.current = currentScrollY;
      }

      // 스크롤 멈춤 감지 — 200ms 후 다시 표시
      clearTimeout(stopTimerRef.current);
      stopTimerRef.current = setTimeout(() => {
        setScrollDir('up');
      }, 200);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
      clearTimeout(stopTimerRef.current);
    };
  }, [threshold]);

  return scrollDir;
};
