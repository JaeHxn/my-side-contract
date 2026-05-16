import { describe, expect, it } from "vitest";
import { analyzeContractText } from "./rule-based";

describe("analyzeContractText", () => {
  it("flags penalty-heavy housing lease clauses as risky", () => {
    const result = analyzeContractText({
      contractText: "제1조 보증금은 1억원으로 한다.\n제2조 임차인이 하루라도 늦으면 보증금 전액을 위약금으로 몰취한다.",
      category: "housing-lease"
    });

    expect(result.summary.riskyCount).toBeGreaterThanOrEqual(1);
    expect(result.items.some((item) => item.riskLevel === "danger" && item.reason.includes("과도"))).toBe(true);
  });

  it("reports missing core housing lease clauses", () => {
    const result = analyzeContractText({
      contractText: "제1조 임대인과 임차인은 주택을 임대차한다.",
      category: "housing-lease"
    });

    expect(result.missingClauses.map((clause) => clause.key)).toContain("deposit-return");
    expect(result.missingClauses.map((clause) => clause.key)).toContain("repair-responsibility");
  });

  it("keeps normal clauses explainable in plain Korean", () => {
    const result = analyzeContractText({
      contractText: "제1조 임대차 기간은 2026년 6월 1일부터 2028년 5월 31일까지로 한다.",
      category: "housing-lease"
    });

    expect(result.items[0].riskLevel).toBe("safe");
    expect(result.items[0].recommendation).toContain("문제");
  });
});
