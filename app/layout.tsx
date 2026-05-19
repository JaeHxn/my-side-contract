import type { Metadata } from "next";
import "./globals.css";
import { StructuredData } from "@/components/structured-data";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://my-side-contract.vercel.app";

export const metadata: Metadata = {
  title: {
    default: "내편계약서 | 계약서 AI 분석 서비스",
    template: "%s | 내편계약서",
  },
  description:
    "전월세·근로·인테리어·프리랜서 계약서의 불리한 조항, 불법 가능 문구, 빠진 보호 조항을 AI가 법령 근거와 함께 즉시 분석합니다. 변호사 없이 계약서를 점검하세요.",
  keywords: [
    "계약서 분석",
    "계약서 AI",
    "전월세 계약서",
    "근로 계약서",
    "계약서 검토",
    "불리한 조항",
    "계약서 점검",
    "주택임대차보호법",
    "근로기준법",
    "AI 법률 분석",
    "계약서 위험 조항",
    "인테리어 계약서",
    "프리랜서 계약서",
  ],
  metadataBase: new URL(siteUrl),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "내편계약서 | 계약서 AI 분석 서비스",
    description:
      "받은 계약서, AI가 법령 근거와 함께 불리한 조항을 즉시 찾아드립니다. 전월세·근로·인테리어·프리랜서 계약서 지원.",
    locale: "ko_KR",
    type: "website",
    url: siteUrl,
    siteName: "내편계약서",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "내편계약서 - 계약서 AI 분석 서비스",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "내편계약서 | 계약서 AI 분석 서비스",
    description:
      "받은 계약서, AI가 법령 근거와 함께 불리한 조항을 즉시 찾아드립니다.",
    images: ["/opengraph-image"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    google: "3OkjLzNTop9qBNQnk3wSmKDTymocYsa9X09ZMcN9Vz0",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <head>
        <StructuredData />
      </head>
      <body>{children}</body>
    </html>
  );
}
