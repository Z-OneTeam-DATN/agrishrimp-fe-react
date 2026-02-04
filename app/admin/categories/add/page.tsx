"use client";

import React, { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { 
  X, Settings, HelpCircle, Plus, Trash2, Save, 
  ChevronLeft, Image as ImageIcon, Tag, AlertCircle, Upload, Camera
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue 
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

export default function AddCategoryPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);

  const handleThumbnailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => setThumbnailPreview(event.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  const onSave = () => {
    toast.success("Đã lưu danh mục thành công!");
    router.push("/admin/categories");
  };

  const onSaveAndAdd = () => {
    toast.success("Đã lưu và chuẩn bị thêm danh mục mới");
    setThumbnailPreview(null);
    // Reset other form fields logic here
  };

  return (
    <div className="space-y-3 pb-[100px]">
      {/* Page Header */}
      <div className="flex items-center gap-4 mb-4 px-1">
        <Button variant="ghost" size="icon" onClick={() => router.back()} className="h-8 w-8 text-slate-400">
          <ChevronLeft size={20} />
        </Button>
        <h1 className="text-[18px] font-black text-[#1f1f1f] tracking-tight uppercase">
          Thêm danh mục hàng hóa
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
          
          {/* Thông tin cơ bản */}
          <div className="bg-white border border-[#dcdcdc] p-[15px_20px] rounded-[4px] shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
            <div className="flex items-center gap-2 mb-4 text-emerald-700 font-black text-[11px] uppercase tracking-wider">
              <Tag size={16} /> 1. Thông tin định danh danh mục
            </div>
            <div className="grid grid-cols-1 gap-y-4">
              <div className="space-y-[2px]">
                <Label className="text-[11px] font-bold text-slate-500 uppercase tracking-tighter">Tên danh mục <span className="text-red-500">*</span></Label>
                <Input placeholder="Ví dụ: Thuốc & Chế phẩm, Dụng cụ nuôi..." className="h-[32px] text-[13px] border-[#ccc] rounded-[3px] focus-visible:ring-emerald-500/20 shadow-none" />
              </div>
              
              <div className="space-y-[2px]">
                <Label className="text-[11px] font-bold text-slate-500 uppercase tracking-tighter">Danh mục cha</Label>
                <Select>
                  <SelectTrigger className="h-[32px] text-[13px] border-[#ccc] rounded-[3px] shadow-none">
                    <SelectValue placeholder="-- Chọn danh mục cấp trên (nếu có) --" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Không có (Danh mục gốc)</SelectItem>
                    <SelectItem value="1">Thuốc & Chế phẩm</SelectItem>
                    <SelectItem value="2">Thức ăn</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-[2px]">
                <Label className="text-[11px] font-bold text-slate-500 uppercase tracking-tighter">Mô tả danh mục</Label>
                <Textarea 
                  placeholder="Nhập mô tả ngắn gọn về nhóm sản phẩm này..." 
                  className="min-h-[100px] text-[13px] border-[#ccc] rounded-[3px] shadow-none focus-visible:ring-emerald-500/20" 
                />
              </div>
            </div>
          </div>

          <div className="bg-white border border-[#dcdcdc] p-[15px_20px] rounded-[4px] shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
            <div className="flex items-center gap-2 mb-2 text-slate-700 font-black text-[11px] uppercase tracking-wider">
              <AlertCircle size={16} className="text-amber-500" /> Lưu ý quản trị
            </div>
            <p className="text-[12px] text-slate-500 leading-relaxed">
              Việc phân loại danh mục chính xác giúp khách hàng dễ dàng tìm kiếm sản phẩm trên trang chủ và giúp hệ thống báo cáo doanh thu theo nhóm mặt hàng hiệu quả hơn.
            </p>
          </div>
        </div>

        {/* Sidebar - Right */}
        <div className="lg:col-span-4 space-y-3">
          {/* Ảnh đại diện */}
          <div className="bg-white border border-[#dcdcdc] p-[15px_20px] rounded-[4px] shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
            <Label className="text-[11px] font-bold text-slate-500 uppercase block mb-3 text-center tracking-widest">Ảnh đại diện nhóm</Label>
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="relative border-2 border-dashed border-[#ddd] rounded-[4px] h-48 flex flex-col items-center justify-center bg-[#fcfcfc] hover:bg-emerald-50 hover:border-emerald-300 transition-all cursor-pointer overflow-hidden group shadow-inner"
            >
              {thumbnailPreview ? (
                <img src={thumbnailPreview} alt="Preview" className="w-full h-full object-cover" />
              ) : (
                <div className="text-center">
                  <Camera size={32} className="text-slate-200 mx-auto mb-2" />
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">Nhấp để tải ảnh</span>
                </div>
              )}
              <input type="file" ref={fileInputRef} onChange={handleThumbnailChange} hidden accept="image/*" />
            </div>
            <p className="text-[10px] text-slate-400 text-center italic mt-3 leading-tight">Kích thước gợi ý: 500x500px</p>
          </div>

          {/* Trạng thái hiển thị */}
          <div className="bg-white border border-[#dcdcdc] p-[15px_20px] rounded-[4px] shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
            <Label className="text-[11px] font-bold text-slate-500 uppercase block mb-3 tracking-widest">Thiết lập hiển thị</Label>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-[10px] font-bold text-slate-400 uppercase">Trạng thái hoạt động</Label>
                <Select defaultValue="show">
                  <SelectTrigger className="h-[32px] text-[13px] border-[#ccc] rounded-[3px] font-black text-emerald-600 shadow-none">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="show">CHO PHÉP HIỂN THỊ</SelectItem>
                    <SelectItem value="hide">ĐANG ẨN</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="fixed bottom-0 left-0 lg:left-[260px] right-0 bg-[#f8f9fa] border-t border-[#ddd] p-[10px_20px] flex items-center justify-end gap-[10px] z-[999]">
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
          LƯU DỮ LIỆU
        </Button>
      </div>
    </div>
  );
}
