"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ArrowRight, ChevronLeft, ChevronRight, Home, Reply } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { th } from "date-fns/locale";

type Page = {
  id: number;
  pageNo: number;
  imageUrl: string;
};

type Comment = {
  id: number;
  content: string;
  createdAt: string;
  user: {
    id: number;
    name: string;
    email: string;
    avatarUrl: string | null;
  };
  replies: Comment[];
  _count: {
    replies: number;
  };
};

type Chapter = {
  id: number;
  title: string;
  number: number;
  slug: string;
  manga: {
    id: number;
    title: string;
    slug: string;
  };
  pages: Page[];
  _count: {
    comments: number;
  };
};

type ChapterNav = {
  id: number;
  number: number;
  slug: string;
  title: string;
} | null;

export default function ChapterReaderPage() {
  const params = useParams();
  const slug = params.slug as string;

  const [chapter, setChapter] = useState<Chapter | null>(null);
  const [loading, setLoading] = useState(true);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [showPages, setShowPages] = useState(false);
  const [nextChapter, setNextChapter] = useState<ChapterNav>(null);
  const [prevChapter, setPrevChapter] = useState<ChapterNav>(null);

  useEffect(() => {
    if (slug) {
      fetchChapter();
    }
  }, [slug]);

  const fetchChapter = async () => {
    try {
      setLoading(true);
      setShowPages(false); // Reset showPages when loading new chapter
      const response = await fetch(`/api/chapters/slug/${slug}`);
      const data = await response.json();

      if (data.success && data.data?.chapter) {
        setChapter(data.data.chapter);
        setNextChapter(data.data.nextChapter || null);
        setPrevChapter(data.data.prevChapter || null);
        // Fetch comments after chapter is loaded
        if (data.data.chapter.id) {
          fetchComments(data.data.chapter.id);
        }
        // Show pages after 2-3 seconds
        setTimeout(() => {
          setShowPages(true);
        }, 2500);
      } else {
        // Handle error
        console.error("Chapter not found");
      }
    } catch (error) {
      console.error("Failed to fetch chapter:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchComments = async (chapterId: number) => {
    try {
      setLoadingComments(true);
      const response = await fetch(`/api/chapters/${chapterId}/comments`);
      const data = await response.json();

      if (data.success && data.data?.comments) {
        setComments(data.data.comments);
      }
    } catch (error) {
      console.error("Failed to fetch comments:", error);
    } finally {
      setLoadingComments(false);
    }
  };

  function formatThaiDate(dateString: string): string {
    try {
      const date = new Date(dateString);
      return format(date, "d MMM yyyy", { locale: th });
    } catch (error) {
      return dateString;
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  if (!chapter || chapter.pages.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">ไม่พบตอนนี้</p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            กลับหน้าแรก
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header - Sticky และแยกจากกรอบตอน แต่ความกว้างขนานกัน */}
      <div className="sticky top-0 z-50 bg-background/80 backdrop-blur-md">
        <div className="w-full max-w-4xl mx-auto border-b border-border"></div>
        <div 
          className="w-full max-w-4xl mx-auto border-l-2 border-r-2 border-black dark:border-gray-800 bg-muted/20"
          style={{
            padding: '8px' // padding เท่ากับกรอบตอนและรูป
          }}
        >
          <div className="px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Link
                  href="/"
                  className="p-2 hover:bg-muted rounded-lg transition-colors">
                  <Home className="w-5 h-5" />
                </Link>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Link href="/comic" className="hover:text-foreground transition-colors">
                    การ์ตูน
                  </Link>
                  <span>/</span>
                  <Link href={`/comic/${chapter.manga.slug}`} className="hover:text-foreground transition-colors truncate max-w-[200px]">
                    {chapter.manga.title}
                  </Link>
                  <span>/</span>
                  <span className="text-foreground">เนื้อหา</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {prevChapter ? (
                  <Link
                    href={`/comic/chapter/${prevChapter.slug}`}
                    className="p-2 hover:bg-muted rounded-lg transition-colors">
                    <ChevronLeft className="w-5 h-5" />
                  </Link>
                ) : (
                  <button
                    disabled
                    className="p-2 opacity-50 cursor-not-allowed rounded-lg">
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                )}
                {nextChapter ? (
                  <Link
                    href={`/comic/chapter/${nextChapter.slug}`}
                    className="p-2 hover:bg-muted rounded-lg transition-colors">
                    <ChevronRight className="w-5 h-5" />
                  </Link>
                ) : (
                  <button
                    disabled
                    className="p-2 opacity-50 cursor-not-allowed rounded-lg">
                    <ChevronRight className="w-5 h-5" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Reader - All Pages */}
      <div className="w-full">
        <div className="flex flex-col items-center">

          {/* Chapter Title - มีกรอบต่อกับ Header */}
          <div 
            className="w-full max-w-4xl mx-auto border-l-2 border-r-2 border-black dark:border-gray-800 bg-muted/20"
            style={{
              padding: '8px' // padding เท่ากับกรอบตอนและรูป
            }}
          >
            <div className="px-4 py-6 text-center">
              <h2 className="text-2xl font-semibold text-foreground">
                {chapter.title || `ตอนที่ ${chapter.number}`}
              </h2>
              {chapter.title && chapter.title.includes("(") && (
                <p className="text-muted-foreground mt-2">({chapter.title.match(/\(([^)]+)\)/)?.[1]})</p>
              )}
            </div>
          </div>

          {/* All Pages - Show after delay */}
          {showPages ? (
            <div className="w-full max-w-4xl mx-auto">
              {chapter.pages.map((page, index) => (
                <div 
                  key={page.id} 
                  className={cn(
                    "w-full border-l-2 border-r-2 border-black dark:border-gray-800 bg-muted/20",
                    // ไม่ต้องมี border-top เพราะชื่อเรื่องมี border-bottom แล้ว
                    index === chapter.pages.length - 1 && "border-b-2" // border ล่างสำหรับภาพสุดท้าย
                  )}
                  style={{
                    width: '100%',
                    maxWidth: '100%',
                    padding: '8px', // เพิ่ม padding เพื่อให้กรอบใหญ่กว่ารูปเล็กน้อย
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    position: 'relative'
                  }}
                >
                  <img
                    src={page.imageUrl}
                    alt={`Page ${page.pageNo}`}
                    className="w-full h-auto"
                    loading="lazy"
                    style={{
                      display: 'block',
                      width: '100%',
                      height: 'auto',
                      maxWidth: '100%'
                    }}
                  />
                </div>
              ))}
            </div>
          ) : (
            <div 
              className="w-full max-w-4xl mx-auto border-l-2 border-r-2 border-black dark:border-gray-800 bg-muted/20"
              style={{
                padding: '8px',
                minHeight: '400px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto mb-4"></div>
                <p className="text-muted-foreground">กำลังโหลด...</p>
              </div>
            </div>
          )}

          {/* Navigation Buttons - มีกรอบต่อกับตอน */}
          <div 
            className="w-full max-w-4xl mx-auto border-l-2 border-r-2 border-black dark:border-gray-800 bg-muted/20"
            style={{
              padding: '8px' // padding เท่ากับกรอบตอนและรูป
            }}
          >
            <div className="px-4 py-6 flex gap-4">
              {prevChapter ? (
                <Link
                  href={`/comic/chapter/${prevChapter.slug}`}
                  className="flex-1 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium text-center">
                  &lt; ตอนก่อนหน้า
                </Link>
              ) : (
                <div className="flex-1"></div>
              )}
              {nextChapter ? (
                <Link
                  href={`/comic/chapter/${nextChapter.slug}`}
                  className="flex-1 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium text-center">
                  ตอนถัดไป &gt;
                </Link>
              ) : (
                <div className="flex-1"></div>
              )}
            </div>
          </div>

          {/* Comments Section - มีกรอบต่อกับ Navigation */}
          <div 
            className="w-full max-w-4xl mx-auto border-l-2 border-r-2 border-b-2 border-black dark:border-gray-800 bg-muted/20"
            style={{
              padding: '8px' // padding เท่ากับกรอบตอนและรูป
            }}
          >
            <div className="px-4 border-t border-border pt-6 mt-6">
              <h3 className="text-xl font-semibold text-foreground mb-4">
                ความคิดเห็น ({chapter._count.comments})
              </h3>

              {loadingComments ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-orange-500"></div>
                </div>
              ) : comments.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">ยังไม่มีความคิดเห็น</p>
              ) : (
                <div className="space-y-6">
                  {comments.map((comment) => (
                    <div key={comment.id} className="flex gap-4">
                      {/* Avatar */}
                      <div className="flex-shrink-0">
                        {comment.user.avatarUrl ? (
                          <img
                            src={comment.user.avatarUrl}
                            alt={comment.user.name}
                            className="w-10 h-10 rounded-full"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-orange-500/20 flex items-center justify-center">
                            <span className="text-orange-500 font-medium">
                              {comment.user.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Comment Content */}
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-foreground">{comment.user.name}</span>
                          <span className="text-sm text-muted-foreground">
                            {formatThaiDate(comment.createdAt)}
                          </span>
                        </div>
                        <p className="text-foreground mb-2">{comment.content}</p>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <button className="flex items-center gap-1 hover:text-foreground transition-colors">
                            <Reply className="w-4 h-4" />
                            <span>ตอบกลับ ({comment._count.replies})</span>
                          </button>
                        </div>

                        {/* Replies */}
                        {comment.replies.length > 0 && (
                          <div className="mt-4 ml-4 space-y-4 border-l border-border pl-4">
                            {comment.replies.map((reply) => (
                              <div key={reply.id} className="flex gap-3">
                                <div className="flex-shrink-0">
                                  {reply.user.avatarUrl ? (
                                    <img
                                      src={reply.user.avatarUrl}
                                      alt={reply.user.name}
                                      className="w-8 h-8 rounded-full"
                                    />
                                  ) : (
                                    <div className="w-8 h-8 rounded-full bg-orange-500/20 flex items-center justify-center">
                                      <span className="text-orange-500 text-sm font-medium">
                                        {reply.user.name.charAt(0).toUpperCase()}
                                      </span>
                                    </div>
                                  )}
                                </div>
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className="font-medium text-foreground text-sm">{reply.user.name}</span>
                                    <span className="text-xs text-muted-foreground">
                                      {formatThaiDate(reply.createdAt)}
                                    </span>
                                  </div>
                                  <p className="text-foreground text-sm">{reply.content}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
