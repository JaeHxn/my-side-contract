# 내편계약서 MVP 진행 체크포인트

작성 시점: 2026-05-17 01:05 KST
최근 갱신: 2026-05-18 20:50 KST

## 제1조 작업 규칙

- 하네스 엔지니어링 구조를 따른다.
- 개발 작업은 `.claude/skills/contract-dev` 기준으로 라우팅한다.
- 여러 영역이 걸친 작업은 `frontend-dev`, `backend-dev`, `ai-integrator`, `qa` 에이전트를 병렬/단계형으로 실행한다.
- 환경변수는 `.env.local`만 조회한다. 값은 출력하지 않는다.
- `.env.example`은 사용자가 명시적으로 요청하지 않는 한 만들지 않는다.

## 현재 진행도

제품 MVP 100% 기준 약 70%.

## 현재 로컬 확인 URL

- 메인: `http://127.0.0.1:3000`
- 계약서 업로드/분석: `http://127.0.0.1:3000/upload`
- 관리자 코드 발급/목록/취소: `http://127.0.0.1:3000/admin`
- 로컬 테스트 분석 코드: `123456`

## 완료된 것

- Next.js + TypeScript 앱 기본 구조
- 메인 화면 `/`
- 계약서 입력/분석 화면 `/upload`
- 전월세 계약서 규칙 기반 분석
- OpenAI Responses API 연동
- 기본 OpenAI 모델 `gpt-5.4-mini`
- OpenAI 전송 전 PII 마스킹
- 분석 코드 검증
- Supabase 결과 저장/조회 서버 경계
- 결과 저장 API `POST /api/result`
- 결과 조회 API `GET /api/result/[id]`
- `/api/analysis` 분석 성공 후 결과 저장 자동 연결
- 결과 상세 화면 `/result/[id]`
- 관리자 코드 발급 화면 `/admin`
- 관리자 코드 발급 API `POST /api/admin/access-codes`
- 관리자 코드 목록 UI 및 상태 필터
- 관리자 코드 목록 API `GET /api/admin/access-codes`
- 관리자 코드 취소 API `POST /api/admin/access-codes/revoke`
- Supabase `revoked` 상태 migration 미적용 시 취소를 `expired`로 저장하는 fallback
- 관리자 페이지 로그인 게이트 `/admin`
- 관리자 로그인/로그아웃 API `POST /api/admin/auth/login`, `POST /api/admin/auth/logout`
- 관리자 HttpOnly 세션 쿠키 인증
- Supabase 분석 코드 저장 migration `analysis_access_codes`
- Supabase 분석 코드 `revoked` 상태 migration
- 코드 만료/사용 처리 서버 경계
- PDF/사진 OCR 업로드 API `POST /api/ocr`
- 업로드 화면 PDF/사진 OCR 연동
- OCR 추출 텍스트 검토 후 분석 제출 흐름
- 근로계약서 카테고리 활성화
- 근로계약서 규칙 기반 분석
- 근로기준법/최저임금법 기본 법령 근거
- 국가법령정보센터 `lawSearch.do` 법령 검색 연동
- 국가법령정보센터 `lawService.do?target=lawjosub` 조문/항/호/목 본문 조회 연동
- 법령 API 조문 원문 excerpt를 OpenAI 분석 프롬프트에 주입
- Supabase migration `contract_analysis_results`
- Supabase 무료 플랜 keepalive GitHub Actions
- 테스트/타입/빌드 검증 통과
- 관리자 코드 관리 QA 매트릭스 `_workspace/contract-mvp/qa-admin-code-management.md`

## 마지막 검증

- `npm test`: 21 files, 103 tests passed
- `npx tsc --noEmit --incremental false`: passed
- `npm run build`: passed
- `npm run lint`: ESLint 설정이 없어 Next.js 대화형 설정 프롬프트에서 중단됨
- 화면 확인:
  - `http://127.0.0.1:3000`: 200
  - `http://127.0.0.1:3000/upload`: 200
  - `http://127.0.0.1:3000/admin`: 200
  - 관리자 인증/API 집중 테스트: 5 files, 24 tests passed
- 실제 관리자 API 확인:
  - 임시 코드 발급 성공
  - 취소 API 성공
  - 현재 Supabase DB는 `revoked` migration 미적용 상태라 취소 결과가 `expired`로 저장됨
  - 취소된 임시 코드로 분석 시도 시 `401 INVALID_ACCESS_CODE`로 거부됨
- 실제 법령 API 확인:
  - `LAW_API_OC`로 `lawService.do?target=lawjosub&type=json&MST=276291&JO=000400` 호출 시 200 응답 확인
  - `lawjosub`는 `ID` 또는 `MST`가 필요하므로, 코드에서는 먼저 `lawSearch.do`로 식별자를 찾는다.
  - `ID`, `MST`, `LM` 없이 샘플 기본 URL만 호출하면 법령이 특정되지 않아 조문 내용은 반환되지 않음

## 다음 작업

1. Supabase migration 실제 프로젝트에 적용:
   - `analysis_access_codes_status_check`가 `revoked`를 허용해야 관리자 화면에서 취소 상태가 `취소`로 표시된다.
2. 관리자 코드 재발송/SMS 연동
3. GitHub Repository Secrets 등록:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
4. Supabase migration 실제 프로젝트에 추가 적용:
   - `contract_analysis_results`
   - `analysis_access_codes`
5. 관리자 인증 추가 강화:
   - 현재 `ADMIN_ACCESS_TOKEN` 기반 로그인과 HttpOnly 세션 쿠키를 사용한다.
   - 정식 운영 전에는 감사 로그, 로그인 실패 제한, 계정 잠금 정책이 필요하다.
6. 코드 사용 처리 원자성 강화:
   - 현재 서버 경계에서 사용 처리한다.
   - 동시 제출 방지는 DB 함수/RPC 또는 조건부 업데이트가 필요하다.
7. OCR 운영 보강:
   - 파일 매직바이트 검증
   - PDF 페이지 수 제한
   - OCR 요청 rate limit/timeout
8. 관리자 목록 코드 원문 노출 최소화:
   - 현재 MVP는 관리 편의상 6자리 코드를 표시한다.
   - 운영 전에는 생성 직후 1회 표시 + 목록 maskedCode/hash 저장 방식을 검토한다.
9. SMS 발송 연동
10. 법령 API 24시간 캐시 테이블 또는 메모리 캐시
11. 분석 결과 공유 토큰 또는 사용자 인증

## 주의

- 현재 로컬 워킹트리에 `LICENSE`, `README.md` 삭제가 남아 있다. 이 삭제는 Codex 작업 범위가 아니어서 커밋하지 않았다.
- 로컬 `.env.local`은 조회만 하고 값은 기록하지 않는다.
- `.env.example`은 만들거나 수정하지 않는다.
