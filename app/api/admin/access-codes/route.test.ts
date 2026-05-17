import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AccessCodeValidationError, createAnalysisAccessCode, listAnalysisAccessCodes } from "@/src/lib/server/access-codes";
import { SupabaseRequestError } from "@/src/lib/supabase/server";
import { GET, POST } from "./route";

vi.mock("@/src/lib/server/access-codes", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/src/lib/server/access-codes")>();

  return {
    ...actual,
    createAnalysisAccessCode: vi.fn(),
    listAnalysisAccessCodes: vi.fn()
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
    vi.mocked(listAnalysisAccessCodes).mockReset();
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

  it("returns the local demo code when Supabase is not ready in development", async () => {
    vi.mocked(createAnalysisAccessCode).mockRejectedValue(new SupabaseRequestError("table missing", 404));

    const response = await POST(
      new Request("http://localhost/api/admin/access-codes", {
        method: "POST",
        body: JSON.stringify({ ttlDays: 30 })
      })
    );

    await expect(response.json()).resolves.toMatchObject({
      accessCode: {
        code: "123456",
        status: "active"
      },
      warning: {
        code: "LOCAL_DEMO_CODE"
      }
    });
    expect(response.status).toBe(201);
  });
});

describe("GET /api/admin/access-codes", () => {
  beforeEach(() => {
    vi.mocked(createAnalysisAccessCode).mockReset();
    vi.mocked(listAnalysisAccessCodes).mockReset();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("lists analysis access codes with filters", async () => {
    vi.mocked(listAnalysisAccessCodes).mockResolvedValue([sampleAccessCode]);

    const response = await GET(new Request("http://localhost/api/admin/access-codes?status=active&limit=25"));

    await expect(response.json()).resolves.toEqual({ accessCodes: [sampleAccessCode] });
    expect(response.status).toBe(200);
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    expect(listAnalysisAccessCodes).toHaveBeenCalledWith({
      status: "active",
      limit: 25
    });
  });

  it("treats the all filter as an unfiltered list request", async () => {
    vi.mocked(listAnalysisAccessCodes).mockResolvedValue([sampleAccessCode]);

    const response = await GET(new Request("http://localhost/api/admin/access-codes?status=all&limit=20"));

    expect(response.status).toBe(200);
    expect(listAnalysisAccessCodes).toHaveBeenCalledWith({
      limit: 20
    });
  });

  it("rejects invalid list filters", async () => {
    vi.mocked(listAnalysisAccessCodes).mockRejectedValue(new AccessCodeValidationError("invalid filter"));

    const response = await GET(new Request("http://localhost/api/admin/access-codes?status=deleted"));

    await expect(response.json()).resolves.toMatchObject({ error: "INVALID_ACCESS_CODE_LIST_REQUEST" });
    expect(response.status).toBe(400);
  });

  it("requires the configured admin token when present", async () => {
    vi.stubEnv("ADMIN_ACCESS_TOKEN", "secret-admin-token");

    const missingTokenResponse = await GET(new Request("http://localhost/api/admin/access-codes"));

    expect(missingTokenResponse.status).toBe(401);
    expect(listAnalysisAccessCodes).not.toHaveBeenCalled();

    vi.mocked(listAnalysisAccessCodes).mockResolvedValue([sampleAccessCode]);
    const authorizedResponse = await GET(
      new Request("http://localhost/api/admin/access-codes", {
        headers: {
          "x-admin-token": "secret-admin-token"
        }
      })
    );

    expect(authorizedResponse.status).toBe(200);
  });

  it("returns the local demo code when Supabase is not ready in development", async () => {
    vi.mocked(listAnalysisAccessCodes).mockRejectedValue(new SupabaseRequestError("table missing", 404));

    const response = await GET(new Request("http://localhost/api/admin/access-codes"));

    await expect(response.json()).resolves.toMatchObject({
      accessCodes: [
        {
          code: "123456",
          status: "active"
        }
      ],
      warning: {
        code: "LOCAL_DEMO_CODE"
      }
    });
    expect(response.status).toBe(200);
  });
});
