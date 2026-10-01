"use client";

import { useEffect } from "react";
import { startInstallCapture } from "@/lib/pwa/install-store";

/**
 * Chrome announces the app is installable once, possibly before React has hydrated. The root
 * layout's early script (EARLY_INSTALL_CAPTURE) keeps that event; this takes over once the page
 * is interactive.
 */
export function InstallListener() {
  useEffect(() => { startInstallCapture(); }, []);
  return null;
}
