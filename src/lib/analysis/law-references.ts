import type { LawReference } from "../contracts/types";
import type { ContractCategory } from "../contracts/types";

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

export const laborLawReferences: LawReference[] = [
  {
    title: "근로기준법",
    article: "제17조 근로조건 명시, 제20조 위약 예정 금지",
    source: "built-in",
    url: "https://www.law.go.kr/법령/근로기준법"
  },
  {
    title: "근로기준법",
    article: "제50조 근로시간, 제53조 연장근로 제한, 제54조 휴게",
    source: "built-in",
    url: "https://www.law.go.kr/법령/근로기준법"
  },
  {
    title: "근로기준법",
    article: "제55조 휴일, 제56조 연장ㆍ야간 및 휴일근로 가산임금, 제60조 연차 유급휴가",
    source: "built-in",
    url: "https://www.law.go.kr/법령/근로기준법"
  },
  {
    title: "최저임금법",
    article: "제6조 최저임금의 효력",
    source: "built-in",
    url: "https://www.law.go.kr/법령/최저임금법"
  },
  {
    title: "근로자퇴직급여보장법",
    article: "제4조 퇴직급여제도의 설정, 제8조 퇴직금 지급",
    source: "built-in",
    url: "https://www.law.go.kr/법령/근로자퇴직급여보장법"
  }
];

export const interiorLawReferences: LawReference[] = [
  {
    title: "건설산업기본법",
    article: "제2조 건설공사 정의, 제16조 건설공사 시공, 제28조 하도급 제한",
    source: "built-in",
    url: "https://www.law.go.kr/법령/건설산업기본법"
  },
  {
    title: "민법",
    article: "제664조 도급계약, 제665조 도급인의 수급인에 대한 담보청구, 제667조 수급인의 담보책임",
    source: "built-in",
    url: "https://www.law.go.kr/법령/민법"
  },
  {
    title: "소비자기본법",
    article: "제2조 정의, 제19조 소비자의 기본권리",
    source: "built-in",
    url: "https://www.law.go.kr/법령/소비자기본법"
  },
  {
    title: "인테리어 표준약관",
    article: "공정거래위원회 표준약관 (공사기간, 하자보수, 대금 지급 기준)",
    source: "built-in",
    url: "https://www.ftc.go.kr/www/selectStdConList.do?key=270"
  }
];

export const freelanceLawReferences: LawReference[] = [
  {
    title: "민법",
    article: "제680조 위임계약, 제684조 수임인의 보고의무, 제686조 수임인의 보수청구권",
    source: "built-in",
    url: "https://www.law.go.kr/법령/민법"
  },
  {
    title: "저작권법",
    article: "제2조 정의, 제9조 업무상저작물, 제45조 저작재산권의 양도",
    source: "built-in",
    url: "https://www.law.go.kr/법령/저작권법"
  },
  {
    title: "하도급거래 공정화에 관한 법률",
    article: "제2조 정의, 제3조 서면의 발급, 제13조 하도급대금 지급",
    source: "built-in",
    url: "https://www.law.go.kr/법령/하도급거래공정화에관한법률"
  },
  {
    title: "근로기준법",
    article: "특수형태근로종사자 보호 관련 조항",
    source: "built-in",
    url: "https://www.law.go.kr/법령/근로기준법"
  }
];

export function referencesForCategory(category: ContractCategory): LawReference[] {
  switch (category) {
    case "labor":
      return laborLawReferences;
    case "interior":
      return interiorLawReferences;
    case "freelance":
      return freelanceLawReferences;
    case "housing-lease":
    case "wedding":
    default:
      return housingLeaseLawReferences;
  }
}

export function referenceByTitle(title: string): LawReference[] {
  return [
    ...housingLeaseLawReferences,
    ...laborLawReferences,
    ...interiorLawReferences,
    ...freelanceLawReferences
  ].filter((reference) => reference.title === title);
}
