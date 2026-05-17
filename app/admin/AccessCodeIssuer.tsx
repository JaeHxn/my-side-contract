"use client";

import type { ChangeEvent, FormEvent, ReactNode } from "react";
import { useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2, Clipboard, Loader2, RotateCcw } from "lucide-react";

type AccessCode = {
  code: string;
  status: string;
  buyerName?: string | null;
  phone?: string | null;
  memo?: string | null;
  issuedAt?: string | null;
  expiresAt?: string | null;
  usedAt?: string | null;
  resultId?: string | null;
};

type IssueCodeResponse = {
  accessCode?: AccessCode;
  error?: string;
  message?: string;
};

type FormState = {
  adminToken: string;
  buyerName: string;
  phone: string;
  memo: string;
  ttlDays: string;
};

const initialForm: FormState = {
  adminToken: "",
  buyerName: "",
  phone: "",
  memo: "",
  ttlDays: "30"
};

function compactPayload(form: FormState) {
  const payload: {
    buyerName?: string;
    phone?: string;
    memo?: string;
    ttlDays: number;
  } = {
    ttlDays: Number(form.ttlDays)
  };

  const buyerName = form.buyerName.trim();
  const phone = form.phone.trim();
  const memo = form.memo.trim();

  if (buyerName) payload.buyerName = buyerName;
  if (phone) payload.phone = phone;
  if (memo) payload.memo = memo;

  return payload;
}

function formatDateTime(value?: string | null) {
  if (!value) return "-";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("ko-KR", {
    dateStyle: "long",
    timeStyle: "short"
  }).format(date);
}

function getErrorMessage(response: Response, payload: IssueCodeResponse) {
  if (payload.message) return payload.message;
  if (payload.error) return payload.error;

  if (response.status === 400) {
    return "입력값을 확인해 주세요.";
  }

  if (response.status === 401 || response.status === 403) {
    return "관리자 권한을 확인해 주세요.";
  }

  return "코드 발급에 실패했습니다. 잠시 후 다시 시도해 주세요.";
}

function FieldLabel({ children, htmlFor }: { children: ReactNode; htmlFor: string }) {
  return (
    <label className="text-sm font-black text-ink" htmlFor={htmlFor}>
      {children}
    </label>
  );
}

function FieldHint({ children }: { children: ReactNode }) {
  return <p className="text-xs leading-5 text-ink/52">{children}</p>;
}

export function AccessCodeIssuer() {
  const [form, setForm] = useState<FormState>(initialForm);
  const [accessCode, setAccessCode] = useState<AccessCode | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copied, setCopied] = useState(false);

  const ttlDays = useMemo(() => Number(form.ttlDays), [form.ttlDays]);
  const isTtlValid = Number.isInteger(ttlDays) && ttlDays >= 1 && ttlDays <= 90;

  const updateField =
    (field: keyof FormState) =>
    (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setForm((current) => ({ ...current, [field]: event.target.value }));
      setErrorMessage("");
      setCopied(false);
    };

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!isTtlValid) {
      setErrorMessage("만료일수는 1일부터 90일 사이의 정수로 입력해 주세요.");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage("");
    setAccessCode(null);
    setCopied(false);

    try {
      const response = await fetch("/api/admin/access-codes", {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          ...(form.adminToken.trim() ? { authorization: `Bearer ${form.adminToken.trim()}` } : {})
        },
        body: JSON.stringify(compactPayload(form))
      });
      const payload = (await response.json().catch(() => ({}))) as IssueCodeResponse;

      if (!response.ok) {
        setErrorMessage(getErrorMessage(response, payload));
        return;
      }

      if (!payload.accessCode?.code) {
        setErrorMessage("발급 응답 형식이 올바르지 않습니다.");
        return;
      }

      setAccessCode(payload.accessCode);
    } catch {
      setErrorMessage("네트워크 상태를 확인한 뒤 다시 시도해 주세요.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function copyCode() {
    if (!accessCode?.code) return;

    try {
      await navigator.clipboard.writeText(accessCode.code);
      setCopied(true);
    } catch {
      setErrorMessage("클립보드 복사에 실패했습니다. 코드를 직접 선택해 주세요.");
    }
  }

  function resetForm() {
    setForm(initialForm);
    setAccessCode(null);
    setErrorMessage("");
    setCopied(false);
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[0.95fr_1.05fr]">
      <section className="rounded-lg border border-ink/10 bg-white p-5 shadow-panel sm:p-6">
        <div className="mb-6">
          <p className="mb-2 text-sm font-black text-sage">코드 발급</p>
          <h2 className="text-2xl font-black leading-tight text-ink">구매자에게 전달할 6자리 코드를 생성합니다</h2>
          <p className="mt-3 text-sm leading-6 text-ink/62">
            이름, 연락처, 메모는 내부 확인용입니다. 만료일수는 기본 30일로 설정됩니다.
          </p>
        </div>

        <form className="space-y-5" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <FieldLabel htmlFor="adminToken">관리자 토큰</FieldLabel>
            <input
              autoComplete="off"
              className="w-full rounded-lg border border-ink/12 bg-paper px-4 py-3 text-sm font-bold text-ink outline-none transition placeholder:text-ink/34 focus:border-sage focus:bg-white focus:ring-4 focus:ring-sage/10"
              id="adminToken"
              onChange={updateField("adminToken")}
              placeholder="ADMIN_ACCESS_TOKEN 설정 시 입력"
              type="password"
              value={form.adminToken}
            />
            <FieldHint>환경변수에 관리자 토큰을 설정한 경우에만 필요합니다.</FieldHint>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <FieldLabel htmlFor="buyerName">이름</FieldLabel>
              <input
                autoComplete="name"
                className="w-full rounded-lg border border-ink/12 bg-paper px-4 py-3 text-sm font-bold text-ink outline-none transition placeholder:text-ink/34 focus:border-sage focus:bg-white focus:ring-4 focus:ring-sage/10"
                id="buyerName"
                maxLength={80}
                onChange={updateField("buyerName")}
                placeholder="홍길동"
                type="text"
                value={form.buyerName}
              />
            </div>

            <div className="space-y-2">
              <FieldLabel htmlFor="phone">연락처</FieldLabel>
              <input
                autoComplete="tel"
                className="w-full rounded-lg border border-ink/12 bg-paper px-4 py-3 text-sm font-bold text-ink outline-none transition placeholder:text-ink/34 focus:border-sage focus:bg-white focus:ring-4 focus:ring-sage/10"
                id="phone"
                maxLength={30}
                onChange={updateField("phone")}
                placeholder="010-0000-0000"
                type="tel"
                value={form.phone}
              />
            </div>
          </div>

          <div className="space-y-2">
            <FieldLabel htmlFor="memo">메모</FieldLabel>
            <textarea
              className="min-h-28 w-full resize-y rounded-lg border border-ink/12 bg-paper px-4 py-3 text-sm font-bold leading-6 text-ink outline-none transition placeholder:text-ink/34 focus:border-sage focus:bg-white focus:ring-4 focus:ring-sage/10"
              id="memo"
              maxLength={300}
              onChange={updateField("memo")}
              placeholder="구매 경로, 결제 확인 내용 등을 적어두세요."
              value={form.memo}
            />
            <FieldHint>{form.memo.length}/300</FieldHint>
          </div>

          <div className="space-y-2">
            <FieldLabel htmlFor="ttlDays">만료일수</FieldLabel>
            <input
              className="w-full rounded-lg border border-ink/12 bg-paper px-4 py-3 text-sm font-bold text-ink outline-none transition placeholder:text-ink/34 focus:border-sage focus:bg-white focus:ring-4 focus:ring-sage/10 sm:max-w-48"
              id="ttlDays"
              inputMode="numeric"
              min={1}
              max={90}
              onChange={updateField("ttlDays")}
              placeholder="30"
              type="number"
              value={form.ttlDays}
            />
            <FieldHint>1일부터 90일까지 입력할 수 있습니다.</FieldHint>
          </div>

          {errorMessage ? (
            <div className="flex gap-3 rounded-lg border border-danger/20 bg-danger/8 p-4 text-sm font-bold leading-6 text-danger">
              <AlertTriangle aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0" />
              <p>{errorMessage}</p>
            </div>
          ) : null}

          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-ink px-5 py-3 text-sm font-black text-paper shadow-lg shadow-ink/15 transition hover:bg-sage disabled:cursor-not-allowed disabled:bg-ink/45 disabled:shadow-none"
              disabled={isSubmitting}
              type="submit"
            >
              {isSubmitting ? (
                <>
                  <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" />
                  발급 중입니다
                </>
              ) : (
                "코드 발급"
              )}
            </button>
            <button
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg border border-ink/12 bg-white px-5 py-3 text-sm font-black text-ink transition hover:border-sage/40 hover:text-sage"
              onClick={resetForm}
              type="button"
            >
              <RotateCcw aria-hidden="true" className="h-4 w-4" />
              초기화
            </button>
          </div>
        </form>
      </section>

      <section className="rounded-lg border border-ink/10 bg-white p-5 shadow-panel sm:p-6">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <p className="mb-2 text-sm font-black text-sage">발급 결과</p>
            <h2 className="text-2xl font-black leading-tight text-ink">최근 생성 코드</h2>
          </div>
          {accessCode ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-safe/10 px-3 py-1 text-xs font-black text-safe">
              <CheckCircle2 aria-hidden="true" className="h-4 w-4" />
              발급 완료
            </span>
          ) : null}
        </div>

        {accessCode ? (
          <div className="space-y-5">
            <div className="contract-paper rounded-lg border border-sage/20 p-5">
              <p className="text-sm font-black text-sage">전달 코드</p>
              <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <p className="select-all break-all text-5xl font-black tracking-[0.14em] text-ink sm:text-6xl">
                  {accessCode.code}
                </p>
                <button
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-ink/12 bg-white px-4 py-2 text-sm font-black text-ink transition hover:border-sage/40 hover:text-sage"
                  onClick={copyCode}
                  type="button"
                >
                  <Clipboard aria-hidden="true" className="h-4 w-4" />
                  {copied ? "복사됨" : "복사"}
                </button>
              </div>
              <p className="mt-4 text-base font-black text-danger">만료일: {formatDateTime(accessCode.expiresAt)}</p>
            </div>

            <dl className="grid gap-3 text-sm sm:grid-cols-2">
              <div className="rounded-lg border border-ink/10 bg-paper p-4">
                <dt className="font-black text-ink/48">상태</dt>
                <dd className="mt-1 font-black text-ink">{accessCode.status || "-"}</dd>
              </div>
              <div className="rounded-lg border border-ink/10 bg-paper p-4">
                <dt className="font-black text-ink/48">발급일</dt>
                <dd className="mt-1 font-black text-ink">{formatDateTime(accessCode.issuedAt)}</dd>
              </div>
              <div className="rounded-lg border border-ink/10 bg-paper p-4">
                <dt className="font-black text-ink/48">이름</dt>
                <dd className="mt-1 font-black text-ink">{accessCode.buyerName || "-"}</dd>
              </div>
              <div className="rounded-lg border border-ink/10 bg-paper p-4">
                <dt className="font-black text-ink/48">연락처</dt>
                <dd className="mt-1 font-black text-ink">{accessCode.phone || "-"}</dd>
              </div>
              {accessCode.memo ? (
                <div className="rounded-lg border border-ink/10 bg-paper p-4 sm:col-span-2">
                  <dt className="font-black text-ink/48">메모</dt>
                  <dd className="mt-1 whitespace-pre-wrap break-words font-bold leading-6 text-ink">{accessCode.memo}</dd>
                </div>
              ) : null}
            </dl>
          </div>
        ) : (
          <div className="flex min-h-[26rem] items-center justify-center rounded-lg border border-dashed border-ink/16 bg-paper p-6 text-center">
            <div>
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-sage/10 text-sage">
                <Clipboard aria-hidden="true" className="h-5 w-5" />
              </div>
              <p className="text-lg font-black text-ink">아직 발급된 코드가 없습니다</p>
              <p className="mt-2 max-w-sm text-sm leading-6 text-ink/58">
                왼쪽 폼을 제출하면 6자리 코드와 만료일이 이 영역에 표시됩니다.
              </p>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
