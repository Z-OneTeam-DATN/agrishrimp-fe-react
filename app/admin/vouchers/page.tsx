"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertCircle, Edit, EyeOff, Loader2, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  Voucher,
  voucherService,
  VoucherUpsertPayload,
} from "@/app/services/voucher.service";
import { usePermissions } from "@/hooks/usePermissions";
import { P } from "@/lib/permissions";
import { useAuthStore } from "@/stores/useAuthStore";

const toNumber = (value: number | string | undefined | null) =>
  typeof value === "number"
    ? value
    : Number(
        typeof value === "string"
          ? value.replace(/,/g, "").trim() || 0
          : value || 0,
      );

const formatMoney = (value: number | string | undefined | null) =>
  `${toNumber(value).toLocaleString("vi-VN")} đ`;

const formatDate = (value: string) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("vi-VN");
};

const pageSize = 5;

const getDiscountValue = (voucher: Voucher) =>
  toNumber(voucher.value ?? voucher.discountValue);

const getDiscountText = (voucher: Voucher) =>
  voucher.discountType === "PERCENT"
    ? `Giảm ${getDiscountValue(voucher)}%`
    : `Giảm ${getDiscountValue(voucher).toLocaleString("vi-VN")}đ`;

const getDisplayStatus = (voucher: Voucher): Voucher["status"] => {
  if (voucher.status !== "ACTIVE") {
    return voucher.status;
  }

  const endDate = new Date(voucher.endDate).getTime();
  if (Number.isNaN(endDate)) {
    return voucher.status;
  }

  return endDate < Date.now() ? "EXPIRED" : "ACTIVE";
};

const getStatusLabel = (status: Voucher["status"]) => {
  if (status === "ACTIVE") return "Đang hoạt động";
  if (status === "INACTIVE") return "Tạm ẩn";
  if (status === "EXPIRED") return "Hết hạn";
  return status;
};

export default function AdminVoucherPage() {
  const router = useRouter();
  const { hasPermission, hasAnyPermission } = usePermissions();
  const { user: currentUser, isLoadingAuth } = useAuthStore();
  const canViewVoucher = hasPermission(P.VOUCHER_VIEW);
  const canCreateVoucher = hasPermission(P.VOUCHER_CREATE);
  const canUpdateVoucher = hasPermission(P.VOUCHER_UPDATE);
  const canDeleteVoucher = hasPermission(P.VOUCHER_DELETE);
  const canManageVoucher = hasAnyPermission([
    P.VOUCHER_CREATE,
    P.VOUCHER_UPDATE,
    P.VOUCHER_DELETE,
  ]);

  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [loading, setLoading] = useState(true);
  const [keyword, setKeyword] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | Voucher["status"]>(
    "ALL",
  );
  const [currentPage, setCurrentPage] = useState(0);
  const [deleteConfirmVoucher, setDeleteConfirmVoucher] =
    useState<Voucher | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchVouchers = useCallback(async () => {
    if (!canViewVoucher) return;

    try {
      setLoading(true);
      const response = await voucherService.getAllAdmin();
      const items = (Array.isArray(response) ? response : []).sort(
        (left, right) => (right.id || 0) - (left.id || 0),
      );
      setVouchers(items);
    } catch {
      toast.error("Lỗi khi tải danh sách voucher");
    } finally {
      setLoading(false);
    }
  }, [canViewVoucher]);

  useEffect(() => {
    if (!isLoadingAuth && !canViewVoucher) {
      router.push("/admin/forbidden");
      return;
    }

    if (!isLoadingAuth && canViewVoucher) {
      fetchVouchers();
    }
  }, [canViewVoucher, fetchVouchers, isLoadingAuth, router]);

  const filteredVouchers = useMemo(() => {
    const normalizedKeyword = keyword.trim().toLowerCase();

    return vouchers.filter((voucher) => {
      const matchesKeyword =
        !normalizedKeyword ||
        voucher.code?.toLowerCase().includes(normalizedKeyword) ||
        voucher.title?.toLowerCase().includes(normalizedKeyword) ||
        voucher.description?.toLowerCase().includes(normalizedKeyword);
      const matchesStatus =
        statusFilter === "ALL" || getDisplayStatus(voucher) === statusFilter;

      return matchesKeyword && matchesStatus;
    });
  }, [keyword, statusFilter, vouchers]);

  const counts = useMemo(
    () => ({
      total: vouchers.length,
      active: vouchers.filter(
        (voucher) => getDisplayStatus(voucher) === "ACTIVE",
      ).length,
      inactive: vouchers.filter(
        (voucher) => getDisplayStatus(voucher) === "INACTIVE",
      ).length,
      expired: vouchers.filter(
        (voucher) => getDisplayStatus(voucher) === "EXPIRED",
      ).length,
    }),
    [vouchers],
  );

  const totalPages = Math.max(1, Math.ceil(filteredVouchers.length / pageSize));

  const paginatedVouchers = useMemo(() => {
    const start = currentPage * pageSize;
    return filteredVouchers.slice(start, start + pageSize);
  }, [currentPage, filteredVouchers]);

  useEffect(() => {
    setCurrentPage((prev) => Math.min(prev, totalPages - 1));
  }, [totalPages]);

  const confirmDelete = async () => {
    if (!canDeleteVoucher || !deleteConfirmVoucher?.id) return;

    setIsDeleting(true);
    const isExpired =
      new Date(deleteConfirmVoucher.endDate).getTime() <= Date.now() ||
      deleteConfirmVoucher.status === "EXPIRED";

    try {
      if (isExpired) {
        await voucherService.delete(deleteConfirmVoucher.id);
        toast.success("Đã xóa voucher vĩnh viễn");
      } else {
        const payload: VoucherUpsertPayload = {
          code: deleteConfirmVoucher.code,
          title: deleteConfirmVoucher.title,
          discountType: deleteConfirmVoucher.discountType,
          value: toNumber(
            deleteConfirmVoucher.value ?? deleteConfirmVoucher.discountValue,
          ),
          minOrderValue: toNumber(deleteConfirmVoucher.minOrderValue),
          maxDiscount:
            deleteConfirmVoucher.maxDiscount === undefined ||
            deleteConfirmVoucher.maxDiscount === null ||
            deleteConfirmVoucher.maxDiscount === ""
              ? null
              : toNumber(deleteConfirmVoucher.maxDiscount),
          startDate: deleteConfirmVoucher.startDate,
          endDate: deleteConfirmVoucher.endDate,
          quantity: toNumber(deleteConfirmVoucher.quantity),
          maxUsagePerUser: toNumber(
            deleteConfirmVoucher.maxUsagePerUser ??
              deleteConfirmVoucher.usageLimit,
          ),
          status: "INACTIVE",
        };

        if (payload.discountType === "FIXED") {
          payload.maxDiscount = null;
        }

        await voucherService.update(deleteConfirmVoucher.id, payload);
        toast.success("Voucher còn thời hạn, đã chuyển sang trạng thái Tạm ẩn");
      }

      fetchVouchers();
    } catch {
      toast.error("Lỗi khi xử lý voucher");
    } finally {
      setIsDeleting(false);
      setDeleteConfirmVoucher(null);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-[20px] font-semibold uppercase text-slate-900">
          Quản lý voucher
        </h1>
        {canCreateVoucher && (
          <Link
            href="/admin/vouchers/add"
            className="inline-flex h-10 items-center justify-center gap-2 rounded-[4px] bg-blue-600 px-5 text-[13px] font-semibold text-white transition-colors hover:bg-blue-700"
          >
            <Plus size={16} />
            Thêm voucher
          </Link>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          ["Tổng voucher", counts.total],
          ["Đang hoạt động", counts.active],
          ["Tạm ẩn", counts.inactive],
          ["Hết hạn", counts.expired],
        ].map(([label, value]) => (
          <div
            key={label}
            className="rounded-[4px] border border-slate-200 bg-white p-4 shadow-sm"
          >
            <p className="text-[10.5px] font-semibold text-slate-500">
              {label}
            </p>
            <p className="mt-2 text-[22px] font-semibold text-slate-900">
              {value}
            </p>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <input
          value={keyword}
          onChange={(event) => setKeyword(event.target.value)}
          placeholder="Tìm mã voucher, tên chương trình..."
          className="h-10 w-full rounded-[4px] border border-slate-200 bg-white px-3 text-[13px] outline-none placeholder:text-slate-400 focus:border-blue-500 lg:max-w-[420px]"
        />
        <select
          value={statusFilter}
          onChange={(event) =>
            setStatusFilter(event.target.value as "ALL" | Voucher["status"])
          }
          className="h-10 w-full rounded-[4px] border border-slate-200 bg-white px-3 text-[13px] outline-none focus:border-blue-500 lg:w-[220px]"
        >
          <option value="ALL">Tất cả trạng thái</option>
          <option value="ACTIVE">Đang hoạt động</option>
          <option value="INACTIVE">Tạm ẩn</option>
          <option value="EXPIRED">Hết hạn</option>
        </select>
      </div>

      <div className="overflow-hidden rounded-[4px] border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse">
            <thead className="border-b border-slate-200 bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left text-[11px] font-medium text-slate-500">
                  Voucher
                </th>
                <th className="px-4 py-3 text-left text-[11px] font-medium text-slate-500">
                  Giảm giá
                </th>
                <th className="px-4 py-3 text-left text-[11px] font-medium text-slate-500">
                  Điều kiện
                </th>
                <th className="px-4 py-3 text-left text-[11px] font-medium text-slate-500">
                  Hiệu lực
                </th>
                <th className="px-4 py-3 text-left text-[11px] font-medium text-slate-500">
                  Trạng thái
                </th>
                {canManageVoucher && (
                  <th className="px-4 py-3 text-right text-[11px] font-medium text-slate-500">
                    Thao tác
                  </th>
                )}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan={canManageVoucher ? 6 : 5}
                    className="px-4 py-12 text-center"
                  >
                    <Loader2 className="mx-auto animate-spin text-slate-400" />
                  </td>
                </tr>
              ) : filteredVouchers.length === 0 ? (
                <tr>
                  <td
                    colSpan={canManageVoucher ? 6 : 5}
                    className="px-4 py-12 text-center text-[12px] text-slate-400"
                  >
                    Chưa có voucher phù hợp
                  </td>
                </tr>
              ) : (
                paginatedVouchers.map((voucher) => (
                  <tr
                    key={voucher.id ?? voucher.code}
                    className="border-b border-slate-100 transition-colors last:border-b-0 hover:bg-slate-50"
                  >
                    <td className="px-4 py-4">
                      <p className="text-[12.5px] font-semibold text-slate-900">
                        {voucher.title || "Voucher chưa đặt tên"}
                      </p>
                      <p className="mt-1 text-[10.5px] text-slate-400">
                        {voucher.code}
                      </p>
                    </td>
                    <td className="px-4 py-4 text-[12px] text-slate-700">
                      {getDiscountText(voucher)}
                    </td>
                    <td className="px-4 py-4 text-[12px] text-slate-500">
                      <p>Đơn từ {formatMoney(voucher.minOrderValue)}</p>
                      {voucher.discountType === "PERCENT" &&
                        voucher.maxDiscount && (
                          <p className="mt-1 text-[10.5px] text-slate-400">
                            Tối đa {formatMoney(voucher.maxDiscount)}
                          </p>
                        )}
                    </td>
                    <td className="px-4 py-4 text-[12px] text-slate-500">
                      {formatDate(voucher.startDate)} -{" "}
                      {formatDate(voucher.endDate)}
                    </td>
                    <td className="px-4 py-4 text-[12px] text-slate-700">
                      {getStatusLabel(getDisplayStatus(voucher))}
                    </td>
                    {canManageVoucher && (
                      <td className="px-4 py-4">
                        <div className="flex justify-end gap-2">
                          {voucher.id && canUpdateVoucher && (
                            <Link
                              href={`/admin/vouchers/edit/${voucher.id}`}
                              title="Cập nhật voucher"
                              className="inline-flex h-8 w-8 items-center justify-center rounded-[4px] text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
                            >
                              <Edit size={15} />
                            </Link>
                          )}
                          {canDeleteVoucher && (
                            <button
                              type="button"
                              onClick={() => setDeleteConfirmVoucher(voucher)}
                              title="Xóa hoặc tạm ẩn voucher"
                              className="inline-flex h-8 w-8 items-center justify-center rounded-[4px] text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600"
                            >
                              <Trash2 size={15} />
                            </button>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="flex min-w-full shrink-0 flex-col gap-3 border-t border-slate-100 bg-[#f8f9fa] px-5 py-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-[12px] font-semibold text-slate-500">
            Tổng số: {filteredVouchers.length} voucher (Trang {filteredVouchers.length === 0 ? 0 : currentPage + 1}/{filteredVouchers.length === 0 ? 0 : totalPages})
          </p>

          {filteredVouchers.length > pageSize && (
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setCurrentPage((prev) => Math.max(0, prev - 1))}
                disabled={currentPage === 0}
                className="h-7 rounded-[4px] border border-slate-200 bg-white px-2 text-[11px] font-bold text-slate-600 transition-all hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Trước
              </button>

              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }).map((_, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => setCurrentPage(index)}
                    className={`h-7 min-w-[28px] rounded-[4px] border px-2 text-[11px] font-bold shadow-sm transition-all ${
                      currentPage === index
                        ? "border-[#1965a2] bg-gradient-to-r from-[#1965a2] to-[#1965a2] text-white hover:from-[#145486] hover:to-[#145486]"
                        : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    {index + 1}
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={() =>
                  setCurrentPage((prev) => Math.min(totalPages - 1, prev + 1))
                }
                disabled={currentPage >= totalPages - 1}
                className="h-7 rounded-[4px] border border-slate-200 bg-white px-2 text-[11px] font-bold text-slate-600 transition-all hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Sau
              </button>
            </div>
          )}
        </div>
      </div>

      {canManageVoucher && deleteConfirmVoucher && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm rounded-[4px] border border-slate-200 bg-white p-6 text-center shadow-xl">
            <div
              className={`mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full ${
                new Date(deleteConfirmVoucher.endDate).getTime() <=
                  Date.now() || deleteConfirmVoucher.status === "EXPIRED"
                  ? "bg-red-50"
                  : "bg-orange-50"
              }`}
            >
              {new Date(deleteConfirmVoucher.endDate).getTime() <=
                Date.now() || deleteConfirmVoucher.status === "EXPIRED" ? (
                <AlertCircle className="text-red-600" size={28} />
              ) : (
                <EyeOff className="text-orange-500" size={28} />
              )}
            </div>
            <h3 className="mb-2 text-[16px] font-semibold text-slate-900">
              {new Date(deleteConfirmVoucher.endDate).getTime() <=
                Date.now() || deleteConfirmVoucher.status === "EXPIRED"
                ? "Xác nhận xóa vĩnh viễn"
                : "Tạm ẩn voucher"}
            </h3>
            <p className="mb-6 text-[12px] leading-relaxed text-slate-500">
              {new Date(deleteConfirmVoucher.endDate).getTime() <=
                Date.now() || deleteConfirmVoucher.status === "EXPIRED"
                ? "Bạn có chắc chắn muốn xóa vĩnh viễn voucher đã hết hạn này không?"
                : "Voucher còn thời hạn sẽ được chuyển sang trạng thái Tạm ẩn để ngừng sử dụng."}
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setDeleteConfirmVoucher(null)}
                disabled={isDeleting}
                className="h-10 w-full rounded-[4px] border border-slate-200 bg-white px-5 text-[13px] font-semibold text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-50"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                disabled={isDeleting}
                className={`flex h-10 w-full items-center justify-center gap-2 rounded-[4px] px-5 text-[13px] font-semibold text-white transition-colors disabled:opacity-50 ${
                  new Date(deleteConfirmVoucher.endDate).getTime() <=
                    Date.now() || deleteConfirmVoucher.status === "EXPIRED"
                    ? "bg-red-600 hover:bg-red-700"
                    : "bg-orange-500 hover:bg-orange-600"
                }`}
              >
                {isDeleting ? (
                  <Loader2 className="animate-spin" size={16} />
                ) : new Date(deleteConfirmVoucher.endDate).getTime() <=
                    Date.now() || deleteConfirmVoucher.status === "EXPIRED" ? (
                  "Xóa"
                ) : (
                  "Tạm ẩn"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

