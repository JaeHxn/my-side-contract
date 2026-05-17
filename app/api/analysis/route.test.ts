import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ContractAnalysisResult } from "@/src/lib/contracts/types";
import { analyzeContract } from "@/src/lib/analysis/service";
import { markAnalysisAccessCodeUsed, verifyAnalysisAccessCode } from "@/src/lib/server/access-codes";
import { saveContractAnalysisResult } from "@/src/lib/server/results";
import { POST } from "./route";

vi.mock("@/src/lib/analysis/service", () => ({
  analyzeContract: vi.fn()
}));

vi.mock("@/src/lib/server/results", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/src/lib/server/results")>();

  return {
    ...actual,
    saveContractAnalysisResult: vi.fn()
  };
});

vi.mock("@/src/lib/server/access-codes", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/src/lib/server/access-codes")>();

  return {
    ...actual,
    verifyAnalysisAccessCode: vi.fn(() => ({ ok: true, accessCode: { code: "123456" } })),
    markAnalysisAccessCodeUsed: vi.fn()
  };
});

const validContractText =
  "제1조 임대차보증금은 계약 종료일에 반환한다. 제2조 임대인은 필요한 수선을 부담한다.";

const sampleAnalysis: ContractAnalysisResult = {
  id: "analysis-route123",
  category: "housing-lease",
  provider: "rule-based",
  createdAt: "2026-05-17T00:00:00.000Z",
  summary: {
    overallRisk: "low",
    headline: "큰 위험 조항은 보이지 않습니다.",
    nextStep: "계약 전 등기부등본과 실제 소유자 정보를 확인하세요.",
    riskyCount: 0,
    warningCount: 0,
    safeCount: 1,
    missingCount: 0
  },
  items: [],
  missingClauses: [],
  legalReferences: [],
  disclaimer: "본 분석은 참고용이며 법적 효력이 없습니다."
};

describe("POST /api/analysis", () => {
  beforeEach(() => {
    vi.mocked(analyzeContract).mockReset();
    vi.mocked(verifyAnalysisAccessCode).mockReset();
    vi.mocked(markAnalysisAccessCodeUsed).mockReset();
    vi.mocked(saveContractAnalysisResult).mockReset();
    vi.mocked(verifyAnalysisAccessCode).mockResolvedValue({ ok: true, accessCode: { code: "123456" } as never });
  });

  it("analyzes and persists a valid contract request", async () => {
    const storedResult = {
      id: "analysis-route123",
      category: "housing-lease" as const,
      provider: "rule-based" as const,
      overallRisk: "low" as const,
      createdAt: "2026-05-17T00:00:00.000Z",
      analysis: sampleAnalysis
    };

    vi.mocked(analyzeContract).mockResolvedValue(sampleAnalysis);
    vi.mocked(saveContractAnalysisResult).mockResolvedValue(storedResult);

    const response = await POST(
      new Request("http://localhost/api/analysis", {
        method: "POST",
        body: JSON.stringify({
          contractText: validContractText,
          category: "housing-lease",
          accessCode: "123456"
        })
      })
    );

    await expect(response.json()).resolves.toEqual({
      analysis: sampleAnalysis,
      result: storedResult,
      resultUrl: "/result/analysis-route123"
    });
    expect(response.status).toBe(200);
    expect(analyzeContract).toHaveBeenCalledWith({
      contractText: validContractText,
      category: "housing-lease"
    });
    expect(saveContractAnalysisResult).toHaveBeenCalledWith(sampleAnalysis);
    expect(markAnalysisAccessCodeUsed).toHaveBeenCalledWith("123456", "analysis-route123");
  });

  it("keeps the analysis response when result persistence fails", async () => {
    vi.mocked(analyzeContract).mockResolvedValue(sampleAnalysis);
    vi.mocked(saveContractAnalysisResult).mockRejectedValue(new Error("Supabase unavailable"));

    const response = await POST(
      new Request("http://localhost/api/analysis", {
        method: "POST",
        body: JSON.stringify({
          contractText: validContractText,
          category: "housing-lease",
          accessCode: "123456"
        })
      })
    );

    await expect(response.json()).resolves.toMatchObject({
      analysis: sampleAnalysis,
      result: null,
      resultUrl: null,
      warning: {
        code: "RESULT_SAVE_FAILED"
      }
    });
    expect(response.status).toBe(200);
    expect(markAnalysisAccessCodeUsed).not.toHaveBeenCalled();
  });

  it("rejects invalid access codes before analysis", async () => {
    vi.mocked(verifyAnalysisAccessCode).mockResolvedValue({ ok: false, reason: "분석 코드가 올바르지 않습니다." });

    const response = await POST(
      new Request("http://localhost/api/analysis", {
        method: "POST",
        body: JSON.stringify({
          contractText: validContractText,
          category: "housing-lease",
          accessCode: "000000"
        })
      })
    );

    await expect(response.json()).resolves.toMatchObject({ error: "INVALID_ACCESS_CODE" });
    expect(response.status).toBe(401);
    expect(analyzeContract).not.toHaveBeenCalled();
    expect(saveContractAnalysisResult).not.toHaveBeenCalled();
    expect(markAnalysisAccessCodeUsed).not.toHaveBeenCalled();
  });
});
