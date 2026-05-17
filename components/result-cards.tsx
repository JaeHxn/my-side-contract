import { AlertTriangle, CalendarClock, CheckCircle2, FileWarning, Gavel, Lightbulb, ListChecks, Quote, Sparkles } from "lucide-react";
import type {
  AnalysisItem,
  ContractAnalysisResult,
  LawReference,
  MissingClause,
  RiskLevel
} from "@/src/lib/contracts/types";
import { formatKoreanDateTime } from "@/src/lib/time/korean-time";
import { RiskBadge } from "./risk-badge";

const riskLabels: Record<RiskLevel, string> = {
  danger: "위험 조항",
  warning: "불리한 조항",
  safe: "정상 조항",
  missing: "빠진 조항"
};

const typeLabels: Record<AnalysisItem["type"], string> = {
  illegal: "불법 가능",
  unfavorable: "불리함",
  normal: "정상",
  missing: "누락"
};

function formatDate(value: string) {
  return formatKoreanDateTime(value, {
    dateStyle: "medium",
    timeStyle: "short"
  });
}

function renderLegalBasis(references: LawReference[]) {
  if (references.length === 0) {
    return <span className="text-ink/45">표시할 법령 근거가 없습니다.</span>;
  }

  return (
    <div className="flex flex-wrap gap-2">
      {references.slice(0, 4).map((reference, index) => {
        const label = [reference.title, reference.article].filter(Boolean).join(" ");

        if (reference.url) {
          return (
            <a
              className="rounded-full border border-ink/10 bg-white px-2.5 py-1 text-xs font-semibold text-sage transition hover:border-sage/40 hover:bg-sage/5"
              href={reference.url}
              key={`${reference.title}-${reference.article || index}`}
              rel="noreferrer"
              target="_blank"
            >
              {label}
            </a>
          );
        }

        return (
          <span
            className="rounded-full border border-ink/10 bg-white px-2.5 py-1 text-xs font-semibold text-ink/65"
            key={`${reference.title}-${reference.article || index}`}
          >
            {label}
          </span>
        );
      })}
    </div>
  );
}

const riskStyles: Record<RiskLevel, { wrap: string; index: string; rail: string }> = {
  danger: {
    wrap: "border-l-4 border-l-danger border-ink/10 bg-gradient-to-br from-danger/[0.04] to-white",
    index: "bg-danger/12 text-danger",
    rail: "bg-danger"
  },
  warning: {
    wrap: "border-l-4 border-l-warn border-ink/10 bg-gradient-to-br from-warn/[0.04] to-white",
    index: "bg-warn/12 text-warn",
    rail: "bg-warn"
  },
  safe: {
    wrap: "border-l-4 border-l-safe/60 border-ink/10 bg-white",
    index: "bg-safe/12 text-safe",
    rail: "bg-safe"
  },
  missing: {
    wrap: "border-l-4 border-l-brass border-ink/10 bg-gradient-to-br from-brass/[0.04] to-white",
    index: "bg-brass/15 text-brass",
    rail: "bg-brass"
  }
};

function ClauseCard({ item, index }: { item: AnalysisItem; index: number }) {
  const styles = riskStyles[item.riskLevel];
  return (
    <article className={`relative overflow-hidden rounded-xl border bg-white p-5 shadow-sm transition hover:shadow-md sm:p-6 ${styles.wrap}`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <span className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-black ${styles.index}`}>
            {String(index + 1).padStart(2, "0")}
          </span>
          <div className="min-w-0">
            <p className="mb-1 text-[11px] font-bold uppercase tracking-wider text-ink/45">{typeLabels[item.type]}</p>
            <h3 className="break-keep text-lg font-black leading-snug text-ink sm:text-xl">{item.clauseTitle}</h3>
          </div>
        </div>
        <RiskBadge level={item.riskLevel} label={riskLabels[item.riskLevel]} size="sm" />
      </div>

      <div className="mt-5 flex gap-3 rounded-lg border border-ink/8 bg-paper/60 p-4">
        <Quote aria-hidden="true" className="h-4 w-4 shrink-0 text-ink/30" />
        <p className="text-sm leading-6 text-ink/72">{item.originalText}</p>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div className="rounded-lg border border-danger/12 bg-danger/[0.04] p-4">
          <div className="mb-2 flex items-center gap-1.5">
            <AlertTriangle aria-hidden="true" className="h-4 w-4 text-danger" />
            <p className="text-sm font-bold text-ink">왜 문제인가요</p>
          </div>
          <p className="text-sm leading-6 text-ink/72">{item.reason}</p>
        </div>
        <div className="rounded-lg border border-safe/15 bg-safe/[0.06] p-4">
          <div className="mb-2 flex items-center gap-1.5">
            <Lightbulb aria-hidden="true" className="h-4 w-4 text-safe" />
            <p className="text-sm font-bold text-ink">수정 권고</p>
          </div>
          <p className="text-sm leading-6 text-ink/72">{item.recommendation}</p>
        </div>
      </div>

      <div className="mt-4 border-t border-ink/8 pt-4">
        <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-ink/45">법령 근거</p>
        {renderLegalBasis(item.legalBasis)}
      </div>
    </article>
  );
}

function MissingClauseCard({ clause, index }: { clause: MissingClause; index: number }) {
  return (
    <article className="relative overflow-hidden rounded-xl border border-l-4 border-l-brass border-dashed border-ink/15 bg-gradient-to-br from-brass/[0.04] to-white p-5 shadow-sm transition hover:shadow-md sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brass/15 text-xs font-black text-brass">
            {String(index + 1).padStart(2, "0")}
          </span>
          <div className="min-w-0">
            <p className="mb-1 text-[11px] font-bold uppercase tracking-wider text-ink/45">누락 조항</p>
            <h3 className="break-keep text-lg font-black leading-snug text-ink sm:text-xl">{clause.title}</h3>
          </div>
        </div>
        <RiskBadge level="missing" size="sm" />
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <div className="rounded-lg border border-warn/15 bg-warn/[0.05] p-4">
          <div className="mb-2 flex items-center gap-1.5">
            <AlertTriangle aria-hidden="true" className="h-4 w-4 text-warn" />
            <p className="text-sm font-bold text-ink">왜 필요한가요</p>
          </div>
          <p className="text-sm leading-6 text-ink/72">{clause.whyItMatters}</p>
        </div>
        <div className="rounded-lg border border-safe/15 bg-safe/[0.06] p-4">
          <div className="mb-2 flex items-center gap-1.5">
            <Lightbulb aria-hidden="true" className="h-4 w-4 text-safe" />
            <p className="text-sm font-bold text-ink">보완 권고</p>
          </div>
          <p className="text-sm leading-6 text-ink/72">{clause.recommendation}</p>
        </div>
      </div>

      <div className="mt-4 border-t border-ink/8 pt-4">
        <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-ink/45">법령 근거</p>
        {renderLegalBasis(clause.legalBasis)}
      </div>
    </article>
  );
}

const overallRiskAccent: Record<"high" | "medium" | "low", { border: string; tint: string; label: string }> = {
  high: { border: "border-t-4 border-t-danger", tint: "from-danger/[0.06]", label: "위험 높음" },
  medium: { border: "border-t-4 border-t-warn", tint: "from-warn/[0.06]", label: "주의 필요" },
  low: { border: "border-t-4 border-t-safe", tint: "from-safe/[0.06]", label: "전반 양호" }
};

export function ResultCards({ analysis }: { analysis: ContractAnalysisResult }) {
  const { summary } = analysis;
  const accent = overallRiskAccent[summary.overallRisk];
  const statCards = [
    {
      label: "위험",
      value: summary.riskyCount,
      className: "border-danger/20 bg-gradient-to-br from-danger/10 to-white text-danger",
      icon: AlertTriangle
    },
    {
      label: "주의",
      value: summary.warningCount,
      className: "border-warn/20 bg-gradient-to-br from-warn/10 to-white text-warn",
      icon: AlertTriangle
    },
    {
      label: "정상",
      value: summary.safeCount,
      className: "border-safe/20 bg-gradient-to-br from-safe/10 to-white text-safe",
      icon: CheckCircle2
    },
    {
      label: "누락",
      value: summary.missingCount,
      className: "border-brass/25 bg-gradient-to-br from-brass/10 to-white text-brass",
      icon: FileWarning
    }
  ];

  return (
    <section className="fade-up space-y-6" id="analysis-result">
      <div className={`relative overflow-hidden rounded-2xl border border-ink/10 bg-gradient-to-br ${accent.tint} via-white to-white p-6 shadow-panel sm:p-7 ${accent.border}`}>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-sage/25 bg-sage/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-sage">
              <Sparkles aria-hidden="true" className="h-3.5 w-3.5" />
              분석 결과 · {accent.label}
            </p>
            <h2 className="break-keep text-2xl font-black leading-tight tracking-tight text-ink sm:text-3xl lg:text-[2rem]">
              {summary.headline}
            </h2>
          </div>
          <RiskBadge level={summary.overallRisk} size="lg" />
        </div>

        <div className="mt-5 rounded-xl border border-ink/8 bg-white/70 p-4 backdrop-blur-sm">
          <p className="flex items-start gap-2 text-base leading-7 text-ink/75">
            <Lightbulb aria-hidden="true" className="mt-1 h-4 w-4 shrink-0 text-sage" />
            <span><span className="font-bold text-ink">다음 단계: </span>{summary.nextStep}</span>
          </p>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {statCards.map((stat) => {
            const Icon = stat.icon;
            return (
              <div className={`relative overflow-hidden rounded-xl border p-4 ${stat.className}`} key={stat.label}>
                <div className="flex items-center justify-between">
                  <p className="text-sm font-bold">{stat.label}</p>
                  <Icon aria-hidden="true" className="h-4 w-4 opacity-60" />
                </div>
                <p className="mt-2 text-3xl font-black leading-none tracking-tight">{stat.value}</p>
                <p className="mt-1 text-[11px] font-semibold text-ink/45">건</p>
              </div>
            );
          })}
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs font-semibold text-ink/50">
          <span className="inline-flex items-center gap-1.5">
            <CalendarClock aria-hidden="true" className="h-3.5 w-3.5" />
            {formatDate(analysis.createdAt)}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="inline-block h-1 w-1 rounded-full bg-ink/30" />
            분석 ID {analysis.id}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="inline-block h-1 w-1 rounded-full bg-ink/30" />
            {analysis.provider === "ai-assisted" ? "AI 보강 분석" : "규칙 기반 분석"}
          </span>
        </div>
      </div>

      <div className="grid gap-4">
        <div className="flex items-baseline justify-between gap-3">
          <div className="flex items-center gap-2">
            <ListChecks aria-hidden="true" className="h-5 w-5 text-sage" />
            <h2 className="text-xl font-black tracking-tight text-ink">조항별 점검</h2>
          </div>
          <span className="text-xs font-semibold text-ink/50">총 {analysis.items.length}개 조항</span>
        </div>
        {analysis.items.map((item, index) => (
          <ClauseCard index={index} item={item} key={item.id} />
        ))}
      </div>

      {analysis.missingClauses.length > 0 && (
        <div className="grid gap-4">
          <div className="flex items-baseline justify-between gap-3">
            <div className="flex items-center gap-2">
              <FileWarning aria-hidden="true" className="h-5 w-5 text-brass" />
              <h2 className="text-xl font-black tracking-tight text-ink">빠진 조항</h2>
            </div>
            <span className="text-xs font-semibold text-ink/50">총 {analysis.missingClauses.length}개</span>
          </div>
          {analysis.missingClauses.map((clause, index) => (
            <MissingClauseCard clause={clause} index={index} key={clause.key} />
          ))}
        </div>
      )}

      {analysis.legalReferences.length > 0 && (
        <div className="rounded-xl border border-ink/10 bg-gradient-to-br from-sage/[0.04] to-white p-5 shadow-sm sm:p-6">
          <div className="mb-3 flex items-center gap-2">
            <Gavel aria-hidden="true" className="h-5 w-5 text-sage" />
            <h2 className="text-lg font-black tracking-tight text-ink">참조 법령</h2>
          </div>
          {renderLegalBasis(analysis.legalReferences)}
        </div>
      )}
    </section>
  );
}
