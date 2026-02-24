// rtn-manga-platform\app\content\[id]\page.tsx
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Plus, Info, List, BookOpen, Share2, ChevronDown } from "lucide-react";
import Navigation from "@/components/navigation";
import Breadcrumb from "@/components/Breadcrumb";
import { contentData, Episode } from "@/lib/mock/contentData";

function EpisodeList({ episodes }: { episodes: Episode[] }) {
  return (
    <div className="space-y-2">
      {episodes.map((ep) => (
        <div
          key={ep.id}
          className="flex items-center gap-4 p-4 rounded-xl bg-card border border-border hover:border-orange-500/50 transition-colors cursor-pointer group">
          {/* Episode Number */}
          <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center shrink-0">
            <span className="text-sm font-semibold text-muted-foreground">
              {ep.number}
            </span>
          </div>

          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-medium text-foreground group-hover:text-orange-600 transition-colors">
              {ep.title}
            </h4>
            <p className="text-xs text-muted-foreground mt-0.5">{ep.date}</p>
          </div>

          <div className="text-right shrink-0 flex items-center gap-3">
            {ep.isLocked && (
              <svg
                className="w-4 h-4 text-muted-foreground"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
            )}
            {ep.price === "Free" ? (
              <span className="text-sm font-medium text-green-600">Free</span>
            ) : (
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <svg
                  className="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                {ep.price}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

export default function ContentPage({ params }: { params: { id: string } }) {
  const content = contentData[params.id];

  if (!content) {
    notFound();
  }

  return (
    <>
      <Navigation />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Breadcrumb
          items={[
            { label: "การ์ตูน", href: "/content" },
            { label: content.title },
          ]}
        />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Side - Cover & Info (Glass Background) */}
          <div className="lg:col-span-5 xl:col-span-4 relative">
            {/* Glass Background using cover image */}
            <div className="absolute inset-0 -z-10 overflow-hidden rounded-3xl">
              <Image
                src={content.coverImage}
                alt=""
                fill
                className="object-cover scale-110 blur-3xl opacity-40 saturate-150"
                aria-hidden
              />
              <div className="absolute inset-0 bg-gradient-to-b from-background/50 via-background/80 to-background" />
            </div>

            <div className="sticky top-24">
              <div className="rounded-3xl border border-white/15 bg-white/5 backdrop-blur-xl shadow-[0_8px_30px_rgba(0,0,0,0.12)] ring-1 ring-white/10 p-5 sm:p-6 space-y-6">
                {/* Cover Image */}
                <div className="relative aspect-[3/4] rounded-2xl overflow-hidden bg-muted shadow-lg border border-white/10">
                  <Image
                    src={content.coverImage}
                    alt={content.title}
                    fill
                    className="object-cover"
                    priority
                  />

                  {/* subtle glass sheen */}
                  <div className="absolute inset-0 bg-gradient-to-b from-white/10 via-transparent to-black/10 pointer-events-none" />
                </div>

                {/* Title & Info */}
                <div className="text-center space-y-2">
                  <h1 className="text-2xl font-semibold text-foreground">
                    {content.title}
                  </h1>
                  <p className="text-sm text-muted-foreground">
                    {content.type} · {content.genre} · {content.updateSchedule}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    By {content.author}
                  </p>
                </div>

                {/* Start Reading Button (pill + circle like reference) */}
                <button className="relative w-full h-14 rounded-full bg-foreground text-background font-medium flex items-center justify-center">
                  <span>Start Reading</span>
                  <span className="absolute right-2 top-2 h-10 w-10 rounded-full bg-background/10 flex items-center justify-center">
                    <Plus className="w-5 h-5" />
                  </span>
                </button>

                {/* Action Buttons */}
                <div className="flex items-center justify-center gap-4">
                  <button className="p-3 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 backdrop-blur transition-colors">
                    <Share2 className="w-5 h-5 text-muted-foreground" />
                  </button>
                  <button className="p-3 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 backdrop-blur transition-colors">
                    <BookOpen className="w-5 h-5 text-muted-foreground" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Right Side - Details & Episodes */}
          <div className="lg:col-span-7 xl:col-span-8 space-y-6">
            {/* Tags & Info Header */}
            <div className="bg-card rounded-2xl p-5 border border-border">
              {/* Tab Buttons */}
              <div className="flex items-center justify-center gap-8 mb-4 border-b border-border pb-4">
                {/* ✅ FIX: -mb-4.5 is not a Tailwind class */}
                <button className="flex items-center gap-2 text-sm font-medium text-foreground border-b-2 border-foreground pb-4 -mb-4">
                  <List className="w-4 h-4" />
                  Episodes
                </button>
                <button className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors pb-4 -mb-4">
                  <Info className="w-4 h-4" />
                  Info
                </button>
                <button className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors pb-4 -mb-4">
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                    />
                  </svg>
                  Tickets
                </button>
              </div>

              {/* Tags */}
              <div className="flex flex-wrap gap-2 mb-4">
                {content.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-2.5 py-1 bg-muted text-muted-foreground text-xs rounded-md">
                    {tag}
                  </span>
                ))}
              </div>

              {/* Description */}
              <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3">
                {content.description}
                <button className="text-orange-600 hover:text-orange-700 ml-1 font-medium">
                  More
                </button>
              </p>
            </div>

            {/* Bulk Discount & Unlock */}
            <div className="flex items-center justify-between">
              {content.bulkDiscount && (
                <div className="flex items-center gap-2">
                  <span className="px-2 py-1 bg-purple-500/10 text-purple-600 text-xs font-medium rounded">
                    {content.bulkDiscount.percent}%
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {content.bulkDiscount.minEpisodes}+ Bulk Discount
                  </span>
                  <Info className="w-4 h-4 text-muted-foreground" />
                </div>
              )}

              <button className="px-5 py-2.5 bg-foreground text-background text-sm font-medium rounded-full hover:bg-foreground/90 transition-colors">
                Unlock All
              </button>
            </div>

            {/* Sort Dropdown */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">
                  {content.episodes.length} Episodes
                </span>
              </div>
              <button className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors">
                <span>Latest</span>
                <ChevronDown className="w-4 h-4" />
              </button>
            </div>

            {/* Episode List - Scrollable */}
            <div className="max-h-[400px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent">
              <EpisodeList episodes={content.episodes} />
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
