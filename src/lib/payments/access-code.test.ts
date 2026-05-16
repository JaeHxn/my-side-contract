import { describe, expect, it } from "vitest";
import { verifyAccessCode } from "./access-code";

describe("verifyAccessCode", () => {
  it("accepts six digit codes from a comma separated allowlist", () => {
    expect(verifyAccessCode("123456", "000000,123456,999999").ok).toBe(true);
  });

  it("rejects malformed or unknown codes", () => {
    expect(verifyAccessCode("abc123", "123456").ok).toBe(false);
    expect(verifyAccessCode("111111", "123456").ok).toBe(false);
  });

  it("requires a configured allowlist in production mode", () => {
    expect(verifyAccessCode("123456", "").ok).toBe(false);
  });
});
