import { CalendarClock, FileWarning, Gavel, ListChecks, Sparkles } from "lucide-react";
import type {
  AnalysisItem,
  ContractAnalysisResult,
  LawReference,
  MissingClause,
  RiskLevel
} from "@/src/lib/contracts/types";
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
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("ko-KR", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(date);
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

function ClauseCard({ item }: { item: AnalysisItem }) {
  return (
    <article className="rounded-lg border border-ink/10 bg-white p-4 shadow-sm sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="mb-2 text-xs font-bold uppercase tracking-normal text-ink/45">{typeLabels[item.type]}</p>
          <h3 className="break-keep text-lg font-bold leading-snug text-ink">{item.clauseTitle}</h3>
        </div>
        <RiskBadge level={item.riskLevel} label={riskLabels[item.riskLevel]} size="sm" />
      </div>

      <div className="mt-4 rounded-md border border-ink/8 bg-paper/70 p-3 text-sm leading-6 text-ink/72">
        {item.originalText}
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div>
          <p className="mb-1 text-sm font-bold text-ink">왜 문제인가요</p>
          <p className="text-sm leading-6 text-ink/68">{item.reason}</p>
        </div>
        <div>
          <p className="mb-1 text-sm font-bold text-ink">수정 권고</p>
          <p className="text-sm leading-6 text-ink/68">{item.recommendation}</p>
        </div>
      </div>

      <div className="mt-4 border-t border-ink/8 pt-4">
        <p className="mb-2 text-xs font-bold uppercase tracking-normal text-ink/45">법령 근거</p>
        {renderLegalBasis(item.legalBasis)}
      </div>
    </article>
  );
}

function MissingClauseCard({ clause }: { clause: MissingClause }) {
  return (
    <article className="rounded-lg border border-dashed border-ink/18 bg-white/82 p-4 shadow-sm sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <h3 className="break-keep text-lg font-bold leading-snug text-ink">{clause.title}</h3>
        <RiskBadge level="missing" size="sm" />
      </div>
      <p className="mt-3 text-sm leading-6 text-ink/68">{clause.whyItMatters}</p>
      <div className="mt-4 rounded-md bg-sage/8 p-3 text-sm leading-6 text-ink/72">
        <span className="font-bold text-ink">권고: </span>
        {clause.recommendation}
      </div>
      <div className="mt-4">{renderLegalBasis(clause.legalBasis)}</div>
    </article>
  );
}

export function ResultCards({ analysis }: { analysis: ContractAnalysisResult }) {
  const { summary } = analysis;
  const statCards = [
    {
      label: "위험",
      value: summary.riskyCount,
      className: "border-danger/20 bg-danger/8 text-danger"
    },
    {
      label: "주의",
      value: summary.warningCount,
      className: "border-warn/20 bg-warn/8 text-warn"
    },
    {
      label: "정상",
      value: summary.safeCount,
      className: "border-safe/20 bg-safe/8 text-safe"
    },
    {
      label: "누락",
      value: summary.missingCount,
      className: "border-ink/10 bg-ink/5 text-ink"
    }
  ];

  return (
    <section className="fade-up space-y-6" id="analysis-result">
      <div className="rounded-lg border border-ink/10 bg-white p-5 shadow-panel sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="mb-2 inline-flex items-center gap-2 text-sm font-bold text-sage">
              <Sparkles aria-hidden="true" className="h-4 w-4" />
              분석 결과
            </p>
            <h2 className="break-keep text-2xl font-black leading-tight text-ink sm:text-3xl">{summary.headline}</h2>
          </div>
          <RiskBadge level={summary.overallRisk} size="lg" />
        </div>

        <p className="mt-4 max-w-3xl text-base leading-7 text-ink/70">{summary.nextStep}</p>

        <div className="mt-5 grid gap-3 sm:grid-cols-4">
          {statCards.map((stat) => (
            <div className={`rounded-lg border p-4 ${stat.className}`} key={stat.label}>
              <p className="text-sm font-bold">{stat.label}</p>
              <p className="mt-1 text-3xl font-black leading-none">{stat.value}</p>
            </div>
          ))}
        </div>

        <div className="mt-5 flex flex-wrap gap-3 text-xs font-semibold text-ink/50">
          <span className="inline-flex items-center gap-1.5">
            <CalendarClock aria-hidden="true" className="h-3.5 w-3.5" />
            {formatDate(analysis.createdAt)}
          </span>
          <span>분석 ID {analysis.id}</span>
          <span>{analysis.provider === "ai-assisted" ? "AI 보강 분석" : "규칙 기반 분석"}</span>
        </div>
      </div>

      <div className="grid gap-4">
        <div className="flex items-center gap-2">
          <ListChecks aria-hidden="true" className="h-5 w-5 text-sage" />
          <h2 className="text-xl font-black text-ink">조항별 점검</h2>
        </div>
        {analysis.items.map((item) => (
          <ClauseCard item={item} key={item.id} />
        ))}
      </div>

      {analysis.missingClauses.length > 0 && (
        <div className="grid gap-4">
          <div className="flex items-center gap-2">
            <FileWarning aria-hidden="true" className="h-5 w-5 text-brass" />
            <h2 className="text-xl font-black text-ink">빠진 조항</h2>
          </div>
          {analysis.missingClauses.map((clause) => (
            <MissingClauseCard clause={clause} key={clause.key} />
          ))}
        </div>
      )}

      {analysis.legalReferences.length > 0 && (
        <div className="rounded-lg border border-ink/10 bg-white/76 p-4 sm:p-5">
          <div className="mb-3 flex items-center gap-2">
            <Gavel aria-hidden="true" className="h-5 w-5 text-sage" />
            <h2 className="text-lg font-black text-ink">참조 법령</h2>
          </div>
          {renderLegalBasis(analysis.legalReferences)}
        </div>
      )}
    </section>
  );
}
