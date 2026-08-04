"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  Plus, Edit, Trash2, Eye, EyeOff, Loader2, FileText, Search, CheckCircle2, XCircle,
} from "lucide-react";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { usePermissions } from "@/hooks/usePermissions";
import { P } from "@/lib/permissions";
import {
  BlogAuthorDTO,
  BlogCategoryDTO,
  BlogPostDTO,
  adminGetBlogAuthors,
  adminGetBlogCategories,
  adminGetBlogPosts,
  adminPublishBlogPost,
  adminDraftBlogPost,
  adminApproveBlogPost,
  adminRejectBlogPost,
  adminDeleteBlogPost,
} from "@/app/services/blog.service";

const PAGE_SIZE = 20;

const STATUS_LABELS: Record<string, { label: string; className: string }> = {
  PUBLISHED: { label: "Đã xuất bản", className: "text-emerald-600" },
  IN_REVIEW: { label: "Chờ duyệt", className: "text-amber-600" },
  DRAFT: { label: "Nháp", className: "text-slate-500" },
};

export default function BlogPostsPage() {
  const { hasPermission } = usePermissions();
  const canApprove = hasPermission(P.BLOG_APPROVE);

  const [posts, setPosts] = useState<BlogPostDTO[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);

  const [keyword, setKeyword] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [authorFilter, setAuthorFilter] = useState("all");
  const [categories, setCategories] = useState<BlogCategoryDTO[]>([]);
  const [authors, setAuthors] = useState<BlogAuthorDTO[]>([]);

  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [togglingId, setTogglingId] = useState<number | null>(null);
  const [approvingId, setApprovingId] = useState<number | null>(null);
  const [rejectTarget, setRejectTarget] = useState<BlogPostDTO | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [rejecting, setRejecting] = useState(false);
  const didInitKeywordEffect = useRef(false);

  const loadData = async (
    kw = keyword,
    st = statusFilter,
    cat = categoryFilter,
    author = authorFilter,
    p = page,
  ) => {
    setLoading(true);
    try {
      const res = await adminGetBlogPosts({
        keyword: kw || undefined,
        status: st === "all" ? undefined : st,
        categoryId: cat === "all" ? undefined : Number(cat),
        authorId: author === "all" ? undefined : Number(author),
        page: p,
        size: PAGE_SIZE,
      });
      setPosts(res.content ?? []);
      setTotal(res.totalElements ?? 0);
    } catch {
      toast.error("Không thể tải danh sách bài viết");
    } finally {
      setLoading(false);
    }
  };

  const loadFilterOptions = async () => {
    try {
      const [categoriesData, authorsData] = await Promise.all([
        adminGetBlogCategories(),
        adminGetBlogAuthors(),
      ]);
      setCategories(categoriesData);
      setAuthors(authorsData);
    } catch {
      toast.error("Không thể tải bộ lọc blog");
    }
  };

  useEffect(() => {
    loadData("", "all", "all", "all", 0);
    loadFilterOptions();
  }, []);

  useEffect(() => {
    if (!didInitKeywordEffect.current) {
      didInitKeywordEffect.current = true;
      return;
    }

    const timer = window.setTimeout(() => {
      setPage(0);
      loadData(keyword, statusFilter, categoryFilter, authorFilter, 0);
    }, 400);

    return () => window.clearTimeout(timer);
  }, [keyword]);

  const handleToggle = async (post: BlogPostDTO) => {
    setTogglingId(post.id);
    try {
      if (post.status === "PUBLISHED") {
        await adminDraftBlogPost(post.id);
        toast.success("Đã chuyển về bản nháp");
      } else {
        await adminPublishBlogPost(post.id);
        toast.success("Đã xuất bản bài viết");
      }
      await loadData(keyword, statusFilter, categoryFilter, authorFilter, page);
    } catch {
      toast.error("Cập nhật trạng thái thất bại");
    } finally {
      setTogglingId(null);
    }
  };

  const handleApprove = async (post: BlogPostDTO) => {
    setApprovingId(post.id);
    try {
      await adminApproveBlogPost(post.id);
      toast.success("Đã duyệt và xuất bản bài viết");
      await loadData(keyword, statusFilter, categoryFilter, authorFilter, page);
    } catch {
      toast.error("Duyệt bài viết thất bại");
    } finally {
      setApprovingId(null);
    }
  };

  const handleReject = async () => {
    if (!rejectTarget) return;
    setRejecting(true);
    try {
      await adminRejectBlogPost(rejectTarget.id, rejectReason.trim());
      toast.success("Đã gửi yêu cầu chỉnh sửa cho tác giả");
      await loadData(keyword, statusFilter, categoryFilter, authorFilter, page);
      setRejectTarget(null);
      setRejectReason("");
    } catch {
      toast.error("Gửi yêu cầu chỉnh sửa thất bại");
    } finally {
      setRejecting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await adminDeleteBlogPost(deleteId);
      toast.success("Đã xóa bài viết");
      await loadData(keyword, statusFilter, categoryFilter, authorFilter, page);
    } catch {
      toast.error("Xóa bài viết thất bại");
    } finally {
      setDeleteId(null);
    }
  };

  const formatDate = (s: string | null) => {
    if (!s) return "—";
    return new Intl.DateTimeFormat("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" }).format(new Date(s));
  };

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const statusTabs = [
    { id: "all", label: "Tất cả" },
    { id: "PUBLISHED", label: "Đã xuất bản" },
    { id: "IN_REVIEW", label: "Chờ duyệt" },
    { id: "DRAFT", label: "Bản nháp" },
  ];

  const handleStatusChange = (status: string) => {
    setStatusFilter(status);
    setPage(0);
    loadData(keyword, status, categoryFilter, authorFilter, 0);
  };

  const handleCategoryChange = (category: string) => {
    setCategoryFilter(category);
    setPage(0);
    loadData(keyword, statusFilter, category, authorFilter, 0);
  };

  const handleAuthorChange = (author: string) => {
    setAuthorFilter(author);
    setPage(0);
    loadData(keyword, statusFilter, categoryFilter, author, 0);
  };

  const handlePageChange = (nextPage: number) => {
    if (nextPage < 0 || nextPage >= totalPages) return;
    setPage(nextPage);
    loadData(keyword, statusFilter, categoryFilter, authorFilter, nextPage);
  };

  const visiblePublishedCount = posts.filter((post) => post.status === "PUBLISHED").length;
  const visibleDraftCount = posts.filter((post) => post.status !== "PUBLISHED").length;
  const visibleViewCount = posts.reduce((sum, post) => sum + (post.viewCount ?? 0), 0);
  const mostViewedPost = posts.reduce<BlogPostDTO | null>((topPost, post) => {
    if (!topPost) return post;
    return (post.viewCount ?? 0) > (topPost.viewCount ?? 0) ? post : topPost;
  }, null);
  const miniReports = [
    {
      label: "Tổng lượt xem",
      value: visibleViewCount.toLocaleString("vi-VN"),
      note: `${posts.length} bài viết đang hiển thị`,
    },
    {
      label: "Được chú ý nhất",
      value: mostViewedPost ? `${(mostViewedPost.viewCount ?? 0).toLocaleString("vi-VN")} lượt xem` : "0 lượt xem",
      note: mostViewedPost?.title ?? "Chưa có dữ liệu",
    },
    {
      label: "Đã xuất bản",
      value: visiblePublishedCount.toLocaleString("vi-VN"),
      note: "Bài viết đang ở trạng thái công khai",
    },
    {
      label: "Bản nháp",
      value: visibleDraftCount.toLocaleString("vi-VN"),
      note: "Bài viết cần hoàn thiện nội dung",
    },
  ];

  return (
    <div className="space-y-3">
      <div className="mt-2 mb-8 px-1">
        <div>
          <h1 className="text-[20px] font-semibold tracking-tight uppercase text-slate-900">
            Bài viết blog
          </h1>
        </div>

        <div className="mt-4 flex flex-col gap-2 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex flex-1 flex-col gap-2 lg:flex-row lg:flex-wrap lg:items-center">
            <div className="relative w-full lg:max-w-[360px]">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300"
              />
              <Input
                value={keyword}
                onChange={(event) => setKeyword(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    setPage(0);
                    loadData(keyword, statusFilter, categoryFilter, authorFilter, 0);
                  }
                }}
                placeholder="Tìm từ khóa bài viết..."
                className="h-[38px] rounded-md border-slate-200 bg-white pl-10 text-[13px] shadow-none focus-visible:ring-blue-500/20"
              />
            </div>

            <Select value={statusFilter} onValueChange={handleStatusChange}>
              <SelectTrigger className="h-[38px] w-full rounded-md border-slate-200 bg-white text-[13px] font-medium text-slate-600 shadow-none focus:ring-0 lg:w-[180px]">
                <SelectValue placeholder="Tất cả trạng thái" />
              </SelectTrigger>
              <SelectContent>
                {statusTabs.map((tab) => (
                  <SelectItem key={tab.id} value={tab.id} className="text-[13px]">
                    {tab.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={authorFilter} onValueChange={handleAuthorChange}>
              <SelectTrigger className="h-[38px] w-full rounded-md border-slate-200 bg-white text-[13px] font-medium text-slate-600 shadow-none focus:ring-0 lg:w-[200px]">
                <SelectValue placeholder="Tất cả tác giả" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="text-[13px]">Tất cả tác giả</SelectItem>
                {authors.map((author) => (
                  <SelectItem key={author.id} value={String(author.id)} className="text-[13px]">
                    {author.fullName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={categoryFilter} onValueChange={handleCategoryChange}>
              <SelectTrigger className="h-[38px] w-full rounded-md border-slate-200 bg-white text-[13px] font-medium text-slate-600 shadow-none focus:ring-0 lg:w-[200px]">
                <SelectValue placeholder="Tất cả danh mục" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="text-[13px]">Tất cả danh mục</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={String(category.id)} className="text-[13px]">
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-wrap justify-end gap-2">
            <Link href="/admin/blog/posts/new">
              <Button className="h-[38px] rounded-[4px] bg-blue-600 px-4 text-[13px] font-medium text-white shadow-sm hover:bg-blue-700">
                <Plus size={15} className="mr-1.5" />
                Viết bài mới
              </Button>
            </Link>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-2.5 sm:grid-cols-2 xl:grid-cols-4">
          {miniReports.map((report) => (
            <div
              key={report.label}
              className="rounded-[4px] border border-slate-200 bg-white p-4 shadow-sm"
            >
              <p className="text-[11px] font-semibold text-slate-400">
                {report.label}
              </p>
              <p className="mt-1 truncate text-[18px] font-semibold leading-6 text-slate-900">
                {report.value}
              </p>
              <p className="mt-1 line-clamp-2 text-[10px] leading-4 text-slate-500">
                {report.note}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div className="overflow-hidden rounded-[4px] border border-[#dcdcdc] bg-white shadow-sm">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="table-custom min-w-[1060px] w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-[#ccc] bg-[#f0f0f0]">
                <th className="w-[56px] px-4 py-3 text-[10px] font-semibold text-[#1f1f1f]">STT</th>
                <th className="w-[84px] px-2 py-3 text-[10px] font-semibold text-[#1f1f1f]">Ảnh</th>
                <th className="px-2 py-3 text-[10px] font-semibold text-[#1f1f1f]">Tiêu đề / Danh mục</th>
                <th className="w-[140px] px-2 py-3 text-[10px] font-semibold text-[#1f1f1f]">Tác giả</th>
                <th className="w-[92px] px-2 py-3 text-center text-[10px] font-semibold text-[#1f1f1f]">Lượt xem</th>
                <th className="w-[112px] px-2 py-3 text-center text-[10px] font-semibold text-[#1f1f1f]">Ngày tạo</th>
                <th className="w-[112px] px-2 py-3 text-center text-[10px] font-semibold text-[#1f1f1f]">Trạng thái</th>
                <th className="w-[118px] px-4 py-3 text-right text-[10px] font-semibold text-[#1f1f1f]">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b border-[#eee]">
                    <td className="px-4 py-3"><div className="h-3.5 w-6 animate-pulse rounded bg-slate-100" /></td>
                    <td className="px-2 py-3"><div className="h-10 w-16 animate-pulse rounded bg-slate-100" /></td>
                    <td className="px-2 py-3"><div className="h-3.5 w-56 animate-pulse rounded bg-slate-100" /></td>
                    <td className="px-2 py-3"><div className="h-3.5 w-24 animate-pulse rounded bg-slate-100" /></td>
                    <td className="px-2 py-3"><div className="mx-auto h-3.5 w-12 animate-pulse rounded bg-slate-100" /></td>
                    <td className="px-2 py-3"><div className="mx-auto h-3.5 w-20 animate-pulse rounded bg-slate-100" /></td>
                    <td className="px-2 py-3"><div className="mx-auto h-5 w-20 animate-pulse rounded bg-slate-100" /></td>
                    <td className="px-4 py-3" />
                  </tr>
                ))
              ) : posts.length > 0 ? (
                posts.map((post, index) => (
                  <tr key={post.id} className="border-b border-[#eee] transition-colors hover:bg-[#f0f8ff]">
                    <td className="px-4 py-3 text-[11px] font-medium text-slate-500">{page * PAGE_SIZE + index + 1}</td>
                    <td className="px-2 py-3">
                      <div className="flex h-10 w-16 shrink-0 items-center justify-center overflow-hidden rounded-[4px] border border-slate-200 bg-slate-100">
                        {post.thumbnailUrl ? (
                          <img src={post.thumbnailUrl} alt={post.title} className="w-full h-full object-cover" />
                        ) : (
                          <FileText size={16} className="text-slate-300" />
                        )}
                      </div>
                    </td>
                    <td className="px-2 py-3">
                      <p className="line-clamp-2 text-[11px] font-semibold leading-snug text-slate-800">{post.title}</p>
                      {post.category && (
                        <span className="mt-1 block text-[10px] font-medium text-slate-500">
                          {post.category.name}
                        </span>
                      )}
                    </td>
                    <td className="px-2 py-3 text-[11px] text-slate-600">{post.author?.fullName ?? "—"}</td>
                    <td className="px-2 py-3 text-center text-[11px] text-slate-600">{(post.viewCount ?? 0).toLocaleString("vi-VN")}</td>
                    <td className="px-2 py-3 text-center text-[11px] text-slate-500">{formatDate(post.createdAt)}</td>
                    <td className="px-2 py-3 text-center">
                      <span className={cn("text-[11px] font-medium", (STATUS_LABELS[post.status] ?? STATUS_LABELS.DRAFT).className)}>
                        {(STATUS_LABELS[post.status] ?? STATUS_LABELS.DRAFT).label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-1">
                        {post.status === "IN_REVIEW" && canApprove ? (
                          <>
                            <Button
                              variant="ghost" size="icon"
                              title="Duyệt bài viết"
                              disabled={approvingId === post.id}
                              className="h-7 w-7 rounded-[4px] text-slate-400 hover:bg-emerald-50 hover:text-emerald-600"
                              onClick={() => handleApprove(post)}
                            >
                              {approvingId === post.id
                                ? <Loader2 size={14} className="animate-spin" />
                                : <CheckCircle2 size={15} />
                              }
                            </Button>
                            <Button
                              variant="ghost" size="icon"
                              title="Yêu cầu chỉnh sửa"
                              className="h-7 w-7 rounded-[4px] text-slate-400 hover:bg-amber-50 hover:text-amber-600"
                              onClick={() => setRejectTarget(post)}
                            >
                              <XCircle size={15} />
                            </Button>
                          </>
                        ) : (
                          <Button
                            variant="ghost" size="icon"
                            title={post.status === "PUBLISHED" ? "Chuyển về nháp" : "Xuất bản"}
                            disabled={togglingId === post.id}
                            className={cn("h-7 w-7 rounded-[4px] text-slate-400", post.status === "PUBLISHED"
                              ? "hover:bg-amber-50 hover:text-amber-600"
                              : "hover:bg-blue-50 hover:text-blue-600"
                            )}
                            onClick={() => handleToggle(post)}
                          >
                            {togglingId === post.id
                              ? <Loader2 size={14} className="animate-spin" />
                              : post.status === "PUBLISHED" ? <EyeOff size={15} /> : <Eye size={15} />
                            }
                          </Button>
                        )}
                        <Link href={`/admin/blog/posts/${post.id}/edit`}>
                          <Button variant="ghost" size="icon" title="Chỉnh sửa" className="h-7 w-7 rounded-[4px] text-slate-400 hover:bg-blue-50 hover:text-blue-600">
                            <Edit size={14} />
                          </Button>
                        </Link>
                        <Button
                          variant="ghost" size="icon" title="Xóa"
                          className="h-7 w-7 rounded-[4px] text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                          onClick={() => setDeleteId(post.id)}
                        >
                          <Trash2 size={14} />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="h-[180px] text-center text-[12px] font-medium text-slate-400">
                    Chưa có bài viết nào.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="flex min-w-full shrink-0 items-center justify-between border-t border-slate-100 bg-[#f8f9fa] px-5 py-3">
          <p className="text-[12px] font-semibold text-slate-500">
            Tổng số: {total} bài viết
          </p>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              disabled={page === 0 || loading}
              onClick={() => handlePageChange(page - 1)}
              className="h-7 px-3 text-[11px] font-bold uppercase text-slate-400 hover:bg-slate-100"
            >
              Trước
            </Button>
            <span className="rounded-full bg-slate-100 px-4 py-1.5 text-[12px] font-bold text-slate-700">
              {page + 1} / {totalPages}
            </span>
            <Button
              variant="ghost"
              disabled={page + 1 >= totalPages || loading}
              onClick={() => handlePageChange(page + 1)}
              className="h-7 px-3 text-[11px] font-bold uppercase text-slate-400 hover:bg-slate-100"
            >
              Sau
            </Button>
          </div>
        </div>
      </div>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent className="max-w-[400px] rounded-[6px] border border-slate-200 bg-white shadow-xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-[16px] font-bold text-rose-600">Xác nhận xóa bài viết</AlertDialogTitle>
            <AlertDialogDescription className="text-[13px] font-medium text-slate-500">
              Bài viết sẽ bị xóa vĩnh viễn và không thể khôi phục.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="h-9 rounded-[4px] text-[13px] font-medium">Hủy bỏ</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="h-9 rounded-[4px] bg-rose-600 text-[13px] font-medium text-white hover:bg-rose-700">
              Đồng ý xóa
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog
        open={Boolean(rejectTarget)}
        onOpenChange={(open) => {
          if (!open) {
            setRejectTarget(null);
            setRejectReason("");
          }
        }}
      >
        <DialogContent className="max-w-[440px] gap-0 rounded-[6px] border-slate-200 bg-white p-0 shadow-xl">
          <DialogHeader className="border-b border-slate-100 px-6 py-5">
            <DialogTitle className="text-[16px] font-semibold text-slate-900">
              Yêu cầu chỉnh sửa
            </DialogTitle>
            <DialogDescription className="mt-1 text-[12px] text-slate-500">
              Bài viết &quot;{rejectTarget?.title}&quot; sẽ chuyển về trạng thái Nháp. Lý do sẽ hiển
              thị cho tác giả khi họ mở lại để sửa.
            </DialogDescription>
          </DialogHeader>
          <div className="px-6 py-5">
            <Textarea
              value={rejectReason}
              onChange={(event) => setRejectReason(event.target.value)}
              placeholder="VD: Bổ sung ảnh minh họa, kiểm tra lại chính tả..."
              className="min-h-[100px] border-slate-200 text-[13px]"
            />
          </div>
          <DialogFooter className="border-t border-slate-100 px-6 py-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setRejectTarget(null)}
              className="h-[38px] border-slate-200 bg-white px-4 text-[13px] font-medium shadow-none"
            >
              Hủy
            </Button>
            <Button
              type="button"
              disabled={!rejectReason.trim() || rejecting}
              onClick={handleReject}
              className="h-[38px] bg-amber-600 px-4 text-[13px] font-medium hover:bg-amber-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {rejecting ? <Loader2 size={15} className="mr-2 animate-spin" /> : null}
              Gửi yêu cầu
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

