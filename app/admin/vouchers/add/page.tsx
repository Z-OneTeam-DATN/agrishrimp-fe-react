"use client";

import VoucherForm from "@/components/admin/vouchers/VoucherForm";

export default function AddVoucherPage() {
  return (
    <div className="space-y-5">
      <h1 className="text-[20px] font-semibold uppercase text-slate-900">
        Thêm voucher
      </h1>
      <VoucherForm />
    </div>
  );
}
