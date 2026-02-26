"use client";

import { useState, useEffect, useRef } from "react";
import { Bell, MessageSquare, X } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import Link from "next/link";

type Notification = {
  id: number;
  type: string;
  isRead: boolean;
  createdAt: string;
  comment?: {
    id: number;
    content: string;
    user: {
      id: number;
      username: string | null;
      name: string | null;
      avatarUrl: string | null;
    };
  };
  manga?: {
    id: number;
    slug: string;
    title: string;
    coverUrl: string | null;
  };
};

export default function NotificationDropdown() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user) {
      fetchUnreadCount();
      if (isOpen) {
        fetchNotifications();
      }
    }
  }, [user, isOpen]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen]);

  // Poll for new notifications every 30 seconds
  useEffect(() => {
    if (!user) return;

    const interval = setInterval(() => {
      fetchUnreadCount();
    }, 30000);

    return () => clearInterval(interval);
  }, [user]);

  const fetchUnreadCount = async () => {
    try {
      const token = localStorage.getItem("session_token");
      if (!token) return;

      const response = await fetch("/api/notifications/unread-count", {
        headers: {
          "x-session-token": token,
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setUnreadCount(data.data.count);
        }
      }
    } catch (error) {
      console.error("Failed to fetch unread count:", error);
    }
  };

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("session_token");
      if (!token) return;

      const response = await fetch("/api/notifications?limit=20", {
        headers: {
          "x-session-token": token,
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setNotifications(data.data.notifications);
        }
      }
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId: number) => {
    try {
      const token = localStorage.getItem("session_token");
      if (!token) return;

      await fetch(`/api/notifications/${notificationId}/read`, {
        method: "POST",
        headers: {
          "x-session-token": token,
        },
      });

      setNotifications((prev) =>
        prev.map((n) =>
          n.id === notificationId ? { ...n, isRead: true } : n
        )
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      console.error("Failed to mark as read:", error);
    }
  };

  const formatTimeAgo = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return "เมื่อสักครู่";
    if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `${minutes} นาทีที่แล้ว`;
    }
    if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `${hours} ชั่วโมงที่แล้ว`;
    }
    if (diffInSeconds < 604800) {
      const days = Math.floor(diffInSeconds / 86400);
      return `${days} วันที่แล้ว`;
    }
    if (diffInSeconds < 2592000) {
      const weeks = Math.floor(diffInSeconds / 604800);
      return `${weeks} สัปดาห์ที่แล้ว`;
    }
    const months = Math.floor(diffInSeconds / 2592000);
    return `${months} เดือนที่แล้ว`;
  };

  const getUserDisplayName = (comment: Notification["comment"]) => {
    if (!comment?.user) return "ผู้ใช้";
    return comment.user.name || comment.user.username || "ผู้ใช้";
  };

  if (!user) return null;

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 rounded-full hover:bg-muted transition-colors text-muted-foreground hover:text-foreground relative">
        <MessageSquare className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 min-w-[18px] h-[18px] px-1.5 bg-red-500 text-white text-[10px] font-medium rounded-full flex items-center justify-center">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-96 max-h-[600px] bg-card border border-border rounded-xl shadow-lg overflow-hidden z-50">
          <div className="p-4 border-b border-border flex items-center justify-between">
            <h3 className="font-semibold text-foreground">การแจ้งเตือน</h3>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 rounded hover:bg-muted transition-colors">
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>

          <div className="overflow-y-auto max-h-[500px]">
            {loading ? (
              <div className="p-8 text-center">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-orange-500 mx-auto"></div>
                <p className="text-sm text-muted-foreground mt-2">กำลังโหลด...</p>
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center">
                <Bell className="w-12 h-12 text-muted-foreground mx-auto mb-2 opacity-50" />
                <p className="text-sm text-muted-foreground">ไม่มีการแจ้งเตือน</p>
              </div>
            ) : (
              <div>
                {notifications.map((notification) => (
                  <Link
                    key={notification.id}
                    href={
                      notification.manga
                        ? `/comic/${notification.manga.slug}`
                        : "#"
                    }
                    onClick={() => {
                      if (!notification.isRead) {
                        markAsRead(notification.id);
                      }
                    }}
                    className={cn(
                      "block p-4 border-b border-border hover:bg-muted/50 transition-colors",
                      !notification.isRead && "bg-muted/30"
                    )}>
                    <div className="flex items-start gap-3">
                      {notification.comment?.user?.avatarUrl ? (
                        <img
                          src={notification.comment.user.avatarUrl}
                          alt={getUserDisplayName(notification.comment)}
                          className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                          <span className="text-xs text-muted-foreground">
                            {getUserDisplayName(notification.comment)
                              .charAt(0)
                              .toUpperCase()}
                          </span>
                        </div>
                      )}

                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-foreground">
                          <span className="font-medium">
                            {getUserDisplayName(notification.comment)}
                          </span>{" "}
                          ได้แสดงความคิดเห็นใน{" "}
                          <span className="font-medium">
                            {notification.manga?.title || "การ์ตูน"}
                          </span>
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {formatTimeAgo(notification.createdAt)}
                        </p>
                      </div>

                      {!notification.isRead && (
                        <div className="w-2 h-2 bg-orange-500 rounded-full flex-shrink-0 mt-2"></div>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
