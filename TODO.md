# 수정사항 (TODO)

이 문서에 있는 항목들을 위에서부터 순서대로 수정해.
각 항목 수정 완료 후 `npm run build` 확인하고, 해당 항목을 이 문서에서 삭제해.
모든 항목 처리 후 커밋+푸시해.

---

## 1. BottomNav pill형 + FAB 나란히 하단 배치

현재 네비바가 전체 너비 네모 형태 + FAB이 네비바 위에 붙어있어 어색함.
→ **왼쪽에 콤팩트 pill 네비바 + 오른쪽에 원형 FAB**, 같은 높이로 나란히 배치.
두 컴포넌트는 별도 파일로 완전 분리.

### 네비바 디자인 스펙

**전체 형태:**
- `display: inline-flex` (콘텐츠 크기만큼만, 풀 너비 X)
- `border-radius: 999px` (완전 pill, 최대한 동그랗게)
- `background: #e8f5ee` (연한 초록)
- `padding: 5px`
- 위치: `fixed bottom-4 left-4` (하단 왼쪽)
- safe area: `pb-safe`

**활성 탭:**
- `background: #059669` (primary)로 pill 채움
- `border-radius: 999px`
- `padding: 9px 22px`
- 아이콘: `stroke: #fff`, 16px
- 텍스트: `color: #fff, font-weight: 500, font-size: 9px`
- glass 효과 사용 안 함. 단색 채움으로 확실한 반전

**비활성 탭:**
- 배경 없음
- 아이콘: `stroke: #94a3b8`
- 텍스트: `color: #94a3b8, font-size: 9px`

**탭 3개:** 홈(Home), 지도(Map), 타임라인(Clock) — Lucide 아이콘

### FAB 디자인 스펙

**형태:**
- 원형: `w-[50px] h-[50px] rounded-full`
- `background: #059669`
- 아이콘: Lucide `Plus`, `stroke: #fff`, size 22
- 위치: `fixed bottom-4 right-4` (하단 오른쪽)
- 네비바와 **같은 bottom 값** (수평 정렬)

### 스크롤 동작
- 아래 스크롤 → 네비바 + FAB **둘 다 숨김**
- 위 스크롤 → 네비바 + FAB **둘 다 표시**
- 최상단에서는 항상 표시
- 트랜지션: `transform 300ms cubic-bezier(0.4, 0, 0.2, 1)`
- 숨김 시: 둘 다 `translate-y-full opacity-0`

### useScrollDirection 훅
```js
// src/hooks/useScrollDirection.js
const useScrollDirection = () => {
  const [direction, setDirection] = useState('up');
  const lastY = useRef(0);
  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      if (y < 10) setDirection('up');
      else if (y > lastY.current + 5) setDirection('down');
      else if (y < lastY.current - 5) setDirection('up');
      lastY.current = y;
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  return direction;
};
```

### 컴포넌트 분리
- `src/components/BottomNav.jsx` — pill 네비바만 (전면 재작성)
- `src/components/FloatingActionButton.jsx` — FAB만 (새 파일)
- `src/hooks/useScrollDirection.js` — 스크롤 방향 감지 훅 (새 파일)
- 두 컴포넌트 모두 useScrollDirection으로 동일하게 숨김/표시

파일: `src/components/BottomNav.jsx`, `src/components/FloatingActionButton.jsx` (신규), `src/hooks/useScrollDirection.js` (신규)

---

## 2. 타임라인 페이지 상단 리디자인: 검색 + 필터 칩

현재 "타임라인 [+ 기록]"만 있어서 심심함. [+ 기록] 버튼은 FAB과 중복이므로 제거.
→ **검색바 + 거래유형/별점 필터 칩**으로 변경.

### 레이아웃
```
타임라인
  총 N건

[🔍 주소, 메모로 검색              ]

[전체]  [전세]  [월세]  [매매]  [⭐4+]

─────────────────────────────
오늘 · 3건
[카드]
[카드]
```

### 상세 스펙

**헤더:**
- 타이틀: `text-xl font-bold text-slate-800` "타임라인"
- 서브: `text-xs text-slate-400 mt-1` "총 N건" (API 응답의 전체 건수)
- [+ 기록] 버튼 제거 (FAB으로 대체됨)

**검색바:**
- `rounded-xl bg-white border border-slate-200 px-3 py-2.5`
- 좌측: Search 아이콘 (Lucide, 16px, text-slate-400)
- placeholder: "주소, 메모로 검색"
- 검색 시 프론트엔드 필터링 (현재 로드된 데이터에서 address, memo 포함 여부 체크)
- debounce 300ms

**필터 칩:**
- 가로 스크롤 `flex gap-2 overflow-x-auto`
- 활성: `bg-primary text-white rounded-full px-3 py-1.5 text-xs font-medium`
- 비활성: `bg-white text-slate-500 border border-slate-200 rounded-full px-3 py-1.5 text-xs`
- 칩 목록:
  - 전체 (기본 활성)
  - 전세 (priceType === 'JEONSE')
  - 월세 (priceType === 'MONTHLY_RENT')
  - 매매 (priceType === 'SALE')
  - ⭐ 4+ (rating >= 4)
- 단일 선택 (전체 vs 개별)
- "전체" 선택 시 필터 해제

**필터링 로직:**
```js
const filteredProperties = properties.filter(p => {
  // 검색어 필터
  if (searchQuery) {
    const q = searchQuery.toLowerCase();
    const matchAddr = p.address?.toLowerCase().includes(q);
    const matchMemo = p.memo?.toLowerCase().includes(q);
    if (!matchAddr && !matchMemo) return false;
  }
  // 거래유형 필터
  if (activeFilter !== 'ALL' && activeFilter !== 'RATING_4') {
    if (p.priceType !== activeFilter) return false;
  }
  // 별점 필터
  if (activeFilter === 'RATING_4') {
    if (p.rating < 4) return false;
  }
  return true;
});
```

파일: `src/pages/TimelinePage.jsx`
