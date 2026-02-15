"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AxiosError } from "axios";
import {
  X,
  Settings,
  HelpCircle,
  Save,
  ChevronLeft,
  User,
  MapPin,
  Landmark,
  Truck,
  Search,
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
import { SupplierSchema, SupplierFormValues } from "@/app/types/admin.schema";
import { supplierService } from "@/app/services/supplier.service";
// ❌ Đã xóa import apiJava

interface Province {
  id: string;
  name: string;
  full_name: string;
}

interface Bank {
  id: number;
  name: string;
  code: string;
  bin: string;
  shortName: string;
  logo: string;
}

// Thêm interface cho Danh mục động
interface Category {
  id: number | string;
  name: string;
}

interface ErrorResponse {
  message: string;
}

export default function AddSupplierPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [banks, setBanks] = useState<Bank[]>([]);
  const [dynamicCategories, setDynamicCategories] = useState<Category[]>([]); // State lưu danh mục động

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors },
  } = useForm<SupplierFormValues>({
    resolver: zodResolver(SupplierSchema),
    defaultValues: {
      status: "active",
      discount: 0,
      provinceId: "",
      creditLimit: 0,
      paymentTerms: "",
      category: undefined,
    },
  });

  // 2. Load Tỉnh, Ngân hàng và Danh mục từ DB
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch Tỉnh (External API - Giữ nguyên fetch thường)
        const provRes = await fetch("https://esgoo.net/api-tinhthanh/1/0.htm");
        const provData = await provRes.json();
        if (provData.error === 0) setProvinces(provData.data);

        // Fetch Ngân hàng (External API - Giữ nguyên fetch thường)
        const bankRes = await fetch("https://api.vietqr.io/v2/banks");
        const bankData = await bankRes.json();
        if (bankData.code === "00") setBanks(bankData.data);

        // 👇 FETCH DANH MỤC ĐỘNG QUA SERVICE
        // Đảm bảo bạn đã thêm hàm getCategories() vào supplier.service.ts
        const categoriesData = await supplierService.getCategories();
        setDynamicCategories(categoriesData);
      } catch (error) {
        console.error("Lỗi fetch dữ liệu ban đầu:", error);
        toast.error("Không tải được danh sách danh mục");
      }
    };
    fetchData();
  }, []);

  const detectProvince = (fullAddress: string) => {
    if (!fullAddress || provinces.length === 0) return "";
    const addressLower = fullAddress.toLowerCase();
    const foundProvince = provinces.find((p) => {
      const cleanName = p.name
        .toLowerCase()
        .replace("tỉnh ", "")
        .replace("thành phố ", "");
      return addressLower.includes(cleanName);
    });
    return foundProvince ? foundProvince.id : "";
  };

  const handleLookupTaxCode = async () => {
    const taxCode = watch("taxCode");
    if (!taxCode) {
      toast.error("Vui lòng nhập MST");
      return;
    }
    const loadingToast = toast.loading("Đang tra cứu từ tổng cục thuế...");
    try {
      const businessInfo = await supplierService.lookupTaxCode(taxCode);
      if (businessInfo) {
        setValue("name", businessInfo.name, { shouldValidate: true });
        setValue("addressDetail", businessInfo.address, {
          shouldValidate: true,
        });
        const detectedId = detectProvince(businessInfo.address);
        if (detectedId)
          setValue("provinceId", detectedId, { shouldValidate: true });
        if (businessInfo.owner)
          setValue("contactName", businessInfo.owner, { shouldValidate: true });
        if (businessInfo.phone)
          setValue("phone", businessInfo.phone, { shouldValidate: true });
        if (businessInfo.email)
          setValue("email", businessInfo.email, { shouldValidate: true });
        toast.success("Đã tìm thấy thông tin!");
      }
    } catch {
      toast.error("Không tìm thấy thông tin hoặc API lỗi.");
    } finally {
      toast.dismiss(loadingToast);
    }
  };

  const handleLookupBank = async () => {
    const accountNumber = watch("bankAccountNumber");
    const bankBin = watch("bankName");

    if (!accountNumber || !bankBin) {
      toast.error(
        "Vui lòng chọn ngân hàng và nhập số tài khoản trước khi xác thực",
      );
      return;
    }

    const loadingBank = toast.loading("Đang xác thực tài khoản ngân hàng...");
    try {
      const ownerName = await supplierService.lookupBank(
        bankBin,
        accountNumber,
      );
      if (ownerName) {
        setValue("bankAccountHolder", ownerName, { shouldValidate: true });
        toast.success("Xác thực thành công: " + ownerName);
      } else {
        toast.error("Không tìm thấy thông tin chủ tài khoản.");
      }
    } catch (error) {
      console.error(error);
      toast.error("Lỗi kết nối hệ thống ngân hàng.");
    } finally {
      toast.dismiss(loadingBank);
    }
  };

  const onSubmit = async (data: SupplierFormValues) => {
    setIsSubmitting(true);
    try {
      await supplierService.create(data);
      toast.success("Đã lưu thông tin nhà cung cấp thành công!");
      window.dispatchEvent(new Event("supplierUpdated"));
      router.push("/admin/suppliers");
    } catch (error) {
      const axiosError = error as AxiosError<ErrorResponse>;
      toast.error(axiosError.response?.data?.message || "Lỗi hệ thống");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="space-y-4 pb-[100px] bg-slate-50/30 p-4 min-h-screen"
    >
      {/* Header (Giữ nguyên) */}
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
        <h1 className="text-[18px] font-black text-[#1f1f1f] tracking-tight uppercase">
          Thêm nhà cung cấp mới
        </h1>
        <div className="ms-auto flex items-center gap-3 text-gray-400">
          <Settings
            size={18}
            className="cursor-pointer hover:text-emerald-600 transition-colors"
          />
          <HelpCircle
            size={18}
            className="cursor-pointer hover:text-emerald-600 transition-colors"
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
          <div className="bg-white border border-[#dcdcdc] p-6 rounded-none shadow-sm">
            <div className="flex items-center gap-2 mb-6 text-emerald-700 font-black text-[11px] uppercase tracking-widest border-b pb-3">
              <Truck size={16} /> 1. Thông tin pháp nhân nhà cung cấp
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
              <div className="md:col-span-2 space-y-1.5 relative">
                <Label className="text-[10px] font-black text-slate-500 uppercase tracking-tight">
                  Tên công ty / Pháp nhân *
                </Label>
                <Input
                  {...register("name")}
                  className="h-[34px] text-[13px] border-[#ccc] rounded-none shadow-none focus:border-emerald-500"
                />
                {errors.name && (
                  <p className="text-[10px] text-red-500 font-bold mt-1">
                    {errors.name.message}
                  </p>
                )}
              </div>

              <div className="space-y-1.5 relative">
                <Label className="text-[10px] font-black text-slate-500 uppercase tracking-tight">
                  Mã số thuế *
                </Label>
                <div className="flex gap-0">
                  <Input
                    {...register("taxCode")}
                    className="h-[34px] text-[13px] border-[#ccc] rounded-none shadow-none font-mono focus:border-emerald-500"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleLookupTaxCode}
                    className="h-[34px] bg-slate-50 border-[#ccc] border-l-0 rounded-none px-3 text-[10px] font-black text-blue-600 hover:bg-blue-50"
                  >
                    <Search size={14} className="mr-1" /> TRA CỨU
                  </Button>
                </div>
                {errors.taxCode && (
                  <p className="text-[10px] text-red-500 font-bold mt-1">
                    {errors.taxCode.message}
                  </p>
                )}
              </div>

              {/* 👇 Nhóm hàng chính gọi qua Service */}
              <div className="space-y-1.5 relative">
                <Label className="text-[10px] font-black text-slate-500 uppercase tracking-tight">
                  Nhóm hàng chính *
                </Label>
                <Controller
                  name="category"
                  control={control}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger className="h-[34px] text-[13px] border-[#ccc] rounded-none shadow-none focus:ring-0 italic">
                        <SelectValue placeholder="-- Chọn nhóm hàng --" />
                      </SelectTrigger>
                      <SelectContent className="rounded-none max-h-[250px]">
                        {dynamicCategories.map((cat) => (
                          <SelectItem key={cat.id} value={cat.id.toString()}>
                            {cat.name.toUpperCase()}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.category && (
                  <p className="text-[10px] text-red-500 font-bold mt-1">
                    {errors.category.message}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* ... (Các phần 2. Liên hệ, 3. Địa chỉ giữ nguyên) ... */}
          <div className="bg-white border border-[#dcdcdc] p-6 rounded-none shadow-sm">
            <div className="flex items-center gap-2 mb-6 text-emerald-700 font-black text-[11px] uppercase tracking-widest border-b pb-3">
              <User size={16} /> 2. Thông tin liên hệ trực tiếp
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-x-5 gap-y-5">
              <div className="space-y-1.5">
                <Label className="text-[10px] font-black text-slate-500 uppercase tracking-tight">
                  Họ và tên người đại diện *
                </Label>
                <Input
                  {...register("contactName")}
                  className="h-[34px] text-[13px] border-[#ccc] rounded-none shadow-none focus:border-emerald-500"
                />
                {errors.contactName && (
                  <p className="text-[10px] text-red-500 font-bold mt-1">
                    {errors.contactName.message}
                  </p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] font-black text-slate-500 uppercase tracking-tight">
                  Số điện thoại di động *
                </Label>
                <Input
                  {...register("phone")}
                  className="h-[34px] text-[13px] border-[#ccc] rounded-none shadow-none focus:border-emerald-500"
                />
                {errors.phone && (
                  <p className="text-[10px] text-red-500 font-bold mt-1">
                    {errors.phone.message}
                  </p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] font-black text-slate-500 uppercase tracking-tight">
                  Email liên hệ
                </Label>
                <Input
                  {...register("email")}
                  className="h-[34px] text-[13px] border-[#ccc] rounded-none shadow-none focus:border-emerald-500"
                />
                {errors.email && (
                  <p className="text-[10px] text-red-500 font-bold mt-1">
                    {errors.email.message}
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="bg-white border border-[#dcdcdc] p-6 rounded-none shadow-sm">
            <div className="flex items-center gap-2 mb-6 text-emerald-700 font-black text-[11px] uppercase tracking-widest border-b pb-3">
              <MapPin size={16} /> 3. Trụ sở / Kho bãi nhà cung cấp
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-x-5 gap-y-5">
              <div className="space-y-1.5">
                <Label className="text-[10px] font-black text-slate-500 uppercase tracking-tight">
                  Tỉnh / Thành phố *
                </Label>
                <Controller
                  name="provinceId"
                  control={control}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger className="h-[34px] text-[13px] border-[#ccc] rounded-none shadow-none focus:ring-0">
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
                {errors.provinceId && (
                  <p className="text-[10px] text-red-500 font-bold mt-1">
                    {errors.provinceId.message}
                  </p>
                )}
              </div>
              <div className="md:col-span-2 space-y-1.5">
                <Label className="text-[10px] font-black text-slate-500 uppercase tracking-tight">
                  Địa chỉ chi tiết *
                </Label>
                <Input
                  {...register("addressDetail")}
                  className="h-[34px] text-[13px] border-[#ccc] rounded-none shadow-none focus:border-emerald-500"
                />
                {errors.addressDetail && (
                  <p className="text-[10px] text-red-500 font-bold mt-1">
                    {errors.addressDetail.message}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* ... (Các phần 4. Tài chính, Ngân hàng giữ nguyên) ... */}
          <div className="bg-white border border-[#dcdcdc] p-6 rounded-none shadow-sm">
            <div className="flex items-center gap-2 mb-6 text-emerald-700 font-black text-[11px] uppercase tracking-widest border-b pb-3">
              <Landmark size={16} /> 4. Chính sách thanh toán & Tài chính
            </div>
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-black text-slate-500 uppercase tracking-tight">
                    Chu kỳ thanh toán *
                  </Label>
                  <Controller
                    name="paymentTerms"
                    control={control}
                    render={({ field }) => (
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <SelectTrigger className="h-[34px] text-[13px] border-[#ccc] rounded-none shadow-none focus:ring-0">
                          <SelectValue placeholder="-- Chọn chu kỳ --" />
                        </SelectTrigger>
                        <SelectContent className="rounded-none">
                          <SelectItem value="immediate">
                            Thanh toán ngay
                          </SelectItem>
                          <SelectItem value="net15">Công nợ 15 ngày</SelectItem>
                          <SelectItem value="net30">
                            Công nợ 30 ngày (Net30)
                          </SelectItem>
                          <SelectItem value="deferred">
                            Gối đầu đơn hàng
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-black text-rose-600 uppercase tracking-tight">
                    Hạn mức công nợ (₫)
                  </Label>
                  <Input
                    {...register("creditLimit")}
                    type="number"
                    className="h-[34px] text-[13px] border-[#ccc] rounded-none text-right font-bold text-rose-600 bg-rose-50/10"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-black text-emerald-600 uppercase tracking-tight">
                    Chiết khấu (%)
                  </Label>
                  <Input
                    {...register("discount")}
                    type="number"
                    className="h-[34px] text-[13px] border-[#ccc] rounded-none text-right font-bold text-emerald-600 bg-emerald-50/10"
                  />
                </div>
              </div>
              <div className="pt-4 border-t border-dashed border-slate-100">
                <p className="text-[10px] font-black text-slate-400 uppercase mb-4 italic">
                  Thông tin tài khoản thụ hưởng
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-black text-slate-500 uppercase tracking-tight">
                      Ngân hàng *
                    </Label>
                    <Controller
                      name="bankName"
                      control={control}
                      render={({ field }) => (
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                        >
                          <SelectTrigger className="h-[34px] text-[13px] border-[#ccc] rounded-none shadow-none focus:ring-0">
                            <SelectValue placeholder="-- Chọn ngân hàng --" />
                          </SelectTrigger>
                          <SelectContent className="max-h-[250px]">
                            {banks.map((bank) => (
                              <SelectItem key={bank.bin} value={bank.bin}>
                                <div className="flex items-center gap-2">
                                  <img
                                    src={bank.logo}
                                    alt=""
                                    className="w-5 h-5 object-contain"
                                  />
                                  <span className="truncate">
                                    {bank.shortName}
                                  </span>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-black text-slate-500 uppercase tracking-tight">
                      Số tài khoản *
                    </Label>
                    <div className="flex gap-0">
                      <Input
                        {...register("bankAccountNumber")}
                        className="h-[34px] text-[13px] border-[#ccc] rounded-none shadow-none font-mono focus:border-blue-500"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleLookupBank}
                        className="h-[34px] bg-slate-50 border-[#ccc] border-l-0 rounded-none px-3 text-[10px] font-black text-blue-600 hover:bg-blue-50"
                      >
                        <Search size={14} className="mr-1" /> XÁC THỰC
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-black text-slate-500 uppercase tracking-tight">
                      Tên chủ tài khoản *
                    </Label>
                    <Input
                      {...register("bankAccountHolder")}
                      readOnly
                      className="h-[34px] text-[13px] border-[#ccc] rounded-none shadow-none font-bold uppercase bg-slate-50"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ... (Right Column và Bottom Bar giữ nguyên) ... */}
        <div className="lg:col-span-3 space-y-5">
          <div className="bg-white border border-[#dcdcdc] p-6 rounded-none shadow-sm">
            <Label className="text-[11px] font-black text-slate-700 uppercase block mb-5 tracking-widest border-b pb-3">
              Trạng thái vận hành
            </Label>
            <Controller
              name="status"
              control={control}
              render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value}>
                  <SelectTrigger className="h-[38px] text-[13px] border-[#ccc] rounded-none font-black text-emerald-600 shadow-none focus:ring-0">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-none">
                    <SelectItem
                      value="active"
                      className="text-emerald-600 font-bold uppercase tracking-tighter"
                    >
                      ĐANG GIAO DỊCH
                    </SelectItem>
                    <SelectItem
                      value="inactive"
                      className="text-rose-600 font-bold uppercase tracking-tighter"
                    >
                      TẠM NGỪNG
                    </SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
          </div>
          <div className="bg-white border border-[#dcdcdc] p-6 rounded-none shadow-sm">
            <Label className="text-[11px] font-black text-slate-700 uppercase block mb-4 tracking-widest">
              Ghi chú nghiệp vụ
            </Label>
            <Textarea
              {...register("note")}
              placeholder="Lưu ý quan trọng..."
              className="min-h-[150px] text-[13px] border-[#ccc] rounded-none shadow-none"
            />
          </div>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 lg:left-[260px] right-0 bg-[#f8f9fa] border-t border-[#ddd] p-[12px_30px] flex items-center justify-end gap-[15px] z-[999]">
        <Button
          type="button"
          variant="outline"
          className="min-w-[110px] h-[38px] text-[12px] font-bold border-[#ccc] bg-white rounded-none"
          onClick={() => router.back()}
        >
          HỦY BỎ
        </Button>
        <Button
          type="submit"
          disabled={isSubmitting}
          className="min-w-[180px] h-[38px] text-[12px] font-black bg-emerald-600 hover:bg-emerald-700 text-white rounded-none"
        >
          <Save size={18} className="mr-2" />
          {isSubmitting ? "ĐANG LƯU..." : "LƯU NHÀ CUNG CẤP"}
        </Button>
      </div>
    </form>
  );
}
