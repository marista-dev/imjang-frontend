import { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, MapPin, ImageOff } from 'lucide-react';
import { Drawer } from 'vaul';
import { mapApi } from '@/api/map';
import { PriceDisplay } from '@/components/PriceDisplay';
import { RatingStars } from '@/components/RatingStars';
import { Spinner } from '@/components/Spinner';
import { cn, getRelativeDate } from '@/lib/utils';

// 별점 → 마커 색상
const getMarkerColor = (rating) => {
  if (rating >= 4) return '#22C55E';  // success
  if (rating === 3) return '#F59E0B'; // warning
  return '#EF4444';                   // danger
};

// 커스텀 마커 SVG 생성
const createMarkerSvg = (color) => {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="40" viewBox="0 0 32 40">
    <circle cx="16" cy="16" r="13" fill="${color}" stroke="white" stroke-width="3"/>
    <polygon points="10,26 22,26 16,38" fill="${color}"/>
  </svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
};

const KAKAO_LOAD_TIMEOUT = 5000;

const MapPage = () => {
  const navigate = useNavigate();
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const markersRef = useRef([]);
  const [mapReady, setMapReady] = useState(false);
  const [mapError, setMapError] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [loadingMarkers, setLoadingMarkers] = useState(false);

  // 카카오맵 초기화
  useEffect(() => {
    const initMap = () => {
      if (!window.kakao?.maps) {
        setMapError(true);
        return;
      }
      window.kakao.maps.load(() => {
        if (!mapContainerRef.current) return;
        const options = {
          center: new window.kakao.maps.LatLng(37.5665, 126.9780),
          level: 8,
        };
        const map = new window.kakao.maps.Map(mapContainerRef.current, options);
        mapRef.current = map;
        setMapReady(true);
      });
    };

    // 이미 로드된 경우
    if (window.kakao?.maps) {
      initMap();
      return;
    }

    // 타임아웃으로 에러 처리
    const timer = setTimeout(() => {
      if (!mapReady) setMapError(true);
    }, KAKAO_LOAD_TIMEOUT);

    // SDK 로드 대기
    const checkKakao = setInterval(() => {
      if (window.kakao?.maps) {
        clearInterval(checkKakao);
        clearTimeout(timer);
        initMap();
      }
    }, 200);

    return () => {
      clearInterval(checkKakao);
      clearTimeout(timer);
    };
  }, []);

  // 마커 로드
  const loadMarkers = useCallback(async () => {
    const map = mapRef.current;
    if (!map) return;

    const bounds = map.getBounds();
    const sw = bounds.getSouthWest();
    const ne = bounds.getNorthEast();

    setLoadingMarkers(true);
    try {
      const res = await mapApi.getMarkers({
        swLat: sw.getLat(),
        swLng: sw.getLng(),
        neLat: ne.getLat(),
        neLng: ne.getLng(),
      });

      const properties = res.data?.markers ?? res.data ?? [];

      // 기존 마커 제거
      markersRef.current.forEach((m) => m.setMap(null));
      markersRef.current = [];

      // 새 마커 추가
      properties.forEach((p) => {
        if (!p.latitude || !p.longitude) return;
        const markerColor = getMarkerColor(p.rating ?? 0);
        const markerImage = new window.kakao.maps.MarkerImage(
          createMarkerSvg(markerColor),
          new window.kakao.maps.Size(32, 40),
          { offset: new window.kakao.maps.Point(16, 40) }
        );

        const marker = new window.kakao.maps.Marker({
          position: new window.kakao.maps.LatLng(p.latitude, p.longitude),
          map,
          image: markerImage,
          title: p.address,
        });

        window.kakao.maps.event.addListener(marker, 'click', () => {
          setSelectedProperty(p);
          setDrawerOpen(true);
        });

        markersRef.current.push(marker);
      });
    } catch {
      // 마커 로드 실패는 조용히 처리
    } finally {
      setLoadingMarkers(false);
    }
  }, []);

  // 지도 준비 후 이벤트 바인딩
  useEffect(() => {
    if (!mapReady) return;
    const map = mapRef.current;

    loadMarkers();

    // 드래그/줌 종료 시 재로드
    window.kakao.maps.event.addListener(map, 'dragend', loadMarkers);
    window.kakao.maps.event.addListener(map, 'zoom_changed', loadMarkers);

    return () => {
      window.kakao.maps.event.removeListener(map, 'dragend', loadMarkers);
      window.kakao.maps.event.removeListener(map, 'zoom_changed', loadMarkers);
    };
  }, [mapReady, loadMarkers]);

  const handleSummaryClick = () => {
    if (selectedProperty?.id) {
      setDrawerOpen(false);
      navigate(`/properties/${selectedProperty.id}`);
    }
  };

  return (
    <div className="relative h-screen w-full overflow-hidden">
      {/* 지도 컨테이너 */}
      <div ref={mapContainerRef} className="h-full w-full" />

      {/* 지도 로딩 중 */}
      {!mapReady && !mapError && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-50">
          <Spinner />
          <p className="mt-3 text-sm text-slate-500">지도를 불러오는 중...</p>
        </div>
      )}

      {/* 지도 에러 */}
      {mapError && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-50 px-6 text-center">
          <MapPin size={40} className="mb-3 text-slate-300" />
          <p className="text-sm font-medium text-slate-600">지도를 불러올 수 없어요</p>
          <p className="mt-1 text-xs text-slate-400">카카오맵 API 키를 확인해주세요.</p>
        </div>
      )}

      {/* 마커 로딩 인디케이터 */}
      {loadingMarkers && (
        <div className="absolute right-4 top-4 rounded-full bg-white px-3 py-1.5 shadow-md">
          <div className="flex items-center gap-1.5">
            <Spinner size="sm" />
            <span className="text-xs text-slate-500">로딩 중</span>
          </div>
        </div>
      )}

      {/* 하단 요약 카드 Drawer */}
      <Drawer.Root open={drawerOpen} onOpenChange={setDrawerOpen}>
        <Drawer.Portal>
          <Drawer.Overlay className="fixed inset-0 z-[90] bg-black/20" />
          <Drawer.Content className="fixed bottom-0 left-1/2 z-[91] w-full max-w-app -translate-x-1/2 rounded-t-2xl bg-white px-5 pb-safe pt-4">
            <Drawer.Handle className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-slate-300" />

            {selectedProperty && (
              <button
                type="button"
                onClick={handleSummaryClick}
                className="mb-4 flex w-full items-center gap-3 rounded-2xl border border-slate-100 p-3 text-left active:bg-slate-50"
              >
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
                    <div className="flex h-full w-full items-center justify-center text-slate-300">
                      <ImageOff size={28} />
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
                  <div className="flex items-center gap-2">
                    <RatingStars rating={selectedProperty.rating ?? 0} readOnly size="sm" />
                    <span className="text-xs text-slate-400">
                      {getRelativeDate(selectedProperty.visitedAt)}
                    </span>
                  </div>
                </div>

                <ChevronRight size={18} className="flex-shrink-0 text-slate-400" />
              </button>
            )}
          </Drawer.Content>
        </Drawer.Portal>
      </Drawer.Root>
    </div>
  );
};

export default MapPage;
