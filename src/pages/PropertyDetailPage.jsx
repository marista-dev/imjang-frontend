import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ChevronLeft,
  MoreVertical,
  Edit3,
  Trash2,
  ImageOff,
  MapPin,
  Check,
  X as XIcon,
  Train,
  Bus,
  Store,
  ShoppingCart,
  Landmark,
  Building2,
  Pill,
  Car,
  Share2,
  FileText,
  ClipboardList,
  Camera,
  Trees,
} from 'lucide-react';
import { toast } from 'sonner';
import { Drawer } from 'vaul';
import useEmblaCarousel from 'embla-carousel-react';
import { propertyApi } from '@/api/property';
import { RatingStars } from '@/components/RatingStars';
import { ConfirmModal } from '@/components/ConfirmModal';
import { Spinner } from '@/components/Spinner';
import { cn, formatPrice, normalizeProperty } from '@/lib/utils';

// ─── 상수 ────────────────────────────────────────────────────────────────────

const PRICE_TYPE_LABELS = {
  MONTHLY_RENT: '월세',
  MONTHLY: '월세',
  JEONSE: '전세',
  SALE: '매매',
};

const PRICE_RATING_LABELS = {
  CHEAP: '저렴',
  REASONABLE: '적정',
  EXPENSIVE: '비쌈',
};

const PARKING_LABELS = {
  AVAILABLE: '가능',
  NOT_AVAILABLE: '불가',
  CONDITIONAL: '조건부',
};

const ENVIRONMENT_LABELS = {
  QUIET: '조용함',
  BUSY_AREA: '번화가',
  RESIDENTIAL: '주택가',
  COMMERCIAL: '상업지구',
  NEAR_PARK: '공원인접',
  NEAR_MOUNTAIN: '산인접',
  NEAR_RIVER: '하천인접',
  GREEN_LACK: '녹지부족',
  MAIN_ROAD: '대로변',
  ALLEY: '골목안',
  UNDER_CONSTRUCTION: '공사중',
  NEAR_SCHOOL: '학교인근',
};

// 카테고리별 아이콘 + 색상
const CATEGORY_CONFIG = {
  CS2: { Icon: Store, bg: 'bg-emerald-50', text: 'text-emerald-600' },
  MT1: { Icon: ShoppingCart, bg: 'bg-orange-50', text: 'text-orange-600' },
  BK9: { Icon: Landmark, bg: 'bg-blue-50', text: 'text-blue-600' },
  HP8: { Icon: Building2, bg: 'bg-red-50', text: 'text-red-500' },
  PM9: { Icon: Pill, bg: 'bg-purple-50', text: 'text-purple-600' },
};

// ─── 유틸 ────────────────────────────────────────────────────────────────────

const getWalkTime = (distanceM) => Math.ceil(distanceM / 80);

const formatCreatedAt = (dateStr) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const renderHeroPrice = (property) => {
  const { priceType, deposit, monthlyRent, salePrice } = property;
  const label = PRICE_TYPE_LABELS[priceType] ?? '';
  switch (priceType) {
    case 'MONTHLY_RENT':
    case 'MONTHLY':
      return `${label} ${formatPrice(deposit)}/${formatPrice(monthlyRent)}`;
    case 'JEONSE':
      return `${label} ${formatPrice(deposit)}`;
    case 'SALE':
      return `${label} ${formatPrice(salePrice)}`;
    default:
      return '가격 정보 없음';
  }
};

// ─── 히어로 갤러리 ────────────────────────────────────────────────────────────

const HeroGallery = ({ images, property }) => {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: false });
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (!emblaApi) return;
    const onSelect = () => setCurrentIndex(emblaApi.selectedScrollSnap());
    emblaApi.on('select', onSelect);
    return () => emblaApi.off('select', onSelect);
  }, [emblaApi]);

  const hasImages = images?.length > 0;

  return (
    <div className="relative h-[280px] overflow-hidden">
      {hasImages ? (
        <div ref={emblaRef} className="h-full overflow-hidden">
          <div className="flex h-full">
            {images.map((img, i) => (
              <div key={img.id ?? i} className="min-w-0 h-full flex-[0_0_100%]">
                <img
                  src={img.url}
                  alt={`매물 사진 ${i + 1}`}
                  loading="lazy"
                  className="h-full w-full object-cover"
                />
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-slate-100">
          <div className="flex flex-col items-center gap-2 text-slate-300">
            <ImageOff size={40} />
            <span className="text-sm">사진 없음</span>
          </div>
        </div>
      )}

      {/* 그라데이션 오버레이 */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent pointer-events-none" />

      {/* 하단 텍스트 오버레이 */}
      <div className="absolute bottom-0 left-0 right-0 p-5">
        <div className="flex items-center gap-1.5 mb-1">
          <MapPin size={13} className="flex-shrink-0 text-white/70" />
          <p className="text-sm text-white/80 truncate">{property.address}</p>
        </div>
        <p className="text-2xl font-bold text-emerald-300 leading-tight">
          {renderHeroPrice(property)}
        </p>
        <div className="mt-1.5 flex items-center gap-2">
          <RatingStars rating={property.rating ?? 0} readOnly size="sm" />
          <span className="text-xs text-white/70">
            {[
              property.area && `${property.area}㎡`,
              property.floor && `${property.floor}${property.totalFloors ? `/${property.totalFloors}` : ''}층`,
            ]
              .filter(Boolean)
              .join(' · ')}
          </span>
        </div>
      </div>

      {/* 페이지 인디케이터 */}
      {hasImages && images.length > 1 && (
        <div className="absolute right-3 top-14 rounded-full bg-black/50 px-2.5 py-1 text-xs text-white">
          {currentIndex + 1} / {images.length}
        </div>
      )}
    </div>
  );
};

// ─── 섹션 래퍼 ───────────────────────────────────────────────────────────────

const Section = ({ icon: Icon, title, iconColor = 'text-slate-600', children, className }) => (
  <div className={cn('border-t border-slate-100 pt-5 mt-5', className)}>
    <div className="flex items-center gap-2 mb-4">
      {Icon && <Icon size={20} className={iconColor} />}
      <h2 className="text-base font-bold text-slate-800">{title}</h2>
    </div>
    {children}
  </div>
);

// ─── 메인 페이지 ─────────────────────────────────────────────────────────────

const PropertyDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [menuOpen, setMenuOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const { data: property, isLoading, isError } = useQuery({
    queryKey: ['property-detail', id],
    queryFn: () => propertyApi.getDetail(id).then((r) => normalizeProperty(r.data)),
    staleTime: 5 * 60 * 1000,
  });

  const { mutate: deleteProperty, isPending: isDeleting } = useMutation({
    mutationFn: () => propertyApi.delete(id),
    onSuccess: () => {
      toast.success('매물이 삭제되었어요.');
      queryClient.invalidateQueries({ queryKey: ['properties-recent'] });
      queryClient.invalidateQueries({ queryKey: ['properties-timeline'] });
      navigate('/', { replace: true });
    },
    onError: () => toast.error('삭제에 실패했어요.'),
  });

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner />
      </div>
    );
  }

  if (isError || !property) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-5 text-center">
        <p className="text-slate-600">매물 정보를 불러올 수 없어요.</p>
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="flex h-12 items-center gap-2 rounded-xl bg-primary px-6 font-semibold text-white"
        >
          <ChevronLeft size={18} />
          돌아가기
        </button>
      </div>
    );
  }

  const environments = property.environments ?? [];
  const locationInfo = property.locationInfo ?? null;
  const amenities = locationInfo?.amenities ?? [];

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try { await navigator.share({ title: property.address, url }); } catch {}
    } else {
      try {
        await navigator.clipboard.writeText(url);
        toast.success('링크가 복사되었어요.');
      } catch {
        toast.error('공유 기능을 사용할 수 없어요.');
      }
    }
  };

  return (
    <div className="min-h-screen bg-white pb-24">
      {/* 헤더 (이미지 위 절대 배치) */}
      <div className="absolute left-0 right-0 top-0 z-10 flex items-center justify-between px-4 py-3">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-white/80 backdrop-blur-sm shadow-sm active:scale-95 transition-all"
        >
          <ChevronLeft size={22} className="text-slate-700" />
        </button>
        <button
          type="button"
          onClick={() => setMenuOpen(true)}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-white/80 backdrop-blur-sm shadow-sm active:scale-95 transition-all"
        >
          <MoreVertical size={22} className="text-slate-700" />
        </button>
      </div>

      {/* 히어로 이미지 */}
      <HeroGallery images={property.images} property={property} />

      {/* 본문 */}
      <div className="px-5 pt-4">

        {/* 공유하기 버튼 */}
        <button
          type="button"
          onClick={handleShare}
          className="flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-slate-200 text-sm font-medium text-slate-600 active:bg-slate-50 transition-colors"
        >
          <Share2 size={15} />
          공유하기
        </button>

        {/* 교통 정보 섹션 */}
        {locationInfo && (
          <Section icon={Bus} title="교통 정보" iconColor="text-blue-600">
            <div className="space-y-3">
              {/* 지하철 카드 */}
              <div className="flex items-center gap-3 rounded-2xl bg-slate-50 p-4">
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-blue-100">
                  <Train size={20} className="text-blue-600" />
                </div>
                <div className="min-w-0 flex-1">
                  {locationInfo.subway ? (
                    <>
                      <p className="font-semibold text-slate-800 truncate">
                        {locationInfo.subway.nearestStation}
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        도보 {locationInfo.subway.walkTime}분 · {locationInfo.subway.distance}m
                      </p>
                    </>
                  ) : (
                    <p className="text-sm text-slate-400">지하철 정보 없음</p>
                  )}
                </div>
              </div>

              {/* 버스 카드 */}
              <div className="flex items-center gap-3 rounded-2xl bg-slate-50 p-4">
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-green-100">
                  <Bus size={20} className="text-green-600" />
                </div>
                <div className="min-w-0 flex-1">
                  {locationInfo.bus ? (
                    <>
                      <p className="font-semibold text-slate-800 truncate">
                        {locationInfo.bus.nearestStop}
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5">{locationInfo.bus.distance}m</p>
                    </>
                  ) : (
                    <p className="text-sm text-slate-400">버스 정보 없음</p>
                  )}
                </div>
              </div>
            </div>
          </Section>
        )}

        {/* 편의시설 섹션 */}
        {amenities.length > 0 && (
          <Section icon={Store} title="편의시설" iconColor="text-emerald-600">
            <div className="divide-y divide-slate-50">
              {amenities.map((a) => {
                const cfg = CATEGORY_CONFIG[a.categoryCode] ?? { Icon: Building2, bg: 'bg-slate-50', text: 'text-slate-500' };
                const walkMin = getWalkTime(a.nearestDistance);
                return (
                  <div key={a.categoryCode} className="flex items-start gap-3 py-3 first:pt-0 last:pb-0">
                    <div className={cn('flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full', cfg.bg)}>
                      <cfg.Icon size={18} className={cfg.text} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-semibold text-sm text-slate-800">{a.category}</span>
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600 flex-shrink-0">
                          {a.count}개
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5 truncate">{a.nearestName}</p>
                      <p className="text-xs text-slate-400">도보 {walkMin}분</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </Section>
        )}

        {/* 체크리스트 검토 섹션 */}
        <Section icon={ClipboardList} title="체크리스트 검토" iconColor="text-amber-600">
          <div className="space-y-1">
            {/* 즉시 입주 */}
            <div className="flex items-center gap-2.5 py-2">
              <div className={cn('flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full',
                property.canMoveIn ? 'bg-emerald-100' : 'bg-red-100')}>
                {property.canMoveIn
                  ? <Check size={13} className="text-emerald-600" />
                  : <XIcon size={13} className="text-red-500" />}
              </div>
              <span className="text-sm text-slate-700">
                {property.canMoveIn ? '즉시 입주 가능' : '입주 불가'}
              </span>
            </div>

            {/* 재방문 의사 */}
            <div className="flex items-center gap-2.5 py-2">
              <div className={cn('flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full',
                property.revisitWanted ? 'bg-emerald-100' : 'bg-red-100')}>
                {property.revisitWanted
                  ? <Check size={13} className="text-emerald-600" />
                  : <XIcon size={13} className="text-red-500" />}
              </div>
              <span className="text-sm text-slate-700">
                {property.revisitWanted ? '재방문 의사 있음' : '재방문 의사 없음'}
              </span>
            </div>

            {/* 가격 평가 */}
            {property.priceRating && (
              <div className="flex items-center gap-2.5 py-2">
                <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-amber-100">
                  <span className="text-xs">🏷</span>
                </div>
                <span className="text-sm text-slate-700">
                  가격 {PRICE_RATING_LABELS[property.priceRating] ?? property.priceRating}
                </span>
              </div>
            )}

            {/* 주차 */}
            {property.parkingType && PARKING_LABELS[property.parkingType] && (
              <div className="flex items-center gap-2.5 py-2">
                <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-slate-100">
                  <Car size={13} className="text-slate-500" />
                </div>
                <span className="text-sm text-slate-700">
                  주차 {PARKING_LABELS[property.parkingType]}
                </span>
              </div>
            )}

            {/* 관리비 */}
            {property.maintenanceFee != null && (
              <div className="flex items-center gap-2.5 py-2">
                <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-slate-100">
                  <span className="text-xs">💰</span>
                </div>
                <span className="text-sm text-slate-700">
                  관리비 {property.maintenanceFee > 0 ? `${property.maintenanceFee}만원` : '없음'}
                </span>
              </div>
            )}
          </div>

          {/* 수정 버튼 */}
          <button
            type="button"
            onClick={() => navigate(`/properties/${id}/edit`)}
            className="mt-4 flex h-10 w-full items-center justify-center gap-2 rounded-full border border-primary text-sm font-medium text-primary active:bg-primary-50 transition-colors"
          >
            <Edit3 size={14} />
            체크리스트 수정하기
          </button>
        </Section>

        {/* 주변환경 섹션 */}
        {environments.length > 0 && (
          <Section icon={Trees} title="주변환경" iconColor="text-green-600">
            <div className="flex flex-wrap gap-2">
              {environments.map((env) => (
                <span
                  key={env}
                  className="rounded-full bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary border border-primary/20"
                >
                  ✓ {ENVIRONMENT_LABELS[env] ?? env}
                </span>
              ))}
            </div>
          </Section>
        )}

        {/* 메모 섹션 */}
        {property.memo && (
          <Section icon={FileText} title="메모" iconColor="text-slate-600">
            <div className="rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
              {property.memo}
            </div>
          </Section>
        )}

        {/* 사진 그리드 섹션 */}
        {property.images?.length > 0 && (
          <Section icon={Camera} title={`사진 (${property.images.length}장)`} iconColor="text-indigo-600">
            <div className="grid grid-cols-3 gap-2">
              {property.images.map((img, i) => (
                <div key={img.id ?? i} className="aspect-square overflow-hidden rounded-xl bg-slate-100">
                  <img
                    src={img.url}
                    alt={`사진 ${i + 1}`}
                    loading="lazy"
                    className="h-full w-full object-cover"
                  />
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* 방문일 */}
        <div className="border-t border-slate-100 mt-5 pt-4 pb-2">
          <p className="text-xs text-slate-400 text-center">
            📅 방문일: {formatCreatedAt(property.visitedAt)}
          </p>
        </div>
      </div>

      {/* 액션 메뉴 Drawer */}
      <Drawer.Root open={menuOpen} onOpenChange={setMenuOpen}>
        <Drawer.Portal>
          <Drawer.Overlay className="fixed inset-0 z-[90] bg-black/40" />
          <Drawer.Content className="fixed bottom-0 left-1/2 z-[91] w-full max-w-app -translate-x-1/2 rounded-t-2xl bg-white px-5 pb-safe pt-4">
            <Drawer.Handle className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-slate-300" />
            <div className="space-y-2 pb-2">
              <button
                type="button"
                onClick={() => { setMenuOpen(false); navigate(`/properties/${id}/edit`); }}
                className="flex h-14 w-full items-center gap-3 rounded-xl px-4 text-slate-700 active:bg-slate-50"
              >
                <Edit3 size={20} className="text-slate-500" />
                <span className="font-medium">수정하기</span>
              </button>
              <button
                type="button"
                onClick={() => { setMenuOpen(false); setDeleteOpen(true); }}
                className="flex h-14 w-full items-center gap-3 rounded-xl px-4 text-danger active:bg-red-50"
              >
                <Trash2 size={20} />
                <span className="font-medium">삭제하기</span>
              </button>
            </div>
          </Drawer.Content>
        </Drawer.Portal>
      </Drawer.Root>

      {/* 삭제 확인 모달 */}
      <ConfirmModal
        isOpen={deleteOpen}
        title="매물을 삭제할까요?"
        message="삭제된 매물은 복구할 수 없어요."
        confirmText={isDeleting ? '삭제 중...' : '삭제'}
        onConfirm={deleteProperty}
        onCancel={() => setDeleteOpen(false)}
      />
    </div>
  );
};

export default PropertyDetailPage;
