import type { Metadata } from "next";
import localFont from "next/font/local";
import { designTokenCssVariables } from "@/lib/design-system/tokens";
import "./globals.css";

const geistSans = localFont({
  src: "../node_modules/next/dist/next-devtools/server/font/geist-latin.woff2",
  variable: "--font-geist-sans",
  display: "swap",
});

const geistMono = localFont({
  src: "../node_modules/next/dist/next-devtools/server/font/geist-mono-latin.woff2",
  variable: "--font-geist-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "NBA Legal Fees Practitioner",
  description:
    "Calculate prescribed minimum legal fees under the Legal Practitioners Remuneration Order, 2023.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      data-scroll-behavior="smooth"
    >
      <body className="min-h-full flex flex-col" style={designTokenCssVariables}>{children}</body>
    </html>
  );
}
