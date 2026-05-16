import { Scale, ShieldAlert } from "lucide-react";

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
      <div className="mx-auto grid max-w-6xl gap-6 px-5 py-10 sm:px-6 lg:grid-cols-[0.86fr_1.14fr] lg:px-8">
        <div>
          <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-full bg-paper/10">
            <Scale aria-hidden="true" className="h-5 w-5 text-brass" />
          </div>
          <h2 className="text-2xl font-bold leading-tight sm:text-3xl">AI 분석은 최종 판단이 아닙니다</h2>
        </div>
        <div className="space-y-4 text-sm leading-7 text-paper/78 sm:text-base">
          <p>{disclaimer}</p>
          <ul className="grid gap-2">
            <li>본 분석 결과는 참고용으로만 활용하세요.</li>
            <li>중요한 계약일수록 반드시 법률 전문가와 상담하세요.</li>
            <li>본 서비스는 법적 효력이 없으며 분석 결과로 인한 피해에 대해 책임을 지지 않습니다.</li>
          </ul>
        </div>
      </div>
    </section>
  );
}
