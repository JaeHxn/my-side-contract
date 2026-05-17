import { BookOpen, Scale, ShieldAlert } from "lucide-react";

const defaultDisclaimer =
  "본 서비스는 AI가 계약서를 분석하여 참고 정보를 제공합니다. 법령 해석은 상황과 맥락에 따라 달라질 수 있으며, 분석 결과가 항상 정확하다고 보장할 수 없습니다.";

export function LegalDisclaimer({
  compact = false,
  disclaimer = defaultDisclaimer
}: {
  compact?: boolean;
  disclaimer?: string;
}) {
  if (compact) {
    return (
      <div className="rounded-lg border border-ink/10 bg-white/78 p-4 text-sm leading-6 text-ink/70 shadow-sm">
        <div className="mb-3 flex items-center gap-2 rounded-md bg-sage/10 px-3 py-2">
          <BookOpen aria-hidden="true" className="h-4 w-4 shrink-0 text-sage" />
          <p className="text-xs font-black text-sage">실제 법 조항에 근거한 분석</p>
        </div>
        <div className="mb-2 flex items-center gap-2 font-semibold text-ink">
          <ShieldAlert aria-hidden="true" className="h-4 w-4 text-brass" />
          법적 고지
        </div>
        <p>{disclaimer}</p>
        <p className="mt-2">중요한 계약일수록 반드시 법률 전문가와 상담하세요.</p>
      </div>
    );
  }

  return (
    <section className="border-y border-ink/10 bg-ink text-paper">
      <div className="mx-auto max-w-6xl px-5 py-10 sm:px-6 lg:px-8">

        {/* ── 핵심 강조 배너 ── */}
        <div className="mb-8 flex flex-col items-center gap-3 rounded-xl border border-sage/30 bg-sage/15 px-6 py-6 text-center sm:flex-row sm:text-left">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-sage/25">
            <BookOpen aria-hidden="true" className="h-7 w-7 text-sage" />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-sage/80">분석 기준</p>
            <p className="mt-1 text-xl font-black leading-snug text-paper sm:text-2xl">
              국가법령정보센터의 실제 법 조항을 직접 참조하여 분석합니다
            </p>
            <p className="mt-1.5 text-sm leading-6 text-paper/65">
              ChatGPT와 달리 학습 데이터가 아닌 <span className="font-bold text-sage">법령 원문</span>을 기준으로 조항을 대조합니다.
              법이 개정되면 반영됩니다.
            </p>
          </div>
        </div>

        {/* ── 면책 고지 ── */}
        <div className="grid gap-6 lg:grid-cols-[0.86fr_1.14fr]">
          <div>
            <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-full bg-paper/10">
              <Scale aria-hidden="true" className="h-5 w-5 text-brass" />
            </div>
            <h2 className="text-2xl font-bold leading-tight sm:text-3xl">
              그래도 AI 분석은<br />최종 판단이 아닙니다
            </h2>
          </div>
          <div className="space-y-4 text-sm leading-7 text-paper/78 sm:text-base">
            <p>{disclaimer}</p>
            <ul className="grid gap-2">
              <li className="flex items-start gap-2">
                <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-paper/50" />
                본 분석 결과는 <strong className="text-paper">참고용으로만</strong> 활용하세요.
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-paper/50" />
                중요한 계약일수록 반드시 <strong className="text-paper">법률 전문가와 상담</strong>하세요.
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-paper/50" />
                본 서비스는 법적 효력이 없으며 분석 결과로 인한 피해에 대해 책임을 지지 않습니다.
              </li>
            </ul>
          </div>
        </div>

      </div>
    </section>
  );
}
