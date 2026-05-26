import Link from "next/link";
import { BetaBanner } from "@/components/beta-banner";
import {
  AlertTriangle,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  ClipboardCheck,
  FileSearch,
  FileText,
  Hammer,
  LockKeyhole,
  MessageSquareText,
  Palette,
  Scale,
  ShieldCheck,
  Upload
} from "lucide-react";
import { LegalDisclaimer } from "@/components/legal-disclaimer";
import { RiskBadge } from "@/components/risk-badge";
import { ShareButtons } from "@/components/share-buttons";

const flow = [
  {
    title: "계약서 입력",
    body: "전월세·근로·인테리어·프리랜서 계약서 내용을 붙여넣거나 파일(TXT·PDF·사진)로 올립니다.",
    icon: FileText
  },
  {
    title: "코드 확인",
    body: "분석 코드를 입력하면 서버에서 법령 근거와 함께 점검합니다.",
    icon: LockKeyhole
  },
  {
    title: "결과 검토",
    body: "위험, 주의, 정상, 누락 조항을 카드로 나눠 확인합니다.",
    icon: FileSearch
  }
];

const howToSteps = [
  {
    step: "01",
    title: "계약 유형 선택",
    desc: "분석할 계약서 종류를 선택하세요. 현재 전월세·근로·인테리어·프리랜서 계약서를 지원합니다.",
    icon: ClipboardCheck,
    detail: "상단 버튼에서 전월세·근로·인테리어·프리랜서 중 하나를 선택합니다."
  },
  {
    step: "02",
    title: "계약서 내용 입력",
    desc: "계약서 전문 또는 특약 조항을 텍스트로 붙여넣거나 파일을 올립니다.",
    icon: Upload,
    detail: "TXT·MD 파일은 바로 읽고, PDF·사진 파일은 OCR로 텍스트를 자동 추출합니다. 최대 20,000자."
  },
  {
    step: "03",
    title: "분석 코드 입력",
    desc: "입금 확인 후 문자로 받은 6자리 코드를 입력합니다.",
    icon: LockKeyhole,
    detail: "계좌이체 후 운영자가 확인하면 코드가 자동 발송됩니다 (보통 수 분 이내)."
  },
  {
    step: "04",
    title: "분석 결과 확인",
    desc: "🔴 위험 · 🟡 불리 · 🟢 정상 · ⚠️ 누락 조항을 카드로 확인합니다.",
    icon: FileSearch,
    detail: "각 조항마다 실제 법 조항 근거, 쉬운 말 설명, 수정 권고 문구가 함께 표시됩니다."
  }
];

const resultPreviewItems = [
  {
    badge: "위험 조항",
    emoji: "🔴",
    tag: "불법 가능성 있음",
    desc: "법정 권리를 빼앗거나 법이 금지한 내용을 담은 조항입니다. 서명 전에 반드시 삭제 또는 수정해야 합니다.",
    examples: [
      { type: "전월세", text: "계약갱신요구권 포기 강요 조항" },
      { type: "근로", text: "퇴사 시 위약금 300만 원 지급 조항" }
    ],
    what: "실제 법 조항 번호, 위법 이유, 삭제·수정 권고 문구를 함께 제시합니다.",
    color: "border-danger/25 bg-danger/6",
    tagColor: "bg-danger/15 text-danger",
    badgeColor: "text-danger"
  },
  {
    badge: "불리한 조항",
    emoji: "🟡",
    tag: "수정 권고",
    desc: "법을 위반하지는 않지만 상대방에게 일방적으로 유리하게 쓰인 조항입니다. 협상을 통해 수정하는 것이 좋습니다.",
    examples: [
      { type: "전월세", text: "모든 수리·하자 비용 임차인 전액 부담" },
      { type: "근로", text: "포괄임금으로 연장·야간수당 별도 지급 없음" }
    ],
    what: "어떤 점이 불리한지 쉬운 말로 설명하고 균형 잡힌 대안 문구를 제안합니다.",
    color: "border-warn/25 bg-warn/6",
    tagColor: "bg-warn/15 text-warn",
    badgeColor: "text-warn"
  },
  {
    badge: "빠진 조항",
    emoji: "⚠️",
    tag: "추가 권고",
    desc: "계약서에 반드시 있어야 할 보호 내용이 누락된 경우입니다. 나중에 분쟁이 생겼을 때 불리해질 수 있습니다.",
    examples: [
      { type: "전월세", text: "보증금 반환 시점·방법 미명시" },
      { type: "근로", text: "소정근로시간·임금 지급일 미기재" }
    ],
    what: "왜 해당 조항이 필요한지 설명하고 추가할 표준 문구 예시를 제시합니다.",
    color: "border-ink/12 bg-paper",
    tagColor: "bg-ink/8 text-ink/70",
    badgeColor: "text-ink/70"
  },
  {
    badge: "정상 조항",
    emoji: "🟢",
    tag: "즉시 위험 없음",
    desc: "현재 문구만 보면 즉시 위험한 표현은 발견되지 않은 조항입니다. 금액·날짜·이름은 원본과 한 번 더 대조하세요.",
    examples: [
      { type: "전월세", text: "임대 기간 및 보증금 명확히 기재된 조항" },
      { type: "근로", text: "법정 기준에 맞는 휴게시간 명시 조항" }
    ],
    what: "문제없어 보이더라도 금액·날짜·서명 주체가 원본과 일치하는지 확인을 권고합니다.",
    color: "border-safe/25 bg-safe/6",
    tagColor: "bg-safe/15 text-safe",
    badgeColor: "text-safe"
  }
];

const lawBases = [
  {
    category: "전월세 계약서",
    laws: [
      { name: "주택임대차보호법", desc: "대항력, 보증금 보호, 계약갱신요구권", url: "https://www.law.go.kr/법령/주택임대차보호법" },
      { name: "민법", desc: "임대차, 손해배상, 위약금 관련 조항", url: "https://www.law.go.kr/법령/민법" },
      { name: "공인중개사법", desc: "중개보수, 확인설명 관련 조항", url: "https://www.law.go.kr/법령/공인중개사법" }
    ]
  },
  {
    category: "근로 계약서",
    laws: [
      { name: "근로기준법", desc: "근로조건 명시, 위약예정금지, 근로시간, 휴게·휴일, 연차", url: "https://www.law.go.kr/법령/근로기준법" },
      { name: "최저임금법", desc: "제6조 최저임금의 효력", url: "https://www.law.go.kr/법령/최저임금법" },
      { name: "근로자퇴직급여보장법", desc: "퇴직급여제도 설정, 퇴직금 지급", url: "https://www.law.go.kr/법령/근로자퇴직급여보장법" }
    ]
  },
  {
    category: "인테리어 계약서",
    laws: [
      { name: "민법 (도급)", desc: "도급계약의 보수 지급, 하자담보책임 (제664조~제674조)", url: "https://www.law.go.kr/법령/민법" },
      { name: "건설산업기본법", desc: "건설공사 표준계약, 하자담보 책임기간", url: "https://www.law.go.kr/법령/건설산업기본법" },
      { name: "약관의 규제에 관한 법률", desc: "불공정 약관 무효, 일방적 면책조항 제한", url: "https://www.law.go.kr/법령/약관의규제에관한법률" }
    ]
  },
  {
    category: "프리랜서 계약서",
    laws: [
      { name: "저작권법", desc: "저작권 귀속, 양도, 2차적저작물작성권", url: "https://www.law.go.kr/법령/저작권법" },
      { name: "민법 (위임·도급)", desc: "용역대금 지급, 계약 해지, 손해배상", url: "https://www.law.go.kr/법령/민법" },
      { name: "공정거래법", desc: "거래상 지위 남용, 불공정 거래행위 제한", url: "https://www.law.go.kr/법령/독점규제및공정거래에관한법률" }
    ]
  }
];

function ContractPreview() {
  return (
    <div className="contract-paper relative overflow-hidden rounded-lg border border-ink/10 p-4 shadow-panel sm:p-5">
      <div className="rounded-md bg-white p-4 shadow-sm">
        <div className="mb-5 flex items-center justify-between border-b border-ink/10 pb-3">
          <div>
            <p className="text-xs font-bold text-ink/45">전월세 계약서</p>
            <p className="mt-1 text-lg font-black text-ink">특약 조항 점검</p>
          </div>
          <RiskBadge level="high" size="sm" />
        </div>

        <div className="space-y-3">
          <div className="rounded-md border border-danger/20 bg-danger/8 p-3">
            <div className="mb-2 flex items-center justify-between gap-3">
              <p className="text-sm font-black text-ink">계약갱신요구권 포기</p>
              <RiskBadge level="danger" label="불법 가능" size="sm" />
            </div>
            <p className="text-xs leading-5 text-ink/60">법정 권리를 사전에 포기시키는 문구는 서명 전 수정이 필요합니다.</p>
          </div>

          <div className="rounded-md border border-warn/20 bg-warn/8 p-3">
            <div className="mb-2 flex items-center justify-between gap-3">
              <p className="text-sm font-black text-ink">모든 수리비 임차인 부담</p>
              <RiskBadge level="warning" label="불리함" size="sm" />
            </div>
            <p className="text-xs leading-5 text-ink/60">입주 전 하자와 사용 중 과실을 분리하도록 권고합니다.</p>
          </div>

          <div className="rounded-md border border-ink/10 bg-paper p-3">
            <div className="mb-2 flex items-center justify-between gap-3">
              <p className="text-sm font-black text-ink">보증금 반환 시점</p>
              <RiskBadge level="missing" size="sm" />
            </div>
            <p className="text-xs leading-5 text-ink/60">목적물 인도와 반환일을 명확히 적는 편이 좋습니다.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function HomePage() {
  return (
    <main className="min-h-screen">
      <BetaBanner />

      <header className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-5 sm:px-6 lg:px-8">
        <Link className="shrink-0 text-xl font-black text-ink" href="/">
          내편계약서
        </Link>
        <Link
          className="inline-flex shrink-0 items-center gap-2 rounded-full bg-ink px-4 py-2 text-sm font-bold text-paper transition hover:bg-sage"
          href="/payment"
        >
          분석 시작
          <ArrowRight aria-hidden="true" className="h-4 w-4" />
        </Link>
      </header>

      {/* Hero */}
      <section className="mx-auto grid max-w-6xl items-center gap-8 overflow-hidden px-5 pb-14 pt-6 sm:px-6 lg:grid-cols-[0.95fr_1.05fr] lg:px-8 lg:pb-20 lg:pt-10" id="hero">
        <div className="fade-up min-w-0">
          <p className="mb-4 inline-flex items-center rounded-full border border-sage/20 bg-sage/10 px-3 py-1 text-sm font-bold text-sage">
            전월세·근로 계약서 분석
          </p>
          <h1 className="max-w-full text-[2.15rem] font-black leading-[1.18] text-ink sm:text-5xl lg:text-[3.4rem]">
            받은 계약서,<br />
            사인 전에 내 편인지<br className="lg:hidden" /> 확인하세요
          </h1>
          <p className="mt-5 max-w-xl text-base leading-8 text-ink/68 sm:text-lg">
            전월세·근로 계약서의 불리한 조항, 불법 가능 문구, 빠진 보호 조항을
            법령 근거와 함께 쉬운 말로 정리합니다.
          </p>
          <div className="mt-7">
          <div className="mb-3 flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="inline-flex items-center rounded-full border border-rose-100 bg-rose-50 px-2.5 py-0.5 text-xs font-black text-rose-500">
              출시 특가 56% 할인
            </span>
            <span className="text-sm text-ink/40 line-through">8,900원</span>
            <span className="text-sm font-black text-ink">→ 3,900원</span>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-ink px-5 py-4 text-base font-black text-paper shadow-lg shadow-ink/15 transition hover:bg-sage"
              href="/payment"
            >
              3,900원으로 분석하기
              <ArrowRight aria-hidden="true" className="h-5 w-5" />
            </Link>
            <Link
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-ink/12 bg-white px-5 py-4 text-base font-black text-ink transition hover:border-sage/40 hover:text-sage"
              href="/upload"
            >
              코드 있으면 바로 분석
            </Link>
          </div>
          </div>
          <div className="mt-6 grid grid-cols-1 gap-2 text-sm font-bold text-ink/60 sm:max-w-lg sm:grid-cols-3">
            <div className="flex min-w-0 items-center gap-1.5">
              <CheckCircle2 aria-hidden="true" className="h-4 w-4 text-safe" />
              법령 근거
            </div>
            <div className="flex min-w-0 items-center gap-1.5">
              <CheckCircle2 aria-hidden="true" className="h-4 w-4 text-safe" />
              쉬운 설명
            </div>
            <div className="flex min-w-0 items-center gap-1.5">
              <CheckCircle2 aria-hidden="true" className="h-4 w-4 text-safe" />
              수정 권고
            </div>
          </div>
        </div>

        <div className="fade-up min-w-0" id="sample">
          <ContractPreview />
        </div>
      </section>

      {/* AI 참고용 고지 배너 */}
      <section className="border-y border-warn/20 bg-warn/8">
        <div className="mx-auto flex max-w-6xl items-start gap-4 px-5 py-5 sm:px-6 lg:items-center lg:px-8">
          <AlertTriangle aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0 text-warn lg:mt-0" />
          <div className="flex-1">
            <p className="text-sm font-black text-ink">AI 분석 결과는 참고용입니다 — 법적 효력이 없습니다</p>
            <p className="mt-1 text-sm leading-6 text-ink/68">
              본 서비스는 AI와 규칙 기반 점검으로 계약서를 분석합니다. AI는 완벽하지 않으며 법령 해석은 상황과 맥락에 따라 달라질 수 있습니다.
              분석 결과를 <strong>절대 맹신하지 마시고</strong>, 중요한 계약일수록 반드시 법률 전문가와 상담하세요.
            </p>
          </div>
        </div>
      </section>

      {/* 사용자 후기 */}
      <section className="mx-auto max-w-6xl px-5 py-14 sm:px-6 lg:px-8">
        <div className="mb-8 max-w-xl">
          <p className="mb-2 text-sm font-black text-sage">이용 후기</p>
          <h2 className="text-2xl font-black leading-tight text-ink sm:text-3xl" id="reviews-heading">이런 분들이 활용하고 있어요</h2>
          <p className="mt-2 text-sm text-ink/50">아래는 실제 이용 상황을 바탕으로 구성한 예시 시나리오입니다.</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[
            {
              text: "부동산 계약 전날 넣어봤는데 '계약갱신요구권 포기' 조항을 잡아줬어요. 변호사 상담 전에 미리 알아서 다행이었어요.",
              name: "이○○",
              label: "전월세 계약서",
              color: "bg-safe/10 text-safe",
            },
            {
              text: "포괄임금제 조항이 근로기준법 위반인지 몰랐는데, 법령 조항 번호까지 알려줘서 인사팀에 이의제기할 수 있었어요.",
              name: "김○○",
              label: "근로계약서",
              color: "bg-warn/10 text-warn",
            },
            {
              text: "인테리어 계약서에 하자보수 책임이 빠져있다고 짚어줘서 특약 넣고 서명했어요. 3,900원이 전혀 아깝지 않았습니다.",
              name: "박○○",
              label: "인테리어 계약서",
              color: "bg-sage/10 text-sage",
            },
            {
              text: "프리랜서라 저작권 조항 항상 불안했는데 AI가 위험 조항 정확히 짚어주고 수정 문구까지 알려줘서 협상에 써먹었어요.",
              name: "최○○",
              label: "프리랜서 계약서",
              color: "bg-safe/10 text-safe",
            },
            {
              text: "알바 계약서 들고 갔더니 최저임금 계산이 잘못된 거 잡아줬어요. 사장님한테 바로 수정 요청했습니다.",
              name: "정○○",
              label: "근로계약서",
              color: "bg-warn/10 text-warn",
            },
            {
              text: "전세 보증금 반환 특약이 없다는 걸 알아서 넣고 계약했어요. 나중에 문제 생겼을 때 특약 덕분에 바로 해결됐습니다.",
              name: "강○○",
              label: "전월세 계약서",
              color: "bg-sage/10 text-sage",
            },
          ].map((review) => (
            <article
              key={review.name}
              className="flex flex-col gap-3 rounded-lg border border-ink/8 bg-white p-5 shadow-sm"
            >
              <div className="flex gap-0.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <svg key={i} className="h-4 w-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <p className="flex-1 text-sm leading-7 text-ink/75">&ldquo;{review.text}&rdquo;</p>
              <div className="flex items-center justify-between">
                <span className="text-sm font-black text-ink">{review.name}</span>
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${review.color}`}>{review.label}</span>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* 사용법 단계별 가이드 */}
      <section className="mx-auto max-w-6xl px-5 py-14 sm:px-6 lg:px-8 lg:py-20" id="how-to">
        <div className="mb-10 max-w-2xl">
          <p className="mb-2 text-sm font-black text-sage">이용 방법</p>
          <h2 className="text-3xl font-black leading-tight text-ink">4단계로 계약서를 분석합니다</h2>
          <p className="mt-3 text-base leading-7 text-ink/65">
            계약서 내용 입력부터 결과 확인까지. 변호사 없이 법령 근거와 함께 쉽고 빠르게 확인하세요.
          </p>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {howToSteps.map((step) => {
            const Icon = step.icon;
            return (
              <article
                className="relative rounded-lg border border-ink/10 bg-white p-5 shadow-sm"
                key={step.step}
              >
                <div className="mb-4 flex items-center gap-3">
                  <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-sage text-xs font-black text-white">
                    {step.step}
                  </span>
                  <div className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-sage/10 text-sage">
                    <Icon aria-hidden="true" className="h-4 w-4" />
                  </div>
                </div>
                <h3 className="text-lg font-black text-ink">{step.title}</h3>
                <p className="mt-2 text-sm leading-6 text-ink/65">{step.desc}</p>
                <p className="mt-3 rounded-md bg-paper px-3 py-2 text-xs leading-5 text-ink/55">{step.detail}</p>
              </article>
            );
          })}
        </div>
      </section>

      {/* 결과 미리보기 */}
      <section className="bg-white/68">
        <div className="mx-auto max-w-6xl px-5 py-14 sm:px-6 lg:px-8">
          <div className="mb-10 max-w-2xl">
            <p className="mb-2 text-sm font-black text-sage">분석 결과 구성</p>
            <h2 className="text-3xl font-black leading-tight text-ink">결과는 이렇게 나옵니다</h2>
            <p className="mt-3 text-base leading-7 text-ink/65">
              전월세·근로·인테리어·프리랜서 계약서 모두 동일한 방식으로 분석됩니다. 조항마다 위험 등급을 매기고,
              실제 법 조항 근거·쉬운 설명·수정 권고 문구를 한 카드에 모아 보여줍니다.
            </p>
          </div>

          <div className="grid gap-5 lg:grid-cols-2">
            {resultPreviewItems.map((item) => (
              <div
                className={`rounded-xl border p-6 ${item.color}`}
                key={item.badge}
              >
                {/* 헤더 */}
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xl" aria-hidden="true">{item.emoji}</span>
                    <p className={`text-base font-black ${item.badgeColor}`}>{item.badge}</p>
                  </div>
                  <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${item.tagColor}`}>{item.tag}</span>
                </div>

                {/* 설명 */}
                <p className="mb-4 text-sm leading-6 text-ink/72">{item.desc}</p>

                {/* 예시 */}
                <div className="mb-4 space-y-2">
                  <p className="text-xs font-bold uppercase tracking-wide text-ink/45">실제 예시</p>
                  {item.examples.map((ex) => (
                    <div className="flex items-start gap-2" key={ex.type}>
                      <span className="mt-0.5 shrink-0 rounded-full bg-ink/8 px-2 py-0.5 text-xs font-bold text-ink/60">{ex.type}</span>
                      <p className="text-sm font-semibold text-ink">{ex.text}</p>
                    </div>
                  ))}
                </div>

                {/* 분석 카드에 포함되는 것 */}
                <div className="rounded-md bg-white/60 px-3 py-2">
                  <p className="text-xs leading-5 text-ink/60">
                    <span className="font-bold text-ink/75">카드에 포함: </span>{item.what}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* 공통 포함 정보 */}
          <div className="mt-8 rounded-xl border border-sage/20 bg-sage/8 p-6">
            <p className="mb-4 text-sm font-black text-sage">모든 분석 결과 카드에 포함되는 정보</p>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 text-sm">
              {[
                { icon: true, text: "조항 원문 그대로 표시" },
                { icon: true, text: "위험 등급 (위험·불리·정상·누락)" },
                { icon: true, text: "실제 법 조항 번호 및 원문 링크" },
                { icon: true, text: "법률 용어 없이 쉬운 말 설명" },
                { icon: true, text: "수정·삭제·추가 권고 문구 제시" },
                { icon: true, text: "30일간 결과 재조회 링크 제공" }
              ].map((row) => (
                <div className="flex items-start gap-2" key={row.text}>
                  <CheckCircle2 aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-safe" />
                  <span className="text-ink/75">{row.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 적용 법령 공개 */}
      <section className="mx-auto max-w-6xl px-5 py-14 sm:px-6 lg:px-8" id="laws">
        <div className="mb-10 max-w-2xl">
          <p className="mb-2 text-sm font-black text-sage">실제 법령 근거</p>
          <h2 className="text-3xl font-black leading-tight text-ink">어떤 법을 기준으로 분석하나요</h2>
          <p className="mt-3 text-base leading-7 text-ink/65">
            국가법령정보센터(law.go.kr)의 공식 법령을 직접 참조합니다. 법이 개정되면 반영됩니다.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {lawBases.map((group) => (
            <div className="rounded-lg border border-ink/10 bg-white p-5 shadow-sm" key={group.category}>
              <div className="mb-4 flex items-center gap-2">
                <Scale aria-hidden="true" className="h-5 w-5 text-sage" />
                <h3 className="text-lg font-black text-ink">{group.category}</h3>
              </div>
              <div className="space-y-3">
                {group.laws.map((law) => (
                  <div className="flex flex-col gap-1" key={law.name}>
                    <a
                      className="inline-flex items-center gap-1.5 text-sm font-bold text-sage hover:underline"
                      href={law.url}
                      rel="noreferrer"
                      target="_blank"
                    >
                      <BookOpen aria-hidden="true" className="h-3.5 w-3.5 shrink-0" />
                      {law.name} ↗
                    </a>
                    <p className="text-xs leading-5 text-ink/60 pl-5">{law.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 rounded-lg border border-ink/10 bg-paper p-5">
          <div className="flex items-start gap-3">
            <AlertTriangle aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0 text-warn" />
            <div>
              <p className="text-sm font-black text-ink">법령 적용의 한계 — 반드시 읽어주세요</p>
              <p className="mt-1 text-sm leading-6 text-ink/68">
                본 서비스는 공개된 법령 텍스트를 AI와 규칙 기반으로 대조합니다. 법령 해석은 구체적인 사실관계와 맥락에 따라 달라지며,
                AI가 모든 경우를 정확히 판단하지는 못합니다. 분석 결과는 <strong>참고용으로만</strong> 활용하고,
                중요한 계약은 반드시 법률 전문가(변호사, 노무사 등)와 상담하세요.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 분석 흐름 */}
      <section className="bg-white/68">
        <div className="mx-auto max-w-6xl px-5 py-12 sm:px-6 lg:px-8">
          <div className="mb-8 max-w-2xl">
            <p className="mb-2 text-sm font-black text-sage">분석 흐름</p>
            <h2 className="text-3xl font-black leading-tight text-ink">계약서 한 건을 끝까지 보는 화면</h2>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {flow.map((item) => {
              const Icon = item.icon;

              return (
                <article className="rounded-lg border border-ink/10 bg-white p-5 shadow-sm" key={item.title}>
                  <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-full bg-sage/10 text-sage">
                    <Icon aria-hidden="true" className="h-5 w-5" />
                  </div>
                  <h3 className="text-xl font-black text-ink">{item.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-ink/62">{item.body}</p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      {/* 지원 범위 */}
      <section className="mx-auto grid max-w-6xl gap-5 px-5 py-12 sm:px-6 lg:grid-cols-[0.8fr_1.2fr] lg:px-8" id="features">
        <div>
          <p className="mb-2 text-sm font-black text-sage">현재 지원 범위</p>
          <h2 className="text-3xl font-black leading-tight text-ink">지금 분석할 수 있는 계약서</h2>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-ink/10 bg-white p-5 transition hover:-translate-y-0.5 hover:border-sage/30 hover:shadow-md">
            <ShieldCheck aria-hidden="true" className="mb-4 h-6 w-6 text-safe" />
            <h3 className="text-lg font-black text-ink">전월세 계약서</h3>
            <p className="mt-2 text-sm leading-6 text-ink/65">
              보증금 반환, 계약갱신요구권, 전입신고·확정일자, 수리비 부담, 임대인 방문 조항을 확인합니다.
            </p>
          </div>
          <div className="rounded-xl border border-ink/10 bg-white p-5 transition hover:-translate-y-0.5 hover:border-sage/30 hover:shadow-md">
            <MessageSquareText aria-hidden="true" className="mb-4 h-6 w-6 text-brass" />
            <h3 className="text-lg font-black text-ink">근로 계약서</h3>
            <p className="mt-2 text-sm leading-6 text-ink/65">
              임금·수당, 근로시간, 휴게·휴일, 연차 유급휴가, 퇴사 위약금 조항을 확인합니다.
            </p>
          </div>
          <div className="rounded-xl border border-ink/10 bg-white p-5 transition hover:-translate-y-0.5 hover:border-sage/30 hover:shadow-md">
            <Hammer aria-hidden="true" className="mb-4 h-6 w-6 text-sage" />
            <h3 className="text-lg font-black text-ink">인테리어 계약서</h3>
            <p className="mt-2 text-sm leading-6 text-ink/65">
              공사대금 지급 구조, 공사 기간, 하자보수 책임, 자재 명세, 감리 권한 조항을 확인합니다.
            </p>
          </div>
          <div className="rounded-xl border border-ink/10 bg-white p-5 transition hover:-translate-y-0.5 hover:border-sage/30 hover:shadow-md">
            <Palette aria-hidden="true" className="mb-4 h-6 w-6 text-danger" />
            <h3 className="text-lg font-black text-ink">프리랜서 계약서</h3>
            <p className="mt-2 text-sm leading-6 text-ink/65">
              저작권 귀속, 수정 횟수, 대금 지급 기한, 경업 금지, 손해배상 조항을 확인합니다.
            </p>
          </div>
        </div>
      </section>

      <LegalDisclaimer />

      {/* FAQ — GEO: AI 검색 엔진이 인용하기 쉬운 Q&A 구조 */}
      <section className="mx-auto max-w-6xl px-5 py-14 sm:px-6 lg:px-8" id="faq">
        <div className="mb-10 max-w-2xl">
          <p className="mb-2 text-sm font-black text-sage">자주 묻는 질문</p>
          <h2 className="text-3xl font-black leading-tight text-ink">내편계약서에 대해 궁금하신가요</h2>
        </div>
        <div className="divide-y divide-ink/8">
          {[
            {
              q: "내편계약서가 무엇인가요?",
              a: "내편계약서는 전월세, 근로, 인테리어, 프리랜서 계약서를 업로드하면 AI가 주택임대차보호법, 근로기준법 등 실제 법령과 대조하여 불리한 조항, 불법 가능 문구, 빠진 보호 조항을 즉시 분석해주는 서비스입니다. 변호사 없이도 계약서의 위험 조항을 쉽게 파악할 수 있습니다.",
            },
            {
              q: "어떤 계약서를 분석할 수 있나요?",
              a: "전월세(임대차) 계약서, 근로 계약서, 인테리어(도급) 계약서, 프리랜서 계약서를 지원합니다. TXT, PDF, 사진(JPG/PNG) 파일을 업로드하거나 텍스트를 직접 붙여넣어 분석할 수 있으며, 최대 20,000자까지 지원합니다.",
            },
            {
              q: "분석 결과를 법적 효력으로 사용할 수 있나요?",
              a: "아닙니다. 내편계약서의 분석 결과는 AI 기반의 참고용 정보이며 법적 효력이 없습니다. 법령 해석은 구체적인 사실관계와 맥락에 따라 달라질 수 있으므로, 중요한 계약은 반드시 변호사, 노무사 등 법률 전문가와 상담하세요.",
            },
            {
              q: "어떤 법령을 기준으로 분석하나요?",
              a: "국가법령정보센터(law.go.kr)의 공식 법령을 실시간으로 참조합니다. 전월세는 주택임대차보호법·민법, 근로계약은 근로기준법·최저임금법·근로자퇴직급여보장법, 인테리어는 민법(도급)·건설산업기본법, 프리랜서는 저작권법·민법(위임·도급)을 기준으로 합니다.",
            },
            {
              q: "분석 코드는 어떻게 받나요?",
              a: "계좌이체 후 운영자가 입금을 확인하면 문자(SMS)로 6자리 분석 코드가 발송됩니다. 보통 수 분 이내에 받을 수 있습니다.",
            },
            {
              q: "계약서 분석에 얼마나 걸리나요?",
              a: "코드 입력 후 AI 분석은 보통 10~30초 이내에 완료됩니다. PDF·사진 파일은 OCR 텍스트 추출 과정이 추가되어 약간 더 소요될 수 있습니다.",
            },
            {
              q: "계약서에서 위험 조항이 발견되면 어떻게 되나요?",
              a: "위험 조항마다 실제 법 조항 번호, 위법 이유, 삭제·수정 권고 문구를 함께 제시합니다. 🔴 위험(불법 가능), 🟡 불리한 조항, ⚠️ 빠진 조항, 🟢 정상 조항으로 등급을 나누어 카드 형태로 보여드립니다.",
            },
            {
              q: "계약갱신요구권이란 무엇이고 포기할 수 없나요?",
              a: "계약갱신요구권은 임차인이 계약 만료 전 계약 갱신을 요구할 수 있는 법정 권리입니다(주택임대차보호법 제6조의3). 사전에 이 권리를 포기하도록 하는 특약 조항은 임차인에게 불리한 것으로 효력이 없습니다. 계약서에 '계약갱신요구권을 포기한다'는 문구가 있다면 반드시 삭제를 요구하세요.",
            },
            {
              q: "퇴직 위약금 조항은 합법인가요?",
              a: "근로기준법 제20조는 근로계약 불이행에 대한 위약금 또는 손해배상액을 예정하는 계약을 금지하고 있습니다. 따라서 '퇴사 시 위약금 OOO만 원을 지급한다'는 조항은 위법이며 무효입니다. 단, 사용자가 실제로 입은 손해를 근거로 청구하는 손해배상은 별개입니다.",
            },
            {
              q: "인테리어 계약서에서 가장 먼저 확인해야 할 것은?",
              a: "하자보수 책임 기간과 범위, 공사 완료 기준, 기성금(단계별 공사비 지급) 구조를 먼저 확인하세요. 건설산업기본법에 따라 공사 완료 후 일정 기간 하자보수 책임이 있습니다. '하자보수 책임 없음' 조항은 약관의 규제에 관한 법률 위반 소지가 있습니다.",
            },
            {
              q: "프리랜서 계약서에서 저작권은 어떻게 확인해야 하나요?",
              a: "저작물을 만들면 원칙적으로 창작자(프리랜서)에게 저작권이 귀속됩니다(저작권법 제10조). 업무상저작물의 경우 법인 귀속이 될 수 있으나(제9조), 사전 계약으로 무상 양도하도록 강제하는 조항은 불리할 수 있습니다. 저작권 귀속과 2차 저작물 작성권 조항을 반드시 확인하세요.",
            },
            {
              q: "계약서 사진을 찍어서 분석할 수 있나요?",
              a: "네, 스마트폰으로 계약서를 촬영한 JPG·PNG 사진 파일을 업로드하면 OCR(광학문자인식) 기술로 텍스트를 자동 추출한 뒤 분석합니다. 계약서 전체가 선명하게 찍히도록 조명이 밝은 곳에서 촬영하면 인식 정확도가 높아집니다. PDF 파일도 동일하게 지원합니다.",
            },
          ].map(({ q, a }) => (
            <details
              className="group py-5 open:pb-6"
              key={q}
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4">
                <h3 className="text-base font-black text-ink">{q}</h3>
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-ink/15 text-ink/50 transition group-open:rotate-45 group-open:border-sage/30 group-open:text-sage">
                  +
                </span>
              </summary>
              <p className="mt-4 text-sm leading-7 text-ink/68">{a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* 공유 섹션 */}
      <section className="border-y border-sage/15 bg-sage/6">
        <div className="mx-auto max-w-6xl px-5 py-12 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-xl text-center">
            <p className="mb-2 text-sm font-black text-sage">주변에 알리기</p>
            <h2 className="text-2xl font-black leading-tight text-ink sm:text-3xl">
              계약서 걱정하는 친구에게<br />알려주세요
            </h2>
            <p className="mt-3 text-sm leading-7 text-ink/60">
              전월세 계약, 취업, 프리랜서 시작 전 공유하면 실질적인 도움이 됩니다.
            </p>
            <div className="mt-6">
              <ShareButtons />
            </div>
          </div>
        </div>
      </section>

      <footer className="mx-auto flex max-w-6xl flex-col gap-3 px-5 py-8 text-sm font-semibold text-ink/50 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
        <p>내편계약서</p>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
          <Link href="/privacy" className="transition hover:text-sage">
            개인정보처리방침
          </Link>
          <Link href="/terms" className="transition hover:text-sage">
            이용약관
          </Link>
          <p>전월세·근로·인테리어·프리랜서 계약서 분석</p>
        </div>
      </footer>
    </main>
  );
}
