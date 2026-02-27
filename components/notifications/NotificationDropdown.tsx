"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Bell, MessageSquare, X, Trash2, Circle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

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
  const [displayLimit, setDisplayLimit] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [showDeleteAllDialog, setShowDeleteAllDialog] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const hasFetchedRef = useRef(false); // Track if we've already fetched for this session

  const fetchNotifications = useCallback(async () => {
    // Only fetch once per session - user can refresh page to get new data
    if (hasFetchedRef.current) return;
    
    try {
      setLoading(true);
      const token = localStorage.getItem("session_token");
      if (!token) return;

      // Fetch notifications - unread count is included in the response
      // Use initial displayLimit (10) for first fetch
      const response = await fetch(`/api/notifications?limit=10`, {
        headers: {
          "x-session-token": token,
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setNotifications(data.data.notifications);
          setTotalCount(data.data.pagination?.total || 0);
          // Unread count is included in the response, no need for separate API call
          if (data.data.unreadCount !== undefined) {
            setUnreadCount(data.data.unreadCount);
          }
          hasFetchedRef.current = true;
        }
      }
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
    } finally {
      setLoading(false);
    }
  }, []); // No dependencies - only fetch once

  // Fetch notifications only once when dropdown opens for the first time
  // No real-time updates - user must refresh page to get new notifications
  useEffect(() => {
    if (user && isOpen && !hasFetchedRef.current) {
      fetchNotifications();
    }
  }, [user, isOpen, fetchNotifications]);

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

  const markAsRead = async (notificationId: number): Promise<boolean> => {
    try {
      const token = localStorage.getItem("session_token");
      if (!token) return false;

      // Check if notification is already read to avoid unnecessary API calls
      const notification = notifications.find((n) => n.id === notificationId);
      if (notification?.isRead) return true;

      const response = await fetch(`/api/notifications/${notificationId}/read`, {
        method: "POST",
        headers: {
          "x-session-token": token,
        },
      });

      if (response.ok) {
        // Update notification state
        setNotifications((prev) =>
          prev.map((n) =>
            n.id === notificationId ? { ...n, isRead: true } : n
          )
        );
        // Update unread count immediately (optimistic update)
        setUnreadCount((prev) => Math.max(0, prev - 1));
        return true;
      }
      return false;
    } catch (error) {
      console.error("Failed to mark as read:", error);
      return false;
    }
  };

  const deleteNotification = async (notificationId: number, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    try {
      const token = localStorage.getItem("session_token");
      if (!token) return;

      const response = await fetch(`/api/notifications/${notificationId}`, {
        method: "DELETE",
        headers: {
          "x-session-token": token,
        },
      });

      if (response.ok) {
        setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
        setUnreadCount((prev) => Math.max(0, prev - 1));
        setTotalCount((prev) => Math.max(0, prev - 1));
        toast.success("ลบแจ้งเตือนสำเร็จ");
      } else {
        toast.error("ไม่สามารถลบแจ้งเตือนได้");
      }
    } catch (error) {
      console.error("Failed to delete notification:", error);
      toast.error("เกิดข้อผิดพลาดในการลบแจ้งเตือน");
    }
  };

  const handleDeleteAllClick = () => {
    setShowDeleteAllDialog(true);
  };

  const deleteAllNotifications = async () => {
    try {
      const token = localStorage.getItem("session_token");
      if (!token) return;

      const response = await fetch("/api/notifications/delete-all", {
        method: "DELETE",
        headers: {
          "x-session-token": token,
        },
      });

      if (response.ok) {
        setNotifications([]);
        setUnreadCount(0);
        setTotalCount(0);
        toast.success("ลบแจ้งเตือนทั้งหมดสำเร็จ");
        setShowDeleteAllDialog(false);
      } else {
        toast.error("ไม่สามารถลบแจ้งเตือนทั้งหมดได้");
      }
    } catch (error) {
      console.error("Failed to delete all notifications:", error);
      toast.error("เกิดข้อผิดพลาดในการลบแจ้งเตือนทั้งหมด");
    }
  };

  const loadMore = () => {
    setDisplayLimit((prev) => prev + 5);
  };

  const hasMore = totalCount > notifications.length;

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
            <div className="flex items-center gap-2">
              {notifications.length > 0 && (
                <button
                  onClick={handleDeleteAllClick}
                  className="px-3 py-1.5 rounded-lg border border-red-500/30 text-red-500 hover:bg-red-500/10 hover:border-red-500/50 transition-colors text-xs font-medium flex items-center gap-1.5">
                  <Trash2 className="w-3.5 h-3.5" />
                  ลบทั้งหมด
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 rounded hover:bg-muted transition-colors">
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>
          </div>

          <div className={cn(
            "overflow-y-auto",
            notifications.length > 3 ? "max-h-[500px]" : "max-h-none"
          )}>
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
                  <a
                    key={notification.id}
                    href={
                      notification.manga
                        ? `/comic/${notification.manga.slug}`
                        : "#"
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={async (e) => {
                      if (!notification.isRead) {
                        e.preventDefault();
                        const success = await markAsRead(notification.id);
                        if (success) {
                          // Wait a bit for state to update, then open the link
                          setTimeout(() => {
                            const url = notification.manga
                              ? `/comic/${notification.manga.slug}`
                              : "#";
                            window.open(url, "_blank");
                          }, 150);
                        } else {
                          // If mark as read failed, still open the link
                          const url = notification.manga
                            ? `/comic/${notification.manga.slug}`
                            : "#";
                          window.open(url, "_blank");
                        }
                      }
                    }}
                    className={cn(
                      "block p-4 border-b border-border hover:bg-muted/50 transition-colors cursor-pointer relative group",
                      !notification.isRead && "bg-muted/30 border-l-2 border-l-orange-500"
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
                        <div className="flex items-center gap-2">
                          <p className="text-sm text-foreground">
                            <span className="font-medium">
                              {getUserDisplayName(notification.comment)}
                            </span>{" "}
                            {notification.type === "COMMENT_ON_MY_MANGA"
                              ? "ได้เขียนรีวิวใน"
                              : "ได้แสดงความคิดเห็นใน"}{" "}
                            <span className="font-medium">
                              {notification.manga?.title || "การ์ตูน"}
                            </span>
                          </p>
                          {!notification.isRead && (
                            <span className="px-2 py-0.5 text-[10px] font-medium bg-orange-500/20 text-orange-600 rounded-full border border-orange-500/30">
                              ใหม่
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {formatTimeAgo(notification.createdAt)}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 flex-shrink-0">
                        {!notification.isRead && (
                          <Circle className="w-3 h-3 fill-orange-500 text-orange-500" />
                        )}
                        <button
                          onClick={(e) => deleteNotification(notification.id, e)}
                          className="p-1.5 rounded hover:bg-red-500/10 text-red-500 hover:text-red-600 transition-colors"
                          title="ลบแจ้งเตือน">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </a>
                ))}
                {hasMore && (
                  <div className="p-4 border-t border-border text-center">
                    <button
                      onClick={loadMore}
                      className="text-xs font-medium text-orange-600 hover:text-orange-700">
                      แสดงเพิ่มเติม
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      <AlertDialog open={showDeleteAllDialog} onOpenChange={setShowDeleteAllDialog}>
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-foreground flex items-center gap-2">
              <Trash2 className="w-5 h-5 text-red-500" />
              ยืนยันการลบ
            </AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              คุณต้องการลบแจ้งเตือนทั้งหมดหรือไม่? การกระทำนี้ไม่สามารถยกเลิกได้
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel className="bg-background border-border hover:bg-muted text-foreground">
              ยกเลิก
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={deleteAllNotifications}
              className="bg-red-600 hover:bg-red-700 text-white border-red-600">
              ลบทั้งหมด
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
