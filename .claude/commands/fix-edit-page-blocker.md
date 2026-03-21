# /fix-edit-page-blocker — PropertyEditPage useBlocker 에러 수정

## 문제
`PropertyEditPage.jsx`에서 `useBlocker` 훅 사용 시 에러 발생:
```
useBlocker must be used within a data router.
```

## 원인
`useBlocker`는 React Router v6.4+의 Data Router (`createBrowserRouter` + `RouterProvider`) 전용 훅.
현재 앱은 레거시 `<BrowserRouter>`를 사용 중이므로 `useBlocker`를 쓸 수 없음.

## 수정 방향
`useBlocker` 사용을 **제거**하고, 동일한 UX를 다른 방식으로 구현해.
라우터 자체를 `createBrowserRouter`로 바꾸지 마.

### 대안 구현
- 폼 변경 감지가 필요하다면 `beforeunload` 이벤트 + 커스텀 ConfirmModal 조합으로 대체
- 또는 단순히 뒤로가기 버튼에 "저장하지 않고 나가시겠습니까?" 확인 모달 추가
- `useBlocker` 관련 코드 전부 삭제

## 완료 후
1. `npm run build` 성공 확인
2. 브라우저에서 `/properties/:id/edit` 페이지 접근 시 에러 없는지 확인
3. `git add -A && git commit -m "fix: PropertyEditPage useBlocker 제거 (레거시 라우터 호환)" && git push origin main`
