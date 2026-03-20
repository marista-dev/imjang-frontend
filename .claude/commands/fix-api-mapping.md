# /fix-api-mapping — 백엔드 API 응답 구조에 맞게 프론트엔드 전면 수정

백엔드 API 응답 구조와 프론트엔드 데이터 매핑이 불일치하는 문제를 전면 수정해.
아래 이슈들을 **모두** 수정해야 한다.

---

## 이슈 1: 썸네일 이미지 깨짐 (전체 페이지)

**원인**: 백엔드가 `/temp-images/user2/2026/03/...` 경로로 이미지를 서빙하는데, Vite 프록시에 `/temp-images` 경로가 없음.

**수정**: `vite.config.js`에 `/temp-images` 프록시 추가:
```js
proxy: {
  '/api': { target: 'http://localhost:8080', changeOrigin: true, secure: false },
  '/images': { target: 'http://localhost:8080', changeOrigin: true, secure: false },
  '/temp-images': { target: 'http://localhost:8080', changeOrigin: true, secure: false },  // 추가
}
```

---

## 이슈 2: 홈 페이지 통계 "-" 표시

**원인**: 프론트엔드가 `/api/v1/properties/stats` 호출 → 백엔드에 이 API 없음 (405).
하지만 `/api/v1/properties/recent?limit=3` 응답에 이미 포함:
```json
{
  "properties": [...],
  "totalCount": 1,
  "monthlyRecordCount": 1
}
```

**수정**: `HomePage.jsx`에서 별도 stats API 호출 삭제하고, recent API 응답의 `totalCount`와 `monthlyRecordCount`를 사용:
- `propertyApi.getStats()` 호출 제거
- recent 쿼리 응답에서 `totalCount`, `monthlyRecordCount` 추출

---

## 이슈 3: 홈 페이지 가격 "전세 -"

**원인**: 백엔드 recent API 응답의 가격 구조가 중첩:
```json
{
  "priceType": "JEONSE",
  "priceInfo": {
    "deposit": 1212,
    "monthlyRent": null,
    "price": null
  }
}
```
프론트엔드 PropertyCard는 `property.deposit`, `property.salePrice` 등 flat 구조 기대.

**수정**: PropertyCard에 전달하기 전에 데이터 변환하거나, PropertyCard가 `priceInfo` 중첩 구조도 처리하도록 수정:
```js
// 데이터 정규화 함수
const normalizeProperty = (p) => ({
  ...p,
  deposit: p.priceInfo?.deposit ?? p.deposit,
  monthlyRent: p.priceInfo?.monthlyRent ?? p.monthlyRent,
  salePrice: p.priceInfo?.price ?? p.salePrice,
});
```

---

## 이슈 4: 타임라인 "NaN년 NaN월 NaN일"

**원인**: 백엔드 타임라인 응답 구조:
```json
{
  "timelineGroups": [
    {
      "date": "2026-03-21",
      "properties": [{ ... }]
    }
  ],
  "hasNext": false
}
```
프론트엔드는 Spring Page 구조 (`content`, `last`, `number`) 기대.

**수정**: `TimelinePage.jsx`의 데이터 파싱을 백엔드 구조에 맞게 전면 수정:
- `data.pages.flatMap(page => page.content)` → `data.pages.flatMap(page => page.timelineGroups)`
- 날짜 그룹핑: 백엔드가 이미 그룹핑해서 보내므로, 프론트에서 다시 그룹핑할 필요 없음
- `getNextPageParam`: `lastPage.last` → `!lastPage.hasNext`면 undefined

---

## 이슈 5: 타임라인 카드 데이터 빈칸

**원인**: 필드명 불일치:
- `totalFloor` (백엔드) vs `totalFloors` (프론트)
- `thumbnailUrl`이 `/temp-images/...` (이슈 1로 해결)
- 가격이 flat 구조 (이슈 3과 다름 — 타임라인은 flat으로 옴)

**수정**: PropertyCard에서 `totalFloor`도 처리하도록 또는 정규화 함수에서 통일.

---

## 이슈 6: 타임라인 무한 스크롤 page=1 반복 호출

**원인**: `getNextPageParam`이 Spring Page 구조 (`lastPage.last`, `lastPage.number`) 기대.
백엔드는 `hasNext: boolean`만 보내고 page number는 안 보냄.

**수정**:
```js
getNextPageParam: (lastPage, allPages) => {
  if (!lastPage.hasNext) return undefined;
  return allPages.length; // 다음 페이지 번호
},
```

---

## 이슈 7: 지도 마커 400 에러

**원인**: 프론트엔드 파라미터명과 백엔드가 다름 + zoomLevel 누락.

프론트엔드 (현재):
```
?swLat=37.52&swLng=127.05&neLat=37.59&neLng=127.07
```

백엔드 (기대):
```
?southWestLat=37.52&southWestLng=127.05&northEastLat=37.59&northEastLng=127.07&zoomLevel=5
```

**수정**: `src/api/map.js`의 `getMarkers` 함수 파라미터명 변경:
```js
getMarkers: ({ southWestLat, southWestLng, northEastLat, northEastLng, zoomLevel }) =>
  api.get('/properties/map/markers', {
    params: { southWestLat, southWestLng, northEastLat, northEastLng, zoomLevel }
  }),
```

그리고 `MapPage.jsx`에서 마커 API 호출 시 파라미터명 맞추기:
```js
const bounds = map.getBounds();
const sw = bounds.getSouthWest();
const ne = bounds.getNorthEast();
const zoomLevel = map.getLevel();

mapApi.getMarkers({
  southWestLat: sw.getLat(),
  southWestLng: sw.getLng(),
  northEastLat: ne.getLat(),
  northEastLng: ne.getLng(),
  zoomLevel,
});
```

---

## 이슈 8: 홈 페이지 "빠른 시작" 섹션 제거

**원인**: 하단 BottomNav에 지도/타임라인 버튼이 이미 있고, FAB에 매물 기록 버튼이 있으므로 "빠른 시작" 섹션이 완전히 중복.

**수정**: `HomePage.jsx`에서 "빠른 시작" 섹션 전체 제거.
홈 페이지 레이아웃을 단순화:
```
[환영 헤더: 임장노트 + 인사말]
[통계 카드 2개: 이번 달 / 전체]
[최근 기록 섹션: PropertyCard 목록]
[빈 상태 시: "아직 기록한 매물이 없어요" + CTA]
```

---

## 이슈 9: 위치 확정 시 /location/prefetch 자동 호출

**원인**: 주소가 확정되는 시점(주소 검색 완료, 현재 위치 사용 완료, 지도에서 선택 완료)에
`POST /api/v1/properties/location/prefetch`를 호출해야 백엔드가 주변 시설 정보를 미리 수집함.
현재 프론트엔드에서 이 호출이 없음.

**수정**: `PropertyNewPage.jsx`에서 주소가 확정되는 **모든 경로**에 prefetch 호출 추가:

```js
// 주소 확정 시 자동 호출 (비동기, 실패해도 무시)
const triggerPrefetch = (address, latitude, longitude) => {
  propertyApi.prefetchLocation({ address, latitude, longitude }).catch(() => {
    // prefetch 실패는 무시 (백그라운드 작업)
    console.warn('location prefetch failed');
  });
};
```

호출 시점 3곳:
1. **다음 주소 검색 완료** → `daum.Postcode.oncomplete` 콜백에서
2. **현재 위치 사용 완료** → `geocoder.coord2Address` 성공 콜백에서
3. **지도에서 선택 완료** → `handleMapConfirm` 함수에서

`src/api/property.js`의 `prefetchLocation` 함수가 이미 정의되어 있으므로 그대로 사용.

---

## 이슈 10: 상세 페이지 `/properties/undefined/detail` (ID가 undefined)

**원인**: PropertyCard에서 `navigate(`/properties/${id}`)` 호출 시 `id`가 undefined.
타임라인 페이지에서 데이터 파싱이 잘못되어 property 객체가 제대로 전달되지 않음.

**수정**: 
- 타임라인의 timelineGroups 파싱 수정으로 해결될 수 있음 (이슈 4와 연관)
- PropertyCard에서 id 확인 방어 코드 추가:
```js
const propertyId = property.id || property.propertyId;
if (!propertyId) return; // id 없으면 네비게이션 안 함
```

---

## 이슈 11: 상세 페이지 API 응답 필드 매핑

**원인**: PropertyDetailPage가 `/properties/:id/detail` API 응답을 파싱하는데,
백엔드 응답 필드명이 프론트엔드 기대와 다를 수 있음.
이미지도 `/temp-images/...` 경로라 프록시 없이 깨짐 (이슈 1).
가격 표시도 priceInfo 중첩 구조일 수 있음 (이슈 3).

**수정**: PropertyDetailPage에서도 `normalizeProperty()` 유틸 함수를 적용해서
응답 데이터를 정규화한 후 사용.

---

## 이슈 12: 상세 페이지 이미지 깨짐

**원인**: 백엔드 `images` 필드가 **문자열 배열** (`["/temp-images/..."]`)인데,
프론트엔드는 `[{id, url}]` 객체 배열을 기대함.

백엔드 응답:
```json
"images": ["/temp-images/user2/2026/03/thumb_xxx.png"]
```

프론트엔드 기대:
```json
"images": [{"id": 1, "url": "/temp-images/..."}]
```

**수정**: `PropertyDetailPage.jsx`의 ImageGallery에서 두 형식 모두 처리:
```js
const normalizedImages = (property.images || []).map((img, idx) =>
  typeof img === 'string' ? { id: idx, url: img } : img
);
```

---

## 이슈 13: 상세 페이지 체크리스트/입주/재방문 안 보임

**원인**: 백엔드가 `evaluation` 객체로 중첩 전달:
```json
"evaluation": {
  "moveInAvailable": true,
  "revisitIntention": false,
  "priceEvaluation": "REASONABLE"
}
```
프론트엔드는 flat 구조 기대: `property.canMoveIn`, `property.revisitWanted`, `property.priceRating`

**수정**: normalizeProperty에 evaluation 전개 추가:
```js
export const normalizeProperty = (p) => ({
  ...p,
  // 가격
  deposit: p.priceInfo?.deposit ?? p.deposit ?? null,
  monthlyRent: p.priceInfo?.monthlyRent ?? p.monthlyRent ?? null,
  salePrice: p.priceInfo?.price ?? p.price ?? p.salePrice ?? null,
  // 층수
  totalFloors: p.totalFloor ?? p.totalFloors ?? null,
  floor: p.currentFloor ?? p.floor ?? null,
  // 평가 (evaluation 중첩 구조 전개)
  canMoveIn: p.evaluation?.moveInAvailable ?? p.canMoveIn ?? null,
  revisitWanted: p.evaluation?.revisitIntention ?? p.revisitWanted ?? null,
  priceRating: p.evaluation?.priceEvaluation ?? p.priceRating ?? null,
  // 이미지 (문자열 배열 → 객체 배열)
  images: (p.images || []).map((img, idx) =>
    typeof img === 'string' ? { id: idx, url: img } : img
  ),
});
```

---

## 이슈 14: 상세 페이지 가격 표시 오류 ("전세 131만")

**원인**: 백엔드는 `deposit: 131` (만원 단위)로 보내는데 프론트 PriceDisplay는
`salePrice` 필드를 찾음. 백엔드 상세 API는 `price` 필드(매매가)를 쓈.

백엔드 상세 응답 필드명:
- `deposit` → 보증금/전세금
- `monthlyRent` → 월세
- `price` → 매매가 (프론트의 `salePrice`에 대응)

**수정**: normalizeProperty에서 `salePrice: p.price ?? p.salePrice` 로 매핑.
위의 이슈 13 normalizeProperty에 이미 포함됨.

---

## 이슈 15: 상세 페이지 locationInfo 주변 시설 표시

**원인**: 백엔드가 `locationInfo` 객체로 주변 시설 데이터를 보내주는데,
프론트엔드가 이 구조를 제대로 파싱/렌더링하지 못함.

**백엔드 실제 응답 구조**:
```json
"locationInfo": {
  "subway": {
    "nearestStation": "장한평역 5호선",
    "distance": 546,
    "walkTime": 7
  },
  "bus": null,
  "amenities": [
    {
      "category": "편의점",
      "categoryCode": "CS2",
      "count": 15,
      "nearestName": "CU 장한평스타힐스점",
      "nearestDistance": 19
    },
    {
      "category": "대형마트",
      "categoryCode": "MT1",
      "count": 1,
      "nearestName": "더드림식자재마트",
      "nearestDistance": 332
    },
    {
      "category": "은행",
      "categoryCode": "BK9",
      "count": 15,
      "nearestName": "CU 장한평지바트점 ATM",
      "nearestDistance": 21
    },
    {
      "category": "병원",
      "categoryCode": "HP8",
      "count": 15,
      "nearestName": "한양정형외과의원",
      "nearestDistance": 139
    },
    {
      "category": "약국",
      "categoryCode": "PM9",
      "count": 5,
      "nearestName": "4층현약국",
      "nearestDistance": 335
    }
  ]
}
```

**수정**: PropertyDetailPage에서 locationInfo를 제대로 파싱해서 표시:

교통 정보 섹션:
```jsx
{property.locationInfo?.subway && (
  <div>
    <span>🚇 지하철</span>
    <span>{property.locationInfo.subway.nearestStation}</span>
    <span>{property.locationInfo.subway.distance}m · 도보 {property.locationInfo.subway.walkTime}분</span>
  </div>
)}
{property.locationInfo?.bus && (
  <div>
    <span>🚌 버스</span>
    <span>{property.locationInfo.bus.nearestStop}</span>
    <span>{property.locationInfo.bus.distance}m</span>
  </div>
)}
```

편의시설 섹션:
```jsx
{property.locationInfo?.amenities?.map((a) => (
  <div key={a.categoryCode}>
    <span>{getCategoryIcon(a.categoryCode)} {a.category}</span>
    <span>{a.nearestName} {a.nearestDistance}m</span>
    <span>주변 {a.count}개</span>
  </div>
))}
```

카테고리 아이콘 매핑 (Lucide 아이콘 사용):
```js
const CATEGORY_ICONS = {
  CS2: Store,       // 편의점
  MT1: ShoppingCart, // 대형마트
  BK9: Landmark,    // 은행
  HP8: Hospital,    // 병원 (Cross 또는 Hospital)
  PM9: Pill,        // 약국
};
```

`locationInfo`가 `null`일 수 있음 (위치 prefetch가 아직 완료되지 않은 경우).
이 경우 "주변 시설 정보를 불러오는 중..." 또는 섹션 자체를 숨김.

---

## 이슈 16: 상세 페이지 전체 필드 매핑 종합 (백엔드 실제 응답 기준)

**백엔드 detail API 실제 응답 필드 전체 목록**:
```
id                          → property.id (OK)
address                     → property.address (OK)
createdAt                   → property.createdAt (프론트: visitedAt으로 사용)
priceType                   → property.priceType (OK, "JEONSE"/"MONTHLY_RENT"/"SALE")
deposit                     → property.deposit (보증금/전세금, 만원)
monthlyRent                 → property.monthlyRent (월세, 만원)
price                       → property.salePrice로 매핑 필요 (매매가)
maintenanceFee              → property.maintenanceFee (관리비, 만원)
area                        → property.area (m²)
currentFloor                → property.floor로 매핑 필요
totalFloor                  → property.totalFloors로 매핑 필요
rating                      → property.rating (1~5)
images                      → 문자열 배열 ["/temp-images/..."] → [{id, url}]로 변환
evaluation.moveInAvailable  → property.canMoveIn
evaluation.revisitIntention → property.revisitWanted
evaluation.priceEvaluation  → property.priceRating ("REASONABLE"/"EXPENSIVE"/"CHEAP")
parkingType                 → property.parkingType ("AVAILABLE"/"NOT_AVAILABLE"/"CONDITIONAL")
environments                → property.environments (배열)
memo                        → property.memo (문자열 or null)
locationInfo                → 위 이슈 15의 구조로 렌더링
```

PropertyDetailPage에서 `normalizeProperty()` 적용 후 렌더링하되,
`locationInfo`는 정규화하지 않고 그대로 사용 (구조가 이미 명확하므로).

`priceEvaluation` 값 매핑:
- "REASONABLE" → "적정해요" (FAIR)
- "EXPENSIVE" → "비싸요"
- "CHEAP" → "저렴해요"

`parkingType` 값 매핑:
- "AVAILABLE" → "주차 가능"
- "NOT_AVAILABLE" → "주차 불가"
- "CONDITIONAL" → "조건부 주차"

---

## 이슈 17: 지도 마커 안 보임 (markers 빈 배열)

**원인**: 매물에 위도/경도가 저장되어 있지 않음.
빠른 기록에서 "현재 위치 사용" / "지도에서 선택" 시 latitude/longitude를
formData에 저장하고 있지만, 매물 생성 API에 전달하는지 확인 필요.

**수정**: `PropertyNewPage.jsx`의 handleSubmit에서 payload에 `latitude`, `longitude` 필드가
정상적으로 포함되는지 확인. 이미 포함되어 있다면, 백엔드의
매물 생성 API가 좌표를 제대로 저장하는지는 백엔드 측 문제.

현재는 프론트엔드에서 할 수 있는 것: 위치 정보가 없는 매물은 지도에서 무시 (markers가 빈 배열이어도 에러 없이 처리).

---

## 수정할 파일 목록

1. **`vite.config.js`** — `/temp-images` 프록시 추가
2. **`src/api/map.js`** — 파라미터명 수정 (southWestLat 등 + zoomLevel)
3. **`src/pages/HomePage.jsx`** — stats API 제거, recent 응답에서 통계 추출, 가격 정규화
4. **`src/pages/TimelinePage.jsx`** — timelineGroups 구조 파싱, hasNext 기반 페이지네이션
5. **`src/pages/MapPage.jsx`** — 마커 API 파라미터명 수정
6. **`src/components/PropertyCard.jsx`** — priceInfo 중첩 구조 처리, totalFloor 지원, id 방어코드
7. **`src/pages/PropertyDetailPage.jsx`** — normalizeProperty 적용, 이미지/가격 필드 정규화
8. **`src/lib/utils.js`** — normalizeProperty 유틸 함수 추가

---

## 정규화 유틸 함수 (src/lib/utils.js에 추가)

```js
/**
 * 백엔드 API 응답의 매물 데이터를 프론트엔드 구조로 정규화
 */
export const normalizeProperty = (p) => ({
  ...p,
  deposit: p.priceInfo?.deposit ?? p.deposit ?? null,
  monthlyRent: p.priceInfo?.monthlyRent ?? p.monthlyRent ?? null,
  salePrice: p.priceInfo?.price ?? p.salePrice ?? null,
  totalFloors: p.totalFloor ?? p.totalFloors ?? null,
});
```

홈, 타임라인, 지도 등 매물 데이터를 표시하는 모든 곳에서 이 함수를 적용.

---

## 완료 후
1. `npm run build` 성공 확인
2. Vite dev server 재시작 (`/temp-images` 프록시 적용을 위해)
3. 빌드 에러 있으면 수정
4. `git add -A && git commit -m "fix: 백엔드 API 응답 구조 매핑 전면 수정 (이미지, 통계, 가격, 타임라인, 지도)" && git push origin main`
