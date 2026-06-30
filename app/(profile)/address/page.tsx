"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { addressService } from "@/app/services/address.service";

interface UserAddress {
  id: number;
  receiverName?: string | null;
  receiverPhone?: string | null;
  addressDetail?: string | null;
  isDefault?: boolean;
}

export default function AddressListPage() {
  const [addresses, setAddresses] = useState<UserAddress[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAddresses = async () => {
    try {
      setLoading(true);
      const data = await addressService.getAll();
      setAddresses(data);
    } catch (error) {
      toast.error("Không tải được sổ địa chỉ");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAddresses();
  }, []);

  const handleDelete = async (id: number) => {
    if (!confirm("Bạn có chắc chắn muốn xóa địa chỉ này?")) return;
    try {
      await addressService.delete(id);
      toast.success("Xóa địa chỉ thành công");
      fetchAddresses();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Xóa thất bại");
    }
  };

  const handleSetDefault = async (id: number) => {
    try {
      await addressService.setDefault(id);
      toast.success("Đã đặt làm địa chỉ mặc định");
      fetchAddresses();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Thao tác thất bại");
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[500px] items-center justify-center border border-gray-100 bg-white">
        <Loader2 className="animate-spin text-[#1965a2]" size={32} />
      </div>
    );
  }

  return (
    <div className="min-h-[500px] border border-gray-100 bg-white">
      <div className="flex items-center justify-between gap-3 border-b border-gray-100 px-6 py-6">
        <h5 className="min-w-0 flex-1 text-[18px] font-medium text-gray-900">
          Địa chỉ của tôi
        </h5>
        <Link href="/address/create">
          <button className="flex h-10 shrink-0 items-center justify-center bg-[#1965a2] px-4 text-sm font-medium text-white transition-colors hover:bg-[#145486]">
            <Plus size={16} className="mr-1.5" /> Thêm địa chỉ
          </button>
        </Link>
      </div>

      <div className="px-6 py-6">
        <h6 className="mb-6 text-[15px] font-medium text-gray-900">Địa chỉ</h6>

        {addresses.length === 0 && (
          <div className="border-t border-gray-100 py-12 text-center text-gray-500">
            Bạn chưa có địa chỉ nhận hàng nào
          </div>
        )}

        <div className={addresses.length > 0 ? "border-t border-gray-100" : ""}>
          {addresses.map((addr) => (
            <div
              key={addr.id}
              className="flex flex-col gap-5 border-b border-gray-100 py-6 md:flex-row md:items-start md:justify-between"
            >
              <div className="min-w-0 flex-1 pr-0 md:pr-8">
                <div className="mb-2 flex flex-wrap items-center gap-x-3 gap-y-1">
                  <span className="text-[18px] font-medium text-gray-900">{addr.receiverName}</span>
                  <span className="hidden text-gray-300 md:inline">|</span>
                  <span className="text-[18px] text-gray-500">{addr.receiverPhone}</span>
                </div>

                <p className="max-w-3xl text-[16px] leading-8 text-gray-600">{addr.addressDetail}</p>

                <div className="mt-4">
                  {addr.isDefault ? (
                    <span className="inline-flex border border-[#1965a2] px-2 py-1 text-xs font-medium text-[#1965a2]">
                      Mặc định
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleSetDefault(addr.id)}
                      className="inline-flex border border-gray-300 px-4 py-2 text-sm text-gray-600 transition-colors hover:border-[#1965a2] hover:text-[#1965a2]"
                    >
                      Thiết lập mặc định
                    </button>
                  )}
                </div>
              </div>

              <div className="flex shrink-0 items-start gap-4 text-[15px] md:min-w-[170px] md:justify-end">
                <Link href={`/address/${addr.id}`} className="text-[#1965a2] hover:underline">
                  Cập nhật
                </Link>
                {!addr.isDefault && (
                  <button
                    type="button"
                    onClick={() => handleDelete(addr.id)}
                    className="text-[#1965a2] hover:underline"
                  >
                    Xóa
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
