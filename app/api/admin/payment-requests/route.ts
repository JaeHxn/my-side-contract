import { getSupabaseServerConfig, SupabaseConfigError } from "@/src/lib/supabase/server";
import { isAuthorizedAdminRequest, jsonNoStore } from "../access-codes/shared";

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
  url.searchParams.set("select", "id,depositor_name,phone,amount,status,memo,issued_code,created_at");
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

/** 입금 확인 처리: status → confirmed, issued_code 기록 */
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

  const { id, issuedCode, action } = body as Record<string, unknown>;

  if (typeof id !== "string" || !id) {
    return jsonNoStore({ error: "BAD_REQUEST", message: "id가 필요합니다." }, 400);
  }

  const config = getConfig();
  if (!config) {
    return jsonNoStore({ error: "SERVER_ERROR", message: "서버 설정 오류입니다." }, 500);
  }

  const url = new URL(`${config.url}/rest/v1/payment_requests`);
  url.searchParams.set("id", `eq.${id}`);

  if (action === "reject") {
    const response = await fetch(url, {
      method: "PATCH",
      headers: makeHeaders(config.serviceRoleKey),
      body: JSON.stringify({ status: "rejected" }),
    });
    if (!response.ok) {
      const err = await response.json().catch(() => null);
      console.error("[admin/payments] reject error:", err);
      return jsonNoStore({ error: "DB_ERROR", message: "처리 중 오류가 발생했습니다." }, 500);
    }
    return jsonNoStore({ ok: true });
  }

  if (typeof issuedCode !== "string" || !/^\d{6}$/.test(issuedCode)) {
    return jsonNoStore({ error: "BAD_REQUEST", message: "발급할 6자리 코드를 입력해 주세요." }, 400);
  }

  const response = await fetch(url, {
    method: "PATCH",
    headers: makeHeaders(config.serviceRoleKey),
    body: JSON.stringify({ status: "confirmed", issued_code: issuedCode }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => null);
    console.error("[admin/payments] update error:", err);
    return jsonNoStore({ error: "DB_ERROR", message: "처리 중 오류가 발생했습니다." }, 500);
  }

  return jsonNoStore({ ok: true });
}
