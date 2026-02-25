"use client";

import Footer from "@/components/footer";
import { Clock, TrendingUp, Heart } from "lucide-react";
import { useEffect, useState } from "react";
import type { MangaCard } from "@/lib/mock/homeData";
import LatestUpdatesList from "@/components/home/LatestUpdatesList";
import FeaturedHero from "@/components/home/FeaturedHero";
import SectionHeader from "@/components/home/SectionHeader";
import MangaGrid from "@/components/home/MangaGrid";
import SidebarRanking from "@/components/home/SidebarRanking";

type HomePageData = {
  featured: MangaCard[];
  latestUpdates: MangaCard[];
  weeklyRanking: MangaCard[];
  bestSellers: MangaCard[];
  mostLiked: MangaCard[];
};

export default function Home() {
  const [data, setData] = useState<HomePageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await fetch("/api/home");
        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || "Failed to fetch home data");
        }

        if (result.success && result.data) {
          setData(result.data);
        } else {
          throw new Error("Invalid response format");
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
        console.error("Error fetching home data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <>
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  if (error || !data) {
    return (
      <>
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <p className="text-muted-foreground">
                {error || "ไม่สามารถโหลดข้อมูลได้"}
              </p>
            </div>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  const { featured, latestUpdates, weeklyRanking, bestSellers, mostLiked } = data;

  return (
    <>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-8 xl:col-span-9 space-y-12">
            <FeaturedHero featured={featured} />
            <section>
              <SectionHeader
                title="ขายดีประจำสัปดาห์"
                description="การ์ตูนขายดีที่สุดในสัปดาห์นี้"
                icon={TrendingUp}
                iconClassName="text-orange-500"
                viewAllHref="/bestsellers"
              />
              <MangaGrid
                items={bestSellers}
                variant="scroller"
                limit={5}
                cardSize="lg"
              />
            </section>
            <section>
              <SectionHeader
                title="ผู้คนชื่นชอบประจำสัปดาห์"
                description="การ์ตูนที่ได้รับความนิยมสูงสุดจากผู้อ่าน"
                icon={Heart}
                iconClassName="text-rose-500"
                viewAllHref="/most-liked"
              />
              <MangaGrid
                items={mostLiked}
                variant="scroller"
                limit={5}
                cardSize="lg"
              />
            </section>
            <section>
              <SectionHeader
                title="อัพเดทล่าสุด"
                description="การ์ตูนตอนใหม่ที่เพิ่งอัพเดท"
                icon={Clock}
                iconClassName="text-orange-500"
                viewAllHref="/latest"
              />
              <LatestUpdatesList items={latestUpdates} limit={12} />
            </section>
          </div>

          <aside className="lg:col-span-4 xl:col-span-3 space-y-6">
            <SidebarRanking items={weeklyRanking} />
          </aside>
        </div>
      </main>

      <Footer />
    </>
  );
}
