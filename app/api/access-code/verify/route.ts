import { NextResponse } from "next/server";
import { z } from "zod";
import { getAccessCodeAllowlist, verifyAccessCode } from "@/src/lib/payments/access-code";
import { verifyAnalysisAccessCode } from "@/src/lib/server/access-codes";
import { isDevelopmentSupabaseSetupError } from "@/src/lib/server/dev-fallback";
import { checkRateLimit, getClientIp } from "@/src/lib/server/rate-limit";

const verifyAccessCodeRequestSchema = z.object({
  accessCode: z.string().trim().regex(/^\d{6}$/, "6자리 숫자 분석 코드를 입력해주세요.")
});

export async function POST(request: Request) {
  const ip = getClientIp(request);
  if (!checkRateLimit(`access-code-verify:${ip}`, 30, 3_600_000)) {
    return jsonNoStore({ error: "RATE_LIMITED", message: "잠시 후 다시 시도해주세요. (시간당 30회 제한)" }, 429);
  }

  const payload = await request.json().catch(() => null);
  const parsed = verifyAccessCodeRequestSchema.safeParse(payload);

  if (!parsed.success) {
    return jsonNoStore(
      {
        error: "INVALID_REQUEST",
        message: parsed.error.issues[0]?.message || "6자리 숫자 분석 코드를 입력해주세요."
      },
      400
    );
  }

  let codeResult;
  try {
    codeResult = await verifySubmittedAccessCode(parsed.data.accessCode);
  } catch {
    return jsonNoStore(
      {
        error: "ACCESS_CODE_CHECK_FAILED",
        message: "분석 코드 확인에 실패했습니다. 잠시 후 다시 시도해주세요."
      },
      503
    );
  }

  if (!codeResult.ok) {
    return jsonNoStore(
      {
        error: "INVALID_ACCESS_CODE",
        message: codeResult.reason
      },
      401
    );
  }

  return jsonNoStore({ ok: true });
}

async function verifySubmittedAccessCode(accessCode: string) {
  try {
    return await verifyAnalysisAccessCode(accessCode);
  } catch (error) {
    if (isDevelopmentSupabaseSetupError(error)) {
      return verifyAccessCode(accessCode, getAccessCodeAllowlist());
    }

    throw error;
  }
}

function jsonNoStore(body: unknown, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: {
      "Cache-Control": "no-store"
    }
  });
}
