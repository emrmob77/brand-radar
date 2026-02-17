import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Brand Radar | Corporate Intelligence",
  description: "Enterprise-grade GEO dashboard for brand visibility and risk monitoring"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr">
      <body className="font-display text-ink">{children}</body>
    </html>
  );
}
