import { NextResponse } from "next/server";
import {
  getAdminAccessToken,
  verifyAdminSessionCookieHeader
} from "@/src/lib/server/admin-auth";
import { SupabaseConfigError, SupabaseRequestError } from "@/src/lib/supabase/server";

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

export function isDevelopmentSupabaseSetupError(error: unknown): boolean {
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

export function jsonNoStore(body: unknown, status = 200, headers: Record<string, string> = {}) {
  return NextResponse.json(body, {
    status,
    headers: {
      "Cache-Control": "no-store",
      ...headers
    }
  });
}
