# Admin Code Management QA Matrix

Date: 2026-05-17
Role: QA
Scope: 관리자 분석 코드 목록, 취소, 재발송 기능의 테스트 매트릭스와 API 경계 정리

## Scope

이 문서는 관리자 코드 관리 기능의 QA 기준만 정리한다.

- 대상 API: `GET /api/admin/access-codes`, `POST /api/admin/access-codes/revoke`
- 경계 API: 기존 `POST /api/admin/access-codes` 생성 API
- 주요 리스크: 관리자 인증, `Cache-Control: no-store`, 코드 원문 노출, 상태 전이, 재발송 정책
- 이번 구현에서 SMS 연동이 없다면 재발송은 보류/후속 범위로 둔다.

프로덕션 코드와 테스트 코드는 수정하지 않았다.

## Current Boundary

현재 확인된 구현 기준:

- `POST /api/admin/access-codes`는 관리자 수동 생성 API다.
- 생성 응답은 발급 직후 코드 원문을 포함한다.
- 현재 서버 모델의 상태값은 `active`, `used`, `expired` 중심이다.
- 취소 상태 `revoked`는 현재 상태 스키마와 DB 체크 제약에 포함되어야 신규 취소 기능이 정상 동작한다.
- `GET /api/admin/access-codes` 목록과 `POST /api/admin/access-codes/revoke` 취소는 기존 생성 API와 분리된 관리 기능으로 테스트해야 한다.
- `POST /api/analysis`는 코드 검증 후 분석/저장을 진행하고, 저장 성공 후 사용 처리한다. 사용 처리 실패는 사용자 흐름을 막지 않으므로 관리자 목록에서 불일치 탐지 기준이 필요하다.

## API Ownership

| API | 역할 | 이번 QA 기준 |
| --- | --- | --- |
| `POST /api/admin/access-codes` | 코드 생성 | 기존 생성 경계. 유효한 입력으로 active 코드 발급, 발급 직후 원문 표시 허용 여부 확인 |
| `GET /api/admin/access-codes` | 코드 목록 조회 | 신규 관리 경계. 페이지네이션, 필터, 정렬, 원문 비노출, no-store 검증 |
| `POST /api/admin/access-codes/revoke` | 코드 취소 | 신규 관리 경계. active 코드만 revoked 전이, 분석 API 거부 확인 |
| 재발송 | 코드 전달 재시도 | SMS 미연동이면 보류/후속. API가 있더라도 실제 발송 성공으로 간주하지 않음 |

## GET `/api/admin/access-codes` Test Matrix

| Case | Request | Expected result | Risk covered |
| --- | --- | --- | --- |
| 인증 없음 | 토큰/세션 없이 요청 | `401` | 관리자 목록 노출 방지 |
| 일반 사용자 | 비관리자 인증 | `403` | 권한 상승 방지 |
| 관리자 정상 조회 | 유효한 관리자 인증 | `200`, 최신순 목록 반환 | 기본 조회 |
| 캐시 헤더 | 정상/오류 응답 모두 | `Cache-Control: no-store` | 브라우저/프록시 캐시 방지 |
| 코드 원문 비노출 | 목록 응답 확인 | `code` 원문 미포함, 필요 시 `maskedCode`만 포함 | 6자리 코드 탈취 방지 |
| 해시/내부키 비노출 | 목록 응답 확인 | `code_hash`, 서비스 키, DB 에러 세부정보 미포함 | 내부 구현 노출 방지 |
| 페이지네이션 기본값 | 파라미터 없음 | 기본 limit/offset 또는 cursor 적용 | 대량 조회 비용 방지 |
| limit 과다 | `limit=10000` | 제한값 clamp 또는 `400` | 과다 조회 방지 |
| limit 음수/문자열 | `limit=-1`, `limit=abc` | `400` | 입력 검증 |
| 상태 필터 active | `status=active` | active만 반환 | 필터 정확성 |
| 상태 필터 used/expired/revoked | 각 상태별 요청 | 해당 상태만 반환 | 상태별 운영 조회 |
| 잘못된 상태 필터 | `status=deleted` | `400` | 임의 쿼리 방지 |
| 날짜 필터 | `from`, `to` | 범위 내 발급/만료 코드만 반환 | 운영 감사 |
| 날짜 역전 | `from > to` | `400` | 모호한 조회 방지 |
| 검색 필터 | 구매자명/전화번호/memo 일부 검색 | 권한 있는 관리자에게만 제한적으로 반환 | 개인정보 최소 노출 |
| 빈 결과 | 조건에 맞는 코드 없음 | `200`, 빈 배열과 페이지 메타 | UI 안정성 |
| 서버 오류 | Supabase 장애 | `500` 또는 `503`, 일반 메시지 | SQL/비밀값 누출 방지 |

## POST `/api/admin/access-codes/revoke` Test Matrix

| Case | Request | Expected result | Risk covered |
| --- | --- | --- | --- |
| 인증 없음 | 토큰/세션 없이 요청 | `401` | 임의 취소 방지 |
| 일반 사용자 | 비관리자 인증 | `403` | 권한 상승 방지 |
| active 취소 | `{ codeId/code, reason }` | `200`, 상태 `revoked`, `revokedAt` 기록 | 정상 취소 |
| 취소 후 분석 시도 | revoked 코드로 `/api/analysis` 요청 | `401` 또는 정책상 `403`, 분석 미실행 | 취소 효력 |
| 이미 revoked | 같은 요청 재시도 | 멱등 `200` 또는 `409` 중 정책 고정 | 중복 요청 안정성 |
| used 취소 | 사용 완료 코드 취소 요청 | `409` 권장 | 결과 무효화 혼선 방지 |
| expired 취소 | 만료 코드 취소 요청 | 멱등 no-op 또는 `409` 정책 고정 | 상태 의미 혼선 방지 |
| 존재하지 않는 코드 | 임의 ID/code | `404` 또는 일반 `400/404` | 코드 열거 방지 |
| malformed body | 빈 body/잘못된 JSON | `400` | 입력 검증 |
| reason 길이 초과 | 긴 취소 사유 | `400` | 저장소/감사 로그 보호 |
| 캐시 헤더 | 모든 응답 | `Cache-Control: no-store` | 상태 변경 응답 캐시 방지 |
| 동시 취소/사용 | 분석 사용 처리와 취소가 경쟁 | 한쪽만 성공, 최종 상태 일관 | race condition |
| DB 체크 제약 | `revoked` 상태 저장 | 스키마가 `revoked`를 허용해야 함 | 배포 실패 방지 |

## Existing Create API Boundary

`POST /api/admin/access-codes`는 생성 전용으로 유지하고, 목록/취소/재발송 책임을 섞지 않는다.

| Case | Expected result |
| --- | --- |
| 유효한 관리자 요청 | active 코드 1개 생성, `issuedAt`, `expiresAt`, optional metadata 반환 |
| `ttlDays` 최소/최대 | 1-90일만 허용 |
| 잘못된 body | `400`, 생성 함수 미호출 |
| 관리자 인증 실패 | `401` 또는 `403`, 생성 없음 |
| 생성 응답 캐시 | `Cache-Control: no-store` |
| 발급 직후 원문 코드 | 허용한다면 create 응답 1회에만 노출 |
| 목록 응답에서 원문 코드 | 노출 금지 |
| 코드 충돌 | 재시도 후 유일 코드 발급 |
| Supabase 미준비 개발 fallback | 로컬 데모 코드가 운영에 노출되지 않아야 함 |

## Status Transition Matrix

| From | Event | To | QA assertion |
| --- | --- | --- | --- |
| none | create | active | 6자리 코드, 만료일, 감사 메타 생성 |
| active | analysis saved and mark-used succeeds | used | `usedAt`, `resultId` 기록 |
| active | now >= expiresAt | expired | 검증 거부. 배치/조회에서 expired로 보이거나 계산 상태가 일관돼야 함 |
| active | admin revoke | revoked | 분석 API에서 즉시 거부 |
| used | admin revoke | used 또는 conflict | 결과가 이미 존재하므로 정책을 명확히 고정 |
| expired | admin revoke | expired 또는 revoked | 운영 의미를 문서화하고 UI 표시를 맞춤 |
| revoked | resend | revoked 유지 | 취소된 코드 재전달 금지 |
| revoked | analysis submit | revoked 유지 | 분석 미실행, 코드 재활성화 금지 |

주의: 현재 상태 스키마와 DB 제약이 `revoked`를 포함하지 않으면 revoke API는 코드 레벨 테스트를 통과해도 DB 저장에서 실패한다. 구현 전 마이그레이션과 Zod enum, 응답 타입을 함께 갱신해야 한다.

2026-05-18 보강: `revoked` 저장이 Supabase 체크 제약으로 실패하는 개발/미마이그레이션 환경에서는 취소 API가 같은 코드를 `expired`로 다시 저장해 분석 사용을 차단한다. 이 fallback은 운영 중단을 막기 위한 안전장치이고, 정식 상태 표시는 `supabase/migrations/20260517050000_analysis_access_codes_revoked_status.sql` 적용 후 `revoked`로 맞춘다.

## Authentication And Cache Risks

- 관리자 API는 토큰/세션이 없으면 실패해야 한다. 운영에서 관리자 토큰 미설정 시 통과하는 fallback은 금지해야 한다.
- `GET`, `POST create`, `POST revoke`의 성공/실패 응답 모두 `Cache-Control: no-store`가 필요하다.
- 관리자 화면이 코드 원문을 렌더링하는 경우 브라우저 히스토리, 스크린샷, 클립보드, 로그에 남을 수 있다.
- 서버 오류 메시지는 SQL, Supabase URL/key, 코드 원문, 내부 테이블명을 자세히 노출하지 않는다.
- 검색/필터 파라미터는 화이트리스트로 검증한다.

## Raw Code Exposure Risks

권장 정책:

- 생성 직후 1회 표시만 원문 코드 허용.
- 목록 API는 `maskedCode` 또는 내부 식별자만 반환.
- 취소 API는 원문 코드 대신 서버 ID 기반을 우선 사용한다. 원문 코드 입력을 허용하더라도 응답에는 원문을 반복하지 않는다.
- 장기적으로는 plaintext `code` 저장 대신 hash 저장을 검토한다. 6자리 코드는 공간이 작으므로 rate limit와 원문 비노출이 필수다.

## Resend Scope

이번 구현에서 SMS 발송 연동이 없다면 재발송은 보류/후속으로 명시한다.

| Case | Expected result |
| --- | --- |
| 관리자 화면에 재발송 버튼 노출 | SMS 미연동이면 비활성화 또는 "보류" 상태 |
| API만 선구현 | 실제 SMS 발송 성공으로 표시하지 않음 |
| active 코드 재발송 | 후속 구현 시 기존 코드 재전달, 새 코드 생성 금지 |
| used/expired/revoked 재발송 | 거부 |
| 발송 실패 | 코드 상태 변경 없음, 감사 로그에 실패 기록 |
| 재발송 응답 | 원문 코드를 불필요하게 다시 노출하지 않음 |

## Release Gate

1. `GET /api/admin/access-codes` 인증, 필터, 페이지네이션, no-store, 원문 비노출 테스트 통과
2. `POST /api/admin/access-codes/revoke` active->revoked, used/expired/revoked 재요청, 동시성 테스트 통과
3. DB 상태 제약과 서버 enum에 `revoked` 포함 여부 확인
4. `/api/analysis`가 expired/used/revoked를 분석 전에 거부하는지 확인
5. SMS 미연동 재발송은 UI/API에서 보류/후속으로 표시하고 성공 발송처럼 보이지 않게 처리

## 2026-05-18 Verification Note

- `src/lib/server/access-codes.test.ts`: `revoked` 저장이 DB 제약으로 실패하면 `expired`로 fallback되는 회귀 테스트 추가.
- `app/api/admin/access-codes/revoke/route.test.ts`: 취소 라우트 기존 테스트 통과.
- 실제 로컬 서버 `http://127.0.0.1:3000`에서 임시 코드 발급 -> 취소 -> 분석 거부 흐름 확인.
- 현재 연결된 Supabase DB는 `revoked` migration 미적용으로 판단된다. 취소 API는 성공하지만 상태는 `expired`로 저장된다.
