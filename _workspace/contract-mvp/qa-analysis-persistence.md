# Analysis Persistence QA

Date: 2026-05-17
Worker: QA

## Scope

Focused tests for the `/api/analysis` integration with stored analysis results. QA ownership stayed limited to tests and this `_workspace/contract-mvp/qa-*.md` note.

## Coverage Added

- Successful analysis request calls `analyzeContract`, persists the returned analysis through `saveContractAnalysisResult`, and keeps the legacy top-level `analysis` response.
- Successful persistence returns saved-result metadata through `result` and a share/page link through `resultUrl`.
- Persistence failure keeps the analysis response available and returns `result: null`, `resultUrl: null`, and a warning code.
- Invalid access codes stop before analysis and persistence.

## Verification

- `npx vitest run app/api/analysis/route.test.ts`: PASS, 1 file / 3 tests.
- `npx vitest run app/api/analysis/route.test.ts app/api/result/route.test.ts 'app/api/result/[id]/route.test.ts' src/lib/server/results.test.ts src/lib/supabase/server.test.ts`: PASS, 5 files / 19 tests.
- `npm test`: PASS, 12 files / 38 tests.
