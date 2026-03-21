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
