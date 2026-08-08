"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { voucherService } from "@/app/services/voucher.service";
import VoucherForm from "@/components/voucher/VoucherForm";

export default function CreateVoucherPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAddVoucher = async (code: string) => {
    const normalized = code.trim().toUpperCase();
    if (!normalized) return;

    setIsSubmitting(true);
    try {
      await voucherService.saveToWallet(normalized);
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
