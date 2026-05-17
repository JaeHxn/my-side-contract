import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createAnalysisAccessCode } from "@/src/lib/server/access-codes";
import { POST } from "./route";

vi.mock("@/src/lib/server/access-codes", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/src/lib/server/access-codes")>();

  return {
    ...actual,
    createAnalysisAccessCode: vi.fn()
  };
});

const sampleAccessCode = {
  code: "123456",
  status: "active" as const,
  buyerName: "홍길동",
  phone: "010-1234-5678",
  memo: "무통장 입금 확인",
  issuedAt: "2026-05-17T00:00:00.000Z",
  expiresAt: "2026-06-16T00:00:00.000Z",
  usedAt: null,
  resultId: null
};

describe("POST /api/admin/access-codes", () => {
  beforeEach(() => {
    vi.mocked(createAnalysisAccessCode).mockReset();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("creates an analysis access code", async () => {
    vi.mocked(createAnalysisAccessCode).mockResolvedValue(sampleAccessCode);

    const response = await POST(
      new Request("http://localhost/api/admin/access-codes", {
        method: "POST",
        body: JSON.stringify({
          buyerName: "홍길동",
          phone: "010-1234-5678",
          memo: "무통장 입금 확인",
          ttlDays: 30
        })
      })
    );

    await expect(response.json()).resolves.toEqual({ accessCode: sampleAccessCode });
    expect(response.status).toBe(201);
    expect(createAnalysisAccessCode).toHaveBeenCalledWith({
      buyerName: "홍길동",
      phone: "010-1234-5678",
      memo: "무통장 입금 확인",
      ttlDays: 30
    });
  });

  it("rejects invalid ttl days", async () => {
    const response = await POST(
      new Request("http://localhost/api/admin/access-codes", {
        method: "POST",
        body: JSON.stringify({ ttlDays: 120 })
      })
    );

    await expect(response.json()).resolves.toMatchObject({ error: "INVALID_REQUEST" });
    expect(response.status).toBe(400);
    expect(createAnalysisAccessCode).not.toHaveBeenCalled();
  });

  it("requires the configured admin token when present", async () => {
    vi.stubEnv("ADMIN_ACCESS_TOKEN", "secret-admin-token");

    const missingTokenResponse = await POST(
      new Request("http://localhost/api/admin/access-codes", {
        method: "POST",
        body: JSON.stringify({})
      })
    );

    expect(missingTokenResponse.status).toBe(401);
    expect(createAnalysisAccessCode).not.toHaveBeenCalled();

    vi.mocked(createAnalysisAccessCode).mockResolvedValue(sampleAccessCode);
    const authorizedResponse = await POST(
      new Request("http://localhost/api/admin/access-codes", {
        method: "POST",
        headers: {
          authorization: "Bearer secret-admin-token"
        },
        body: JSON.stringify({})
      })
    );

    expect(authorizedResponse.status).toBe(201);
  });
});
