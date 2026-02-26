"use client";

import React, { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  X,
  Settings,
  HelpCircle,
  Save,
  ChevronLeft,
  Building2,
  User,
  Phone,
  MapPin,
  CreditCard,
  Percent,
  Briefcase,
  Landmark,
  Upload,
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
import { toast } from "sonner";

export default function AddDealerPage() {
  const router = useRouter();
  const licenseRef = useRef<HTMLInputElement>(null);
  const [licensePreview, setLicensePreview] = useState<string | null>(null);

  const handleLicenseChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) =>
        setLicensePreview(event.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  const onSave = () => {
    toast.success("Đã đăng ký thông tin đại lý thành công!");
    router.push("/admin/customers");
  };

  return (
    <div className="space-y-3 pb-[100px]">
      {/* Page Header */}
      <div className="flex items-center gap-4 mb-4 px-1">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.back()}
          className="h-8 w-8 text-slate-400"
        >
          <ChevronLeft size={20} />
        </Button>
        <h1 className="text-[18px] font-black text-[#1f1f1f] tracking-tight uppercase">
          Đăng ký đại lý / Đối tác mới
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
            variant="ghost"
            size="icon"
            onClick={() => router.back()}
            className="h-8 w-8"
          >
            <X size={20} />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Main Content - Left */}
        <div className="lg:col-span-9 space-y-3">
          {/* 1. Thông tin doanh nghiệp */}
          <div className="bg-white border border-[#dcdcdc] p-[15px_20px] rounded-[4px] shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
            <div className="flex items-center gap-2 mb-4 text-emerald-700 font-black text-[11px] uppercase tracking-wider">
              <Building2 size={16} /> 1. Thông tin pháp nhân & Đại lý
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
              <div className="md:col-span-2 space-y-[2px]">
                <Label className="text-[11px] font-bold text-slate-500 uppercase tracking-tighter">
                  Tên doanh nghiệp / Tên đại lý{" "}
                  <span className="text-red-500">*</span>
                </Label>
                <Input
                  placeholder="Ví dụ: Công ty TNHH Thủy Sản Agri Miền Tây..."
                  className="h-[32px] text-[13px] border-[#ccc] rounded-[3px] focus-visible:ring-emerald-500/20 shadow-none font-bold"
                />
              </div>
              <div className="space-y-[2px]">
                <Label className="text-[11px] font-bold text-slate-500 uppercase tracking-tighter">
                  Mã số thuế <span className="text-red-500">*</span>
                </Label>
                <Input
                  placeholder="Nhập mã số thuế..."
                  className="h-[32px] text-[13px] border-[#ccc] rounded-[3px] shadow-none font-mono"
                />
              </div>
              <div className="space-y-[2px]">
                <Label className="text-[11px] font-bold text-slate-500 uppercase tracking-tighter">
                  Loại hình đại lý
                </Label>
                <Select defaultValue="lv1">
                  <SelectTrigger className="h-[32px] text-[13px] border-[#ccc] rounded-[3px] shadow-none">
                    <SelectValue placeholder="Chọn cấp đại lý" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="lv1">
                      Đại lý Cấp 1 (Tổng phân phối)
                    </SelectItem>
                    <SelectItem value="lv2">Đại lý Cấp 2</SelectItem>
                    <SelectItem value="farm">
                      Hộ nuôi lớn (Key Account)
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* 2. Người đại diện */}
          <div className="bg-white border border-[#dcdcdc] p-[15px_20px] rounded-[4px] shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
            <div className="flex items-center gap-2 mb-4 text-emerald-700 font-black text-[11px] uppercase tracking-wider">
              <User size={16} /> 2. Người đại diện liên hệ
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-x-4 gap-y-4">
              <div className="space-y-[2px]">
                <Label className="text-[11px] font-bold text-slate-500 uppercase tracking-tighter">
                  Họ và tên <span className="text-red-500">*</span>
                </Label>
                <Input
                  placeholder="Người đại diện pháp luật..."
                  className="h-[32px] text-[13px] border-[#ccc] rounded-[3px] shadow-none"
                />
              </div>
              <div className="space-y-[2px]">
                <Label className="text-[11px] font-bold text-slate-500 uppercase tracking-tighter">
                  Chức vụ
                </Label>
                <div className="relative">
                  <Briefcase
                    className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-300"
                    size={14}
                  />
                  <Input
                    placeholder="Chủ đại lý, Giám đốc..."
                    className="h-[32px] pl-8 text-[13px] border-[#ccc] rounded-[3px] shadow-none"
                  />
                </div>
              </div>
              <div className="space-y-[2px]">
                <Label className="text-[11px] font-bold text-slate-500 uppercase tracking-tighter">
                  Số điện thoại <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <Phone
                    className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-300"
                    size={14}
                  />
                  <Input
                    placeholder="090x xxx xxx"
                    className="h-[32px] pl-8 text-[13px] border-[#ccc] rounded-[3px] shadow-none font-bold"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* 3. Địa chỉ */}
          <div className="bg-white border border-[#dcdcdc] p-[15px_20px] rounded-[4px] shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
            <div className="flex items-center gap-2 mb-4 text-emerald-700 font-black text-[11px] uppercase tracking-wider">
              <MapPin size={16} /> 3. Địa chỉ kinh doanh / Kho hàng
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-x-4 gap-y-4">
              <div className="space-y-[2px]">
                <Label className="text-[11px] font-bold text-slate-500 uppercase tracking-tighter">
                  Tỉnh / Thành phố
                </Label>
                <Select>
                  <SelectTrigger className="h-[32px] text-[12px] border-[#ccc] rounded-[3px] shadow-none">
                    <SelectValue placeholder="Chọn Tỉnh/TP" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ct">Cần Thơ</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-[2px]">
                <Label className="text-[11px] font-bold text-slate-500 uppercase tracking-tighter">
                  Quận / Huyện
                </Label>
                <Select>
                  <SelectTrigger className="h-[32px] text-[12px] border-[#ccc] rounded-[3px] shadow-none">
                    <SelectValue placeholder="Chọn Quận/Huyện" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="nk">Ninh Kiều</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-[2px]">
                <Label className="text-[11px] font-bold text-slate-500 uppercase tracking-tighter">
                  Phường / Xã
                </Label>
                <Select>
                  <SelectTrigger className="h-[32px] text-[12px] border-[#ccc] rounded-[3px] shadow-none">
                    <SelectValue placeholder="Chọn Phường/Xã" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="xk">Xuân Khánh</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="md:col-span-3 space-y-[2px]">
                <Label className="text-[11px] font-bold text-slate-500 uppercase tracking-tighter">
                  Địa chỉ chi tiết (Số nhà, tên đường...)
                </Label>
                <Input
                  placeholder="Nhập địa chỉ đầy đủ..."
                  className="h-[32px] text-[13px] border-[#ccc] rounded-[3px] shadow-none"
                />
              </div>
            </div>
          </div>

          {/* 4. Chính sách tài chính */}
          <div className="bg-white border border-[#dcdcdc] p-[15px_20px] rounded-[4px] shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
            <div className="flex items-center gap-2 mb-4 text-emerald-700 font-black text-[11px] uppercase tracking-wider">
              <Landmark size={16} /> 4. Chính sách hợp tác & Tài chính
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-x-4 gap-y-4">
              <div className="space-y-[2px]">
                <Label className="text-[11px] font-bold text-slate-500 uppercase tracking-tighter">
                  Hạn mức công nợ (VNĐ)
                </Label>
                <div className="relative">
                  <CreditCard
                    className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-300"
                    size={14}
                  />
                  <Input
                    type="number"
                    defaultValue={0}
                    className="h-[32px] pl-8 text-[13px] border-[#ccc] rounded-[3px] shadow-none text-right font-bold"
                  />
                </div>
              </div>
              <div className="space-y-[2px]">
                <Label className="text-[11px] font-bold text-slate-500 uppercase tracking-tighter">
                  Mức chiết khấu (%)
                </Label>
                <div className="relative">
                  <Percent
                    className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-300"
                    size={14}
                  />
                  <Input
                    type="number"
                    defaultValue={0}
                    className="h-[32px] pl-8 text-[13px] border-[#ccc] rounded-[3px] shadow-none text-right font-bold text-emerald-600"
                  />
                </div>
              </div>
              <div className="space-y-[2px]">
                <Label className="text-[11px] font-bold text-slate-500 uppercase tracking-tighter">
                  Tài khoản ngân hàng
                </Label>
                <Input
                  placeholder="Số tài khoản - Ngân hàng..."
                  className="h-[32px] text-[13px] border-[#ccc] rounded-[3px] shadow-none"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar - Right */}
        <div className="lg:col-span-3 space-y-3">
          {/* Business License Photo */}
          <div className="bg-white border border-[#dcdcdc] p-[15px_20px] rounded-[4px] shadow-[0_1px_2px_rgba(0,0,0,0.05)] text-center">
            <Label className="text-[11px] font-bold text-slate-500 uppercase block mb-4 tracking-widest">
              Giấy phép kinh doanh
            </Label>
            <div
              onClick={() => licenseRef.current?.click()}
              className="relative mx-auto w-full h-48 border-2 border-dashed border-[#ddd] rounded-[4px] flex flex-col items-center justify-center bg-[#fcfcfc] hover:bg-emerald-50 hover:border-emerald-300 transition-all cursor-pointer overflow-hidden group shadow-inner"
            >
              {licensePreview ? (
                <img
                  src={licensePreview}
                  alt="License"
                  className="w-full h-full object-contain p-2"
                />
              ) : (
                <div className="text-center">
                  <Upload size={24} className="text-slate-200 mx-auto mb-1" />
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">
                    Tải ảnh giấy phép
                  </span>
                </div>
              )}
              <input
                type="file"
                ref={licenseRef}
                onChange={handleLicenseChange}
                hidden
                accept="image/*"
              />
            </div>
            <p className="text-[10px] text-slate-400 italic mt-4 leading-relaxed">
              Yêu cầu ảnh chụp rõ nét bản gốc hoặc bản công chứng còn thời hạn.
            </p>
          </div>

          {/* Business Status */}
          <div className="bg-white border border-[#dcdcdc] p-[15px_20px] rounded-[4px] shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
            <Label className="text-[11px] font-bold text-slate-500 uppercase block mb-3 tracking-widest">
              Trạng thái hợp tác
            </Label>
            <Select defaultValue="active">
              <SelectTrigger className="h-[32px] text-[13px] border-[#ccc] rounded-[3px] font-black text-emerald-600 shadow-none uppercase">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">ĐANG HOẠT ĐỘNG</SelectItem>
                <SelectItem value="pending">CHỜ XÁC MINH</SelectItem>
                <SelectItem value="locked">TẠM NGỪNG HỢP TÁC</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Assigned Staff */}
          <div className="bg-white border border-[#dcdcdc] p-[15px_20px] rounded-[4px] shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
            <Label className="text-[11px] font-bold text-slate-500 uppercase block mb-3 tracking-widest">
              Nhân viên quản lý
            </Label>
            <Select defaultValue="1">
              <SelectTrigger className="h-[32px] text-[13px] border-[#ccc] rounded-[3px] shadow-none">
                <SelectValue placeholder="Chọn nhân viên" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">Nguyễn Văn An (NV-001)</SelectItem>
                <SelectItem value="2">Trần Thị Bích (NV-002)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="fixed bottom-0 left-0 lg:left-[260px] right-0 bg-[#f8f9fa] border-t border-[#ddd] p-[8px_20px] flex items-center justify-end gap-[10px] z-[999]">
        <Button
          variant="outline"
          className="min-w-[100px] h-[34px] text-[12px] font-bold border-[#ccc] bg-white rounded-[3px] shadow-sm"
          onClick={() => router.back()}
        >
          HỦY BỎ
        </Button>
        <Button
          className="min-w-[140px] h-[34px] text-[12px] font-black bg-emerald-600 hover:bg-emerald-700 text-white rounded-[3px] shadow-md shadow-emerald-100"
          onClick={onSave}
        >
          <Save size={16} className="mr-2" />
          ĐĂNG KÝ ĐẠI LÝ
        </Button>
      </div>
    </div>
  );
}
