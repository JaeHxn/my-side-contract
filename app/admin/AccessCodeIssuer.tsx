"use client";

import type { ChangeEvent, FormEvent, ReactNode } from "react";
import { useMemo, useState } from "react";
import { AlertTriangle, Ban, CheckCircle2, Clipboard, Loader2, RefreshCw, RotateCcw } from "lucide-react";
import { formatKoreanDateTime } from "@/src/lib/time/korean-time";

type AccessCode = {
  code: string;
  maskedCode: string;
  status: string;
  buyerName?: string | null;
  phone?: string | null;
  memo?: string | null;
  issuedAt?: string | null;
  expiresAt?: string | null;
  usedAt?: string | null;
  resultId?: string | null;
};

type AccessCodeStatusFilter = "all" | "active" | "used" | "expired" | "revoked";

type ApiMessagePayload = {
  error?: string;
  message?: string;
};

type IssueCodeResponse = ApiMessagePayload & {
  accessCode?: AccessCode;
};

type ListAccessCodesResponse = ApiMessagePayload & {
  accessCodes?: AccessCode[];
  count?: number;
};

type RevokeAccessCodeResponse = ApiMessagePayload & {
  accessCode?: AccessCode;
};

type FormState = {
  buyerName: string;
  phone: string;
  memo: string;
  ttlDays: string;
};

const initialForm: FormState = {
  buyerName: "",
  phone: "",
  memo: "",
  ttlDays: "30"
};

const statusFilters: Array<{ value: AccessCodeStatusFilter; label: string }> = [
  { value: "all", label: "전체" },
  { value: "active", label: "사용 가능" },
  { value: "used", label: "사용 완료" },
  { value: "expired", label: "만료" },
  { value: "revoked", label: "취소" }
];

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

function buildAdminHeaders(hasJsonBody = false) {
  const headers: Record<string, string> = {
    Accept: "application/json"
  };

  if (hasJsonBody) {
    headers["Content-Type"] = "application/json";
  }

  return headers;
}

function formatDateTime(value?: string | null) {
  if (!value) return "-";

  return formatKoreanDateTime(value, {
    dateStyle: "long",
    timeStyle: "short"
  });
}

function getErrorMessage(
  response: Response,
  payload: ApiMessagePayload,
  fallbackMessage = "코드 발급에 실패했습니다. 잠시 후 다시 시도해 주세요."
) {
  if (payload.message) return payload.message;
  if (payload.error) return payload.error;

  if (response.status === 400) {
    return "입력값을 확인해 주세요.";
  }

  if (response.status === 401 || response.status === 403) {
    return "관리자 권한을 확인해 주세요.";
  }

  return fallbackMessage;
}

function getStatusLabel(status?: string | null) {
  if (status === "active") return "사용 가능";
  if (status === "used") return "사용 완료";
  if (status === "expired") return "만료";
  if (status === "revoked") return "취소";

  return status || "-";
}

function getStatusBadgeClass(status?: string | null) {
  if (status === "active") return "bg-safe/10 text-safe";
  if (status === "used") return "bg-sage/10 text-sage";
  if (status === "expired") return "bg-danger/10 text-danger";
  if (status === "revoked") return "bg-danger/10 text-danger";

  return "bg-ink/8 text-ink/64";
}

function isActiveAccessCode(accessCode: AccessCode) {
  return accessCode.status === "active";
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
  const [statusFilter, setStatusFilter] = useState<AccessCodeStatusFilter>("active");
  const [accessCodes, setAccessCodes] = useState<AccessCode[]>([]);
  const [accessCodeCount, setAccessCodeCount] = useState<number | null>(null);
  const [listErrorMessage, setListErrorMessage] = useState("");
  const [isLoadingCodes, setIsLoadingCodes] = useState(false);
  const [revokingCode, setRevokingCode] = useState<string | null>(null);

  const ttlDays = useMemo(() => Number(form.ttlDays), [form.ttlDays]);
  const isTtlValid = Number.isInteger(ttlDays) && ttlDays >= 1 && ttlDays <= 90;

  const updateField =
    (field: keyof FormState) =>
    (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setForm((current) => ({ ...current, [field]: event.target.value }));
      setErrorMessage("");
      setCopied(false);
    };

  function changeStatusFilter(nextStatusFilter: AccessCodeStatusFilter) {
    setStatusFilter(nextStatusFilter);
    setAccessCodes([]);
    setAccessCodeCount(null);
    setListErrorMessage("");
  }

  async function refreshAccessCodes(nextStatusFilter = statusFilter) {
    setIsLoadingCodes(true);
    setListErrorMessage("");

    try {
      const query = new URLSearchParams({
        limit: "20"
      });

      if (nextStatusFilter !== "all") {
        query.set("status", nextStatusFilter);
      }
      const response = await fetch(`/api/admin/access-codes?${query.toString()}`, {
        headers: buildAdminHeaders()
      });
      const payload = (await response.json().catch(() => ({}))) as ListAccessCodesResponse;

      if (!response.ok) {
        setListErrorMessage(getErrorMessage(response, payload, "최근 코드 목록을 불러오지 못했습니다."));
        return;
      }

      if (!Array.isArray(payload.accessCodes)) {
        setListErrorMessage("목록 응답 형식이 올바르지 않습니다.");
        return;
      }

      setAccessCodes(payload.accessCodes);
      setAccessCodeCount(typeof payload.count === "number" ? payload.count : payload.accessCodes.length);
    } catch {
      setListErrorMessage("네트워크 상태를 확인한 뒤 목록을 다시 불러와 주세요.");
    } finally {
      setIsLoadingCodes(false);
    }
  }

  async function revokeAccessCode(code: string) {
    if (revokingCode) return;

    setRevokingCode(code);
    setListErrorMessage("");

    try {
      const response = await fetch("/api/admin/access-codes/revoke", {
        method: "POST",
        headers: buildAdminHeaders(true),
        body: JSON.stringify({ code })
      });
      const payload = (await response.json().catch(() => ({}))) as RevokeAccessCodeResponse;

      if (!response.ok) {
        setListErrorMessage(getErrorMessage(response, payload, "코드 취소에 실패했습니다."));
        return;
      }

      if (!payload.accessCode?.code) {
        setListErrorMessage("취소 응답 형식이 올바르지 않습니다.");
        return;
      }

      setAccessCode((current) => (current?.code === code ? payload.accessCode ?? current : current));
      setAccessCodes((current) => {
        if (statusFilter === "active") {
          return current.filter((item) => item.code !== code);
        }

        return current.map((item) => (item.code === code ? payload.accessCode ?? item : item));
      });

      if (statusFilter === "active") {
        setAccessCodeCount((current) => (typeof current === "number" ? Math.max(0, current - 1) : current));
      }
    } catch {
      setListErrorMessage("네트워크 상태를 확인한 뒤 다시 취소해 주세요.");
    } finally {
      setRevokingCode(null);
    }
  }

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
        headers: buildAdminHeaders(true),
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

      <section className="rounded-lg border border-ink/10 bg-white p-5 shadow-panel sm:p-6 lg:col-span-2">
        <div className="mb-5 flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p className="mb-2 text-sm font-black text-sage">최근 코드 목록</p>
            <h2 className="text-2xl font-black leading-tight text-ink">발급된 접근 코드를 확인하고 취소합니다</h2>
            <p className="mt-3 text-sm leading-6 text-ink/62">
              로그인 세션으로 관리자 API를 호출합니다. 새로고침 시 최근 20개를 불러옵니다.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="inline-flex rounded-lg border border-ink/10 bg-paper p-1">
              {statusFilters.map((option) => {
                const isSelected = option.value === statusFilter;

                return (
                  <button
                    className={`min-h-10 rounded-md px-3 text-xs font-black transition sm:text-sm ${
                      isSelected ? "bg-ink text-paper shadow-sm" : "text-ink/64 hover:bg-white hover:text-ink"
                    }`}
                    key={option.value}
                    onClick={() => changeStatusFilter(option.value)}
                    type="button"
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>

            <button
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-ink/12 bg-white px-4 py-2 text-sm font-black text-ink transition hover:border-sage/40 hover:text-sage disabled:cursor-not-allowed disabled:text-ink/40"
              disabled={isLoadingCodes}
              onClick={() => void refreshAccessCodes()}
              type="button"
            >
              {isLoadingCodes ? (
                <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw aria-hidden="true" className="h-4 w-4" />
              )}
              새로고침
            </button>
          </div>
        </div>

        <div className="mb-4 flex flex-wrap items-center gap-2 text-xs font-black text-ink/56">
          <span className="rounded-full bg-paper px-3 py-1">
            필터: {statusFilters.find((option) => option.value === statusFilter)?.label}
          </span>
          <span className="rounded-full bg-paper px-3 py-1">
            {accessCodeCount === null ? "아직 불러오지 않음" : `총 ${accessCodeCount}개`}
          </span>
        </div>

        {listErrorMessage ? (
          <div className="mb-4 flex gap-3 rounded-lg border border-danger/20 bg-danger/8 p-4 text-sm font-bold leading-6 text-danger">
            <AlertTriangle aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0" />
            <p>{listErrorMessage}</p>
          </div>
        ) : null}

        {accessCodeCount === null && !isLoadingCodes ? (
          <div className="flex min-h-48 items-center justify-center rounded-lg border border-dashed border-ink/16 bg-paper p-6 text-center">
            <div>
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-sage/10 text-sage">
                <RefreshCw aria-hidden="true" className="h-5 w-5" />
              </div>
              <p className="text-lg font-black text-ink">목록을 아직 불러오지 않았습니다</p>
              <p className="mt-2 max-w-sm text-sm leading-6 text-ink/58">
                상태 필터를 선택한 뒤 새로고침을 누르면 관리자 코드 목록이 표시됩니다.
              </p>
            </div>
          </div>
        ) : accessCodes.length ? (
          <div className="overflow-hidden rounded-lg border border-ink/10">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-ink/10 text-left text-sm">
                <thead className="bg-paper text-xs font-black uppercase text-ink/54">
                  <tr>
                    <th className="px-4 py-3" scope="col">
                      코드
                    </th>
                    <th className="px-4 py-3" scope="col">
                      상태
                    </th>
                    <th className="px-4 py-3" scope="col">
                      구매자
                    </th>
                    <th className="px-4 py-3" scope="col">
                      발급/만료
                    </th>
                    <th className="px-4 py-3" scope="col">
                      사용
                    </th>
                    <th className="px-4 py-3" scope="col">
                      메모
                    </th>
                    <th className="px-4 py-3 text-right" scope="col">
                      관리
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ink/8 bg-white">
                  {accessCodes.map((item) => (
                    <tr className="align-top" key={item.code}>
                      <td className="px-4 py-4">
                        <p className="font-mono text-lg font-black text-ink">{item.maskedCode}</p>
                      </td>
                      <td className="px-4 py-4">
                        <span className={`inline-flex rounded-full px-3 py-1 text-xs font-black ${getStatusBadgeClass(item.status)}`}>
                          {getStatusLabel(item.status)}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <p className="font-black text-ink">{item.buyerName || "-"}</p>
                        <p className="mt-1 text-xs font-bold text-ink/48">{item.phone || "-"}</p>
                      </td>
                      <td className="px-4 py-4">
                        <p className="font-bold text-ink">{formatDateTime(item.issuedAt)}</p>
                        <p className="mt-1 text-xs font-bold text-danger">만료: {formatDateTime(item.expiresAt)}</p>
                      </td>
                      <td className="px-4 py-4">
                        <p className="font-bold text-ink">{formatDateTime(item.usedAt)}</p>
                        {item.resultId ? (
                          <p className="mt-1 max-w-[9rem] truncate text-xs font-bold text-ink/44">결과 {item.resultId}</p>
                        ) : null}
                      </td>
                      <td className="px-4 py-4">
                        <p className="max-w-[18rem] truncate font-bold text-ink/72">{item.memo || "-"}</p>
                      </td>
                      <td className="px-4 py-4 text-right">
                        {isActiveAccessCode(item) ? (
                          <button
                            className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-danger/20 bg-white px-3 py-2 text-sm font-black text-danger transition hover:bg-danger/8 disabled:cursor-not-allowed disabled:text-danger/40"
                            disabled={Boolean(revokingCode)}
                            onClick={() => void revokeAccessCode(item.code)}
                            type="button"
                          >
                            {revokingCode === item.code ? (
                              <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" />
                            ) : (
                              <Ban aria-hidden="true" className="h-4 w-4" />
                            )}
                            취소
                          </button>
                        ) : (
                          <span className="text-sm font-bold text-ink/36">-</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="flex min-h-48 items-center justify-center rounded-lg border border-dashed border-ink/16 bg-paper p-6 text-center">
            <div>
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-ink/8 text-ink/56">
                <Clipboard aria-hidden="true" className="h-5 w-5" />
              </div>
              <p className="text-lg font-black text-ink">표시할 코드가 없습니다</p>
              <p className="mt-2 max-w-sm text-sm leading-6 text-ink/58">
                다른 상태 필터를 선택하거나 새로고침으로 최신 목록을 다시 확인하세요.
              </p>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
