import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ChevronLeft, ImagePlus, X, MapPin } from 'lucide-react';
import { toast } from 'sonner';
import * as Switch from '@radix-ui/react-switch';
import * as Tabs from '@radix-ui/react-tabs';
import { propertyApi } from '@/api/property';
import { imageApi } from '@/api/image';
import { RatingStars } from '@/components/RatingStars';
import { Spinner } from '@/components/Spinner';
import { ConfirmModal } from '@/components/ConfirmModal';
import { cn, getImageUrl } from '@/lib/utils';
import { Section, SectionTitle, ChipButton, PriceInputWithHint } from '@/components/FormSection';

const PRICE_TYPES = [
  { value: 'MONTHLY', label: '월세' },
  { value: 'JEONSE', label: '전세' },
  { value: 'SALE', label: '매매' },
];

const PRICE_RATINGS = [
  { value: 'CHEAP', label: '저렴해요' },
  { value: 'REASONABLE', label: '적당해요' },
  { value: 'EXPENSIVE', label: '비싸요' },
];

const PARKING_OPTIONS = [
  { value: 'AVAILABLE', label: '가능' },
  { value: 'NOT_AVAILABLE', label: '불가' },
  { value: 'CONDITIONAL', label: '조건부' },
];

const openAddressSearch = (onSelect) => {
  if (!window.daum?.Postcode) {
    toast.error('주소 검색 서비스를 불러오는 중이에요.');
    return;
  }
  new window.daum.Postcode({
    oncomplete: (data) => onSelect(data.roadAddress || data.jibunAddress),
  }).open();
};

const EditImageSection = ({ propertyId, images, onImagesChange, onDirty }) => {
  const [uploading, setUploading] = useState(false);

  const handleAdd = async (files) => {
    if (!files?.length) return;
    setUploading(true);
    for (const file of Array.from(files)) {
      if (file.size > 10 * 1024 * 1024) {
        toast.error(`${file.name}: 10MB 이하만 가능해요.`);
        continue;
      }
      try {
        const res = await imageApi.addToProperty(propertyId, file);
        onImagesChange((prev) => [...prev, { id: res.data.imageId, url: getImageUrl(res.data.thumbnailUrl) }]);
        onDirty?.();
      } catch {
        toast.error('이미지 업로드에 실패했어요.');
      }
    }
    setUploading(false);
  };

  const handleDelete = async (imageId) => {
    try {
      await imageApi.deleteFromProperty(propertyId, imageId);
      onImagesChange((prev) => prev.filter((img) => img.id !== imageId));
      onDirty?.();
    } catch {
      toast.error('이미지 삭제에 실패했어요.');
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <SectionTitle>사진</SectionTitle>
        <span className="text-xs text-slate-400">{images.length}/10장</span>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {images.map((img, idx) => (
          <div key={img.id ?? img.url ?? idx} className="relative aspect-square overflow-hidden rounded-xl bg-slate-100">
            <img src={img.url} alt="" loading="lazy" className="h-full w-full object-cover" />
            {img.id && (
              <button
                type="button"
                onClick={() => handleDelete(img.id)}
                className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/50 text-white"
              >
                <X size={14} />
              </button>
            )}
          </div>
        ))}
        {images.length < 10 && (
          <label className="flex aspect-square cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 active:bg-slate-100">
            {uploading ? <Spinner size="sm" /> : <ImagePlus size={24} className="text-slate-400" />}
            <input
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => handleAdd(e.target.files)}
              disabled={uploading}
            />
          </label>
        )}
      </div>
    </div>
  );
};

const PropertyEditPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: property, isLoading } = useQuery({
    queryKey: ['property-edit', id],
    queryFn: () => propertyApi.getDetail(id).then((r) => r.data),
    staleTime: 5 * 60 * 1000,
  });

  const [images, setImages] = useState([]);
  const [address, setAddress] = useState('');
  const [addressDetail, setAddressDetail] = useState('');
  const [priceType, setPriceType] = useState('MONTHLY');
  const [deposit, setDeposit] = useState('');
  const [monthlyRent, setMonthlyRent] = useState('');
  const [price, setPrice] = useState('');
  const [area, setArea] = useState('');
  const [currentFloor, setCurrentFloor] = useState('');
  const [totalFloors, setTotalFloors] = useState('');
  const [rating, setRating] = useState(0);
  const [priceEvaluation, setPriceEvaluation] = useState('');
  const [parkingType, setParkingType] = useState('');
  const [maintenanceFee, setMaintenanceFee] = useState(0);
  const [surroundings, setSurroundings] = useState([]);
  const [moveInAvailable, setMoveInAvailable] = useState(false);
  const [revisitIntention, setRevisitIntention] = useState(false);
  const [memo, setMemo] = useState('');
  const [isDirty, setIsDirty] = useState(false);
  const [leaveConfirmOpen, setLeaveConfirmOpen] = useState(false);

  // 기존 데이터 프리필
  useEffect(() => {
    if (!property) return;
    // 이미지: 백엔드 { imageId, thumbnailUrl, originalUrl } → { id, url }
    setImages((property.images ?? []).map((img) => {
      if (typeof img === 'string') return { id: null, url: getImageUrl(img) };
      return {
        id: img.imageId ?? img.id ?? null,
        url: getImageUrl(img.thumbnailUrl ?? img.url),
      };
    }));
    setAddress(property.address ?? '');
    setAddressDetail(property.addressDetail ?? '');
    setPriceType(property.priceType ?? 'MONTHLY');
    setDeposit(property.deposit != null ? String(property.deposit) : '');
    setMonthlyRent(property.monthlyRent != null ? String(property.monthlyRent) : '');
    setPrice(property.price != null ? String(property.price) : '');
    setArea(property.area != null ? String(property.area) : '');
    setCurrentFloor(property.currentFloor != null ? String(property.currentFloor) : '');
    // 백엔드 응답: totalFloor (단수)
    setTotalFloors(property.totalFloor != null ? String(property.totalFloor) : (property.totalFloors != null ? String(property.totalFloors) : ''));
    setRating(property.rating ?? 0);
    setPriceEvaluation(property.evaluation?.priceEvaluation ?? property.priceEvaluation ?? '');
    setParkingType(property.parkingType ?? '');
    setMaintenanceFee(property.maintenanceFee ?? 0);
    setSurroundings(property.environments ?? property.surroundings ?? []);
    setMoveInAvailable(property.evaluation?.moveInAvailable ?? property.moveInAvailable ?? false);
    setRevisitIntention(property.evaluation?.revisitIntention ?? property.revisitIntention ?? false);
    setMemo(property.memo ?? '');
  }, [property]);

  // 비저장 변경사항 경고: 브라우저 탭 닫기/새로고침
  useEffect(() => {
    if (!isDirty) return;
    const handler = (e) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [isDirty]);

  const markDirty = () => { if (!isDirty) setIsDirty(true); };

  const handleBack = () => {
    if (isDirty) {
      setLeaveConfirmOpen(true);
    } else {
      navigate(-1);
    }
  };

  // dirty 상태를 자동으로 마킹하는 래퍼 헬퍼
  const withDirty = (setter) => (value) => { setter(value); markDirty(); };
  const withDirtyEvent = (setter) => (e) => { setter(e?.target ? e.target.value : e); markDirty(); };

  const { mutate: save, isPending } = useMutation({
    mutationFn: (data) => propertyApi.update(id, data),
    onSuccess: () => {
      setIsDirty(false);
      toast.success('수정이 완료되었어요.');
      queryClient.invalidateQueries({ queryKey: ['property-detail', id] });
      queryClient.invalidateQueries({ queryKey: ['properties-recent'] });
      queryClient.invalidateQueries({ queryKey: ['properties-timeline'] });
      navigate(`/properties/${id}`, { replace: true });
    },
    onError: () => toast.error('수정에 실패했어요. 다시 시도해주세요.'),
  });

  const handleSave = () => {
    save({
      moveInAvailable,
      revisitIntention,
      priceEvaluation: priceEvaluation === 'FAIR' ? 'REASONABLE' : (priceEvaluation || null),
      parkingType: parkingType || 'UNKNOWN',
      maintenanceFee: maintenanceFee ? Number(maintenanceFee) : null,
      environments: surroundings,
      memo: memo || null,
    });
  };

  const numInput = (setter) => (e) => {
    setter(e.target.value.replace(/[^0-9.]/g, ''));
    markDirty();
  };

  const toggleSurrounding = (value) => {
    setSurroundings((prev) =>
      prev.includes(value) ? prev.filter((s) => s !== value) : [...prev, value],
    );
    markDirty();
  };

  // 핸들러 별칭 (인라인 markDirty() 제거용)
  const handleAddressDetail = withDirtyEvent(setAddressDetail);
  const handlePriceType = withDirty(setPriceType);
  const handleRating = withDirty(setRating);
  const handleMoveIn = withDirty(setMoveInAvailable);
  const handleRevisit = withDirty(setRevisitIntention);
  const handleMemo = withDirtyEvent(setMemo);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 animate-fade-in-up">
      {/* 헤더 */}
      <div className="sticky top-0 z-10 border-b border-slate-100 bg-white/95 px-5 py-4 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleBack}
            className="flex h-11 w-11 items-center justify-center rounded-xl text-slate-600 active:bg-slate-100"
          >
            <ChevronLeft size={24} />
          </button>
          <h1 className="flex-1 text-base font-bold text-slate-800">매물 수정</h1>
          <button
            type="button"
            onClick={handleSave}
            disabled={isPending}
            className="flex h-10 items-center rounded-xl bg-primary px-4 text-sm font-semibold text-white disabled:opacity-60 active:scale-[0.98]"
          >
            {isPending ? <Spinner size="sm" className="text-white" /> : '저장'}
          </button>
        </div>
      </div>

      <ConfirmModal
        isOpen={leaveConfirmOpen}
        title="수정 중인 내용이 있어요"
        message="저장하지 않고 나가면 변경 내용이 사라져요."
        confirmText="나가기"
        cancelText="계속 수정"
        onConfirm={() => { setLeaveConfirmOpen(false); navigate(-1); }}
        onCancel={() => setLeaveConfirmOpen(false)}
      />

      {/* 폼 콘텐츠 — NewPage와 동일한 Section 카드 스타일 */}
      <div className="space-y-3 px-5 pt-4 pb-24">
        {/* ── 사진 ──────────────────────────────────────────────── */}
        <Section>
          <EditImageSection propertyId={id} images={images} onImagesChange={setImages} onDirty={markDirty} />
        </Section>

        {/* ── 위치 (읽기 전용) ──────────────────────────────────── */}
        {address && (
          <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3">
            <MapPin size={16} className="flex-shrink-0 text-slate-400" />
            <span className="flex-1 truncate text-base text-slate-700">{address}</span>
          </div>
        )}

        {/* ── 가격 정보 ─────────────────────────────────────────── */}
        <Section>
          <SectionTitle>가격 정보</SectionTitle>

          <div>
            <p className="mb-2 text-base font-medium text-slate-700">유형</p>
            <Tabs.Root value={priceType} onValueChange={handlePriceType}>
              <Tabs.List className="flex rounded-xl bg-slate-100 p-1">
                {PRICE_TYPES.map(({ value, label }) => (
                  <Tabs.Trigger
                    key={value}
                    value={value}
                    className={cn(
                      'flex-1 rounded-lg py-2 text-sm font-semibold transition-all',
                      priceType === value ? 'bg-white text-primary shadow-sm' : 'text-slate-500',
                    )}
                  >
                    {label}
                  </Tabs.Trigger>
                ))}
              </Tabs.List>
            </Tabs.Root>
          </div>

          <div>
            <p className="mb-2 text-base font-medium text-slate-700">가격 (만원)</p>
            {priceType === 'MONTHLY' && (
              <div className="grid grid-cols-2 gap-2">
                <PriceInputWithHint label="보증금" value={deposit} onChange={numInput(setDeposit)} placeholder="1000" />
                <PriceInputWithHint label="월세" value={monthlyRent} onChange={numInput(setMonthlyRent)} placeholder="50" />
              </div>
            )}
            {priceType === 'JEONSE' && (
              <PriceInputWithHint label="전세금" value={deposit} onChange={numInput(setDeposit)} placeholder="30000" />
            )}
            {priceType === 'SALE' && (
              <PriceInputWithHint label="매매가" value={price} onChange={numInput(setPrice)} placeholder="80000" />
            )}
          </div>
        </Section>

        {/* ── 기본 정보 ─────────────────────────────────────────── */}
        <Section>
          <SectionTitle>기본 정보</SectionTitle>

          <div>
            <p className="mb-2 text-base font-medium text-slate-700">평수 (㎡)</p>
            <input type="text" inputMode="decimal" placeholder="예: 33"
              value={area} onChange={numInput(setArea)}
              className="h-12 w-full rounded-xl border border-slate-200 px-4 text-base outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 placeholder:text-slate-400" />
          </div>

          <div>
            <p className="mb-2 text-base font-medium text-slate-700">층수</p>
            <div className="flex items-center gap-2">
              <input type="text" inputMode="numeric" placeholder="현재층"
                value={currentFloor} onChange={numInput(setCurrentFloor)}
                className="h-12 w-full rounded-xl border border-slate-200 px-4 text-base outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 placeholder:text-slate-400" />
              <span className="text-slate-400">/</span>
              <input type="text" inputMode="numeric" placeholder="전체층"
                value={totalFloors} onChange={numInput(setTotalFloors)}
                className="h-12 w-full rounded-xl border border-slate-200 px-4 text-base outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 placeholder:text-slate-400" />
            </div>
          </div>

          <div>
            <p className="mb-2 text-base font-medium text-slate-700">전체 만족도</p>
            <div className="flex items-center gap-3">
              <RatingStars rating={rating} onChange={handleRating} size="lg" />
              {rating > 0 && (
                <span className="text-base text-slate-500">
                  {['', '별로에요', '아쉬워요', '보통이에요', '좋아요', '최고에요'][rating]}
                </span>
              )}
            </div>
          </div>

          <div>
            <p className="mb-2 text-base font-medium text-slate-700">가격 평가</p>
            <div className="flex gap-2">
              {PRICE_RATINGS.map(({ value, label }) => (
                <ChipButton
                  key={value}
                  active={priceEvaluation === value}
                  onClick={() => { setPriceEvaluation((prev) => prev === value ? '' : value); markDirty(); }}
                  className="flex-1"
                >
                  {label}
                </ChipButton>
              ))}
            </div>
          </div>
        </Section>

        {/* ── 매물 환경 ─────────────────────────────────────────── */}
        <Section>
          <SectionTitle>매물 환경</SectionTitle>

          <div>
            <p className="mb-2 text-base font-medium text-slate-700">주차</p>
            <div className="flex gap-2">
              {PARKING_OPTIONS.map(({ value, label }) => (
                <ChipButton
                  key={value}
                  active={parkingType === value}
                  onClick={() => { setParkingType((prev) => prev === value ? '' : value); markDirty(); }}
                  className="flex-1"
                >
                  {label}
                </ChipButton>
              ))}
            </div>
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <p className="text-base font-medium text-slate-700">관리비</p>
              <span className="text-base font-semibold text-primary">
                {maintenanceFee === 0 ? '없음' : `${maintenanceFee}만원`}
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={50}
              step={1}
              value={maintenanceFee}
              onChange={(e) => { setMaintenanceFee(Number(e.target.value)); markDirty(); }}
              className="h-2 w-full cursor-pointer"
              style={{
                background: `linear-gradient(to right, #059669 ${maintenanceFee * 2}%, #E2E8F0 ${maintenanceFee * 2}%)`,
              }}
            />
            <div className="mt-1 flex justify-between text-base text-slate-400">
              <span>0만원</span>
              <span>50만원</span>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3">
              <p className="text-base font-medium text-slate-800">즉시 입주 가능</p>
              <Switch.Root checked={moveInAvailable} onCheckedChange={handleMoveIn}
                className={cn('relative h-6 w-11 rounded-full transition-colors', moveInAvailable ? 'bg-primary' : 'bg-slate-200')}>
                <Switch.Thumb className="block h-5 w-5 translate-x-0.5 rounded-full bg-white shadow transition-transform data-[state=checked]:translate-x-[22px]" />
              </Switch.Root>
            </div>
            <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3">
              <p className="text-base font-medium text-slate-800">재방문 의향 있음</p>
              <Switch.Root checked={revisitIntention} onCheckedChange={handleRevisit}
                className={cn('relative h-6 w-11 rounded-full transition-colors', revisitIntention ? 'bg-primary' : 'bg-slate-200')}>
                <Switch.Thumb className="block h-5 w-5 translate-x-0.5 rounded-full bg-white shadow transition-transform data-[state=checked]:translate-x-[22px]" />
              </Switch.Root>
            </div>
          </div>
        </Section>

        {/* ── 메모 ──────────────────────────────────────────────── */}
        <Section>
          <SectionTitle>메모</SectionTitle>
          <div>
            <textarea
              placeholder="임장 중 느낀 점을 자유롭게 기록하세요..."
              value={memo}
              maxLength={500}
              onChange={handleMemo}
              rows={4}
              className="w-full resize-none rounded-xl border border-slate-200 px-4 py-3 text-base outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 placeholder:text-slate-400"
            />
            <p className="mt-1 text-right text-xs text-slate-400">{memo.length}/500</p>
          </div>
        </Section>
      </div>
    </div>
  );
};

export default PropertyEditPage;
