"use client";

import { type FormEvent, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, CheckCircle2, Copy, CreditCard } from "lucide-react";

const KAKAOPAY_LINK = process.env.NEXT_PUBLIC_KAKAOPAY_LINK ?? "";
const BANK_NAME = process.env.NEXT_PUBLIC_PAYMENT_BANK_NAME ?? "카카오뱅크";
const ACCOUNT_NUMBER = process.env.NEXT_PUBLIC_PAYMENT_ACCOUNT ?? "등록 전";
const ACCOUNT_HOLDER = process.env.NEXT_PUBLIC_PAYMENT_HOLDER ?? "내편계약서";
const PRICE = "3,900";

type PayMethod = "kakaopay" | "bank";

export default function PaymentPage() {
  const [method, setMethod] = useState<PayMethod>(KAKAOPAY_LINK ? "kakaopay" : "bank");
  const [depositorName, setDepositorName] = useState("");
  const [phone, setPhone] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");

    const cleanPhone = phone.replace(/-/g, "");
    if (depositorName.trim().length < 1) {
      setError("이름을 입력해 주세요.");
      return;
    }
    if (!/^[0-9]{10,11}$/.test(cleanPhone)) {
      setError("올바른 휴대폰번호를 입력해 주세요. (숫자만, 10~11자리)");
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch("/api/payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ depositorName: depositorName.trim(), phone: cleanPhone }),
      });
      const data = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string };
      if (!res.ok || !data.ok) {
        setError(data.error ?? "신청 중 오류가 발생했습니다. 다시 시도해 주세요.");
        return;
      }
      setSubmitted(true);
    } catch {
      setError("네트워크 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.");
    } finally {
      setIsLoading(false);
    }
  }

  function handleCopy() {
    navigator.clipboard.writeText(ACCOUNT_NUMBER.replace(/\s/g, "")).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="min-h-screen">
      <header className="border-b border-ink/10 bg-paper/84 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4 sm:px-6 lg:px-8">
          <Link className="text-lg font-black text-ink" href="/">
            내편계약서
          </Link>
          <Link
            className="inline-flex items-center gap-2 rounded-full border border-ink/10 bg-white px-3 py-2 text-sm font-bold text-ink transition hover:border-sage/40 hover:text-sage"
            href="/"
          >
            <ArrowLeft aria-hidden="true" className="h-4 w-4" />
            홈
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-xl px-5 py-10 sm:px-6">
        {submitted ? (
          <SuccessView method={method} />
        ) : (
          <>
            {/* 가격 배너 */}
            <div className="mb-6 rounded-2xl border border-sage/20 bg-sage/8 px-6 py-5 text-center">
              <p className="text-sm font-bold text-sage">계약서 AI 분석 1회</p>
              <p className="mt-1 text-4xl font-black text-ink">
                {PRICE}
                <span className="text-xl">원</span>
              </p>
              <p className="mt-2 text-sm text-ink/56">변호사 상담비의 1/100 — 즉시 분석</p>
            </div>

            {/* 결제 수단 선택 */}
            <div className="mb-5 flex gap-2">
              {KAKAOPAY_LINK ? (
                <button
                  type="button"
                  onClick={() => setMethod("kakaopay")}
                  className={`flex-1 rounded-xl border px-4 py-3 text-sm font-black transition ${
                    method === "kakaopay"
                      ? "border-yellow-400 bg-yellow-50 text-yellow-700 shadow-sm"
                      : "border-ink/10 bg-white text-ink/56 hover:border-ink/20"
                  }`}
                >
                  💛 카카오페이
                  {method === "kakaopay" ? (
                    <span className="ml-1.5 rounded-full bg-yellow-400 px-1.5 py-0.5 text-[10px] text-yellow-900">
                      추천
                    </span>
                  ) : null}
                </button>
              ) : null}
              <button
                type="button"
                onClick={() => setMethod("bank")}
                className={`flex-1 rounded-xl border px-4 py-3 text-sm font-black transition ${
                  method === "bank"
                    ? "border-ink/30 bg-ink text-paper shadow-sm"
                    : "border-ink/10 bg-white text-ink/56 hover:border-ink/20"
                }`}
              >
                🏦 계좌이체
              </button>
            </div>

            {/* 카카오페이 방식 */}
            {method === "kakaopay" && KAKAOPAY_LINK ? (
              <KakaoPaySection
                phone={phone}
                setPhone={setPhone}
                depositorName={depositorName}
                setDepositorName={setDepositorName}
                error={error}
                isLoading={isLoading}
                onSubmit={handleSubmit}
                kakaoLink={KAKAOPAY_LINK}
              />
            ) : null}

            {/* 계좌이체 방식 */}
            {method === "bank" ? (
              <BankSection
                phone={phone}
                setPhone={setPhone}
                depositorName={depositorName}
                setDepositorName={setDepositorName}
                error={error}
                isLoading={isLoading}
                onSubmit={handleSubmit}
                copied={copied}
                onCopy={handleCopy}
              />
            ) : null}

            <p className="mt-6 text-center text-xs text-ink/40">
              결제 후 문의:{" "}
              <a href="mailto:support@my-side-contract.vercel.app" className="underline hover:text-ink/64">
                이메일
              </a>
            </p>
          </>
        )}
      </main>
    </div>
  );
}

/* ── 카카오페이 섹션 ── */
type SectionProps = {
  phone: string;
  setPhone: (v: string) => void;
  depositorName: string;
  setDepositorName: (v: string) => void;
  error: string;
  isLoading: boolean;
  onSubmit: (e: FormEvent) => void;
};

function KakaoPaySection({
  phone,
  setPhone,
  depositorName,
  setDepositorName,
  error,
  isLoading,
  onSubmit,
  kakaoLink,
}: SectionProps & { kakaoLink: string }) {
  return (
    <div className="space-y-4">
      {/* 순서 안내 */}
      <section className="rounded-2xl border border-yellow-200 bg-yellow-50 p-5">
        <h2 className="mb-3 text-sm font-black text-yellow-800">결제 순서</h2>
        <ol className="space-y-2.5 text-sm text-yellow-700">
          <li className="flex items-start gap-2.5">
            <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-yellow-400 text-[11px] font-black text-yellow-900">
              1
            </span>
            아래에 이름과 번호를 먼저 입력하세요
          </li>
          <li className="flex items-start gap-2.5">
            <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-yellow-400 text-[11px] font-black text-yellow-900">
              2
            </span>
            "카카오페이로 결제" 버튼 클릭 → 카카오페이에서 3,900원 결제
          </li>
          <li className="flex items-start gap-2.5">
            <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-yellow-400 text-[11px] font-black text-yellow-900">
              3
            </span>
            결제 완료 후 돌아와서 "신청 완료" 버튼 클릭
          </li>
          <li className="flex items-start gap-2.5">
            <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-yellow-400 text-[11px] font-black text-yellow-900">
              4
            </span>
            입금 확인 후 5~10분 이내 코드 문자 발송
          </li>
        </ol>
      </section>

      {/* 입력 폼 */}
      <section className="rounded-2xl border border-ink/10 bg-white p-6 shadow-panel">
        <form onSubmit={onSubmit} className="space-y-4" noValidate>
          <div>
            <label htmlFor="kp-name" className="mb-1.5 block text-sm font-bold text-ink">
              이름 <span className="text-danger">*</span>
              <span className="ml-1 text-xs font-normal text-ink/48">(카카오페이 결제자 이름)</span>
            </label>
            <input
              id="kp-name"
              type="text"
              autoComplete="name"
              value={depositorName}
              onChange={(e) => setDepositorName(e.target.value)}
              placeholder="홍길동"
              maxLength={30}
              required
              className="w-full rounded-xl border border-ink/16 bg-paper px-4 py-3 text-sm text-ink placeholder-ink/36 outline-none transition focus:border-sage focus:ring-2 focus:ring-sage/20"
            />
          </div>
          <div>
            <label htmlFor="kp-phone" className="mb-1.5 block text-sm font-bold text-ink">
              코드 받을 휴대폰번호 <span className="text-danger">*</span>
            </label>
            <input
              id="kp-phone"
              type="tel"
              autoComplete="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value.replace(/[^0-9-]/g, ""))}
              placeholder="01012345678"
              maxLength={13}
              required
              className="w-full rounded-xl border border-ink/16 bg-paper px-4 py-3 text-sm text-ink placeholder-ink/36 outline-none transition focus:border-sage focus:ring-2 focus:ring-sage/20"
            />
          </div>

          {error ? (
            <p role="alert" className="rounded-lg bg-danger/8 px-4 py-2 text-sm text-danger">
              {error}
            </p>
          ) : null}

          {/* 카카오페이 결제 버튼 */}
          <a
            href={kakaoLink}
            target="_blank"
            rel="noopener noreferrer"
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-yellow-400 px-6 py-3.5 text-sm font-black text-yellow-900 shadow-md transition hover:bg-yellow-300"
          >
            💛 카카오페이로 결제하기 (3,900원)
            <ArrowRight className="h-4 w-4" />
          </a>

          <div className="relative flex items-center gap-3">
            <div className="h-px flex-1 bg-ink/10" />
            <span className="text-xs text-ink/36">결제 완료 후</span>
            <div className="h-px flex-1 bg-ink/10" />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-ink px-6 py-3.5 text-sm font-black text-ink transition hover:bg-ink hover:text-paper disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isLoading ? "신청 중…" : "✅ 결제했어요 — 신청 완료"}
          </button>
        </form>
      </section>
    </div>
  );
}

/* ── 계좌이체 섹션 ── */
function BankSection({
  phone,
  setPhone,
  depositorName,
  setDepositorName,
  error,
  isLoading,
  onSubmit,
  copied,
  onCopy,
}: SectionProps & { copied: boolean; onCopy: () => void }) {
  return (
    <div className="space-y-4">
      <section className="rounded-2xl border border-ink/10 bg-white p-6 shadow-panel">
        <div className="mb-4 flex items-center gap-2">
          <CreditCard aria-hidden="true" className="h-5 w-5 text-sage" />
          <h2 className="text-base font-black text-ink">계좌 이체 안내</h2>
        </div>
        <div className="space-y-3 rounded-xl bg-paper px-5 py-4 text-sm">
          <div className="flex justify-between">
            <span className="text-ink/56">은행</span>
            <span className="font-bold text-ink">{BANK_NAME}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-ink/56">계좌번호</span>
            <div className="flex items-center gap-2">
              <span className="font-bold text-ink">{ACCOUNT_NUMBER}</span>
              <button
                type="button"
                onClick={onCopy}
                className="inline-flex items-center gap-1 rounded-full border border-ink/10 bg-white px-2 py-1 text-xs font-bold text-ink/64 transition hover:border-sage/40 hover:text-sage"
              >
                {copied ? (
                  <>
                    <CheckCircle2 className="h-3 w-3 text-sage" />
                    복사됨
                  </>
                ) : (
                  <>
                    <Copy className="h-3 w-3" />
                    복사
                  </>
                )}
              </button>
            </div>
          </div>
          <div className="flex justify-between">
            <span className="text-ink/56">예금주</span>
            <span className="font-bold text-ink">{ACCOUNT_HOLDER}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-ink/56">입금 금액</span>
            <span className="font-black text-sage">{PRICE}원</span>
          </div>
        </div>
        <p className="mt-3 rounded-lg bg-amber-50 px-4 py-2 text-xs text-amber-700">
          ⚠️ 아래에 입력하는 <strong>이름과 동일한 입금자명</strong>으로 이체해 주세요.
        </p>
      </section>

      <section className="rounded-2xl border border-ink/10 bg-white p-6 shadow-panel">
        <h2 className="mb-4 text-base font-black text-ink">입금 완료 후 아래 정보를 입력해 주세요</h2>
        <form onSubmit={onSubmit} className="space-y-4" noValidate>
          <div>
            <label htmlFor="bank-name" className="mb-1.5 block text-sm font-bold text-ink">
              입금자명 <span className="text-danger">*</span>
            </label>
            <input
              id="bank-name"
              type="text"
              autoComplete="name"
              value={depositorName}
              onChange={(e) => setDepositorName(e.target.value)}
              placeholder="통장에 표시되는 이름"
              maxLength={30}
              required
              className="w-full rounded-xl border border-ink/16 bg-paper px-4 py-3 text-sm text-ink placeholder-ink/36 outline-none transition focus:border-sage focus:ring-2 focus:ring-sage/20"
            />
          </div>
          <div>
            <label htmlFor="bank-phone" className="mb-1.5 block text-sm font-bold text-ink">
              코드 받을 휴대폰번호 <span className="text-danger">*</span>
            </label>
            <input
              id="bank-phone"
              type="tel"
              autoComplete="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value.replace(/[^0-9-]/g, ""))}
              placeholder="01012345678"
              maxLength={13}
              required
              className="w-full rounded-xl border border-ink/16 bg-paper px-4 py-3 text-sm text-ink placeholder-ink/36 outline-none transition focus:border-sage focus:ring-2 focus:ring-sage/20"
            />
            <p className="mt-1 text-xs text-ink/48">입금 확인 후 이 번호로 6자리 분석 코드를 보내드립니다</p>
          </div>

          {error ? (
            <p role="alert" className="rounded-lg bg-danger/8 px-4 py-2 text-sm text-danger">
              {error}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={isLoading}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-ink px-6 py-3.5 text-sm font-black text-paper transition hover:bg-ink/85 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isLoading ? "신청 중…" : "입금 신청하기"}
          </button>
        </form>
      </section>
    </div>
  );
}

/* ── 완료 화면 ── */
function SuccessView({ method }: { method: PayMethod }) {
  return (
    <div className="rounded-2xl border border-sage/20 bg-white p-8 text-center shadow-panel">
      <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-sage/12">
        <CheckCircle2 aria-hidden="true" className="h-8 w-8 text-sage" />
      </div>
      <h1 className="text-2xl font-black text-ink">
        {method === "kakaopay" ? "결제 신청 완료!" : "입금 신청 완료!"}
      </h1>
      <p className="mt-3 text-sm leading-7 text-ink/64">
        {method === "kakaopay"
          ? "카카오페이 결제 확인 후 보통 "
          : "입금 확인 후 보통 "}
        <strong className="text-ink">5~10분 이내</strong>에
        <br />
        입력하신 번호로 <strong className="text-ink">6자리 분석 코드</strong>를 보내드립니다.
      </p>
      <p className="mt-2 rounded-lg bg-amber-50 px-4 py-2 text-xs text-amber-700">
        {method === "kakaopay"
          ? "카카오페이 결제를 아직 안 하셨다면 돌아가서 결제해 주세요."
          : "입금자명이 다르면 확인이 지연될 수 있습니다."}
      </p>
      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
        <Link
          href="/upload"
          className="inline-flex items-center justify-center rounded-xl bg-ink px-6 py-3 text-sm font-black text-paper transition hover:bg-ink/85"
        >
          코드 받은 후 분석하러 가기
        </Link>
        <Link
          href="/"
          className="inline-flex items-center justify-center rounded-xl border border-ink/10 bg-white px-6 py-3 text-sm font-bold text-ink transition hover:border-sage/40 hover:text-sage"
        >
          홈으로
        </Link>
      </div>
    </div>
  );
}


export default function PaymentPage() {
  const [depositorName, setDepositorName] = useState("");
  const [phone, setPhone] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");

    const cleanPhone = phone.replace(/-/g, "");
    if (depositorName.trim().length < 1) {
      setError("입금자명을 입력해 주세요.");
      return;
    }
    if (!/^[0-9]{10,11}$/.test(cleanPhone)) {
      setError("올바른 휴대폰번호를 입력해 주세요. (숫자만, 10~11자리)");
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch("/api/payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ depositorName: depositorName.trim(), phone: cleanPhone }),
      });
      const data = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string };
      if (!res.ok || !data.ok) {
        setError(data.error ?? "신청 중 오류가 발생했습니다. 다시 시도해 주세요.");
        return;
      }
      setSubmitted(true);
    } catch {
      setError("네트워크 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.");
    } finally {
      setIsLoading(false);
    }
  }

  function handleCopy() {
    navigator.clipboard.writeText(ACCOUNT_NUMBER.replace(/\s/g, "")).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="min-h-screen">
      <header className="border-b border-ink/10 bg-paper/84 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4 sm:px-6 lg:px-8">
          <Link className="text-lg font-black text-ink" href="/">
            내편계약서
          </Link>
          <Link
            className="inline-flex items-center gap-2 rounded-full border border-ink/10 bg-white px-3 py-2 text-sm font-bold text-ink transition hover:border-sage/40 hover:text-sage"
            href="/"
          >
            <ArrowLeft aria-hidden="true" className="h-4 w-4" />
            홈
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-xl px-5 py-10 sm:px-6">
        {submitted ? (
          <SuccessView />
        ) : (
          <>
            {/* 가격 배너 */}
            <div className="mb-6 rounded-2xl border border-sage/20 bg-sage/8 px-6 py-5 text-center">
              <p className="text-sm font-bold text-sage">계약서 AI 분석 1회</p>
              <p className="mt-1 text-4xl font-black text-ink">
                {PRICE}
                <span className="text-xl">원</span>
              </p>
              <p className="mt-2 text-sm text-ink/56">변호사 상담비의 1/100 — 즉시 분석</p>
            </div>

            {/* 계좌 안내 */}
            <section className="mb-6 rounded-2xl border border-ink/10 bg-white p-6 shadow-panel">
              <div className="mb-4 flex items-center gap-2">
                <CreditCard aria-hidden="true" className="h-5 w-5 text-sage" />
                <h2 className="text-base font-black text-ink">계좌 이체 안내</h2>
              </div>
              <div className="space-y-3 rounded-xl bg-paper px-5 py-4 text-sm">
                <div className="flex justify-between">
                  <span className="text-ink/56">은행</span>
                  <span className="font-bold text-ink">{BANK_NAME}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-ink/56">계좌번호</span>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-ink">{ACCOUNT_NUMBER}</span>
                    <button
                      type="button"
                      onClick={handleCopy}
                      className="inline-flex items-center gap-1 rounded-full border border-ink/10 bg-white px-2 py-1 text-xs font-bold text-ink/64 transition hover:border-sage/40 hover:text-sage"
                    >
                      {copied ? (
                        <>
                          <CheckCircle2 className="h-3 w-3 text-sage" />
                          복사됨
                        </>
                      ) : (
                        <>
                          <Copy className="h-3 w-3" />
                          복사
                        </>
                      )}
                    </button>
                  </div>
                </div>
                <div className="flex justify-between">
                  <span className="text-ink/56">예금주</span>
                  <span className="font-bold text-ink">{ACCOUNT_HOLDER}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-ink/56">입금 금액</span>
                  <span className="font-black text-sage">{PRICE}원</span>
                </div>
              </div>
              <p className="mt-3 rounded-lg bg-amber-50 px-4 py-2 text-xs text-amber-700">
                ⚠️ 반드시 아래에 입력하는 <strong>이름과 동일한 입금자명</strong>으로 이체해 주세요.
              </p>
            </section>

            {/* 신청 폼 */}
            <section className="rounded-2xl border border-ink/10 bg-white p-6 shadow-panel">
              <h2 className="mb-4 text-base font-black text-ink">입금 완료 후 아래 정보를 입력해 주세요</h2>
              <form onSubmit={handleSubmit} className="space-y-4" noValidate>
                <div>
                  <label htmlFor="depositorName" className="mb-1.5 block text-sm font-bold text-ink">
                    입금자명 <span className="text-danger">*</span>
                  </label>
                  <input
                    id="depositorName"
                    type="text"
                    autoComplete="name"
                    value={depositorName}
                    onChange={(e) => setDepositorName(e.target.value)}
                    placeholder="통장에 표시되는 이름"
                    maxLength={30}
                    required
                    className="w-full rounded-xl border border-ink/16 bg-paper px-4 py-3 text-sm text-ink placeholder-ink/36 outline-none transition focus:border-sage focus:ring-2 focus:ring-sage/20"
                  />
                </div>
                <div>
                  <label htmlFor="phone" className="mb-1.5 block text-sm font-bold text-ink">
                    코드 받을 휴대폰번호 <span className="text-danger">*</span>
                  </label>
                  <input
                    id="phone"
                    type="tel"
                    autoComplete="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/[^0-9-]/g, ""))}
                    placeholder="01012345678"
                    maxLength={13}
                    required
                    className="w-full rounded-xl border border-ink/16 bg-paper px-4 py-3 text-sm text-ink placeholder-ink/36 outline-none transition focus:border-sage focus:ring-2 focus:ring-sage/20"
                  />
                  <p className="mt-1 text-xs text-ink/48">입금 확인 후 이 번호로 6자리 분석 코드를 보내드립니다</p>
                </div>

                {error ? (
                  <p role="alert" className="rounded-lg bg-danger/8 px-4 py-2 text-sm text-danger">
                    {error}
                  </p>
                ) : null}

                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-ink px-6 py-3.5 text-sm font-black text-paper transition hover:bg-ink/85 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isLoading ? "신청 중…" : "입금 신청하기"}
                </button>
              </form>
            </section>

            <p className="mt-6 text-center text-xs text-ink/40">
              입금 확인 후 보통 5~10분 이내 코드 발송 · 문의:{" "}
              <a href="mailto:support@my-side-contract.vercel.app" className="underline hover:text-ink/64">
                이메일
              </a>
            </p>
          </>
        )}
      </main>
    </div>
  );
}

function SuccessView() {
  return (
    <div className="rounded-2xl border border-sage/20 bg-white p-8 text-center shadow-panel">
      <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-sage/12">
        <CheckCircle2 aria-hidden="true" className="h-8 w-8 text-sage" />
      </div>
      <h1 className="text-2xl font-black text-ink">입금 신청 완료!</h1>
      <p className="mt-3 text-sm leading-7 text-ink/64">
        입금 확인 후 보통 <strong className="text-ink">5~10분 이내</strong>에
        <br />
        입력하신 번호로 <strong className="text-ink">6자리 분석 코드</strong>를 보내드립니다.
      </p>
      <p className="mt-2 rounded-lg bg-amber-50 px-4 py-2 text-xs text-amber-700">
        입금자명이 다르면 확인이 지연될 수 있습니다.
        <br />
        오입금 문의는 이메일로 연락해 주세요.
      </p>
      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
        <Link
          href="/upload"
          className="inline-flex items-center justify-center rounded-xl bg-ink px-6 py-3 text-sm font-black text-paper transition hover:bg-ink/85"
        >
          코드 받은 후 분석하러 가기
        </Link>
        <Link
          href="/"
          className="inline-flex items-center justify-center rounded-xl border border-ink/10 bg-white px-6 py-3 text-sm font-bold text-ink transition hover:border-sage/40 hover:text-sage"
        >
          홈으로
        </Link>
      </div>
    </div>
  );
}
