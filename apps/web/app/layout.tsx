import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "TrustLens — Web Threat & Digital Trust Intelligence",
  description:
    "Investigate suspicious links and messages with deterministic evidence, TLS intelligence, threat correlation and verifiable reports.",
};

export const viewport: Viewport = {
  themeColor: "#060a11",
  colorScheme: "dark",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full">{children}</body>
    </html>
  );
}
