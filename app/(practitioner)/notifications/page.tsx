import { NotificationList } from "@/components/notifications/notification-list";
import { loadNotifications } from "@/lib/notifications/data";

export default async function NotificationsPage() {
  const result = await loadNotifications();
  return <><NotificationList error={result.error} notifications={result.notifications}/></>;
}
