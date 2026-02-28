"use client";

import React, { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { AdminPageHeader } from "@/components/admin/shared/AdminPageHeader";
import { AdminSearchFilter } from "@/components/admin/shared/AdminSearchFilter";
import {
  getAttributes,
  deleteAttribute,
  createAttribute,
  updateAttribute
} from "@/app/services/AttributeService";
import { toast } from "sonner";
import { AlertCircle, Edit, Trash2, Tag, Save, Loader2, X, Settings2 } from "lucide-react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

// --- HÀM TIỆN ÍCH CHUYỂN ĐỔI TÊN THÀNH MÃ ---
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

export interface Attribute {
  id: number;
  name: string;
  code: string;
  status: string;
  values: string[];
}

export default function AttributeManagementPage() {
  const [attributes, setAttributes] = useState<Attribute[]>([]);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  // State Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [newValueInput, setNewValueInput] = useState("");

  const { register, handleSubmit, control, reset, setValue, watch, formState: { errors } } = useForm({
    defaultValues: {
      name: "",
      code: "",
      status: "ACTIVE",
      values: [] as string[],
    },
  });

  const nameValue = watch("name");
  const values = watch("values") || [];

  // Tự động sinh mã Code khi tạo mới
  useEffect(() => {
    if (!editingId && nameValue) {
      setValue("code", generateCodeFromName(nameValue), { shouldValidate: true });
    }
  }, [nameValue, editingId, setValue]);

  const loadData = async () => {
    try {
      const data = await getAttributes();
      setAttributes(data || []);
    } catch (error) {
      toast.error("Không thể tải danh sách thuộc tính");
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openAddModal = () => {
    setEditingId(null);
    setNewValueInput("");
    reset({ name: "", code: "", status: "ACTIVE", values: [] });
    setIsModalOpen(true);
  };

  const openEditModal = (attr: Attribute) => {
    setEditingId(attr.id);
    setNewValueInput("");
    reset({
      name: attr.name,
      code: attr.code,
      status: attr.status || "ACTIVE",
      values: attr.values || [],
    });
    setIsModalOpen(true);
  };

  const addValue = () => {
    const val = newValueInput.trim();
    if (!val) return;
    if (values.includes(val)) {
      toast.error("Giá trị này đã tồn tại trong danh sách!");
      return;
    }
    setValue("values", [...values, val], { shouldValidate: true });
    setNewValueInput("");
  };

  const removeValue = (valToRemove: string) => {
    setValue("values", values.filter((v) => v !== valToRemove), { shouldValidate: true });
  };

  const onSubmit = async (data: any) => {
    try {
      setIsSaving(true);
      const payload = {
        name: data.name,
        code: data.code,
        status: data.status,
        values: data.values,
      };

      if (editingId) {
        await updateAttribute(editingId, payload);
        toast.success("Cập nhật thuộc tính thành công!");
      } else {
        await createAttribute(payload);
        toast.success("Thêm mới thuộc tính thành công!");
      }

      setIsModalOpen(false);
      loadData();
    } catch (error: any) {
      // Hiển thị chính xác thông báo lỗi trùng lặp từ Backend
      toast.error(error.response?.data?.message || "Có lỗi xảy ra, có thể mã Code đã tồn tại!");
    } finally {
      setIsSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteAttribute(deleteId);
      toast.success("Đã xóa thuộc tính thành công!");
      loadData();
    } catch (error: any) {
      // Hiển thị chính xác thông báo lỗi ràng buộc sản phẩm từ Backend
      toast.error(error.response?.data?.message || "Không thể xóa thuộc tính đang được sử dụng!");
    } finally {
      setDeleteId(null);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-xl font-bold text-slate-800">Quản lý Thuộc tính Sản phẩm</h1>
        <Button onClick={openAddModal} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-9">
          + Thêm thuộc tính
        </Button>
      </div>

      <div className="bg-white border border-[#dcdcdc] rounded-[4px] shadow-[0_1px_2px_rgba(0,0,0,0.05)] overflow-hidden mb-8">
        <AdminSearchFilter placeholder="Tìm tên mã thuộc tính..." onRefresh={loadData} />

        <div className="w-full overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-xs uppercase text-slate-500 font-bold">
                <th className="p-3 w-[80px] text-center">ID</th>
                <th className="p-3">Tên Thuộc Tính</th>
                <th className="p-3">Mã Code</th>
                <th className="p-3">Các giá trị</th>
                <th className="p-3">Trạng thái</th>
                <th className="p-3 text-right">Hành động</th>
              </tr>
            </thead>
            <tbody>
              {attributes.length > 0 ? (
                attributes.map((attr) => (
                  <tr key={attr.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="p-3 text-sm text-slate-500 text-center font-bold font-mono">#{attr.id}</td>
                    <td className="p-3 text-sm text-slate-800 font-bold flex items-center gap-2">
                      <Tag size={16} className="text-emerald-600" /> {attr.name}
                    </td>
                    <td className="p-3 text-sm text-slate-600 font-mono">{attr.code}</td>
                    <td className="p-3 text-sm text-slate-500 max-w-[250px] truncate">
                      {attr.values?.join(", ") || "—"}
                    </td>
                    <td className="p-3">
                      <span className={cn(
                        "text-[10px] font-bold px-2 py-1 rounded border uppercase tracking-wide",
                        attr.status === "ACTIVE" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-amber-50 text-amber-600 border-amber-200"
                      )}>
                        {attr.status === "ACTIVE" ? "Hiển thị" : "Đang ẩn"}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-600 hover:bg-blue-50" onClick={() => openEditModal(attr)}>
                          <Edit size={15} />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-red-600 hover:bg-red-50" onClick={() => setDeleteId(attr.id)}>
                          <Trash2 size={15} />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan={6} className="p-8 text-center text-slate-400 italic">Chưa có dữ liệu.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* DIALOG THÊM / SỬA */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[550px] bg-white p-0 overflow-hidden">
          <DialogHeader className="p-5 border-b bg-slate-50">
            <DialogTitle className="text-lg font-black uppercase text-slate-800 flex items-center gap-2">
              <Settings2 size={20} className="text-emerald-600"/>
              {editingId ? "Cập nhật Thuộc Tính" : "Thêm Thuộc Tính Mới"}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit(onSubmit)} className="p-5 space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-500 uppercase">Tên thuộc tính *</Label>
                <Input {...register("name", { required: "Vui lòng nhập tên" })} placeholder="VD: Khối lượng, Màu sắc..." className="h-9 text-sm" />
                {errors.name && <p className="text-xs text-red-500 font-bold">{errors.name.message as string}</p>}
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-500 uppercase">Mã Code *</Label>
                <Input {...register("code", { required: "Vui lòng nhập mã" })} readOnly={!!editingId} className={cn("h-9 text-sm font-mono uppercase", editingId && "bg-slate-50 opacity-70")} />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-bold text-slate-500 uppercase">Danh sách giá trị hợp lệ</Label>
              <div className="flex items-center gap-2">
                <Input
                  placeholder="Nhập giá trị mới (VD: 500g) rồi nhấn Enter..."
                  className="h-9 text-sm"
                  value={newValueInput}
                  onChange={(e) => setNewValueInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addValue();
                    }
                  }}
                />
                <Button type="button" onClick={addValue} className="h-9 bg-slate-800 text-white font-bold px-4">THÊM</Button>
              </div>

              <div className="flex flex-wrap gap-2 p-3 bg-slate-50 border border-slate-200 rounded min-h-[80px]">
                {values.map((val) => (
                  <div key={val} className="flex items-center bg-white border border-slate-200 rounded px-2.5 py-1 shadow-sm">
                    <span className="text-sm font-bold text-slate-700 mr-2">{val}</span>
                    <button type="button" onClick={() => removeValue(val)} className="text-slate-400 hover:text-red-500 transition-colors">
                      <X size={14} />
                    </button>
                  </div>
                ))}
                {values.length === 0 && <span className="text-slate-400 text-xs font-bold m-auto italic">Chưa có giá trị nào</span>}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-500 uppercase">Trạng thái sử dụng</Label>
              <Controller
                name="status"
                control={control}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger className="h-9 font-black text-emerald-600"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ACTIVE">ĐANG SỬ DỤNG</SelectItem>
                      <SelectItem value="INACTIVE">TẠM NGỪNG</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            <DialogFooter className="pt-4 mt-2 border-t">
              <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)} className="h-9 text-xs font-bold">Hủy bỏ</Button>
              <Button type="submit" disabled={isSaving} className="h-9 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white min-w-[120px]">
                {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save size={16} className="mr-2" />}
                LƯU DỮ LIỆU
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* MODAL XÓA */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-red-600 flex items-center gap-2"><AlertCircle size={20} /> Cảnh báo xóa dữ liệu</AlertDialogTitle>
            <AlertDialogDescription>Bạn có chắc chắn muốn xóa thuộc tính này không? Các sản phẩm đang sử dụng thuộc tính này sẽ bị ảnh hưởng.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="h-9 text-xs font-bold">Hủy bỏ</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700 text-white h-9 text-xs font-bold">Đồng ý Xóa</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}