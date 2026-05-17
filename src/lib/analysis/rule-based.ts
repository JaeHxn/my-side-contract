import type {
  AnalysisItem,
  AnalyzeContractInput,
  ContractAnalysisResult,
  MissingClause,
  RiskLevel
} from "../contracts/types";
import { referenceByTitle, referencesForCategory } from "./law-references";

const disclaimer =
  "본 분석은 AI와 규칙 기반 점검으로 제공되는 참고 정보이며 법적 효력이 없습니다. 중요한 계약은 반드시 법률 전문가와 상담하세요.";

interface Rule {
  id: string;
  riskLevel: Exclude<RiskLevel, "missing">;
  type: AnalysisItem["type"];
  pattern: RegExp;
  reason: string;
  recommendation: string;
  legalTitles: string[];
}

const housingRules: Rule[] = [
  {
    id: "excessive-penalty",
    riskLevel: "danger",
    type: "unfavorable",
    pattern: /(보증금\s*전액|전액.*몰취|위약금.*전액|지체.*전액|하루라도.*보증금)/,
    reason: "과도한 위약금이나 보증금 전액 몰취 조항으로 볼 여지가 있습니다.",
    recommendation: "위약금 범위와 실제 손해 기준을 구체적으로 줄이고, 보증금 전액 몰취 표현은 삭제를 요청하세요.",
    legalTitles: ["민법", "주택임대차보호법"]
  },
  {
    id: "renewal-waiver",
    riskLevel: "danger",
    type: "illegal",
    pattern: /(계약갱신|갱신요구|갱신청구).*(포기|행사하지|불가)|포기.*(계약갱신|갱신요구|갱신청구)/,
    reason: "계약갱신요구권을 사전에 포기시키는 취지라면 법정 권리 제한 문제가 생길 수 있습니다.",
    recommendation: "계약갱신요구권 포기 문구를 삭제하고, 법에서 정한 예외 사유만 반영하도록 수정하세요.",
    legalTitles: ["주택임대차보호법"]
  },
  {
    id: "resident-registration-ban",
    riskLevel: "danger",
    type: "illegal",
    pattern: /(전입신고|확정일자).*(금지|불가|하지 않는다|못한다)/,
    reason: "전입신고나 확정일자를 막으면 보증금 보호에 직접적인 위험이 생깁니다.",
    recommendation: "전입신고와 확정일자를 제한하는 문구는 삭제를 요구하세요.",
    legalTitles: ["주택임대차보호법"]
  },
  {
    id: "all-repair-costs",
    riskLevel: "warning",
    type: "unfavorable",
    pattern: /(모든|일체의).*(수리|수선|보수|하자).*(임차인|세입자)|(임차인|세입자).*(모든|일체의).*(수리|수선|보수|하자)/,
    reason: "집 자체의 노후나 기본 하자까지 세입자에게 넘기는 문구일 수 있습니다.",
    recommendation: "입주 전 하자, 노후 설비, 구조 문제는 임대인 책임으로 분리해 적으세요.",
    legalTitles: ["민법"]
  },
  {
    id: "unauthorized-entry",
    riskLevel: "warning",
    type: "unfavorable",
    pattern: /(임대인|집주인).*(언제든|수시로|임의로).*(출입|방문)/,
    reason: "거주 중인 집에 집주인이 임의로 들어올 수 있다는 조항은 사생활 침해 위험이 큽니다.",
    recommendation: "긴급 상황을 제외하고 사전 통지와 동의를 조건으로 바꾸세요.",
    legalTitles: ["민법"]
  },
  {
    id: "brokerage-fee-shift",
    riskLevel: "warning",
    type: "unfavorable",
    pattern: /(중개수수료|중개보수).*(임차인|세입자).*(전액|모두|일체)/,
    reason: "법정 한도와 당사자 부담 범위를 넘어서는 중개보수 부담이 될 수 있습니다.",
    recommendation: "중개보수는 법정 한도와 실제 중개 주체 기준으로 다시 확인하세요.",
    legalTitles: ["공인중개사법"]
  }
];

const laborRules: Rule[] = [
  {
    id: "labor-penalty-for-leaving",
    riskLevel: "danger",
    type: "illegal",
    pattern: /(무단퇴사|중도퇴사|퇴사).*(위약금|벌금|손해배상|급여\s*공제|월급\s*공제)|(위약금|벌금|손해배상).*(퇴사|계약기간\s*미준수)/,
    reason: "근로계약에서 퇴사 등을 이유로 위약금이나 손해배상액을 미리 정하는 조항은 문제가 될 수 있습니다.",
    recommendation: "위약금, 벌금, 일률적인 손해배상 예정 문구는 삭제하고 실제 손해가 있으면 별도 절차로 다투도록 수정하세요.",
    legalTitles: ["근로기준법"]
  },
  {
    id: "labor-unpaid-overtime",
    riskLevel: "danger",
    type: "illegal",
    pattern: /(연장|야간|휴일|초과).*(수당|가산).*(없|지급하지|포함되어|포괄임금)|(포괄임금).*(추가|별도).*(수당|지급).*(없|않)/,
    reason: "연장ㆍ야간ㆍ휴일근로 수당을 지급하지 않거나 포괄임금으로 모두 갈음한다는 문구는 임금 미지급 분쟁으로 이어질 수 있습니다.",
    recommendation: "기본급과 고정수당 범위, 실제 추가근로 발생 시 가산수당 지급 기준을 분리해 적으세요.",
    legalTitles: ["근로기준법"]
  },
  {
    id: "labor-excessive-hours",
    riskLevel: "danger",
    type: "illegal",
    pattern: /(주\s*(5[3-9]|[6-9]\d)\s*시간|1일\s*(1[3-9]|[2-9]\d)\s*시간|연장근로.*무제한|필요시.*무제한.*근무)/,
    reason: "법정근로시간과 연장근로 제한을 넘길 위험이 있는 근로시간 문구입니다.",
    recommendation: "소정근로시간과 휴게시간을 명확히 쓰고, 연장근로는 법정 한도와 근로자 동의 범위 안에서만 가능하다고 수정하세요.",
    legalTitles: ["근로기준법"]
  },
  {
    id: "labor-no-break",
    riskLevel: "danger",
    type: "illegal",
    pattern: /(휴게시간|쉬는\s*시간).*(없|부여하지|근무시간에\s*포함)|(식사시간).*(근무|업무).*(계속|포함)/,
    reason: "일정 시간 이상 근로할 때 휴게시간이 필요하며, 휴게시간은 근로자가 자유롭게 이용할 수 있어야 합니다.",
    recommendation: "근로시간 도중의 휴게시간을 분 단위로 명확히 적고, 실제로 사용할 수 있게 운영하도록 수정하세요.",
    legalTitles: ["근로기준법"]
  },
  {
    id: "labor-annual-leave-waiver",
    riskLevel: "warning",
    type: "unfavorable",
    pattern: /(연차|유급휴가).*(없|포기|사용할\s*수\s*없|수당\s*없|지급하지)/,
    reason: "연차 유급휴가를 사전에 포기시키거나 수당을 배제하는 문구는 불리하거나 위법 소지가 있습니다.",
    recommendation: "연차 유급휴가는 근로기준법에 따른다고 명시하고, 미사용수당 처리 기준도 확인하세요.",
    legalTitles: ["근로기준법"]
  },
  {
    id: "labor-minimum-wage-risk",
    riskLevel: "warning",
    type: "unfavorable",
    pattern: /(최저임금).*(미만|보다\s*낮|적게)|(수습).*(최저임금).*(70|80|감액)|(시급).*(추후\s*협의|회사\s*내규)/,
    reason: "최저임금보다 낮은 임금이나 임금액을 불명확하게 두는 문구는 임금 분쟁 위험이 큽니다.",
    recommendation: "시급ㆍ월급ㆍ수당의 구체 금액과 계산방법을 적고, 해당 연도 최저임금 이상인지 확인하세요.",
    legalTitles: ["최저임금법", "근로기준법"]
  }
];

const interiorRules: Rule[] = [
  {
    id: "interior-full-prepayment",
    riskLevel: "danger",
    type: "illegal",
    pattern: /(공사비|공사대금|잔금).*(전액|100\s*%|선불|선지급)|(전액|100\s*%|선불|선지급).*(공사비|공사대금|잔금)/,
    reason: "공사 시작 전 공사비 전액(또는 100%) 선지급을 요구하는 조항은 공사 지연·중단·먹튀 시 회수 수단이 없어 매우 위험합니다.",
    recommendation: "착수금·중도금·잔금으로 단계별 기성금 구조(예: 3:4:3)로 나누고, 잔금은 준공·검수 이후에 지급한다고 명시하세요.",
    legalTitles: ["민법", "인테리어 표준약관"]
  },
  {
    id: "interior-defect-disclaimer",
    riskLevel: "danger",
    type: "illegal",
    pattern: /(하자|누수|균열|결로).*(책임.*(없|지지\s*않|불가)|면책|면제|배제)/,
    reason: "준공 후 발생한 하자에 대한 수급인(시공사)의 담보책임을 일방적으로 면제하는 조항은 민법 도급편 담보책임에 반할 소지가 큽니다.",
    recommendation: "하자담보 책임기간(통상 1~2년)과 보수 범위, 무상보수 절차를 명시하고 책임 면제 문구는 삭제 요청하세요.",
    legalTitles: ["민법", "건설산업기본법"]
  },
  {
    id: "interior-excessive-penalty",
    riskLevel: "danger",
    type: "unfavorable",
    pattern: /(위약금|손해배상|해약금).*(50|60|70|80|90|100)\s*%/,
    reason: "공사대금의 절반 이상을 위약금·손해배상액으로 미리 정하는 조항은 과도하여 무효 또는 감액 대상이 될 수 있습니다.",
    recommendation: "위약금은 실손해 기준으로 산정하거나 통상 10% 이내로 제한하고, 과도한 정액 위약금 문구는 삭제하세요.",
    legalTitles: ["민법", "소비자기본법"]
  },
  {
    id: "interior-period-missing",
    riskLevel: "warning",
    type: "unfavorable",
    pattern: /(공사기간|착공일|준공일).*(추후|미정|협의|회사가\s*정|시공사가\s*정)/,
    reason: "공사기간·착공일·준공일을 시공사 임의로 정하게 두면 공기 지연 책임을 묻기 어렵습니다.",
    recommendation: "착공일·준공일을 날짜로 특정하고, 지연 시 지체상금(일 단위 %) 조항을 함께 넣으세요.",
    legalTitles: ["민법", "인테리어 표준약관"]
  },
  {
    id: "interior-verbal-change",
    riskLevel: "warning",
    type: "unfavorable",
    pattern: /(변경|추가공사|설계변경).*(구두|전화|메시지|카톡|문자).*(가능|합의|인정)/,
    reason: "설계변경·추가공사를 구두 합의로만 인정하면 추후 추가비용 청구나 시공 범위 다툼이 발생하기 쉽습니다.",
    recommendation: "모든 변경·추가공사는 서면(또는 이메일) 합의를 거쳐 단가·금액·기간을 확정한 뒤 진행한다고 수정하세요.",
    legalTitles: ["민법", "인테리어 표준약관"]
  },
  {
    id: "interior-no-supervision",
    riskLevel: "warning",
    type: "unfavorable",
    pattern: /(현장.*(사진|촬영|방문)|감리|감독|점검).*(금지|불가|제한|동의\s*필요)/,
    reason: "건축주(발주자)의 현장 방문·촬영·감리 권한을 제한하면 시공 품질 확인과 부실시공 입증이 어려워집니다.",
    recommendation: "사전 통보 후 자유롭게 현장 방문·촬영이 가능하고, 외부 감리자를 둘 수 있다는 권리를 명시하세요.",
    legalTitles: ["소비자기본법", "건설산업기본법"]
  }
];

const freelanceRules: Rule[] = [
  {
    id: "freelance-auto-ip-transfer",
    riskLevel: "danger",
    type: "illegal",
    pattern: /(저작권|지적재산권|IP|저작재산권).*(자동|당연|일체|모두).*(귀속|양도|소유|이전)/,
    reason: "프리랜서의 저작권을 사전 동의·정당한 대가 없이 일괄 양도시키는 조항은 저작권법상 양도 요건과 충돌할 소지가 있습니다.",
    recommendation: "양도 범위(2차적 저작물 작성권 포함 여부), 양도 시점(대금 완납 시), 저작인격권 보호 문구를 별도로 명시하세요.",
    legalTitles: ["저작권법", "민법"]
  },
  {
    id: "freelance-payment-delay",
    riskLevel: "danger",
    type: "illegal",
    pattern: /(대금|용역비|보수|작업비).*(완료|납품|검수|만족).*후.*(60|90|120|150|180)\s*일/,
    reason: "납품·검수 후 60일을 초과하는 대금 지급 조항은 하도급법상 지급기한(60일 이내)을 위반할 소지가 있습니다.",
    recommendation: "대금 지급은 납품 또는 검수 후 30일(원칙) 이내로 단축하고, 지연 시 이자(연 15.5%)를 가산한다고 명시하세요.",
    legalTitles: ["하도급거래 공정화에 관한 법률", "민법"]
  },
  {
    id: "freelance-excessive-penalty",
    riskLevel: "danger",
    type: "unfavorable",
    pattern: /(위약금|손해배상).*(계약금액|프로젝트.*금액|용역대금).*(50|60|70|80|90|100|전액|2배|3배)/,
    reason: "계약금액 전액 또는 그 이상을 위약금으로 정하는 조항은 과도하여 감액 또는 무효 대상이 될 수 있습니다.",
    recommendation: "위약금은 실손해 기준 또는 미지급 대금의 10~20% 이내로 한정하도록 수정 요청하세요.",
    legalTitles: ["민법"]
  },
  {
    id: "freelance-overbroad-nda",
    riskLevel: "warning",
    type: "unfavorable",
    pattern: /(모든|일체의).*(정보|내용|아이디어|자료).*(비밀|공개\s*(금지|불가)|누설\s*금지)/,
    reason: "공개된 정보나 일반적 지식까지 포함하는 포괄적 비밀유지 조항은 향후 다른 업무 수행에 제약이 될 수 있습니다.",
    recommendation: "비밀정보 범위를 '서면으로 비밀로 표시된 정보'로 한정하고, 공지된 정보·독자 개발 정보 등 예외를 명시하세요.",
    legalTitles: ["민법"]
  },
  {
    id: "freelance-unlimited-revision",
    riskLevel: "warning",
    type: "unfavorable",
    pattern: /(수정|변경|보완).*(횟수|회).*(제한.*(없|않)|무제한|원하는\s*만큼|만족할\s*때까지)/,
    reason: "수정 횟수에 제한이 없으면 사실상 무제한 추가작업으로 이어져 인건비를 회수할 수 없게 됩니다.",
    recommendation: "기본 수정 횟수(예: 2~3회)를 명시하고, 추가 수정은 별도 단가로 청구한다고 수정하세요.",
    legalTitles: ["민법", "하도급거래 공정화에 관한 법률"]
  },
  {
    id: "freelance-non-compete",
    riskLevel: "warning",
    type: "unfavorable",
    pattern: /(겸업|타사.*업무|다른.*프로젝트|외부.*활동).*(금지|불가|사전.*동의\s*필요)/,
    reason: "프리랜서의 다른 업무 수행을 포괄적으로 금지하는 조항은 직업 선택의 자유를 과도하게 제한할 수 있습니다.",
    recommendation: "겸업 금지는 동종·경쟁업체에 한정하고, 기간(계약 기간 중)과 지역을 합리적으로 제한하도록 수정하세요.",
    legalTitles: ["민법", "근로기준법"]
  }
];

const housingMissingClauseChecks = [
  {
    key: "deposit-return",
    title: "보증금 반환 시점",
    pattern: /(보증금).*(반환|돌려|지급)|(반환|돌려|지급).*(보증금)/,
    whyItMatters: "언제 보증금을 돌려받는지 없으면 퇴거 시 분쟁이 생기기 쉽습니다.",
    recommendation: "퇴거 및 목적물 인도와 동시에 보증금을 반환한다는 문구를 넣으세요.",
    legalTitles: ["주택임대차보호법", "민법"]
  },
  {
    key: "repair-responsibility",
    title: "수리와 하자 책임",
    pattern: /(수리|수선|보수|하자|누수|고장)/,
    whyItMatters: "집 상태 문제와 생활 중 파손 책임을 나누지 않으면 세입자가 과도하게 부담할 수 있습니다.",
    recommendation: "입주 전 하자와 노후 설비는 임대인, 사용자 과실은 임차인 책임으로 구분하세요.",
    legalTitles: ["민법"]
  },
  {
    key: "move-in-protection",
    title: "전입신고와 확정일자",
    pattern: /(전입신고|확정일자|대항력|우선변제)/,
    whyItMatters: "보증금 보호에 필요한 절차가 빠져 있으면 사후 대응이 늦어질 수 있습니다.",
    recommendation: "전입신고와 확정일자를 방해하지 않는다는 확인 문구를 넣으세요.",
    legalTitles: ["주택임대차보호법"]
  },
  {
    key: "renewal-right",
    title: "계약갱신 관련 문구",
    pattern: /(계약갱신|갱신요구|갱신청구|재계약)/,
    whyItMatters: "갱신 절차가 빠져 있으면 계약 종료 시점에 다툼이 생길 수 있습니다.",
    recommendation: "계약갱신은 관련 법령에 따른다는 중립 문구를 넣으세요.",
    legalTitles: ["주택임대차보호법"]
  }
];

const laborMissingClauseChecks = [
  {
    key: "labor-wage",
    title: "임금 금액과 지급방법",
    pattern: /(임금|급여|월급|시급|연봉).*(원|만원|지급|계산|통장|계좌)/,
    whyItMatters: "임금의 구성항목, 계산방법, 지급방법은 근로계약서에 명확히 적어야 할 핵심 조건입니다.",
    recommendation: "기본급, 수당, 지급일, 지급방법을 구체적으로 적으세요.",
    legalTitles: ["근로기준법", "최저임금법"]
  },
  {
    key: "labor-working-hours",
    title: "소정근로시간",
    pattern: /(소정근로시간|근로시간|출근|퇴근|시업|종업|근무시간)/,
    whyItMatters: "근무 시작ㆍ종료 시간과 주간 근무일이 없으면 초과근로와 임금 계산이 흔들릴 수 있습니다.",
    recommendation: "요일별 근무시간, 시작/종료 시간, 주휴일을 명확히 적으세요.",
    legalTitles: ["근로기준법"]
  },
  {
    key: "labor-break-holiday",
    title: "휴게시간과 휴일",
    pattern: /(휴게|휴식|점심시간|식사시간|휴일|주휴)/,
    whyItMatters: "휴게시간과 휴일이 빠지면 실제 근무 중 쉴 권리와 주휴수당 분쟁이 생길 수 있습니다.",
    recommendation: "휴게시간, 주휴일, 공휴일 적용 기준을 분리해 적으세요.",
    legalTitles: ["근로기준법"]
  },
  {
    key: "labor-paid-leave",
    title: "연차 유급휴가",
    pattern: /(연차|유급휴가|휴가)/,
    whyItMatters: "연차 유급휴가 조건이 빠지면 쉬는 날과 미사용수당 처리에서 분쟁이 생길 수 있습니다.",
    recommendation: "연차 유급휴가는 근로기준법에 따른다는 문구를 넣고 회사 내규와 충돌하지 않는지 확인하세요.",
    legalTitles: ["근로기준법"]
  },
  {
    key: "labor-overtime-pay",
    title: "연장ㆍ야간ㆍ휴일근로 수당",
    pattern: /(연장|야간|휴일|초과|가산).*(수당|임금|근로)/,
    whyItMatters: "초과근로 수당 기준이 빠지면 포괄임금이나 무급 초과근로로 이어질 수 있습니다.",
    recommendation: "연장ㆍ야간ㆍ휴일근로의 사전 동의와 가산수당 지급 기준을 명시하세요.",
    legalTitles: ["근로기준법"]
  }
];

const interiorMissingClauseChecks = [
  {
    key: "interior-completion-criteria",
    title: "공사 완료(준공) 기준",
    pattern: /(준공|완공|검수|인도|완료\s*기준)/,
    whyItMatters: "'준공' 정의가 없으면 마감재 미시공·하자 잔존 상태에서도 잔금 지급을 강요받을 수 있습니다.",
    recommendation: "준공 기준(체크리스트, 검수 합격 시점)과 발주자의 인도 거부권을 명시하세요.",
    legalTitles: ["민법", "인테리어 표준약관"]
  },
  {
    key: "interior-material-spec",
    title: "자재 명세와 규격",
    pattern: /(자재|마감재|벽지|타일|마루|싱크대|조명).*(브랜드|모델|규격|제조사|품번)/,
    whyItMatters: "자재 브랜드·모델·규격이 빠지면 시공 후 '동급 자재'라며 저가 자재로 대체될 위험이 있습니다.",
    recommendation: "주요 자재의 제조사·모델명·수량을 별지(자재 명세서)로 첨부하세요.",
    legalTitles: ["민법", "소비자기본법"]
  },
  {
    key: "interior-defect-period",
    title: "하자보수 기간과 보증",
    pattern: /(하자보수|하자담보|보증기간).*(1년|2년|3년|개월)/,
    whyItMatters: "하자담보 기간이 빠지면 시공 직후 발생한 하자도 보수 받기 어려워집니다.",
    recommendation: "구조·방수는 최소 2년, 마감재 1년 등 부위별 하자담보 기간과 무상보수 절차를 명시하세요.",
    legalTitles: ["민법", "건설산업기본법"]
  },
  {
    key: "interior-payment-schedule",
    title: "공사비 지급 일정",
    pattern: /(착수금|중도금|잔금|기성금).*(지급|일정|단계)/,
    whyItMatters: "단계별 기성금 일정이 없으면 시공사가 자금을 미리 받고 부실시공·중단할 위험이 큽니다.",
    recommendation: "착수금·중도금·잔금 비율과 각 단계 지급 조건(공정률 또는 일정)을 명시하세요.",
    legalTitles: ["민법", "인테리어 표준약관"]
  }
];

const freelanceMissingClauseChecks = [
  {
    key: "freelance-scope",
    title: "납품 범위와 결과물 정의",
    pattern: /(납품물|결과물|산출물|deliverable|작업\s*범위|업무\s*범위)/,
    whyItMatters: "결과물 범위가 모호하면 'OO도 해주세요'라는 추가 요구에 무한정 응해야 할 수 있습니다.",
    recommendation: "최종 납품물 목록(파일 형식, 수량, 해상도 등)과 작업 범위에 포함되지 않는 항목을 명시하세요.",
    legalTitles: ["민법", "하도급거래 공정화에 관한 법률"]
  },
  {
    key: "freelance-payment-schedule",
    title: "대금 지급 시기와 방법",
    pattern: /(대금|용역비|보수|작업비).*(지급일|지급시기|계약금|중도금|잔금)/,
    whyItMatters: "지급 일정이 빠지면 납품 후에도 무기한 대금 지급 지연 빌미가 됩니다.",
    recommendation: "계약금·중도금·잔금 비율과 각 지급 기일(예: 납품 후 30일 이내)을 명시하세요.",
    legalTitles: ["하도급거래 공정화에 관한 법률", "민법"]
  },
  {
    key: "freelance-ip-ownership",
    title: "저작권 귀속 조건",
    pattern: /(저작권|지적재산권|IP).*(귀속|양도|이전|보유).*(대금|완납|지급)/,
    whyItMatters: "저작권 귀속 시점이 명확하지 않으면 대금을 받기 전에 결과물이 사용되거나 변형될 수 있습니다.",
    recommendation: "저작권은 대금 완납 시점에 양도되며, 양도 범위(2차 저작물 작성권 포함 여부)를 명시하세요.",
    legalTitles: ["저작권법", "민법"]
  },
  {
    key: "freelance-revision-limit",
    title: "수정 횟수 제한",
    pattern: /(수정|보완|revision).*(횟수|회|차)/,
    whyItMatters: "수정 횟수 한도가 없으면 사실상 무제한 추가 작업으로 이어집니다.",
    recommendation: "기본 수정 횟수(예: 2회)와 초과 시 추가 단가를 명시하세요.",
    legalTitles: ["민법"]
  }
];

export function analyzeContractText(input: AnalyzeContractInput): ContractAnalysisResult {
  const normalizedText = normalizeText(input.contractText);
  const categoryReferences = referencesForCategory(input.category);
  const rules = rulesForCategory(input.category);
  const missingClauseChecks = missingChecksForCategory(input.category);
  const clauses = splitClauses(normalizedText);
  const items = clauses.map((clause, index) => analyzeClause(clause, index, rules, categoryReferences));
  const missingClauses = findMissingClauses(normalizedText, missingClauseChecks);
  const summary = buildSummary(items, missingClauses, input.category);

  return {
    id: createAnalysisId(normalizedText),
    category: input.category,
    provider: "rule-based",
    createdAt: new Date().toISOString(),
    summary,
    items,
    missingClauses,
    legalReferences: categoryReferences,
    disclaimer
  };
}

function analyzeClause(
  clause: string,
  index: number,
  rules: Rule[],
  categoryReferences: ReturnType<typeof referencesForCategory>
): AnalysisItem {
  const matchedRule = rules.find((rule) => rule.pattern.test(clause));
  const titleMatch = clause.match(/제\s*\d+\s*조\s*[^.\n]*/);
  const clauseTitle = titleMatch?.[0]?.trim() || `조항 ${index + 1}`;

  if (!matchedRule) {
    return {
      id: `clause-${index + 1}`,
      clauseTitle,
      originalText: clause,
      type: "normal",
      riskLevel: "safe",
      reason: "현재 문구만 보면 즉시 위험한 표현은 발견되지 않았습니다.",
      legalBasis: categoryReferences,
      recommendation: "문제 없어 보이지만 금액, 날짜, 주소, 당사자 이름은 원문과 다시 대조하세요."
    };
  }

  return {
    id: matchedRule.id,
    clauseTitle,
    originalText: clause,
    type: matchedRule.type,
    riskLevel: matchedRule.riskLevel,
    reason: matchedRule.reason,
    legalBasis: matchedRule.legalTitles.flatMap(referenceByTitle),
    recommendation: matchedRule.recommendation
  };
}

function findMissingClauses(
  contractText: string,
  missingClauseChecks: typeof housingMissingClauseChecks
): MissingClause[] {
  return missingClauseChecks
    .filter((check) => !check.pattern.test(contractText))
    .map((check) => ({
      key: check.key,
      title: check.title,
      riskLevel: "missing",
      whyItMatters: check.whyItMatters,
      recommendation: check.recommendation,
      legalBasis: check.legalTitles.flatMap(referenceByTitle)
    }));
}

function buildSummary(items: AnalysisItem[], missingClauses: MissingClause[], category: AnalyzeContractInput["category"]) {
  const riskyCount = items.filter((item) => item.riskLevel === "danger").length;
  const warningCount = items.filter((item) => item.riskLevel === "warning").length;
  const safeCount = items.filter((item) => item.riskLevel === "safe").length;
  const missingCount = missingClauses.length;
  const overallRisk = riskyCount > 0 ? "high" : warningCount + missingCount > 0 ? "medium" : "low";

  return {
    overallRisk,
    headline:
      overallRisk === "high"
        ? "서명 전에 반드시 고쳐야 할 위험 조항이 있습니다."
        : overallRisk === "medium"
          ? "불리하거나 빠진 조항이 있어 수정 확인이 필요합니다."
          : "즉시 위험한 조항은 적게 보입니다.",
    nextStep: buildNextStep(category, overallRisk),
    riskyCount,
    warningCount,
    safeCount,
    missingCount
  } as const;
}

function buildNextStep(category: AnalyzeContractInput["category"], overallRisk: "high" | "medium" | "low"): string {
  if (overallRisk === "low") {
    switch (category) {
      case "labor":
        return "임금, 근무시간, 휴게시간, 휴일을 원본과 다시 확인한 뒤 보관하세요.";
      case "interior":
        return "공사기간, 자재 명세, 지급 일정, 하자보수 기간을 원본과 다시 확인한 뒤 보관하세요.";
      case "freelance":
        return "납품 범위, 대금 지급 일정, 저작권 귀속 조건, 수정 횟수를 원본과 다시 확인한 뒤 보관하세요.";
      default:
        return "금액, 주소, 날짜를 원본과 다시 확인한 뒤 보관하세요.";
    }
  }

  switch (category) {
    case "labor":
      return "사업주에게 임금ㆍ근로시간ㆍ수당 문구 수정을 요청하고, 불리하면 노동청 또는 전문가 상담을 검토하세요.";
    case "interior":
      return "시공사에 공사기간ㆍ지급일정ㆍ하자보수 조항 수정을 요청하고, 큰 금액이면 한국소비자원 또는 건설 전문 변호사 상담을 검토하세요.";
    case "freelance":
      return "발주처에 대금 지급 조건ㆍ저작권 귀속ㆍ수정 횟수 문구 수정을 요청하고, 하도급 분쟁 소지가 있으면 공정거래위원회 또는 전문가 상담을 검토하세요.";
    default:
      return "집주인 또는 중개인에게 수정 문구를 요청하고, 큰 금액이면 전문가 검토를 받으세요.";
  }
}

function rulesForCategory(category: AnalyzeContractInput["category"]): Rule[] {
  switch (category) {
    case "labor":
      return laborRules;
    case "interior":
      return interiorRules;
    case "freelance":
      return freelanceRules;
    case "housing-lease":
    case "wedding":
    default:
      return housingRules;
  }
}

function missingChecksForCategory(category: AnalyzeContractInput["category"]): typeof housingMissingClauseChecks {
  switch (category) {
    case "labor":
      return laborMissingClauseChecks;
    case "interior":
      return interiorMissingClauseChecks;
    case "freelance":
      return freelanceMissingClauseChecks;
    case "housing-lease":
    case "wedding":
    default:
      return housingMissingClauseChecks;
  }
}

function splitClauses(contractText: string): string[] {
  const chunks = contractText
    .split(/(?=제\s*\d+\s*조)/g)
    .map((chunk) => chunk.trim())
    .filter(Boolean);

  return chunks.length > 0 ? chunks : [contractText];
}

function normalizeText(contractText: string): string {
  return contractText.replace(/\r\n/g, "\n").replace(/[ \t]+/g, " ").trim();
}

function createAnalysisId(contractText: string): string {
  let hash = 0;
  for (let index = 0; index < contractText.length; index += 1) {
    hash = (hash * 31 + contractText.charCodeAt(index)) >>> 0;
  }
  return `analysis-${hash.toString(16).padStart(8, "0")}`;
}
