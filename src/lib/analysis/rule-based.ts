import type {
  AnalysisItem,
  AnalyzeContractInput,
  ContractAnalysisResult,
  MissingClause,
  RiskLevel
} from "../contracts/types";
import { housingLeaseLawReferences, referenceByTitle } from "./law-references";

const disclaimer =
  "본 분석은 AI와 규칙 기반 점검으로 제공되는 참고 정보이며 법적 효력이 없습니다. 중요한 계약은 반드시 법률 전문가와 상담하세요.";

interface Rule {
  id: string;
  riskLevel: Exclude<RiskLevel, "missing">;
  type: AnalysisItem["type"];
  pattern: RegExp;
  reason: string;
  recommendation: string;
  legalTitles: string[];
}

const housingRules: Rule[] = [
  {
    id: "excessive-penalty",
    riskLevel: "danger",
    type: "unfavorable",
    pattern: /(보증금\s*전액|전액.*몰취|위약금.*전액|지체.*전액|하루라도.*보증금)/,
    reason: "과도한 위약금이나 보증금 전액 몰취 조항으로 볼 여지가 있습니다.",
    recommendation: "위약금 범위와 실제 손해 기준을 구체적으로 줄이고, 보증금 전액 몰취 표현은 삭제를 요청하세요.",
    legalTitles: ["민법", "주택임대차보호법"]
  },
  {
    id: "renewal-waiver",
    riskLevel: "danger",
    type: "illegal",
    pattern: /(계약갱신|갱신요구|갱신청구).*(포기|행사하지|불가)|포기.*(계약갱신|갱신요구|갱신청구)/,
    reason: "계약갱신요구권을 사전에 포기시키는 취지라면 법정 권리 제한 문제가 생길 수 있습니다.",
    recommendation: "계약갱신요구권 포기 문구를 삭제하고, 법에서 정한 예외 사유만 반영하도록 수정하세요.",
    legalTitles: ["주택임대차보호법"]
  },
  {
    id: "resident-registration-ban",
    riskLevel: "danger",
    type: "illegal",
    pattern: /(전입신고|확정일자).*(금지|불가|하지 않는다|못한다)/,
    reason: "전입신고나 확정일자를 막으면 보증금 보호에 직접적인 위험이 생깁니다.",
    recommendation: "전입신고와 확정일자를 제한하는 문구는 삭제를 요구하세요.",
    legalTitles: ["주택임대차보호법"]
  },
  {
    id: "all-repair-costs",
    riskLevel: "warning",
    type: "unfavorable",
    pattern: /(모든|일체의).*(수리|수선|보수|하자).*(임차인|세입자)|(임차인|세입자).*(모든|일체의).*(수리|수선|보수|하자)/,
    reason: "집 자체의 노후나 기본 하자까지 세입자에게 넘기는 문구일 수 있습니다.",
    recommendation: "입주 전 하자, 노후 설비, 구조 문제는 임대인 책임으로 분리해 적으세요.",
    legalTitles: ["민법"]
  },
  {
    id: "unauthorized-entry",
    riskLevel: "warning",
    type: "unfavorable",
    pattern: /(임대인|집주인).*(언제든|수시로|임의로).*(출입|방문)/,
    reason: "거주 중인 집에 집주인이 임의로 들어올 수 있다는 조항은 사생활 침해 위험이 큽니다.",
    recommendation: "긴급 상황을 제외하고 사전 통지와 동의를 조건으로 바꾸세요.",
    legalTitles: ["민법"]
  },
  {
    id: "brokerage-fee-shift",
    riskLevel: "warning",
    type: "unfavorable",
    pattern: /(중개수수료|중개보수).*(임차인|세입자).*(전액|모두|일체)/,
    reason: "법정 한도와 당사자 부담 범위를 넘어서는 중개보수 부담이 될 수 있습니다.",
    recommendation: "중개보수는 법정 한도와 실제 중개 주체 기준으로 다시 확인하세요.",
    legalTitles: ["공인중개사법"]
  }
];

const missingClauseChecks = [
  {
    key: "deposit-return",
    title: "보증금 반환 시점",
    pattern: /(보증금).*(반환|돌려|지급)|(반환|돌려|지급).*(보증금)/,
    whyItMatters: "언제 보증금을 돌려받는지 없으면 퇴거 시 분쟁이 생기기 쉽습니다.",
    recommendation: "퇴거 및 목적물 인도와 동시에 보증금을 반환한다는 문구를 넣으세요.",
    legalTitles: ["주택임대차보호법", "민법"]
  },
  {
    key: "repair-responsibility",
    title: "수리와 하자 책임",
    pattern: /(수리|수선|보수|하자|누수|고장)/,
    whyItMatters: "집 상태 문제와 생활 중 파손 책임을 나누지 않으면 세입자가 과도하게 부담할 수 있습니다.",
    recommendation: "입주 전 하자와 노후 설비는 임대인, 사용자 과실은 임차인 책임으로 구분하세요.",
    legalTitles: ["민법"]
  },
  {
    key: "move-in-protection",
    title: "전입신고와 확정일자",
    pattern: /(전입신고|확정일자|대항력|우선변제)/,
    whyItMatters: "보증금 보호에 필요한 절차가 빠져 있으면 사후 대응이 늦어질 수 있습니다.",
    recommendation: "전입신고와 확정일자를 방해하지 않는다는 확인 문구를 넣으세요.",
    legalTitles: ["주택임대차보호법"]
  },
  {
    key: "renewal-right",
    title: "계약갱신 관련 문구",
    pattern: /(계약갱신|갱신요구|갱신청구|재계약)/,
    whyItMatters: "갱신 절차가 빠져 있으면 계약 종료 시점에 다툼이 생길 수 있습니다.",
    recommendation: "계약갱신은 관련 법령에 따른다는 중립 문구를 넣으세요.",
    legalTitles: ["주택임대차보호법"]
  }
];

export function analyzeContractText(input: AnalyzeContractInput): ContractAnalysisResult {
  const normalizedText = normalizeText(input.contractText);
  const clauses = splitClauses(normalizedText);
  const items = clauses.map((clause, index) => analyzeClause(clause, index));
  const missingClauses = findMissingClauses(normalizedText);
  const summary = buildSummary(items, missingClauses);

  return {
    id: createAnalysisId(normalizedText),
    category: input.category,
    provider: "rule-based",
    createdAt: new Date().toISOString(),
    summary,
    items,
    missingClauses,
    legalReferences: housingLeaseLawReferences,
    disclaimer
  };
}

function analyzeClause(clause: string, index: number): AnalysisItem {
  const matchedRule = housingRules.find((rule) => rule.pattern.test(clause));
  const titleMatch = clause.match(/제\s*\d+\s*조\s*[^.\n]*/);
  const clauseTitle = titleMatch?.[0]?.trim() || `조항 ${index + 1}`;

  if (!matchedRule) {
    return {
      id: `clause-${index + 1}`,
      clauseTitle,
      originalText: clause,
      type: "normal",
      riskLevel: "safe",
      reason: "현재 문구만 보면 즉시 위험한 표현은 발견되지 않았습니다.",
      legalBasis: housingLeaseLawReferences,
      recommendation: "문제 없어 보이지만 금액, 날짜, 주소, 당사자 이름은 원문과 다시 대조하세요."
    };
  }

  return {
    id: matchedRule.id,
    clauseTitle,
    originalText: clause,
    type: matchedRule.type,
    riskLevel: matchedRule.riskLevel,
    reason: matchedRule.reason,
    legalBasis: matchedRule.legalTitles.flatMap(referenceByTitle),
    recommendation: matchedRule.recommendation
  };
}

function findMissingClauses(contractText: string): MissingClause[] {
  return missingClauseChecks
    .filter((check) => !check.pattern.test(contractText))
    .map((check) => ({
      key: check.key,
      title: check.title,
      riskLevel: "missing",
      whyItMatters: check.whyItMatters,
      recommendation: check.recommendation,
      legalBasis: check.legalTitles.flatMap(referenceByTitle)
    }));
}

function buildSummary(items: AnalysisItem[], missingClauses: MissingClause[]) {
  const riskyCount = items.filter((item) => item.riskLevel === "danger").length;
  const warningCount = items.filter((item) => item.riskLevel === "warning").length;
  const safeCount = items.filter((item) => item.riskLevel === "safe").length;
  const missingCount = missingClauses.length;
  const overallRisk = riskyCount > 0 ? "high" : warningCount + missingCount > 0 ? "medium" : "low";

  return {
    overallRisk,
    headline:
      overallRisk === "high"
        ? "서명 전에 반드시 고쳐야 할 위험 조항이 있습니다."
        : overallRisk === "medium"
          ? "불리하거나 빠진 조항이 있어 수정 확인이 필요합니다."
          : "즉시 위험한 조항은 적게 보입니다.",
    nextStep:
      overallRisk === "low"
        ? "금액, 주소, 날짜를 원본과 다시 확인한 뒤 보관하세요."
        : "집주인 또는 중개인에게 수정 문구를 요청하고, 큰 금액이면 전문가 검토를 받으세요.",
    riskyCount,
    warningCount,
    safeCount,
    missingCount
  } as const;
}

function splitClauses(contractText: string): string[] {
  const chunks = contractText
    .split(/(?=제\s*\d+\s*조)/g)
    .map((chunk) => chunk.trim())
    .filter(Boolean);

  return chunks.length > 0 ? chunks : [contractText];
}

function normalizeText(contractText: string): string {
  return contractText.replace(/\r\n/g, "\n").replace(/[ \t]+/g, " ").trim();
}

function createAnalysisId(contractText: string): string {
  let hash = 0;
  for (let index = 0; index < contractText.length; index += 1) {
    hash = (hash * 31 + contractText.charCodeAt(index)) >>> 0;
  }
  return `analysis-${hash.toString(16).padStart(8, "0")}`;
}
