# /redesign-map — 지도 페이지 재설계 (Figma 기반)

현재 MapPage.jsx를 Figma 디자인 기반으로 전면 재설계해.
마커 클릭 시 기존 PropertyDetailPage로 이동하는 방식 유지.

---

## Map 페이지 레이아웃

### 전체 구조
```
[상단 오버레이]
  [🔍 지역 검색 input]  [필터 🔽]

[전체 화면 카카오맵]
  - 선호도 컬러 마커들 (초록/노랑/빨강)
  - 마커에 동네 이름 라벨 표시

[마커 클릭 시 하단 카드] ← Vaul Drawer
  [썸네일] | 서초구 서초동 789-12
           | 전세 2.8억
           | ★★★★☆        [상세보기]

[FAB +] ← FloatingActionButton (redesign-nav에서 구현)
[BottomNav] ← 3탭 glass (redesign-nav에서 구현)
```

### 상단 검색 + 필터 오버레이
- 지도 위에 absolute로 띄움
- 검색 input: `rounded-full bg-white/90 backdrop-blur-sm shadow-sm h-11 px-4`
  - 좌측: Search 아이콘 (Lucide)
  - placeholder: "지역 검색"
  - 검색 시 카카오맵 `places.keywordSearch()`로 장소 검색 → 지도 이동
- 필터 버튼: `rounded-full bg-white/90 backdrop-blur-sm shadow-sm h-11 px-3`
  - Filter 아이콘 (Lucide) + "필터" 텍스트
  - 클릭 시 Vaul Drawer로 필터 패널 열기 (선호도별 필터링)

### 카카오맵 설정
- 전체 화면 (`h-screen w-full`)
- 초기 위치: 사용자 현재 위치 (`navigator.geolocation`) 또는 서울 중심
- 줌 레벨: 5 (동네 단위)

### 마커 디자인
선호도(별점) 기반 컬러 마커:
- **초록 마커** (4~5점): `#22C55E` — 높은 선호
- **노랑 마커** (3점): `#F59E0B` — 보통
- **빨강 마커** (1~2점): `#EF4444` — 낮은 선호

마커 구현:
```js
// 카카오맵 커스텀 오버레이로 마커 생성
const markerColor = rating >= 4 ? '#22C55E' : rating === 3 ? '#F59E0B' : '#EF4444';

// SVG 원형 마커 (Figma 디자인처럼 동그란 점)
const markerContent = `
  <div style="
    width: 24px; height: 24px;
    background: ${markerColor};
    border-radius: 50%;
    border: 3px solid white;
    box-shadow: 0 2px 8px rgba(0,0,0,0.15);
    cursor: pointer;
  "></div>
`;

const overlay = new kakao.maps.CustomOverlay({
  position: new kakao.maps.LatLng(lat, lng),
  content: markerContent,
  yAnchor: 0.5,
});
```

마커 라벨 (동 이름):
- 마커 아래에 작은 텍스트로 동 이름 표시
- `text-xs font-medium text-slate-700 bg-white/80 px-1.5 py-0.5 rounded`

### 마커 클릭 → 하단 요약 카드
Vaul Drawer로 하단에서 슬라이드업:
```
[카드]
  [썸네일 80x80]  서초구 서초동 789-12      [상세보기 →]
                  서울특별시 서초구
                  전세 2.8억
                  ★★★★☆ 4.0
```

구현:
```jsx
<Drawer.Root open={selectedProperty !== null} onOpenChange={...}>
  <Drawer.Portal>
    <Drawer.Content className="fixed bottom-0 left-0 right-0 max-w-app mx-auto
      rounded-t-2xl bg-white px-5 pt-4 pb-safe border-t border-slate-200 shadow-lg">
      <Drawer.Handle className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-slate-300" />
      
      <div className="flex gap-3 items-center">
        {/* 썸네일 */}
        <div className="w-20 h-20 rounded-xl bg-slate-100 overflow-hidden flex-shrink-0">
          <img src={property.thumbnailUrl} className="w-full h-full object-cover" />
        </div>
        
        {/* 정보 */}
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-slate-800 truncate">{property.address}</p>
          <PriceDisplay ... className="text-sm mt-0.5" />
          <RatingStars rating={property.rating} size="sm" readOnly />
        </div>
        
        {/* 상세보기 버튼 */}
        <button onClick={() => navigate(`/properties/${property.id}`)}
          className="flex-shrink-0 bg-primary text-white text-sm font-semibold
            px-4 py-2 rounded-xl active:scale-95">
          상세보기
        </button>
      </div>
    </Drawer.Content>
  </Drawer.Portal>
</Drawer.Root>
```

### 뷰포트 변경 시 마커 리로드
- `kakao.maps.event.addListener(map, 'idle', ...)` 이벤트로 지도 이동/줌 완료 감지
- debounce(500ms)로 API 호출 최적화
- `GET /api/v1/properties/map/markers` 에 bounds 파라미터 전달:
  ```
  ?swLat=37.48&swLng=126.95&neLat=37.52&neLng=127.05
  ```

### 필터 Drawer
Vaul Drawer로 하단에서 올라오는 필터 패널:
```
[Drawer]
  선호도 필터
  
  [✓ 높은 선호 (4~5점)]  ← 초록
  [✓ 보통 (3점)]          ← 노랑  
  [✓ 낮은 선호 (1~2점)]  ← 빨강
  
  거래 유형
  [전세] [월세] [매매] [전체]
  
  [필터 적용]
```

---

## API 연동
- `GET /api/v1/properties/map/markers?swLat=...&swLng=...&neLat=...&neLng=...` → 마커 목록
- `GET /api/v1/properties/:id/summary` → 마커 클릭 시 요약 카드 데이터

---

## 마커 클릭 → 상세 페이지

마커 클릭 → 하단 카드의 "상세보기" 버튼 → `/properties/:id` (기존 PropertyDetailPage)

PropertyDetailPage는 이미 구현되어 있으므로 변경하지 않음.
단, Figma DetailWrite 디자인과 차이가 있으면 별도 `/redesign-property-detail` 프롬프트로 처리.

---

## 변경 파일
1. **`src/pages/MapPage.jsx`** — 전면 재작성
2. **`src/api/map.js`** — bounds 파라미터 추가 (이미 있으면 확인)

## 유지하는 것
- PriceDisplay, RatingStars 컴포넌트
- Vaul Drawer (하단 카드)
- Lucide 아이콘 (Search, Filter, MapPin, ChevronLeft)
- cn() 유틸리티
- 기존 API 모듈 (mapApi)

## 스타일 규칙
- 지도: 전체 화면, z-0
- 오버레이: z-10 (검색, 필터)
- 하단 카드: z-50 (Vaul Drawer)
- 검색/필터 바: glass 효과 (bg-white/90 backdrop-blur-sm)
- 마커: SVG 원형, 선호도별 3색, 흰색 border + shadow

---

## 완료 후
1. `npm run build` 성공 확인
2. 빌드 에러 있으면 수정
3. `git add -A && git commit -m "feat: 지도 페이지 재설계 (Figma 기반, 선호도 마커 + 검색 + 필터)" && git push origin main`
4. PROGRESS.md에 기록
