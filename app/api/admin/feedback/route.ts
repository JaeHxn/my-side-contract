import { createSupabaseServerClient } from "@/src/lib/supabase/server";
import { isAuthorizedAdminRequest, jsonNoStore } from "../access-codes/shared";

interface FeedbackRow {
  id: string;
  message: string;
  created_at: string;
}

export async function GET(request: Request) {
  if (!isAuthorizedAdminRequest(request)) {
    return jsonNoStore({ error: "UNAUTHORIZED" }, 401);
  }

  try {
    const db = createSupabaseServerClient();
    const rows = await db.selectMany<FeedbackRow>("feedback", {}, { order: "created_at.desc", limit: 100 });
    return jsonNoStore({ feedback: rows });
  } catch {
    return jsonNoStore({ feedback: [] });
  }
}
