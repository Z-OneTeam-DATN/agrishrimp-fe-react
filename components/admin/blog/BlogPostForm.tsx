"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Save, X, Search, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import {
  BlogCategoryDTO,
  BlogPostDTO,
  adminCreateBlogPost,
  adminUpdateBlogPost,
} from "@/app/services/blog.service";
import { PublicProductService } from "@/app/services/publicProduct.service";
import { PublicProductListItem } from "@/app/types/product.schema";

import "react-quill-new/dist/quill.snow.css";

const ReactQuill = dynamic(() => import("react-quill-new"), { ssr: false });

const QUILL_MODULES = {
  toolbar: [
    [{ header: [1, 2, 3, false] }],
    ["bold", "italic", "underline", "strike"],
    [{ list: "ordered" }, { list: "bullet" }],
    [{ indent: "-1" }, { indent: "+1" }],
    ["blockquote", "code-block"],
    ["link", "image"],
    [{ align: [] }],
    ["clean"],
  ],
};

interface Props {
  categories: BlogCategoryDTO[];
  initialData?: BlogPostDTO;
}

const EMPTY_CATEGORY_VALUE = "__none__";

export default function BlogPostForm({ categories, initialData }: Props) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [title, setTitle] = useState(initialData?.title ?? "");
  const [excerpt, setExcerpt] = useState(initialData?.excerpt ?? "");
  const [content, setContent] = useState(initialData?.content ?? "");
  const [status, setStatus] = useState<"DRAFT" | "PUBLISHED">(initialData?.status ?? "DRAFT");
  const [categoryId, setCategoryId] = useState<string>(
    initialData?.category ? String(initialData.category.id) : ""
  );

  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(
    initialData?.thumbnailUrl ?? null
  );

  const [selectedProducts, setSelectedProducts] = useState<PublicProductListItem[]>(
    (initialData?.relatedProducts ?? []).map((p) => ({
      id: p.id,
      name: p.name,
      slug: p.slug,
      imageUrls: p.imageUrl ? [p.imageUrl] : [],
      isOutOfStock: false,
      variants: [],
    } as unknown as PublicProductListItem))
  );

  const [productSearch, setProductSearch] = useState("");
  const [productResults, setProductResults] = useState<PublicProductListItem[]>([]);
  const [searchingProducts, setSearchingProducts] = useState(false);
  const [productFocused, setProductFocused] = useState(false);

  const [saving, setSaving] = useState(false);
  const isEdit = !!initialData;

  const handleThumbnailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setThumbnailFile(file);
    setThumbnailPreview(URL.createObjectURL(file));
  };

  const removeThumbnail = () => {
    setThumbnailFile(null);
    setThumbnailPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const searchProducts = useCallback(async (kw: string) => {
    if (!kw.trim()) { setProductResults([]); return; }
    setSearchingProducts(true);
    try {
      const res = await PublicProductService.getList({ keyword: kw, size: 8 });
      setProductResults(res.content ?? []);
    } catch {
      setProductResults([]);
    } finally {
      setSearchingProducts(false);
    }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => searchProducts(productSearch), 350);
    return () => clearTimeout(t);
  }, [productSearch, searchProducts]);

  const toggleProduct = (product: PublicProductListItem) => {
    setSelectedProducts((prev) => {
      const exists = prev.some((p) => p.id === product.id);
      if (exists) return prev.filter((p) => p.id !== product.id);
      return [...prev, product];
    });
    setProductSearch("");
    setProductResults([]);
    setProductFocused(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) { toast.error("Vui lòng nhập tiêu đề bài viết"); return; }
    if (!content.trim() || content === "<p><br></p>") {
      toast.error("Vui lòng nhập nội dung bài viết"); return;
    }

    setSaving(true);
    try {
      const payload = {
        title: title.trim(),
        excerpt: excerpt.trim() || undefined,
        content,
        status,
        categoryId: categoryId ? Number(categoryId) : undefined,
        tagIds: [],
        productIds: selectedProducts.map((p) => p.id),
        thumbnailUrl: thumbnailFile ? undefined : thumbnailPreview,
        thumbnailPublicId: undefined,
      };

      const fd = new FormData();
      fd.append("data", JSON.stringify(payload));
      if (thumbnailFile) fd.append("thumbnail", thumbnailFile);

      if (isEdit) {
        await adminUpdateBlogPost(initialData!.id, fd);
        toast.success("Đã cập nhật bài viết");
      } else {
        await adminCreateBlogPost(fd);
        toast.success("Đã tạo bài viết");
      }
      router.push("/admin/blog/posts");
      router.refresh();
    } catch {
      toast.error("Lưu bài viết thất bại");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_300px] gap-6 items-start">
      {/* ── LEFT: nội dung chính ── */}
      <div className="space-y-5">
        {/* Tiêu đề */}
        <div className="bg-white border border-slate-200 rounded-lg p-5 space-y-3">
          <Label className="text-[13px] font-semibold text-slate-600 uppercase tracking-wide">
            Tiêu đề <span className="text-rose-500 normal-case">*</span>
          </Label>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Nhập tiêu đề bài viết..."
            className="h-11 text-[15px] font-medium bg-slate-50 border-slate-200 focus:bg-white"
          />
        </div>

        {/* Mô tả ngắn */}
        <div className="bg-white border border-slate-200 rounded-lg p-5 space-y-3">
          <div>
            <Label className="text-[13px] font-semibold text-slate-600 uppercase tracking-wide">
              Mô tả ngắn
            </Label>
            <p className="text-[12px] text-slate-400 mt-0.5">Hiển thị ngoài trang danh sách và kết quả tìm kiếm</p>
          </div>
          <Textarea
            value={excerpt}
            onChange={(e) => setExcerpt(e.target.value)}
            placeholder="Tóm tắt nội dung bài viết..."
            className="resize-none bg-slate-50 border-slate-200 focus:bg-white text-sm"
            rows={3}
          />
        </div>

        {/* Nội dung */}
        <div className="bg-white border border-slate-200 rounded-lg p-5 space-y-3">
          <Label className="text-[13px] font-semibold text-slate-600 uppercase tracking-wide">
            Nội dung bài viết <span className="text-rose-500 normal-case">*</span>
          </Label>
          <div className="rounded-lg border border-slate-200 overflow-hidden">
            <ReactQuill
              theme="snow"
              value={content}
              onChange={setContent}
              modules={QUILL_MODULES}
              placeholder="Viết nội dung bài viết tại đây..."
              className="min-h-[420px]"
            />
          </div>
        </div>
      </div>

      {/* ── RIGHT: sidebar ── */}
      <div className="space-y-4 xl:sticky xl:top-6">
        {/* Xuất bản */}
        <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-100 bg-slate-50">
            <h3 className="text-[13px] font-semibold text-slate-700 uppercase tracking-wide">Xuất bản</h3>
          </div>
          <div className="p-4 space-y-4">
            <div className="space-y-1.5">
              <Label className="text-[12px] font-medium text-slate-500">Trạng thái</Label>
              <Select value={status} onValueChange={(v) => setStatus(v as "DRAFT" | "PUBLISHED")}>
                <SelectTrigger className="h-9 bg-slate-50 border-slate-200 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="DRAFT">Bản nháp</SelectItem>
                  <SelectItem value="PUBLISHED">Xuất bản ngay</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2 pt-1">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                className="flex-1 h-9 text-sm font-medium"
              >
                Hủy
              </Button>
              <Button
                type="submit"
                disabled={saving}
                className="flex-1 h-9 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold"
              >
                {saving ? <Loader2 className="animate-spin mr-1.5" size={14} /> : <Save size={14} className="mr-1.5" />}
                {isEdit ? "Lưu thay đổi" : "Lưu bài viết"}
              </Button>
            </div>
          </div>
        </div>

        {/* Ảnh bìa */}
        <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-100 bg-slate-50">
            <h3 className="text-[13px] font-semibold text-slate-700 uppercase tracking-wide">Ảnh bìa</h3>
          </div>
          <div className="p-4 space-y-3">
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleThumbnailChange} aria-label="Tải ảnh bìa lên" />
            {thumbnailPreview ? (
              <div className="space-y-2">
                <div className="relative w-full aspect-video rounded-md overflow-hidden border border-slate-200 bg-slate-100">
                  <img src={thumbnailPreview} alt="" className="w-full h-full object-cover" />
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={removeThumbnail}
                  className="w-full h-8 text-xs text-slate-500 border-slate-200"
                >
                  <X size={12} className="mr-1.5" /> Xóa ảnh bìa
                </Button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full aspect-video rounded-md border-2 border-dashed border-slate-200 hover:border-emerald-400 hover:bg-emerald-50/30 transition-colors flex flex-col items-center justify-center gap-1.5 text-slate-400 hover:text-emerald-600"
              >
                <Upload size={20} />
                <span className="text-[12px] font-medium">Tải ảnh lên</span>
                <span className="text-[11px] text-slate-300">JPG, PNG, WEBP</span>
              </button>
            )}
          </div>
        </div>

        {/* Danh mục */}
        <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-100 bg-slate-50">
            <h3 className="text-[13px] font-semibold text-slate-700 uppercase tracking-wide">Danh mục</h3>
          </div>
          <div className="p-4">
            <Select
              value={categoryId || EMPTY_CATEGORY_VALUE}
              onValueChange={(value) => setCategoryId(value === EMPTY_CATEGORY_VALUE ? "" : value)}
            >
              <SelectTrigger className="h-9 bg-slate-50 border-slate-200 text-sm">
                <SelectValue placeholder="Chọn danh mục..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={EMPTY_CATEGORY_VALUE}>Không có danh mục</SelectItem>
                {categories.map((c) => (
                  <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Sản phẩm liên quan */}
        <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-100 bg-slate-50">
            <div className="flex items-center justify-between">
              <h3 className="text-[13px] font-semibold text-slate-700 uppercase tracking-wide">Sản phẩm liên quan</h3>
              {selectedProducts.length > 0 && (
                <span className="text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  {selectedProducts.length}
                </span>
              )}
            </div>
          </div>
          <div className="p-4 space-y-3">
            <p className="text-[12px] text-slate-400">Gắn sản phẩm vào bài viết để người đọc tham khảo mua hàng</p>

            {/* Search box */}
            <div className="relative">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <Input
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
                onFocus={() => setProductFocused(true)}
                onBlur={() => setTimeout(() => setProductFocused(false), 200)}
                placeholder="Tìm tên sản phẩm..."
                className="pl-8 h-9 text-sm bg-slate-50 border-slate-200 focus:bg-white"
              />
              {searchingProducts && (
                <Loader2 size={13} className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-slate-400" />
              )}

              {/* Dropdown kết quả */}
              {productFocused && productResults.length > 0 && (
                <div className="absolute z-20 left-0 right-0 top-full mt-1 max-h-52 overflow-y-auto border border-slate-200 rounded-lg bg-white shadow-lg divide-y divide-slate-50">
                  {productResults.map((p) => {
                    const selected = selectedProducts.some((s) => s.id === p.id);
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onMouseDown={() => toggleProduct(p)}
                        className={cn(
                          "w-full flex items-center gap-2.5 px-3 py-2 text-left text-sm transition-colors",
                          selected ? "bg-emerald-50 text-emerald-700" : "hover:bg-slate-50 text-slate-700"
                        )}
                      >
                        <div className="w-8 h-8 rounded border border-slate-100 bg-slate-100 overflow-hidden shrink-0">
                          {p.imageUrls?.[0] ? (
                            <img src={p.imageUrls[0]} alt={p.name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full bg-slate-200" />
                          )}
                        </div>
                        <span className="flex-1 font-medium truncate text-[13px]">{p.name}</span>
                        {selected && (
                          <span className="text-[10px] font-semibold text-emerald-600 shrink-0">✓</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Sản phẩm đã chọn */}
            {selectedProducts.length > 0 && (
              <div className="space-y-1.5">
                {selectedProducts.map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1.5"
                  >
                    <div className="w-7 h-7 rounded border border-slate-200 bg-white overflow-hidden shrink-0">
                      {p.imageUrls?.[0] ? (
                        <img src={p.imageUrls[0]} alt={p.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-slate-200" />
                      )}
                    </div>
                    <span className="flex-1 text-[12px] font-medium text-slate-700 truncate">{p.name}</span>
                    <button
                      type="button"
                      aria-label={`Xóa sản phẩm ${p.name}`}
                      onClick={() => setSelectedProducts((prev) => prev.filter((s) => s.id !== p.id))}
                      className="text-slate-300 hover:text-rose-500 transition-colors shrink-0"
                    >
                      <X size={13} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {selectedProducts.length === 0 && !productFocused && (
              <p className="text-center text-[12px] text-slate-300 py-2">Chưa có sản phẩm nào được gắn</p>
            )}
          </div>
        </div>
      </div>
    </form>
  );
}
