import { buildAdminSessionClearCookie } from "@/src/lib/server/admin-auth";
import { jsonNoStore } from "@/app/api/admin/access-codes/shared";

export async function POST() {
  return jsonNoStore({ ok: true }, 200, {
    "Set-Cookie": buildAdminSessionClearCookie()
  });
}
