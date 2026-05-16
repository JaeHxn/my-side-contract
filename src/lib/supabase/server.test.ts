import { describe, expect, it, vi } from "vitest";
import {
  SupabaseConfigError,
  SupabaseRequestError,
  createSupabaseServerClient,
  getSupabaseServerConfig,
  type SupabaseFetch
} from "./server";

describe("getSupabaseServerConfig", () => {
  it("reads the server Supabase env vars and normalizes the project URL", () => {
    const config = getSupabaseServerConfig({
      NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co/",
      SUPABASE_SERVICE_ROLE_KEY: "test-service-role-key"
    });

    expect(config).toEqual({
      url: "https://example.supabase.co",
      serviceRoleKey: "test-service-role-key"
    });
  });

  it("reports missing env var names without including secret values", () => {
    expect(() =>
      getSupabaseServerConfig({
        NEXT_PUBLIC_SUPABASE_URL: "",
        SUPABASE_SERVICE_ROLE_KEY: ""
      })
    ).toThrow(SupabaseConfigError);

    try {
      getSupabaseServerConfig({
        NEXT_PUBLIC_SUPABASE_URL: "",
        SUPABASE_SERVICE_ROLE_KEY: ""
      });
    } catch (error) {
      expect(error).toBeInstanceOf(SupabaseConfigError);
      expect((error as Error).message).toContain("NEXT_PUBLIC_SUPABASE_URL");
      expect((error as Error).message).toContain("SUPABASE_SERVICE_ROLE_KEY");
      expect((error as Error).message).not.toContain("test-service-role-key");
    }
  });
});

describe("createSupabaseServerClient", () => {
  it("selects a single row with service-role headers", async () => {
    const fetchImpl = vi.fn(async () => new Response(JSON.stringify([{ id: "analysis-1234" }])));
    const client = createSupabaseServerClient(
      {
        url: "https://example.supabase.co",
        serviceRoleKey: "test-service-role-key"
      },
      fetchImpl
    );

    const row = await client.selectOne<{ id: string }>(
      "contract_analysis_results",
      { id: "analysis-1234" },
      { select: "id, result" }
    );

    expect(row).toEqual({ id: "analysis-1234" });
    expect(fetchImpl).toHaveBeenCalledOnce();

    const [input, init] = (fetchImpl.mock.calls as unknown as Array<Parameters<SupabaseFetch>>)[0];
    const url = new URL(String(input));
    expect(url.origin).toBe("https://example.supabase.co");
    expect(url.pathname).toBe("/rest/v1/contract_analysis_results");
    expect(url.searchParams.get("select")).toBe("id, result");
    expect(url.searchParams.get("id")).toBe("eq.analysis-1234");
    expect(url.searchParams.get("limit")).toBe("1");
    expect(init?.headers).toMatchObject({
      apikey: "test-service-role-key",
      authorization: "Bearer test-service-role-key"
    });
  });

  it("upserts one row and returns the represented row", async () => {
    const fetchImpl = vi.fn(async () => new Response(JSON.stringify([{ id: "analysis-1234" }])));
    const client = createSupabaseServerClient(
      {
        url: "https://example.supabase.co",
        serviceRoleKey: "test-service-role-key"
      },
      fetchImpl
    );

    const row = await client.upsertOne(
      "contract_analysis_results",
      { id: "analysis-1234", result: { ok: true } },
      { onConflict: "id", select: "id, result" }
    );

    expect(row).toEqual({ id: "analysis-1234" });
    const [input, init] = (fetchImpl.mock.calls as unknown as Array<Parameters<SupabaseFetch>>)[0];
    const url = new URL(String(input));
    expect(url.searchParams.get("on_conflict")).toBe("id");
    expect(url.searchParams.get("select")).toBe("id, result");
    expect(init?.method).toBe("POST");
    expect(init?.body).toBe(JSON.stringify({ id: "analysis-1234", result: { ok: true } }));
    expect(init?.headers).toMatchObject({
      "content-type": "application/json",
      prefer: "resolution=merge-duplicates,return=representation"
    });
  });

  it("throws a typed error when Supabase returns an error status", async () => {
    const fetchImpl = vi.fn(
      async () =>
        new Response(JSON.stringify({ code: "PGRST000", message: "request failed" }), {
          status: 500
        })
    );
    const client = createSupabaseServerClient(
      {
        url: "https://example.supabase.co",
        serviceRoleKey: "test-service-role-key"
      },
      fetchImpl
    );

    await expect(client.selectOne("contract_analysis_results", { id: "analysis-1234" })).rejects.toMatchObject({
      name: "SupabaseRequestError",
      status: 500
    });
    await expect(client.selectOne("contract_analysis_results", { id: "analysis-1234" })).rejects.toBeInstanceOf(
      SupabaseRequestError
    );
  });
});
