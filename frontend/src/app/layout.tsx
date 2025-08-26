import "./globals.css";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { AuthProvider } from "@/context/AuthContext";
import NavbarWrapper from "@/components/NavbarWrapper";

const inter = Inter({ subsets: ["latin"] });


export const metadata: Metadata = {
  title: "Company | AI Home Decor",
  description: "Visualize, plan, and decorate your space with AI-powered tools.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        {/* Import TWKLausanne font if available */}
        <link rel="stylesheet" href="https://fonts.cdnfonts.com/css/twk-lausanne" />
      </head>
      <body
        style={{
          background: "#ffffff",
          color: "#000000",
          fontFamily: "Inter, system-ui, -apple-system, sans-serif",
          minHeight: "100vh",
          position: 'relative',
        }}
        className={inter.className}
      >
        <AuthProvider>
          <NavbarWrapper />
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}