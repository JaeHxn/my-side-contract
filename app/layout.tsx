import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "내편계약서 | 계약서 AI 분석",
  description: "전월세 계약서를 사인하기 전에 불리한 조항, 빠진 조항, 법령 근거를 빠르게 확인합니다.",
  metadataBase: new URL("https://my-side-contract.local"),
  openGraph: {
    title: "내편계약서 | 계약서 AI 분석",
    description: "받은 계약서를 법령 근거와 함께 쉬운 말로 점검합니다.",
    locale: "ko_KR",
    type: "website"
  }
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
