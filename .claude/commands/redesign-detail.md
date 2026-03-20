# /redesign-detail — 매물 상세 페이지 재설계 (Figma DetailWrite 기반)

PropertyDetailPage.jsx를 Figma 디자인 기반으로 전면 재설계해.
백엔드 실제 API 응답 구조에 정확히 맞춰서 구현해야 한다.

---

## 백엔드 실제 응답 구조 (GET /api/v1/properties/:id/detail)

```json
{
  "id": 14,
  "address": "서울 성동구 용답동 239-8",
  "createdAt": "2026-03-21T02:41:30.284851",
  "priceType": "JEONSE",
  "deposit": 999,
  "monthlyRent": null,
  "price": null,
  "maintenanceFee": 25,
  "area": 999,
  "currentFloor": 1123,
  "totalFloor": 22,
  "rating": 3,
  "images": ["/temp-images/user2/2026/03/thumb_xxx.png"],
  "evaluation": {
    "moveInAvailable": true,
    "revisitIntention": true,
    "priceEvaluation": "REASONABLE"
  },
  "parkingType": "NOT_AVAILABLE",
  "environments": [],
  "memo": null,
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
      { "category": "대형마트", "categoryCode": "MT1", "count": 1, "nearestName": "더드림식자재마트", "nearestDistance": 332 },
      { "category": "은행", "categoryCode": "BK9", "count": 15, "nearestName": "CU ATM", "nearestDistance": 21 },
      { "category": "병원", "categoryCode": "HP8", "count": 15, "nearestName": "한양정형외과의원", "nearestDistance": 139 },
      { "category": "약국", "categoryCode": "PM9", "count": 5, "nearestName": "4층현약국", "nearestDistance": 335 }
    ]
  }
}
```

**핵심 필드 매핑** (백엔드 → 프론트):
- `createdAt` → 방문일로 표시
- `price` → 매매가 (salePrice)
- `currentFloor` → 층수
- `totalFloor` → 전체 층수
- `images` → 문자열 배열 (객체 아님!)
- `evaluation.moveInAvailable` → 입주 가능
- `evaluation.revisitIntention` → 재방문 의사
- `evaluation.priceEvaluation` → 가격 평가 ("REASONABLE"/"EXPENSIVE"/"CHEAP")
- `parkingType` → "AVAILABLE"/"NOT_AVAILABLE"/"CONDITIONAL"
- `locationInfo` → null일 수 있음

---

## 레이아웃 (Figma 기반, 위에서 아래로 스크롤)

### 1. 헤더 (이미지 위 오버레이)
```
[← 뒤로]                    [··· 더보기]
```
- absolute 배치, 이미지 위에 떠있음
- 뒤로: ChevronLeft, 반투명 원형 버튼 (`bg-white/80 backdrop-blur-sm rounded-full`)
- 더보기: MoreVertical, 클릭 시 Vaul Drawer (수정/삭제)

### 2. 히어로 이미지 + 주소/가격 오버레이
```
[풀 너비 이미지]
  ┌─────────────────────────────────┐
  │ 📍 서울특별시 은평구 응암동 35-79  │
  │ 🏠 서울특별시 은평구               │
  │ 월세 1000만/50만                  │ ← 큰 파란/초록 텍스트
  │ ★★★★☆ 4.0  25평·5/15층·남향    │
  └─────────────────────────────────┘
```
- 이미지: Embla Carousel (여러 장일 때 스와이프)
- 이미지 하단에 그라데이션 오버레이 (`bg-gradient-to-t from-black/60`)
- 주소: 흰색 텍스트
- 가격: 큰 텍스트, Primary 컬러 (`text-primary font-bold text-xl`)
- 면적/층수/방향 info: `text-white/80 text-sm`
- 이미지 없을 때: 회색 플레이스홀더

### 3. 공유하기 버튼
```
[🔗 공유하기]
```
- 가운데 정렬, 테두리 있는 버튼
- `rounded-full border border-slate-200 px-4 py-2 text-sm`

### 4. 🚌 교통 정보 섹션
```
🚌 교통 정보

  🚇 지하철
  장한평역 5호선
  도보 7분 · 546m

  🚌 버스
  정보 없음
```
- 섹션 타이틀: 아이콘 + bold 텍스트
- 지하철: `locationInfo.subway` (null이면 "정보 없음")
  - 역명: `subway.nearestStation`
  - 거리: `subway.distance`m
  - 도보: `subway.walkTime`분
- 버스: `locationInfo.bus` (null이면 "정보 없음")
- locationInfo 자체가 null이면 섹션 전체 숨김

### 5. 🏪 편의시설 섹션
```
🏪 편의시설

  🏪 편의점          10개
  CU 녹번센트럴점
  도보 2분

  🛒 대형마트          1개
  GS더프레시
  도보 2분

  🏦 은행             14개
  e-투르세마을금고
  도보 3분

  🏥 병원             15개
  이로여성의원
  도보 3분

  💊 약국              8개
  서울온누리약국
  도보 3분
```
- `locationInfo.amenities` 배열 순회
- 각 항목: 카테고리 아이콘 + 카테고리명 + 개수 (우측) / 가장 가까운 이름 / 도보 시간
- 도보 시간 계산: `Math.ceil(nearestDistance / 80)` (80m/분 기준)
- Lucide 아이콘 매핑:
  - CS2 (편의점): Store
  - MT1 (대형마트): ShoppingCart
  - BK9 (은행): Landmark
  - HP8 (병원): Cross 또는 Building2
  - PM9 (약국): Pill
- locationInfo.amenities가 빈 배열이거나 locationInfo가 null이면 섹션 숨김

### 6. ✅ 체크리스트 검토 섹션
```
✅ 체크리스트 검토

  ✅ 즉시 입주 가능
  ✅ 재방문 의사 있음
  🏷 가격: 적정
  🚗 주차: 가능
  💰 관리비: 15만원

  [📝 체크리스트 수정하기]
```
- `evaluation.moveInAvailable` → "즉시 입주 가능" / "입주 불가"
- `evaluation.revisitIntention` → "재방문 의사 있음" / "재방문 의사 없음"
- `evaluation.priceEvaluation`:
  - "REASONABLE" → "적정"
  - "EXPENSIVE" → "비쌈"
  - "CHEAP" → "저렴"
- `parkingType`:
  - "AVAILABLE" → "가능"
  - "NOT_AVAILABLE" → "불가"
  - "CONDITIONAL" → "조건부"
- `maintenanceFee` → "N만원" (0이면 "없음")
- true 항목: 초록색 체크 아이콘 (Check, text-success)
- false 항목: 빨간색 X 아이콘 (X, text-danger)
- "체크리스트 수정하기" 버튼 → `/properties/:id/edit` 이동

### 7. 🏘 주변환경 섹션
```
🏘 주변환경

  [✓ 조용함]  [✓ 공원인접]
  [번화가]    [주택가]
  [대로변]    [골목안]
```
- `environments` 배열
- 선택된 것: `bg-primary-50 text-primary border-primary/20` 칩
- 선택 안 된 것: `bg-slate-100 text-slate-400` 칩
- environments가 빈 배열이면 섹션 숨김

### 8. 📝 메모 섹션
```
📝 메모

역세권, 관리 잘됨, 베란다 확장
```
- `memo` 필드 (null이면 "메모 없음" 또는 섹션 숨김)
- `whitespace-pre-wrap` 처리

### 9. 📷 추가 사진 섹션
```
📷 추가 사진 (2장)

[사진1]  [사진2]  [+ 추가]
```
- `images` 배열 (문자열 배열임 주의!)
- 이미지를 `typeof img === 'string' ? img : img.url`로 처리
- 가로 스크롤 그리드
- 클릭 시 확대 (선택사항)

### 10. 하단 정보
```
방문일: 2026년 1월 25일 오후 11:30
```
- `createdAt`을 한국어 날짜 포맷으로 표시

---

---

## UI/UX 디자인 강화 사항 (현재 페이지가 심심한 이유 + 해결)

현재 페이지는 모든 섹션이 flat text로 나열되어 있고, 카드/색상/아이콘 강조 없이 단조로움.
아래 개선사항을 **반드시** 적용해서 Figma 디자인 수준으로 만들 것.

### 1. 히어로 이미지: 그라데이션 오버레이 + 텍스트 오버레이
현재: 이미지 아래에 텍스트가 분리되어 있음.
변경: 이미지 **위에** 그라데이션 + 주소/가격 오버레이.
```css
/* 히어로 이미지 영역 */
.hero-image {
  position: relative;
  height: 280px; /* 고정 높이 */
  overflow: hidden;
}
.hero-gradient {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 60%;
  background: linear-gradient(to top, rgba(0,0,0,0.7), transparent);
}
.hero-text {
  position: absolute;
  bottom: 0;
  padding: 20px;
  color: white;
}
```
- 주소: `text-white text-lg font-bold`
- 가격: `text-primary-300 text-2xl font-bold` (초록색 강조)
- 별점 + 면적/층수: `text-white/80 text-sm`

### 2. 교통 정보: 카드 스타일
현재: 텍스트만 나열.
변경: 각 교통수단을 카드로 감싸기.
```jsx
<div className="rounded-2xl bg-slate-50 p-4 flex items-center gap-3">
  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
    <Train size={20} className="text-blue-600" />
  </div>
  <div>
    <p className="font-semibold text-slate-800">장한평역 5호선</p>
    <p className="text-xs text-slate-500">도보 7분 · 546m</p>
  </div>
</div>
```

### 3. 편의시설: 아이콘 배경 원 + 구조화된 리스트
현재: 단순 텍스트 나열.
변경: 각 시설마다 아이콘 원 + 시설명 + 개수(badge) + 도보시간.
```jsx
<div className="flex items-start gap-3 py-3">
  {/* 아이콘 원 */}
  <div className="w-9 h-9 rounded-full bg-emerald-50 flex items-center justify-center flex-shrink-0">
    <Store size={18} className="text-emerald-600" />
  </div>
  {/* 정보 */}
  <div className="flex-1">
    <div className="flex items-center justify-between">
      <span className="font-semibold text-sm text-slate-800">편의점</span>
      <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">15개</span>
    </div>
    <p className="text-xs text-slate-500 mt-0.5">CU 장한평스타힐스점</p>
    <p className="text-xs text-slate-400">도보 1분</p>
  </div>
</div>
```
카테고리별 아이콘 색상:
- 편의점 (CS2): bg-emerald-50, text-emerald-600
- 대형마트 (MT1): bg-orange-50, text-orange-600
- 은행 (BK9): bg-blue-50, text-blue-600
- 병원 (HP8): bg-red-50, text-red-600
- 약국 (PM9): bg-purple-50, text-purple-600

### 4. 체크리스트: 카드 + 색상 배지
현재: 단순 텍스트 + 아이콘.
변경: 각 항목을 상태 카드로, 긍정/부정 색상 구분.
```jsx
{/* 긍정 항목 */}
<div className="flex items-center gap-2.5 py-2">
  <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center">
    <Check size={14} className="text-emerald-600" />
  </div>
  <span className="text-sm text-slate-700">즉시 입주 가능</span>
</div>
{/* 부정 항목 */}
<div className="flex items-center gap-2.5 py-2">
  <div className="w-6 h-6 rounded-full bg-red-100 flex items-center justify-center">
    <X size={14} className="text-red-500" />
  </div>
  <span className="text-sm text-slate-700">주차 불가</span>
</div>
```
- "체크리스트 수정하기" 버튼: `rounded-full border border-primary text-primary px-4 py-2` (Figma의 파란색 테두리 버튼)

### 5. 주변환경: 칩 태그 스타일
현재: 없음.
변경: 선택된 환경 태그는 초록색 배경, 미선택은 회색.
```jsx
<div className="flex flex-wrap gap-2">
  {/* 선택된 태그 */}
  <span className="bg-primary/10 text-primary border border-primary/20 rounded-full px-3 py-1.5 text-xs font-medium">
    ✓ 조용함
  </span>
  {/* 미선택 태그 */}
  <span className="bg-slate-100 text-slate-400 rounded-full px-3 py-1.5 text-xs">
    번화가
  </span>
</div>
```

### 6. 매물 정보 요약 카드 (Figma 참조)
Figma에서 가격 아래에 `25평 · 5/15층 · 남향` 처럼 요약 정보를 한 줄로 표시.
```jsx
<p className="text-white/70 text-sm mt-1">
  {area && `${area}m²`}
  {floor && ` · ${floor}/${totalFloors}층`}
</p>
```

### 7. 섹션 헤더: 아이콘 + bold + 색상
현재: 단순 이모지 + 텍스트.
변경: Lucide 아이콘 + 색상 강조.
```jsx
{/* 섹션 헤더 컴포넌트 */}
const SectionHeader = ({ icon: Icon, title, iconColor = 'text-slate-700' }) => (
  <div className="flex items-center gap-2 mb-4">
    <Icon size={20} className={iconColor} />
    <h3 className="text-base font-bold text-slate-800">{title}</h3>
  </div>
);

// 사용
<SectionHeader icon={Bus} title="교통 정보" iconColor="text-blue-600" />
<SectionHeader icon={Building2} title="편의시설" iconColor="text-emerald-600" />
<SectionHeader icon={ClipboardCheck} title="체크리스트 검토" iconColor="text-amber-600" />
<SectionHeader icon={Trees} title="주변환경" iconColor="text-green-600" />
<SectionHeader icon={StickyNote} title="메모" iconColor="text-slate-600" />
<SectionHeader icon={Camera} title="사진" iconColor="text-indigo-600" />
```

### 8. 사진 섹션: 그리드 + 추가 버튼
현재: 단일 이미지.
변경: 3칸 가로 그리드 + "+ 추가" 버튼.
```jsx
<div className="grid grid-cols-3 gap-2">
  {images.map(img => (
    <div className="aspect-square rounded-xl overflow-hidden bg-slate-100">
      <img src={typeof img === 'string' ? img : img.url} className="w-full h-full object-cover" />
    </div>
  ))}
  {/* 추가 버튼 */}
  <button className="aspect-square rounded-xl border-2 border-dashed border-slate-300 flex items-center justify-center">
    <Plus size={24} className="text-slate-400" />
  </button>
</div>
```

### 9. 방문일 표시: 하단 부드러운 디자인
현재: 단순 텍스트.
변경: 하단에 subtle 배경 + 아이콘.
```jsx
<div className="mt-6 py-3 text-center">
  <p className="text-xs text-slate-400">
    📅 방문일: {formatDate(createdAt)}
  </p>
</div>
```

### 10. 공유하기 버튼 디자인
현재: 단순 테두리 버튼.
변경: Figma처럼 깔끔한 버튼.
```jsx
<button className="w-full py-2.5 rounded-xl border border-slate-200 text-sm text-slate-600 
  flex items-center justify-center gap-2 active:bg-slate-50">
  <Share2 size={16} />
  공유하기
</button>
```

---

## 변경 파일

1. **`src/pages/PropertyDetailPage.jsx`** — 전면 재작성
2. **`src/lib/utils.js`** — `normalizeProperty` 함수 업데이트 (이미 있으면 확인)

## 유지하는 것
- Embla Carousel (이미지 갤러리)
- Vaul Drawer (수정/삭제 메뉴)
- ConfirmModal (삭제 확인)
- PriceDisplay, RatingStars 컴포넌트
- Lucide 아이콘, cn() 유틸, Sonner toast

## 스타일 규칙
- 섹션 구분: `border-t border-slate-100 pt-5 mt-5`
- 섹션 타이틀: 아이콘(20px) + `text-base font-bold text-slate-800`
- 서브 항목: `text-sm text-slate-600`
- 거리/시간: `text-xs text-slate-400`
- 칩 태그: `rounded-full px-3 py-1.5 text-xs font-medium`
- 전체 배경: `bg-white`
- 페이지 패딩: `px-5` (이미지 부분은 full width)

---

## 완료 후
1. `npm run build` 성공 확인
2. 빌드 에러 있으면 수정
3. `git add -A && git commit -m "feat: 매물 상세 페이지 재설계 (Figma DetailWrite 기반, locationInfo 연동)" && git push origin main`
