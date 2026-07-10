"use client";

import React, { useEffect, useState, useTransition, useRef, useCallback } from "react";
import Image from "next/image";
import {
  getAdminBrands,
  createBrand,
  updateBrand,
  deleteBrand,
} from "@/app/services/brand.service";
import { BrandDTO } from "@/app/types/brand.type";
import { toast } from "sonner";
import {
  Building2,
  Plus,
  Loader2,
  Search,
  Image as ImageIcon,
  XCircle,
  Edit,
  Trash2,
  Eye,
  EyeOff,
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
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { usePermissions } from "@/hooks/usePermissions";
import { P } from "@/lib/permissions";
import { useRouter } from "next/navigation";

const BRAND_NAME_MIN = 2;
const BRAND_NAME_MAX = 100;

export default function BrandManagementPage() {
  const { hasPermission, isLoadingAuth } = usePermissions();
  const router = useRouter();

  const [allBrands, setAllBrands] = useState<BrandDTO[]>([]);
  const [brands, setBrands] = useState<BrandDTO[]>([]);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [statusModal, setStatusModal] = useState<{ id: number; name: string; currentStatus: string } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isPending, startTransition] = useTransition();

  // State Modal Add/Edit
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [currentKeyword, setCurrentKeyword] = useState("");
  const [currentStatus, setCurrentStatus] = useState("all");
  const [currentSort, setCurrentSort] = useState("id,desc");
  const [nameError, setNameError] = useState<string>("");
  const [nameTouched, setNameTouched] = useState(false);
  const [imageFileName, setImageFileName] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    status: "ACTIVE" as "ACTIVE" | "INACTIVE",
    logoUrl: "",
  });

  const isActiveStatus = (status: string) => status === "ACTIVE";

  const validateBrandName = useCallback((value: string) => {
    const trimmed = value.trim();
    if (!trimmed) {
      return "Tên thương hiệu không được để trống!";
    }
    if (trimmed.length < BRAND_NAME_MIN) {
      return `Tên thương hiệu phải có ít nhất ${BRAND_NAME_MIN} ký tự`;
    }
    if (trimmed.length > BRAND_NAME_MAX) {
      return `Tên thương hiệu quá dài (tối đa ${BRAND_NAME_MAX} ký tự)`;
    }
    return "";
  }, []);

  const getDisplayFileNameFromUrl = useCallback((url?: string | null) => {
    if (!url) return "";
    const parts = url.split("/");
    const lastPart = parts[parts.length - 1] || "";
    return decodeURIComponent(lastPart).split("?")[0] || "Ảnh hiện tại";
  }, []);

  const getStatusLabel = (status: string) => (isActiveStatus(status) ? "Hiển thị" : "Tạm ẩn");

  // Check Permission
  useEffect(() => {
    if (!isLoadingAuth && !hasPermission(P.PRODUCT_VIEW)) {
      router.push("/admin/forbidden");
    }
  }, [isLoadingAuth, hasPermission, router]);

  const sortBrands = useCallback((data: BrandDTO[], sortValue: string) => {
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

  const applyBrandFilters = useCallback(
    (data: BrandDTO[], keyword = currentKeyword, status = currentStatus, sortValue = currentSort) => {
      const normalizedKeyword = keyword.trim().toLowerCase();
      const filtered = data.filter((brand) => {
        const matchesKeyword =
          !normalizedKeyword || brand.name.toLowerCase().includes(normalizedKeyword);
        const matchesStatus = status === "all" || brand.status === status;
        return matchesKeyword && matchesStatus;
      });
      setBrands(sortBrands(filtered, sortValue));
    },
    [currentKeyword, currentStatus, currentSort, sortBrands]
  );

  const loadData = async () => {
    if (!hasPermission(P.PRODUCT_VIEW)) return;
    setIsLoading(true);
    try {
      const data = await getAdminBrands();
      setAllBrands(data || []);
    } catch (error) {
      toast.error("Không thể tải danh sách thương hiệu");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!isLoadingAuth) {
      loadData();
    }
  }, [isLoadingAuth]);

  useEffect(() => {
    applyBrandFilters(allBrands, currentKeyword, currentStatus, currentSort);
  }, [allBrands, applyBrandFilters, currentKeyword, currentStatus, currentSort]);

  const openAddModal = () => {
    setEditingId(null);
    setFormData({
      name: "",
      status: "ACTIVE",
      logoUrl: "",
    });
    setNameError("");
    setNameTouched(false);
    setImageFileName("");
    setIsModalOpen(true);
  };

  const handleEdit = (brand: BrandDTO) => {
    setEditingId(brand.id);
    setFormData({
      name: brand.name,
      status: brand.status || "ACTIVE",
      logoUrl: brand.logoUrl || "",
    });
    setNameError("");
    setNameTouched(false);
    setImageFileName(getDisplayFileNameFromUrl(brand.logoUrl));
    setIsModalOpen(true);
  };

  const handleToggleStatus = async () => {
    if (!statusModal) return;
    try {
      const newStatus = isActiveStatus(statusModal.currentStatus) ? "INACTIVE" : "ACTIVE";
      await updateBrand(statusModal.id, {
        name: statusModal.name,
        status: newStatus,
        logoUrl: null, // Keep existing logo if not changed
      });
      toast.success(`Đã cập nhật trạng thái thương hiệu: ${statusModal.name}`);
      loadData();
    } catch {
      toast.error("Không thể thay đổi trạng thái thương hiệu");
    } finally {
      setStatusModal(null);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFileName(file.name);
      const reader = new FileReader();
      reader.onloadend = () => {
        const img = document.createElement("img");
        img.src = reader.result as string;
        img.onload = () => {
          const canvas = document.createElement("canvas");
          const MAX_WIDTH = 800;
          const MAX_HEIGHT = 800;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          ctx?.drawImage(img, 0, 0, width, height);
          const dataUrl = canvas.toDataURL("image/jpeg", 0.7);
          setFormData({ ...formData, logoUrl: dataUrl });
        };
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setFormData((prev) => ({ ...prev, logoUrl: "" }));
    setImageFileName("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setNameTouched(true);

    const inlineError = validateBrandName(formData.name);
    if (inlineError) {
      setNameError(inlineError);
      return;
    }
    setNameError("");
    setIsSaving(true);

    try {
      const payload = {
        name: formData.name.trim(),
        logoUrl: formData.logoUrl.trim() || null,
        status: formData.status,
      };

      if (editingId) {
        await updateBrand(editingId, payload);
        toast.success("Cập nhật thương hiệu thành công");
      } else {
        await createBrand(payload);
        toast.success("Thêm thương hiệu mới thành công");
      }
      window.dispatchEvent(new Event("brandUpdated"));
      setIsModalOpen(false);
      loadData();
    } catch (error: any) {
      const errMsg = error?.response?.data?.message || "Có lỗi xảy ra khi lưu thương hiệu";
      if (errMsg.toLowerCase().includes("tồn tại") || errMsg.toLowerCase().includes("already exists")) {
        setNameError(errMsg);
      } else {
        toast.error(errMsg);
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    startTransition(async () => {
      try {
        await deleteBrand(deleteId);
        toast.success("Xóa thương hiệu thành công!");
        window.dispatchEvent(new Event("brandUpdated"));
        setDeleteId(null);
        loadData();
      } catch (error: any) {
        const errMsg = error?.response?.data?.message || "Không thể xóa thương hiệu này";
        toast.error(errMsg);
      }
    });
  };

  const canAction = hasPermission(P.PRODUCT_UPDATE) || hasPermission(P.PRODUCT_DELETE);
  const realtimeNameError = nameTouched ? validateBrandName(formData.name) : "";

  if (isLoadingAuth) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="mt-2 mb-8 space-y-4 px-1">
        <div>
          <h1 className="text-[20px] font-semibold tracking-tight uppercase text-slate-900">
            Quản lý thương hiệu
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
                placeholder="Tìm tên thương hiệu..."
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

            <Select value={currentSort} onValueChange={setCurrentSort}>
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

          {hasPermission(P.PRODUCT_CREATE) && (
            <Button
              onClick={openAddModal}
              className="h-[38px] rounded-[4px] bg-blue-600 px-4 text-[13px] font-medium text-white shadow-sm hover:bg-blue-700"
            >
              <Plus size={15} className="mr-1.5" />
              Thêm thương hiệu
            </Button>
          )}
        </div>
      </div>

      <div className="overflow-hidden rounded-[4px] border border-slate-200 bg-white shadow-sm">
        <TooltipProvider delayDuration={150}>
          <div className="overflow-x-auto custom-scrollbar">
            <table className="table-custom min-w-[820px] w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-[#ccc] bg-[#f0f0f0]">
                  <th className="w-[80px] px-4 py-3 text-[10px] font-semibold text-[#1f1f1f]">
                    STT
                  </th>
                  <th className="w-[100px] px-2 py-3 text-[10px] font-semibold text-[#1f1f1f]">
                    Logo
                  </th>
                  <th className="px-2 py-3 text-[10px] font-semibold text-[#1f1f1f]">
                    Tên thương hiệu
                  </th>
                  <th className="w-[150px] px-2 py-3 text-center text-[10px] font-semibold text-[#1f1f1f]">
                    Trạng thái
                  </th>
                  {canAction && (
                    <th className="w-[132px] px-4 py-3 text-right text-[10px] font-semibold text-[#1f1f1f]">
                      Thao tác
                    </th>
                  )}
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={canAction ? 5 : 4} className="h-[180px] text-center text-[12px] font-medium text-slate-400">
                      <div className="flex items-center justify-center gap-2">
                        <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
                        <span>Đang tải dữ liệu...</span>
                      </div>
                    </td>
                  </tr>
                ) : brands.length > 0 ? (
                  brands.map((brand, idx) => (
                    <tr key={brand.id} className="border-b border-[#eee] transition-colors hover:bg-[#f0f8ff]">
                      <td className="px-4 py-3 text-[11px] font-medium text-slate-500">
                        {idx + 1}
                      </td>
                      <td className="px-2 py-3">
                        {brand.logoUrl ? (
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-[4px] border border-slate-200 bg-white shadow-sm">
                            <img
                              src={brand.logoUrl}
                              alt={brand.name}
                              width={32}
                              height={32}
                              className="object-contain p-0.5"
                            />
                          </div>
                        ) : (
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[4px] border border-slate-200 bg-slate-50 text-slate-400 text-[10px]">
                            No Logo
                          </div>
                        )}
                      </td>
                      <td className="px-2 py-3 font-semibold text-[11px] text-slate-800">
                        {brand.name}
                      </td>
                      <td className="px-2 py-3 text-center text-[11px] font-medium text-slate-600">
                        {getStatusLabel(brand.status || "ACTIVE")}
                      </td>
                      {canAction && (
                        <td className="px-4 py-3 text-right">
                          <div className="flex justify-end gap-1">
                            {hasPermission(P.PRODUCT_UPDATE) && (
                              <Button
                                variant="ghost"
                                size="icon"
                                title="Ẩn/Hiện"
                                className={cn(
                                  "h-7 w-7 rounded-[4px] text-slate-400",
                                  isActiveStatus(brand.status || "ACTIVE")
                                    ? "hover:bg-blue-50 hover:text-blue-600"
                                    : "hover:bg-amber-50 hover:text-amber-500"
                                )}
                                onClick={() =>
                                  setStatusModal({
                                    id: brand.id,
                                    name: brand.name,
                                    currentStatus: brand.status || "ACTIVE",
                                  })
                                }
                              >
                                {isActiveStatus(brand.status || "ACTIVE") ? (
                                  <Eye size={14} />
                                ) : (
                                  <EyeOff size={14} />
                                )}
                              </Button>
                            )}
                            {hasPermission(P.PRODUCT_UPDATE) && (
                              <Button
                                variant="ghost"
                                size="icon"
                                title="Chỉnh sửa"
                                className="h-7 w-7 rounded-[4px] text-slate-400 hover:bg-blue-50 hover:text-blue-600"
                                onClick={() => handleEdit(brand)}
                              >
                                <Edit size={14} />
                              </Button>
                            )}
                            {hasPermission(P.PRODUCT_DELETE) && (
                              <Button
                                variant="ghost"
                                size="icon"
                                title="Xóa"
                                className="h-7 w-7 rounded-[4px] text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                                onClick={() => setDeleteId(brand.id)}
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
        <div className="flex min-w-full shrink-0 items-center justify-between border-t border-slate-100 bg-[#f8f9fa] px-5 py-3">
          <p className="text-[12px] font-semibold text-slate-500">
            Tổng số: {allBrands.length} thương hiệu
          </p>
        </div>
      </div>

      {/* dialog Add/Edit brand */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="w-[95vw] max-w-[640px] max-h-[92vh] p-0 overflow-hidden bg-white flex flex-col data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0 data-[state=open]:slide-in-from-bottom-3 data-[state=closed]:slide-out-to-bottom-3 duration-200">
          <DialogHeader className="px-5 py-4 sm:px-6 sm:py-5 border-b bg-slate-50">
            <DialogTitle className="text-[16px] font-bold text-slate-800 flex items-center gap-2">
              <Building2 className="text-blue-600" />
              {editingId ? "Cập nhật thương hiệu" : "Thêm thương hiệu mới"}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSave} className="flex-1 min-h-0 overflow-y-auto px-5 py-5 sm:px-6 sm:py-6 space-y-5">
            <div className="rounded-[4px] border border-slate-100 bg-slate-50/70 p-4 sm:p-5 space-y-4">
              <div className="space-y-2">
                <Label className="text-xs font-bold text-slate-500 uppercase">Logo đại diện</Label>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  className="hidden"
                  accept="image/*"
                />
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    className="h-11 flex-1 justify-start bg-white text-sm font-medium text-slate-500"
                  >
                    <ImageIcon size={15} className="mr-2" />
                    {imageFileName || (formData.logoUrl ? "Đã có logo" : "Chọn logo...")}
                  </Button>
                  {formData.logoUrl && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={handleRemoveImage}
                      className="h-11 w-11 text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                      title="Xóa logo"
                    >
                      <XCircle size={15} />
                    </Button>
                  )}
                </div>
                {formData.logoUrl && (
                  <div className="relative h-28 w-28 overflow-hidden rounded-[4px] border border-slate-200 bg-white">
                    <img src={formData.logoUrl} alt="Preview" className="object-contain p-1 w-full h-full" />
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-bold text-slate-500 uppercase">Tên thương hiệu *</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => {
                    const nextName = e.target.value;
                    setNameTouched(true);
                    setFormData({ ...formData, name: nextName });
                    setNameError("");
                  }}
                  onBlur={() => setNameTouched(true)}
                  placeholder="VD: CP Group, Grobest..."
                  className={cn(
                    "h-11 text-sm font-bold bg-white",
                    (realtimeNameError || nameError) && "border-red-500 focus-visible:ring-red-200"
                  )}
                />
                {(realtimeNameError || nameError) && (
                  <p className="text-[11px] text-red-500 font-bold animate-in fade-in slide-in-from-top-1">
                    {realtimeNameError || nameError}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-bold text-slate-500 uppercase">Trạng thái</Label>
                <Select
                  value={formData.status}
                  onValueChange={(val: "ACTIVE" | "INACTIVE") => setFormData({ ...formData, status: val })}
                >
                  <SelectTrigger
                    className={cn(
                      "h-11 font-semibold bg-white",
                      formData.status === "ACTIVE" ? "text-blue-600" : "text-amber-600"
                    )}
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ACTIVE">Đang hiển thị</SelectItem>
                    <SelectItem value="INACTIVE">Tạm ẩn</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
                Hủy
              </Button>
              <Button
                type="submit"
                disabled={isSaving}
                className="bg-blue-600 hover:bg-blue-700 text-white gap-2"
              >
                {isSaving && <Loader2 className="h-4 w-4 animate-spin" />}
                Lưu lại
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Confirmation Dialog delete */}
      <AlertDialog open={deleteId !== null} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-slate-900">Bạn có chắc chắn muốn xóa?</AlertDialogTitle>
            <AlertDialogDescription>
              Hành động này không thể hoàn tác. Thương hiệu sẽ bị xóa vĩnh viễn khỏi hệ thống nếu không có sản phẩm liên kết nào.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Hủy</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleDelete();
              }}
              disabled={isPending}
              className="bg-rose-600 text-white hover:bg-rose-700 focus:ring-rose-500"
            >
              {isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Đồng ý xóa
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Status Toggle Confirmation Modal */}
      <AlertDialog open={statusModal !== null} onOpenChange={(open) => !open && setStatusModal(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-slate-900">Thay đổi trạng thái thương hiệu</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc chắn muốn {statusModal && isActiveStatus(statusModal.currentStatus) ? "tạm ẩn" : "hiển thị"} thương hiệu <strong>{statusModal?.name}</strong>?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleToggleStatus}
              className="bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500"
            >
              Xác nhận
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
