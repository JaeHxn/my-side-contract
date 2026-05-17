import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AccessCodeValidationError, revokeAnalysisAccessCode } from "@/src/lib/server/access-codes";
import { SupabaseRequestError } from "@/src/lib/supabase/server";
import { POST } from "./route";

vi.mock("@/src/lib/server/access-codes", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/src/lib/server/access-codes")>();

  return {
    ...actual,
    revokeAnalysisAccessCode: vi.fn()
  };
});

const sampleRevokedAccessCode = {
  code: "123456",
  status: "revoked" as const,
  buyerName: "테스트",
  phone: null,
  memo: null,
  issuedAt: "2026-05-17T00:00:00.000Z",
  expiresAt: "2026-06-16T00:00:00.000Z",
  usedAt: null,
  resultId: null
};

describe("POST /api/admin/access-codes/revoke", () => {
  beforeEach(() => {
    vi.mocked(revokeAnalysisAccessCode).mockReset();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("revokes an analysis access code", async () => {
    vi.mocked(revokeAnalysisAccessCode).mockResolvedValue(sampleRevokedAccessCode);

    const response = await POST(
      new Request("http://localhost/api/admin/access-codes/revoke", {
        method: "POST",
        body: JSON.stringify({ code: "123456" })
      })
    );

    await expect(response.json()).resolves.toEqual({ accessCode: sampleRevokedAccessCode });
    expect(response.status).toBe(200);
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    expect(revokeAnalysisAccessCode).toHaveBeenCalledWith("123456");
  });

  it("rejects malformed codes before persistence", async () => {
    const response = await POST(
      new Request("http://localhost/api/admin/access-codes/revoke", {
        method: "POST",
        body: JSON.stringify({ code: "abc123" })
      })
    );

    await expect(response.json()).resolves.toMatchObject({ error: "INVALID_REQUEST" });
    expect(response.status).toBe(400);
    expect(revokeAnalysisAccessCode).not.toHaveBeenCalled();
  });

  it("requires the configured admin token when present", async () => {
    vi.stubEnv("ADMIN_ACCESS_TOKEN", "secret-admin-token");

    const missingTokenResponse = await POST(
      new Request("http://localhost/api/admin/access-codes/revoke", {
        method: "POST",
        body: JSON.stringify({ code: "123456" })
      })
    );

    expect(missingTokenResponse.status).toBe(401);
    expect(revokeAnalysisAccessCode).not.toHaveBeenCalled();

    vi.mocked(revokeAnalysisAccessCode).mockResolvedValue(sampleRevokedAccessCode);
    const authorizedResponse = await POST(
      new Request("http://localhost/api/admin/access-codes/revoke", {
        method: "POST",
        headers: {
          authorization: "Bearer secret-admin-token"
        },
        body: JSON.stringify({ code: "123456" })
      })
    );

    expect(authorizedResponse.status).toBe(200);
  });

  it("returns validation failures from the revoke operation", async () => {
    vi.mocked(revokeAnalysisAccessCode).mockRejectedValue(new AccessCodeValidationError("이미 사용된 코드입니다."));

    const response = await POST(
      new Request("http://localhost/api/admin/access-codes/revoke", {
        method: "POST",
        body: JSON.stringify({ code: "123456" })
      })
    );

    await expect(response.json()).resolves.toMatchObject({ error: "INVALID_ACCESS_CODE_REVOKE_REQUEST" });
    expect(response.status).toBe(400);
  });

  it("returns a local revoke response when Supabase is not ready in development", async () => {
    vi.mocked(revokeAnalysisAccessCode).mockRejectedValue(new SupabaseRequestError("table missing", 404));

    const response = await POST(
      new Request("http://localhost/api/admin/access-codes/revoke", {
        method: "POST",
        body: JSON.stringify({ code: "123456" })
      })
    );

    await expect(response.json()).resolves.toMatchObject({
      accessCode: {
        code: "123456",
        status: "revoked"
      },
      warning: {
        code: "LOCAL_DEMO_CODE"
      }
    });
    expect(response.status).toBe(200);
  });
});
