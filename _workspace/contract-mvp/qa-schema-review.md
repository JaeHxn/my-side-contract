# Contract MVP QA / Schema Review

Date: 2026-05-17
Worker: QA/schema

## Scope Reviewed

- Planned MVP boundary in `계약서_AI분석_서비스_최종계획서.md`
- Contract schema/category surface in `src/lib/contracts/*`
- Analysis pipeline in `src/lib/analysis/*`
- Law lookup client in `src/lib/legal/law-client.ts`
- Access-code gate in `src/lib/payments/*`
- Read-only check of `app/api/analysis/route.ts` to understand request validation

No implementation modules were edited.

## Current Boundary Summary

Planned MVP says the service should focus on housing leases only:

- 대상: 원룸/오피스텔 월세, 전세, 반전세 계약서
- 법령: 주택임대차보호법, 민법 임대차 관련 조항, 상가건물임대차보호법
- Later categories: labor, wedding, interior, freelance

Current code partially encodes this:

- `src/lib/contracts/categories.ts` has `enabledCategories = ["housing-lease"]`.
- `src/lib/contracts/types.ts` still exposes all future categories in `contractCategories`.
- `app/api/analysis/route.ts` validates `category` against all `contractCategories`, not `enabledCategories`.
- `src/lib/analysis/service.ts` always runs the housing lease law/reference path regardless of category.

## Confirmed Status

- `npm test`: PASS, 2 test files / 6 tests.
- `npx tsc --noEmit`: FAIL.

Build failure:

- `src/lib/legal/law-client.ts:66` returns `({ title; url } | null)[]` where `LawApiDocument[]` is required.
- `src/lib/legal/law-client.ts:78` type predicate is invalid because the inferred object has required `url: string | undefined` while `LawApiDocument` has optional `url`.

## Findings

### P0 - TypeScript build is blocked in law API parsing

`src/lib/legal/law-client.ts:66-78` does not type-check. The project test runner passes because Vitest transpiles, but a production build/type gate can fail before deployment.

Concrete fix expectation:

- Narrow nullable rows before returning, or annotate the mapped row as `LawApiDocument | null`.
- Add a law-client test that imports `fetchHousingLeaseLawReferences`; this will keep the module covered by test compilation/transforms.

### P1 - Non-MVP categories can be submitted and analyzed as housing leases

The route schema accepts all `contractCategories`, while the MVP boundary enables only `housing-lease`. `analyzeContract` does not reject unsupported categories and still fetches housing lease references. A `labor` request can therefore return a result labeled as `labor` with housing lease rules/laws.

Concrete expected behavior to choose:

- Preferred for MVP: reject categories not in `enabledCategories` with a clear unsupported-category error.
- Alternative: remove future categories from the request enum until each category has rules/law references.

Concrete tests:

- API/schema test: `labor` category returns 400/unsupported while `housing-lease` is accepted.
- Lib test if validation moves to lib: `analyzeContract({ category: "labor" })` rejects before calling law lookup or AI.

### P1 - "Latest law" claim is not reliably represented in item-level findings

`fetchHousingLeaseLawReferences` can return law-api references, and `service.ts` places them on result-level `legalReferences`. However, each finding's `legalBasis` is created earlier in `rule-based.ts` from built-in references. Users may see stale built-in legal bases on the actual flagged clauses even when the law API succeeds.

Concrete expected behavior:

- Either keep the public claim weaker for MVP, or thread live law references into item/missing-clause `legalBasis`.
- Expose fallback state clearly when `LAW_API_OC` is missing or all law API calls fail.

Concrete tests:

- Mock law API success and assert returned result has `source: "law-api"` where the user-visible legal basis is rendered/serialized.
- Mock all law API calls failing and assert fallback is explicit enough for the UI to disclose built-in references.

### P1 - Planned legal coverage and implemented legal references do not match

Plan says housing MVP laws include:

- 주택임대차보호법
- 민법
- 상가건물임대차보호법

Implementation built-ins include:

- 주택임대차보호법
- 민법
- 공인중개사법

The brokerage-law rule may be useful, but the planned commercial building lease law is absent. This needs either a plan correction or implementation coverage, especially for officetel/commercial-use ambiguity.

Concrete tests:

- Contract law-reference fixture test: expected MVP law titles are present.
- Rule coverage test: each rule's `legalTitles` resolves to at least one legal reference.

### P1 - Rule coverage is too thin for a paid housing lease MVP

The current housing rule set covers 6 risk patterns and 4 missing-clause checks. That is a reasonable prototype, but thin for the plan's paid "actual lawyer-level accuracy" promise. Gaps likely to produce false safety:

- deposit return timing and simultaneous exchange nuance
- landlord/owner identity and authority
- address, unit, deposit/rent/date exactness
- management fee and utility fee ambiguity
- restoration/original-state clauses
- special terms overriding standard terms
- mortgage/senior lien/priority warning text
- repair split for pre-existing defects vs tenant fault
- early termination, renewal notice windows, rent increase cap

Concrete tests:

- One positive and one negative fixture for every supported high-risk rule.
- Missing-clause fixtures that include equivalent wording, not only exact keywords.
- A "known risky but currently missed" fixture list marked TODO until rules exist.

### P2 - OCR-style contract text may not split into clauses

`splitClauses` only splits on `제 N 조`. OCR/PDF text often uses variants like `제1조`, `1.`, `1)`, `특약사항`, line-broken titles, or spaced/misrecognized Korean. If not split, only one rule match is found for the whole contract because `housingRules.find` returns the first matching rule.

Concrete tests:

- Text containing two distinct dangerous clauses should return two dangerous/warning findings.
- Clause delimiters `제1조`, `제 1 조`, `1.`, `특약사항` should not collapse all findings into one item.

### P2 - AI provider silently masks upstream API failures

`ai-provider.ts` does not check `response.ok`; it parses JSON and may convert rate limits/auth errors into a generic note or silently fall back. Silent fallback is acceptable for resilience, but QA should verify provider status and user-visible copy do not imply AI review succeeded when it did not.

Concrete tests:

- `USE_AI_ANALYSIS=true` with 401/429 from Anthropic/OpenAI returns `provider: "rule-based"` or a disclosed fallback state.
- Successful AI response appends the note without removing rule-based risky counts.

### P2 - Access-code gate is static and not tied to a purchase/session

`verifyAccessCode` correctly validates six-digit allowlisted codes, but the plan says paid users get 30-day re조회. Current library has no expiry, single-use, phone/payment binding, or audit state. That may be acceptable for MVP day zero, but it should be tracked as a product/security boundary.

Concrete tests:

- Existing unit tests cover malformed/unknown codes.
- Add tests for trimming, ignoring invalid allowlist entries, and production default empty allowlist.
- When persistence exists, add expiry/reuse/payment-linkage tests.

## Suggested Test Files

High-value tests that stay under `src/lib/**/*.test.ts`:

- `src/lib/legal/law-client.test.ts`
  - no `LAW_API_OC` returns built-in references
  - all fetches fail returns built-in references
  - one successful API result survives partial failures
  - Korean law API payload keys parse to `source: "law-api"` references with `lastChecked`

- `src/lib/analysis/service.test.ts`
  - unsupported non-MVP category is rejected or blocked before analysis
  - law API references are not lost between service-level references and item-level legal bases
  - AI enhancement preserves rule-based counts and risky items

- `src/lib/analysis/rule-based.test.ts`
  - each current rule has at least one positive fixture
  - multi-risk contract returns more than the first matched risk
  - OCR delimiter variants still produce separate findings
  - each `legalTitles` entry resolves to a non-empty `legalBasis`

- `src/lib/payments/access-code.test.ts`
  - trims user input
  - ignores malformed allowlist entries
  - `getAccessCodeAllowlist()` returns empty in production with no env code

## Recommended Release Gate For MVP

Before public/paid MVP:

1. `npm test` passes.
2. `npx tsc --noEmit` passes.
3. Unsupported categories are blocked at request or service boundary.
4. Law API fallback state is explicit.
5. At least one fixture exists for each promised result class: illegal, unfavorable, normal, missing.
6. Known false-negative housing scenarios are documented as out-of-scope or covered by rules.

