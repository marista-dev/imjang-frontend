import { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, SlidersHorizontal, MapPin, ImageOff, X } from 'lucide-react';
import { Drawer } from 'vaul';
import { toast } from 'sonner';
import { mapApi } from '@/api/map';
import { PriceDisplay } from '@/components/PriceDisplay';
import { RatingStars } from '@/components/RatingStars';
import { Spinner } from '@/components/Spinner';
import { cn, normalizeProperty } from '@/lib/utils';

// ─── 헬퍼 ────────────────────────────────────────────────────────────────────

// 마커 색상 상수 (CSS 변수 대신 상수로 관리 — CustomOverlay innerHTML 특성상)
const MARKER_COLORS = {
  HIGH: '#22C55E',    // success (green-500)
  MEDIUM: '#F59E0B',  // warning (amber-500)
  LOW: '#EF4444',     // danger (red-500)
  LABEL_TEXT: '#334155', // slate-700
  LABEL_BG: 'rgba(255,255,255,0.9)',
};

const getMarkerColor = (rating) => {
  if (rating >= 4) return MARKER_COLORS.HIGH;
  if (rating === 3) return MARKER_COLORS.MEDIUM;
  return MARKER_COLORS.LOW;
};

const getDongName = (address) => {
  if (!address) return '';
  const parts = address.split(' ');
  return (
    parts.find((p) => p.endsWith('동') || p.endsWith('리') || p.endsWith('읍')) ||
    parts[parts.length - 1] ||
    ''
  );
};

const RATING_FILTERS = [
  { key: 'high', label: '높은 선호', sublabel: '4~5점', color: '#22C55E' },
  { key: 'medium', label: '보통', sublabel: '3점', color: '#F59E0B' },
  { key: 'low', label: '낮은 선호', sublabel: '1~2점', color: '#EF4444' },
];

const PRICE_TYPE_FILTERS = [
  { value: '', label: '전체' },
  { value: 'JEONSE', label: '전세' },
  { value: 'MONTHLY', label: '월세' },
  { value: 'SALE', label: '매매' },
];

// ─── 메인 컴포넌트 ────────────────────────────────────────────────────────────

const MapPage = () => {
  const navigate = useNavigate();

  // 지도
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const overlaysRef = useRef([]);
  const allMarkersRef = useRef([]);
  const debounceRef = useRef(null);
  const filtersRef = useRef(null); // 최신 filters 참조용

  // 상태
  const [mapReady, setMapReady] = useState(false);
  const [mapError, setMapError] = useState(false);
  const [loadingMarkers, setLoadingMarkers] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [filters, setFilters] = useState({
    ratings: ['high', 'medium', 'low'],
    priceType: '',
  });

  // filters 최신값 ref 동기화
  filtersRef.current = filters;

  // ── 마커 렌더링 ─────────────────────────────────────────────────────────────

  const renderMarkers = useCallback((data, activeFilters) => {
    // 기존 오버레이 제거
    overlaysRef.current.forEach((o) => o.setMap(null));
    overlaysRef.current = [];
    if (!mapRef.current || !window.kakao?.maps) return;

    data.forEach((p) => {
      if (!p.latitude || !p.longitude) return;

      const rating = p.rating ?? 0;
      const cat = rating >= 4 ? 'high' : rating === 3 ? 'medium' : 'low';

      if (!activeFilters.ratings.includes(cat)) return;
      if (activeFilters.priceType && p.priceType !== activeFilters.priceType) return;

      const color = getMarkerColor(rating);
      const dong = getDongName(p.address);

      const el = document.createElement('div');
      el.style.cssText = 'display:flex;flex-direction:column;align-items:center;cursor:pointer;user-select:none;';

      const dot = document.createElement('div');
      Object.assign(dot.style, {
        width: '20px', height: '20px',
        background: color, borderRadius: '50%',
        border: '2.5px solid white',
        boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
        transition: 'transform .15s',
      });
      el.appendChild(dot);

      if (dong) {
        const label = document.createElement('span');
        label.textContent = dong;
        Object.assign(label.style, {
          marginTop: '2px', fontSize: '12px', fontWeight: '500',
          color: MARKER_COLORS.LABEL_TEXT, background: MARKER_COLORS.LABEL_BG,
          padding: '1px 5px', borderRadius: '4px', whiteSpace: 'nowrap',
        });
        el.appendChild(label);
      }

      el.addEventListener('click', () => {
        setSelectedProperty(normalizeProperty(p));
        setDrawerOpen(true);
      });

      const overlay = new window.kakao.maps.CustomOverlay({
        position: new window.kakao.maps.LatLng(p.latitude, p.longitude),
        content: el,
        yAnchor: 0.5,
        zIndex: 1,
      });
      overlay.setMap(mapRef.current);
      overlaysRef.current.push(overlay);
    });
  }, []);

  // ── 마커 로드 ────────────────────────────────────────────────────────────────

  const loadMarkers = useCallback(async () => {
    const map = mapRef.current;
    if (!map) return;

    const bounds = map.getBounds();
    const sw = bounds.getSouthWest();
    const ne = bounds.getNorthEast();

    setLoadingMarkers(true);
    try {
      const res = await mapApi.getMarkers({
        southWestLat: sw.getLat(),
        southWestLng: sw.getLng(),
        northEastLat: ne.getLat(),
        northEastLng: ne.getLng(),
        zoomLevel: map.getLevel(),
      });
      const data = res.data?.markers ?? res.data ?? [];
      allMarkersRef.current = data;
      renderMarkers(data, filtersRef.current);
    } catch {
      // silent
    } finally {
      setLoadingMarkers(false);
    }
  }, [renderMarkers]);

  // ── 카카오맵 초기화 ──────────────────────────────────────────────────────────

  useEffect(() => {
    const initMap = (lat, lng) => {
      if (!window.kakao?.maps || !mapContainerRef.current) return;
      window.kakao.maps.load(() => {
        const map = new window.kakao.maps.Map(mapContainerRef.current, {
          center: new window.kakao.maps.LatLng(lat, lng),
          level: 5,
        });
        mapRef.current = map;
        setMapReady(true);
      });
    };

    const startInit = () => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (pos) => initMap(pos.coords.latitude, pos.coords.longitude),
          () => initMap(37.5665, 126.9780),
          { timeout: 5000 },
        );
      } else {
        initMap(37.5665, 126.9780);
      }
    };

    if (window.kakao?.maps) {
      startInit();
      return;
    }

    // SDK 로드 대기 (최대 6초)
    let elapsed = 0;
    const check = setInterval(() => {
      elapsed += 200;
      if (window.kakao?.maps) {
        clearInterval(check);
        startInit();
      } else if (elapsed >= 6000) {
        clearInterval(check);
        setMapError(true);
      }
    }, 200);

    return () => clearInterval(check);
  }, []);

  // ── 지도 준비 후 이벤트 바인딩 ──────────────────────────────────────────────

  useEffect(() => {
    if (!mapReady) return;
    const map = mapRef.current;

    loadMarkers();

    const onIdle = () => {
      clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(loadMarkers, 500);
    };

    window.kakao.maps.event.addListener(map, 'idle', onIdle);
    return () => {
      window.kakao.maps.event.removeListener(map, 'idle', onIdle);
      clearTimeout(debounceRef.current);
    };
  }, [mapReady, loadMarkers]);

  // ── 필터 변경 시 마커 재렌더 ────────────────────────────────────────────────

  useEffect(() => {
    if (!mapReady) return;
    renderMarkers(allMarkersRef.current, filters);
  }, [filters, mapReady, renderMarkers]);

  // ── 검색 ─────────────────────────────────────────────────────────────────────

  const handleSearch = (e) => {
    e?.preventDefault();
    const keyword = searchText.trim();
    if (!keyword || !window.kakao?.maps) return;
    const places = new window.kakao.maps.services.Places();
    places.keywordSearch(keyword, (data, status) => {
      if (status === window.kakao.maps.services.Status.OK && data.length > 0) {
        const coords = new window.kakao.maps.LatLng(
          parseFloat(data[0].y),
          parseFloat(data[0].x),
        );
        mapRef.current?.setCenter(coords);
        mapRef.current?.setLevel(5);
      } else {
        toast.error('검색 결과가 없어요.');
      }
    });
  };

  // ── 필터 토글 ────────────────────────────────────────────────────────────────

  const toggleRating = (cat) =>
    setFilters((prev) => ({
      ...prev,
      ratings: prev.ratings.includes(cat)
        ? prev.ratings.filter((r) => r !== cat)
        : [...prev.ratings, cat],
    }));

  const activePriceTypeFilters = PRICE_TYPE_FILTERS.filter(({ value }) => value !== '');
  const activeFilterCount =
    (3 - filters.ratings.length) + (filters.priceType ? 1 : 0);

  // ── 렌더 ─────────────────────────────────────────────────────────────────────

  return (
    <div className="relative h-screen w-full overflow-hidden">
      {/* 지도 */}
      <div ref={mapContainerRef} className="h-full w-full" />

      {/* 로딩 */}
      {!mapReady && !mapError && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-50">
          <Spinner />
          <p className="mt-3 text-sm text-slate-500">지도를 불러오는 중...</p>
        </div>
      )}

      {/* 에러 */}
      {mapError && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-50 px-6 text-center">
          <MapPin size={40} className="mb-3 text-slate-300" />
          <p className="text-sm font-medium text-slate-600">지도를 불러올 수 없어요</p>
          <p className="mt-1 text-xs text-slate-400">카카오맵 API 키를 확인해주세요.</p>
        </div>
      )}

      {/* ── 상단 검색 + 필터 오버레이 ─────────────────────────────────────────── */}
      {mapReady && (
        <div className="absolute left-0 right-0 top-0 z-10 px-4 pt-4">
          <div className="flex gap-2">
            {/* 검색 */}
            <form onSubmit={handleSearch} className="flex flex-1 items-center gap-2 rounded-full bg-white/90 px-4 shadow-md backdrop-blur-sm" style={{ height: 44 }}>
              <Search size={16} className="flex-shrink-0 text-slate-400" />
              <input
                type="search"
                placeholder="지역 검색"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                className="flex-1 bg-transparent text-sm text-slate-800 outline-none placeholder:text-slate-400"
                style={{ fontSize: 16 }}
              />
              {searchText && (
                <button type="button" onClick={() => setSearchText('')}>
                  <X size={14} className="text-slate-400" />
                </button>
              )}
            </form>

            {/* 필터 */}
            <button
              type="button"
              onClick={() => setFilterOpen(true)}
              className={cn(
                'flex flex-shrink-0 items-center gap-1.5 rounded-full px-3.5 shadow-md backdrop-blur-sm transition-colors',
                activeFilterCount > 0
                  ? 'bg-primary text-white'
                  : 'bg-white/90 text-slate-600',
              )}
              style={{ height: 44 }}
            >
              <SlidersHorizontal size={16} />
              <span className="text-sm font-medium">필터</span>
              {activeFilterCount > 0 && (
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white/30 text-xs font-bold">
                  {activeFilterCount}
                </span>
              )}
            </button>
          </div>
        </div>
      )}

      {/* 마커 로딩 표시 */}
      {loadingMarkers && (
        <div className="absolute right-4 top-16 z-10 flex items-center gap-1.5 rounded-full bg-white/90 px-3 py-1.5 shadow-md backdrop-blur-sm">
          <Spinner size="sm" />
          <span className="text-xs text-slate-500">불러오는 중</span>
        </div>
      )}

      {/* ── 하단 요약 카드 ─────────────────────────────────────────────────────── */}
      <Drawer.Root open={drawerOpen} onOpenChange={setDrawerOpen}>
        <Drawer.Portal>
          <Drawer.Overlay className="fixed inset-0 z-[90] bg-black/20" />
          <Drawer.Content className="fixed bottom-0 left-1/2 z-[91] w-full max-w-app -translate-x-1/2 rounded-t-2xl bg-white px-5 pb-safe pt-4 shadow-xl">
            <Drawer.Handle className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-slate-300" />

            {selectedProperty && (
              <div className="mb-4 flex items-center gap-3">
                {/* 썸네일 */}
                <div className="h-20 w-20 flex-shrink-0 overflow-hidden rounded-xl bg-slate-100">
                  {selectedProperty.thumbnailUrl ? (
                    <img
                      src={selectedProperty.thumbnailUrl}
                      alt={selectedProperty.address}
                      loading="lazy"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      <ImageOff size={24} className="text-slate-300" />
                    </div>
                  )}
                </div>

                {/* 정보 */}
                <div className="flex min-w-0 flex-1 flex-col gap-1">
                  <p className="truncate text-sm font-semibold text-slate-800">
                    {selectedProperty.address}
                  </p>
                  <PriceDisplay
                    priceType={selectedProperty.priceType}
                    deposit={selectedProperty.deposit}
                    monthlyRent={selectedProperty.monthlyRent}
                    salePrice={selectedProperty.salePrice}
                    className="text-sm"
                  />
                  <RatingStars rating={selectedProperty.rating ?? 0} readOnly size="sm" />
                </div>

                {/* 상세보기 버튼 */}
                <button
                  type="button"
                  onClick={() => {
                    setDrawerOpen(false);
                    navigate(`/properties/${selectedProperty.id}`);
                  }}
                  className="flex-shrink-0 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white active:scale-95"
                >
                  상세보기
                </button>
              </div>
            )}
          </Drawer.Content>
        </Drawer.Portal>
      </Drawer.Root>

      {/* ── 필터 Drawer ────────────────────────────────────────────────────────── */}
      <Drawer.Root open={filterOpen} onOpenChange={setFilterOpen}>
        <Drawer.Portal>
          <Drawer.Overlay className="fixed inset-0 z-[90] bg-black/40" />
          <Drawer.Content className="fixed bottom-0 left-1/2 z-[91] w-full max-w-app -translate-x-1/2 rounded-t-2xl bg-white px-5 pb-safe pt-4">
            <Drawer.Handle className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-slate-300" />

            <div className="mb-5 flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-800">필터</h3>
              {activeFilterCount > 0 && (
                <button
                  type="button"
                  onClick={() => setFilters({ ratings: ['high', 'medium', 'low'], priceType: '' })}
                  className="text-sm text-slate-500"
                >
                  초기화
                </button>
              )}
            </div>

            {/* 선호도 필터 */}
            <div className="mb-5">
              <p className="mb-3 text-sm font-semibold text-slate-700">선호도</p>
              <div className="space-y-2">
                {RATING_FILTERS.map(({ key, label, sublabel, color }) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => toggleRating(key)}
                    className={cn(
                      'flex w-full items-center justify-between rounded-xl border px-4 py-3 transition-all active:scale-[0.98]',
                      filters.ratings.includes(key)
                        ? 'border-slate-200 bg-white'
                        : 'border-slate-100 bg-slate-50 opacity-50',
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className="h-3 w-3 rounded-full border-2 border-white shadow"
                        style={{ background: color }}
                      />
                      <div className="text-left">
                        <p className="text-sm font-medium text-slate-800">{label}</p>
                        <p className="text-xs text-slate-400">{sublabel}</p>
                      </div>
                    </div>
                    <div
                      className={cn(
                        'flex h-5 w-5 items-center justify-center rounded-full border-2',
                        filters.ratings.includes(key)
                          ? 'border-primary bg-primary'
                          : 'border-slate-300 bg-white',
                      )}
                    >
                      {filters.ratings.includes(key) && (
                        <svg viewBox="0 0 10 8" className="h-2.5 w-2.5 fill-white">
                          <path d="M1 4l3 3 5-6" stroke="white" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* 거래 유형 필터 */}
            <div className="mb-6">
              <p className="mb-3 text-sm font-semibold text-slate-700">거래 유형</p>
              <div className="flex flex-wrap gap-2">
                {PRICE_TYPE_FILTERS.map(({ value, label }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setFilters((prev) => ({ ...prev, priceType: value }))}
                    className={cn(
                      'rounded-full px-4 py-2 text-sm font-medium transition-all active:scale-95',
                      filters.priceType === value
                        ? 'bg-primary text-white'
                        : 'bg-slate-100 text-slate-500',
                    )}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="button"
              onClick={() => setFilterOpen(false)}
              className="btn-primary mb-2"
            >
              필터 적용
            </button>
          </Drawer.Content>
        </Drawer.Portal>
      </Drawer.Root>
    </div>
  );
};

export default MapPage;
