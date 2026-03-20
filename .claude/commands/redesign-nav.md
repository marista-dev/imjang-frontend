# /redesign-nav — BottomNav 재설계 (Apple HIG + iOS 26 Liquid Glass)

Apple Human Interface Guidelines와 iOS 26 Liquid Glass 디자인 시스템을 참고하여
BottomNav를 플로팅 글래스 3탭 + FAB로 재설계해.

---

## 배경 (Apple HIG 핵심 원칙)

Apple HIG Tab Bar 가이드라인:
- "Tab bar는 네비게이션에만 사용, 액션 버튼으로 사용하지 말 것"
- "3~5개 탭이 적정. 탭 수가 많을수록 복잡성 증가"
- "탭바는 기본적으로 반투명(translucent)"

iOS 26 Liquid Glass 변경사항:
- 탭바가 전체 너비 → 캡슐 형태 플로팅으로 변경
- Glass는 네비게이션 레이어에만 적용 (콘텐츠에는 적용 금지)
- 스크롤 시 탭바가 minimize됨 (tabBarMinimizeBehavior)
- FAB(Floating Action Button)을 탭바 밖에 별도 배치하는 패턴 공식화

---

## 변경 사항 (정확히 이것만 구현)

### 1. `src/hooks/useScrollDirection.js` (신규 생성)
스크롤 방향을 감지하는 커스텀 훅:
- 아래로 스크롤 → `'down'` 반환 (네비 숨김)
- 위로 스크롤 → `'up'` 반환 (네비 나타남)
- threshold: 10px (미세한 스크롤 무시)
- 페이지 최상단에서는 항상 `'up'` (네비 항상 보임)

```js
// 사용법
const scrollDirection = useScrollDirection(10);
const isHidden = scrollDirection === 'down';
```

### 2. `src/components/BottomNav.jsx` (전면 재작성)
기존 4탭 → 3탭 플로팅 글래스 네비로 변경:

**탭 구성** (3개만):
```
홈 (Home)  |  지도 (Map)  |  타임라인 (Clock)
```
- "기록" 탭 제거 (FAB으로 이동)

**Glass 스타일**:
```
배경: rgba(255, 255, 255, 0.72)
블러: backdrop-filter: blur(24px) + -webkit-backdrop-filter: blur(24px)
모서리: rounded-[22px]
테두리: border: 0.5px solid rgba(255,255,255,0.6)
그림자: shadow — 0 4px 24px rgba(0,0,0,0.06), 0 0 0 0.5px rgba(0,0,0,0.04)
위치: fixed, bottom: 12px, left: 12px, right: 12px (max-w-app 내 중앙)
높이: 64px
```

**활성 탭 표시**:
- 활성: text-primary + font-semibold + 하단에 4px dot indicator (bg-primary)
- 비활성: text-slate-400

**스크롤 숨김**:
- `useScrollDirection` 훅 사용
- 숨김: `transform: translateY(calc(100% + 24px))` (아래로 밀림)
- 나타남: `transform: translateY(0)`
- transition: `transition-transform duration-300 ease-out`

**숨기는 경로** (기존과 동일):
- /login, /signup, /verify-email
- /properties/new, /properties/:id, /properties/:id/edit

### 3. `src/components/FloatingActionButton.jsx` (신규 생성)
매물 기록 FAB:

**디자인**:
- 크기: 52x52px
- 배경: bg-primary (에메랄드 그린)
- 모서리: rounded-2xl (16px)
- 그림자: shadow-lg + shadow-primary/30
- 아이콘: Lucide `Plus` (22px, white)
- 터치 피드백: active:scale-95

**위치**:
- fixed, bottom: 88px (BottomNav 위), right: 20px
- max-w-app 컨테이너 기준 right 정렬

**스크롤 숨김**:
- BottomNav와 동일한 `useScrollDirection` 훅 참조
- 같이 숨겨지고 나타남
- 숨김: `transform: translateY(calc(100% + 120px))`
- transition: `transition-transform duration-300 ease-out`

**숨기는 경로** (BottomNav와 동일):
- /login, /signup, /verify-email
- /properties/new, /properties/:id, /properties/:id/edit

**클릭**: `navigate('/properties/new')`

### 4. `src/App.jsx` 수정
- `<BottomNav />` 유지 (이미 있음)
- `<FloatingActionButton />` 추가 (BottomNav 아래에)

### 5. 전체 페이지 `pb-24` 조정
- BottomNav가 플로팅이므로 콘텐츠가 뒤로 비침
- pb-24는 유지 (콘텐츠가 네비 아래에 가려지지 않게)

### 6. HomePage의 퀵 액션에서 "매물 기록" 제거
- FAB이 항상 떠있으므로 홈의 퀵 액션 3개 → 2개로 변경 (지도, 타임라인)
- 또는 퀵 액션을 유지하되 "매물 기록" 대신 다른 액션으로 변경

---

## 코드 품질 규칙
- Lucide React에서 아이콘 import (인라인 SVG 금지)
- cn() 유틸리티로 className 병합
- Tailwind 클래스만 사용 (인라인 style 최소화, Glass 효과의 backdrop-filter만 예외)
- 터치 타겟 44px 이상 유지
- 모든 변경은 CLAUDE.md의 디자인 시스템을 따름

---

## 완료 후
1. `npm run build` 성공 확인
2. 빌드 에러 있으면 수정
3. `git add -A && git commit -m "style: BottomNav 플로팅 글래스 3탭 + FAB 재설계 (Apple HIG 기반)" && git push origin main`
4. PROGRESS.md에 기록
