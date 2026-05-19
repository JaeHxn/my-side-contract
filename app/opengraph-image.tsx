import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "내편계약서 - 계약서 AI 분석 서비스";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: "linear-gradient(135deg, #1a1f1b 0%, #2a3b2c 60%, #1e2a1f 100%)",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          justifyContent: "center",
          padding: "72px 80px",
          fontFamily: "sans-serif",
        }}
      >
        {/* 배지 */}
        <div
          style={{
            background: "rgba(107, 143, 113, 0.18)",
            borderRadius: "999px",
            padding: "8px 22px",
            color: "#8fb894",
            fontSize: "20px",
            fontWeight: "700",
            marginBottom: "28px",
            border: "1px solid rgba(107,143,113,0.35)",
            display: "flex",
          }}
        >
          전월세 · 근로 · 인테리어 · 프리랜서
        </div>

        {/* 메인 타이틀 */}
        <div
          style={{
            color: "#f5f0e8",
            fontSize: "80px",
            fontWeight: "900",
            lineHeight: "1.08",
            marginBottom: "20px",
            letterSpacing: "-2px",
          }}
        >
          내편계약서
        </div>

        {/* 서브 타이틀 */}
        <div
          style={{
            color: "rgba(245,240,232,0.62)",
            fontSize: "30px",
            fontWeight: "600",
            lineHeight: "1.5",
            maxWidth: "820px",
            display: "flex",
          }}
        >
          계약서의 불리한 조항을 AI가 법령 근거와 함께 즉시 분석합니다
        </div>

        {/* 위험 등급 배지들 */}
        <div
          style={{
            marginTop: "52px",
            display: "flex",
            gap: "14px",
          }}
        >
          {[
            { label: "🔴 위험 조항", bg: "rgba(220,60,60,0.18)", border: "rgba(220,60,60,0.35)" },
            { label: "🟡 불리한 조항", bg: "rgba(200,160,40,0.18)", border: "rgba(200,160,40,0.35)" },
            { label: "⚠️ 빠진 조항", bg: "rgba(245,240,232,0.1)", border: "rgba(245,240,232,0.2)" },
            { label: "🟢 정상 조항", bg: "rgba(60,160,80,0.18)", border: "rgba(60,160,80,0.35)" },
          ].map((item) => (
            <div
              key={item.label}
              style={{
                background: item.bg,
                border: `1px solid ${item.border}`,
                borderRadius: "10px",
                padding: "10px 18px",
                color: "rgba(245,240,232,0.85)",
                fontSize: "19px",
                fontWeight: "700",
                display: "flex",
              }}
            >
              {item.label}
            </div>
          ))}
        </div>

        {/* 법령 근거 텍스트 */}
        <div
          style={{
            marginTop: "28px",
            color: "rgba(245,240,232,0.38)",
            fontSize: "17px",
            fontWeight: "500",
            display: "flex",
          }}
        >
          주택임대차보호법 · 근로기준법 · 저작권법 · 민법 기준 분석
        </div>
      </div>
    ),
    { ...size }
  );
}
