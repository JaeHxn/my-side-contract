import { afterEach, describe, expect, it, vi } from "vitest";
import { getAccessCodeAllowlist, verifyAccessCode } from "./access-code";

describe("verifyAccessCode", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("accepts six digit codes from a comma separated allowlist", () => {
    expect(verifyAccessCode("123456", "000000,123456,999999").ok).toBe(true);
  });

  it("trims submitted codes and allowlist entries before matching", () => {
    expect(verifyAccessCode(" 123456\n", "000000, 123456 ,999999").ok).toBe(true);
  });

  it("ignores malformed allowlist entries instead of accepting them", () => {
    expect(verifyAccessCode("123456", "abc123, 12345, 1234567").ok).toBe(false);
    expect(verifyAccessCode("123456", "abc123, 12345, 1234567, 123456").ok).toBe(true);
  });

  it("rejects malformed or unknown codes", () => {
    expect(verifyAccessCode("abc123", "123456").ok).toBe(false);
    expect(verifyAccessCode("111111", "123456").ok).toBe(false);
  });

  it("requires a configured allowlist in production mode", () => {
    expect(verifyAccessCode("123456", "").ok).toBe(false);
  });

  it("does not expose the development fallback code in production", () => {
    vi.stubEnv("ANALYSIS_ACCESS_CODES", "");
    vi.stubEnv("NODE_ENV", "production");

    expect(getAccessCodeAllowlist()).toBe("");
  });
});
