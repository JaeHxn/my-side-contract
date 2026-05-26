import { z } from "zod";
import {
  buildAdminSessionSetCookie,
  isAdminAuthConfigured,
  verifyAdminCredentials
} from "@/src/lib/server/admin-auth";
import { checkRateLimit, getClientIp } from "@/src/lib/server/rate-limit";
import { jsonNoStore } from "@/app/api/admin/access-codes/shared";

const loginRequestSchema = z.object({
  username: z.string().trim().min(1).max(80),
  password: z.string().min(1).max(300)
});

export async function POST(request: Request) {
  const ip = getClientIp(request);
  if (!checkRateLimit(`admin-login:${ip}`, 5, 15 * 60_000)) {
    return jsonNoStore(
      {
        error: "RATE_LIMITED",
        message: "로그인 시도가 너무 많습니다. 15분 후 다시 시도해주세요."
      },
      429
    );
  }

  if (!isAdminAuthConfigured()) {
    return jsonNoStore(
      {
        error: "ADMIN_AUTH_NOT_CONFIGURED",
        message: "관리자 접근을 막으려면 .env.local에 ADMIN_ACCESS_TOKEN을 설정해야 합니다."
      },
      503
    );
  }

  const payload = await request.json().catch(() => null);
  const parsed = loginRequestSchema.safeParse(payload || {});

  if (!parsed.success) {
    return jsonNoStore(
      {
        error: "INVALID_REQUEST",
        message: "관리자 아이디와 비밀번호를 입력해 주세요."
      },
      400
    );
  }

  if (!verifyAdminCredentials(parsed.data)) {
    return jsonNoStore(
      {
        error: "INVALID_ADMIN_CREDENTIALS",
        message: "관리자 아이디 또는 비밀번호가 올바르지 않습니다."
      },
      401
    );
  }

  const cookie = buildAdminSessionSetCookie();

  if (!cookie) {
    return jsonNoStore(
      {
        error: "ADMIN_AUTH_NOT_CONFIGURED",
        message: "관리자 세션을 만들 수 없습니다."
      },
      503
    );
  }

  return jsonNoStore({ ok: true }, 200, {
    "Set-Cookie": cookie
  });
}
