import { NextResponse } from "next/server";
import { getSupabaseServerConfig, SupabaseConfigError } from "@/src/lib/supabase/server";
import { checkRateLimit, getClientIp } from "@/src/lib/server/rate-limit";

const PRICE = 3900;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: Request) {
  const ip = getClientIp(request);
  if (!checkRateLimit(`payment:${ip}`, 5, 3_600_000)) {
    return NextResponse.json({ error: "요청이 너무 많습니다. 잠시 후 다시 시도해 주세요." }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "요청 형식이 올바르지 않습니다." }, { status: 400 });
  }

  const { depositorName, email, method } = body as Record<string, unknown>;

  if (typeof depositorName !== "string" || depositorName.trim().length < 1) {
    return NextResponse.json({ error: "입금자명을 입력해 주세요." }, { status: 400 });
  }
  if (typeof email !== "string" || !EMAIL_RE.test(email.trim())) {
    return NextResponse.json({ error: "올바른 이메일 주소를 입력해 주세요." }, { status: 400 });
  }

  let config;
  try {
    config = getSupabaseServerConfig();
  } catch (e) {
    if (e instanceof SupabaseConfigError) {
      return NextResponse.json({ error: "서버 설정 오류입니다. 잠시 후 다시 시도해 주세요." }, { status: 500 });
    }
    throw e;
  }

  const url = new URL(`${config.url}/rest/v1/payment_requests`);

  const response = await fetch(url, {
    method: "POST",
    headers: {
      apikey: config.serviceRoleKey,
      authorization: `Bearer ${config.serviceRoleKey}`,
      "content-type": "application/json",
      prefer: "return=representation",
    },
    body: JSON.stringify({
      depositor_name: depositorName.trim(),
      email: email.trim().toLowerCase(),
      method: method === "kakaopay" ? "kakaopay" : "bank",
      amount: PRICE,
      status: "pending",
    }),
  });

  const data = await response.json().catch(() => null) as unknown;

  if (!response.ok) {
    console.error("[payment] insert error:", data);
    return NextResponse.json({ error: "신청 저장 중 오류가 발생했습니다. 다시 시도해 주세요." }, { status: 500 });
  }

  const row = (Array.isArray(data) ? data[0] : data) as Record<string, unknown> | undefined;
  return NextResponse.json({ ok: true, requestId: row?.id ?? null }, { status: 201 });
}
