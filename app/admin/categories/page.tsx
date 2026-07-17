"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import {
  getCategories,
  deleteCategory,
  createCategory,
  updateCategory,
  toggleCategoryStatus,
  type CategoryPayload
} from "@/app/services/CategoryService";
import { toast } from "sonner";
import { Tag, ChevronDown, ChevronRight, Plus, Image as ImageIcon, Loader2, Save, Edit, Trash2, Eye, EyeOff, XCircle, Search } from "lucide-react";

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
import { TooltipProvider } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

import { usePermissions } from "@/hooks/usePermissions";
import { P } from "@/lib/permissions";
import { useRouter } from "next/navigation";

export interface Category {
  id: number;
  name: string;
  status: string;
  imageUrl?: string;
  parentId: number | null;
  productCount?: number;
  children?: Category[];
}

type CategoryApiError = {
  response?: {
    data?: {
      detail?: string;
      message?: string;
      statusCode?: string;
    } | string;
    status?: number;
  };
};

const CATEGORY_NAME_MIN = 2;
const CATEGORY_NAME_MAX = 100;

export default function CategoryManagementPage() {
  const { hasPermission, isLoadingAuth } = usePermissions();
  const router = useRouter();

  const [allCategories, setAllCategories] = useState<Category[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [expandedRows, setExpandedRows] = useState<Record<number, boolean>>({});
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [statusModal, setStatusModal] = useState<{id: number, name: string, currentStatus: string} | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editingId] = useState<number | null>(null);
  const [parentList, setParentList] = useState<Category[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [currentKeyword, setCurrentKeyword] = useState("");
  const [currentStatus, setCurrentStatus] = useState("all");
  const currentSort = "id,desc";
  const [currentPage, setCurrentPage] = useState(0);
  const pageSize = 20;

  useEffect(() => {
    setCurrentPage(0);
  }, [currentKeyword, currentStatus]);

  const [nameError, setNameError] = useState<string>("");
  const [nameTouched, setNameTouched] = useState(false);
  const [imageFileName, setImageFileName] = useState("");

  const [formData, setFormData] = useState({
    name: "", parentId: "none", status: "ACTIVE", imageUrl: ""
  });

  const isActiveStatus = (status: string) =>
    status === "ACTIVE" || status === "Hiển thị";

  const validateCategoryName = useCallback((value: string) => {
    const trimmed = value.trim();

    if (!trimmed) {
      return "Tên danh mục không được để trống!";
    }

    if (trimmed.length < CATEGORY_NAME_MIN) {
      return `Tên danh mục phải có ít nhất ${CATEGORY_NAME_MIN} ký tự`;
    }

    if (trimmed.length > CATEGORY_NAME_MAX) {
      return `Tên danh mục quá dài (tối đa ${CATEGORY_NAME_MAX} ký tự)`;
    }

    return "";
  }, []);

  const getStatusLabel = (status: string) =>
    isActiveStatus(status) ? "Hiển thị" : "Tạm ẩn";

  const normalizeStatus = useCallback(
    (status: string) => (isActiveStatus(status) ? "ACTIVE" : "INACTIVE"),
    []
  );

  useEffect(() => {
    if (!isLoadingAuth && !hasPermission(P.CATEGORY_VIEW)) {
      router.push("/admin/forbidden");
    }
  }, [isLoadingAuth, hasPermission, router]);

  const buildCategoryTree = (data: Category[]): Category[] => {
    const map: Record<number, Category> = {};
    const roots: Category[] = [];

    data.forEach((item) => {
      map[item.id] = { ...item, children: [] };
    });

    data.forEach((item) => {
      if (item.parentId && map[item.parentId]) {
        map[item.parentId].children!.push(map[item.id]);
      } else {
        roots.push(map[item.id]);
      }
    });
    return roots;
  };

  const sortCategories = useCallback((data: Category[], sortValue: string) => {
    const sorted = [...data];

    sorted.sort((a, b) => {
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

    return sorted;
  }, []);

  const applyCategoryFilters = useCallback((
    data: Category[],
    keyword = currentKeyword,
    status = currentStatus,
    sortValue = currentSort
  ) => {
    const normalizedKeyword = keyword.trim().toLocaleLowerCase();

    const filtered = data.filter((category) => {
      const matchesKeyword =
        !normalizedKeyword ||
        category.name.toLocaleLowerCase().includes(normalizedKeyword);
      const matchesStatus =
        status === "all" || normalizeStatus(category.status) === status;

      return matchesKeyword && matchesStatus;
    });

    setCategories(buildCategoryTree(sortCategories(filtered, sortValue)));
  }, [currentKeyword, currentSort, currentStatus, normalizeStatus, sortCategories]);

  const loadData = async () => {
    try {
      const dataArray = await getCategories();

      setAllCategories(dataArray);
      setParentList(dataArray);
    } catch (error) { 
      console.error("Lỗi tải danh mục:", error);
      toast.error("Không thể tải danh sách danh mục");
    }
  };

  useEffect(() => {
    if (!isLoadingAuth && hasPermission(P.CATEGORY_VIEW)) {
      loadData();
    }
  }, [hasPermission, isLoadingAuth]);

  useEffect(() => {
    applyCategoryFilters(allCategories, currentKeyword, currentStatus, currentSort);
  }, [allCategories, applyCategoryFilters, currentKeyword, currentStatus, currentSort]);

  const toggleExpand = (id: number) => {
    setExpandedRows((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleToggleStatus = async () => {
    if (!statusModal) return;
    try {
      const newStatus = isActiveStatus(statusModal.currentStatus) ? "INACTIVE" : "ACTIVE";

      await toggleCategoryStatus(statusModal.id, {
          name: statusModal.name, 
          status: newStatus
      });

      toast.success(`Đã cập nhật trạng thái danh mục: ${statusModal.name}`);
      loadData();
    } catch {
      toast.error("Không thể thay đổi trạng thái danh mục");
    } finally {
      setStatusModal(null);
    }
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteCategory(deleteId);
      toast.success("Xóa danh mục thành công");
      loadData();
    } catch (error: unknown) {
      const apiError = error as CategoryApiError;
      const errorData = apiError.response?.data;
      const errorMessage =
        typeof errorData === "string" ? errorData : errorData?.message;

      toast.error(errorMessage || "Không thể xóa danh mục này");
    } finally {
      setDeleteId(null);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFileName(file.name);
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, imageUrl: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setFormData((prev) => ({ ...prev, imageUrl: "" }));
    setImageFileName("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    setNameTouched(true);
    const inlineNameError = validateCategoryName(formData.name);
    if (inlineNameError) {
      setNameError(inlineNameError);
      return;
    }
    setNameError("");

    try {
      setIsSaving(true);
      const payload: CategoryPayload = {
        name: formData.name,
        parentId: formData.parentId === "none" ? null : Number(formData.parentId),
        status: formData.status === "INACTIVE" ? "INACTIVE" : "ACTIVE",
        imageUrl: formData.imageUrl,
      };

      if (editingId) {
        await updateCategory(editingId, payload);
        toast.success("Cập nhật danh mục thành công");
      } else {
        await createCategory(payload);
        toast.success("Thêm danh mục mới thành công");
      }
      setIsModalOpen(false);
      loadData();
    } catch (error: unknown) {
      const apiError = error as CategoryApiError;
      console.error("Lỗi từ Server:", apiError.response?.data);

      const responseData = apiError.response?.data;
      let serverMsg = "Có lỗi xảy ra khi lưu danh mục"; 

      if (typeof responseData !== 'string' && responseData?.detail) {
        serverMsg = responseData.detail; 
      } else if (typeof responseData !== 'string' && responseData?.message) {
        serverMsg = responseData.message; 
      } else if (typeof responseData === 'string') {
        serverMsg = responseData;
      }

      const httpStatus = apiError.response?.status; 
      const bodyStatus = typeof responseData === 'string' ? undefined : responseData?.statusCode; 

      const isDuplicate =
          httpStatus === 409 ||
          (typeof bodyStatus === 'string' && bodyStatus.includes('409')) ||
          serverMsg.toLowerCase().includes("tồn tại") ||
          serverMsg.toLowerCase().includes("already exists");

      if (isDuplicate) {
        setNameError(serverMsg); 
      } else {
        toast.error(serverMsg); 
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleSortChange = () => undefined;

  const canAction = hasPermission(P.CATEGORY_UPDATE) || hasPermission(P.CATEGORY_DELETE);
  const showSortFilter = false;

  let categoryRowIndex = currentPage * pageSize;

  const paginatedCategories = useMemo(() => {
    return categories.slice(currentPage * pageSize, (currentPage + 1) * pageSize);
  }, [categories, currentPage, pageSize]);

  const totalPages = Math.ceil(categories.length / pageSize);

  const renderCategoryRow = (category: Category, level = 0) => {
    const isExpanded = expandedRows[category.id];
    const hasChildren = category.children && category.children.length > 0;
    const rowNumber = level === 0 ? ++categoryRowIndex : null;
    const treeIndent = level * 18;

    return (
      <React.Fragment key={category.id}>
        <tr className="border-b border-[#eee] transition-colors hover:bg-[#f0f8ff]">
          <td className="px-4 py-3 text-[11px] font-medium text-slate-500">
            {rowNumber}
          </td>
          <td className="px-4 py-3">
            <div
              className="flex min-h-[44px] items-center"
              style={{ paddingLeft: `${treeIndent}px` }}
            >
              <div className="mr-1 flex h-8 w-6 shrink-0 items-center justify-center">
                {hasChildren ? (
                  <button
                    type="button"
                    onClick={() => toggleExpand(category.id)}
                    className="flex h-6 w-6 items-center justify-center rounded-[4px] text-slate-500 transition-colors hover:bg-slate-100 hover:text-blue-600"
                  >
                    {isExpanded ? (
                      <ChevronDown size={14} className="text-blue-600" />
                    ) : (
                      <ChevronRight size={14} />
                    )}
                  </button>
                ) : (
                  <span className="block h-6 w-6" aria-hidden="true" />
                )}
              </div>
              <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full border border-slate-200 bg-white shadow-sm">
                {category.imageUrl ? (
                  <Image
                    src={category.imageUrl}
                    alt={category.name}
                    width={40}
                    height={40}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <ImageIcon size={16} className="text-slate-300" />
                )}
              </div>
              <div className="ml-2.5 flex min-w-0 items-center gap-2">
                {level > 0 && (
                  <span
                    className="h-px w-3 shrink-0 bg-slate-300"
                    aria-hidden="true"
                  />
                )}
                <span className={cn("truncate text-[12px] tracking-tight", level === 0 ? "font-semibold text-slate-800" : "font-medium text-slate-600")}>
                  {category.name}
                </span>
              </div>
            </div>
          </td>
          <td className="px-2 py-3 text-center">
            <span className="text-[11px] font-medium text-slate-600">{category.productCount ?? 0}</span>
          </td>
          <td className="px-2 py-3 text-center">
            <span className="text-[11px] font-medium text-slate-600">{getStatusLabel(category.status)}</span>
          </td>
          {canAction && (
            <td className="px-4 py-3 text-right">
                <div className="flex justify-end gap-1">
                  {hasPermission(P.CATEGORY_UPDATE) && (
                    <Button variant="ghost" size="icon" title="Ẩn/Hiện" className={cn("h-7 w-7 rounded-[4px] text-slate-400", isActiveStatus(category.status) ? "hover:bg-blue-50 hover:text-blue-600" : "hover:bg-amber-50 hover:text-amber-500")} onClick={() => setStatusModal({ id: category.id, name: category.name, currentStatus: category.status })}>
                      {isActiveStatus(category.status) ? <Eye size={14} /> : <EyeOff size={14} />}
                    </Button>
                  )}
                  {hasPermission(P.CATEGORY_UPDATE) && (
                    <Button variant="ghost" size="icon" title="Chỉnh sửa" className="h-7 w-7 rounded-[4px] text-slate-400 hover:bg-blue-50 hover:text-blue-600" onClick={() => router.push(`/admin/categories/add?id=${category.id}`)}><Edit size={14} /></Button>
                  )}
                {hasPermission(P.CATEGORY_DELETE) && (
                  <Button variant="ghost" size="icon" title="Xóa" className="h-7 w-7 rounded-[4px] text-slate-400 hover:bg-rose-50 hover:text-rose-600" onClick={() => setDeleteId(category.id)}><Trash2 size={14} /></Button>
                )}
              </div>
            </td>
          )}
        </tr>
        {isExpanded && hasChildren && category.children!.map((child) => renderCategoryRow(child, level + 1))}
      </React.Fragment>
    );
  };

  const renderParentList = Array.isArray(parentList) ? parentList : [];
  const realtimeNameError = nameTouched ? validateCategoryName(formData.name) : "";

  return (
    <div className="space-y-3">
      <div className="mt-2 mb-8 space-y-4 px-1">
        <div>
          <h1 className="text-[20px] font-semibold tracking-tight uppercase text-slate-900">
            Quản lý danh mục hàng hóa
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
                placeholder="Tìm tên danh mục..."
                className="h-[38px] rounded-md border-slate-200 bg-white pl-10 text-[13px] shadow-none focus-visible:ring-blue-500/20"
              />
            </div>

            <Select value={currentStatus} onValueChange={setCurrentStatus}>
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
                  Tạm ẩn
                </SelectItem>
              </SelectContent>
            </Select>

            {showSortFilter && (
              <Select value={currentSort} onValueChange={handleSortChange}>
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
            )}
          </div>

          {hasPermission(P.CATEGORY_CREATE) && (
            <Button
              onClick={() => router.push("/admin/categories/add")}
              className="h-[38px] rounded-[4px] bg-blue-600 px-4 text-[13px] font-medium text-white shadow-sm hover:bg-blue-700"
            >
              <Plus size={15} className="mr-1.5" />
              Thêm danh mục
            </Button>
          )}
        </div>
      </div>

      <div className="overflow-hidden rounded-[4px] border border-[#dcdcdc] bg-white shadow-sm">
        <TooltipProvider delayDuration={150}>
        <div className="overflow-x-auto custom-scrollbar">
          <table className="table-custom min-w-[820px] w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-[#ccc] bg-[#f0f0f0]">
                <th className="w-[80px] px-4 py-3 text-[10px] font-semibold text-[#1f1f1f]">
                  STT
                </th>
                <th className="px-4 py-3 text-[10px] font-semibold text-[#1f1f1f]">
                  Tên danh mục
                </th>
                <th className="w-[120px] px-2 py-3 text-center text-[10px] font-semibold text-[#1f1f1f]">
                  Sản phẩm
                </th>
                <th className="w-[112px] px-2 py-3 text-center text-[10px] font-semibold text-[#1f1f1f]">
                  Trạng thái
                </th>
                {canAction && (
                  <th className="w-[96px] px-4 py-3 text-right text-[10px] font-semibold text-[#1f1f1f]">
                    Thao tác
                  </th>
                )}
              </tr>
            </thead>
            <tbody>
              {paginatedCategories.length > 0 ? (
                paginatedCategories.map((cat) => renderCategoryRow(cat))
              ) : (
                <tr><td colSpan={canAction ? 5 : 4} className="h-[180px] text-center text-[12px] font-medium text-slate-400">Chưa có dữ liệu.</td></tr>
              )}
            </tbody>
          </table>
        </div>
        </TooltipProvider>
        <div className="flex min-w-full shrink-0 flex-col gap-3 border-t border-slate-100 bg-[#f8f9fa] px-5 py-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-[12px] font-semibold text-slate-500">
            Tổng số: {categories.length} danh mục (Trang {categories.length === 0 ? 0 : currentPage + 1}/{categories.length === 0 ? 0 : totalPages})
          </p>

          {categories.length > pageSize && (
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
                disabled={currentPage === 0}
                className="h-7 rounded-[4px] border border-slate-200 bg-white px-2 text-[11px] font-bold text-slate-600 transition-all hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Trước
              </button>

              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }, (_, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setCurrentPage(i)}
                    className={`h-7 min-w-[28px] rounded-[4px] border px-2 text-[11px] font-bold shadow-sm transition-all ${
                      currentPage === i
                        ? "border-[#1965a2] bg-gradient-to-r from-[#1965a2] to-[#1965a2] text-white hover:from-[#145486] hover:to-[#145486]"
                        : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={currentPage >= totalPages - 1}
                className="h-7 rounded-[4px] border border-slate-200 bg-white px-2 text-[11px] font-bold text-slate-600 transition-all hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Sau
              </button>
            </div>
          )}
        </div>
      </div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="w-[95vw] max-w-[640px] max-h-[92vh] p-0 overflow-hidden bg-white flex flex-col data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0 data-[state=open]:slide-in-from-bottom-3 data-[state=closed]:slide-out-to-bottom-3 duration-200">
          <DialogHeader className="px-5 py-4 sm:px-6 sm:py-5 border-b bg-slate-50">
            <DialogTitle className="text-[16px] font-bold text-slate-800 flex items-center gap-2">
              <Tag className="text-blue-600" />
              {editingId ? "Cập nhật danh mục" : "Thêm danh mục mới"}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSave} className="flex-1 min-h-0 overflow-y-auto px-5 py-5 sm:px-6 sm:py-6 space-y-5">
            <div className="rounded-[4px] border border-slate-100 bg-slate-50/70 p-4 sm:p-5 space-y-4">
              <div className="space-y-2">
                <Label className="text-xs font-bold text-slate-500 uppercase">Ảnh đại diện</Label>
                <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" />
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    className="h-11 flex-1 justify-start bg-white text-sm font-medium text-slate-500"
                  >
                    <ImageIcon size={15} className="mr-2" />
                    {imageFileName || (formData.imageUrl ? "Đã có ảnh đại diện" : "Chọn ảnh đại diện...")}
                  </Button>
                  {formData.imageUrl && (
                    <Button type="button" variant="ghost" size="icon" onClick={handleRemoveImage} className="h-11 w-11 text-rose-600 hover:text-rose-700 hover:bg-rose-50" title="Xóa ảnh">
                      <XCircle size={15} />
                    </Button>
                  )}
                </div>
                {formData.imageUrl && (
                  <div className="relative h-28 w-28 overflow-hidden rounded-full border border-slate-200 bg-white">
                      <Image src={formData.imageUrl} alt="Preview" fill className="object-cover" />
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-bold text-slate-500 uppercase">Tên danh mục *</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => {
                    const nextName = e.target.value;
                    setNameTouched(true);
                    setFormData({ ...formData, name: nextName });
                    setNameError("");
                  }}
                  onBlur={() => setNameTouched(true)}
                  placeholder="VD: Thuốc thú y, Thức ăn..."
                  className={cn("h-11 text-sm font-bold bg-white", (realtimeNameError || nameError) && "border-red-500 focus-visible:ring-red-200")}
                />
                {(realtimeNameError || nameError) && <p className="text-[11px] text-red-500 font-bold animate-in fade-in slide-in-from-top-1">{realtimeNameError || nameError}</p>}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-slate-500 uppercase">Danh mục cha</Label>
                  <Select value={formData.parentId} onValueChange={(val) => setFormData({ ...formData, parentId: val })}>
                    <SelectTrigger className="h-11 text-sm font-medium bg-white"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Danh mục gốc</SelectItem>
                      {renderParentList.filter(p => p.id !== editingId).map((p) => (
                        <SelectItem key={p.id} value={String(p.id)}>{p.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-bold text-slate-500 uppercase">Trạng thái</Label>
                  <Select value={formData.status} onValueChange={(val) => setFormData({ ...formData, status: val })}>
                    <SelectTrigger className={cn("h-11 font-semibold bg-white", formData.status === "ACTIVE" ? "text-blue-600" : "text-amber-600")}><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ACTIVE">Đang hiển thị</SelectItem>
                      <SelectItem value="INACTIVE">Tạm ẩn</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <DialogFooter className="sticky bottom-0 bg-white pt-4 pb-1 mt-2 border-t flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2.5 sm:gap-3">
              <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)} className="h-11 w-full sm:w-auto px-6 text-xs font-bold">Hủy</Button>
              <Button type="submit" disabled={isSaving} className="h-11 w-full sm:w-auto px-8 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs">
                {isSaving ? <Loader2 className="animate-spin mr-2" /> : <Save className="mr-2" size={16} />}
                {editingId ? "Cập nhật ngay" : "Thêm danh mục"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-rose-600 uppercase font-black tracking-tight">Xác nhận xóa danh mục</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-500 font-medium">Bạn có chắc chắn muốn xóa danh mục này không? Các danh mục con sẽ bị ảnh hưởng.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="font-bold uppercase h-9 text-xs">Hủy bỏ</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-rose-600 hover:bg-rose-700 text-white font-bold h-9 text-xs uppercase">Đồng ý xóa</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!statusModal} onOpenChange={() => setStatusModal(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-amber-600 uppercase font-black tracking-tight">Thay đổi trạng thái hiển thị</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-500 font-medium">Bạn muốn {statusModal && isActiveStatus(statusModal.currentStatus) ? "ẨN" : "HIỂN THỊ"} danh mục <strong>{statusModal?.name}</strong> trên cửa hàng?</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="font-bold uppercase h-9 text-xs">Hủy</AlertDialogCancel>
            <AlertDialogAction onClick={handleToggleStatus} className="bg-amber-500 hover:bg-amber-600 text-white font-bold h-9 text-xs uppercase">Xác nhận</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

