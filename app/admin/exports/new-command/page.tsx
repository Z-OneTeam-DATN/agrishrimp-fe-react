"use client";

import React, { useState, useEffect, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm, Controller, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Trash2, Save, Search, Loader2, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import { cn, formatNumber } from "@/lib/utils";
import { getErrorMessage } from "@/lib/axios";

import { branchService } from "@/app/services/branchService";
import { supplierService } from "@/app/services/supplier.service";
import {
  InventoryApiService,
  InventoryExportApiService,
} from "@/app/services/inventory.service";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { usePermissions } from "@/hooks/usePermissions";
import { useAuthStore } from "@/stores/useAuthStore";
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
  receiptCode: z.string().optional(),
  receiptId: z.number().optional(),
});

const ExportCommandSchema = z.object({
  noteCode: z.string(),
  exportType: z.enum(["INTERNAL", "RETURN"]),
  expectedDate: z.string().min(1, "Chọn ngày"),
  referenceCode: z.string().optional().default(""),
  note: z.string().trim().min(1, "Nhập lý do"),
  branchId: z.string().min(1, "Chọn kho xuất"),
  targetId: z.string().min(1, "Chọn đối tượng"),
  specificReceiver: z.string().trim().min(1, "Vui lòng nhập tên người nhận"),
  shippingAddress: z.string().trim().min(1, "Vui lòng nhập địa chỉ giao hàng"),
  creatorName: z.string().optional().default(""),
  items: z.array(ExportItemSchema).min(1, "Chọn ít nhất 1 SP"),
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
  const canCreateExport = hasPermission(P.EXPORT_CREATE);
  const warehouseId = useAuthStore((state) => state.warehouseId);
  const currentUserBranch = currentUser?.branch as
    | { id?: number; name?: string; branchType?: string; branchCode?: string }
    | undefined;

  const [isReadOnly, setIsReadOnly] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(isEditMode);

  const [branches, setBranches] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [allProducts, setAllProducts] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [isLoadingSearch, setIsLoadingSearch] = useState(false);
  const [selectedProductIds, setSelectedProductIds] = useState<
    (number | string)[]
  >([]);
  const [returnSourceLocked, setReturnSourceLocked] = useState(false);
  const [returnSourceBranchName, setReturnSourceBranchName] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  const normalizeLookupText = (value: unknown) =>
    String(value ?? "")
      .trim()
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");

  const isWarehouseOption = (branch: any) => {
    if (!branch) return false;
    const code = String(branch.branchCode || "").toUpperCase();
    const type = String(branch.branchType || "").toUpperCase();
    const name = normalizeLookupText(branch.name);
    if (code === "SYSTEM_DEFECT") return false;
    if (code === "MAIN_WH") return true;
    return type === "WAREHOUSE" || name.includes("kho tong");
  };

  const currentUserBranchFromList = React.useMemo(() => {
    const currentBranchId = currentUserBranch?.id ?? warehouseId;
    return branches.find((branch: any) => {
      if (currentBranchId && String(branch.id) === String(currentBranchId)) {
        return true;
      }

      const currentName = normalizeLookupText(currentUserBranch?.name);
      if (!currentName) return false;
      return (
        normalizeLookupText(branch.name || branch.branchName) === currentName
      );
    });
  }, [branches, currentUserBranch?.id, currentUserBranch?.name, warehouseId]);

  const isWarehouseBranch =
    isWarehouseOption(currentUserBranch) ||
    isWarehouseOption(currentUserBranchFromList);

  const resolveReceiptBranchId = (receipt: any, branchList: any[]) => {
    const rawBranchId = receipt.branchId || receipt.branch?.id;
    if (rawBranchId) return String(rawBranchId);

    const receiptBranchName = normalizeLookupText(
      receipt.branchName || receipt.branch?.name,
    );
    if (!receiptBranchName) return "";

    const matchedBranch = branchList.find((branch: any) => {
      const branchName = normalizeLookupText(branch.name);
      const branchCode = normalizeLookupText(branch.branchCode);
      return (
        branchName === receiptBranchName ||
        branchName.includes(receiptBranchName) ||
        receiptBranchName.includes(branchName) ||
        (branchCode && receiptBranchName.includes(branchCode))
      );
    });
    return matchedBranch?.id ? String(matchedBranch.id) : "";
  };

  const extractDefectiveReason = (item: any) => {
    const text = String(
      item?.rejectedNote ||
        item?.rejectionNote ||
        item?.rejectReason ||
        item?.defectNote ||
        item?.returnReason ||
        item?.reason ||
        item?.note ||
        "",
    ).trim();
    return text || "Trả hàng lỗi từ phiếu nhập";
  };

  const mapDefectiveItemToExportItem = (item: any) => ({
    productVariantId: Number(
      item.variantId ?? item.productVariantId ?? item.id,
    ),
    sku: item.sku,
    name: `${item.productName || item.name || "Sản phẩm"}${item.receiptCode ? ` - Phiếu nhập ${item.receiptCode}` : ""}`,
    unit: item.unit || "Cái",
    stock: Number(item.defectiveQuantity || 0),
    quantity: Number(item.defectiveQuantity || 0),
    price: Number(item.importPrice || item.price || 0),
    returnReason: extractDefectiveReason(item),
    lotNumber: item.batchNumber || item.lotNumber || "",
    receiptCode: item.receiptCode || "",
    receiptId: item.receiptId ? Number(item.receiptId) : undefined,
  });

  const generateNoteCode = () => {
    const prefix = "LXT";
    const dateString = `${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, "0")}`;
    const randomSuffix = Math.floor(Math.random() * 1000)
      .toString()
      .padStart(3, "0");
    return `${prefix}-${dateString}-${randomSuffix}`;
  };

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    reset,
    setError,
    clearErrors,
    formState: { errors },
  } = useForm<ExportCommandFormValues>({
    resolver: zodResolver(ExportCommandSchema),
    mode: "onTouched",
    defaultValues: {
      exportType: "RETURN",
      noteCode: generateNoteCode(),
      note: "",
      expectedDate: new Date().toLocaleDateString("en-CA"),
      branchId: "",
      targetId: "",
      specificReceiver: "",
      shippingAddress: "",
      referenceCode: "",
      creatorName: "",
      items: [],
    },
  });

  const { fields, append, remove, replace } = useFieldArray({
    control,
    name: "items",
  });

  const watchExportType = watch("exportType");
  const watchBranchId = watch("branchId");
  const watchTargetId = watch("targetId");
  const watchItems = watch("items");
  const autoLoadReturnItems =
    watchExportType === "RETURN" && !fromReceiptId && !isEditMode;

  useEffect(() => {
    if (returnSourceLocked && watchBranchId) {
      clearErrors("branchId");
    }
  }, [returnSourceLocked, watchBranchId, clearErrors]);

  useEffect(() => {
    if (isEditMode && exportId) {
      InventoryExportApiService.getExportCommandDetail(exportId)
        .then((data) => {
          if (data.status && data.status !== "PENDING") setIsReadOnly(true);
          reset({
            exportType: "RETURN",
            noteCode: data.code,
            note: data.note || "",
            expectedDate:
              data.entryDate || new Date().toLocaleDateString("en-CA"),
            branchId: data.branchId?.toString() || "",
            targetId: data.supplierId?.toString() || "",
            specificReceiver: data.deliverer || "",
            shippingAddress: data.shippingAddress || "",
            referenceCode: data.referenceCode || "",
            creatorName: data.creatorName || "",
            items: (data.details || []).map((item: any) => ({
              productVariantId: item.productVariantId,
              sku: item.sku,
              name: item.productName || "SP",
              unit: "Cái",
              stock: item.quantityRejected || item.stock || 0,
              quantity: item.quantityRequested,
              price: item.price || 0,
              returnReason: extractDefectiveReason(item),
              lotNumber: item.batchNumber || "",
            })),
          });
          setIsInitialLoading(false);
        })
        .catch(() => {
          toast.error("Không thể tải chi tiết phiếu xuất");
          router.push("/admin/exports");
        });
    }
  }, [isEditMode, exportId, reset, router]);

  useEffect(() => {
    if (!showDropdown) return;
    const fetchProducts = async () => {
      if (!watchBranchId) {
        setError("branchId", {
          type: "manual",
          message: "Vui lòng chọn Kho xuất hàng trước khi tìm sản phẩm",
        });
        setShowDropdown(false);
        return;
      }
      setIsLoadingSearch(true);
      try {
        if (!watchTargetId) {
          setError("targetId", {
            type: "manual",
            message: "Vui lòng chọn nhà cung cấp trước khi tìm lô lỗi",
          });
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
              .some((value) => String(value).toLowerCase().includes(keyword));
          });
        setAllProducts(defectiveBatches);
      } catch {
        toast.error("Không thể tải danh sách lô hàng lỗi");
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
            const warehouseBranches = branchList.filter(isWarehouseOption);
            const preferredWarehouse =
              warehouseBranches.find(
                (branch: any) =>
                  String(branch.id) === String(currentUser?.branch?.id ?? ""),
              ) || warehouseBranches[0];
            if (preferredWarehouse) {
              setValue("branchId", String(preferredWarehouse.id));
            }
          }
        }
        if (resS)
          setSuppliers(
            Array.isArray(resS.content)
              ? resS.content
              : Array.isArray(resS)
                ? resS
                : [],
          );
      } catch {
        toast.error("Lỗi tải danh mục");
      }
    };
    loadMasterData();

    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      )
        setShowDropdown(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [currentUser?.branch?.id, isEditMode, setValue]);

  useEffect(() => {
    if (!isEditMode) {
      setValue("exportType", "RETURN");
      setValue("targetId", "");
      setValue("noteCode", generateNoteCode());
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
  }, [
    watchExportType,
    watchBranchId,
    watchTargetId,
    isEditMode,
    isReadOnly,
    replace,
    returnSourceLocked,
  ]);

  useEffect(() => {
    if (currentUser && !isEditMode) {
      setValue(
        "creatorName",
        currentUser.fullName || currentUser.displayName || "",
      );
    }
  }, [currentUser, isEditMode, setValue]);

  useEffect(() => {
    if (!currentUser) return;
    if (watchExportType !== "RETURN") return;

    if (!canCreateExport) {
      toast.error("Bạn không có quyền tạo phiếu xuất.");
      router.replace("/admin/forbidden");
      return;
    }

    if (!isWarehouseBranch) {
      if (branches.length === 0 && !isWarehouseOption(currentUserBranch)) {
        return;
      }

      toast.error("Chỉ kho tổng mới được tạo phiếu xuất trả nhà cung cấp.");
      router.replace("/admin/forbidden");
    }
  }, [
    branches.length,
    canCreateExport,
    currentUser,
    currentUserBranch,
    isWarehouseBranch,
    router,
    watchExportType,
  ]);

  useEffect(() => {
    if (
      isEditMode ||
      !fromReceiptId ||
      suppliers.length === 0 ||
      branches.length === 0
    )
      return;

    let cancelled = false;
    (async () => {
      try {
        const receipt =
          await InventoryApiService.getReceiptDetail(fromReceiptId);
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
            productVariantId: Number(
              item.productVariantId ?? item.variantId ?? item.id,
            ),
            sku: item.productCode || item.sku,
            name: item.productName || item.name,
            unit: item.unit || "Cái",
            stock: Number(item.quantityRejected || 0),
            quantity: Number(item.quantityRejected || 0),
            price: Number(item.importPrice || item.price || 0),
            returnReason: extractDefectiveReason(item),
            lotNumber: item.lotNumber || item.batchNumber || "",
          }));

        if (rejectedItems.length === 0) {
          toast.warning(
            "Phiếu nhập này không có hàng lỗi để tạo phiếu xuất trả.",
          );
          return;
        }

        const receiptBranchId = resolveReceiptBranchId(receipt, branches);
        const receiptBranchName =
          branches.find(
            (branch: any) => String(branch.id) === String(receiptBranchId),
          )?.name ||
          receipt.branchName ||
          receipt.branch?.name ||
          "";

        if (!receiptBranchId) {
          setError("branchId", {
            type: "manual",
            message: "Không xác định được kho nhập của phiếu nhập này.",
          });
          toast.error(
            "Không xác định được kho nhập của phiếu nhập này để lập phiếu xuất trả.",
          );
          return;
        }

        setValue("exportType", "RETURN");
        setValue("branchId", receiptBranchId, {
          shouldDirty: true,
          shouldValidate: true,
        });
        clearErrors("branchId");
        setReturnSourceBranchName(receiptBranchName);
        if (supplier?.id) {
          setValue("targetId", String(supplier.id), {
            shouldDirty: true,
            shouldValidate: true,
          });
          clearErrors("targetId");
        }
        setValue(
          "note",
          `Xuất trả NCC từ phiếu nhập ${receipt.receiptCode || receipt.code || fromReceiptId}`,
        );
        replace(rejectedItems);
        setReturnSourceLocked(true);
      } catch {
        toast.error("Không thể khởi tạo phiếu xuất trả từ phiếu nhập đã chọn.");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [fromReceiptId, suppliers, branches, isEditMode, replace, setValue]);

  useEffect(() => {
    if (isEditMode || fromReceiptId || returnSourceLocked || isReadOnly) return;
    if (watchExportType !== "RETURN") return;

    if (!watchBranchId || !watchTargetId) {
      setAllProducts([]);
      replace([]);
      return;
    }

    let cancelled = false;
    (async () => {
      setIsLoadingSearch(true);
      try {
        const results = await InventoryExportApiService.getDefectiveItems(
          Number(watchTargetId),
          Number(watchBranchId),
        );
        if (cancelled) return;

        const defectiveItems = (results || []).filter(
          (item: any) => Number(item.defectiveQuantity || 0) > 0,
        );
        setAllProducts(defectiveItems);
        replace(defectiveItems.map(mapDefectiveItemToExportItem));
        setSearchTerm(
          defectiveItems.length > 0 ? "Đã nạp toàn bộ hàng lỗi của NCC" : "",
        );
        setShowDropdown(false);

        if (defectiveItems.length === 0) {
          toast.warning(
            "Không có hàng lỗi của nhà cung cấp này tại kho đã chọn.",
          );
        }
      } catch {
        if (!cancelled) {
          setAllProducts([]);
          replace([]);
          toast.error(
            "Không thể tải danh sách hàng lỗi theo kho và nhà cung cấp.",
          );
        }
      } finally {
        if (!cancelled) setIsLoadingSearch(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [
    watchBranchId,
    watchTargetId,
    watchExportType,
    isEditMode,
    fromReceiptId,
    returnSourceLocked,
    isReadOnly,
    replace,
  ]);

  let targetInfo = { name: "", phone: "", address: "" };
  if (watchTargetId) {
    const supplier = suppliers.find((s) => s.id?.toString() === watchTargetId);
    if (supplier) {
      targetInfo = {
        name: supplier.contactName || "Người đại diện",
        phone: supplier.phone || "",
        address: supplier.addressDetail || "",
      };
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
    const isDuplicate = watchItems.some(
      (item) =>
        item.productVariantId === variantId &&
        (item.lotNumber || "") === lotNumber,
    );
    if (isDuplicate) {
      toast.warning("Lô hàng lỗi này đã có trong danh sách");
      return;
    }
    append({
      productVariantId: variantId,
      sku: variant.sku,
      name: `${variant.productName || productName} ${lotNumber ? `- Lô ${lotNumber}` : ""}`,
      unit: variant.unit || "Cái",
      stock: Number(variant.defectiveQuantity || 0),
      quantity: Number(variant.defectiveQuantity || 0),
      price: variant.importPrice || variant.price || 0,
      returnReason: variant.reason || "",
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
    `${variant.variantId ?? variant.id}::${variant.batchNumber ?? ""}`;

  const addSelectedVariantsToTable = () => {
    const selectedVariants = allProducts.filter((variant) =>
      selectedProductIds.some(
        (id) => String(id) === getSelectableProductKey(variant),
      ),
    );
    if (selectedVariants.length === 0) {
      toast.warning("Vui lòng chọn ít nhất một sản phẩm");
      return;
    }
    selectedVariants.forEach((variant) =>
      addVariantToTable(variant, variant.productName || "Sản phẩm"),
    );
    setShowDropdown(false);
    setSearchTerm("");
    setSelectedProductIds([]);
  };

  const onSubmit = async (data: ExportCommandFormValues) => {
    if (isReadOnly) return;

    clearErrors("items");
    const resolvedBranchId =
      data.branchId ||
      (returnSourceLocked
        ? resolveReceiptBranchId(
            { branchName: returnSourceBranchName },
            branches,
          )
        : "");
    if (!resolvedBranchId) {
      setError("branchId", {
        type: "manual",
        message: "Không xác định được kho xuất từ phiếu nhập.",
      });
      return;
    }
    if (resolvedBranchId !== data.branchId) {
      setValue("branchId", resolvedBranchId, {
        shouldDirty: true,
        shouldValidate: true,
      });
      clearErrors("branchId");
    }

    const submissionItems =
      data.exportType === "RETURN"
        ? data.items.map((item) => ({
            ...item,
            quantity: Number(item.stock) || Number(item.quantity) || 0,
          }))
        : data.items;
    const invalidIndex = submissionItems.findIndex(
      (item) => item.quantity > item.stock,
    );
    const invalidItems =
      invalidIndex >= 0 ? [submissionItems[invalidIndex]] : [];
    if (invalidItems.length > 0) {
      setError(`items.${invalidIndex}.quantity`, {
        type: "manual",
        message: `Số lượng xuất không được vượt quá tồn kho hiện tại (${invalidItems[0].stock}).`,
      });
      return;
    }

    const currentUserId = currentUser?.id;
    const payload = {
      code: data.noteCode,
      exportType: data.exportType,
      note: data.note,
      expectedDate: data.expectedDate,
      branchId: parseInt(resolvedBranchId),
      supplierId: data.exportType === "RETURN" ? parseInt(data.targetId) : null,
      targetBranchId: null,
      specificReceiver: data.specificReceiver,
      shippingAddress: data.shippingAddress,
      createdById: currentUserId,
      details: submissionItems.map((it) => ({
        productVariantId: it.productVariantId,
        requestedQuantity: it.quantity,
        batchNumber: it.lotNumber || null,
        defectiveQuantity: data.exportType === "RETURN" ? it.quantity : 0,
        plannedQuantity: data.exportType === "RETURN" ? it.quantity : null,
        price: it.price,
        note: data.exportType === "RETURN" ? it.returnReason : "",
      })),
    };

    setIsSubmitting(true);
    try {
      if (isEditMode) {
        await InventoryExportApiService.updateExportCommand(
          exportId as string,
          payload,
        );
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
      <div className="flex min-h-[60vh] flex-col items-center justify-center text-slate-400">
        <div className="text-center">
          <Loader2
            className="mx-auto mb-3 animate-spin text-blue-600"
            size={30}
          />
          <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-500">
            Đang tải dữ liệu...
          </p>
        </div>
      </div>
    );
  }

  const fieldLabelClass = "text-[10.5px] font-semibold text-slate-500";
  const fieldControlClass =
    "h-[38px] text-[13px] font-normal text-slate-800 shadow-none placeholder:text-slate-400";
  const selectTriggerClass =
    "h-[38px] text-[13px] font-normal text-slate-800 data-[placeholder]:text-slate-400";

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className={`space-y-3 pb-[100px] text-slate-800 ${isReadOnly ? "select-none opacity-95" : ""}`}
    >
      <div className="mt-2 mb-8 space-y-4 px-1">
        <div className="flex items-center gap-3">
          <h1 className="text-[20px] font-semibold uppercase tracking-tight text-slate-900">
            {isEditMode
              ? "Chi tiết phiếu xuất trả NCC"
              : "Tạo phiếu xuất trả NCC"}
          </h1>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 px-1 lg:grid-cols-12">
        <div className="contents">
          <div className="order-1 border border-slate-200 bg-white p-6 shadow-sm lg:col-span-12">
            <div className="border-b border-slate-200 pb-3">
              <span className="text-[11px] font-bold text-slate-800">
                1. Thông tin lệnh xuất kho
              </span>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-12">
              <div className="space-y-1.5 md:col-span-3">
                <Label className={fieldLabelClass}>Loại lệnh xuất *</Label>
                <Input
                  value="Xuất trả nhà cung cấp"
                  readOnly
                  className={cn(
                    fieldControlClass,
                    "w-full border-slate-200 bg-slate-50 text-slate-600",
                  )}
                />
              </div>

              <div className="space-y-1.5 md:col-span-3">
                <Label className={fieldLabelClass}>Mã phiếu hệ thống</Label>
                <Input
                  {...register("noteCode")}
                  readOnly
                  className={cn(
                    fieldControlClass,
                    "w-full border-slate-200 bg-slate-50 text-slate-500",
                  )}
                />
              </div>

              <div className="space-y-1.5 md:col-span-3">
                <Label className={fieldLabelClass}>Ngày hẹn xuất</Label>
                <Input
                  readOnly={isReadOnly}
                  type="date"
                  {...register("expectedDate")}
                  className={cn(
                    fieldControlClass,
                    "w-full border-slate-200",
                    errors.expectedDate && "border-rose-500",
                    isReadOnly && "bg-slate-50",
                  )}
                />
                {errors.expectedDate && (
                  <p className="text-rose-500 text-[10px] mt-1">
                    {errors.expectedDate.message}
                  </p>
                )}
              </div>

              <div className="space-y-1.5 md:col-span-3">
                <Label className={fieldLabelClass}>Lý do / Diễn giải *</Label>
                <Input
                  readOnly={isReadOnly}
                  {...register("note")}
                  className={cn(
                    fieldControlClass,
                    "w-full",
                    errors.note ? "border-rose-500" : "border-slate-200",
                    isReadOnly && "bg-slate-50",
                  )}
                  placeholder="Nhập lý do xuất kho..."
                />
                {errors.note && (
                  <p className="text-rose-500 text-[10px] mt-1">
                    {errors.note.message}
                  </p>
                )}
              </div>

              <div className="space-y-1.5 md:col-span-3">
                <Label className={fieldLabelClass}>
                  {returnSourceLocked
                    ? "Kho xuất hàng *"
                    : "Kho tổng xuất hàng *"}
                </Label>
                {returnSourceLocked ? (
                  <>
                    <input
                      type="hidden"
                      {...register("branchId")}
                      value={watchBranchId}
                      readOnly
                    />
                    <Input
                      readOnly
                      value={
                        returnSourceBranchName ||
                        branches.find(
                          (branch: any) =>
                            String(branch.id) === String(watchBranchId),
                        )?.name ||
                        ""
                      }
                      className={cn(
                        fieldControlClass,
                        "w-full border-slate-200 bg-slate-50 text-slate-600",
                      )}
                    />
                  </>
                ) : (
                  <Controller
                    name="branchId"
                    control={control}
                    render={({ field }) => (
                      <Select
                        onValueChange={(value) => {
                          field.onChange(value);
                          clearErrors("branchId");
                        }}
                        value={field.value}
                        disabled={isReadOnly || returnSourceLocked}
                      >
                        <SelectTrigger
                          className={cn(
                            selectTriggerClass,
                            errors.branchId
                              ? "border-rose-500"
                              : "border-slate-200",
                            "bg-slate-50",
                          )}
                        >
                          <SelectValue
                            placeholder={
                              returnSourceLocked
                                ? returnSourceBranchName || "-- KHO XUẤT --"
                                : "-- KHO TỔNG --"
                            }
                          />
                        </SelectTrigger>
                        <SelectContent className="rounded-md">
                          {field.value &&
                            !branches.some(
                              (b: any) =>
                                isWarehouseOption(b) &&
                                String(b.id) === String(field.value),
                            ) &&
                            branches
                              .filter(
                                (b: any) =>
                                  String(b.id) === String(field.value),
                              )
                              .map((b: any) => (
                                <SelectItem key={b.id} value={b.id.toString()}>
                                  {b.name.toUpperCase()}
                                </SelectItem>
                              ))}
                          {branches.filter(isWarehouseOption).map((b: any) => (
                            <SelectItem key={b.id} value={b.id.toString()}>
                              {b.name.toUpperCase()}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                )}
                {!returnSourceLocked && errors.branchId && (
                  <p className="mt-1 text-[10px] text-rose-500">
                    {errors.branchId.message}
                  </p>
                )}
              </div>

              <div className="space-y-1.5 md:col-span-3">
                <Label className={fieldLabelClass}>Chọn đối tượng nhận *</Label>
                <Controller
                  name="targetId"
                  control={control}
                  render={({ field }) => (
                    <Select
                      onValueChange={(value) => {
                        field.onChange(value);
                        clearErrors("targetId");
                      }}
                      value={field.value}
                      disabled={isReadOnly || isEditMode || returnSourceLocked}
                    >
                      <SelectTrigger
                        className={cn(
                          selectTriggerClass,
                          errors.targetId
                            ? "border-rose-500"
                            : "border-slate-200",
                        )}
                      >
                        <SelectValue placeholder="-- Chọn đối tượng --" />
                      </SelectTrigger>
                      <SelectContent className="rounded-md">
                        {suppliers.map((supplier) => (
                          <SelectItem
                            key={supplier.id}
                            value={supplier?.id?.toString() || ""}
                          >
                            {supplier.name?.toUpperCase()}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.targetId && (
                  <p className="mt-1 text-[10px] text-rose-500">
                    {errors.targetId.message}
                  </p>
                )}
              </div>

              <div className="space-y-1.5 md:col-span-3">
                <Label className={fieldLabelClass}>Tên người nhận *</Label>
                <Input
                  readOnly={isReadOnly}
                  {...register("specificReceiver")}
                  className={cn(
                    fieldControlClass,
                    errors.specificReceiver
                      ? "border-rose-500"
                      : "border-slate-200",
                    isReadOnly && "bg-slate-50",
                  )}
                  placeholder="Tên người nhận..."
                />
                {errors.specificReceiver && (
                  <p className="mt-1 text-[10px] text-rose-500">
                    {errors.specificReceiver.message}
                  </p>
                )}
              </div>

              <div className="space-y-1.5 md:col-span-3">
                <Label className={fieldLabelClass}>Địa chỉ giao hàng *</Label>
                <Input
                  readOnly={isReadOnly}
                  {...register("shippingAddress")}
                  className={cn(
                    fieldControlClass,
                    errors.shippingAddress
                      ? "border-rose-500"
                      : "border-slate-200",
                    isReadOnly && "bg-slate-50",
                  )}
                  placeholder="Địa chỉ giao hàng thực tế..."
                />
                {errors.shippingAddress && (
                  <p className="mt-1 text-[10px] text-rose-500">
                    {errors.shippingAddress.message}
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="order-2 overflow-visible border border-slate-200 bg-white shadow-sm lg:col-span-12">
            <div className="flex flex-wrap items-center gap-4 border-b border-slate-200 px-6 py-4">
              <h3 className="whitespace-nowrap text-[11px] font-bold text-slate-800">
                2. Danh sách sản phẩm xuất
              </h3>

              <div className="relative flex-1 min-w-[300px]" ref={dropdownRef}>
                <div className="relative">
                  {!isReadOnly &&
                    !returnSourceLocked &&
                    !autoLoadReturnItems && (
                      <Search
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                        size={16}
                      />
                    )}
                  <Input
                    readOnly={
                      isReadOnly || returnSourceLocked || autoLoadReturnItems
                    }
                    placeholder={
                      isReadOnly
                        ? "Phiếu đã xuất"
                        : returnSourceLocked
                          ? "Danh sách hàng lỗi đã được nạp từ phiếu nhập"
                          : watchExportType === "RETURN"
                            ? "Tìm theo mã lô lỗi, SKU, tên sản phẩm..."
                            : "Tìm theo mã lô lỗi, SKU, tên sản phẩm..."
                    }
                    className={cn(
                      fieldControlClass,
                      "w-full border-slate-200 bg-white pl-10",
                      (isReadOnly ||
                        returnSourceLocked ||
                        autoLoadReturnItems) &&
                        "bg-slate-50",
                    )}
                    value={searchTerm}
                    onChange={(e) => {
                      if (autoLoadReturnItems) return;
                      setSearchTerm(e.target.value);
                      setShowDropdown(true);
                    }}
                    onFocus={() => {
                      if (!returnSourceLocked && !autoLoadReturnItems)
                        setShowDropdown(true);
                    }}
                  />
                </div>

                {showDropdown &&
                  !isReadOnly &&
                  !returnSourceLocked &&
                  !autoLoadReturnItems && (
                    <div className="absolute left-0 top-full z-[9999] mt-1 flex w-full flex-col overflow-hidden rounded-md border border-slate-200 bg-white shadow-2xl">
                      {allProducts.length > 0 && (
                        <div className="flex items-center justify-between gap-3 border-b bg-slate-50 px-3 py-2 text-xs">
                          <span className="text-slate-500">
                            Đã chọn{" "}
                            <span className="font-bold text-slate-700">
                              {selectedProductIds.length}
                            </span>{" "}
                            sản phẩm
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
                              onClick={() =>
                                addVariantToTable(
                                  variant,
                                  variant.productName || "Sản phẩm",
                                )
                              }
                            >
                              <div className="flex items-center gap-3">
                                <div
                                  onClick={(e) => e.stopPropagation()}
                                  className="flex items-center"
                                >
                                  <Checkbox
                                    checked={selectedProductIds.some(
                                      (id) =>
                                        String(id) ===
                                        getSelectableProductKey(variant),
                                    )}
                                    onCheckedChange={() =>
                                      toggleSelectedProduct(
                                        getSelectableProductKey(variant),
                                      )
                                    }
                                  />
                                </div>
                                <div className="w-10 h-10 bg-white border border-slate-200 rounded-sm overflow-hidden flex items-center justify-center">
                                  {variant.imageUrl ? (
                                    <img
                                      src={variant.imageUrl}
                                      alt={variant.sku}
                                      className="w-full h-full object-cover"
                                    />
                                  ) : (
                                    <Package
                                      size={16}
                                      className="text-slate-300"
                                    />
                                  )}
                                </div>
                                <div>
                                  <p className="text-[13px] font-bold text-slate-800 group-hover:text-blue-600">
                                    {variant.productName || "Sản phẩm"}{" "}
                                    {variant.packaging
                                      ? `- ${variant.packaging}`
                                      : ""}
                                  </p>
                                  <p className="text-[11px] text-slate-500 mt-0.5">
                                    SKU:{" "}
                                    <span className="font-mono text-blue-600">
                                      {variant.sku}
                                    </span>
                                    {watchExportType === "RETURN" &&
                                    variant.batchNumber ? (
                                      <span className="ml-2">
                                        | Lô:{" "}
                                        <span className="font-mono text-rose-600">
                                          {variant.batchNumber}
                                        </span>
                                      </span>
                                    ) : null}
                                  </p>
                                </div>
                              </div>

                              <div className="text-right">
                                <p className="text-[13px] font-bold text-slate-700">
                                  {formatNumber(
                                    variant.importPrice || variant.price || 0,
                                  )}{" "}
                                  VND
                                </p>
                                <p
                                  className={cn(
                                    "text-[11px] font-bold px-2 py-0.5 rounded-sm mt-1 inline-block border",
                                    (watchExportType === "RETURN"
                                      ? variant.defectiveQuantity
                                      : variant.quantity) > 0
                                      ? "text-blue-600 bg-blue-50 border-blue-100"
                                      : "text-rose-600 bg-rose-50 border-rose-100",
                                  )}
                                >
                                  SL lỗi: {variant.defectiveQuantity || 0}
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

            <div className="overflow-x-auto px-3 py-3">
              <Table className="table-custom min-w-[920px] border-collapse">
                <TableHeader className="bg-slate-50">
                  <TableRow className="border-b border-slate-200">
                    <TableHead className="w-[40px] px-1.5 py-2 text-center text-[10px] font-semibold text-slate-700">
                      STT
                    </TableHead>
                    <TableHead className="w-[120px] px-1.5 py-2 text-[10px] font-semibold text-slate-700">
                      Mã SKU
                    </TableHead>
                    <TableHead className="w-[220px] px-1.5 py-2 text-[10px] font-semibold text-slate-700">
                      Tên sản phẩm
                    </TableHead>
                    {watchExportType === "RETURN" && (
                      <TableHead className="w-[120px] px-1.5 py-2 text-[10px] font-semibold text-slate-700">
                        Lô lỗi
                      </TableHead>
                    )}
                    <TableHead className="w-[90px] px-1.5 py-2 text-right text-[10px] font-semibold text-slate-700">
                      SL xuất
                    </TableHead>
                    {watchExportType === "RETURN" && (
                      <TableHead className="min-w-[180px] px-1.5 py-2 text-[10px] font-semibold text-slate-700">
                        Lý do trả hàng
                      </TableHead>
                    )}
                    <TableHead className="w-[100px] px-1.5 py-2 text-right text-[10px] font-semibold text-slate-700">
                      Giá vốn
                    </TableHead>
                    <TableHead className="w-[42px] px-1.5 py-2 text-center text-[10px] font-semibold text-slate-700">
                      Xóa
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {fields.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={watchExportType === "RETURN" ? 8 : 6}
                        className="h-[150px] text-center text-[12px] font-medium text-slate-400"
                      >
                        Chưa có sản phẩm nào được chọn
                      </TableCell>
                    </TableRow>
                  ) : (
                    fields.map((field, index) => {
                      const hasQtyError = errors.items?.[index]?.quantity;
                      const hasReasonError =
                        errors.items?.[index]?.returnReason;
                      const currentItem = watchItems[index] as any;

                      return (
                        <React.Fragment key={field.id}>
                          <TableRow className="border-b border-slate-100 hover:bg-sky-50/40">
                            <TableCell className="px-1.5 py-2 text-center text-[11px] font-medium text-slate-500">
                              {index + 1}
                            </TableCell>
                            <TableCell className="px-1.5 py-2 font-mono text-[11px] text-slate-500">
                              {currentItem?.sku}
                            </TableCell>
                            <TableCell className="px-1.5 py-2 text-[11px] font-semibold text-slate-700">
                              {currentItem?.name}
                              <div className="mt-0.5 text-[10px] font-medium text-blue-600">
                                SL lỗi hiện có: {currentItem?.stock || 0}
                              </div>
                            </TableCell>

                            {watchExportType === "RETURN" && (
                              <TableCell className="px-1.5 py-2 font-mono text-[11px] text-amber-700">
                                {currentItem?.lotNumber || "---"}
                              </TableCell>
                            )}

                            <TableCell className="px-1.5 py-1.5">
                              <Input
                                readOnly={
                                  isReadOnly || watchExportType === "RETURN"
                                }
                                type="number"
                                {...register(`items.${index}.quantity`)}
                                className={cn(
                                  "h-7 rounded-md px-2 text-right text-[11px] font-semibold text-slate-700 focus:bg-white",
                                  hasQtyError ||
                                    currentItem?.quantity > currentItem?.stock
                                    ? "border-rose-500"
                                    : "border-blue-200",
                                  isReadOnly || watchExportType === "RETURN"
                                    ? "bg-slate-50 border-transparent"
                                    : "",
                                )}
                              />
                              {/* Cảnh báo vượt tồn kho */}
                              {!isReadOnly &&
                                currentItem?.quantity > currentItem?.stock && (
                                  <div className="text-[10px] text-rose-500 font-bold mt-1 text-right animate-pulse">
                                    Vượt tồn kho!
                                  </div>
                                )}
                            </TableCell>

                            {watchExportType === "RETURN" && (
                              <TableCell className="px-1.5 py-1.5">
                                <Input
                                  readOnly={isReadOnly}
                                  placeholder="Nhập lý do..."
                                  {...register(`items.${index}.returnReason`)}
                                  className={`h-7 rounded-md px-2 text-[11px] focus:bg-white ${hasReasonError ? "border-rose-500" : "border-slate-200"} ${isReadOnly ? "border-transparent bg-slate-50" : ""}`}
                                />
                              </TableCell>
                            )}

                            <TableCell className="px-1.5 py-2 text-right text-[11px] font-medium">
                              {formatNumber(currentItem?.price || 0)}
                            </TableCell>
                            <TableCell className="px-1.5 py-1.5 text-center">
                              {!isReadOnly &&
                                !returnSourceLocked &&
                                !autoLoadReturnItems && (
                                  <button
                                    type="button"
                                    onClick={() => remove(index)}
                                    className="text-slate-300 hover:text-red-500"
                                  >
                                    <Trash2 size={14} />
                                  </button>
                                )}
                            </TableCell>
                          </TableRow>
                          {(hasQtyError || hasReasonError) && (
                            <TableRow className="bg-rose-50">
                              <TableCell
                                colSpan={watchExportType === "RETURN" ? 8 : 6}
                                className="p-1 px-4 text-[11px] text-rose-500 font-bold"
                              >
                                {hasQtyError && (
                                  <span className="mr-4">
                                    • Lỗi SL: {hasQtyError.message}
                                  </span>
                                )}
                                {hasReasonError && (
                                  <span>
                                    • Lỗi Lý do: {hasReasonError.message}
                                  </span>
                                )}
                              </TableCell>
                            </TableRow>
                          )}
                        </React.Fragment>
                      );
                    })
                  )}
                </TableBody>
              </Table>
              {errors.items?.root && (
                <div className="p-3 text-[12px] text-rose-500 bg-rose-50 font-bold border-t border-rose-100">
                  {errors.items.root.message}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 z-[999] border-t border-slate-200 bg-white px-4 py-3 lg:left-[260px]">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-wrap items-center gap-4 text-[11px] font-medium text-slate-400">
            <span>
              Tổng số lượng:{" "}
              <span className="text-[14px] font-semibold tracking-normal text-slate-800">
                {watchItems.reduce(
                  (acc, i) => acc + (Number(i.quantity) || 0),
                  0,
                )}
              </span>
            </span>
            <div className="hidden h-4 w-px bg-slate-300 md:block"></div>
            <span>
              Tổng giá trị:{" "}
              <span className="text-[14px] font-semibold tracking-normal text-blue-600">
                {formatNumber(
                  watchItems.reduce(
                    (acc, i) =>
                      acc + (Number(i.quantity) || 0) * (Number(i.price) || 0),
                    0,
                  ),
                )}{" "}
                VND
              </span>
            </span>
          </div>
          <div className="flex flex-wrap justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              className="h-10 min-w-[110px] rounded-md border-slate-300 bg-white px-6 text-slate-600 hover:bg-slate-50"
              onClick={() => router.back()}
            >
              {isReadOnly ? "Quay lại" : "Hủy bỏ"}
            </Button>
            {!isReadOnly && (
              <Button
                type="submit"
                disabled={isSubmitting}
                className="h-10 min-w-[180px] rounded-md bg-blue-600 px-6 font-semibold text-white hover:bg-blue-700"
              >
                {isSubmitting ? (
                  <Loader2 className="animate-spin mr-2" />
                ) : (
                  <>
                    <Save size={16} className="mr-2" />
                    {isAdmin ? "Lưu & duyệt phiếu trả" : "Lưu & gửi duyệt"}
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </div>
    </form>
  );
}

export default function Page() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[60vh] items-center justify-center">
          <Loader2 className="animate-spin text-blue-600" size={30} />
        </div>
      }
    >
      <AdminExportFormContent />
    </Suspense>
  );
}
