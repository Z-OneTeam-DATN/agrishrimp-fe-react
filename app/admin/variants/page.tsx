"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useForm, Controller } from "react-hook-form";
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
import { Switch } from "@/components/ui/switch";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

import { usePermissions } from "@/hooks/usePermissions";
import { P } from "@/lib/permissions";
import { useRouter } from "next/navigation";

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

const VALUE_SOFT_LIMIT = 20;

const normalizeValueForCompare = (value: string) =>
  value.trim().replace(/\s+/g, " ").toLocaleLowerCase("vi");

const normalizeSortValue = (val: string) => {
  if (val === "fullName,asc") return "name,asc";
  if (val === "fullName,desc") return "name,desc";
  return val;
};

export default function AttributeManagementPage() {
  const { hasPermission, isLoadingAuth } = usePermissions();
  const router = useRouter();
  
  const [attributes, setAttributes] = useState<Attribute[]>([]);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  // 0. Kiểm tra quyền truy cập
  useEffect(() => {
    if (!isLoadingAuth && !hasPermission(P.ATTRIBUTE_VIEW)) {
      router.push("/admin/forbidden");
    }
  }, [isLoadingAuth, hasPermission, router]);

  // State Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [newValueInput, setNewValueInput] = useState("");
  const [valueInputError, setValueInputError] = useState("");
  const [autoSortValues, setAutoSortValues] = useState(true);

  const [currentKeyword, setCurrentKeyword] = useState("");
  const [currentStatusFilter, setCurrentStatusFilter] = useState("all");
  const [currentCountFilter, setCurrentCountFilter] = useState("all");
  const [currentSort, setCurrentSort] = useState("id,desc");

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
  const statusValue = watch("status");
  const valuesCount = values.length;

  // Tự động sinh mã Code khi tạo mới
  useEffect(() => {
    if (!editingId && nameValue) {
      setValue("code", generateCodeFromName(nameValue), { shouldValidate: true });
    }
  }, [nameValue, editingId, setValue]);

  const loadData = async () => {
    if (!hasPermission(P.ATTRIBUTE_VIEW)) return;
    try {
      const data = await getAttributes();
      setAttributes(data || []);
    } catch (error) {
      toast.error("Không thể tải danh sách thuộc tính");
    }
  };

  useEffect(() => {
    if (!isLoadingAuth) loadData();
  }, [isLoadingAuth]);

  const openAddModal = () => {
    setEditingId(null);
    setNewValueInput("");
    setValueInputError("");
    setAutoSortValues(true);
    reset({ name: "", code: "", status: "ACTIVE", values: [] });
    setIsModalOpen(true);
  };

  const openEditModal = (attr: Attribute) => {
    setEditingId(attr.id);
    setNewValueInput("");
    setValueInputError("");
    setAutoSortValues(true);
    reset({
      name: attr.name,
      code: attr.code,
      status: attr.status || "ACTIVE",
      values: attr.values || [],
    });
    setIsModalOpen(true);
  };

  useEffect(() => {
    const nextVal = newValueInput.trim();
    if (!nextVal) {
      setValueInputError("");
      return;
    }

    const isDuplicate = values.some((item) => normalizeValueForCompare(item) === normalizeValueForCompare(nextVal));
    if (isDuplicate) {
      setValueInputError("Giá trị này đã tồn tại (không phân biệt hoa thường).");
      return;
    }

    setValueInputError("");
  }, [newValueInput, values]);

  const addValue = () => {
    const val = newValueInput.trim();
    if (!val) return;

    if (valueInputError) {
      toast.error(valueInputError);
      return;
    }

    setValue("values", [...values, val], { shouldValidate: true });
    setNewValueInput("");
    setValueInputError("");
  };

  const removeValue = (valToRemove: string) => {
    setValue("values", values.filter((v) => v !== valToRemove), { shouldValidate: true });
  };

  const onSubmit = async (data: any) => {
    try {
      setIsSaving(true);

      const cleanedValues = (data.values || [])
        .map((item: string) => item.trim())
        .filter((item: string) => item.length > 0);

      const finalValues = autoSortValues
        ? [...cleanedValues].sort((a: string, b: string) => a.localeCompare(b, "vi", { sensitivity: "base" }))
        : cleanedValues;

      const payload = {
        name: data.name,
        code: data.code,
        status: data.status,
        values: finalValues,
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
      const errorMsg = error.response?.data?.message;
      toast.error(errorMsg || "Không thể lưu thuộc tính.");
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

  const canAction = hasPermission(P.ATTRIBUTE_UPDATE) || hasPermission(P.ATTRIBUTE_DELETE);

  const displayedAttributes = useMemo(() => {
    const keyword = currentKeyword.trim().toLocaleLowerCase("vi");

    const filtered = attributes.filter((attr) => {
      const valuesLength = attr.values?.length || 0;
      const valuesText = attr.values?.join(" ").toLocaleLowerCase("vi") || "";

      const matchKeyword =
        !keyword ||
        attr.name.toLocaleLowerCase("vi").includes(keyword) ||
        attr.code.toLocaleLowerCase("vi").includes(keyword) ||
        valuesText.includes(keyword);

      const matchStatus = currentStatusFilter === "all" || attr.status === currentStatusFilter;
      const matchCount =
        currentCountFilter === "all" ||
        (currentCountFilter === "few" && valuesLength <= 5) ||
        (currentCountFilter === "many" && valuesLength > 5);

      return matchKeyword && matchStatus && matchCount;
    });

    const sortValue = normalizeSortValue(currentSort);
    filtered.sort((a, b) => {
      switch (sortValue) {
        case "id,asc":
          return a.id - b.id;
        case "name,asc":
          return a.name.localeCompare(b.name, "vi", { sensitivity: "base" });
        case "name,desc":
          return b.name.localeCompare(a.name, "vi", { sensitivity: "base" });
        case "id,desc":
        default:
          return b.id - a.id;
      }
    });

    return filtered;
  }, [attributes, currentCountFilter, currentKeyword, currentSort, currentStatusFilter]);

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-start mb-5">
        <div>
          <h1 className="text-2xl font-black text-slate-800 uppercase tracking-tight">QUẢN LÝ THUỘC TÍNH SẢN PHẨM</h1>
          <p className="mt-1 text-sm text-slate-500">Quản trị bộ thuộc tính và các giá trị để chuẩn hóa biến thể sản phẩm.</p>
        </div>
        {hasPermission(P.ATTRIBUTE_CREATE) && (
          <Button onClick={openAddModal} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-9">
            + Thêm thuộc tính
          </Button>
        )}
      </div>

      <div className="bg-white border border-[#dcdcdc] rounded-[4px] shadow-[0_1px_2px_rgba(0,0,0,0.05)] overflow-hidden mb-8">
        <AdminSearchFilter
          placeholder="Tìm tên mã thuộc tính..."
          onSearch={setCurrentKeyword}
          onFilter1Change={setCurrentCountFilter}
          onFilter2Change={setCurrentStatusFilter}
          onSortChange={(val) => setCurrentSort(normalizeSortValue(val))}
          filter1Placeholder="Số lượng giá trị"
          filter1Options={[
            { label: "Tất cả", value: "all" },
            { label: "Ít (<= 5 giá trị)", value: "few" },
            { label: "Nhiều (> 5 giá trị)", value: "many" },
          ]}
          filter2Placeholder="Tất cả trạng thái"
          filter2Options={[
            { label: "Tất cả trạng thái", value: "all" },
            { label: "Hiển thị", value: "ACTIVE" },
            { label: "Đang ẩn", value: "INACTIVE" },
          ]}
          sortOptions={[
            { label: "Mới nhất", value: "id,desc" },
            { label: "Cũ nhất", value: "id,asc" },
            { label: "Tên A-Z", value: "name,asc" },
            { label: "Tên Z-A", value: "name,desc" },
          ]}
          defaultFilter1Value="all"
          defaultFilter2Value="all"
          defaultSortValue="id,desc"
          onRefresh={loadData}
        />

        <TooltipProvider delayDuration={150}>
        <div className="w-full max-h-[68vh] overflow-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-xs uppercase text-slate-500 font-bold">
                <th className="p-3 w-[80px] text-center sticky top-0 z-20 bg-slate-50">ID</th>
                <th className="p-3 sticky top-0 z-20 bg-slate-50">Tên Thuộc Tính</th>
                <th className="p-3 sticky top-0 z-20 bg-slate-50">Mã Code</th>
                <th className="p-3 sticky top-0 z-20 bg-slate-50">Các giá trị</th>
                <th className="p-3 sticky top-0 z-20 bg-slate-50">Trạng thái</th>
                {canAction && <th className="p-3 text-right sticky top-0 z-20 bg-slate-50">Hành động</th>}
              </tr>
            </thead>
            <tbody>
              {displayedAttributes.length > 0 ? (
                displayedAttributes.map((attr) => (
                  <tr key={attr.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="p-3 text-sm text-slate-500 text-center font-bold font-mono">#{attr.id}</td>
                    <td className="p-3 text-sm text-slate-800 font-bold flex items-center gap-2">
                      <Tag size={16} className="text-emerald-600" /> {attr.name}
                    </td>
                    <td className="p-3 text-sm text-slate-600 font-mono">{attr.code}</td>
                    <td className="p-3 text-sm text-slate-500 max-w-[250px]">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="block truncate cursor-help">{attr.values?.join(", ") || "—"}</span>
                        </TooltipTrigger>
                        {(attr.values?.join(", ")?.length || 0) > 42 && (
                          <TooltipContent side="top" className="max-w-[420px] break-words text-xs">
                            {attr.values?.join(", ")}
                          </TooltipContent>
                        )}
                      </Tooltip>
                    </td>
                    <td className="p-3">
                      <span className={cn(
                        "text-[10px] font-bold px-2 py-1 rounded border uppercase tracking-wide",
                        attr.status === "ACTIVE" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-amber-50 text-amber-600 border-amber-200"
                      )}>
                        {attr.status === "ACTIVE" ? "Hiển thị" : "Đang ẩn"}
                      </span>
                    </td>
                    {canAction && (
                      <td className="p-3 text-right">
                        <div className="flex justify-end gap-2">
                          {hasPermission(P.ATTRIBUTE_UPDATE) && (
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-600 hover:bg-blue-50" onClick={() => openEditModal(attr)}>
                              <Edit size={15} />
                            </Button>
                          )}
                          {hasPermission(P.ATTRIBUTE_DELETE) && (
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-red-600 hover:bg-red-50" onClick={() => setDeleteId(attr.id)}>
                              <Trash2 size={15} />
                            </Button>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                ))
              ) : (
                <tr><td colSpan={canAction ? 6 : 5} className="p-8 text-center text-slate-400 italic">Chưa có dữ liệu.</td></tr>
              )}
            </tbody>
          </table>
        </div>
        </TooltipProvider>
      </div>

      {/* DIALOG THÊM / SỬA */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="w-[95vw] max-w-[680px] max-h-[92vh] bg-white p-0 overflow-hidden flex flex-col data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0 data-[state=open]:slide-in-from-bottom-3 data-[state=closed]:slide-out-to-bottom-3 duration-200">
          <DialogHeader className="px-5 py-4 sm:px-6 sm:py-5 border-b bg-slate-50">
            <DialogTitle className="text-lg font-black uppercase text-slate-800 flex items-center gap-2">
              <Settings2 size={20} className="text-emerald-600"/>
              {editingId ? "Cập nhật Thuộc Tính" : "Thêm Thuộc Tính Mới"}
            </DialogTitle>
            <p className="text-sm text-slate-500 font-medium mt-1">Thiết lập thông tin thuộc tính và danh sách giá trị dùng cho biến thể sản phẩm.</p>
          </DialogHeader>

          <form onSubmit={handleSubmit(onSubmit)} className="flex-1 min-h-0 overflow-y-auto px-5 py-5 sm:px-6 sm:py-6 space-y-5">
            <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-4 sm:p-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-slate-500 uppercase">Tên thuộc tính *</Label>
                  <Input {...register("name", { required: "Vui lòng nhập tên" })} placeholder="VD: Khối lượng, Màu sắc..." className="h-11 text-sm bg-white" />
                  {errors.name && <p className="text-xs text-red-500 font-bold">{errors.name.message as string}</p>}
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-bold text-slate-500 uppercase">Mã Code *</Label>
                  <Input {...register("code", { required: "Vui lòng nhập mã" })} readOnly={!!editingId} className={cn("h-11 text-sm font-mono uppercase bg-white", editingId && "bg-slate-100 text-slate-500")} />
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-4 sm:p-5 space-y-3">
              <Label className="text-xs font-bold text-slate-500 uppercase">Danh sách giá trị hợp lệ</Label>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                <Input
                  placeholder="Nhập giá trị mới (VD: 500g) rồi nhấn Enter..."
                  className="h-11 text-sm bg-white"
                  value={newValueInput}
                  onChange={(e) => setNewValueInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addValue();
                    }
                  }}
                />
                <Button type="button" onClick={addValue} className="h-11 bg-slate-800 hover:bg-slate-900 text-white font-bold px-5 shrink-0">THÊM</Button>
              </div>
              {valueInputError && <p className="text-xs text-red-500 font-bold">{valueInputError}</p>}

              <div className="flex flex-wrap gap-2 p-3 bg-white border border-slate-200 rounded-lg min-h-[92px]">
                {values.map((val) => (
                  <div key={val} className="flex items-center bg-slate-50 border border-slate-200 rounded-full px-3 py-1 shadow-sm">
                    <span className="text-sm font-bold text-slate-700 mr-2">{val}</span>
                    <button type="button" onClick={() => removeValue(val)} className="text-slate-400 hover:text-red-500 transition-colors" title="Xóa giá trị">
                      <X size={14} />
                    </button>
                  </div>
                ))}
                {values.length === 0 && <span className="text-slate-400 text-xs font-bold m-auto italic">Chưa có giá trị nào</span>}
              </div>
              <div className="flex items-center justify-between text-[11px] font-semibold">
                <span className="text-slate-400">Mẹo: nhấn Enter để thêm nhanh từng giá trị.</span>
                <span className={cn(valuesCount > VALUE_SOFT_LIMIT ? "text-amber-600" : "text-slate-500")}>{valuesCount}/{VALUE_SOFT_LIMIT} giá trị khuyến nghị</span>
              </div>
              {valuesCount > VALUE_SOFT_LIMIT && (
                <p className="text-[11px] font-bold text-amber-600">Đã vượt giới hạn mềm {VALUE_SOFT_LIMIT} giá trị. Nên tách bớt để dễ quản lý.</p>
              )}
              <div className="rounded-lg border border-slate-200 bg-white px-3 py-2.5 flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-bold text-slate-700">Tự động sắp xếp A-Z khi lưu</p>
                  <p className="text-[11px] text-slate-400">Giúp dữ liệu đầu ra nhất quán và dễ so sánh.</p>
                </div>
                <Switch checked={autoSortValues} onCheckedChange={setAutoSortValues} />
              </div>
            </div>

            <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-4 sm:p-5 space-y-3">
              <Label className="text-xs font-bold text-slate-500 uppercase">Trạng thái sử dụng</Label>
              <Controller
                name="status"
                control={control}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger className={cn("h-11 font-black bg-white", field.value === "ACTIVE" ? "text-emerald-600" : "text-amber-600")}><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ACTIVE">ĐANG SỬ DỤNG</SelectItem>
                      <SelectItem value="INACTIVE">TẠM NGỪNG</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
              <span className={cn("inline-flex items-center rounded-full border px-3 py-1 text-xs font-black uppercase tracking-wide", statusValue === "ACTIVE" ? "bg-emerald-50 border-emerald-200 text-emerald-700" : "bg-amber-50 border-amber-200 text-amber-700")}>
                <span className={cn("mr-2 h-1.5 w-1.5 rounded-full", statusValue === "ACTIVE" ? "bg-emerald-500" : "bg-amber-500")} />
                {statusValue === "ACTIVE" ? "Đang sử dụng" : "Tạm ngừng"}
              </span>
            </div>

            <DialogFooter className="sticky bottom-0 bg-white pt-4 pb-1 mt-2 border-t flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2.5 sm:gap-3">
              <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)} className="h-11 w-full sm:w-auto text-xs font-bold uppercase tracking-wide">Hủy bỏ</Button>
              <Button type="submit" disabled={isSaving} className="h-11 w-full sm:w-auto text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white min-w-[140px] uppercase tracking-wide">
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