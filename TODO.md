# 수정사항 (TODO)

이 문서에 있는 항목들을 위에서부터 순서대로 수정해.
각 항목 수정 완료 후 `npm run build` 확인하고, 해당 항목을 이 문서에서 삭제해.
모든 항목 처리 후 커밋+푸시해.

---

## 1. 홈 헤더 리디자인: [🏠]임장노트 → 인사말 중심

현재 `[홈아이콘] 임장노트` 헤더가 어색함. 앱 이름이 헤더 메인에 있을 필요 없음 (이미 앱 안에 있으니까).

AS-IS:
```
[🏠] 임장노트                    [로그아웃]
안녕하세요!
오늘도 좋은 매물을 찾아보세요.
```

TO-BE:
```
임장노트                          [M 아바타]
좋은 매물 찾으셨나요? 👋
```

변경사항:
- 초록 홈 아이콘 제거
- "임장노트"를 `text-xs text-slate-400 font-medium tracking-wide` 서브텍스트로
- 인사말을 메인 텍스트로 `text-xl font-bold`
- 기존 "안녕하세요!" + "오늘도 좋은 매물을..." 두 줄을 한 줄로 통합
- 우측: 로그아웃 아이콘 → 사용자 아바타 원 (이니셜 또는 기본 아이콘)
  - `w-10 h-10 rounded-full bg-gradient-to-br from-emerald-200 to-emerald-500`
  - 클릭 시 기존 로그아웃 Drawer 열기 (기능 유지)

파일: `src/pages/HomePage.jsx`

---

## 2. 별점 "5 5" 중복 표시 수정

PropertyCard에서 별점 옆 숫자가 두 번 표시됨 (★★★★★ 5 5).
RatingStars 컴포넌트가 숫자를 포함하고, PropertyCard에서도 별도로 숫자를 표시하기 때문.

수정: PropertyCard에서 rating 숫자를 **한 번만** 표시.
```jsx
<div className="flex items-center gap-1.5">
  <RatingStars rating={rating} size="sm" readOnly />
  <span className="text-sm text-slate-500 font-medium">{rating}</span>
</div>
```
- RatingStars 컴포넌트가 자체적으로 숫자를 렌더링하는지 확인
- 만약 RatingStars에 숫자가 포함되어 있으면 `showValue={false}` prop을 추가하거나, 외부 숫자를 제거
- 둘 중 하나만 남기기

파일: `src/components/PropertyCard.jsx`, `src/components/RatingStars.jsx`

---

## 3. 통계 카드 아이콘 추가

현재 통계 카드가 라벨+숫자만 있어서 밋밋함. 좌측에 아이콘 원을 추가.

AS-IS:
```
┌─────────────┐  ┌─────────────┐
│ 이번 달 기록  │  │ 전체 기록    │
│ 1 개         │  │ 1 개        │
└─────────────┘  └─────────────┘
```

TO-BE:
```
┌──────────────────┐  ┌──────────────────┐
│ [📋] 이번 달      │  │ [📊] 전체 기록    │
│      1 건         │  │      1 건        │
└──────────────────┘  └──────────────────┘
```

변경사항:
- 각 카드에 `flex items-center gap-3` 레이아웃
- 좌측 아이콘 원: `w-10 h-10 rounded-xl flex items-center justify-center`
  - 이번 달: `bg-emerald-50` + Lucide `CalendarDays` 아이콘 (`text-emerald-600`)
  - 전체: `bg-blue-50` + Lucide `BarChart3` 아이콘 (`text-blue-600`)
- 단위: "개" → "건" (부동산 용어에 맞게)

파일: `src/pages/HomePage.jsx`

---

## 4. PropertyCard 세로형 대형 사진 카드로 재디자인

현재 64px 작은 썸네일 + 가로 배치 → 사진 상단(160px) + 텍스트 하단 세로형 카드로 변경.

레이아웃:
```
┌────────────────────────────────┐
│ [대표 사진 전체 너비, h-40]      │
│                         [1/3] │
├────────────────────────────────┤
│ 서울 성동구 가람길 287           │
│ 전세 1.1111억    25평 · 5/15층  │
│ ★★★★★ 5.0    [입주가능]  오늘  │
└────────────────────────────────┘
```

스타일:
```jsx
<div onClick={() => navigate(`/properties/${property.id}`)}
  className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm
    active:scale-[0.98] transition-all cursor-pointer">
  {/* 사진 영역 */}
  <div className="relative h-40 bg-slate-100">
    {thumbnailUrl ? (
      <img src={thumbnailUrl} className="h-full w-full object-cover" />
    ) : (
      <div className="flex h-full w-full items-center justify-center">
        <ImageOff size={32} className="text-slate-300" />
      </div>
    )}
    {imageCount > 1 && (
      <span className="absolute top-2 right-2 bg-black/40 text-white text-[11px] px-2 py-0.5 rounded-full">
        1/{imageCount}
      </span>
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
      <div className="flex items-center gap-1.5">
        {canMoveIn && (
          <span className="text-[10px] bg-emerald-50 text-emerald-600 font-semibold px-2 py-0.5 rounded-md">
            입주가능
          </span>
        )}
        <span className="text-[11px] text-slate-400">{relativeDate}</span>
      </div>
    </div>
  </div>
</div>
```

추가사항:
- 이미지 없을 때: `bg-slate-100` + ImageOff 아이콘 (Lucide)
- id 없으면 네비게이션 안 함 (방어코드)
- `normalizeProperty()` 유틸 함수로 정규화된 데이터 사용

파일: `src/components/PropertyCard.jsx`

---

## 5. FAB(+) 버튼 스크롤 방향 감지로 숨김/표시

현재 FAB이 항상 고정되어 BottomNav 위에 붙어있어서 어색함.
당근마켓/인스타그램/X 스타일로 스크롤 방향에 따라 숨김/표시.

동작:
- 아래로 스크롤 → FAB + BottomNav 같이 숨김 (콘텐츠 집중)
- 위로 스크롤 → FAB + BottomNav 같이 표시 (액션 의도)
- 최상단에서는 항상 표시

구현:
```jsx
// useScrollDirection 커스텀 훅
const useScrollDirection = () => {
  const [direction, setDirection] = useState('up');
  const lastY = useRef(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentY = window.scrollY;
      if (currentY < 10) { setDirection('up'); }
      else if (currentY > lastY.current + 5) { setDirection('down'); }
      else if (currentY < lastY.current - 5) { setDirection('up'); }
      lastY.current = currentY;
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return direction;
};
```

적용:
```jsx
const direction = useScrollDirection();
const isHidden = direction === 'down';

// FAB
<button className={cn(
  "fixed bottom-24 right-5 ... transition-all duration-300",
  isHidden && "translate-y-24 opacity-0 pointer-events-none"
)}>+</button>

// BottomNav
<nav className={cn(
  "fixed bottom-0 ... transition-all duration-300",
  isHidden && "translate-y-full"
)}>
```

트랜지션: `transition: transform 300ms cubic-bezier(0.4, 0, 0.2, 1), opacity 300ms ease;`

파일: `src/hooks/useScrollDirection.js` (새 파일), `src/components/BottomNav.jsx`, FAB이 있는 레이아웃 파일
