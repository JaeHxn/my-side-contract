import type { ContractCategory } from "./types";

export const categoryLabels: Record<ContractCategory, string> = {
  "housing-lease": "전월세 계약서",
  labor: "근로 계약서",
  wedding: "웨딩 계약서",
  interior: "인테리어 계약서",
  freelance: "프리랜서 계약서"
};

export const enabledCategories = [
  "housing-lease",
  "labor",
  "interior",
  "freelance"
] as const satisfies readonly ContractCategory[];
