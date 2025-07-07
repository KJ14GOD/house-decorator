import "./globals.css";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { AuthProvider } from "@/context/AuthContext";
import Navbar from "@/components/Navbar";

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
          background: `
            radial-gradient(circle at 40% 90%, rgba(255, 69, 0, 0.8) 0%, transparent 60%),
            radial-gradient(circle at 75% 85%, rgba(239, 68, 68, 0.6) 0%, transparent 50%),
            radial-gradient(circle at 60% 100%, rgba(59, 130, 246, 0.4) 0%, transparent 70%),
            #f8fafc
          `,
          fontFamily: 'FamilyFont, FamilyFont Fallback, sans-serif',
        }}
        className={inter.className}
      >
        <AuthProvider>
          <Navbar />
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
