"use client";

import { useState, FormEvent } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, CheckCircle2, Copy, CreditCard } from "lucide-react";

const KAKAOPAY_LINK = process.env.NEXT_PUBLIC_KAKAOPAY_LINK ?? "https://link.kakaopay.com/__/WRK6HoT";
const BANK_NAME = process.env.NEXT_PUBLIC_PAYMENT_BANK_NAME ?? "카카오뱅크";
const ACCOUNT_NUMBER = process.env.NEXT_PUBLIC_PAYMENT_ACCOUNT ?? "02003210718";
const ACCOUNT_HOLDER = process.env.NEXT_PUBLIC_PAYMENT_HOLDER ?? "장재훈";
const PRICE = "3,900";
const ORIGINAL_PRICE = "8,900";
const DISCOUNT_RATE = "56%";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type PayMethod = "kakaopay" | "bank";

function KakaoPaySection() {
  return (
    <div className="flex flex-col items-center gap-5 py-4">
      {/* 카카오페이 브랜드 영역 */}
      <div className="flex w-full items-center gap-4 rounded-2xl bg-[#FEE500] px-6 py-5">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-black/10">
          <span className="text-xl font-black text-black">K</span>
        </div>
        <div className="min-w-0">
          <p className="text-sm font-black text-black">카카오페이</p>
          <p className="mt-0.5 text-xs text-black/60">터치 한 번으로 간편 송금</p>
        </div>
        <div className="ml-auto text-right">
          <p className="text-xs text-black/50 line-through">{ORIGINAL_PRICE}원</p>
          <p className="text-lg font-black text-black">{PRICE}원</p>
        </div>
      </div>

      <a
        href={KAKAOPAY_LINK}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[#FEE500] px-8 py-4 text-base font-black text-black shadow-panel transition hover:brightness-95 active:scale-95"
      >
        카카오페이로 {PRICE}원 결제하기
        <ArrowRight className="h-4 w-4" />
      </a>

      <p className="text-center text-xs text-ink/50">
        결제 후 아래 양식을 작성해 제출해 주세요.
        <br />
        이메일로 이용 코드를 보내드립니다.
      </p>
    </div>
  );
}

function BankSection({
  copied,
  onCopy,
}: {
  copied: boolean;
  onCopy: () => void;
}) {
  return (
    <div className="flex flex-col gap-4 py-4">
      {/* 계좌 정보 카드 */}
      <div className="rounded-2xl border border-ink/10 bg-white p-5 shadow-sm">
        <p className="mb-3 text-xs font-black uppercase tracking-widest text-ink/30">
          계좌이체 정보
        </p>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-semibold text-ink/50">{BANK_NAME}</p>
            <p className="mt-1 text-2xl font-black tracking-widest text-ink">
              {ACCOUNT_NUMBER}
            </p>
            <p className="mt-1 text-xs text-ink/50">예금주 &nbsp;<strong className="text-ink/70">{ACCOUNT_HOLDER}</strong></p>
          </div>
          <button
            onClick={onCopy}
            className="shrink-0 flex items-center gap-1.5 rounded-xl border border-ink/10 bg-paper px-3 py-2 text-xs font-bold text-ink transition hover:bg-sage/10 active:scale-95"
          >
            <Copy className="h-3.5 w-3.5" />
            {copied ? "✔︎ 복사됨" : "복사"}
          </button>
        </div>
      </div>

      {/* 이체 금액 배지 */}
      <div className="flex items-center justify-between rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
        <div>
          <p className="text-xs font-semibold text-amber-700">이체 금액</p>
          <p className="mt-0.5 text-xs text-amber-600/70 line-through">{ORIGINAL_PRICE}원</p>
        </div>
        <p className="text-2xl font-black text-amber-900">{PRICE}원</p>
      </div>

      <p className="text-center text-xs text-ink/50">
        입금자명을 아래에 기재 → 입금 확인 후 이메일로 코드 발송
        <br />
        <span className="font-semibold text-ink/60">최대 1시간 이내</span>
      </p>
    </div>
  );
}

function SuccessView() {
  return (
    <div className="flex flex-col items-center gap-6 py-12 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-sage/10">
        <CheckCircle2 className="h-8 w-8 text-sage" />
      </div>
      <div>
        <h2 className="text-xl font-bold text-ink">신청이 완료되었습니다!</h2>
        <p className="mt-2 text-sm text-ink/60">
          입금 확인 후 최대 1시간 이내에
          <br />
          입력하신 이메일로 이용 코드를 발송합니다.
        </p>
      </div>
      <p className="rounded-xl bg-sage/5 px-5 py-3 text-xs text-ink/50">
        스팸함도 확인해 주세요
      </p>
      <Link
        href="/"
        className="inline-flex items-center justify-center rounded-xl border border-ink/10 bg-white px-6 py-3 text-sm font-bold text-ink transition hover:border-sage/40 hover:text-sage"
      >
        홈으로
      </Link>
    </div>
  );
}

export default function PaymentPage() {
  const hasKakaoPay = Boolean(KAKAOPAY_LINK);
  const [method, setMethod] = useState<PayMethod>(
    hasKakaoPay ? "kakaopay" : "bank"
  );
  const [depositorName, setDepositorName] = useState("");
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!depositorName.trim()) {
      setError("입금자명을 입력해 주세요.");
      return;
    }
    if (!EMAIL_RE.test(email.trim())) {
      setError("올바른 이메일 주소를 입력해 주세요.");
      return;
    }
    setIsLoading(true);
    setError("");
    try {
      const res = await fetch("/api/payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          depositorName: depositorName.trim(),
          email: email.trim().toLowerCase(),
          method,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error((data as { error?: string })?.error ?? "신청 중 오류가 발생했습니다.");
      }
      setSubmitted(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  }

  function copyAccount() {
    navigator.clipboard.writeText(ACCOUNT_NUMBER).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  if (submitted) return <SuccessView />;

  return (
    <main className="min-h-screen bg-paper px-4 py-12">
      <div className="mx-auto max-w-lg">
        {/* 뒤로가기 */}
        <Link
          href="/"
          className="mb-8 inline-flex items-center gap-1.5 text-sm text-ink/50 transition hover:text-ink"
        >
          <ArrowLeft className="h-4 w-4" />
          홈으로
        </Link>

        {/* 스텝 인디케이터 */}
        <div className="mb-8 flex items-center gap-0">
          {[
            { n: "1", label: "결제" },
            { n: "2", label: "정보 입력" },
            { n: "3", label: "코드 수신" },
          ].map((step, i) => (
            <div key={step.n} className="flex items-center">
              <div className={`flex items-center gap-1.5 ${i === 0 ? "text-ink" : "text-ink/35"}`}>
                <span className={`flex h-5 w-5 items-center justify-center rounded-full text-xs font-black ${i === 0 ? "bg-sage text-white" : "bg-ink/10 text-ink/40"}`}>
                  {step.n}
                </span>
                <span className="text-xs font-semibold">{step.label}</span>
              </div>
              {i < 2 && <span className="mx-2 text-ink/20">›</span>}
            </div>
          ))}
        </div>

        {/* 헤더 */}
        <div className="mb-8">
          <div className="mb-3 flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sage/10">
              <CreditCard className="h-4 w-4 text-sage" />
            </div>
            <span className="text-xs font-semibold uppercase tracking-wider text-sage">
              결제
            </span>
          </div>
          <h1 className="text-3xl font-black text-ink">이용권 구매</h1>
          <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1.5">
            <span className="inline-flex items-center rounded-full bg-rose-50 px-2.5 py-0.5 text-xs font-black text-rose-500 border border-rose-100">
              {DISCOUNT_RATE} 할인 · 출시 특가
            </span>
            <span className="text-sm text-ink/40 line-through">{ORIGINAL_PRICE}원</span>
            <span className="text-2xl font-black text-ink">{PRICE}원</span>
          </div>
          <p className="mt-1 text-sm text-ink/50">계약서 AI 분석 1회 이용권</p>
        </div>

        {/* 결제 방법 탭 */}
        {hasKakaoPay && (
          <div className="mb-6 flex rounded-2xl border border-ink/10 bg-white p-1 shadow-sm">
            {(["kakaopay", "bank"] as PayMethod[]).map((m) => (
              <button
                key={m}
                onClick={() => setMethod(m)}
                className={`flex-1 rounded-xl py-2.5 text-sm font-bold transition ${
                  method === m
                    ? "bg-ink text-white shadow"
                    : "text-ink/50 hover:text-ink"
                }`}
              >
                {m === "kakaopay" ? "카카오페이" : "계좌이체"}
              </button>
            ))}
          </div>
        )}

        {/* 결제 수단 섹션 */}
        <div className="mb-6 rounded-3xl border border-ink/10 bg-white px-6 py-4 shadow-panel">
          {method === "kakaopay" ? (
            <KakaoPaySection />
          ) : (
            <BankSection copied={copied} onCopy={copyAccount} />
          )}
        </div>

        {/* 신청 양식 */}
        <form
          onSubmit={handleSubmit}
          className="rounded-3xl border border-ink/10 bg-white px-6 py-6 shadow-panel"
        >
          <h2 className="mb-1 text-base font-bold text-ink">신청 정보 입력</h2>
          <p className="mb-5 text-xs text-ink/40">
            이용 코드를 받으실 이메일 주소를 정확히 입력해 주세요.
          </p>

          <div className="flex flex-col gap-4">
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-ink/70">
                입금자명 <span className="text-danger">*</span>
              </label>
              <input
                type="text"
                value={depositorName}
                onChange={(e) => setDepositorName(e.target.value)}
                placeholder="홍길동"
                className="w-full rounded-xl border border-ink/15 bg-paper px-4 py-3 text-sm text-ink placeholder-ink/30 outline-none transition focus:border-sage focus:ring-2 focus:ring-sage/20"
                required
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-ink/70">
                이메일 주소 <span className="text-danger">*</span>
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="example@gmail.com"
                className="w-full rounded-xl border border-ink/15 bg-paper px-4 py-3 text-sm text-ink placeholder-ink/30 outline-none transition focus:border-sage focus:ring-2 focus:ring-sage/20"
                required
              />
              <p className="mt-1.5 text-xs text-ink/40">
                입금 확인 후 이 주소로 이용 코드를 발송합니다.
              </p>
            </div>
          </div>

          {error && (
            <p className="mt-3 rounded-xl bg-red-50 px-4 py-2 text-sm text-danger">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-ink py-4 text-base font-bold text-white shadow-panel transition hover:bg-ink/90 active:scale-[0.98] disabled:opacity-60"
          >
            {isLoading ? (
              "처리 중..."
            ) : (
              <>
                결제 신청하기
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>

          <p className="mt-3 text-center text-xs text-ink/40">
            신청 후 입금 확인까지 최대 1시간 소요됩니다
          </p>
        </form>

        {/* 안내사항 */}
        <div className="mt-6 rounded-2xl bg-sage/5 px-5 py-4 text-xs text-ink/50">
          <p className="font-semibold text-ink/70">이용 안내</p>
          <ul className="mt-2 space-y-1">
            <li>• 이용 코드 1개 = 계약서 분석 1회</li>
            <li>• 코드 발급 후 30일 이내 사용 가능</li>
            <li>• 입금 확인 시 이메일로 자동 발송됩니다</li>
            <li>• 스팸함도 확인해 주세요</li>
          </ul>
        </div>
      </div>
    </main>
  );
}
