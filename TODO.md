# 수정사항 (TODO)

이 문서에 있는 항목들을 위에서부터 순서대로 수정해.
각 항목 수정 완료 후 `npm run build` 확인하고, 해당 항목을 이 문서에서 삭제해.
모든 항목 처리 후 커밋+푸시해.

---

## 1. 상세 페이지 편의시설/체크리스트 아이콘 통일

현재 편의시설 아이콘들이 카테고리마다 전부 다른 색상이라 정신없음.

### 편의시설 아이콘 — 전부 회색 톤 통일
- 아이콘 배경: `bg-slate-100`
- 아이콘 색상: `text-slate-600`
- 아이콘 원: `w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0`
- 시설명: `truncate` 적용 (긴 이름 잘림 처리)
- 아이콘과 텍스트 사이 `gap-3`

Lucide 아이콘 매핑 (모두 `text-slate-600`):
- CS2 (편의점): `Store`
- MT1 (대형마트): `ShoppingCart`
- BK9 (은행): `Landmark`
- HP8 (병원): `Building2`
- PM9 (약국): `Pill`

### 체크리스트 아이콘 — 3색만 사용
- 긍정 (입주 가능, 재방문 있음): `bg-emerald-100` + `text-emerald-600` 체크
- 부정 (주차 불가): `bg-red-100` + `text-red-500` X
- 정보 (가격 적정, 관리비): `bg-slate-100` + `text-slate-600`

파일: `src/pages/PropertyDetailPage.jsx`

---

## 2. 수정 페이지 저장 로직 수정 (500 에러 해결) ⚠️ 치명적

현재 `handleSave`가 백엔드 DTO에 없는 필드까지 전부 보내서 500 에러 발생.
백엔드 DTO에 맞는 7개 필드만 전송하도록 변경.

### 수정할 코드: `handleSave` (PropertyEditPage.jsx)

AS-IS (현재 — 불필요한 필드 포함):
```js
save({
  address, addressDetail, priceType, deposit, monthlyRent,
  price, area, currentFloor, totalFloors, rating,
  priceEvaluation, checkItems, surroundings,
  moveInAvailable, revisitIntention, memo,
});
```

TO-BE (백엔드 DTO에 맞게):
```js
save({
  moveInAvailable,
  revisitIntention,
  priceEvaluation: priceEvaluation === 'FAIR' ? 'REASONABLE' : priceEvaluation,
  parkingType: parkingType || 'UNKNOWN',
  maintenanceFee: maintenanceFee ? Number(maintenanceFee) : null,
  environments: surroundings,
  memo: memo || null,
});
```

### 핵심 매핑
- `priceEvaluation`: 프론트 `"FAIR"` → 백엔드 `"REASONABLE"` 변환 필수
- `surroundings` → `environments` 필드명 변경
- `parkingType`, `maintenanceFee` 추가 전송
- address, deposit, area 등 기본 정보 필드는 **보내지 않음**

### 위치정보 수정 섹션 제거
- 수정 페이지에서 "위치 정보" 섹션 전체를 제거 (수정할 필요 없음)
- 주소는 읽기 전용으로 상단에 표시만

파일: `src/pages/PropertyEditPage.jsx`

---

## 3. 수정 페이지 사진 삭제 버튼 임시 비활성화

백엔드 detail API가 이미지 ID를 반환하지 않아서 삭제 API 호출 불가.
백엔드 수정 전까지 삭제 버튼을 숨김.

### 수정
`EditImageSection` 컴포넌트에서 삭제 버튼(X 아이콘) 렌더링 제거 또는 `hidden` 처리.
이미지 추가 기능은 유지.

```jsx
{/* 삭제 버튼 임시 비활성화 — 백엔드 이미지 ID 반환 후 복원 */}
{/* <button onClick={() => handleDelete(img.id)}>...</button> */}
```

파일: `src/pages/PropertyEditPage.jsx` (EditImageSection)

---

## 4. 빠른 기록 페이지 섹션 순서 변경 + 진행률 가시성 개선

### 4-1. 섹션 순서 변경
현재: 위치정보 → 필수 체크리스트 → 저장
변경: **위치정보 → 매물정보 → 사진기록 → 필수 체크리스트 → 메모 → 저장**

임장 실제 플로우(주소 확인 → 가격 기록 → 사진 → 평가 → 메모)와 일치시킴.

### 4-2. 필수 항목 진행률 가시성 개선
현재 "필수 항목 ••••• 0/5" 표시가 너무 작고 안 보임.

수정:
- 프로그레스 바 높이: `h-2` → `h-3`
- 숫자: `text-xs` → `text-sm font-semibold`
- 색상: 채움 `bg-primary`, 비움 `bg-slate-200`
- 위치: "빠른 기록" 타이틀 바로 아래

```jsx
<div className="px-5 pb-3">
  <div className="flex items-center justify-between mb-1.5">
    <span className="text-sm font-semibold text-slate-700">필수 항목</span>
    <span className="text-sm font-bold text-primary">{filled}/5</span>
  </div>
  <div className="h-3 w-full rounded-full bg-slate-200 overflow-hidden">
    <div
      className="h-full rounded-full bg-primary transition-all duration-300"
      style={{ width: `${(filled / 5) * 100}%` }}
    />
  </div>
</div>
```

파일: `src/pages/PropertyNewPage.jsx`

---

## 5. Vaul Drawer 접근성 경고 수정

모든 Drawer에서 `DialogContent requires DialogTitle` 콘솔 에러 발생.

### 수정
프로젝트 전체에서 `Drawer.Content`를 사용하는 곳을 검색:
```bash
grep -rn 'Drawer.Content' src/ --include='*.jsx'
```

각 `Drawer.Content` 안에 `VisuallyHidden`으로 감싼 `Drawer.Title` 추가:
```jsx
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';

<Drawer.Content>
  <VisuallyHidden><Drawer.Title>드로어 제목</Drawer.Title></VisuallyHidden>
  {/* 기존 내용 */}
</Drawer.Content>
```

`@radix-ui/react-visually-hidden` 패키지가 없으면 설치:
```bash
npm install @radix-ui/react-visually-hidden
```

파일: Drawer 사용하는 모든 컴포넌트
