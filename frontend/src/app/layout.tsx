import "./globals.css";
import type { Metadata } from "next";

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
          background: "#fdfdfb",
          fontFamily: 'FamilyFont, FamilyFont Fallback, sans-serif',
        }}
      >
        {children}
      </body>
    </html>
  );
}
