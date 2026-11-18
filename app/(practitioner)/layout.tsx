import type { ReactNode } from "react";
import { AssistantLauncher } from "@/components/assistant/assistant-launcher";
import { AppHeader } from "@/components/mobile/app-shell";
import { PractitionerFrame } from "@/components/mobile/practitioner-frame";

/**
 * The shell every practitioner screen shares, rendered once and kept while pages change beneath
 * it. Only signed-in practitioners reach these routes: proxy.ts turns away everyone else first.
 * The assistant's floating button lives here, so it is on every practitioner screen and nowhere else.
 */
export default function PractitionerLayout({ children }: { children: ReactNode }) {
  return <PractitionerFrame header={<AppHeader practitioner/>}>{children}<AssistantLauncher/></PractitionerFrame>;
}
