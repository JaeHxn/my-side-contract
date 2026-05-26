import { NextResponse } from "next/server";
import { OcrProviderError, OcrValidationError, extractContractTextFromFile } from "@/src/lib/ocr/openai-ocr";
import { getAccessCodeAllowlist, verifyAccessCode } from "@/src/lib/payments/access-code";
import { isDevelopmentSupabaseSetupError } from "@/src/lib/server/dev-fallback";
import { verifyAnalysisAccessCode } from "@/src/lib/server/access-codes";
import { checkRateLimit, getClientIp } from "@/src/lib/server/rate-limit";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const ip = getClientIp(request);
  if (!checkRateLimit(`ocr:${ip}`, 3, 60_000)) {
    return jsonNoStore({ error: "RATE_LIMITED", message: "잠시 후 다시 시도해주세요. (분당 3회 제한)" }, 429);
  }

  const formData = await request.formData().catch(() => null);
  const file = formData?.get("file");
  const accessCode = formData?.get("accessCode");

  // 유효한 6자리 코드가 없으면 OCR 실행 전에 차단
  if (typeof accessCode !== "string" || !/^\d{6}$/.test(accessCode.trim())) {
    return jsonNoStore(
      { error: "INVALID_ACCESS_CODE", message: "분석 코드를 먼저 입력해주세요. 6자리 코드가 확인되어야 파일을 처리할 수 있습니다." },
      401
    );
  }

  let codeCheck;
  try {
    codeCheck = await verifyOcrAccessCode(accessCode.trim());
  } catch {
    return jsonNoStore(
      { error: "ACCESS_CODE_CHECK_FAILED", message: "코드 확인 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요." },
      503
    );
  }

  if (!codeCheck.ok) {
    return jsonNoStore(
      { error: "INVALID_ACCESS_CODE", message: codeCheck.reason ?? "유효하지 않은 분석 코드입니다." },
      401
    );
  }

  if (!isFileLike(file)) {
    return jsonNoStore(
      {
        error: "INVALID_REQUEST",
        message: "OCR 처리할 PDF 또는 사진 파일을 첨부해주세요."
      },
      400
    );
  }

  try {
    const result = await extractContractTextFromFile({
      bytes: Buffer.from(await file.arrayBuffer()),
      fileName: file.name,
      mimeType: file.type || ""
    });

    return jsonNoStore(result);
  } catch (error) {
    if (error instanceof OcrValidationError) {
      return jsonNoStore(
        {
          error: "INVALID_OCR_FILE",
          message: error.message
        },
        400
      );
    }

    if (error instanceof OcrProviderError) {
      const status = mapOcrProviderStatus(error.status);

      return jsonNoStore(
        {
          error: status.error,
          message: status.message
        },
        status.httpStatus
      );
    }

    return jsonNoStore(
      {
        error: "OCR_FAILED",
        message: "OCR 처리 중 오류가 발생했습니다."
      },
      500
    );
  }
}

interface FileLike {
  name: string;
  type?: string;
  arrayBuffer: () => Promise<ArrayBuffer>;
}

function isFileLike(value: unknown): value is FileLike {
  return (
    !!value &&
    typeof value === "object" &&
    "arrayBuffer" in value &&
    typeof value.arrayBuffer === "function" &&
    "name" in value &&
    typeof value.name === "string"
  );
}

function mapOcrProviderStatus(status: number | undefined) {
  if (status === 401 || status === 503) {
    return {
      error: "OCR_NOT_CONFIGURED",
      message: "OpenAI OCR 설정을 확인해주세요.",
      httpStatus: 503
    };
  }

  if (status === 422) {
    return {
      error: "OCR_TEXT_TOO_SHORT",
      message: "파일에서 충분한 계약서 텍스트를 읽지 못했습니다. 더 선명한 파일을 올리거나 직접 붙여넣어 주세요.",
      httpStatus: 422
    };
  }

  if (status === 429) {
    return {
      error: "OCR_RATE_LIMITED",
      message: "OCR 요청이 많아 잠시 처리하지 못했습니다. 잠시 후 다시 시도해주세요.",
      httpStatus: 429
    };
  }

  return {
    error: "OCR_FAILED",
    message: "파일에서 텍스트를 읽지 못했습니다. 더 선명한 사진이나 PDF로 다시 시도해주세요.",
    httpStatus: 502
  };
}

async function verifyOcrAccessCode(accessCode: string) {
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
