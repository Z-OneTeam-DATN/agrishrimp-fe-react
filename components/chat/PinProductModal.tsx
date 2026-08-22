"use client";

import { useState, useEffect } from "react";
import { Search, Pin, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { ChatService } from "@/app/services/chat.service";
import { PublicProductService } from "@/app/services/publicProduct.service";
import { PublicProductListItem } from "@/app/types/product.schema";

interface Props {
  conversationId: number;
  open: boolean;
  onClose: () => void;
  onPinned: () => void;
}

const getFullImageUrl = (url?: string) => {
  if (!url) return "/placeholder.svg";
  if (url.startsWith("http://") || url.startsWith("https://") || url.startsWith("data:")) {
    return url;
  }
  const origin = process.env.NEXT_PUBLIC_BACKEND_ORIGIN || "http://localhost:8004";
  return `${origin}${url.startsWith("/") ? "" : "/"}${url}`;
};

export default function PinProductModal({ conversationId, open, onClose, onPinned }: Props) {
  const [keyword, setKeyword] = useState("");
  const [results, setResults] = useState<PublicProductListItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isPinning, setIsPinning] = useState<number | null>(null);

  // Load products initially when the modal is opened
  useEffect(() => {
    if (open) {
      loadInitialProducts();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const loadInitialProducts = async () => {
    setIsSearching(true);
    try {
      const res = await PublicProductService.getList({ page: 0, size: 12 });
      setResults(res.content || []);
    } catch {
      toast.error("Không thể tải danh sách sản phẩm");
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearch = async () => {
    setIsSearching(true);
    try {
      const res = await PublicProductService.getList({
        keyword: keyword.trim(),
        page: 0,
        size: 12,
      });
      setResults(res.content || []);
    } catch {
      toast.error("Không tìm thấy sản phẩm");
    } finally {
      setIsSearching(false);
    }
  };

  const handlePin = async (product: PublicProductListItem) => {
    setIsPinning(product.id);
    try {
      await ChatService.pinProduct(conversationId, product.id, `Tôi muốn giới thiệu sản phẩm này cho bạn:`);
      toast.success(`Đã ghim "${product.name}"`);
      onPinned();
      onClose();
    } catch {
      toast.error("Ghim sản phẩm thất bại");
    } finally {
      setIsPinning(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base font-bold">
            <Pin className="w-4.5 h-4.5 text-blue-600" />
            Ghim sản phẩm vào cuộc trò chuyện
          </DialogTitle>
        </DialogHeader>

        <div className="flex gap-2 mt-2">
          <input
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            placeholder="Tìm kiếm sản phẩm..."
            className="flex-1 border border-gray-205 dark:border-slate-600 rounded-xl px-3.5 py-2 text-xs outline-none focus:ring-2 focus:ring-blue-400 dark:bg-slate-700 dark:text-white"
          />
          <button
            onClick={handleSearch}
            disabled={isSearching}
            className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-xl text-xs font-semibold transition-colors disabled:opacity-50 flex items-center justify-center"
          >
            {isSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
          </button>
        </div>

        <div className="mt-4 max-h-80 overflow-y-auto flex flex-col gap-2 pr-1">
          {results.length === 0 && !isSearching && (
            <p className="text-xs text-gray-400 text-center py-8">
              {keyword ? "Không tìm thấy sản phẩm" : "Không có sản phẩm nào khả dụng"}
            </p>
          )}
          {results.map((product) => {
            const imageUrl = product.imageUrls?.[0] || product.variants?.find((v) => v.imageUrl)?.imageUrl;
            const price = product.variants?.[0]?.price ?? 0;
            return (
              <div
                key={product.id}
                className="flex items-center gap-3 p-2 border border-gray-100 dark:border-slate-750 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
              >
                <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-gray-50 border border-gray-100 shrink-0 flex items-center justify-center">
                  {imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={getFullImageUrl(imageUrl)} alt={product.name} className="w-full h-full object-contain p-0.5" />
                  ) : (
                    <div className="w-full h-full bg-gray-100" />
                  )}
                </div>
                <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                  <p className="text-xs font-bold text-gray-800 dark:text-gray-200 line-clamp-2 leading-snug">{product.name}</p>
                  <span className="text-[11px] font-extrabold text-red-500 mt-1">
                    {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price)}
                  </span>
                </div>
                <button
                  onClick={() => handlePin(product)}
                  disabled={isPinning === product.id}
                  className="shrink-0 px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white rounded-full text-[10px] font-bold transition-all disabled:opacity-50 flex items-center gap-1 active:scale-95 shadow-sm"
                >
                  {isPinning === product.id ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <Pin className="w-3 h-3" />
                  )}
                  Ghim
                </button>
              </div>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}

