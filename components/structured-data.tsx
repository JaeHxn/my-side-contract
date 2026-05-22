const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://my-side-contract.vercel.app";

const websiteSchema = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "내편계약서",
  alternateName: ["나의 편 계약서", "계약서 AI 분석", "내편 계약서", "Naepyun Contract"],
  url: siteUrl,
  description:
    "전월세·근로·인테리어·프리랜서 계약서의 불리한 조항을 AI가 법령 근거와 함께 분석하는 서비스",
  inLanguage: "ko-KR",
  potentialAction: {
    "@type": "SearchAction",
    target: `${siteUrl}/upload`,
    "query-input": "required name=search_term_string",
  },
};

const serviceSchema = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "내편계약서",
  applicationCategory: "LegalApplication",
  operatingSystem: "Web",
  url: siteUrl,
  inLanguage: "ko-KR",
  description:
    "계약서 텍스트 또는 파일(PDF·사진)을 업로드하면 AI가 주택임대차보호법, 근로기준법 등 실제 법령과 대조하여 불리한 조항, 불법 가능 문구, 빠진 보호 조항을 즉시 분석합니다. 변호사 없이 계약서를 점검할 수 있습니다.",
  offers: {
    "@type": "Offer",
    price: "3900",
    priceCurrency: "KRW",
    description: "계약서 1건 AI 분석",
    availability: "https://schema.org/InStock",
  },
  featureList: [
    "전월세 임대차 계약서 분석",
    "근로 계약서 분석",
    "인테리어 도급 계약서 분석",
    "프리랜서 계약서 분석",
    "PDF·사진 OCR 텍스트 자동 추출",
    "실제 법령 근거 조항 제시",
    "불리한 조항 탐지 및 위험 등급 분류",
    "수정·삭제 권고 문구 제공",
    "30일간 결과 재조회",
  ],
  provider: {
    "@type": "Organization",
    name: "내편계약서",
    url: siteUrl,
  },
  audience: {
    "@type": "Audience",
    audienceType: "임차인, 근로자, 프리랜서, 인테리어 발주자",
  },
  speakable: {
    "@type": "SpeakableSpecification",
    cssSelector: ["h1", "h2", "#faq", "#how-to"],
  },
};

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "내편계약서가 무엇인가요?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "내편계약서는 전월세, 근로, 인테리어, 프리랜서 계약서를 업로드하면 AI가 주택임대차보호법, 근로기준법 등 실제 법령과 대조하여 불리한 조항, 불법 가능 문구, 빠진 보호 조항을 즉시 분석해주는 서비스입니다. 변호사 없이도 계약서의 위험 조항을 쉽게 파악할 수 있습니다.",
      },
    },
    {
      "@type": "Question",
      name: "어떤 계약서를 분석할 수 있나요?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "전월세(임대차) 계약서, 근로 계약서, 인테리어(도급) 계약서, 프리랜서 계약서를 지원합니다. TXT, PDF, 사진(JPG/PNG) 파일을 업로드하거나 텍스트를 직접 붙여넣어 분석할 수 있으며, 최대 50,000자까지 지원합니다.",
      },
    },
    {
      "@type": "Question",
      name: "계약서 분석 결과를 법적 효력으로 사용할 수 있나요?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "아닙니다. 내편계약서의 분석 결과는 AI 기반의 참고용 정보이며 법적 효력이 없습니다. AI는 완벽하지 않으며 법령 해석은 구체적인 사실관계와 맥락에 따라 달라질 수 있습니다. 중요한 계약은 반드시 변호사, 노무사 등 법률 전문가와 상담하세요.",
      },
    },
    {
      "@type": "Question",
      name: "어떤 법령을 기준으로 계약서를 분석하나요?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "국가법령정보센터(law.go.kr)의 공식 법령을 실시간으로 참조합니다. 전월세는 주택임대차보호법·민법·공인중개사법, 근로계약은 근로기준법·최저임금법·근로자퇴직급여보장법, 인테리어는 민법(도급)·건설산업기본법·약관의 규제에 관한 법률, 프리랜서는 저작권법·민법(위임·도급)·공정거래법을 기준으로 합니다.",
      },
    },
    {
      "@type": "Question",
      name: "분석 코드는 어떻게 받나요?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "계좌이체 후 운영자가 입금을 확인하면 문자(SMS)로 6자리 분석 코드가 발송됩니다. 보통 수 분 이내에 받을 수 있습니다.",
      },
    },
    {
      "@type": "Question",
      name: "계약서 분석에 얼마나 걸리나요?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "코드 입력 후 AI 분석은 보통 10~30초 이내에 완료됩니다. PDF·사진 파일은 OCR 텍스트 추출 과정이 추가되어 약간 더 소요될 수 있습니다.",
      },
    },
    {
      "@type": "Question",
      name: "전월세 계약서에서 어떤 조항을 확인해주나요?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "보증금 반환 조건, 계약갱신요구권 침해 조항, 전입신고·확정일자 관련 특약, 수리비 부담 조항, 임대인 방문 권한 조항 등을 주택임대차보호법과 민법 기준으로 분석합니다.",
      },
    },
    {
      "@type": "Question",
      name: "근로 계약서에서 어떤 조항을 확인해주나요?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "임금·각종 수당, 근로시간, 휴게·휴일, 연차 유급휴가, 퇴사 시 위약금 조항, 최저임금 준수 여부를 근로기준법과 최저임금법 기준으로 분석합니다.",
      },
    },
    {
      "@type": "Question",
      name: "계약서에서 위험 조항이 발견되면 어떻게 되나요?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "위험 조항마다 실제 법 조항 번호, 위법 이유, 삭제·수정 권고 문구를 함께 제시합니다. 위험(불법 가능), 불리한 조항, 빠진 조항, 정상 조항으로 등급을 나누어 카드 형태로 보여드립니다.",
      },
    },
  ],
};

const howToSchema = {
  "@context": "https://schema.org",
  "@type": "HowTo",
  name: "내편계약서로 계약서 분석하는 방법",
  description:
    "계약서를 업로드하면 AI가 법령 근거와 함께 불리한 조항을 분석해드립니다. 4단계로 완료됩니다.",
  totalTime: "PT5M",
  step: [
    {
      "@type": "HowToStep",
      position: 1,
      name: "계약 유형 선택",
      text: "전월세, 근로, 인테리어, 프리랜서 중 분석할 계약서 종류를 선택합니다.",
      url: `${siteUrl}/upload`,
    },
    {
      "@type": "HowToStep",
      position: 2,
      name: "계약서 내용 입력",
      text: "계약서 전문 또는 특약 조항을 텍스트로 붙여넣거나 TXT·PDF·사진(JPG/PNG) 파일을 올립니다. 최대 50,000자까지 지원합니다.",
      url: `${siteUrl}/upload`,
    },
    {
      "@type": "HowToStep",
      position: 3,
      name: "분석 코드 입력",
      text: "계좌이체 후 문자로 받은 6자리 분석 코드를 입력합니다. 운영자 확인 후 수 분 이내에 발송됩니다.",
      url: `${siteUrl}/upload`,
    },
    {
      "@type": "HowToStep",
      position: 4,
      name: "분석 결과 확인",
      text: "위험·불리·정상·누락 조항을 카드로 확인합니다. 조항마다 실제 법 조항 근거, 쉬운 말 설명, 수정 권고 문구가 함께 제공됩니다.",
    },
  ],
};

const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "내편계약서",
  url: siteUrl,
  description: "계약서 AI 분석 서비스",
  contactPoint: {
    "@type": "ContactPoint",
    contactType: "customer service",
    availableLanguage: "Korean",
  },
  knowsAbout: [
    "주택임대차보호법",
    "근로기준법",
    "계약서 분석",
    "AI 법률 서비스",
  ],
  areaServed: {
    "@type": "Country",
    name: "South Korea",
    "@id": "https://www.wikidata.org/wiki/Q884",
  },
  foundingDate: "2026",
};

const legalTermsSchema = [
  {
    "@context": "https://schema.org",
    "@type": "DefinedTerm",
    name: "계약갱신요구권",
    description:
      "임차인이 계약 만료 전 계약 갱신을 요구할 수 있는 법정 권리. 주택임대차보호법 제6조의3에 규정. 사전 포기 특약은 효력 없음.",
    inDefinedTermSet: "주택임대차보호법",
  },
  {
    "@context": "https://schema.org",
    "@type": "DefinedTerm",
    name: "위약예정금지",
    description:
      "사용자는 근로계약 불이행에 대한 위약금 또는 손해배상액을 예정하는 계약을 체결하지 못한다는 원칙. 근로기준법 제20조에 규정.",
    inDefinedTermSet: "근로기준법",
  },
  {
    "@context": "https://schema.org",
    "@type": "DefinedTerm",
    name: "포괄임금제",
    description:
      "연장·야간·휴일근로수당을 별도로 지급하지 않고 기본급에 포함하는 임금 지급 방식. 실제 초과근로 없는 경우 유효하나 악용 시 불법.",
    inDefinedTermSet: "근로기준법",
  },
];

const breadcrumbSchema = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    {
      "@type": "ListItem",
      position: 1,
      name: "홈",
      item: siteUrl,
    },
    {
      "@type": "ListItem",
      position: 2,
      name: "계약서 분석",
      item: `${siteUrl}/upload`,
    },
  ],
};

export function StructuredData() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(howToSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      {legalTermsSchema.map((term, i) => (
        <script
          key={`term-${i}`}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(term) }}
        />
      ))}
    </>
  );
}