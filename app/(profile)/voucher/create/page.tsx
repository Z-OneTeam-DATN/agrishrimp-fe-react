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
      toast.success(`Da luu ma ${normalized} vao vi`);

      router.push("/voucher");
      /*
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
      */
    } catch (error: any) {
      toast.error("Không thể kiểm tra voucher lúc này");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto">
      <VoucherForm onSubmit={handleAddVoucher} isSubmitting={isSubmitting} />
    </div>
  );
}
