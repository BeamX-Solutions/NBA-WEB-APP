import type { MetadataRoute } from "next";

/** Makes the app installable. Name, colours and icon follow mobile's app.json and theme tokens. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "NBA Legal Fees",
    short_name: "NBA Fees",
    description: "Calculate prescribed minimum legal fees, issue invoices and hold Certificates of Compliance.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#F7F8F7",
    theme_color: "#0B5D33",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
