"use client";

import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { addressService } from "@/app/services/address.service"; // ✅ Dùng đúng service địa chỉ
import { CheckCircle2 } from "lucide-react"; // Đổi icon cho giống form kia

interface AddressItemProps {
  address: any; // ✅ Sửa thành any hoặc interface từ Backend trả về
  onEdit?: (address: any) => void;
  onRefresh: () => void;
}

export function AddressItem({ address, onEdit, onRefresh }: AddressItemProps) {

  const handleDelete = async () => {
    if (!address.id) return;
    if (!confirm("Bạn có chắc chắn muốn xóa địa chỉ này?")) return;
    
    try {
      await addressService.delete(address.id); // ✅ Gọi API xóa
      toast.success("Xóa địa chỉ thành công!");
      onRefresh(); // Cập nhật lại danh sách cha
    } catch (error: any) {
      console.error("Failed to delete address:", error);
      toast.error(error.response?.data?.message || "Xóa địa chỉ thất bại. Vui lòng thử lại.");
    }
  };

  const handleSetDefault = async () => {
    if (!address.id) return;
    try {
      await addressService.setDefault(address.id); // ✅ Gọi API set default
      toast.success("Đặt địa chỉ mặc định thành công!");
      onRefresh(); // Cập nhật lại danh sách cha
    } catch (error: any) {
      console.error("Failed to set default address:", error);
      toast.error(error.response?.data?.message || "Đặt địa chỉ mặc định thất bại. Vui lòng thử lại.");
    }
  };

  return (
    <div className="border border-gray-200 rounded-lg p-4 flex flex-col md:flex-row justify-between items-start hover:border-[#329965] transition-colors bg-white">
      <div className="flex-1 mb-3 md:mb-0 pr-4">
        <div className="flex items-center mb-1">
          <h6 className="font-bold text-gray-900 text-sm">
            {address.receiverName} {/* ✅ Tên đúng chuẩn DTO Backend */}
          </h6>
          <span className="text-gray-300 mx-2 font-light">|</span>
          <span className="text-gray-600 text-sm">{address.receiverPhone}</span>
        </div>
        
        <div className="text-sm text-gray-600 mb-2 leading-relaxed">
           {/* ✅ GHÉP ĐỊA CHỈ: Vì Backend lưu toàn bộ chuỗi rồi nên gọi thẳng */}
           {address.addressDetail}
        </div>
        
        {address.isDefault && (
          <span className="inline-flex items-center text-xs font-bold text-[#329965] border border-[#329965] px-2 py-0.5 rounded bg-green-50">
            <CheckCircle2 size={12} className="mr-1" /> Mặc định
          </span>
        )}
      </div>

      <div className="flex flex-col items-end gap-4 min-w-[140px] shrink-0">
        <div className="flex items-center gap-3 text-sm">
          {/* ✅ NẾU CÓ TRUYỀN HÀM ONEDIT (Dùng Modal) THÌ GỌI ONEDIT, NẾU KHÔNG THÌ LÀ THẺ LINK */}
          {onEdit ? (
            <button
              type="button"
              onClick={() => onEdit(address)}
              className="text-blue-600 hover:text-blue-800 font-medium hover:underline cursor-pointer"
            >
              Cập nhật
            </button>
          ) : (
            <a href={`/address/${address.id}`} className="text-blue-600 hover:text-blue-800 font-medium hover:underline">
              Cập nhật
            </a>
          )}
          
          {!address.isDefault && (
            <button
              type="button"
              onClick={handleDelete}
              className="text-red-500 hover:text-red-700 font-medium hover:underline cursor-pointer"
            >
              Xóa
            </button>
          )}
        </div>
        
        <button
          onClick={handleSetDefault}
          disabled={address.isDefault}
          className={`text-sm border px-4 h-10 rounded transition-colors ${
            address.isDefault
              ? "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed"
              : "bg-white text-gray-600 border-gray-300 hover:border-[#329965] hover:text-[#329965]"
          }`}
        >
          {address.isDefault ? "Đã là mặc định" : "Thiết lập mặc định"}
        </button>
      </div>
    </div>
  );
}