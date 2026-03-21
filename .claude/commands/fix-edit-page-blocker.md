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

---

## 추가: Vaul Drawer 애니메이션 틀어짐 수정

**증상**: Drawer가 열릴 때 오른쪽에서 왼쪽으로 미끼러지면서 중앙 정렬됨.

**원인**: Drawer Content에 `left-1/2 -translate-x-1/2` (CSS transform 기반 중앙 정렬)이 있는데,
Vaul이 애니메이션하는 동안 `translateY`를 조작하면서 `translateX(-50%)`가 일시적으로 리셋됨.

**수정**: 프로젝트 전체에서 Vaul Drawer Content의 중앙 정렬을 `translate` 대신 `margin` 방식으로 변경.

AS-IS (모든 Drawer Content 파일 검색):
```jsx
<Drawer.Content className="fixed bottom-0 left-1/2 ... -translate-x-1/2 ...">
```

TO-BE:
```jsx
<Drawer.Content className="fixed bottom-0 left-0 right-0 mx-auto ...">
```

변경 요점: `left-1/2 -translate-x-1/2` → `left-0 right-0 mx-auto`
`max-w-app`이 있으면 `mx-auto`가 자동으로 중앙 정렬해줌.

해당 파턴이 사용된 모든 파일을 검색해서 수정:
```bash
grep -rn 'left-1/2.*-translate-x-1/2\|translate-x.*Drawer' src/ --include='*.jsx'
```

---

## 완료 후
1. `npm run build` 성공 확인
2. 브라우저에서 `/properties/:id/edit` 페이지 접근 시 에러 없는지 확인
3. Drawer 열림 시 오른쪽에서 미끼러지는 현상 없는지 확인
4. `git add -A && git commit -m "fix: useBlocker 제거 + Drawer 애니메이션 틀어짐 수정" && git push origin main`
