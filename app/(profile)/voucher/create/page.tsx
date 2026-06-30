"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { voucherService, Voucher } from "@/app/services/voucher.service";
import VoucherForm from "@/components/voucher/VoucherForm";

const SAVED_VOUCHERS_KEY = "agrishrimp.savedVoucherCodes";

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

export default function CreateVoucherPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAddVoucher = async (code: string) => {
    const normalized = code.trim().toUpperCase();
    if (!normalized) return;

    setIsSubmitting(true);
    try {
      const res = await voucherService.getPublicVouchers();
      const vouchers = Array.isArray(res) ? res : [];

      const matchedVoucher = vouchers.find(
        (voucher: Voucher) => voucher.code?.toUpperCase() === normalized,
      );

      if (!matchedVoucher) {
        toast.error("Voucher không tồn tại hoặc chưa được kích hoạt");
        return;
      }

      const savedCodes = loadSavedVoucherCodes();
      if (!savedCodes.includes(normalized)) {
        savedCodes.push(normalized);
        persistSavedVoucherCodes(savedCodes);
      }

      toast.success(`Đã lưu mã ${normalized} vào ví`);
      router.push("/voucher");
    } catch {
      toast.error("Không thể kiểm tra voucher lúc này");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <VoucherForm onSubmit={handleAddVoucher} isSubmitting={isSubmitting} />
  );
}
