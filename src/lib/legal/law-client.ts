import type { ContractCategory, LawReference } from "../contracts/types";
import {
  freelanceLawReferences,
  housingLeaseLawReferences,
  interiorLawReferences,
  laborLawReferences,
  referencesForCategory
} from "../analysis/law-references";

interface LawApiDocument {
  title: string;
  url?: string;
}

export async function fetchHousingLeaseLawReferences(): Promise<LawReference[]> {
  const oc = process.env.LAW_API_OC;
  if (!oc) {
    return housingLeaseLawReferences;
  }

  const results = await Promise.allSettled([
    searchLawApi("주택임대차보호법", oc),
    searchLawApi("민법 임대차", oc),
    searchLawApi("공인중개사법", oc)
  ]);

  const documents = results
    .filter((result): result is PromiseFulfilledResult<LawApiDocument[]> => result.status === "fulfilled")
    .flatMap((result) => result.value);

  if (documents.length === 0) {
    return housingLeaseLawReferences;
  }

  const checkedAt = new Date().toISOString();
  return documents.map((document) => ({
    title: document.title,
    source: "law-api",
    url: document.url,
    lastChecked: checkedAt
  }));
}

const categoryQueries: Record<ContractCategory, string[]> = {
  "housing-lease": ["주택임대차보호법", "민법 임대차", "공인중개사법"],
  labor: ["근로기준법", "최저임금법", "근로자퇴직급여 보장법"],
  wedding: ["소비자기본법", "약관의 규제에 관한 법률"],
  interior: ["건설산업기본법", "민법 도급", "소비자기본법"],
  freelance: ["민법 위임", "저작권법", "하도급거래 공정화에 관한 법률"]
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
  const oc = process.env.LAW_API_OC;
  const fallback = fallbackReferencesForCategory(category);

  if (!oc) {
    return fallback;
  }

  const queries = categoryQueries[category] ?? [];
  if (queries.length === 0) {
    return fallback;
  }

  const results = await Promise.allSettled(queries.map((query) => searchLawApi(query, oc)));
  const documents = results
    .filter((result): result is PromiseFulfilledResult<LawApiDocument[]> => result.status === "fulfilled")
    .flatMap((result) => result.value);

  if (documents.length === 0) {
    return fallback;
  }

  const checkedAt = new Date().toISOString();
  return documents.map((document) => ({
    title: document.title,
    source: "law-api",
    url: document.url,
    lastChecked: checkedAt
  }));
}

async function searchLawApi(query: string, oc: string): Promise<LawApiDocument[]> {
  const params = new URLSearchParams({
    OC: oc,
    target: "law",
    type: "JSON",
    query
  });

  const response = await fetch(`https://www.law.go.kr/DRF/lawSearch.do?${params.toString()}`, {
    headers: {
      Accept: "application/json"
    },
    cache: "no-store"
  });

  if (!response.ok) {
    throw new Error(`Law API request failed: ${response.status}`);
  }

  const payload = (await response.json()) as Record<string, unknown>;
  return parseLawSearchPayload(payload);
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
      const url = record.법령상세링크 ? `https://www.law.go.kr${String(record.법령상세링크)}` : undefined;

      if (!title) {
        return null;
      }

      return url ? { title, url } : { title };
    })
    .filter((document): document is LawApiDocument => document !== null);
}
