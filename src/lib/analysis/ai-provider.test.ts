import { afterEach, describe, expect, it, vi } from "vitest";
import type { ContractAnalysisResult } from "../contracts/types";
import { maybeEnhanceWithAi } from "./ai-provider";

const baseAnalysis: ContractAnalysisResult = {
  id: "analysis-1",
  category: "housing-lease",
  provider: "rule-based",
  createdAt: "2026-05-17T00:00:00.000Z",
  summary: {
    overallRisk: "medium",
    headline: "Rule-based headline",
    nextStep: "Rule-based next step.",
    riskyCount: 2,
    warningCount: 1,
    safeCount: 3,
    missingCount: 4
  },
  items: [],
  missingClauses: [],
  legalReferences: [],
  disclaimer: "Rules first."
};

describe("maybeEnhanceWithAi", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("uses OpenAI with the default model and sends only redacted contract text", async () => {
    vi.stubEnv("OPENAI_API_KEY", "test-openai-key");
    vi.stubEnv("OPENAI_MODEL", "");

    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ output_text: "Check deposit return timing." }), {
        status: 200,
        headers: { "content-type": "application/json" }
      })
    );
    vi.stubGlobal("fetch", fetchMock);

    const result = await maybeEnhanceWithAi(
      baseAnalysis,
      "Tenant tenant@example.com 010-1234-5678 900101-1234567"
    );

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, requestInit] = fetchMock.mock.calls[0] as [string, RequestInit];
    const body = JSON.parse(requestInit.body as string) as { input: string; model: string };

    expect(url).toBe("https://api.openai.com/v1/responses");
    expect(requestInit.headers).toMatchObject({
      authorization: "Bearer test-openai-key"
    });
    expect(body.model).toBe("gpt-5.4-mini");
    expect(body.input).not.toContain("tenant@example.com");
    expect(body.input).not.toContain("010-1234-5678");
    expect(body.input).not.toContain("900101-1234567");
    expect(body.input).toContain("[REDACTED:EMAIL]");
    expect(body.input).toContain("[REDACTED:PHONE]");
    expect(body.input).toContain("[REDACTED:RESIDENT_ID]");
    expect(result.provider).toBe("ai-assisted");
    expect(result.summary.riskyCount).toBe(baseAnalysis.summary.riskyCount);
    expect(result.summary.warningCount).toBe(baseAnalysis.summary.warningCount);
    expect(result.summary.safeCount).toBe(baseAnalysis.summary.safeCount);
    expect(result.summary.missingCount).toBe(baseAnalysis.summary.missingCount);
  });

  it("keeps deterministic rule counts and provider when OpenAI fails", async () => {
    vi.stubEnv("OPENAI_API_KEY", "test-openai-key");
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response("rate limited", { status: 429 }))
    );

    const result = await maybeEnhanceWithAi(baseAnalysis, "Tenant 010-1234-5678");

    expect(result).toBe(baseAnalysis);
    expect(result.provider).toBe("rule-based");
    expect(result.summary).toEqual(baseAnalysis.summary);
  });

  it("does not call OpenAI when no API key is configured", async () => {
    vi.stubEnv("OPENAI_API_KEY", "");
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const result = await maybeEnhanceWithAi(baseAnalysis, "Tenant 010-1234-5678");

    expect(fetchMock).not.toHaveBeenCalled();
    expect(result).toBe(baseAnalysis);
  });
});
