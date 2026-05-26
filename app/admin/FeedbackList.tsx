"use client";

import { useEffect, useState } from "react";
import { MessageSquare, RefreshCw, Loader2 } from "lucide-react";

interface FeedbackRow {
  id: string;
  message: string;
  created_at: string;
}

export default function FeedbackList() {
  const [items, setItems] = useState<FeedbackRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  async function load() {
    setIsLoading(true);
    try {
      const res = await fetch("/api/admin/feedback", { credentials: "include" });
      if (res.ok) {
        const data = await res.json() as { feedback?: FeedbackRow[] };
        setItems(data.feedback ?? []);
      }
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => { void load(); }, []);

  return (
    <section className="rounded-3xl border border-ink/10 bg-white p-6 shadow-panel">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-sage" />
          <h2 className="text-lg font-bold text-ink">유저 피드백</h2>
          {items.length > 0 && (
            <span className="rounded-full bg-sage/10 px-2 py-0.5 text-xs font-bold text-sage">
              {items.length}
            </span>
          )}
        </div>
        <button
          onClick={() => void load()}
          disabled={isLoading}
          className="flex items-center gap-1.5 rounded-xl border border-ink/10 bg-paper px-3 py-2 text-xs font-semibold text-ink/60 transition hover:text-ink disabled:opacity-40"
        >
          <RefreshCw className={`h-3 w-3 ${isLoading ? "animate-spin" : ""}`} />
          새로고침
        </button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-10 text-ink/30">
          <Loader2 className="h-5 w-5 animate-spin" />
        </div>
      ) : items.length === 0 ? (
        <p className="py-10 text-center text-sm text-ink/30">피드백이 없습니다.</p>
      ) : (
        <ul className="space-y-3">
          {items.map((item) => (
            <li key={item.id} className="rounded-2xl border border-ink/8 bg-paper p-4 shadow-sm">
              <p className="whitespace-pre-wrap text-sm leading-6 text-ink">{item.message}</p>
              <p className="mt-2 text-xs text-ink/35">
                {new Date(item.created_at).toLocaleString("ko-KR")}
              </p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
