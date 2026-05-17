import { z } from "zod";
import { AccessCodeValidationError, revokeAnalysisAccessCode } from "@/src/lib/server/access-codes";
import {
  isAuthorizedAdminRequest,
  isDevelopmentSupabaseSetupError,
  jsonNoStore
} from "@/app/api/admin/access-codes/shared";

const revokeAccessCodeRequestSchema = z.object({
  code: z.string().trim().regex(/^\d{6}$/)
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
  const parsed = revokeAccessCodeRequestSchema.safeParse(payload || {});

  if (!parsed.success) {
    return jsonNoStore(
      {
        error: "INVALID_REQUEST",
        message: "취소할 6자리 분석 코드를 입력해주세요."
      },
      400
    );
  }

  try {
    const accessCode = await revokeAnalysisAccessCode(parsed.data.code);
    return jsonNoStore({ accessCode });
  } catch (error) {
    if (error instanceof AccessCodeValidationError) {
      return jsonNoStore(
        {
          error: "INVALID_ACCESS_CODE_REVOKE_REQUEST",
          message: error.message
        },
        400
      );
    }

    if (isDevelopmentSupabaseSetupError(error)) {
      const now = new Date();

      return jsonNoStore({
        accessCode: {
          code: parsed.data.code,
          maskedCode: `${parsed.data.code.slice(0, 2)}••••`,
          status: "revoked",
          buyerName: "로컬 테스트",
          phone: null,
          memo: "Supabase 설정 또는 migration 전 로컬 테스트용 취소 응답입니다.",
          issuedAt: now.toISOString(),
          expiresAt: now.toISOString(),
          usedAt: null,
          resultId: null
        },
        warning: {
          code: "LOCAL_DEMO_CODE",
          message: "Supabase 설정 또는 migration이 준비되지 않아 로컬 테스트용 취소 응답을 표시합니다."
        }
      });
    }

    return jsonNoStore(
      {
        error: "ACCESS_CODE_REVOKE_FAILED",
        message: "분석 코드 취소에 실패했습니다."
      },
      500
    );
  }
}
