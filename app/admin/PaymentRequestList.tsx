"use client";

import { useState, useEffect, useCallback } from "react";
import { CheckCircle2, XCircle, Clock, Copy } from "lucide-react";

type PaymentStatus = "pending" | "confirmed" | "rejected";

interface PaymentRequest {
  id: string;
  name: string;
  contact: string;
  method: "kakaopay" | "bank";
  status: PaymentStatus;
  access_code: string | null;
  created_at: string;
  updated_at: string;
}

type StatusFilter = "pending" | "confirmed" | "rejected" | "all";

const statusFilters: Array<{ value: StatusFilter; label: string }> = [
  { value: "pending", label: "대기중" },
  { value: "confirmed", label: "확인완료" },
  { value: "rejected", label: "거절됨" },
  { value: "all", label: "전체" },
];

function StatusBadge({ status }: { status: PaymentStatus }) {
  const styles: Record<PaymentStatus, string> = {
    pending: "bg-yellow-100 text-yellow-800",
    confirmed: "bg-green-100 text-green-800",
    rejected: "bg-red-100 text-red-800",
  };
  const labels: Record<PaymentStatus, string> = {
    pending: "대기중",
    confirmed: "확인완료",
    rejected: "거절됨",
  };
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${styles[status]}`}
    >
      {labels[status]}
    </span>
  );
}

export function PaymentRequestList() {
  const [requests, setRequests] = useState<PaymentRequest[]>([]);
  const [filter, setFilter] = useState<StatusFilter>("pending");
  const [isLoading, setIsLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const fetchRequests = useCallback(async () => {
    setIsLoading(true);
    setError("");
    try {
      const params = filter !== "all" ? `?status=${filter}` : "";
      const res = await fetch(`/api/admin/payment-requests${params}`, {
        cache: "no-store",
      });
      if (!res.ok) throw new Error("목록 조회 실패");
      const data = await res.json();
      setRequests(data.requests ?? []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  async function handleAction(id: string, action: "confirmed" | "rejected") {
    setActionLoading(id);
    try {
      const res = await fetch("/api/admin/payment-requests", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: action }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d?.error ?? "처리 실패");
      }
      await fetchRequests();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "처리 중 오류");
    } finally {
      setActionLoading(null);
    }
  }

  function copyCode(code: string) {
    navigator.clipboard.writeText(code).then(() => {
      setCopiedCode(code);
      setTimeout(() => setCopiedCode(null), 2000);
    });
  }

  function formatDate(iso: string) {
    return new Date(iso).toLocaleString("ko-KR", {
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  return (
    <section className="rounded-3xl border border-ink/10 bg-white p-6 shadow-panel">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-lg font-bold text-ink">결제 신청 목록</h2>
        <button
          onClick={fetchRequests}
          className="rounded-xl border border-ink/10 px-3 py-1.5 text-xs font-semibold text-ink/60 transition hover:bg-paper"
        >
          새로고침
        </button>
      </div>

      {/* 상태 필터 */}
      <div className="mb-5 flex gap-2 overflow-x-auto">
        {statusFilters.map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={`shrink-0 rounded-xl px-3.5 py-1.5 text-xs font-bold transition ${
              filter === f.value
                ? "bg-ink text-white"
                : "border border-ink/10 text-ink/60 hover:text-ink"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {error && (
        <p className="mb-4 rounded-xl bg-red-50 px-4 py-2 text-sm text-danger">
          {error}
        </p>
      )}

      {isLoading ? (
        <div className="py-12 text-center text-sm text-ink/40">불러오는 중...</div>
      ) : requests.length === 0 ? (
        <div className="py-12 text-center text-sm text-ink/40">
          해당 상태의 신청이 없습니다.
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {requests.map((req) => (
            <div
              key={req.id}
              className="rounded-2xl border border-ink/8 bg-paper px-5 py-4"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-ink">{req.name}</span>
                    <StatusBadge status={req.status} />
                    <span className="text-xs text-ink/40">
                      {req.method === "kakaopay" ? "카카오페이" : "계좌이체"}
                    </span>
                  </div>
                  <p className="text-sm text-ink/60">{req.contact}</p>
                  <p className="text-xs text-ink/40">{formatDate(req.created_at)}</p>
                  {req.access_code && (
                    <div className="mt-1 flex items-center gap-1.5">
                      <span className="rounded-lg bg-sage/10 px-2 py-0.5 text-xs font-bold text-sage">
                        {req.access_code}
                      </span>
                      <button
                        onClick={() => copyCode(req.access_code!)}
                        className="text-ink/40 transition hover:text-ink"
                      >
                        {copiedCode === req.access_code ? (
                          <CheckCircle2 className="h-3.5 w-3.5 text-sage" />
                        ) : (
                          <Copy className="h-3.5 w-3.5" />
                        )}
                      </button>
                    </div>
                  )}
                </div>

                {req.status === "pending" && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleAction(req.id, "confirmed")}
                      disabled={actionLoading === req.id}
                      className="flex items-center gap-1.5 rounded-xl bg-green-600 px-3 py-2 text-xs font-bold text-white transition hover:bg-green-700 disabled:opacity-60"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      {actionLoading === req.id ? "처리중..." : "입금 확인"}
                    </button>
                    <button
                      onClick={() => handleAction(req.id, "rejected")}
                      disabled={actionLoading === req.id}
                      className="flex items-center gap-1.5 rounded-xl border border-red-200 px-3 py-2 text-xs font-bold text-danger transition hover:bg-red-50 disabled:opacity-60"
                    >
                      <XCircle className="h-3.5 w-3.5" />
                      거절
                    </button>
                  </div>
                )}

                {req.status === "confirmed" && (
                  <span className="flex items-center gap-1 text-xs text-green-700">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    완료
                  </span>
                )}

                {req.status === "rejected" && (
                  <span className="flex items-center gap-1 text-xs text-danger">
                    <XCircle className="h-3.5 w-3.5" />
                    거절됨
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 대기중 카운트 표시 */}
      {filter === "all" && (
        <div className="mt-4 border-t border-ink/5 pt-4">
          <div className="flex gap-4 text-xs text-ink/50">
            <span>
              대기:{" "}
              <strong className="text-yellow-700">
                {requests.filter((r) => r.status === "pending").length}
              </strong>
            </span>
            <span>
              완료:{" "}
              <strong className="text-green-700">
                {requests.filter((r) => r.status === "confirmed").length}
              </strong>
            </span>
            <span>
              거절:{" "}
              <strong className="text-danger">
                {requests.filter((r) => r.status === "rejected").length}
              </strong>
            </span>
          </div>
        </div>
      )}

      {/* 대기 아이콘 */}
      {filter !== "all" && requests.some((r) => r.status === "pending") && (
        <div className="mt-4 flex items-center gap-1.5 text-xs text-yellow-700">
          <Clock className="h-3.5 w-3.5" />
          대기 중인 신청이 있습니다.
        </div>
      )}
    </section>
  );
}
