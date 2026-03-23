import { useMemo, useState } from "react";
import { Bell } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import { useMarkNotificationRead, useMyNotifications } from "@/hooks/useNotifications";
import { useAuthStore } from "@/store/authStore";

const listOf = (value: unknown): any[] => (Array.isArray(value) ? value : []);

export function NotificationDropdown() {
  const [open, setOpen] = useState(false);
  const role = useAuthStore((state) => state.role);
  const { data, isLoading } = useMyNotifications();
  const markRead = useMarkNotificationRead();
  const notifications = useMemo(() => listOf(data), [data]);
  const unreadCount = notifications.filter((item: any) => !item.isRead).length;
  const targetPage = role === "Admin" ? "/admin/notifications" : role === "Staff" ? "/staff/notifications" : "/resident/notifications";

  return (
    <div className="relative">
      <button
        className="relative rounded-xl border border-slate-200/70 bg-white/80 p-2.5 hover:bg-slate-50"
        onClick={() => setOpen((previous) => !previous)}
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 ? (
          <span className="absolute -right-0.5 -top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-error px-1 text-[10px] font-semibold text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        ) : null}
      </button>

      {open ? (
        <div className="glass-card absolute right-0 top-12 z-40 w-[330px] rounded-2xl p-3 shadow-panel">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-sm font-semibold">Notifications</p>
            <span className="text-xs text-slate-500">{unreadCount} unread</span>
          </div>

          <div className="max-h-72 space-y-2 overflow-auto">
            {isLoading ? <p className="text-xs text-slate-500">Loading...</p> : null}
            {!isLoading && notifications.length === 0 ? <p className="text-xs text-slate-500">No notifications</p> : null}

            {notifications.slice(0, 6).map((item: any, index) => (
              <article key={item.id ?? index} className="rounded-xl border border-slate-200 bg-white/75 p-2.5 text-xs">
                <p className="text-slate-800">{item.message ?? item.content ?? "Notification"}</p>
                <div className="mt-1 flex items-center justify-between gap-2">
                  <span className="text-[11px] text-slate-500">{item.createdAt ?? item.time ?? ""}</span>
                  {!item.isRead && item.id ? (
                    <Button variant="ghost" className="px-2 py-1 text-[11px]" onClick={() => markRead.mutate(item.id)}>
                      Mark read
                    </Button>
                  ) : null}
                </div>
              </article>
            ))}
          </div>

          <Link to={targetPage} className="mt-3 block text-center text-xs font-semibold text-primary" onClick={() => setOpen(false)}>
            View all
          </Link>
        </div>
      ) : null}
    </div>
  );
}
