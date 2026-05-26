"use client";

import { useEffect, useRef, useState } from "react";
import { X, Send, Loader2, CheckCircle2 } from "lucide-react";

type Status = "idle" | "submitting" | "success" | "error";

export function BetaBanner() {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (open) {
      setTimeout(() => textareaRef.current?.focus(), 50);
    } else {
      setMessage("");
      setStatus("idle");
      setErrorMsg("");
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (status === "submitting") return;

    setStatus("submitting");
    setErrorMsg("");

    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: message.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.message ?? "전송에 실패했습니다.");
      }
      setStatus("success");
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "전송에 실패했습니다.");
      setStatus("error");
    }
  }

  return (
    <>
      <div className="w-full bg-sage/90 px-4 py-2 text-center text-xs font-bold text-white sm:text-sm">
        ⚡ 베타 서비스 운영 중 —{" "}
        <button
          onClick={() => setOpen(true)}
          className="inline-flex items-center gap-1 rounded bg-white/15 px-2 py-0.5 font-bold underline-offset-2 transition hover:bg-white/25 active:scale-95"
          type="button"
        >
          관리자에게 글쓰기
        </button>
      </div>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 backdrop-blur-sm"
          onClick={(e) => { if (e.target === e.currentTarget) setOpen(false); }}
        >
          <div className="w-full max-w-md rounded-2xl border border-ink/10 bg-white shadow-2xl">
            {/* 헤더 */}
            <div className="flex items-center justify-between border-b border-ink/8 px-5 py-4">
              <div>
                <p className="text-base font-black text-ink">관리자에게 글쓰기</p>
                <p className="text-xs text-ink/50">피드백·오류·건의사항을 남겨주세요</p>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="rounded-full p-1.5 text-ink/40 transition hover:bg-ink/6 hover:text-ink"
                aria-label="닫기"
                type="button"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* 본문 */}
            <div className="p-5">
              {status === "success" ? (
                <div className="flex flex-col items-center gap-3 py-6 text-center">
                  <CheckCircle2 className="h-12 w-12 text-safe" />
                  <p className="text-base font-black text-ink">전송 완료!</p>
                  <p className="text-sm text-ink/60">소중한 의견 감사합니다. 빠르게 확인하겠습니다.</p>
                  <button
                    onClick={() => setOpen(false)}
                    className="mt-2 rounded-lg bg-ink px-6 py-2.5 text-sm font-bold text-paper transition hover:bg-sage"
                    type="button"
                  >
                    닫기
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <textarea
                    ref={textareaRef}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="불편한 점, 오류, 개선 아이디어 등 무엇이든 남겨주세요."
                    maxLength={1000}
                    rows={5}
                    className="w-full resize-none rounded-xl border border-ink/10 bg-paper/60 p-4 text-sm leading-6 text-ink outline-none transition placeholder:text-ink/35 focus:border-sage focus:bg-white focus:ring-4 focus:ring-sage/12"
                    disabled={status === "submitting"}
                  />
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-xs text-ink/40">{message.trim().length} / 1000자</span>
                    {errorMsg && (
                      <p className="text-xs font-semibold text-danger">{errorMsg}</p>
                    )}
                  </div>
                  <button
                    type="submit"
                    disabled={message.trim().length < 5 || status === "submitting"}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-ink py-3 text-sm font-black text-paper shadow transition hover:bg-sage disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {status === "submitting" ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        전송 중...
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4" />
                        전송하기
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
