# 임장 기록장 — Frontend

부동산 임장(현장 방문) 기록을 관리하는 모바일 최적화 웹앱

## Tech Stack

- **Framework**: React 18 + Vite
- **Styling**: Tailwind CSS v3 (에메랄드 그린 디자인 시스템)
- **State**: Zustand (전역) + TanStack Query v5 (서버)
- **UI**: Lucide React (아이콘) + Sonner (토스트) + Vaul (바텀시트) + Embla (캐러셀) + Radix UI (접근성)
- **Form**: React Hook Form
- **Map**: 카카오맵 JS SDK

## Getting Started

```bash
# 의존성 설치
npm install

# 환경변수 설정
cp .env.example .env
# .env 파일에 VITE_KAKAO_MAP_KEY 입력

# 개발 서버 실행 (포트 5173)
npm run dev

# 빌드
npm run build
```

## Backend

- Spring Boot (Java 21) + PostgreSQL
- 세션 기반 인증
- API: `http://localhost:8080/api/v1`
- 백엔드 실행: `cd ../imjang-backend && ./gradlew bootRun`

## Pages

| 경로 | 페이지 | 설명 |
|------|--------|------|
| `/login` | 로그인 | 이메일/비밀번호 |
| `/signup` | 회원가입 | 비밀번호 규칙 실시간 검증 |
| `/verify-email` | 이메일 인증 | 6자리 OTP |
| `/` | 홈 | 통계 + 퀵 액션 + 최근 매물 |
| `/timeline` | 타임라인 | 날짜별 그룹 + 무한 스크롤 |
| `/properties/new` | 매물 등록 | 6단계 멀티스텝 폼 |
| `/properties/:id` | 매물 상세 | 이미지 갤러리 + 정보 + 주변시설 |
| `/properties/:id/edit` | 매물 수정 | 기존 데이터 수정 |
| `/map` | 지도 | 카카오맵 + 별점별 마커 |
