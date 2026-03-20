# /commit — 리뷰 통과 후 커밋 + 푸시

변경사항을 커밋하고 리모트에 푸시해.

## 전제 조건
- PROGRESS.md에 해당 Phase의 **최종 리뷰 결과**가 "✅ 커밋 & 푸시 승인"이어야 해.
- 리뷰 결과가 없거나 ❌이면 "⚠️ /review를 먼저 통과해야 합니다." 라고 안내하고 중단해.

## 작업 순서

### 1단계: 변경사항 확인
```bash
git status
git diff --stat
```

### 2단계: 커밋
- 계획에 적힌 **예상 커밋 메시지**를 기반으로 실제 변경 내용에 맞게 조정해.
- 컨벤션: `feat:`, `fix:`, `style:`, `refactor:`, `chore:`, `docs:`
- **한국어**로 작성.

```bash
git add -A
git commit -m "커밋 메시지"
```

### 3단계: 푸시
```bash
git push origin main
```
- 푸시 실패 시 원인을 확인하고 보고해 (conflict, auth 등).

### 4단계: PROGRESS.md 업데이트
1. 완료된 체크리스트 항목에 `- [x]` 표시.
2. 커밋 로그 테이블에 새 행 추가:
```markdown
| N | 커밋 메시지 | YYYY-MM-DD | Phase N |
```
3. Phase 계획 섹션에 최종 상태 기록:
```markdown
#### ✅ Phase N 완료 (시각: YYYY-MM-DD HH:MM)
- 커밋: `abc1234` feat: ...
- 다음 작업: Phase N+1
```

### 5단계: 보고
- 커밋 해시, 메시지, 변경 파일 수를 알려줘.
- PROGRESS.md에서 다음 Phase를 안내해줘.
- "✅ Phase N 완료. 다음은 Phase N+1입니다. /plan으로 계획을 수립하세요." 라고 알려줘.
