import { analyzeContractText } from "./rule-based";
import { maybeEnhanceWithAi } from "./ai-provider";
import { fetchHousingLeaseLawReferences } from "../legal/law-client";
import type { AnalyzeContractInput } from "../contracts/types";

export async function analyzeContract(input: AnalyzeContractInput) {
  const baseAnalysis = analyzeContractText(input);
  const lawReferences = await fetchHousingLeaseLawReferences();
  const withLaws = {
    ...baseAnalysis,
    legalReferences: lawReferences
  };

  return maybeEnhanceWithAi(withLaws, input.contractText);
}
