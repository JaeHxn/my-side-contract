"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, XCircle, RefreshCw, Mail, Loader2 } from "lucide-react";

interface PaymentRequest {
  id: string;
  depositor_name: string;
  email: string | null;
  method: "kakaopay" | "bank" | null;
  amount: number;
  status: "pending" | "confirmed" | "rejected";
  issued_code: string | null;
  created_at: string;
}

interface ActionResult {
  ok?: boolean;
  code?: string;
  emailSent?: boolean;
  emailError?: string | null;
  error?: string;
  message?: string;
}

type FilterStatus = "all" | "pending" | "confirmed" | "rejected";

const STATUS_LABEL: Record<string, string> = {
  pending: "대기",
  confirmed: "확인",
  rejected: "거절",
};
const STATUS_CLASS: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  confirmed: "bg-green-100 text-green-700",
  rejected: "bg-red-100 text-red-600",
};
const METHOD_LABEL: Record<string, string> = {
  kakaopay: "카카오페이",
  bank: "계좌이체",
};

export default function PaymentRequestList() {
  const [requests, setRequests] = useState<PaymentRequest[]>([]);
  const [allRequests, setAllRequests] = useState<PaymentRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<FilterStatus>("pending");
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ id: string; message: string; isError: boolean } | null>(null);

  async function load() {
    setIsLoading(true);
    try {
      const [filteredRes, allRes] = await Promise.all([
        fetch(`/api/admin/payment-requests?status=${filter}`, { credentials: "include" }),
        fetch(`/api/admin/payment-requests?status=all`, { credentials: "include" }),
      ]);
      if (filteredRes.ok) {
        const data = await filteredRes.json() as { paymentRequests?: PaymentRequest[] };
        setRequests(data.paymentRequests ?? []);
      }
      if (allRes.ok) {
        const data = await allRes.json() as { paymentRequests?: PaymentRequest[] };
        setAllRequests(data.paymentRequests ?? []);
      }
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => { void load(); }, [filter]); // eslint-disable-line react-hooks/exhaustive-deps

  function showToast(id: string, message: string, isError = false) {
    setToast({ id, message, isError });
    setTimeout(() => setToast(null), 5000);
  }

  async function handleAction(req: PaymentRequest, action: "confirm" | "reject" | "resend_email") {
    setProcessingId(req.id);
    try {
      const res = await fetch("/api/admin/payment-requests", {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: req.id, action }),
      });
      const data = await res.json() as ActionResult;
      if (!res.ok) {
        showToast(req.id, data.message ?? "오류가 발생했습니다.", true);
        return;
      }
      if (action === "confirm") {
        const emailMsg = data.emailSent
          ? `✓ 코드 발급 + 이메일 발송 완료 (${req.email})`
          : data.emailError
          ? `⚠ 코드 발급됨(${data.code}) — 이메일 실패: ${data.emailError}`
          : `코드 발급됨: ${data.code} (이메일 없음)`;
        showToast(req.id, emailMsg, !!data.emailError);
      } else if (action === "resend_email") {
        const msg = data.emailSent
          ? `✓ 이메일 재발송 완료 (${req.email})`
          : `✗ 재발송 실패: ${data.emailError ?? "알 수 없는 오류"}`;
        showToast(req.id, msg, !data.emailSent);
      } else {
        showToast(req.id, "거절 처리 완료");
      }
      await load();
    } finally {
      setProcessingId(null);
    }
  }

  return (
    <section className="rounded-3xl border border-ink/10 bg-white p-6 shadow-panel">
      {/* 통계 배너 */}
      {allRequests.length > 0 && (
        <div className="mb-5 grid grid-cols-3 gap-3">
          {[
            { label: "대기", value: allRequests.filter((r) => r.status === "pending").length, color: "text-yellow-700 bg-yellow-50 border-yellow-200" },
            { label: "완료", value: allRequests.filter((r) => r.status === "confirmed").length, color: "text-green-700 bg-green-50 border-green-200" },
            { label: "전체", value: allRequests.length, color: "text-ink bg-paper border-ink/10" },
          ].map((stat) => (
            <div key={stat.label} className={`rounded-xl border px-3 py-2.5 text-center ${stat.color}`}>
              <p className="text-xl font-black">{stat.value}</p>
              <p className="text-xs font-semibold opacity-70">{stat.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* 헤더 */}
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-bold text-ink">결제 신청 목록</h2>
        <button
          onClick={() => void load()}
          disabled={isLoading}
          className="flex items-center gap-1.5 rounded-xl border border-ink/10 bg-paper px-3 py-2 text-xs font-semibold text-ink/60 transition hover:text-ink disabled:opacity-40"
        >
          <RefreshCw className={`h-3 w-3 ${isLoading ? "animate-spin" : ""}`} />
          새로고침
        </button>
      </div>

      {/* 필터 탭 */}
      <div className="mb-5 flex gap-1 rounded-xl border border-ink/10 bg-paper p-1">
        {(["all", "pending", "confirmed", "rejected"] as FilterStatus[]).map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`flex-1 rounded-lg py-2 text-xs font-bold transition ${
              filter === s ? "bg-ink text-white shadow" : "text-ink/50 hover:text-ink"
            }`}
          >
            {s === "all" ? "전체" : STATUS_LABEL[s]}
          </button>
        ))}
      </div>

      {/* 목록 */}
      {isLoading ? (
        <div className="flex items-center justify-center py-10 text-ink/30">
          <Loader2 className="h-5 w-5 animate-spin" />
        </div>
      ) : requests.length === 0 ? (
        <p className="py-10 text-center text-sm text-ink/30">신청 내역이 없습니다.</p>
      ) : (
        <ul className="space-y-3">
          {requests.map((req) => {
            const isPending = req.status === "pending";
            const isProcessing = processingId === req.id;

            return (
              <li
                key={req.id}
                className="rounded-2xl border border-ink/8 bg-paper p-4 shadow-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  {/* 정보 */}
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-bold text-ink">{req.depositor_name}</span>
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                          STATUS_CLASS[req.status] ?? "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {STATUS_LABEL[req.status] ?? req.status}
                      </span>
                      {req.method && (
                        <span className="rounded-full bg-sage/10 px-2 py-0.5 text-xs text-sage/70">
                          {METHOD_LABEL[req.method] ?? req.method}
                        </span>
                      )}
                    </div>
                    <div className="mt-1.5 flex items-center gap-1.5 text-sm text-ink/50">
                      <Mail className="h-3.5 w-3.5 flex-shrink-0" />
                      <span className="truncate">{req.email ?? "이메일 없음"}</span>
                    </div>
                    <div className="mt-1 flex flex-wrap gap-3 text-xs text-ink/40">
                      <span>{req.amount?.toLocaleString() ?? "?"}원</span>
                      <span>{new Date(req.created_at).toLocaleString("ko-KR")}</span>
                      {req.issued_code && (
                        <span className="font-mono font-bold text-sage">
                          코드: {req.issued_code}
                        </span>
                      )}
                    </div>

                    {/* 토스트 */}
                    {toast?.id === req.id && (
                      <p
                        className={`mt-2 rounded-lg px-3 py-1.5 text-xs font-semibold ${
                          toast.isError
                            ? "bg-red-50 text-danger"
                            : "bg-green-50 text-green-700"
                        }`}
                      >
                        {toast.message}
                      </p>
                    )}
                  </div>

                  {/* 버튼 */}
                  <div className="flex flex-shrink-0 flex-col gap-2">
                    {isPending && (
                      <>
                        <button
                          onClick={() => void handleAction(req, "confirm")}
                          disabled={isProcessing}
                          title="입금 확인 — 코드 자동 발급 + 이메일 발송"
                          className="flex items-center gap-1.5 rounded-xl bg-sage/10 px-3 py-2 text-xs font-bold text-sage transition hover:bg-sage/20 disabled:opacity-50"
                        >
                          {isProcessing ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <CheckCircle2 className="h-3.5 w-3.5" />
                          )}
                          승인 + 이메일
                        </button>
                        <button
                          onClick={() => void handleAction(req, "reject")}
                          disabled={isProcessing}
                          className="flex items-center gap-1.5 rounded-xl bg-red-50 px-3 py-2 text-xs font-bold text-danger transition hover:bg-red-100 disabled:opacity-50"
                        >
                          <XCircle className="h-3.5 w-3.5" />
                          거절
                        </button>
                      </>
                    )}
                    {!isPending && req.status === "confirmed" && req.email && req.issued_code && (
                      <button
                        onClick={() => void handleAction(req, "resend_email")}
                        disabled={isProcessing}
                        title={`이용 코드 이메일 재발송 → ${req.email}`}
                        className="flex items-center gap-1.5 rounded-xl bg-blue-50 px-3 py-2 text-xs font-bold text-blue-600 transition hover:bg-blue-100 disabled:opacity-50"
                      >
                        {isProcessing ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Mail className="h-3.5 w-3.5" />
                        )}
                        이메일 재발송
                      </button>
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
