"use client";

import { useState } from "react";
import { Button } from "@/components/mobile/button";
import { Card } from "@/components/mobile/card";
import { Icon } from "@/components/mobile/icon";
import { SectionTitle } from "@/components/mobile/screen";
import { PRODUCT_NAME } from "@/lib/branding";
import { installApp, useInstallState } from "@/lib/pwa/install-store";
import { IosInstallGuide } from "./ios-install-guide";

/** Help & Support: always present, so someone who chose Not now can still install. */
export function InstallCard() {
  const { kind, inAppBrowser } = useInstallState();
  const [guideOpen, setGuideOpen] = useState(false);
  const [installing, setInstalling] = useState(false);

  async function install() {
    setInstalling(true);
    try { await installApp(); } finally { setInstalling(false); }
  }

  return <Card className="mt-4">
    <SectionTitle icon="install-mobile" underline>Install the app</SectionTitle>
    {kind === "installed" ? <p className="flex items-center gap-2 text-body text-text"><Icon color="var(--color-success)" name="check-circle" size={20}/>You are using the installed app.</p> : null}
    {kind === "one-tap" ? <>
      <p className="text-body leading-[21px] text-text-muted">Add {PRODUCT_NAME} to your home screen or desktop and open it like any app. The calculator works offline.</p>
      <div className="mt-3"><Button loading={installing} onClick={install}>Install</Button></div>
    </> : null}
    {kind === "ios-guide" ? <>
      <p className="text-body leading-[21px] text-text-muted">Add {PRODUCT_NAME} to your home screen in three taps and open it like any app. The calculator works offline.</p>
      <div className="mt-3"><Button onClick={() => setGuideOpen(true)}>Show me how</Button></div>
    </> : null}
    {kind === "unsupported" ? <p className="text-body leading-[21px] text-text-muted">This browser can&apos;t install apps. Open {PRODUCT_NAME} in Chrome on Android or Safari on iPhone to add it to your home screen.</p> : null}
    {guideOpen ? <IosInstallGuide inAppBrowser={inAppBrowser} onClose={() => setGuideOpen(false)}/> : null}
  </Card>;
}
