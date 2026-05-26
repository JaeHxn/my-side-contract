"use client";

import { useState } from "react";

const CONTACT_EMAIL = "skfkgksrnr@gmail.com";

export function BetaBanner() {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(CONTACT_EMAIL);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard API 미지원 시 선택 fallback
      const el = document.createElement("textarea");
      el.value = CONTACT_EMAIL;
      el.style.position = "fixed";
      el.style.opacity = "0";
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  return (
    <div className="w-full bg-sage/90 px-4 py-2 text-center text-xs font-bold text-white sm:text-sm">
      ⚡ 베타 서비스 운영 중 — 피드백·오류 제보:{" "}
      <button
        onClick={handleCopy}
        className="inline-flex items-center gap-1 rounded bg-white/15 px-2 py-0.5 font-bold transition hover:bg-white/25 active:scale-95"
        aria-label={copied ? "이메일 주소 복사됨" : "이메일 주소 복사"}
        type="button"
      >
        {copied ? (
          <>✓ 복사됨</>
        ) : (
          <>{CONTACT_EMAIL}</>
        )}
      </button>
    </div>
  );
}
