import { afterEach, describe, expect, it, vi } from "vitest";
import { ADMIN_SESSION_COOKIE } from "@/src/lib/server/admin-auth";
import { POST } from "./route";

describe("POST /api/admin/auth/login", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("creates an admin session cookie for valid credentials", async () => {
    vi.stubEnv("ADMIN_USERNAME", "owner");
    vi.stubEnv("ADMIN_ACCESS_TOKEN", "secret-admin-token");

    const response = await POST(
      new Request("http://localhost/api/admin/auth/login", {
        method: "POST",
        body: JSON.stringify({
          username: "owner",
          password: "secret-admin-token"
        })
      })
    );

    await expect(response.json()).resolves.toEqual({ ok: true });
    expect(response.status).toBe(200);
    expect(response.headers.get("Set-Cookie")).toContain(`${ADMIN_SESSION_COOKIE}=`);
    expect(response.headers.get("Set-Cookie")).toContain("HttpOnly");
    expect(response.headers.get("Cache-Control")).toBe("no-store");
  });

  it("rejects invalid credentials", async () => {
    vi.stubEnv("ADMIN_ACCESS_TOKEN", "secret-admin-token");

    const response = await POST(
      new Request("http://localhost/api/admin/auth/login", {
        method: "POST",
        body: JSON.stringify({
          username: "admin",
          password: "wrong"
        })
      })
    );

    await expect(response.json()).resolves.toMatchObject({ error: "INVALID_ADMIN_CREDENTIALS" });
    expect(response.status).toBe(401);
    expect(response.headers.get("Set-Cookie")).toBeNull();
  });

  it("does not allow login when admin auth is not configured", async () => {
    const response = await POST(
      new Request("http://localhost/api/admin/auth/login", {
        method: "POST",
        body: JSON.stringify({
          username: "admin",
          password: "anything"
        })
      })
    );

    await expect(response.json()).resolves.toMatchObject({ error: "ADMIN_AUTH_NOT_CONFIGURED" });
    expect(response.status).toBe(503);
  });
});
