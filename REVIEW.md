# 코드 리뷰 전용 지침 (REVIEW.md)

Claude가 PR 리뷰 시 참조하는 규칙입니다. 일반 대화 세션에는 적용되지 않습니다.

---

## 반드시 검사할 항목

- 새 API 호출 함수에 에러 핸들링(`try/catch` 또는 TanStack Query의 `onError`)이 있는지
- `VITE_` 외 환경변수가 클라이언트 코드에 노출되지 않는지
- 카카오맵 SDK 초기화 전 접근으로 인한 런타임 오류 가능성
- `useEffect` 의존성 배열 누락 또는 과잉 포함
- React Hook Form `register` 미등록 필드 제출 가능성

## 권장 패턴

- `async/await` 보다 TanStack Query의 `useMutation` 사용 권장
- Zustand store 내부에서 직접 fetch 금지 (Query와 역할 분리)
- Radix UI 프리미티브 사용 시 `asChild` 패턴 우선 고려

## 건너뛸 항목

- `src/components/ui/` 하위 shadcn 스타일 생성 파일의 포맷팅
- `*.lock` 파일 변경
- Tailwind 클래스 순서 (자동 정렬 도구 몫)
- 테스트 파일 내 `console.log`

---

## 리뷰 출력 형식

한국어로 작성하며 심각도 태그를 앞에 붙인다:

- 🔴 **[버그]** — 프로덕션을 중단시킬 수 있는 오류
- 🟡 **[개선]** — 수정 권장, 병합을 막지는 않음
- 🟢 **[제안]** — 선택적 리팩토링 또는 스타일 개선
