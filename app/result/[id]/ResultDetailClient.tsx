"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { AlertTriangle, ArrowLeft, Check, Copy, FileSearch, Loader2, RefreshCcw } from "lucide-react";
import { LegalDisclaimer } from "@/components/legal-disclaimer";
import { ResultCards } from "@/components/result-cards";
import type { ContractAnalysisResult } from "@/src/lib/contracts/types";

type StoredResult = {
  id: string;
  category: ContractAnalysisResult["category"];
  provider: ContractAnalysisResult["provider"];
  overallRisk: ContractAnalysisResult["summary"]["overallRisk"];
  createdAt: string;
  analysis: ContractAnalysisResult;
};

type ResultApiResponse = {
  result?: StoredResult;
  message?: string;
  error?: string;
};

type LoadState =
  | { status: "loading" }
  | { status: "loaded"; result: StoredResult }
  | { status: "not-found"; message: string }
  | { status: "error"; message: string };

function ResultStatePanel({
  icon,
  title,
  message,
  children
}: {
  icon: React.ReactNode;
  title: string;
  message: string;
  children?: React.ReactNode;
}) {
  return (
    <section className="fade-up rounded-lg border border-ink/10 bg-white p-6 shadow-panel sm:p-8">
      <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-full bg-sage/10 text-sage">
        {icon}
      </div>
      <h1 className="break-keep text-2xl font-black leading-tight text-ink sm:text-3xl">{title}</h1>
      <p className="mt-3 max-w-2xl text-sm leading-6 text-ink/68 sm:text-base">{message}</p>
      {children ? <div className="mt-6 flex flex-wrap gap-3">{children}</div> : null}
    </section>
  );
}

function getLoadErrorMessage(response: Response, payload: ResultApiResponse) {
  if (response.status === 404) {
    return payload.message || "분석 결과를 찾을 수 없습니다.";
  }

  if (response.status === 400) {
    return payload.message || "분석 ID 형식이 올바르지 않습니다.";
  }

  return payload.message || "분석 결과 조회에 실패했습니다. 잠시 후 다시 시도해 주세요.";
}

export function ResultDetailClient({ resultId }: { resultId: string }) {
  const [state, setState] = useState<LoadState>({ status: "loading" });
  const [copied, setCopied] = useState(false);

  const resultPath = useMemo(() => `/api/result/${encodeURIComponent(resultId)}`, [resultId]);

  const loadResult = useCallback(
    async (signal?: AbortSignal) => {
      setState({ status: "loading" });

      try {
        const response = await fetch(resultPath, {
          cache: "no-store",
          headers: {
            Accept: "application/json"
          },
          signal
        });
        const payload = (await response.json().catch(() => ({}))) as ResultApiResponse;

        if (!response.ok) {
          const message = getLoadErrorMessage(response, payload);
          setState(response.status === 404 ? { status: "not-found", message } : { status: "error", message });
          return;
        }

        if (!payload.result?.analysis) {
          setState({ status: "error", message: "분석 결과 형식이 올바르지 않습니다." });
          return;
        }

        setState({ status: "loaded", result: payload.result });
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }

        setState({ status: "error", message: "분석 결과를 불러오지 못했습니다. 네트워크 상태를 확인해 주세요." });
      }
    },
    [resultPath]
  );

  useEffect(() => {
    const controller = new AbortController();
    void loadResult(controller.signal);

    return () => controller.abort();
  }, [loadResult]);

  return (
    <div className="min-h-screen">
      <header className="border-b border-ink/10 bg-paper/84 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4 sm:px-6 lg:px-8">
          <Link className="text-lg font-black text-ink" href="/">
            내편계약서
          </Link>
          <div className="flex items-center gap-2">
            {state.status === "loaded" && (
              <button
                className="inline-flex items-center gap-1.5 rounded-full border border-ink/10 bg-white px-3 py-2 text-sm font-bold text-ink transition hover:border-sage/40 hover:text-sage"
                onClick={() => {
                  void navigator.clipboard.writeText(window.location.href).then(() => {
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                  });
                }}
                type="button"
              >
                {copied ? (
                  <>
                    <Check aria-hidden="true" className="h-4 w-4 text-sage" />
                    복사됨
                  </>
                ) : (
                  <>
                    <Copy aria-hidden="true" className="h-4 w-4" />
                    결과 링크 복사
                  </>
                )}
              </button>
            )}
            <Link
              className="inline-flex items-center gap-2 rounded-full border border-ink/10 bg-white px-3 py-2 text-sm font-bold text-ink transition hover:border-sage/40 hover:text-sage"
              href="/upload"
            >
              <ArrowLeft aria-hidden="true" className="h-4 w-4" />새 분석
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-5 py-6 sm:px-6 lg:px-8 lg:py-10">
        {state.status === "loading" && (
          <ResultStatePanel
            icon={<Loader2 aria-hidden="true" className="h-5 w-5 animate-spin" />}
            message="저장된 분석 결과를 불러오고 있습니다."
            title="분석 결과를 확인하는 중입니다"
          />
        )}

        {state.status === "not-found" && (
          <ResultStatePanel
            icon={<FileSearch aria-hidden="true" className="h-5 w-5" />}
            message={state.message}
            title="분석 결과가 없습니다"
          >
            <Link
              className="inline-flex items-center justify-center rounded-lg bg-ink px-4 py-3 text-sm font-black text-paper transition hover:bg-sage"
              href="/upload"
            >
              새 분석 시작
            </Link>
          </ResultStatePanel>
        )}

        {state.status === "error" && (
          <ResultStatePanel
            icon={<AlertTriangle aria-hidden="true" className="h-5 w-5" />}
            message={state.message}
            title="분석 결과를 불러오지 못했습니다"
          >
            <button
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-ink px-4 py-3 text-sm font-black text-paper transition hover:bg-sage"
              onClick={() => void loadResult()}
              type="button"
            >
              <RefreshCcw aria-hidden="true" className="h-4 w-4" />
              다시 시도
            </button>
            <Link
              className="inline-flex items-center justify-center rounded-lg border border-ink/12 bg-white px-4 py-3 text-sm font-black text-ink transition hover:border-sage/40 hover:text-sage"
              href="/upload"
            >
              새 분석 시작
            </Link>
          </ResultStatePanel>
        )}

        {state.status === "loaded" && (
          <div className="space-y-6">
            <ResultCards analysis={state.result.analysis} />
            <LegalDisclaimer compact disclaimer={state.result.analysis.disclaimer} />
          </div>
        )}
      </main>
    </div>
  );
}
