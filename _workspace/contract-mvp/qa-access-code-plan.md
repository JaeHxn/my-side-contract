# Access Code QA Plan

Date: 2026-05-17
Worker: QA

## Scope

This note covers the payment-issued six-digit analysis code boundary only.

- Code issuance, expiry, and use after payment
- `/api/admin/access-codes`
- `/api/analysis` access-code validation before analysis and persistence
- Supabase schema and admin security risks

No production files were edited.

## Current Read-Only Findings

- `POST /api/analysis` already requires `accessCode` and calls `verifyAccessCode` before `analyzeContract` or `saveContractAnalysisResult`.
- Current `src/lib/payments/access-code.ts` is still a static allowlist gate. It validates six numeric digits, trims input, rejects unknown codes, and requires an explicit env allowlist in production.
- `app/api/admin/access-codes` was being implemented in parallel during this QA pass, so the admin cases below are acceptance targets rather than verified results.
- Current result storage uses a service-role-only Supabase boundary for analysis results. Access-code storage should follow the same server-only pattern.

## Expected Product Decisions To Lock

- Decide whether a paid code is single-use for one analysis, reusable during a paid window, or single-use for creation plus result re-view allowed by result id/share token.
- Decide the expiry rule, likely `expires_at = paid_at + 30 days`, stored and compared in UTC.
- Decide when a code is consumed: recommended behavior is to consume atomically when analysis is accepted for processing. If analysis generation fails before producing a result, the API should either release the code or return a retry-safe state.
- Decide whether admin can see raw codes. Recommended behavior is to show raw code only once at issuance, then store only a hash and display a redacted form.

## Issuance Tests

| Case | Expected result |
| --- | --- |
| Payment succeeds once | One six-digit numeric code is created and linked to the payment record. |
| Duplicate payment webhook/event is retried | Issuance is idempotent; no second active code for the same payment id. |
| Payment fails, is canceled, or is unpaid | No usable code is issued. |
| Payment is refunded/charged back before use | Code is revoked or rejected by validation. |
| Code collision occurs during generation | Generator retries and persists a unique active code/hash. |
| Generated code has leading zeroes | Code remains exactly six digits, e.g. `004219`, not integer-coerced. |
| Expiry is calculated | `expires_at` is present, UTC-based, and matches the product window. |
| Issuance notification/resend is requested | Existing active code is reused or re-sent according to policy, not regenerated silently. |
| Missing payment/customer metadata | API returns a controlled error and does not create an orphaned code. |

## Expiry And Use Tests

| Case | Expected result |
| --- | --- |
| Valid unused code before `expires_at` | Accepted. |
| Code exactly at expiry boundary | Reject when `now() >= expires_at`; document this boundary. |
| Expired code | Rejected before analysis starts. |
| Already used single-use code | Rejected before analysis starts. |
| Revoked code | Rejected before analysis starts. |
| Two concurrent submissions with same unused code | Exactly one succeeds; the other sees used/invalid state. |
| Analysis succeeds | Code is marked used with `used_at`, and preferably linked to `result_id`. |
| Analysis validation fails before processing | Code remains unused. |
| Analysis generation or result persistence fails after consume | Behavior is explicit and tested: either retry allowed or code remains consumed with recoverable admin state. |
| Code belongs to another payment/customer when binding exists | Rejected. |

## `/api/analysis` Boundary Tests

| Request | Expected status | Extra checks |
| --- | --- | --- |
| Missing JSON body or malformed JSON | `400` | Does not call code validation, analysis, or persistence. |
| Missing `accessCode` | `400` | Error is generic and user-safe. |
| Non-string `accessCode` | `400` | Schema rejects it. |
| Empty or whitespace-only `accessCode` | `400` or `401` by chosen contract | Does not analyze. |
| `12345`, `1234567`, `abc123`, full-width digits | `401` or validation error | No Unicode digit bypass; only ASCII `0-9`. |
| ` 123456\n` | Success if active | Trimming behavior is intentional. |
| Unknown six-digit code | `401` | Does not reveal whether payment records exist. |
| Expired/used/revoked code | `401` or `403` by chosen contract | Message is actionable but not enumerating sensitive state. |
| Valid code with invalid `contractText` | `400` | Code should not be consumed. |
| Valid code with unsupported category | `400` | Code should not be consumed. |
| Valid code and valid contract | `200` | Calls analysis once, persists result, returns `resultUrl`. |
| Valid code but persistence fails | `200` with warning today | Verify chosen consume/retry policy. |
| Repeated valid request with same single-use code | First succeeds, second fails. |
| Brute-force burst from same IP/session | Rate limited or throttled before expensive work. |

## `/api/admin/access-codes` Boundary Tests

| Case | Expected result |
| --- | --- |
| No admin credential/session | `401`. |
| Non-admin authenticated user | `403`. |
| Admin list request | Returns paginated code records, newest first, with raw codes redacted. |
| Admin filter by status/payment/date | Returns only matching records and validates filter values. |
| Admin create/manual issue with valid input | Creates a code with expiry and audit metadata. |
| Admin create with invalid expiry/payment/status | `400`, no row created. |
| Admin revoke active code | Status changes to revoked; `/api/analysis` rejects it. |
| Admin revoke used/expired code | Either idempotent no-op or controlled conflict; document chosen behavior. |
| Admin tries to set raw code duplicate | Rejected or collision retried without exposing existing owner. |
| Pagination limits too high or negative | Clamped or rejected. |
| Admin route server error | Generic message; no service role key, SQL detail, or raw code leak. |
| Browser cache behavior | Admin responses include `Cache-Control: no-store`. |

## Supabase Table Design Risks

- Six-digit codes have only 1,000,000 combinations, so rate limiting and short/finite validity are required.
- Store `code_hash`, not plaintext code. If raw display is required, return it only once during issuance.
- Use a DB-side atomic consume operation or transaction. The critical update should include conditions like active status, `used_at is null`, and `expires_at > now()`.
- Add uniqueness around active code hashes and payment ids to prevent duplicate usable codes.
- Suggested fields: `id`, `code_hash`, `payment_id`, `status`, `expires_at`, `used_at`, `used_result_id`, `created_at`, `updated_at`, `revoked_at`, `created_by`, `audit_note`.
- Enable RLS and grant direct table access only to `service_role`; anon/authenticated clients should go through server routes only.
- Avoid storing raw contract text or unnecessary payer PII in the code table. If binding is needed, store minimal references or hashed identifiers.

## Admin Security Risks

- Admin endpoints must not rely on obscurity or a public env flag. Require real admin authentication/authorization.
- Never expose `SUPABASE_SERVICE_ROLE_KEY` or code hashes to the browser.
- Redact codes in list responses, for example `12****`, unless this is the one-time issuance response.
- Add audit logging for manual issue, revoke, and lookup actions.
- Add rate limits to both admin mutation routes and `/api/analysis` code verification.
- Use generic validation errors to avoid code enumeration.
- If admin auth uses cookies, verify CSRF protections and same-site settings.
- Ensure all admin and analysis-code responses are `no-store`.

## Recommended Release Gate

1. Unit tests for code generation, normalization, expiry, status transitions, and collision retry.
2. API tests for `/api/analysis` covering valid, malformed, unknown, expired, used, revoked, and concurrent code use.
3. API tests for `/api/admin/access-codes` covering auth, list redaction, create, revoke, validation, and cache headers.
4. Supabase migration review confirming RLS, service-role-only grants, indexes, uniqueness, and atomic consume support.
5. Manual smoke test: paid issuance to valid analysis to second-use rejection or documented re-view behavior.
