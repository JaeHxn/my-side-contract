import { NextResponse } from "next/server";
import { z } from "zod";
import { AccessCodeValidationError, createAnalysisAccessCode } from "@/src/lib/server/access-codes";
import { SupabaseConfigError, SupabaseRequestError } from "@/src/lib/supabase/server";

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

    if (isDevelopmentSupabaseSetupError(error)) {
      const now = new Date();
      const expiresAt = new Date(now.getTime() + parsed.data.ttlDays * 24 * 60 * 60 * 1000);

      return jsonNoStore(
        {
          accessCode: {
            code: "123456",
            status: "active",
            buyerName: parsed.data.buyerName || null,
            phone: parsed.data.phone || null,
            memo: parsed.data.memo || "로컬 테스트용 코드입니다. Supabase migration 적용 후 실제 코드가 발급됩니다.",
            issuedAt: now.toISOString(),
            expiresAt: expiresAt.toISOString(),
            usedAt: null,
            resultId: null
          },
          warning: {
            code: "LOCAL_DEMO_CODE",
            message: "Supabase 설정 또는 migration이 준비되지 않아 로컬 테스트 코드 123456을 표시합니다."
          }
        },
        201
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

function isDevelopmentSupabaseSetupError(error: unknown): boolean {
  if (process.env.NODE_ENV === "production") {
    return false;
  }

  if (error instanceof SupabaseConfigError) {
    return true;
  }

  if (error instanceof SupabaseRequestError) {
    return error.status === 401 || error.status === 404;
  }

  return false;
}

function jsonNoStore(body: unknown, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: {
      "Cache-Control": "no-store"
    }
  });
}
