import { NextResponse } from "next/server";
import { SupabaseConfigError, SupabaseRequestError } from "@/src/lib/supabase/server";

const ADMIN_ACCESS_TOKEN_ENV = "ADMIN_ACCESS_TOKEN";

export function isAuthorizedAdminRequest(request: Request): boolean {
  const token = process.env[ADMIN_ACCESS_TOKEN_ENV]?.trim();

  if (!token) {
    return true;
  }

  const authorization = request.headers.get("authorization") || "";
  const headerToken = request.headers.get("x-admin-token") || "";

  return authorization === `Bearer ${token}` || headerToken === token;
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

export function jsonNoStore(body: unknown, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: {
      "Cache-Control": "no-store"
    }
  });
}
