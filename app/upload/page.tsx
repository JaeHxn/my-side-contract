import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { UploadAnalyzer } from "@/components/upload-analyzer";

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
