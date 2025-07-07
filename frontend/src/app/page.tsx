"use client";

export default function Home() {
  return (
    <div style={{ 
      minHeight: "100vh", 
      background: `
        radial-gradient(circle at 40% 90%, rgba(255, 69, 0, 0.8) 0%, transparent 60%),
        radial-gradient(circle at 75% 85%, rgba(239, 68, 68, 0.6) 0%, transparent 50%),
        radial-gradient(circle at 60% 100%, rgba(59, 130, 246, 0.4) 0%, transparent 70%),
        #f8fafc
      `, 
      color: "#222" 
    }}>

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
