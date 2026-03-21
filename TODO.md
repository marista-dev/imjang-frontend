# 수정사항 (TODO)

이 문서에 있는 항목들을 위에서부터 순서대로 수정해.
각 항목 수정 완료 후 `npm run build` 확인하고, 해당 항목을 이 문서에서 삭제해.
모든 항목 처리 후 커밋+푸시해.

---

## 1. BottomNav pill형 네비바 리디자인

현재 네비바가 화면 전체 너비를 차지하고 네모난 형태 → **콤팩트한 pill형 플로팅 네비바**로 변경.
Apple iOS 26 스타일 참고. glass 효과 대신 **단색 채움으로 활성 탭 표시**.

### 네비바 디자인 스펙

**전체 형태:**
- `display: inline-flex` (콘텐츠 크기만큼만 차지, 좌우 풀 너비 X)
- `border-radius: 999px` (완전 pill형, 최대한 동그랗게)
- `background: #e8f5ee` (연한 초록 배경)
- `border: 0.5px solid #d1e7dd`
- `padding: 5px`
- 하단 중앙 정렬: `fixed bottom-4 left-1/2 -translate-x-1/2` (단, Vaul 충돌 방지를 위해 `left-0 right-0 mx-auto w-fit` 방식도 가능)
- safe area 고려: `pb-safe`

**활성 탭 (현재 페이지):**
- `background: #059669` (primary emerald-600)으로 pill 채움
- `border-radius: 999px`
- `padding: 9px 22px`
- 아이콘: `stroke: #fff` (흰색)
- 텍스트: `color: #fff, font-weight: 500, font-size: 9px`
- glass 효과 사용하지 않음. 확실한 **색상 반전**으로 활성 상태 표시

**비활성 탭:**
- 배경 없음 (투명)
- `padding: 9px 22px`
- 아이콘: `stroke: #94a3b8` (slate-400)
- 텍스트: `color: #94a3b8, font-size: 9px`

**탭 3개:** 홈, 지도, 타임라인 (Lucide 아이콘: Home, Map, Clock)

**콤팩트 크기:**
- 네비바 전체 너비가 화면의 약 65~70% 정도만 차지
- 양옆에 여백이 충분히 보여야 함
- 아이콘 크기: 16~18px

### 구현 코드 참조
```jsx
<nav className="fixed bottom-4 left-0 right-0 z-50 flex justify-center pb-safe">
  <div className="inline-flex items-center bg-[#e8f5ee] rounded-full p-[5px] border border-[#d1e7dd]/50">
    {tabs.map(tab => (
      <button
        key={tab.path}
        onClick={() => navigate(tab.path)}
        className={cn(
          "flex flex-col items-center gap-0.5 rounded-full px-[22px] py-[9px] transition-all",
          isActive(tab.path)
            ? "bg-primary text-white"
            : "text-slate-400"
        )}
      >
        <tab.icon size={16} strokeWidth={1.8} />
        <span className="text-[9px] font-medium">{tab.label}</span>
      </button>
    ))}
  </div>
</nav>
```

파일: `src/components/BottomNav.jsx` — 전면 재작성

---

## 2. FAB(+) 버튼 네비바와 분리 배치

현재 FAB이 네비바 바로 옆에 붙어있어서 어색함 → **네비바 우측 상단 위에 독립적으로 떠있게** 변경.
FAB과 네비바는 별도 컴포넌트로 완전 분리.

### FAB 디자인 스펙

**형태:**
- 원형: `border-radius: 50%`
- 크기: `w-[50px] h-[50px]`
- `background: #059669` (primary)
- 아이콘: Lucide `Plus`, `stroke: #fff`, `size: 22`, `strokeWidth: 2.2`

**위치:**
- 네비바 우측 상단 위에 배치
- 네비바와 수직 간격 **최소 12px 이상** 확보 (겹치지 않게)
- `fixed bottom-[72px] right-5` (네비바 bottom-4 + 네비바 높이 + 간격)
- 정확한 bottom 값은 네비바 높이에 따라 조정

**스크롤 동작 (B안):**
- 아래로 스크롤 → FAB + BottomNav **둘 다 숨김**
- 위로 스크롤 → FAB + BottomNav **둘 다 표시**
- 최상단에서는 항상 표시
- 트랜지션: `transition: transform 300ms cubic-bezier(0.4, 0, 0.2, 1), opacity 300ms ease`
- 숨김: FAB은 `translate-y-24 opacity-0`, 네비바는 `translate-y-full opacity-0`

### useScrollDirection 훅
```jsx
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
- `src/components/BottomNav.jsx` — 네비바만 담당
- `src/components/FloatingActionButton.jsx` — FAB만 담당 (새 파일)
- 두 컴포넌트 모두 `useScrollDirection` 훅으로 동일하게 숨김/표시
- App.jsx 또는 레이아웃에서 두 컴포넌트를 각각 렌더링

파일: `src/components/BottomNav.jsx`, `src/components/FloatingActionButton.jsx` (신규), `src/hooks/useScrollDirection.js` (신규)
