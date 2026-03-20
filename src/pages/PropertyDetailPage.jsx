import { useState } from 'react';
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
  FileText,
  Train,
  Bus,
  Store,
  ShoppingCart,
  Landmark,
  Hospital,
  Pill,
  Car,
  Building2,
} from 'lucide-react';
import { toast } from 'sonner';
import { Drawer } from 'vaul';
import useEmblaCarousel from 'embla-carousel-react';
import { propertyApi } from '@/api/property';
import { PriceDisplay } from '@/components/PriceDisplay';
import { RatingStars } from '@/components/RatingStars';
import { ConfirmModal } from '@/components/ConfirmModal';
import { Spinner } from '@/components/Spinner';
import { cn, getRelativeDate, normalizeProperty } from '@/lib/utils';

const PRICE_RATING_LABELS = {
  CHEAP: { label: '저렴해요', emoji: '😊' },
  REASONABLE: { label: '적정해요', emoji: '😐' },
  EXPENSIVE: { label: '비싸요', emoji: '😮' },
};

const PARKING_LABELS = {
  AVAILABLE: '주차 가능',
  NOT_AVAILABLE: '주차 불가',
  CONDITIONAL: '조건부 주차',
  UNKNOWN: null,
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
  HP8: Hospital,
  PM9: Pill,
};

const getCategoryIcon = (code) => {
  const Icon = CATEGORY_ICONS[code] ?? Building2;
  return Icon;
};

const ImageGallery = ({ images }) => {
  const [emblaRef] = useEmblaCarousel({ loop: false, align: 'start' });
  const [currentIndex, setCurrentIndex] = useState(0);

  if (!images?.length) {
    return (
      <div className="flex aspect-[4/3] w-full items-center justify-center bg-slate-100">
        <div className="flex flex-col items-center gap-2 text-slate-300">
          <ImageOff size={40} />
          <span className="text-sm">사진 없음</span>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      <div ref={emblaRef} className="overflow-hidden">
        <div className="flex">
          {images.map((img, i) => (
            <div key={img.id ?? i} className="min-w-0 flex-[0_0_100%]">
              <img
                src={img.url}
                alt={`매물 사진 ${i + 1}`}
                loading="lazy"
                className="aspect-[4/3] w-full object-cover"
              />
            </div>
          ))}
        </div>
      </div>
      {images.length > 1 && (
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full bg-black/50 px-3 py-1 text-xs text-white">
          {currentIndex + 1} / {images.length}
        </div>
      )}
    </div>
  );
};

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

  const priceRating = PRICE_RATING_LABELS[property.priceRating];
  const parkingLabel = property.parkingType ? PARKING_LABELS[property.parkingType] : null;
  const environments = property.environments ?? [];
  const locationInfo = property.locationInfo ?? null;

  return (
    <div className="min-h-screen bg-white pb-24">
      {/* 헤더 */}
      <div className="absolute left-0 right-0 top-0 z-10 flex items-center justify-between px-4 py-3">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-white/80 backdrop-blur-sm shadow-sm active:scale-95"
        >
          <ChevronLeft size={22} className="text-slate-700" />
        </button>
        <button
          type="button"
          onClick={() => setMenuOpen(true)}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-white/80 backdrop-blur-sm shadow-sm active:scale-95"
        >
          <MoreVertical size={22} className="text-slate-700" />
        </button>
      </div>

      {/* 이미지 갤러리 */}
      <ImageGallery images={property.images} />

      {/* 기본 정보 */}
      <div className="px-5 pt-5">
        {/* 주소 + 방문일 */}
        <div className="mb-4">
          <div className="flex items-start gap-1.5">
            <MapPin size={16} className="mt-0.5 flex-shrink-0 text-primary" />
            <p className="font-semibold text-slate-800">{property.address}</p>
          </div>
          <p className="mt-1 pl-6 text-xs text-slate-400">
            {getRelativeDate(property.visitedAt)} 방문
          </p>
        </div>

        {/* 가격 + 면적/층수/관리비 */}
        <div className="mb-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <PriceDisplay
            priceType={property.priceType}
            deposit={property.deposit}
            monthlyRent={property.monthlyRent}
            salePrice={property.salePrice}
            className="text-lg"
          />
          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-500">
            {property.area && <span>{property.area}㎡</span>}
            {(property.floor ?? property.currentFloor) && (
              <span>
                {property.floor ?? property.currentFloor}층
                {property.totalFloors ? `/${property.totalFloors}층` : ''}
              </span>
            )}
            {property.maintenanceFee > 0 && (
              <span>관리비 {property.maintenanceFee}만원</span>
            )}
          </div>
        </div>

        {/* 별점 + 가격 평가 */}
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="mb-1 text-xs text-slate-500">전체 평가</p>
            <RatingStars rating={property.rating ?? 0} readOnly size="md" />
          </div>
          {priceRating && (
            <div className="flex items-center gap-1 rounded-full border border-slate-200 px-3 py-1.5">
              <span className="text-base">{priceRating.emoji}</span>
              <span className="text-sm font-medium text-slate-600">{priceRating.label}</span>
            </div>
          )}
        </div>

        {/* 배지: 입주 가능 / 재방문 / 주차 */}
        {(property.canMoveIn || property.revisitWanted || parkingLabel) && (
          <div className="mb-4 flex flex-wrap gap-2">
            {property.canMoveIn && (
              <span className="rounded-full bg-primary-50 px-3 py-1 text-xs font-medium text-primary">
                즉시 입주 가능
              </span>
            )}
            {property.revisitWanted && (
              <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-600">
                재방문 의향 있음
              </span>
            )}
            {parkingLabel && (
              <span className="flex items-center gap-1 rounded-full border border-slate-200 px-3 py-1 text-xs font-medium text-slate-600">
                <Car size={12} />
                {parkingLabel}
              </span>
            )}
          </div>
        )}

        {/* 환경 태그 (environments) */}
        {environments.length > 0 && (
          <div className="mb-4">
            <p className="mb-2 text-sm font-semibold text-slate-700">주변 환경</p>
            <div className="flex flex-wrap gap-2">
              {environments.map((env) => (
                <span
                  key={env}
                  className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-600"
                >
                  {ENVIRONMENT_LABELS[env] ?? env}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* 교통 + 주변 시설 (locationInfo) */}
        {locationInfo && (
          <div className="mb-4 rounded-2xl border border-slate-200 bg-white p-4 space-y-3">
            <p className="text-sm font-semibold text-slate-700">교통 및 주변 시설</p>

            {/* 지하철 */}
            {locationInfo.subway && (
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-blue-50">
                  <Train size={16} className="text-blue-500" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-medium text-slate-700 truncate">
                    {locationInfo.subway.nearestStation}
                  </p>
                  <p className="text-xs text-slate-400">
                    {locationInfo.subway.distance}m · 도보 {locationInfo.subway.walkTime}분
                  </p>
                </div>
              </div>
            )}

            {/* 버스 */}
            {locationInfo.bus && (
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-green-50">
                  <Bus size={16} className="text-green-500" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-medium text-slate-700 truncate">
                    {locationInfo.bus.nearestStop}
                  </p>
                  <p className="text-xs text-slate-400">{locationInfo.bus.distance}m</p>
                </div>
              </div>
            )}

            {/* 편의시설 */}
            {locationInfo.amenities?.length > 0 && (
              <div className="grid grid-cols-2 gap-2 pt-1">
                {locationInfo.amenities.map((a) => {
                  const Icon = getCategoryIcon(a.categoryCode);
                  return (
                    <div key={a.categoryCode} className="rounded-xl bg-slate-50 p-2.5">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <Icon size={13} className="text-slate-500" />
                        <span className="text-xs font-medium text-slate-700">{a.category}</span>
                        <span className="ml-auto text-xs text-slate-400">주변 {a.count}개</span>
                      </div>
                      <p className="text-xs text-slate-500 truncate">
                        {a.nearestName} <span className="text-slate-400">{a.nearestDistance}m</span>
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* 메모 */}
        {property.memo && (
          <div className="mb-4">
            <div className="flex items-center gap-1.5 mb-2">
              <FileText size={14} className="text-slate-500" />
              <p className="text-sm font-semibold text-slate-700">메모</p>
            </div>
            <div className="rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
              {property.memo}
            </div>
          </div>
        )}
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
                onClick={() => {
                  setMenuOpen(false);
                  navigate(`/properties/${id}/edit`);
                }}
                className="flex h-14 w-full items-center gap-3 rounded-xl px-4 text-slate-700 active:bg-slate-50"
              >
                <Edit3 size={20} className="text-slate-500" />
                <span className="font-medium">수정하기</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  setDeleteOpen(true);
                }}
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
