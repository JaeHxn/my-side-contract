"use client";

import Link from "next/link";
import { type ChangeEvent, type FormEvent, useMemo, useState } from "react";
import { ArrowRight, ClipboardPaste, FileText, Loader2, UploadCloud } from "lucide-react";
import type { ContractAnalysisResult, ContractCategory } from "@/src/lib/contracts/types";
import { LegalDisclaimer } from "./legal-disclaimer";
import { ResultCards } from "./result-cards";

type AnalysisResponse = {
  analysis?: ContractAnalysisResult;
  resultUrl?: string | null;
  warning?: {
    message?: string;
  };
  message?: string;
  error?: string;
};

const categories: Array<{
  value: ContractCategory;
  label: string;
  enabled: boolean;
}> = [
  { value: "housing-lease", label: "전월세", enabled: true },
  { value: "labor", label: "근로", enabled: false },
  { value: "wedding", label: "웨딩", enabled: false },
  { value: "interior", label: "인테리어", enabled: false },
  { value: "freelance", label: "프리랜서", enabled: false }
];

const sampleContract = `제1조 보증금은 계약 종료와 목적물 인도 후 임대인이 반환한다.
제2조 임차인은 계약갱신요구권을 포기하며, 임대인은 갱신을 거절할 수 있다.
제3조 모든 수리 및 하자 보수 비용은 임차인이 부담한다.
제4조 임대인은 필요 시 임차인의 사전 동의 없이 방문할 수 있다.`;

export function UploadAnalyzer() {
  const [category, setCategory] = useState<ContractCategory>("housing-lease");
  const [contractText, setContractText] = useState("");
  const [accessCode, setAccessCode] = useState("");
  const [fileName, setFileName] = useState("");
  const [error, setError] = useState("");
  const [saveWarning, setSaveWarning] = useState("");
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<ContractAnalysisResult | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const characterCount = useMemo(() => contractText.trim().length, [contractText]);
  const canSubmit = characterCount >= 30 && /^\d{6}$/.test(accessCode.trim()) && !isSubmitting;

  async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    if (file.size > 240_000) {
      setError("텍스트 파일은 240KB 이하만 업로드할 수 있습니다.");
      return;
    }

    try {
      const text = await file.text();
      setContractText(text.slice(0, 50000));
      setFileName(file.name);
      setError("");
    } catch {
      setError("파일을 읽지 못했습니다. 계약서 내용을 직접 붙여넣어 주세요.");
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmedText = contractText.trim();
    const trimmedCode = accessCode.trim();

    if (trimmedText.length < 30) {
      setError("계약서 내용을 30자 이상 입력해 주세요.");
      return;
    }

    if (!/^\d{6}$/.test(trimmedCode)) {
      setError("6자리 숫자 분석 코드를 입력해 주세요.");
      return;
    }

    setIsSubmitting(true);
    setError("");
    setSaveWarning("");
    setResultUrl(null);

    try {
      const response = await fetch("/api/analysis", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          contractText: trimmedText,
          category,
          accessCode: trimmedCode
        })
      });

      const payload = (await response.json().catch(() => ({}))) as AnalysisResponse;

      if (!response.ok) {
        throw new Error(payload.message || "분석 요청을 처리하지 못했습니다.");
      }

      if (!payload.analysis) {
        throw new Error("분석 결과 형식이 올바르지 않습니다.");
      }

      setAnalysis(payload.analysis);
      setResultUrl(payload.resultUrl || null);
      setSaveWarning(payload.warning?.message || "");
      window.requestAnimationFrame(() => {
        document.getElementById("analysis-result")?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "분석 중 오류가 발생했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="mx-auto grid max-w-6xl gap-8 px-5 py-6 sm:px-6 lg:grid-cols-[0.92fr_1.08fr] lg:px-8 lg:py-10">
      <aside className="lg:sticky lg:top-6 lg:self-start">
        <div className="rounded-lg border border-ink/10 bg-white/86 p-5 shadow-panel sm:p-6">
          <p className="mb-3 inline-flex items-center rounded-full border border-sage/20 bg-sage/10 px-3 py-1 text-sm font-bold text-sage">
            MVP 주거 계약서 분석
          </p>
          <h1 className="text-balance text-3xl font-black leading-tight text-ink sm:text-4xl">
            계약서 내용을 넣고 위험 조항을 바로 확인하세요
          </h1>
          <p className="mt-4 text-base leading-7 text-ink/68">
            전월세 계약서의 불리한 문구, 법령 근거, 빠진 조항을 쉬운 말로 정리합니다.
          </p>

          <div className="mt-6 grid grid-cols-3 gap-2 text-center text-sm font-bold">
            <div className="rounded-lg border border-ink/10 bg-paper p-3">
              <p className="text-2xl font-black text-danger">위험</p>
              <p className="mt-1 text-ink/55">불법 가능</p>
            </div>
            <div className="rounded-lg border border-ink/10 bg-paper p-3">
              <p className="text-2xl font-black text-warn">주의</p>
              <p className="mt-1 text-ink/55">수정 권고</p>
            </div>
            <div className="rounded-lg border border-ink/10 bg-paper p-3">
              <p className="text-2xl font-black text-safe">누락</p>
              <p className="mt-1 text-ink/55">보완 필요</p>
            </div>
          </div>
        </div>

        <div className="mt-4 hidden lg:block">
          <LegalDisclaimer compact />
        </div>
      </aside>

      <main className="space-y-6">
        <form className="rounded-lg border border-ink/10 bg-white p-4 shadow-panel sm:p-6" onSubmit={handleSubmit}>
          <div className="mb-5">
            <label className="mb-2 block text-sm font-bold text-ink">계약 유형</label>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
              {categories.map((option) => (
                <button
                  aria-pressed={category === option.value}
                  className={[
                    "rounded-lg border px-3 py-2 text-sm font-bold transition",
                    category === option.value
                      ? "border-sage bg-sage text-white"
                      : "border-ink/10 bg-paper text-ink/65",
                    option.enabled ? "hover:border-sage/50" : "cursor-not-allowed opacity-45"
                  ].join(" ")}
                  disabled={!option.enabled}
                  key={option.value}
                  onClick={() => setCategory(option.value)}
                  type="button"
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          <div className="mb-5">
            <label className="mb-2 block text-sm font-bold text-ink" htmlFor="contractText">
              계약서 내용
            </label>
            <label className="mb-3 flex cursor-pointer items-center justify-between gap-3 rounded-lg border border-dashed border-sage/35 bg-sage/8 p-4 transition hover:bg-sage/12">
              <span className="flex min-w-0 items-center gap-3">
                <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-sage">
                  <UploadCloud aria-hidden="true" className="h-5 w-5" />
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-sm font-bold text-ink">
                    {fileName || "텍스트 파일 업로드"}
                  </span>
                  <span className="block text-xs leading-5 text-ink/55">PDF/사진 OCR은 다음 단계에서 지원됩니다.</span>
                </span>
              </span>
              <input accept=".txt,.md,.text" className="sr-only" onChange={handleFileChange} type="file" />
            </label>
            <textarea
              className="min-h-[280px] w-full resize-y rounded-lg border border-ink/10 bg-paper/70 p-4 text-base leading-7 text-ink outline-none transition placeholder:text-ink/35 focus:border-sage focus:bg-white focus:ring-4 focus:ring-sage/12"
              id="contractText"
              maxLength={50000}
              onChange={(event) => setContractText(event.target.value)}
              placeholder="계약서 전문 또는 특약 조항을 붙여넣어 주세요."
              value={contractText}
            />
            <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-xs font-semibold text-ink/50">
              <span>{characterCount.toLocaleString("ko-KR")} / 50,000자</span>
              <button
                className="inline-flex items-center gap-1.5 rounded-full border border-ink/10 bg-white px-3 py-1.5 text-ink transition hover:border-sage/35 hover:text-sage"
                onClick={() => {
                  setContractText(sampleContract);
                  setFileName("");
                  setError("");
                }}
                type="button"
              >
                <ClipboardPaste aria-hidden="true" className="h-3.5 w-3.5" />
                샘플 입력
              </button>
            </div>
          </div>

          <div className="mb-5">
            <label className="mb-2 block text-sm font-bold text-ink" htmlFor="accessCode">
              6자리 분석 코드
            </label>
            <input
              className="w-full rounded-lg border border-ink/10 bg-paper/70 px-4 py-3 text-lg font-bold tracking-normal text-ink outline-none transition placeholder:text-ink/35 focus:border-sage focus:bg-white focus:ring-4 focus:ring-sage/12"
              id="accessCode"
              inputMode="numeric"
              maxLength={6}
              onChange={(event) => setAccessCode(event.target.value.replace(/\D/g, "").slice(0, 6))}
              placeholder="123456"
              value={accessCode}
            />
          </div>

          {error && (
            <div className="mb-5 rounded-lg border border-danger/20 bg-danger/10 p-3 text-sm font-semibold leading-6 text-danger">
              {error}
            </div>
          )}

          <button
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-ink px-5 py-4 text-base font-black text-paper shadow-lg shadow-ink/15 transition hover:bg-sage disabled:cursor-not-allowed disabled:bg-ink/35 sm:w-auto"
            disabled={!canSubmit}
            type="submit"
          >
            {isSubmitting ? (
              <>
                <Loader2 aria-hidden="true" className="h-5 w-5 animate-spin" />
                분석 중
              </>
            ) : (
              <>
                <FileText aria-hidden="true" className="h-5 w-5" />
                계약서 분석하기
                <ArrowRight aria-hidden="true" className="h-5 w-5" />
              </>
            )}
          </button>
        </form>

        <div className="lg:hidden">
          <LegalDisclaimer compact />
        </div>

        <div aria-live="polite" className="space-y-4">
          {analysis && resultUrl && (
            <div className="rounded-lg border border-sage/20 bg-sage/8 p-4 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm font-bold leading-6 text-ink">분석 결과가 저장되었습니다. 링크로 다시 확인할 수 있습니다.</p>
                <Link
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-ink px-4 py-3 text-sm font-black text-paper transition hover:bg-sage"
                  href={resultUrl}
                >
                  상세 결과 보기
                  <ArrowRight aria-hidden="true" className="h-4 w-4" />
                </Link>
              </div>
            </div>
          )}
          {analysis && saveWarning && (
            <div className="rounded-lg border border-warn/25 bg-warn/10 p-4 text-sm font-semibold leading-6 text-ink">
              {saveWarning}
            </div>
          )}
          {analysis && <ResultCards analysis={analysis} />}
        </div>
      </main>
    </div>
  );
}
