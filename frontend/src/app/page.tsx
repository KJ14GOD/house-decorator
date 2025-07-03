"use client";
import styles from "./page.module.css";
import Link from "next/link";

export default function Home() {
  return (
    <div style={{ minHeight: "100vh", background: "#fdfdfb", color: "#222" }}>
      {/* Navbar */}
      <nav style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "32px 48px 0 48px", fontFamily: 'TWKLausanne, sans-serif' }}>
        <div style={{ display: "flex", alignItems: "center", gap: 32 }}>
          <span style={{ fontWeight: 700, fontSize: 22 }}>Decorator</span>
          <Link href="/layout" style={{ textDecoration: "none", color: "#222", fontSize: 16 }}>Layout</Link>
        </div>
        <div style={{ display: "flex", gap: 16 }}>
          <button style={{ background: "none", border: "none", fontSize: 16, color: "#222", cursor: "pointer" }}>Sign in</button>
          <button style={{ background: "#222", color: "#fff", border: "none", borderRadius: 8, padding: "8px 20px", fontWeight: 600, fontSize: 16, cursor: "pointer" }}>Book a demo</button>
        </div>
      </nav>

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
