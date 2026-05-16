---
name: contract-dev
description: "내편계약서 MVP 개발 오케스트레이터. 프론트엔드 페이지, 백엔드 API, Claude API/OCR/법령 API 통합, QA 검증 등 모든 개발 작업을 조율한다. '만들어줘', '구현해줘', '개발', '추가', '수정', '버그 고쳐줘', '페이지', 'API', '컴포넌트', '기능' 등 개발 관련 요청이 오면 반드시 이 스킬을 사용한다. MVP 전체 개발, 단일 기능 추가, 코드 수정, 리팩토링, 다시 만들어줘, 이전 결과 개선 모두 포함. 단순 질문이나 개념 설명은 제외."
---

# 내편계약서 개발 오케스트레이터

## Phase 0: 컨텍스트 확인

워크플로우 시작 전 실행 모드를 결정한다.

- `_workspace/` 없음 → **초기 실행**
- `_workspace/` 있음 + 부분 수정 요청 → **부분 재실행** (해당 에이전트만 호출)
- `_workspace/` 있음 + 새 기능 추가 → **증분 실행** (기존 산출물 읽고 연속)
- "다시 해줘" / "새로 해줘" → 기존 `_workspace/`를 `_workspace_prev/`로 이동 후 새 실행

## Phase 1: 요청 분석 및 라우팅

요청을 분석하여 단일 에이전트 라우팅 또는 멀티 에이전트 조율을 결정한다.

### 단일 에이전트 라우팅 (서브 에이전트 패턴)

단일 도메인 작업은 해당 에이전트에게 직접 위임한다:

| 요청 패턴 | 담당 에이전트 |
|----------|------------|
| 페이지, 컴포넌트, UI, 화면 | `frontend-dev` |
| API 엔드포인트, DB, 결제 플로우, Supabase | `backend-dev` |
| Claude API 분석, OCR, 법령 API, 프롬프트 | `ai-integrator` |
| 블로그, 마케팅 글, 커뮤니티 포스팅, 쇼츠 | → `content-marketing` 스킬 사용 |
| 버그, 검증, 테스트, 품질 확인 | `qa` |

**실행 모드: 서브 에이전트**
```
Agent(
  subagent_type: "{agent-name}",
  model: "opus",
  prompt: "역할 파일: .claude/agents/{agent-name}.md\n\n{구체적 작업 명세}"
)
```

### 멀티 에이전트 조율 (하이브리드 패턴)

"MVP 만들어줘", "전체 개발해줘", "주요 기능 다 구현해줘" 처럼 여러 도메인이 걸치면:

**Phase 1-A: 병렬 개발 (서브 에이전트, run_in_background)**
```
동시 실행:
- frontend-dev: 업로드/결과/관리자 페이지 UI
- backend-dev: Supabase 스키마 + API 엔드포인트
- ai-integrator: OCR + 법령 API + Claude 분석 파이프라인
```

**Phase 1-B: 통합 검증 (QA 서브 에이전트)**
세 에이전트 완료 후 QA 에이전트 호출. `_workspace/` 구현 보고서들을 입력으로 전달.

**Phase 1-C: 버그 수정**
QA 보고서의 실패 항목을 해당 에이전트에게 재위임.

## 데이터 전달 프로토콜

- **개발 보고서**: `_workspace/{phase}_{agent}_{artifact}.md`에 저장
- **에이전트 간 인터페이스**: frontend-dev가 필요한 API shape → backend-dev 보고서에서 읽음
- **QA 인풋**: `_workspace/` 전체 보고서를 QA에게 전달

## 에러 핸들링

- 에이전트 실패 → 1회 재시도 (동일 프롬프트)
- 재실패 → 해당 결과 없이 진행, 최종 보고에 누락 명시
- QA 실패 항목 3개 이상 → 해당 에이전트에 수정 위임 후 재검증

## 테스트 시나리오

**정상 흐름:**
"업로드 페이지 만들어줘" → frontend-dev 서브 에이전트 → `app/upload/page.tsx` 생성 → `_workspace/01_frontend_upload.md` 보고

**에러 흐름:**
"Claude API 분석 안 돼" → QA 에이전트로 분석 결과 JSON 구조 검증 → 실패 항목 → ai-integrator에게 프롬프트 수정 위임
