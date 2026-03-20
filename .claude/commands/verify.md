# /verify — 빌드 검증 + 기술 점검

구현한 코드의 기술적 정합성을 검증해.

## 검증 순서

### 1단계: 빌드 확인
```bash
npm run build 2>&1
```
- 빌드 에러가 있으면 즉시 수정 → 재빌드 → 최대 3회 반복.
- 3회 실패 시 멈추고 에러 내용을 보고해.

### 2단계: import / 참조 점검
- 미사용 import 제거
- 존재하지 않는 파일 import가 없는지
- 순환 참조가 없는지

### 3단계: 실행 확인
```bash
npm run dev -- --port 5174 &
DEV_PID=$!
sleep 4
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:5174)
echo "HTTP Status: $HTTP_CODE"
kill $DEV_PID 2>/dev/null
```
- 200이 아니면 원인을 파악하고 수정해.

### 4단계: 코드 품질 점검
아래 항목을 코드에서 직접 확인해:
- [ ] 불필요한 `console.log` 제거
- [ ] 하드코딩 색상값(#xxx) 없이 Tailwind 토큰만 사용
- [ ] 하드코딩 문자열(px, 폰트 등) 없이 Tailwind 클래스 사용
- [ ] 모든 이미지에 `loading="lazy"`, `alt` 속성 존재
- [ ] 모든 버튼/링크에 `type` 속성 존재
- [ ] key prop 누락 없이 리스트 렌더링

### 5단계: 결과 기록
PROGRESS.md의 해당 Phase 계획에 검증 결과를 추가해:

```markdown
#### 🔍 빌드 검증 결과 (시각: YYYY-MM-DD HH:MM)
- 빌드: ✅ 성공 / ❌ 실패 (N회 수정 후 성공)
- 실행: ✅ HTTP 200
- 발견 이슈: N건 (수정 완료)
  - [이슈1]: 수정 내용
  - [이슈2]: 수정 내용
- 상태: **검증 통과 → /review 진행 가능**
```

"🔍 기술 검증 완료. /review로 최종 리뷰를 진행하세요." 라고 알려줘.
