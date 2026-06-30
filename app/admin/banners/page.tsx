"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  Image as ImageIcon,
  Plus,
  Loader2,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  ExternalLink,
  Search,
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getErrorMessage } from "@/lib/axios";
import { cn } from "@/lib/utils";
import {
  BannerDTO,
  adminDeleteBanner,
  adminGetBanners,
  adminToggleBanner,
} from "@/app/services/banner.service";

export default function BannersPage() {
  const [allBanners, setAllBanners] = useState<BannerDTO[]>([]);
  const [banners, setBanners] = useState<BannerDTO[]>([]);
  const [loading, setLoading] = useState(true);

  const [keyword, setKeyword] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("displayOrder,asc");

  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [statusModal, setStatusModal] = useState<{
    id: number;
    title: string;
    isActive: boolean;
  } | null>(null);
  const [togglingId, setTogglingId] = useState<number | null>(null);

  const summary = useMemo(() => {
    const activeCount = allBanners.filter((banner) => banner.isActive).length;
    const inactiveCount = allBanners.length - activeCount;
    const linkedCount = allBanners.filter((banner) => banner.linkUrl).length;

    return {
      total: allBanners.length,
      active: activeCount,
      inactive: inactiveCount,
      linked: linkedCount,
    };
  }, [allBanners]);

  const summaryCards = useMemo(
    () => [
      {
        label: "Tổng banner",
        value: summary.total.toLocaleString("vi-VN"),
        note: "Tất cả banner đã tạo",
      },
      {
        label: "Có liên kết",
        value: summary.linked.toLocaleString("vi-VN"),
        note: "Banner điều hướng sang trang khác",
      },
      {
        label: "Đang hiển thị",
        value: summary.active.toLocaleString("vi-VN"),
        note: "Banner đang công khai ngoài trang chủ",
      },
      {
        label: "Tạm ẩn",
        value: summary.inactive.toLocaleString("vi-VN"),
        note: "Banner chưa hiển thị với khách hàng",
      },
    ],
    [summary],
  );

  const formatDate = useCallback((value: string | null) => {
    if (!value) return "∞";

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value.slice(0, 10);

    return new Intl.DateTimeFormat("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).format(date);
  }, []);

  const sortBanners = useCallback((data: BannerDTO[], sortValue: string) => {
    const result = [...data];

    result.sort((a, b) => {
      switch (sortValue) {
        case "displayOrder,desc":
          return (b.displayOrder ?? 0) - (a.displayOrder ?? 0);
        case "title,asc":
          return (a.title ?? "").localeCompare(b.title ?? "", "vi", {
            sensitivity: "base",
          });
        case "title,desc":
          return (b.title ?? "").localeCompare(a.title ?? "", "vi", {
            sensitivity: "base",
          });
        case "createdAt,asc":
          return (
            new Date(a.createdAt ?? 0).getTime() -
            new Date(b.createdAt ?? 0).getTime()
          );
        case "createdAt,desc":
          return (
            new Date(b.createdAt ?? 0).getTime() -
            new Date(a.createdAt ?? 0).getTime()
          );
        case "displayOrder,asc":
        default:
          return (a.displayOrder ?? 0) - (b.displayOrder ?? 0);
      }
    });

    return result;
  }, []);

  const applyFilters = useCallback(
    (
      data: BannerDTO[],
      kw = keyword,
      status = statusFilter,
      sortValue = sortBy,
    ) => {
      let result = [...data];

      if (kw.trim()) {
        const lower = kw.trim().toLowerCase();
        result = result.filter(
          (banner) =>
            banner.title?.toLowerCase().includes(lower) ||
            banner.linkUrl?.toLowerCase().includes(lower),
        );
      }

      if (status !== "all") {
        result = result.filter((banner) =>
          status === "ACTIVE" ? banner.isActive : !banner.isActive,
        );
      }

      setBanners(sortBanners(result, sortValue));
    },
    [keyword, sortBy, sortBanners, statusFilter],
  );

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await adminGetBanners();
      setAllBanners(data);
    } catch (error) {
      toast.error(
        getErrorMessage(error as any) || "Không thể tải danh sách banner",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    applyFilters(allBanners, keyword, statusFilter, sortBy);
  }, [allBanners, applyFilters, keyword, statusFilter, sortBy]);

  const handleToggleStatus = async () => {
    if (!statusModal) return;

    setTogglingId(statusModal.id);
    try {
      await adminToggleBanner(statusModal.id);
      toast.success(
        `Đã ${statusModal.isActive ? "ẩn" : "hiện"} banner: ${statusModal.title || "Banner"}`,
      );
      await loadData();
    } catch (error) {
      toast.error(
        getErrorMessage(error as any) || "Cập nhật trạng thái thất bại",
      );
    } finally {
      setTogglingId(null);
      setStatusModal(null);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;

    try {
      await adminDeleteBanner(deleteId);
      toast.success("Đã xóa banner");
      setAllBanners((current) => current.filter((banner) => banner.id !== deleteId));
    } catch (error) {
      toast.error(getErrorMessage(error as any) || "Xóa banner thất bại");
    } finally {
      setDeleteId(null);
    }
  };

  return (
    <div className="space-y-3 pb-[100px] text-slate-800">
      <div className="mt-2 mb-8 space-y-4 px-1">
        <div>
          <h1 className="text-[20px] font-semibold tracking-tight uppercase text-slate-900">
            Quản lý banner
          </h1>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-2.5 md:grid-cols-2 xl:grid-cols-4">
        {summaryCards.map((card) => (
          <div
            key={card.label}
            className="rounded-[4px] border border-[#dcdcdc] bg-white p-3 shadow-sm"
          >
            <p className="text-[11px] font-semibold text-slate-400">
              {card.label}
            </p>
            <p className="mt-1 truncate text-[18px] font-semibold leading-6 text-slate-900">
              {card.value}
            </p>
            <p className="mt-1 line-clamp-2 text-[10px] leading-4 text-slate-500">
              {card.note}
            </p>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-2 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="relative w-full sm:w-[360px]">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300"
            />
            <Input
              value={keyword}
              onChange={(event) => setKeyword(event.target.value)}
              placeholder="Tìm tiêu đề, đường dẫn..."
              className="h-[38px] rounded-md border-slate-200 bg-white pl-10 text-[13px] shadow-none focus-visible:ring-blue-500/20"
            />
          </div>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="h-[38px] w-full rounded-md border-slate-200 bg-white text-[13px] font-medium text-slate-600 shadow-none focus:ring-0 sm:w-[180px]">
              <SelectValue placeholder="Tất cả trạng thái" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="text-[13px]">
                Tất cả trạng thái
              </SelectItem>
              <SelectItem value="ACTIVE" className="text-[13px]">
                Đang hiển thị
              </SelectItem>
              <SelectItem value="INACTIVE" className="text-[13px]">
                Tạm ẩn
              </SelectItem>
            </SelectContent>
          </Select>

          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="h-[38px] w-full rounded-md border-slate-200 bg-white text-[13px] font-medium text-slate-600 shadow-none focus:ring-0 sm:w-[180px]">
              <SelectValue placeholder="Sắp xếp" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="displayOrder,asc" className="text-[13px]">
                Vị trí tăng dần
              </SelectItem>
              <SelectItem value="displayOrder,desc" className="text-[13px]">
                Vị trí giảm dần
              </SelectItem>
              <SelectItem value="createdAt,desc" className="text-[13px]">
                Mới nhất
              </SelectItem>
              <SelectItem value="createdAt,asc" className="text-[13px]">
                Cũ nhất
              </SelectItem>
              <SelectItem value="title,asc" className="text-[13px]">
                Tiêu đề A-Z
              </SelectItem>
              <SelectItem value="title,desc" className="text-[13px]">
                Tiêu đề Z-A
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-wrap justify-end gap-2">
          <Link href="/admin/banners/new">
            <Button className="h-[38px] rounded-[4px] bg-blue-600 px-4 text-[13px] font-medium text-white shadow-sm hover:bg-blue-700">
              <Plus className="mr-1.5" size={15} /> Thêm banner mới
            </Button>
          </Link>
        </div>
      </div>

      <div className="overflow-hidden rounded-[4px] border border-[#dcdcdc] bg-white shadow-sm">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="table-custom min-w-[980px] w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-[#ccc] bg-[#f0f0f0]">
                <th className="w-[70px] px-4 py-3 text-[10px] font-semibold text-[#1f1f1f]">
                  STT
                </th>
                <th className="w-[100px] px-2 py-3 text-[10px] font-semibold text-[#1f1f1f]">
                  Ảnh
                </th>
                <th className="px-2 py-3 text-[10px] font-semibold text-[#1f1f1f]">
                  Tên banner / liên kết
                </th>
                <th className="w-[120px] px-2 py-3 text-center text-[10px] font-semibold text-[#1f1f1f]">
                  Vị trí
                </th>
                <th className="w-[180px] px-2 py-3 text-center text-[10px] font-semibold text-[#1f1f1f]">
                  Hiệu lực
                </th>
                <th className="w-[120px] px-2 py-3 text-center text-[10px] font-semibold text-[#1f1f1f]">
                  Trạng thái
                </th>
                <th className="w-[130px] px-4 py-3 text-right text-[10px] font-semibold text-[#1f1f1f]">
                  Hành động
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 4 }).map((_, index) => (
                  <tr key={index} className="border-b border-[#eee]">
                    <td className="px-4 py-3">
                      <div className="h-3.5 w-8 animate-pulse rounded bg-slate-100" />
                    </td>
                    <td className="px-2 py-3">
                      <div className="h-10 w-16 animate-pulse rounded bg-slate-100" />
                    </td>
                    <td className="px-2 py-3">
                      <div className="h-3.5 w-48 animate-pulse rounded bg-slate-100" />
                    </td>
                    <td className="px-2 py-3">
                      <div className="mx-auto h-3.5 w-8 animate-pulse rounded bg-slate-100" />
                    </td>
                    <td className="px-2 py-3">
                      <div className="mx-auto h-3.5 w-28 animate-pulse rounded bg-slate-100" />
                    </td>
                    <td className="px-2 py-3">
                      <div className="mx-auto h-5 w-20 animate-pulse rounded bg-slate-100" />
                    </td>
                    <td className="px-4 py-3" />
                  </tr>
                ))
              ) : banners.length > 0 ? (
                banners.map((banner, index) => (
                  <tr
                    key={banner.id}
                    className="border-b border-[#eee] transition-colors hover:bg-[#f0f8ff]"
                  >
                    <td className="px-4 py-3 text-[11px] font-medium text-slate-500">
                      {index + 1}
                    </td>
                    <td className="px-2 py-3">
                      <div className="flex h-10 w-16 shrink-0 items-center justify-center overflow-hidden rounded-[4px] border border-slate-200 bg-slate-100">
                        {banner.imageUrl ? (
                          <img
                            src={banner.imageUrl}
                            alt={banner.title ?? ""}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <ImageIcon size={16} className="text-slate-300" />
                        )}
                      </div>
                    </td>
                    <td className="px-2 py-3">
                      <p
                        className={cn(
                          "line-clamp-2 text-[11px] font-semibold leading-snug",
                          banner.title
                            ? "text-slate-800"
                            : "text-slate-400 italic",
                        )}
                      >
                        {banner.title || "Banner không tên"}
                      </p>
                      {banner.linkUrl && (
                        <a
                          href={banner.linkUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-1 flex max-w-[340px] items-center gap-1 truncate text-[10px] font-medium text-slate-500 hover:text-blue-600 hover:underline"
                        >
                          <ExternalLink size={10} />
                          {banner.linkUrl}
                        </a>
                      )}
                    </td>
                    <td className="px-2 py-3 text-center">
                      <span className="text-[11px] font-medium text-slate-600">
                        Vị trí {banner.displayOrder + 1}
                      </span>
                    </td>
                    <td className="px-2 py-3 text-center">
                      <div className="text-[11px] text-slate-500">
                        {formatDate(banner.startDate)} → {formatDate(banner.endDate)}
                      </div>
                    </td>
                    <td className="px-2 py-3 text-center">
                      <span className="text-[11px] font-medium text-slate-600">
                        {banner.isActive ? "Hiển thị" : "Tạm ẩn"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          title={banner.isActive ? "Ẩn banner" : "Hiện banner"}
                          disabled={togglingId === banner.id}
                          className={cn(
                            "h-7 w-7 rounded-[4px] text-slate-400",
                            banner.isActive
                              ? "hover:bg-amber-50 hover:text-amber-600"
                              : "hover:bg-blue-50 hover:text-blue-600",
                          )}
                          onClick={() =>
                            setStatusModal({
                              id: banner.id,
                              title: banner.title ?? "",
                              isActive: banner.isActive,
                            })
                          }
                        >
                          {togglingId === banner.id ? (
                            <Loader2 size={14} className="animate-spin" />
                          ) : banner.isActive ? (
                            <EyeOff size={16} />
                          ) : (
                            <Eye size={16} />
                          )}
                        </Button>

                        <Link
                          href={`/admin/banners/${banner.id}/edit`}
                          title="Chỉnh sửa"
                          className="inline-flex h-7 w-7 items-center justify-center rounded-[4px] text-slate-400 transition-colors hover:bg-blue-50 hover:text-blue-600"
                        >
                          <Edit size={14} />
                        </Link>

                        <Button
                          variant="ghost"
                          size="icon"
                          title="Xóa"
                          className="h-7 w-7 rounded-[4px] text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                          onClick={() => setDeleteId(banner.id)}
                        >
                          <Trash2 size={14} />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={7}
                    className="h-[180px] text-center text-[12px] font-medium text-slate-400"
                  >
                    Chưa có banner nào.
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
            <AlertDialogTitle className="font-bold text-rose-600">
              Xác nhận xóa banner
            </AlertDialogTitle>
            <AlertDialogDescription className="text-[13px] font-medium text-slate-500">
              Ảnh sẽ bị xóa khỏi Cloudinary và không thể khôi phục.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="h-9 text-[13px] font-medium">
              Hủy bỏ
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="h-9 bg-rose-600 text-[13px] font-medium text-white hover:bg-rose-700"
            >
              Đồng ý xóa
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={!!statusModal}
        onOpenChange={() => setStatusModal(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="font-bold text-amber-600">
              Thay đổi trạng thái hiển thị
            </AlertDialogTitle>
            <AlertDialogDescription className="text-[13px] font-medium text-slate-500">
              Bạn muốn{" "}
              <strong>{statusModal?.isActive ? "ẨN" : "HIỂN THỊ"}</strong>{" "}
              banner <strong>{statusModal?.title || "này"}</strong> trên trang
              chủ?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="h-9 text-[13px] font-medium">
              Hủy
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleToggleStatus}
              className="h-9 bg-amber-500 text-[13px] font-medium text-white hover:bg-amber-600"
            >
              Xác nhận
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
