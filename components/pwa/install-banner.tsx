"use client";

import Image from "next/image";
import { useState } from "react";
import { Button } from "@/components/mobile/button";
import { Card } from "@/components/mobile/card";
import { PRODUCT_NAME } from "@/lib/branding";
import { installApp, snoozeInstallBanner, useInstallState } from "@/lib/pwa/install-store";
import { IosInstallGuide } from "./ios-install-guide";

/**
 * Shown on the four tab screens to a signed-in lawyer whose browser can install the app, until they
 * install it or choose Not now (which hides it for 14 days). Renders nothing on the server, in the
 * installed app, and in browsers that cannot install.
 */
export function InstallBanner() {
  const { kind, inAppBrowser, bannerVisible } = useInstallState();
  const [guideOpen, setGuideOpen] = useState(false);
  const [installing, setInstalling] = useState(false);

  if (!bannerVisible && !guideOpen) return null;

  async function install() {
    setInstalling(true);
    try { await installApp(); } finally { setInstalling(false); }
  }

  return <div className="mx-auto w-full max-w-[1040px] px-4 pt-4">
    {bannerVisible ? <Card aria-label={`Install ${PRODUCT_NAME}`} className="flex flex-col gap-3 min-[600px]:flex-row min-[600px]:items-center" role="region">
      <div className="flex flex-1 items-start gap-3">
        <Image alt="" className="size-11 shrink-0 rounded-button" height={44} src="/icons/icon-192.png" width={44}/>
        <div className="min-w-0">
          <p className="m-0 text-body font-semibold text-text">Install {PRODUCT_NAME}</p>
          <p className="mt-1 text-label leading-[19px] text-text-muted">Open it from your home screen like any app. The calculator works offline.</p>
        </div>
      </div>
      <div className="flex items-center gap-2 min-[600px]:w-auto">
        <button className="border-0 bg-transparent px-3 py-2 text-label font-semibold text-text-muted" disabled={installing} onClick={snoozeInstallBanner} type="button">Not now</button>
        <div className="flex-1 min-[600px]:w-[160px] min-[600px]:flex-none">
          {kind === "one-tap"
            ? <Button loading={installing} onClick={install}>Install</Button>
            : <Button onClick={() => setGuideOpen(true)}>Show me how</Button>}
        </div>
      </div>
    </Card> : null}
    {guideOpen ? <IosInstallGuide inAppBrowser={inAppBrowser} onClose={() => setGuideOpen(false)}/> : null}
  </div>;
}
