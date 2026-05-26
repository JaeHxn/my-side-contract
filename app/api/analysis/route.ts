import { NextResponse } from "next/server";
import { z } from "zod";
import { analyzeContract } from "@/src/lib/analysis/service";
import { enabledCategories } from "@/src/lib/contracts/categories";
import { getAccessCodeAllowlist, verifyAccessCode } from "@/src/lib/payments/access-code";
import { markAnalysisAccessCodeUsed, verifyAnalysisAccessCode } from "@/src/lib/server/access-codes";
import { isDevelopmentSupabaseSetupError } from "@/src/lib/server/dev-fallback";
import { checkRateLimit, getClientIp } from "@/src/lib/server/rate-limit";
import { ResultValidationError, saveContractAnalysisResult } from "@/src/lib/server/results";

const analysisRequestSchema = z.object({
  contractText: z.string().trim().min(30, "계약서 내용은 최소 30자 이상 입력해주세요.").max(50000),
  category: z.enum(enabledCategories).default("housing-lease"),
  accessCode: z.string().trim().min(1, "6자리 분석 코드를 입력해주세요.")
});

export async function POST(request: Request) {
  const ip = getClientIp(request);
  if (!checkRateLimit(`analysis:${ip}`, 10, 3_600_000)) {
    return jsonNoStore({ error: "RATE_LIMITED", message: "잠시 후 다시 시도해주세요. (시간당 10회 제한)" }, 429);
  }

  const payload = await request.json().catch(() => null);
  const parsed = analysisRequestSchema.safeParse(payload);

  if (!parsed.success) {
    return jsonNoStore(
      {
        error: "INVALID_REQUEST",
        message: parsed.error.issues[0]?.message || "요청 형식이 올바르지 않습니다."
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

  const analysis = await analyzeContract({
    contractText: parsed.data.contractText,
    category: parsed.data.category
  });

  try {
    const result = await saveContractAnalysisResult(analysis);
    await markAnalysisCodeUsed(parsed.data.accessCode, result.id);

    return jsonNoStore({
      analysis,
      result,
      resultUrl: `/result/${result.id}`
    });
  } catch (error) {
    const code = error instanceof ResultValidationError ? "INVALID_ANALYSIS_RESULT" : "RESULT_SAVE_FAILED";

    return jsonNoStore({
      analysis,
      result: null,
      resultUrl: null,
      warning: {
        code,
        message: "분석은 완료됐지만 결과 저장에 실패했습니다. 화면을 닫기 전에 결과를 확인해주세요."
      }
    });
  }
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

async function markAnalysisCodeUsed(accessCode: string, resultId: string) {
  try {
    await markAnalysisAccessCodeUsed(accessCode, resultId);
  } catch {
    // The analysis result has already been saved. Keep the user flow intact and let admin reconcile the code later.
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
