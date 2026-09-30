import type { Metadata } from "next";
import { Playfair_Display, Source_Sans_3 } from "next/font/google";
import "./globals.css";

// The mobile app's families (mobile/lib/fonts.ts): Playfair Display for headings, Source Sans 3 for body.
const playfair = Playfair_Display({ subsets: ["latin"], weight: ["600", "700"], variable: "--font-playfair", display: "swap" });
const sourceSans = Source_Sans_3({ subsets: ["latin"], weight: ["400", "500", "600", "700"], variable: "--font-source-sans", display: "swap" });

export const metadata: Metadata = {
  title: "NBA Legal Fees",
  description:
    "Calculate prescribed minimum legal fees under the Legal Practitioners Remuneration Order, 2023.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${playfair.variable} ${sourceSans.variable} h-full antialiased`} data-scroll-behavior="smooth">
      <head>
        {/* The icon font mobile uses (MaterialIcons). Self-hosted in Phase 3 for offline use. */}
        <link href="https://fonts.googleapis.com/icon?family=Material+Icons&display=block" rel="stylesheet" />
      </head>
      <body className="min-h-full bg-background font-body text-body text-text">{children}</body>
    </html>
  );
}
