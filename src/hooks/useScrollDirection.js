import { useState, useEffect } from 'react';

/**
 * 스크롤 방향 감지 훅
 * @param {number} threshold - 반응 최소 픽셀 (기본 10px)
 * @param {*} resetKey - 이 값이 변경되면 방향을 'up'으로 초기화 (페이지 전환 시 pathname 전달)
 * @returns {'up' | 'down'}
 */
export const useScrollDirection = (threshold = 10, resetKey = null) => {
  const [scrollDir, setScrollDir] = useState('up');

  // resetKey 변경 시 (페이지 전환) 항상 'up'으로 초기화
  useEffect(() => {
    setScrollDir('up');
  }, [resetKey]);

  useEffect(() => {
    let lastScrollY = window.scrollY;
    let ticking = false;

    const handleScroll = () => {
      if (ticking) return;
      ticking = true;

      window.requestAnimationFrame(() => {
        const currentScrollY = window.scrollY;

        if (currentScrollY <= 0) {
          setScrollDir('up');
        } else if (Math.abs(currentScrollY - lastScrollY) >= threshold) {
          setScrollDir(currentScrollY > lastScrollY ? 'down' : 'up');
          lastScrollY = currentScrollY;
        }

        ticking = false;
      });
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [threshold]);

  return scrollDir;
};
