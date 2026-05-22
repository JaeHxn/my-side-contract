import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "결제 안내 | 내편계약서",
  description:
    "3,900원으로 계약서 AI 분석을 시작하세요. 계좌이체 후 분석 코드가 발급됩니다.",
  robots: { index: false, follow: false },
  alternates: { canonical: "/payment" },
};

export default function PaymentLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
