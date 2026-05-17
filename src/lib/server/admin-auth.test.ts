import { describe, expect, it } from "vitest";
import {
  ADMIN_SESSION_COOKIE,
  buildAdminSessionClearCookie,
  buildAdminSessionSetCookie,
  createAdminSessionToken,
  isAdminAuthConfigured,
  readCookie,
  verifyAdminCredentials,
  verifyAdminSessionCookieHeader,
  verifyAdminSessionToken
} from "./admin-auth";

const env = {
  ADMIN_USERNAME: "owner",
  ADMIN_ACCESS_TOKEN: "secret-admin-token"
};

describe("admin-auth", () => {
  it("requires an admin token to enable admin auth", () => {
    expect(isAdminAuthConfigured({})).toBe(false);
    expect(isAdminAuthConfigured(env)).toBe(true);
  });

  it("verifies configured admin credentials", () => {
    expect(verifyAdminCredentials({ username: "owner", password: "secret-admin-token" }, env)).toBe(true);
    expect(verifyAdminCredentials({ username: "admin", password: "secret-admin-token" }, env)).toBe(false);
    expect(verifyAdminCredentials({ username: "owner", password: "wrong" }, env)).toBe(false);
  });

  it("creates and verifies HttpOnly admin session cookies", () => {
    const sessionToken = createAdminSessionToken(env);
    const setCookie = buildAdminSessionSetCookie(env);

    expect(sessionToken).toBeTruthy();
    expect(verifyAdminSessionToken(sessionToken, env)).toBe(true);
    expect(verifyAdminSessionToken(sessionToken, { ...env, ADMIN_ACCESS_TOKEN: "other-token" })).toBe(false);
    expect(setCookie).toContain(`${ADMIN_SESSION_COOKIE}=`);
    expect(setCookie).toContain("HttpOnly");
    expect(setCookie).toContain("SameSite=Strict");
    expect(verifyAdminSessionCookieHeader(setCookie, env)).toBe(true);
  });

  it("builds a clearing cookie header", () => {
    const clearCookie = buildAdminSessionClearCookie();

    expect(clearCookie).toContain(`${ADMIN_SESSION_COOKIE}=`);
    expect(clearCookie).toContain("Max-Age=0");
  });

  it("reads cookie values from request headers", () => {
    expect(readCookie("a=1; msc_admin_session=abc; theme=dark", ADMIN_SESSION_COOKIE)).toBe("abc");
    expect(readCookie("a=1", ADMIN_SESSION_COOKIE)).toBeNull();
  });
});
