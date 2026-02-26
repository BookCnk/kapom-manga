"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { User, BookOpen, Heart, History, Settings, Camera, Eye, MessageCircle, Share2, Users, Check, Link2, X } from "lucide-react";
import { toast } from "sonner";
import { FacebookIcon } from "@/components/icons/FacebookIcon";
import { TikTokIcon } from "@/components/icons/TikTokIcon";
import Link from "next/link";
import { UserRole } from "@/lib/types/client-enums";
import { cn } from "@/lib/utils";
import { getGenreBySlug } from "@/lib/config/genres";

type ProfileUser = {
  id: number;
  email: string;
  username?: string;
  name?: string;
  bio?: string;
  facebookUrl?: string;
  tiktokUrl?: string;
  role: UserRole;
  avatarUrl?: string;
  bannerUrl?: string;
  createdAt?: string;
};

type ProfileTab = "manga";

export default function PublicProfilePage() {
  const params = useParams();
  const router = useRouter();
  const { user: currentUser } = useAuth();
  const [profileUser, setProfileUser] = useState<ProfileUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    bookmarks: 0,
    likes: 0,
    chaptersRead: 0,
  });
  const [mangas, setMangas] = useState<any[]>([]);
  const [showShareModal, setShowShareModal] = useState(false);
  const [copied, setCopied] = useState(false);

  const username = params?.username as string;
  const [activeTab, setActiveTab] = useState<ProfileTab>("manga");

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        // ถ้า username เป็นตัวเลข (ID) หรือ username จริง ให้เรียก API
        const token = localStorage.getItem("session_token");
        const apiUrl = `/api/users/profile/${encodeURIComponent(username)}`;
        console.log("Fetching profile from:", apiUrl);
        
        const res = await fetch(apiUrl, {
          headers: token ? { "x-session-token": token } : {},
        });

        console.log("Profile API response status:", res.status);

        if (!res.ok) {
          const errorJson = await res.json().catch(() => ({}));
          console.error("Profile API error:", errorJson);
          
          if (res.status === 404) {
            // แสดงข้อความว่าไม่พบผู้ใช้แทนการ redirect
            setLoading(false);
            return;
          }
          throw new Error(errorJson.error || "Failed to fetch profile");
        }

        const json = await res.json();
        console.log("Profile API response:", json);
        
        if (json.success && json.data?.user) {
          setProfileUser(json.data.user);
          setStats({
            bookmarks: json.data.stats?.bookmarks || 0,
            likes: json.data.stats?.likes || 0,
            chaptersRead: json.data.stats?.chaptersRead || 0,
          });
          setMangas(json.data.mangas || []);
        } else {
          console.error("Invalid profile response:", json);
        }
      } catch (error) {
        console.error("Failed to fetch profile:", error);
      } finally {
        setLoading(false);
      }
    };

    if (username) {
      fetchProfile();
    } else {
      setLoading(false);
    }
  }, [username]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500" />
      </div>
    );
  }

  if (!profileUser) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-medium text-foreground mb-4">
            ไม่พบผู้ใช้
          </h1>
          <Link
            href="/"
            className="px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors">
            กลับหน้าหลัก
          </Link>
        </div>
      </div>
    );
  }

  const getRoleLabel = (role: UserRole) => {
    switch (role) {
      case UserRole.ADMIN:
        return "ผู้ดูแลระบบ";
      case UserRole.TRANSLATOR:
        return "นักแปล";
      default:
        return "ผู้ใช้ทั่วไป";
    }
  };

  const getRoleColor = (role: UserRole) => {
    switch (role) {
      case UserRole.ADMIN:
        return "bg-red-500/10 text-red-400 border-red-500/20";
      case UserRole.TRANSLATOR:
        return "bg-blue-500/10 text-blue-400 border-blue-500/20";
      default:
        return "bg-zinc-800 text-zinc-200 border-zinc-700";
    }
  };

  const isOwnProfile = currentUser?.id === profileUser.id;

  const profileUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/profile/${profileUser.username || profileUser.id}`;
  const shareTitle = `${profileUser.name || profileUser.username || "ผู้ใช้ RTN"} - RTN`;
  const shareText = `ดูโปรไฟล์ของ ${profileUser.name || profileUser.username || "ผู้ใช้ RTN"} บน RTN`;

  const handleShareFacebook = () => {
    const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(profileUrl)}`;
    window.open(url, "_blank", "width=600,height=400");
    setShowShareModal(false);
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(profileUrl);
      setCopied(true);
      toast.success("คัดลอกลิงก์โปรไฟล์แล้ว");
      setTimeout(() => {
        setCopied(false);
        setShowShareModal(false);
      }, 1500);
    } catch {
      // Fallback for older browsers
      const textArea = document.createElement("textarea");
      textArea.value = profileUrl;
      textArea.style.position = "fixed";
      textArea.style.opacity = "0";
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      setCopied(true);
      toast.success("คัดลอกลิงก์โปรไฟล์แล้ว");
      setTimeout(() => {
        setCopied(false);
        setShowShareModal(false);
      }, 1500);
    }
  };

  const displayName = profileUser.name || profileUser.username || "ผู้ใช้ RTN";
  const displayId = profileUser.username || profileUser.id.toString();
  const followersCount = 0; // TODO: Add followers system
  const followingCount = 0; // TODO: Add following system

  return (
    <div className="flex-1 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-8">
        {/* Banner + Profile wrapper */}
        <div className="relative">
          {/* Banner */}
          <div className="relative w-full h-40 sm:h-48 md:h-52 rounded-xl overflow-hidden bg-gradient-to-r from-zinc-900 via-zinc-800 to-zinc-900">
            {profileUser.bannerUrl ? (
              <img
                src={profileUser.bannerUrl}
                alt="Profile banner"
                className="absolute inset-0 w-full h-full object-cover object-center"
              />
            ) : (
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_#f97316_0,_transparent_45%),_radial-gradient(circle_at_bottom,_#6366f1_0,_transparent_45%)] opacity-70" />
            )}
            {!profileUser.bannerUrl && (
              <div className="absolute inset-0 flex items-center justify-center px-4">
                <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-orange-500 to-red-600 drop-shadow-[0_0_8px_rgba(239,68,68,0.5)] uppercase tracking-wider text-center break-words max-w-full">
                  {displayName.toUpperCase()}
                </h1>
              </div>
            )}
          </div>

          {/* Avatar - ทับซ้อน banner */}
          <div className="absolute left-6 sm:left-8 bottom-0 translate-y-1/2 z-20">
            <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full border-4 border-background bg-zinc-900 overflow-hidden flex items-center justify-center text-3xl font-semibold text-orange-400 shadow-xl">
              {profileUser.avatarUrl ? (
                <img
                  src={profileUser.avatarUrl}
                  alt={displayName}
                  className="w-full h-full object-cover"
                />
              ) : (
                displayName.charAt(0).toUpperCase()
              )}
            </div>
          </div>
        </div>

        {/* Profile Info - ใต้ banner */}
        <div className="bg-card rounded-b-xl border-x border-b border-border shadow-lg px-4 sm:px-6 md:px-8 pt-16 sm:pt-[72px] pb-4">
          {/* Name & Actions row */}
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <h1 className="text-xl sm:text-2xl font-bold text-foreground truncate">
                {displayName}
              </h1>
              <p className="text-sm text-muted-foreground">
                (@{displayId})
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {isOwnProfile && (
                <Link
                  href="/settings"
                  className="px-4 py-1.5 rounded-lg bg-orange-500 hover:bg-orange-600 text-sm font-medium text-white transition-colors">
                  ตั้งค่า
                </Link>
              )}
              <button
                type="button"
                onClick={() => setShowShareModal(true)}
                className="p-2 rounded-lg bg-muted hover:bg-muted/80 text-foreground transition-colors"
                title="แชร์โปรไฟล์"
              >
                <Share2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Stats & Social */}
          <div className="mt-3 flex items-center gap-3 sm:gap-4 text-sm text-muted-foreground flex-wrap">
            <span className="flex items-center gap-1">
              <Users className="w-4 h-4" />
              <strong className="text-foreground">{followersCount}</strong> ผู้ติดตาม
            </span>
            <span className="flex items-center gap-1">
              <strong className="text-foreground">{followingCount}</strong> กำลังติดตาม
            </span>
            {profileUser.facebookUrl && (
              <a
                href={profileUser.facebookUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="p-1.5 rounded-full hover:bg-muted transition-colors"
                title="Facebook"
              >
                <FacebookIcon className="w-4 h-4 text-[#1877F2]" />
              </a>
            )}
            {profileUser.tiktokUrl && (
              <a
                href={profileUser.tiktokUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="p-1.5 rounded-full hover:bg-muted transition-colors"
                title="TikTok"
              >
                <TikTokIcon className="w-4 h-4 text-black dark:text-white" />
              </a>
            )}
          </div>

          {/* Bio */}
          {profileUser.bio && (
            <p className="mt-2 text-sm text-muted-foreground">
              {profileUser.bio}
            </p>
          )}
        </div>

        {/* Tabs */}
        <div className="mt-6 border-b border-border flex items-center gap-6 text-sm">
          <button
            type="button"
            onClick={() => setActiveTab("manga")}
            className={cn(
              "pb-2 border-b-2 -mb-px transition-colors flex items-center gap-2",
              activeTab === "manga"
                ? "border-orange-500 text-foreground font-medium"
                : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            <BookOpen className="w-4 h-4" />
            การ์ตูน ({mangas.length})
          </button>
        </div>

        {/* Manga List Section */}
        {activeTab === "manga" && mangas.length > 0 && (
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              {mangas.map((manga) => {
                const genreSlugs: string[] = Array.isArray(manga.genreSlugs)
                  ? (manga.genreSlugs as string[])
                  : [];
                const genres = genreSlugs
                  .map((slug) => getGenreBySlug(slug))
                  .filter((g) => g !== undefined);

                const formatViews = (v: number) => {
                  if (v >= 1_000_000)
                    return `${(v / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
                  if (v >= 1_000)
                    return `${(v / 1_000).toFixed(1).replace(/\.0$/, "")}K`;
                  return String(v);
                };

                return (
                  <Link
                    key={manga.id}
                    href={`/comic/${manga.slug}`}
                    className="group block bg-card border border-border rounded-xl overflow-hidden hover:border-orange-500/30 hover:shadow-md transition-all">
                    <div className="flex gap-4 p-4">
                      {/* Cover */}
                      <div className="relative w-20 h-28 sm:w-24 sm:h-32 shrink-0 rounded-lg overflow-hidden bg-muted">
                        {manga.coverUrl ? (
                          <img
                            src={manga.coverUrl}
                            alt={manga.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-muted/80 text-muted-foreground text-xs">
                            No Image
                          </div>
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0 space-y-2">
                        <div>
                          <h3 className="text-base sm:text-lg font-semibold text-foreground line-clamp-2 group-hover:text-orange-400 transition-colors">
                            {manga.title}
                            {manga.originalTitle && (
                              <span className="text-sm text-muted-foreground ml-1">
                                {manga.originalTitle}
                              </span>
                            )}
                          </h3>
                        </div>

                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span className="text-orange-400 font-medium">
                            {displayName}
                          </span>
                          {genres.length > 0 && (
                            <>
                              <span>•</span>
                              <span className="truncate">
                                {genres.slice(0, 2).map((g) => g?.name).join(" x ")}
                              </span>
                            </>
                          )}
                        </div>

                        {manga.description && (
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {manga.description}
                          </p>
                        )}

                        <div className="flex items-center gap-4 text-xs text-muted-foreground pt-1">
                          <span>{manga._count?.chapters || 0}</span>
                          <span className="flex items-center gap-1">
                            <Eye className="w-3 h-3" />
                            {formatViews(manga.views || 0)}
                          </span>
                          <span className="flex items-center gap-1">
                            <MessageCircle className="w-3 h-3" />
                            {manga._count?.comments || 0}
                          </span>
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
          </div>
        )}

        {/* Empty state */}
        {activeTab === "manga" && mangas.length === 0 && (
          <div className="mt-6 bg-card rounded-xl border border-border p-6">
            <h2 className="text-lg font-semibold text-foreground mb-4">
              ยังไม่มีการ์ตูนเผยแพร่
            </h2>
            <p className="text-sm text-muted-foreground">
              ผู้ใช้คนนี้ยังไม่ได้เผยแพร่การ์ตูนบนแพลตฟอร์ม RTN
            </p>
          </div>
        )}
      </div>

      {/* Share Modal */}
      {showShareModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowShareModal(false)}
          />
          
          {/* Modal */}
          <div className="relative bg-card border border-border rounded-2xl shadow-2xl w-full max-w-sm p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-4 pb-4 border-b border-border">
              <h2 className="text-lg font-semibold text-foreground">แชร์เนื้อหานี้</h2>
              <button
                type="button"
                onClick={() => setShowShareModal(false)}
                className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Share Options */}
            <div className="flex items-center justify-center gap-4">
              {/* Facebook */}
              <button
                type="button"
                onClick={handleShareFacebook}
                className="flex flex-col items-center gap-2 p-4 rounded-xl bg-[#1877F2] hover:bg-[#166FE5] transition-colors group"
              >
                <div className="w-12 h-12 rounded-lg bg-white/10 flex items-center justify-center group-hover:bg-white/20 transition-colors">
                  <FacebookIcon className="w-7 h-7 text-white" />
                </div>
                <span className="text-sm font-medium text-white">Facebook</span>
              </button>

              {/* Copy Link */}
              <button
                type="button"
                onClick={handleCopyLink}
                className={cn(
                  "flex flex-col items-center gap-2 p-4 rounded-xl transition-colors",
                  copied
                    ? "bg-green-500 hover:bg-green-600"
                    : "bg-purple-500 hover:bg-purple-600"
                )}
              >
                <div className={cn(
                  "w-12 h-12 rounded-lg flex items-center justify-center transition-colors",
                  copied
                    ? "bg-white/10 group-hover:bg-white/20"
                    : "bg-white/10 group-hover:bg-white/20"
                )}>
                  {copied ? (
                    <Check className="w-7 h-7 text-white" />
                  ) : (
                    <Link2 className="w-7 h-7 text-white" />
                  )}
                </div>
                <span className="text-sm font-medium text-white">
                  {copied ? "คัดลอกแล้ว" : "คัดลอกลิงก์"}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
