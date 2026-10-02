import { Screen, ScreenHeading } from "./screen";
import { LoadingState } from "./states";

/**
 * A route's loading.tsx: the screen's own heading and a spinner, inside the persistent practitioner
 * layout. It fetches nothing, so Next can show it the moment a link is tapped.
 */
export function RouteLoading({ label, subtitle, title, wide = false }: { label: string; subtitle?: string; title?: string; wide?: boolean }) {
  return <Screen wide={wide}>{title ? <ScreenHeading subtitle={subtitle} title={title}/> : null}<LoadingState label={label}/></Screen>;
}
