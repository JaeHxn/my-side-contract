export const contractCategories = ["housing-lease", "labor", "wedding", "interior", "freelance"] as const;

export type ContractCategory = (typeof contractCategories)[number];

export type RiskLevel = "danger" | "warning" | "safe" | "missing";

export type FindingType = "illegal" | "unfavorable" | "normal" | "missing";

export interface LawReference {
  title: string;
  article?: string;
  source: "law-api" | "built-in";
  url?: string;
  lastChecked?: string;
}

export interface AnalysisItem {
  id: string;
  clauseTitle: string;
  originalText: string;
  type: FindingType;
  riskLevel: RiskLevel;
  reason: string;
  legalBasis: LawReference[];
  recommendation: string;
}

export interface MissingClause {
  key: string;
  title: string;
  riskLevel: "missing";
  whyItMatters: string;
  recommendation: string;
  legalBasis: LawReference[];
}

export interface AnalysisSummary {
  overallRisk: "high" | "medium" | "low";
  headline: string;
  nextStep: string;
  riskyCount: number;
  warningCount: number;
  safeCount: number;
  missingCount: number;
}

export interface ContractAnalysisResult {
  id: string;
  category: ContractCategory;
  provider: "rule-based" | "ai-assisted";
  createdAt: string;
  summary: AnalysisSummary;
  items: AnalysisItem[];
  missingClauses: MissingClause[];
  legalReferences: LawReference[];
  disclaimer: string;
}

export interface AnalyzeContractInput {
  contractText: string;
  category: ContractCategory;
}
