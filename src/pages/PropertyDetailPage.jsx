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

const CHECK_LABELS = {
  sunlight: '채광',
  ventilation: '환기',
  noise: '소음 없음',
  waterPressure: '수압 양호',
  parking: '주차 가능',
  elevator: '엘리베이터',
  delivery: '택배 수령',
  security: '보안 양호',
};

const SURROUNDING_LABELS = {
  SUBWAY: '지하철',
  BUS: '버스',
  MART: '마트',
  SCHOOL: '학교',
  PARK: '공원',
  CAFE: '카페',
  HOSPITAL: '병원',
  GYM: '헬스장',
};

const PRICE_RATING_LABELS = {
  CHEAP: { label: '저렴해요', emoji: '😊' },
  REASONABLE: { label: '적당해요', emoji: '😐' },
  EXPENSIVE: { label: '비싸요', emoji: '😮' },
};

const ImageGallery = ({ images }) => {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: false, align: 'start' });
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
      queryClient.invalidateQueries({ queryKey: ['property-stats'] });
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

  const checkedItems = Object.entries(property.checkItems ?? {}).filter(([, v]) => v);
  const priceRating = PRICE_RATING_LABELS[property.priceRating];

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
            <div>
              <p className="font-semibold text-slate-800">{property.address}</p>
              {property.addressDetail && (
                <p className="text-sm text-slate-500">{property.addressDetail}</p>
              )}
            </div>
          </div>
          <p className="mt-1 pl-6 text-xs text-slate-400">
            {getRelativeDate(property.visitedAt)} 방문
          </p>
        </div>

        {/* 가격 + 면적/층수 */}
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

        {/* 배지: 입주 가능 / 재방문 */}
        {(property.canMoveIn || property.revisitWanted) && (
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
          </div>
        )}

        {/* 체크리스트 */}
        {checkedItems.length > 0 && (
          <div className="mb-4">
            <p className="mb-2 text-sm font-semibold text-slate-700">체크리스트</p>
            <div className="grid grid-cols-2 gap-2">
              {checkedItems.map(([key]) => (
                <div
                  key={key}
                  className="flex items-center gap-2 rounded-xl border border-primary/20 bg-primary-50 px-3 py-2"
                >
                  <Check size={14} className="text-primary" />
                  <span className="text-xs font-medium text-primary">
                    {CHECK_LABELS[key] ?? key}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 주변 시설 */}
        {property.surroundings?.length > 0 && (
          <div className="mb-4">
            <p className="mb-2 text-sm font-semibold text-slate-700">주변 시설</p>
            <div className="flex flex-wrap gap-2">
              {property.surroundings.map((s) => (
                <span
                  key={s}
                  className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-600"
                >
                  {SURROUNDING_LABELS[s] ?? s}
                </span>
              ))}
            </div>
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
