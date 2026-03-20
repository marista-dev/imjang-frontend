import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Plus, Map, Clock, ChevronRight, Home, BookOpen } from 'lucide-react';
import { propertyApi } from '@/api/property';
import { useAuthStore } from '@/store/useAuthStore';
import { PropertyCard } from '@/components/PropertyCard';
import { Spinner } from '@/components/Spinner';
import { normalizeProperty } from '@/lib/utils';

const HomePage = () => {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);

  const { data: recentData, isLoading: recentLoading } = useQuery({
    queryKey: ['properties-recent'],
    queryFn: () => propertyApi.getRecent(3).then((r) => r.data),
    staleTime: 2 * 60 * 1000,
  });

  const recentProperties = (recentData?.properties ?? []).map(normalizeProperty);
  const monthlyCount = recentData?.monthlyRecordCount ?? null;
  const totalCount = recentData?.totalCount ?? null;

  return (
    <div className="min-h-screen bg-slate-50 px-5 pt-6 pb-24">
      {/* 환영 헤더 */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary">
            <Home size={16} className="text-white" />
          </div>
          <span className="text-base font-bold text-slate-800">임장노트</span>
        </div>
        <h1 className="text-xl font-bold text-slate-800">
          안녕하세요{user?.name ? `, ${user.name}님` : ''}! 👋
        </h1>
        <p className="mt-0.5 text-sm text-slate-500">오늘도 좋은 매물을 찾아보세요.</p>
      </div>

      {/* 통계 카드 */}
      <div className="mb-6 grid grid-cols-2 gap-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs text-slate-500 mb-1">이번 달 기록</p>
          <p className="text-2xl font-bold text-primary">
            {monthlyCount ?? '-'}
            {monthlyCount !== null && (
              <span className="text-sm font-medium text-slate-500 ml-1">개</span>
            )}
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs text-slate-500 mb-1">전체 기록</p>
          <p className="text-2xl font-bold text-slate-800">
            {totalCount ?? '-'}
            {totalCount !== null && (
              <span className="text-sm font-medium text-slate-500 ml-1">개</span>
            )}
          </p>
        </div>
      </div>

      {/* 퀵 액션 */}
      <div className="mb-6">
        <h2 className="mb-3 text-sm font-semibold text-slate-500 uppercase tracking-wide">빠른 시작</h2>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => navigate('/map')}
            className="flex flex-col items-center gap-2 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-all active:scale-[0.97]"
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50">
              <Map size={22} className="text-blue-500" />
            </div>
            <span className="text-xs font-medium text-slate-700">지도 보기</span>
          </button>
          <button
            type="button"
            onClick={() => navigate('/timeline')}
            className="flex flex-col items-center gap-2 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-all active:scale-[0.97]"
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-50">
              <Clock size={22} className="text-amber-500" />
            </div>
            <span className="text-xs font-medium text-slate-700">타임라인</span>
          </button>
        </div>
      </div>

      {/* 최근 매물 */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide">최근 기록</h2>
          <button
            type="button"
            onClick={() => navigate('/timeline')}
            className="flex items-center gap-0.5 text-xs font-medium text-primary"
          >
            전체 보기
            <ChevronRight size={14} />
          </button>
        </div>

        {recentLoading ? (
          <div className="flex items-center justify-center py-10">
            <Spinner />
          </div>
        ) : recentProperties.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white py-12 text-center">
            <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100">
              <BookOpen size={28} className="text-slate-400" />
            </div>
            <p className="text-sm font-medium text-slate-600">아직 기록한 매물이 없어요</p>
            <p className="mt-1 text-xs text-slate-400">첫 임장 기록을 남겨보세요!</p>
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
          <div className="space-y-3">
            {recentProperties.map((property) => (
              <PropertyCard key={property.id} property={property} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default HomePage;
