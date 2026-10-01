import Image from "next/image";
import { CalculatorFlow } from "@/components/calculator/calculator-flow";
import { TryAgainButton } from "@/components/pwa/try-again-button";
import { PRODUCT_NAME } from "@/lib/branding";
import type { CalculatorContext } from "@/lib/calculator/types";

export const dynamic = "force-static";

export const metadata = { title: `Offline - ${PRODUCT_NAME}` };

/** No account data: this page is precached by the service worker and shown for any offline navigation. */
const anonymous: CalculatorContext = { branch: null, displayName: "", firstName: "Counsel", hasBankDetails: false, loadWarning: null, scn: null, subscription: null };

export default function OfflinePage() {
  return <div className="min-h-screen bg-background">
    <header className="border-b border-border bg-background">
      <div className="mx-auto flex max-w-[1040px] items-center justify-between gap-4 px-4 pt-2 pb-3">
        <Image alt={PRODUCT_NAME} className="size-9 object-contain" height={36} priority src="/nba-seal.png" unoptimized width={36}/>
        <TryAgainButton/>
      </div>
    </header>
    <CalculatorFlow context={anonymous} offline/>
  </div>;
}
