"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  BookmarkCheck,
  BookmarkPlus,
  ChevronRight,
  Clock,
  Copy,
  Percent,
  ShoppingCart,
  Tag,
  Ticket,
} from "lucide-react";
import { toast } from "sonner";
import { voucherService, Voucher } from "@/app/services/voucher.service";

const SAVED_VOUCHERS_KEY = "agrishrimp.savedVoucherCodes";

const formatMoney = (value: number | string | null | undefined) => {
  const numeric = Number(value || 0);
  return `${numeric.toLocaleString("vi-VN")}đ`;
};

const getVoucherLabel = (voucher: Voucher) => {
  if (voucher.title?.trim()) return voucher.title;

  const value = Number(voucher.value ?? voucher.discountValue ?? 0);
  if (voucher.discountType === "PERCENT") {
    const maxDiscount = voucher.maxDiscount
      ? ` tối đa ${formatMoney(voucher.maxDiscount)}`
      : "";
    return `Giảm ${value}%${maxDiscount}`;
  }

  return `Giảm ${formatMoney(value)}`;
};

const loadSavedVoucherCodes = () => {
  if (typeof window === "undefined") return [] as string[];

  try {
    const raw = window.localStorage.getItem(SAVED_VOUCHERS_KEY);
    if (!raw) return [];

    const parsed = JSON.parse(raw);
    return Array.isArray(parsed)
      ? parsed
          .map((code) => String(code).trim().toUpperCase())
          .filter(Boolean)
      : [];
  } catch {
    return [];
  }
};

const persistSavedVoucherCodes = (codes: string[]) => {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(SAVED_VOUCHERS_KEY, JSON.stringify(codes));
};

const isVoucherVisible = (voucher: Voucher) => {
  const now = Date.now();
  return (
    voucher.status === "ACTIVE" &&
    new Date(voucher.startDate).getTime() <= now &&
    new Date(voucher.endDate).getTime() >= now
  );
};

export default function VoucherWalletPage() {
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [savedCodes, setSavedCodes] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const savedCodeSet = useMemo(() => new Set(savedCodes), [savedCodes]);

  useEffect(() => {
    setSavedCodes(loadSavedVoucherCodes());
  }, []);

  useEffect(() => {
    const fetchPublicVouchers = async () => {
      try {
        setLoading(true);
        const res = await voucherService.getPublicVouchers();
        const voucherArray = res.data ? res.data : res;
        const validVouchers = (Array.isArray(voucherArray) ? voucherArray : [])
          .filter((voucher: Voucher) => isVoucherVisible(voucher))
          .sort(
            (left: Voucher, right: Voucher) => (right.id || 0) - (left.id || 0),
          );

        setVouchers(validVouchers);
      } catch {
        toast.error("Không thể tải danh sách voucher khả dụng");
      } finally {
        setLoading(false);
      }
    };

    fetchPublicVouchers();
  }, []);

  const handleCopy = (code: string) => {
    void navigator.clipboard.writeText(code);
    toast.success(`Đã sao chép mã: ${code}`);
  };

  const handleSave = (code: string) => {
    const normalized = code.trim().toUpperCase();
    if (!normalized) return;

    if (savedCodeSet.has(normalized)) {
      toast.success("Voucher đã có trong ví");
      return;
    }

    const nextCodes = [...savedCodes, normalized];
    setSavedCodes(nextCodes);
    persistSavedVoucherCodes(nextCodes);
    toast.success(`Đã lưu voucher ${normalized} vào ví`);
  };

  const handleRemoveSaved = (code: string) => {
    const normalized = code.trim().toUpperCase();
    const nextCodes = savedCodes.filter((savedCode) => savedCode !== normalized);
    setSavedCodes(nextCodes);
    persistSavedVoucherCodes(nextCodes);
    toast.success(`Đã gỡ voucher ${normalized} khỏi ví`);
  };

  const savedVouchers = vouchers.filter((voucher) =>
    savedCodeSet.has(voucher.code.toUpperCase()),
  );

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between px-6 py-4 border-b border-gray-100">
        <div>
          <h5 className="font-bold text-lg text-gray-800 m-0">
            Ví Voucher & Ưu đãi
          </h5>
          <small className="text-gray-500 text-xs">
            Danh sách voucher đang khả dụng từ hệ thống
          </small>
        </div>

        <Link href="/voucher/create">
          <button className="bg-[#2d9f8d] hover:bg-[#248273] text-white text-sm font-bold px-4 h-12 rounded-md flex items-center gap-2 transition-colors shadow-sm">
            <Ticket size={18} /> Nhập mã Voucher
          </button>
        </Link>
      </div>

      <div className="p-6 space-y-8">
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((item) => (
              <div key={item} className="h-28 rounded-2xl bg-gray-100 animate-pulse" />
            ))}
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between gap-3">
              <div>
                <h6 className="text-sm font-bold text-gray-800">
                  Voucher đã lưu
                </h6>
                <p className="text-xs text-gray-500">
                  {savedVouchers.length} mã đang nằm trong ví của bạn
                </p>
              </div>
            </div>

            {savedVouchers.length > 0 ? (
              <div className="space-y-4">
                {savedVouchers.map((voucher) => {
                  const value = Number(voucher.value ?? voucher.discountValue ?? 0);
                  const isPercent = voucher.discountType === "PERCENT";
                  const isSaved = savedCodeSet.has(voucher.code.toUpperCase());

                  return (
                    <div
                      key={voucher.id ?? voucher.code}
                      className="rounded-2xl border border-gray-200 p-4 sm:p-5 bg-gradient-to-r from-amber-50/60 to-white"
                    >
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                        <div className="flex gap-4 min-w-0">
                          <div className="w-14 h-14 rounded-xl flex items-center justify-center shrink-0 bg-amber-100 text-amber-600">
                            {isPercent ? <Percent size={28} /> : <Ticket size={28} />}
                          </div>

                          <div className="min-w-0">
                            <h3 className="text-base font-bold text-gray-800 truncate">
                              {getVoucherLabel(voucher)}
                            </h3>
                            <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-gray-500">
                              <span className="flex items-center gap-1">
                                <Clock size={12} />
                                HSD: {new Date(voucher.endDate).toLocaleDateString("vi-VN")}
                              </span>
                              <span className="text-gray-300">|</span>
                              <span className="flex items-center gap-1">
                                <Tag size={12} /> Mã:
                                <span className="font-bold text-red-500">
                                  {voucher.code}
                                </span>
                              </span>
                            </div>

                            {voucher.description && (
                              <p className="text-xs text-gray-500 mt-2 leading-relaxed">
                                {voucher.description}
                              </p>
                            )}

                            <div className="mt-2 text-xs text-gray-500">
                              Đơn tối thiểu: {formatMoney(voucher.minOrderValue)}
                              {isPercent
                                ? ` · Giảm ${value}%${voucher.maxDiscount ? `, tối đa ${formatMoney(voucher.maxDiscount)}` : ""}`
                                : ` · Giảm ${formatMoney(value)}`}
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-col items-start sm:items-end gap-3 shrink-0">
                          <span className="text-[10px] font-extrabold uppercase px-2 py-1 rounded border bg-green-50 text-green-600 border-green-200">
                            Đang dùng được
                          </span>

                          <div className="flex flex-wrap gap-3">
                            <button
                              onClick={() => handleCopy(voucher.code)}
                              className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1"
                            >
                              <Copy size={12} /> Sao chép
                            </button>
                            <Link
                              href={`/checkout?voucher=${encodeURIComponent(voucher.code)}`}
                              className="text-xs font-bold text-green-600 hover:underline flex items-center gap-1"
                            >
                              <ShoppingCart size={12} /> Dùng ngay
                            </Link>
                            {isSaved ? (
                              <button
                                onClick={() => handleRemoveSaved(voucher.code)}
                                className="text-xs font-bold text-amber-600 hover:underline flex items-center gap-1"
                              >
                                <BookmarkCheck size={12} /> Đã lưu
                              </button>
                            ) : (
                              <button
                                onClick={() => handleSave(voucher.code)}
                                className="text-xs font-bold text-gray-600 hover:underline flex items-center gap-1"
                              >
                                <BookmarkPlus size={12} /> Lưu vào ví
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500 border border-dashed border-gray-200 rounded-2xl">
                <Ticket size={48} className="mx-auto text-gray-300 mb-3" />
                <p className="font-medium">Chưa có voucher khả dụng nào.</p>
                <p className="text-xs mt-1">
                  Voucher sẽ xuất hiện ở đây khi admin tạo và kích hoạt chúng.
                </p>
              </div>
            )}

            <div className="flex items-center justify-between gap-3 pt-2">
              <div>
                <h6 className="text-sm font-bold text-gray-800">
                  Voucher khả dụng từ admin
                </h6>
                <p className="text-xs text-gray-500">
                  Danh sách này dùng chung với giỏ hàng và trang thanh toán.
                </p>
              </div>
              <Link
                href="/checkout"
                className="text-xs font-semibold text-[#2d9f8d] hover:underline inline-flex items-center gap-1"
              >
                Đi tới thanh toán <ChevronRight size={12} />
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}