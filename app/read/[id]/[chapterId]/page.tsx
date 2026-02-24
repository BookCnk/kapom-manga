import Link from "next/link";
import { notFound } from "next/navigation";
import Image from "next/image";
import {
  ChevronLeft,
  ChevronRight,
  Home,
  List,
  Settings,
  Maximize,
  Heart,
  Share2,
} from "lucide-react";
import Navigation from "@/components/navigation";
import Breadcrumb from "@/components/Breadcrumb";
import { contentData } from "@/lib/mock/contentData";

// Mock chapter images data
const chapterImages: Record<string, string[]> = {
  "ep-001": [
    "https://images.unsplash.com/photo-1578632767115-351597cf2477?q=80&w=800&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1612480797665-c96d261ae098?q=80&w=800&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1541562232579-515a2134cb41?q=80&w=800&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1560972550-aba3456b5564?q=80&w=800&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=800&auto=format&fit=crop",
  ],
  "ep-002": [
    "https://images.unsplash.com/photo-1618519764611-bd220fc59c5d?q=80&w=800&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?q=80&w=800&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1554188248-986adbb73be4?q=80&w=800&auto=format&fit=crop",
  ],
};

export default function ReaderPage({
  params,
}: {
  params: { id: string; chapterId: string };
}) {
  const content = contentData[params.id];

  if (!content) {
    notFound();
  }

  const images =
    chapterImages[params.chapterId] || chapterImages["ep-001"] || [];

  // Find current chapter info
  const currentChapter = content.episodes.find(
    (ep) => ep.id === params.chapterId,
  );
  const currentIndex = content.episodes.findIndex(
    (ep) => ep.id === params.chapterId,
  );
  const prevChapter =
    currentIndex > 0 ? content.episodes[currentIndex - 1] : null;
  const nextChapter =
    currentIndex < content.episodes.length - 1
      ? content.episodes[currentIndex + 1]
      : null;

  return (
    <>
      <Navigation />

      <main className="min-h-screen bg-background">
        {/* Breadcrumb */}

        {/* Reader Header */}
        <div className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
          {/* <Breadcrumb
            items={[
              { label: "การ์ตูน", href: "/manga" },
              { label: content.title, href: `/content/${content.slug}` },
              { label: currentChapter?.title || "ตอนที่ 1" },
            ]}
          /> */}
          <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                href={`/content/${content.slug}`}
                className="p-2 hover:bg-muted rounded-lg transition-colors">
                <Home className="w-5 h-5 text-muted-foreground" />
              </Link>
              <div>
                <h1 className="font-medium text-foreground text-sm sm:text-base">
                  {content.title}
                </h1>
                <p className="text-xs text-muted-foreground">
                  {currentChapter?.title || "ตอนที่ 1"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button className="p-2 hover:bg-muted rounded-lg transition-colors">
                <List className="w-5 h-5 text-muted-foreground" />
              </button>
              <button className="p-2 hover:bg-muted rounded-lg transition-colors">
                <Settings className="w-5 h-5 text-muted-foreground" />
              </button>
              <button className="p-2 hover:bg-muted rounded-lg transition-colors">
                <Maximize className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>
          </div>
        </div>

        {/* Chapter Navigation - Top */}
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between bg-card rounded-xl p-3 border border-border">
            <Link
              href={
                prevChapter ? `/read/${content.slug}/${prevChapter.id}` : "#"
              }
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                prevChapter
                  ? "hover:bg-muted text-foreground"
                  : "text-muted-foreground cursor-not-allowed"
              }`}>
              <ChevronLeft className="w-5 h-5" />
              <span className="hidden sm:inline text-sm">ตอนก่อนหน้า</span>
            </Link>

            <span className="text-sm text-muted-foreground">
              {currentIndex + 1} / {content.episodes.length}
            </span>

            <Link
              href={
                nextChapter ? `/read/${content.slug}/${nextChapter.id}` : "#"
              }
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                nextChapter
                  ? "hover:bg-muted text-foreground"
                  : "text-muted-foreground cursor-not-allowed"
              }`}>
              <span className="hidden sm:inline text-sm">ตอนถัดไป</span>
              <ChevronRight className="w-5 h-5" />
            </Link>
          </div>
        </div>

        {/* Manga Images */}
        <div className="max-w-3xl mx-auto px-4 py-6 space-y-0">
          {images.map((src, index) => (
            <div key={index} className="relative w-full">
              <Image
                src={src}
                alt={`Page ${index + 1}`}
                width={800}
                height={1200}
                className="w-full h-auto"
                priority={index === 0}
              />
            </div>
          ))}
        </div>

        {/* Chapter Navigation - Bottom */}
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="flex items-center justify-between bg-card rounded-xl p-4 border border-border">
            <Link
              href={
                prevChapter ? `/read/${content.slug}/${prevChapter.id}` : "#"
              }
              className={`flex items-center gap-3 px-5 py-3 rounded-lg transition-colors ${
                prevChapter
                  ? "hover:bg-muted text-foreground border border-border"
                  : "text-muted-foreground cursor-not-allowed"
              }`}>
              <ChevronLeft className="w-5 h-5" />
              <div className="text-left">
                <p className="text-xs text-muted-foreground">ตอนก่อนหน้า</p>
                <p className="text-sm font-medium">
                  {prevChapter?.title || "-"}
                </p>
              </div>
            </Link>

            <div className="flex items-center gap-2">
              <button className="p-3 hover:bg-muted rounded-full transition-colors">
                <Heart className="w-5 h-5 text-muted-foreground" />
              </button>
              <button className="p-3 hover:bg-muted rounded-full transition-colors">
                <Share2 className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>

            <Link
              href={
                nextChapter ? `/read/${content.slug}/${nextChapter.id}` : "#"
              }
              className={`flex items-center gap-3 px-5 py-3 rounded-lg transition-colors ${
                nextChapter
                  ? "hover:bg-muted text-foreground border border-border"
                  : "text-muted-foreground cursor-not-allowed"
              }`}>
              <div className="text-right">
                <p className="text-xs text-muted-foreground">ตอนถัดไป</p>
                <p className="text-sm font-medium">
                  {nextChapter?.title || "-"}
                </p>
              </div>
              <ChevronRight className="w-5 h-5" />
            </Link>
          </div>
        </div>

        {/* Comments Section Placeholder */}
        <div className="max-w-4xl mx-auto px-4 py-8 border-t border-border">
          <h3 className="text-lg font-medium text-foreground mb-4">
            ความคิดเห็น
          </h3>
          <div className="bg-card rounded-xl p-6 border border-border text-center">
            <p className="text-muted-foreground text-sm">ยังไม่มีความคิดเห็น</p>
          </div>
        </div>
      </main>
    </>
  );
}
