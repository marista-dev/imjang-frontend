import { useEffect, useRef, useCallback } from 'react';

/**
 * Intersection Observer 기반 무한 스크롤 훅
 * @param {Function} onIntersect - 하단 도달 시 호출할 콜백 (다음 페이지 fetch)
 * @param {boolean} hasMore - 추가 데이터 존재 여부
 * @param {boolean} isLoading - 현재 로딩 중 여부
 */
export const useInfiniteScroll = (onIntersect, hasMore, isLoading) => {
  const sentinelRef = useRef(null);

  const handleIntersect = useCallback(
    (entries) => {
      const [entry] = entries;
      if (entry.isIntersecting && hasMore && !isLoading) {
        onIntersect();
      }
    },
    [onIntersect, hasMore, isLoading],
  );

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(handleIntersect, {
      root: null,
      rootMargin: '200px', // 하단 200px 전에 미리 로드
      threshold: 0,
    });

    observer.observe(sentinel);

    return () => {
      observer.unobserve(sentinel);
      observer.disconnect();
    };
  }, [handleIntersect]);

  return sentinelRef;
};
