import { beforeEach, describe, expect, it, vi } from "vitest";
import { verifyAnalysisAccessCode } from "@/src/lib/server/access-codes";
import { SupabaseRequestError } from "@/src/lib/supabase/server";
import { POST } from "./route";

vi.mock("@/src/lib/server/access-codes", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/src/lib/server/access-codes")>();

  return {
    ...actual,
    verifyAnalysisAccessCode: vi.fn()
  };
});

vi.mock("@/src/lib/payments/access-code", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/src/lib/payments/access-code")>();

  return {
    ...actual,
    getAccessCodeAllowlist: vi.fn(() => "123456")
  };
});

describe("POST /api/access-code/verify", () => {
  beforeEach(() => {
    vi.mocked(verifyAnalysisAccessCode).mockReset();
    vi.mocked(verifyAnalysisAccessCode).mockResolvedValue({ ok: true, accessCode: { code: "123456" } as never });
  });

  it("verifies a six digit access code without requiring contract text", async () => {
    const response = await POST(
      new Request("http://localhost/api/access-code/verify", {
        method: "POST",
        body: JSON.stringify({ accessCode: "123456" })
      })
    );

    await expect(response.json()).resolves.toEqual({ ok: true });
    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(verifyAnalysisAccessCode).toHaveBeenCalledWith("123456");
  });

  it("rejects invalid access codes before contract text is submitted", async () => {
    vi.mocked(verifyAnalysisAccessCode).mockResolvedValue({
      ok: false,
      reason: "입력한 코드가 확인되지 않습니다."
    });

    const response = await POST(
      new Request("http://localhost/api/access-code/verify", {
        method: "POST",
        body: JSON.stringify({ accessCode: "000000" })
      })
    );

    await expect(response.json()).resolves.toEqual({
      error: "INVALID_ACCESS_CODE",
      message: "입력한 코드가 확인되지 않습니다."
    });
    expect(response.status).toBe(401);
    expect(verifyAnalysisAccessCode).toHaveBeenCalledWith("000000");
  });

  it("uses the local fallback verifier when Supabase access-code storage is not ready", async () => {
    vi.mocked(verifyAnalysisAccessCode).mockRejectedValue(new SupabaseRequestError("table missing", 404));

    const response = await POST(
      new Request("http://localhost/api/access-code/verify", {
        method: "POST",
        body: JSON.stringify({ accessCode: "123456" })
      })
    );

    await expect(response.json()).resolves.toEqual({ ok: true });
    expect(response.status).toBe(200);
  });
});
