"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import {
  getAttributes,
  deleteAttribute,
  createAttribute,
  updateAttribute,
} from "@/app/services/AttributeService";
import { toast } from "sonner";
import {
  AlertCircle,
  Edit,
  Trash2,
  Save,
  Loader2,
  X,
  Settings2,
  Plus,
  Search,
} from "lucide-react";

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
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
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
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
  valueDetails?: Array<{
    valueId: number;
    value: string;
    usedInVariant?: boolean;
  }>;
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
  const [lockedValues, setLockedValues] = useState<Record<string, boolean>>({});

  const [currentKeyword, setCurrentKeyword] = useState("");
  const [currentStatusFilter, setCurrentStatusFilter] = useState("all");
  const [currentCountFilter, setCurrentCountFilter] = useState("all");
  const [currentSort, setCurrentSort] = useState("id,desc");
  const [currentPage, setCurrentPage] = useState(0);
  const pageSize = 20;

  useEffect(() => {
    setCurrentPage(0);
  }, [currentKeyword, currentStatusFilter, currentCountFilter]);

  const {
    register,
    handleSubmit,
    control,
    reset,
    setValue,
    watch,
    setError,
    clearErrors,
    formState: { errors },
  } = useForm({
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
      setValue("code", generateCodeFromName(nameValue), {
        shouldValidate: true,
      });
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
    setLockedValues({});
    reset({ name: "", code: "", status: "ACTIVE", values: [] });
    setIsModalOpen(true);
  };

  const openEditModal = (attr: Attribute) => {
    setEditingId(attr.id);
    setNewValueInput("");
    setValueInputError("");
    setAutoSortValues(true);
    setLockedValues(
      Object.fromEntries(
        (attr.valueDetails || []).map((detail) => [
          detail.value,
          Boolean(detail.usedInVariant),
        ]),
      ),
    );
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

    const isDuplicate = values.some(
      (item) =>
        normalizeValueForCompare(item) === normalizeValueForCompare(nextVal),
    );
    if (isDuplicate) {
      setValueInputError(
        "Giá trị này đã tồn tại (không phân biệt hoa thường).",
      );
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
    clearErrors("values");
  };

  const removeValue = (valToRemove: string) => {
    if (lockedValues[valToRemove]) {
      toast.error(
        `Không thể xóa giá trị "${valToRemove}" vì đang được sử dụng bởi biến thể sản phẩm.`,
      );
      return;
    }

    setValue(
      "values",
      values.filter((v) => v !== valToRemove),
      { shouldValidate: true },
    );
    if (values.length - 1 > 0) {
      clearErrors("values");
    }
  };

  const onSubmit = async (data: any) => {
    try {
      setIsSaving(true);

      const cleanedValues = (data.values || [])
        .map((item: string) => item.trim())
        .filter((item: string) => item.length > 0);

      if (cleanedValues.length === 0) {
        setError("values", {
          type: "manual",
          message: "Thuộc tính phải có ít nhất 1 giá trị.",
        });
        toast.error("Thuộc tính phải có ít nhất 1 giá trị.");
        return;
      }

      clearErrors("values");

      const finalValues = autoSortValues
        ? [...cleanedValues].sort((a: string, b: string) =>
            a.localeCompare(b, "vi", { sensitivity: "base" }),
          )
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
      toast.error(
        error.response?.data?.message ||
          "Không thể xóa thuộc tính đang được sử dụng!",
      );
    } finally {
      setDeleteId(null);
    }
  };

  const canAction =
    hasPermission(P.ATTRIBUTE_UPDATE) || hasPermission(P.ATTRIBUTE_DELETE);

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

      const matchStatus =
        currentStatusFilter === "all" || attr.status === currentStatusFilter;
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
  }, [
    attributes,
    currentCountFilter,
    currentKeyword,
    currentSort,
    currentStatusFilter,
  ]);

  const paginatedAttributes = useMemo(() => {
    return displayedAttributes.slice(currentPage * pageSize, (currentPage + 1) * pageSize);
  }, [displayedAttributes, currentPage, pageSize]);

  return (
    <div className="space-y-3">
      <div className="mt-2 mb-8 space-y-4 px-1">
        <div>
          <h1 className="text-[20px] font-semibold tracking-tight uppercase text-slate-900">
            Quản lý thuộc tính sản phẩm
          </h1>
        </div>

        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex flex-col gap-2 lg:flex-row lg:items-center">
            <div className="relative w-full lg:w-[360px]">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300"
              />
              <Input
                value={currentKeyword}
                onChange={(event) => setCurrentKeyword(event.target.value)}
                placeholder="Tìm tên, mã, giá trị..."
                className="h-[38px] rounded-md border-slate-200 bg-white pl-10 text-[13px] shadow-none focus-visible:ring-blue-500/20"
              />
            </div>

            <Select
              value={currentCountFilter}
              onValueChange={setCurrentCountFilter}
            >
              <SelectTrigger className="h-[38px] w-full rounded-md border-slate-200 bg-white text-[13px] font-medium text-slate-600 shadow-none focus:ring-0 lg:w-[180px]">
                <SelectValue placeholder="Số lượng giá trị" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="text-[13px]">
                  Tất cả giá trị
                </SelectItem>
                <SelectItem value="few" className="text-[13px]">
                  Ít (&lt;= 5 giá trị)
                </SelectItem>
                <SelectItem value="many" className="text-[13px]">
                  Nhiều (&gt; 5 giá trị)
                </SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={currentStatusFilter}
              onValueChange={setCurrentStatusFilter}
            >
              <SelectTrigger className="h-[38px] w-full rounded-md border-slate-200 bg-white text-[13px] font-medium text-slate-600 shadow-none focus:ring-0 lg:w-[180px]">
                <SelectValue placeholder="Tất cả trạng thái" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="text-[13px]">
                  Tất cả trạng thái
                </SelectItem>
                <SelectItem value="ACTIVE" className="text-[13px]">
                  Hiển thị
                </SelectItem>
                <SelectItem value="INACTIVE" className="text-[13px]">
                  Đang ẩn
                </SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={currentSort}
              onValueChange={(value) =>
                setCurrentSort(normalizeSortValue(value))
              }
            >
              <SelectTrigger className="h-[38px] w-full rounded-md border-slate-200 bg-white text-[13px] font-medium text-slate-600 shadow-none focus:ring-0 lg:w-[150px]">
                <SelectValue placeholder="Sắp xếp" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="id,desc" className="text-[13px]">
                  Mới nhất
                </SelectItem>
                <SelectItem value="id,asc" className="text-[13px]">
                  Cũ nhất
                </SelectItem>
                <SelectItem value="name,asc" className="text-[13px]">
                  Tên A-Z
                </SelectItem>
                <SelectItem value="name,desc" className="text-[13px]">
                  Tên Z-A
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {hasPermission(P.ATTRIBUTE_CREATE) && (
            <Button
              onClick={() => router.push("/admin/variants/add")}
              className="h-[38px] rounded-[4px] bg-emerald-600 px-4 text-[13px] font-medium text-white shadow-sm hover:bg-emerald-700"
            >
              <Plus size={15} className="mr-1.5" />
              Thêm thuộc tính
            </Button>
          )}
        </div>
      </div>

      <div className="overflow-hidden rounded-[4px] border border-[#dcdcdc] bg-white shadow-sm">
        <TooltipProvider delayDuration={150}>
          <div className="overflow-x-auto custom-scrollbar">
            <table className="table-custom min-w-[920px] w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-[#ccc] bg-[#f0f0f0]">
                  <th className="w-[56px] px-4 py-3 text-[10px] font-semibold text-[#1f1f1f]">
                    STT
                  </th>
                  <th className="w-[200px] px-2 py-3 text-[10px] font-semibold text-[#1f1f1f]">
                    Tên thuộc tính
                  </th>
                  <th className="px-2 py-3 text-[10px] font-semibold text-[#1f1f1f]">
                    Các giá trị
                  </th>
                  <th className="w-[112px] px-2 py-3 text-center text-[10px] font-semibold text-[#1f1f1f]">
                    Trạng thái
                  </th>
                  {canAction && (
                    <th className="w-[112px] px-4 py-3 text-right text-[10px] font-semibold text-[#1f1f1f]">
                      Thao tác
                    </th>
                  )}
                </tr>
              </thead>
              <tbody>
                {paginatedAttributes.length > 0 ? (
                  paginatedAttributes.map((attr, index) => (
                    <tr
                      key={attr.id}
                      className="border-b border-[#eee] transition-colors hover:bg-[#f0f8ff]"
                    >
                      <td className="px-4 py-3 text-[11px] font-medium text-slate-500">
                        {currentPage * pageSize + index + 1}
                      </td>
                      <td className="px-2 py-3">
                        <span className="text-[11px] font-semibold text-slate-800">
                          {attr.name}
                        </span>
                      </td>
                      <td className="max-w-[360px] px-2 py-3 text-[11px] text-slate-500">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="block truncate cursor-help">
                              {attr.values?.join(", ") || "—"}
                            </span>
                          </TooltipTrigger>
                          {(attr.values?.join(", ")?.length || 0) > 42 && (
                            <TooltipContent
                              side="top"
                              className="max-w-[420px] break-words text-xs"
                            >
                              {attr.values?.join(", ")}
                            </TooltipContent>
                          )}
                        </Tooltip>
                      </td>
                      <td className="px-2 py-3 text-center">
                        <span className="text-[11px] font-medium text-slate-600">
                          {attr.status === "ACTIVE" ? "Hiển thị" : "Đang ẩn"}
                        </span>
                      </td>
                      {canAction && (
                        <td className="px-4 py-3 text-right">
                          <div className="flex justify-end gap-1">
                            {hasPermission(P.ATTRIBUTE_UPDATE) && (
                              <Button
                                variant="ghost"
                                size="icon"
                                title="Chỉnh sửa"
                                className="h-7 w-7 rounded-[4px] text-slate-400 hover:bg-blue-50 hover:text-blue-600"
                                onClick={() =>
                                  router.push(
                                    `/admin/variants/add?id=${attr.id}`,
                                  )
                                }
                              >
                                <Edit size={14} />
                              </Button>
                            )}
                            {hasPermission(P.ATTRIBUTE_DELETE) && (
                              <Button
                                variant="ghost"
                                size="icon"
                                title="Xóa"
                                className="h-7 w-7 rounded-[4px] text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                                onClick={() => setDeleteId(attr.id)}
                              >
                                <Trash2 size={14} />
                              </Button>
                            )}
                          </div>
                        </td>
                      )}
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={canAction ? 5 : 4}
                      className="h-[180px] text-center text-[12px] font-medium text-slate-400"
                    >
                      Chưa có dữ liệu.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </TooltipProvider>
        <div className="flex min-w-full shrink-0 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-t border-slate-100 bg-[#f8f9fa] px-5 py-3">
          <p className="text-[12px] font-semibold text-slate-500">
            Tổng số: {displayedAttributes.length} thuộc tính (Trang {currentPage + 1}/{Math.ceil(displayedAttributes.length / pageSize) || 1})
          </p>
          {Math.ceil(displayedAttributes.length / pageSize) > 1 && (
            <div className="flex items-center gap-1.5">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(currentPage - 1)}
                disabled={currentPage === 0}
                className="h-7 px-2 text-[11px] font-bold bg-white border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-50 transition-all"
              >
                Trước
              </Button>
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.ceil(displayedAttributes.length / pageSize) }).map((_, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(index)}
                    className={cn(
                      "h-7 min-w-[28px] px-2 p-0 text-[11px] font-bold shadow-sm transition-all",
                      currentPage === index
                        ? "bg-emerald-600 text-white border-emerald-600 hover:bg-emerald-700 hover:text-white"
                        : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                    )}
                  >
                    {index + 1}
                  </Button>
                ))}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(currentPage + 1)}
                disabled={currentPage >= Math.ceil(displayedAttributes.length / pageSize) - 1}
                className="h-7 px-2 text-[11px] font-bold bg-white border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-50 transition-all"
              >
                Sau
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* DIALOG THÊM / SỬA */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="w-[95vw] max-w-[680px] max-h-[92vh] bg-white p-0 overflow-hidden flex flex-col data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0 data-[state=open]:slide-in-from-bottom-3 data-[state=closed]:slide-out-to-bottom-3 duration-200">
          <DialogHeader className="px-5 py-4 sm:px-6 sm:py-5 border-b bg-slate-50">
            <DialogTitle className="text-lg font-black uppercase text-slate-800 flex items-center gap-2">
              <Settings2 size={20} className="text-emerald-600" />
              {editingId ? "Cập nhật Thuộc Tính" : "Thêm Thuộc Tính Mới"}
            </DialogTitle>
            <p className="text-sm text-slate-500 font-medium mt-1">
              Thiết lập thông tin thuộc tính và danh sách giá trị dùng cho biến
              thể sản phẩm.
            </p>
          </DialogHeader>

          <form
            onSubmit={handleSubmit(onSubmit)}
            className="flex-1 min-h-0 overflow-y-auto px-5 py-5 sm:px-6 sm:py-6 space-y-5"
          >
            <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-4 sm:p-5">
              <input type="hidden" {...register("code")} />
              <div className="space-y-2">
                <Label className="text-xs font-bold text-slate-500 uppercase">
                  Tên thuộc tính *
                </Label>
                <Input
                  {...register("name", { required: "Vui lòng nhập tên" })}
                  placeholder="VD: Khối lượng, Màu sắc..."
                  className="h-11 text-sm bg-white"
                />
                {errors.name && (
                  <p className="text-xs text-red-500 font-bold">
                    {errors.name.message as string}
                  </p>
                )}
              </div>
            </div>

            <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-4 sm:p-5 space-y-3">
              <Label className="text-xs font-bold text-slate-500 uppercase">
                Danh sách giá trị hợp lệ
              </Label>
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
                <Button
                  type="button"
                  onClick={addValue}
                  className="h-11 bg-slate-800 hover:bg-slate-900 text-white font-bold px-5 shrink-0"
                >
                  THÊM
                </Button>
              </div>
              {valueInputError && (
                <p className="text-xs text-red-500 font-bold">
                  {valueInputError}
                </p>
              )}

              <div className="flex flex-wrap gap-2 p-3 bg-white border border-slate-200 rounded-lg min-h-[92px]">
                {values.map((val) => (
                  <div
                    key={val}
                    className="flex items-center bg-slate-50 border border-slate-200 rounded-full px-3 py-1 shadow-sm"
                  >
                    <span className="text-sm font-bold text-slate-700 mr-2">
                      {val}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeValue(val)}
                      className={cn(
                        "transition-colors",
                        lockedValues[val]
                          ? "text-slate-300 cursor-not-allowed"
                          : "text-slate-400 hover:text-red-500",
                      )}
                      title={
                        lockedValues[val]
                          ? "Giá trị này đang được biến thể sử dụng, không thể xóa"
                          : "Xóa giá trị"
                      }
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
                {values.length === 0 && (
                  <span className="text-slate-400 text-xs font-bold m-auto italic">
                    Chưa có giá trị nào
                  </span>
                )}
              </div>
              {errors.values && (
                <p className="text-xs text-red-500 font-bold">
                  {errors.values.message as string}
                </p>
              )}
              <div className="flex items-center justify-between text-[11px] font-semibold">
                <span className="text-slate-400">
                  Mẹo: nhấn Enter để thêm nhanh từng giá trị.
                </span>
                <span
                  className={cn(
                    valuesCount > VALUE_SOFT_LIMIT
                      ? "text-amber-600"
                      : "text-slate-500",
                  )}
                >
                  {valuesCount}/{VALUE_SOFT_LIMIT} giá trị khuyến nghị
                </span>
              </div>
              {valuesCount > VALUE_SOFT_LIMIT && (
                <p className="text-[11px] font-bold text-amber-600">
                  Đã vượt giới hạn mềm {VALUE_SOFT_LIMIT} giá trị. Nên tách bớt
                  để dễ quản lý.
                </p>
              )}
              <div className="rounded-lg border border-slate-200 bg-white px-3 py-2.5 flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-bold text-slate-700">
                    Tự động sắp xếp A-Z khi lưu
                  </p>
                  <p className="text-[11px] text-slate-400">
                    Giúp dữ liệu đầu ra nhất quán và dễ so sánh.
                  </p>
                </div>
                <Switch
                  checked={autoSortValues}
                  onCheckedChange={setAutoSortValues}
                />
              </div>
            </div>

            <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-4 sm:p-5 space-y-3">
              <Label className="text-xs font-bold text-slate-500 uppercase">
                Trạng thái sử dụng
              </Label>
              <Controller
                name="status"
                control={control}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger
                      className={cn(
                        "h-11 font-black bg-white",
                        field.value === "ACTIVE"
                          ? "text-emerald-600"
                          : "text-amber-600",
                      )}
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ACTIVE">ĐANG SỬ DỤNG</SelectItem>
                      <SelectItem value="INACTIVE">TẠM NGỪNG</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
              <span
                className={cn(
                  "inline-flex items-center rounded-full border px-3 py-1 text-xs font-black uppercase tracking-wide",
                  statusValue === "ACTIVE"
                    ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                    : "bg-amber-50 border-amber-200 text-amber-700",
                )}
              >
                <span
                  className={cn(
                    "mr-2 h-1.5 w-1.5 rounded-full",
                    statusValue === "ACTIVE"
                      ? "bg-emerald-500"
                      : "bg-amber-500",
                  )}
                />
                {statusValue === "ACTIVE" ? "Đang sử dụng" : "Tạm ngừng"}
              </span>
            </div>

            <DialogFooter className="sticky bottom-0 bg-white pt-4 pb-1 mt-2 border-t flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2.5 sm:gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsModalOpen(false)}
                className="h-11 w-full sm:w-auto text-xs font-bold uppercase tracking-wide"
              >
                Hủy bỏ
              </Button>
              <Button
                type="submit"
                disabled={isSaving}
                className="h-11 w-full sm:w-auto text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white min-w-[140px] uppercase tracking-wide"
              >
                {isSaving ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Save size={16} className="mr-2" />
                )}
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
            <AlertDialogTitle className="text-red-600 flex items-center gap-2">
              <AlertCircle size={20} /> Cảnh báo xóa dữ liệu
            </AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc chắn muốn xóa thuộc tính này không? Các sản phẩm đang
              sử dụng thuộc tính này sẽ bị ảnh hưởng.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="h-9 text-xs font-bold">
              Hủy bỏ
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-red-600 hover:bg-red-700 text-white h-9 text-xs font-bold"
            >
              Đồng ý Xóa
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
