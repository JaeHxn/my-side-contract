"use client";

import { useState, useEffect } from "react";
import { Copy, Check, Share2 } from "lucide-react";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://my-side-contract.vercel.app";
const SHARE_TITLE = "내편계약서";
const SHARE_TEXT = "계약서 사인 전에 AI로 불리한 조항을 잡아보세요. 법령 근거와 함께 3,900원에 분석합니다.";

export function ShareButtons() {
  const [copied, setCopied] = useState(false);
  const [canNativeShare, setCanNativeShare] = useState(false);

  useEffect(() => {
    setCanNativeShare(typeof navigator !== "undefined" && "share" in navigator);
  }, []);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(SITE_URL);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard not available — silent fallback
    }
  };

  const handleNativeShare = async () => {
    try {
      await navigator.share({ title: SHARE_TITLE, text: SHARE_TEXT, url: SITE_URL });
    } catch {
      // user cancelled or share not available
    }
  };

  const xUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(SHARE_TEXT)}&url=${encodeURIComponent(SITE_URL)}`;
  const bandUrl = `https://band.us/plugin/share?body=${encodeURIComponent(`${SHARE_TEXT}\n${SITE_URL}`)}&route=${encodeURIComponent(SITE_URL)}`;
  const lineUrl = `https://social-plugins.line.me/lineit/share?url=${encodeURIComponent(SITE_URL)}`;

  return (
    <div className="flex flex-wrap items-center justify-center gap-3">
      {canNativeShare && (
        <button
          onClick={handleNativeShare}
          className="inline-flex items-center gap-2 rounded-lg bg-ink px-4 py-2.5 text-sm font-bold text-paper transition hover:bg-sage"
        >
          <Share2 aria-hidden="true" className="h-4 w-4" />
          카카오·인스타 공유
        </button>
      )}

      <button
        onClick={handleCopy}
        className="inline-flex items-center gap-2 rounded-lg border border-ink/15 bg-white px-4 py-2.5 text-sm font-bold text-ink transition hover:border-sage/40 hover:text-sage"
      >
        {copied
          ? <Check aria-hidden="true" className="h-4 w-4 text-safe" />
          : <Copy aria-hidden="true" className="h-4 w-4" />}
        {copied ? "복사됨!" : "링크 복사"}
      </button>

      <a
        href={xUrl}
        target="_blank"
        rel="noreferrer"
        className="inline-flex items-center gap-2 rounded-lg border border-ink/15 bg-white px-4 py-2.5 text-sm font-bold text-ink transition hover:border-sage/40 hover:text-sage"
      >
        X(트위터)
      </a>

      <a
        href={bandUrl}
        target="_blank"
        rel="noreferrer"
        className="inline-flex items-center gap-2 rounded-lg border border-ink/15 bg-white px-4 py-2.5 text-sm font-bold text-ink transition hover:border-sage/40 hover:text-sage"
      >
        네이버 밴드
      </a>

      <a
        href={lineUrl}
        target="_blank"
        rel="noreferrer"
        className="inline-flex items-center gap-2 rounded-lg border border-ink/15 bg-white px-4 py-2.5 text-sm font-bold text-ink transition hover:border-sage/40 hover:text-sage"
      >
        라인
      </a>
    </div>
  );
}
