"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Loader2, Ticket } from "lucide-react";
import { toast } from "sonner";
import { voucherService, Voucher } from "@/app/services/voucher.service";

const SAVED_VOUCHERS_KEY = "agrishrimp.savedVoucherCodes";

const formatMoney = (value: number | string | null | undefined) => {
  const numeric = Number(value || 0);
  return `${numeric.toLocaleString("vi-VN")}đ`;
};

const formatDate = (value?: string | null) => {
  if (!value) return "Không giới hạn";
  return new Date(value).toLocaleDateString("vi-VN");
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
      ? parsed.map((code) => String(code).trim().toUpperCase()).filter(Boolean)
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
  const startOk = !voucher.startDate || new Date(voucher.startDate).getTime() <= now;
  const endOk = !voucher.endDate || new Date(voucher.endDate).getTime() >= now;
  return voucher.status === "ACTIVE" && startOk && endOk;
};

const actionButtonClass =
  "inline-flex h-10 items-center justify-center gap-2 rounded-full border px-4 text-[13px] font-semibold transition-all duration-200";
const secondaryActionClass = `${actionButtonClass} border-[#1965a2]/15 bg-[#1965a2]/5 text-[#1965a2] hover:border-[#1965a2]/30 hover:bg-[#1965a2]/10`;
const primaryActionClass = `${actionButtonClass} border-[#1965a2] bg-[#1965a2] text-white shadow-sm shadow-[#1965a2]/20 hover:border-[#145486] hover:bg-[#145486]`;
const dangerActionClass = `${actionButtonClass} border-red-200 bg-red-50 text-red-600 hover:border-red-300 hover:bg-red-100`;

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
        const validVouchers = (Array.isArray(res) ? res : [])
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
    const nextCodes = savedCodes.filter(
      (savedCode) => savedCode !== normalized,
    );
    setSavedCodes(nextCodes);
    persistSavedVoucherCodes(nextCodes);
    toast.success(`Đã gỡ voucher ${normalized} khỏi ví`);
  };

  const savedVouchers = vouchers.filter((voucher) =>
    savedCodeSet.has(voucher.code.toUpperCase()),
  );

  const availableToSave = vouchers.filter(
    (voucher) => !savedCodeSet.has(voucher.code.toUpperCase()),
  );

  if (loading) {
    return (
      <div className="flex min-h-[500px] items-center justify-center border border-gray-100 bg-white">
        <Loader2 className="animate-spin text-[#1965a2]" size={32} />
      </div>
    );
  }

  return (
    <div className="min-h-[500px] border border-gray-100 bg-white">
      <div className="flex flex-col gap-4 border-b border-gray-100 px-6 py-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h5 className="text-[18px] font-medium text-gray-900">
            Ví Voucher và Ưu đãi
          </h5>
          <p className="mt-1 text-sm text-gray-500">
            Voucher được lưu trên backend và đồng bộ theo tài khoản
          </p>
        </div>

        <Link href="/voucher/create">
          <button className="flex h-10 items-center justify-center bg-[#1965a2] px-4 text-sm font-medium text-white transition-colors hover:bg-[#145486]">
            <Ticket size={16} className="mr-1.5" /> Nhập mã Voucher
          </button>
        </Link>
      </div>

      <div className="px-6 py-6">
        <div>
          <h6 className="mb-2 text-[15px] font-medium text-gray-900">
            Voucher đã lưu
          </h6>
          <p className="text-sm text-gray-500">
            {savedVouchers.length} mã đang nằm trong ví của bạn
          </p>

          {savedVouchers.length === 0 && (
            <div className="py-12 text-center text-gray-500">
              Chưa có mã nào trong ví
            </div>
          )}

          <div className={savedVouchers.length > 0 ? "border-t border-gray-100" : ""}>
            {savedVouchers.map((voucher) => {
              const value = Number(voucher.value ?? voucher.discountValue ?? 0);
              const isPercent = voucher.discountType === "PERCENT";

              return (
                <div
                  key={voucher.id ?? voucher.code}
                  className="flex flex-col gap-5 border-b border-gray-100 py-6 md:flex-row md:items-start md:justify-between"
                >
                  <div className="min-w-0 flex-1 pr-0 md:pr-8">
                    <div className="mb-2 flex flex-wrap items-center gap-x-3 gap-y-2">
                      <span className="text-[18px] font-medium text-gray-900">
                        {getVoucherLabel(voucher)}
                      </span>
                      <span className="inline-flex border border-[#1965a2] px-2 py-1 text-xs font-medium text-[#1965a2]">
                        {voucher.code}
                      </span>
                    </div>

                    <p className="text-[15px] leading-7 text-gray-600">
                      Hạn sử dụng: {formatDate(voucher.endDate)}
                    </p>

                    <p className="text-[15px] leading-7 text-gray-600">
                      Đơn tối thiểu {formatMoney(voucher.minOrderValue)}
                      {isPercent
                        ? ` · Giảm ${value}%${voucher.maxDiscount ? `, tối đa ${formatMoney(voucher.maxDiscount)}` : ""}`
                        : ` · Giảm ${formatMoney(value)}`}
                    </p>

                    {voucher.description && (
                      <p className="mt-2 max-w-3xl text-[15px] leading-7 text-gray-500">
                        {voucher.description}
                      </p>
                    )}
                  </div>

                  <div className="flex shrink-0 flex-wrap items-center gap-2 md:min-w-[320px] md:justify-end">
                    <button
                      type="button"
                      onClick={() => handleCopy(voucher.code)}
                      className={secondaryActionClass}
                    >
                      Sao chép
                    </button>
                    <Link
                      href={`/checkout?voucher=${encodeURIComponent(voucher.code)}`}
                      className={primaryActionClass}
                    >
                      Dùng ngay
                    </Link>
                    <button
                      type="button"
                      onClick={() => handleRemoveSaved(voucher.code)}
                      className={dangerActionClass}
                    >
                      Gỡ khỏi ví
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="pt-8">
          <h6 className="mb-2 text-[15px] font-medium text-gray-900">
            Voucher khả dụng từ hệ thống
          </h6>
          <p className="text-sm text-gray-500">
            {availableToSave.length} mã mới có thể lưu vào ví
          </p>

          {availableToSave.length === 0 && (
            <div className="py-12 text-center text-gray-500">
              Hiện chưa có thêm voucher mới từ hệ thống
            </div>
          )}

          <div className={availableToSave.length > 0 ? "border-t border-gray-100" : ""}>
            {availableToSave.map((voucher) => {
              const value = Number(voucher.value ?? voucher.discountValue ?? 0);
              const isPercent = voucher.discountType === "PERCENT";

              return (
                <div
                  key={voucher.id ?? voucher.code}
                  className="flex flex-col gap-5 border-b border-gray-100 py-6 md:flex-row md:items-start md:justify-between"
                >
                  <div className="min-w-0 flex-1 pr-0 md:pr-8">
                    <div className="mb-2 flex flex-wrap items-center gap-x-3 gap-y-2">
                      <span className="text-[18px] font-medium text-gray-900">
                        {getVoucherLabel(voucher)}
                      </span>
                      <span className="text-[15px] text-gray-500">
                        {voucher.code}
                      </span>
                    </div>

                    <p className="text-[15px] leading-7 text-gray-600">
                      Hạn sử dụng: {formatDate(voucher.endDate)}
                    </p>

                    <p className="text-[15px] leading-7 text-gray-600">
                      Đơn tối thiểu {formatMoney(voucher.minOrderValue)}
                      {isPercent
                        ? ` · Giảm ${value}%${voucher.maxDiscount ? `, tối đa ${formatMoney(voucher.maxDiscount)}` : ""}`
                        : ` · Giảm ${formatMoney(value)}`}
                    </p>

                    {voucher.description && (
                      <p className="mt-2 max-w-3xl text-[15px] leading-7 text-gray-500">
                        {voucher.description}
                      </p>
                    )}
                  </div>

                  <div className="flex shrink-0 flex-wrap items-center gap-2 md:min-w-[240px] md:justify-end">
                    <button
                      type="button"
                      onClick={() => handleSave(voucher.code)}
                      className={primaryActionClass}
                    >
                      Lưu mã
                    </button>
                    <button
                      type="button"
                      onClick={() => handleCopy(voucher.code)}
                      className={secondaryActionClass}
                    >
                      Sao chép
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

