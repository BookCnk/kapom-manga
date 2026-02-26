"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save, Upload, X, Image as ImageIcon, Plus } from "lucide-react";
import Link from "next/link";
import { MangaStatus, Visibility } from "@/generated/prisma/enums";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import AuthGuard from "@/components/writer/AuthGuard";
import * as nsfwjs from "nsfwjs";
import { checkInappropriateContent } from "@/lib/utils/content-filter";

type Genre = {
  id: string; // slug
  slug: string;
  name: string;
  type: "main" | "sub";
};

// Generate random slug (e.g., wDmYxyBknVllzl9LqGR5)
function generateRandomSlug(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < 20; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// Check if slug exists in database
async function checkSlugExists(slug: string): Promise<boolean> {
  try {
    const response = await fetch("/api/manga/check-slug", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug }),
    });
    const data = await response.json();
    return data.success && data.data?.exists;
  } catch {
    return false;
  }
}

// Generate unique slug
async function generateUniqueSlug(): Promise<string> {
  let slug = generateRandomSlug();
  let exists = await checkSlugExists(slug);
  let attempts = 0;
  
  while (exists && attempts < 10) {
    slug = generateRandomSlug();
    exists = await checkSlugExists(slug);
    attempts++;
  }
  
  return slug;
}

export default function CreateMangaPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [genres, setGenres] = useState<Genre[]>([]);
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [coverError, setCoverError] = useState<string | null>(null);
  const [titleError, setTitleError] = useState<string | null>(null);
  const [originalTitleError, setOriginalTitleError] = useState<string | null>(null);
  const [descriptionError, setDescriptionError] = useState<string | null>(null);
  const [showAgreement, setShowAgreement] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [nsfwModel, setNsfwModel] = useState<any>(null);
  const [checkingNsfw, setCheckingNsfw] = useState(false);

  const [formData, setFormData] = useState<{
    title: string;
    slug: string;
    originalTitle: string;
    description: string;
    coverUrl: string;
    bannerUrl: string;
    status: MangaStatus;
    visibility: Visibility;
    isMature: boolean;
    contentType: string;
  }>({
    title: "",
    slug: "",
    originalTitle: "",
    description: "",
    coverUrl: "",
    bannerUrl: "",
    status: MangaStatus.ONGOING,
    visibility: Visibility.PUBLIC,
    isMature: false,
    contentType: "",
  });

  useEffect(() => {
    generateSlug();
    
    // Always show agreement modal when entering the page
    setShowAgreement(true);

    // Load NSFW model
    const loadNsfwModel = async () => {
      try {
        const model = await nsfwjs.load();
        setNsfwModel(model);
        console.log("✅ NSFW model loaded successfully");
      } catch (error) {
        console.error("❌ Failed to load NSFW model:", error);
      }
    };
    loadNsfwModel();
  }, []);

  useEffect(() => {
    const initializeGenres = async () => {
      await fetchGenres();
    };
    
    initializeGenres();
  }, []);

  // Auto-seed genres if empty
  useEffect(() => {
    const checkAndSeed = async () => {
      if (genres.length === 0) {
        try {
          console.log("🌱 No genres found, attempting to seed...");
          const seedResponse = await fetch("/api/genres/seed", { method: "POST" });
          const seedData = await seedResponse.json();
          if (seedData.success) {
            console.log("✅ Genres seeded successfully");
            await fetchGenres(); // Fetch again after seeding
          }
        } catch (error) {
          console.error("Failed to seed genres:", error);
        }
      }
    };
    
    // Wait a bit before checking to ensure fetchGenres has completed
    const timer = setTimeout(() => {
      checkAndSeed();
    }, 500);
    
    return () => clearTimeout(timer);
  }, [genres.length]);

  const generateSlug = async () => {
    const newSlug = await generateUniqueSlug();
    setFormData((prev) => ({ ...prev, slug: newSlug }));
  };

  const handleAgree = () => {
    if (agreed) {
      localStorage.setItem("content_upload_agreement_accepted", "true");
      setShowAgreement(false);
    }
  };

  const fetchGenres = async () => {
    try {
      const response = await fetch("/api/genres");
      const data = await response.json();
      console.log("Genres API response:", data);
      if (data.success && data.data?.genres) {
        const fetchedGenres = data.data.genres;
        setGenres(fetchedGenres);
        console.log("✅ Fetched genres:", fetchedGenres.length);
        console.log("Main genres:", fetchedGenres.filter((g: Genre) => !g.slug.startsWith("sub-")).length);
        console.log("Sub genres:", fetchedGenres.filter((g: Genre) => g.slug.startsWith("sub-")).length);
      } else {
        console.error("❌ Failed to fetch genres:", data);
      }
    } catch (error) {
      console.error("❌ Failed to fetch genres:", error);
    }
  };

  // อัพโหลดรูปปกไป S3
  const uploadCoverToS3 = async (file: File, previewUrl: string) => {
    try {
      setCheckingNsfw(true);
      const sessionToken = localStorage.getItem("session_token") || "";
      
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", "manga-covers");

      const response = await fetch("/api/uploads/image", {
        method: "POST",
        headers: {
          "x-session-token": sessionToken,
        },
        body: formData,
      });

      const data = await response.json();

      if (data.success && data.data?.url) {
        const s3Url = data.data.url;
        setCoverPreview(previewUrl); // ใช้ preview URL สำหรับแสดงผล
        setFormData((prev) => ({ ...prev, coverUrl: s3Url })); // เก็บ S3 URL ใน formData
        setCoverError(null);
        toast.success("อัพโหลดรูปปกสำเร็จ");
      } else {
        throw new Error(data.error || "Failed to upload cover");
      }
    } catch (error) {
      console.error("Error uploading cover to S3:", error);
      toast.error("เกิดข้อผิดพลาดในการอัพโหลดรูปปก");
      setCoverPreview(null);
      setFormData((prev) => ({ ...prev, coverUrl: "" }));
      if (fileInputRef.current) fileInputRef.current.value = "";
    } finally {
      setCheckingNsfw(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
      if (!validTypes.includes(file.type)) {
        toast.error("กรุณาอัพโหลดไฟล์ .jpg, .jpeg, .png หรือ .webp เท่านั้น");
        return;
      }
      
      // Validate file size (2MB)
      if (file.size > 2 * 1024 * 1024) {
        toast.error("ขนาดไฟล์ต้องไม่เกิน 2MB");
        return;
      }

      // Create preview first
      const reader = new FileReader();
      reader.onloadend = async () => {
        const dataUrl = reader.result as string;

        // Check for NSFW content if model is loaded
        if (nsfwModel) {
          try {
            setCheckingNsfw(true);
            const img = new Image();
            img.src = dataUrl;
            
            await new Promise((resolve) => {
              img.onload = resolve;
            });

            // Classify image
            const predictions = await nsfwModel.classify(img);
            
            // Get NSFW scores (Porn, Hentai, Sexy)
            const pornScore = predictions.find((p: any) => p.className === "Porn")?.probability || 0;
            const hentaiScore = predictions.find((p: any) => p.className === "Hentai")?.probability || 0;
            const sexyScore = predictions.find((p: any) => p.className === "Sexy")?.probability || 0;
            
            // Combined NSFW score (Porn and Hentai are strictly prohibited)
            const nsfwScore = Math.max(pornScore, hentaiScore);
            
            console.log("NSFW Detection Results:", {
              porn: pornScore,
              hentai: hentaiScore,
              sexy: sexyScore,
              nsfwScore,
              isMature: formData.isMature,
            });

            // ถ้าตรวจพบเนื้อหา 18+ → ห้ามอัพโหลดเสมอ (ไม่สนใจ isMature)
            if (nsfwScore > 0.5) {
              toast.error("กรุณาทำภาพให้ไม่เป็นเนื้อหา 18+ มากเกินไป", { duration: 2000 });
              // เคลียร์รูปออก
              setCoverPreview(null);
              setFormData((prev) => ({ ...prev, coverUrl: "" }));
              if (fileInputRef.current) fileInputRef.current.value = "";
              // แสดง hover เตือน 1-2 วินาที
              setCoverError("18+");
              setTimeout(() => {
                setCoverError(null);
              }, 2000);
              setCheckingNsfw(false);
              return;
            }

            // If sexy content detected (but not porn/hentai), show warning if not mature
            if (sexyScore > 0.7 && nsfwScore <= 0.5 && !formData.isMature) {
              toast.warning("ภาพนี้อาจมีเนื้อหาที่ไม่เหมาะสม กรุณาตรวจสอบอีกครั้ง");
            }

            // ผ่านการตรวจ NSFW → อัพโหลดไป S3
            await uploadCoverToS3(file, dataUrl);
          } catch (error) {
            console.error("Error checking NSFW content:", error);
            toast.warning("ไม่สามารถตรวจสอบเนื้อหาภาพได้ กรุณาตรวจสอบภาพด้วยตนเอง");
            setCheckingNsfw(false);
          }
        } else {
          // If model not loaded yet, block upload
          toast.warning("กำลังโหลดระบบตรวจสอบ กรุณารอสักครู่");
          if (fileInputRef.current) fileInputRef.current.value = "";
          setCheckingNsfw(false);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && tagInput.trim()) {
      e.preventDefault();
      if (tags.length < 10 && tagInput.length <= 20) {
        setTags([...tags, tagInput.trim()]);
        setTagInput("");
      }
    }
  };

  const removeTag = (index: number) => {
    setTags(tags.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // รีเซ็ต error เดิม
    setTitleError(null);
    setOriginalTitleError(null);
    setDescriptionError(null);

    // ตรวจคำต้องห้ามในชื่อเรื่อง
    const titleCheck = checkInappropriateContent(formData.title);
    if (titleCheck.isInappropriate) {
      setTitleError("ไม่สามารถใช้ได้เนื่องจากคำ 18+");
      toast.error("ไม่สามารถใช้ได้เนื่องจากคำ 18+");
      return;
    }

    // ตรวจคำต้องห้ามในชื่อเรื่องต้นฉบับ
    const originalTitleCheck = checkInappropriateContent(formData.originalTitle);
    if (originalTitleCheck.isInappropriate) {
      setOriginalTitleError("ไม่สามารถใช้ได้เนื่องจากคำ 18+");
      toast.error("ไม่สามารถใช้ได้เนื่องจากคำ 18+");
      return;
    }

    // ตรวจคำต้องห้ามในข้อมูลเบื้องต้น / เรื่องย่อ
    const descriptionCheck = checkInappropriateContent(formData.description);
    if (descriptionCheck.isInappropriate) {
      setDescriptionError("ไม่สามารถใช้ได้เนื่องจากคำ 18+");
      toast.error("ไม่สามารถใช้ได้เนื่องจากคำ 18+");
      return;
    }

    // Require cover image
    if (!coverPreview || !formData.coverUrl) {
      setCoverError("กรุณาอัพโหลดรูปปก");
      toast.error("กรุณาอัพโหลดรูปปกก่อนสร้างมังงะ");
      return;
    }

    setLoading(true);

    try {
      const sessionToken = localStorage.getItem("session_token") || localStorage.getItem("sessionToken") || "";
      
      if (!sessionToken) {
        toast.error("กรุณาเข้าสู่ระบบก่อนสร้างมังงะ");
        router.push("/login");
        return;
      }

      const response = await fetch("/api/manga", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-session-token": sessionToken,
        },
        body: JSON.stringify({
          title: formData.title,
          slug: formData.slug,
          originalTitle: formData.originalTitle || undefined,
          description: formData.description,
          coverUrl: formData.coverUrl || undefined,
          bannerUrl: formData.bannerUrl || undefined,
          status: formData.status,
          visibility: formData.visibility,
          isMature: formData.isMature,
          genreSlugs: selectedGenres,
          tags: tags,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        const errorMessage = data.error || data.message || `HTTP ${response.status}: เกิดข้อผิดพลาดในการสร้างมังงะ`;
        toast.error(errorMessage);
        console.error("Create manga error:", data);
        
        if (response.status === 401) {
          router.push("/login");
        }
        return;
      }
      
      if (data.success && data.data?.manga) {
        toast.success("สร้างเรื่องใหม่สำเร็จ", {
          description: `การ์ตูน "${formData.title}" ถูกสร้างเรียบร้อยแล้ว`,
        });
        // Delay navigation slightly to show the toast
        setTimeout(() => {
          router.push("/writer/comics");
          router.refresh();
        }, 500);
      } else {
        const errorMessage = data.error || data.message || "เกิดข้อผิดพลาดในการสร้างมังงะ";
        toast.error(errorMessage);
        console.error("Create manga error:", data);
      }
    } catch (error) {
      console.error("Failed to create manga:", error);
      toast.error("เกิดข้อผิดพลาดในการสร้างมังงะ");
    } finally {
      setLoading(false);
    }
  };

  const toggleGenre = (genreSlug: string) => {
    setSelectedGenres((prev) =>
      prev.includes(genreSlug)
        ? prev.filter((id) => id !== genreSlug)
        : [...prev, genreSlug],
    );
  };

  const mainGenres = genres.filter((g) => g.type === "main");
  const subGenres = genres.filter((g) => g.type === "sub");

  // Debug logging
  useEffect(() => {
    if (genres.length > 0) {
      console.log("📚 Total genres:", genres.length);
      console.log("📚 Main genres:", mainGenres.length, mainGenres.map((g) => g.name));
      console.log("📚 Sub genres:", subGenres.length, subGenres.map((g) => g.name));
    } else {
      console.log("⚠️ No genres loaded yet");
    }
  }, [genres]);

  return (
    <AuthGuard>
      <>
        {/* Agreement Modal */}
        {showAgreement && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={(e) => e.stopPropagation()}>
          <div 
            className="w-full max-w-2xl max-h-[90vh] mx-4 bg-card border border-border rounded-xl shadow-xl overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-border">
              <h2 className="text-xl font-semibold text-foreground">
                ข้อตกลงและเงื่อนไขการอัปโหลดเนื้อหา
              </h2>
            </div>
            <div className="flex-1 overflow-y-auto px-6 py-4">
              <div className="space-y-3 text-sm text-foreground">
                <ul className="space-y-2.5 list-disc list-inside">
                  <li>เนื้อหาที่อัปโหลดต้องเป็นผลงานต้นฉบับของผู้สร้าง ไม่ใช่การคัดลอกหรือลอกเลียนแบบผลงานของผู้อื่น</li>
                  <li>เนื้อหาที่อัปโหลดต้องไม่เป็นการหมิ่นประมาท ใส่ร้าย หรือทำให้เกิดความเสียหายต่อบุคคลที่สาม</li>
                  <li>เนื้อหาที่อัปโหลดต้องไม่ละเมิดลิขสิทธิ์ของผู้อื่น หากมีการอ้างอิงหรือใช้เนื้อหาของผู้อื่น ต้องได้รับอนุญาตและมีหลักฐานการอนุญาตที่ชัดเจน</li>
                  <li>หากมีการละเมิดลิขสิทธิ์ RTN ขอสงวนสิทธิ์ในการระงับหรือลบเนื้อหาดังกล่าว</li>
                  <li>เนื้อหาที่เคยเผยแพร่บนแพลตฟอร์มอื่นหรือในรูปแบบสิ่งพิมพ์สามารถอัปโหลดได้ หากผู้อัปโหลดมีสิทธิ์ในการเผยแพร่เนื้อหาดังกล่าว</li>
                  <li>
                    <strong>ภาพหน้าปกหรือภาพประกอบที่ห้ามใช้:</strong>
                    <ul className="ml-6 mt-1 space-y-1 list-disc">
                      <li>ภาพที่มีลิขสิทธิ์ของผู้อื่น</li>
                      <li>ภาพที่เกี่ยวข้องกับสถาบันพระมหากษัตริย์</li>
                      <li>ภาพที่แสดงกิจกรรมทางเพศ อวัยวะเพศ หัวนม หรือส่วนที่เห็นได้ชัดเจนของอวัยวะเพศผ่านเสื้อผ้า</li>
                      <li>ภาพที่แสดงความรุนแรงหรือภาพที่น่าตกใจ เช่น การทรมาน เลือด หรือศพ</li>
                      <li>ภาพที่ถูกแก้ไขเพื่อหมิ่นประมาทหรือทำร้ายบุคคลที่สาม</li>
                    </ul>
                  </li>
                  <li>RTN ขอสงวนสิทธิ์ในการปรับแต่งหรือระงับผลงานของผู้สร้าง หากมีการละเมิดข้อตกลงและเงื่อนไข</li>
                  <li>RTN จะไม่รับผิดชอบต่อการฟ้องร้องหรือความเสียหายที่เกิดจากการละเมิดข้อตกลงและเงื่อนไขของผู้สร้าง</li>
                  <li>
                    <Link href="/tos" target="_blank" className="text-orange-500 hover:text-orange-600 underline">
                      ข้อตกลงและเงื่อนไขการใช้และบริการแพลตฟอร์ม RTN
                    </Link>
                  </li>
                </ul>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-border space-y-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={agreed}
                  onChange={(e) => setAgreed(e.target.checked)}
                  className="w-4 h-4 text-orange-500 border border-border rounded focus:ring-orange-500/20"
                />
                <span className="text-sm text-foreground">ฉันยอมรับข้อตกลงและเงื่อนไขแล้ว</span>
              </label>
              <div className="flex justify-end">
                <button
                  onClick={handleAgree}
                  disabled={!agreed}
                  className={cn(
                    "px-6 py-2 rounded-lg text-sm font-medium transition-colors",
                    agreed
                      ? "bg-orange-500 text-white hover:bg-orange-600"
                      : "bg-muted text-muted-foreground cursor-not-allowed"
                  )}>
                  ตกลง
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link
            href="/writer/comics"
            className="p-2 text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-accent">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-semibold text-foreground">สร้างมังงะใหม่</h1>
            <p className="text-sm text-muted-foreground mt-1">เพิ่มผลงานมังงะใหม่ลงในระบบ</p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Cover Upload */}
          <div className="lg:col-span-1">
            <div className="bg-card rounded-xl border border-border p-6 sticky top-6">
              <label className="block text-sm font-medium text-foreground mb-3">
                อัพโหลดรูปปก <span className="text-red-500">*</span>
                {coverError && coverError !== "18+" && (
                  <span className="text-xs text-red-500 ml-2">{coverError}</span>
                )}
              </label>
              <div
                onClick={() => !checkingNsfw && fileInputRef.current?.click()}
                className={cn(
                  "relative w-full aspect-[5/7] border-2 border-dashed rounded-xl",
                  "flex flex-col items-center justify-center gap-3",
                  checkingNsfw ? "cursor-wait" : "cursor-pointer",
                  "transition-all duration-300",
                  coverPreview
                    ? "border-border"
                    : "border-muted-foreground/30 hover:border-orange-500/50 bg-muted/20",
                  coverError && "!border-red-500 !bg-red-500/10 ring-2 ring-red-500/50 shadow-lg shadow-red-500/20"
                )}>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/webp"
                  onChange={handleFileChange}
                  className="hidden"
                />
                {checkingNsfw ? (
                  <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
                    <p className="text-sm">กำลังตรวจสอบเนื้อหา...</p>
                  </div>
                ) : coverPreview ? (
                  <>
                    <img
                      src={coverPreview}
                      alt="Cover preview"
                      className="w-full h-full object-cover rounded-xl"
                    />
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setCoverPreview(null);
                        setCoverError(null);
                        setFormData((prev) => ({ ...prev, coverUrl: "" }));
                        if (fileInputRef.current) fileInputRef.current.value = "";
                      }}
                      className="absolute top-2 right-2 p-1.5 bg-black/60 hover:bg-black/80 rounded-full text-white transition-colors">
                      <X className="w-4 h-4" />
                    </button>
                    {/* 18+ warning overlay */}
                    {coverError === "18+" && (
                      <div className="absolute inset-0 bg-red-500/20 flex items-center justify-center rounded-xl">
                        <div className="bg-red-600/90 text-white px-4 py-2 rounded-lg text-sm font-medium shadow-lg">
                          ⚠️ ตรวจพบเนื้อหา 18+
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    <div className="p-3 rounded-full bg-orange-500/10">
                      <Upload className="w-8 h-8 text-orange-500" />
                    </div>
                    <div className="text-center px-4">
                      <p className="text-sm font-medium text-foreground mb-1">คลิกเพื่ออัพโหลด</p>
                      <p className="text-xs text-muted-foreground">ไฟล์นามสกุล .jpg .jpeg .png .webp</p>
                      <p className="text-xs text-muted-foreground">ขนาดไม่เกิน 2MB</p>
                    </div>
                    {/* 18+ warning overlay */}
                    {coverError === "18+" && (
                      <div className="absolute inset-0 bg-red-500/20 flex items-center justify-center rounded-xl">
                        <div className="bg-red-600/90 text-white px-4 py-2 rounded-lg text-sm font-medium shadow-lg">
                          ⚠️ ตรวจพบเนื้อหา 18+
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Right Column - Form Fields */}
          <div className="lg:col-span-2 space-y-6">
            {/* Metadata Section */}
            <div className="bg-card rounded-xl border border-border p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    ชื่อเรื่อง <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => {
                      setTitleError(null);
                      setFormData((prev) => ({ ...prev, title: e.target.value }));
                    }}
                    className={cn(
                      "w-full px-4 py-2.5 border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-orange-500/20",
                      titleError ? "border-red-500" : "border-border focus:border-orange-500/50"
                    )}
                    placeholder="ชื่อเรื่อง"
                  />
                  {titleError && (
                    <p className="mt-1 text-xs text-red-500">{titleError}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    ชื่อเรื่องต้นฉบับ <span className="text-red-500">*</span>
                    <span className="text-xs text-muted-foreground ml-2">({formData.originalTitle.length}/120)</span>
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={120}
                    value={formData.originalTitle}
                    onChange={(e) => {
                      setOriginalTitleError(null);
                      setFormData((prev) => ({ ...prev, originalTitle: e.target.value }));
                    }}
                    className={cn(
                      "w-full px-4 py-2.5 border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-orange-500/20",
                      originalTitleError ? "border-red-500" : "border-border focus:border-orange-500/50"
                    )}
                    placeholder="ชื่อเรื่องต้นฉบับ"
                  />
                  {originalTitleError && (
                    <p className="mt-1 text-xs text-red-500">{originalTitleError}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    หมวดหมู่หลัก <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <select
                      required
                      value={selectedGenres.find((id) => mainGenres.some((g) => g.slug === id)) || ""}
                      onChange={(e) => {
                        const genreSlug = e.target.value;
                        if (genreSlug) {
                          const currentMain = selectedGenres.find((id) => mainGenres.some((g) => g.slug === id));
                          setSelectedGenres([
                            ...selectedGenres.filter((id) => id !== genreSlug && id !== currentMain),
                            ...(genreSlug ? [genreSlug] : []),
                          ]);
                        }
                      }}
                      className={cn(
                        "w-full px-4 py-2.5 pr-10",
                        "border border-border rounded-lg",
                        "bg-background text-foreground",
                        "appearance-none cursor-pointer",
                        "focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500/50",
                        "hover:border-orange-500/50 transition-colors",
                        "text-sm"
                      )}>
                      <option value="" className="bg-background text-muted-foreground">เลือกหมวดหมู่หลัก</option>
                      {mainGenres.map((genre) => (
                        <option key={genre.slug} value={genre.slug} className="bg-background text-foreground">
                          {genre.name}
                        </option>
                      ))}
                    </select>
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                      <svg
                        className="w-5 h-5 text-muted-foreground"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 9l-7 7-7-7"
                        />
                      </svg>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    หมวดหมู่รอง
                  </label>
                  <div className="relative">
                    <select
                      value={selectedGenres.find((id) => subGenres.some((g) => g.slug === id)) || ""}
                      onChange={(e) => {
                        const genreSlug = e.target.value;
                        if (genreSlug) {
                          const currentSub = selectedGenres.find((id) => subGenres.some((g) => g.slug === id));
                          setSelectedGenres([
                            ...selectedGenres.filter((id) => id !== genreSlug && id !== currentSub),
                            ...(genreSlug ? [genreSlug] : []),
                          ]);
                        }
                      }}
                      className={cn(
                        "w-full px-4 py-2.5 pr-10",
                        "border border-border rounded-lg",
                        "bg-background text-foreground",
                        "appearance-none cursor-pointer",
                        "focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500/50",
                        "hover:border-orange-500/50 transition-colors",
                        "text-sm"
                      )}>
                      <option value="" disabled className="bg-background text-muted-foreground">
                        {subGenres.length === 0 ? "กำลังโหลด..." : "เลือกหมวดหมู่รอง"}
                      </option>
                      {subGenres.length === 0 ? (
                        <option value="" disabled className="bg-background text-muted-foreground">
                          ไม่มีข้อมูล กรุณา seed ข้อมูล genres
                        </option>
                      ) : (
                        subGenres.map((genre) => (
                          <option key={genre.slug} value={genre.slug} className="bg-background text-foreground">
                            {genre.name}
                          </option>
                        ))
                      )}
                    </select>
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                      <svg
                        className="w-5 h-5 text-muted-foreground"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 9l-7 7-7-7"
                        />
                      </svg>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    ระดับของเนื้อหา (Rating) <span className="text-red-500">*</span>
                  </label>
                  <select
                    required
                    value={formData.isMature ? "mature" : "general"}
                    onChange={(e) => setFormData((prev) => ({ ...prev, isMature: e.target.value === "mature" }))}
                    className="w-full px-4 py-2.5 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500/50">
                    <option value="general">ทั่วไป</option>
                    <option value="mature">18+</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    ประเภทเนื้อหา <span className="text-red-500">*</span>
                  </label>
                  <select
                    required
                    value={formData.contentType}
                    onChange={(e) => setFormData((prev) => ({ ...prev, contentType: e.target.value }))}
                    className="w-full px-4 py-2.5 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500/50">
                    <option value="">เลือกประเภทเนื้อหา</option>
                    <option value="manga">มังงะ</option>
                    <option value="manhwa">มังฮวา</option>
                    <option value="manhua">มังฮวา (จีน)</option>
                    <option value="comic">การ์ตูน</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Description Section */}
            <div className="bg-card rounded-xl border border-border p-6">
              <label className="block text-sm font-medium text-foreground mb-1">
                ข้อมูลเบื้องต้น/แนะนำเรื่อง/เรื่องย่อ
              </label>
              <p className="text-xs text-muted-foreground mb-2">
                จำกัดไม่เกิน 2000 ตัวอักษร ({formData.description.length}/2000)
              </p>
              <textarea
                value={formData.description}
                onChange={(e) => {
                  setDescriptionError(null);
                  setFormData((prev) => ({ ...prev, description: e.target.value }));
                }}
                maxLength={2000}
                rows={8}
                className={cn(
                  "w-full px-4 py-3 border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-orange-500/20 resize-none",
                  descriptionError ? "border-red-500" : "border-border focus:border-orange-500/50"
                )}
                placeholder="พิมพ์เนื้อหาตรงนี้"
              />
              {descriptionError && (
                <p className="mt-1 text-xs text-red-500">{descriptionError}</p>
              )}
            </div>

            {/* Tags Section */}
            <div className="bg-card rounded-xl border border-border p-6">
              <label className="block text-sm font-medium text-foreground mb-3">
                แท็ก
                <span className="text-xs text-muted-foreground ml-2">({tagInput.length}/20)</span>
              </label>
              <div className="space-y-3">
                <input
                  type="text"
                  maxLength={20}
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={handleTagKeyDown}
                  className="w-full px-4 py-2.5 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500/50"
                  placeholder="พิมพ์แท็กของคุณตรงนี้ และกด Enter เพื่อเพิ่มแท็ก"
                />
                {tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {tags.map((tag, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center gap-1.5 px-3 py-1 bg-orange-500/10 text-orange-600 rounded-full text-sm">
                        {tag}
                        <button
                          type="button"
                          onClick={() => removeTag(index)}
                          className="hover:text-orange-700">
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Settings Section */}
            <div className="bg-card rounded-xl border border-border p-6">
              <h3 className="text-sm font-medium text-foreground mb-4">ตั้งค่าเรื่อง</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-foreground">สถานะเรื่อง</span>
                  <button
                    type="button"
                    onClick={() => {
                      setFormData((prev) => ({
                        ...prev,
                        visibility: prev.visibility === Visibility.PUBLIC ? Visibility.PRIVATE : Visibility.PUBLIC,
                      }));
                    }}
                    className={cn(
                      "relative inline-flex h-6 w-11 items-center rounded-full transition-colors",
                      formData.visibility === Visibility.PUBLIC ? "bg-orange-500" : "bg-muted"
                    )}>
                    <span
                      className={cn(
                        "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
                        formData.visibility === Visibility.PUBLIC ? "translate-x-6" : "translate-x-1"
                      )}
                    />
                  </button>
                  <span className={cn("text-sm ml-2", formData.visibility === Visibility.PUBLIC ? "text-orange-500" : "text-muted-foreground")}>
                    {formData.visibility === Visibility.PUBLIC ? "เผยแพร่" : "ไม่เผยแพร่"}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-foreground">สถานะจบ</span>
                  <button
                    type="button"
                    onClick={() => {
                      setFormData((prev) => ({
                        ...prev,
                        status: prev.status === MangaStatus.COMPLETED ? MangaStatus.ONGOING : MangaStatus.COMPLETED,
                      }));
                    }}
                    className={cn(
                      "relative inline-flex h-6 w-11 items-center rounded-full transition-colors",
                      formData.status === MangaStatus.COMPLETED ? "bg-orange-500" : "bg-muted"
                    )}>
                    <span
                      className={cn(
                        "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
                        formData.status === MangaStatus.COMPLETED ? "translate-x-6" : "translate-x-1"
                      )}
                    />
                  </button>
                  <span className={cn("text-sm ml-2", formData.status === MangaStatus.COMPLETED ? "text-orange-500" : "text-muted-foreground")}>
                    {formData.status === MangaStatus.COMPLETED ? "จบแล้ว" : "ยังไม่จบ"}
                  </span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-4 pb-6">
              <Link
                href="/writer/comics"
                className="px-6 py-2.5 border border-border rounded-lg hover:bg-muted transition-colors text-foreground">
                ยกเลิก
              </Link>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2.5 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium">
                {loading ? "กำลังบันทึก..." : "เพิ่มการ์ตูนเรื่องใหม่"}
              </button>
            </div>
          </div>
        </form>
      </div>
      </>
    </AuthGuard>
  );
}