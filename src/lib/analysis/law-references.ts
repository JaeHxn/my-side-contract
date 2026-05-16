import type { LawReference } from "../contracts/types";

export const housingLeaseLawReferences: LawReference[] = [
  {
    title: "주택임대차보호법",
    article: "대항력, 보증금 보호, 계약갱신요구권 관련 조항",
    source: "built-in",
    url: "https://www.law.go.kr/법령/주택임대차보호법"
  },
  {
    title: "민법",
    article: "임대차, 손해배상, 위약금 관련 조항",
    source: "built-in",
    url: "https://www.law.go.kr/법령/민법"
  },
  {
    title: "공인중개사법",
    article: "중개대상물 확인설명, 중개보수 관련 조항",
    source: "built-in",
    url: "https://www.law.go.kr/법령/공인중개사법"
  }
];

export function referenceByTitle(title: string): LawReference[] {
  return housingLeaseLawReferences.filter((reference) => reference.title === title);
}
