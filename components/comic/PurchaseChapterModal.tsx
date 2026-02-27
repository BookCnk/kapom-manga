"use client";

import { useState, useEffect } from "react";
import { X, Plus, Coins } from "lucide-react";
import { toast } from "sonner";

interface PurchaseChapterModalProps {
  isOpen: boolean;
  onClose: () => void;
  chapter: {
    id: number;
    number: number;
    title: string;
    priceCoins: number;
  };
  mangaTitle: string;
  onPurchaseSuccess: () => void;
}

export default function PurchaseChapterModal({
  isOpen,
  onClose,
  chapter,
  mangaTitle,
  onPurchaseSuccess,
}: PurchaseChapterModalProps) {
  const [walletBalance, setWalletBalance] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [purchasing, setPurchasing] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchWalletBalance();
    }
  }, [isOpen]);

  const fetchWalletBalance = async () => {
    try {
      const token = localStorage.getItem("session_token");
      if (!token) return;

      const response = await fetch("/api/wallet/me", {
        headers: {
          "x-session-token": token,
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data?.wallet) {
          setWalletBalance(data.data.wallet.balance || 0);
        }
      }
    } catch (error) {
      console.error("Failed to fetch wallet balance:", error);
    }
  };

  const handlePurchase = async () => {
    if (!chapter || purchasing) return;

    setPurchasing(true);
    try {
      const token = localStorage.getItem("session_token");
      if (!token) {
        toast.error("กรุณาเข้าสู่ระบบก่อน");
        return;
      }

      const response = await fetch(`/api/chapters/${chapter.id}/purchase`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-session-token": token,
        },
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "เกิดข้อผิดพลาดในการซื้อตอน");
      }

      toast.success("ซื้อตอนสำเร็จ!");
      setWalletBalance(data.data.transaction.balanceAfter);
      onPurchaseSuccess();
      onClose();
    } catch (error) {
      console.error("Purchase error:", error);
      toast.error(
        error instanceof Error ? error.message : "เกิดข้อผิดพลาดในการซื้อตอน"
      );
    } finally {
      setPurchasing(false);
    }
  };

  if (!isOpen) return null;

  const hasEnoughBalance =
    walletBalance !== null && walletBalance >= Math.ceil(chapter.priceCoins);
  const priceDisplay = chapter.priceCoins.toFixed(2).replace(/\.?0+$/, "");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative z-50 w-full max-w-md mx-4 bg-card border border-border rounded-2xl shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-foreground">
              ตอนที่ {chapter.number}
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              ({mangaTitle})
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-muted rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Wallet Balance */}
          <div className="text-center">
            <p className="text-sm text-muted-foreground mb-2">ยอดเหรียญของคุณ</p>
            <div className="flex items-center justify-center gap-2">
              <div className="w-6 h-6 rounded-full bg-orange-500 flex items-center justify-center">
                <span className="text-white text-xs font-bold">R</span>
              </div>
              <span className="text-2xl font-bold text-foreground">
                {walletBalance !== null
                  ? walletBalance.toFixed(2).replace(/\.?0+$/, "")
                  : "..."}
              </span>
              <button
                onClick={() => window.open("/wallet", "_blank")}
                className="w-6 h-6 rounded-full bg-yellow-500 flex items-center justify-center hover:bg-yellow-600 transition-colors"
              >
                <Plus className="w-4 h-4 text-white" />
              </button>
            </div>
          </div>

          {/* Purchase Button */}
          <button
            onClick={handlePurchase}
            disabled={!hasEnoughBalance || purchasing}
            className={`w-full py-4 px-6 rounded-xl font-semibold text-white transition-colors flex items-center justify-center gap-2 ${
              hasEnoughBalance && !purchasing
                ? "bg-orange-500 hover:bg-orange-600"
                : "bg-muted text-muted-foreground cursor-not-allowed"
            }`}
          >
            {purchasing ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>กำลังซื้อ...</span>
              </>
            ) : (
              <>
                <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center">
                  <span className="text-white text-xs font-bold">R</span>
                </div>
                <span>{priceDisplay} ReadCoin</span>
              </>
            )}
          </button>

          {!hasEnoughBalance && walletBalance !== null && (
            <p className="text-sm text-center text-red-500">
              ยอดเหรียญไม่เพียงพอ
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
