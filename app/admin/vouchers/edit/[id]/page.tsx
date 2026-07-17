"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import VoucherForm from "@/components/admin/vouchers/VoucherForm";
import { Voucher, voucherService } from "@/app/services/voucher.service";

export default function EditVoucherPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [voucher, setVoucher] = useState<Voucher | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchVoucher = async () => {
      const voucherId = Number(params.id);

      if (!Number.isFinite(voucherId)) {
        toast.error("Mã voucher không hợp lệ");
        router.push("/admin/vouchers");
        return;
      }

      try {
        setLoading(true);
        const found = await voucherService.getById(voucherId);

        if (!found) {
          toast.error("Không tìm thấy voucher");
          router.push("/admin/vouchers");
          return;
        }

        setVoucher(found);
      } catch {
        toast.error("Lỗi khi tải thông tin voucher");
        router.push("/admin/vouchers");
      } finally {
        setLoading(false);
      }
    };

    fetchVoucher();
  }, [params.id, router]);

  if (loading) {
    return (
      <div className="flex min-h-[360px] items-center justify-center">
        <Loader2 className="animate-spin text-slate-400" size={24} />
      </div>
    );
  }

  if (!voucher) return null;

  return (
    <div className="space-y-5">
      <h1 className="text-[20px] font-semibold uppercase text-slate-900">
        Cập nhật voucher
      </h1>
      <VoucherForm initialData={voucher} />
    </div>
  );
}
