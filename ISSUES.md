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
