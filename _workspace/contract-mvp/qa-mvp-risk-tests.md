# Contract MVP QA Risk Tests

Date: 2026-05-17
Worker: QA

## Added Coverage

- OpenAI failure path: service-level analysis keeps rule-based provider, summary, findings, missing clauses, and built-in legal references when the OpenAI call rejects.
- PII redaction: current worktree coverage verifies direct redaction of email, phone, resident ID, Korean name/address fields, and verifies the AI provider sends redacted contract text.
- Access-code gate: submitted codes and allowlist entries are trimmed; malformed allowlist entries are ignored; production has no default fallback code.
- Unsupported category boundary: the shared `enabledCategories` allowlist accepts `housing-lease` and rejects future categories such as `labor` and `wedding`.
- Law API fallback/parser: no OC key skips network and returns built-ins; complete API failure returns built-ins; partial API success parses Korean law API keys and tolerates failed sibling requests.

## Verification

- `npx vitest run src/lib/analysis/service.test.ts src/lib/legal/law-client.test.ts src/lib/contracts/category-boundary.test.ts src/lib/payments/access-code.test.ts src/lib/privacy/pii-redaction.test.ts src/lib/analysis/ai-provider.test.ts`: PASS, 6 files / 16 tests.
- `npm test`: FAILS due to unrelated/concurrent suites `src/lib/server/results.test.ts` and `src/lib/supabase/server.test.ts` importing missing modules. The MVP-risk tests listed above passed in that run before the suite failed.
