# OCR Upload QA Plan

Date: 2026-05-17
Worker: QA

## Scope

This plan covers the planned PDF/photo OCR upload path and its handoff into the existing `/api/analysis` contract analysis flow.

Current repo state:

- At initial QA inspection, tracked files did not include `/api/ocr`. During parallel work, untracked candidate files appeared under `app/api/ocr/` and `src/lib/ocr/`; this plan treats those as implementation candidates to verify, not QA-owned changes.
- `/upload` currently accepts only `.txt`, `.md`, and `.text` files, reads them in the browser, and posts extracted text to `/api/analysis`.
- `/api/analysis` requires `{ contractText, category, accessCode }`, trims text, enforces `30 <= contractText <= 50000`, verifies the analysis code before analysis, and returns `Cache-Control: no-store`.
- Existing AI enhancement silently falls back to rule-based analysis when `OPENAI_API_KEY` is missing, but OCR should not silently succeed without an OCR engine.
- The observed candidate OCR response is flat `{ text, fileName, mimeType, characterCount }`. If the product keeps that shape, contract tests should lock it; if a nested `source` object is preferred, update the route and tests together.

## Expected `/api/ocr` Contract To Test

Recommended request:

- `POST /api/ocr`
- `multipart/form-data`
- Required field: `file`
- Optional field: `category`, defaulting to `housing-lease` if the OCR prompt needs contract-type context.

Recommended success response:

```json
{
  "text": "extracted contract text",
  "source": {
    "fileName": "lease.pdf",
    "mimeType": "application/pdf",
    "size": 123456,
    "pageCount": 3
  },
  "warnings": []
}
```

Observed candidate success response:

```json
{
  "text": "extracted contract text",
  "fileName": "lease.pdf",
  "mimeType": "application/pdf",
  "characterCount": 1234
}
```

Required response headers:

- `Cache-Control: no-store`
- JSON only; no raw file echo, no base64 echo, no secret or provider request details.

## API Test Matrix

| Case | Input | Expected result | Must verify |
| --- | --- | --- | --- |
| PDF success | Small valid PDF with Korean lease text | `200`, extracted `text` length >= 30 | Calls OCR provider once, normalizes line breaks, returns `no-store`. |
| Photo success | Valid JPEG/PNG photo of contract | `200`, extracted `text` length >= 30 | Handles Korean text, rotated/phone-camera image where supported, no raw image returned. |
| Missing file | Empty multipart body or wrong field name | `400 INVALID_FILE` | No provider call, stable user-facing message. |
| Malformed multipart | Broken boundary/body | `400 INVALID_REQUEST` | No unhandled exception, JSON response. |
| Unsupported file type | `.exe`, `.docx`, `.heic` if unsupported, or text-only upload | `415 UNSUPPORTED_FILE_TYPE` | Validate by MIME, extension, and ideally magic bytes; no provider call. |
| MIME spoofing | `lease.pdf` name with executable/image-invalid bytes | `415` or `422` | Server does not trust `file.type` alone. |
| File too large | File above configured byte limit | `413 FILE_TOO_LARGE` | Reject before loading full file into provider payload; no provider call. |
| Too many pages | PDF above configured page limit | `413` or `422 TOO_MANY_PAGES` | Cost cap is enforced before OCR where possible. |
| Empty OCR | Blank image, scanned noise, or image with unreadable text | `422 OCR_TEXT_EMPTY` | Does not call `/api/analysis`; asks user to retry/manual paste. |
| Low-quality OCR | OCR returns very short or low-confidence text | `200` with warning or `422` | UI exposes warning and requires user review before analysis. |
| Provider timeout | OCR provider request times out | `504 OCR_TIMEOUT` | Request is aborted; no hanging UI state. |
| Provider rate limit | OCR provider returns 429 | `503 OCR_UNAVAILABLE` or `429 OCR_RATE_LIMITED` | Does not leak provider payload; retry messaging is clear. |
| Provider invalid response | Provider returns malformed JSON/no text | `502 OCR_PROVIDER_BAD_RESPONSE` | JSON error, no crash. |
| `OPENAI_API_KEY` missing | Env var unset/blank and no local OCR fallback exists | `503 OCR_NOT_CONFIGURED` | No provider call attempted; message does not mention secret value. |
| Oversized extracted text | OCR text > 50,000 chars | `200` with truncation warning or `422 OCR_TEXT_TOO_LONG` | Behavior matches `/api/analysis` max length; no hidden truncation before user review. |
| Concurrent uploads | Same user starts two OCR requests | Both finish independently or latest wins in UI | No stale result overwrites current file state. |

## Candidate Implementation Gaps To Lock Down

- Missing `OPENAI_API_KEY` currently appears likely to surface as generic `502 OCR_FAILED`; QA should require a deterministic `503 OCR_NOT_CONFIGURED` or documented equivalent.
- Provider `429` is currently mapped to a generic `502`; QA should require either `429 OCR_RATE_LIMITED` or `503 OCR_UNAVAILABLE` with retry-safe messaging.
- Validation failures are currently all `400 INVALID_OCR_FILE`; QA should decide whether unsupported type should be `415` and file too large should be `413`, then lock the chosen API contract.
- The candidate validates MIME/extension but does not prove file magic bytes; add spoofed file tests before accepting server-side validation as complete.
- The route reads the full uploaded file into memory before the OCR helper enforces `MAX_OCR_FILE_BYTES`; add an oversized upload test that confirms memory/cost behavior is acceptable for the deployment target.
- Candidate OCR accepts text length >= 10, while `/api/analysis` requires >= 30; add a handoff test so OCR success cannot produce text that immediately fails analysis without a clear UI recovery state.
- Candidate OCR slices provider text to 50,000 chars without returning a truncation warning; QA should require an explicit warning or a hard `422`.
- No PDF page-count cap is visible; add tests once the PDF parsing/page-limit decision is implemented.
- No timeout/abort behavior is visible; add a provider-hangs test before release.
- Current route tests cover success, missing file, validation failure, and provider failure; missing key, oversized file, unsupported MIME, spoofed MIME, too-short OCR, and malformed provider payload still need explicit coverage.

## UI Test Matrix

| Area | Required tests |
| --- | --- |
| File picker | Accepts only planned PDF/image extensions; existing text upload still works or the supported formats are clearly separated. |
| Client validation | Oversized and unsupported files show immediate errors before network request, while server repeats the same enforcement. |
| Loading state | OCR button/dropzone is disabled during upload; spinner/progress state cannot submit stale manual text. |
| OCR review step | Extracted text is shown in the textarea before `/api/analysis`; user can edit obvious OCR mistakes before spending/using an analysis code. |
| Analysis handoff | After OCR success, clicking analyze sends the edited `contractText`, selected `category`, and `accessCode` to `/api/analysis`. |
| Error recovery | Failed OCR keeps existing manually entered text intact; selecting a new file clears only OCR-specific warnings. |
| Accessibility | Dropzone is keyboard reachable, file input has an accessible label, errors are announced with `aria-live`. |
| Mobile photos | Camera-upload flow works on mobile viewport and long filenames do not break layout. |

## Security Risks To Test

- File validation must be server-side, allowlist-based, and independent of client `accept` rules.
- Reject polyglot/spoofed files where extension, MIME, and magic bytes disagree.
- Keep strict size/page limits to prevent memory exhaustion and provider-cost spikes.
- Do not store raw uploaded files unless a separate retention/privacy design exists.
- Do not log raw contract text, OCR provider payloads, base64 images, access codes, or full filenames if they may contain personal data.
- Return `Cache-Control: no-store` for OCR success and failure responses.
- Sanitize any OCR text rendered in the UI; contract text may contain malicious-looking HTML/JS strings from the document.
- Use server-only `OPENAI_API_KEY`; never expose it to client bundles or response bodies.
- Add rate limits to `/api/ocr`, separate from `/api/analysis`, because OCR has a high per-request cost and accepts large payloads.
- Ensure OCR failure does not consume a paid analysis code unless the product explicitly sells OCR attempts.
- Confirm CORS defaults do not allow arbitrary third-party sites to use the OCR endpoint.

## Cost Risks To Test

- Enforce max file size and max pages before calling the OCR provider.
- Downscale/compress large images before provider submission only if text remains legible; test that compression does not destroy Korean text.
- Add request timeout and abort handling so stuck provider calls do not accumulate.
- Prefer one OCR call per upload; test that React retries/rerenders do not duplicate calls.
- Add telemetry counters for accepted/rejected file size, provider status, latency, and extracted text length without logging sensitive content.
- Decide whether OCR is free preview, paid feature, or tied to the six-digit access code before release; tests should lock the chosen billing boundary.

## `/api/ocr` To `/api/analysis` Quality Risks

| Risk | Why it matters | QA check |
| --- | --- | --- |
| Korean OCR spacing loss | Rule matching and clause splitting can miss article markers when OCR returns compact, spaced, line-broken, or partially misrecognized variants. | Use OCR-like fixtures with delimiter variants and verify analysis still produces multiple findings. |
| Clause order changes | PDF extraction may reorder columns, footers, stamps, or page headers. | Multi-page PDF fixture should preserve major clause order before analysis. |
| Boilerplate noise | Page numbers, signatures, watermark text, and scanned stamps can dilute the contract text. | Verify OCR cleanup removes repeated headers/footers or analysis is not dominated by noise. |
| Low-confidence characters | Amounts, dates, addresses, and parties are high-risk when one digit is wrong. | UI must show extracted text for review and highlight low-confidence/uncertain segments if provider supports it. |
| Truncation | `/api/analysis` caps text at 50,000 chars; hidden OCR truncation can omit special terms. | If truncating, warn the user and prefer keeping beginning plus special-agreement sections where feasible. |
| Empty/short extraction | Bad scan may still return a few words and pass naive success handling. | Gate analysis on meaningful text length and contract-like terms, not only non-empty text. |
| PII exposure | OCR text can include names, addresses, resident IDs, phone numbers, and account info. | Confirm existing PII redaction applies before AI analysis, and OCR logs do not store raw text. |
| Analysis code consumption | User may spend a code on OCR-corrupted text. | Do not submit to `/api/analysis` automatically; require review/confirm step. |

## Priority Regression Tests

1. Unit/API tests for `/api/ocr` validation: missing file, unsupported type, oversized file, missing `OPENAI_API_KEY`, provider failure, provider success.
2. Contract test that `/api/ocr` success text can be manually edited and then posted to `/api/analysis` without changing the existing `/api/analysis` response shape.
3. UI test for PDF/photo upload success path: select file, wait for OCR text, edit text, enter access code, submit analysis.
4. UI test for OCR failure path: failed OCR shows error, does not clear existing textarea content, and does not call `/api/analysis`.
5. Fixture-based analysis quality tests using OCR-style Korean lease text variants, especially article-marker, line-break, and numbering variants already identified as a parser risk.

## Release Gate

Do not ship PDF/photo OCR until these are true:

- `/api/ocr` has deterministic tests for success, validation failure, provider failure, and missing `OPENAI_API_KEY`.
- Server and client enforce the same file size/type rules, with server as source of truth.
- OCR success never bypasses the user review/edit step before `/api/analysis`.
- OCR and analysis responses are `no-store`.
- A documented cost cap exists: file bytes, PDF pages, timeout, and rate limit.
- Manual smoke test passes with one real Korean lease PDF and one phone photo.
