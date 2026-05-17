# Admin Page Auth QA Checklist

Date: 2026-05-17
Role: QA
Scope: `/admin` page access protection, login API, session cookie, logout, existing admin API token checks, and `ADMIN_ACCESS_TOKEN` environment risk.

## Scope

This checklist defines acceptance and regression checks for adding protection to the administrator page.

- Page boundary: `/admin`
- Auth boundary: login API, session cookie creation/validation, logout
- API boundary: relationship between page/session auth and existing administrator API token checks
- Environment boundary: development and production behavior when `ADMIN_ACCESS_TOKEN` is missing

This document is QA guidance only. No application code is changed here.

## Product And Security Decisions To Lock

| Decision | Expected rule |
| --- | --- |
| Login credential source | `ADMIN_ACCESS_TOKEN` is the single configured secret unless a stronger admin auth system is explicitly introduced. |
| Missing admin token | Production must fail closed. Development may show a controlled setup error, but must not silently allow admin access. |
| Page auth | `/admin` must not render administrator data or privileged UI before authentication is confirmed. |
| API auth | Existing `/api/admin/*` token protections must remain enforced even if `/admin` page sessions are added. |
| Session lifetime | Cookie expiry/max-age must be explicit and short enough for admin risk. |
| Logout contract | Logout must invalidate the browser session cookie and prevent immediate reuse. |

## `/admin` Page Access Protection

| Case | Steps | Expected result | Risk covered |
| --- | --- | --- | --- |
| Unauthenticated direct visit | Open `/admin` in a clean browser session | Admin page is not rendered; user is redirected to login or shown a login form | Direct URL exposure |
| Unauthenticated refresh | Refresh `/admin` after clearing cookies | Admin data and controls are not visible | Cached privileged UI |
| Authenticated visit | Log in with valid admin token, then open `/admin` | Admin page renders normally | Happy path |
| Back button after logout | Log in, open `/admin`, log out, press browser back | Admin page is not usable and protected data is not visible | Browser history leakage |
| Deep link after login | Visit a protected admin sub-state or query URL after valid login | Page loads only after auth check succeeds | Bypass through route state |
| Client-side only bypass | Disable JavaScript or inspect initial HTML response | Initial response does not include sensitive admin data for unauthenticated users | SSR/static data leakage |
| Loading state | Open `/admin` with a valid session on slow network | Loading state does not flash unauthenticated admin data before validation | UI flash leakage |
| Cache headers | Inspect `/admin` response and protected data responses | `Cache-Control: no-store` or equivalent private no-cache policy is applied | Shared/browser cache leakage |

## Login API

| Case | Request | Expected result | Risk covered |
| --- | --- | --- | --- |
| Valid token | Submit exact configured `ADMIN_ACCESS_TOKEN` | `200` or redirect success; session cookie is set | Admin login |
| Missing token input | Empty body or missing token field | `400` or `401`; no cookie set | Accidental open login |
| Wrong token | Submit incorrect token | `401`; no cookie set | Unauthorized access |
| Whitespace token | Submit leading/trailing whitespace | Behavior is explicit and tested; no unintended acceptance of malformed secrets | Input ambiguity |
| Non-string token | Submit object, number, array, or null | `400`; no cookie set | Schema bypass |
| Malformed JSON | Send invalid JSON | Controlled `400`; no stack trace or secret exposure | Error handling |
| Repeated failures | Send multiple wrong tokens quickly | Rate limiting, lockout, delay, or documented mitigation is present | Brute-force risk |
| Error message | Submit wrong token | Response does not reveal configured token, env details, or whether token exists | Secret leakage |
| Method restriction | Use `GET`, `PUT`, `DELETE` against login endpoint | `405` or controlled rejection | Unexpected method surface |

## Session Cookie

| Case | Check | Expected result | Risk covered |
| --- | --- | --- | --- |
| Cookie presence | Inspect login success response | A dedicated admin session cookie is set | Session establishment |
| `HttpOnly` | Inspect `Set-Cookie` attributes | Cookie is `HttpOnly` | XSS token theft |
| `Secure` in production | Inspect production cookie attributes | Cookie is `Secure` over HTTPS | Network interception |
| `SameSite` | Inspect cookie attributes | `SameSite=Lax` or `Strict` unless a cross-site flow is required | CSRF |
| Path scope | Inspect cookie `Path` | Cookie is scoped as narrowly as practical, preferably admin/auth boundary | Cookie overexposure |
| Expiry | Inspect `Max-Age` or `Expires` | Session duration is explicit | Indefinite admin session |
| Tampering | Modify cookie value manually | `/admin` and admin APIs reject it | Session forgery |
| Replay after secret rotation | Change `ADMIN_ACCESS_TOKEN` or session signing secret, then reuse old cookie | Old sessions are invalidated or rotation behavior is documented | Stale access |

## Logout

| Case | Steps | Expected result | Risk covered |
| --- | --- | --- | --- |
| Normal logout | Click logout while authenticated | Session cookie is cleared and user leaves admin area | Session termination |
| Logout then reload | Log out, then reload `/admin` | Login is required again | Cookie clearing failure |
| Logout endpoint unauthenticated | Call logout without a session | Controlled success or `204`; no error leak | Idempotency |
| Logout method restriction | Call logout with unsupported methods | `405` or controlled rejection | Unexpected method surface |
| Cookie attributes on clear | Inspect clearing `Set-Cookie` | Clear uses matching cookie name/path/domain plus expired date or `Max-Age=0` | Cookie not actually removed |

## Existing Admin API Token Checks

| Case | Request | Expected result | Risk covered |
| --- | --- | --- | --- |
| Existing token auth still works | Call existing `/api/admin/*` with valid admin token as currently supported | Existing behavior remains compatible | Regression |
| No token and no session | Call `/api/admin/*` unauthenticated | `401` | API exposure |
| Session only | Call `/api/admin/*` with only the new session cookie | Expected policy is explicit: accepted only if APIs intentionally trust session auth; otherwise rejected | Ambiguous auth boundary |
| Token only | Call `/api/admin/*` with valid token but no page session | Expected policy is explicit and tested | Automation/backoffice compatibility |
| Invalid token with valid session | Send bad token plus valid cookie | Precedence is defined; should not downgrade or bypass auth | Confused deputy |
| CSRF attempt | Cross-site form/fetch attempt against admin mutation API with session cookie | Mutation is rejected unless CSRF protection is present and satisfied | Session-based CSRF |
| Sensitive response cache | Inspect admin API responses | `Cache-Control: no-store` on protected admin data | API cache leakage |

## `ADMIN_ACCESS_TOKEN` Environment Risk

| Environment | Condition | Expected result | Risk covered |
| --- | --- | --- | --- |
| Development | `ADMIN_ACCESS_TOKEN` missing | `/admin` and login fail closed or show setup-only error; no automatic admin access | Local accidental open admin |
| Development | `ADMIN_ACCESS_TOKEN` set to weak known value | Warning is documented or test fixture is isolated; production build must not inherit it | Weak secret carryover |
| Production | `ADMIN_ACCESS_TOKEN` missing | App fails startup/deploy health check or admin auth fails closed with controlled error | Public admin exposure |
| Production | `ADMIN_ACCESS_TOKEN` empty string | Treated as missing; no login succeeds with empty input | Empty secret bypass |
| Production | `ADMIN_ACCESS_TOKEN` changed | Existing sessions/tokens are invalidated or behavior is documented | Secret rotation |
| Logs | Missing token or login failure | Logs do not print the token value or submitted credential | Secret disclosure |

## Regression Checklist

- Existing admin access-code APIs keep their current authorization contract.
- Public user flows outside `/admin` are unaffected.
- `/api/analysis` access-code validation remains separate from administrator authentication.
- Admin page protection does not rely only on hidden buttons or client-side routing.
- All protected admin responses avoid storing sensitive data in browser, CDN, or framework caches.
- Production deployment without `ADMIN_ACCESS_TOKEN` cannot create an accidentally open administrator page.
