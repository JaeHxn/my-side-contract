import { NextResponse } from "next/server";
import {
  getAdminAccessToken,
  verifyAdminSessionCookieHeader
} from "@/src/lib/server/admin-auth";
import { isDevelopmentSupabaseSetupError } from "@/src/lib/server/dev-fallback";

export { isDevelopmentSupabaseSetupError };

export function isAuthorizedAdminRequest(request: Request): boolean {
  const token = getAdminAccessToken();

  if (!token) {
    return false;
  }

  const authorization = request.headers.get("authorization") || "";
  const headerToken = request.headers.get("x-admin-token") || "";

  return (
    authorization === `Bearer ${token}` ||
    headerToken === token ||
    verifyAdminSessionCookieHeader(request.headers.get("cookie"))
  );
}

export function jsonNoStore(body: unknown, status = 200, headers: Record<string, string> = {}) {
  return NextResponse.json(body, {
    status,
    headers: {
      "Cache-Control": "no-store",
      ...headers
    }
  });
}
