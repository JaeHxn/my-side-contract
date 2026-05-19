import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { UploadAnalyzer } from "@/components/upload-analyzer";

export const metadata: Metadata = {
  title: "계약서 분석하기",
  description:
    "전월세·근로·인테리어·프리랜서 계약서를 업로드하거나 붙여넣으면 AI가 법령 근거와 함께 불리한 조항을 즉시 분석합니다. PDF·사진 OCR 지원.",
  alternates: {
    canonical: "/upload",
  },
  openGraph: {
    title: "계약서 분석하기 | 내편계약서",
    description:
      "계약서를 업로드하면 AI가 법령 근거와 함께 불리한 조항을 즉시 찾아드립니다.",
  },
  robots: {
    index: false,
  },
};

export default function UploadPage() {
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
      <UploadAnalyzer />
    </div>
  );
}
