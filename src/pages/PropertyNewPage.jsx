import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ChevronLeft, MapPin, Navigation, Map as MapIcon,
  Camera, X, Check,
} from 'lucide-react';
import { toast } from 'sonner';
import * as Tabs from '@radix-ui/react-tabs';
import { propertyApi } from '@/api/property';
import { imageApi } from '@/api/image';
import { RatingStars } from '@/components/RatingStars';
import { Spinner } from '@/components/Spinner';
import { cn, formatPrice, getImageUrl } from '@/lib/utils';
import { Section, SectionTitle, ChipButton, PriceInputWithHint } from '@/components/FormSection';

// ─── 상수 ──────────────────────────────────────────────────────────────────

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

const REQUIRED_PHOTO_SLOTS = [
  { key: 'exterior', label: '외관' },
  { key: 'living', label: '거실' },
  { key: 'special', label: '특이사항' },
];

const INITIAL_FORM = {
  address: '',
  addressDetail: '',
  latitude: null,
  longitude: null,
  rating: 0,
  priceEvaluation: '',
  moveInAvailable: null,
  revisitIntention: null,
  priceType: 'MONTHLY',
  deposit: '',
  monthlyRent: '',
  price: '',
  area: '',
  maintenanceFee: 0,
  parkingType: '',
  currentFloor: '',
  totalFloors: '',
  images: [],
  memo: '',
};

// ─── 이미지 슬롯 컴포넌트 ────────────────────────────────────────────────────

const ImageSlot = ({ label, required, image, onUpload, onRemove }) => {
  const inputRef = useRef();
  const [uploading, setUploading] = useState(false);

  const handleFile = async (file) => {
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      toast.error('10MB 이하 파일만 가능해요.');
      return;
    }
    setUploading(true);
    try {
      const res = await imageApi.upload(file);
      onUpload({ id: res.data.imageId ?? res.data.id, url: getImageUrl(res.data.thumbnailUrl ?? res.data.url) });
    } catch {
      toast.error('이미지 업로드에 실패했어요.');
    } finally {
      setUploading(false);
    }
  };

  if (image) {
    return (
      <div className="relative aspect-square overflow-hidden rounded-xl">
        <img src={image.url} alt={label} loading="lazy" className="h-full w-full object-cover" />
        <button
          type="button"
          onClick={() => onRemove(image.id)}
          className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/50"
        >
          <X size={14} className="text-white" />
        </button>
        {label && (
          <span className="absolute bottom-1 left-1 rounded bg-black/50 px-1.5 py-0.5 text-xs text-white">
            {label}
          </span>
        )}
      </div>
    );
  }

  return (
    <label
      className={cn(
        'flex aspect-square cursor-pointer flex-col items-center justify-center gap-1',
        'rounded-xl border-2 border-dashed transition-colors active:opacity-70',
        required ? 'border-danger/40 bg-red-50/50' : 'border-slate-300 bg-slate-50',
        uploading && 'pointer-events-none opacity-60',
      )}
    >
      {uploading ? (
        <Spinner size="sm" />
      ) : (
        <>
          <Camera size={20} className={required ? 'text-danger/50' : 'text-slate-400'} />
          <span className={cn('text-xs', required ? 'text-danger/60' : 'text-slate-400')}>
            {label || '추가'}
          </span>
        </>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => handleFile(e.target.files?.[0])}
        disabled={uploading}
      />
    </label>
  );
};

// ─── 지도 선택 오버레이 ───────────────────────────────────────────────────────

const MapSelectOverlay = ({ onConfirm, onClose }) => {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const debounceRef = useRef(null);
  const [currentAddress, setCurrentAddress] = useState('지도를 이동해서 위치를 선택하세요');
  const [currentCoords, setCurrentCoords] = useState(null);
  const [mapReady, setMapReady] = useState(false);

  const reverseGeocode = useCallback((lat, lng) => {
    if (!window.kakao?.maps?.services) return;
    const geocoder = new window.kakao.maps.services.Geocoder();
    geocoder.coord2Address(lng, lat, (result, status) => {
      if (status === window.kakao.maps.services.Status.OK) {
        const addr =
          result[0]?.road_address?.address_name ||
          result[0]?.address?.address_name ||
          '주소를 찾을 수 없어요';
        setCurrentAddress(addr);
        setCurrentCoords({ lat, lng });
      }
    });
  }, []);

  useEffect(() => {
    if (!mapRef.current || !window.kakao?.maps) return;

    window.kakao.maps.load(() => {
      const initMap = (lat, lng) => {
        const center = new window.kakao.maps.LatLng(lat, lng);
        const map = new window.kakao.maps.Map(mapRef.current, {
          center,
          level: 3,
        });
        mapInstanceRef.current = map;
        setMapReady(true);
        reverseGeocode(lat, lng);

        window.kakao.maps.event.addListener(map, 'center_changed', () => {
          clearTimeout(debounceRef.current);
          debounceRef.current = setTimeout(() => {
            const c = map.getCenter();
            reverseGeocode(c.getLat(), c.getLng());
          }, 300);
        });
      };

      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (pos) => initMap(pos.coords.latitude, pos.coords.longitude),
          () => initMap(37.5665, 126.9780),
          { timeout: 5000 },
        );
      } else {
        initMap(37.5665, 126.9780);
      }
    });

    return () => clearTimeout(debounceRef.current);
  }, [reverseGeocode]);

  const handleConfirm = () => {
    if (!currentCoords || !currentAddress) return;
    onConfirm({ address: currentAddress, ...currentCoords });
  };

  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-white">
      {/* 헤더 */}
      <div className="flex items-center gap-3 border-b border-slate-100 px-4 py-3">
        <button
          type="button"
          onClick={onClose}
          className="flex h-10 w-10 items-center justify-center rounded-xl active:bg-slate-100"
        >
          <ChevronLeft size={24} className="text-slate-700" />
        </button>
        <span className="text-base font-bold text-slate-800">지도에서 위치 선택</span>
      </div>

      {/* 지도 */}
      <div className="relative flex-1">
        <div ref={mapRef} className="h-full w-full" />

        {/* 초기 로딩 */}
        {!mapReady && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-50">
            <Spinner />
          </div>
        )}

        {/* 중앙 핀 — z-20으로 카카오맵 위에 표시 */}
        <div className="pointer-events-none absolute left-1/2 top-1/2 z-20 -translate-x-1/2 -translate-y-full">
          <MapPin size={40} className="text-danger drop-shadow-lg" fill="#EF4444" strokeWidth={1.5} />
          {/* 핀 그림자 dot */}
          <div className="mx-auto -mt-1 h-2 w-2 rounded-full bg-black/20 blur-[2px]" />
        </div>
      </div>

      {/* 하단 주소 + 확인 */}
      <div className="border-t border-slate-100 px-5 pb-safe pt-4">
        <p className="mb-1 text-xs text-slate-500">선택된 위치</p>
        <p className="mb-4 truncate text-sm font-medium text-slate-800">{currentAddress}</p>
        <button
          type="button"
          onClick={handleConfirm}
          disabled={!currentCoords}
          className="btn-primary"
        >
          이 위치로 선택
        </button>
      </div>
    </div>
  );
};

// ─── 칩 버튼 ────────────────────────────────────────────────────────────────

// ─── 메인 페이지 ─────────────────────────────────────────────────────────────

const PropertyNewPage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [form, setForm] = useState(INITIAL_FORM);
  const [mapSelectOpen, setMapSelectOpen] = useState(false);
  const [locating, setLocating] = useState(false);

  const set = (key, val) => setForm((prev) => ({ ...prev, [key]: val }));

  // 필수 항목 완료 개수 (5개)
  const requiredDone = [
    !!form.address,
    form.rating > 0,
    !!form.priceEvaluation,
    form.moveInAvailable !== null,
    form.revisitIntention !== null,
  ].filter(Boolean).length;
  const allRequiredDone = requiredDone === 5;

  // 위치 확정 시 prefetch (fire-and-forget)
  const firePrefetch = (address, latitude, longitude) => {
    propertyApi.prefetchLocation({ address, latitude, longitude }).catch(() => {});
  };

  // 다음 주소 검색
  const handleAddressSearch = () => {
    if (!window.daum?.Postcode) {
      toast.error('주소 검색 서비스를 불러오는 중이에요.');
      return;
    }
    new window.daum.Postcode({
      oncomplete: (data) => {
        const addr = data.roadAddress || data.jibunAddress;
        set('address', addr);
        firePrefetch(addr, null, null);
      },
    }).open();
  };

  // 현재 위치 사용
  const handleCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error('이 브라우저에서는 위치 기능을 지원하지 않아요.');
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        if (!window.kakao?.maps?.services) {
          set('latitude', latitude);
          set('longitude', longitude);
          toast.error('주소 변환 서비스를 사용할 수 없어요.');
          setLocating(false);
          return;
        }
        const geocoder = new window.kakao.maps.services.Geocoder();
        geocoder.coord2Address(longitude, latitude, (result, status) => {
          setLocating(false);
          if (status === window.kakao.maps.services.Status.OK) {
            const addr =
              result[0]?.road_address?.address_name ||
              result[0]?.address?.address_name;
            setForm((prev) => ({ ...prev, address: addr, latitude, longitude }));
            firePrefetch(addr, latitude, longitude);
          } else {
            toast.error('주소를 찾을 수 없어요.');
          }
        });
      },
      (err) => {
        setLocating(false);
        if (err.code === 1) toast.error('위치 권한을 허용해주세요.');
        else toast.error('위치 정보를 가져올 수 없어요.');
      },
      { timeout: 8000 },
    );
  };

  // 지도 위치 확정
  const handleMapConfirm = ({ address, lat, lng }) => {
    setForm((prev) => ({ ...prev, address, latitude: lat, longitude: lng }));
    firePrefetch(address, lat, lng);
    setMapSelectOpen(false);
  };

  // 이미지 업로드/삭제
  const handleImageUpload = (img) => set('images', [...form.images, img]);
  const handleImageRemove = (id) => set('images', form.images.filter((i) => i.id !== id));

  // 슬롯별 이미지 찾기
  const slotImage = (idx) => form.images[idx] ?? null;

  const { mutate: submitSave, isPending: isSaving } = useMutation({
    mutationFn: (data) => propertyApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['properties-recent'] });
      queryClient.invalidateQueries({ queryKey: ['properties-timeline'] });
      toast.success('매물이 등록되었어요!');
      navigate('/timeline', { replace: true });
    },
    onError: () => toast.error('등록에 실패했어요.'),
  });

  const buildPayload = () => ({
    imageIds: form.images.map((img) => img.id),
    address: form.address,
    latitude: form.latitude,
    longitude: form.longitude,
    rating: form.rating || null,
    priceEvaluation: form.priceEvaluation || null,
    moveInAvailable: form.moveInAvailable,
    revisitIntention: form.revisitIntention,
    priceType: form.priceType,
    deposit: form.deposit ? Number(form.deposit) : null,
    monthlyRent: form.monthlyRent ? Number(form.monthlyRent) : null,
    price: form.price ? Number(form.price) : null,
    area: form.area ? Number(form.area) : null,
    maintenanceFee: form.maintenanceFee || null,
    parkingType: form.parkingType || null,
    currentFloor: form.currentFloor ? Number(form.currentFloor) : null,
    totalFloors: form.totalFloors ? Number(form.totalFloors) : null,
    memo: form.memo || null,
  });

  const scrollToFirstMissing = () => {
    const checks = [
      { done: !!form.address, id: 'section-location' },
      { done: form.rating > 0, id: 'section-checklist' },
      { done: !!form.priceEvaluation, id: 'section-checklist' },
      { done: form.moveInAvailable !== null, id: 'section-checklist' },
      { done: form.revisitIntention !== null, id: 'section-checklist' },
    ];
    const first = checks.find((c) => !c.done);
    if (first) {
      document.getElementById(first.id)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  const handleSave = () => {
    if (!allRequiredDone) {
      toast.error('필수 항목을 모두 입력해주세요.');
      scrollToFirstMissing();
      return;
    }
    submitSave(buildPayload());
  };

  const numInput = (key) => (e) => set(key, e.target.value.replace(/[^0-9.]/g, ''));

  return (
    <>
      {/* 지도 선택 오버레이 */}
      {mapSelectOpen && (
        <MapSelectOverlay onConfirm={handleMapConfirm} onClose={() => setMapSelectOpen(false)} />
      )}

      <div className="min-h-screen bg-slate-50">
        {/* 헤더 */}
        <div className="sticky top-0 z-10 border-b border-slate-100 bg-white/95 backdrop-blur-sm">
          <div className="flex items-center gap-3 px-5 py-4">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="flex h-10 w-10 items-center justify-center rounded-xl text-slate-600 active:bg-slate-100"
            >
              <ChevronLeft size={24} />
            </button>
            <h1 className="flex-1 text-base font-bold text-slate-800">빠른 기록</h1>
          </div>
          <div className="px-5 pb-3">
            <div className="mb-1.5 flex items-center justify-between">
              <span className="text-sm font-semibold text-slate-700">필수 항목</span>
              <span className="text-sm font-bold text-primary">{requiredDone}/5</span>
            </div>
            <div className="h-3 w-full overflow-hidden rounded-full bg-slate-200">
              <div
                className="h-full rounded-full bg-primary transition-all duration-300"
                style={{ width: `${(requiredDone / 5) * 100}%` }}
              />
            </div>
          </div>
        </div>

        {/* 폼 콘텐츠 */}
        <div className="space-y-3 px-5 pt-4 pb-32">
          {/* ── 섹션 1: 위치 정보 ─────────────────────────────────── */}
          <Section id="section-location">
            <SectionTitle required>위치 정보</SectionTitle>

            {/* 주소 표시 */}
            <button
              type="button"
              onClick={handleAddressSearch}
              className={cn(
                'flex w-full items-center gap-2 rounded-xl border px-4 py-3 text-left transition-all',
                form.address
                  ? 'border-primary bg-primary-50 text-slate-800'
                  : 'border-slate-200 bg-slate-50 text-slate-400',
              )}
            >
              <MapPin size={16} className={form.address ? 'text-primary' : 'text-slate-400'} />
              <span className="flex-1 truncate text-sm">
                {form.address || '주소를 검색해주세요'}
              </span>
              {form.address && <Check size={16} className="text-primary" />}
            </button>

            {/* 상세 주소 */}
            {form.address && (
              <input
                type="text"
                placeholder="동/호수 (예: 101호)"
                value={form.addressDetail}
                onChange={(e) => set('addressDetail', e.target.value)}
                className="h-12 w-full rounded-xl border border-slate-200 px-4 text-base outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 placeholder:text-slate-400"
              />
            )}

            {/* 위치 버튼 */}
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={handleCurrentLocation}
                disabled={locating}
                className="flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white text-sm font-medium text-slate-600 active:bg-slate-50 disabled:opacity-60"
              >
                {locating ? <Spinner size="sm" /> : <Navigation size={16} className="text-slate-500" />}
                {locating ? '위치 확인 중...' : '현재 위치 사용'}
              </button>
              <button
                type="button"
                onClick={() => setMapSelectOpen(true)}
                className="flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white text-sm font-medium text-slate-600 active:bg-slate-50"
              >
                <MapIcon size={16} className="text-slate-500" />
                지도에서 선택
              </button>
            </div>
          </Section>

          {/* ── 섹션 2: 매물 정보 ─────────────────────────────────── */}
          <Section>
            <SectionTitle>매물 정보</SectionTitle>

            {/* 거래 유형 */}
            <div>
              <p className="mb-2 text-sm font-medium text-slate-700">유형</p>
              <Tabs.Root value={form.priceType} onValueChange={(v) => set('priceType', v)}>
                <Tabs.List className="flex rounded-xl bg-slate-100 p-1">
                  {PRICE_TYPES.map(({ value, label }) => (
                    <Tabs.Trigger
                      key={value}
                      value={value}
                      className={cn(
                        'flex-1 rounded-lg py-2 text-sm font-semibold transition-all',
                        form.priceType === value ? 'bg-white text-primary shadow-sm' : 'text-slate-500',
                      )}
                    >
                      {label}
                    </Tabs.Trigger>
                  ))}
                </Tabs.List>
              </Tabs.Root>
            </div>

            {/* 가격 */}
            <div>
              <p className="mb-2 text-sm font-medium text-slate-700">가격 (만원)</p>
              {form.priceType === 'MONTHLY' && (
                <div className="grid grid-cols-2 gap-2">
                  <PriceInputWithHint label="보증금" value={form.deposit} onChange={numInput('deposit')} placeholder="1000" />
                  <PriceInputWithHint label="월세" value={form.monthlyRent} onChange={numInput('monthlyRent')} placeholder="50" />
                </div>
              )}
              {form.priceType === 'JEONSE' && (
                <PriceInputWithHint label="전세금" value={form.deposit} onChange={numInput('deposit')} placeholder="30000" />
              )}
              {form.priceType === 'SALE' && (
                <PriceInputWithHint label="매매가" value={form.price} onChange={numInput('price')} placeholder="80000" />
              )}
            </div>

            {/* 평수 */}
            <div>
              <p className="mb-2 text-sm font-medium text-slate-700">평수 (㎡)</p>
              <input type="text" inputMode="decimal" placeholder="예: 33"
                value={form.area} onChange={numInput('area')}
                className="h-12 w-full rounded-xl border border-slate-200 px-4 text-base outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 placeholder:text-slate-400" />
            </div>

            {/* 관리비 슬라이더 */}
            <div>
              <div className="mb-2 flex items-center justify-between">
                <p className="text-sm font-medium text-slate-700">관리비</p>
                <span className="text-sm font-semibold text-primary">
                  {form.maintenanceFee === 0 ? '없음' : `${form.maintenanceFee}만원`}
                </span>
              </div>
              <input
                type="range"
                min={0}
                max={50}
                step={1}
                value={form.maintenanceFee}
                onChange={(e) => set('maintenanceFee', Number(e.target.value))}
                className="h-2 w-full cursor-pointer"
                style={{
                  background: `linear-gradient(to right, #059669 ${form.maintenanceFee * 2}%, #E2E8F0 ${form.maintenanceFee * 2}%)`,
                }}
              />
              <div className="mt-1 flex justify-between text-xs text-slate-400">
                <span>0만원</span>
                <span>50만원</span>
              </div>
            </div>

            {/* 주차 */}
            <div>
              <p className="mb-2 text-sm font-medium text-slate-700">주차</p>
              <div className="flex gap-2">
                {PARKING_OPTIONS.map(({ value, label }) => (
                  <ChipButton
                    key={value}
                    active={form.parkingType === value}
                    onClick={() => set('parkingType', form.parkingType === value ? '' : value)}
                    className="flex-1"
                  >
                    {label}
                  </ChipButton>
                ))}
              </div>
            </div>

            {/* 층수 */}
            <div>
              <p className="mb-2 text-sm font-medium text-slate-700">층수</p>
              <div className="flex items-center gap-2">
                <input type="text" inputMode="numeric" placeholder="현재층"
                  value={form.currentFloor} onChange={numInput('currentFloor')}
                  className="h-12 w-full rounded-xl border border-slate-200 px-4 text-base outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 placeholder:text-slate-400" />
                <span className="text-slate-400">/</span>
                <input type="text" inputMode="numeric" placeholder="전체층"
                  value={form.totalFloors} onChange={numInput('totalFloors')}
                  className="h-12 w-full rounded-xl border border-slate-200 px-4 text-base outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 placeholder:text-slate-400" />
              </div>
            </div>
          </Section>

          {/* ── 섹션 3: 필수 체크리스트 ──────────────────────────── */}
          <Section id="section-checklist">
            <SectionTitle>필수 체크리스트</SectionTitle>

            {/* 전체 만족도 */}
            <div>
              <p className="mb-2 text-sm font-medium text-slate-700">
                전체 만족도<span className="ml-0.5 text-danger">*</span>
              </p>
              <div className="flex items-center gap-3">
                <RatingStars
                  rating={form.rating}
                  onChange={(v) => set('rating', v)}
                  size="lg"
                />
                {form.rating > 0 && (
                  <span className="text-sm text-slate-500">
                    {['', '별로에요', '아쉬워요', '보통이에요', '좋아요', '최고에요'][form.rating]}
                  </span>
                )}
              </div>
            </div>

            {/* 가격 평가 */}
            <div>
              <p className="mb-2 text-sm font-medium text-slate-700">
                가격 평가<span className="ml-0.5 text-danger">*</span>
              </p>
              <div className="flex gap-2">
                {PRICE_RATINGS.map(({ value, label }) => (
                  <ChipButton
                    key={value}
                    active={form.priceEvaluation === value}
                    onClick={() => set('priceEvaluation', form.priceEvaluation === value ? '' : value)}
                    className="flex-1"
                  >
                    {label}
                  </ChipButton>
                ))}
              </div>
            </div>

            {/* 즉시 입주 가능 */}
            <div>
              <p className="mb-2 text-sm font-medium text-slate-700">
                즉시 입주 가능<span className="ml-0.5 text-danger">*</span>
              </p>
              <div className="flex gap-2">
                <ChipButton
                  active={form.moveInAvailable === true}
                  onClick={() => set('moveInAvailable', form.moveInAvailable === true ? null : true)}
                  className="flex-1"
                >
                  가능
                </ChipButton>
                <ChipButton
                  active={form.moveInAvailable === false}
                  onClick={() => set('moveInAvailable', form.moveInAvailable === false ? null : false)}
                  className="flex-1"
                >
                  불가
                </ChipButton>
              </div>
            </div>

            {/* 재방문 의사 */}
            <div>
              <p className="mb-2 text-sm font-medium text-slate-700">
                재방문 의사<span className="ml-0.5 text-danger">*</span>
              </p>
              <div className="flex gap-2">
                <ChipButton
                  active={form.revisitIntention === true}
                  onClick={() => set('revisitIntention', form.revisitIntention === true ? null : true)}
                  className="flex-1"
                >
                  있음
                </ChipButton>
                <ChipButton
                  active={form.revisitIntention === false}
                  onClick={() => set('revisitIntention', form.revisitIntention === false ? null : false)}
                  className="flex-1"
                >
                  없음
                </ChipButton>
              </div>
            </div>
          </Section>

          {/* ── 섹션 4: 사진 기록 ─────────────────────────────────── */}
          <Section>
            <div>
              <SectionTitle required>사진 기록</SectionTitle>
              <p className="mt-0.5 text-xs text-slate-400">외관, 거실, 특이사항은 필수 권장</p>
            </div>

            {/* 필수 3칸 */}
            <div className="grid grid-cols-3 gap-2">
              {REQUIRED_PHOTO_SLOTS.map(({ key, label }, idx) => (
                <ImageSlot
                  key={key}
                  label={label}
                  required
                  image={slotImage(idx)}
                  onUpload={handleImageUpload}
                  onRemove={handleImageRemove}
                />
              ))}
            </div>

            {/* 추가 사진 */}
            <div className="grid grid-cols-4 gap-2">
              {form.images.slice(3).map((img) => (
                <div key={img.id} className="relative aspect-square overflow-hidden rounded-xl">
                  <img src={img.url} alt="" loading="lazy" className="h-full w-full object-cover" />
                  <button
                    type="button"
                    onClick={() => handleImageRemove(img.id)}
                    className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/50"
                  >
                    <X size={14} className="text-white" />
                  </button>
                </div>
              ))}
              {form.images.length < 10 && (
                <ImageSlot
                  label="추가"
                  required={false}
                  image={null}
                  onUpload={handleImageUpload}
                  onRemove={handleImageRemove}
                />
              )}
            </div>

            <p className="text-right text-xs text-slate-400">{form.images.length}/10장</p>
          </Section>

          {/* ── 섹션 5: 간단 메모 ─────────────────────────────────── */}
          <Section>
            <SectionTitle>간단 메모</SectionTitle>
            <div>
              <textarea
                placeholder="임장 메모를 간단히 적어주세요 (예: 역세권, 관리 잘됨, 베란다 확장)"
                value={form.memo}
                maxLength={200}
                onChange={(e) => set('memo', e.target.value)}
                rows={4}
                className="w-full resize-none rounded-xl border border-slate-200 px-4 py-3 text-base outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 placeholder:text-slate-400"
              />
              <p className="mt-1 text-right text-xs text-slate-400">{form.memo.length}/200</p>
            </div>
          </Section>
        </div>

        {/* ── 하단 고정 버튼 ───────────────────────────────────── */}
        <div className="fixed bottom-0 left-0 right-0 z-20 mx-auto w-full max-w-app border-t border-slate-100 bg-white/95 px-5 pb-safe pt-3 backdrop-blur-sm">
          {!allRequiredDone && (
            <p className="mb-2 text-center text-xs text-slate-400">
              필수 항목 {5 - requiredDone}개를 더 입력해주세요
            </p>
          )}
          <button
            type="button"
            onClick={handleSave}
            disabled={!allRequiredDone || isSaving}
            className="btn-primary disabled:opacity-50"
          >
            {isSaving ? <Spinner size="sm" className="text-white" /> : '저장하기'}
          </button>
        </div>
      </div>
    </>
  );
};

export default PropertyNewPage;
