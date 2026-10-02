import type { ReactNode } from "react";
import { AppHeader } from "@/components/mobile/app-shell";
import { PractitionerFrame } from "@/components/mobile/practitioner-frame";

/**
 * The shell every practitioner screen shares, rendered once and kept while pages change beneath
 * it. Only signed-in practitioners reach these routes: proxy.ts turns away everyone else first.
 */
export default function PractitionerLayout({ children }: { children: ReactNode }) {
  return <PractitionerFrame header={<AppHeader practitioner/>}>{children}</PractitionerFrame>;
}
