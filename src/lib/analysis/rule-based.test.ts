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

  it("flags labor contract clauses that waive statutory wage and rest protections", () => {
    const result = analyzeContractText({
      contractText:
        "제1조 근로자는 무단퇴사 시 위약금 100만원을 지급한다. 제2조 포괄임금에 모든 연장근로수당이 포함되며 추가 수당은 지급하지 않는다. 제3조 휴게시간은 없다.",
      category: "labor"
    });

    expect(result.category).toBe("labor");
    expect(result.summary.overallRisk).toBe("high");
    expect(result.items.map((item) => item.id)).toEqual(
      expect.arrayContaining(["labor-penalty-for-leaving", "labor-unpaid-overtime", "labor-no-break"])
    );
    expect(result.legalReferences.some((reference) => reference.title === "근로기준법")).toBe(true);
  });

  it("reports missing core labor contract terms", () => {
    const result = analyzeContractText({
      contractText: "제1조 담당업무는 매장 관리로 한다. 제2조 근무장소는 서울 지점으로 한다.",
      category: "labor"
    });

    expect(result.missingClauses.map((clause) => clause.key)).toEqual(
      expect.arrayContaining(["labor-wage", "labor-working-hours", "labor-break-holiday", "labor-paid-leave"])
    );
  });

  it("flags illegal interior contract clauses — full prepayment and waived defect liability", () => {
    const result = analyzeContractText({
      contractText:
        "제1조 공사대금 전액을 계약 즉시 선불로 지급한다.\n제2조 공사 완료 후 발생하는 모든 하자에 대한 책임은 면책으로 한다.",
      category: "interior"
    });

    expect(result.category).toBe("interior");
    expect(result.summary.overallRisk).toBe("high");
    expect(result.items.some((item) => item.riskLevel === "danger")).toBe(true);
  });

  it("reports missing core interior contract clauses", () => {
    const result = analyzeContractText({
      contractText: "제1조 시공사는 발주자의 주택을 인테리어 공사한다.",
      category: "interior"
    });

    expect(result.missingClauses.map((clause) => clause.key)).toEqual(
      expect.arrayContaining(["interior-completion-criteria", "interior-material-spec", "interior-defect-period", "interior-payment-schedule"])
    );
  });

  it("flags illegal freelance contract clauses — automatic copyright transfer and excessive late payment", () => {
    const result = analyzeContractText({
      contractText:
        "제1조 수급인이 제작한 모든 결과물의 저작권은 계약 즉시 자동으로 발주자에게 귀속된다.\n제2조 용역대금은 최종 완료 후 90일 이내에 지급한다.",
      category: "freelance"
    });

    expect(result.category).toBe("freelance");
    expect(result.summary.overallRisk).toBe("high");
    expect(result.items.some((item) => item.id === "freelance-auto-ip-transfer")).toBe(true);
    expect(result.items.some((item) => item.id === "freelance-payment-delay")).toBe(true);
  });

  it("reports missing core freelance contract clauses", () => {
    const result = analyzeContractText({
      contractText: "제1조 수급인은 발주자를 위하여 용역을 수행한다.",
      category: "freelance"
    });

    expect(result.missingClauses.map((clause) => clause.key)).toEqual(
      expect.arrayContaining(["freelance-scope", "freelance-payment-schedule", "freelance-ip-ownership", "freelance-revision-limit"])
    );
  });
});
