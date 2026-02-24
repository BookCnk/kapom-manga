"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Plus, Search, Edit, Eye, EyeOff, Trash2, Filter } from "lucide-react";
import { MangaStatus, Visibility } from "@/generated/prisma/enums";

type Manga = {
  id: number;
  slug: string;
  title: string;
  description?: string;
  coverUrl?: string;
  status: MangaStatus;
  visibility: Visibility;
  isMature: boolean;
  views: number;
  likesCount: number;
  createdAt: string;
  updatedAt: string;
  creator?: {
    id: number;
    name?: string;
    email: string;
  };
  _count: {
    chapters: number;
    bookmarks: number;
    likes: number;
  };
};

type Pagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export default function AdminMangaPage() {
  const [mangas, setMangas] = useState<Manga[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<MangaStatus | "">("");
  const [visibilityFilter, setVisibilityFilter] = useState<Visibility | "">("");
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });

  const fetchMangas = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        ...(search && { search }),
        ...(statusFilter && { status: statusFilter }),
        ...(visibilityFilter && { visibility: visibilityFilter }),
      });

      const response = await fetch(`/api/manga?${params}`);
      const data = await response.json();

      if (data.success) {
        setMangas(data.data.mangas);
        setPagination(data.data.pagination);
      }
    } catch (error) {
      console.error("Failed to fetch mangas:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMangas();
  }, [pagination.page, search, statusFilter, visibilityFilter]);

  const getStatusBadge = (status: MangaStatus) => {
    const styles = {
      ONGOING: "bg-blue-100 text-blue-800",
      COMPLETED: "bg-green-100 text-green-800",
      HIATUS: "bg-yellow-100 text-yellow-800",
    };
    const labels = {
      ONGOING: "กำลังตีพิมพ์",
      COMPLETED: "จบแล้ว",
      HIATUS: "พักชั่วคราว",
    };

    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${styles[status]}`}>
        {labels[status]}
      </span>
    );
  };

  const getVisibilityBadge = (visibility: Visibility) => {
    const styles = {
      PUBLIC: "bg-green-100 text-green-800",
      UNLISTED: "bg-yellow-100 text-yellow-800",
      PRIVATE: "bg-red-100 text-red-800",
    };
    const labels = {
      PUBLIC: "สาธารณะ",
      UNLISTED: "ไม่ระบุ",
      PRIVATE: "ส่วนตัว",
    };

    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${styles[visibility]}`}>
        {labels[visibility]}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-medium text-foreground">จัดการมังงะ</h1>
          <p className="text-sm text-muted-foreground mt-1">
            เพิ่ม แก้ไข หรือลบผลงานมังงะ
          </p>
        </div>
        <Link
          href="/admin/manga/create"
          className="inline-flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors">
          <Plus className="w-4 h-4" />
          เพิ่มมังงะใหม่
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-card rounded-xl border border-border p-4">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <input
                type="text"
                placeholder="ค้นหาจากชื่อหรือรายละเอียด..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/20"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as MangaStatus | "")}
              className="px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/20">
              <option value="">สถานะทั้งหมด</option>
              <option value={MangaStatus.ONGOING}>กำลังตีพิมพ์</option>
              <option value={MangaStatus.COMPLETED}>จบแล้ว</option>
              <option value={MangaStatus.HIATUS}>พักชั่วคราว</option>
            </select>
            <select
              value={visibilityFilter}
              onChange={(e) => setVisibilityFilter(e.target.value as Visibility | "")}
              className="px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/20">
              <option value="">การมองเห็นทั้งหมด</option>
              <option value={Visibility.PUBLIC}>สาธารณะ</option>
              <option value={Visibility.UNLISTED}>ไม่ระบุ</option>
              <option value={Visibility.PRIVATE}>ส่วนตัว</option>
            </select>
          </div>
        </div>
      </div>

      {/* Manga List */}
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto"></div>
            <p className="text-muted-foreground mt-2">กำลังโหลด...</p>
          </div>
        ) : mangas.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-muted-foreground">ไม่พบผลงานมังงะ</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/50 border-b border-border">
                <tr>
                  <th className="text-left p-4 font-medium text-sm">หน้าปก</th>
                  <th className="text-left p-4 font-medium text-sm">ชื่อเรื่อง</th>
                  <th className="text-left p-4 font-medium text-sm">สถานะ</th>
                  <th className="text-left p-4 font-medium text-sm">การมองเห็น</th>
                  <th className="text-left p-4 font-medium text-sm">สถิติ</th>
                  <th className="text-left p-4 font-medium text-sm">ผู้สร้าง</th>
                  <th className="text-left p-4 font-medium text-sm">จัดการ</th>
                </tr>
              </thead>
              <tbody>
                {mangas.map((manga) => (
                  <tr key={manga.id} className="border-b border-border hover:bg-muted/30">
                    <td className="p-4">
                      {manga.coverUrl ? (
                        <img
                          src={manga.coverUrl}
                          alt={manga.title}
                          className="w-12 h-16 object-cover rounded"
                        />
                      ) : (
                        <div className="w-12 h-16 bg-muted rounded flex items-center justify-center">
                          <span className="text-xs text-muted-foreground">ไม่มีภาพ</span>
                        </div>
                      )}
                    </td>
                    <td className="p-4">
                      <div>
                        <h3 className="font-medium text-foreground">{manga.title}</h3>
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-2 max-w-xs">
                          {manga.description || "-"}
                        </p>
                        {manga.isMature && (
                          <span className="inline-block mt-1 px-2 py-0.5 text-xs bg-red-100 text-red-800 rounded">
                            18+
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="p-4">{getStatusBadge(manga.status)}</td>
                    <td className="p-4">{getVisibilityBadge(manga.visibility)}</td>
                    <td className="p-4">
                      <div className="text-sm space-y-1">
                        <div>ชม: {manga.views.toLocaleString()}</div>
                        <div>ถูกใจ: {manga.likesCount}</div>
                        <div>ตอน: {manga._count.chapters}</div>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="text-sm">
                        <div>{manga.creator?.name || manga.creator?.email}</div>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/manga/${manga.slug}`}
                          target="_blank"
                          className="p-1.5 text-muted-foreground hover:text-foreground transition-colors">
                          <Eye className="w-4 h-4" />
                        </Link>
                        <Link
                          href={`/admin/manga/${manga.id}/edit`}
                          className="p-1.5 text-muted-foreground hover:text-foreground transition-colors">
                          <Edit className="w-4 h-4" />
                        </Link>
                        <button className="p-1.5 text-muted-foreground hover:text-red-500 transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="p-4 border-t border-border">
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                แสดง {((pagination.page - 1) * pagination.limit) + 1} - {Math.min(pagination.page * pagination.limit, pagination.total)} จาก {pagination.total} รายการ
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPagination(prev => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
                  disabled={pagination.page === 1}
                  className="px-3 py-1 text-sm border border-border rounded hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed">
                  ก่อนหน้า
                </button>
                <span className="px-3 py-1 text-sm">
                  หน้า {pagination.page} จาก {pagination.totalPages}
                </span>
                <button
                  onClick={() => setPagination(prev => ({ ...prev, page: Math.min(prev.totalPages, prev.page + 1) }))}
                  disabled={pagination.page === pagination.totalPages}
                  className="px-3 py-1 text-sm border border-border rounded hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed">
                  ถัดไป
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
