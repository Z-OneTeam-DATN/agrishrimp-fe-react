"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  X,
  Settings,
  HelpCircle,
  Save,
  ChevronLeft,
  User,
  Mail,
  Phone,
  MapPin,
  UserCircle,
  ShieldCheck,
  Info,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { CustomerSchema, CustomerFormValues } from "@/app/types/admin.schema";
import { customerService } from "@/app/services/customer.service";

interface LocationItem {
  id: string;
  full_name: string;
}

export default function AddCustomerPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // States lưu data địa chỉ
  const [provinces, setProvinces] = useState<LocationItem[]>([]);
  const [districts, setDistricts] = useState<LocationItem[]>([]);
  const [wards, setWards] = useState<LocationItem[]>([]);

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    getValues, // Đã lấy getValues ra để dùng
    formState: { errors },
  } = useForm<CustomerFormValues>({
    resolver: zodResolver(CustomerSchema),
    defaultValues: {
      status: "ACTIVE",
      gender: "MALE",
    },
  });

  // Watch giá trị Tỉnh, Huyện, Xã để gọi API và fill text
  const selectedProvince = watch("provinceId");
  const selectedDistrict = watch("districtId");
  const selectedWard = watch("wardId"); // Lắng nghe thêm giá trị xã

  // 1. Load Tỉnh/Thành khi mount
  useEffect(() => {
    fetch("https://esgoo.net/api-tinhthanh/1/0.htm")
      .then((res) => res.json())
      .then((data) => {
        if (data.error === 0) setProvinces(data.data);
      });
  }, []);

  // 2. Load Quận/Huyện khi Tỉnh thay đổi
  useEffect(() => {
    if (selectedProvince) {
      fetch(`https://esgoo.net/api-tinhthanh/2/${selectedProvince}.htm`)
        .then((res) => res.json())
        .then((data) => {
          if (data.error === 0) {
            setDistricts(data.data);
            setWards([]); // Reset xã
            setValue("districtId", ""); // Reset value form
            setValue("wardId", "");
          }
        });
    }
  }, [selectedProvince, setValue]);

  // 3. Load Phường/Xã khi Huyện thay đổi
  useEffect(() => {
    if (selectedDistrict) {
      fetch(`https://esgoo.net/api-tinhthanh/3/${selectedDistrict}.htm`)
        .then((res) => res.json())
        .then((data) => {
          if (data.error === 0) setWards(data.data);
        });
    }
  }, [selectedDistrict, setValue]);

  // 👇 4. Tự động điền chuỗi địa chỉ khi chọn đủ Tỉnh, Huyện, Xã
  useEffect(() => {
    if (selectedProvince && selectedDistrict && selectedWard) {
      const pName = provinces.find((p) => p.id === selectedProvince)?.full_name || "";
      const dName = districts.find((d) => d.id === selectedDistrict)?.full_name || "";
      const wName = wards.find((w) => w.id === selectedWard)?.full_name || "";

      if (pName && dName && wName) {
        // Format theo dạng: Phường X, Quận Y, Tỉnh Z
        const autoString = `${wName}, ${dName}, ${pName}`;
        const currentAddress = getValues("addressDetail") || "";

        // Nếu chuỗi đang trống hoặc không chứa cái format cũ, ghi đè chuỗi mới vào
        if (!currentAddress || !currentAddress.includes(autoString)) {
          setValue("addressDetail", autoString, { shouldValidate: true });
        }
      }
    }
  }, [selectedProvince, selectedDistrict, selectedWard, provinces, districts, wards, setValue, getValues]);


  const onSave = async (data: CustomerFormValues) => {
    setIsSubmitting(true);
    try {
      await customerService.create(data);
      window.dispatchEvent(new Event("customerUpdated"));
      toast.success("Thêm khách hàng và gửi mail thành công!");
      router.push("/admin/customers");
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Lỗi hệ thống";
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit(onSave)}
      className="space-y-4 pb-[100px] bg-slate-50/30 p-4 min-h-screen"
    >
      <div className="flex items-center gap-4 mb-2 px-1">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => router.back()}
          className="h-8 w-8 text-slate-400"
        >
          <ChevronLeft size={20} />
        </Button>
        <div className="flex flex-col">
          <h1 className="text-[18px] font-black text-[#1f1f1f] tracking-tight uppercase">
            Thêm khách hàng mới
          </h1>
          <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest flex items-center gap-1">
            <UserCircle size={12} /> Hồ sơ đối tác & khách hàng AgriShrimp
          </p>
        </div>
        <div className="ms-auto flex items-center gap-3 text-gray-400">
          <Settings
            size={18}
            className="cursor-pointer hover:text-blue-600 transition-colors"
          />
          <HelpCircle
            size={18}
            className="cursor-pointer hover:text-blue-600 transition-colors"
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => router.back()}
            className="h-8 w-8"
          >
            <X size={20} />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="lg:col-span-9 space-y-5">
          {/* 1. Thông tin cơ bản */}
          <div className="bg-white border border-[#dcdcdc] p-6 rounded-none shadow-sm">
            <div className="flex items-center gap-2 mb-6 text-blue-700 font-black text-[11px] uppercase tracking-widest border-b pb-3">
              <User size={16} /> 1. Thông tin định danh khách hàng
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-5">
              <div className="md:col-span-3 space-y-1.5">
                <Label className="text-[10px] font-black text-slate-500 uppercase tracking-tight">
                  Họ và tên khách hàng *
                </Label>
                <Input
                  {...register("name")}
                  placeholder="Ví dụ: Nguyễn Văn Đại..."
                  className="h-[34px] text-[13px] border-[#ccc] rounded-none shadow-none font-bold focus:border-blue-500"
                />
                {errors.name && (
                  <p className="text-[10px] text-red-500">
                    {errors.name.message}
                  </p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] font-black text-slate-500 uppercase tracking-tight">
                  Số điện thoại *
                </Label>
                <div className="relative">
                  <Phone
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300"
                    size={14}
                  />
                  <Input
                    {...register("phone")}
                    placeholder="090x xxx xxx"
                    className="h-[34px] pl-9 text-[13px] border-[#ccc] rounded-none shadow-none font-bold focus:border-blue-500"
                  />
                </div>
                {errors.phone && (
                  <p className="text-[10px] text-red-500">
                    {errors.phone.message}
                  </p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] font-black text-slate-500 uppercase tracking-tight">
                  Email liên hệ *
                </Label>
                <div className="relative">
                  <Mail
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300"
                    size={14}
                  />
                  <Input
                    {...register("email")}
                    placeholder="customer@gmail.com"
                    className="h-[34px] pl-9 text-[13px] border-[#ccc] rounded-none shadow-none focus:border-blue-500"
                  />
                </div>
                {errors.email && (
                  <p className="text-[10px] text-red-500">
                    {errors.email.message}
                  </p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] font-black text-slate-500 uppercase tracking-tight">
                  Giới tính
                </Label>
                <Controller
                  name="gender"
                  control={control}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger className="h-[34px] text-[13px] border-[#ccc] rounded-none shadow-none focus:ring-0">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="rounded-none font-bold text-[11px]">
                        <SelectItem value="MALE">NAM GIỚI</SelectItem>
                        <SelectItem value="FEMALE">NỮ GIỚI</SelectItem>
                        <SelectItem value="OTHER">KHÁC</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
            </div>
          </div>

          {/* 2. Địa chỉ động (ĐÃ SỬA) */}
          <div className="bg-white border border-[#dcdcdc] p-6 rounded-none shadow-sm">
            <div className="flex items-center gap-2 mb-6 text-blue-700 font-black text-[11px] uppercase tracking-widest border-b pb-3">
              <MapPin size={16} /> 2. Địa chỉ thường trú & Vị trí ao nuôi
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-5">
              {/* Tỉnh/Thành */}
              <div className="space-y-1.5">
                <Label className="text-[10px] font-black text-slate-500 uppercase tracking-tight">
                  Tỉnh / Thành phố *
                </Label>
                <Controller
                  name="provinceId"
                  control={control}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger className="h-[34px] text-[12px] border-[#ccc] rounded-none focus:ring-0 shadow-none">
                        <SelectValue placeholder="-- Chọn Tỉnh/TP --" />
                      </SelectTrigger>
                      <SelectContent className="rounded-none max-h-[200px]">
                        {provinces.map((p) => (
                          <SelectItem key={p.id} value={p.id}>
                            {p.full_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
              {/* Quận/Huyện */}
              <div className="space-y-1.5">
                <Label className="text-[10px] font-black text-slate-500 uppercase tracking-tight">
                  Quận / Huyện *
                </Label>
                <Controller
                  name="districtId"
                  control={control}
                  render={({ field }) => (
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                      disabled={!selectedProvince}
                    >
                      <SelectTrigger className="h-[34px] text-[12px] border-[#ccc] rounded-none focus:ring-0 shadow-none">
                        <SelectValue placeholder="-- Chọn Quận/Huyện --" />
                      </SelectTrigger>
                      <SelectContent className="rounded-none max-h-[200px]">
                        {districts.map((d) => (
                          <SelectItem key={d.id} value={d.id}>
                            {d.full_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
              {/* Phường/Xã */}
              <div className="space-y-1.5">
                <Label className="text-[10px] font-black text-slate-500 uppercase tracking-tight">
                  Phường / Xã *
                </Label>
                <Controller
                  name="wardId"
                  control={control}
                  render={({ field }) => (
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                      disabled={!selectedDistrict}
                    >
                      <SelectTrigger className="h-[34px] text-[12px] border-[#ccc] rounded-none focus:ring-0 shadow-none">
                        <SelectValue placeholder="-- Chọn Phường/Xã --" />
                      </SelectTrigger>
                      <SelectContent className="rounded-none max-h-[200px]">
                        {wards.map((w) => (
                          <SelectItem key={w.id} value={w.id}>
                            {w.full_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
              <div className="md:col-span-3 space-y-1.5">
                <Label className="text-[10px] font-black text-slate-500 uppercase tracking-tight">
                  Số nhà, tên đường (Địa chỉ chi tiết) *
                </Label>
                <Input
                  {...register("addressDetail")}
                  placeholder="Hệ thống sẽ tự điền Phường/Xã, bạn gõ thêm số nhà nhé..."
                  className="h-[34px] text-[13px] border-[#ccc] rounded-none focus:border-blue-500 shadow-none bg-yellow-50/50"
                />
              </div>
            </div>
          </div>

          {/* 3. Ghi chú */}
          <div className="bg-white border border-[#dcdcdc] p-6 rounded-none shadow-sm">
            <div className="flex items-center gap-2 mb-6 text-blue-700 font-black text-[11px] uppercase tracking-widest border-b pb-3">
              <Info size={16} /> 3. Ghi chú nghiệp vụ & Đặc điểm hộ nuôi
            </div>
            <Textarea
              {...register("note")}
              placeholder="Nhập các đặc điểm lưu ý..."
              className="min-h-[120px] text-[13px] border-[#ccc] rounded-none focus-visible:ring-blue-500/20 shadow-none focus:border-blue-500"
            />
          </div>
        </div>

        {/* Sidebar - Right */}
        <div className="lg:col-span-3 space-y-5">
          <div className="bg-white border border-[#dcdcdc] p-6 rounded-none shadow-sm">
            <Label className="text-[11px] font-black text-slate-700 uppercase block mb-5 tracking-widest border-b pb-3">
              Trạng thái tài khoản
            </Label>
            <Controller
              name="status"
              control={control}
              render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value}>
                  <SelectTrigger className="h-[38px] text-[13px] border-[#ccc] rounded-none font-black text-emerald-600 shadow-none uppercase focus:ring-0">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-none">
                    <SelectItem
                      value="ACTIVE"
                      className="text-emerald-600 font-bold"
                    >
                      ĐANG HOẠT ĐỘNG
                    </SelectItem>
                    <SelectItem
                      value="LOCKED"
                      className="text-rose-600 font-bold"
                    >
                      ĐANG TẠM KHÓA
                    </SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          <div className="p-5 bg-blue-50 border border-blue-100 rounded-none">
            <div className="flex items-center gap-2 text-blue-700 font-black text-[10px] uppercase mb-3 tracking-widest border-b border-blue-200 pb-1.5">
              <ShieldCheck size={14} /> Quy tắc dữ liệu
            </div>
            <p className="text-[11px] text-blue-700/80 leading-relaxed font-medium italic">
              * Hệ thống sẽ tự động gửi Email tài khoản ngay khi bạn nhấn lưu
              thành công.
            </p>
          </div>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="fixed bottom-0 left-0 lg:left-[260px] right-0 bg-[#f8f9fa] border-t border-[#ddd] p-[12px_30px] flex items-center justify-end gap-[15px] z-[999] shadow-[0_-4px_15px_rgba(0,0,0,0.05)]">
        <Button
          type="button"
          variant="outline"
          className="min-w-[110px] h-[38px] text-[12px] font-bold border-[#ccc] bg-white rounded-none shadow-sm hover:bg-slate-50 transition-all uppercase"
          onClick={() => router.back()}
        >
          HỦY BỎ
        </Button>
        <Button
          type="submit"
          disabled={isSubmitting}
          className="min-w-[180px] h-[38px] text-[12px] font-black bg-blue-600 hover:bg-blue-700 text-white rounded-none shadow-md shadow-blue-100 transition-all active:scale-[0.98] uppercase"
        >
          <Save size={18} className="mr-2" />
          {isSubmitting ? "ĐANG LƯU..." : "LƯU HỒ SƠ KHÁCH HÀNG"}
        </Button>
      </div>
    </form>
  );
}