"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import dynamic from "next/dynamic";
import AuthGuard from "@/components/writer/AuthGuard";
import {
  mockMangaStats,
  getMockRevenueData,
  type MangaStats,
  type RevenueData,
} from "@/lib/mock/writerStats";

// Dynamically import recharts to avoid SSR issues
const RevenueChart = dynamic(
  () => import("recharts").then((mod) => {
    const { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } = mod;
    return ({ data }: { data: Array<{ day: number; sales: number }> }) => {
      const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
          return (
            <div className="bg-card border border-border rounded-lg shadow-lg p-3 z-50 backdrop-blur-sm">
              <p className="text-sm font-medium text-foreground mb-1">
                วันที่ {label}
              </p>
              <p className="text-sm text-muted-foreground">
                ยอดขาย: <span className="font-semibold text-orange-500">{payload[0].value.toLocaleString("th-TH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ReadCoin</span>
              </p>
            </div>
          );
        }
        return null;
      };

      return (
        <ResponsiveContainer width="100%" height="100%">
          <BarChart 
            data={data} 
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            style={{ pointerEvents: "none" }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis
              dataKey="day"
              tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
              tickFormatter={(value) => `วันที่ ${value}`}
              label={{ value: "วันที่", position: "insideBottom", offset: -5, style: { fill: "hsl(var(--foreground))" } }}
            />
            <YAxis
              tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
              label={{ value: "ยอดขาย (ReadCoin)", angle: -90, position: "insideLeft", style: { fill: "hsl(var(--foreground))" } }}
            />
            <Tooltip 
              content={<CustomTooltip />}
              cursor={false}
              allowEscapeViewBox={{ x: false, y: false }}
            />
            <Bar 
              dataKey="sales" 
              fill="#f97316"
              radius={[4, 4, 0, 0]}
              style={{ pointerEvents: "none" }}
            />
          </BarChart>
        </ResponsiveContainer>
      );
    };
  }),
  { ssr: false }
);

// Use mock data for testing - set to false to use real API
const USE_MOCK_DATA = false;

// Constants for year range
const getCurrentYearBE = () => new Date().getFullYear() + 543;
const FIRST_YEAR_BE = 2567; // First year when coins were received (adjust as needed)

export default function WriterOverviewPage() {
  const { user } = useAuth();
  const [mangaStats, setMangaStats] = useState<MangaStats | null>(null);
  const [revenueData, setRevenueData] = useState<RevenueData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  // Use Buddhist Era (พ.ศ.) - current year + 543
  const [selectedYear, setSelectedYear] = useState(getCurrentYearBE());

  useEffect(() => {
    const fetchData = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);

        if (USE_MOCK_DATA) {
          // Use mock data for testing
          await new Promise((resolve) => setTimeout(resolve, 500)); // Simulate loading
          setMangaStats(mockMangaStats);
          // Convert BE year to AD year for mock data function
          const yearAD = selectedYear - 543;
          setRevenueData(getMockRevenueData(selectedMonth, yearAD));
          setLoading(false);
          return;
        }

        // Fetch from API
        const sessionToken = localStorage.getItem("session_token") || localStorage.getItem("sessionToken") || "";

        // Initialize with default values
        let mangaData: MangaStats | null = null;
        let revenue: RevenueData | null = null;

        // Fetch stats
        try {
          const statsResponse = await fetch("/api/writer/stats", {
            headers: { "x-session-token": sessionToken },
          });
          
          if (statsResponse.ok) {
            const statsData = await statsResponse.json();
            if (statsData.success) {
              mangaData = statsData.data.manga;
            }
          } else {
            console.error("Stats API error:", statsResponse.status, await statsResponse.text());
          }
        } catch (error) {
          console.error("Failed to fetch stats:", error);
        }

        // Fetch revenue
        try {
          // Convert BE year to AD year for API
          const yearAD = selectedYear - 543;
          const revenueResponse = await fetch(
            `/api/writer/revenue?month=${selectedMonth}&year=${yearAD}`,
            {
              headers: { "x-session-token": sessionToken },
            },
          );
          
          if (revenueResponse.ok) {
            const revenueResult = await revenueResponse.json();
            if (revenueResult.success) {
              revenue = revenueResult.data;
            }
          } else {
            console.error("Revenue API error:", revenueResponse.status, await revenueResponse.text());
          }
        } catch (error) {
          console.error("Failed to fetch revenue:", error);
        }

        // Set data (use defaults if API failed)
        setMangaStats(mangaData || {
          stories: 0,
          episodes: 0,
          views: 0,
          likes: 0,
          bookmarks: 0,
          comments: 0,
          totalSales: 0,
        });
        
        // Set revenue with default empty data
        if (!revenue) {
          const yearAD = selectedYear - 543;
          const daysInMonth = new Date(yearAD, selectedMonth, 0).getDate();
          const emptySales: Record<number, number> = {};
          for (let day = 1; day <= daysInMonth; day++) {
            emptySales[day] = 0;
          }
          revenue = {
            dailySales: emptySales,
            totalSalesThisMonth: 0,
            totalSalesAllTime: 0,
          };
        }
        setRevenueData(revenue);
      } catch (error) {
        console.error("Failed to fetch data:", error);
        // Set default values on error
        setMangaStats({
          stories: 0,
          episodes: 0,
          views: 0,
          likes: 0,
          bookmarks: 0,
          comments: 0,
          totalSales: 0,
        });
        const yearAD = selectedYear - 543;
        const daysInMonth = new Date(yearAD, selectedMonth, 0).getDate();
        const emptySales: Record<number, number> = {};
        for (let day = 1; day <= daysInMonth; day++) {
          emptySales[day] = 0;
        }
        setRevenueData({
          dailySales: emptySales,
          totalSalesThisMonth: 0,
          totalSalesAllTime: 0,
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user, selectedMonth, selectedYear]);

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toLocaleString();
  };

  const formatCurrency = (num: number) => {
    return num.toLocaleString("th-TH", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  // Prepare chart data
  const chartData = revenueData
    ? Object.entries(revenueData.dailySales).map(([day, sales]) => ({
        day: parseInt(day),
        sales,
      }))
    : [];

  const months = [
    "มกราคม",
    "กุมภาพันธ์",
    "มีนาคม",
    "เมษายน",
    "พฤษภาคม",
    "มิถุนายน",
    "กรกฎาคม",
    "สิงหาคม",
    "กันยายน",
    "ตุลาคม",
    "พฤศจิกายน",
    "ธันวาคม",
  ];

  // Generate years from first year (BE) to current year (BE)
  const currentYearBE = getCurrentYearBE();
  const years = Array.from(
    { length: currentYearBE - FIRST_YEAR_BE + 1 },
    (_, i) => FIRST_YEAR_BE + i
  ).reverse(); // Reverse to show current year first

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  return (
    <AuthGuard>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-medium text-foreground">ภาพรวมบัญชี</h1>
        </div>

      {/* Manga Overview */}
      <div className="bg-card border border-border rounded-xl p-6">
        <h2 className="text-lg font-medium text-foreground mb-4">ข้อมูลภาพรวมการ์ตูน</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
          <div>
            <p className="text-sm text-muted-foreground">จำนวนเรื่อง</p>
            <p className="text-xl font-semibold text-foreground mt-1">
              {mangaStats?.stories || 0}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">จำนวนตอน</p>
            <p className="text-xl font-semibold text-foreground mt-1">
              {mangaStats?.episodes || 0}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">จำนวนยอดวิว</p>
            <p className="text-xl font-semibold text-foreground mt-1">
              {formatNumber(mangaStats?.views || 0)}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">จำนวนยอดคนชื่นชอบ</p>
            <p className="text-xl font-semibold text-foreground mt-1">
              {formatNumber(mangaStats?.likes || 0)}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">จำนวนยอด Bookmark</p>
            <p className="text-xl font-semibold text-foreground mt-1">
              {formatNumber(mangaStats?.bookmarks || 0)}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">จำนวนยอด Comments</p>
            <p className="text-xl font-semibold text-foreground mt-1">
              {formatNumber(mangaStats?.comments || 0)}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">ยอดขายรวม</p>
            <p className="text-xl font-semibold text-foreground mt-1">
              {formatNumber(mangaStats?.totalSales || 0)}
            </p>
          </div>
        </div>
      </div>

      {/* Revenue Data */}
      <div className="bg-card border border-border rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-medium text-foreground">ข้อมูลรายได้</h2>
          <div className="flex items-center gap-4">
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
              className="px-3 py-2 border border-border rounded-lg bg-background text-foreground">
              {months.map((month, index) => (
                <option key={index} value={index + 1}>
                  {month}
                </option>
              ))}
            </select>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              className="px-3 py-2 border border-border rounded-lg bg-background text-foreground">
              {years.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>
        </div>

        <h3 className="text-md font-medium text-foreground mb-4">
          ข้อมูลยอดการขายรายเดือนทั้งหมด
        </h3>

        <div className="h-80 mb-6 pointer-events-none">
          <RevenueChart data={chartData} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
          <div>
            <p className="text-sm text-muted-foreground">รวมยอดขายเฉพาะรายเดือน</p>
            <p className="text-2xl font-semibold text-foreground mt-1">
              {formatCurrency(revenueData?.totalSalesThisMonth || 0)}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">รวมยอดขายทั้งหมดของบัญชี</p>
            <p className="text-2xl font-semibold text-foreground mt-1">
              {formatCurrency(revenueData?.totalSalesAllTime || 0)}
            </p>
          </div>
        </div>
      </div>
      </div>
    </AuthGuard>
  );
}