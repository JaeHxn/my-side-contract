import Link from "next/link";
import { ArrowLeft, KeyRound, ShieldCheck } from "lucide-react";
import { AccessCodeIssuer } from "./AccessCodeIssuer";

export const metadata = {
  title: "관리자 코드 발급 | 내편계약서"
};

export default function AdminPage() {
  return (
    <div className="min-h-screen">
      <header className="border-b border-ink/10 bg-paper/84 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4 sm:px-6 lg:px-8">
          <Link className="text-lg font-black text-ink" href="/">
            내편계약서
          </Link>
          <Link
            className="inline-flex items-center gap-2 rounded-full border border-ink/10 bg-white px-3 py-2 text-sm font-bold text-ink transition hover:border-sage/40 hover:text-sage"
            href="/"
          >
            <ArrowLeft aria-hidden="true" className="h-4 w-4" />
            홈
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-5 py-6 sm:px-6 lg:px-8 lg:py-10">
        <section className="mb-6 rounded-lg border border-ink/10 bg-white p-5 shadow-panel sm:p-7">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <p className="mb-3 inline-flex items-center gap-2 rounded-full border border-sage/20 bg-sage/10 px-3 py-1 text-sm font-black text-sage">
                <ShieldCheck aria-hidden="true" className="h-4 w-4" />
                관리자 전용
              </p>
              <h1 className="break-keep text-3xl font-black leading-tight text-ink sm:text-4xl">
                계약 분석 접근 코드를 발급합니다
              </h1>
              <p className="mt-4 text-base leading-7 text-ink/64">
                구매자 확인 정보를 남기고 6자리 접근 코드를 생성하세요. 발급된 코드는 만료일과 함께 바로 표시됩니다.
              </p>
            </div>
            <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-ink text-paper shadow-lg shadow-ink/15">
              <KeyRound aria-hidden="true" className="h-7 w-7" />
            </div>
          </div>
        </section>

        <AccessCodeIssuer />
      </main>
    </div>
  );
}
