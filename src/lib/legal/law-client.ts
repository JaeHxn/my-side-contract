import type { ContractCategory, LawReference } from "../contracts/types";
import {
  mcpFetchLawArticle,
  mcpSearchPrecedents,
  mcpSearchInterpretationDecisions,
  mcpChainResearch,
} from "./mcp-law-client";
import {
  freelanceLawReferences,
  housingLeaseLawReferences,
  interiorLawReferences,
  laborLawReferences,
  referencesForCategory,
} from "../analysis/law-references";

const LAW_CACHE_TTL_MS = 24 * 60 * 60 * 1000;
const lawCache = new Map<string, { references: LawReference[]; expiresAt: number }>();

interface LawApiQuery {
  query: string;
  articles: string[];
}

export async function fetchHousingLeaseLawReferences(): Promise<LawReference[]> {
  return fetchLawReferencesForCategory("housing-lease");
}

const categoryQueries: Record<ContractCategory, LawApiQuery[]> = {
  "housing-lease": [
    { query: "주택임대차보호법", articles: ["4", "3", "6", "6의3", "7"] },
    { query: "민법", articles: ["398", "623", "626"] },
    { query: "공인중개사법", articles: ["25", "32"] },
  ],
  labor: [
    { query: "근로기준법", articles: ["17", "20", "50", "53", "54", "56", "60"] },
    { query: "최저임금법", articles: ["6"] },
    { query: "근로자퇴직급여 보장법", articles: ["4", "8"] },
  ],
  wedding: [
    { query: "소비자기본법", articles: ["19", "55"] },
    { query: "약관의 규제에 관한 법률", articles: ["6", "8", "9"] },
  ],
  interior: [
    { query: "건설산업기본법", articles: ["16", "28"] },
    { query: "민법", articles: ["664", "665", "667", "670"] },
    { query: "소비자기본법", articles: ["19"] },
  ],
  freelance: [
    { query: "민법", articles: ["680", "684", "686"] },
    { query: "저작권법", articles: ["45", "46"] },
    { query: "하도급거래 공정화에 관한 법률", articles: ["3", "13", "25"] },
  ],
};

function fallbackReferencesForCategory(category: ContractCategory): LawReference[] {
  switch (category) {
    case "labor":
      return laborLawReferences;
    case "interior":
      return interiorLawReferences;
    case "freelance":
      return freelanceLawReferences;
    case "housing-lease":
      return housingLeaseLawReferences;
    default:
      return referencesForCategory(category);
  }
}

/** "6의3" → "제6조의3", "17" → "제17조" */
function toJoParam(articleNumber: string): string {
  const normalized = articleNumber.trim();
  const match = normalized.match(/^(\d+)(?:의(\d+))?$/);
  if (!match) return `제${normalized}조`;
  const main = match[1];
  const branch = match[2];
  return branch ? `제${main}조의${branch}` : `제${main}조`;
}

async function fetchArticleReference(
  lawName: string,
  articleNumber: string,
  checkedAt: string
): Promise<LawReference | null> {
  const jo = toJoParam(articleNumber);
  const text = await mcpFetchLawArticle(lawName, jo);
  if (!text) return null;

  return {
    title: lawName,
    article: jo,
    excerpt: text.replace(/\s+/g, " ").trim().slice(0, 500),
    source: "mcp",
    url: `https://www.law.go.kr/법령/${encodeURIComponent(lawName)}`,
    lastChecked: checkedAt,
  };
}

async function fetchLawReferencesViaMcp(query: LawApiQuery): Promise<LawReference[]> {
  const checkedAt = new Date().toISOString();
  const results = await Promise.allSettled(
    query.articles.map((article) => fetchArticleReference(query.query, article, checkedAt))
  );

  return results
    .filter((r): r is PromiseFulfilledResult<LawReference | null> => r.status === "fulfilled")
    .map((r) => r.value)
    .filter((r): r is LawReference => r !== null);
}

export async function fetchLawReferencesForCategory(
  category: ContractCategory
): Promise<LawReference[]> {
  const cached = lawCache.get(category);
  if (cached && cached.expiresAt > Date.now()) return cached.references;

  const fallback = fallbackReferencesForCategory(category);
  const queries = categoryQueries[category] ?? [];
  if (queries.length === 0) return fallback;

  const results = await Promise.allSettled(queries.map(fetchLawReferencesViaMcp));
  const references = dedupeLawReferences(
    results
      .filter((r): r is PromiseFulfilledResult<LawReference[]> => r.status === "fulfilled")
      .flatMap((r) => r.value)
  );

  if (references.length === 0) return fallback;

  lawCache.set(category, { references, expiresAt: Date.now() + LAW_CACHE_TTL_MS });
  return references;
}

// ── MCP 판례·해석례 강화 조회 ───────────────────────────────────────────

const MCP_CACHE_TTL_MS = 12 * 60 * 60 * 1000;
const mcpCache = new Map<string, { references: LawReference[]; expiresAt: number }>();

const mcpCategoryQueries: Record<ContractCategory, { precedent: string; interpretation: string }> =
  {
    "housing-lease": {
      precedent: "주택임대차 계약갱신",
      interpretation: "주택임대차보호법",
    },
    labor: {
      precedent: "근로기준법 포괄임금",
      interpretation: "근로기준법 최저임금",
    },
    interior: {
      precedent: "도급 하자담보책임",
      interpretation: "건설산업기본법",
    },
    freelance: {
      precedent: "저작권 양도",
      interpretation: "하도급법",
    },
    wedding: {
      precedent: "소비자 계약 취소 위약금",
      interpretation: "소비자분쟁해결기준",
    },
  };

export async function fetchMcpEnhancedReferences(
  category: ContractCategory
): Promise<LawReference[]> {
  const cached = mcpCache.get(category);
  if (cached && cached.expiresAt > Date.now()) return cached.references;

  const { precedent, interpretation } = mcpCategoryQueries[category];
  const checkedAt = new Date().toISOString();

  const [precedentResult, interpretationResult] = await Promise.allSettled([
    mcpSearchPrecedents(precedent),
    mcpSearchInterpretationDecisions(interpretation).catch(() => mcpChainResearch(interpretation)),
  ]);

  const references: LawReference[] = [];

  if (precedentResult.status === "fulfilled" && precedentResult.value) {
    references.push({
      title: "관련 판례",
      excerpt: precedentResult.value.slice(0, 600),
      source: "mcp",
      lastChecked: checkedAt,
    });
  }

  if (interpretationResult.status === "fulfilled" && interpretationResult.value) {
    references.push({
      title: "행정해석·해석례",
      excerpt: interpretationResult.value.slice(0, 600),
      source: "mcp",
      lastChecked: checkedAt,
    });
  }

  if (references.length > 0) {
    mcpCache.set(category, { references, expiresAt: Date.now() + MCP_CACHE_TTL_MS });
  }

  return references;
}

// ─────────────────────────────────────────────────────────────────────────────

function dedupeLawReferences(references: LawReference[]): LawReference[] {
  const seen = new Set<string>();
  const deduped: LawReference[] = [];

  for (const reference of references) {
    const key = [reference.title, reference.article ?? "", reference.excerpt ?? ""].join("|");
    if (!seen.has(key)) {
      seen.add(key);
      deduped.push(reference);
    }
  }

  return deduped;
}
