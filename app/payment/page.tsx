"use client";

import { useState, FormEvent } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, CheckCircle2, Copy, CreditCard } from "lucide-react";

const KAKAOPAY_LINK = process.env.NEXT_PUBLIC_KAKAOPAY_LINK ?? "";
const BANK_NAME = process.env.NEXT_PUBLIC_PAYMENT_BANK_NAME ?? "카카오뱅크";
const ACCOUNT_NUMBER = process.env.NEXT_PUBLIC_PAYMENT_ACCOUNT ?? "계좌번호 미설정";
const ACCOUNT_HOLDER = process.env.NEXT_PUBLIC_PAYMENT_HOLDER ?? "예금주 미설정";
const PRICE = "3,900";

type PayMethod = "kakaopay" | "bank";

function KakaoPaySection() {
  return (
    <div className="flex flex-col items-center gap-6 py-4">
      <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-yellow-400 shadow-lg">
        <span className="text-3xl font-black text-white">K</span>
      </div>
      <div className="text-center">
        <p className="text-lg font-bold text-ink">카카오페이로 간편 결제</p>
        <p className="mt-1 text-sm text-ink/60">링크 클릭 후 {PRICE}원 송금</p>
      </div>
      <a
        href={KAKAOPAY_LINK}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 rounded-2xl bg-yellow-400 px-8 py-4 text-base font-bold text-black shadow-panel transition hover:brightness-95 active:scale-95"
      >
        카카오페이로 결제하기
        <ArrowRight className="h-4 w-4" />
      </a>
      <p className="text-center text-xs text-ink/50">
        결제 완료 후 아래 양식을 작성해 제출해 주세요.
        <br />
        최대 1시간 이내 이용 코드를 발급해 드립니다.
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
      <div className="rounded-2xl border border-ink/10 bg-white p-5 shadow-sm">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-ink/40">
          계좌 정보
        </p>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-ink/60">{BANK_NAME}</p>
            <p className="mt-0.5 text-xl font-bold tracking-widest text-ink">
              {ACCOUNT_NUMBER}
            </p>
            <p className="mt-0.5 text-sm text-ink/60">예금주: {ACCOUNT_HOLDER}</p>
          </div>
          <button
            onClick={onCopy}
            className="flex items-center gap-1.5 rounded-xl border border-ink/10 bg-paper px-3 py-2 text-xs font-semibold text-ink transition hover:bg-sage/10"
          >
            <Copy className="h-3 w-3" />
            {copied ? "복사됨!" : "복사"}
          </button>
        </div>
      </div>
      <div className="rounded-xl bg-yellow-50 px-4 py-3 text-sm text-yellow-800">
        <strong>이체 금액:</strong> {PRICE}원<br />
        <span className="text-xs">이름 또는 연락처 끝 4자리를 메모란에 기입해 주세요.</span>
      </div>
      <p className="text-center text-xs text-ink/50">
        입금 확인 후 아래 양식을 작성해 제출해 주세요.
        <br />
        최대 1시간 이내 이용 코드를 발급해 드립니다.
      </p>
    </div>
  );
}

function SuccessView({ code }: { code?: string }) {
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
          이용 코드를 문자/이메일로 보내드립니다.
        </p>
      </div>
      {code && (
        <div className="rounded-2xl border-2 border-dashed border-sage/30 bg-sage/5 px-8 py-4">
          <p className="text-xs text-sage/70">이용 코드</p>
          <p className="mt-1 text-2xl font-black tracking-widest text-sage">{code}</p>
        </div>
      )}
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
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!name.trim() || !contact.trim()) {
      setError("이름과 연락처를 모두 입력해 주세요.");
      return;
    }
    setIsLoading(true);
    setError("");
    try {
      const res = await fetch("/api/payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), contact: contact.trim(), method }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error ?? "신청 중 오류가 발생했습니다.");
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
          <p className="mt-2 text-ink/60">
            계약서 AI 분석 1회 이용권 —{" "}
            <span className="font-bold text-ink">{PRICE}원</span>
          </p>
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
          <h2 className="mb-4 text-base font-bold text-ink">신청 정보 입력</h2>

          <div className="flex flex-col gap-4">
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-ink/70">
                이름 <span className="text-danger">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="홍길동"
                className="w-full rounded-xl border border-ink/15 bg-paper px-4 py-3 text-sm text-ink placeholder-ink/30 outline-none transition focus:border-sage focus:ring-2 focus:ring-sage/20"
                required
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-ink/70">
                연락처 <span className="text-danger">*</span>
              </label>
              <input
                type="text"
                value={contact}
                onChange={(e) => setContact(e.target.value)}
                placeholder="010-0000-0000 또는 이메일"
                className="w-full rounded-xl border border-ink/15 bg-paper px-4 py-3 text-sm text-ink placeholder-ink/30 outline-none transition focus:border-sage focus:ring-2 focus:ring-sage/20"
                required
              />
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
            <li>• 입금자명이 다를 경우 연락처로 확인 연락드립니다</li>
          </ul>
        </div>
      </div>
    </main>
  );
}
