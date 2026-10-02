"use client";

import { Button } from "@/components/mobile/button";
import { Screen, ScreenHeading } from "@/components/mobile/screen";
import { ErrorState } from "@/components/mobile/states";

export default function CertificatesError({ reset }: { reset: () => void }) {
  return <Screen><ScreenHeading title="My Certificates"/><ErrorState action={<Button onClick={reset} variant="outline">Try again</Button>} body="Your certificates could not be loaded."/></Screen>;
}
