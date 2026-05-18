import { analyzeContractText } from "./rule-based";
import { maybeEnhanceWithAi } from "./ai-provider";
import { fetchLawReferencesForCategory } from "../legal/law-client";
import type { AnalyzeContractInput, ContractAnalysisResult, LawReference } from "../contracts/types";
import { referencesForCategory } from "./law-references";

export async function analyzeContract(input: AnalyzeContractInput) {
  const baseAnalysis = analyzeContractText(input);
  const lawReferences = await resolveLawReferences(input.category);
  const withLaws = applyLiveLawReferences(baseAnalysis, lawReferences);

  return maybeEnhanceWithAi({
    ...withLaws,
    legalReferences: lawReferences
  }, input.contractText, input.category);
}

async function resolveLawReferences(category: AnalyzeContractInput["category"]): Promise<LawReference[]> {
  try {
    return await fetchLawReferencesForCategory(category);
  } catch {
    // 법령 API 오류 시에도 분석 흐름을 막지 않도록 built-in 참조로 graceful fallback
    return referencesForCategory(category);
  }
}

function applyLiveLawReferences(
  analysis: ContractAnalysisResult,
  lawReferences: LawReference[]
): ContractAnalysisResult {
  const liveLawReferences = lawReferences.filter((reference) => reference.source === "law-api");

  if (liveLawReferences.length === 0) {
    return analysis;
  }

  const lookup = createLawReferenceLookup(liveLawReferences);

  return {
    ...analysis,
    items: analysis.items.map((item) => ({
      ...item,
      legalBasis: replaceBuiltInReferences(item.legalBasis, lookup)
    })),
    missingClauses: analysis.missingClauses.map((clause) => ({
      ...clause,
      legalBasis: replaceBuiltInReferences(clause.legalBasis, lookup)
    }))
  };
}

function createLawReferenceLookup(lawReferences: LawReference[]): Map<string, LawReference[]> {
  const lookup = new Map<string, LawReference[]>();

  for (const reference of lawReferences) {
    const key = normalizeLawTitle(reference.title);
    const current = lookup.get(key) ?? [];
    current.push(reference);
    lookup.set(key, current);
  }

  return lookup;
}

function replaceBuiltInReferences(references: LawReference[], lookup: Map<string, LawReference[]>): LawReference[] {
  const replaced = references.flatMap((reference) => {
    const liveReferences = lookup.get(normalizeLawTitle(reference.title));
    return liveReferences && liveReferences.length > 0 ? liveReferences : [reference];
  });

  return dedupeLawReferences(replaced);
}

function dedupeLawReferences(references: LawReference[]): LawReference[] {
  const seen = new Set<string>();
  const deduped: LawReference[] = [];

  for (const reference of references) {
    const key = [reference.title, reference.article || "", reference.excerpt || ""].join("|");
    if (!seen.has(key)) {
      seen.add(key);
      deduped.push(reference);
    }
  }

  return deduped;
}

function normalizeLawTitle(title: string): string {
  return title.replace(/\s+/g, "");
}
