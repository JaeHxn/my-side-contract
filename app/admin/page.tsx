import Link from "next/link";
import { cookies } from "next/headers";
import { AlertTriangle, ArrowLeft, KeyRound, ShieldCheck } from "lucide-react";
import {
  ADMIN_SESSION_COOKIE,
  isAdminAuthConfigured,
  verifyAdminSessionToken
} from "@/src/lib/server/admin-auth";
import { AccessCodeIssuer } from "./AccessCodeIssuer";
import { AdminLoginForm } from "./AdminLoginForm";
import { AdminLogoutButton } from "./AdminLogoutButton";
import PaymentRequestList from "./PaymentRequestList";

export const metadata = {
  title: "관리자 코드 발급 | 내편계약서"
};

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const cookieStore = await cookies();
  const isConfigured = isAdminAuthConfigured();
  const isAuthenticated = isConfigured && verifyAdminSessionToken(cookieStore.get(ADMIN_SESSION_COOKIE)?.value);

  return (
    <div className="min-h-screen">
      <header className="border-b border-ink/10 bg-paper/84 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4 sm:px-6 lg:px-8">
          <Link className="text-lg font-black text-ink" href="/">
            내편계약서
          </Link>
          <div className="flex items-center gap-2">
            {isAuthenticated ? <AdminLogoutButton /> : null}
            <Link
              className="inline-flex items-center gap-2 rounded-full border border-ink/10 bg-white px-3 py-2 text-sm font-bold text-ink transition hover:border-sage/40 hover:text-sage"
              href="/"
            >
              <ArrowLeft aria-hidden="true" className="h-4 w-4" />
              홈
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-5 py-6 sm:px-6 lg:px-8 lg:py-10">
        <section className="mb-6 rounded-lg border border-ink/10 bg-white p-5 shadow-panel sm:p-7">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <p className="mb-3 inline-flex items-center gap-2 rounded-full border border-sage/20 bg-sage/10 px-3 py-1 text-sm font-black text-sage">
                <ShieldCheck aria-hidden="true" className="h-4 w-4" />
                관리자 전용
              </p>
              <h1 className="break-keep text-3xl font-black leading-tight text-ink sm:text-4xl">
                계약 분석 접근 코드를 발급합니다
              </h1>
              <p className="mt-4 text-base leading-7 text-ink/64">
                구매자 확인 정보를 남기고 6자리 접근 코드를 생성하세요. 발급된 코드는 만료일과 함께 바로 표시됩니다.
              </p>
            </div>
            <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-ink text-paper shadow-lg shadow-ink/15">
              <KeyRound aria-hidden="true" className="h-7 w-7" />
            </div>
          </div>
        </section>

        {!isConfigured ? (
          <section className="rounded-lg border border-danger/20 bg-danger/8 p-5 shadow-panel sm:p-7">
            <div className="flex gap-3">
              <AlertTriangle aria-hidden="true" className="mt-1 h-5 w-5 shrink-0 text-danger" />
              <div>
                <h2 className="text-xl font-black text-ink">관리자 접근 보호 설정이 필요합니다</h2>
                <p className="mt-2 text-sm leading-6 text-ink/68">
                  `.env.local`에 `ADMIN_ACCESS_TOKEN`을 설정해야 관리자 페이지와 관리자 API가 열립니다.
                  현재는 코드 발급 화면을 표시하지 않습니다.
                </p>
              </div>
            </div>
          </section>
        ) : isAuthenticated ? (
          <div className="space-y-6">
            <PaymentRequestList />
            <AccessCodeIssuer />
          </div>
        ) : (
          <AdminLoginForm />
        )}
      </main>
    </div>
  );
}
