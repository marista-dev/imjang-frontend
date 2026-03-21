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
  Tag,
  Wallet,
  CalendarDays,
  ClipboardCheck,
  TreePine,
  Camera,
} from 'lucide-react';
import { toast } from 'sonner';
import { Drawer } from 'vaul';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
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

const CATEGORY_ICONS = {
  CS2: Store,
  MT1: ShoppingCart,
  BK9: Landmark,
  HP8: Building2,
  PM9: Pill,
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
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent pointer-events-none" />

      {/* 하단 텍스트 오버레이 */}
      <div className="absolute bottom-0 left-0 right-0 p-5">
        <div className="flex items-center gap-1.5 mb-1.5">
          <MapPin size={13} className="flex-shrink-0 text-white/60" />
          <p className="text-sm text-white/75 truncate">{property.address}</p>
        </div>
        <p className="text-xl font-bold text-white leading-tight">
          {renderHeroPrice(property)}
        </p>
        <div className="mt-2 flex items-center gap-2">
          <RatingStars rating={property.rating ?? 0} readOnly size="sm" />
          <span className="text-xs text-white/60">
            {[
              property.area && `${property.area}㎡`,
              property.floor && `${property.floor}${property.totalFloors ? `/${property.totalFloors}` : ''}층`,
            ]
              .filter(Boolean)
              .join(' · ')}
          </span>
        </div>
      </div>

      {/* 페이지 인디케이터 — 하단 중앙 dot */}
      {hasImages && images.length > 1 && (
        <div className="absolute bottom-20 left-1/2 z-10 -translate-x-1/2 flex items-center gap-1.5">
          {images.map((_, i) => (
            <span
              key={i}
              className={cn(
                'h-1.5 rounded-full transition-all',
                i === currentIndex ? 'w-4 bg-white' : 'w-1.5 bg-white/50',
              )}
            />
          ))}
        </div>
      )}
    </div>
  );
};

// ─── 섹션 래퍼 ───────────────────────────────────────────────────────────────

const Section = ({ icon: Icon, title, iconColor = 'text-slate-500', children, className }) => (
  <div className={cn('border-t border-slate-100 pt-5 mt-5', className)}>
    {title && (
      <div className="flex items-center gap-2 mb-4">
        {Icon && <Icon size={20} className={iconColor} />}
        <h2 className="text-base font-bold text-slate-800">{title}</h2>
      </div>
    )}
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
  const [photoViewerIdx, setPhotoViewerIdx] = useState(null);

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
    <div className="min-h-screen bg-white pb-24 animate-fade-in-up">
      {/* 헤더 */}
      <div className="absolute left-0 right-0 top-0 z-10 flex items-center justify-between px-4 py-3">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="flex h-11 w-11 items-center justify-center rounded-full bg-white/80 backdrop-blur-sm shadow-sm active:scale-95 transition-all"
        >
          <ChevronLeft size={22} className="text-slate-700" />
        </button>
        <button
          type="button"
          onClick={() => setMenuOpen(true)}
          className="flex h-11 w-11 items-center justify-center rounded-full bg-white/80 backdrop-blur-sm shadow-sm active:scale-95 transition-all"
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
          className="mb-5 flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-slate-200 text-sm text-slate-600 active:bg-slate-50 transition-colors"
        >
          <Share2 size={16} />
          공유하기
        </button>

        {/* 교통 정보 */}
        {locationInfo && (
          <Section icon={Train} title="교통 정보" iconColor="text-blue-500">
            <div className="space-y-2.5">
              {/* 지하철 */}
              <div className="flex items-center gap-3 rounded-xl bg-slate-50 px-4 py-3">
                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-white">
                  <Train size={16} className="text-slate-500" />
                </div>
                <div className="min-w-0">
                  {locationInfo.subway ? (
                    <>
                      <p className="text-sm font-medium text-slate-800 truncate">
                        {locationInfo.subway.nearestStation}
                      </p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        도보 {locationInfo.subway.walkTime}분 · {locationInfo.subway.distance}m
                      </p>
                    </>
                  ) : (
                    <p className="text-sm text-slate-400">지하철 정보 없음</p>
                  )}
                </div>
              </div>

              {/* 버스 */}
              <div className="flex items-center gap-3 rounded-xl bg-slate-50 px-4 py-3">
                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-white">
                  <Bus size={16} className="text-slate-500" />
                </div>
                <div className="min-w-0">
                  {locationInfo.bus ? (
                    <>
                      <p className="text-sm font-medium text-slate-800 truncate">
                        {locationInfo.bus.nearestStop}
                      </p>
                      <p className="text-xs text-slate-400 mt-0.5">{locationInfo.bus.distance}m</p>
                    </>
                  ) : (
                    <p className="text-sm text-slate-400">버스 정보 없음</p>
                  )}
                </div>
              </div>
            </div>
          </Section>
        )}

        {/* 편의시설 */}
        {amenities.length > 0 && (
          <Section icon={Store} title="편의시설" iconColor="text-emerald-600">
            <div className="divide-y divide-slate-100">
              {amenities.map((a) => {
                const Icon = CATEGORY_ICONS[a.categoryCode] ?? Building2;
                const walkMin = getWalkTime(a.nearestDistance);
                return (
                  <div key={a.categoryCode} className="flex items-start gap-3 py-3 first:pt-0 last:pb-0">
                    <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-slate-100">
                      <Icon size={17} className="text-slate-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold text-slate-800">{a.category}</span>
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500">{a.count}개</span>
                      </div>
                      <p className="mt-0.5 truncate text-xs text-slate-500">{a.nearestName}</p>
                      <p className="text-xs text-slate-400">도보 {walkMin}분</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </Section>
        )}

        {/* 체크리스트 */}
        <Section icon={ClipboardCheck} title="체크리스트 검토" iconColor="text-amber-500">
          <div className="space-y-1">
            {/* 즉시 입주 */}
            <div className="flex items-center gap-2.5 py-2.5">
              <div className={cn('flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full',
                property.canMoveIn ? 'bg-emerald-100' : 'bg-red-100')}>
                {property.canMoveIn
                  ? <Check size={14} className="text-emerald-600" />
                  : <XIcon size={14} className="text-red-500" />}
              </div>
              <span className="text-sm text-slate-700">
                즉시 입주 {property.canMoveIn ? '가능' : '불가'}
              </span>
            </div>

            {/* 재방문 의사 */}
            <div className="flex items-center gap-2.5 py-2.5">
              <div className={cn('flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full',
                property.revisitWanted ? 'bg-emerald-100' : 'bg-red-100')}>
                {property.revisitWanted
                  ? <Check size={14} className="text-emerald-600" />
                  : <XIcon size={14} className="text-red-500" />}
              </div>
              <span className="text-sm text-slate-700">
                재방문 의사 {property.revisitWanted ? '있음' : '없음'}
              </span>
            </div>

            {/* 가격 평가 */}
            {property.priceRating && (
              <div className="flex items-center gap-2.5 py-2.5">
                <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-slate-100">
                  <Tag size={14} className="text-slate-600" />
                </div>
                <span className="text-sm text-slate-700">
                  가격 {PRICE_RATING_LABELS[property.priceRating]}
                </span>
              </div>
            )}

            {/* 주차 */}
            {property.parkingType && PARKING_LABELS[property.parkingType] && (
              <div className="flex items-center gap-2.5 py-2.5">
                <div className={cn('flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full',
                  property.parkingType === 'AVAILABLE' ? 'bg-emerald-100'
                  : property.parkingType === 'NOT_AVAILABLE' ? 'bg-red-100'
                  : 'bg-slate-100')}>
                  {property.parkingType === 'NOT_AVAILABLE'
                    ? <XIcon size={14} className="text-red-500" />
                    : <Car size={14} className={property.parkingType === 'AVAILABLE' ? 'text-emerald-600' : 'text-slate-600'} />}
                </div>
                <span className="text-sm text-slate-700">
                  주차 {PARKING_LABELS[property.parkingType]}
                </span>
              </div>
            )}

            {/* 관리비 */}
            {property.maintenanceFee != null && (
              <div className="flex items-center gap-2.5 py-2.5">
                <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-slate-100">
                  <Wallet size={14} className="text-slate-600" />
                </div>
                <span className="text-sm text-slate-700">
                  관리비 {property.maintenanceFee > 0 ? `${property.maintenanceFee}만원` : '없음'}
                </span>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={() => navigate(`/properties/${id}/edit`)}
            className="mt-4 flex h-10 w-full items-center justify-center gap-1.5 rounded-xl border border-slate-200 text-sm text-slate-500 active:bg-slate-50 transition-colors"
          >
            <Edit3 size={14} />
            수정하기
          </button>
        </Section>

        {/* 주변환경 */}
        {environments.length > 0 && (
          <Section icon={TreePine} title="주변환경" iconColor="text-green-600">
            <div className="flex flex-wrap gap-2">
              {environments.map((env) => (
                <span
                  key={env}
                  className="rounded-full border border-primary/20 bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary"
                >
                  {ENVIRONMENT_LABELS[env] ?? env}
                </span>
              ))}
            </div>
          </Section>
        )}

        {/* 메모 */}
        {property.memo && (
          <Section icon={FileText} title="메모" iconColor="text-slate-500">
            <div className="rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
              {property.memo}
            </div>
          </Section>
        )}

        {/* 사진 */}
        {property.images?.length > 0 && (
          <Section icon={Camera} title={`사진 ${property.images.length}장`} iconColor="text-indigo-500">
            <div className="grid grid-cols-3 gap-1.5">
              {property.images.map((img, i) => (
                <button
                  key={img.id ?? i}
                  type="button"
                  onClick={() => setPhotoViewerIdx(i)}
                  className="aspect-square overflow-hidden rounded-xl bg-slate-100"
                >
                  <img
                    src={img.url}
                    alt={`사진 ${i + 1}`}
                    loading="lazy"
                    className="h-full w-full object-cover"
                  />
                </button>
              ))}
            </div>
          </Section>
        )}

        {/* 방문일 */}
        {property.visitedAt && (
          <div className="mt-6 border-t border-slate-100 pt-4 pb-2 text-center">
            <div className="flex items-center justify-center gap-1.5 text-xs text-slate-400">
              <CalendarDays size={13} />
              <span>방문일: {formatCreatedAt(property.visitedAt)}</span>
            </div>
          </div>
        )}

        <div className="mt-2 pb-2" />
      </div>

      {/* 액션 Drawer */}
      <Drawer.Root open={menuOpen} onOpenChange={setMenuOpen}>
        <Drawer.Portal>
          <Drawer.Overlay className="fixed inset-0 z-[90] bg-black/40" />
          <Drawer.Content className="fixed bottom-0 left-0 right-0 z-[91] mx-auto w-full max-w-app rounded-t-2xl bg-white px-5 pb-safe pt-4">
            <VisuallyHidden><Drawer.Title>매물 관리</Drawer.Title></VisuallyHidden>
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

      <ConfirmModal
        isOpen={deleteOpen}
        title="매물을 삭제할까요?"
        message="삭제된 매물은 복구할 수 없어요."
        confirmText={isDeleting ? '삭제 중...' : '삭제'}
        onConfirm={deleteProperty}
        onCancel={() => setDeleteOpen(false)}
      />

      {/* 사진 전체화면 뷰어 */}
      {photoViewerIdx !== null && property.images?.length > 0 && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black">
          <button
            type="button"
            onClick={() => setPhotoViewerIdx(null)}
            className="absolute right-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/20 text-white"
          >
            <XIcon size={22} />
          </button>
          <p className="absolute top-4 left-1/2 z-10 -translate-x-1/2 text-sm text-white/70">
            {photoViewerIdx + 1} / {property.images.length}
          </p>
          <img
            src={property.images[photoViewerIdx].url}
            alt={`사진 ${photoViewerIdx + 1}`}
            className="max-h-full max-w-full object-contain"
          />
          {photoViewerIdx > 0 && (
            <button
              type="button"
              onClick={() => setPhotoViewerIdx((i) => i - 1)}
              className="absolute left-3 top-1/2 z-10 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full bg-white/20 text-white"
            >
              <ChevronLeft size={24} />
            </button>
          )}
          {photoViewerIdx < property.images.length - 1 && (
            <button
              type="button"
              onClick={() => setPhotoViewerIdx((i) => i + 1)}
              className="absolute right-3 top-1/2 z-10 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full bg-white/20 text-white rotate-180"
            >
              <ChevronLeft size={24} />
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default PropertyDetailPage;
