import { describe, expect, it } from "vitest";
import { ADMIN_SESSION_COOKIE } from "@/src/lib/server/admin-auth";
import { POST } from "./route";

describe("POST /api/admin/auth/logout", () => {
  it("clears the admin session cookie", async () => {
    const response = await POST();

    await expect(response.json()).resolves.toEqual({ ok: true });
    expect(response.status).toBe(200);
    expect(response.headers.get("Set-Cookie")).toContain(`${ADMIN_SESSION_COOKIE}=`);
    expect(response.headers.get("Set-Cookie")).toContain("Max-Age=0");
    expect(response.headers.get("Cache-Control")).toBe("no-store");
  });
});
