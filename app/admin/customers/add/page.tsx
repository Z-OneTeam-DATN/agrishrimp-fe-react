"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { 
  X, Settings, HelpCircle, Save, ChevronLeft, 
  User, Mail, Phone, MapPin, 
  CreditCard, UserCircle, Briefcase, 
  Info, ShieldCheck, Map, Smartphone
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue 
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function AddCustomerPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const onSave = async () => {
    setIsSubmitting(true);
    // Giả lập lưu dữ liệu
    setTimeout(() => {
      toast.success("Thêm khách hàng mới thành công!");
      setIsSubmitting(false);
      router.push("/admin/customers");
    }, 1000);
  };

  return (
    <div className="space-y-4 pb-[100px] bg-slate-50/30 p-4 min-h-screen">
      {/* Page Header */}
      <div className="flex items-center gap-4 mb-2 px-1">
        <Button variant="ghost" size="icon" onClick={() => router.back()} className="h-8 w-8 text-slate-400">
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
          <Settings size={18} className="cursor-pointer hover:text-blue-600 transition-colors" />
          <HelpCircle size={18} className="cursor-pointer hover:text-blue-600 transition-colors" />
          <Button variant="ghost" size="icon" onClick={() => router.back()} className="h-8 w-8"><X size={20} /></Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Main Content - Left */}
        <div className="lg:col-span-9 space-y-5">
          
          {/* 1. Thông tin cơ bản */}
          <div className="bg-white border border-[#dcdcdc] p-6 rounded-none shadow-sm">
            <div className="flex items-center gap-2 mb-6 text-blue-700 font-black text-[11px] uppercase tracking-widest border-b pb-3">
              <User size={16} /> 1. Thông tin định danh khách hàng
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-5">
              <div className="md:col-span-2 space-y-1.5">
                <Label className="text-[10px] font-black text-slate-500 uppercase tracking-tight">Họ và tên khách hàng *</Label>
                <Input placeholder="Ví dụ: Nguyễn Văn Đại..." className="h-[34px] text-[13px] border-[#ccc] rounded-none focus-visible:ring-blue-500/20 shadow-none font-bold focus:border-blue-500" />
              </div>
              
              <div className="space-y-1.5">
                <Label className="text-[10px] font-black text-slate-500 uppercase tracking-tight">Phân loại khách hàng *</Label>
                <Select defaultValue="chu-ao">
                  <SelectTrigger className="h-[34px] text-[13px] border-[#ccc] rounded-none shadow-none focus:ring-0">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-none font-bold text-[11px]">
                    <SelectItem value="chu-ao">CHỦ AO NUÔI (HỘ GIA ĐÌNH)</SelectItem>
                    <SelectItem value="dai-ly">ĐẠI LÝ PHÂN PHỐI</SelectItem>
                    <SelectItem value="farm">TRANG TRẠI (FARM) QUY MÔ LỚN</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-[10px] font-black text-slate-500 uppercase tracking-tight">Số điện thoại *</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={14} />
                  <Input placeholder="090x xxx xxx" className="h-[34px] pl-9 text-[13px] border-[#ccc] rounded-none shadow-none font-bold focus:border-blue-500" />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-[10px] font-black text-slate-500 uppercase tracking-tight">Email liên hệ</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={14} />
                  <Input placeholder="customer@gmail.com" className="h-[34px] pl-9 text-[13px] border-[#ccc] rounded-none shadow-none focus:border-blue-500" />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-[10px] font-black text-slate-500 uppercase tracking-tight">Giới tính</Label>
                <Select defaultValue="male">
                  <SelectTrigger className="h-[34px] text-[13px] border-[#ccc] rounded-none shadow-none focus:ring-0">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-none font-bold text-[11px]">
                    <SelectItem value="male">NAM GIỚI</SelectItem>
                    <SelectItem value="female">NỮ GIỚI</SelectItem>
                    <SelectItem value="other">KHÁC</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* 2. Địa chỉ & Vị trí ao nuôi */}
          <div className="bg-white border border-[#dcdcdc] p-6 rounded-none shadow-sm">
            <div className="flex items-center gap-2 mb-6 text-blue-700 font-black text-[11px] uppercase tracking-widest border-b pb-3">
              <MapPin size={16} /> 2. Địa chỉ thường trú & Vị trí ao nuôi
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-5">
              <div className="space-y-1.5">
                <Label className="text-[10px] font-black text-slate-500 uppercase tracking-tight">Tỉnh / Thành phố *</Label>
                <Select><SelectTrigger className="h-[34px] text-[12px] border-[#ccc] rounded-none focus:ring-0 shadow-none"><SelectValue placeholder="-- Chọn Tỉnh/TP --" /></SelectTrigger><SelectContent className="rounded-none"><SelectItem value="ct">Cần Thơ</SelectItem><SelectItem value="st">Sóc Trăng</SelectItem><SelectItem value="bl">Bạc Liêu</SelectItem></SelectContent></Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] font-black text-slate-500 uppercase tracking-tight">Quận / Huyện *</Label>
                <Select><SelectTrigger className="h-[34px] text-[12px] border-[#ccc] rounded-none focus:ring-0 shadow-none"><SelectValue placeholder="-- Chọn Quận/Huyện --" /></SelectTrigger><SelectContent className="rounded-none"><SelectItem value="nk">Ninh Kiều</SelectItem></SelectContent></Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] font-black text-slate-500 uppercase tracking-tight">Phường / Xã *</Label>
                <Select><SelectTrigger className="h-[34px] text-[12px] border-[#ccc] rounded-none focus:ring-0 shadow-none"><SelectValue placeholder="-- Chọn Phường/Xã --" /></SelectTrigger><SelectContent className="rounded-none"><SelectItem value="xk">Xuân Khánh</SelectItem></SelectContent></Select>
              </div>
              <div className="md:col-span-3 space-y-1.5">
                <Label className="text-[10px] font-black text-slate-500 uppercase tracking-tight">Số nhà, tên đường (Địa chỉ chi tiết) *</Label>
                <Input placeholder="Nhập địa chỉ chính xác..." className="h-[34px] text-[13px] border-[#ccc] rounded-none focus:border-blue-500 shadow-none" />
              </div>
            </div>
          </div>

          {/* 3. Ghi chú & Đặc điểm khách hàng */}
          <div className="bg-white border border-[#dcdcdc] p-6 rounded-none shadow-sm">
            <div className="flex items-center gap-2 mb-6 text-blue-700 font-black text-[11px] uppercase tracking-widest border-b pb-3">
              <Info size={16} /> 3. Ghi chú nghiệp vụ & Đặc điểm hộ nuôi
            </div>
            <Textarea placeholder="Nhập các đặc điểm lưu ý (Ví dụ: Quy mô 5 ao tôm công nghệ cao, ưu tiên giao hàng sáng sớm...)" className="min-h-[120px] text-[13px] border-[#ccc] rounded-none focus-visible:ring-blue-500/20 shadow-none focus:border-blue-500" />
          </div>
        </div>

        {/* Sidebar - Right */}
        <div className="lg:col-span-3 space-y-5">
          {/* Account Status */}
          <div className="bg-white border border-[#dcdcdc] p-6 rounded-none shadow-sm">
            <Label className="text-[11px] font-black text-slate-700 uppercase block mb-5 tracking-widest border-b pb-3">Trạng thái tài khoản</Label>
            <Select defaultValue="active">
              <SelectTrigger className="h-[38px] text-[13px] border-[#ccc] rounded-none font-black text-emerald-600 shadow-none uppercase focus:ring-0">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-none">
                <SelectItem value="active" className="text-emerald-600 font-bold">ĐANG HOẠT ĐỘNG</SelectItem>
                <SelectItem value="locked" className="text-rose-600 font-bold">ĐANG TẠM KHÓA</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Pricing Tier */}
          <div className="bg-white border border-[#dcdcdc] p-6 rounded-none shadow-sm">
            <Label className="text-[11px] font-black text-slate-700 uppercase block mb-5 tracking-widest border-b pb-3">Nhóm giá áp dụng</Label>
            <Select defaultValue="standard">
              <SelectTrigger className="h-[38px] text-[13px] border-[#ccc] rounded-none font-bold text-slate-600 shadow-none focus:ring-0">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-none">
                <SelectItem value="standard">GIÁ LẺ NIÊM YẾT</SelectItem>
                <SelectItem value="wholesale">GIÁ BÁN BUÔN (ĐẠI LÝ)</SelectItem>
                <SelectItem value="vip">GIÁ KHÁCH HÀNG THÂN THIẾT</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-[10px] text-slate-400 mt-3 italic leading-relaxed">
              * Hệ thống sẽ tự động áp dụng bảng giá này khi tạo đơn hàng cho khách.
            </p>
          </div>

          {/* Assigned Staff */}
          <div className="bg-white border border-[#dcdcdc] p-6 rounded-none shadow-sm">
            <Label className="text-[11px] font-black text-slate-700 uppercase block mb-5 tracking-widest border-b pb-3">Nhân viên phụ trách</Label>
            <Select defaultValue="1">
              <SelectTrigger className="h-[38px] text-[13px] border-[#ccc] rounded-none shadow-none focus:ring-0">
                <SelectValue placeholder="-- Chọn nhân sự --" />
              </SelectTrigger>
              <SelectContent className="rounded-none font-bold text-[11px]">
                <SelectItem value="1">Nguyễn Văn An (NV-001)</SelectItem>
                <SelectItem value="2">Trần Thị Bích (NV-002)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Quick Notice */}
          <div className="p-5 bg-blue-50 border border-blue-100 rounded-none">
            <div className="flex items-center gap-2 text-blue-700 font-black text-[10px] uppercase mb-3 tracking-widest border-b border-blue-200 pb-1.5">
              <ShieldCheck size={14} /> Quy tắc dữ liệu
            </div>
            <p className="text-[11px] text-blue-700/80 leading-relaxed font-medium italic">
              * Số điện thoại là định danh chính. Hệ thống sẽ tự động kiểm tra trùng lặp khi nhấn lưu.
            </p>
          </div>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="fixed bottom-0 left-0 lg:left-[260px] right-0 bg-[#f8f9fa] border-t border-[#ddd] p-[12px_30px] flex items-center justify-end gap-[15px] z-[999] shadow-[0_-4px_15px_rgba(0,0,0,0.05)]">
        <Button variant="outline" className="min-w-[110px] h-[38px] text-[12px] font-bold border-[#ccc] bg-white rounded-none shadow-sm hover:bg-slate-50 transition-all uppercase" onClick={() => router.back()}>
          HỦY BỎ
        </Button>
        <Button 
          className="min-w-[180px] h-[38px] text-[12px] font-black bg-blue-600 hover:bg-blue-700 text-white rounded-none shadow-md shadow-blue-100 transition-all active:scale-[0.98] uppercase"
          onClick={onSave}
          disabled={isSubmitting}
        >
          <Save size={18} className="mr-2" />
          {isSubmitting ? "ĐANG LƯU..." : "LƯU HỒ SƠ KHÁCH HÀNG"}
        </Button>
      </div>
    </div>
  );
}
