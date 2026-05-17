import { SupabaseConfigError, SupabaseRequestError } from "@/src/lib/supabase/server";

export function isDevelopmentSupabaseSetupError(error: unknown): boolean {
  if (process.env.NODE_ENV === "production") {
    return false;
  }

  if (error instanceof SupabaseConfigError) {
    return true;
  }

  if (error instanceof SupabaseRequestError) {
    return error.status === 400 || error.status === 401 || error.status === 404;
  }

  return false;
}
