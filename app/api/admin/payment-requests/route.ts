import { randomInt } from "node:crypto";
import { getSupabaseServerConfig, SupabaseConfigError } from "@/src/lib/supabase/server";
import { isAuthorizedAdminRequest, jsonNoStore } from "../access-codes/shared";
import { sendAccessCodeEmail } from "@/src/lib/email/mailer";

function getConfig() {
  try {
    return getSupabaseServerConfig();
  } catch (e) {
    if (e instanceof SupabaseConfigError) return null;
    throw e;
  }
}

function makeHeaders(key: string, extra: Record<string, string> = {}) {
  return {
    apikey: key,
    authorization: `Bearer ${key}`,
    "content-type": "application/json",
    ...extra,
  };
}

export async function GET(request: Request) {
  if (!isAuthorizedAdminRequest(request)) {
    return jsonNoStore({ error: "UNAUTHORIZED", message: "관리자 권한이 필요합니다." }, 401);
  }

  const config = getConfig();
  if (!config) {
    return jsonNoStore({ error: "SERVER_ERROR", message: "서버 설정 오류입니다." }, 500);
  }

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status") ?? "pending";

  const url = new URL(`${config.url}/rest/v1/payment_requests`);
  url.searchParams.set("select", "id,depositor_name,email,method,amount,status,issued_code,created_at");
  url.searchParams.set("order", "created_at.desc");
  url.searchParams.set("limit", "100");
  if (status !== "all") {
    url.searchParams.set("status", `eq.${status}`);
  }

  const response = await fetch(url, {
    method: "GET",
    headers: makeHeaders(config.serviceRoleKey),
  });

  const data = await response.json().catch(() => null) as unknown;
  if (!response.ok) {
    console.error("[admin/payments] select error:", data);
    return jsonNoStore({ error: "DB_ERROR", message: "목록 조회 중 오류가 발생했습니다." }, 500);
  }

  return jsonNoStore({ paymentRequests: Array.isArray(data) ? data : [] });
}

/** 입금 확인(자동 코드 발급+이메일) | 거절
 *  body: { id: string, action: "confirm" | "reject" }
 */
export async function PATCH(request: Request) {
  if (!isAuthorizedAdminRequest(request)) {
    return jsonNoStore({ error: "UNAUTHORIZED", message: "관리자 권한이 필요합니다." }, 401);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonNoStore({ error: "BAD_REQUEST", message: "요청 형식이 올바르지 않습니다." }, 400);
  }

  const { id, action } = body as Record<string, unknown>;

  if (typeof id !== "string" || !id) {
    return jsonNoStore({ error: "BAD_REQUEST", message: "id가 필요합니다." }, 400);
  }
  if (action !== "confirm" && action !== "reject" && action !== "resend_email") {
    return jsonNoStore({ error: "BAD_REQUEST", message: "action은 confirm, reject, resend_email 이어야 합니다." }, 400);
  }

  const config = getConfig();
  if (!config) {
    return jsonNoStore({ error: "SERVER_ERROR", message: "서버 설정 오류입니다." }, 500);
  }

  // ── 이메일 재발송 ──────────────────────────────
  if (action === "resend_email") {
    const getUrl2 = new URL(`${config.url}/rest/v1/payment_requests`);
    getUrl2.searchParams.set("id", `eq.${id}`);
    getUrl2.searchParams.set("select", "id,depositor_name,email,issued_code,status");
    getUrl2.searchParams.set("limit", "1");
    const getRes2 = await fetch(getUrl2, { headers: makeHeaders(config.serviceRoleKey) });
    const rows2 = (await getRes2.json().catch(() => [])) as Record<string, unknown>[];
    const row2 = rows2[0];

    if (!row2) {
      return jsonNoStore({ error: "NOT_FOUND", message: "해당 신청을 찾을 수 없습니다." }, 404);
    }
    const resendEmail = typeof row2.email === "string" ? row2.email : null;
    const resendCode = typeof row2.issued_code === "string" ? row2.issued_code : null;
    if (!resendEmail) {
      return jsonNoStore({ error: "NO_EMAIL", message: "이메일 주소가 없습니다." }, 400);
    }
    if (!resendCode) {
      return jsonNoStore({ error: "NO_CODE", message: "발급된 코드가 없습니다. 먼저 승인하세요." }, 400);
    }
    try {
      await sendAccessCodeEmail({
        to: resendEmail,
        buyerName: String(row2.depositor_name),
        code: resendCode,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      });
      return jsonNoStore({ ok: true, emailSent: true, code: resendCode });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "이메일 발송 실패";
      return jsonNoStore({ ok: false, emailSent: false, emailError: msg }, 500);
    }
  }

  // ── 거절 처리 ──────────────────────────────────
  if (action === "reject") {
    const rejectUrl = new URL(`${config.url}/rest/v1/payment_requests`);
    rejectUrl.searchParams.set("id", `eq.${id}`);
    const res = await fetch(rejectUrl, {
      method: "PATCH",
      headers: makeHeaders(config.serviceRoleKey),
      body: JSON.stringify({ status: "rejected" }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => null);
      console.error("[admin/payments] reject error:", err);
      return jsonNoStore({ error: "DB_ERROR", message: "처리 중 오류가 발생했습니다." }, 500);
    }
    return jsonNoStore({ ok: true });
  }

  // ── 입금 확인 (confirm) ────────────────────────
  // 1. 신청 행 조회
  const getUrl = new URL(`${config.url}/rest/v1/payment_requests`);
  getUrl.searchParams.set("id", `eq.${id}`);
  getUrl.searchParams.set("select", "id,depositor_name,email,status");
  getUrl.searchParams.set("limit", "1");

  const getRes = await fetch(getUrl, { headers: makeHeaders(config.serviceRoleKey) });
  const rows = (await getRes.json().catch(() => [])) as Record<string, unknown>[];
  const row = rows[0];

  if (!row) {
    return jsonNoStore({ error: "NOT_FOUND", message: "해당 신청을 찾을 수 없습니다." }, 404);
  }
  if (row.status !== "pending") {
    return jsonNoStore({ error: "ALREADY_PROCESSED", message: "이미 처리된 신청입니다." }, 409);
  }

  // 2. 유니크 6자리 코드 생성 + analysis_access_codes 삽입
  const code = await insertUniqueCode(config, String(row.depositor_name));

  // 3. payment_requests 상태 업데이트
  const updateUrl = new URL(`${config.url}/rest/v1/payment_requests`);
  updateUrl.searchParams.set("id", `eq.${id}`);
  const updateRes = await fetch(updateUrl, {
    method: "PATCH",
    headers: makeHeaders(config.serviceRoleKey),
    body: JSON.stringify({ status: "confirmed", issued_code: code }),
  });
  if (!updateRes.ok) {
    const err = await updateRes.json().catch(() => null);
    console.error("[admin/payments] update error:", err);
    return jsonNoStore({ error: "DB_ERROR", message: "상태 업데이트 중 오류가 발생했습니다." }, 500);
  }

  // 4. 이메일 발송 (email 컬럼이 있는 경우만)
  const buyerEmail = typeof row.email === "string" ? row.email : null;
  let emailSent = false;
  let emailError: string | null = null;

  if (buyerEmail) {
    try {
      await sendAccessCodeEmail({
        to: buyerEmail,
        buyerName: String(row.depositor_name),
        code,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      });
      emailSent = true;
    } catch (err) {
      // 이메일 실패해도 코드는 발급됨 — 관리자가 직접 전달 가능
      emailError = err instanceof Error ? err.message : "이메일 발송 실패";
      console.error("[admin/payments] email error:", emailError);
    }
  }

  return jsonNoStore({ ok: true, code, emailSent, emailError });
}

/* ────────────────────────────────────────────────
   헬퍼: 충돌 없는 6자리 코드 생성 + access_codes 삽입
   ──────────────────────────────────────────────── */
async function insertUniqueCode(
  config: { url: string; serviceRoleKey: string },
  buyerName: string
): Promise<string> {
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
  const codeUrl = new URL(`${config.url}/rest/v1/analysis_access_codes`);

  for (let attempt = 0; attempt < 10; attempt++) {
    const code = String(randomInt(100000, 1000000)).padStart(6, "0");

    const res = await fetch(codeUrl, {
      method: "POST",
      headers: {
        apikey: config.serviceRoleKey,
        authorization: `Bearer ${config.serviceRoleKey}`,
        "content-type": "application/json",
        prefer: "return=minimal",
      },
      body: JSON.stringify({
        code,
        status: "active",
        buyer_name: buyerName,
        expires_at: expiresAt,
      }),
    });

    if (res.ok || res.status === 201) return code;
    if (res.status === 409) continue; // 코드 중복 → 재시도
    const err = await res.json().catch(() => null);
    throw new Error(`코드 삽입 실패 (${res.status}): ${JSON.stringify(err)}`);
  }
  throw new Error("코드 생성 실패 — 10회 시도 후 충돌");
}
