import { useInfiniteQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Plus, BookOpen } from 'lucide-react';
import { propertyApi } from '@/api/property';
import { PropertyCard } from '@/components/PropertyCard';
import { Spinner } from '@/components/Spinner';
import { useInfiniteScroll } from '@/hooks/useInfiniteScroll';

const formatGroupDate = (dateStr) => {
  const date = new Date(dateStr);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const target = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const diffDays = Math.floor((today - target) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return '오늘';
  if (diffDays === 1) return '어제';

  const month = date.getMonth() + 1;
  const day = date.getDate();
  const dayNames = ['일', '월', '화', '수', '목', '금', '토'];
  const dayName = dayNames[date.getDay()];

  if (date.getFullYear() === now.getFullYear()) {
    return `${month}월 ${day}일 (${dayName})`;
  }
  return `${date.getFullYear()}년 ${month}월 ${day}일`;
};

const groupByDate = (properties) => {
  const groups = {};
  properties.forEach((p) => {
    const date = (p.visitedAt || '').split('T')[0];
    if (!groups[date]) groups[date] = [];
    groups[date].push(p);
  });
  return Object.entries(groups).sort(([a], [b]) => b.localeCompare(a));
};

const TimelinePage = () => {
  const navigate = useNavigate();

  const {
    data,
    isLoading,
    isFetchingNextPage,
    fetchNextPage,
    hasNextPage,
  } = useInfiniteQuery({
    queryKey: ['properties-timeline'],
    queryFn: ({ pageParam = 0 }) =>
      propertyApi.getTimeline({ page: pageParam, size: 20 }).then((r) => r.data),
    getNextPageParam: (lastPage) => {
      if (lastPage.last) return undefined;
      return (lastPage.number ?? 0) + 1;
    },
    staleTime: 2 * 60 * 1000,
  });

  const sentinelRef = useInfiniteScroll(fetchNextPage, hasNextPage, isFetchingNextPage);

  const allProperties =
    data?.pages.flatMap((page) => page.content ?? page.properties ?? page) ?? [];
  const totalCount = data?.pages[0]?.totalElements ?? data?.pages[0]?.total ?? null;
  const grouped = groupByDate(allProperties);

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      {/* 헤더 */}
      <div className="sticky top-0 z-10 border-b border-slate-100 bg-white/95 px-5 py-4 backdrop-blur-sm">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-slate-800">타임라인</h1>
            {totalCount !== null && (
              <p className="mt-0.5 text-xs text-slate-500">총 {totalCount}개의 기록</p>
            )}
          </div>
          <button
            type="button"
            onClick={() => navigate('/properties/new')}
            className="flex h-10 items-center gap-1.5 rounded-xl bg-primary px-4 text-sm font-semibold text-white active:scale-[0.98]"
          >
            <Plus size={16} />
            기록
          </button>
        </div>
      </div>

      <div className="px-5 pt-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Spinner />
          </div>
        ) : allProperties.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100">
              <BookOpen size={28} className="text-slate-400" />
            </div>
            <p className="text-sm font-medium text-slate-600">아직 기록한 매물이 없어요</p>
            <p className="mt-1 text-xs text-slate-400">임장 후 첫 기록을 남겨보세요!</p>
            <button
              type="button"
              onClick={() => navigate('/properties/new')}
              className="mt-4 flex items-center gap-1 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white active:scale-[0.98]"
            >
              <Plus size={16} />
              첫 매물 기록하기
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {grouped.map(([date, properties]) => (
              <div key={date}>
                <div className="mb-2 flex items-center gap-2">
                  <span className="text-sm font-semibold text-slate-700">
                    {formatGroupDate(date)}
                  </span>
                  <span className="text-xs text-slate-400">{properties.length}개</span>
                </div>
                <div className="space-y-3">
                  {properties.map((property) => (
                    <PropertyCard key={property.id} property={property} />
                  ))}
                </div>
              </div>
            ))}

            {/* 무한 스크롤 sentinel */}
            <div ref={sentinelRef} className="py-1" />
            {isFetchingNextPage && (
              <div className="flex justify-center py-4">
                <Spinner size="sm" />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default TimelinePage;
