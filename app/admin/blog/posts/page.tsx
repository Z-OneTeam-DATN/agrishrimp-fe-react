"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  Plus, Edit, Trash2, Eye, EyeOff, Loader2, FileText,
} from "lucide-react";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { AdminSearchFilter } from "@/components/admin/shared/AdminSearchFilter";
import { cn } from "@/lib/utils";
import {
  BlogPostDTO,
  adminGetBlogPosts,
  adminPublishBlogPost,
  adminDraftBlogPost,
  adminDeleteBlogPost,
} from "@/app/services/blog.service";

export default function BlogPostsPage() {
  const [posts, setPosts] = useState<BlogPostDTO[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);

  const [keyword, setKeyword] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [togglingId, setTogglingId] = useState<number | null>(null);

  const loadData = async (kw = keyword, st = statusFilter, p = page) => {
    setLoading(true);
    try {
      const res = await adminGetBlogPosts({
        keyword: kw || undefined,
        status: st === "all" ? undefined : st,
        page: p,
        size: 15,
      });
      setPosts(res.content ?? []);
      setTotal(res.totalElements ?? 0);
    } catch {
      toast.error("Không thể tải danh sách bài viết");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []); // eslint-disable-line

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
      await loadData();
    } catch {
      toast.error("Cập nhật trạng thái thất bại");
    } finally {
      setTogglingId(null);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await adminDeleteBlogPost(deleteId);
      toast.success("Đã xóa bài viết");
      await loadData();
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

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-2xl font-black text-slate-800 uppercase tracking-tight">Bài viết blog</h1>
          <p className="mt-1 text-sm text-slate-500">{total} bài viết tổng cộng</p>
        </div>
        <div className="flex gap-2">
          <Link href="/admin/blog/categories">
            <Button variant="outline" className="font-semibold h-9 text-sm">Danh mục</Button>
          </Link>
          <Link href="/admin/blog/posts/new">
            <Button className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold h-9">
              <Plus size={16} className="mr-1.5" /> Viết bài mới
            </Button>
          </Link>
        </div>
      </div>

      <div className="bg-white border border-[#dcdcdc] rounded-[4px] shadow-[0_1px_2px_rgba(0,0,0,0.05)] overflow-hidden">
        <AdminSearchFilter
          placeholder="Tìm tiêu đề bài viết..."
          hideFilter1
          hideSettingsButton
          filter2Placeholder="Tất cả trạng thái"
          filter2Options={[
            { label: "Tất cả trạng thái", value: "all" },
            { label: "Đã xuất bản", value: "PUBLISHED" },
            { label: "Bản nháp", value: "DRAFT" },
          ]}
          onSearch={(v) => { setKeyword(v); setPage(0); loadData(v, statusFilter, 0); }}
          onFilter2Change={(v) => { setStatusFilter(v); setPage(0); loadData(keyword, v, 0); }}
          onRefresh={() => loadData()}
        />

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-sm text-slate-500 font-semibold">
                <th className="p-3 pl-5 w-[60px]">ID</th>
                <th className="p-3 w-[90px]">Ảnh</th>
                <th className="p-3">Tiêu đề / Danh mục</th>
                <th className="p-3 w-[130px]">Tác giả</th>
                <th className="p-3 text-center w-[100px]">Lượt xem</th>
                <th className="p-3 text-center w-[120px]">Ngày tạo</th>
                <th className="p-3 text-center w-[110px]">Trạng thái</th>
                <th className="p-3 text-right pr-5 w-[110px]">Hành động</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b border-slate-100">
                    <td className="p-3 pl-5"><div className="h-4 w-8 bg-slate-100 rounded animate-pulse" /></td>
                    <td className="p-3"><div className="h-14 w-20 bg-slate-100 rounded animate-pulse" /></td>
                    <td className="p-3"><div className="h-4 w-56 bg-slate-100 rounded animate-pulse" /></td>
                    <td className="p-3"><div className="h-4 w-24 bg-slate-100 rounded animate-pulse" /></td>
                    <td className="p-3"><div className="h-4 w-12 bg-slate-100 rounded animate-pulse mx-auto" /></td>
                    <td className="p-3"><div className="h-4 w-20 bg-slate-100 rounded animate-pulse mx-auto" /></td>
                    <td className="p-3"><div className="h-5 w-20 bg-slate-100 rounded animate-pulse mx-auto" /></td>
                    <td className="p-3" />
                  </tr>
                ))
              ) : posts.length > 0 ? (
                posts.map((post) => (
                  <tr key={post.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                    <td className="p-3 pl-5 text-sm text-slate-500 font-mono font-bold">#{post.id}</td>
                    <td className="p-3">
                      <div className="w-20 h-12 rounded border border-slate-200 bg-slate-100 overflow-hidden flex items-center justify-center shrink-0">
                        {post.thumbnailUrl ? (
                          <img src={post.thumbnailUrl} alt={post.title} className="w-full h-full object-cover" />
                        ) : (
                          <FileText size={16} className="text-slate-300" />
                        )}
                      </div>
                    </td>
                    <td className="p-3">
                      <p className="text-[15px] font-semibold text-slate-800 line-clamp-2 leading-snug">{post.title}</p>
                      {post.category && (
                        <span className="mt-1 inline-block text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full font-medium">
                          {post.category.name}
                        </span>
                      )}
                    </td>
                    <td className="p-3 text-sm text-slate-600">{post.author?.fullName ?? "—"}</td>
                    <td className="p-3 text-center text-sm text-slate-600">{(post.viewCount ?? 0).toLocaleString("vi-VN")}</td>
                    <td className="p-3 text-center text-sm text-slate-500">{formatDate(post.createdAt)}</td>
                    <td className="p-3 text-center">
                      <span className={cn(
                        "text-xs font-semibold px-3 py-1 rounded-full border",
                        post.status === "PUBLISHED"
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : "bg-amber-50 text-amber-700 border-amber-200"
                      )}>
                        {post.status === "PUBLISHED" ? "Xuất bản" : "Nháp"}
                      </span>
                    </td>
                    <td className="p-3 text-right pr-4">
                      <div className="flex justify-end gap-1.5">
                        <Button
                          variant="ghost" size="icon"
                          title={post.status === "PUBLISHED" ? "Chuyển về nháp" : "Xuất bản"}
                          disabled={togglingId === post.id}
                          className={cn("h-8 w-8", post.status === "PUBLISHED"
                            ? "text-amber-600 hover:bg-amber-50"
                            : "text-emerald-600 hover:bg-emerald-50"
                          )}
                          onClick={() => handleToggle(post)}
                        >
                          {togglingId === post.id
                            ? <Loader2 size={14} className="animate-spin" />
                            : post.status === "PUBLISHED" ? <EyeOff size={15} /> : <Eye size={15} />
                          }
                        </Button>
                        <Link href={`/admin/blog/posts/${post.id}/edit`}>
                          <Button variant="ghost" size="icon" title="Chỉnh sửa" className="h-8 w-8 text-blue-600 hover:bg-blue-50">
                            <Edit size={15} />
                          </Button>
                        </Link>
                        <Button
                          variant="ghost" size="icon" title="Xóa"
                          className="h-8 w-8 text-red-600 hover:bg-red-50"
                          onClick={() => setDeleteId(post.id)}
                        >
                          <Trash2 size={15} />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-400 italic font-medium">
                    Chưa có bài viết nào.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-rose-600 font-bold">Xác nhận xóa bài viết</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-500 font-medium">
              Bài viết sẽ bị xóa vĩnh viễn và không thể khôi phục.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="font-medium h-9 text-sm">Hủy bỏ</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-rose-600 hover:bg-rose-700 text-white font-medium h-9 text-sm">
              Đồng ý xóa
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
