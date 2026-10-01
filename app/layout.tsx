import type { Metadata, Viewport } from "next";
import { Playfair_Display, Source_Sans_3 } from "next/font/google";
import { OfflineBanner } from "@/components/mobile/offline-banner";
import { ServiceWorkerRegistration } from "@/components/pwa/service-worker-registration";
import "./globals.css";

// The mobile app's families (mobile/lib/fonts.ts). next/font downloads them at build and serves them
// from this origin, so they work offline too.
const playfair = Playfair_Display({ subsets: ["latin"], weight: ["600", "700"], variable: "--font-playfair", display: "swap" });
const sourceSans = Source_Sans_3({ subsets: ["latin"], weight: ["400", "500", "600", "700"], variable: "--font-source-sans", display: "swap" });

export const metadata: Metadata = {
  title: "NBA Legal Fees",
  description: "Calculate prescribed minimum legal fees under the Legal Practitioners Remuneration Order, 2023.",
  applicationName: "NBA Legal Fees",
  appleWebApp: { capable: true, title: "NBA Fees", statusBarStyle: "default" },
  icons: { apple: "/icons/apple-touch-icon.png" },
};

export const viewport: Viewport = {
  themeColor: "#0B5D33",
  // Lets env(safe-area-inset-*) resolve, so the bottom tab bar reaches the edge on iPhones.
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${playfair.variable} ${sourceSans.variable} h-full antialiased`} data-scroll-behavior="smooth">
      <body className="min-h-full bg-background font-body text-body text-text">
        <OfflineBanner/>
        {children}
        <ServiceWorkerRegistration/>
      </body>
    </html>
  );
}
