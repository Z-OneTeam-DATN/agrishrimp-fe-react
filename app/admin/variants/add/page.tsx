"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { 
  X, Settings, HelpCircle, Plus, Trash2, Save, 
  ChevronLeft, Layers, Tag, AlertCircle, Settings2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue 
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

export default function AddVariantPage() {
  const router = useRouter();
  
  // States cho quản lý giá trị thuộc tính
  const [values, setValues] = useState<string[]>(["ml", "lít", "gram", "kg"]);
  const [newValueInput, setNewValueInput] = useState("");

  const addValue = () => {
    if (!newValueInput.trim()) return;
    if (values.includes(newValueInput.trim())) {
      toast.error("Giá trị này đã tồn tại");
      return;
    }
    setValues([...values, newValueInput.trim()]);
    setNewValueInput("");
  };

  const removeValue = (val: string) => {
    setValues(values.filter(v => v !== val));
  };

  const onSave = () => {
    toast.success("Đã lưu thuộc tính thành công!");
    router.push("/admin/variants");
  };

  return (
    <div className="space-y-3 pb-[100px]">
      {/* Page Header */}
      <div className="flex items-center gap-4 mb-4 px-1">
        <Button variant="ghost" size="icon" onClick={() => router.back()} className="h-8 w-8 text-slate-400">
          <ChevronLeft size={20} />
        </Button>
        <h1 className="text-[18px] font-black text-[#1f1f1f] tracking-tight uppercase">
          Thêm thuộc tính mới
        </h1>
        <div className="ms-auto flex items-center gap-3 text-gray-400">
          <Settings size={18} className="cursor-pointer hover:text-emerald-600 transition-colors" />
          <HelpCircle size={18} className="cursor-pointer hover:text-emerald-600 transition-colors" />
          <Button variant="ghost" size="icon" onClick={() => router.back()} className="h-8 w-8"><X size={20} /></Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Main Content */}
        <div className="lg:col-span-8 space-y-3">
          
          {/* Thông tin cơ bản */}
          <div className="bg-white border border-[#dcdcdc] p-[15px_20px] rounded-[4px] shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
            <div className="flex items-center gap-2 mb-4 text-emerald-700 font-black text-[11px] uppercase tracking-wider">
              <Tag size={16} /> 1. Thông tin định danh thuộc tính
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
              <div className="space-y-[2px]">
                <Label className="text-[11px] font-bold text-slate-500 uppercase tracking-tighter">Tên thuộc tính <span className="text-red-500">*</span></Label>
                <Input placeholder="Ví dụ: Đơn vị tính, Màu sắc, Công suất..." className="h-[32px] text-[13px] border-[#ccc] rounded-[3px] focus-visible:ring-emerald-500/20 shadow-none" />
              </div>
              <div className="space-y-[2px]">
                <Label className="text-[11px] font-bold text-slate-500 uppercase tracking-tighter">Mã định danh (Code) <span className="text-red-500">*</span></Label>
                <Input placeholder="Ví dụ: UNIT_TYPE, COLOR..." className="h-[32px] text-[13px] border-[#ccc] rounded-[3px] font-mono shadow-none" />
              </div>
              <div className="md:col-span-2 space-y-[2px]">
                <Label className="text-[11px] font-bold text-slate-500 uppercase tracking-tighter">Ghi chú / Mô tả</Label>
                <Input placeholder="Nhập mục đích sử dụng của thuộc tính này..." className="h-[32px] text-[13px] border-[#ccc] rounded-[3px] shadow-none" />
              </div>
            </div>
          </div>

          {/* Quản lý giá trị */}
          <div className="bg-white border border-[#dcdcdc] p-[15px_20px] rounded-[4px] shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 text-slate-700 font-black text-[11px] uppercase tracking-wider">
                <Settings2 size={16} className="text-emerald-600" /> 2. Danh sách các giá trị hợp lệ
              </div>
            </div>

            <div className="space-y-4">
              {/* Input thêm giá trị nhanh */}
              <div className="flex items-center gap-2 max-w-md">
                <Input 
                  placeholder="Nhập giá trị mới..." 
                  className="h-[32px] text-[13px] border-[#ccc] rounded-[3px] focus-visible:ring-emerald-500/20 shadow-none" 
                  value={newValueInput}
                  onChange={(e) => setNewValueInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addValue()}
                />
                <Button 
                  type="button" 
                  onClick={addValue}
                  className="h-[32px] bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 rounded-[3px]"
                >
                  <Plus size={16} className="mr-1" /> THÊM
                </Button>
              </div>

              {/* Danh sách thẻ giá trị */}
              <div className="flex flex-wrap gap-2 p-4 bg-slate-50 border border-slate-100 rounded-[4px] min-h-[100px]">
                {values.map((val) => (
                  <div key={val} className="flex items-center bg-white border border-slate-200 rounded px-3 py-1 shadow-sm group hover:border-emerald-500 transition-all">
                    <span className="text-[13px] font-bold text-slate-700 mr-3">{val}</span>
                    <button onClick={() => removeValue(val)} className="text-slate-300 hover:text-rose-500">
                      <X size={14} />
                    </button>
                  </div>
                ))}
                {values.length === 0 && (
                  <div className="w-full flex flex-col items-center justify-center text-slate-300 py-4">
                    <AlertCircle size={24} className="mb-1 opacity-20" />
                    <span className="text-[11px] font-bold uppercase tracking-widest">Chưa có giá trị nào</span>
                  </div>
                )}
              </div>
              <p className="text-[10px] text-slate-400 italic">
                * Nhấn Enter hoặc nút Thêm để xác nhận giá trị mới vào danh sách.
              </p>
            </div>
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="lg:col-span-4 space-y-3">
          <div className="bg-white border border-[#dcdcdc] p-[15px_20px] rounded-[4px] shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
            <div className="flex items-center gap-2 mb-4 text-slate-700 font-black text-[11px] uppercase tracking-wider">
              <Layers size={16} className="text-emerald-600" /> Cài đặt hiển thị
            </div>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-[11px] font-bold text-slate-500 uppercase">Trạng thái sử dụng</Label>
                <Select defaultValue="active">
                  <SelectTrigger className="h-[32px] text-[13px] border-[#ccc] rounded-[3px] font-black text-emerald-600 shadow-none">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">ĐANG SỬ DỤNG</SelectItem>
                    <SelectItem value="inactive">TẠM NGƯNG</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="p-3 bg-amber-50 border border-amber-100 rounded text-[11px] text-amber-700 leading-relaxed">
                <p className="font-bold flex items-center gap-1 mb-1"><AlertCircle size={12} /> Lưu ý:</p>
                Khi một thuộc tính đang được sử dụng bởi các sản phẩm trong hệ thống, bạn không nên xóa hoặc đổi mã định danh để tránh lỗi dữ liệu.
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
