import { createHmac, timingSafeEqual } from "node:crypto";

const ADMIN_ACCESS_TOKEN_ENV = "ADMIN_ACCESS_TOKEN";
const ADMIN_USERNAME_ENV = "ADMIN_USERNAME";
const SESSION_VERSION = "v1";

export const ADMIN_SESSION_COOKIE = "msc_admin_session";
export const ADMIN_SESSION_MAX_AGE_SECONDS = 8 * 60 * 60;

type EnvLike = Partial<Record<string, string | undefined>>;

export interface AdminCredentials {
  username: string;
  password: string;
}

export function getAdminUsername(env: EnvLike = process.env): string {
  return env[ADMIN_USERNAME_ENV]?.trim() || "admin";
}

export function getAdminAccessToken(env: EnvLike = process.env): string | null {
  const token = env[ADMIN_ACCESS_TOKEN_ENV]?.trim();
  return token || null;
}

export function isAdminAuthConfigured(env: EnvLike = process.env): boolean {
  return Boolean(getAdminAccessToken(env));
}

export function verifyAdminCredentials(credentials: AdminCredentials, env: EnvLike = process.env): boolean {
  const token = getAdminAccessToken(env);

  if (!token) {
    return false;
  }

  return safeEqual(credentials.username.trim(), getAdminUsername(env)) && safeEqual(credentials.password, token);
}

export function createAdminSessionToken(env: EnvLike = process.env): string | null {
  const token = getAdminAccessToken(env);

  if (!token) {
    return null;
  }

  return `${SESSION_VERSION}.${signAdminSession(token, getAdminUsername(env))}`;
}

export function verifyAdminSessionToken(value: string | undefined | null, env: EnvLike = process.env): boolean {
  const token = getAdminAccessToken(env);

  if (!token || !value?.startsWith(`${SESSION_VERSION}.`)) {
    return false;
  }

  const expected = createAdminSessionToken(env);
  return expected ? safeEqual(value, expected) : false;
}

export function verifyAdminSessionCookieHeader(cookieHeader: string | null, env: EnvLike = process.env): boolean {
  return verifyAdminSessionToken(readCookie(cookieHeader, ADMIN_SESSION_COOKIE), env);
}

export function buildAdminSessionSetCookie(env: EnvLike = process.env): string | null {
  const sessionToken = createAdminSessionToken(env);

  if (!sessionToken) {
    return null;
  }

  return [
    `${ADMIN_SESSION_COOKIE}=${sessionToken}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Strict",
    `Max-Age=${ADMIN_SESSION_MAX_AGE_SECONDS}`,
    ...(process.env.NODE_ENV === "production" ? ["Secure"] : [])
  ].join("; ");
}

export function buildAdminSessionClearCookie(): string {
  return [
    `${ADMIN_SESSION_COOKIE}=`,
    "Path=/",
    "HttpOnly",
    "SameSite=Strict",
    "Max-Age=0",
    ...(process.env.NODE_ENV === "production" ? ["Secure"] : [])
  ].join("; ");
}

export function readCookie(cookieHeader: string | null, name: string): string | null {
  if (!cookieHeader) {
    return null;
  }

  for (const segment of cookieHeader.split(";")) {
    const [rawName, ...rawValueParts] = segment.trim().split("=");

    if (rawName === name) {
      return rawValueParts.join("=") || null;
    }
  }

  return null;
}

function signAdminSession(token: string, username: string): string {
  return createHmac("sha256", token).update(`admin-session:${username}`).digest("base64url");
}

function safeEqual(left: string, right: string): boolean {
  // Pad both sides to a fixed length so that a length mismatch does not
  // create a timing side-channel.  The comparison itself is always
  // constant-time via timingSafeEqual.
  const maxLen = Math.max(Buffer.byteLength(left), Buffer.byteLength(right));
  const leftBuffer = Buffer.alloc(maxLen);
  const rightBuffer = Buffer.alloc(maxLen);
  leftBuffer.write(left);
  rightBuffer.write(right);

  return timingSafeEqual(leftBuffer, rightBuffer) && left.length === right.length;
}
