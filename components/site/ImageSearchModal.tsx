"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import {
  X,
  ImageIcon,
  Loader2,
  SearchX,
  AlertCircle,
  Camera,
} from "lucide-react";
import ProductCard from "@/components/ui/product-card";
import { PublicProductListItem } from "@/app/types/product.schema";
import { apiJava } from "@/lib/axios";

interface ImageSearchResultItem extends PublicProductListItem {
  similarity?: number;
}

const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_SIZE_MB = 5;

interface Props {
  onClose: () => void;
}

export default function ImageSearchModal({ onClose }: Props) {
  const [dragOver, setDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<ImageSearchResultItem[] | null>(null);
  const [searchError, setSearchError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const doSearch = async (file: File) => {
    setIsSearching(true);
    setSearchError(null);
    setResults(null);
    try {
      const formData = new FormData();
      formData.append("image", file);
      const res = await apiJava.post<ImageSearchResultItem[]>(
        "/products/search-by-image",
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );
      const data = res.data;
      const list: ImageSearchResultItem[] = Array.isArray(data)
        ? data
        : (data as any)?.data ?? [];
      setResults(list);
    } catch (err: any) {
      setSearchError(
        err.response?.data?.message || "Có lỗi xảy ra khi tìm kiếm. Vui lòng thử lại."
      );
    } finally {
      setIsSearching(false);
    }
  };

  const validateAndSet = (file: File) => {
    setValidationError(null);
    setResults(null);
    setSearchError(null);

    if (!ACCEPTED_TYPES.includes(file.type)) {
      setValidationError("Chỉ chấp nhận ảnh JPG, PNG hoặc WebP.");
      return;
    }
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      setValidationError(`Ảnh không được vượt quá ${MAX_SIZE_MB}MB.`);
      return;
    }

    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    doSearch(file);
  };

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) validateAndSet(file);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [previewUrl]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) validateAndSet(file);
  };

  const handleReset = () => {
    setSelectedFile(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setValidationError(null);
    setResults(null);
    setSearchError(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <div
      className="fixed inset-0 z-[200] flex items-start justify-center bg-black/50 backdrop-blur-sm p-4 pt-16 overflow-y-auto"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-3xl mb-8">
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-gray-100">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full bg-[#2d6a4f]/10 flex items-center justify-center">
              <Camera size={18} className="text-[#2d6a4f]" />
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-800 leading-tight">
                Tìm sản phẩm bằng ảnh
              </h2>
              <p className="text-[11px] text-gray-400">
                Tải ảnh lên — hệ thống tự động tìm sản phẩm giống nhất cho bạn
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6">
          {/* Upload zone */}
          {!previewUrl ? (
            <div
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => inputRef.current?.click()}
              className={`cursor-pointer border-2 border-dashed rounded-xl flex flex-col items-center justify-center gap-3 py-14 transition-all select-none
                ${dragOver
                  ? "border-[#2d6a4f] bg-emerald-50"
                  : "border-gray-200 bg-gray-50 hover:border-[#2d6a4f] hover:bg-emerald-50/40"
                }`}
            >
              <div className={`w-16 h-16 rounded-full flex items-center justify-center transition-colors ${dragOver ? "bg-[#2d6a4f]/15" : "bg-white shadow-sm"}`}>
                <ImageIcon size={30} className={dragOver ? "text-[#2d6a4f]" : "text-gray-300"} />
              </div>
              <div className="text-center">
                <p className="text-sm font-semibold text-gray-700">
                  {dragOver ? "Thả ảnh vào đây" : "Kéo thả ảnh vào đây"}
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  hoặc{" "}
                  <span className="text-[#2d6a4f] font-medium underline underline-offset-2">
                    bấm để chọn ảnh
                  </span>
                </p>
                <p className="text-[11px] text-gray-300 mt-2">
                  JPG · PNG · WebP &nbsp;·&nbsp; Tối đa {MAX_SIZE_MB}MB
                </p>
              </div>
              <input
                ref={inputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={handleFileChange}
              />
            </div>
          ) : (
            /* Preview + trạng thái tìm kiếm */
            <div className="space-y-4">
              <div className="relative rounded-xl overflow-hidden border border-gray-200 bg-gray-50 flex items-center justify-center min-h-[180px]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={previewUrl}
                  alt="Ảnh đã chọn"
                  className="max-h-56 w-auto object-contain"
                />
                <button
                  onClick={handleReset}
                  className="absolute top-2.5 right-2.5 w-7 h-7 bg-white/90 rounded-full flex items-center justify-center shadow text-gray-500 hover:text-red-500 hover:bg-red-50 transition-colors"
                  title="Chọn ảnh khác"
                >
                  <X size={14} />
                </button>
                {isSearching && (
                  <div className="absolute inset-0 bg-white/70 flex flex-col items-center justify-center gap-2">
                    <Loader2 size={28} className="animate-spin text-[#2d6a4f]" />
                    <p className="text-sm font-medium text-gray-600">Đang tìm sản phẩm...</p>
                  </div>
                )}
              </div>

              <button
                onClick={() => inputRef.current?.click()}
                className="w-full text-xs text-gray-400 hover:text-[#2d6a4f] transition-colors underline underline-offset-2"
              >
                Chọn ảnh khác
              </button>
              <input
                ref={inputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={handleFileChange}
              />
            </div>
          )}

          {/* Validation error */}
          {validationError && (
            <div className="mt-3 flex items-center gap-2 text-red-600 bg-red-50 border border-red-100 rounded-lg px-4 py-2.5 text-sm">
              <AlertCircle size={15} className="shrink-0" />
              {validationError}
            </div>
          )}

          {/* Search error */}
          {searchError && (
            <div className="mt-4 flex items-center gap-2 text-red-600 bg-red-50 border border-red-100 rounded-lg px-4 py-3 text-sm">
              <AlertCircle size={15} className="shrink-0" />
              {searchError}
            </div>
          )}

          {/* Results */}
          {results !== null && !isSearching && (
            <div className="mt-6">
              <div className="flex items-center gap-2 mb-4">
                <h3 className="text-sm font-bold text-gray-700">Sản phẩm tương tự</h3>
                {results.length > 0 && (
                  <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                    {results.length} sản phẩm
                  </span>
                )}
              </div>

              {results.length === 0 ? (
                <div className="flex flex-col items-center gap-3 py-14 text-gray-400">
                  <SearchX size={44} className="text-gray-200" />
                  <p className="text-sm font-semibold text-gray-500">
                    Không tìm thấy sản phẩm phù hợp
                  </p>
                  <p className="text-xs text-gray-400">Thử tải lên ảnh khác rõ nét hơn</p>
                  <button
                    onClick={handleReset}
                    className="mt-2 text-xs text-[#2d6a4f] underline underline-offset-2 hover:opacity-70"
                  >
                    Chọn ảnh khác
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                  {results.map((product) => (
                    <div key={product.id} className="relative">
                      {product.similarity !== undefined && product.similarity > 0 && (
                        <span className="absolute top-2 left-2 z-20 bg-[#2d6a4f] text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm pointer-events-none">
                          {Math.round(product.similarity * 100)}% phù hợp
                        </span>
                      )}
                      <ProductCard product={product} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
