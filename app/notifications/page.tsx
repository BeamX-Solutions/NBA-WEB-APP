import { AppShell } from "@/components/mobile/app-shell";
import { NotificationList } from "@/components/notifications/notification-list";
import { loadNotifications } from "@/lib/notifications/data";

export default async function NotificationsPage() {
  const result = await loadNotifications();
  return <AppShell><NotificationList error={result.error} notifications={result.notifications}/></AppShell>;
}
