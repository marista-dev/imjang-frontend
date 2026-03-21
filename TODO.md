# 수정사항 (TODO)

이 문서에 있는 항목들을 위에서부터 순서대로 수정해.
각 항목 수정 완료 후 `npm run build` 확인하고, 해당 항목을 이 문서에서 삭제해.
모든 항목 처리 후 커밋+푸시해.

---

## 1. 타임라인 페이지 상단 리디자인: 검색 + 필터 칩

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
