"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useState } from "react";
import AddressForm from "@/components/profile/AddressForm";
import { AddressFormValues } from "@/app/types/address.schema";
import { addressService } from "@/app/services/address.service"; // ✅ Import API

export default function CreateAddressPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false); // ✅ Thêm state để form hiện loading

  const handleCreate = async (data: AddressFormValues) => { // ✅ Đổi thành async
    setIsSubmitting(true);
    try {
      // ✅ "Dịch" dữ liệu form sang DTO của Backend
      const payload = {
        receiverName: data.fullName,
        receiverPhone: data.phone,
        addressDetail: data.specificAddress,
        provinceId: Number(data.provinceId),
        districtId: Number(data.districtId),
        wardCode: data.wardCode,
        isDefault: data.isDefault,
      };

      // ✅ Gọi API thêm mới
      await addressService.create(payload);
      
      toast.success("Thêm địa chỉ thành công!");
      router.push("/address"); // Quay về danh sách
      router.refresh(); // ✅ Cực kỳ quan trọng: Báo Next.js xóa cache và tải lại DB
    } catch (error: any) {
      if (error.response?.status === 401 || error.response?.status === 403) {
        toast.error("Vui lòng đăng nhập lại!");
        router.push("/login");
      } else {
        toast.error(error.response?.data?.message || "Lỗi khi thêm địa chỉ!");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AddressForm 
      title="Thêm địa chỉ mới" 
      onSubmit={handleCreate} 
      isSubmitting={isSubmitting} // ✅ Truyền loading xuống Form
    />
  );
}