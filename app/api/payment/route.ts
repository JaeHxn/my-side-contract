import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const PRICE = 3900;

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "요청 형식이 올바르지 않습니다." }, { status: 400 });
  }

  const { depositorName, phone } = body as Record<string, unknown>;

  if (typeof depositorName !== "string" || depositorName.trim().length < 1) {
    return NextResponse.json({ error: "입금자명을 입력해 주세요." }, { status: 400 });
  }
  if (typeof phone !== "string" || !/^[0-9]{10,11}$/.test(phone.replace(/-/g, ""))) {
    return NextResponse.json({ error: "올바른 휴대폰번호를 입력해 주세요. (숫자만, 10~11자리)" }, { status: 400 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    return NextResponse.json({ error: "서버 설정 오류입니다. 잠시 후 다시 시도해 주세요." }, { status: 500 });
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey);

  const cleanPhone = phone.replace(/-/g, "");

  const { data, error } = await supabase
    .from("payment_requests")
    .insert({
      depositor_name: depositorName.trim(),
      phone: cleanPhone,
      amount: PRICE,
      status: "pending",
    })
    .select("id, created_at")
    .single();

  if (error) {
    console.error("[payment] insert error:", error);
    return NextResponse.json({ error: "신청 저장 중 오류가 발생했습니다. 다시 시도해 주세요." }, { status: 500 });
  }

  return NextResponse.json({ ok: true, requestId: data.id }, { status: 201 });
}
