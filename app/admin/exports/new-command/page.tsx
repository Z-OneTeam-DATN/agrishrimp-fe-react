"use client";

import React, { useState, useEffect, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm, Controller, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  X, Plus, Trash2, FileText, ChevronLeft, Save, ShoppingBag, Warehouse, UserCheck,
  MapPin, User, Phone, CalendarIcon, Hash, Search, BadgeCheck, Loader2, Package, AlertCircle, ChevronDown, ChevronUp
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { cn, formatNumber } from "@/lib/utils";
import { getErrorMessage } from "@/lib/axios";

import { branchService } from "@/app/services/branchService";
import { supplierService } from "@/app/services/supplier.service";
import { InventoryApiService, InventoryExportApiService } from "@/app/services/inventory.service";
import { ProductService } from "@/app/services/product.service";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { usePermissions } from "@/hooks/usePermissions";
import { P } from "@/lib/permissions";

// =================================================================
// 1. ĐỊNH NGHĨA ZOD SCHEMA ĐỂ BẮT LỖI (VALIDATION)
// =================================================================
const ExportItemSchema = z.object({
  productVariantId: z.number(),
  sku: z.string(),
  name: z.string(),
  unit: z.string(),
  stock: z.number(),
  price: z.number(),
  quantity: z.coerce.number().min(1, "Số lượng xuất phải lớn hơn 0"),
  returnReason: z.string().optional(),
  lotNumber: z.string().optional(),
});

const ExportCommandSchema = z.object({
  noteCode: z.string(), exportType: z.enum(["INTERNAL", "RETURN"]), expectedDate: z.string().min(1, "Chọn ngày"),
  referenceCode: z.string().optional().default(""),
  note: z.string().min(1, "Nhập lý do"), branchId: z.string().min(1, "Chọn kho xuất"), targetId: z.string().min(1, "Chọn đối tượng"),
  specificReceiver: z.string().optional().default(""), shippingAddress: z.string().optional().default(""), creatorName: z.string().optional().default(""),
  items: z.array(ExportItemSchema).min(1, "Chọn ít nhất 1 SP")
});

type ExportCommandFormValues = z.infer<typeof ExportCommandSchema>;

// =================================================================
// 2. MAIN COMPONENT
// =================================================================
function AdminExportFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const exportId = searchParams.get("id");
  const fromReceiptId = searchParams.get("fromReceiptId");
  const isEditMode = Boolean(exportId);

  const { data: currentUser } = useCurrentUser();
  const { hasPermission } = usePermissions();
  const isAdmin = hasPermission(P.EXPORT_APPROVE);
  const currentUserBranch = currentUser?.branch as
    | { branchType?: string; branchCode?: string }
    | undefined;
  const isWarehouseBranch =
    currentUserBranch?.branchCode === "MAIN_WH" ||
    currentUserBranch?.branchType === "WAREHOUSE";

  const [isReadOnly, setIsReadOnly] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(isEditMode);

  const [branches, setBranches] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [allProducts, setAllProducts] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [isLoadingSearch, setIsLoadingSearch] = useState(false);
  const [selectedProductIds, setSelectedProductIds] = useState<(number | string)[]>([]);
  const [returnSourceLocked, setReturnSourceLocked] = useState(false);
  const [showWorkflowGuide, setShowWorkflowGuide] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const generateNoteCode = (type: string) => {
    const prefix = type === "INTERNAL" ? "LXN" : "LXT";
    const dateString = `${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}`;
    const randomSuffix = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `${prefix}-${dateString}-${randomSuffix}`;
  };

  const {
    register, handleSubmit, control, watch, setValue, reset, formState: { errors }
  } = useForm<ExportCommandFormValues>({
    resolver: zodResolver(ExportCommandSchema),
    mode: "onTouched",
    defaultValues: {
      exportType: "RETURN",
      noteCode: generateNoteCode("RETURN"),
      note: "",
      expectedDate: new Date().toLocaleDateString('en-CA'),
      branchId: "",
      targetId: "",
      specificReceiver: "",
      shippingAddress: "",
      referenceCode: "",
      creatorName: "",
      items: []
    }
  });

  const { fields, append, remove, replace } = useFieldArray({ control, name: "items" });

  const watchExportType = watch("exportType");
  const watchBranchId = watch("branchId");
  const watchTargetId = watch("targetId");
  const watchItems = watch("items");

  const selectedBranchInfo = branches.find(b => b.id?.toString() === watchBranchId);
  const isMainBranch = !selectedBranchInfo || selectedBranchInfo.branchCode === "MAIN_WH";

  const totalAmount = watchItems.reduce((acc, item) => acc + ((item.quantity || 0) * (item.price || 0)), 0);

  useEffect(() => {
      if (isEditMode && exportId) {
        InventoryExportApiService.getExportCommandDetail(exportId).then(data => {
          if (data.status === "COMPLETED") setIsReadOnly(true);
          reset({
            exportType: data.exportType || "INTERNAL", noteCode: data.code, note: data.note || "",
            expectedDate: data.entryDate || new Date().toLocaleDateString('en-CA'),
            branchId: data.branchId?.toString() || "", targetId: (data.exportType === "INTERNAL" ? data.partnerBranchId : data.supplierId)?.toString() || "",
            specificReceiver: data.deliverer || "", shippingAddress: data.shippingAddress || "",
            referenceCode: data.referenceCode || "", creatorName: data.creatorName || "",
            items: (data.details || []).map((item: any) => ({
              productVariantId: item.productVariantId, sku: item.sku, name: item.productName || "SP", unit: "Cái",
              stock: item.quantityRejected || item.stock || 0,
              quantity: item.quantityRequested,
              price: item.price || 0,
              returnReason: item.note || "",
              lotNumber: item.batchNumber || ""
            }))
          });
          setIsInitialLoading(false);
        }).catch(() => {
          toast.error("Không thể tải chi tiết phiếu xuất");
          router.push("/admin/exports");
        });
      }
    }, [isEditMode, exportId, reset, router]);

  useEffect(() => {
    if (!showDropdown) return;
    const fetchProducts = async () => {
      if (!watchBranchId) {
        toast.warning("Vui lòng chọn Kho xuất hàng trước khi tìm sản phẩm");
        setShowDropdown(false);
        return;
      }
      setIsLoadingSearch(true);
      try {
        if (watchExportType === "RETURN") {
          if (!watchTargetId) {
            toast.warning("Vui lòng chọn nhà cung cấp trước khi tìm lô lỗi");
            setShowDropdown(false);
            return;
          }
          const results = await InventoryExportApiService.getDefectiveItems(
            Number(watchTargetId),
            Number(watchBranchId),
          );
          const keyword = searchTerm.trim().toLowerCase();
          const defectiveBatches = (results || [])
            .filter((item: any) => Number(item.defectiveQuantity || 0) > 0)
            .filter((item: any) => {
              if (!keyword) return true;
              return [
                item.sku,
                item.productName,
                item.batchNumber,
                item.supplierName,
              ]
                .filter(Boolean)
                .some((value) =>
                  String(value).toLowerCase().includes(keyword),
                );
            });
          setAllProducts(defectiveBatches);
          return;
        }

        const data = await ProductService.searchVariants(searchTerm, watchBranchId);
        const productList = Array.isArray(data) ? data : (data?.data || data?.content || []);
        setAllProducts(productList);
      } catch (error) {
        toast.error(
          watchExportType === "RETURN"
            ? "Không thể tải danh sách lô hàng lỗi"
            : "Không thể tải danh sách sản phẩm",
        );
      } finally {
        setIsLoadingSearch(false);
      }
    };
    const debounceTimer = setTimeout(fetchProducts, 300);
    return () => clearTimeout(debounceTimer);
  }, [searchTerm, showDropdown, watchBranchId, watchExportType, watchTargetId]);

  useEffect(() => {
    const loadMasterData = async () => {
      try {
        const [resB, resS] = await Promise.all([
          branchService.getAll(),
          supplierService.getAll(undefined, undefined, 0, 100),
        ]);
        if (resB) {
          const branchList = Array.isArray(resB) ? resB : resB?.content || [];
          setBranches(branchList);
          if (!isEditMode) {
            const warehouseBranches = branchList.filter((branch: any) => {
              const code = String(branch.branchCode || "").toUpperCase();
              const type = String(branch.branchType || "").toUpperCase();
              const name = String(branch.name || "").toLowerCase();
              if (code === "SYSTEM_DEFECT") return false;
              if (code === "MAIN_WH") return true;
              return type === "WAREHOUSE" && name.includes("kho tổng");
            });
            const preferredWarehouse =
              warehouseBranches.find((branch: any) => String(branch.id) === String(currentUser?.branch?.id ?? "")) ||
              warehouseBranches[0];
            if (preferredWarehouse) {
              setValue("branchId", String(preferredWarehouse.id));
            }
          }
        }
        if (resS) setSuppliers(Array.isArray(resS.content) ? resS.content : (Array.isArray(resS) ? resS : []));
      } catch (err) { toast.error("Lỗi tải danh mục"); }
    };
    loadMasterData();

    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) setShowDropdown(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [currentUser?.branch?.id, isEditMode, setValue]);

  useEffect(() => {
    if (!isEditMode) {
      setValue("exportType", "RETURN");
      setValue("targetId", "");
      setValue("noteCode", generateNoteCode("RETURN"));
    }
  }, [isEditMode, setValue]);

  useEffect(() => {
    if (isEditMode || isReadOnly || returnSourceLocked) return;
    setSearchTerm("");
    setShowDropdown(false);
    setSelectedProductIds([]);
    if (watchExportType === "RETURN") {
      replace([]);
    }
  }, [watchExportType, watchBranchId, watchTargetId, isEditMode, isReadOnly, replace, returnSourceLocked]);

  useEffect(() => {
    if (currentUser && !isEditMode) {
      setValue("creatorName", currentUser.fullName || currentUser.displayName || "");
    }
  }, [currentUser, isEditMode, setValue]);

  useEffect(() => {
    if (!currentUser) return;
    if (watchExportType === "RETURN" && !isAdmin && !isWarehouseBranch) {
      toast.error("Chỉ kho tổng hoặc admin mới được tạo phiếu xuất trả nhà cung cấp.");
      router.replace("/admin/forbidden");
    }
  }, [currentUser, watchExportType, isAdmin, isWarehouseBranch, router]);

  useEffect(() => {
    if (isEditMode || !fromReceiptId || suppliers.length === 0) return;

    let cancelled = false;
    (async () => {
      try {
        const receipt = await InventoryApiService.getReceiptDetail(fromReceiptId);
        if (cancelled) return;

        const supplier = suppliers.find(
          (item) =>
            String(item.id) === String(receipt.supplierId || "") ||
            item.code === receipt.supplierCode ||
            item.name === receipt.supplierName,
        );

        const rejectedItems = (receipt.items || [])
          .filter((item: any) => Number(item.quantityRejected || 0) > 0)
          .map((item: any) => ({
            productVariantId: Number(item.productVariantId ?? item.variantId ?? item.id),
            sku: item.productCode || item.sku,
            name: item.productName || item.name,
            unit: item.unit || "Cái",
            stock: Number(item.quantityRejected || 0),
            quantity: Number(item.quantityRejected || 0),
            price: Number(item.importPrice || item.price || 0),
            returnReason: item.note || "Trả hàng lỗi từ phiếu nhập",
            lotNumber: item.lotNumber || item.batchNumber || "",
          }));

        if (rejectedItems.length === 0) {
          toast.warning("Phiếu nhập này không có hàng lỗi để tạo phiếu xuất trả.");
          return;
        }

        setValue("exportType", "RETURN");
        setValue("branchId", String(receipt.branchId || receipt.branch?.id || ""));
        if (supplier?.id) {
          setValue("targetId", String(supplier.id));
        }
        setValue(
          "note",
          `Xuất trả NCC từ phiếu nhập ${receipt.receiptCode || receipt.code || fromReceiptId}`,
        );
        replace(rejectedItems);
        setReturnSourceLocked(true);
      } catch (error) {
        toast.error("Không thể khởi tạo phiếu xuất trả từ phiếu nhập đã chọn.");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [fromReceiptId, suppliers, isEditMode, replace, setValue]);

  let targetInfo = { name: "", phone: "", address: "" };
  if (watchTargetId) {
    if (watchExportType === "INTERNAL") {
      const branch = branches.find(b => b.id?.toString() === watchTargetId);
      if (branch) {
        targetInfo = { name: branch.managerNames?.[0] || "Quản lý", phone: branch.phone || "", address: branch.addressDetail || "" };
      }
    } else {
      const supplier = suppliers.find(s => s.id?.toString() === watchTargetId);
      if (supplier) {
        targetInfo = { name: supplier.contactName || "Người đại diện", phone: supplier.phone || "", address: supplier.addressDetail || "" };
      }
    }
  }

  useEffect(() => {
    if (targetInfo.name && !isEditMode) {
      setValue("specificReceiver", targetInfo.name);
      setValue("shippingAddress", targetInfo.address);
    }
  }, [watchTargetId, watchExportType, isEditMode, setValue, targetInfo]);

  const addVariantToTable = (variant: any, productName: string) => {
    if (isReadOnly) return;
    const variantId = Number(variant.variantId ?? variant.id);
    const lotNumber = variant.batchNumber || "";
    const isDuplicate = watchItems.some((item) =>
      watchExportType === "RETURN"
        ? item.productVariantId === variantId && (item.lotNumber || "") === lotNumber
        : item.productVariantId === variantId,
    );
    if (isDuplicate) {
      toast.warning(
        watchExportType === "RETURN"
          ? "Lô hàng lỗi này đã có trong danh sách"
          : "Sản phẩm đã có trong danh sách",
      );
      return;
    }
    append({
      productVariantId: variantId,
      sku: variant.sku,
      name:
        watchExportType === "RETURN"
          ? `${variant.productName || productName} ${lotNumber ? `- Lô ${lotNumber}` : ""}`
          : `${productName} ${variant.packaging ? `- ${variant.packaging}` : ''}`,
      unit: variant.unit || "Cái",
      stock:
        watchExportType === "RETURN"
          ? Number(variant.defectiveQuantity || 0)
          : Number(variant.quantity || 0),
      quantity: 1,
      price: variant.importPrice || variant.price || 0,
      returnReason: watchExportType === "RETURN" ? variant.reason || "" : "",
      lotNumber,
    });
  };

  const toggleSelectedProduct = (productId: number | string) => {
    setSelectedProductIds((prev) =>
      prev.some((id) => String(id) === String(productId))
        ? prev.filter((id) => String(id) !== String(productId))
        : [...prev, productId],
    );
  };

  const getSelectableProductKey = (variant: any) =>
    watchExportType === "RETURN"
      ? `${variant.variantId ?? variant.id}::${variant.batchNumber ?? ""}`
      : String(variant.variantId ?? variant.id);

  const addSelectedVariantsToTable = () => {
    const selectedVariants = allProducts.filter((variant) =>
      selectedProductIds.some((id) =>
        String(id) === getSelectableProductKey(variant),
      ),
    );
    if (selectedVariants.length === 0) {
      toast.warning("Vui lòng chọn ít nhất một sản phẩm");
      return;
    }
    selectedVariants.forEach((variant) =>
      addVariantToTable(variant, variant.productName || variant.unit),
    );
    setShowDropdown(false);
    setSearchTerm("");
    setSelectedProductIds([]);
  };

  const onSubmit = async (data: ExportCommandFormValues) => {
    if (isReadOnly) return;

    const invalidItems = data.items.filter(item => item.quantity > item.stock);
    if (invalidItems.length > 0) {
      toast.error(`Sản phẩm ${invalidItems[0].name} có số lượng xuất vượt quá tồn kho hiện tại.`);
      return;
    }

    const currentUserId = currentUser?.id;
    const payload = {
      code: data.noteCode,
      exportType: data.exportType,
      note: data.note,
      expectedDate: data.expectedDate,
      branchId: parseInt(data.branchId),
      supplierId: data.exportType === "RETURN" ? parseInt(data.targetId) : null,
      targetBranchId: data.exportType === "INTERNAL" ? parseInt(data.targetId) : null,
      specificReceiver: data.specificReceiver,
      shippingAddress: data.shippingAddress,
      createdById: currentUserId,
      details: data.items.map(it => ({
        productVariantId: it.productVariantId,
        requestedQuantity: it.quantity,
        batchNumber: it.lotNumber || null,
        defectiveQuantity: data.exportType === "RETURN" ? it.stock : 0,
        plannedQuantity: data.exportType === "RETURN" ? it.stock : null,
        price: it.price,
        note: data.exportType === "RETURN" ? it.returnReason : ""
      }))
    };

    setIsSubmitting(true);
    try {
      if (isEditMode) {
        await InventoryExportApiService.updateExportCommand(exportId as string, payload);
        toast.success("Cập nhật phiếu xuất trả thành công!");
      } else {
        await InventoryExportApiService.createExportCommand(payload);
        toast.success("Tạo phiếu xuất trả thành công!");
      }
      router.push("/admin/exports");
    } catch (e: any) {
      toast.error(getErrorMessage(e));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isInitialLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <div className="text-center">
          <Loader2 className="animate-spin mx-auto text-blue-600 mb-2" size={32} />
          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Đang tải dữ liệu...</p>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className={`space-y-4 pb-[100px] bg-slate-50/30 p-4 min-h-screen text-[#1f1f1f] ${isReadOnly ? "select-none opacity-95" : ""}`}>
      <div className="flex items-center gap-4 mb-2">
        <Button type="button" variant="ghost" size="icon" onClick={() => router.back()}><ChevronLeft /></Button>
        <div className="flex flex-col">
            <h1 className="text-[18px] font-black uppercase tracking-tight text-[#1f1f1f]">
               {isEditMode ? (isReadOnly ? "Chi tiết phiếu xuất trả NCC" : "Chi tiết phiếu xuất trả NCC") : "Tạo phiếu xuất trả NCC"}
            </h1>
            <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1">
                <Hash size={12}/> Mã: <span className="text-blue-600">{watch("noteCode")}</span>
            </p>
        </div>
      </div>

      <div className="mt-2 rounded-sm border border-slate-200 bg-white shadow-sm">
        <button
          type="button"
          onClick={() => setShowWorkflowGuide((prev) => !prev)}
          className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
        >
          <div className="flex items-center gap-3">
            <AlertCircle size={18} className="text-blue-600" />
            <div>
              <p className="text-[12px] font-black uppercase tracking-wide text-slate-700">
                Hướng dẫn nghiệp vụ xuất trả NCC
              </p>
              <p className="text-[11px] text-slate-400">
                Bấm để {showWorkflowGuide ? "ẩn" : "xem"} hướng dẫn màn hình này
              </p>
            </div>
          </div>
          {showWorkflowGuide ? (
            <ChevronUp size={18} className="text-slate-400" />
          ) : (
            <ChevronDown size={18} className="text-slate-400" />
          )}
        </button>

        {showWorkflowGuide ? (
          <div className="border-t border-slate-100 px-4 py-3 space-y-3">
            <div
              className={cn(
                "p-3 border rounded-sm shadow-sm",
                isAdmin
                  ? "bg-blue-50 border-blue-200 text-blue-700"
                  : "bg-amber-50 border-amber-200 text-amber-700",
              )}
            >
              <p className="text-[12px] font-bold uppercase tracking-wide">
                {isAdmin
                  ? "Chế độ Quản trị: Có thể duyệt nhanh phiếu xuất trả, nhưng hệ thống vẫn khóa đúng nghiệp vụ theo kho tổng và lô hàng lỗi."
                  : "Chế độ Quản lý kho tổng: Phiếu xuất trả sau khi lưu sẽ chờ admin duyệt mới có hiệu lực."}
              </p>
            </div>

            <div className="border border-slate-200 bg-slate-50 text-slate-700 rounded-sm p-3">
              <p className="text-[12px] font-bold uppercase tracking-wide">
                Nghiệp vụ chuẩn: màn hình này chỉ phục vụ xuất trả nhà cung cấp từ kho tổng, dựa trên các lô hàng lỗi đang còn tồn.
              </p>
              {watchExportType === "RETURN" && (
                <p className="mt-2 text-[12px] text-rose-700 font-medium">
                  Phiếu trả NCC chỉ cho phép chọn các lô hàng lỗi đang còn số lượng lỗi lớn hơn 0, đúng nhà cung cấp và đúng kho nhập.
                </p>
              )}
              {returnSourceLocked && (
                <p className="mt-2 text-[12px] text-blue-700 font-medium">
                  Phiếu xuất trả này được khởi tạo trực tiếp từ phiếu nhập có hàng lỗi. Nhà cung cấp và danh sách lô hàng đã được khóa theo phiếu nguồn.
                </p>
              )}
            </div>
          </div>
        ) : null}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="lg:col-span-8 space-y-5">
          <div className="bg-white border border-slate-200 p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-6 text-blue-700 font-black text-[11px] uppercase tracking-widest border-b pb-3">
              <FileText size={16} /> 1. Thông tin lệnh xuất kho
            </div>

            <div className="grid grid-cols-2 gap-x-6 gap-y-5">
              <div className="space-y-1.5 flex flex-col">
                <Label className="text-[10px] font-bold uppercase mb-1 text-slate-400 tracking-wider">Loại lệnh xuất (*)</Label>
                <Input value="Xuất trả nhà cung cấp" readOnly className="rounded-none h-10 w-full shadow-none border-slate-200 bg-slate-50 font-bold text-rose-700" />
              </div>

              <div className="space-y-1.5 flex flex-col">
                <Label className="text-[10px] font-bold uppercase flex items-center gap-1 mb-1 text-slate-400 tracking-wider"><Hash size={12}/> Mã phiếu (Tự động)</Label>
                <Input {...register("noteCode")} readOnly className="rounded-none bg-slate-50 text-slate-500 font-mono text-[13px] h-10 w-full border-slate-200" />
              </div>


              <div className="space-y-1.5 flex flex-col">
                <Label className="text-[10px] font-bold uppercase text-blue-600 flex items-center gap-1 mb-1 tracking-wider">Ngày hẹn xuất</Label>
                <div className="relative w-full">
                  <Input readOnly={isReadOnly} type="date" {...register("expectedDate")} className={`rounded-none border-slate-200 text-[13px] h-10 w-full pr-10 shadow-none block ${errors.expectedDate ? "border-rose-500" : ""} ${isReadOnly ? 'bg-slate-50' : ''}`} />
                  <CalendarIcon size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                </div>
                {errors.expectedDate && <p className="text-rose-500 text-[10px] mt-1">{errors.expectedDate.message}</p>}
              </div>

              <div className="col-span-2 space-y-1.5 flex flex-col mt-2">
                <Label className="text-[10px] font-bold uppercase mb-1 text-slate-400 tracking-wider">Lý do / Diễn giải (*)</Label>
                <Textarea readOnly={isReadOnly} {...register("note")} className={`rounded-none min-h-[80px] text-[13px] w-full shadow-none ${errors.note ? "border-rose-500" : "border-slate-200"} ${isReadOnly ? 'bg-slate-50' : ''}`} placeholder="Nhập lý do xuất kho..." />
                {errors.note && <p className="text-rose-500 text-[10px] mt-1">{errors.note.message}</p>}
              </div>
            </div>
          </div>

          <div className="bg-white border border-slate-200 shadow-sm overflow-visible">
             <div className="px-5 py-3 bg-[#f8f9fa] border-b flex flex-wrap items-center gap-4">
                <h3 className="text-[11px] font-black uppercase flex items-center gap-2 whitespace-nowrap"><ShoppingBag size={16} className="text-blue-600"/> 2. Danh mục sản phẩm</h3>

                <div className="relative flex-1 min-w-[300px]" ref={dropdownRef}>
                  <div className="relative">
                    {!isReadOnly && !returnSourceLocked && <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />}
                    <Input
                      readOnly={isReadOnly || returnSourceLocked}
                      placeholder={
                        isReadOnly
                          ? "Phiếu đã xuất"
                          : returnSourceLocked
                            ? "Danh sách hàng lỗi đã được nạp từ phiếu nhập"
                          : watchExportType === "RETURN"
                            ? "Tìm theo mã lô lỗi, SKU, tên sản phẩm..."
                            : "Tìm theo tên, SKU, danh mục..."
                      }
                      className={`pl-10 h-10 text-[13px] border-slate-200 rounded-none bg-white w-full shadow-none ${isReadOnly || returnSourceLocked ? 'bg-slate-50' : ''}`}
                      value={searchTerm}
                      onChange={(e) => { setSearchTerm(e.target.value); setShowDropdown(true); }}
                      onFocus={() => {
                        if (!returnSourceLocked) setShowDropdown(true);
                      }}
                    />
                  </div>

                  {showDropdown && !isReadOnly && !returnSourceLocked && (
                    <div className="absolute top-full left-0 w-full mt-1 bg-white border border-slate-200 shadow-2xl rounded-sm overflow-hidden flex flex-col z-[9999]">
                      {allProducts.length > 0 && (
                        <div className="flex items-center justify-between gap-3 border-b bg-slate-50 px-3 py-2 text-xs">
                          <span className="text-slate-500">
                            Đã chọn <span className="font-bold text-slate-700">{selectedProductIds.length}</span> sản phẩm
                          </span>
                          <Button
                            type="button"
                            size="sm"
                            className="h-7 text-[11px]"
                            onClick={addSelectedVariantsToTable}
                          >
                            Thêm đã chọn
                          </Button>
                        </div>
                      )}
                      <div className="max-h-[400px] overflow-y-auto">
                        {isLoadingSearch ? (
                          <div className="p-4 text-center text-slate-500 text-[12px]">
                            Đang tải dữ liệu...
                          </div>
                        ) : allProducts.length > 0 ? (
                          allProducts.map((variant) => (
                            <div
                              key={`${variant.variantId ?? variant.id}-${variant.batchNumber ?? variant.sku}`}
                              className="p-3 border-b border-slate-100 hover:bg-slate-50 transition-colors cursor-pointer flex justify-between items-center group"
                              onClick={() => addVariantToTable(variant, variant.productName || variant.unit)}
                            >
                              <div className="flex items-center gap-3">
                                 <div
                                   onClick={(e) => e.stopPropagation()}
                                   className="flex items-center"
                                 >
                                   <Checkbox
                                     checked={selectedProductIds.some((id) => String(id) === getSelectableProductKey(variant))}
                                     onCheckedChange={() => toggleSelectedProduct(getSelectableProductKey(variant))}
                                   />
                                 </div>
                                 <div className="w-10 h-10 bg-white border border-slate-200 rounded-sm overflow-hidden flex items-center justify-center">
                                    {variant.imageUrl ? (
                                      <img src={variant.imageUrl} alt={variant.sku} className="w-full h-full object-cover" />
                                    ) : <Package size={16} className="text-slate-300" />}
                                 </div>
                                 <div>
                                   <p className="text-[13px] font-bold text-slate-800 group-hover:text-blue-600">
                                     {variant.productName || variant.unit} {variant.packaging ? `- ${variant.packaging}` : ''}
                                    </p>
                                   <p className="text-[11px] text-slate-500 mt-0.5">
                                     SKU: <span className="font-mono text-blue-600">{variant.sku}</span>
                                     {watchExportType === "RETURN" && variant.batchNumber ? (
                                       <span className="ml-2">| Lô: <span className="font-mono text-rose-600">{variant.batchNumber}</span></span>
                                     ) : null}
                                   </p>
                                 </div>
                              </div>

                              <div className="text-right">
                                <p className="text-[13px] font-bold text-slate-700">{formatNumber(variant.importPrice || variant.price || 0)} VND</p>
                                <p className={cn(
                                    "text-[11px] font-bold px-2 py-0.5 rounded-sm mt-1 inline-block border",
                                    (watchExportType === "RETURN" ? variant.defectiveQuantity : variant.quantity) > 0
                                      ? "text-blue-600 bg-blue-50 border-blue-100"
                                      : "text-rose-600 bg-rose-50 border-rose-100"
                                )}>
                                   {watchExportType === "RETURN"
                                     ? `SL lỗi: ${variant.defectiveQuantity || 0}`
                                     : `Tồn kho xuất: ${variant.quantity || 0}`}
                                </p>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="p-4 text-center text-slate-500 text-[12px]">
                             {searchTerm
                               ? watchExportType === "RETURN"
                                 ? "Không tìm thấy lô lỗi phù hợp."
                                 : "Không tìm thấy sản phẩm nào."
                               : watchExportType === "RETURN"
                                 ? "Hãy chọn nhà cung cấp và gõ mã lô lỗi hoặc SKU..."
                                 : "Hãy gõ từ khóa để tìm kiếm..."}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
             </div>

             <div className="overflow-x-auto">
               <Table>
                  <TableHeader className="bg-slate-50">
                     <TableRow>
                        <TableHead className="w-[40px] text-[10px] font-black uppercase text-slate-500 text-center tracking-wider">#</TableHead>
                        <TableHead className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Mã SKU</TableHead>
                        <TableHead className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Tên sản phẩm</TableHead>
                        {watchExportType === "RETURN" && (
                          <TableHead className="text-[10px] font-black uppercase text-amber-600 tracking-wider">Lô lỗi</TableHead>
                        )}
                        <TableHead className="text-right text-[10px] font-black uppercase text-blue-600 w-[110px] tracking-wider">SL Xuất</TableHead>
                        {watchExportType === "RETURN" && (
                          <TableHead className="text-[10px] font-black uppercase text-rose-600 min-w-[200px] tracking-wider">Lý do trả hàng</TableHead>
                        )}
                        <TableHead className="text-right text-[10px] font-black uppercase text-slate-500 tracking-wider">Giá vốn</TableHead>
                        <TableHead className="w-[50px]"></TableHead>
                     </TableRow>
                  </TableHeader>
                  <TableBody>
                    {fields.length === 0 ? (
                      <TableRow><TableCell colSpan={watchExportType === "RETURN" ? 8 : 6} className="h-[150px] text-center text-slate-300 italic font-medium tracking-widest uppercase text-[11px]">Chưa có sản phẩm nào được chọn</TableCell></TableRow>
                    ) : (
                      fields.map((field, index) => {
                        const hasQtyError = errors.items?.[index]?.quantity;
                        const hasReasonError = errors.items?.[index]?.returnReason;
                        const currentItem = watchItems[index] as any;

                        return (
                          <React.Fragment key={field.id}>
                            <TableRow className="hover:bg-slate-50/50">
                              <TableCell className="text-center text-slate-400 font-bold text-[11px]">{index + 1}</TableCell>
                              <TableCell className="font-mono text-[12px] text-slate-500">{currentItem?.sku}</TableCell>
                              <TableCell className="font-bold text-[13px] text-slate-700">
                                {currentItem?.name}
                                <div className="text-[10px] text-emerald-600 font-bold mt-0.5">
                                  {watchExportType === "RETURN"
                                    ? `SL lỗi hiện có: ${currentItem?.stock || 0}`
                                    : `Tồn kho xuất: ${currentItem?.stock || 0}`}
                                </div>
                              </TableCell>

                              {watchExportType === "RETURN" && (
                                <TableCell className="font-mono text-[12px] text-amber-700">
                                  {currentItem?.lotNumber || "---"}
                                </TableCell>
                              )}

                              <TableCell className="p-1">
                                <Input
                                  readOnly={isReadOnly}
                                  type="number"
                                  {...register(`items.${index}.quantity`)}
                                  className={cn(
                                    "h-8 text-right font-black rounded-none text-blue-600 focus:bg-white",
                                    (hasQtyError || currentItem?.quantity > currentItem?.stock) ? "border-rose-500" : "border-blue-200",
                                    isReadOnly ? "bg-slate-50 border-transparent" : ""
                                  )}
                                />
                                {/* Cảnh báo vượt tồn kho */}
                                {!isReadOnly && currentItem?.quantity > currentItem?.stock && (
                                   <div className="text-[10px] text-rose-500 font-bold mt-1 text-right animate-pulse">
                                     Vượt tồn kho!
                                   </div>
                                )}
                              </TableCell>

                              {watchExportType === "RETURN" && (
                                <TableCell className="p-1">
                                  <Input readOnly={isReadOnly} placeholder="Nhập lý do..." {...register(`items.${index}.returnReason`)} className={`h-8 text-[12px] rounded-none focus:bg-white ${hasReasonError ? "border-rose-500" : "border-rose-100"} ${isReadOnly ? 'bg-slate-50 border-transparent' : ''}`} />
                                </TableCell>
                              )}

                              <TableCell className="text-right text-[12px] font-medium">{formatNumber(currentItem?.price || 0)}</TableCell>
                              <TableCell className="text-center">
                                {!isReadOnly && <button type="button" onClick={() => remove(index)} className="text-slate-300 hover:text-red-500"><Trash2 size={16}/></button>}
                              </TableCell>
                            </TableRow>
                            {(hasQtyError || hasReasonError) && (
                              <TableRow className="bg-rose-50">
                                <TableCell colSpan={watchExportType === "RETURN" ? 8 : 6} className="p-1 px-4 text-[11px] text-rose-500 font-bold">
                                  {hasQtyError && <span className="mr-4">• Lỗi SL: {hasQtyError.message}</span>}
                                  {hasReasonError && <span>• Lỗi Lý do: {hasReasonError.message}</span>}
                                </TableCell>
                              </TableRow>
                            )}
                          </React.Fragment>
                        );
                      })
                    )}
                  </TableBody>
               </Table>
               {errors.items?.root && <div className="p-3 text-[12px] text-rose-500 bg-rose-50 font-bold border-t border-rose-100">{errors.items.root.message}</div>}
             </div>
          </div>
        </div>

        <div className="lg:col-span-4 space-y-5">

          <div className="bg-white border border-slate-200 p-6 shadow-sm space-y-4">
             <div className="flex items-center gap-2 font-bold text-[11px] uppercase border-b pb-2"><Warehouse size={16}/> Kho xuất hàng</div>
             <div className="space-y-1.5 flex flex-col">
                <Label className="text-[10px] font-bold uppercase text-slate-400">Kho tổng xuất hàng (*)</Label>
                <Controller
                  name="branchId"
                  control={control}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value} disabled={isReadOnly}>
                      <SelectTrigger className={`rounded-none h-10 font-bold ${errors.branchId ? "border-rose-500" : "border-slate-200"} bg-slate-50 text-slate-700`}>
                        <SelectValue placeholder="-- KHO TỔNG --" />
                      </SelectTrigger>
                      <SelectContent className="rounded-none">
                        {branches
                          .filter((b: any) => {
                            const code = String(b.branchCode || "").toUpperCase();
                            const type = String(b.branchType || "").toUpperCase();
                            const name = String(b.name || "").toLowerCase();
                            if (code === "SYSTEM_DEFECT") return false;
                            if (code === "MAIN_WH") return true;
                            return type === "WAREHOUSE" && name.includes("kho tổng");
                          })
                          .map((b: any) => (
                            <SelectItem key={b.id} value={b.id.toString()}>{b.name.toUpperCase()}</SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.branchId && <p className="text-rose-500 text-[10px] mt-1">{errors.branchId.message}</p>}
             </div>
             <div className="space-y-1.5 pt-1">
                <Label className="text-[10px] font-bold uppercase text-rose-500 flex items-center gap-1 mb-1"><MapPin size={12} /> Địa chỉ kho xuất</Label>
                <Textarea readOnly value={branches.find(b => b.id.toString() === watchBranchId)?.addressDetail || ""} className="min-h-[40px] text-[12px] border-slate-200 rounded-none bg-slate-50 resize-none text-slate-600" placeholder="Địa chỉ tự động hiển thị..."/>
             </div>
          </div>

          <div className="bg-white border border-slate-200 p-6 shadow-sm space-y-4">
             <div className="flex items-center gap-2 font-bold text-[11px] uppercase border-b pb-2"><UserCheck size={16}/> Đối tượng nhận</div>
             <div className="space-y-1.5 flex flex-col">
                <Label className="text-[10px] font-bold uppercase text-slate-400">Chọn đối tượng nhận (*)</Label>
                <Controller
                  name="targetId"
                  control={control}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value} disabled={isReadOnly || isEditMode || returnSourceLocked}>
                       <SelectTrigger className={`rounded-none h-10 font-bold ${errors.targetId ? "border-rose-500" : "border-slate-200"}`}><SelectValue placeholder="-- Chọn đối tượng --" /></SelectTrigger>
                       <SelectContent className="rounded-none">
                          {watchExportType === "INTERNAL"
                            ? branches.filter(b => b.id?.toString() !== watchBranchId).map(b => <SelectItem key={b.id} value={b.id.toString()}>{b.name.toUpperCase()}</SelectItem>)
                            : suppliers.map(s => <SelectItem key={s.id} value={s?.id?.toString() || ""}>{s.name?.toUpperCase()}</SelectItem>)
                          }
                       </SelectContent>
                    </Select>
                  )}
                />
                {errors.targetId && <p className="text-rose-500 text-[10px] mt-1">{errors.targetId.message}</p>}
             </div>
             <div className="space-y-1.5 pt-2 flex flex-col">
                 <Label className="text-[10px] font-bold uppercase text-slate-400 mb-1">Tên người nhận (*)</Label>
                 <Input readOnly={isReadOnly} {...register("specificReceiver")} className={`rounded-none text-[13px] h-10 ${errors.specificReceiver ? "border-rose-500" : "border-slate-200"}`} placeholder="Tên người nhận..." />
                 {errors.specificReceiver && <p className="text-rose-500 text-[10px] mt-1">{errors.specificReceiver.message}</p>}
             </div>
             <div className="space-y-1.5 flex flex-col">
                 <Label className="text-[10px] font-bold uppercase text-slate-400 mb-1">Địa chỉ giao hàng (*)</Label>
                 <Textarea readOnly={isReadOnly} {...register("shippingAddress")} className={`rounded-none min-h-[60px] text-[13px] ${errors.shippingAddress ? "border-rose-500" : "border-slate-200"}`} placeholder="Địa chỉ giao hàng thực tế..." />
                 {errors.shippingAddress && <p className="text-rose-500 text-[10px] mt-1">{errors.shippingAddress.message}</p>}
             </div>
          </div>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 lg:left-[260px] right-0 bg-[#f8f9fa] border-t p-[12px_30px] flex justify-between items-center z-[999] shadow-[0_-4px_20px_rgba(0,0,0,0.1)]">
         <div className="text-[12px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-4">
            <span>Tổng số lượng: <span className="text-slate-800 font-black text-[14px]">
               {watchItems.reduce((acc, i) => acc + (Number(i.quantity) || 0), 0)}
            </span></span>
            <div className="h-4 w-[1px] bg-slate-300"></div>
            <span>Tổng giá trị: <span className="text-blue-600 font-black text-[15px]">
               {formatNumber(watchItems.reduce((acc, i) => acc + ((Number(i.quantity) || 0) * (Number(i.price) || 0)), 0))} VND
            </span></span>
         </div>
         <div className="flex gap-3">
           <Button type="button" variant="outline" className="rounded-none uppercase px-8 border-slate-300 bg-white" onClick={() => router.back()}>{isReadOnly ? "Quay lại" : "Hủy bỏ"}</Button>
           {!isReadOnly && (
             <Button type="submit" disabled={isSubmitting} className="bg-blue-600 hover:bg-blue-700 text-white rounded-none font-black px-10">
               {isSubmitting ? (
                 <Loader2 className="animate-spin mr-2" />
               ) : (
                 <>
                   <Save size={18} className="mr-2" />
                   {isAdmin ? "LƯU & DUYỆT PHIẾU TRẢ" : "LƯU & GỬI DUYỆT"}
                 </>
               )}
             </Button>
           )}
         </div>
      </div>
    </form>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center bg-slate-50"><Loader2 className="animate-spin text-blue-600" size={32} /></div>}>
      <AdminExportFormContent />
    </Suspense>
  );
}
