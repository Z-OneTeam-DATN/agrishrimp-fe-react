"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
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
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { AdminAttributeSchema, AdminAttributeForm } from "@/app/types/admin.schema";

export default function AddVariantPage() {
  const router = useRouter();
  const [newValueInput, setNewValueInput] = useState("");

  const {
    register,
    handleSubmit,
    control,
    setValue,
    watch,
    formState: { errors },
  } = useForm<AdminAttributeForm>({
    resolver: zodResolver(AdminAttributeSchema),
    mode: "onTouched",
    defaultValues: {
      name: "",
      code: "",
      description: "",
      status: "active",
      values: ["ml", "lít", "gram", "kg"]
    }
  });

  const values = watch("values");

  const addValue = () => {
    const val = newValueInput.trim();
    if (!val) return;
    if (values.includes(val)) {
      toast.error("Giá trị này đã tồn tại");
      return;
    }
    setValue("values", [...values, val], { shouldValidate: true });
    setNewValueInput("");
  };

  const removeValue = (val: string) => {
    setValue("values", values.filter(v => v !== val), { shouldValidate: true });
  };

  const onSave = (data: AdminAttributeForm) => {
    console.log("Attribute Data:", data);
    toast.success("Đã lưu thuộc tính thành công!");
    router.push("/admin/variants");
  };

  return (
    <form onSubmit={handleSubmit(onSave)} className="space-y-3 pb-[100px]">
      {/* Page Header */}
      <div className="flex items-center gap-4 mb-4 px-1">
        <Button type="button" variant="ghost" size="icon" onClick={() => router.back()} className="h-8 w-8 text-slate-400">
          <ChevronLeft size={20} />
        </Button>
        <h1 className="text-[18px] font-black text-[#1f1f1f] tracking-tight uppercase">
          Thêm thuộc tính mới
        </h1>
        <div className="ms-auto flex items-center gap-3 text-gray-400">
          <Settings size={18} className="cursor-pointer hover:text-emerald-600 transition-colors" />
          <HelpCircle size={18} className="cursor-pointer hover:text-emerald-600 transition-colors" />
          <Button type="button" variant="ghost" size="icon" onClick={() => router.back()} className="h-8 w-8"><X size={20} /></Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <div className="lg:col-span-8 space-y-3">

          {/* 1. Thông tin định danh */}
          <div className="bg-white border border-[#dcdcdc] p-[15px_20px] rounded-[4px] shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
            <div className="flex items-center gap-2 mb-4 text-emerald-700 font-black text-[11px] uppercase tracking-wider">
              <Tag size={16} /> 1. Thông tin định danh thuộc tính
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
              {/* Tên thuộc tính - pb-5 để cách ô input và lỗi */}
              <div className="space-y-[2px] relative pb-5">
                <Label className="text-[11px] font-bold text-slate-500 uppercase tracking-tighter">Tên thuộc tính *</Label>
                <Input {...register("name")} placeholder="Ví dụ: Đơn vị tính..." className="h-[32px] text-[13px] border-[#ccc] rounded-[3px] shadow-none" />
                {errors.name && <p className="absolute bottom-0 text-[11px] text-red-500 font-bold">{errors.name.message}</p>}
              </div>

              {/* Mã định danh - pb-5 để cách ô input và lỗi */}
              <div className="space-y-[2px] relative pb-5">
                <Label className="text-[11px] font-bold text-slate-500 uppercase tracking-tighter">Mã định danh (Code) *</Label>
                <Input {...register("code")} placeholder="Ví dụ: UNIT_TYPE..." className="h-[32px] text-[13px] border-[#ccc] rounded-[3px] font-mono shadow-none" />
                {errors.code && <p className="absolute bottom-0 text-[11px] text-red-500 font-bold">{errors.code.message}</p>}
              </div>

              {/* Ghi chú / Mô tả - pb-5 để cách ô input và lỗi */}
              <div className="md:col-span-2 space-y-[2px] relative pb-5">
                <Label className="text-[11px] font-bold text-slate-500 uppercase tracking-tighter">Ghi chú / Mô tả *</Label>
                <Input
                  {...register("description")}
                  placeholder="Nhập mục đích sử dụng của thuộc tính này..."
                  className="h-[32px] text-[13px] border-[#ccc] rounded-[3px] shadow-none"
                />
                {errors.description && <p className="absolute bottom-0 text-[11px] text-red-500 font-bold">{errors.description.message}</p>}
              </div>
            </div>
          </div>

          {/* 2. Danh sách giá trị */}
          <div className="bg-white border border-[#dcdcdc] p-[15px_20px] rounded-[4px] shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 text-slate-700 font-black text-[11px] uppercase tracking-wider">
                <Settings2 size={16} className="text-emerald-600" /> 2. Danh sách các giá trị hợp lệ
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-2 max-w-md">
                <Input
                  placeholder="Nhập giá trị mới..."
                  className="h-[32px] text-[13px] border-[#ccc] rounded-[3px] shadow-none"
                  value={newValueInput}
                  onChange={(e) => setNewValueInput(e.target.value)}
                  onKeyDown={(e) => {
                    if(e.key === 'Enter') { e.preventDefault(); addValue(); }
                  }}
                />
                <Button type="button" onClick={addValue} className="h-[32px] bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 rounded-[3px]">
                  <Plus size={16} className="mr-1" /> THÊM
                </Button>
              </div>

              {/* Khung giá trị - pb-6 để lỗi không đè lên content */}
              <div className={cn("flex flex-wrap gap-2 p-4 bg-slate-50 border rounded-[4px] min-h-[100px] relative pb-6", errors.values ? "border-red-200" : "border-slate-100")}>
                {values.map((val) => (
                  <div key={val} className="flex items-center bg-white border border-slate-200 rounded px-3 py-1 shadow-sm group hover:border-emerald-500 transition-all">
                    <span className="text-[13px] font-bold text-slate-700 mr-3">{val}</span>
                    <button type="button" onClick={() => removeValue(val)} className="text-slate-300 hover:text-rose-500">
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
                {errors.values && <p className="absolute bottom-1 left-4 text-[11px] text-red-500 font-bold uppercase">{errors.values.message}</p>}
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar (Phần này giữ nguyên vì không có lỗi input trực tiếp) */}
        <div className="lg:col-span-4 space-y-3">
          <div className="bg-white border border-[#dcdcdc] p-[15px_20px] rounded-[4px] shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
            <div className="flex items-center gap-2 mb-4 text-slate-700 font-black text-[11px] uppercase tracking-wider">
              <Layers size={16} className="text-emerald-600" /> Cài đặt hiển thị
            </div>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-[11px] font-bold text-slate-500 uppercase">Trạng thái sử dụng</Label>
                <Controller
                  name="status"
                  control={control}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger className="h-[32px] text-[13px] border-[#ccc] rounded-[3px] font-black text-emerald-600 shadow-none">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">ĐANG SỬ DỤNG</SelectItem>
                        <SelectItem value="inactive">TẠM NGỪNG</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="fixed bottom-0 left-0 lg:left-[260px] right-0 bg-[#f8f9fa] border-t border-[#ddd] p-[8px_20px] flex items-center justify-end gap-[10px] z-[999]">
        <Button type="button" variant="outline" className="min-w-[100px] h-[34px] text-[12px] font-bold border-[#ccc] bg-white rounded-[3px] shadow-sm" onClick={() => router.back()}>
          HỦY BỎ
        </Button>
        <Button
          type="submit"
          className="min-w-[120px] h-[34px] text-[12px] font-black bg-emerald-600 hover:bg-emerald-700 text-white rounded-[3px] shadow-md shadow-emerald-100"
        >
          <Save size={16} className="mr-2" />
          LƯU DỮ LIỆU
        </Button>
      </div>
    </form>
  );
}