import { NextResponse } from "next/server";
import { ResultValidationError, getContractAnalysisResult } from "@/src/lib/server/results";

interface ResultRouteContext {
  params: Promise<{
    id: string;
  }>;
}

export async function GET(_request: Request, context: ResultRouteContext) {
  const { id } = await context.params;

  try {
    const result = await getContractAnalysisResult(id);

    if (!result) {
      return NextResponse.json(
        {
          error: "RESULT_NOT_FOUND",
          message: "분석 결과를 찾을 수 없습니다."
        },
        { status: 404 }
      );
    }

    return NextResponse.json({ result });
  } catch (error) {
    if (error instanceof ResultValidationError) {
      return NextResponse.json(
        {
          error: "INVALID_RESULT_ID",
          message: error.message
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        error: "RESULT_LOAD_FAILED",
        message: "분석 결과 조회에 실패했습니다."
      },
      { status: 500 }
    );
  }
}
