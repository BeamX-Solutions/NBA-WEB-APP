import { AppShell } from "@/components/mobile/app-shell";
import { Screen, ScreenHeading } from "@/components/mobile/screen";
import { LoadingState } from "@/components/mobile/states";

export default function NotificationsLoading() {
  return <AppShell><Screen><ScreenHeading subtitle="Updates about your account, payments and certificates." title="Notifications"/><LoadingState label="Loading your notifications"/></Screen></AppShell>;
}
