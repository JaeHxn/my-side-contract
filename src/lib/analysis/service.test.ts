import { afterEach, describe, expect, it, vi } from "vitest";
import { analyzeContract } from "./service";
import { analyzeContractText } from "./rule-based";

describe("analyzeContract", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("preserves the rule-based result when OpenAI enhancement fails", async () => {
    const input = {
      contractText: [
        "제1조 보증금은 계약 종료와 목적물 인도 후 임대인이 반환한다.",
        "제2조 임차인은 계약갱신요구권을 포기한다.",
        "제3조 모든 수리 및 하자 보수 비용은 임차인이 부담한다."
      ].join("\n"),
      category: "housing-lease" as const
    };
    const expectedRuleBasedResult = analyzeContractText(input);
    const fetchMock = vi.fn().mockRejectedValue(new Error("OpenAI unavailable"));

    vi.stubEnv("DISABLE_AI_ANALYSIS", "false");
    vi.stubEnv("LAW_API_OC", "");
    vi.stubEnv("OPENAI_API_KEY", "test-openai-key");
    vi.stubGlobal("fetch", fetchMock);

    const result = await analyzeContract(input);

    expect(fetchMock).toHaveBeenCalledOnce();
    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.openai.com/v1/responses",
      expect.objectContaining({
        method: "POST"
      })
    );
    expect(result.provider).toBe("rule-based");
    expect(result.id).toBe(expectedRuleBasedResult.id);
    expect(result.category).toBe(expectedRuleBasedResult.category);
    expect(result.summary).toEqual(expectedRuleBasedResult.summary);
    expect(result.items).toEqual(expectedRuleBasedResult.items);
    expect(result.missingClauses).toEqual(expectedRuleBasedResult.missingClauses);
    expect(result.legalReferences).toEqual(expectedRuleBasedResult.legalReferences);
  });

  it("uses labor law references for labor contracts", async () => {
    vi.stubEnv("DISABLE_AI_ANALYSIS", "true");

    const result = await analyzeContract({
      contractText:
        "제1조 임금은 월 250만원으로 매월 25일 지급한다. 제2조 근로시간은 주 40시간으로 한다. 제3조 휴게시간과 연차는 근로기준법에 따른다.",
      category: "labor"
    });

    expect(result.category).toBe("labor");
    expect(result.legalReferences.map((reference) => reference.title)).toContain("근로기준법");
    expect(result.legalReferences.map((reference) => reference.title)).toContain("최저임금법");
  });
});
