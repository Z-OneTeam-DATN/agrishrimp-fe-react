"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Loader2, Save, ImageIcon, X, Search, Package, ChevronDown, ChevronUp,
} from "lucide-react";
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
  const [slug, setSlug] = useState(initialData?.slug ?? "");
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
  const [showProductSearch, setShowProductSearch] = useState(false);

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
      const res = await PublicProductService.getList({ keyword: kw, size: 10 });
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
        slug: slug.trim() || undefined,
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
    <form onSubmit={handleSubmit} className="space-y-6 max-w-[900px]">
      {/* Title */}
      <div className="space-y-2">
        <Label className="text-sm font-semibold text-slate-700">
          Tiêu đề bài viết <span className="text-rose-500">*</span>
        </Label>
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Nhập tiêu đề bài viết..."
          className="h-11 text-base font-medium bg-white"
        />
      </div>

      {/* Slug */}
      <div className="space-y-2">
        <Label className="text-sm font-semibold text-slate-700">Slug (URL)</Label>
        <Input
          value={slug}
          onChange={(e) => setSlug(e.target.value)}
          placeholder="tu-dong-tao-tu-tieu-de (bỏ trống để tự tạo)"
          className="h-10 text-sm bg-white font-mono"
        />
      </div>

      {/* Excerpt */}
      <div className="space-y-2">
        <Label className="text-sm font-semibold text-slate-700">Mô tả ngắn</Label>
        <Textarea
          value={excerpt}
          onChange={(e) => setExcerpt(e.target.value)}
          placeholder="Tóm tắt nội dung bài viết, hiển thị ngoài trang danh sách..."
          className="resize-none bg-white text-sm"
          rows={3}
        />
      </div>

      {/* Thumbnail */}
      <div className="space-y-2">
        <Label className="text-sm font-semibold text-slate-700">Ảnh thumbnail</Label>
        <div className="flex items-start gap-4">
          <div
            onClick={() => fileInputRef.current?.click()}
            className={cn(
              "w-48 h-28 rounded-xl border-2 border-dashed flex items-center justify-center overflow-hidden cursor-pointer transition-colors",
              thumbnailPreview ? "border-slate-200" : "border-slate-300 hover:border-emerald-400 hover:bg-emerald-50/30"
            )}
          >
            {thumbnailPreview ? (
              <img src={thumbnailPreview} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="flex flex-col items-center text-slate-400 gap-1">
                <ImageIcon size={24} />
                <span className="text-xs font-medium">Tải ảnh lên</span>
              </div>
            )}
          </div>
          {thumbnailPreview && (
            <Button type="button" variant="outline" size="sm" onClick={removeThumbnail}
              className="text-rose-600 border-rose-200 hover:bg-rose-50 h-8">
              <X size={14} className="mr-1" /> Xóa ảnh
            </Button>
          )}
        </div>
        <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleThumbnailChange} />
      </div>

      {/* Category + Status */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="text-sm font-semibold text-slate-700">Danh mục</Label>
          <Select
            value={categoryId || EMPTY_CATEGORY_VALUE}
            onValueChange={(value) =>
              setCategoryId(value === EMPTY_CATEGORY_VALUE ? "" : value)
            }
          >
            <SelectTrigger className="h-10 bg-white text-sm">
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
        <div className="space-y-2">
          <Label className="text-sm font-semibold text-slate-700">Trạng thái</Label>
          <Select value={status} onValueChange={(v) => setStatus(v as "DRAFT" | "PUBLISHED")}>
            <SelectTrigger className="h-10 bg-white text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="DRAFT">Bản nháp</SelectItem>
              <SelectItem value="PUBLISHED">Xuất bản</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Content editor */}
      <div className="space-y-2">
        <Label className="text-sm font-semibold text-slate-700">
          Nội dung bài viết <span className="text-rose-500">*</span>
        </Label>
        <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
          <ReactQuill
            theme="snow"
            value={content}
            onChange={setContent}
            modules={QUILL_MODULES}
            placeholder="Viết nội dung bài viết tại đây..."
            className="min-h-[400px]"
          />
        </div>
      </div>

      {/* Related Products */}
      <div className="space-y-3 rounded-xl border border-slate-100 bg-slate-50/70 p-4">
        <button
          type="button"
          onClick={() => setShowProductSearch((v) => !v)}
          className="flex items-center gap-2 text-sm font-semibold text-slate-700 w-full"
        >
          <Package size={16} className="text-emerald-600" />
          Sản phẩm liên quan ({selectedProducts.length})
          {showProductSearch ? <ChevronUp size={14} className="ml-auto text-slate-400" /> : <ChevronDown size={14} className="ml-auto text-slate-400" />}
        </button>

        {showProductSearch && (
          <div className="space-y-3">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <Input
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
                placeholder="Tìm sản phẩm để thêm vào bài viết..."
                className="pl-8 h-9 text-sm bg-white"
              />
              {searchingProducts && (
                <Loader2 size={14} className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-slate-400" />
              )}
            </div>

            {productResults.length > 0 && (
              <div className="max-h-52 overflow-y-auto border border-slate-200 rounded-lg bg-white divide-y divide-slate-100">
                {productResults.map((p) => {
                  const selected = selectedProducts.some((s) => s.id === p.id);
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => toggleProduct(p)}
                      className={cn(
                        "w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-slate-50 transition-colors text-sm",
                        selected && "bg-emerald-50"
                      )}
                    >
                      <div className="w-9 h-9 rounded-md border border-slate-100 bg-slate-100 overflow-hidden shrink-0 flex items-center justify-center">
                        {p.imageUrls?.[0] ? (
                          <img src={p.imageUrls[0]} alt={p.name} className="w-full h-full object-cover" />
                        ) : (
                          <Package size={14} className="text-slate-300" />
                        )}
                      </div>
                      <span className={cn("flex-1 font-medium truncate", selected ? "text-emerald-700" : "text-slate-700")}>
                        {p.name}
                      </span>
                      {selected && (
                        <span className="text-[11px] font-semibold text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded-full shrink-0">
                          Đã chọn
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {selectedProducts.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {selectedProducts.map((p) => (
              <div key={p.id} className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-full px-3 py-1 text-sm font-medium text-slate-700">
                <span className="truncate max-w-[180px]">{p.name}</span>
                <button
                  type="button"
                  onClick={() => setSelectedProducts((prev) => prev.filter((s) => s.id !== p.id))}
                  className="text-slate-400 hover:text-rose-500 transition-colors"
                >
                  <X size={13} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3 pt-2 border-t border-slate-100">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          className="h-10 px-6 font-medium"
        >
          Hủy
        </Button>
        <Button
          type="submit"
          disabled={saving}
          className="h-10 px-8 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-md shadow-emerald-100"
        >
          {saving ? <Loader2 className="animate-spin mr-2" size={16} /> : <Save className="mr-2" size={16} />}
          {isEdit ? "Lưu thay đổi" : "Tạo bài viết"}
        </Button>
      </div>
    </form>
  );
}
