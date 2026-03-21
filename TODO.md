# 수정사항 (TODO)

이 문서에 있는 항목들을 위에서부터 순서대로 수정해.
각 항목 수정 완료 후 `npm run build` 확인하고, 해당 항목을 이 문서에서 삭제해.
모든 항목 처리 후 커밋+푸시해.

---

## 1. PropertyEditPage useBlocker 에러 수정

PropertyEditPage.jsx에서 `useBlocker` 훅 사용 → "useBlocker must be used within a data router" 에러.
현재 앱이 레거시 `<BrowserRouter>` 사용 중이므로 `useBlocker`를 쓸 수 없음.

- `useBlocker` 관련 코드 전부 삭제
- 라우터를 `createBrowserRouter`로 바꾸지 마
- 폼 변경 감지가 필요하면 `beforeunload` 이벤트 + ConfirmModal 조합으로 대체

---

## 2. Vaul Drawer 애니메이션 틀어짐 수정

Drawer가 열릴 때 오른쪽에서 왼쪽으로 미끄러지면서 중앙 정렬되는 버그.

원인: Drawer Content에 `left-1/2 -translate-x-1/2`가 있는데, Vaul의 translateY 애니메이션과 충돌.

수정: 프로젝트 전체에서 아래 패턴을 검색해서 변경:
```bash
grep -rn 'left-1/2.*-translate-x-1/2' src/ --include='*.jsx'
```

AS-IS: `className="fixed bottom-0 left-1/2 ... -translate-x-1/2 ..."`
TO-BE: `className="fixed bottom-0 left-0 right-0 mx-auto ..."`

---

## 3. 매물 등록 후 상세 페이지 이동 실패 (ID undefined)

백엔드 `POST /api/v1/properties` 응답에 생성된 ID가 없음.
응답: `{ "message": "매물이 성공적으로 기록되었습니다." }`

PropertyNewPage.jsx의 onSuccess에서 `/properties/${id}`로 이동 시도 → undefined.

수정: 상세 페이지 이동 대신 `/timeline`으로 이동:
```js
onSuccess: () => {
  toast.success('매물이 등록되었어요!');
  queryClient.invalidateQueries({ queryKey: ['properties-recent'] });
  queryClient.invalidateQueries({ queryKey: ['properties-timeline'] });
  navigate('/timeline', { replace: true });
},
```

---

## 4. 위치 확정 시 /location/prefetch 자동 호출

주소가 확정되는 시점에 `POST /api/v1/properties/location/prefetch`를 호출해야 함.

호출 시점 3곳 (PropertyNewPage.jsx):
1. 다음 주소 검색 완료 → `daum.Postcode.oncomplete` 콜백에서
2. 현재 위치 사용 완료 → `geocoder.coord2Address` 성공 콜백에서
3. 지도에서 선택 완료 → `handleMapConfirm` 함수에서

```js
const triggerPrefetch = (address, latitude, longitude) => {
  propertyApi.prefetchLocation({ address, latitude, longitude }).catch(() => {
    console.warn('location prefetch failed');
  });
};
```

비동기로 호출하고 실패해도 무시 (백그라운드 작업).

---

## 5. PropertyCard 세로형 대형 사진 카드로 재디자인

현재 64px 작은 썸네일 + 가로 배치 → **사진 상단 + 텍스트 하단 세로형 카드**로 변경.
임장 앱에서 "어떤 집이었지?" 회상할 때 사진이 핵심이므로 과감히 키움.

### 레이아웃 구조
```
┌────────────────────────────────┐
│ [대표 사진 전체 너비, 높이 160px]    │
│                         [1/3] │  ← 사진 장수 배지 (우상단)
├────────────────────────────────┤
│ 서울 성동구 가람길 287              │  ← 주소 (font-semibold)
│ 전세 1.1111억    25평 · 5/15층     │  ← 가격(primary) + 서브정보(회색)
│ ★★★★★ 5                  오늘 │  ← 별점 + 날짜
└────────────────────────────────┘
```

### 스타일 상세
```jsx
{/* PropertyCard 카드 */}
<div
  onClick={() => navigate(`/properties/${property.id}`)}
  className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm
    active:scale-[0.98] transition-all cursor-pointer"
>
  {/* 사진 영역 */}
  <div className="relative h-40 bg-slate-100">
    {thumbnailUrl ? (
      <img src={thumbnailUrl} alt="" className="h-full w-full object-cover" />
    ) : (
      <div className="flex h-full w-full items-center justify-center">
        <ImageOff size={32} className="text-slate-300" />
      </div>
    )}
    {/* 사진 장수 배지 (여러 장일 때만) */}
    {imageCount > 1 && (
      <span className="absolute top-2 right-2 bg-black/40 text-white
        text-[11px] px-2 py-0.5 rounded-full">1/{imageCount}</span>
    )}
  </div>
  {/* 텍스트 영역 */}
  <div className="p-4">
    <p className="text-[15px] font-semibold text-slate-800 truncate">{address}</p>
    <div className="flex items-baseline gap-2 mt-1.5">
      <span className="text-base font-bold text-primary">{priceText}</span>
      <span className="text-xs text-slate-400">
        {area && `${area}m²`}{floor && ` · ${floor}/${totalFloors}층`}
      </span>
    </div>
    <div className="flex items-center justify-between mt-2">
      <div className="flex items-center gap-1.5">
        <RatingStars rating={rating} size="sm" readOnly />
        <span className="text-sm text-slate-500 font-medium">{rating}</span>
      </div>
      <span className="text-[11px] text-slate-400">{relativeDate}</span>
    </div>
  </div>
</div>
```

### 이미지 없을 때
- 회색 플레이스홀더 + ImageOff 아이콘 (중앙)
- 배경: `bg-slate-100`

### 서브 정보 표시
- 면적(`area`), 층수(`floor/totalFloors`) 정보가 있으면 가격 옆에 회색 서브텍스트로 표시
- 없으면 가격만 표시

### 적용 위치
- `src/components/PropertyCard.jsx` — 전면 재작성
- 홈 페이지 최근 기록 + 타임라인 페이지 모두에서 사용됨

### 주의
- `normalizeProperty()` 유틸 함수로 정규화된 데이터 사용 (이미 적용되어 있음)
- `thumbnailUrl`이 문자열이면 그대로, 객체면 `.url` 처리
- 클릭 시 `/properties/:id` 로 네비게이션 (id 방어코드 포함)
