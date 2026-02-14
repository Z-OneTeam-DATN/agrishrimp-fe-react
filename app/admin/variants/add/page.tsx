"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createAttribute, getAttributeById, updateAttribute } from "@/app/services/AttributeService";
import {
  X, Settings, ChevronLeft, Tag, Save, Loader2, Settings2
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

// --- HÀM TIỆN ÍCH CHUYỂN ĐỔI ---
const generateCodeFromName = (name: string) => {
  if (!name) return "";
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d").replace(/Đ/g, "D")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "_")
    .replace(/[^A-Z0-9_]/g, "");
};

export default function AddVariantPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [newValueInput, setNewValueInput] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const idFromUrl = searchParams.get("id");
  const isEditMode = Boolean(idFromUrl);

  const { register, handleSubmit, control, setValue, watch, reset, formState: { errors } } = useForm<AdminAttributeForm>({
    resolver: zodResolver(AdminAttributeSchema),
    mode: "onTouched",
    defaultValues: {
      name: "",
      code: "",
      description: "",
      status: "ACTIVE",
      values: []
    }
  });

  // --- THEO DÕI TÊN ĐỂ SINH MÃ ---
  const nameValue = watch("name");

  useEffect(() => {
    // Chỉ tự động điền khi KHÔNG PHẢI chế độ sửa (để tránh sửa nhầm mã cũ)
    if (!isEditMode && nameValue) {
      const autoCode = generateCodeFromName(nameValue);
      setValue("code", autoCode, { shouldValidate: true });
    }
  }, [nameValue, isEditMode, setValue]);
  // ------------------------------

  // Load dữ liệu cũ khi Edit
  useEffect(() => {
    if (isEditMode && idFromUrl) {
      const fetchDetail = async () => {
        try {
          const data = await getAttributeById(Number(idFromUrl));
          reset({
            name: data.name,
            code: data.code,
            description: data.description || "",
            status: data.status,
            values: data.values || []
          });
        } catch (error) {
          toast.error("Không tìm thấy thuộc tính yêu cầu!");
          router.push("/admin/variants");
        }
      };
      fetchDetail();
    }
  }, [isEditMode, idFromUrl, reset, router]);

  const values = watch("values") || [];

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

  const onSave = async (data: AdminAttributeForm) => {
    try {
      setIsSubmitting(true);
      if (isEditMode) {
        await updateAttribute(Number(idFromUrl), data);
        toast.success("Cập nhật thành công!");
      } else {
        await createAttribute(data);
        toast.success("Thêm mới thành công!");
      }
      router.push("/admin/variants");
    } catch (error) {
      toast.error("Mã định danh (Code) đã tồn tại hoặc lỗi server!");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSave)} className="space-y-3 pb-[100px]">
      <div className="flex items-center gap-4 mb-4 px-1">
        <Button type="button" variant="ghost" size="icon" onClick={() => router.back()} className="h-8 w-8 text-slate-400">
          <ChevronLeft size={20} />
        </Button>
        <h1 className="text-[18px] font-black text-[#1f1f1f] uppercase tracking-tight">
          {isEditMode ? "Chỉnh sửa thuộc tính" : "Thêm thuộc tính mới"}
        </h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <div className="lg:col-span-8 space-y-3">
          <div className="bg-white border border-[#dcdcdc] p-[15px_20px] rounded-[4px] shadow-sm">
            <div className="flex items-center gap-2 mb-4 text-emerald-700 font-black text-[11px] uppercase tracking-wider">
              <Tag size={16} /> 1. Thông tin định danh
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
              <div className="space-y-[2px] relative pb-5">
                <Label className="text-[11px] font-bold text-slate-500 uppercase">Tên thuộc tính *</Label>
                <Input
                  {...register("name")}
                  placeholder="Ví dụ: Đơn vị tính..."
                  className="h-[32px] text-[13px] border-[#ccc]"
                />
                {errors.name && <p className="absolute bottom-0 text-[11px] text-red-500 font-bold">{errors.name.message}</p>}
              </div>

              <div className="space-y-[2px] relative pb-5">
                <Label className="text-[11px] font-bold text-slate-500 uppercase">Mã định danh (Code) *</Label>
                <Input
                    {...register("code")}
                    // Nếu muốn người dùng vẫn sửa được sau khi tự động sinh thì bỏ readOnly, hoặc chỉ readOnly khi Edit
                    readOnly={isEditMode}
                    className={cn("h-[32px] text-[13px] border-[#ccc] font-mono", isEditMode && "bg-slate-50 opacity-70")}
                    placeholder="Tự động sinh: DON_VI_TINH..."
                />
                {errors.code && <p className="absolute bottom-0 text-[11px] text-red-500 font-bold">{errors.code.message}</p>}
              </div>

              <div className="md:col-span-2 space-y-[2px] relative pb-5">
                <Label className="text-[11px] font-bold text-slate-500 uppercase">Ghi chú / Mô tả *</Label>
                <Input {...register("description")} placeholder="Mục đích sử dụng..." className="h-[32px] text-[13px] border-[#ccc]" />
                {errors.description && <p className="absolute bottom-0 text-[11px] text-red-500 font-bold">{errors.description.message}</p>}
              </div>
            </div>
          </div>

          {/* ... Phần danh sách giá trị giữ nguyên ... */}
          <div className="bg-white border border-[#dcdcdc] p-[15px_20px] rounded-[4px] shadow-sm">
            <div className="flex items-center gap-2 mb-4 text-slate-700 font-black text-[11px] uppercase tracking-wider">
              <Settings2 size={16} className="text-emerald-600" /> 2. Danh sách giá trị hợp lệ
            </div>
            <div className="space-y-4">
              <div className="flex items-center gap-2 max-w-md">
                <Input
                    placeholder="Nhập giá trị mới..."
                    className="h-[32px] text-[13px]"
                    value={newValueInput}
                    onChange={(e) => setNewValueInput(e.target.value)}
                    onKeyDown={(e) => { if(e.key === 'Enter') { e.preventDefault(); addValue(); } }}
                />
                <Button type="button" onClick={addValue} className="h-[32px] bg-emerald-600 font-bold px-4 rounded-[3px]">THÊM</Button>
              </div>

              <div className={cn("flex flex-wrap gap-2 p-4 bg-slate-50 border rounded-[4px] min-h-[100px] relative pb-6", errors.values ? "border-red-200" : "border-slate-100")}>
                {values.map((val) => (
                  <div key={val} className="flex items-center bg-white border border-slate-200 rounded px-3 py-1 shadow-sm group">
                    <span className="text-[13px] font-bold text-slate-700 mr-3">{val}</span>
                    <button type="button" onClick={() => removeValue(val)} className="text-slate-300 hover:text-rose-500"><X size={14} /></button>
                  </div>
                ))}
                {values.length === 0 && <span className="text-slate-300 text-[11px] uppercase font-bold m-auto italic">Chưa có giá trị nào</span>}
                {errors.values && <p className="absolute bottom-1 left-4 text-[11px] text-red-500 font-bold uppercase">{errors.values.message}</p>}
              </div>
            </div>
          </div>
        </div>

        {/* ... Sidebar giữ nguyên ... */}
        <div className="lg:col-span-4 space-y-3">
          <div className="bg-white border border-[#dcdcdc] p-[15px_20px] rounded-[4px] shadow-sm">
            <Label className="text-[11px] font-bold text-slate-500 uppercase block mb-3">Trạng thái sử dụng</Label>
            <Controller name="status" control={control} render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value}>
                  <SelectTrigger className="h-[32px] text-[13px] font-black text-emerald-600 border-[#ccc]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ACTIVE">ĐANG SỬ DỤNG</SelectItem>
                    <SelectItem value="INACTIVE">TẠM NGỪNG</SelectItem>
                  </SelectContent>
                </Select>
            )} />
          </div>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 lg:left-[260px] right-0 bg-[#f8f9fa] border-t border-[#ddd] p-[8px_20px] flex items-center justify-end gap-[10px] z-[999]">
        <Button type="button" variant="outline" className="min-w-[100px] h-[34px] text-[12px] font-bold border-[#ccc]" onClick={() => router.back()}>HỦY BỎ</Button>
        <Button type="submit" disabled={isSubmitting} className="min-w-[120px] h-[34px] text-[12px] font-black bg-emerald-600 hover:bg-emerald-700 text-white transition-all">
          {isSubmitting ? <Loader2 className="animate-spin mr-2" size={16} /> : <Save size={16} className="mr-2" />}
          LƯU DỮ LIỆU
        </Button>
      </div>
    </form>
  );
}