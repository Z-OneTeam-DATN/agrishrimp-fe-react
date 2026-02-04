"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { 
  X, Settings, HelpCircle, Save, ChevronLeft, 
  Building2, User, Mail, Phone, MapPin, 
  Map, BadgeCheck, AlertCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue 
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

export default function AddBranchPage() {
  const router = useRouter();

  const onSave = () => {
    toast.success("Đã khởi tạo chi nhánh mới thành công!");
    router.push("/admin/branches");
  };

  const onSaveAndAdd = () => {
    toast.success("Đã lưu và chuẩn bị thêm chi nhánh tiếp theo");
    // Reset logic here
  };

  return (
    <div className="space-y-3 pb-[100px]">
      {/* Page Header */}
      <div className="flex items-center gap-4 mb-4 px-1">
        <Button variant="ghost" size="icon" onClick={() => router.back()} className="h-8 w-8 text-slate-400">
          <ChevronLeft size={20} />
        </Button>
        <h1 className="text-[18px] font-black text-[#1f1f1f] tracking-tight uppercase">
          Khởi tạo chi nhánh mới
        </h1>
        <div className="ms-auto flex items-center gap-3 text-gray-400">
          <Settings size={18} className="cursor-pointer hover:text-emerald-600 transition-colors" />
          <HelpCircle size={18} className="cursor-pointer hover:text-emerald-600 transition-colors" />
          <Button variant="ghost" size="icon" onClick={() => router.back()} className="h-8 w-8"><X size={20} /></Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Main Content - Left */}
        <div className="lg:col-span-8 space-y-3">
          
          {/* 1. Thông tin định danh */}
          <div className="bg-white border border-[#dcdcdc] p-[15px_20px] rounded-[4px] shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
            <div className="flex items-center gap-2 mb-4 text-emerald-700 font-black text-[11px] uppercase tracking-wider">
              <Building2 size={16} /> 1. Thông tin định danh chi nhánh
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
              <div className="space-y-[2px]">
                <Label className="text-[11px] font-bold text-slate-500 uppercase tracking-tighter">Tên chi nhánh <span className="text-red-500">*</span></Label>
                <Input placeholder="Ví dụ: Chi nhánh Cần Thơ 1..." className="h-[32px] text-[13px] border-[#ccc] rounded-[3px] focus-visible:ring-emerald-500/20 shadow-none font-bold" />
              </div>
              <div className="space-y-[2px]">
                <Label className="text-[11px] font-bold text-slate-500 uppercase tracking-tighter">Mã chi nhánh</Label>
                <Input placeholder="CN-000" className="h-[32px] text-[13px] border-[#ccc] rounded-[3px] font-mono shadow-none uppercase bg-slate-50" />
              </div>
            </div>
          </div>

          {/* 2. Địa chỉ & Vị trí */}
          <div className="bg-white border border-[#dcdcdc] p-[15px_20px] rounded-[4px] shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
            <div className="flex items-center gap-2 mb-4 text-emerald-700 font-black text-[11px] uppercase tracking-wider">
              <MapPin size={16} /> 2. Vị trí địa lý & Kho hàng
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-x-4 gap-y-4">
              <div className="space-y-[2px]">
                <Label className="text-[11px] font-bold text-slate-500 uppercase tracking-tighter">Tỉnh / Thành phố <span className="text-red-500">*</span></Label>
                <Select>
                  <SelectTrigger className="h-[32px] text-[12px] border-[#ccc] rounded-[3px] shadow-none"><SelectValue placeholder="Chọn Tỉnh/TP" /></SelectTrigger>
                  <SelectContent><SelectItem value="ct">Cần Thơ</SelectItem><SelectItem value="st">Sóc Trăng</SelectItem></SelectContent>
                </Select>
              </div>
              <div className="space-y-[2px]">
                <Label className="text-[11px] font-bold text-slate-500 uppercase tracking-tighter">Quận / Huyện <span className="text-red-500">*</span></Label>
                <Select>
                  <SelectTrigger className="h-[32px] text-[12px] border-[#ccc] rounded-[3px] shadow-none"><SelectValue placeholder="Chọn Quận/Huyện" /></SelectTrigger>
                  <SelectContent><SelectItem value="nk">Ninh Kiều</SelectItem></SelectContent>
                </Select>
              </div>
              <div className="space-y-[2px]">
                <Label className="text-[11px] font-bold text-slate-500 uppercase tracking-tighter">Phường / Xã</Label>
                <Select>
                  <SelectTrigger className="h-[32px] text-[12px] border-[#ccc] rounded-[3px] shadow-none"><SelectValue placeholder="Chọn Phường/Xã" /></SelectTrigger>
                  <SelectContent><SelectItem value="xk">Xuân Khánh</SelectItem></SelectContent>
                </Select>
              </div>
              <div className="md:col-span-3 space-y-[2px]">
                <Label className="text-[11px] font-bold text-slate-500 uppercase tracking-tighter">Địa chỉ chi tiết (Số nhà, tên đường...)</Label>
                <Input placeholder="Nhập địa chỉ chính xác để định vị..." className="h-[32px] text-[13px] border-[#ccc] rounded-[3px] shadow-none" />
              </div>
            </div>
          </div>

          {/* 3. Phụ trách & Liên hệ */}
          <div className="bg-white border border-[#dcdcdc] p-[15px_20px] rounded-[4px] shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
            <div className="flex items-center gap-2 mb-4 text-emerald-700 font-black text-[11px] uppercase tracking-wider">
              <User size={16} /> 3. Nhân sự phụ trách & Liên hệ
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-x-4 gap-y-4">
              <div className="space-y-[2px]">
                <Label className="text-[11px] font-bold text-slate-500 uppercase tracking-tighter">Người quản lý chi nhánh</Label>
                <Select>
                  <SelectTrigger className="h-[32px] text-[13px] border-[#ccc] rounded-[3px] shadow-none">
                    <SelectValue placeholder="-- Chọn nhân sự --" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Nguyễn Văn An (NV-001)</SelectItem>
                    <SelectItem value="2">Trần Thị Bích (NV-002)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-[2px]">
                <Label className="text-[11px] font-bold text-slate-500 uppercase tracking-tighter">Số điện thoại liên hệ <span className="text-red-500">*</span></Label>
                <div className="relative">
                  <Phone className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-300" size={14} />
                  <Input placeholder="090x xxx xxx" className="h-[32px] pl-8 text-[13px] border-[#ccc] rounded-[3px] shadow-none font-bold" />
                </div>
              </div>
              <div className="space-y-[2px]">
                <Label className="text-[11px] font-bold text-slate-500 uppercase tracking-tighter">Email chi nhánh</Label>
                <div className="relative">
                  <Mail className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-300" size={14} />
                  <Input type="email" placeholder="branch@agri.com" className="h-[32px] pl-8 text-[13px] border-[#ccc] rounded-[3px] shadow-none" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar - Right */}
        <div className="lg:col-span-4 space-y-3">
          {/* Status Box */}
          <div className="bg-white border border-[#dcdcdc] p-[15px_20px] rounded-[4px] shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
            <Label className="text-[11px] font-bold text-slate-500 uppercase block mb-3 tracking-widest">Trạng thái vận hành</Label>
            <Select defaultValue="active">
              <SelectTrigger className="h-[32px] text-[13px] border-[#ccc] rounded-[3px] font-black text-emerald-600 shadow-none uppercase">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">ĐANG HOẠT ĐỘNG</SelectItem>
                <SelectItem value="maintenance">ĐANG BẢO TRÌ</SelectItem>
                <SelectItem value="inactive">NGỪNG HOẠT ĐỘNG</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Map Placeholder */}
          <div className="bg-white border border-[#dcdcdc] p-[15px_20px] rounded-[4px] shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
            <Label className="text-[11px] font-bold text-slate-500 uppercase block mb-3 tracking-widest text-center">Bản đồ định vị</Label>
            <div className="aspect-square bg-slate-50 border border-slate-100 rounded-[4px] flex flex-col items-center justify-center text-slate-300">
              <Map size={48} className="mb-2 opacity-20" />
              <span className="text-[10px] font-bold uppercase tracking-tighter">Chưa có dữ liệu GPS</span>
            </div>
            <Button variant="outline" className="w-full mt-3 h-[30px] text-[11px] font-bold text-emerald-600 border-emerald-200 hover:bg-emerald-50 rounded-[3px]">
              <Map size={14} className="mr-1" /> LẤY TỌA ĐỘ TỰ ĐỘNG
            </Button>
          </div>

          <div className="p-4 bg-amber-50 border border-amber-100 rounded-[4px]">
            <div className="flex items-center gap-2 text-amber-700 font-bold text-[11px] uppercase mb-2">
              <AlertCircle size={14} /> Lưu ý quan trọng
            </div>
            <p className="text-[11px] text-amber-600 leading-relaxed">
              Khi khởi tạo chi nhánh mới, hệ thống sẽ tự động tạo một kho hàng tương ứng tại chi nhánh này. Vui lòng kiểm tra kỹ thông tin địa chỉ để phục vụ công tác giao nhận hàng.
            </p>
          </div>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="fixed bottom-0 left-0 lg:left-[260px] right-0 bg-[#f8f9fa] border-t border-[#ddd] p-[8px_20px] flex items-center justify-end gap-[10px] z-[999]">
        <Button variant="outline" className="min-w-[100px] h-[34px] text-[12px] font-bold border-[#ccc] bg-white rounded-[3px] shadow-sm" onClick={() => router.back()}>
          HỦY BỎ
        </Button>
        <Button 
          variant="outline" 
          className="min-w-[120px] h-[34px] text-[12px] font-black border-emerald-500 text-emerald-600 bg-white rounded-[3px] hover:bg-emerald-50 shadow-sm"
          onClick={onSaveAndAdd}
        >
          CẤT & THÊM MỚI
        </Button>
        <Button 
          className="min-w-[120px] h-[34px] text-[12px] font-black bg-emerald-600 hover:bg-emerald-700 text-white rounded-[3px] shadow-md shadow-emerald-100"
          onClick={onSave}
        >
          <Save size={16} className="mr-2" />
          LƯU CHI NHÁNH
        </Button>
      </div>
    </div>
  );
}
