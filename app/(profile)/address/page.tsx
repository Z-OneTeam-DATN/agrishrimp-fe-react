"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, CheckCircle2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { addressService } from "@/app/services/address.service"; // ✅ Kéo service gọi API vào

export default function AddressListPage() {
  // ✅ THAY THẾ MOCK DATA BẰNG STATE THẬT
  const [addresses, setAddresses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // ✅ HÀM GỌI API LẤY DANH SÁCH
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

  // ✅ TỰ ĐỘNG CHẠY KHI VÀO TRANG
  useEffect(() => {
    fetchAddresses();
  }, []);

  // ✅ HÀM XỬ LÝ XÓA
  const handleDelete = async (id: number) => {
    if (!confirm("Bạn có chắc chắn muốn xóa địa chỉ này?")) return;
    try {
      await addressService.delete(id);
      toast.success("Xóa địa chỉ thành công");
      fetchAddresses(); // Gọi lại API để load danh sách mới
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Xóa thất bại");
    }
  };

  // ✅ HÀM XỬ LÝ THIẾT LẬP MẶC ĐỊNH
  const handleSetDefault = async (id: number) => {
    try {
      await addressService.setDefault(id);
      toast.success("Đã đặt làm địa chỉ mặc định");
      fetchAddresses(); // Gọi lại API để load danh sách mới
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Thao tác thất bại");
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 min-h-[500px] flex items-center justify-center">
        <Loader2 className="animate-spin text-[#329965]" size={32} />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-100 min-h-[500px]">
      <div className="flex justify-between items-center p-5 border-b border-gray-100">
        <h5 className="font-bold text-gray-800 text-lg">Địa chỉ của tôi</h5>

        {/* NÚT THÊM MỚI: CHUYỂN TRANG */}
        <Link href="/address/create">
          <button className="bg-[#329965] hover:bg-[#268050] text-white px-4 h-12 rounded-md text-sm font-bold flex items-center transition-colors shadow-sm">
            <Plus size={18} className="mr-1" /> Thêm địa chỉ mới
          </button>
        </Link>
      </div>

      <div className="p-5 space-y-4">
        {/* ✅ HIỂN THỊ NẾU DANH SÁCH TRỐNG */}
        {addresses.length === 0 && (
          <div className="text-center py-10 text-gray-500">
            Bạn chưa có địa chỉ nhận hàng nào.
          </div>
        )}

        {/* ✅ MAP DATA THẬT */}
        {addresses.map((addr) => (
          <div
            key={addr.id}
            className="border border-gray-200 rounded-lg p-4 flex flex-col md:flex-row justify-between items-start hover:border-[#329965] transition-colors bg-white"
          >
            <div className="flex-1 mb-3 md:mb-0 pr-4">
              <div className="flex items-center mb-1">
                <h6 className="font-bold text-gray-900 text-sm">
                  {addr.receiverName}
                </h6>
                <span className="text-gray-300 mx-2 font-light">|</span>
                <span className="text-gray-600 text-sm">{addr.receiverPhone}</span>
              </div>
              <div className="text-sm text-gray-600 mb-2 leading-relaxed">
                {/* ✅ GHÉP CHUỖI ĐỊA CHỈ TỪ API: (Số nhà, Phường, Huyện, Tỉnh) */}
                {addr.addressDetail}
              </div>
              {addr.isDefault && (
                <span className="inline-flex items-center text-xs font-bold text-[#329965] border border-[#329965] px-2 py-0.5 rounded bg-green-50">
                  <CheckCircle2 size={12} className="mr-1" /> Mặc định
                </span>
              )}
            </div>

            <div className="flex flex-col items-end gap-4 min-w-[140px] shrink-0">
              <div className="flex items-center gap-3 text-sm">
                {/* NÚT SỬA: CHUYỂN TRANG */}
                <Link
                  href={`/address/${addr.id}`}
                  className="text-blue-600 hover:text-blue-800 font-medium hover:underline"
                >
                  Cập nhật
                </Link>
                {!addr.isDefault && (
                  <button 
                    onClick={() => handleDelete(addr.id)} 
                    className="text-red-500 hover:text-red-700 font-medium hover:underline"
                  >
                    Xóa
                  </button>
                )}
              </div>
              <button
                onClick={() => handleSetDefault(addr.id)}
                className={`text-sm border px-4 h-12 rounded transition-colors ${
                  addr.isDefault
                    ? "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed"
                    : "bg-white text-gray-600 border-gray-300 hover:border-[#329965] hover:text-[#329965]"
                }`}
                disabled={addr.isDefault}
              >
                {addr.isDefault ? "Đã là mặc định" : "Thiết lập mặc định"}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}