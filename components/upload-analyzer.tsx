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

type OcrResponse = {
  text?: string;
  fileName?: string;
  mimeType?: string;
  characterCount?: number;
  warnings?: Array<{
    message?: string;
  }>;
  message?: string;
  error?: string;
};

const acceptedUploadTypes = ".txt,.md,.text,.pdf,.png,.jpg,.jpeg,.webp";
const textFileExtensions = [".txt", ".md", ".text"];
const ocrFileExtensions = [".pdf", ".png", ".jpg", ".jpeg", ".webp"];
const ocrMimeTypes = new Set(["application/pdf", "image/png", "image/jpeg", "image/webp"]);

const categories: Array<{
  value: ContractCategory;
  label: string;
  enabled: boolean;
}> = [
  { value: "housing-lease", label: "전월세", enabled: true },
  { value: "labor", label: "근로", enabled: true },
  { value: "wedding", label: "웨딩", enabled: false },
  { value: "interior", label: "인테리어", enabled: true },
  { value: "freelance", label: "프리랜서", enabled: true }
];

const categoryDescriptions: Record<ContractCategory, { badge: string; headline: string; description: string }> = {
  "housing-lease": {
    badge: "전월세 계약서 분석",
    headline: "계약서 내용을 넣고 위험 조항을 바로 확인하세요",
    description: "전월세 계약서의 불리한 문구, 법령 근거, 빠진 조항을 쉬운 말로 정리합니다."
  },
  labor: {
    badge: "근로 계약서 분석",
    headline: "내 근로조건이 법에 맞는지 즉시 확인하세요",
    description: "근로기준법 위반 조항, 포괄임금 함정, 빠진 필수 조항을 한눈에 확인합니다."
  },
  wedding: {
    badge: "웨딩 계약서 분석",
    headline: "웨딩 계약의 숨은 조항을 확인하세요",
    description: "웨딩 계약서의 위약금, 환불 조건, 불공정 조항을 점검합니다."
  },
  interior: {
    badge: "인테리어 계약서 분석",
    headline: "공사 계약 전에 불리한 조항을 잡아내세요",
    description: "인테리어 도급계약의 공사비 구조, 하자보수 책임, 자재 명세 누락을 점검합니다."
  },
  freelance: {
    badge: "프리랜서 계약서 분석",
    headline: "저작권과 대금 조항, 서명 전에 꼭 확인하세요",
    description: "프리랜서 용역계약의 저작권 귀속, 무제한 수정, 지연 지급 함정을 찾아냅니다."
  }
};

const sampleContracts: Partial<Record<ContractCategory, string>> = {
  "housing-lease": `제1조 보증금은 계약 종료와 목적물 인도 후 임대인이 반환한다.
제2조 임차인은 계약갱신요구권을 포기하며, 임대인은 갱신을 거절할 수 있다.
제3조 모든 수리 및 하자 보수 비용은 임차인이 부담한다.
제4조 임대인은 필요 시 임차인의 사전 동의 없이 방문할 수 있다.`,
  labor: `근로계약서
제1조 근로자는 회사가 정한 모든 연장근로와 휴일근로에 동의하며, 월급에는 포괄임금으로 모든 수당이 포함된다.
제2조 회사는 업무상 필요가 있으면 별도 동의 없이 근무시간을 변경할 수 있고, 연장근로수당은 따로 지급하지 않는다.
제3조 업무가 바쁜 날에는 휴게시간을 제공하지 않을 수 있으며, 근로자는 이에 이의를 제기하지 않는다.
제4조 근로자가 사전 승인 없이 퇴사하면 회사에 위약금 300만 원을 지급한다.`,
  interior: `제1조 공사대금 전액(3,000만원)은 계약 체결 즉시 선불로 지급하며, 시공사는 이를 계약 성립의 조건으로 한다.
제2조 공사 기간은 시공사 내부 일정에 따르며, 발주자는 이에 이의를 제기하지 않는다.
제3조 공사 완료 후 발생하는 모든 하자에 대한 책임은 발주자가 부담한다.
제4조 발주자는 공사 현장 촬영 및 제3자 감리를 요청할 수 없으며, 자재 변경은 시공사가 임의로 결정한다.`,
  freelance: `제1조 수급인이 본 계약에 따라 제작한 모든 결과물의 저작권은 계약 즉시 자동으로 발주자에게 귀속되며, 수급인은 어떠한 권리도 주장할 수 없다.
제2조 수급인은 발주자의 요청이 있으면 횟수 제한 없이 수정해야 하며, 이에 대한 추가 비용을 청구할 수 없다.
제3조 용역대금은 최종 결과물에 대한 발주자의 만족도 확인 후 90일 이내에 지급한다.
제4조 수급인은 계약 기간 동안 발주자의 사전 서면 동의 없이 다른 모든 외부 활동 및 부업을 할 수 없다.`
};

function getFileExtension(fileName: string) {
  const match = /\.[^.]+$/.exec(fileName.toLowerCase());
  return match?.[0] || "";
}

function getUploadKind(file: File): "text" | "ocr" | null {
  const extension = getFileExtension(file.name);

  if (textFileExtensions.includes(extension)) {
    return "text";
  }

  if (ocrFileExtensions.includes(extension)) {
    return "ocr";
  }

  if (!extension && file.type.startsWith("text/")) {
    return "text";
  }

  if (!extension && ocrMimeTypes.has(file.type)) {
    return "ocr";
  }

  return null;
}

export function UploadAnalyzer() {
  const [category, setCategory] = useState<ContractCategory>("housing-lease");
  const [contractText, setContractText] = useState("");
  const [accessCode, setAccessCode] = useState("");
  const [fileName, setFileName] = useState("");
  const [error, setError] = useState("");
  const [ocrWarning, setOcrWarning] = useState("");
  const [saveWarning, setSaveWarning] = useState("");
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<ContractAnalysisResult | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isOcrProcessing, setIsOcrProcessing] = useState(false);

  const characterCount = useMemo(() => contractText.trim().length, [contractText]);
  const activeCategoryInfo = categoryDescriptions[category];
  const codeIsValid = /^\d{6}$/.test(accessCode.trim());
  const canSubmit = characterCount >= 30 && codeIsValid && !isSubmitting && !isOcrProcessing;

  async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const input = event.currentTarget;
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    const uploadKind = getUploadKind(file);

    if (!uploadKind) {
      setError("지원하지 않는 파일 형식입니다. TXT, MD, PDF, PNG, JPG, JPEG, WEBP 파일을 업로드해 주세요.");
      setOcrWarning("");
      input.value = "";
      return;
    }

    if (uploadKind === "ocr") {
      if (!codeIsValid) {
        setError("파일 분析 전에 6자리 분析 코드를 먼저 입력해주세요.");
        input.value = "";
        return;
      }
      if (file.size > 4 * 1024 * 1024) {
        setError("파일이 너무 큽니다(4MB 초과). 큰 PDF는 페이지를 사진으로 찍어 나눠 올리거나 텍스트를 직접 붙여넣어 주세요.");
        input.value = "";
        return;
      }
      await handleOcrUpload(file);
      input.value = "";
      return;
    }

    if (file.size > 240_000) {
      setError("텍스트 파일은 240KB 이하만 업로드할 수 있습니다.");
      setOcrWarning("");
      input.value = "";
      return;
    }

    try {
      const text = await file.text();
      setContractText(text.slice(0, 20000));
      setFileName(file.name);
      setError("");
      setOcrWarning("");
    } catch {
      setError("파일을 읽지 못했습니다. 계약서 내용을 직접 붙여넣어 주세요.");
      setOcrWarning("");
    } finally {
      input.value = "";
    }
  }

  async function handleOcrUpload(file: File) {
    setIsOcrProcessing(true);
    setError("");
    setOcrWarning("");

    const formData = new FormData();
    formData.append("file", file);
    formData.append("accessCode", accessCode.trim());

    try {
      const response = await fetch("/api/ocr", {
        method: "POST",
        body: formData
      });
      const payload = (await response.json().catch(() => ({}))) as OcrResponse;

      if (!response.ok) {
        throw new Error(payload.message || payload.error || "OCR 요청을 처리하지 못했습니다.");
      }

      if (!payload.text?.trim()) {
        throw new Error("OCR 결과에서 읽을 수 있는 텍스트를 찾지 못했습니다. 더 선명한 파일을 올리거나 직접 입력해 주세요.");
      }

      setContractText(payload.text.slice(0, 20000));
      setFileName(payload.fileName || file.name);
      setError("");
      setOcrWarning(payload.warnings?.map((warning) => warning.message).filter(Boolean).join(" ") || "");
    } catch (caughtError) {
      setOcrWarning("");
      if (caughtError instanceof TypeError) {
        setError("OCR 서버와 연결하지 못했습니다. 잠시 후 다시 시도해 주세요.");
      } else {
        setError(caughtError instanceof Error ? caughtError.message : "OCR 처리 중 오류가 발생했습니다.");
      }
    } finally {
      setIsOcrProcessing(false);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmedText = contractText.trim();
    const trimmedCode = accessCode.trim();

    if (isOcrProcessing) {
      setError("OCR 처리 중입니다. 텍스트 추출이 끝난 뒤 분석해 주세요.");
      return;
    }

    if (isSubmitting) {
      return;
    }

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
        <div className="relative overflow-hidden rounded-2xl border border-ink/10 bg-gradient-to-br from-white via-white to-sage/5 p-6 shadow-panel sm:p-7">
          <div aria-hidden="true" className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full bg-sage/8 blur-3xl" />
          <div aria-hidden="true" className="pointer-events-none absolute -bottom-16 -left-10 h-44 w-44 rounded-full bg-brass/8 blur-3xl" />

          <div className="relative">
            <p className="mb-4 inline-flex items-center gap-1.5 rounded-full border border-sage/25 bg-sage/12 px-3 py-1 text-xs font-bold uppercase tracking-wider text-sage">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-sage" />
              {activeCategoryInfo.badge}
            </p>
            <h1 className="text-balance text-3xl font-black leading-[1.15] tracking-tight text-ink sm:text-4xl">
              {activeCategoryInfo.headline}
            </h1>
            <p className="mt-4 text-base leading-7 text-ink/65">
              {activeCategoryInfo.description}
            </p>

            <div className="mt-6 grid grid-cols-4 gap-2 text-center text-xs font-bold">
              <div className="rounded-xl border border-danger/15 bg-danger/5 p-3">
                <p className="text-xl font-black leading-none text-danger">위험</p>
                <p className="mt-1.5 leading-tight text-ink/55">불법 가능</p>
              </div>
              <div className="rounded-xl border border-warn/15 bg-warn/5 p-3">
                <p className="text-xl font-black leading-none text-warn">주의</p>
                <p className="mt-1.5 leading-tight text-ink/55">수정 권고</p>
              </div>
              <div className="rounded-xl border border-safe/15 bg-safe/5 p-3">
                <p className="text-xl font-black leading-none text-safe">정상</p>
                <p className="mt-1.5 leading-tight text-ink/55">즉시 안전</p>
              </div>
              <div className="rounded-xl border border-ink/10 bg-ink/4 p-3">
                <p className="text-xl font-black leading-none text-ink">누락</p>
                <p className="mt-1.5 leading-tight text-ink/55">보완 필요</p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-4 hidden lg:block">
          <LegalDisclaimer compact />
        </div>
      </aside>

      <main className="space-y-6">
        <form className="rounded-lg border border-ink/10 bg-white p-4 shadow-panel sm:p-6" onSubmit={handleSubmit}>
          <div className="mb-6">
            <div className="mb-3 flex items-baseline justify-between">
              <label className="block text-sm font-bold text-ink">계약 유형</label>
              <span className="text-xs font-semibold text-ink/45">분석할 계약서를 선택하세요</span>
            </div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
              {categories.map((option) => {
                const isActive = category === option.value;
                return (
                  <button
                    aria-pressed={isActive}
                    className={[
                      "group relative flex flex-col items-center justify-center rounded-xl border px-3 py-3 text-sm font-bold transition-all duration-200",
                      isActive
                        ? "border-sage bg-sage text-white shadow-md shadow-sage/25 ring-2 ring-sage/20"
                        : "border-ink/10 bg-paper/60 text-ink/70",
                      option.enabled
                        ? !isActive && "hover:-translate-y-0.5 hover:border-sage/50 hover:bg-white hover:text-ink hover:shadow-sm"
                        : "cursor-not-allowed opacity-50"
                    ]
                      .filter(Boolean)
                      .join(" ")}
                    disabled={!option.enabled}
                    key={option.value}
                    onClick={() => setCategory(option.value)}
                    type="button"
                  >
                    <span className="leading-tight">{option.label}</span>
                    {!option.enabled && (
                      <span className="mt-0.5 text-[10px] font-semibold tracking-wide text-ink/40">
                        준비중
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mb-5">
            <label className="mb-2 block text-sm font-bold text-ink" htmlFor="contractText">
              계약서 내용
            </label>
            <label
              aria-busy={isOcrProcessing}
              className={[
                "mb-3 flex items-center justify-between gap-3 rounded-lg border border-dashed p-4 transition",
                isOcrProcessing
                  ? "cursor-wait border-sage/35 bg-sage/8 opacity-75"
                  : !codeIsValid
                    ? "cursor-not-allowed border-ink/15 bg-ink/4"
                    : "cursor-pointer border-sage/35 bg-sage/8 hover:bg-sage/12"
              ].join(" ")}
            >
              <span className="flex min-w-0 items-center gap-3">
                <span className={[
                  "inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white",
                  codeIsValid ? "text-sage" : "text-ink/35"
                ].join(" ")}>
                  <UploadCloud aria-hidden="true" className="h-5 w-5" />
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-sm font-bold text-ink">
                    {isOcrProcessing ? (
                      <span className="inline-flex items-center gap-2">
                        <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" />
                        이미지 텍스트 추출 중...
                      </span>
                    ) : !codeIsValid ? (
                      <span className="text-ink/45">6자리 코드 입력 후 파일 업로드 가능</span>
                    ) : (
                      fileName || "계약서 파일 업로드"
                    )}
                  </span>
                  <span className="block text-xs leading-5 text-ink/55">
                    TXT/MD는 바로 읽고, PDF/사진은 OCR로 텍스트를 추출합니다.
                  </span>
                </span>
              </span>
              <input
                accept={acceptedUploadTypes}
                className="sr-only"
                disabled={isOcrProcessing || !codeIsValid}
                onChange={handleFileChange}
                type="file"
              />
            </label>
            <textarea
              className="min-h-[280px] w-full resize-y rounded-lg border border-ink/10 bg-paper/70 p-4 text-base leading-7 text-ink outline-none transition placeholder:text-ink/35 focus:border-sage focus:bg-white focus:ring-4 focus:ring-sage/12"
              disabled={isOcrProcessing}
              id="contractText"
              maxLength={20000}
              onChange={(event) => setContractText(event.target.value)}
              placeholder="계약서 전문 또는 특약 조항을 붙여넣어 주세요."
              value={contractText}
            />
            <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-xs font-semibold text-ink/50">
              <span>{characterCount.toLocaleString("ko-KR")} / 20,000자</span>
              <button
                className="inline-flex items-center gap-1.5 rounded-full border border-ink/10 bg-white px-3 py-1.5 text-ink transition hover:border-sage/35 hover:text-sage"
                disabled={isOcrProcessing}
                onClick={() => {
                  setContractText(sampleContracts[category] ?? sampleContracts["housing-lease"] ?? "");
                  setFileName("");
                  setError("");
                  setOcrWarning("");
                }}
                type="button"
              >
                <ClipboardPaste aria-hidden="true" className="h-3.5 w-3.5" />
                샘플 입력
              </button>
            </div>
          </div>

          <div className="mb-5">
            <div className="mb-2 flex items-center justify-between gap-2">
              <label className="text-sm font-bold text-ink" htmlFor="accessCode">
                6자리 분석 코드
              </label>
              <Link
                className="inline-flex items-center gap-1 text-xs font-semibold text-sage transition hover:text-sage/70"
                href="/payment"
              >
                코드가 없으신가요? 결제하기 →
              </Link>
            </div>
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
          {ocrWarning && (
            <div className="mb-5 rounded-lg border border-warn/25 bg-warn/10 p-3 text-sm font-semibold leading-6 text-ink">
              {ocrWarning}
            </div>
          )}

          <button
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-ink px-5 py-4 text-base font-black text-paper shadow-lg shadow-ink/15 transition hover:bg-sage disabled:cursor-not-allowed disabled:bg-ink/35 sm:w-auto"
            disabled={!canSubmit}
            type="submit"
          >
            {isOcrProcessing ? (
              <>
                <Loader2 aria-hidden="true" className="h-5 w-5 animate-spin" />
                OCR 처리 중
              </>
            ) : isSubmitting ? (
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
