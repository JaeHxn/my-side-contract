import type { ContractCategory } from "../contracts/types";
import type { LawReference } from "../contracts/types";

export const OPENAI_RESPONSES_URL = "https://api.openai.com/v1/responses";
export const DEFAULT_OPENAI_ANALYSIS_MODEL = "gpt-5.4-mini";
export const DEFAULT_OPENAI_OCR_MODEL = "gpt-5.4-mini";
export const MAX_AI_CONTRACT_TEXT_CHARS = 6000;

interface CategoryPromptProfile {
  /** 변호사 페르소나에 들어가는 전문 분야 묘사 */
  expertise: string;
  /** 한 줄 계약서 유형 설명 */
  contractDescription: string;
  /** 시스템 프롬프트에 그대로 주입되는 핵심 법령 목록 (조항까지 포함) */
  primaryLaws: string[];
  /** 분석 시 반드시 검토해야 하는 5~7개 체크포인트 */
  focusPoints: string[];
}

const categoryProfiles: Record<ContractCategory, CategoryPromptProfile> = {
  "housing-lease": {
    expertise: "주택임대차·부동산 거래 분야",
    contractDescription: "주택 임대차 계약서 (전월세, 보증부 월세 포함)",
    primaryLaws: [
      "주택임대차보호법 제3조(대항력), 제3조의2(보증금의 회수), 제6조(계약의 갱신), 제6조의3(계약갱신요구 등), 제7조(차임 등의 증감청구권), 제10조(강행규정)",
      "민법 제618조 이하 임대차편, 제398조(배상액의 예정), 제627조(일부멸실 등과 차임감액청구권)",
      "공인중개사법 제25조(중개대상물 확인·설명의무), 제32조(중개보수)"
    ],
    focusPoints: [
      "보증금 반환 시점과 회수 보장 (대항력, 우선변제권)",
      "계약갱신요구권의 사전 포기 또는 제한 여부",
      "전입신고·확정일자 방해 조항",
      "위약금·보증금 몰취의 과도성",
      "수리·하자 책임의 임대인↔임차인 배분",
      "중개보수의 법정 한도 준수",
      "임대인의 임의 출입 등 사생활 침해 조항"
    ]
  },
  labor: {
    expertise: "노동법·근로계약 분야",
    contractDescription: "근로 계약서 (정규직·계약직·아르바이트·기간제 포함)",
    primaryLaws: [
      "근로기준법 제17조(근로조건의 명시), 제20조(위약 예정의 금지), 제43조(임금 지급), 제50조(근로시간), 제53조(연장근로의 제한), 제54조(휴게), 제55조(휴일), 제56조(연장·야간 및 휴일 근로), 제60조(연차 유급휴가)",
      "최저임금법 제6조(최저임금의 효력), 제5조의2(수습 사용 중인 자에 대한 최저임금액)",
      "근로자퇴직급여 보장법 제4조(퇴직급여제도의 설정), 제8조(퇴직금제도의 설정 등)"
    ],
    focusPoints: [
      "위약금·손해배상 예정 (근로기준법 제20조 위반)",
      "포괄임금제로 연장·야간·휴일근로 수당 미지급",
      "법정 근로시간(주 52시간) 초과",
      "휴게시간·주휴일·연차 유급휴가의 박탈 또는 사전 포기",
      "최저임금 미달 또는 임금 산정방식 모호",
      "수습기간 임금 감액의 적법성 (최대 3개월, 10% 감액 한도)",
      "퇴직금·4대 보험 가입 여부"
    ]
  },
  wedding: {
    expertise: "소비자 계약·서비스업 분야",
    contractDescription: "웨딩 계약서 (예식장, 스튜디오·드레스·메이크업, 웨딩플래너 포함)",
    primaryLaws: [
      "소비자기본법 제19조(소비자의 기본권리), 제55조(피해구제의 신청 등)",
      "민법 제398조(배상액의 예정), 제674조(완성된 일에 대한 위험부담)",
      "공정거래위원회 결혼중개업 표준약관, 소비자분쟁해결기준(공정거래위원회 고시) 결혼식장업·결혼준비대행업 기준"
    ],
    focusPoints: [
      "계약 해제·해지 시 위약금 (소비자분쟁해결기준 대비 과도성)",
      "예식 일자 변경 시 위약금 산정",
      "스드메 패키지의 추가요금·옵션강매",
      "원본 사진·영상의 저작권과 추가비용",
      "최소 보증 인원과 음식 단가 변경 조건",
      "사업자 귀책사유 시 손해배상"
    ]
  },
  interior: {
    expertise: "건설·인테리어 도급계약 분야",
    contractDescription: "인테리어·리모델링 공사 도급계약서",
    primaryLaws: [
      "건설산업기본법 제2조(정의), 제16조(건설공사의 시공자격), 제28조(건설공사 수급인 등의 하자담보책임), 제28조의2(건설공사의 직접시공)",
      "민법 제664조(도급계약), 제665조(보수의 지급시기), 제667조(수급인의 담보책임), 제668조(동전-도급인의 해제권), 제670조(담보책임의 존속기간)",
      "소비자기본법 제19조(소비자의 기본권리), 소비자분쟁해결기준 중 '인테리어업' 항목",
      "공정거래위원회 실내건축·창호공사 표준계약서"
    ],
    focusPoints: [
      "공사대금 지급구조 (착수금·중도금·잔금 비율, 선지급 100% 위험)",
      "착공일·준공일 명시와 지체상금",
      "하자담보책임 기간(통상 1~2년)과 무상보수 범위",
      "자재 명세 (브랜드·모델·규격) 첨부 여부",
      "설계변경·추가공사의 서면 합의 의무",
      "발주자(건축주)의 현장 감리·방문권 보장",
      "준공 검수 기준과 인도 거부권"
    ]
  },
  freelance: {
    expertise: "프리랜서·용역·도급 계약 및 저작권 분야",
    contractDescription: "프리랜서·외주·용역 계약서 (디자인·개발·번역·콘텐츠 제작 등)",
    primaryLaws: [
      "민법 제680조(위임의 의의), 제684조(수임인의 보고의무), 제686조(수임인의 보수청구권), 제664조 이하 도급편",
      "저작권법 제2조(정의), 제9조(업무상저작물의 저작자), 제45조(저작재산권의 양도), 제46조(저작물의 이용허락), 제100조(영상저작물에 대한 권리)",
      "하도급거래 공정화에 관한 법률 제2조(정의), 제3조(서면의 발급 및 서류의 보존), 제13조(하도급대금의 지급 등), 제25조(부당한 위탁취소의 금지 등)",
      "근로기준법 (특수형태근로종사자 보호 관련 조항)"
    ],
    focusPoints: [
      "저작권 양도 범위와 시점 (대금 완납 시점 명시, 2차적저작물작성권 포함 여부)",
      "납품물(deliverable) 범위와 작업 외 항목의 명확화",
      "대금 지급기한 (하도급법상 납품 후 60일 이내, 지연이자)",
      "수정 횟수 한도와 추가 수정 단가",
      "비밀유지(NDA) 범위의 합리성 (공개정보·독자개발 정보 예외)",
      "겸업·경업금지 조항의 범위와 기간",
      "위약금·손해배상 예정의 과도성"
    ]
  }
};

/**
 * 전문 변호사 수준의 한국어 계약서 검토 프롬프트를 생성한다.
 * - 시스템 페르소나: 15년 경력 계약법 전문 변호사
 * - 출력: 구조화된 한국어 리포트 (전체 위험도 → 조항별 분석 → 누락 사항 → 종합 조언)
 */
export function buildContractAnalysisPrompt(
  redactedContractText: string,
  category: ContractCategory = "housing-lease",
  legalReferences: LawReference[] = []
): string {
  const contractExcerpt = redactedContractText.slice(0, MAX_AI_CONTRACT_TEXT_CHARS);
  const profile = categoryProfiles[category];

  const liveLawReferences = legalReferences.filter((reference) => reference.source === "law-api").slice(0, 12);
  const lawsIntro =
    liveLawReferences.length > 0
      ? "[국가법령정보센터 API에서 조회한 현재 법령 조문]"
      : "[검토 시 반드시 인용해야 하는 핵심 법령]";
  const lawsBlock =
    liveLawReferences.length > 0
      ? liveLawReferences.map(formatLiveLawReference).join("\n")
      : profile.primaryLaws.map((law, index) => `  ${index + 1}. ${law}`).join("\n");
  const focusBlock = profile.focusPoints.map((point) => `  - ${point}`).join("\n");

  return [
    "[역할]",
    `당신은 대한민국에서 15년간 ${profile.expertise}를 전문으로 활동해 온 변호사입니다.`,
    `오늘은 의뢰인이 가져온 ${profile.contractDescription}를 검토하여, 법무법인 검토의견서 수준의 한국어 리포트를 작성합니다.`,
    "",
    lawsIntro,
    lawsBlock,
    "",
    "[이 계약 유형에서 반드시 짚어야 할 체크포인트]",
    focusBlock,
    "",
    "[분석 관점 — 5가지 모두 적용]",
    "  1. 위법성: 강행규정 위반 여부 (해당 조문 번호 인용)",
    "  2. 불균형성: 일방에 과도하게 불리한 조항 (불공정약관 소지)",
    "  3. 누락 조항: 분쟁 예방을 위해 반드시 있어야 하나 빠진 항목",
    "  4. 법령 충돌 소지: 명시적 위반은 아니지만 다툼이 예상되는 표현",
    "  5. 수정 권고: 의뢰인 입장에서 어떻게 고치도록 요청할지 구체 문구",
    "",
    "[보안·개인정보 규칙]",
    "  - 아래 계약서 본문은 이미 개인정보(주민번호·연락처·계좌번호 등)가 마스킹된 상태입니다.",
    "  - 마스킹된 값을 추측·복원하거나 추가 개인정보를 요구하지 마세요.",
    "  - 의뢰인 이름이나 상대방 식별정보를 만들어내지 마세요.",
    "",
    "[출력 형식 — 한국어, 일반인이 이해할 수 있는 문장으로]",
    "다음 4개 섹션을 Markdown 헤더(##)로 구분하여 작성하세요:",
    "",
    "## 종합 위험도 평가",
    "  - 전체 위험도: 높음 / 보통 / 낮음 중 하나",
    "  - 한 줄 결론 (서명 권장 여부)",
    "  - 가장 시급한 쟁점 2~3개를 불릿으로",
    "",
    "## 조항별 상세 분석",
    "  - 위험·불리·의심 조항만 골라서 다음 형식으로 작성:",
    "    [조항명] (위험도: 위법 | 불리 | 주의)",
    "    원문 요약: \"...\"",
    "    문제점: 어떤 법령의 어느 조항에 어떻게 충돌하는가",
    "    근거 법령: 법령명 제○조 (한 줄 인용)",
    "    수정 권고: \"이렇게 바꿔달라\"는 구체 문구",
    "",
    "## 빠진 조항 (Missing Clauses)",
    "  - 의뢰인 보호를 위해 반드시 추가해야 할 조항을 불릿으로",
    "  - 각 항목에 왜 필요한지, 근거 법령은 무엇인지 한 줄씩",
    "",
    "## 종합 조언",
    "  - 의뢰인이 지금 무엇을 해야 하는지 우선순위 순으로 (1, 2, 3)",
    "  - 직접 협상 가능한 부분과 전문가 상담이 필요한 부분 구분",
    "  - 마지막에 반드시 다음 문장 포함: \"본 분석은 AI 기반 참고 자료이며 법적 효력이 없습니다. 중요한 의사결정 전에는 반드시 변호사 또는 관련 전문기관과 상담하세요.\"",
    "",
    "[검토 대상 계약서 본문 — 마스킹 처리됨]",
    "----- 계약서 시작 -----",
    contractExcerpt,
    "----- 계약서 끝 -----"
  ].join("\n");
}

function formatLiveLawReference(reference: LawReference, index: number): string {
  const label = [reference.title, reference.article].filter(Boolean).join(" ");
  const lines = [`  ${index + 1}. ${label}`];

  if (reference.excerpt) {
    lines.push(`     조문 원문: ${reference.excerpt}`);
  }

  if (reference.lastChecked) {
    lines.push(`     조회 시각: ${reference.lastChecked}`);
  }

  return lines.join("\n");
}
