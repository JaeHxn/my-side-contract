import { NextResponse } from "next/server";
import { ResultValidationError, saveContractAnalysisResult } from "@/src/lib/server/results";

export async function POST(request: Request) {
  const payload = await request.json().catch(() => null);

  if (!payload || typeof payload !== "object" || !("analysis" in payload)) {
    return NextResponse.json(
      {
        error: "INVALID_REQUEST",
        message: "분석 결과 요청 형식이 올바르지 않습니다."
      },
      { status: 400 }
    );
  }

  try {
    const result = await saveContractAnalysisResult((payload as { analysis: unknown }).analysis);
    return NextResponse.json({ result }, { status: 201 });
  } catch (error) {
    if (error instanceof ResultValidationError) {
      return NextResponse.json(
        {
          error: "INVALID_RESULT",
          message: error.message
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        error: "RESULT_SAVE_FAILED",
        message: "분석 결과 저장에 실패했습니다."
      },
      { status: 500 }
    );
  }
}
