import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ContractAnalysisResult } from "@/src/lib/contracts/types";
import { ResultValidationError, getContractAnalysisResult } from "@/src/lib/server/results";
import { GET } from "./route";

vi.mock("@/src/lib/server/results", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/src/lib/server/results")>();

  return {
    ...actual,
    getContractAnalysisResult: vi.fn()
  };
});

const sampleAnalysis: ContractAnalysisResult = {
  id: "analysis-route123",
  category: "housing-lease",
  provider: "rule-based",
  createdAt: "2026-05-17T00:00:00.000Z",
  summary: {
    overallRisk: "low",
    headline: "Looks acceptable.",
    nextStep: "Confirm business details.",
    riskyCount: 0,
    warningCount: 0,
    safeCount: 1,
    missingCount: 0
  },
  items: [],
  missingClauses: [],
  legalReferences: [],
  disclaimer: "Reference only."
};

describe("GET /api/result/[id]", () => {
  beforeEach(() => {
    vi.mocked(getContractAnalysisResult).mockReset();
  });

  it("returns a stored result by id", async () => {
    vi.mocked(getContractAnalysisResult).mockResolvedValue({
      id: "analysis-route123",
      category: "housing-lease",
      provider: "rule-based",
      overallRisk: "low",
      createdAt: "2026-05-17T00:00:00.000Z",
      analysis: sampleAnalysis
    });

    const response = await GET(new Request("http://localhost/api/result/analysis-route123"), {
      params: Promise.resolve({ id: "analysis-route123" })
    });

    await expect(response.json()).resolves.toEqual({
      result: {
        id: "analysis-route123",
        category: "housing-lease",
        provider: "rule-based",
        overallRisk: "low",
        createdAt: "2026-05-17T00:00:00.000Z",
        analysis: sampleAnalysis
      }
    });
    expect(response.status).toBe(200);
    expect(getContractAnalysisResult).toHaveBeenCalledWith("analysis-route123");
  });

  it("returns 404 for a missing result", async () => {
    vi.mocked(getContractAnalysisResult).mockResolvedValue(null);

    const response = await GET(new Request("http://localhost/api/result/analysis-missing"), {
      params: Promise.resolve({ id: "analysis-missing" })
    });

    await expect(response.json()).resolves.toMatchObject({ error: "RESULT_NOT_FOUND" });
    expect(response.status).toBe(404);
  });

  it("returns 400 for invalid result ids", async () => {
    vi.mocked(getContractAnalysisResult).mockRejectedValue(new ResultValidationError("Result id format is invalid."));

    const response = await GET(new Request("http://localhost/api/result/%2E%2E"), {
      params: Promise.resolve({ id: ".." })
    });

    await expect(response.json()).resolves.toMatchObject({ error: "INVALID_RESULT_ID" });
    expect(response.status).toBe(400);
  });
});
