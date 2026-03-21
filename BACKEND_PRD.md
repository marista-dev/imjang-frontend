# 임장노트 백엔드 API 요구사항 (PRD)

> 작성일: 2026-03-21
> 대상: imjang-backend (Spring Boot)
> 우선순위: 🔴 Critical / 🟠 High / 🟡 Medium / 🟢 Nice-to-have

---

## 요약

현재 프론트엔드 기준으로 백엔드 API에서 발생하는 문제/누락 사항을 정리한 문서입니다.
각 이슈는 **우선순위**, **현상**, **기대 동작**, **영향**으로 구성됩니다.

---

## 🔴 Critical — 기능 불가

### 1. 매물 상세 API: 이미지에 ID 없음

**엔드포인트**: `GET /api/v1/properties/:id/detail`

**현재 응답**:
```json
{
  "images": [
    "/temp-images/user2/2026/03/thumb_abc.png",
    "/temp-images/user2/2026/03/thumb_def.png"
  ]
}
```

**기대 응답**:
```json
{
  "images": [
    { "imageId": 101, "url": "/temp-images/user2/2026/03/thumb_abc.png" },
    { "imageId": 102, "url": "/temp-images/user2/2026/03/thumb_def.png" }
  ]
}
```

**이유**:
프론트엔드 수정 페이지(`PropertyEditPage`)에서 기존 이미지를 삭제하려면 `imageId`가 필요합니다.
현재는 새로 업로드한 이미지만 삭제 가능하고, 기존 이미지 삭제 버튼이 비활성화된 상태입니다.

**영향**: 수정 페이지에서 기존 사진 삭제 불가 → 사용자 경험 심각하게 저하

---

### 2. 매물 수정 API: PATCH 허용 필드 및 null 처리 불명확

**엔드포인트**: `PATCH /api/v1/properties/:id/detail`

**현재 문제**:
- 일부 필드(예: `priceEvaluation`)가 `null`로 전송될 때 500 에러 발생
- 백엔드가 어떤 필드를 optional로 처리하는지 불명확

**기대 동작**:
```
모든 필드는 optional. 전송된 필드만 업데이트.
null 값 허용 (기존 값 지우기).
빈 필드는 변경하지 않음.
```

**허용 필드 (프론트엔드 기준)**:
```json
{
  "moveInAvailable": true,           // boolean, optional
  "revisitIntention": false,         // boolean, optional
  "priceEvaluation": "REASONABLE",   // enum: CHEAP | REASONABLE | EXPENSIVE | null
  "parkingType": "AVAILABLE",        // enum: AVAILABLE | NOT_AVAILABLE | CONDITIONAL | UNKNOWN | null
  "maintenanceFee": 15,              // int (만원 단위), null 허용
  "environments": ["SUBWAY", "MART"], // string[], optional
  "memo": "메모 내용"                 // string, null 허용
}
```

**영향**: 500 에러로 수정 저장 불가

---

## 🟠 High — 주요 기능 누락

### 3. 통계 API 응답 구조 확인 필요

**엔드포인트**: `GET /api/v1/properties/stats`

**프론트엔드 기대 응답**:
```json
{
  "monthlyCount": 5,
  "totalCount": 42
}
```

**현재 상태**: 엔드포인트 존재 여부 및 응답 구조 미확인
**영향**: 홈 화면 통계 카드가 렌더링되지 않을 수 있음

---

### 4. 지도 마커 API 파라미터 확인

**엔드포인트**: `GET /api/v1/properties/map/markers`

**프론트엔드 전송 파라미터**:
```
?southWestLat=37.48
&southWestLng=126.95
&northEastLat=37.52
&northEastLng=127.05
&zoomLevel=5
```

**기대 응답**:
```json
[
  {
    "id": 14,
    "latitude": 37.5050,
    "longitude": 127.0150,
    "rating": 4,
    "address": "서울 성동구 용답동 239-8",
    "priceType": "JEONSE",
    "deposit": 30000,
    "monthlyRent": null,
    "price": null,
    "thumbnailUrl": "/temp-images/..."
  }
]
```

**현재 상태**: 엔드포인트 존재하나 bounds 파라미터 처리 여부 미확인
**영향**: 지도 화면에서 현재 뷰포트 내 매물만 로드하는 최적화 불가

---

### 5. 매물 요약 API (마커 클릭 시)

**엔드포인트**: `GET /api/v1/properties/:id/summary`

**기대 응답**:
```json
{
  "id": 14,
  "address": "서울 성동구 용답동 239-8",
  "priceType": "JEONSE",
  "deposit": 30000,
  "monthlyRent": null,
  "price": null,
  "rating": 3,
  "thumbnailUrl": "/temp-images/..."
}
```

**현재 상태**: 프론트엔드 코드에서는 `propertyApi.getDetail(id)`를 직접 사용 중
**개선**: summary 엔드포인트로 가볍게 분리하면 성능 개선 가능
**영향**: 마커 클릭 시 전체 detail 데이터를 로드하는 비효율 발생

---

## 🟡 Medium — 개선 필요

### 6. 매물 생성 API DTO 명세

**엔드포인트**: `POST /api/v1/properties`

**프론트엔드 전송 데이터**:
```json
{
  "address": "서울특별시 강남구 역삼동 123-45",
  "addressDetail": "101호",
  "latitude": 37.5012,
  "longitude": 127.0396,
  "priceType": "MONTHLY",
  "deposit": 1000,
  "monthlyRent": 50,
  "price": null,
  "area": 33,
  "currentFloor": 5,
  "totalFloors": 15,
  "rating": 4,
  "priceEvaluation": "REASONABLE",
  "moveInAvailable": true,
  "revisitIntention": true,
  "parkingType": "AVAILABLE",
  "maintenanceFee": 10,
  "environments": ["SUBWAY", "CAFE"],
  "memo": "역세권, 관리 잘됨",
  "imageIds": [101, 102, 103]
}
```

**기대 응답**:
```json
{
  "propertyId": 42
}
```

**현재 상태**: 일부 필드 저장 여부 미확인 (특히 `imageIds` 처리)
**영향**: 매물 등록 후 이미지가 연결되지 않을 수 있음

---

### 7. 타임라인 API 응답 구조

**엔드포인트**: `GET /api/v1/properties/timeline?page=0&size=20`

**기대 응답**:
```json
{
  "timelineGroups": [
    {
      "date": "2026-03-21",
      "properties": [
        {
          "id": 14,
          "address": "서울 성동구 용답동 239-8",
          "priceType": "JEONSE",
          "deposit": 30000,
          "monthlyRent": null,
          "price": null,
          "rating": 3,
          "thumbnailUrl": "/temp-images/...",
          "area": 33,
          "currentFloor": 5,
          "totalFloor": 15,
          "canMoveIn": true,
          "memo": null,
          "createdAt": "2026-03-21T02:41:30"
        }
      ]
    }
  ],
  "totalCount": 42,
  "hasNext": false
}
```

**현재 이슈**:
- `totalFloor` vs `totalFloors` 필드명 불일치 (프론트가 두 케이스 모두 처리 중)
- 리스트 API가 `thumbnailUrl`을 단일 문자열로 반환 — `images` 배열이 아님 (프론트에서 별도 처리 중)

**권장**: 모든 API에서 `totalFloors`로 통일

---

### 8. 최근 매물 API

**엔드포인트**: `GET /api/v1/properties/recent?limit=3`

**기대 응답**:
```json
[
  {
    "id": 14,
    "address": "서울 성동구 용답동 239-8",
    "priceType": "JEONSE",
    "deposit": 30000,
    "monthlyRent": null,
    "price": null,
    "rating": 3,
    "thumbnailUrl": "/temp-images/...",
    "area": 33,
    "currentFloor": 5,
    "totalFloor": 15,
    "canMoveIn": true,
    "createdAt": "2026-03-21T02:41:30"
  }
]
```

**현재 이슈**: `thumbnailUrl` 단일 문자열만 반환. `images: [string]` 배열과 혼용되어 프론트에서 fallback 처리 중.

**권장**: 리스트/타임라인/최근 API는 `thumbnailUrl` 단일 필드로 통일

---

## 🟢 Nice-to-have — 향후 개선

### 9. 위치 프리패치 API

**엔드포인트**: `POST /api/v1/properties/location/prefetch`

**역할**: 주소 → 주변 시설, 교통 정보 미리 계산
**현재 상태**: 프론트엔드에서 매물 등록 시 호출하나, 응답 구조 및 처리 타이밍 미확인

**기대 동작**:
```
매물 등록 시 주소의 위치 정보(locationInfo)를 비동기로 계산해서
이후 detail API 응답에 포함되도록 처리
```

---

### 10. 이미지 업로드 — 임시 이미지 연결

**현재 플로우**:
1. `POST /api/v1/images/upload` → `imageId`, `thumbnailUrl` 반환
2. 매물 생성 시 `imageIds` 배열로 전송
3. 백엔드에서 임시 이미지를 매물에 연결

**개선 제안**:
- 업로드 후 일정 시간 내에 매물에 연결되지 않은 이미지는 자동 삭제 처리 (orphan image cleanup)

---

### 11. 페이지네이션 일관성

모든 목록 API에서 페이지네이션 응답 구조를 통일할 것을 권장합니다:

```json
{
  "content": [...],
  "page": 0,
  "size": 20,
  "totalElements": 42,
  "totalPages": 3,
  "hasNext": true
}
```

---

## API 엔드포인트 전체 목록

| 메서드 | 경로 | 상태 | 우선순위 |
|--------|------|------|---------|
| POST | /api/v1/auth/login | ✅ 완료 | - |
| POST | /api/v1/auth/signup | ✅ 완료 | - |
| POST | /api/v1/auth/logout | ✅ 완료 | - |
| POST | /api/v1/auth/verify-email | ✅ 완료 | - |
| POST | /api/v1/auth/resend-verification | ✅ 완료 | - |
| GET | /api/v1/properties/recent | ✅ 완료 | - |
| GET | /api/v1/properties/timeline | ✅ 완료 | - |
| GET | /api/v1/properties/stats | ⚠️ 확인 필요 | 🟠 |
| GET | /api/v1/properties/:id/detail | ⚠️ images 구조 수정 필요 | 🔴 |
| POST | /api/v1/properties | ⚠️ imageIds 처리 확인 필요 | 🟡 |
| PATCH | /api/v1/properties/:id/detail | ⚠️ null 처리 수정 필요 | 🔴 |
| DELETE | /api/v1/properties/:id | ✅ 완료 | - |
| GET | /api/v1/properties/map/markers | ⚠️ bounds 파라미터 확인 | 🟠 |
| GET | /api/v1/properties/:id/summary | ⚠️ 존재 여부 확인 | 🟠 |
| POST | /api/v1/images/upload | ✅ 완료 | - |
| POST | /api/v1/properties/:id/images | ✅ 완료 | - |
| DELETE | /api/v1/properties/:id/images/:imageId | ✅ 완료 (기존 이미지 ID 없어 미사용) | 🔴 |
| POST | /api/v1/properties/location/prefetch | ⚠️ 확인 필요 | 🟢 |

---

## 데이터 타입 통일 요청

| 필드 | 현재 | 표준화 |
|------|------|--------|
| 층수 | `totalFloor` / `totalFloors` 혼용 | `totalFloors`로 통일 |
| 이미지 | `string[]` (detail) / `thumbnailUrl: string` (list) | detail은 `{imageId, url}[]`, list는 `thumbnailUrl: string` |
| 가격 타입 | `MONTHLY` / `MONTHLY_RENT` 혼용 가능성 | `MONTHLY`로 통일 |
| 날짜 | `createdAt` / `visitedAt` 혼용 | `createdAt` 유지 (프론트에서 방문일로 표시) |
