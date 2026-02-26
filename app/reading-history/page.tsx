"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { History, BookOpen, Clock, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

type ReadingHistoryItem = {
  id: number;
  lastPage: number;
  updatedAt: string;
  createdAt: string;
  manga: {
    id: number;
    slug: string;
    title: string;
    coverUrl: string | null;
    status: string;
  };
  chapter: {
    id: number;
    slug: string;
    title: string;
    number: number;
  };
};

export default function ReadingHistoryPage() {
  const { user, loading: authLoading } = useAuth();
  const [history, setHistory] = useState<ReadingHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    if (!authLoading && user) {
      fetchHistory();
    } else if (!authLoading && !user) {
      setLoading(false);
    }
  }, [authLoading, user, page]);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("session_token");
      if (!token) return;

      const response = await fetch(
        `/api/reading-history?page=${page}&limit=20`,
        {
          headers: {
            "x-session-token": token,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setHistory(data.data.history);
          setTotalPages(data.data.pagination.totalPages);
        }
      }
    } catch (error) {
      console.error("Failed to fetch reading history:", error);
    } finally {
      setLoading(false);
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

  if (authLoading || loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">กรุณาเข้าสู่ระบบ</p>
          <Link
            href="/login"
            className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors">
            เข้าสู่ระบบ
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-foreground flex items-center gap-2">
            <History className="w-6 h-6" />
            ประวัติการอ่าน
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            ดูประวัติการอ่านการ์ตูนของคุณ
          </p>
        </div>

        {history.length === 0 ? (
          <div className="bg-card rounded-xl border border-border p-12 text-center">
            <BookOpen className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
            <p className="text-muted-foreground">ยังไม่มีประวัติการอ่าน</p>
            <Link
              href="/search"
              className="mt-4 inline-block px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors">
              ไปอ่านการ์ตูน
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {history.map((item) => (
              <Link
                key={item.id}
                href={`/read/${item.manga.id}/${item.chapter.id}`}
                className="block bg-card rounded-xl border border-border p-4 hover:border-orange-500/50 transition-colors">
                <div className="flex items-start gap-4">
                  <div className="w-20 h-28 rounded overflow-hidden bg-muted flex-shrink-0">
                    {item.manga.coverUrl ? (
                      <img
                        src={item.manga.coverUrl}
                        alt={item.manga.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <BookOpen className="w-8 h-8 text-muted-foreground" />
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-foreground truncate hover:text-orange-500 transition-colors">
                      {item.manga.title}
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      ตอนที่ {item.chapter.number}: {item.chapter.title}
                    </p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        <span>{formatTimeAgo(item.updatedAt)}</span>
                      </div>
                      <span>•</span>
                      <span>หน้า {item.lastPage}</span>
                    </div>
                  </div>

                  <ChevronRight className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                </div>
              </Link>
            ))}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 pt-4">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-4 py-2 text-sm border border-border rounded-lg hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                  ก่อนหน้า
                </button>
                <span className="text-sm text-muted-foreground">
                  หน้า {page} จาก {totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-4 py-2 text-sm border border-border rounded-lg hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                  ต่อไป
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
