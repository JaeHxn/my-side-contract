import { NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseServerClient } from "@/src/lib/supabase/server";
import { checkRateLimit, getClientIp } from "@/src/lib/server/rate-limit";
import { isDevelopmentSupabaseSetupError } from "@/src/lib/server/dev-fallback";

const feedbackSchema = z.object({
  message: z.string().trim().min(5, "5자 이상 입력해주세요.").max(1000, "1000자 이내로 입력해주세요."),
});

export async function POST(request: Request) {
  const ip = getClientIp(request);
  if (!checkRateLimit(`feedback:${ip}`, 3, 60_000 * 10)) {
    return json({ error: "RATE_LIMITED", message: "잠시 후 다시 시도해주세요. (10분에 3회 제한)" }, 429);
  }

  const body = await request.json().catch(() => null);
  const parsed = feedbackSchema.safeParse(body);
  if (!parsed.success) {
    return json({ error: "INVALID_REQUEST", message: parsed.error.issues[0]?.message ?? "입력 내용을 확인해주세요." }, 400);
  }

  try {
    const db = createSupabaseServerClient();
    await db.insertOne("feedback", { message: parsed.data.message });
    return json({ ok: true });
  } catch (error) {
    if (isDevelopmentSupabaseSetupError(error)) {
      return json({ ok: true });
    }
    return json({ error: "SAVE_FAILED", message: "전송에 실패했습니다. 잠시 후 다시 시도해주세요." }, 500);
  }
}

function json(body: unknown, status = 200) {
  return NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } });
}
