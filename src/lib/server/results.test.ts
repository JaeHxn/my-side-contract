import { describe, expect, it, vi } from "vitest";
import type { ContractAnalysisResult } from "@/src/lib/contracts/types";
import type { SupabaseRestClient } from "@/src/lib/supabase/server";
import {
  ResultValidationError,
  getContractAnalysisResult,
  saveContractAnalysisResult
} from "./results";

const sampleAnalysis: ContractAnalysisResult = {
  id: "analysis-1234abcd",
  category: "housing-lease",
  provider: "rule-based",
  createdAt: "2026-05-17T00:00:00.000Z",
  summary: {
    overallRisk: "medium",
    headline: "Review recommended.",
    nextStep: "Ask for revised language.",
    riskyCount: 0,
    warningCount: 1,
    safeCount: 2,
    missingCount: 1
  },
  items: [
    {
      id: "clause-1",
      clauseTitle: "Clause 1",
      originalText: "Tenant pays utilities.",
      type: "normal",
      riskLevel: "safe",
      reason: "No immediate issue.",
      legalBasis: [],
      recommendation: "Confirm dates and amounts."
    }
  ],
  missingClauses: [],
  legalReferences: [],
  disclaimer: "Reference only."
};

function createClient(overrides: Partial<SupabaseRestClient> = {}): SupabaseRestClient {
  return {
    selectMany: vi.fn(),
    selectOne: vi.fn(),
    upsertOne: vi.fn(),
    insertOne: vi.fn(),
    ...overrides
  };
}

describe("saveContractAnalysisResult", () => {
  it("upserts the analysis into the contract result table", async () => {
    const client = createClient({
      upsertOne: vi.fn(async (_table, row) => row)
    });

    const saved = await saveContractAnalysisResult(sampleAnalysis, client);

    expect(client.upsertOne).toHaveBeenCalledWith(
      "contract_analysis_results",
      {
        id: "analysis-1234abcd",
        category: "housing-lease",
        provider: "rule-based",
        overall_risk: "medium",
        result: sampleAnalysis,
        created_at: "2026-05-17T00:00:00.000Z"
      },
      {
        onConflict: "id",
        select: "id, category, provider, overall_risk, result, created_at"
      }
    );
    expect(saved).toEqual({
      id: "analysis-1234abcd",
      category: "housing-lease",
      provider: "rule-based",
      overallRisk: "medium",
      createdAt: "2026-05-17T00:00:00.000Z",
      analysis: sampleAnalysis
    });
  });

  it("rejects malformed analysis payloads before persistence", async () => {
    const client = createClient();

    await expect(
      saveContractAnalysisResult(
        { ...sampleAnalysis, summary: { ...sampleAnalysis.summary, overallRisk: "severe" } } as unknown,
        client
      )
    ).rejects.toBeInstanceOf(ResultValidationError);
    expect(client.upsertOne).not.toHaveBeenCalled();
  });
});

describe("getContractAnalysisResult", () => {
  it("returns null when no stored result exists", async () => {
    const client = createClient({
      selectOne: vi.fn(async () => null)
    });

    await expect(getContractAnalysisResult("analysis-1234abcd", client)).resolves.toBeNull();
    expect(client.selectOne).toHaveBeenCalledWith(
      "contract_analysis_results",
      { id: "analysis-1234abcd" },
      { select: "id, category, provider, overall_risk, result, created_at" }
    );
  });

  it("maps a stored row back to a result payload", async () => {
    const client = createClient({
      selectOne: vi.fn(async () => ({
        id: "analysis-1234abcd",
        category: "housing-lease",
        provider: "rule-based",
        overall_risk: "medium",
        result: sampleAnalysis,
        created_at: "2026-05-17T00:00:00.000Z"
      })) as unknown as SupabaseRestClient["selectOne"]
    });

    await expect(getContractAnalysisResult(" analysis-1234abcd ", client)).resolves.toEqual({
      id: "analysis-1234abcd",
      category: "housing-lease",
      provider: "rule-based",
      overallRisk: "medium",
      createdAt: "2026-05-17T00:00:00.000Z",
      analysis: sampleAnalysis
    });
  });

  it("rejects unsafe result ids before querying Supabase", async () => {
    const client = createClient();

    await expect(getContractAnalysisResult("../analysis-1234abcd", client)).rejects.toBeInstanceOf(
      ResultValidationError
    );
    expect(client.selectOne).not.toHaveBeenCalled();
  });
});
