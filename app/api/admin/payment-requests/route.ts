import { createClient } from "@supabase/supabase-js";
import { isAuthorizedAdminRequest, jsonNoStore } from "../access-codes/shared";

function getSupabaseServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

export async function GET(request: Request) {
  if (!isAuthorizedAdminRequest(request)) {
    return jsonNoStore({ error: "UNAUTHORIZED", message: "관리자 권한이 필요합니다." }, 401);
  }

  const supabase = getSupabaseServiceClient();
  if (!supabase) {
    return jsonNoStore({ error: "SERVER_ERROR", message: "서버 설정 오류입니다." }, 500);
  }

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status") ?? "pending";

  const query = supabase
    .from("payment_requests")
    .select("id, depositor_name, phone, amount, status, memo, issued_code, created_at")
    .order("created_at", { ascending: false })
    .limit(100);

  if (status !== "all") {
    query.eq("status", status);
  }

  const { data, error } = await query;
  if (error) {
    console.error("[admin/payments] select error:", error);
    return jsonNoStore({ error: "DB_ERROR", message: "목록 조회 중 오류가 발생했습니다." }, 500);
  }

  return jsonNoStore({ paymentRequests: data ?? [] });
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

  if (action === "reject") {
    const supabase = getSupabaseServiceClient();
    if (!supabase) return jsonNoStore({ error: "SERVER_ERROR", message: "서버 설정 오류입니다." }, 500);
    const { error } = await supabase
      .from("payment_requests")
      .update({ status: "rejected" })
      .eq("id", id);
    if (error) return jsonNoStore({ error: "DB_ERROR", message: "처리 중 오류가 발생했습니다." }, 500);
    return jsonNoStore({ ok: true });
  }

  if (typeof issuedCode !== "string" || !/^\d{6}$/.test(issuedCode)) {
    return jsonNoStore({ error: "BAD_REQUEST", message: "발급할 6자리 코드를 입력해 주세요." }, 400);
  }

  const supabase = getSupabaseServiceClient();
  if (!supabase) return jsonNoStore({ error: "SERVER_ERROR", message: "서버 설정 오류입니다." }, 500);

  const { error } = await supabase
    .from("payment_requests")
    .update({ status: "confirmed", issued_code: issuedCode })
    .eq("id", id);

  if (error) {
    console.error("[admin/payments] update error:", error);
    return jsonNoStore({ error: "DB_ERROR", message: "처리 중 오류가 발생했습니다." }, 500);
  }

  return jsonNoStore({ ok: true });
}
