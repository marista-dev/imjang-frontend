import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ChevronLeft, ImagePlus, X, Check, MapPin } from 'lucide-react';
import { toast } from 'sonner';
import * as Switch from '@radix-ui/react-switch';
import * as Tabs from '@radix-ui/react-tabs';
import { propertyApi } from '@/api/property';
import { imageApi } from '@/api/image';
import { RatingStars } from '@/components/RatingStars';
import { Spinner } from '@/components/Spinner';
import { cn } from '@/lib/utils';

const PRICE_TYPES = [
  { value: 'MONTHLY', label: '월세' },
  { value: 'JEONSE', label: '전세' },
  { value: 'SALE', label: '매매' },
];

const PRICE_RATINGS = [
  { value: 'CHEAP', label: '저렴해요', emoji: '😊' },
  { value: 'REASONABLE', label: '적당해요', emoji: '😐' },
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

const openAddressSearch = (onSelect) => {
  if (!window.daum?.Postcode) {
    toast.error('주소 검색 서비스를 불러오는 중이에요.');
    return;
  }
  new window.daum.Postcode({
    oncomplete: (data) => onSelect(data.roadAddress || data.jibunAddress),
  }).open();
};

const EditImageSection = ({ propertyId, images, onImagesChange }) => {
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
        onImagesChange((prev) => [...prev, { id: res.data.imageId, url: res.data.thumbnailUrl }]);
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
    } catch {
      toast.error('이미지 삭제에 실패했어요.');
    }
  };

  return (
    <div>
      <p className="mb-2 text-sm font-semibold text-slate-700">사진 ({images.length}/10)</p>
      <div className="grid grid-cols-4 gap-2">
        {images.map((img) => (
          <div key={img.id} className="relative aspect-square overflow-hidden rounded-xl bg-slate-100">
            <img src={img.url} alt="" loading="lazy" className="h-full w-full object-cover" />
            <button
              type="button"
              onClick={() => handleDelete(img.id)}
              className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/50 text-white"
            >
              <X size={14} />
            </button>
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
    queryKey: ['property-detail', id],
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
  const [checkItems, setCheckItems] = useState({});
  const [surroundings, setSurroundings] = useState([]);
  const [moveInAvailable, setMoveInAvailable] = useState(false);
  const [revisitIntention, setRevisitIntention] = useState(false);
  const [memo, setMemo] = useState('');

  // 기존 데이터 프리필
  useEffect(() => {
    if (!property) return;
    setImages(property.images ?? []);
    setAddress(property.address ?? '');
    setAddressDetail(property.addressDetail ?? '');
    setPriceType(property.priceType ?? 'MONTHLY');
    setDeposit(property.deposit != null ? String(property.deposit) : '');
    setMonthlyRent(property.monthlyRent != null ? String(property.monthlyRent) : '');
    setPrice(property.price != null ? String(property.price) : '');
    setArea(property.area != null ? String(property.area) : '');
    setCurrentFloor(property.currentFloor != null ? String(property.currentFloor) : '');
    setTotalFloors(property.totalFloors != null ? String(property.totalFloors) : '');
    setRating(property.rating ?? 0);
    setPriceEvaluation(property.priceEvaluation ?? '');
    setCheckItems(property.checkItems ?? {});
    setSurroundings(property.surroundings ?? []);
    setMoveInAvailable(property.moveInAvailable ?? false);
    setRevisitIntention(property.revisitIntention ?? false);
    setMemo(property.memo ?? '');
  }, [property]);

  const { mutate: save, isPending } = useMutation({
    mutationFn: (data) => propertyApi.update(id, data),
    onSuccess: () => {
      toast.success('수정이 완료되었어요.');
      queryClient.invalidateQueries({ queryKey: ['property-detail', id] });
      queryClient.invalidateQueries({ queryKey: ['properties-recent'] });
      queryClient.invalidateQueries({ queryKey: ['properties-timeline'] });
      navigate(`/properties/${id}`, { replace: true });
    },
    onError: () => toast.error('수정에 실패했어요. 다시 시도해주세요.'),
  });

  const handleSave = () => {
    if (!address) {
      toast.error('주소를 입력해주세요.');
      return;
    }
    save({
      address,
      addressDetail: addressDetail || null,
      priceType,
      deposit: deposit ? Number(deposit) : null,
      monthlyRent: monthlyRent ? Number(monthlyRent) : null,
      price: price ? Number(price) : null,
      area: area ? Number(area) : null,
      currentFloor: currentFloor ? Number(currentFloor) : null,
      totalFloors: totalFloors ? Number(totalFloors) : null,
      rating: rating || null,
      priceEvaluation: priceEvaluation || null,
      checkItems,
      surroundings,
      moveInAvailable,
      revisitIntention,
      memo: memo || null,
    });
  };

  const numInput = (setter) => (e) => setter(e.target.value.replace(/[^0-9.]/g, ''));

  const toggleCheck = (key) =>
    setCheckItems((prev) => ({ ...prev, [key]: !prev[key] }));

  const toggleSurrounding = (value) =>
    setSurroundings((prev) =>
      prev.includes(value) ? prev.filter((s) => s !== value) : [...prev, value]
    );

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* 헤더 */}
      <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="flex h-10 w-10 items-center justify-center rounded-xl text-slate-600 active:bg-slate-100"
        >
          <ChevronLeft size={24} />
        </button>
        <h1 className="text-base font-bold text-slate-800">매물 수정</h1>
        <button
          type="button"
          onClick={handleSave}
          disabled={isPending}
          className="flex h-9 items-center rounded-xl bg-primary px-4 text-sm font-semibold text-white disabled:opacity-60 active:scale-[0.98]"
        >
          {isPending ? <Spinner size="sm" className="text-white" /> : '저장'}
        </button>
      </div>

      {/* 폼 */}
      <div className="space-y-6 px-5 py-6 pb-24">
        {/* 사진 */}
        <EditImageSection propertyId={id} images={images} onImagesChange={setImages} />

        {/* 위치 */}
        <div className="space-y-3">
          <p className="text-sm font-semibold text-slate-700">위치</p>
          <button
            type="button"
            onClick={() => openAddressSearch(setAddress)}
            className={cn(
              'flex h-12 w-full items-center gap-2 rounded-xl border px-4 text-left text-base transition-all',
              address
                ? 'border-primary bg-primary-50 text-slate-800'
                : 'border-slate-200 bg-white text-slate-400',
            )}
          >
            <MapPin size={18} className={address ? 'text-primary' : 'text-slate-400'} />
            <span className="flex-1 truncate">{address || '주소 검색'}</span>
          </button>
          <input
            type="text"
            placeholder="상세 주소 (동/호수)"
            value={addressDetail}
            onChange={(e) => setAddressDetail(e.target.value)}
            className="h-12 w-full rounded-xl border border-slate-200 px-4 text-base outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 placeholder:text-slate-400"
          />
        </div>

        {/* 가격 */}
        <div className="space-y-3">
          <p className="text-sm font-semibold text-slate-700">가격 정보</p>
          <Tabs.Root value={priceType} onValueChange={setPriceType}>
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

          {priceType === 'MONTHLY' && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs text-slate-500">보증금 (만원)</label>
                <input type="text" inputMode="numeric" placeholder="1000" value={deposit} onChange={numInput(setDeposit)}
                  className="h-12 w-full rounded-xl border border-slate-200 px-4 text-base outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 placeholder:text-slate-400" />
              </div>
              <div>
                <label className="mb-1 block text-xs text-slate-500">월세 (만원)</label>
                <input type="text" inputMode="numeric" placeholder="50" value={monthlyRent} onChange={numInput(setMonthlyRent)}
                  className="h-12 w-full rounded-xl border border-slate-200 px-4 text-base outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 placeholder:text-slate-400" />
              </div>
            </div>
          )}
          {priceType === 'JEONSE' && (
            <div>
              <label className="mb-1 block text-xs text-slate-500">전세금 (만원)</label>
              <input type="text" inputMode="numeric" placeholder="30000" value={deposit} onChange={numInput(setDeposit)}
                className="h-12 w-full rounded-xl border border-slate-200 px-4 text-base outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 placeholder:text-slate-400" />
            </div>
          )}
          {priceType === 'SALE' && (
            <div>
              <label className="mb-1 block text-xs text-slate-500">매매가 (만원)</label>
              <input type="text" inputMode="numeric" placeholder="80000" value={price} onChange={numInput(setPrice)}
                className="h-12 w-full rounded-xl border border-slate-200 px-4 text-base outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 placeholder:text-slate-400" />
            </div>
          )}
        </div>

        {/* 기본 정보 */}
        <div className="space-y-3">
          <p className="text-sm font-semibold text-slate-700">기본 정보</p>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="mb-1 block text-xs text-slate-500">면적(㎡)</label>
              <input type="text" inputMode="decimal" placeholder="33" value={area} onChange={numInput(setArea)}
                className="h-12 w-full rounded-xl border border-slate-200 px-4 text-base outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 placeholder:text-slate-400" />
            </div>
            <div>
              <label className="mb-1 block text-xs text-slate-500">층수</label>
              <input type="text" inputMode="numeric" placeholder="3" value={currentFloor} onChange={numInput(setCurrentFloor)}
                className="h-12 w-full rounded-xl border border-slate-200 px-4 text-base outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 placeholder:text-slate-400" />
            </div>
            <div>
              <label className="mb-1 block text-xs text-slate-500">전체 층</label>
              <input type="text" inputMode="numeric" placeholder="10" value={totalFloors} onChange={numInput(setTotalFloors)}
                className="h-12 w-full rounded-xl border border-slate-200 px-4 text-base outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 placeholder:text-slate-400" />
            </div>
          </div>

          <div>
            <p className="mb-2 text-xs text-slate-500">전체 평가</p>
            <div className="flex items-center gap-3">
              <RatingStars rating={rating} onChange={setRating} size="lg" />
              {rating > 0 && (
                <span className="text-sm text-slate-500">
                  {['', '별로에요', '아쉬워요', '보통이에요', '좋아요', '최고에요'][rating]}
                </span>
              )}
            </div>
          </div>

          <div>
            <p className="mb-2 text-xs text-slate-500">가격 평가</p>
            <div className="flex gap-2">
              {PRICE_RATINGS.map(({ value, label, emoji }) => (
                <button key={value} type="button"
                  onClick={() => setPriceEvaluation((prev) => (prev === value ? '' : value))}
                  className={cn(
                    'flex flex-1 flex-col items-center gap-1 rounded-xl border py-3 text-xs font-medium transition-all active:scale-[0.97]',
                    priceEvaluation === value
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

        {/* 체크리스트 */}
        <div className="space-y-3">
          <p className="text-sm font-semibold text-slate-700">매물 환경</p>
          <div className="grid grid-cols-2 gap-2">
            {CHECK_ITEMS.map(({ key, label }) => (
              <button key={key} type="button" onClick={() => toggleCheck(key)}
                className={cn(
                  'flex items-center gap-2 rounded-xl border px-3 py-2.5 text-sm transition-all active:scale-[0.97]',
                  checkItems[key]
                    ? 'border-primary bg-primary-50 text-primary'
                    : 'border-slate-200 bg-white text-slate-600',
                )}
              >
                <div className={cn(
                  'flex h-5 w-5 items-center justify-center rounded-full border',
                  checkItems[key] ? 'border-primary bg-primary' : 'border-slate-300 bg-white',
                )}>
                  {checkItems[key] && <Check size={12} className="text-white" />}
                </div>
                {label}
              </button>
            ))}
          </div>

          <p className="pt-1 text-sm font-semibold text-slate-700">주변 시설</p>
          <div className="flex flex-wrap gap-2">
            {SURROUNDINGS.map(({ value, label }) => (
              <button key={value} type="button" onClick={() => toggleSurrounding(value)}
                className={cn(
                  'rounded-full border px-3 py-1.5 text-xs font-medium transition-all active:scale-[0.97]',
                  surroundings.includes(value)
                    ? 'border-primary bg-primary-50 text-primary'
                    : 'border-slate-200 bg-white text-slate-500',
                )}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="space-y-3 pt-1">
            <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3">
              <p className="text-sm font-medium text-slate-800">즉시 입주 가능</p>
              <Switch.Root checked={moveInAvailable} onCheckedChange={setMoveInAvailable}
                className={cn('relative h-6 w-11 rounded-full transition-colors', moveInAvailable ? 'bg-primary' : 'bg-slate-200')}>
                <Switch.Thumb className="block h-5 w-5 translate-x-0.5 rounded-full bg-white shadow transition-transform data-[state=checked]:translate-x-[22px]" />
              </Switch.Root>
            </div>
            <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3">
              <p className="text-sm font-medium text-slate-800">재방문 의향 있음</p>
              <Switch.Root checked={revisitIntention} onCheckedChange={setRevisitIntention}
                className={cn('relative h-6 w-11 rounded-full transition-colors', revisitIntention ? 'bg-primary' : 'bg-slate-200')}>
                <Switch.Thumb className="block h-5 w-5 translate-x-0.5 rounded-full bg-white shadow transition-transform data-[state=checked]:translate-x-[22px]" />
              </Switch.Root>
            </div>
          </div>
        </div>

        {/* 메모 */}
        <div>
          <p className="mb-2 text-sm font-semibold text-slate-700">메모</p>
          <textarea
            placeholder="임장 중 느낀 점을 자유롭게 기록하세요..."
            value={memo}
            onChange={(e) => setMemo(e.target.value)}
            rows={6}
            className="w-full resize-none rounded-xl border border-slate-200 px-4 py-3 text-base outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 placeholder:text-slate-400"
          />
        </div>
      </div>
    </div>
  );
};

export default PropertyEditPage;
