import type { Metadata } from "next";
import "./globals.css";
import { StructuredData } from "@/components/structured-data";
import { SpeedInsights } from "@vercel/speed-insights/next";

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
    "계약서 위험 조항 찾기",
    "전월세 특약 조항 분석",
    "근로계약서 불법 조항",
    "계약갱신요구권",
    "위약예정금지",
    "포괄임금제",
    "무료 계약서 검토",
    "계약서 검토 비용",
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
  other: {
    "theme-color": "#1a1a1a",
    // 네이버 서치어드바이저 인증 코드 (등록 후 실제 값으로 교체)
    // "naver-site-verification": "YOUR_NAVER_CODE",
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
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="dns-prefetch" href="https://cdn.jsdelivr.net" />
        <link rel="dns-prefetch" href="https://www.law.go.kr" />
        <link rel="preconnect" href="https://cdn.jsdelivr.net" />
        <link
          rel="preload"
          as="style"
          href="https://cdn.jsdelivr.net/npm/pretendard@1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css"
        />
        <link
          rel="stylesheet"
          as="style"
          crossOrigin="anonymous"
          href="https://cdn.jsdelivr.net/npm/pretendard@1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css"
        />
        <StructuredData />
      </head>
      <body>
        {children}
        <SpeedInsights />
      </body>
    </html>
  );
}
