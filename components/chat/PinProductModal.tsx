"use client";

import { useState } from "react";
import { Search, Pin, Loader2, X } from "lucide-react";
import Image from "next/image";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { ChatService } from "@/app/services/chat.service";
import { apiJava } from "@/lib/axios";

interface Product {
  id: number;
  name: string;
  slug: string;
  productImages?: { imageUrl: string }[];
}

interface Props {
  conversationId: number;
  open: boolean;
  onClose: () => void;
  onPinned: () => void;
}

export default function PinProductModal({ conversationId, open, onClose, onPinned }: Props) {
  const [keyword, setKeyword] = useState("");
  const [results, setResults] = useState<Product[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isPinning, setIsPinning] = useState<number | null>(null);

  const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;
  const authConfig = { headers: token ? { Authorization: `Bearer ${token}` } : {} };

  const handleSearch = async () => {
    if (!keyword.trim()) return;
    setIsSearching(true);
    try {
      const res = await apiJava.get<any>("/v1/public/products/search", {
        params: { keyword, page: 0, size: 10 },
      });
      const data = res.data?.content ?? res.data ?? [];
      setResults(Array.isArray(data) ? data : []);
    } catch {
      toast.error("Không tìm được sản phẩm");
    } finally {
      setIsSearching(false);
    }
  };

  const handlePin = async (product: Product) => {
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
          <DialogTitle className="flex items-center gap-2">
            <Pin className="w-4 h-4 text-blue-600" />
            Ghim sản phẩm vào cuộc trò chuyện
          </DialogTitle>
        </DialogHeader>

        <div className="flex gap-2 mt-2">
          <input
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            placeholder="Tìm kiếm sản phẩm..."
            className="flex-1 border border-gray-200 dark:border-slate-600 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-400 dark:bg-slate-700 dark:text-white"
          />
          <button
            onClick={handleSearch}
            disabled={isSearching}
            className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
          >
            {isSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
          </button>
        </div>

        <div className="mt-2 max-h-72 overflow-y-auto flex flex-col gap-2">
          {results.length === 0 && !isSearching && (
            <p className="text-sm text-gray-400 text-center py-6">
              {keyword ? "Không tìm thấy sản phẩm" : "Nhập từ khóa để tìm sản phẩm"}
            </p>
          )}
          {results.map((product) => {
            const imageUrl = product.productImages?.[0]?.imageUrl;
            return (
              <div
                key={product.id}
                className="flex items-center gap-3 p-2 border border-gray-100 dark:border-slate-700 rounded-xl hover:bg-gray-50 dark:hover:bg-slate-700/50"
              >
                <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-gray-100 shrink-0">
                  {imageUrl ? (
                    <Image src={imageUrl} alt={product.name} fill className="object-cover" />
                  ) : (
                    <div className="w-full h-full bg-gray-200" />
                  )}
                </div>
                <p className="flex-1 text-sm font-medium line-clamp-2">{product.name}</p>
                <button
                  onClick={() => handlePin(product)}
                  disabled={isPinning === product.id}
                  className="shrink-0 px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-xs font-medium transition-colors disabled:opacity-50 flex items-center gap-1"
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

