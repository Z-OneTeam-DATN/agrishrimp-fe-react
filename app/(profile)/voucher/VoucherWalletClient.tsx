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
import {
  UserVoucher,
  voucherService,
} from "@/app/services/voucher.service";

const formatMoney = (value: number | string | null | undefined) => {
  const numeric = Number(value || 0);
  return `${numeric.toLocaleString("vi-VN")} VND`;
};

const getVoucherLabel = (voucher: UserVoucher) => {
  if (voucher.title?.trim()) return voucher.title;

  const value = Number(voucher.value ?? voucher.discountValue ?? 0);
  if (voucher.discountType === "PERCENT") {
    const maxDiscount = voucher.maxDiscount
      ? ` toi da ${formatMoney(voucher.maxDiscount)}`
      : "";
    return `Giam ${value}%${maxDiscount}`;
  }

  return `Giam ${formatMoney(value)}`;
};

const sortByNewest = (vouchers: UserVoucher[]) =>
  [...vouchers].sort((left, right) => (right.id || 0) - (left.id || 0));

export default function VoucherWalletClient() {
  const [savedVouchers, setSavedVouchers] = useState<UserVoucher[]>([]);
  const [availableVouchers, setAvailableVouchers] = useState<UserVoucher[]>([]);
  const [loading, setLoading] = useState(true);
  const [submittingCode, setSubmittingCode] = useState<string | null>(null);

  const availableToSave = useMemo(
    () => availableVouchers.filter((voucher) => !voucher.saved),
    [availableVouchers],
  );

  const loadWallet = async () => {
    try {
      setLoading(true);
      const [saved, available] = await Promise.all([
        voucherService.getSavedForMe(),
        voucherService.getAvailableForMe(),
      ]);

      setSavedVouchers(sortByNewest(saved));
      setAvailableVouchers(sortByNewest(available));
    } catch {
      toast.error("Không thể tải dữ liệu voucher lúc này");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadWallet();
  }, []);

  const handleCopy = (code: string) => {
    void navigator.clipboard.writeText(code);
    toast.success(`Đã sao chép mã: ${code}`);
  };

  const handleSave = async (code: string) => {
    try {
      setSubmittingCode(code);
      await voucherService.saveToWallet(code);
      toast.success(`Đã lưu voucher ${code} vào ví`);
      await loadWallet();
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message || "Không thể lưu voucher vào ví",
      );
    } finally {
      setSubmittingCode(null);
    }
  };

  const handleRemoveSaved = async (code: string) => {
    try {
      setSubmittingCode(code);
      await voucherService.removeFromWallet(code);
      toast.success(`Đã gỡ voucher ${code} khỏi ví`);
      await loadWallet();
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message || "Không thể xóa voucher khỏi ví",
      );
    } finally {
      setSubmittingCode(null);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between px-6 py-4 border-b border-gray-100">
        <div>
          <h5 className="font-bold text-lg text-gray-800 m-0">
            Vi Voucher va Uu dai
          </h5>
          <small className="text-gray-500 text-xs">
            Voucher duoc luu tren backend va dong bo theo tai khoan
          </small>
        </div>

        <Link href="/voucher/create">
          <button className="bg-[#2d9f8d] hover:bg-[#248273] text-white text-sm font-bold px-4 h-12 rounded-md flex items-center gap-2 transition-colors shadow-sm">
            <Ticket size={18} /> Nhap ma Voucher
          </button>
        </Link>
      </div>

      <div className="p-6 space-y-8">
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((item) => (
              <div
                key={item}
                className="h-28 rounded-2xl bg-gray-100 animate-pulse"
              />
            ))}
          </div>
        ) : (
          <>
            <div className="space-y-6">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h6 className="text-sm font-bold text-gray-800">
                    Voucher da luu
                  </h6>
                  <p className="text-xs text-gray-500">
                    {savedVouchers.length} ma dang nam trong vi cua ban
                  </p>
                </div>
              </div>

              {savedVouchers.length > 0 ? (
                <div className="space-y-4">
                  {savedVouchers.map((voucher) => {
                    const value = Number(
                      voucher.value ?? voucher.discountValue ?? 0,
                    );
                    const isPercent = voucher.discountType === "PERCENT";
                    const isBusy = submittingCode === voucher.code;

                    return (
                      <div
                        key={voucher.id ?? voucher.code}
                        className="rounded-2xl border border-gray-200 p-4 sm:p-5 bg-gradient-to-r from-amber-50/60 to-white"
                      >
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                          <div className="flex gap-4 min-w-0">
                            <div className="w-14 h-14 rounded-xl flex items-center justify-center shrink-0 bg-amber-100 text-amber-600">
                              {isPercent ? (
                                <Percent size={28} />
                              ) : (
                                <Ticket size={28} />
                              )}
                            </div>

                            <div className="min-w-0">
                              <h3 className="text-base font-bold text-gray-800 truncate">
                                {getVoucherLabel(voucher)}
                              </h3>
                              <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-gray-500">
                                <span className="flex items-center gap-1">
                                  <Clock size={12} />
                                  HSD:{" "}
                                  {new Date(voucher.endDate).toLocaleDateString(
                                    "vi-VN",
                                  )}
                                </span>
                                <span className="text-gray-300">|</span>
                                <span className="flex items-center gap-1">
                                  <Tag size={12} /> Ma:
                                  <span className="font-bold text-red-500">
                                    {voucher.code}
                                  </span>
                                </span>
                              </div>

                              <div className="mt-2 text-xs text-gray-500">
                                Don toi thieu: {formatMoney(voucher.minOrderValue)}
                                {isPercent
                                  ? ` Â· Giam ${value}%${voucher.maxDiscount ? `, toi da ${formatMoney(voucher.maxDiscount)}` : ""}`
                                  : ` Â· Giam ${formatMoney(value)}`}
                              </div>

                              <div className="mt-2 text-xs text-gray-500">
                                Luot con lai: {voucher.remainingUsageCount ?? 0}
                              </div>

                              {!voucher.canApply && voucher.availabilityReason && (
                                <p className="mt-2 text-xs text-amber-700">
                                  {voucher.availabilityReason}
                                </p>
                              )}
                            </div>
                          </div>

                          <div className="flex flex-col items-start sm:items-end gap-3 shrink-0">
                            <span
                              className={`text-[10px] font-extrabold uppercase px-2 py-1 rounded border ${
                                voucher.canApply
                                  ? "bg-green-50 text-green-600 border-green-200"
                                  : "bg-amber-50 text-amber-700 border-amber-200"
                              }`}
                            >
                              {voucher.canApply ? "Co the dung" : "Can kiem tra"}
                            </span>

                            <div className="flex flex-wrap gap-3">
                              <button
                                onClick={() => handleCopy(voucher.code)}
                                className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1"
                              >
                                <Copy size={12} /> Sao chep
                              </button>
                              <Link
                                href={`/checkout?voucher=${encodeURIComponent(voucher.code)}`}
                                className="text-xs font-bold text-green-600 hover:underline flex items-center gap-1"
                              >
                                <ShoppingCart size={12} /> Dung ngay
                              </Link>
                              <button
                                onClick={() => void handleRemoveSaved(voucher.code)}
                                disabled={isBusy}
                                className="text-xs font-bold text-amber-600 hover:underline flex items-center gap-1 disabled:opacity-50"
                              >
                                <BookmarkCheck size={12} /> Da luu
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-10 text-gray-500 border border-dashed border-gray-200 rounded-2xl bg-gray-50/30">
                  <Ticket size={40} className="mx-auto text-gray-300 mb-3" />
                  <p className="text-sm font-medium">Chua co ma nao trong vi</p>
                  <p className="text-[11px] mt-1">
                    Hay luu ma o ben duoi de dung nhanh khi thanh toan.
                  </p>
                </div>
              )}
            </div>

            <div className="space-y-6 pt-4 border-t border-gray-100">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h6 className="text-sm font-bold text-gray-800">
                    Voucher kha dung tu he thong
                  </h6>
                  <p className="text-xs text-gray-500">
                    {availableToSave.length} ma moi co the luu vao vi
                  </p>
                </div>
              </div>

              {availableToSave.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {availableToSave.map((voucher) => {
                    const value = Number(
                      voucher.value ?? voucher.discountValue ?? 0,
                    );
                    const isPercent = voucher.discountType === "PERCENT";
                    const isBusy = submittingCode === voucher.code;

                    return (
                      <div
                        key={voucher.id ?? voucher.code}
                        className="rounded-xl border border-gray-100 p-4 bg-gray-50/50 hover:bg-white hover:border-emerald-200 transition-all group"
                      >
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0 bg-white border border-gray-200 text-emerald-600 shadow-sm group-hover:bg-emerald-50 group-hover:border-emerald-100 transition-colors">
                            {isPercent ? (
                              <Percent size={20} />
                            ) : (
                              <Ticket size={20} />
                            )}
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between gap-2">
                              <h3 className="text-sm font-bold text-gray-800 truncate">
                                {getVoucherLabel(voucher)}
                              </h3>
                              <button
                                onClick={() => void handleSave(voucher.code)}
                                disabled={isBusy}
                                className="text-[11px] font-bold text-emerald-600 hover:text-emerald-700 whitespace-nowrap px-2 py-1 bg-emerald-50 rounded-md transition-colors disabled:opacity-50"
                              >
                                <BookmarkPlus
                                  size={12}
                                  className="inline mr-1"
                                />{" "}
                                Luu ma
                              </button>
                            </div>

                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-[10px] font-bold text-red-500 px-1.5 py-0.5 bg-red-50 rounded border border-red-100">
                                {voucher.code}
                              </span>
                              <span className="text-[10px] text-gray-400">
                                HSD:{" "}
                                {new Date(voucher.endDate).toLocaleDateString(
                                  "vi-VN",
                                )}
                              </span>
                            </div>

                            <p className="text-[11px] text-gray-500 mt-2 line-clamp-2">
                              Don toi thieu {formatMoney(voucher.minOrderValue)}
                              {isPercent && voucher.maxDiscount
                                ? ` Â· Giam toi da ${formatMoney(voucher.maxDiscount)}`
                                : ""}
                            </p>

                            <p className="text-[11px] text-gray-500 mt-1">
                              Luot moi user: {voucher.maxUsagePerUser ?? 1}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-10 text-gray-400 bg-gray-50/30 rounded-2xl border border-gray-100">
                  <p className="text-sm">Hien chua co them ma giam gia moi.</p>
                </div>
              )}
            </div>

            <div className="flex items-center justify-center pt-4">
              <Link
                href="/checkout"
                className="text-xs font-semibold text-[#2d9f8d] hover:underline inline-flex items-center gap-1 py-2 px-4 rounded-full bg-emerald-50 border border-emerald-100 transition-all hover:bg-emerald-100"
              >
                Di toi trang thanh toan de ap dung ma{" "}
                <ChevronRight size={12} />
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
