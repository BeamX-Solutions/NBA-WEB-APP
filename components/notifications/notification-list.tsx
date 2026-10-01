"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { markNotificationsReadAction } from "@/app/notifications/actions";
import { Button } from "@/components/mobile/button";
import { Card } from "@/components/mobile/card";
import { Icon } from "@/components/mobile/icon";
import { Screen, ScreenHeading } from "@/components/mobile/screen";
import { EmptyState, ErrorState, Notice } from "@/components/mobile/states";
import { notificationPresentation, type AppNotification } from "@/lib/notifications/contracts";

const markError = "This could not be marked as read. Check your connection and try again.";

function NotificationRow({ notification, onOpen, disabled }: { notification: AppNotification; onOpen: (notification: AppNotification) => void; disabled: boolean }) {
  const { icon, tone } = notificationPresentation(notification.kind);
  const circle = tone === "danger" ? "bg-danger-surface text-danger" : "bg-success-surface text-primary";
  return <li className="border-b border-border last:border-b-0">
    <button className={`flex w-full items-start gap-3 border-0 px-4 py-3 text-left hover:bg-surface-muted disabled:cursor-wait ${notification.read ? "bg-surface" : "bg-primary-surface"}`} disabled={disabled} onClick={() => onOpen(notification)} type="button">
      <span className={`grid size-10 shrink-0 place-items-center rounded-full ${circle}`}><Icon name={icon} size={22}/></span>
      <span className="min-w-0 flex-1">
        <span className="flex items-start gap-2">
          <span className={`flex-1 text-body text-text ${notification.read ? "font-normal" : "font-semibold"}`}>{notification.title}</span>
          {notification.read ? null : <span aria-label="Unread" className="mt-[7px] size-2 shrink-0 rounded-full bg-primary" role="img"/>}
        </span>
        <span className="mt-1 block text-label leading-[19px] text-text-muted">{notification.body}</span>
        <span className="mt-1 block text-caption text-text-disabled">{notification.when}</span>
      </span>
    </button>
  </li>;
}

/** The inbox: newest first; opening a row marks it read and follows its link. */
export function NotificationList({ notifications, error }: { notifications: AppNotification[]; error: string | null }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState("");
  const unread = notifications.filter((notification) => !notification.read).length;

  function open(notification: AppNotification) {
    setMessage("");
    startTransition(async () => {
      if (!notification.read) {
        const result = await markNotificationsReadAction([notification.id]);
        // A failed mark should not stop someone reaching what the notification is about.
        if (!result.ok && !notification.link) { setMessage(markError); return; }
      }
      if (notification.link) router.push(notification.link);
      else router.refresh();
    });
  }

  function markAll() {
    setMessage("");
    startTransition(async () => {
      const result = await markNotificationsReadAction(null);
      if (!result.ok) { setMessage(markError); return; }
      router.refresh();
    });
  }

  const heading = <div className="flex items-start justify-between gap-3">
    <ScreenHeading subtitle="Updates about your account, payments and certificates." title="Notifications"/>
    {unread > 0 ? <button className="mt-1 shrink-0 border-0 bg-transparent p-1 text-label font-semibold text-primary disabled:opacity-60" disabled={pending} onClick={markAll} type="button">Mark all as read</button> : null}
  </div>;

  if (error) return <Screen>{heading}<Card><ErrorState action={<Button onClick={() => router.refresh()} variant="outline">Try again</Button>} body={error}/></Card></Screen>;

  return <Screen>
    {heading}
    {message ? <Notice className="mb-3" tone="error">{message}</Notice> : null}
    {notifications.length === 0
      ? <Card><EmptyState body="You will be told here when your branch approves your account, reviews a payment or issues a certificate." icon="notifications-none" title="No notifications yet"/></Card>
      : <Card className="overflow-hidden p-0"><ul aria-busy={pending} className="m-0 list-none p-0">{notifications.map((notification) => <NotificationRow disabled={pending} key={notification.id} notification={notification} onOpen={open}/>)}</ul></Card>}
  </Screen>;
}
