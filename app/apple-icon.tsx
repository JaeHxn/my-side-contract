import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 180,
          height: 180,
          background: "#1a1a1a",
          borderRadius: 40,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "column",
          gap: 4,
        }}
      >
        <div style={{ color: "#6b9e7a", fontSize: 72, fontWeight: 900, lineHeight: 1 }}>
          내
        </div>
        <div style={{ color: "#ffffff", fontSize: 22, fontWeight: 800, letterSpacing: -0.5 }}>
          편계약서
        </div>
      </div>
    ),
    { ...size }
  );
}
