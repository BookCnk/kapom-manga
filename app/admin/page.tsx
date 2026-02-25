"use client";

import { useState, useEffect } from "react";
import { BarChart3, Users, FileText, BookOpen, DollarSign } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { UserRole } from "@/generated/prisma/enums";

type Stats = {
  totalMangas: number;
  totalUsers: number;
  totalViews: number;
  totalChapters: number;
  myMangasCount: number | null;
};

export default function AdminPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const response = await fetch("/api/admin/stats", {
          headers: {
            "x-session-token": localStorage.getItem("session_token") || localStorage.getItem("sessionToken") || "",
          },
        });

        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            setStats(data.data.stats);
          }
        }
      } catch (error) {
        console.error("Failed to fetch stats:", error);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchStats();
    }
  }, [user]);

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}k`;
    return num.toString();
  };

  const isAdmin = user?.role === UserRole.ADMIN;
  const isTranslator = user?.role === UserRole.TRANSLATOR;

  const displayStats = [
    {
      label: isAdmin ? "มังงะทั้งหมด" : "ผลงานของฉัน",
      value: loading
        ? "..."
        : isAdmin
        ? stats?.totalMangas.toString() || "0"
        : stats?.myMangasCount?.toString() || "0",
      icon: FileText,
      color: "text-blue-500",
    },
    ...(isAdmin
      ? [
          {
            label: "ผู้ใช้ทั้งหมด",
            value: loading ? "..." : stats?.totalUsers.toString() || "0",
            icon: Users,
            color: "text-purple-500",
          },
          {
            label: "ยอดเข้าชม",
            value: loading
              ? "..."
              : formatNumber(stats?.totalViews || 0),
            icon: BarChart3,
            color: "text-orange-500",
          },
          {
            label: "ตอนทั้งหมด",
            value: loading
              ? "..."
              : stats?.totalChapters.toString() || "0",
            icon: BookOpen,
            color: "text-green-500",
          },
        ]
      : []),
  ];
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-medium text-foreground">ภาพรวม</h1>
        <p className="text-sm text-muted-foreground mt-1">
          สถิติและข้อมูลสำคัญ
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {displayStats.map((stat) => (
          <div
            key={stat.label}
            className="p-5 rounded-xl bg-card border border-border shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
                <p className="text-2xl font-semibold text-foreground mt-1">
                  {stat.value}
                </p>
              </div>
              <div className={`p-2.5 rounded-lg bg-accent ${stat.color}`}>
                <stat.icon className="w-5 h-5" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <a
          href="/writer/comics"
          className="p-6 rounded-xl bg-card border border-border shadow-sm hover:border-orange-500/30 hover:shadow-md transition-all group">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-orange-500/10 flex items-center justify-center">
              <FileText className="w-6 h-6 text-orange-500" />
            </div>
            <div>
              <h3 className="font-medium text-foreground group-hover:text-orange-600 transition-colors">
                จัดการมังงะ
              </h3>
              <p className="text-sm text-muted-foreground mt-0.5">
                เพิ่ม แก้ไข หรือลบมังงะ
              </p>
            </div>
          </div>
        </a>

        <a
          href="/admin/commission"
          className="p-6 rounded-xl bg-card border border-border shadow-sm hover:border-green-500/30 hover:shadow-md transition-all group">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-green-500/10 flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-green-500" />
            </div>
            <div>
              <h3 className="font-medium text-foreground group-hover:text-green-600 transition-colors">
                คอมมิชชั่น
              </h3>
              <p className="text-sm text-muted-foreground mt-0.5">
                จัดการรายการคอมมิชชั่น
              </p>
            </div>
          </div>
        </a>
      </div>
    </div>
  );
}
