# 임장노트 전체 플로우 이슈 리포트

화면별로 발견된 이슈를 클라이언트/백엔드로 분류.
탐색 진행하면서 순차적으로 추가됨.

---

# 클라이언트

## C-001: 로그인 페이지
- **상태**: 확인 필요
- **증상**: 로그인 API 200 성공 후 홈으로 이동이 안 될 수 있음 (재현 필요)
- **Vaul Drawer 접근성 경고**: DialogContent에 DialogTitle이 없음 → VisuallyHidden으로 감싸야 함
- **UI**: 로그인 페이지 자체는 깔끔. "비밀번호를 잊으셨나요?" 실제 동작 확인 필요

## C-002: 홈 페이지
- **상태**: 정상
- 헤더 리디자인 적용됨 ("임장노트" 서브 + 인사말 메인 + 아바타)
- 통계 카드 아이콘 적용됨 (3건 / 3건)
- 카드 세로형 대형 사진 적용됨
- 별점 중복 표시 해결됨 (★★★★ 4, ★★★★★ 5)
- 가격/면적 정보 정상 표시
- pill 네비바 + FAB 분리 배치 적용됨

## C-003: 상세 페이지 (PropertyDetailPage)
- **상태**: 수정 필요
- **편의시설 아이콘 색상 제각각**: 편의점/대형마트/은행/병원/약국이 모두 다른 색상 → `bg-slate-100 + text-slate-600`으로 통일 필요 (TODO.md에 이미 반영)
- **체크리스트 아이콘도 색상 통일 필요**: 긍정(초록)/부정(빨강)/정보(회색) 3색만 사용
- **기능 정상**: 교통정보, 편의시설, 체크리스트, 사진, 방문일 모두 정상 표시
- **공유하기 버튼**: 있음 (실제 동작 확인 필요)
- **수정하기 버튼**: 정상 동작 → 수정 페이지 이동 확인됨

## C-004: 수정 페이지 저장 실패 (PropertyEditPage) ⚠️ 치명적
- **상태**: 저장 실패 (500 Internal Server Error)
- **원인**: 프론트엔드가 보내는 payload와 백엔드 DTO가 완전히 불일치

### 백엔드가 기대하는 필드 (PATCH /properties/:id/detail)
```
moveInAvailable    (Boolean)        → 즉시 입주 가능
revisitIntention   (Boolean)        → 재방문 의사
priceEvaluation    (Enum)           → REASONABLE / EXPENSIVE / CHEAP
parkingType        (Enum)           → AVAILABLE / NOT_AVAILABLE / CONDITIONAL / UNKNOWN
maintenanceFee     (Long)           → 관리비
environments       (Set<Enum>)      → QUIET, BUSY_AREA, RESIDENTIAL, NEAR_PARK 등
memo               (String, max1000)
```

### 프론트엔드가 실제 보내는 필드
```
address            ❌ 백엔드 DTO에 없음
addressDetail      ❌
priceType          ❌
deposit            ❌
monthlyRent        ❌
price              ❌
area               ❌
currentFloor       ❌
totalFloors        ❌
rating             ❌
priceEvaluation    ⚠️ 값이 다름 ("FAIR" → 백엔드는 "REASONABLE")
checkItems         ❌ 백엔드에 없는 필드
surroundings       ❌ 백엔드는 "environments"
moveInAvailable    ✅
revisitIntention   ✅
memo               ✅
parkingType        ❌ 보내지 않음 (백엔드는 필요)
maintenanceFee     ❌ 보내지 않음 (백엔드는 필요)
```

### 500 에러 원인 (추정)
1. `priceEvaluation: "FAIR"` → 백엔드 PriceEvaluation enum에 FAIR가 없음 → 역직렬화 실패
2. 또는 `surroundings` 필드명이 `environments`와 다름
3. 또는 `checkItems` 같은 알 수 없는 필드로 인한 에러

### 기타
- UI 자체는 정상 (useBlocker 해결, 폼 로드 정상)
- 수정 페이지에서 위치정보 수정 섹션은 제거 (수정할 필요 없음)

## C-005: 타임라인 페이지
- **상태**: 정상
- 검색바 + 필터 칩 (전체/전세/월세/매매/⭐4+) 적용됨
- [+ 기록] 버튼 제거됨 (FAB으로 대체)
- 카드 세로형 대형 사진 적용됨
- 날짜 그룹핑 정상 ("오늘 · 3건")
- 가격/면적/층수 정상 표시
- Vaul Drawer 접근성 경고 지속됨 (C-001과 동일 — 전체 앱에서 DialogTitle 누락)

## C-006: 매물 등록 페이지 (PropertyNewPage)
- **상태**: 정상
- 빠른 기록 폼 UI 정상 (위치정보 + 필수 체크리스트)
- 주소 검색 / 현재 위치 / 지도 선택 버튼 정상 표시
- 별점, 가격평가, 입주가능, 재방문의사 폼 정상
- 저장 시 POST /properties 200 성공
- 등록 후 `/timeline`으로 정상 이동 (ID undefined 이슈 해결됨)
- "매물이 등록되었어요!" 토스트 정상
- location prefetch API 200 성공

## C-007: [전체] Vaul Drawer 접근성 경고 (DialogTitle 누락)
- **상태**: 경고 (Warning)
- **증상**: 모든 Drawer에서 `DialogContent requires DialogTitle` 콘솔 에러
- **수정**: 모든 `Drawer.Content`에 `<VisuallyHidden><Drawer.Title>...</Drawer.Title></VisuallyHidden>` 추가
- **파일**: Drawer 사용하는 모든 컴포넌트 (HomePage, MapPage, PropertyDetailPage 등)

## C-008: 지도 페이지 마커 없음
- **상태**: 데이터 문제 (백엔드)
- **증상**: 지도 API 200 성공이지만 markers가 빈 배열 `{"markers":[]}`
- **원인**: 매물에 위도/경도가 저장되지 않음
- **프론트**: 지도 로드/검색/필터 기능 정상. API 파라미터 정상 (southWestLat 등)
- **근본 원인**: 매물 생성 시 latitude/longitude가 백엔드에 저장되는지 확인 필요 (B-003 참조)

## C-009: 수정 페이지 사진 삭제 400 에러
- **상태**: 삭제 실패 (400 Bad Request)
- **원인**: 백엔드 detail API가 이미지를 **문자열 배열**로만 반환: `["/temp-images/..."]`
  프론트엔드 `normalizeProperty()`가 이걸 `[{id: 0, url: "..."}]`로 변환 (배열 인덱스를 id로 사용)
  따라서 `DELETE /properties/17/images/0` 호출 → 실제 DB에 imageId=0은 없음 → 400
- **근본 원인**: 백엔드 detail API의 `images` 필드에 이미지 ID가 포함되지 않음

---

# 백엔드

## B-001: 매물 수정 API 필드 불일치 (PATCH /properties/:id/detail)

### 현재 상황
현재 PATCH 엔드포인트는 **상세 정보만** 수정 가능:
- 체크리스트 (입주가능, 재방문, 가격평가)
- 주차, 관리비
- 환경, 메모

하지만 프론트엔드 수정 페이지에서는 **기본 정보도** 수정함:
- 주소, 가격, 면적, 층수, 거래유형, 별점

### 해결 방안 (2가지 중 선택)

**방안 A: 백엔드 PATCH DTO 확장 (권장)**
`UpdatePropertyDetailRequest`에 기본 정보 필드 추가:
```java
public record UpdatePropertyDetailRequest(
    // 기존 필드
    Boolean moveInAvailable,
    Boolean revisitIntention,
    PriceEvaluation priceEvaluation,
    ParkingType parkingType,
    Long maintenanceFee,
    Set<EnvironmentType> environments,
    @Size(max = 1000) String memo,
    
    // 추가 필드 (기본 정보 수정용)
    String address,
    String addressDetail,
    PriceType priceType,
    Long deposit,
    Long monthlyRent,
    Long price,
    Double area,
    Integer currentFloor,
    Integer totalFloor,
    Integer rating
) {}
```
각 필드 nullable이면 변경하지 않는 방식 (partial update).

**방안 B: 프론트엔드에서 백엔드 DTO에 맞게만 전송**
프론트 `handleSave`에서 백엔드가 받는 필드만 전송:
```js
save({
  moveInAvailable,
  revisitIntention,
  priceEvaluation,    // "FAIR" → "REASONABLE" 매핑 필요
  parkingType,        // 추가 필요
  maintenanceFee,     // 추가 필요
  environments: surroundings,  // 필드명 변경
  memo,
});
```
단, 이 경우 주소/가격/면적 등 기본 정보는 수정 불가.

### priceEvaluation enum 값 매핑 문제
프론트엔드가 "적당해요"를 `"FAIR"`로 보내는데, 백엔드 enum은 `REASONABLE`.

| 프론트 (현재) | 백엔드 (PriceEvaluation) |
|---|---|
| CHEAP | CHEAP ✅ |
| FAIR | REASONABLE ❌ 불일치 |
| EXPENSIVE | EXPENSIVE ✅ |

**프론트엔드에서 `FAIR` → `REASONABLE`로 매핑하거나, 백엔드 enum에 FAIR alias 추가.**

### environments enum 값 매핑
프론트엔드 `surroundings` 배열의 값들이 백엔드 `EnvironmentType` enum과 일치하는지 확인 필요:
```
백엔드 EnvironmentType:
QUIET, BUSY_AREA, RESIDENTIAL, COMMERCIAL,
NEAR_PARK, NEAR_MOUNTAIN, NEAR_RIVER, GREEN_LACK,
MAIN_ROAD, ALLEY, UNDER_CONSTRUCTION, NEAR_SCHOOL
```
프론트엔드에서 보내는 값이 이 enum과 정확히 일치해야 함.

### 해결 방향: 방안 B (프론트 축소)
- 프론트에서 백엔드 DTO에 맞는 7개 필드만 전송
- 위치정보 수정 섹션 제거 (수정할 필요 없음)
- `FAIR` → `REASONABLE` 매핑 필수
- `surroundings` → `environments` 필드명 변경 필수

---

## B-002: 매물 상세 API images 필드에 이미지 ID 누락 (GET /properties/:id/detail)

### 현재 상황
detail API의 `images` 필드가 **문자열 URL 배열**만 반환:
```json
"images": ["/temp-images/user2/2026/03/thumb_xxx.png"]
```

### 문제
프론트엔드에서 이미지 삭제 시 `DELETE /properties/:id/images/:imageId` 호출 필요.
하지만 실제 이미지 ID를 알 수 없어 삭제 불가.

### 해결 방안

**방안 A (PRD): detail API 응답에 이미지 ID 포함 (권장)**

현재 `PropertyDetailResponse`의 images 필드를 문자열 배열에서 **객체 배열**로 변경:

AS-IS:
```java
@Schema(description = "이미지 URL 목록")
List<String> images
```

TO-BE:
```java
@Schema(description = "이미지 목록")
List<PropertyImageDto> images

// 새 DTO
public record PropertyImageDto(
    @Schema(description = "이미지 ID", example = "42")
    Long imageId,
    
    @Schema(description = "썸네일 URL")
    String thumbnailUrl,
    
    @Schema(description = "원본 URL")
    String originalUrl
) {}
```

응답 예시:
```json
"images": [
  { "imageId": 42, "thumbnailUrl": "/temp-images/.../thumb_xxx.png", "originalUrl": "/images/.../xxx.png" },
  { "imageId": 43, "thumbnailUrl": "/temp-images/.../thumb_yyy.png", "originalUrl": "/images/.../yyy.png" }
]
```

이렇게 하면 프론트엔드에서 `imageId`를 알 수 있어 삭제 API 호출 가능.

**방안 B: 프론트에서 삭제 기능 비활성화 (임시)**
- 수정 페이지에서 이미지 삭제 버튼을 숨김
- 백엔드 API 수정 후 복원

---

## B-003: 지도 마커 API 백엔드 구현 PRD

지도 기능이 동작하려면 2개 API와 매물 좌표 저장이 필요.

---

### API 1: 지도 마커 조회

**엔드포인트**: `GET /api/v1/properties/map/markers`

**요청 파라미터** (Query String, 모두 필수):
| 파라미터 | 타입 | 설명 | 예시 |
|---|---|---|---|
| `southWestLat` | Double | 뷰포트 남서쪽 위도 | 37.546 |
| `southWestLng` | Double | 뷰포트 남서쪽 경도 | 127.059 |
| `northEastLat` | Double | 뷰포트 북동쪽 위도 | 37.576 |
| `northEastLng` | Double | 뷰포트 북동쪽 경도 | 127.076 |
| `zoomLevel` | Integer | 카카오맵 줌 레벨 (1~14) | 5 |

**응답 본문** (200 OK):
```json
{
  "markers": [
    {
      "id": 17,
      "latitude": 37.5612,
      "longitude": 127.0345,
      "address": "서울 성동구 가람길 287",
      "priceType": "JEONSE",
      "deposit": 11111,
      "monthlyRent": null,
      "price": null,
      "rating": 5,
      "thumbnailUrl": "/temp-images/user2/2026/03/thumb_xxx.png"
    }
  ]
}
```

**응답 필드 설명:**
| 필드 | 타입 | 필수 | 설명 |
|---|---|---|---|
| `id` | Long | ✅ | 매물 ID (마커 클릭 시 상세보기 네비게이션에 사용) |
| `latitude` | Double | ✅ | 위도 (마커 위치) |
| `longitude` | Double | ✅ | 경도 (마커 위치) |
| `address` | String | ✅ | 주소 (마커 라벨에서 동/리 추출해서 표시) |
| `priceType` | String | ✅ | 거래유형: `JEONSE`, `MONTHLY_RENT`, `SALE` (필터링에 사용) |
| `deposit` | Long | ❌ | 보증금/전세금 (요약 카드에 표시) |
| `monthlyRent` | Long | ❌ | 월세 (요약 카드에 표시) |
| `price` | Long | ❌ | 매매가 (요약 카드에 표시) |
| `rating` | Integer | ❌ | 별점 1~5 (마커 색상 결정: 4+ 초록, 3 노랑, 1~2 빨강) |
| `thumbnailUrl` | String | ❌ | 섬네일 URL (요약 카드에 표시) |

**비즈니스 로직:**
- 현재 로그인된 사용자의 매물만 반환
- `latitude`/`longitude`가 뷰포트 범위 내인 매물만 필터링
  - `latitude BETWEEN southWestLat AND northEastLat`
  - `longitude BETWEEN southWestLng AND northEastLng`
- `zoomLevel`은 향후 클러스터링에 사용 가능 (우선은 무시 가능)
- 좌표가 null인 매물은 제외

---

### API 2: 매물 요약 카드 (마커 클릭 시)

**엔드포인트**: `GET /api/v1/properties/{propertyId}/summary`

**요청**: Path Variable `propertyId` (Long)

**응답 본문** (200 OK):
```json
{
  "id": 17,
  "address": "서울 성동구 가람길 287",
  "priceType": "JEONSE",
  "deposit": 11111,
  "monthlyRent": null,
  "price": null,
  "rating": 5,
  "thumbnailUrl": "/temp-images/user2/2026/03/thumb_xxx.png"
}
```

**참고**: 현재 프론트에서는 markers 응답에 충분한 정보가 있으면 summary API 없이 마커 데이터를 그대로 요약 카드에 사용.
markers 응답이 위 필드를 모두 포함하면 summary API는 구현 안 해도 됨.

---

### 선행 조건: 매물 생성 시 좌표 저장

**확인 필요 사항:**
1. `CreatePropertyRequest` DTO에 `latitude` (Double), `longitude` (Double) 필드가 있는지
2. Property 엔티티에 latitude/longitude 컴럼이 있는지
3. PropertyService.createProperty()에서 좌표를 실제 DB에 저장하는지

**프론트엔드 현황:**
- 매물 등록 시 다음 사용자 행위를 통해 `latitude`/`longitude`를 획득:
  1. 다음 주소 검색 → geocoder로 좌표 변환
  2. 현재 위치 사용 → `navigator.geolocation`으로 좌표 획득
  3. 지도에서 핀 선택 → 카카오맵 중앙 좌표 획득
- 이 좌표를 `POST /api/v1/properties` payload에 포함해서 전송

**구현되지 않으면 지도 기능 전체가 무용지물.**

---

### 전체 데이터 플로우

```
[매물 등록] → POST /properties (latitude/longitude 포함)
    ↓
[DB에 좌표 저장]
    ↓
[지도 페이지 오픈] → GET /properties/map/markers (viewport bounds)
    ↓
[마커 표시] → rating으로 색상 결정 (4+초록, 3노랑, 1~2빨강)
    ↓
[마커 클릭] → markers 응답 데이터로 요약 카드 Drawer 표시
    ↓
[상세보기 클릭] → navigate(`/properties/${id}`)
```
