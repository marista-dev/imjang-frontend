import { useState, useMemo, useRef } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Search, Clock, Plus } from 'lucide-react';
import { propertyApi } from '@/api/property';
import { PropertyCard } from '@/components/PropertyCard';
import { Spinner } from '@/components/Spinner';
import { useInfiniteScroll } from '@/hooks/useInfiniteScroll';
import { normalizeProperty, cn } from '@/lib/utils';

const FILTERS = [
  { id: 'ALL', label: '전체' },
  { id: 'MONTHLY', label: '월세' },
  { id: 'JEONSE', label: '전세' },
  { id: 'SALE', label: '매매' },
  { id: 'RATING_4', label: '⭐ 4+' },
];

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

const TimelinePage = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('ALL');
  const debounceRef = useRef(null);

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
    getNextPageParam: (lastPage, allPages) => {
      if (!lastPage.hasNext) return undefined;
      return allPages.length;
    },
    staleTime: 2 * 60 * 1000,
  });

  const sentinelRef = useInfiniteScroll(fetchNextPage, hasNextPage, isFetchingNextPage);

  const grouped = data?.pages.flatMap((page) => page.timelineGroups ?? []) ?? [];
  const totalCount = data?.pages[0]?.totalCount ?? null;

  // 검색 + 필터 적용
  const filteredGrouped = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return grouped
      .map(({ date, properties }) => {
        const filtered = (properties ?? [])
          .map(normalizeProperty)
          .filter((p) => {
            if (q) {
              const matchAddr = p.address?.toLowerCase().includes(q);
              const matchMemo = p.memo?.toLowerCase().includes(q);
              if (!matchAddr && !matchMemo) return false;
            }
            if (activeFilter !== 'ALL' && activeFilter !== 'RATING_4') {
              if (p.priceType !== activeFilter) return false;
            }
            if (activeFilter === 'RATING_4') {
              if ((p.rating ?? 0) < 4) return false;
            }
            return true;
          });
        return { date, properties: filtered };
      })
      .filter(({ properties }) => properties.length > 0);
  }, [grouped, searchQuery, activeFilter]);

  const isEmpty = filteredGrouped.length === 0;

  const handleSearchChange = (e) => {
    const val = e.target.value;
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setSearchQuery(val), 300);
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-24 animate-fade-in-up">
      {/* 헤더 */}
      <div className="sticky top-0 z-10 border-b border-slate-100 bg-white/95 px-5 py-4 backdrop-blur-sm">
        <div className="mb-3">
          <h1 className="text-xl font-bold text-slate-800">타임라인</h1>
          {totalCount !== null && (
            <p className="mt-0.5 text-xs text-slate-400">총 {totalCount}건</p>
          )}
        </div>

        {/* 검색바 */}
        <div className="mb-3 flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5">
          <Search size={16} className="flex-shrink-0 text-slate-400" />
          <input
            type="text"
            placeholder="주소, 메모로 검색"
            onChange={handleSearchChange}
            className="w-full bg-transparent text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none"
          />
        </div>

        {/* 필터 칩 */}
        <div className="flex gap-2 overflow-x-auto scrollbar-hide">
          {FILTERS.map(({ id, label }) => (
            <button
              key={id}
              type="button"
              onClick={() => setActiveFilter(id)}
              className={cn(
                'flex-shrink-0 rounded-full px-3 py-1.5 text-sm font-medium transition-colors',
                activeFilter === id
                  ? 'bg-primary text-white'
                  : 'border border-slate-200 bg-white text-slate-500',
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="px-5 pt-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Spinner />
          </div>
        ) : isEmpty ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100">
              <Clock size={28} className="text-slate-400" />
            </div>
            {searchQuery || activeFilter !== 'ALL' ? (
              <>
                <p className="text-base font-medium text-slate-600">검색 결과가 없어요</p>
                <p className="mt-1 text-base text-slate-400">다른 검색어나 필터를 시도해보세요.</p>
              </>
            ) : (
              <>
                <p className="text-base font-medium text-slate-600">타임라인이 비어있어요</p>
                <p className="mt-1 text-base text-slate-400">매물을 기록하면 날짜별로 정리돼요!</p>
                <button
                  type="button"
                  onClick={() => navigate('/properties/new')}
                  className="mt-4 flex items-center gap-1 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white active:scale-[0.98]"
                >
                  <Plus size={16} />
                  첫 매물 기록하기
                </button>
              </>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            {filteredGrouped.map(({ date, properties }) => (
              <div key={date} className="relative pl-6">
                {/* 타임라인 수직 라인 */}
                <div className="absolute left-[7px] top-3 bottom-0 w-px bg-slate-200" />
                {/* 타임라인 dot */}
                <div className="absolute left-0 top-[7px] h-[15px] w-[15px] rounded-full border-2 border-primary bg-white" />

                <div className="mb-2 flex items-center gap-2">
                  <span className="text-base font-semibold text-slate-700">
                    {formatGroupDate(date)}
                  </span>
                  <span className="text-xs text-slate-400">{properties.length}개</span>
                </div>
                <div className="space-y-3">
                  {properties.map((property, i) => (
                    <div key={property.id} className={`stagger-${Math.min(i + 1, 5)}`}>
                      <PropertyCard property={property} />
                    </div>
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
