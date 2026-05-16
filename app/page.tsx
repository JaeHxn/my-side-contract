import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  FileSearch,
  FileText,
  LockKeyhole,
  MessageSquareText,
  ShieldCheck
} from "lucide-react";
import { LegalDisclaimer } from "@/components/legal-disclaimer";
import { RiskBadge } from "@/components/risk-badge";

const flow = [
  {
    title: "계약서 입력",
    body: "전월세 계약서 내용을 붙여넣거나 텍스트 파일로 올립니다.",
    icon: FileText
  },
  {
    title: "코드 확인",
    body: "MVP 분석 코드를 입력하면 서버에서 법령 근거와 함께 점검합니다.",
    icon: LockKeyhole
  },
  {
    title: "결과 검토",
    body: "위험, 주의, 정상, 누락 조항을 카드로 나눠 확인합니다.",
    icon: FileSearch
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
      <header className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5 sm:px-6 lg:px-8">
        <Link className="text-xl font-black text-ink" href="/">
          내편계약서
        </Link>
        <Link
          className="inline-flex items-center gap-2 rounded-full bg-ink px-4 py-2 text-sm font-bold text-paper transition hover:bg-sage"
          href="/upload"
        >
          분석 시작
          <ArrowRight aria-hidden="true" className="h-4 w-4" />
        </Link>
      </header>

      <section className="mx-auto grid max-w-6xl items-center gap-8 px-5 pb-14 pt-6 sm:px-6 lg:grid-cols-[0.95fr_1.05fr] lg:px-8 lg:pb-20 lg:pt-10">
        <div className="fade-up">
          <p className="mb-4 inline-flex items-center rounded-full border border-sage/20 bg-sage/10 px-3 py-1 text-sm font-bold text-sage">
            주거 계약서 MVP
          </p>
          <h1 className="text-balance text-4xl font-black leading-tight text-ink sm:text-5xl lg:text-6xl">
            받은 계약서, 사인 전에 내 편인지 확인하세요
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-ink/68">
            전월세 계약서의 불리한 조항, 불법 가능 문구, 빠진 보호 조항을 법령 근거와 함께 쉬운 말로 정리합니다.
          </p>
          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <Link
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-ink px-5 py-4 text-base font-black text-paper shadow-lg shadow-ink/15 transition hover:bg-sage"
              href="/upload"
            >
              계약서 분석하기
              <ArrowRight aria-hidden="true" className="h-5 w-5" />
            </Link>
            <a
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-ink/12 bg-white px-5 py-4 text-base font-black text-ink transition hover:border-sage/40 hover:text-sage"
              href="#sample"
            >
              결과 카드 보기
            </a>
          </div>
          <div className="mt-6 grid grid-cols-3 gap-2 text-sm font-bold text-ink/60 sm:max-w-lg">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 aria-hidden="true" className="h-4 w-4 text-safe" />
              법령 근거
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 aria-hidden="true" className="h-4 w-4 text-safe" />
              쉬운 설명
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 aria-hidden="true" className="h-4 w-4 text-safe" />
              수정 권고
            </div>
          </div>
        </div>

        <div className="fade-up" id="sample">
          <ContractPreview />
        </div>
      </section>

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

      <section className="mx-auto grid max-w-6xl gap-5 px-5 py-12 sm:px-6 lg:grid-cols-[0.8fr_1.2fr] lg:px-8">
        <div>
          <p className="mb-2 text-sm font-black text-sage">MVP 범위</p>
          <h2 className="text-3xl font-black leading-tight text-ink">지금은 전월세 계약서에 집중합니다</h2>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-lg border border-ink/10 bg-white p-5">
            <ShieldCheck aria-hidden="true" className="mb-4 h-6 w-6 text-safe" />
            <h3 className="text-lg font-black text-ink">우선 점검하는 항목</h3>
            <p className="mt-2 text-sm leading-6 text-ink/65">
              보증금 반환, 계약갱신요구권, 전입신고와 확정일자, 수리비 부담, 임대인 방문 조항을 확인합니다.
            </p>
          </div>
          <div className="rounded-lg border border-ink/10 bg-white p-5">
            <MessageSquareText aria-hidden="true" className="mb-4 h-6 w-6 text-brass" />
            <h3 className="text-lg font-black text-ink">결과 카드 구성</h3>
            <p className="mt-2 text-sm leading-6 text-ink/65">
              원문, 문제 이유, 법령 근거, 수정 권고를 한 카드에서 확인하도록 구성했습니다.
            </p>
          </div>
        </div>
      </section>

      <LegalDisclaimer />

      <footer className="mx-auto flex max-w-6xl flex-col gap-3 px-5 py-8 text-sm font-semibold text-ink/50 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
        <p>내편계약서 MVP</p>
        <p>전월세 계약서 분석부터 시작합니다.</p>
      </footer>
    </main>
  );
}
