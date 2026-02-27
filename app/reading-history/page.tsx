"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/contexts/AuthContext";
import { History, BookOpen } from "lucide-react";
import { format } from "date-fns";
import { th } from "date-fns/locale";

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

  useEffect(() => {
    if (!authLoading && user) {
      fetchHistory();
    } else if (!authLoading && !user) {
      setLoading(false);
    }
  }, [authLoading, user]);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("session_token");
      if (!token) return;

      const response = await fetch(
        `/api/reading-history?limit=50`,
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
        }
      }
    } catch (error) {
      console.error("Failed to fetch reading history:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatThaiDateTime = (dateString: string): string => {
    try {
      const date = new Date(dateString);
      return format(date, "d MMM yyyy HH:mm น.", { locale: th });
    } catch (error) {
      return dateString;
    }
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
          <h1 className="text-2xl font-semibold text-foreground">
            ประวัติการอ่าน
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            แสดงเฉพาะ 50 รายการเรื่องที่อ่านล่าสุด
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
          <div className="space-y-0">
            {history.map((item, index) => (
              <Link
                key={item.id}
                href={`/comic/chapter/${item.chapter.slug}`}
                className="block border-b border-border last:border-b-0 hover:bg-muted/30 transition-colors">
                <div className="flex items-center gap-4 p-4">
                  {/* Cover Image */}
                  <div className="w-16 h-20 sm:w-20 sm:h-28 rounded overflow-hidden bg-muted flex-shrink-0">
                    {item.manga.coverUrl ? (
                      <Image
                        src={item.manga.coverUrl}
                        alt={item.manga.title}
                        width={80}
                        height={112}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <BookOpen className="w-8 h-8 text-muted-foreground" />
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground line-clamp-2">
                      {item.manga.title}
                    </p>
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                      {item.chapter.title || `ตอนที่ ${item.chapter.number}`}
                    </p>
                  </div>

                  {/* Timestamp */}
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm text-muted-foreground whitespace-nowrap">
                      {formatThaiDateTime(item.updatedAt)}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
