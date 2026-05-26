import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "페이지를 찾을 수 없습니다 | 내편계약서",
  robots: { index: false, follow: true },
};

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 px-5 text-center">
      <p className="text-5xl font-black text-ink/20">404</p>
      <h1 className="text-2xl font-black text-ink">페이지를 찾을 수 없습니다</h1>
      <p className="text-base text-ink/65">
        요청하신 페이지가 존재하지 않거나 이동되었습니다.
      </p>
      <Link
        href="/"
        className="rounded-lg bg-ink px-5 py-3 text-sm font-bold text-white transition hover:bg-sage"
      >
        홈으로 돌아가기
      </Link>
    </main>
  );
}
