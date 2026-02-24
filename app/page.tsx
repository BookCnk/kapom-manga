import Navigation from "@/components/navigation";
import Footer from "@/components/footer";
import { Clock, TrendingUp, Heart } from "lucide-react";

import { homeData } from "@/lib/mock/homeData";

import FeaturedHero from "@/components/home/FeaturedHero";
import SectionHeader from "@/components/home/SectionHeader";
import MangaGrid from "@/components/home/MangaGrid";
import SidebarRanking from "@/components/home/SidebarRanking";

export default function Home() {
  const { featured, latestUpdates, weeklyRanking, bestSellers, mostLiked } =
    homeData;

  return (
    <>
      <Navigation />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-8 xl:col-span-9 space-y-12">
            <FeaturedHero featured={featured} />
            <section>
              <SectionHeader
                title="อัพเดทล่าสุด"
                description="การ์ตูนตอนใหม่ที่เพิ่งอัพเดท"
                icon={Clock}
                iconClassName="text-orange-500"
                viewAllHref="/latest"
              />
              <MangaGrid
                items={latestUpdates}
                variant="scroller"
                limit={5}
                cardSize="lg"
              />
            </section>

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
