import { analyzeContractText } from "./rule-based";
import { maybeEnhanceWithAi } from "./ai-provider";
import { fetchLawReferencesForCategory } from "../legal/law-client";
import type { AnalyzeContractInput, LawReference } from "../contracts/types";
import { referencesForCategory } from "./law-references";

export async function analyzeContract(input: AnalyzeContractInput) {
  const baseAnalysis = analyzeContractText(input);
  const lawReferences = await resolveLawReferences(input.category);
  const withLaws = {
    ...baseAnalysis,
    legalReferences: lawReferences
  };

  return maybeEnhanceWithAi(withLaws, input.contractText, input.category);
}

async function resolveLawReferences(category: AnalyzeContractInput["category"]): Promise<LawReference[]> {
  try {
    return await fetchLawReferencesForCategory(category);
  } catch {
    // 법령 API 오류 시에도 분석 흐름을 막지 않도록 built-in 참조로 graceful fallback
    return referencesForCategory(category);
  }
}
