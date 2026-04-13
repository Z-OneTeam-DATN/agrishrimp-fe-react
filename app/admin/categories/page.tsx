"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { AdminSearchFilter } from "@/components/admin/shared/AdminSearchFilter";
import {
  getCategories,
  deleteCategory,
  createCategory,
  updateCategory,
  toggleCategoryStatus,
  type CategoryPayload
} from "@/app/services/CategoryService";
import { toast } from "sonner";
import { Tag, ChevronDown, ChevronRight, Plus, Image as ImageIcon, Loader2, Save, Edit, Trash2, Eye, EyeOff, XCircle } from "lucide-react";

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
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
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
  const [editingId, setEditingId] = useState<number | null>(null);
  const [parentList, setParentList] = useState<Category[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [currentKeyword, setCurrentKeyword] = useState("");
  const [currentStatus, setCurrentStatus] = useState("all");
  const [currentSort, setCurrentSort] = useState("id,desc");
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

  const getDisplayFileNameFromUrl = useCallback((url?: string) => {
    if (!url) return "";
    const parts = url.split("/");
    const lastPart = parts[parts.length - 1] || "";
    return decodeURIComponent(lastPart).split("?")[0] || "Ảnh hiện tại";
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

  const handleAddNew = () => {
    setEditingId(null);
    setFormData({ name: "", parentId: "none", status: "ACTIVE", imageUrl: "" });
    setNameError("");
    setNameTouched(false);
    setImageFileName("");
    setIsModalOpen(true);
  };

  const handleEdit = (id: number) => {
    const findInTree = (list: Category[]): Category | undefined => {
      for (const item of list) {
        if (item.id === id) return item;
        if (item.children) {
          const found = findInTree(item.children);
          if (found) return found;
        }
      }
    };

    const cat = allCategories.find((item) => item.id === id) ?? findInTree(categories);
    if (cat) {
      setEditingId(id);
      setFormData({
        name: cat.name,
        parentId: cat.parentId ? String(cat.parentId) : "none",
        status: isActiveStatus(cat.status) ? "ACTIVE" : "INACTIVE",
        imageUrl: cat.imageUrl || "", 
      });
      setNameError("");
      setNameTouched(false);
      setImageFileName(getDisplayFileNameFromUrl(cat.imageUrl));
      setIsModalOpen(true);
    }
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

  const handleSearch = (val: string) => {
    setCurrentKeyword(val);
  };

  const handleStatusFilterChange = (val: string) => {
    setCurrentStatus(val);
  };

  const handleSortChange = (val: string) => {
    if (val === "fullName,asc") {
      setCurrentSort("name,asc");
      return;
    }

    if (val === "fullName,desc") {
      setCurrentSort("name,desc");
      return;
    }

    setCurrentSort(val);
  };

  const canAction = hasPermission(P.CATEGORY_UPDATE) || hasPermission(P.CATEGORY_DELETE);

  const renderCategoryRow = (category: Category, level = 0) => {
    const isExpanded = expandedRows[category.id];
    const hasChildren = category.children && category.children.length > 0;

    return (
      <React.Fragment key={category.id}>
        <tr className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
          <td className="p-3 pl-5 text-sm text-slate-500 font-bold font-mono">#{category.id}</td>
          <td className="p-3">
            <div className="flex items-center gap-2" style={{ paddingLeft: `${level * 24}px` }}>
              {hasChildren ? (
                <button onClick={() => toggleExpand(category.id)} className="p-1 hover:bg-slate-200 rounded transition-colors">
                  {isExpanded ? <ChevronDown size={14} className="text-blue-600" /> : <ChevronRight size={14} />}
                </button>
              ) : (
                <div className="w-6" />
              )}
              <div className="w-8 h-8 rounded border border-slate-200 bg-white overflow-hidden shadow-sm flex items-center justify-center shrink-0">
                {category.imageUrl ? (
                   <Image src={category.imageUrl} alt={category.name} width={32} height={32} className="object-contain p-0.5" />
                ) : (
                   <Tag size={14} className="text-slate-300" />
                )}
              </div>
              <span className={cn("text-[13px] uppercase tracking-tight", level === 0 ? "font-black text-slate-800" : "font-bold text-slate-600")}>
                {category.name}
              </span>
            </div>
          </td>
          <td className="p-3 text-center">
            {/* THÊM DẤU ?? 0 VÀO ĐÂY ĐỂ XỬ LÝ LỖI GIAO DIỆN KHI UNDEFINED */}
            <span className="text-[12px] font-black text-emerald-600 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-full">{category.productCount ?? 0}</span>
          </td>
          <td className="p-3 text-center">
            <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded border uppercase tracking-wide", isActiveStatus(category.status) ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-slate-50 text-slate-400 border-slate-200")}>{getStatusLabel(category.status)}</span>
          </td>
          {canAction && (
            <td className="p-3 text-right">
              <div className="flex justify-end gap-2">
                {hasPermission(P.CATEGORY_UPDATE) && (
                  <Button variant="ghost" size="icon" title="Ẩn/Hiện" className={cn("h-8 w-8", isActiveStatus(category.status) ? "text-emerald-600 hover:bg-emerald-50" : "text-amber-500 hover:bg-amber-50")} onClick={() => setStatusModal({ id: category.id, name: category.name, currentStatus: category.status })}>
                    {isActiveStatus(category.status) ? <Eye size={16} /> : <EyeOff size={16} />}
                  </Button>
                )}
                {hasPermission(P.CATEGORY_UPDATE) && (
                  <Button variant="ghost" size="icon" title="Chỉnh sửa" className="h-8 w-8 text-blue-600 hover:bg-blue-50" onClick={() => handleEdit(category.id)}><Edit size={15} /></Button>
                )}
                {hasPermission(P.CATEGORY_DELETE) && (
                  <Button variant="ghost" size="icon" title="Xóa" className="h-8 w-8 text-red-600 hover:bg-red-50" onClick={() => setDeleteId(category.id)}><Trash2 size={15} /></Button>
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
  const trimmedNameLength = formData.name.trim().length;
  const remainingNameChars = CATEGORY_NAME_MAX - trimmedNameLength;
  const realtimeNameError = nameTouched ? validateCategoryName(formData.name) : "";

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center mb-6">
         <div>
           <h1 className="text-2xl font-black text-slate-800 uppercase tracking-tight">Quản lý danh mục hàng hóa</h1>
           <p className="mt-1 text-sm text-slate-500">Quản trị và sắp xếp danh mục sản phẩm trong hệ thống.</p>
         </div>
         {hasPermission(P.CATEGORY_CREATE) && (
           <Button onClick={handleAddNew} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold">
              <Plus className="mr-2" size={18} /> THÊM DANH MỤC
           </Button>
         )}
      </div>

      <div className="bg-white border border-[#dcdcdc] rounded-[4px] shadow-[0_1px_2px_rgba(0,0,0,0.05)] overflow-hidden mb-8">
        <AdminSearchFilter
          placeholder="Tìm tên danh mục..."
          hideFilter1
          filter2Placeholder="Tất cả trạng thái"
          filter2Options={[
            { label: "Tất cả trạng thái", value: "all" },
            { label: "Hiển thị", value: "ACTIVE" },
            { label: "Tạm ẩn", value: "INACTIVE" },
          ]}
          sortOptions={[
            { label: "Mới nhất", value: "id,desc" },
            { label: "Cũ nhất", value: "id,asc" },
            { label: "Tên A-Z", value: "name,asc" },
            { label: "Tên Z-A", value: "name,desc" },
          ]}
          onSearch={handleSearch}
          onFilter2Change={handleStatusFilterChange}
          onSortChange={handleSortChange}
          onRefresh={loadData}
        />

        <div className="w-full overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-xs uppercase text-slate-500 font-bold">
                <th className="p-3 w-[80px] pl-5">ID</th>
                <th className="p-3">Tên Danh Mục</th>
                <th className="p-3 text-center">Sản phẩm</th>
                <th className="p-3 text-center">Trạng thái</th>
                {canAction && <th className="p-3 text-right pr-5">Hành động</th>}
              </tr>
            </thead>
            <tbody>
              {categories.length > 0 ? (
                categories.map((cat) => renderCategoryRow(cat))
              ) : (
                <tr><td colSpan={canAction ? 5 : 4} className="p-8 text-center text-slate-400 italic font-bold">Chưa có danh mục nào.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="w-[95vw] max-w-[640px] max-h-[92vh] p-0 overflow-hidden bg-white flex flex-col data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0 data-[state=open]:slide-in-from-bottom-3 data-[state=closed]:slide-out-to-bottom-3 duration-200">
          <DialogHeader className="px-5 py-4 sm:px-6 sm:py-5 border-b bg-slate-50">
            <DialogTitle className="text-xl font-black uppercase text-slate-800 flex items-center gap-2">
              <Tag className="text-emerald-600" />
              {editingId ? "Cập nhật danh mục" : "Thêm danh mục mới"}
            </DialogTitle>
            <p className="text-sm text-slate-500 font-medium mt-1">Điền thông tin để tạo hoặc cập nhật danh mục nhanh và chính xác.</p>
          </DialogHeader>

          <form onSubmit={handleSave} className="flex-1 min-h-0 overflow-y-auto px-5 py-5 sm:px-6 sm:py-6 space-y-5">
            <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-4 sm:p-5">
              <div className="flex flex-col items-center gap-3">
                <div className={cn("w-28 h-28 rounded-xl border-2 border-dashed flex items-center justify-center relative overflow-hidden bg-white group transition-all duration-200", formData.imageUrl ? "border-slate-200" : "border-slate-300 hover:border-emerald-300 hover:bg-emerald-50/40 hover:shadow-sm")}>
                  {formData.imageUrl ? (
                    <>
                      <Image src={formData.imageUrl} alt="Preview" fill className="object-contain p-1" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                        <ImageIcon className="text-white h-6 w-6" />
                      </div>
                    </>
                  ) : (
                    <button type="button" onClick={() => fileInputRef.current?.click()} className="flex flex-col items-center text-slate-400 hover:text-emerald-600 transition-colors">
                      <ImageIcon size={24} />
                      <span className="text-[10px] font-bold mt-1 uppercase">Tải ảnh</span>
                    </button>
                  )}
                </div>

                {formData.imageUrl && (
                  <div className="w-full max-w-[340px] rounded-lg border border-slate-200 bg-white px-3 py-2 flex items-center justify-between gap-2">
                    <TooltipProvider delayDuration={150}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <p className="text-xs font-semibold text-slate-600 truncate max-w-[220px] sm:max-w-[250px] cursor-help">{imageFileName || "Ảnh đã chọn"}</p>
                        </TooltipTrigger>
                        {(imageFileName || "Ảnh đã chọn").length > 28 && (
                          <TooltipContent side="top" className="max-w-[320px] break-all text-xs">
                            {imageFileName || "Ảnh đã chọn"}
                          </TooltipContent>
                        )}
                      </Tooltip>
                    </TooltipProvider>
                    <Button type="button" variant="ghost" size="sm" onClick={handleRemoveImage} className="h-7 w-7 sm:w-auto p-0 sm:px-2 text-rose-600 hover:text-rose-700 hover:bg-rose-50" title="Xóa ảnh">
                      <XCircle size={14} className="sm:mr-1" />
                      <span className="hidden sm:inline">Xóa</span>
                    </Button>
                  </div>
                )}

                <p className="text-xs text-slate-400 font-medium">Ảnh đại diện giúp dễ nhận diện danh mục hơn</p>
              </div>
              <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" />
            </div>

            <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-4 sm:p-5 space-y-2">
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
              <div className="flex items-center justify-between text-[11px] font-semibold">
                <span className={cn("text-slate-400", trimmedNameLength >= CATEGORY_NAME_MIN && remainingNameChars >= 0 && "text-emerald-600")}>
                  Tối thiểu {CATEGORY_NAME_MIN}, tối đa {CATEGORY_NAME_MAX} ký tự
                </span>
                <span className={cn(remainingNameChars < 0 ? "text-red-500" : "text-slate-500")}>{remainingNameChars < 0 ? `Vượt ${Math.abs(remainingNameChars)} ký tự` : `Còn ${remainingNameChars} ký tự`}</span>
              </div>
            </div>

            <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-4 sm:p-5 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-slate-500 uppercase">Danh mục cha</Label>
                  <Select value={formData.parentId} onValueChange={(val) => setFormData({ ...formData, parentId: val })}>
                    <SelectTrigger className="h-11 text-sm font-medium bg-white"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none" className="font-bold">DANH MỤC GỐC</SelectItem>
                      {renderParentList.filter(p => p.id !== editingId).map((p) => (
                        <SelectItem key={p.id} value={String(p.id)}>{p.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-bold text-slate-500 uppercase">Trạng thái</Label>
                  <Select value={formData.status} onValueChange={(val) => setFormData({ ...formData, status: val })}>
                    <SelectTrigger className={cn("h-11 font-black uppercase bg-white", formData.status === "ACTIVE" ? "text-emerald-600" : "text-amber-600")}><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ACTIVE" className="font-bold text-emerald-600">ĐANG HIỂN THỊ</SelectItem>
                      <SelectItem value="INACTIVE" className="font-bold text-amber-600">TẠM ẨN</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="pt-1">
                <span className={cn("inline-flex items-center rounded-full border px-3 py-1 text-xs font-black uppercase tracking-wide", formData.status === "ACTIVE" ? "bg-emerald-50 border-emerald-200 text-emerald-700" : "bg-amber-50 border-amber-200 text-amber-700")}>
                  <span className={cn("mr-2 h-1.5 w-1.5 rounded-full", formData.status === "ACTIVE" ? "bg-emerald-500" : "bg-amber-500")} />
                  {formData.status === "ACTIVE" ? "Đang hiển thị" : "Tạm ẩn"}
                </span>
              </div>
            </div>

            <DialogFooter className="sticky bottom-0 bg-white pt-4 pb-1 mt-2 border-t flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2.5 sm:gap-3">
              <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)} className="h-11 w-full sm:w-auto px-6 text-xs font-bold uppercase tracking-widest">Hủy</Button>
              <Button type="submit" disabled={isSaving} className="h-11 w-full sm:w-auto px-8 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs uppercase tracking-widest shadow-lg shadow-emerald-100">
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