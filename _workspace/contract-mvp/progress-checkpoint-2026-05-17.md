# 내편계약서 MVP 진행 체크포인트

작성 시점: 2026-05-17 01:05 KST

## 제1조 작업 규칙

- 하네스 엔지니어링 구조를 따른다.
- 개발 작업은 `.claude/skills/contract-dev` 기준으로 라우팅한다.
- 여러 영역이 걸친 작업은 `frontend-dev`, `backend-dev`, `ai-integrator`, `qa` 에이전트를 병렬/단계형으로 실행한다.
- 환경변수는 `.env.local`만 조회한다. 값은 출력하지 않는다.
- `.env.example`은 사용자가 명시적으로 요청하지 않는 한 만들지 않는다.

## 현재 진행도

제품 MVP 100% 기준 약 45%.

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
- Supabase 분석 코드 저장 migration `analysis_access_codes`
- 코드 만료/사용 처리 서버 경계
- Supabase migration `contract_analysis_results`
- Supabase 무료 플랜 keepalive GitHub Actions
- 테스트/타입/빌드 검증 통과

## 마지막 검증

- `npm test`: 14 files, 47 tests passed
- `npx tsc --noEmit --incremental false`: passed
- `npm run build`: passed
- 화면 확인:
  - `http://127.0.0.1:3000`: 200
  - `http://127.0.0.1:3000/upload`: 200
  - `http://127.0.0.1:3000/admin`: build route verified

## 다음 작업

1. Supabase migration 실제 프로젝트에 적용
2. GitHub Repository Secrets 등록:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
3. Supabase migration 실제 프로젝트에 추가 적용:
   - `contract_analysis_results`
   - `analysis_access_codes`
4. 관리자 인증 강화:
   - 현재 `ADMIN_ACCESS_TOKEN`이 있으면 Bearer 토큰을 검사한다.
   - 정식 운영 전에는 로그인/권한/감사 로그가 필요하다.
5. 코드 사용 처리 원자성 강화:
   - 현재 서버 경계에서 사용 처리한다.
   - 동시 제출 방지는 DB 함수/RPC 또는 조건부 업데이트가 필요하다.
6. 관리자 코드 목록/취소/재발송 화면
7. PDF/이미지 OCR
8. SMS 발송 연동
9. 법령 API 실키/캐시 연동
10. 분석 결과 공유 토큰 또는 사용자 인증

## 주의

- 현재 로컬 워킹트리에 `LICENSE`, `README.md` 삭제가 남아 있다. 이 삭제는 Codex 작업 범위가 아니어서 커밋하지 않았다.
- 로컬 `.env.local`은 조회만 하고 값은 기록하지 않는다.
- `.env.example`은 만들거나 수정하지 않는다.
