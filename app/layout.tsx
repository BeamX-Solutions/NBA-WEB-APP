import type { Metadata, Viewport } from "next";
import { Playfair_Display, Source_Sans_3 } from "next/font/google";
import Script from "next/script";
import { OfflineBanner } from "@/components/mobile/offline-banner";
import { InstallListener } from "@/components/pwa/install-listener";
import { ServiceWorkerRegistration } from "@/components/pwa/service-worker-registration";
import { PRODUCT_NAME } from "@/lib/branding";
import { EARLY_INSTALL_CAPTURE } from "@/lib/pwa/install";
import "./globals.css";

// The mobile app's families (mobile/lib/fonts.ts). next/font downloads them at build and serves them
// from this origin, so they work offline too.
const playfair = Playfair_Display({ subsets: ["latin"], weight: ["600", "700"], variable: "--font-playfair", display: "swap" });
const sourceSans = Source_Sans_3({ subsets: ["latin"], weight: ["400", "500", "600", "700"], variable: "--font-source-sans", display: "swap" });

export const metadata: Metadata = {
  title: PRODUCT_NAME,
  description: "Calculate prescribed minimum legal fees under the Legal Practitioners Remuneration Order, 2023.",
  applicationName: PRODUCT_NAME,
  appleWebApp: { capable: true, title: PRODUCT_NAME, statusBarStyle: "default" },
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
        <InstallListener/>
        {/* Before hydration, so an early "installable" event from Chrome is not missed. */}
        <Script id="install-capture" strategy="beforeInteractive">{EARLY_INSTALL_CAPTURE}</Script>
      </body>
    </html>
  );
}
