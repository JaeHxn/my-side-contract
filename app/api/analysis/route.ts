import { NextResponse } from "next/server";
import { z } from "zod";
import { analyzeContract } from "@/src/lib/analysis/service";
import { enabledCategories } from "@/src/lib/contracts/categories";
import { getAccessCodeAllowlist, verifyAccessCode } from "@/src/lib/payments/access-code";
import { ResultValidationError, saveContractAnalysisResult } from "@/src/lib/server/results";

const analysisRequestSchema = z.object({
  contractText: z.string().trim().min(30, "계약서 내용은 최소 30자 이상 입력해주세요.").max(50000),
  category: z.enum(enabledCategories).default("housing-lease"),
  accessCode: z.string().trim().min(1, "6자리 분석 코드를 입력해주세요.")
});

export async function POST(request: Request) {
  const payload = await request.json().catch(() => null);
  const parsed = analysisRequestSchema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "INVALID_REQUEST",
        message: parsed.error.issues[0]?.message || "요청 형식이 올바르지 않습니다."
      },
      { status: 400 }
    );
  }

  const codeResult = verifyAccessCode(parsed.data.accessCode, getAccessCodeAllowlist());
  if (!codeResult.ok) {
    return NextResponse.json(
      {
        error: "INVALID_ACCESS_CODE",
        message: codeResult.reason
      },
      { status: 401 }
    );
  }

  const analysis = await analyzeContract({
    contractText: parsed.data.contractText,
    category: parsed.data.category
  });

  try {
    const result = await saveContractAnalysisResult(analysis);

    return NextResponse.json({
      analysis,
      result,
      resultUrl: `/result/${result.id}`
    });
  } catch (error) {
    const code = error instanceof ResultValidationError ? "INVALID_ANALYSIS_RESULT" : "RESULT_SAVE_FAILED";

    return NextResponse.json({
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
