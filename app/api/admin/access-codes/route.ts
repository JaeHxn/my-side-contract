import { NextResponse } from "next/server";
import { z } from "zod";
import { AccessCodeValidationError, createAnalysisAccessCode } from "@/src/lib/server/access-codes";

const ADMIN_ACCESS_TOKEN_ENV = "ADMIN_ACCESS_TOKEN";

const accessCodeRequestSchema = z.object({
  buyerName: z.string().trim().max(80).optional(),
  phone: z.string().trim().max(30).optional(),
  memo: z.string().trim().max(300).optional(),
  ttlDays: z.coerce.number().int().min(1).max(90).default(30)
});

export async function POST(request: Request) {
  if (!isAuthorizedAdminRequest(request)) {
    return jsonNoStore(
      {
        error: "UNAUTHORIZED",
        message: "관리자 권한이 필요합니다."
      },
      401
    );
  }

  const payload = await request.json().catch(() => null);
  const parsed = accessCodeRequestSchema.safeParse(payload || {});

  if (!parsed.success) {
    return jsonNoStore(
      {
        error: "INVALID_REQUEST",
        message: parsed.error.issues[0]?.message || "코드 발급 요청 형식이 올바르지 않습니다."
      },
      400
    );
  }

  try {
    const accessCode = await createAnalysisAccessCode(parsed.data);
    return jsonNoStore({ accessCode }, 201);
  } catch (error) {
    if (error instanceof AccessCodeValidationError) {
      return jsonNoStore(
        {
          error: "INVALID_ACCESS_CODE_REQUEST",
          message: error.message
        },
        400
      );
    }

    return jsonNoStore(
      {
        error: "ACCESS_CODE_CREATE_FAILED",
        message: "분석 코드 발급에 실패했습니다."
      },
      500
    );
  }
}

function isAuthorizedAdminRequest(request: Request): boolean {
  const token = process.env[ADMIN_ACCESS_TOKEN_ENV]?.trim();

  if (!token) {
    return true;
  }

  const authorization = request.headers.get("authorization") || "";
  const headerToken = request.headers.get("x-admin-token") || "";

  return authorization === `Bearer ${token}` || headerToken === token;
}

function jsonNoStore(body: unknown, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: {
      "Cache-Control": "no-store"
    }
  });
}
