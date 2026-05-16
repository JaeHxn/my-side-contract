import type { LawReference } from "../contracts/types";
import { housingLeaseLawReferences } from "../analysis/law-references";

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
    .map((row) => {
      if (!row || typeof row !== "object") {
        return null;
      }

      const record = row as Record<string, unknown>;
      const title = String(record.법령명한글 ?? record.lawName ?? record.법령명 ?? "");
      const url = record.법령상세링크 ? `https://www.law.go.kr${String(record.법령상세링크)}` : undefined;

      return title ? { title, url } : null;
    })
    .filter((document): document is LawApiDocument => Boolean(document));
}
