"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  Settings,
  User,
  Camera,
  Bookmark,
  History,
  Shield,
  RotateCcw,
  Check,
  X,
} from "lucide-react";
import { FacebookIcon } from "@/components/icons/FacebookIcon";
import { TikTokIcon } from "@/components/icons/TikTokIcon";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import * as nsfwjs from "nsfwjs";
import { checkInappropriateContent } from "@/lib/utils/content-filter";

type Tab = "profile" | "account";

export default function SettingsPage() {
  const { user, loading: authLoading, updateUser } = useAuth();

  const [activeTab, setActiveTab] = useState<Tab>("profile");
  const [saving, setSaving] = useState(false);

  const [displayName, setDisplayName] = useState("");
  const [savedDisplayName, setSavedDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [facebookUrl, setFacebookUrl] = useState("");
  const [tiktokUrl, setTiktokUrl] = useState("");
  const [facebookUrlValid, setFacebookUrlValid] = useState<boolean | null>(null);
  const [tiktokUrlValid, setTiktokUrlValid] = useState<boolean | null>(null);

  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [displayNameError, setDisplayNameError] = useState<string | null>(null);
  const [bioError, setBioError] = useState<string | null>(null);
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const [bannerError, setBannerError] = useState<string | null>(null);
  const [passwordCurrentError, setPasswordCurrentError] = useState<string | null>(
    null,
  );
  const [passwordNewError, setPasswordNewError] = useState<string | null>(null);
  const [passwordConfirmError, setPasswordConfirmError] = useState<
    string | null
  >(null);
  const [usernameNewError, setUsernameNewError] = useState<string | null>(null);
  const [usernamePasswordError, setUsernamePasswordError] = useState<
    string | null
  >(null);
  const [changingPassword, setChangingPassword] = useState(false);
  const [changingUsername, setChangingUsername] = useState(false);

  const formatSignupDate = (iso?: string) => {
    if (!iso) return "-";
    try {
      const date = new Date(iso);
      if (Number.isNaN(date.getTime())) return "-";
      return date.toLocaleDateString("th-TH", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
    } catch {
      return "-";
    }
  };
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);
  const [nsfwModel, setNsfwModel] = useState<any>(null);
  const [checkingNsfw, setCheckingNsfw] = useState(false);

  // Validation functions
  const validateFacebookUrl = (url: string): boolean => {
    if (!url.trim()) return false;
    try {
      const urlObj = new URL(url);
      const hostname = urlObj.hostname.toLowerCase();
      return (
        hostname === "facebook.com" ||
        hostname === "www.facebook.com" ||
        hostname === "m.facebook.com" ||
        hostname.endsWith(".facebook.com")
      );
    } catch {
      return false;
    }
  };

  const validateTikTokUrl = (url: string): boolean => {
    if (!url.trim()) return false;
    try {
      const urlObj = new URL(url);
      const hostname = urlObj.hostname.toLowerCase();
      return (
        hostname === "tiktok.com" ||
        hostname === "www.tiktok.com" ||
        hostname === "vm.tiktok.com" ||
        hostname.endsWith(".tiktok.com")
      );
    } catch {
      return false;
    }
  };

  // Validate URLs when they change
  useEffect(() => {
    if (facebookUrl.trim()) {
      setFacebookUrlValid(validateFacebookUrl(facebookUrl));
    } else {
      setFacebookUrlValid(null);
    }
  }, [facebookUrl]);

  useEffect(() => {
    if (tiktokUrl.trim()) {
      setTiktokUrlValid(validateTikTokUrl(tiktokUrl));
    } else {
      setTiktokUrlValid(null);
    }
  }, [tiktokUrl]);

  useEffect(() => {
    if (user) {
      // ให้ชื่อที่แสดงใช้ลำดับ: name > username > local-part ของอีเมล
      const baseName =
        user.name || user.username || user.email.split("@")[0];
      setDisplayName(baseName);
      setSavedDisplayName(baseName);
      if (user.bio !== undefined) {
        setBio(user.bio || "");
      }
      if (user.facebookUrl !== undefined) {
        const fbUrl = user.facebookUrl || "";
        setFacebookUrl(fbUrl);
        if (fbUrl.trim()) {
          setFacebookUrlValid(validateFacebookUrl(fbUrl));
        }
      }
      if (user.tiktokUrl !== undefined) {
        const ttUrl = user.tiktokUrl || "";
        setTiktokUrl(ttUrl);
        if (ttUrl.trim()) {
          setTiktokUrlValid(validateTikTokUrl(ttUrl));
        }
      }
      if (!bannerPreview && user.bannerUrl) {
        setBannerPreview(user.bannerUrl);
      }
    }
  }, [user, bannerPreview]);

  useEffect(() => {
    const loadModel = async () => {
      try {
        const model = await nsfwjs.load();
        setNsfwModel(model);
      } catch (error) {
        console.error("Failed to load NSFW model for profile images:", error);
      }
    };
    loadModel();
  }, []);

  const handleImageChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    type: "avatar" | "banner",
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // เคลียร์ error เดิมของรูปที่เกี่ยวข้อง
    if (type === "avatar") {
      setAvatarError(null);
    } else {
      setBannerError(null);
    }

    const reader = new FileReader();
    reader.onloadend = async () => {
      const dataUrl = reader.result as string;

      if (nsfwModel) {
        try {
          setCheckingNsfw(true);
          const img = new Image();
          img.src = dataUrl;
          await new Promise((resolve, reject) => {
            img.onload = () => resolve(null);
            img.onerror = reject;
          });

          const predictions = await nsfwModel.classify(img);
          const pornScore =
            predictions.find((p: any) => p.className === "Porn")
              ?.probability || 0;
          const hentaiScore =
            predictions.find((p: any) => p.className === "Hentai")
              ?.probability || 0;
          const sexyScore =
            predictions.find((p: any) => p.className === "Sexy")
              ?.probability || 0;

          const nsfwScore = Math.max(pornScore, hentaiScore);

          if (nsfwScore > 0.5 || sexyScore > 0.7) {
            toast.error(
              <span>
                ไม่สามารถใช้รูปนี้ได้ เนื่องจากตรวจพบเนื้อหา{" "}
                <span className="text-red-500 font-semibold hover:text-red-400">
                  18+
                </span>{" "}
                หรือไม่เหมาะสม
              </span>,
            );
            if (type === "avatar") {
              setAvatarPreview(null);
              setAvatarFile(null);
              setAvatarError("ตรวจพบเนื้อหา 18+ หรือไม่เหมาะสมในรูปโปรไฟล์");
              if (avatarInputRef.current) avatarInputRef.current.value = "";
              // แสดงกรอบแดงชั่วคราว 2.5 วินาที
              setTimeout(() => setAvatarError(null), 2500);
            } else {
              setBannerPreview(null);
              setBannerFile(null);
              setBannerError("ตรวจพบเนื้อหา 18+ หรือไม่เหมาะสมในรูปปก");
              if (bannerInputRef.current) bannerInputRef.current.value = "";
              // แสดงกรอบแดงชั่วคราว 2.5 วินาที
              setTimeout(() => setBannerError(null), 2500);
            }
            setCheckingNsfw(false);
            return;
          }
        } catch (error) {
          console.error("NSFW check failed for profile image:", error);
        } finally {
          setCheckingNsfw(false);
        }
      }

      if (type === "avatar") {
        setAvatarPreview(dataUrl);
        setAvatarFile(file);
      } else {
        setBannerPreview(dataUrl);
        setBannerFile(file);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      setSaving(true);
      const token = localStorage.getItem("session_token");
      if (!token) {
        toast.error("กรุณาเข้าสู่ระบบใหม่อีกครั้ง");
        return;
      }

      // รีเซ็ต error เดิม
      setDisplayNameError(null);
      setBioError(null);

      // ชื่อต้องไม่ว่าง
      if (!displayName.trim()) {
        setDisplayNameError("กรุณากรอกชื่อที่แสดง");
        toast.error("กรุณากรอกชื่อที่แสดง");
        return;
      }

      // ตรวจคำต้องห้ามในชื่อที่แสดง
      const nameCheck = checkInappropriateContent(displayName);
      if (nameCheck.isInappropriate) {
        const message = (
          <span>
            ไม่สามารถใช้ชื่อที่แสดงนี้ได้ เนื่องจากมีคำ{" "}
            <span className="text-red-500 font-semibold hover:text-red-400">
              18+
            </span>{" "}
            หรือคำต้องห้าม
          </span>
        );
        setDisplayNameError("ไม่สามารถใช้ชื่อที่แสดงนี้ได้ เนื่องจากมีคำ 18+ หรือคำต้องห้าม");
        toast.error(message);
        // แสดงกรอบแดงชั่วคราว 2.5 วินาที
        setTimeout(() => setDisplayNameError(null), 2500);
        return;
      }

      // ตรวจคำต้องห้ามในช่อง "เกี่ยวกับคุณ"
      if (bio.trim()) {
        const bioCheck = checkInappropriateContent(bio);
        if (bioCheck.isInappropriate) {
          const message = (
            <span>
              ไม่สามารถใช้ข้อความในช่องเกี่ยวกับคุณได้ เนื่องจากมีคำ{" "}
              <span className="text-red-500 font-semibold">
                18+
              </span>{" "}
              หรือคำต้องห้าม
            </span>
          );
          setBioError("ไม่สามารถใช้ข้อความนี้ได้ เนื่องจากมีคำ 18+ หรือคำต้องห้าม");
          toast.error(message);
          // แสดงกรอบแดงชั่วคราว 2.5 วินาที
          setTimeout(() => setBioError(null), 2500);
          return;
        }
      }

      // ตรวจสอบ URL validation
      if (facebookUrl.trim() && !validateFacebookUrl(facebookUrl)) {
        toast.error("กรุณาใส่ลิงก์ Facebook ที่ถูกต้อง");
        return;
      }

      if (tiktokUrl.trim() && !validateTikTokUrl(tiktokUrl)) {
        toast.error("กรุณาใส่ลิงก์ TikTok ที่ถูกต้อง");
        return;
      }

      let avatarUrl = user.avatarUrl || null;
      let bannerUrl = user.bannerUrl || null;

      // Upload avatar if changed
      if (avatarFile) {
        const form = new FormData();
        form.append("file", avatarFile);
        form.append("folder", "avatars");

        const res = await fetch("/api/uploads/profile", {
          method: "POST",
          headers: {
            "x-session-token": token,
          },
          body: form,
        });
        const json = await res.json();
        if (!res.ok || !json.success || !json.data?.url) {
          toast.error(json.error || "อัปโหลดรูปโปรไฟล์ไม่สำเร็จ");
          return;
        }
        avatarUrl = json.data.url as string;
      }

      // Upload banner if changed
      if (bannerFile) {
        const form = new FormData();
        form.append("file", bannerFile);
        form.append("folder", "profile-banners");

        const res = await fetch("/api/uploads/profile", {
          method: "POST",
          headers: {
            "x-session-token": token,
          },
          body: form,
        });
        const json = await res.json();
        if (!res.ok || !json.success || !json.data?.url) {
          toast.error(json.error || "อัปโหลดรูปปกไม่สำเร็จ");
          return;
        }
        bannerUrl = json.data.url as string;
      }

      const profileRes = await fetch("/api/account/profile", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-session-token": token,
        },
        body: JSON.stringify({
          name: displayName,
          bio: bio.trim() || null,
          facebookUrl: facebookUrl.trim() || null,
          tiktokUrl: tiktokUrl.trim() || null,
          avatarUrl,
          bannerUrl,
        }),
      });
      const profileJson = await profileRes.json();
      if (!profileRes.ok || !profileJson.success) {
        toast.error(profileJson.error || "บันทึกข้อมูลโปรไฟล์ไม่สำเร็จ");
        return;
      }

      if (profileJson.data?.user) {
        updateUser(profileJson.data.user);
      } else {
        updateUser({ name: displayName, avatarUrl: avatarUrl || undefined, bannerUrl: bannerUrl || undefined });
      }

      // อัปเดตชื่อที่แสดงด้านบนหลังจากบันทึกสำเร็จเท่านั้น
      setSavedDisplayName(displayName);

      toast.success("บันทึกข้อมูลโปรไฟล์สำเร็จ");
    } catch (error) {
      console.error(error);
      toast.error("เกิดข้อผิดพลาดในการบันทึกข้อมูล");
    } finally {
      setSaving(false);
    }
  };

  if (authLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500" />
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
            className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
          >
            เข้าสู่ระบบ
          </Link>
        </div>
      </div>
    );
  }

  const avatarLetter =
    avatarPreview ||
    user.avatarUrl ||
    user.name?.charAt(0)?.toUpperCase() ||
    user.email.charAt(0).toUpperCase();

  return (
    <div className="flex-1 bg-background">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl sm:text-3xl font-semibold text-foreground flex items-center gap-2">
              <Settings className="w-6 h-6 text-orange-500" />
              การตั้งค่า
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              จัดการโปรไฟล์และบัญชี RTN ของคุณ
            </p>
          </div>
        </div>

        {/* Cover + Avatar */}
        <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
          <div
            className={cn(
              "relative h-40 sm:h-52 md:h-60 bg-gradient-to-r from-zinc-900 via-zinc-800 to-zinc-900",
              bannerError && "ring-2 ring-red-500",
            )}
          >
            {bannerPreview ? (
              <img
                src={bannerPreview}
                alt="Profile banner"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_#f97316_0,_transparent_45%),_radial-gradient(circle_at_bottom,_#6366f1_0,_transparent_45%)] opacity-70" />
            )}

            {/* Banner camera */}
            <button
              type="button"
              onClick={() => bannerInputRef.current?.click()}
              className="absolute right-4 bottom-4 flex items-center gap-1 px-3 py-1.5 rounded-full bg-black/60 text-xs text-white hover:bg-black/80 transition-colors"
            >
              <Camera className="w-4 h-4" />
              เปลี่ยนรูปปก
            </button>
            <input
              ref={bannerInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => handleImageChange(e, "banner")}
            />
          </div>

          {/* Avatar & basic info */}
          <div className="px-6 sm:px-8 pt-4 pb-5 -mt-8 sm:-mt-10 flex flex-col sm:flex-row sm:items-end gap-3">
            <div className="relative">
              <div
                className={cn(
                  "w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 rounded-full border-[3px] bg-zinc-900/90 overflow-hidden flex items-center justify-center text-xl sm:text-2xl font-semibold text-orange-400 shadow-lg",
                  avatarError
                    ? "border-red-500"
                    : "border-background",
                )}
              >
                {typeof avatarLetter === "string" ? (
                  avatarPreview || user.avatarUrl ? (
                    <img
                      src={avatarLetter as string}
                      alt={displayName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    avatarLetter
                  )
                ) : null}
              </div>
              <button
                type="button"
                onClick={() => avatarInputRef.current?.click()}
                className="absolute bottom-1 right-1 p-1.5 rounded-full bg-orange-500 text-white hover:bg-orange-600 shadow-md"
              >
                <Camera className="w-4 h-4" />
              </button>
              <input
                ref={avatarInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => handleImageChange(e, "avatar")}
              />
            </div>

            <div className="flex-1 min-w-0 space-y-1">
              <h2 className="text-lg sm:text-xl font-semibold text-foreground truncate">
                {savedDisplayName || displayName}
              </h2>
              {user.username && (
                <div className="flex items-center gap-2 text-xs sm:text-[13px] text-muted-foreground">
                  <span className="truncate">@{user.username}</span>
                </div>
              )}
              <div className="flex flex-wrap items-center gap-2 text-[11px] sm:text-xs text-muted-foreground mt-1">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-orange-500/10 text-orange-400">
                  <User className="w-3 h-3" />
                  โปรไฟล์ผู้ใช้ RTN
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-200">
                  <Bookmark className="w-3 h-3" />
                  บุ๊คมาร์ค 0 เรื่อง
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-200">
                  <History className="w-3 h-3" />
                  อ่านแล้ว 0 ตอน
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-border flex items-center gap-4 text-sm">
          <button
            type="button"
            onClick={() => setActiveTab("profile")}
            className={cn(
              "pb-2 border-b-2 -mb-px transition-colors",
              activeTab === "profile"
                ? "border-orange-500 text-foreground font-medium"
                : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            ข้อมูลผู้ใช้
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("account")}
            className={cn(
              "pb-2 border-b-2 -mb-px transition-colors",
              activeTab === "account"
                ? "border-orange-500 text-foreground font-medium"
                : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            บัญชีผู้ใช้
          </button>
        </div>

        {activeTab === "profile" ? (
          <form
            onSubmit={handleSave}
            className="grid grid-cols-1 lg:grid-cols-3 gap-6"
          >
            {/* Left: profile fields */}
            <div className="lg:col-span-2 space-y-6">
              {/* Display name & bio */}
              <div className="bg-card border border-border rounded-xl p-5 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    ชื่อที่แสดง
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={displayName}
                      onChange={(e) => {
                        setDisplayNameError(null);
                        setDisplayName(e.target.value);
                      }}
                      maxLength={50}
                      className={cn(
                        "w-full px-4 py-2.5 pr-12 rounded-lg border bg-background text-foreground text-sm focus:outline-none focus:ring-2",
                        displayNameError
                          ? "border-red-500 focus:ring-red-500/30 focus:border-red-500"
                          : "border-border focus:ring-orange-500/20 focus:border-orange-500/50",
                      )}
                      placeholder="ชื่อที่จะแสดงต่อสาธารณะ"
                    />
                    {displayName !== savedDisplayName && (
                      <button
                        type="button"
                        onClick={() => {
                          setDisplayNameError(null);
                          setDisplayName(savedDisplayName);
                        }}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-md hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                        title="กลับชื่อเดิม"
                      >
                        <RotateCcw className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  <div className="flex items-center justify-between mt-1">
                    {displayNameError && (
                      <p className="text-xs text-red-500">{displayNameError}</p>
                    )}
                    <p className="text-[11px] text-muted-foreground ml-auto">
                      {displayName.length}/50
                    </p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    เกี่ยวกับคุณ
                  </label>
                  <textarea
                    value={bio}
                    onChange={(e) => {
                      setBioError(null);
                      setBio(e.target.value);
                    }}
                    maxLength={500}
                    rows={4}
                    className={cn(
                      "w-full px-4 py-2.5 rounded-lg border bg-background text-sm text-foreground resize-none focus:outline-none focus:ring-2",
                      bioError
                        ? "border-red-500 focus:ring-red-500/30 focus:border-red-500"
                        : "border-border focus:ring-orange-500/20 focus:border-orange-500/50",
                    )}
                    placeholder="เขียนแนะนำตัวเล็กน้อยเพื่อให้ผู้อ่านรู้จักคุณมากขึ้น"
                  />
                  {bioError && (
                    <p className="mt-1 text-xs text-red-500">{bioError}</p>
                  )}
                  <p className="text-[11px] text-muted-foreground mt-1 text-right">
                    {bio.length}/500
                  </p>
                </div>
              </div>

              {/* Social links */}
              <div className="bg-card border border-border rounded-xl p-5 space-y-4">
                <h2 className="text-sm font-medium text-foreground">
                  ลิงก์โซเชียลของคุณ
                </h2>
                <p className="text-xs text-muted-foreground">
                  เพิ่มช่องทางให้ผู้อ่านติดตามคุณบนแพลตฟอร์มอื่น ๆ
                </p>

                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-[#1877F2]/10 flex items-center justify-center text-[#1877F2]">
                      <FacebookIcon className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <label className="text-xs font-medium text-foreground">
                        ลิงก์ Facebook ของคุณ
                      </label>
                      <div className="relative mt-1">
                        <input
                          type="url"
                          value={facebookUrl}
                          onChange={(e) => setFacebookUrl(e.target.value)}
                          placeholder="https://www.facebook.com/yourpage"
                          className={cn(
                            "w-full px-3 py-2 pr-9 rounded-lg border bg-background text-xs text-foreground focus:outline-none focus:ring-2 transition-colors",
                            facebookUrlValid === true
                              ? "border-green-500 focus:ring-green-500/20 focus:border-green-500"
                              : facebookUrlValid === false
                              ? "border-red-500 focus:ring-red-500/20 focus:border-red-500"
                              : "border-border focus:ring-orange-500/20 focus:border-orange-500/50"
                          )}
                        />
                        {facebookUrl.trim() && facebookUrlValid !== null && (
                          <div
                            className={cn(
                              "absolute right-2 top-1/2 -translate-y-1/2",
                              facebookUrlValid ? "text-green-500" : "text-red-500"
                            )}
                          >
                            {facebookUrlValid ? (
                              <Check className="w-4 h-4" />
                            ) : (
                              <X className="w-4 h-4" />
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-black/10 dark:bg-white/10 flex items-center justify-center text-black dark:text-white">
                      <TikTokIcon className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <label className="text-xs font-medium text-foreground">
                        ลิงก์ TikTok ของคุณ
                      </label>
                      <div className="relative mt-1">
                        <input
                          type="url"
                          value={tiktokUrl}
                          onChange={(e) => setTiktokUrl(e.target.value)}
                          placeholder="https://www.tiktok.com/@username"
                          className={cn(
                            "w-full px-3 py-2 pr-9 rounded-lg border bg-background text-xs text-foreground focus:outline-none focus:ring-2 transition-colors",
                            tiktokUrlValid === true
                              ? "border-green-500 focus:ring-green-500/20 focus:border-green-500"
                              : tiktokUrlValid === false
                              ? "border-red-500 focus:ring-red-500/20 focus:border-red-500"
                              : "border-border focus:ring-orange-500/20 focus:border-orange-500/50"
                          )}
                        />
                        {tiktokUrl.trim() && tiktokUrlValid !== null && (
                          <div
                            className={cn(
                              "absolute right-2 top-1/2 -translate-y-1/2",
                              tiktokUrlValid ? "text-green-500" : "text-red-500"
                            )}
                          >
                            {tiktokUrlValid ? (
                              <Check className="w-4 h-4" />
                            ) : (
                              <X className="w-4 h-4" />
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: account summary & actions */}
            <div className="space-y-4">
              <div className="bg-card border border-border rounded-xl p-5 space-y-3">
                <h2 className="text-sm font-medium text-foreground mb-1">
                  สรุปบัญชีผู้ใช้
                </h2>
                <div className="space-y-2 text-xs text-muted-foreground">
                  <div className="flex items-center justify-between">
                    <span>อีเมล</span>
                    <span className="text-foreground">{user.email}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>ระดับผู้ใช้</span>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-zinc-800 text-[11px] text-zinc-100">
                      <Shield className="w-3 h-3" />
                      ผู้ใช้ทั่วไป
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>วันที่สมัคร</span>
                    <span className="text-foreground">
                      {formatSignupDate(user.createdAt)}
                    </span>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={saving || (facebookUrl.trim() && facebookUrlValid === false) || (tiktokUrl.trim() && tiktokUrlValid === false)}
                className="w-full h-11 rounded-lg bg-gradient-to-r from-orange-500 to-orange-600 text-sm font-medium text-white shadow-lg shadow-orange-500/20 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {saving ? "กำลังบันทึก..." : "บันทึกข้อมูล"}
              </button>
            </div>
          </form>
        ) : (
          <div className="space-y-8">
            {/* Change password */}
            <form
              className="bg-card border border-border rounded-xl p-6 space-y-4"
              onSubmit={async (e) => {
                e.preventDefault();
                if (changingPassword) return;
                setPasswordCurrentError(null);
                setPasswordNewError(null);
                setPasswordConfirmError(null);
                const form = e.currentTarget as HTMLFormElement;
                const formData = new FormData(form);
                const currentPassword = String(
                  formData.get("currentPassword") || "",
                );
                const newPassword = String(formData.get("newPassword") || "");
                const confirmPassword = String(
                  formData.get("confirmPassword") || "",
                );

                let hasError = false;

                if (!currentPassword) {
                  setPasswordCurrentError("กรุณากรอกรหัสผ่านเดิม");
                  hasError = true;
                }
                if (!newPassword) {
                  setPasswordNewError("กรุณากรอกรหัสผ่านใหม่");
                  hasError = true;
                } else if (newPassword.length < 8) {
                  setPasswordNewError("รหัสผ่านใหม่ต้องมีอย่างน้อย 8 ตัวอักษร");
                  hasError = true;
                }
                if (!confirmPassword) {
                  setPasswordConfirmError("กรุณากรอกยืนยันรหัสผ่านใหม่");
                  hasError = true;
                } else if (newPassword && confirmPassword !== newPassword) {
                  setPasswordConfirmError("รหัสผ่านใหม่และยืนยันรหัสผ่านไม่ตรงกัน");
                  hasError = true;
                }

                if (hasError) {
                  toast.error("กรุณาตรวจสอบข้อมูลรหัสผ่าน");
                  // เคลียร์กรอบแดงหลัง 2.5 วิ เพื่อให้ hover เตือนแค่ชั่วคราว
                  setTimeout(() => {
                    setPasswordCurrentError(null);
                    setPasswordNewError(null);
                    setPasswordConfirmError(null);
                  }, 2500);
                  return;
                }

                try {
                  setChangingPassword(true);
                  const token =
                    localStorage.getItem("session_token") || undefined;
                  const res = await fetch("/api/account/change-password", {
                    method: "POST",
                    headers: {
                      "Content-Type": "application/json",
                      ...(token ? { "x-session-token": token } : {}),
                    },
                    body: JSON.stringify({
                      currentPassword,
                      newPassword,
                      confirmPassword,
                    }),
                  });

                  const json = await res.json();
                  if (!res.ok || !json.success) {
                    const message: string = json.error || "ไม่สามารถเปลี่ยนรหัสผ่านได้";

                    // ถ้า API บอกว่ารหัสผ่านเดิมไม่ถูกต้อง ให้ขึ้น hover แดงที่ช่องรหัสผ่านเดิม
                    if (message.includes("รหัสผ่านเดิมไม่ถูกต้อง")) {
                      setPasswordCurrentError("รหัสผ่านเดิมไม่ถูกต้อง");
                      setTimeout(() => setPasswordCurrentError(null), 2500);
                    }

                    toast.error(message);
                    return;
                  }

                  toast.success("เปลี่ยนรหัสผ่านสำเร็จ");
                  form.reset();
                } catch (error) {
                  console.error(error);
                  toast.error("เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์");
                } finally {
                  setChangingPassword(false);
                }
              }}
            >
              <div>
                <h2 className="text-sm font-medium text-foreground mb-1">
                  เปลี่ยนรหัสผ่าน
                </h2>
                <p className="text-xs text-muted-foreground">
                  แนะนำให้ใช้รหัสผ่านที่คาดเดาได้ยาก ผสมตัวอักษร ตัวเลข และอักขระพิเศษ
                  อย่างน้อย 8 ตัวอักษร
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                <div>
                  <label className="block mb-1 text-foreground">
                    รหัสผ่านใหม่
                  </label>
                  <input
                    name="newPassword"
                    type="password"
                    onChange={(e) => {
                      setPasswordNewError(null);
                    }}
                    className={cn(
                      "w-full px-3 py-2 rounded-lg border bg-background focus:outline-none focus:ring-2",
                      passwordNewError
                        ? "border-red-500 focus:ring-red-500/30 focus:border-red-500"
                        : "border-border focus:ring-orange-500/20 focus:border-orange-500/50",
                    )}
                    placeholder="รหัสผ่านใหม่"
                  />
                  {passwordNewError && (
                    <p className="mt-1 text-xs text-red-500">
                      {passwordNewError}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block mb-1 text-foreground">
                    ยืนยันรหัสผ่านใหม่
                  </label>
                  <input
                    name="confirmPassword"
                    type="password"
                    onChange={(e) => {
                      setPasswordConfirmError(null);
                    }}
                    className={cn(
                      "w-full px-3 py-2 rounded-lg border bg-background focus:outline-none focus:ring-2",
                      passwordConfirmError
                        ? "border-red-500 focus:ring-red-500/30 focus:border-red-500"
                        : "border-border focus:ring-orange-500/20 focus:border-orange-500/50",
                    )}
                    placeholder="ยืนยันรหัสผ่านใหม่"
                  />
                  {passwordConfirmError && (
                    <p className="mt-1 text-xs text-red-500">
                      {passwordConfirmError}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block mb-1 text-foreground">
                    รหัสผ่านเดิม
                  </label>
                  <input
                    name="currentPassword"
                    type="password"
                    onChange={(e) => {
                      setPasswordCurrentError(null);
                    }}
                    className={cn(
                      "w-full px-3 py-2 rounded-lg border bg-background focus:outline-none focus:ring-2",
                      passwordCurrentError
                        ? "border-red-500 focus:ring-red-500/30 focus:border-red-500"
                        : "border-border focus:ring-orange-500/20 focus:border-orange-500/50",
                    )}
                    placeholder="รหัสผ่านเดิม"
                  />
                  {passwordCurrentError && (
                    <p className="mt-1 text-xs text-red-500">
                      {passwordCurrentError}
                    </p>
                  )}
                </div>
              </div>

              <p className="text-[11px] text-amber-400 bg-amber-500/10 border border-amber-500/40 rounded-lg px-3 py-2 flex items-start gap-2">
                <span className="mt-0.5">⚠</span>
                <span>
                  ข้อแนะนำ : ควรตั้งรหัสผ่านให้คาดเดาได้ยาก โดยผสมตัวอักษร ตัวเลข
                  และอักขระพิเศษอย่างน้อย 8 ตัวอักษร พร้อมทั้งเก็บรักษารหัสผ่านไว้เป็นความลับ
                  ห้ามเผยแพร่หรือแบ่งปันให้ผู้อื่นทราบ และควรหลีกเลี่ยงการใช้รหัสผ่านเดียวกันกับเว็บไซต์หรือบริการอื่น ๆ
                  เพื่อความปลอดภัยของบัญชีผู้ใช้งานของคุณ!
                </span>
              </p>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={changingPassword}
                  className={cn(
                    "px-5 py-2 rounded-lg text-sm font-medium transition-colors",
                    changingPassword
                      ? "bg-orange-400 text-white opacity-70 cursor-not-allowed"
                      : "bg-orange-500 text-white hover:bg-orange-600",
                  )}
                >
                  {changingPassword ? "กำลังเปลี่ยน..." : "เปลี่ยนรหัสผ่าน"}
                </button>
              </div>
            </form>

            {/* Change username */}
            <form
              className="bg-card border border-border rounded-xl p-6 space-y-4"
              onSubmit={async (e) => {
                e.preventDefault();
                if (changingUsername) return;
                setUsernameNewError(null);
                setUsernamePasswordError(null);
                const form = e.currentTarget as HTMLFormElement;
                const formData = new FormData(form);
                const newUsername = String(
                  formData.get("newUsername") || "",
                ).trim();
                const password = String(formData.get("password") || "");

                let hasError = false;
                if (!newUsername) {
                  setUsernameNewError("กรุณากรอกชื่อผู้ใช้งานใหม่");
                  hasError = true;
                } else if (newUsername.length < 3 || newUsername.length > 30) {
                  setUsernameNewError("ชื่อผู้ใช้งานต้องมีความยาว 3-30 ตัวอักษร");
                  hasError = true;
                } else if (!/^[A-Za-z]+$/.test(newUsername)) {
                  setUsernameNewError(
                    "ชื่อผู้ใช้งานต้องเป็นตัวอักษรภาษาอังกฤษ (A-Z, a-z) เท่านั้น",
                  );
                  hasError = true;
                }
                if (!password) {
                  setUsernamePasswordError("กรุณากรอกรหัสผ่านเพื่อยืนยัน");
                  hasError = true;
                }

                if (hasError) {
                  toast.error("กรุณาตรวจสอบข้อมูลชื่อผู้ใช้งาน");
                  setTimeout(() => {
                    setUsernameNewError(null);
                    setUsernamePasswordError(null);
                  }, 2500);
                  return;
                }

                const usernameCheck = checkInappropriateContent(newUsername);
                if (usernameCheck.isInappropriate) {
                  toast.error(
                    <span>
                      ไม่สามารถใช้ชื่อผู้ใช้งานนี้ได้ เนื่องจากมีคำ{" "}
                      <span className="text-red-500 font-semibold hover:text-red-400">
                        18+
                      </span>{" "}
                      หรือคำต้องห้าม
                    </span>,
                  );
                  return;
                }

                try {
                  setChangingUsername(true);
                  const token =
                    localStorage.getItem("session_token") || undefined;
                  const res = await fetch("/api/account/change-username", {
                    method: "POST",
                    headers: {
                      "Content-Type": "application/json",
                      ...(token ? { "x-session-token": token } : {}),
                    },
                    body: JSON.stringify({ newUsername, password }),
                  });

                  const json = await res.json();
                  if (!res.ok || !json.success) {
                    const message: string =
                      json.error || "ไม่สามารถเปลี่ยนชื่อผู้ใช้ได้";

                    // ถ้ารหัสผ่านผิด ให้ขึ้น hover แดงที่ช่องรหัสผ่านเพื่อยืนยัน
                    if (message.includes("รหัสผ่านไม่ถูกต้อง")) {
                      setUsernamePasswordError("รหัสผ่านไม่ถูกต้อง");
                      setTimeout(() => setUsernamePasswordError(null), 2500);
                    }

                    toast.error(message);
                    return;
                  }

                  // อัปเดตข้อมูลผู้ใช้ใน AuthContext ให้ username ปัจจุบันเป็น realtime
                  if (json.data?.user) {
                    updateUser(json.data.user);
                  } else {
                    updateUser({ username: newUsername });
                  }

                  toast.success("เปลี่ยนชื่อผู้ใช้สำเร็จ");
                  form.reset();
                } catch (error) {
                  console.error(error);
                  toast.error("เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์");
                } finally {
                  setChangingUsername(false);
                }
              }}
            >
              <div>
                <h2 className="text-sm font-medium text-foreground mb-1">
                  เปลี่ยนชื่อผู้ใช้งาน (Username)
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                <div>
                  <label className="block mb-1 text-foreground">
                    ชื่อผู้ใช้งานปัจจุบัน
                  </label>
                  <input
                    type="text"
                    value={user.username || "-"}
                    disabled
                    className="w-full px-3 py-2 rounded-lg border border-border bg-muted text-muted-foreground cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="block mb-1 text-foreground">
                    ชื่อผู้ใช้งานใหม่
                  </label>
                  <input
                    name="newUsername"
                    type="text"
                    onChange={() => setUsernameNewError(null)}
                    className={cn(
                      "w-full px-3 py-2 rounded-lg border bg-background focus:outline-none focus:ring-2",
                      usernameNewError
                        ? "border-red-500 focus:ring-red-500/30 focus:border-red-500"
                        : "border-border focus:ring-orange-500/20 focus:border-orange-500/50",
                    )}
                    placeholder="ชื่อผู้ใช้งานใหม่"
                  />
                  {usernameNewError && (
                    <p className="mt-1 text-xs text-red-500">
                      {usernameNewError}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block mb-1 text-foreground">
                    รหัสผ่านเพื่อยืนยัน
                  </label>
                  <input
                    name="password"
                    type="password"
                    onChange={() => setUsernamePasswordError(null)}
                    className={cn(
                      "w-full px-3 py-2 rounded-lg border bg-background focus:outline-none focus:ring-2",
                      usernamePasswordError
                        ? "border-red-500 focus:ring-red-500/30 focus:border-red-500"
                        : "border-border focus:ring-orange-500/20 focus:border-orange-500/50",
                    )}
                    placeholder="รหัสผ่านปัจจุบัน"
                  />
                  {usernamePasswordError && (
                    <p className="mt-1 text-xs text-red-500">
                      {usernamePasswordError}
                    </p>
                  )}
                </div>
              </div>

              <p className="text-[11px] text-amber-400 bg-amber-500/10 border border-amber-500/40 rounded-lg px-3 py-2 flex items-start gap-2">
                <span className="mt-0.5">⚠</span>
                <span>
                  คำเตือน : การเปลี่ยนชื่อผู้ใช้งานของคุณจะส่งผลให้ URL หน้าโปรไฟล์ของคุณเปลี่ยนไป
                  และ URL เดิมจะไม่สามารถเข้าถึงได้ โปรดระมัดระวัง
                </span>
              </p>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={changingUsername}
                  className={cn(
                    "px-5 py-2 rounded-lg text-sm font-medium transition-colors",
                    changingUsername
                      ? "bg-violet-400 text-white opacity-70 cursor-not-allowed"
                      : "bg-violet-500 text-white hover:bg-violet-600",
                  )}
                >
                  {changingUsername ? "กำลังเปลี่ยน..." : "เปลี่ยนชื่อผู้ใช้งาน"}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}

