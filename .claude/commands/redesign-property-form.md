# /redesign-property-form — 매물 등록 폼을 한 페이지 빠른 기록으로 재설계

현재 6단계 멀티스텝 폼(PropertyNewPage.jsx)을 **한 페이지 스크롤 빠른 기록 폼**으로 전면 재설계해.
Figma 디자인(FastWrite)을 기반으로 한다.

---

## 디자인 원칙
- **속도**: 임장 현장에서 빠르게 기록하는 게 목적. 단계 이동 없이 스크롤만으로 완료.
- **필수 먼저**: 필수 항목을 상단에, 선택 항목을 하단에 배치.
- **진행 표시**: 상단에 "필수 항목 N/5 완료" 형태의 미니 프로그레스.
- **섹션 카드**: 각 섹션을 카드로 구분 (rounded-2xl, bg-white, border, p-5).

---

## 레이아웃 (단일 스크롤 페이지)

### 헤더
```
← 뒤로    빠른 기록
필수 항목 N/5 완료  ●●●○○
```
- 뒤로 버튼 (ChevronLeft)
- "빠른 기록" 타이틀
- 필수 항목 완료 카운터 (실시간 업데이트)

### 섹션 1: 위치 정보 * (필수)
```
[카드]
  * 위치 정보

  서울시 강남구 역삼동 123-45     (주소 표시)

  [◎ 현재 위치 사용]  [🗺 지도에서 선택]
```
- 주소 검색 버튼 클릭 → 다음 우편번호 검색 팝업 (기존 daum.Postcode)
- "현재 위치 사용" → navigator.geolocation으로 좌표 → 카카오 역지오코딩으로 주소 변환
- "지도에서 선택" → 다음 우편번호 검색 팝업 (동일)
- 주소 입력 전: placeholder "주소를 검색해주세요"
- 주소 입력 후: 주소 텍스트 표시 + 배경 primary-50

### 섹션 2: 필수 체크리스트
```
[카드]
  필수 체크리스트

  전체 만족도 *
  ★★★★☆

  가격 평가 *
  [적정 ✓]  [비쌈]  [저렴]

  즉시 입주 가능 *
  [가능 ✓]  [불가]

  재방문 의사 *
  [있음 ✓]  [없음]
```
- 별점: RatingStars 컴포넌트 (size="lg")
- 가격평가: 3개 칩 버튼 (단일 선택)
- 입주가능: 2개 칩 버튼 (단일 선택)
- 재방문의사: 2개 칩 버튼 (단일 선택)
- 활성 스타일: bg-primary text-white rounded-full
- 비활성 스타일: bg-slate-100 text-slate-500 rounded-full

### 섹션 3: 매물 정보
```
[카드]
  매물 정보

  유형
  [전세]  [월세 ✓]  [매매]      ← Radix Tabs

  가격
  [1000/50          만원]       ← 월세: 보증금/월세 한 줄 입력

  평수
  [25                  ]

  관리비
  [━━━━━●━━━━━]                ← range slider
  0만원           50만원
         15만원

  주차
  [가능]  [불가 ✓]  [조건부]

  층수 정보
  [5    ]  /  [15    ]
```
- 유형: Radix Tabs (전세/월세/매매)
- 가격: 유형에 따라 input 변경 (월세: "보증금/월세", 전세: 보증금, 매매: 매매가)
- 평수: 숫자 input
- 관리비: range input (0~50만원, 단위 1만원, 현재값 표시)
- 주차: 3개 칩 버튼
- 층수: 두 개 input (현재층 / 전체층)

### 섹션 4: 사진 기록 *
```
[카드]
  📷 사진 기록 *
  최소 3장 필수 (외관, 거실, 특이사항)

  [+ 외관]  [+ 거실]  [+ 특이사항]   ← 필수 3칸 (빨간 점선 테두리)
  [+ 추가]  [+ 추가]  [+ 추가]       ← 선택 추가 칸

  추가 사진 업로드 가능 (최대 10장)
```
- 필수 3칸: 빨간 점선 border + 라벨 (외관/거실/특이사항)
- 선택 추가 칸: 회색 점선 border
- 업로드 시 즉시 POST /api/v1/images/upload 호출
- 업로드 완료 → 썸네일 표시 + X 삭제 버튼
- 이미지는 formData에 `imageId` 배열로 수집

### 섹션 5: 간단 메모
```
[카드]
  간단 메모

  [역세권, 관리 잘됨, 베란다 확장     ]
                              16/200
```
- textarea (max 200자, 글자수 카운터)
- placeholder: "임장 메모를 간단히 적어주세요"

### 하단 고정 버튼
```
[상세 기록 추가]   [저장하기]
```
- "저장하기" (Primary): POST /api/v1/properties → 성공 시 /properties/:id로 이동
- "상세 기록 추가" (Secondary): 일단 저장 후 /properties/:id/edit로 이동 (또는 확장 필드 펼치기)
- 하단 고정: sticky bottom + pb-safe

---

## 필수 항목 완료 카운터 로직
필수 5개 항목:
1. 위치 정보 (주소가 입력됨)
2. 전체 만족도 (별점 1~5 선택됨)
3. 가격 평가 (적정/비쌈/저렴 중 선택됨)
4. 입주 가능 여부 (가능/불가 선택됨)
5. 재방문 의사 (있음/없음 선택됨)

"저장하기" 버튼: 필수 5개 모두 입력 시 활성화, 아니면 disabled + "필수 항목을 모두 입력해주세요" 표시

---

## 변경 파일 목록

1. **`src/pages/PropertyNewPage.jsx`** — 전면 재작성 (6스텝 → 단일 페이지)
2. **`src/components/StepProgress.jsx`** — 필수 항목 카운터로 변경 (또는 새 컴포넌트)

### 삭제/사용하지 않는 것
- 기존 Step1~Step6 컴포넌트 (PropertyNewPage 안의 함수들) 전부 제거
- StepProgress 멀티스텝 바 → 필수항목 카운터로 대체

### 유지하는 것
- ImageUploader 컴포넌트 (사진 업로드 기능)
- RatingStars 컴포넌트 (별점)
- Radix Tabs (거래 유형 선택)
- 다음 주소 검색 (daum.Postcode)
- API 연동 (imageApi.upload, propertyApi.create)

---

## 스타일 규칙
- 각 섹션: `rounded-2xl border border-slate-200 bg-white p-5 space-y-4`
- 칩 버튼 활성: `bg-primary text-white rounded-full px-4 py-2 text-sm font-medium`
- 칩 버튼 비활성: `bg-slate-100 text-slate-500 rounded-full px-4 py-2 text-sm font-medium`
- 섹션 제목: `text-base font-bold text-slate-800`
- 필드 라벨: `text-sm font-medium text-slate-700`
- 필수 표시: `text-danger` 색상의 `*`
- 전체 배경: `bg-slate-50`
- 페이지 패딩: `px-5 pt-4 pb-32` (하단 버튼 공간)
- 관리비 슬라이더: `accent-primary` 또는 커스텀 range input 스타일링
- Lucide 아이콘, cn() 유틸리티, Sonner toast 사용

---

## 완료 후
1. `npm run build` 성공 확인
2. 빌드 에러 있으면 수정
3. `git add -A && git commit -m "feat: 매물 등록 빠른 기록 단일 페이지로 재설계 (Figma FastWrite)" && git push origin main`
4. PROGRESS.md에 기록
