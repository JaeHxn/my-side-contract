import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ContractAnalysisResult } from "@/src/lib/contracts/types";
import { ResultValidationError, saveContractAnalysisResult } from "@/src/lib/server/results";
import { POST } from "./route";

vi.mock("@/src/lib/server/results", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/src/lib/server/results")>();

  return {
    ...actual,
    saveContractAnalysisResult: vi.fn()
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

describe("POST /api/result", () => {
  beforeEach(() => {
    vi.mocked(saveContractAnalysisResult).mockReset();
  });

  it("persists a validated analysis result", async () => {
    vi.mocked(saveContractAnalysisResult).mockResolvedValue({
      id: "analysis-route123",
      category: "housing-lease",
      provider: "rule-based",
      overallRisk: "low",
      createdAt: "2026-05-17T00:00:00.000Z",
      analysis: sampleAnalysis
    });

    const response = await POST(
      new Request("http://localhost/api/result", {
        method: "POST",
        body: JSON.stringify({ analysis: sampleAnalysis })
      })
    );

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
    expect(response.status).toBe(201);
    expect(saveContractAnalysisResult).toHaveBeenCalledWith(sampleAnalysis);
  });

  it("returns 400 for invalid request JSON", async () => {
    const response = await POST(
      new Request("http://localhost/api/result", {
        method: "POST",
        body: "not json"
      })
    );

    await expect(response.json()).resolves.toMatchObject({ error: "INVALID_REQUEST" });
    expect(response.status).toBe(400);
    expect(saveContractAnalysisResult).not.toHaveBeenCalled();
  });

  it("returns 400 when result validation fails", async () => {
    vi.mocked(saveContractAnalysisResult).mockRejectedValue(new ResultValidationError("Invalid result."));

    const response = await POST(
      new Request("http://localhost/api/result", {
        method: "POST",
        body: JSON.stringify({ analysis: sampleAnalysis })
      })
    );

    await expect(response.json()).resolves.toMatchObject({ error: "INVALID_RESULT" });
    expect(response.status).toBe(400);
  });
});
