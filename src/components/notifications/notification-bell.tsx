"use client";

import { formatDistanceToNow } from "date-fns";
import { Bell, BookOpen, CheckCheck, Loader2, Trophy } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

type NotificationItem = {
  id: string;
  type: "COURSE_PUBLISHED" | "CONTEST_PUBLISHED" | "CONTEST_RESULT" | "SYSTEM";
  title: string;
  body: string;
  href: string | null;
  readAt: string | null;
  createdAt: string;
};

export function NotificationBell({ enabled }: { enabled: boolean }) {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const loadNotifications = useCallback(async () => {
    if (!enabled) return;
    setLoading(true);
    try {
      const response = await fetch("/api/notifications", { cache: "no-store" });
      if (!response.ok) return;
      const data = await response.json();
      setNotifications(data.notifications);
      setUnreadCount(data.unreadCount);
    } finally {
      setLoading(false);
    }
  }, [enabled]);

  useEffect(() => {
    loadNotifications();
    const timer = window.setInterval(loadNotifications, 60_000);
    window.addEventListener("focus", loadNotifications);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener("focus", loadNotifications);
    };
  }, [loadNotifications]);

  async function markRead(notificationId?: string) {
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(notificationId ? { notificationId } : { all: true }),
    });
    setNotifications(items => items.map(item =>
      !notificationId || item.id === notificationId ? { ...item, readAt: item.readAt || new Date().toISOString() } : item
    ));
    setUnreadCount(count => notificationId ? Math.max(0, count - 1) : 0);
  }

  if (!enabled) return null;

  return (
    <Popover onOpenChange={open => open && loadNotifications()}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative" aria-label={`${unreadCount} unread notifications`} title="Notifications">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-600 px-1 text-[10px] font-semibold leading-none text-white">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[calc(100vw-2rem)] max-w-96 p-0">
        <div className="flex h-14 items-center justify-between border-b px-4">
          <div>
            <p className="text-sm font-semibold">Notifications</p>
            <p className="text-xs text-muted-foreground">{unreadCount ? `${unreadCount} unread` : "You are all caught up"}</p>
          </div>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" onClick={() => markRead()} className="h-8 px-2" title="Mark all as read">
              <CheckCheck className="mr-1.5 h-4 w-4" />
              Read all
            </Button>
          )}
        </div>
        <ScrollArea className="max-h-[min(28rem,70vh)]">
          {loading && notifications.length === 0 ? (
            <div className="flex h-32 items-center justify-center text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin" /></div>
          ) : notifications.length === 0 ? (
            <div className="px-5 py-10 text-center">
              <Bell className="mx-auto h-6 w-6 text-muted-foreground" />
              <p className="mt-3 text-sm font-medium">No notifications yet</p>
              <p className="mt-1 text-xs text-muted-foreground">New courses and contests will appear here.</p>
            </div>
          ) : notifications.map(notification => {
            const Icon = notification.type === "COURSE_PUBLISHED" ? BookOpen : Trophy;
            const content = (
              <div className={cn("flex gap-3 border-b px-4 py-3 transition hover:bg-muted/60", !notification.readAt && "bg-blue-50/70 dark:bg-blue-950/20")}>
                <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md border bg-background">
                  <Icon className="h-4 w-4" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-start gap-2">
                    <span className="min-w-0 flex-1 break-words text-sm font-medium">{notification.title}</span>
                    {!notification.readAt && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-blue-600" />}
                  </span>
                  <span className="mt-1 block break-words text-xs leading-5 text-muted-foreground">{notification.body}</span>
                  <span className="mt-1.5 block text-[11px] text-muted-foreground">
                    {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                  </span>
                </span>
              </div>
            );
            return notification.href ? (
              <Link key={notification.id} href={notification.href} onClick={() => !notification.readAt && markRead(notification.id)}>{content}</Link>
            ) : <button key={notification.id} className="w-full text-left" onClick={() => !notification.readAt && markRead(notification.id)}>{content}</button>;
          })}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
