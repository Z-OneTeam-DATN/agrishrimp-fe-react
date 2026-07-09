"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import AddressForm from "@/components/profile/AddressForm";
import { addressService } from "@/app/services/address.service";
import { Loader2 } from "lucide-react";

export default function EditAddressPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = React.use(params);
  const router = useRouter();
  
  const [initialData, setInitialData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // --- FETCH DỮ LIỆU ĐỊA CHỈ CŨ ĐỂ ĐIỀN VÀO FORM ---
  useEffect(() => {
    const fetchAddressInfo = async () => {
      try {
        const allAddresses = await addressService.getAll();
        const currentAddress = allAddresses.find((a: any) => a.id.toString() === id);

        if (!currentAddress) {
          toast.error("Không tìm thấy địa chỉ này!");
          router.push("/address");
          return;
        }

        // Đổ dữ liệu từ API vào format của Form
        // API trả về flat: provinceId, districtId, wardId (chứa GHN WardCode)
        setInitialData({
          fullName: currentAddress.receiverName,
          phone: currentAddress.receiverPhone,
          provinceId: String(currentAddress.provinceId || ""),
          districtId: String(currentAddress.districtId || ""),
          wardCode: String(currentAddress.wardId || ""),
          specificAddress: currentAddress.addressDetail,
          isDefault: currentAddress.isDefault ?? false,
          addressType: currentAddress.addressType || "Home",
        });

      } catch (error: any) {
        if (error.response?.status === 401 || error.response?.status === 403) {
          toast.error("Vui lòng đăng nhập!");
          router.push("/login");
        } else {
          toast.error("Lỗi tải dữ liệu địa chỉ!");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchAddressInfo();
  }, [id, router]);

  // --- SUBMIT CẬP NHẬT LÊN BACKEND ---
  const handleUpdate = async (data: any) => {
    setIsSubmitting(true);
    try {
      const payload = {
        receiverName: data.fullName,
        receiverPhone: data.phone,
        addressDetail: data.specificAddress,
        provinceId: Number(data.provinceId),
        districtId: Number(data.districtId),
        wardCode: data.wardCode,
        isDefault: data.isDefault,
        addressType: data.addressType,
      };
      await addressService.update(Number(id), payload);
      toast.success("✅ Cập nhật địa chỉ thành công!");
      router.push("/address"); // Quay lại trang danh sách
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Lỗi khi cập nhật địa chỉ!");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center bg-white rounded-lg shadow-sm border border-gray-100">
        <Loader2 className="animate-spin text-[#1965a2]" size={32} />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <AddressForm 
        title="Cập nhật địa chỉ" 
        initialValues={initialData} 
        onSubmit={handleUpdate} 
        isSubmitting={isSubmitting}
      />
    </div>
  );
}
