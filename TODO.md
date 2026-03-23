# 수정사항 (TODO)

이 문서에 있는 항목들을 위에서부터 순서대로 수정해.
각 항목 수정 완료 후 npm run build 확인하고, 해당 항목을 이 문서에서 삭제해.
모든 항목 처리 후 커밋+푸시해.

---

## [ ] MapPage MiniCard 전면 교체 + 지도 패닝 보정

### 배경

현재 카드: 사진(좌) + 정보(우) 수평 분할
변경 목표: 이미지(상단) + 흰 정보란(하단) 세로 분할

화살표는 흰 정보란 세로 중앙에서 마커 방향으로 돌출하는 삼각형.
마커 클릭 시 지도가 패닝되어 마커 + 카드가 모두 화면 안에 들어오게 함.

---

### 1. 상수 변경 — src/pages/MapPage.jsx 상단

```
기존:
const CARD_W = 192;
const CARD_H = 72;

변경:
const CARD_W = 160;   // 카드 너비
const IMG_H  = 86;    // 이미지 영역 높이
const INFO_H = 88;    // 흰 정보란 높이 (dong + price-row + meta 여백 포함)
const CARD_H = IMG_H + INFO_H;  // = 174  (y 클램핑에 사용)

// 화살표가 카드의 어느 y 위치에서 나오는지 — 정보란 세로 중앙
const ARROW_Y = IMG_H + INFO_H / 2;  // = 130
```

---

### 2. MiniCard JSX 전면 교체 — src/pages/MapPage.jsx

기존 컴포넌트 내용 전부 삭제하고 아래로 교체.

```jsx
const MiniCard = ({ property, position, onClose, onDetail }) => {
  const { side, x, y } = position;
  const thumbUrl =
    property.images?.[0]?.url ??
    (property.thumbnailUrl ? getImageUrl(property.thumbnailUrl) : null);
  const rating = property.rating ?? 0;
  const ratingColor =
    rating >= 4 ? '#22C55E' : rating === 3 ? '#F59E0B' : '#EF4444';

  const priceInfo = (() => {
    switch (property.priceType) {
      case 'MONTHLY_RENT':
      case 'MONTHLY':
        return {
          type: '월세',
          price: `${formatPrice(property.monthlyRent)}/${formatPrice(property.deposit)}`,
        };
      case 'JEONSE':
        return { type: '전세', price: formatPrice(property.deposit) };
      case 'SALE':
        return { type: '매매', price: formatPrice(property.salePrice) };
      default:
        return { type: '-', price: '-' };
    }
  })();

  // 화살표: side=right → 카드 왼쪽 엣지에서 마커 방향으로 튀어나옴
  //          side=left  → 카드 오른쪽 엣지에서 마커 방향으로 튀어나옴
  const arrowStyle = {
    position: 'absolute',
    top: ARROW_Y,
    transform: 'translateY(-50%)',
    width: 0,
    height: 0,
    zIndex: 4,
    ...(side === 'right'
      ? {
          left: -11,
          borderTop: '10px solid transparent',
          borderBottom: '10px solid transparent',
          borderRight: '12px solid #ffffff',
          filter: 'drop-shadow(-2px 0 3px rgba(0,0,0,0.09))',
        }
      : {
          right: -11,
          borderTop: '10px solid transparent',
          borderBottom: '10px solid transparent',
          borderLeft: '12px solid #ffffff',
          filter: 'drop-shadow(2px 0 3px rgba(0,0,0,0.09))',
        }),
  };

  return (
    <div
      className="absolute z-20 cursor-pointer overflow-visible"
      style={{
        width: CARD_W,
        left: x,
        top: y,
        animation: `minicard-in-${side} 200ms ease-out both`,
      }}
      onClick={() => onDetail(property.id)}
    >
      {/* 카드 본체 (상단 이미지 + 하단 정보) */}
      <div
        className="overflow-hidden rounded-2xl"
        style={{
          boxShadow: '0 4px 20px rgba(0,0,0,0.14), 0 0 0 0.5px rgba(0,0,0,0.07)',
        }}
      >
        {/* 상단: 이미지 */}
        <div className="relative" style={{ height: IMG_H, background: '#c8d8b8' }}>
          {thumbUrl ? (
            <img
              src={thumbUrl}
              alt=""
              loading="lazy"
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <ImageOff size={20} className="text-white/40" />
            </div>
          )}
          {/* 평수 뱃지 (있을 때만) */}
          {property.area && (
            <span
              className="absolute bottom-2 right-2 rounded-md px-1.5 py-0.5 text-[10px] text-white/90"
              style={{ background: 'rgba(28,28,30,0.5)' }}
            >
              {property.area}평
            </span>
          )}
          {/* X 닫기 */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            className="absolute right-1.5 top-1.5 flex h-[18px] w-[18px] items-center justify-center rounded-full"
            style={{ background: 'rgba(28,28,30,0.42)' }}
          >
            <X size={9} color="#fff" />
          </button>
        </div>

        {/* 하단: 흰 정보란 */}
        <div className="bg-white px-3 pb-2.5 pt-2" style={{ height: INFO_H }}>
          {/* 동 이름 */}
          <p className="truncate text-sm font-semibold text-[#1c1c1e]" style={{ letterSpacing: '-0.3px' }}>
            {getDongName(property.address)}
          </p>
          {/* 매물 유형 + 가격 */}
          <div className="mt-0.5 flex items-baseline gap-1">
            <span className="text-[11px] text-[#8e8e93]">{priceInfo.type}</span>
            <span
              className="font-bold text-[#1c1c1e]"
              style={{ fontSize: 15, letterSpacing: '-0.4px' }}
            >
              {priceInfo.price}
            </span>
          </div>
          {/* 별점 + 구분선 + 층수 */}
          <div className="mt-1.5 flex items-center gap-1.5">
            <div
              className="h-[6px] w-[6px] flex-shrink-0 rounded-full"
              style={{ background: ratingColor }}
            />
            <span className="text-[11px] font-semibold" style={{ color: ratingColor }}>
              {rating}
            </span>
            {property.floor && (
              <>
                <div className="h-[9px] w-px bg-[#e5e5ea]" />
                <span className="text-[11px] text-[#8e8e93]">
                  {property.floor}/{property.totalFloor || '?'}층
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* 화살표 — 정보란 세로 중앙에서 마커 방향으로 */}
      <div style={arrowStyle} />
    </div>
  );
};
```

---

### 3. 지도 패닝 보정 — handleMarkerClick 함수

카드 y 포지션 계산을 ARROW_Y 기준으로 수정해야 화살표가 마커와 수직으로 정확히 맞음.

현재:
```js
const cardYRaw = my - CARD_H / 2;
```

변경:
```js
// 화살표(ARROW_Y)가 마커(my)와 수직으로 맞도록 y 보정
const cardYRaw = my - ARROW_Y;
```

이후 클램핑 로직은 그대로 유지 (상하 잘림 방지):
```js
const cardY = Math.max(48, Math.min(cardYRaw, mapH - CARD_H - 8));
```

setTimeout 안의 newPoint 재계산 부분도 동일하게 cardYRaw → my - ARROW_Y 로 변경.

---

### 4. 트랜지션 keyframe 확인 — index.html 또는 글로벌 CSS

기존 `minicard-in-left`, `minicard-in-right` keyframe이 translateX만 사용하면 그대로 유지.
없으면 아래를 index.html <style> 또는 global CSS에 추가:

```css
@keyframes minicard-in-right {
  from { opacity: 0; transform: translateX(10px); }
  to   { opacity: 1; transform: translateX(0); }
}
@keyframes minicard-in-left {
  from { opacity: 0; transform: translateX(-10px); }
  to   { opacity: 1; transform: translateX(0); }
}
```

---

### 5. 패닝 smoothness 확인

kakao.maps panBy는 기본적으로 애니메이션 없이 즉시 이동함.
부드러운 이동을 원하면 panBy 대신 아래 방식 사용:

```js
// panBy → panTo로 교체해서 자연스럽게 이동
const currentCenter = map.getCenter();
const proj = map.getProjection();
const currentPoint = proj.containerPointFromCoords(currentCenter);
const newCenterPoint = new window.kakao.maps.Point(
  currentPoint.x + panX,
  currentPoint.y + panY,
);
const newCenter = proj.coordsFromContainerPoint(newCenterPoint);
map.panTo(newCenter);  // panTo는 부드럽게 이동
```

setTimeout 300ms는 panTo 애니메이션 완료 후 카드를 표시하기 위함 — 유지.

---

### 주의사항

- `property.area`, `property.floor`, `property.totalFloor` 는 normalizeProperty()에서
  이미 정규화되어 있을 수도 있고 없을 수도 있음. 없으면 해당 UI 요소 렌더링 생략.
- CARD_W/IMG_H/INFO_H/ARROW_Y 상수를 컴포넌트 바깥 최상단에 선언해서 
  MiniCard와 handleMarkerClick 양쪽에서 공유.
- 다른 파일 수정 없음 — MapPage.jsx 단일 파일만 수정.
