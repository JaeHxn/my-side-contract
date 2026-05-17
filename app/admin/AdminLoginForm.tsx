"use client";

import type { FormEvent } from "react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, Loader2, LockKeyhole } from "lucide-react";

type LoginResponse = {
  ok?: boolean;
  error?: string;
  message?: string;
};

export function AdminLoginForm() {
  const router = useRouter();
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setErrorMessage("");

    try {
      const response = await fetch("/api/admin/auth/login", {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ username, password })
      });
      const payload = (await response.json().catch(() => ({}))) as LoginResponse;

      if (!response.ok) {
        setErrorMessage(payload.message || payload.error || "관리자 로그인에 실패했습니다.");
        return;
      }

      router.refresh();
    } catch {
      setErrorMessage("네트워크 상태를 확인한 뒤 다시 로그인해 주세요.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="mx-auto max-w-xl rounded-lg border border-ink/10 bg-white p-5 shadow-panel sm:p-7">
      <div className="mb-6">
        <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-ink text-paper">
          <LockKeyhole aria-hidden="true" className="h-6 w-6" />
        </div>
        <p className="mb-2 text-sm font-black text-sage">관리자 로그인</p>
        <h2 className="text-2xl font-black leading-tight text-ink">관리자 인증 후 코드 발급 화면에 들어갑니다</h2>
        <p className="mt-3 text-sm leading-6 text-ink/62">
          아이디는 기본 `admin`이며, 비밀번호는 `.env.local`의 `ADMIN_ACCESS_TOKEN` 값입니다.
        </p>
      </div>

      <form className="space-y-5" onSubmit={handleSubmit}>
        <div className="space-y-2">
          <label className="text-sm font-black text-ink" htmlFor="adminUsername">
            관리자 아이디
          </label>
          <input
            autoComplete="username"
            className="w-full rounded-lg border border-ink/12 bg-paper px-4 py-3 text-sm font-bold text-ink outline-none transition placeholder:text-ink/34 focus:border-sage focus:bg-white focus:ring-4 focus:ring-sage/10"
            id="adminUsername"
            maxLength={80}
            onChange={(event) => setUsername(event.target.value)}
            placeholder="admin"
            type="text"
            value={username}
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-black text-ink" htmlFor="adminPassword">
            관리자 비밀번호
          </label>
          <input
            autoComplete="current-password"
            className="w-full rounded-lg border border-ink/12 bg-paper px-4 py-3 text-sm font-bold text-ink outline-none transition placeholder:text-ink/34 focus:border-sage focus:bg-white focus:ring-4 focus:ring-sage/10"
            id="adminPassword"
            maxLength={300}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="ADMIN_ACCESS_TOKEN"
            type="password"
            value={password}
          />
        </div>

        {errorMessage ? (
          <div className="flex gap-3 rounded-lg border border-danger/20 bg-danger/8 p-4 text-sm font-bold leading-6 text-danger">
            <AlertTriangle aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0" />
            <p>{errorMessage}</p>
          </div>
        ) : null}

        <button
          className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-lg bg-ink px-5 py-3 text-sm font-black text-paper shadow-lg shadow-ink/15 transition hover:bg-sage disabled:cursor-not-allowed disabled:bg-ink/45 disabled:shadow-none"
          disabled={isSubmitting}
          type="submit"
        >
          {isSubmitting ? <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" /> : null}
          로그인
        </button>
      </form>
    </section>
  );
}
