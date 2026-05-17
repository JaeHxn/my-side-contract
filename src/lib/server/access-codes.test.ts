import { describe, expect, it, vi } from "vitest";
import type { SupabaseRestClient } from "@/src/lib/supabase/server";
import {
  AccessCodeValidationError,
  createAnalysisAccessCode,
  listAnalysisAccessCodes,
  markAnalysisAccessCodeUsed,
  revokeAnalysisAccessCode,
  verifyAnalysisAccessCode
} from "./access-codes";

const issuedAt = new Date("2026-05-17T00:00:00.000Z");
const activeRow = {
  code: "123456",
  status: "active",
  buyer_name: "홍길동",
  phone: "010-1234-5678",
  memo: "무통장 입금 확인",
  issued_at: "2026-05-17T00:00:00.000Z",
  expires_at: "2026-06-16T00:00:00.000Z",
  used_at: null,
  result_id: null
};

const supabaseOffsetRow = {
  ...activeRow,
  issued_at: "2026-05-17T00:00:00+00:00",
  expires_at: "2026-06-16T00:00:00+00:00",
  used_at: "2026-05-18T00:00:00+00:00"
};

function createClient(overrides: Partial<SupabaseRestClient> = {}): SupabaseRestClient {
  return {
    selectMany: vi.fn(),
    selectOne: vi.fn(),
    upsertOne: vi.fn(),
    ...overrides
  };
}

function mockSelectOne(
  implementation: (
    table: string,
    filters: Record<string, string | number | boolean>
  ) => Promise<unknown | null>
): SupabaseRestClient["selectOne"] {
  return vi.fn(implementation) as unknown as SupabaseRestClient["selectOne"];
}

function mockSelectMany(
  implementation: (
    table: string,
    filters: Record<string, string | number | boolean>
  ) => Promise<unknown[]>
): SupabaseRestClient["selectMany"] {
  return vi.fn(implementation) as unknown as SupabaseRestClient["selectMany"];
}

function mockUpsertOne(
  implementation: (table: string, record: Record<string, unknown>) => Promise<unknown>
): SupabaseRestClient["upsertOne"] {
  return vi.fn(implementation) as unknown as SupabaseRestClient["upsertOne"];
}

describe("createAnalysisAccessCode", () => {
  it("creates an active six digit code with payment metadata and expiry", async () => {
    const client = createClient({
      selectOne: mockSelectOne(async () => null),
      upsertOne: mockUpsertOne(async (_table, row) => row)
    });

    const accessCode = await createAnalysisAccessCode(
      {
        buyerName: " 홍길동 ",
        phone: " 010-1234-5678 ",
        memo: " 무통장 입금 확인 ",
        ttlDays: 30
      },
      {
        client,
        now: issuedAt,
        codeGenerator: () => "123456"
      }
    );

    expect(client.selectOne).toHaveBeenCalledWith("analysis_access_codes", { code: "123456" }, expect.any(Object));
    expect(client.upsertOne).toHaveBeenCalledWith(
      "analysis_access_codes",
      {
        code: "123456",
        status: "active",
        buyer_name: "홍길동",
        phone: "010-1234-5678",
        memo: "무통장 입금 확인",
        issued_at: "2026-05-17T00:00:00.000Z",
        expires_at: "2026-06-16T00:00:00.000Z",
        used_at: null,
        result_id: null
      },
      expect.objectContaining({ onConflict: "code" })
    );
    expect(accessCode).toMatchObject({
      code: "123456",
      status: "active",
      buyerName: "홍길동",
      expiresAt: "2026-06-16T00:00:00.000Z"
    });
  });

  it("retries code generation when a collision already exists", async () => {
    const client = createClient({
      selectOne: mockSelectOne(async (_table, filters) => (filters.code === "111111" ? activeRow : null)),
      upsertOne: mockUpsertOne(async (_table, row) => row)
    });
    const codeGenerator = vi.fn().mockReturnValueOnce("111111").mockReturnValueOnce("222222");

    const accessCode = await createAnalysisAccessCode({}, { client, now: issuedAt, codeGenerator });

    expect(accessCode.code).toBe("222222");
    expect(codeGenerator).toHaveBeenCalledTimes(2);
  });

  it("accepts Supabase timestamptz offset strings in returned rows", async () => {
    const client = createClient({
      selectOne: mockSelectOne(async () => null),
      upsertOne: mockUpsertOne(async (_table, row) => ({
        ...row,
        issued_at: "2026-05-17T00:00:00+00:00",
        expires_at: "2026-06-16T00:00:00+00:00"
      }))
    });

    const accessCode = await createAnalysisAccessCode(
      {},
      {
        client,
        now: issuedAt,
        codeGenerator: () => "123456"
      }
    );

    expect(accessCode).toMatchObject({
      code: "123456",
      issuedAt: "2026-05-17T00:00:00+00:00",
      expiresAt: "2026-06-16T00:00:00+00:00"
    });
  });

  it("rejects invalid ttl values before persistence", async () => {
    const client = createClient();

    await expect(createAnalysisAccessCode({ ttlDays: 0 }, { client })).rejects.toBeInstanceOf(
      AccessCodeValidationError
    );
    expect(client.upsertOne).not.toHaveBeenCalled();
  });
});

describe("verifyAnalysisAccessCode", () => {
  it("accepts active, unexpired codes", async () => {
    const client = createClient({
      selectOne: mockSelectOne(async () => activeRow)
    });

    await expect(
      verifyAnalysisAccessCode(" 123456 ", { client, now: new Date("2026-05-20T00:00:00.000Z") })
    ).resolves.toMatchObject({
      ok: true,
      accessCode: {
        code: "123456",
        buyerName: "홍길동"
      }
    });
  });

  it("rejects malformed, missing, used, and expired codes", async () => {
    const missingClient = createClient({ selectOne: mockSelectOne(async () => null) });
    await expect(verifyAnalysisAccessCode("abc123", { client: missingClient })).resolves.toMatchObject({
      ok: false
    });
    expect(missingClient.selectOne).not.toHaveBeenCalled();

    await expect(verifyAnalysisAccessCode("123456", { client: missingClient })).resolves.toMatchObject({
      ok: false,
      reason: "입력한 코드가 확인되지 않습니다."
    });

    const usedClient = createClient({ selectOne: mockSelectOne(async () => ({ ...activeRow, status: "used" })) });
    await expect(verifyAnalysisAccessCode("123456", { client: usedClient })).resolves.toMatchObject({
      ok: false,
      reason: "이미 사용된 분석 코드입니다."
    });

    const revokedClient = createClient({
      selectOne: mockSelectOne(async () => ({ ...activeRow, status: "revoked" }))
    });
    await expect(verifyAnalysisAccessCode("123456", { client: revokedClient })).resolves.toMatchObject({
      ok: false,
      reason: "취소된 분석 코드입니다."
    });

    const expiredClient = createClient({ selectOne: mockSelectOne(async () => activeRow) });
    await expect(
      verifyAnalysisAccessCode("123456", { client: expiredClient, now: new Date("2026-07-01T00:00:00.000Z") })
    ).resolves.toMatchObject({
      ok: false,
      reason: "만료된 분석 코드입니다."
    });
  });
});

describe("markAnalysisAccessCodeUsed", () => {
  it("marks an active code as used and stores the result id", async () => {
    const client = createClient({
      selectOne: mockSelectOne(async () => activeRow),
      upsertOne: mockUpsertOne(async (_table, row) => row)
    });

    const updated = await markAnalysisAccessCodeUsed("123456", "analysis-abc123", {
      client,
      now: new Date("2026-05-18T00:00:00.000Z")
    });

    expect(client.upsertOne).toHaveBeenCalledWith(
      "analysis_access_codes",
      expect.objectContaining({
        code: "123456",
        status: "used",
        used_at: "2026-05-18T00:00:00.000Z",
        result_id: "analysis-abc123"
      }),
      expect.objectContaining({ onConflict: "code" })
    );
    expect(updated).toMatchObject({
      code: "123456",
      status: "used",
      resultId: "analysis-abc123"
    });
  });
});

describe("listAnalysisAccessCodes", () => {
  it("lists recent codes with optional status filtering", async () => {
    const client = createClient({
      selectMany: mockSelectMany(async () => [supabaseOffsetRow, { ...activeRow, code: "222222", status: "used" }])
    });

    const accessCodes = await listAnalysisAccessCodes({ status: "active", limit: 20 }, { client });

    expect(client.selectMany).toHaveBeenCalledWith(
      "analysis_access_codes",
      { status: "active" },
      {
        select: expect.any(String),
        order: "issued_at.desc",
        limit: 20
      }
    );
    expect(accessCodes).toHaveLength(2);
    expect(accessCodes[0]).toMatchObject({ code: "123456", status: "active" });
  });

  it("rejects invalid list filters before querying", async () => {
    const client = createClient();

    await expect(listAnalysisAccessCodes({ status: "deleted" }, { client })).rejects.toBeInstanceOf(
      AccessCodeValidationError
    );
    expect(client.selectMany).not.toHaveBeenCalled();
  });
});

describe("revokeAnalysisAccessCode", () => {
  it("marks an active code as revoked", async () => {
    const client = createClient({
      selectOne: mockSelectOne(async () => activeRow),
      upsertOne: mockUpsertOne(async (_table, row) => row)
    });

    const updated = await revokeAnalysisAccessCode("123456", { client });

    expect(client.upsertOne).toHaveBeenCalledWith(
      "analysis_access_codes",
      expect.objectContaining({
        code: "123456",
        status: "revoked"
      }),
      expect.objectContaining({ onConflict: "code" })
    );
    expect(updated).toMatchObject({
      code: "123456",
      status: "revoked"
    });
  });

  it("does not revoke already used codes", async () => {
    const client = createClient({
      selectOne: mockSelectOne(async () => ({ ...activeRow, status: "used" }))
    });

    await expect(revokeAnalysisAccessCode("123456", { client })).rejects.toBeInstanceOf(
      AccessCodeValidationError
    );
    expect(client.upsertOne).not.toHaveBeenCalled();
  });
});
