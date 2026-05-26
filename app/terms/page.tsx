import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const metadata = {
  title: "이용약관 | 내편계약서",
  description: "내편계약서 이용약관. 서비스 이용 조건과 제한사항을 안내합니다.",
  alternates: { canonical: "/terms" },
};

const sections = [
  {
    title: "제1조 (서비스의 목적)",
    body: [
      "내편계약서(이하 '서비스')는 전월세·근로·인테리어·프리랜서 계약서를 AI로 분석하여 불리한 조항, 불법 가능 문구, 빠진 보호 조항을 법령 근거와 함께 안내하는 참고용 분석 서비스입니다.",
      "본 서비스는 사업자 등록 없이 운영되는 개인 서비스입니다. 문의사항은 이메일로만 접수됩니다.",
    ],
  },
  {
    title: "제2조 (분석 결과의 성격)",
    body: [
      "본 서비스가 제공하는 분석 결과는 AI 기반의 참고용 정보이며, 법적 효력이나 법률 자문의 효력을 갖지 않습니다. 법령 해석은 구체적인 사실관계와 맥락에 따라 달라질 수 있으므로, 중요한 계약은 반드시 변호사·노무사 등 법률 전문가와 상담하시기 바랍니다.",
    ],
  },
  {
    title: "제3조 (이용 요금)",
    body: [
      "계약서 분석 비용은 1건당 3,900원입니다. 결제는 계좌이체로 진행되며, 입금 확인 후 분석에 사용할 6자리 코드가 발급됩니다. 요금은 서비스 정책에 따라 변경될 수 있으며, 변경 시 사전에 고지합니다.",
    ],
  },
  {
    title: "제4조 (환불 정책)",
    body: [
      "분석 코드 발급 후 분석을 완료하기 전이라면 전액 환불이 가능합니다. 단, AI 분석이 완료되어 결과가 제공된 이후에는 서비스가 이미 이행되었으므로 환불이 불가능합니다.",
      "이용자가 분석을 실행하는 행위는 전자상거래 등에서의 소비자보호에 관한 법률 제17조 제2항에 따라 디지털 콘텐츠의 제공이 개시된 것에 동의한 것으로 간주되며, 이에 따라 청약 철회권이 제한될 수 있습니다.",
      "환불을 원하시는 경우 결제 정보와 함께 skfkgksrnr@gmail.com 으로 요청해 주시기 바랍니다.",
    ],
  },
  {
    title: "제5조 (이용자의 의무)",
    body: [
      "이용자는 본인이 정당하게 보유하거나 분석 권한이 있는 계약서만 업로드해야 합니다. 타인의 계약서를 무단으로 분석하거나, 서비스를 불법적인 목적으로 이용해서는 안 됩니다.",
    ],
  },
  {
    title: "제6조 (책임의 제한)",
    body: [
      "AI 분석은 완벽하지 않으며, 오분석·누락·해석 차이가 발생할 수 있습니다. 본 서비스는 분석 결과를 신뢰하여 이용자가 내린 의사결정이나 그로 인해 발생한 손해에 대해 법적 책임을 지지 않습니다.",
      "분석 결과는 어디까지나 계약서 검토의 보조 수단이며, 최종 판단과 계약 체결의 책임은 이용자 본인에게 있습니다.",
    ],
  },
  {
    title: "제7조 (서비스의 변경 및 중단)",
    body: [
      "서비스는 기술적 사유, 운영상의 필요에 따라 내용이 변경되거나 일시적으로 중단될 수 있습니다. 중대한 변경이 있을 경우 사전에 고지하도록 노력합니다.",
    ],
  },
  {
    title: "제8조 (개인정보의 보호)",
    body: [
      "업로드된 계약서 내용과 분석 결과는 분석 완료일로부터 30일간 보관 후 자동 삭제됩니다. 자세한 내용은 개인정보처리방침을 참고하시기 바랍니다.",
    ],
  },
  {
    title: "제9조 (문의)",
    body: [
      "서비스 이용에 관한 문의는 skfkgksrnr@gmail.com 으로 연락해 주시기 바랍니다.",
    ],
  },
];

export default function TermsPage() {
  return (
    <main className="min-h-screen">
      <header className="mx-auto flex max-w-3xl items-center justify-between gap-4 px-5 py-5 sm:px-6">
        <Link className="shrink-0 text-xl font-black text-ink" href="/">
          내편계약서
        </Link>
        <Link
          className="inline-flex items-center gap-1.5 text-sm font-bold text-ink/55 transition hover:text-sage"
          href="/"
        >
          <ArrowLeft aria-hidden="true" className="h-4 w-4" />
          홈으로
        </Link>
      </header>

      <article className="mx-auto max-w-3xl px-5 py-8 sm:px-6 sm:py-12">
        <p className="mb-2 text-sm font-black text-sage">서비스 이용 안내</p>
        <h1 className="text-3xl font-black leading-tight text-ink sm:text-4xl">
          이용약관
        </h1>
        <p className="mt-4 text-base leading-7 text-ink/65">
          본 약관은 내편계약서 서비스의 이용 조건과 제한사항을 안내합니다. 서비스를 이용하시면
          본 약관에 동의한 것으로 간주됩니다.
        </p>
        <p className="mt-2 text-sm font-semibold text-ink/45">시행일: 2026년 5월 22일</p>

        <div className="mt-8 rounded-lg border border-warn/20 bg-warn/8 p-4">
          <p className="text-sm font-black text-ink">분석 결과는 참고용입니다</p>
          <p className="mt-1 text-sm leading-6 text-ink/68">
            본 서비스의 AI 분석 결과는 법적 효력이 없습니다. 중요한 계약은 반드시 법률 전문가와
            상담하세요.
          </p>
        </div>

        <div className="mt-10 space-y-9">
          {sections.map((section) => (
            <section key={section.title}>
              <h2 className="text-lg font-black text-ink">{section.title}</h2>
              {section.body.map((paragraph) => (
                <p className="mt-3 text-sm leading-7 text-ink/70" key={paragraph}>
                  {paragraph}
                </p>
              ))}
            </section>
          ))}
        </div>

        <div className="mt-12 flex flex-wrap items-center gap-4 border-t border-ink/10 pt-6 text-sm font-bold text-sage">
          <Link className="transition hover:underline" href="/privacy">
            개인정보처리방침 보기
          </Link>
          <Link className="transition hover:underline" href="/">
            홈으로 돌아가기
          </Link>
        </div>
      </article>
    </main>
  );
}
