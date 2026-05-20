"use client";

import { useCallback, useEffect, useState } from "react";
import { AlertTriangle, Ban, CheckCircle2, Phone, RefreshCw, Smartphone } from "lucide-react";
import { formatKoreanDateTime } from "@/src/lib/time/korean-time";

type PaymentRequest = {
  id: string;
  depositor_name: string;
  phone: string;
  amount: number;
  status: "pending" | "confirmed" | "rejected";
  memo: string | null;
  issued_code: string | null;
  created_at: string;
};

type StatusFilter = "pending" | "confirmed" | "rejected" | "all";

const statusFilters: Array<{ value: StatusFilter; label: string }> = [
  { value: "pending", label: "입금 대기" },
  { value: "confirmed", label: "처리 완료" },
  { value: "rejected", label: "거절" },
  { value: "all", label: "전체" },
];

function statusBadge(status: PaymentRequest["status"]) {
  switch (status) {
    case "pending":
      return (
        <span className="inline-flex items-center rounded-full bg-amber-50 px-2 py-0.5 text-xs font-bold text-amber-700">
          대기 중
        </span>
      );
    case "confirmed":
      return (
        <span className="inline-flex items-center rounded-full bg-sage/10 px-2 py-0.5 text-xs font-bold text-sage">
          처리 완료
        </span>
      );
    case "rejected":
      return (
        <span className="inline-flex items-center rounded-full bg-danger/10 px-2 py-0.5 text-xs font-bold text-danger">
          거절
        </span>
      );
  }
}

export function PaymentRequestList() {
  const [requests, setRequests] = useState<PaymentRequest[]>([]);
  const [filter, setFilter] = useState<StatusFilter>("pending");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [actionError, setActionError] = useState<Record<string, string>>({});
  const [pendingCode, setPendingCode] = useState<Record<string, string>>({});
  const [processing, setProcessing] = useState<Record<string, boolean>>({});

  const loadRequests = useCallback(async () => {
    setIsLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/admin/payment-requests?status=${filter}`, {
        headers: { Accept: "application/json" },
      });
      const data = (await res.json().catch(() => ({}))) as {
        paymentRequests?: PaymentRequest[];
        message?: string;
      };
      if (!res.ok) {
        setError(data.message ?? "목록을 불러오지 못했습니다.");
        return;
      }
      setRequests(data.paymentRequests ?? []);
    } catch {
      setError("네트워크 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    void loadRequests();
  }, [loadRequests]);

  async function handleConfirm(id: string) {
    const code = pendingCode[id]?.trim();
    if (!code || !/^\d{6}$/.test(code)) {
      setActionError((prev) => ({ ...prev, [id]: "발급할 6자리 숫자 코드를 입력하세요." }));
      return;
    }
    setProcessing((prev) => ({ ...prev, [id]: true }));
    setActionError((prev) => ({ ...prev, [id]: "" }));
    try {
      const res = await fetch("/api/admin/payment-requests", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ id, issuedCode: code }),
      });
      const data = (await res.json().catch(() => ({}))) as { ok?: boolean; message?: string };
      if (!res.ok || !data.ok) {
        setActionError((prev) => ({ ...prev, [id]: data.message ?? "처리 중 오류가 발생했습니다." }));
        return;
      }
      void loadRequests();
    } catch {
      setActionError((prev) => ({ ...prev, [id]: "네트워크 오류가 발생했습니다." }));
    } finally {
      setProcessing((prev) => ({ ...prev, [id]: false }));
    }
  }

  async function handleReject(id: string) {
    if (!confirm("이 입금 신청을 거절하시겠습니까?")) return;
    setProcessing((prev) => ({ ...prev, [id]: true }));
    try {
      const res = await fetch("/api/admin/payment-requests", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ id, action: "reject" }),
      });
      const data = (await res.json().catch(() => ({}))) as { ok?: boolean; message?: string };
      if (!res.ok || !data.ok) {
        setActionError((prev) => ({ ...prev, [id]: data.message ?? "처리 중 오류가 발생했습니다." }));
        return;
      }
      void loadRequests();
    } catch {
      setActionError((prev) => ({ ...prev, [id]: "네트워크 오류가 발생했습니다." }));
    } finally {
      setProcessing((prev) => ({ ...prev, [id]: false }));
    }
  }

  return (
    <section className="rounded-lg border border-ink/10 bg-white p-5 shadow-panel sm:p-7">
      {/* 헤더 */}
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-black text-ink">입금 신청 목록</h2>
          <p className="mt-0.5 text-xs text-ink/48">
            은행 앱에서 입금 내역 확인 후 이름·금액 매칭 → 코드 발급
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-lg border border-ink/10 bg-paper p-1">
            {statusFilters.map((f) => (
              <button
                key={f.value}
                type="button"
                onClick={() => setFilter(f.value)}
                className={`rounded-md px-3 py-1.5 text-xs font-bold transition ${
                  filter === f.value ? "bg-ink text-paper shadow" : "text-ink/56 hover:text-ink"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => void loadRequests()}
            disabled={isLoading}
            className="inline-flex items-center gap-1.5 rounded-lg border border-ink/10 bg-white px-3 py-2 text-xs font-bold text-ink/64 transition hover:border-sage/40 hover:text-sage disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`} />
            새로고침
          </button>
        </div>
      </div>

      {/* 은행 앱 확인 안내 (대기 중 탭에서만) */}
      {filter === "pending" && !isLoading && requests.length > 0 ? (
        <div className="mb-4 flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
          <Smartphone className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
          <p className="text-xs leading-5 text-amber-700">
            <strong>확인 순서:</strong> 은행 앱 열기 → 입금 내역에서 <strong>이름 + 3,900원</strong> 찾기 → 아래 목록에서 같은 이름 찾아 코드 발급
          </p>
        </div>
      ) : null}

      {error ? (
        <div className="flex items-center gap-2 rounded-lg bg-danger/8 px-4 py-3 text-sm text-danger">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      ) : requests.length === 0 ? (
        <p className="py-8 text-center text-sm text-ink/40">
          {isLoading ? "불러오는 중…" : "해당 신청이 없습니다."}
        </p>
      ) : (
        <div className="space-y-3">
          {requests.map((req) => (
            <div
              key={req.id}
              className={`rounded-xl border p-4 transition ${
                req.status === "pending"
                  ? "border-amber-200 bg-amber-50/40 hover:border-amber-300"
                  : "border-ink/8 bg-paper hover:border-ink/16"
              }`}
            >
              {/* 핵심 정보: 이름 + 금액 크게 표시 (은행 앱 매칭용) */}
              <div className="mb-3 flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  {/* 입금자명 — 은행 앱 매칭의 핵심 */}
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-ink text-base font-black text-paper">
                    {req.depositor_name.slice(0, 1)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-black text-ink">{req.depositor_name}</span>
                      {statusBadge(req.status)}
                    </div>
                    <p className="text-sm font-bold text-amber-600">
                      {req.amount.toLocaleString()}원 입금 확인 필요
                    </p>
                  </div>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-xs text-ink/40">
                    신청 시각
                  </p>
                  <p className="text-xs font-bold text-ink/64">
                    {formatKoreanDateTime(req.created_at, { dateStyle: "short", timeStyle: "short" })}
                  </p>
                </div>
              </div>

              {/* 연락처 + 발급 코드 */}
              <div className="mb-3 flex flex-wrap items-center gap-3 rounded-lg bg-white/60 px-3 py-2 text-xs">
                <span className="flex items-center gap-1 font-bold text-ink/64">
                  <Phone className="h-3 w-3" />
                  {req.phone}
                  <span className="text-ink/36">(코드 받을 번호)</span>
                </span>
                {req.issued_code ? (
                  <span className="font-bold text-sage">
                    발급된 코드: <strong className="text-base">{req.issued_code}</strong>
                  </span>
                ) : null}
              </div>

              {/* 대기 중일 때 코드 발급 영역 */}
              {req.status === "pending" ? (
                <div className="flex flex-col gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <label className="text-xs font-bold text-ink/64">
                      은행 앱 확인 후 코드 발급:
                    </label>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="text"
                        inputMode="numeric"
                        maxLength={6}
                        placeholder="코드 6자리"
                        value={pendingCode[req.id] ?? ""}
                        onChange={(e) =>
                          setPendingCode((prev) => ({
                            ...prev,
                            [req.id]: e.target.value.replace(/\D/g, ""),
                          }))
                        }
                        className="w-28 rounded-lg border border-ink/16 bg-white px-3 py-2 text-sm font-black text-ink outline-none transition focus:border-sage focus:ring-2 focus:ring-sage/20"
                      />
                      <button
                        type="button"
                        onClick={() => void handleConfirm(req.id)}
                        disabled={processing[req.id]}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-ink px-3 py-2 text-xs font-black text-paper transition hover:bg-sage disabled:opacity-50"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        입금 확인 · 코드 발급
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleReject(req.id)}
                        disabled={processing[req.id]}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-danger/20 px-3 py-2 text-xs font-bold text-danger transition hover:bg-danger/8 disabled:opacity-50"
                      >
                        <Ban className="h-3.5 w-3.5" />
                        미입금·거절
                      </button>
                    </div>
                  </div>
                  {actionError[req.id] ? (
                    <p className="text-xs text-danger">{actionError[req.id]}</p>
                  ) : null}
                </div>
              ) : null}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}


type PaymentRequest = {
  id: string;
  depositor_name: string;
  phone: string;
  amount: number;
  status: "pending" | "confirmed" | "rejected";
  memo: string | null;
  issued_code: string | null;
  created_at: string;
};

type StatusFilter = "pending" | "confirmed" | "rejected" | "all";

const statusFilters: Array<{ value: StatusFilter; label: string }> = [
  { value: "pending", label: "입금 대기" },
  { value: "confirmed", label: "처리 완료" },
  { value: "rejected", label: "거절" },
  { value: "all", label: "전체" },
];

function statusBadge(status: PaymentRequest["status"]) {
  switch (status) {
    case "pending":
      return (
        <span className="inline-flex items-center rounded-full bg-amber-50 px-2 py-0.5 text-xs font-bold text-amber-700">
          대기 중
        </span>
      );
    case "confirmed":
      return (
        <span className="inline-flex items-center rounded-full bg-sage/10 px-2 py-0.5 text-xs font-bold text-sage">
          처리 완료
        </span>
      );
    case "rejected":
      return (
        <span className="inline-flex items-center rounded-full bg-danger/10 px-2 py-0.5 text-xs font-bold text-danger">
          거절
        </span>
      );
  }
}

export function PaymentRequestList() {
  const [requests, setRequests] = useState<PaymentRequest[]>([]);
  const [filter, setFilter] = useState<StatusFilter>("pending");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [actionError, setActionError] = useState<Record<string, string>>({});
  const [pendingCode, setPendingCode] = useState<Record<string, string>>({});
  const [processing, setProcessing] = useState<Record<string, boolean>>({});

  const loadRequests = useCallback(async () => {
    setIsLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/admin/payment-requests?status=${filter}`, {
        headers: { Accept: "application/json" },
      });
      const data = (await res.json().catch(() => ({}))) as {
        paymentRequests?: PaymentRequest[];
        message?: string;
      };
      if (!res.ok) {
        setError(data.message ?? "목록을 불러오지 못했습니다.");
        return;
      }
      setRequests(data.paymentRequests ?? []);
    } catch {
      setError("네트워크 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    void loadRequests();
  }, [loadRequests]);

  async function handleConfirm(id: string) {
    const code = pendingCode[id]?.trim();
    if (!code || !/^\d{6}$/.test(code)) {
      setActionError((prev) => ({ ...prev, [id]: "발급할 6자리 숫자 코드를 입력하세요." }));
      return;
    }
    setProcessing((prev) => ({ ...prev, [id]: true }));
    setActionError((prev) => ({ ...prev, [id]: "" }));
    try {
      const res = await fetch("/api/admin/payment-requests", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ id, issuedCode: code }),
      });
      const data = (await res.json().catch(() => ({}))) as { ok?: boolean; message?: string };
      if (!res.ok || !data.ok) {
        setActionError((prev) => ({ ...prev, [id]: data.message ?? "처리 중 오류가 발생했습니다." }));
        return;
      }
      void loadRequests();
    } catch {
      setActionError((prev) => ({ ...prev, [id]: "네트워크 오류가 발생했습니다." }));
    } finally {
      setProcessing((prev) => ({ ...prev, [id]: false }));
    }
  }

  async function handleReject(id: string) {
    if (!confirm("이 입금 신청을 거절하시겠습니까?")) return;
    setProcessing((prev) => ({ ...prev, [id]: true }));
    try {
      const res = await fetch("/api/admin/payment-requests", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ id, action: "reject" }),
      });
      const data = (await res.json().catch(() => ({}))) as { ok?: boolean; message?: string };
      if (!res.ok || !data.ok) {
        setActionError((prev) => ({ ...prev, [id]: data.message ?? "처리 중 오류가 발생했습니다." }));
        return;
      }
      void loadRequests();
    } catch {
      setActionError((prev) => ({ ...prev, [id]: "네트워크 오류가 발생했습니다." }));
    } finally {
      setProcessing((prev) => ({ ...prev, [id]: false }));
    }
  }

  return (
    <section className="rounded-lg border border-ink/10 bg-white p-5 shadow-panel sm:p-7">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-black text-ink">입금 신청 목록</h2>
        <div className="flex items-center gap-2">
          <div className="flex rounded-lg border border-ink/10 bg-paper p-1">
            {statusFilters.map((f) => (
              <button
                key={f.value}
                type="button"
                onClick={() => setFilter(f.value)}
                className={`rounded-md px-3 py-1.5 text-xs font-bold transition ${
                  filter === f.value
                    ? "bg-ink text-paper shadow"
                    : "text-ink/56 hover:text-ink"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => void loadRequests()}
            disabled={isLoading}
            className="inline-flex items-center gap-1.5 rounded-lg border border-ink/10 bg-white px-3 py-2 text-xs font-bold text-ink/64 transition hover:border-sage/40 hover:text-sage disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`} />
            새로고침
          </button>
        </div>
      </div>

      {error ? (
        <div className="flex items-center gap-2 rounded-lg bg-danger/8 px-4 py-3 text-sm text-danger">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      ) : requests.length === 0 ? (
        <p className="py-8 text-center text-sm text-ink/40">
          {isLoading ? "불러오는 중…" : "해당 신청이 없습니다."}
        </p>
      ) : (
        <div className="space-y-3">
          {requests.map((req) => (
            <div
              key={req.id}
              className="rounded-xl border border-ink/8 bg-paper p-4 transition hover:border-ink/16"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-black text-ink">{req.depositor_name}</span>
                    {statusBadge(req.status)}
                  </div>
                  <p className="text-xs text-ink/56">
                    {req.phone} · {req.amount.toLocaleString()}원 ·{" "}
                    {formatKoreanDateTime(req.created_at, { dateStyle: "short", timeStyle: "short" })}
                  </p>
                  {req.issued_code ? (
                    <p className="text-xs text-sage">
                      발급 코드: <strong>{req.issued_code}</strong>
                    </p>
                  ) : null}
                </div>

                {req.status === "pending" ? (
                  <div className="flex flex-col items-end gap-2">
                    <div className="flex items-center gap-1.5">
                      <input
                        type="text"
                        inputMode="numeric"
                        maxLength={6}
                        placeholder="코드 6자리"
                        value={pendingCode[req.id] ?? ""}
                        onChange={(e) =>
                          setPendingCode((prev) => ({
                            ...prev,
                            [req.id]: e.target.value.replace(/\D/g, ""),
                          }))
                        }
                        className="w-28 rounded-lg border border-ink/16 bg-white px-3 py-2 text-sm font-bold text-ink outline-none transition focus:border-sage focus:ring-2 focus:ring-sage/20"
                      />
                      <button
                        type="button"
                        onClick={() => void handleConfirm(req.id)}
                        disabled={processing[req.id]}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-ink px-3 py-2 text-xs font-black text-paper transition hover:bg-ink/85 disabled:opacity-50"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        확인 발급
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleReject(req.id)}
                        disabled={processing[req.id]}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-danger/20 px-3 py-2 text-xs font-bold text-danger transition hover:bg-danger/8 disabled:opacity-50"
                      >
                        <Ban className="h-3.5 w-3.5" />
                        거절
                      </button>
                    </div>
                    {actionError[req.id] ? (
                      <p className="text-xs text-danger">{actionError[req.id]}</p>
                    ) : null}
                  </div>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
