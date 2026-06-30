"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
  BlogTagDTO,
  adminCreateBlogTag,
  adminCreateBlogPost,
  adminGetBlogTags,
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
  const [availableTags, setAvailableTags] = useState<BlogTagDTO[]>([]);
  const [selectedTagIds, setSelectedTagIds] = useState<number[]>(
    initialData?.tags?.map((tag) => tag.id) ?? []
  );
  const [tagSearch, setTagSearch] = useState("");
  const [loadingTags, setLoadingTags] = useState(false);
  const [creatingTag, setCreatingTag] = useState(false);

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
  const [errors, setErrors] = useState<{
    title?: string;
    content?: string;
    thumbnail?: string;
    categoryId?: string;
  }>({});
  const isEdit = !!initialData;
  const fieldLabelClass = "text-[10.5px] font-semibold text-slate-500";
  const fieldControlClass =
    "h-[38px] text-[13px] font-normal text-slate-800 shadow-none placeholder:text-slate-400";
  const sectionCardClass = "border border-slate-200 bg-white p-6 shadow-sm";
  const sidebarCardClass = "overflow-hidden border border-slate-200 bg-white shadow-sm";
  const sectionTitleClass = "text-[11px] font-bold text-slate-800";
  const inlineErrorClass = "text-[11px] font-medium text-rose-500";

  const isContentEmpty = (value: string) => {
    const normalized = value
      .replace(/<p><br><\/p>/g, "")
      .replace(/<[^>]+>/g, "")
      .replace(/&nbsp;/g, " ")
      .trim();

    return !normalized;
  };

  const handleThumbnailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setThumbnailFile(file);
    setThumbnailPreview(URL.createObjectURL(file));
    if (errors.thumbnail) {
      setErrors((prev) => ({ ...prev, thumbnail: undefined }));
    }
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

  useEffect(() => {
    let cancelled = false;

    const loadTags = async () => {
      setLoadingTags(true);
      try {
        const tags = await adminGetBlogTags();
        if (!cancelled) {
          setAvailableTags(tags);
        }
      } catch {
        if (!cancelled) {
          setAvailableTags([]);
        }
      } finally {
        if (!cancelled) {
          setLoadingTags(false);
        }
      }
    };

    void loadTags();

    return () => {
      cancelled = true;
    };
  }, []);

  const filteredTags = useMemo(() => {
    const keyword = tagSearch.trim().toLowerCase();
    const unselectedTags = availableTags.filter((tag) => !selectedTagIds.includes(tag.id));
    if (!keyword) return unselectedTags;

    return unselectedTags.filter((tag) =>
      [tag.name, tag.slug].some((value) => value?.toLowerCase().includes(keyword))
    );
  }, [availableTags, selectedTagIds, tagSearch]);

  const exactMatchedTag = useMemo(() => {
    const keyword = tagSearch.trim().toLowerCase();
    if (!keyword) return null;

    return (
      availableTags.find((tag) =>
        [tag.name, tag.slug].some((value) => value?.trim().toLowerCase() === keyword)
      ) ?? null
    );
  }, [availableTags, tagSearch]);

  const selectedTags = useMemo(
    () => availableTags.filter((tag) => selectedTagIds.includes(tag.id)),
    [availableTags, selectedTagIds]
  );

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

  const toggleTag = (tagId: number) => {
    setSelectedTagIds((prev) =>
      prev.includes(tagId) ? prev.filter((id) => id !== tagId) : [...prev, tagId]
    );
  };

  const addSelectedTag = (tagId: number) => {
    setSelectedTagIds((prev) => (prev.includes(tagId) ? prev : [...prev, tagId]));
  };

  const sortTagsByName = (tags: BlogTagDTO[]) =>
    [...tags].sort((a, b) => a.name.localeCompare(b.name, "vi", { sensitivity: "base" }));

  const handleCreateTag = useCallback(async () => {
    const nextTagName = tagSearch.trim().replace(/\s+/g, " ");
    if (!nextTagName || creatingTag) {
      return;
    }

    if (exactMatchedTag) {
      addSelectedTag(exactMatchedTag.id);
      setTagSearch("");
      return;
    }

    setCreatingTag(true);
    try {
      const createdTag = await adminCreateBlogTag({ name: nextTagName });
      setAvailableTags((prev) => {
        const exists = prev.some((tag) => tag.id === createdTag.id);
        return sortTagsByName(exists ? prev : [...prev, createdTag]);
      });
      addSelectedTag(createdTag.id);
      setTagSearch("");
      toast.success("Đã thêm tag mới");
    } catch {
      toast.error("Tạo tag thất bại");
    } finally {
      setCreatingTag(false);
    }
  }, [creatingTag, exactMatchedTag, tagSearch]);

  const handleTagInputKeyDown = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== "Enter") {
      return;
    }

    e.preventDefault();
    await handleCreateTag();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const nextErrors: {
      title?: string;
      content?: string;
      thumbnail?: string;
      categoryId?: string;
    } = {};

    if (!title.trim()) {
      nextErrors.title = "Vui lòng nhập tiêu đề bài viết";
    }

    if (isContentEmpty(content)) {
      nextErrors.content = "Vui lòng nhập nội dung bài viết";
    }

    if (!thumbnailFile && !thumbnailPreview) {
      nextErrors.thumbnail = "Vui lòng chọn ảnh bìa";
    }

    if (!categoryId) {
      nextErrors.categoryId = "Vui lòng chọn danh mục";
    }

    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    setSaving(true);
    try {
      const payload = {
        title: title.trim(),
        excerpt: excerpt.trim() || undefined,
        content,
        status,
        categoryId: categoryId ? Number(categoryId) : undefined,
        tagIds: selectedTagIds,
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
    <form onSubmit={handleSubmit} className="space-y-5 px-1 pb-[100px] text-slate-800">
      <div className={sectionCardClass}>
        <div className="border-b border-slate-200 pb-3">
          <span className={sectionTitleClass}>1. Thông tin bài viết</span>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-12">
          <div className="space-y-1.5 md:col-span-6">
            <Label className={fieldLabelClass}>
              Tiêu đề <span className="text-rose-500 normal-case">*</span>
            </Label>
            <Input
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                if (errors.title) {
                  setErrors((prev) => ({ ...prev, title: undefined }));
                }
              }}
              placeholder="Nhập tiêu đề bài viết..."
              className={cn(
                fieldControlClass,
                errors.title
                  ? "border-rose-300 bg-white focus-visible:ring-rose-100"
                  : "border-slate-200 bg-white",
              )}
            />
            {errors.title && <p className={inlineErrorClass}>{errors.title}</p>}
          </div>

          <div className="space-y-1.5 md:col-span-6">
            <Label className={fieldLabelClass}>
              Ảnh bìa <span className="text-rose-500 normal-case">*</span>
            </Label>
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleThumbnailChange} aria-label="Tải ảnh bìa lên" />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className={cn(
                  fieldControlClass,
                  "flex min-w-0 flex-1 items-center justify-start rounded-[4px] border bg-white px-3 text-left text-slate-500 transition-colors hover:border-blue-300 hover:text-blue-600",
                  errors.thumbnail ? "border-rose-300 focus-visible:ring-rose-100" : "border-slate-200",
                )}
              >
                <Upload size={14} className="mr-2 shrink-0" />
                <span className="truncate">
                  {thumbnailFile?.name ?? (thumbnailPreview ? "Đã có ảnh bìa" : "Chọn ảnh bìa...")}
                </span>
              </button>
              {thumbnailPreview && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={removeThumbnail}
                  className="h-[38px] shrink-0 rounded-[4px] border-slate-200 px-3 text-[12px] text-slate-500"
                >
                  <X size={12} />
                </Button>
              )}
            </div>
            {errors.thumbnail && <p className={inlineErrorClass}>{errors.thumbnail}</p>}
          </div>

          <div className="space-y-1.5 md:col-span-6">
            <Label className={fieldLabelClass}>Trạng thái</Label>
            <Select value={status} onValueChange={(v) => setStatus(v as "DRAFT" | "PUBLISHED")}>
              <SelectTrigger className={cn(fieldControlClass, "border-slate-200 bg-white")}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="DRAFT" className="text-[13px]">Bản nháp</SelectItem>
                <SelectItem value="PUBLISHED" className="text-[13px]">Xuất bản ngay</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5 md:col-span-6">
            <Label className={fieldLabelClass}>
              Danh mục <span className="text-rose-500 normal-case">*</span>
            </Label>
            <Select
              value={categoryId || EMPTY_CATEGORY_VALUE}
              onValueChange={(value) => {
                setCategoryId(value === EMPTY_CATEGORY_VALUE ? "" : value);
                if (errors.categoryId) {
                  setErrors((prev) => ({ ...prev, categoryId: undefined }));
                }
              }}
            >
              <SelectTrigger
                className={cn(
                  fieldControlClass,
                  errors.categoryId
                    ? "border-rose-300 bg-white focus-visible:ring-rose-100"
                    : "border-slate-200 bg-white",
                )}
              >
                <SelectValue placeholder="Chọn danh mục..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={EMPTY_CATEGORY_VALUE} className="text-[13px]">Không có danh mục</SelectItem>
                {categories.map((c) => (
                  <SelectItem key={c.id} value={String(c.id)} className="text-[13px]">{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.categoryId && <p className={inlineErrorClass}>{errors.categoryId}</p>}
          </div>

          <div className="space-y-1.5 md:col-span-12">
            <div>
              <Label className={fieldLabelClass}>Mô tả ngắn</Label>
              <p className="mt-0.5 text-[10px] text-slate-400">Hiển thị ngoài trang danh sách và kết quả tìm kiếm</p>
            </div>
            <Textarea
              value={excerpt}
              onChange={(e) => setExcerpt(e.target.value)}
              placeholder="Tóm tắt nội dung bài viết..."
              className="min-h-[88px] resize-none border-slate-200 bg-white text-[13px] font-normal text-slate-800 shadow-none placeholder:text-slate-400"
              rows={3}
            />
          </div>

          <div className="space-y-2 md:col-span-12">
            <div>
              <Label className={fieldLabelClass}>Tags</Label>
              <p className="mt-0.5 text-[10px] text-slate-400">Nhập tag rồi nhấn Enter để thêm mới, hoặc chọn lại tag có sẵn</p>
            </div>

            <div className="space-y-2 rounded-[4px] border border-slate-200 bg-slate-50/60 p-3">
              <div className="relative">
                <Search size={13} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <Input
                  value={tagSearch}
                  onChange={(e) => setTagSearch(e.target.value)}
                  onKeyDown={handleTagInputKeyDown}
                  placeholder="Nhập tag và nhấn Enter..."
                  className={cn(fieldControlClass, "border-slate-200 bg-white pl-8")}
                />
                {(loadingTags || creatingTag) && (
                  <Loader2 size={13} className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-slate-400" />
                )}
              </div>

              {selectedTags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {selectedTags.map((tag) => (
                    <button
                      key={tag.id}
                      type="button"
                      onClick={() => toggleTag(tag.id)}
                      className="inline-flex items-center gap-1 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-[11px] font-semibold text-blue-700 transition-colors hover:bg-blue-100"
                    >
                      <span>{tag.name}</span>
                      <X size={11} />
                    </button>
                  ))}
                </div>
              )}

              <div className="max-h-40 overflow-y-auto rounded-[4px] bg-white">
                {tagSearch.trim() && !exactMatchedTag && (
                  <button
                    type="button"
                    onClick={() => void handleCreateTag()}
                    className="flex w-full items-center justify-between gap-3 border-b border-dashed border-slate-200 bg-amber-50/70 px-3 py-2 text-left text-[12px] text-amber-800 transition-colors hover:bg-amber-100/80"
                  >
                    <span className="min-w-0 truncate font-medium">#{tagSearch.trim()}</span>
                    <span className="shrink-0 text-[11px] font-semibold">Tạo</span>
                  </button>
                )}
                {filteredTags.length > 0 ? (
                  filteredTags.map((tag, index) => {
                    const showDivider =
                      index < filteredTags.length - 1 ||
                      (tagSearch.trim() && !exactMatchedTag);

                    return (
                      <button
                        key={tag.id}
                        type="button"
                        onClick={() => toggleTag(tag.id)}
                        className={cn(
                          "flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-[12px] transition-colors",
                          showDivider && "border-b border-slate-100",
                          "text-slate-700 hover:bg-slate-50"
                        )}
                      >
                        <div className="min-w-0">
                          <p className="truncate font-medium">{tag.name}</p>
                          <p className="truncate text-[10px] text-slate-400">{tag.slug}</p>
                        </div>
                        <span className="shrink-0 text-[11px] font-semibold">Chọn</span>
                      </button>
                    );
                  })
                ) : loadingTags || creatingTag ? (
                  <p className="px-3 py-3 text-[12px] text-slate-400">
                    Đang tải tag...
                  </p>
                ) : null}
              </div>
            </div>
          </div>

        </div>
      </div>

      <div className={sectionCardClass}>
        <div className="border-b border-slate-200 pb-3">
          <span className={sectionTitleClass}>2. Nội dung bài viết</span>
        </div>

        <div className="mt-4 space-y-3">
          <Label className={fieldLabelClass}>
            Nội dung bài viết <span className="text-rose-500 normal-case">*</span>
          </Label>
          <div className="overflow-hidden rounded-[4px] border border-slate-200 bg-white">
            <ReactQuill
              theme="snow"
              value={content}
              onChange={(value) => {
                setContent(value);
                if (errors.content && !isContentEmpty(value)) {
                  setErrors((prev) => ({ ...prev, content: undefined }));
                }
              }}
              modules={QUILL_MODULES}
              placeholder="Viết nội dung bài viết tại đây..."
              className="min-h-[420px] text-[13px]"
            />
          </div>
          {errors.content && <p className={inlineErrorClass}>{errors.content}</p>}
        </div>
      </div>

        {/* Sản phẩm liên quan */}
        <div className={sidebarCardClass}>
          <div className="border-b border-slate-200 px-4 py-3">
            <div className="flex items-center justify-between">
              <h3 className={sectionTitleClass}>3. Sản phẩm liên quan</h3>
              {selectedProducts.length > 0 && (
                <span className="text-[11px] font-semibold text-blue-600">
                  {selectedProducts.length}
                </span>
              )}
            </div>
          </div>
          <div className="p-4 space-y-3">
            <p className="text-[10px] text-slate-400">Gắn sản phẩm vào bài viết để người đọc tham khảo mua hàng</p>

            {/* Search box */}
            <div className="relative">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <Input
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
                onFocus={() => setProductFocused(true)}
                onBlur={() => setTimeout(() => setProductFocused(false), 200)}
                placeholder="Tìm tên sản phẩm..."
                className={cn(fieldControlClass, "border-slate-200 bg-white pl-8")}
              />
              {searchingProducts && (
                <Loader2 size={13} className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-slate-400" />
              )}

              {/* Dropdown kết quả */}
              {productFocused && productResults.length > 0 && (
                <div className="absolute left-0 right-0 top-full z-20 mt-1 max-h-52 divide-y divide-slate-50 overflow-y-auto rounded-[4px] border border-slate-200 bg-white shadow-lg">
                  {productResults.map((p) => {
                    const selected = selectedProducts.some((s) => s.id === p.id);
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onMouseDown={() => toggleProduct(p)}
                        className={cn(
                          "flex w-full items-center gap-2.5 px-3 py-2 text-left text-[13px] transition-colors",
                          selected ? "bg-blue-50 text-blue-700" : "hover:bg-slate-50 text-slate-700"
                        )}
                      >
                        <div className="h-8 w-8 shrink-0 overflow-hidden rounded-[4px] border border-slate-100 bg-slate-100">
                          {p.imageUrls?.[0] ? (
                            <img src={p.imageUrls[0]} alt={p.name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full bg-slate-200" />
                          )}
                        </div>
                        <span className="flex-1 truncate font-medium">{p.name}</span>
                        {selected && (
                          <span className="text-[10px] font-semibold text-blue-600 shrink-0">✓</span>
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
                    className="flex items-center gap-2 rounded-[4px] border border-slate-200 bg-slate-50 px-2.5 py-1.5"
                  >
                    <div className="h-7 w-7 shrink-0 overflow-hidden rounded-[4px] border border-slate-200 bg-white">
                      {p.imageUrls?.[0] ? (
                        <img src={p.imageUrls[0]} alt={p.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-slate-200" />
                      )}
                    </div>
                    <span className="flex-1 truncate text-[12px] font-medium text-slate-700">{p.name}</span>
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
              <p className="py-2 text-center text-[12px] text-slate-300">Chưa có sản phẩm nào được gắn</p>
            )}
          </div>
        </div>

      <div className="fixed bottom-0 left-0 right-0 z-[999] border-t border-slate-200 bg-white px-4 py-3 lg:left-[260px]">
        <div className="flex flex-wrap justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            className="h-10 min-w-[110px] rounded-md border-slate-300 bg-white px-6 text-[13px] font-medium text-slate-600 hover:bg-slate-50"
          >
            Hủy
          </Button>
          <Button
            type="submit"
            disabled={saving}
            className="h-10 min-w-[160px] rounded-md bg-blue-600 px-6 text-[13px] font-semibold text-white hover:bg-blue-700"
          >
            {saving ? <Loader2 className="mr-2 animate-spin" size={16} /> : <Save size={16} className="mr-2" />}
            {isEdit ? "Lưu thay đổi" : "Lưu bài viết"}
          </Button>
        </div>
      </div>
    </form>
  );
}

