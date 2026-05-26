import type { ContractCategory, LawReference } from "../contracts/types";
import {
  freelanceLawReferences,
  housingLeaseLawReferences,
  interiorLawReferences,
  laborLawReferences,
  referencesForCategory
} from "../analysis/law-references";

const LAW_CACHE_TTL_MS = 24 * 60 * 60 * 1000;
const lawCache = new Map<string, { references: LawReference[]; expiresAt: number }>();

interface LawApiDocument {
  title: string;
  id?: string;
  mst?: string;
  url?: string;
}

interface LawApiQuery {
  query: string;
  articles: string[];
}

const LAW_API_MAX_ATTEMPTS = 3;

export async function fetchHousingLeaseLawReferences(): Promise<LawReference[]> {
  return fetchLawReferencesForCategory("housing-lease");
}

const categoryQueries: Record<ContractCategory, LawApiQuery[]> = {
  "housing-lease": [
    { query: "주택임대차보호법", articles: ["4", "3", "6", "6의3", "7"] },
    { query: "민법 임대차", articles: ["398", "623", "626"] },
    { query: "공인중개사법", articles: ["25", "32"] }
  ],
  labor: [
    { query: "근로기준법", articles: ["17", "20", "50", "53", "54", "56", "60"] },
    { query: "최저임금법", articles: ["6"] },
    { query: "근로자퇴직급여 보장법", articles: ["4", "8"] }
  ],
  wedding: [
    { query: "소비자기본법", articles: ["19", "55"] },
    { query: "약관의 규제에 관한 법률", articles: ["6", "8", "9"] }
  ],
  interior: [
    { query: "건설산업기본법", articles: ["16", "28"] },
    { query: "민법 도급", articles: ["664", "665", "667", "670"] },
    { query: "소비자기본법", articles: ["19"] }
  ],
  freelance: [
    { query: "민법 위임", articles: ["680", "684", "686"] },
    { query: "저작권법", articles: ["45", "46"] },
    { query: "하도급거래 공정화에 관한 법률", articles: ["3", "13", "25"] }
  ]
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

/**
 * 카테고리별로 국가법령정보센터(법령 API)에서 관련 법령을 조회한다.
 * - API 키(LAW_API_OC)가 없거나 응답이 비어 있으면 built-in 참조로 폴백한다.
 * - 어떤 요청이 실패해도 다른 카테고리 결과는 그대로 사용한다.
 */
export async function fetchLawReferencesForCategory(category: ContractCategory): Promise<LawReference[]> {
  const cached = lawCache.get(category);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.references;
  }

  const oc = process.env.LAW_API_OC;
  const fallback = fallbackReferencesForCategory(category);

  if (!oc) {
    return fallback;
  }

  const queries = categoryQueries[category] ?? [];
  if (queries.length === 0) {
    return fallback;
  }

  const results = await Promise.allSettled(queries.map((query) => fetchLawReferencesForQuery(query, oc)));
  const references = dedupeLawReferences(
    results
      .filter((result): result is PromiseFulfilledResult<LawReference[]> => result.status === "fulfilled")
      .flatMap((result) => result.value)
  );

  if (references.length === 0) {
    return fallback;
  }

  lawCache.set(category, { references, expiresAt: Date.now() + LAW_CACHE_TTL_MS });
  return references;
}

async function fetchLawReferencesForQuery(query: LawApiQuery, oc: string): Promise<LawReference[]> {
  const documents = await searchLawApi(query.query, oc);
  const checkedAt = new Date().toISOString();
  const references = await Promise.allSettled(
    documents.map((document) => fetchLawDocumentReferences(document, query.articles, oc, checkedAt))
  );

  return references
    .filter((result): result is PromiseFulfilledResult<LawReference[]> => result.status === "fulfilled")
    .flatMap((result) => result.value);
}

async function fetchLawDocumentReferences(
  document: LawApiDocument,
  articles: string[],
  oc: string,
  checkedAt: string
): Promise<LawReference[]> {
  if (!document.id && !document.mst) {
    return [toLawReference(document, checkedAt)];
  }

  const articleResults = await Promise.allSettled(
    articles.map((articleNumber) => fetchLawArticle(document, articleNumber, oc, checkedAt))
  );
  const articleReferences = articleResults
    .filter((result): result is PromiseFulfilledResult<LawReference | null> => result.status === "fulfilled")
    .map((result) => result.value)
    .filter((reference): reference is LawReference => reference !== null);

  return articleReferences.length > 0 ? articleReferences : [toLawReference(document, checkedAt)];
}

async function searchLawApi(query: string, oc: string): Promise<LawApiDocument[]> {
  const params = new URLSearchParams({
    OC: oc,
    target: "law",
    type: "JSON",
    query,
    display: "1"
  });

  const payload = await fetchLawApiJson(
    `https://www.law.go.kr/DRF/lawSearch.do?${params.toString()}`,
    "Law API request failed"
  );
  return parseLawSearchPayload(payload);
}

async function fetchLawArticle(
  document: LawApiDocument,
  articleNumber: string,
  oc: string,
  checkedAt: string
): Promise<LawReference | null> {
  const params = new URLSearchParams({
    OC: oc,
    target: "lawjosub",
    type: "JSON",
    JO: toLawApiArticleNumber(articleNumber)
  });

  if (document.id) {
    params.set("ID", document.id);
  } else if (document.mst) {
    params.set("MST", document.mst);
  } else {
    throw new Error("Law API article request requires ID or MST.");
  }

  const payload = await fetchLawApiJson(
    `https://www.law.go.kr/DRF/lawService.do?${params.toString()}`,
    "Law API article request failed"
  );
  const article = parseLawArticlePayload(payload, articleNumber);

  if (!article) {
    return null;
  }

  return {
    title: document.title,
    article: article.title,
    excerpt: article.excerpt,
    source: "law-api",
    url: document.url,
    lastChecked: checkedAt
  };
}

async function fetchLawApiJson(url: string, errorMessage: string): Promise<Record<string, unknown>> {
  let lastError: unknown;

  for (let attempt = 0; attempt < LAW_API_MAX_ATTEMPTS; attempt += 1) {
    try {
      const response = await fetch(url, {
        headers: {
          Accept: "application/json"
        },
        cache: "no-store"
      });

      if (!response.ok) {
        throw new Error(`${errorMessage}: ${response.status}`);
      }

      return (await response.json()) as Record<string, unknown>;
    } catch (error) {
      lastError = error;
    }
  }

  if (lastError instanceof Error) {
    throw lastError;
  }

  throw new Error(errorMessage);
}

function parseLawSearchPayload(payload: Record<string, unknown>): LawApiDocument[] {
  const searchRoot = payload.LawSearch as Record<string, unknown> | undefined;
  const rawLaw = searchRoot?.law ?? searchRoot?.["법령"] ?? payload.law;
  const rows = Array.isArray(rawLaw) ? rawLaw : rawLaw ? [rawLaw] : [];

  return rows
    .map((row): LawApiDocument | null => {
      if (!row || typeof row !== "object") {
        return null;
      }

      const record = row as Record<string, unknown>;
      const title = String(record.법령명한글 ?? record.lawName ?? record.법령명 ?? "");
      const url = createPublicLawUrl(title, record.법령상세링크);
      const id = optionalString(record.법령ID ?? record.lawId ?? record.ID);
      const mst = optionalString(record.법령일련번호 ?? record.MST ?? record.mst ?? record.lsiSeq);

      if (!title) {
        return null;
      }

      return {
        title,
        ...(id ? { id } : {}),
        ...(mst ? { mst } : {}),
        ...(url ? { url } : {})
      };
    })
    .filter((document): document is LawApiDocument => document !== null);
}

function parseLawArticlePayload(
  payload: Record<string, unknown>,
  fallbackArticleNumber: string
): { title: string; excerpt: string } | null {
  const units = collectArticleUnits(payload);
  const unit = units[0];

  if (!unit) {
    const fallbackText = excerptText(collectContentTexts(payload).join(" "));
    return fallbackText
      ? {
          title: `제${fallbackArticleNumber}조`,
          excerpt: fallbackText
        }
      : null;
  }

  const rawNumber = optionalString(unit.조문번호 ?? unit.articleNo) ?? fallbackArticleNumber;
  const rawTitle = optionalString(unit.조문제목 ?? unit.articleTitle);
  const content = excerptText(collectContentTexts(unit).join(" "));

  if (!content) {
    return null;
  }

  return {
    title: [`제${rawNumber}조`, rawTitle].filter(Boolean).join(" "),
    excerpt: content
  };
}

function collectArticleUnits(input: unknown): Record<string, unknown>[] {
  if (Array.isArray(input)) {
    return input.flatMap(collectArticleUnits);
  }

  if (!input || typeof input !== "object") {
    return [];
  }

  const record = input as Record<string, unknown>;
  const current = record.조문내용 || record.articleContent ? [record] : [];

  return [
    ...current,
    ...Object.entries(record).flatMap(([key, value]) => (key === "조문단위" ? toRecordArray(value) : collectArticleUnits(value)))
  ];
}

function toRecordArray(value: unknown): Record<string, unknown>[] {
  const rows = Array.isArray(value) ? value : value ? [value] : [];
  return rows.filter((row): row is Record<string, unknown> => Boolean(row) && typeof row === "object");
}

function collectContentTexts(input: unknown): string[] {
  if (Array.isArray(input)) {
    return input.flatMap(collectContentTexts);
  }

  if (!input || typeof input !== "object") {
    return [];
  }

  const record = input as Record<string, unknown>;
  const directTexts = Object.entries(record)
    .filter(([key, value]) => (key.endsWith("내용") || key.endsWith("Content")) && typeof value === "string")
    .map(([, value]) => String(value));

  return [...directTexts, ...Object.values(record).flatMap(collectContentTexts)];
}

function toLawReference(document: LawApiDocument, checkedAt: string): LawReference {
  return {
    title: document.title,
    source: "law-api",
    url: document.url,
    lastChecked: checkedAt
  };
}

function toLawApiArticleNumber(articleNumber: string): string {
  const normalized = articleNumber.trim();
  const match = normalized.match(/^(\d+)(?:의(\d+))?$/);

  if (!match) {
    return normalized;
  }

  const main = match[1]?.padStart(4, "0") ?? "0000";
  const branch = match[2]?.padStart(2, "0") ?? "00";
  return `${main}${branch}`;
}

function excerptText(value: string): string {
  return value.replace(/\s+/g, " ").trim().slice(0, 500);
}

function optionalString(value: unknown): string | undefined {
  const text = typeof value === "string" || typeof value === "number" ? String(value).trim() : "";
  return text || undefined;
}

function createPublicLawUrl(title: string, rawLink: unknown): string | undefined {
  if (!title) {
    return undefined;
  }

  const link = optionalString(rawLink);
  if (!link || link.includes("OC=") || link.includes("/DRF/")) {
    return `https://www.law.go.kr/법령/${title}`;
  }

  return link.startsWith("http") ? link : `https://www.law.go.kr${link}`;
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
