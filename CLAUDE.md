# imjang-frontend — Claude Code 프로젝트 가이드

## 작업 워크플로우
**작업 시작 전 반드시 `TODO.md`를 확인해.** 수정사항이 있으면 위에서부터 순서대로 처리.
각 항목 완료 후 `npm run build` 확인하고, 해당 항목을 TODO.md에서 삭제.
모든 항목 처리 후 커밋+푸시.

## 프로젝트 개요
부동산 임장(현장 방문) 기록을 관리하는 **모바일 최적화 웹앱**의 프론트엔드.
백엔드(`imjang-backend`)는 Spring Boot (Java 21) + 세션 기반 인증 + PostgreSQL.
API 기본 경로: `http://localhost:8080/api/v1`

---

## 기술 스택 (변경 금지)
| 영역 | 기술 |
|------|------|
| 프레임워크 | React 18 + Vite |
| 라우팅 | React Router v6 |
| 스타일 | Tailwind CSS v3 (커스텀 디자인 토큰) |
| 전역 상태 | Zustand |
| 서버 상태 | TanStack Query v5 |
| HTTP | Axios (`withCredentials: true`) |
| 폼 | React Hook Form |
| 지도 | 카카오맵 JS SDK |
| 아이콘 | Lucide React |
| 토스트 | Sonner |
| 바텀시트/드로어 | Vaul |
| 캐러셀 | Embla Carousel |
| 접근성 프리미티브 | Radix UI (Dialog, Switch, Tabs, ToggleGroup, Popover) |
| 클래스 유틸 | clsx + tailwind-merge (`cn()`) |

---

## ⚠️ 모바일 퍼스트 원칙 (최우선 준수)
1. **모든 레이아웃은 375px 너비를 기본으로 설계**한다.
2. 앱 컨테이너: `max-w-app(430px) mx-auto` — 태블릿/데스크탑에서도 모바일 폼팩터 유지.
3. 터치 타겟: 모든 인터랙션 요소 최소 `44px × 44px`.
4. 하단 네비게이션: 고정 배치, `pb-safe` (safe-area-inset-bottom) 적용.
5. iOS 줌 방지: 모든 input의 `font-size: 16px` 이상.
6. 스크롤: `-webkit-overflow-scrolling: touch`, `overscroll-behavior: contain`.
7. 이미지: `loading="lazy"` + `aspect-ratio` 고정 + `object-cover`.
8. 폰트 크기: 본문 `16px`(`text-base`) 기본, 보조 라벨 `14px`(`text-sm`), 캡션만 `12px`(`text-xs`). 11px 이하 금지.
9. 페이지 하단 패딩: `pb-24` (BottomNav 가림 방지).
10. 가로 스크롤: `overflow-x-auto` + `snap-x snap-mandatory` + `scrollbar-hide`.

---

## 디자인 시스템

### 디자인 방향
- **깔끔한 화이트 배경 + 에메랄드 그린 포인트** — 부동산/집을 연상시키는 안정적이고 신뢰감 있는 컬러.
- 톤: 미니멀하고 깔끔함. 불필요한 장식 없이 콘텐츠에 집중.
- iOS 네이티브 앱과 같은 자연스러운 느낌을 목표로 한다.
- 그림자는 최소한으로, 테두리와 배경색 차이로 계층을 표현한다.

### 컬러 팔레트 (tailwind.config.js에 정의)
```
Primary:       #059669 (에메랄드 그린 600)
Primary Light: #ECFDF5 (에메랄드 50, 배경 하이라이트용)
Primary Hover: #047857 (에메랄드 700)
배경:          #FFFFFF (순백)
카드 배경:     #F8FAFC (slate-50)
텍스트:        #1E293B (slate-800)
서브텍스트:    #64748B (slate-500)
성공/높은별점: #22C55E (green-500) ← Primary와 구분됨
경고/보통별점: #F59E0B (amber-500)
위험/삭제:     #EF4444 (red-500)
테두리:        #E2E8F0 (slate-200)
```

### 타이포그래피
- 한국어: **Pretendard** (CDN)
- 영문/숫자: **Inter** (fallback)
- `font-family: 'Pretendard Variable', 'Inter', system-ui, sans-serif`

#### 모바일 폰트 크기 체계 (업계 표준 기반)
| 용도 | Tailwind | 크기 | 비고 |
|------|----------|------|------|
| 페이지 제목 (H1) | `text-xl font-bold` | 20px | 페이지 최상단 제목 |
| 섹션 제목 (H2) | `text-lg font-semibold` | 18px | 카드/섹션 헤더 |
| 본문/라벨 | `text-base` | **16px** | **기본값. 모바일 본문 표준** |
| 보조 라벨/배지 | `text-sm` | 14px | 칩, 배지, 부가 라벨 |
| 캡션/메타 정보 | `text-xs text-slate-500` | 12px | 날짜, 거리, 카운트 등 보조 정보만 |
| 절대 최소 | — | 12px | 11px 이하 사용 금지 |

#### 폰트 크기 적용 원칙
1. **본문 텍스트는 반드시 16px(`text-base`)** — Apple·Google 공통 권장, iOS Safari 자동 줌 방지
2. **라벨·에러메시지·안내문구도 16px(`text-base`)** — 사용자가 읽어야 하는 텍스트는 모두 16px
3. **칩·배지·보조 라벨은 14px(`text-sm`)** — 공간 절약이 필요한 UI 요소
4. **12px(`text-xs`)는 캡션 전용** — 날짜("3일 전"), 거리("도보 5분"), 카운트("1/10") 등 보조 정보만
5. **커스텀 px 크기(`text-[15px]` 등) 사용 금지** — 반드시 Tailwind 표준 클래스 사용
6. **BottomNav 탭 라벨은 12px(`text-xs`) 허용** — 네비게이션 라벨은 아이콘과 함께 사용되므로 예외

### 컴포넌트 스타일 패턴
```
카드:
  rounded-2xl border border-slate-200 bg-white p-4 shadow-sm

버튼 Primary:
  bg-primary text-white rounded-xl h-12 font-semibold
  hover:bg-primary-700 active:scale-[0.98] transition-all w-full

버튼 Secondary:
  bg-slate-100 text-slate-700 rounded-xl h-12 font-semibold
  active:scale-[0.98] transition-all

버튼 Ghost:
  text-primary font-medium hover:text-primary-700

Input:
  h-12 rounded-xl border border-slate-200 px-4 text-base
  focus:ring-2 focus:ring-primary/20 focus:border-primary
  placeholder:text-slate-400

배지/칩:
  px-3 py-1.5 rounded-full text-xs font-medium
  활성: bg-primary-50 text-primary border border-primary/20
  비활성: bg-slate-100 text-slate-500

토글:
  w-11 h-6 rounded-full transition-colors
  활성: bg-primary
  비활성: bg-slate-200

페이지 패딩:   px-5 pt-4 pb-24
섹션 간격:     space-y-6
카드 내부 간격: space-y-3
```

### 별점 마커 컬러 (Primary 그린과 별개)
- GREEN (`#22C55E`): 4~5점 → `text-success`
- YELLOW (`#F59E0B`): 3점 → `text-warning`
- RED (`#EF4444`): 1~2점 → `text-danger`

### 네비게이션 디자인 (Apple HIG + iOS 26 Liquid Glass 기반)

Apple Human Interface Guidelines와 iOS 26 Liquid Glass 디자인 시스템을 웹에 적용한 네비게이션 패턴.

#### BottomNav (3탭 플로팅 글래스 탭바)
- **탭은 네비게이션 전용** (Apple HIG: "탭바는 네비게이션에만 사용, 액션 버튼으로 사용하지 말 것")
- **3개 탭**: 홈, 지도, 타임라인 (매물 기록은 FAB으로 분리)
- **플로팅 스타일**: 하단에서 띠워지고 둥근 모서리 (iOS 26 캡슐 형태)
- **Glass 효과**: `backdrop-filter: blur(24px)` + 반투명 배경 + 미세한 테두리
- **스크롤 시 숨김**: 아래로 스크롤 → 숨김, 위로 스크롤 → 나타남 (iOS 26 `.tabBarMinimizeBehavior(.onScrollDown)` 패턴)
- **Safe Area**: `env(safe-area-inset-bottom)` 적용
- **활성 탭 표시**: 아이콘 + 라벨 색상 변경 + 하단 dot indicator

```css
/* Glass 탭바 핵심 CSS */
.glass-nav {
  position: fixed;
  bottom: 12px;
  left: 12px;
  right: 12px;
  max-width: 430px; /* app container */
  margin: 0 auto;
  height: 64px;
  background: rgba(255, 255, 255, 0.72);
  backdrop-filter: blur(24px);
  -webkit-backdrop-filter: blur(24px);
  border-radius: 22px;
  border: 0.5px solid rgba(255, 255, 255, 0.6);
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.06),
              0 0 0 0.5px rgba(0, 0, 0, 0.04);
  transition: transform 0.3s ease;
}
.glass-nav.hidden {
  transform: translateY(calc(100% + 24px));
}
```

#### FAB (Floating Action Button) — 매물 기록 버튼
- **위치**: 오른쪽 하단, BottomNav 위에 띠 (bottom: 88px, right: 20px)
- **디자인**: 52xd752px, 둥근 사각형(rounded-2xl), Primary 컬러, 그림자
- **아이콘**: Lucide `Plus` (22px, white)
- **스크롤 시**: BottomNav와 함께 숨겨지고 나타남
- **해당 페이지에서만 표시**: 홈, 타임라인, 지도 (매물 등록/상세/수정 페이지에서는 숨김)

```jsx
// FAB 예시 (최소 구현)
<button className="fixed bottom-[88px] right-5 z-50 flex h-[52px] w-[52px]
  items-center justify-center rounded-2xl bg-primary shadow-lg
  shadow-primary/30 active:scale-95 transition-all">
  <Plus size={22} className="text-white" />
</button>
```

#### useScrollDirection 훅 (스크롤 방향 감지)
- `src/hooks/useScrollDirection.js`로 구현
- 아래로 스크롤 → `'down'` 반환, 위로 스크롤 → `'up'` 반환
- threshold: 10px (미세한 스크롤에 반응하지 않음)
- BottomNav와 FAB 모두 이 훅의 값을 참조해서 동시에 숨김/나타냈

#### Apple HIG 핵심 원칙 (웹 적용)
1. **Glass는 네비게이션 레이어에만**: 콘텐츠(리스트, 카드, 미디어)에는 절대 적용하지 않음
2. **탭은 3~5개**: 최소한으로 유지
3. **둥근 모서리 강화**: iOS 26은 모든 컴포넌트에 더 큰 border-radius 적용
4. **전체 화면 콘텐츠**: 탭바 뒤로 콘텐츠가 비치는 느낌
5. **스크롤 시 minimize**: 화면 부동산을 최대화하기 위해 스크롤시 탭바 숨김

### 네비게이션 디자인 (Apple HIG + iOS 26 Liquid Glass 기반)

Apple Human Interface Guidelines와 iOS 26 Liquid Glass 디자인 시스템을 웹에 적용한 네비게이션 패턴.

#### BottomNav (3탭 플로팅 글래스 탭바)
- **탭은 네비게이션 전용** (Apple HIG: "탭바는 네비게이션에만 사용, 액션 버튼으로 사용하지 말 것")
- **3개 탭**: 홈, 지도, 타임라인 (매물 기록은 FAB으로 분리)
- **플로팅 스타일**: 하단에서 12px 띄우고 둥근 모서리 (iOS 26 캅슐 형태)
- **Glass 효과**: `backdrop-filter: blur(24px)` + 반투명 배경 + 미세한 테두리
- **스크롤 시 숨김**: 아래로 스크롤 → 숨김, 위로 스크롤 → 나타남 (iOS 26 tabBarMinimizeBehavior 패턴)
- **Safe Area**: `env(safe-area-inset-bottom)` 적용
- **활성 탭 표시**: primary 색상 + 하단 dot indicator

```
/* Glass 탭바 핵심 CSS */
background: rgba(255, 255, 255, 0.72);
backdrop-filter: blur(24px);
-webkit-backdrop-filter: blur(24px);
border-radius: 22px;
border: 0.5px solid rgba(255, 255, 255, 0.6);
box-shadow: 0 4px 24px rgba(0,0,0,0.06), 0 0 0 0.5px rgba(0,0,0,0.04);
transition: transform 0.3s ease;
/* 숨김 상태 */
transform: translateY(calc(100% + 24px));
```

#### FAB (Floating Action Button) — 매물 기록 버튼
- **위치**: 오른쪽 하단, BottomNav 위 (bottom: 88px, right: 20px)
- **디자인**: 52xd752px, rounded-2xl, Primary 커러, shadow-lg
- **아이콘**: Lucide `Plus` (22px, white)
- **스크롤 시**: BottomNav와 함께 숨겨지고 나타남
- **표시 페이지**: 홈, 타임라인, 지도에서만 표시

#### useScrollDirection 훅 (스크롤 방향 감지)
- `src/hooks/useScrollDirection.js`로 구현
- threshold: 10px (미세한 스크롤에 반응하지 않음)
- BottomNav와 FAB 모두 이 훅을 참조해 동시 숨김/나타냈

#### Apple HIG 핵심 원칙 (웹 적용)
1. **Glass는 네비게이션 레이어에만**: 콘텐츠(리스트, 카드, 미디어)에는 절대 적용 금지
2. **탭은 3~5개**: 최소한으로 유지
3. **둥근 모서리 강화**: iOS 26은 모든 컴포넌트에 더 큰 border-radius
4. **전체 화면 콘텐츠**: 탭바 뒤로 콘텐츠가 비치는 느낌
5. **스크롤 시 minimize**: 화면 부동산 최대화

### 애니메이션 규칙
- 페이지 전환: CSS `animate-fade-in-up` (150ms ease-out)
- 카드 등장: stagger (각 50ms delay, `stagger-1` ~ `stagger-5`)
- 토스트: `animate-slide-up` (300ms)
- 버튼 터치: `active:scale-[0.98]` (즉각 피드백)
- 모달: backdrop `animate-fade-in` + content `animate-slide-up`
- **Framer Motion 등 무거운 라이브러리 사용 금지** — CSS transition/animation만.

---

## 컴포넌트 라이브러리 사용 가이드

### cn() 클래스 유틸리티 (clsx + tailwind-merge)
Tailwind 클래스 병합/조건부 처리에 항상 `cn()` 사용:
```jsx
import { cn } from '@/lib/utils';

// 조건부 클래스
<div className={cn('rounded-xl p-4', isActive && 'bg-primary-50 border-primary')} />

// props className 병합 (충돌 자동 해결)
<button className={cn('btn-primary', className)} />
```

### Lucide React (아이콘)
인라인 SVG 대신 Lucide 아이콘 컴포넌트 사용:
```jsx
import { Home, MapPin, Plus, Clock, Star, Camera, ChevronLeft, X, MoreVertical } from 'lucide-react';

// 기본 사용 (size 속성으로 크기 지정)
<Home size={20} className="text-slate-500" />

// 네비게이션 아이콘 (24px)
<MapPin size={24} className="text-primary" />

// 버튼 내 아이콘 (20px)
<button className="btn-primary"><Plus size={20} /> 매물 기록</button>
```

### Sonner (토스트 알림)
커스텀 Toast 대신 Sonner 사용:
```jsx
// main.jsx에 <Toaster /> 추가
import { Toaster } from 'sonner';
<Toaster position="top-center" toastOptions={{
  className: 'font-sans',
  style: { fontFamily: 'Pretendard Variable, Inter, sans-serif' },
}} />

// 사용
import { toast } from 'sonner';
toas.success('매물이 등록되었어요');
toas.error('등록에 실패했어요');
```

### Vaul (바텀시트 / 드로어)
모바일 하단 팝업, 액션 메뉴 등에 Vaul Drawer 사용:
```jsx
import { Drawer } from 'vaul';

<Drawer.Root>
  <Drawer.Trigger />
  <Drawer.Portal>
    <Drawer.Overlay className="fixed inset-0 bg-black/40" />
    <Drawer.Content className="fixed bottom-0 left-0 right-0 rounded-t-2xl bg-white">
      <Drawer.Handle className="mx-auto mb-4 mt-2 h-1.5 w-12 rounded-full bg-slate-300" />
      {/* 콘텐츠 */}
    </Drawer.Content>
  </Drawer.Portal>
</Drawer.Root>
```
사용처: 지도 마커 클릭 요약 카드, 매물 상세 수정/삭제 메뉴, 필터 패널

### Embla Carousel (이미지 캐러셀)
매물 상세의 이미지 갤러리:
```jsx
import useEmblaCarousel from 'embla-carousel-react';

const [emblaRef] = useEmblaCarousel({ loop: false, align: 'start' });

<div ref={emblaRef} className="overflow-hidden">
  <div className="flex">
    {images.map((img) => (
      <div key={img.id} className="min-w-0 flex-[0_0_100%]">
        <img src={img.url} className="aspect-[4/3] w-full object-cover" />
      </div>
    ))}
  </div>
</div>
```

### Radix UI (접근성 프리미티브)

#### Dialog (모달)
삭제 확인, 상세 팝업 등:
```jsx
import * as Dialog from '@radix-ui/react-dialog';
```

#### Switch (토글)
체크리스트의 입주가능/재방문의향 등:
```jsx
import * as Switch from '@radix-ui/react-switch';

<Switch.Root className={cn('w-11 h-6 rounded-full transition-colors',
  checked ? 'bg-primary' : 'bg-slate-200'
)}>
  <Switch.Thumb className="block h-5 w-5 rounded-full bg-white shadow transition-transform" />
</Switch.Root>
```

#### Tabs (탭)
가격 정보 거래 유형 선택 (월세/전세/매매):
```jsx
import * as Tabs from '@radix-ui/react-tabs';
```

#### ToggleGroup (다중 선택)
체크리스트의 주차/주변환경 선택 등:
```jsx
import * as ToggleGroup from '@radix-ui/react-toggle-group';
```

### 라이브러리 사용 원칙
1. **커스텀으로 만들지 말고 라이브러리를 쓰라**: Toast는 Sonner, 모달은 Radix Dialog, 토글은 Radix Switch.
2. **아이콘은 모두 Lucide**: 인라인 SVG 직접 작성 금지. `lucide-react`에서 import.
3. **className은 cn() 사용**: 하드코딩 문자열 결합 금지 (`${} + ${}` 패턴 금지).
4. **모바일 하단 팝업은 Vaul Drawer**: CSS bottom sheet 직접 구현 금지.
5. **이미지 슬라이더는 Embla**: 직접 스크롤 구현 금지.

---

## 프론트엔드 디자인 가이드라인

### UI 원칙
1. **콘텐츠 우선**: 화려한 장식보다 정보 전달이 우선. 여백을 충분히 활용.
2. **일관성**: 모든 페이지에서 동일한 간격(space-y-6), 둥근 모서리(rounded-xl/2xl), 그림자(shadow-sm) 사용.
3. **피드백**: 모든 액션에 즉각적인 시각적 피드백 (버튼 active, 토스트, 로딩 상태).
4. **접근성**: 색상 대비 4.5:1 이상, 포커스 링 표시, 의미 있는 alt 텍스트.

### 레이아웃 패턴
- **인증 페이지**: 화면 중앙 정렬 카드 (`flex items-center justify-center min-h-screen`)
- **목록 페이지**: 헤더 + 스크롤 목록 + BottomNav
- **상세 페이지**: 커스텀 헤더(뒤로 버튼) + 풀 너비 콘텐츠 + 하단 고정 액션
- **폼 페이지**: StepProgress + 한 스텝씩 렌더 + 다음/이전 버튼

### 아이콘 (Lucide React)
- **모든 아이콘은 `lucide-react`에서 import**. 인라인 SVG 직접 작성 금지.
- 기본 크기: `size={20}`, 네비게이션: `size={24}`, 소형: `size={16}`
- 색상: `className="text-slate-500"` 등 Tailwind 클래스로 지정
- strokeWidth: Lucide 기본값(2) 사용, 필요시 `strokeWidth={1.5}` 조정
- 자주 쓰는 아이콘: Home, MapPin, Plus, Clock, Star, Camera, ChevronLeft, ChevronRight, X, MoreVertical, Search, Filter, Trash2, Edit3, Check, Building2, Car, TreePine

### 빈 상태 (Empty State)
- 데이터가 없을 때 반드시 빈 상태 UI 표시
- 아이콘 + 안내 메시지 + CTA 버튼 조합
- 예: "아직 기록한 매물이 없어요" + "첫 매물 기록하기 →"

### 로딩 상태
- 페이지 로딩: 중앙 Spinner
- 목록 로딩: 스켈레톤 카드 (선택) 또는 Spinner
- 버튼 로딩: 버튼 내 Spinner + 텍스트 "처리 중..." + disabled

### 에러 처리
- API 에러: 인라인 에러 메시지 (input 하단, 빨간색)
- 네트워크 에러: 토스트 알림
- 404: "페이지를 찾을 수 없습니다" + 홈으로 이동 버튼

---

## 프로젝트 구조
```
src/
├── api/              # Axios 인스턴스 + API 모듈
│   ├── index.js      # axios.create + 401 인터셉터
│   ├── auth.js       # login, signup, verify, resend, logout
│   ├── property.js   # CRUD, recent, timeline, prefetchLocation
│   ├── image.js      # upload, addToProperty, deleteImage
│   └── map.js        # getMarkers, getSummary
├── components/       # 공통 재사용 컴포넌트
│   ├── BottomNav.jsx
│   ├── PropertyCard.jsx
│   ├── PriceDisplay.jsx
│   ├── RatingStars.jsx
│   ├── ImageUploader.jsx
│   ├── Toast.jsx
│   ├── ConfirmModal.jsx
│   ├── Spinner.jsx
│   └── StepProgress.jsx
├── lib/              # 유틸리티 (cn, formatPrice, getRelativeDate)
│   └── utils.js
├── hooks/
│   └── useInfiniteScroll.js
├── pages/            # 라우트 단위 페이지
│   ├── LoginPage.jsx
│   ├── SignupPage.jsx
│   ├── VerifyEmailPage.jsx
│   ├── HomePage.jsx
│   ├── TimelinePage.jsx
│   ├── PropertyNewPage.jsx
│   ├── PropertyDetailPage.jsx
│   ├── PropertyEditPage.jsx
│   └── MapPage.jsx
├── store/
│   └── useAuthStore.js
├── styles/
│   └── global.css
├── App.jsx
└── main.jsx
```

---

## 라우팅
```
/login                → LoginPage         (public)
/signup               → SignupPage         (public)
/verify-email         → VerifyEmailPage    (public)
/                     → HomePage           (private)
/timeline             → TimelinePage       (private)
/properties/new       → PropertyNewPage    (private)
/properties/:id       → PropertyDetailPage (private)
/properties/:id/edit  → PropertyEditPage   (private)
/map                  → MapPage            (private)
```

---

## 코딩 컨벤션

### 컴포넌트
- 함수형 + 화살표 함수: `const MyComp = () => { ... }`
- 페이지: `export default`, 공통 컴포넌트: `export const`
- 파일명: PascalCase (컴포넌트), camelCase (훅/유틸)
- Props 구조분해 + 기본값: `({ label, variant = 'primary' }) => { ... }`

### 상태 관리
- 서버 데이터: TanStack Query (`useQuery`, `useMutation`, `useInfiniteQuery`)
- 인증: Zustand (`useAuthStore`)
- 폼: React Hook Form
- 로컬 UI: `useState`

### API 호출
- API 함수는 `src/api/` 모듈에 정의, TanStack Query의 `queryFn`에서 호출
- 401 → axios interceptor가 자동으로 `/login` 리다이렉트

### Tailwind 사용
- 인라인 클래스 우선 (CSS 파일 최소화)
- 반복 패턴: `global.css`의 `@layer components`에 `@apply`로 정의
- 하드코딩 색상값 절대 금지 → 반드시 Tailwind 토큰 사용

---

## Git 커밋 컨벤션
```
feat: 새로운 기능 추가
fix: 버그 수정
style: UI/스타일 변경 (로직 변경 없음)
refactor: 코드 리팩토링
chore: 설정, 의존성 변경
docs: 문서 수정
```
- **한국어**로 작성. 예: `feat: 로그인 페이지 구현`
- 의미적 단위로 커밋 (한 페이지 완성 = 한 커밋)

---

## 자동화 워크플로우

### 핵심 원칙: 계획 → 실행 → 검증 → 리뷰 → 커밋
**어떤 Phase도 계획 없이 시작하지 않고, 리뷰 없이 커밋하지 않는다.**

### 작업 사이클 (모든 Phase에 동일 적용)
```
1. /plan    → 상세 계획 수립 + PROGRESS.md에 기록
2. /implement → 계획에 따라 구현 (계획에 없는 것 추가 금지)
3. /verify  → npm run build + 실행 확인 + 코드 품질 점검
4. /review  → 최초 계획 & CLAUDE.md 가이드라인 냉철 대조
     ├─ ✅ 통과 → /commit
     └─ ❌ 실패 → 수정 후 /verify → /review 재실행
5. /commit  → 커밋 + 푸시 + PROGRESS.md 업데이트
```

### 커스텀 커맨드 (.claude/commands/)
- `/plan [Phase]` — 작업 전 상세 계획 수립 (PROGRESS.md에 기록)
- `/implement [Phase]` — 계획 기반 구현 (계획 없으면 거부)
- `/verify` — 빌드 + 실행 + 코드 품질 검증
- `/review` — 푸시 전 냉철한 최종 리뷰 (계획 vs 결과, 가이드라인 대조)
- `/commit` — 리뷰 통과 후에만 커밋 + 푸시
- `/next` — 다음 미완료 Phase를 전체 사이클로 진행
- `/auto` — 모든 미완료 Phase를 순차 자동 진행
- `/design-check` — 전체 디자인 품질 점검

### PROGRESS.md
- 모든 Phase의 체크리스트 + 계획/검증/리뷰 기록
- 각 Phase 아래에 계획, 빌드 검증 결과, 최종 리뷰 결과가 순서대로 기록됨
- 완료 시 `- [x]`로 표시 + 커밋 로그 테이블 유지
- 리뷰 히스토리 테이블로 품질 추적

### 리뷰 기준 (냉철하게)
- 최초 계획의 모든 항목이 구현되었는가?
- 계획에 없는 불필요한 코드가 추가되지 않았는가?
- CLAUDE.md의 모바일 퍼스트 원칙이 100% 지켜졌는가?
- 디자인 시스템(컬러, 간격, 둥근 모서리, 버튼 높이)이 일관되는가?
- 빈 상태/로딩 상태/에러 상태가 모두 있는가?

---

## 페이지별 명세 요약

### 인증 (LoginPage, SignupPage, VerifyEmailPage)
- 화면 중앙 카드, max-w-sm
- React Hook Form으로 유효성 검사
- 비밀번호: 8-20자, 대소문자+숫자+특수문자 규칙 실시간 표시
- OTP: 6자리 개별 input, 자동 포커스 이동

### 홈 (HomePage)
- 환영 섹션 (이번 달/전체 기록 수)
- 퀵 액션 버튼 3개 (기록, 지도, 타임라인)
- 최근 매물 카드 3개 (PropertyCard)

### 타임라인 (TimelinePage)
- 날짜별 그룹핑
- 무한 스크롤 (useInfiniteScroll + useInfiniteQuery)
- PropertyCard 재사용

### 매물 등록 (PropertyNewPage)
- 6단계 멀티스텝 (StepProgress)
- 사진 → 위치 → 가격 → 기본정보 → 체크리스트 → 메모

### 매물 상세 (PropertyDetailPage)
- 이미지 갤러리 (가로 스크롤)
- 기본 정보 + 체크리스트 + 환경 태그 + 주변 시설 + 메모
- 수정/삭제 액션

### 매물 수정 (PropertyEditPage)
- 기존 데이터 로드 → 폼 프리필
- 이미지 추가/삭제

### 지도 (MapPage)
- 카카오맵 전체 화면
- 별점별 마커 컬러 (GREEN/YELLOW/RED)
- 마커 클릭 → 하단 슬라이딩 요약 카드

---

## 주의사항
- `npm run dev` → Vite dev server (포트 5173)
- Vite proxy: `/api` → `http://localhost:8080`
- 카카오맵 API 키: `.env`의 `VITE_KAKAO_MAP_KEY`
- 이미지 업로드: `multipart/form-data`
- 가격 포맷: 만원 → 억/만 변환 (35000 → "3.5억")


---

## 응답 언어

**Claude는 항상 한국어로 응답한다.**
