import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "HangeulVision AI — Korean, Visualized.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          background: "linear-gradient(135deg, #0c8a7b 0%, #14a896 50%, #2fc3b0 100%)",
          padding: "60px 80px",
          fontFamily: "system-ui, -apple-system, sans-serif",
        }}
      >
        {/* Left column */}
        <div style={{ display: "flex", flexDirection: "column", flex: 1, justifyContent: "center", gap: "12px" }}>
          {/* Logo */}
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div
              style={{
                width: "48px",
                height: "48px",
                borderRadius: "12px",
                background: "rgba(255,255,255,0.25)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "28px",
                fontWeight: 700,
                color: "white",
              }}
            >
              ㅎ
            </div>
            <span style={{ fontSize: "20px", fontWeight: 600, color: "rgba(255,255,255,0.9)" }}>
              HangeulVision AI
            </span>
          </div>

          {/* Title */}
          <div style={{ display: "flex", flexDirection: "column", marginTop: "20px" }}>
            <span style={{ fontSize: "58px", fontWeight: 800, color: "white", lineHeight: 1.1 }}>
              Korean,
            </span>
            <span style={{ fontSize: "58px", fontWeight: 800, color: "white", lineHeight: 1.1 }}>
              Visualized.
            </span>
          </div>

          {/* Subtitle */}
          <div style={{ display: "flex", flexDirection: "column", gap: "4px", marginTop: "12px" }}>
            <span style={{ fontSize: "20px", color: "rgba(255,255,255,0.85)" }}>
              AI concept images · Hanja decomposition
            </span>
            <span style={{ fontSize: "20px", color: "rgba(255,255,255,0.85)" }}>
              English mnemonics · Spaced repetition
            </span>
          </div>

          {/* Tags */}
          <div style={{ display: "flex", gap: "10px", marginTop: "20px" }}>
            {["TOPIK", "KIIP", "EPS"].map((t) => (
              <div
                key={t}
                style={{
                  padding: "6px 16px",
                  borderRadius: "16px",
                  background: "rgba(255,255,255,0.2)",
                  fontSize: "14px",
                  fontWeight: 600,
                  color: "white",
                }}
              >
                {t}
              </div>
            ))}
          </div>
        </div>

        {/* Right: word card */}
        <div
          style={{
            width: "400px",
            display: "flex",
            flexDirection: "column",
            background: "white",
            borderRadius: "24px",
            padding: "32px",
            gap: "16px",
            boxShadow: "0 20px 60px rgba(0,0,0,0.15)",
          }}
        >
          {/* Chip */}
          <div
            style={{
              display: "flex",
              padding: "4px 14px",
              borderRadius: "14px",
              background: "#effdfb",
              fontSize: "12px",
              fontWeight: 600,
              color: "#0c8a7b",
              alignSelf: "flex-start",
            }}
          >
            TOPIK I · Verb
          </div>

          {/* Korean word */}
          <span style={{ fontSize: "48px", fontWeight: 800, color: "#0b1220" }}>포기하다</span>
          <span style={{ fontSize: "15px", color: "#6b7280" }}>pogihada · to give up</span>

          {/* Hanja box */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              padding: "16px",
              borderRadius: "16px",
              background: "#effdfb",
              border: "1px solid #c8f7f0",
            }}
          >
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
              <span style={{ fontSize: "32px", fontWeight: 700, color: "#0c8a7b" }}>抛</span>
              <span style={{ fontSize: "10px", color: "#6b7280" }}>throw · 포</span>
            </div>
            <span style={{ fontSize: "20px", color: "#d1d5db" }}>+</span>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
              <span style={{ fontSize: "32px", fontWeight: 700, color: "#0c8a7b" }}>棄</span>
              <span style={{ fontSize: "10px", color: "#6b7280" }}>discard · 기</span>
            </div>
            <span style={{ fontSize: "18px", color: "#d1d5db" }}>→</span>
            <span style={{ fontSize: "22px", fontWeight: 700, color: "#0c8a7b" }}>포기</span>
          </div>

          {/* Mnemonic */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              padding: "12px",
              borderRadius: "12px",
              background: "#fffbeb",
              gap: "2px",
            }}
          >
            <span style={{ fontSize: "11px", fontWeight: 600, color: "#92400e" }}>Mnemonic</span>
            <span style={{ fontSize: "13px", color: "#78350f" }}>
              PO-GI → &ldquo;POst it and GO!&rdquo;
            </span>
          </div>

          {/* Example */}
          <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
            <span style={{ fontSize: "14px", color: "#374151" }}>꿈을 포기하지 마세요.</span>
            <span style={{ fontSize: "12px", color: "#9ca3af" }}>Don&apos;t give up on your dreams.</span>
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
