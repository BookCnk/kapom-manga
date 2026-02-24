"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save, Upload } from "lucide-react";
import Link from "next/link";
import { MangaStatus, Visibility } from "@/generated/prisma/enums";

type Genre = {
  id: number;
  slug: string;
  name: string;
  _count: {
    mangas: number;
  };
};

export default function CreateMangaPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [genres, setGenres] = useState<Genre[]>([]);
  const [selectedGenres, setSelectedGenres] = useState<number[]>([]);

  const [formData, setFormData] = useState<{
    title: string;
    slug: string;
    description: string;
    coverUrl: string;
    bannerUrl: string;
    status: MangaStatus;
    visibility: Visibility;
    isMature: boolean;
  }>({
    title: "",
    slug: "",
    description: "",
    coverUrl: "",
    bannerUrl: "",
    status: MangaStatus.ONGOING,
    visibility: Visibility.PUBLIC,
    isMature: false,
  });

  useEffect(() => {
    fetchGenres();
  }, []);

  const fetchGenres = async () => {
    try {
      const response = await fetch("/api/genres");
      const data = await response.json();
      if (data.success) {
        setGenres(data.data.genres);
      }
    } catch (error) {
      console.error("Failed to fetch genres:", error);
    }
  };

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9ก-๙]/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");
  };

  const handleTitleChange = (value: string) => {
    setFormData((prev) => ({
      ...prev,
      title: value,
      slug: generateSlug(value),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch("/api/manga", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {
        router.push("/admin/manga");
        router.refresh();
      } else {
        alert(data.error || "เกิดข้อผิดพลาดในการสร้างมังงะ");
      }
    } catch (error) {
      console.error("Failed to create manga:", error);
      alert("เกิดข้อผิดพลาดในการสร้างมังงะ");
    } finally {
      setLoading(false);
    }
  };

  const toggleGenre = (genreId: number) => {
    setSelectedGenres((prev) =>
      prev.includes(genreId)
        ? prev.filter((id) => id !== genreId)
        : [...prev, genreId],
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/admin/manga"
          className="p-2 text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-medium text-foreground">
            สร้างมังงะใหม่
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            เพิ่มผลงานมังงะใหม่ลงในระบบ
          </p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-card rounded-xl border border-border p-6">
          <h2 className="text-lg font-medium text-foreground mb-4">
            ข้อมูลพื้นฐาน
          </h2>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                ชื่อเรื่อง *
              </label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => handleTitleChange(e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                placeholder="กรอกชื่อเรื่องมังงะ"
              />
            </div>

            {/* Slug */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Slug *
              </label>
              <input
                type="text"
                required
                value={formData.slug}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, slug: e.target.value }))
                }
                className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                placeholder="slug-for-manga"
              />
              <p className="text-xs text-muted-foreground mt-1">
                ใช้สำหรับ URL ตัวอย่าง: /manga/{formData.slug || "slug"}
              </p>
            </div>
          </div>

          {/* Description */}
          <div className="mt-6">
            <label className="block text-sm font-medium text-foreground mb-2">
              รายละเอียด
            </label>
            <textarea
              value={formData.description}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  description: e.target.value,
                }))
              }
              rows={4}
              className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/20"
              placeholder="กรอกรายละเอียดเรื่องย่อของมังงะ"
            />
          </div>

          {/* URLs */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                URL หน้าปก
              </label>
              <input
                type="url"
                value={formData.coverUrl}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, coverUrl: e.target.value }))
                }
                className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                placeholder="https://example.com/cover.jpg"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                URL แบนเนอร์
              </label>
              <input
                type="url"
                value={formData.bannerUrl}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    bannerUrl: e.target.value,
                  }))
                }
                className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                placeholder="https://example.com/banner.jpg"
              />
            </div>
          </div>

          {/* Status and Visibility */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                สถานะ
              </label>
              <select
                value={formData.status}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    status: e.target.value as MangaStatus,
                  }))
                }
                className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/20">
                <option value={MangaStatus.ONGOING}>กำลังตีพิมพ์</option>
                <option value={MangaStatus.COMPLETED}>จบแล้ว</option>
                <option value={MangaStatus.HIATUS}>พักชั่วคราว</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                การมองเห็น
              </label>
              <select
                value={formData.visibility}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    visibility: e.target.value as Visibility,
                  }))
                }
                className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/20">
                <option value={Visibility.PUBLIC}>สาธารณะ</option>
                <option value={Visibility.UNLISTED}>ไม่ระบุ</option>
                <option value={Visibility.PRIVATE}>ส่วนตัว</option>
              </select>
            </div>
          </div>

          {/* Mature Content */}
          <div className="mt-6">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.isMature}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    isMature: e.target.checked,
                  }))
                }
                className="w-4 h-4 text-orange-500 border border-border rounded focus:ring-orange-500/20"
              />
              <span className="text-sm font-medium text-foreground">
                เนื้อหาสำหรับผู้ใหญ่ (18+)
              </span>
            </label>
          </div>

          {/* Genres */}
          <div className="mt-6">
            <label className="block text-sm font-medium text-foreground mb-2">
              ประเภท
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
              {genres.map((genre) => (
                <label key={genre.id} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={selectedGenres.includes(genre.id)}
                    onChange={() => toggleGenre(genre.id)}
                    className="w-4 h-4 text-orange-500 border border-border rounded focus:ring-orange-500/20"
                  />
                  <span className="text-sm">{genre.name}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-4">
          <Link
            href="/admin/manga"
            className="px-4 py-2 border border-border rounded-lg hover:bg-muted transition-colors">
            ยกเลิก
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
            <Save className="w-4 h-4" />
            {loading ? "กำลังบันทึก..." : "สร้างมังงะ"}
          </button>
        </div>
      </form>
    </div>
  );
}
