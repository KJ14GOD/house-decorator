"use client";

export default function Home() {
  return (
    <div style={{ minHeight: "100vh", background: "#fdfdfb", color: "#222" }}>

      {/* Main Content */}
      <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "flex-start", maxWidth: 800, margin: "0 auto", padding: "96px 32px 0 32px", minHeight: "80vh" }}>
        <h1 style={{ fontSize: 48, fontWeight: 700, lineHeight: 1.1, margin: 0 }}>
          Interior Design. Room Planning.<br />The AI Home Decor Sandbox.
        </h1>
        <p style={{ fontSize: 20, color: "#444", margin: "32px 0 0 0", maxWidth: 520 }}>
          Visualize, plan, and decorate your space with AI-powered tools. Instantly see how your room could look, experiment with layouts, and get expert suggestions—all from your browser.
        </p>
      </div>
    </div>
  );
}
