import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Plus, ChevronRight, BookOpen, LogOut, CalendarDays, BarChart3, User } from 'lucide-react';
import { toast } from 'sonner';
import { Drawer } from 'vaul';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import { propertyApi } from '@/api/property';
import { authApi } from '@/api/auth';
import { useAuthStore } from '@/store/useAuthStore';
import { PropertyCard } from '@/components/PropertyCard';
import { Spinner } from '@/components/Spinner';
import { normalizeProperty } from '@/lib/utils';

const HomePage = () => {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const [menuOpen, setMenuOpen] = useState(false);

  const { data: recentData, isLoading: recentLoading } = useQuery({
    queryKey: ['properties-recent'],
    queryFn: () => propertyApi.getRecent(3).then((r) => r.data),
    staleTime: 2 * 60 * 1000,
  });

  const recentProperties = (recentData?.properties ?? []).map(normalizeProperty);
  const monthlyCount = recentData?.monthlyRecordCount ?? null;
  const totalCount = recentData?.totalCount ?? null;

  const handleLogout = async () => {
    try {
      await authApi.logout();
    } catch {
      // silent
    }
    logout();
    navigate('/login', { replace: true });
    toast.success('로그아웃되었어요.');
  };

  return (
    <div className="min-h-screen bg-slate-50 px-5 pt-6 pb-24 animate-fade-in-up">
      {/* 환영 헤더 */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium tracking-wide text-slate-400">임장노트</span>
          <button
            type="button"
            onClick={() => setMenuOpen(true)}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-emerald-200 to-emerald-500 active:scale-95 transition-all"
          >
            {user?.name ? (
              <span className="text-sm font-bold text-white">{user.name[0]}</span>
            ) : (
              <User size={18} className="text-white" />
            )}
          </button>
        </div>
        <h1 className="text-xl font-bold text-slate-800">
          좋은 매물 찾으셨나요? 👋
        </h1>
      </div>

      {/* 통계 카드 */}
      <div className="mb-6 grid grid-cols-2 gap-3">
        <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-emerald-50">
            <CalendarDays size={20} className="text-emerald-600" />
          </div>
          <div>
            <p className="text-xs text-slate-500">이번 달</p>
            <p className="text-2xl font-bold text-primary">
              {monthlyCount ?? '-'}
              {monthlyCount !== null && (
                <span className="text-sm font-medium text-slate-500 ml-1">건</span>
              )}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-blue-50">
            <BarChart3 size={20} className="text-blue-600" />
          </div>
          <div>
            <p className="text-xs text-slate-500">전체 기록</p>
            <p className="text-2xl font-bold text-slate-800">
              {totalCount ?? '-'}
              {totalCount !== null && (
                <span className="text-sm font-medium text-slate-500 ml-1">건</span>
              )}
            </p>
          </div>
        </div>
      </div>

      {/* 최근 매물 */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide">최근 기록</h2>
          <button
            type="button"
            onClick={() => navigate('/timeline')}
            className="flex h-10 items-center gap-1 rounded-lg px-2 text-sm font-medium text-primary active:bg-primary-50 transition-colors"
          >
            전체 보기
            <ChevronRight size={16} />
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
            {recentProperties.map((property, i) => (
              <div key={property.id} className={`stagger-${i + 1}`}>
                <PropertyCard property={property} />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 로그아웃 Drawer */}
      <Drawer.Root open={menuOpen} onOpenChange={setMenuOpen}>
        <Drawer.Portal>
          <Drawer.Overlay className="fixed inset-0 z-[90] bg-black/40" />
          <Drawer.Content className="fixed bottom-0 left-0 right-0 z-[91] mx-auto w-full max-w-app rounded-t-2xl bg-white px-5 pb-safe pt-4">
            <VisuallyHidden><Drawer.Title>메뉴</Drawer.Title></VisuallyHidden>
            <Drawer.Handle className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-slate-300" />
            <div className="pb-2">
              {user?.name && (
                <p className="mb-3 text-sm text-slate-500">{user.email ?? user.name}</p>
              )}
              <button
                type="button"
                onClick={() => { setMenuOpen(false); handleLogout(); }}
                className="flex h-14 w-full items-center gap-3 rounded-xl px-4 text-danger active:bg-red-50"
              >
                <LogOut size={20} />
                <span className="font-medium">로그아웃</span>
              </button>
            </div>
          </Drawer.Content>
        </Drawer.Portal>
      </Drawer.Root>
    </div>
  );
};

export default HomePage;
