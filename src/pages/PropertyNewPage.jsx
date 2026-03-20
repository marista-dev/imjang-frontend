import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ChevronLeft, ChevronRight, MapPin, Check } from 'lucide-react';
import { toast } from 'sonner';
import * as Switch from '@radix-ui/react-switch';
import * as Tabs from '@radix-ui/react-tabs';
import { propertyApi } from '@/api/property';
import { imageApi } from '@/api/image';
import { ImageUploader } from '@/components/ImageUploader';
import { StepProgress } from '@/components/StepProgress';
import { RatingStars } from '@/components/RatingStars';
import { Spinner } from '@/components/Spinner';
import { cn } from '@/lib/utils';

const TOTAL_STEPS = 6;
const STEP_LABELS = ['사진', '위치', '가격', '기본 정보', '체크리스트', '메모'];

const PRICE_TYPES = [
  { value: 'MONTHLY_RENT', label: '월세' },
  { value: 'JEONSE', label: '전세' },
  { value: 'SALE', label: '매매' },
];

const PRICE_RATINGS = [
  { value: 'CHEAP', label: '저렴해요', emoji: '😊' },
  { value: 'FAIR', label: '적당해요', emoji: '😐' },
  { value: 'EXPENSIVE', label: '비싸요', emoji: '😮' },
];

const CHECK_ITEMS = [
  { key: 'sunlight', label: '채광' },
  { key: 'ventilation', label: '환기' },
  { key: 'noise', label: '소음 없음' },
  { key: 'waterPressure', label: '수압 양호' },
  { key: 'parking', label: '주차 가능' },
  { key: 'elevator', label: '엘리베이터' },
  { key: 'delivery', label: '택배 수령' },
  { key: 'security', label: '보안 양호' },
];

const SURROUNDINGS = [
  { value: 'SUBWAY', label: '지하철' },
  { value: 'BUS', label: '버스' },
  { value: 'MART', label: '마트' },
  { value: 'SCHOOL', label: '학교' },
  { value: 'PARK', label: '공원' },
  { value: 'CAFE', label: '카페' },
  { value: 'HOSPITAL', label: '병원' },
  { value: 'GYM', label: '헬스장' },
];

const initialFormData = {
  images: [],
  address: '',
  addressDetail: '',
  latitude: null,
  longitude: null,
  priceType: 'MONTHLY_RENT',
  deposit: '',
  monthlyRent: '',
  salePrice: '',
  area: '',
  floor: '',
  totalFloors: '',
  rating: 0,
  priceRating: '',
  checkItems: {},
  surroundings: [],
  canMoveIn: false,
  revisitWanted: false,
  memo: '',
};

// 카카오 주소 검색 열기
const openAddressSearch = (onSelect) => {
  if (!window.daum?.Postcode) {
    toast.error('주소 검색 서비스를 불러오는 중이에요. 잠시 후 다시 시도해주세요.');
    return;
  }
  new window.daum.Postcode({
    oncomplete: (data) => {
      onSelect(data.roadAddress || data.jibunAddress);
    },
  }).open();
};

// Step 1: 사진 업로드
const Step1Photos = ({ formData, setFormData }) => (
  <div className="space-y-4">
    <div>
      <h2 className="text-lg font-bold text-slate-800">사진을 추가해주세요</h2>
      <p className="mt-1 text-sm text-slate-500">매물 외관, 내부, 주변 환경 등을 담아보세요.</p>
    </div>
    <ImageUploader
      images={formData.images}
      onImagesChange={(updater) =>
        setFormData((prev) => ({
          ...prev,
          images: typeof updater === 'function' ? updater(prev.images) : updater,
        }))
      }
      maxFiles={10}
    />
    <p className="text-center text-xs text-slate-400">사진은 나중에도 추가할 수 있어요.</p>
  </div>
);

// Step 2: 위치 정보
const Step2Location = ({ formData, setFormData }) => {
  const handleSearch = () => {
    openAddressSearch((address) => {
      setFormData((prev) => ({ ...prev, address }));
    });
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-bold text-slate-800">위치를 입력해주세요</h2>
        <p className="mt-1 text-sm text-slate-500">매물의 주소를 검색하거나 직접 입력하세요.</p>
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-slate-700">주소 *</label>
        <button
          type="button"
          onClick={handleSearch}
          className={cn(
            'flex h-12 w-full items-center gap-2 rounded-xl border px-4 text-left text-base transition-all',
            formData.address
              ? 'border-primary bg-primary-50 text-slate-800'
              : 'border-slate-200 bg-white text-slate-400',
            'focus:outline-none focus:ring-2 focus:ring-primary/20',
          )}
        >
          <MapPin size={18} className={formData.address ? 'text-primary' : 'text-slate-400'} />
          <span className="flex-1 truncate">
            {formData.address || '주소 검색'}
          </span>
          {!formData.address && <ChevronRight size={16} className="text-slate-400" />}
        </button>
      </div>

      {formData.address && (
        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700">상세 주소</label>
          <input
            type="text"
            placeholder="동/호수 등 (예: 101호)"
            value={formData.addressDetail}
            onChange={(e) => setFormData((prev) => ({ ...prev, addressDetail: e.target.value }))}
            className="h-12 w-full rounded-xl border border-slate-200 px-4 text-base outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 placeholder:text-slate-400"
          />
        </div>
      )}
    </div>
  );
};

// Step 3: 가격 정보
const Step3Price = ({ formData, setFormData }) => {
  const numInput = (field, value) =>
    setFormData((prev) => ({ ...prev, [field]: value.replace(/[^0-9]/g, '') }));

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-bold text-slate-800">가격 정보를 입력해주세요</h2>
        <p className="mt-1 text-sm text-slate-500">만원 단위로 입력하세요.</p>
      </div>

      {/* 거래 유형 */}
      <Tabs.Root
        value={formData.priceType}
        onValueChange={(v) => setFormData((prev) => ({ ...prev, priceType: v }))}
      >
        <Tabs.List className="flex rounded-xl bg-slate-100 p-1">
          {PRICE_TYPES.map(({ value, label }) => (
            <Tabs.Trigger
              key={value}
              value={value}
              className={cn(
                'flex-1 rounded-lg py-2 text-sm font-semibold transition-all',
                formData.priceType === value
                  ? 'bg-white text-primary shadow-sm'
                  : 'text-slate-500',
              )}
            >
              {label}
            </Tabs.Trigger>
          ))}
        </Tabs.List>
      </Tabs.Root>

      {/* 월세 */}
      {formData.priceType === 'MONTHLY_RENT' && (
        <div className="space-y-3">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">보증금 (만원)</label>
            <input
              type="text"
              inputMode="numeric"
              placeholder="예: 1000"
              value={formData.deposit}
              onChange={(e) => numInput('deposit', e.target.value)}
              className="h-12 w-full rounded-xl border border-slate-200 px-4 text-base outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 placeholder:text-slate-400"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">월세 (만원)</label>
            <input
              type="text"
              inputMode="numeric"
              placeholder="예: 50"
              value={formData.monthlyRent}
              onChange={(e) => numInput('monthlyRent', e.target.value)}
              className="h-12 w-full rounded-xl border border-slate-200 px-4 text-base outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 placeholder:text-slate-400"
            />
          </div>
        </div>
      )}

      {/* 전세 */}
      {formData.priceType === 'JEONSE' && (
        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700">전세금 (만원)</label>
          <input
            type="text"
            inputMode="numeric"
            placeholder="예: 30000"
            value={formData.deposit}
            onChange={(e) => numInput('deposit', e.target.value)}
            className="h-12 w-full rounded-xl border border-slate-200 px-4 text-base outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 placeholder:text-slate-400"
          />
        </div>
      )}

      {/* 매매 */}
      {formData.priceType === 'SALE' && (
        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700">매매가 (만원)</label>
          <input
            type="text"
            inputMode="numeric"
            placeholder="예: 80000"
            value={formData.salePrice}
            onChange={(e) => numInput('salePrice', e.target.value)}
            className="h-12 w-full rounded-xl border border-slate-200 px-4 text-base outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 placeholder:text-slate-400"
          />
        </div>
      )}
    </div>
  );
};

// Step 4: 기본 정보
const Step4BasicInfo = ({ formData, setFormData }) => {
  const numInput = (field, value) =>
    setFormData((prev) => ({ ...prev, [field]: value.replace(/[^0-9.]/g, '') }));

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-bold text-slate-800">기본 정보를 입력해주세요</h2>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="col-span-1">
          <label className="mb-1.5 block text-sm font-medium text-slate-700">면적(㎡)</label>
          <input
            type="text"
            inputMode="decimal"
            placeholder="예: 33"
            value={formData.area}
            onChange={(e) => numInput('area', e.target.value)}
            className="h-12 w-full rounded-xl border border-slate-200 px-4 text-base outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 placeholder:text-slate-400"
          />
        </div>
        <div className="col-span-1">
          <label className="mb-1.5 block text-sm font-medium text-slate-700">층수</label>
          <input
            type="text"
            inputMode="numeric"
            placeholder="예: 3"
            value={formData.floor}
            onChange={(e) => numInput('floor', e.target.value)}
            className="h-12 w-full rounded-xl border border-slate-200 px-4 text-base outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 placeholder:text-slate-400"
          />
        </div>
        <div className="col-span-1">
          <label className="mb-1.5 block text-sm font-medium text-slate-700">전체 층수</label>
          <input
            type="text"
            inputMode="numeric"
            placeholder="예: 10"
            value={formData.totalFloors}
            onChange={(e) => numInput('totalFloors', e.target.value)}
            className="h-12 w-full rounded-xl border border-slate-200 px-4 text-base outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 placeholder:text-slate-400"
          />
        </div>
      </div>

      {/* 별점 */}
      <div>
        <label className="mb-2 block text-sm font-medium text-slate-700">전체 평가 *</label>
        <div className="flex items-center gap-3">
          <RatingStars
            rating={formData.rating}
            onChange={(v) => setFormData((prev) => ({ ...prev, rating: v }))}
            size="lg"
          />
          {formData.rating > 0 && (
            <span className="text-sm text-slate-500">
              {['', '별로에요', '아쉬워요', '보통이에요', '좋아요', '최고에요'][formData.rating]}
            </span>
          )}
        </div>
      </div>

      {/* 가격 평가 */}
      <div>
        <label className="mb-2 block text-sm font-medium text-slate-700">가격 평가</label>
        <div className="flex gap-2">
          {PRICE_RATINGS.map(({ value, label, emoji }) => (
            <button
              key={value}
              type="button"
              onClick={() =>
                setFormData((prev) => ({
                  ...prev,
                  priceRating: prev.priceRating === value ? '' : value,
                }))
              }
              className={cn(
                'flex flex-1 flex-col items-center gap-1 rounded-xl border py-3 text-xs font-medium transition-all active:scale-[0.97]',
                formData.priceRating === value
                  ? 'border-primary bg-primary-50 text-primary'
                  : 'border-slate-200 bg-white text-slate-500',
              )}
            >
              <span className="text-xl">{emoji}</span>
              {label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

// Step 5: 체크리스트
const Step5Checklist = ({ formData, setFormData }) => {
  const toggleCheck = (key) =>
    setFormData((prev) => ({
      ...prev,
      checkItems: { ...prev.checkItems, [key]: !prev.checkItems[key] },
    }));

  const toggleSurrounding = (value) =>
    setFormData((prev) => ({
      ...prev,
      surroundings: prev.surroundings.includes(value)
        ? prev.surroundings.filter((s) => s !== value)
        : [...prev.surroundings, value],
    }));

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-slate-800">체크리스트</h2>
        <p className="mt-1 text-sm text-slate-500">해당하는 항목을 모두 선택하세요.</p>
      </div>

      {/* 체크 항목 */}
      <div>
        <p className="mb-2 text-sm font-semibold text-slate-700">매물 환경</p>
        <div className="grid grid-cols-2 gap-2">
          {CHECK_ITEMS.map(({ key, label }) => (
            <button
              key={key}
              type="button"
              onClick={() => toggleCheck(key)}
              className={cn(
                'flex items-center gap-2 rounded-xl border px-3 py-2.5 text-sm transition-all active:scale-[0.97]',
                formData.checkItems[key]
                  ? 'border-primary bg-primary-50 text-primary'
                  : 'border-slate-200 bg-white text-slate-600',
              )}
            >
              <div
                className={cn(
                  'flex h-5 w-5 items-center justify-center rounded-full border',
                  formData.checkItems[key]
                    ? 'border-primary bg-primary'
                    : 'border-slate-300 bg-white',
                )}
              >
                {formData.checkItems[key] && <Check size={12} className="text-white" />}
              </div>
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* 주변 환경 */}
      <div>
        <p className="mb-2 text-sm font-semibold text-slate-700">주변 시설</p>
        <div className="flex flex-wrap gap-2">
          {SURROUNDINGS.map(({ value, label }) => (
            <button
              key={value}
              type="button"
              onClick={() => toggleSurrounding(value)}
              className={cn(
                'rounded-full border px-3 py-1.5 text-xs font-medium transition-all active:scale-[0.97]',
                formData.surroundings.includes(value)
                  ? 'border-primary bg-primary-50 text-primary'
                  : 'border-slate-200 bg-white text-slate-500',
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* 토글 항목 */}
      <div className="space-y-3">
        <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3">
          <div>
            <p className="text-sm font-medium text-slate-800">즉시 입주 가능</p>
            <p className="text-xs text-slate-400">현재 입주 가능한 매물이에요</p>
          </div>
          <Switch.Root
            checked={formData.canMoveIn}
            onCheckedChange={(v) => setFormData((prev) => ({ ...prev, canMoveIn: v }))}
            className={cn(
              'relative h-6 w-11 rounded-full transition-colors',
              formData.canMoveIn ? 'bg-primary' : 'bg-slate-200',
            )}
          >
            <Switch.Thumb className="block h-5 w-5 translate-x-0.5 rounded-full bg-white shadow transition-transform data-[state=checked]:translate-x-[22px]" />
          </Switch.Root>
        </div>

        <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3">
          <div>
            <p className="text-sm font-medium text-slate-800">재방문 의향 있음</p>
            <p className="text-xs text-slate-400">다시 방문해서 더 알아볼 매물이에요</p>
          </div>
          <Switch.Root
            checked={formData.revisitWanted}
            onCheckedChange={(v) => setFormData((prev) => ({ ...prev, revisitWanted: v }))}
            className={cn(
              'relative h-6 w-11 rounded-full transition-colors',
              formData.revisitWanted ? 'bg-primary' : 'bg-slate-200',
            )}
          >
            <Switch.Thumb className="block h-5 w-5 translate-x-0.5 rounded-full bg-white shadow transition-transform data-[state=checked]:translate-x-[22px]" />
          </Switch.Root>
        </div>
      </div>
    </div>
  );
};

// Step 6: 메모
const Step6Memo = ({ formData, setFormData }) => (
  <div className="space-y-4">
    <div>
      <h2 className="text-lg font-bold text-slate-800">메모를 남겨주세요</h2>
      <p className="mt-1 text-sm text-slate-500">임장 중 느낀 점을 자유롭게 기록하세요.</p>
    </div>

    <textarea
      placeholder="예: 창문에서 공원이 보여서 좋았어요. 다만 층간소음이 조금 걱정됩니다..."
      value={formData.memo}
      onChange={(e) => setFormData((prev) => ({ ...prev, memo: e.target.value }))}
      rows={8}
      className="w-full resize-none rounded-xl border border-slate-200 px-4 py-3 text-base outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 placeholder:text-slate-400"
    />
    <p className="text-right text-xs text-slate-400">{formData.memo.length}자</p>
  </div>
);

// 단계 유효성 검사
const validateStep = (step, formData) => {
  if (step === 2 && !formData.address) return '주소를 입력해주세요.';
  if (step === 4 && formData.rating === 0) return '전체 평가 별점을 선택해주세요.';
  return null;
};

const PropertyNewPage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState(initialFormData);
  const [stepError, setStepError] = useState('');

  const { mutate: submit, isPending } = useMutation({
    mutationFn: (data) => propertyApi.create(data).then((r) => r.data),
    onSuccess: (created) => {
      toast.success('매물이 등록되었어요!');
      queryClient.invalidateQueries({ queryKey: ['properties-recent'] });
      queryClient.invalidateQueries({ queryKey: ['properties-timeline'] });
      queryClient.invalidateQueries({ queryKey: ['property-stats'] });
      navigate(`/properties/${created.id}`, { replace: true });
    },
    onError: () => toast.error('등록에 실패했어요. 다시 시도해주세요.'),
  });

  const handleNext = () => {
    const error = validateStep(step, formData);
    if (error) {
      setStepError(error);
      return;
    }
    setStepError('');
    if (step < TOTAL_STEPS) {
      setStep((s) => s + 1);
    }
  };

  const handleBack = () => {
    setStepError('');
    if (step > 1) setStep((s) => s - 1);
    else navigate(-1);
  };

  const handleSubmit = () => {
    const payload = {
      imageIds: formData.images.map((img) => img.id),
      address: formData.address,
      addressDetail: formData.addressDetail || null,
      latitude: formData.latitude,
      longitude: formData.longitude,
      priceType: formData.priceType,
      deposit: formData.deposit ? Number(formData.deposit) : null,
      monthlyRent: formData.monthlyRent ? Number(formData.monthlyRent) : null,
      salePrice: formData.salePrice ? Number(formData.salePrice) : null,
      area: formData.area ? Number(formData.area) : null,
      floor: formData.floor ? Number(formData.floor) : null,
      totalFloors: formData.totalFloors ? Number(formData.totalFloors) : null,
      rating: formData.rating || null,
      priceRating: formData.priceRating || null,
      checkItems: formData.checkItems,
      surroundings: formData.surroundings,
      canMoveIn: formData.canMoveIn,
      revisitWanted: formData.revisitWanted,
      memo: formData.memo || null,
    };
    submit(payload);
  };

  const renderStep = () => {
    switch (step) {
      case 1: return <Step1Photos formData={formData} setFormData={setFormData} />;
      case 2: return <Step2Location formData={formData} setFormData={setFormData} />;
      case 3: return <Step3Price formData={formData} setFormData={setFormData} />;
      case 4: return <Step4BasicInfo formData={formData} setFormData={setFormData} />;
      case 5: return <Step5Checklist formData={formData} setFormData={setFormData} />;
      case 6: return <Step6Memo formData={formData} setFormData={setFormData} />;
      default: return null;
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-white">
      {/* 헤더 */}
      <div className="flex items-center gap-3 border-b border-slate-100 px-5 py-4">
        <button
          type="button"
          onClick={handleBack}
          className="flex h-10 w-10 items-center justify-center rounded-xl text-slate-600 active:bg-slate-100"
        >
          <ChevronLeft size={24} />
        </button>
        <div className="flex-1">
          <StepProgress currentStep={step} totalSteps={TOTAL_STEPS} labels={STEP_LABELS} />
        </div>
      </div>

      {/* 콘텐츠 */}
      <div className="flex-1 overflow-y-auto px-5 py-6">
        {renderStep()}
        {stepError && (
          <p className="mt-3 rounded-xl bg-red-50 px-4 py-3 text-sm text-danger">{stepError}</p>
        )}
      </div>

      {/* 하단 버튼 */}
      <div className="border-t border-slate-100 px-5 py-4 pb-safe">
        {step < TOTAL_STEPS ? (
          <button
            type="button"
            onClick={handleNext}
            className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary font-semibold text-white transition-all active:scale-[0.98]"
          >
            다음
            <ChevronRight size={18} />
          </button>
        ) : (
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isPending}
            className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary font-semibold text-white transition-all active:scale-[0.98] disabled:opacity-60"
          >
            {isPending ? <Spinner size="sm" className="text-white" /> : '매물 등록하기'}
          </button>
        )}
      </div>
    </div>
  );
};

export default PropertyNewPage;
