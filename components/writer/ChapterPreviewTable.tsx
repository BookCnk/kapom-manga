"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Edit2,
  Eye,
  Trash2,
  Upload,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { ChapterPreview } from "@/types/chapter";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type ChapterPreviewTableProps = {
  chapters: ChapterPreview[];
  onUpdateChapter: (index: number, updates: Partial<ChapterPreview>) => void;
  onRemoveChapter: (index: number) => void;
  onConfirmUpload: () => void;
  onCancel: () => void;
  processing?: boolean;
};

export function ChapterPreviewTable({
  chapters,
  onUpdateChapter,
  onRemoveChapter,
  onConfirmUpload,
  onCancel,
  processing = false,
}: ChapterPreviewTableProps) {
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [bulkPrice, setBulkPrice] = useState("");
  const [bulkStatus, setBulkStatus] = useState<"published" | "draft">(
    "published",
  );
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [selectedChapters, setSelectedChapters] = useState<Set<number>>(
    new Set(),
  );
  const [previewModal, setPreviewModal] = useState<{
    chapterIndex: number;
    imageIndex: number;
    imageUrls: string[];
  } | null>(null);

  // Calculate totals
  const totalPrice = chapters.reduce((sum, ch) => sum + ch.price, 0);
  const totalPages = chapters.reduce((sum, ch) => sum + ch.pageCount, 0);
  const totalItems = chapters.length;
  const totalPageCount = Math.max(1, Math.ceil(totalItems / pageSize));
  const pageStart = (currentPage - 1) * pageSize;
  const pageEnd = Math.min(pageStart + pageSize, totalItems);

  const visibleRows = useMemo(
    () =>
      chapters
        .slice(pageStart, pageEnd)
        .map((chapter, localIndex) => ({
          chapter,
          index: pageStart + localIndex,
        })),
    [chapters, pageEnd, pageStart],
  );

  const isCurrentPageFullySelected =
    visibleRows.length > 0 &&
    visibleRows.every((row) => selectedChapters.has(row.index));

  useEffect(() => {
    if (currentPage > totalPageCount) {
      setCurrentPage(totalPageCount);
    }
  }, [currentPage, totalPageCount]);

  useEffect(() => {
    return () => {
      if (previewModal) {
        previewModal.imageUrls.forEach((url) => URL.revokeObjectURL(url));
      }
    };
  }, [previewModal]);

  // Handle inline editing
  const handleInlineEdit = (
    index: number,
    field: keyof ChapterPreview,
    value: any,
  ) => {
    onUpdateChapter(index, { [field]: value, edited: true });
  };

  // Handle bulk price update
  const handleBulkPriceUpdate = () => {
    const price = parseFloat(bulkPrice);
    if (isNaN(price) || price < 0) {
      toast.error("กรุณาระบุราคาที่ถูกต้อง");
      return;
    }

    selectedChapters.forEach((index) => {
      onUpdateChapter(index, { price, edited: true });
    });

    toast.success(`อัปเดตราคา ${selectedChapters.size} ตอนเรียบร้อย`);
    setSelectedChapters(new Set());
    setBulkPrice("");
  };

  // Handle bulk status update
  const handleBulkStatusUpdate = () => {
    selectedChapters.forEach((index) => {
      onUpdateChapter(index, { status: bulkStatus, edited: true });
    });

    toast.success(`อัปเดตสถานะ ${selectedChapters.size} ตอนเรียบร้อย`);
    setSelectedChapters(new Set());
  };

  // Toggle chapter selection
  const toggleChapterSelection = (index: number) => {
    const newSelected = new Set(selectedChapters);
    if (newSelected.has(index)) {
      newSelected.delete(index);
    } else {
      newSelected.add(index);
    }
    setSelectedChapters(newSelected);
  };

  // Select all chapters
  const selectAllChapters = () => {
    if (selectedChapters.size === chapters.length) {
      setSelectedChapters(new Set());
    } else {
      setSelectedChapters(new Set(chapters.map((_, index) => index)));
    }
  };

  const toggleCurrentPageSelection = () => {
    const next = new Set(selectedChapters);
    if (isCurrentPageFullySelected) {
      visibleRows.forEach((row) => next.delete(row.index));
    } else {
      visibleRows.forEach((row) => next.add(row.index));
    }
    setSelectedChapters(next);
  };

  const openPreviewModal = (chapterIndex: number, startIndex = 0) => {
    const chapter = chapters[chapterIndex];
    if (!chapter || chapter.files.length === 0) return;

    const imageUrls = chapter.files.map((file) => URL.createObjectURL(file));
    setPreviewModal({
      chapterIndex,
      imageIndex: Math.min(Math.max(startIndex, 0), imageUrls.length - 1),
      imageUrls,
    });
  };

  const closePreviewModal = () => {
    setPreviewModal((prev) => {
      if (prev) {
        prev.imageUrls.forEach((url) => URL.revokeObjectURL(url));
      }
      return null;
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-foreground">
            พรีวิวตอนที่จะอัปโหลด
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            พบ {chapters.length} ตอน, {totalPages} หน้า, รวมราคา{" "}
            {totalPrice.toFixed(2)} ReadCoin
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={onCancel}
            disabled={processing}
            className="px-4 py-2 text-sm border border-border rounded-lg hover:bg-muted transition-colors disabled:opacity-50">
            ยกเลิก
          </button>
          <button
            onClick={onConfirmUpload}
            disabled={processing || chapters.length === 0}
            className="px-4 py-2 text-sm bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-50 flex items-center gap-2">
            {processing ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                กำลังอัปโหลด...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4" />
                ยืนยันอัปโหลด
              </>
            )}
          </button>
        </div>
      </div>

      {/* Bulk Actions */}
      {chapters.length > 0 && (
        <div className="bg-muted/30 rounded-lg p-4 space-y-3">
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={selectedChapters.size === chapters.length}
                onChange={selectAllChapters}
                className="rounded border-border"
              />
              เลือกทั้งหมด ({selectedChapters.size})
            </label>

            {selectedChapters.size > 0 && (
              <>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={bulkPrice}
                    onChange={(e) => setBulkPrice(e.target.value)}
                    placeholder="ราคา"
                    className="w-20 px-2 py-1 text-sm border border-border rounded"
                    min="0"
                    step="0.01"
                  />
                  <button
                    onClick={handleBulkPriceUpdate}
                    className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors">
                    ตั้งราคา
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <select
                    value={bulkStatus}
                    onChange={(e) =>
                      setBulkStatus(e.target.value as "published" | "draft")
                    }
                    className="px-2 py-1 text-sm border border-border rounded">
                    <option value="published">เผยแพร่</option>
                    <option value="draft">ฉบับร่าง</option>
                  </select>
                  <button
                    onClick={handleBulkStatusUpdate}
                    className="px-3 py-1 text-sm bg-green-500 text-white rounded hover:bg-green-600 transition-colors">
                    ตั้งสถานะ
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Table */}
      <div className="border border-border rounded-lg overflow-hidden flex flex-col">
        <div className="px-4 py-3 border-b border-border bg-muted/20 flex items-center justify-between gap-3">
          <p className="text-xs text-muted-foreground">
            แสดง {totalItems === 0 ? 0 : pageStart + 1}-{pageEnd} จาก{" "}
            {totalItems} ตอน
          </p>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">ต่อหน้า</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(parseInt(e.target.value, 10));
                setCurrentPage(1);
              }}
              className="px-2 py-1 text-xs border border-border rounded bg-background">
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
            <button
              type="button"
              onClick={() => {
                setEditingIndex(null);
                setCurrentPage((prev) => Math.max(1, prev - 1));
              }}
              disabled={currentPage === 1}
              className="px-2 py-1 text-xs border border-border rounded disabled:opacity-50">
              ก่อนหน้า
            </button>
            <span className="text-xs text-muted-foreground min-w-[64px] text-center">
              {currentPage}/{totalPageCount}
            </span>
            <button
              type="button"
              onClick={() => {
                setEditingIndex(null);
                setCurrentPage((prev) => Math.min(totalPageCount, prev + 1));
              }}
              disabled={currentPage === totalPageCount}
              className="px-2 py-1 text-xs border border-border rounded disabled:opacity-50">
              ถัดไป
            </button>
          </div>
        </div>
        <div className="overflow-auto max-h-[52vh]">
          <table className="w-full">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground w-12">
                  <input
                    type="checkbox"
                    checked={isCurrentPageFullySelected}
                    onChange={toggleCurrentPageSelection}
                    className="rounded border-border"
                  />
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">
                  ตอนที่
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">
                  ชื่อโฟลเดอร์
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">
                  ชื่อตอน
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">
                  หน้า
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">
                  ราคา
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">
                  สถานะ
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">
                  พรีวิว
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground w-20"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {visibleRows.map(({ chapter, index }) => (
                <tr
                  key={index}
                  className={cn(
                    "hover:bg-muted/30 transition-colors",
                    chapter.edited && "bg-orange-50/50",
                    selectedChapters.has(index) && "bg-blue-50/50",
                  )}>
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selectedChapters.has(index)}
                      onChange={() => toggleChapterSelection(index)}
                      className="rounded border-border"
                    />
                  </td>
                  <td className="px-4 py-3 text-sm font-medium">
                    {chapter.number}
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">
                    {chapter.folderName}
                  </td>
                  <td className="px-4 py-3">
                    {editingIndex === index ? (
                      <input
                        type="text"
                        value={chapter.title}
                        onChange={(e) =>
                          handleInlineEdit(index, "title", e.target.value)
                        }
                        onBlur={() => setEditingIndex(null)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") setEditingIndex(null);
                          if (e.key === "Escape") setEditingIndex(null);
                        }}
                        className="w-full px-2 py-1 text-sm border border-border rounded"
                        autoFocus
                      />
                    ) : (
                      <div
                        className="text-sm cursor-pointer hover:text-foreground"
                        onClick={() => setEditingIndex(index)}>
                        {chapter.title}
                        <Edit2 className="inline w-3 h-3 ml-1 opacity-50" />
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm">{chapter.pageCount}</td>
                  <td className="px-4 py-3">
                    <input
                      type="number"
                      value={chapter.price}
                      onChange={(e) => {
                        const price = parseFloat(e.target.value);
                        if (!isNaN(price) && price >= 0) {
                          handleInlineEdit(index, "price", price);
                        }
                      }}
                      className="w-20 px-2 py-1 text-sm border border-border rounded"
                      min="0"
                      step="0.01"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={chapter.status}
                      onChange={(e) =>
                        handleInlineEdit(
                          index,
                          "status",
                          e.target.value as "published" | "draft",
                        )
                      }
                      className="px-2 py-1 text-sm border border-border rounded">
                      <option value="published">เผยแพร่</option>
                      <option value="draft">ฉบับร่าง</option>
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    {chapter.thumbnail && (
                      <button
                        type="button"
                        onClick={() => openPreviewModal(index, 0)}
                        className="relative group block">
                        <img
                          src={chapter.thumbnail}
                          alt={`Preview of ${chapter.title}`}
                          className="w-12 h-16 object-cover rounded border border-border"
                        />
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded flex items-center justify-center">
                          <Eye className="w-4 h-4 text-white" />
                        </div>
                      </button>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => onRemoveChapter(index)}
                      className="p-1 text-red-500 hover:bg-red-50 rounded transition-colors"
                      title="ลบตอนนี้">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {totalItems > 0 && (
          <div className="px-4 py-3 border-t border-border bg-muted/20 flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
              หน้า {currentPage} / {totalPageCount}
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setEditingIndex(null);
                  setCurrentPage((prev) => Math.max(1, prev - 1));
                }}
                disabled={currentPage === 1}
                className="px-3 py-1 text-xs border border-border rounded disabled:opacity-50">
                ก่อนหน้า
              </button>
              <button
                type="button"
                onClick={() => {
                  setEditingIndex(null);
                  setCurrentPage((prev) => Math.min(totalPageCount, prev + 1));
                }}
                disabled={currentPage === totalPageCount}
                className="px-3 py-1 text-xs border border-border rounded disabled:opacity-50">
                ถัดไป
              </button>
            </div>
          </div>
        )}
      </div>

      {chapters.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <AlertTriangle className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>ไม่พบตอนที่สามารถอัปโหลดได้</p>
          <p className="text-sm mt-2">
            กรุณาตรวจสอบโครงสร้างโฟลเดอร์และลองใหม่
          </p>
        </div>
      )}

      {/* Validation Warnings */}
      {chapters.length > 0 && (
        <div className="space-y-2">
          {chapters.some((ch) => ch.edited) && (
            <div className="flex items-center gap-2 text-sm text-orange-600 bg-orange-50/50 p-3 rounded-lg">
              <AlertTriangle className="w-4 h-4" />
              <span>
                มีการแก้ไขข้อมูลบางตอน กรุณาตรวจสอบก่อนยืนยันการอัปโหลด
              </span>
            </div>
          )}
        </div>
      )}

      {previewModal && (
        <div
          className="fixed inset-0 z-[60] bg-black/80 flex items-center justify-center p-4"
          onClick={closePreviewModal}>
          <div
            className="w-full max-w-5xl max-h-[90vh] bg-background rounded-lg border border-border overflow-hidden"
            onClick={(e) => e.stopPropagation()}>
            <div className="px-4 py-3 border-b border-border flex items-center justify-between">
              <p className="text-sm font-medium">
                {chapters[previewModal.chapterIndex]?.title || "Preview"} (
                {previewModal.imageIndex + 1}/{previewModal.imageUrls.length})
              </p>
              <button
                type="button"
                onClick={closePreviewModal}
                className="px-3 py-1 text-xs border border-border rounded">
                ปิด
              </button>
            </div>
            <div className="relative bg-black/60 flex items-center justify-center h-[72vh]">
              <img
                src={previewModal.imageUrls[previewModal.imageIndex]}
                alt="Preview image"
                className="max-h-full max-w-full object-contain"
              />
              <button
                type="button"
                onClick={() =>
                  setPreviewModal((prev) =>
                    prev
                      ? {
                          ...prev,
                          imageIndex: Math.max(0, prev.imageIndex - 1),
                        }
                      : prev,
                  )
                }
                disabled={previewModal.imageIndex === 0}
                className="absolute left-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-background/80 border border-border disabled:opacity-40">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() =>
                  setPreviewModal((prev) =>
                    prev
                      ? {
                          ...prev,
                          imageIndex: Math.min(
                            prev.imageUrls.length - 1,
                            prev.imageIndex + 1,
                          ),
                        }
                      : prev,
                  )
                }
                disabled={
                  previewModal.imageIndex === previewModal.imageUrls.length - 1
                }
                className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-background/80 border border-border disabled:opacity-40">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
