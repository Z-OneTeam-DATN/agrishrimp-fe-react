"use client";

import React, { useState, useEffect, useRef, Suspense, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm, Controller, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Search,
  Trash2,
  Save,
  Loader2,
  Clock,
  FileUp,
  AlertCircle,
  Ban,
  FileText,
} from "lucide-react";
import { SharedDatePicker } from "@/components/admin/shared/BirthDatePicker";
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
import { ReceiptSchema, Receipt } from "@/app/types/inventory.schema";
import { toast } from "sonner";
import { cn, formatNumber } from "@/lib/utils";
import { getErrorMessage } from "@/lib/axios";

import { supplierService } from "@/app/services/supplier.service";
import { Supplier } from "@/app/types/supplier.type";
import { branchService } from "@/app/services/branchService";
import { ProductService } from "@/app/services/product.service";
import { InventoryApiService } from "@/app/services/inventory.service";
import { PurchaseRequestApiService } from "@/app/services/purchase.service";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { usePermissions } from "@/hooks/usePermissions";
import { useAuthStore } from "@/stores/useAuthStore";
import { P } from "@/lib/permissions";

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

function normalizeLookupText(value: unknown) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function isWarehouseBranchLike(branch: any) {
  const code = String(branch?.branchCode || branch?.code || "").trim().toUpperCase();
  const type = String(branch?.branchType || branch?.type || "").trim().toUpperCase();
  const name = normalizeLookupText(branch?.name || branch?.branchName);

  if (code === "SYSTEM_DEFECT") return false;
  if (code === "MAIN_WH") return true;
  if (type === "WAREHOUSE") return true;

  return name.includes("kho tong") || name.includes("warehouse");
}

const MAX_EXPIRY_PICKER_DATE = new Date(new Date().getFullYear() + 50, 11, 31);

function AdminReceiptFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const receiptId = searchParams.get("id");
  const purchaseRequestIdParam = searchParams.get("purchaseRequestId");
  const supplierCodeParam = searchParams.get("supplierCode");
  const branchNameParam = searchParams.get("branchName");
  const isEditMode = Boolean(receiptId);
  const isCreateFromPurchaseRequest =
    !isEditMode && Boolean(purchaseRequestIdParam);
  const hasFetched = useRef(false);
  const hasPrefilledPurchaseRequest = useRef(false);

  const { data: currentUser } = useCurrentUser();
  const { hasPermission } = usePermissions();
  const warehouseId = useAuthStore((state) => state.warehouseId);
  const canCreateReceipt = hasPermission(P.IMPORT_CREATE);
  const canUpdateReceipt = hasPermission(P.IMPORT_UPDATE);
  const isAdmin = hasPermission(P.IMPORT_APPROVE);
  const currentUserBranch = currentUser?.branch as
    | { id?: number; name?: string; branchType?: string; branchCode?: string }
    | undefined;

  const [isReadOnly, setIsReadOnly] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(
    isEditMode || isCreateFromPurchaseRequest,
  );
  const [linkedPurchaseRequestMeta, setLinkedPurchaseRequestMeta] = useState<{
    id: number;
    code: string;
  } | null>(null);

  // AlertDialog State
  const [confirmConfig, setConfirmConfig] = useState<{
    open: boolean;
    title: string;
    description: string;
    action: () => void;
    variant?: "default" | "destructive";
  }>({
    open: false,
    title: "",
    description: "",
    action: () => {},
  });

  const showConfirm = (
    title: string,
    description: string,
    action: () => void,
    variant: "default" | "destructive" = "default",
  ) => {
    setConfirmConfig({ open: true, title, description, action, variant });
  };

  const generateLotNumber = () => {
    const now = new Date();
    const datePart = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}`;
    const timePart = `${String(now.getHours()).padStart(2, "0")}${String(now.getMinutes()).padStart(2, "0")}${String(now.getSeconds()).padStart(2, "0")}`;
    const randomPart = Math.floor(Math.random() * 1000)
      .toString()
      .padStart(3, "0");
    return `LO-${datePart}-${timePart}-${randomPart}`;
  };

  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [isLoadingSuppliers, setIsLoadingSuppliers] = useState(false);
  const [searchSupplierText, setSearchSupplierText] = useState("");
  const [isSupplierDropdownOpen, setIsSupplierDropdownOpen] = useState(false);
  const [, setSelectedSupplier] = useState<Supplier | null>(
    null,
  );

  const [branches, setBranches] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);
  const [searchProductText, setSearchProductText] = useState("");
  const [isProductDropdownOpen, setIsProductDropdownOpen] = useState(false);
  const [selectedProductIds, setSelectedProductIds] = useState<(number | string)[]>([]);
  const [noteExpandedRows, setNoteExpandedRows] = useState<Record<string, boolean>>({});

  const currentUserBranchFromList = useMemo(() => {
    const currentBranchId = currentUserBranch?.id ?? warehouseId;
    return branches.find((branch: any) => {
      if (currentBranchId && String(branch.id) === String(currentBranchId)) {
        return true;
      }

      const currentName = normalizeLookupText(currentUserBranch?.name);
      if (!currentName) return false;
      return normalizeLookupText(branch.name || branch.branchName) === currentName;
    });
  }, [branches, currentUserBranch?.id, currentUserBranch?.name, warehouseId]);

  const isWarehouseBranch =
    isWarehouseBranchLike(currentUserBranch) ||
    isWarehouseBranchLike(currentUserBranchFromList);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    control,
    setValue,
    setError,
    clearErrors,
    watch,
    getValues,
    reset,
    formState: { errors },
  } = useForm<Receipt>({
    resolver: zodResolver(ReceiptSchema),
    mode: "onTouched",
    defaultValues: {
      importType: "SUPPLIER",
      purchaseRequestCode: "",
      receiptCode: "PNK" + Date.now().toString().slice(-6),
      branchName: "",
      status: "PENDING",
      entryDate: new Date().toISOString().slice(0, 10),
      items: [],
      paymentAmount: 0,
      deliverer: "",
      creator: "",
    },
  });

  useEffect(() => {
    if (currentUser && !isEditMode) {
      setValue(
        "creator",
        currentUser.fullName || currentUser.displayName || "",
      );
    }
  }, [currentUser, isEditMode, setValue]);

  useEffect(() => {
    if (!currentUser) return;
    if (isEditMode) {
      if (!canUpdateReceipt) {
        toast.error("Bạn không có quyền sửa phiếu nhập.");
        router.replace("/admin/forbidden");
      }
      return;
    }

    if (!canCreateReceipt) {
      toast.error("Bạn không có quyền tạo phiếu nhập.");
      router.replace("/admin/forbidden");
      return;
    }

    if (!isWarehouseBranch) {
      if (branches.length === 0 && !isWarehouseBranchLike(currentUserBranch)) {
        return;
      }

      toast.error("Chỉ kho tổng mới được lập phiếu nhập từ nhà cung cấp.");
      router.replace("/admin/forbidden");
    }
  }, [branches.length, canCreateReceipt, canUpdateReceipt, currentUser, currentUserBranch, isEditMode, isWarehouseBranch, router]);

  const { fields, append, remove } = useFieldArray({
    control,
    name: "items",
  });
  const watchItems = watch("items") || [];
  const watchPurchaseRequestId = watch("purchaseRequestId");
  const watchStatus = watch("status") || "PENDING";
  const currentTargetBranch = watch("branchName");
  const watchEntryDate = watch("entryDate");

  const isInfoReadOnly =
    isReadOnly || (isEditMode && (watchStatus || "").toUpperCase() !== "PENDING");
  const isLinkedPurchaseRequest = Boolean(watchPurchaseRequestId);
  const isMissingPurchaseRequestLink = !isEditMode && !isLinkedPurchaseRequest;
  const isMasterDataLocked = isInfoReadOnly || isLinkedPurchaseRequest;
  const isItemSourceLocked = isInfoReadOnly || isLinkedPurchaseRequest;
  const tableColCount = 5;

  useEffect(() => {
    if (!isInitialLoading && isMissingPurchaseRequestLink) {
      router.replace("/admin/receipts/select-request");
    }
  }, [isInitialLoading, isMissingPurchaseRequestLink, router]);

  const normalizeBranchValue = (value?: string | null) =>
    (value || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .trim()
      .toLowerCase();

  const selectedDestBranch = useMemo(() => {
    return branches.find(
      (b) => {
        const branchDisplayName = b.name || b.branchName || b.id.toString();
        return (
          branchDisplayName === currentTargetBranch ||
          normalizeBranchValue(branchDisplayName) ===
            normalizeBranchValue(currentTargetBranch)
        );
      },
    );
  }, [branches, currentTargetBranch]);

  const branchSelectOptions = useMemo(() => {
    const mainWarehouseBranches = branches.filter(
      (b) => b.branchCode === "MAIN_WH",
    );

    if (!isCreateFromPurchaseRequest) {
      return mainWarehouseBranches;
    }

    const linkedBranchName = currentTargetBranch || branchNameParam || "";
    const normalizedLinkedBranchName = normalizeBranchValue(linkedBranchName);

    const matchedBranches = branches.filter((b) => {
      const branchDisplayName = b.name || b.branchName || "";
      return (
        normalizeBranchValue(branchDisplayName) === normalizedLinkedBranchName ||
        normalizeBranchValue(b.branchCode) === normalizedLinkedBranchName
      );
    });

    if (matchedBranches.length > 0) {
      return matchedBranches;
    }

    if (mainWarehouseBranches.length > 0) {
      return mainWarehouseBranches;
    }

    return linkedBranchName
      ? [{ id: linkedBranchName, name: linkedBranchName, branchName: linkedBranchName }]
      : [];
  }, [branches, branchNameParam, currentTargetBranch, isCreateFromPurchaseRequest]);

  const targetBranchId = selectedDestBranch?.id?.toString() || "";

  const subTotal = watchItems.reduce((acc, item) => {
    const qty = Number(item.quantityAccepted) || 0;
    const price = Number(item.importPrice) || 0;
    return acc + qty * price;
  }, 0);
  const rejectedGoodsTotal = watchItems.reduce((acc, item) => {
    const qty = Number(item.quantityRejected) || 0;
    const price = Number(item.importPrice) || 0;
    return acc + qty * price;
  }, 0);
  const batchTotalValue = subTotal + rejectedGoodsTotal;

  const debtAmount = subTotal;

  const validateReceiptItems = (items: Receipt["items"]) => {
    clearErrors("items");
    for (const [index, item] of items.entries()) {
      const plannedQty = Number(item.plannedQuantity) || 0;
      if (plannedQty <= 0) continue;

      const acceptedQty = Number(item.quantityAccepted) || 0;
      const rejectedQty = Number(item.quantityRejected) || 0;

      if (plannedQty < 0 || acceptedQty < 0 || rejectedQty < 0) {
        setError(`items.${index}.quantityAccepted`, {
          type: "manual",
          message: "So luong giao, dat va loi khong duoc am.",
        });
        return false;
      }

      if (acceptedQty + rejectedQty !== plannedQty) {
        setError(`items.${index}.quantityAccepted`, {
          type: "manual",
          message: "Số đạt + số lỗi phải đúng bằng số NCC giao đợt này.",
        });
        setError(`items.${index}.quantityRejected`, {
          type: "manual",
          message: "Số đạt + số lỗi phải đúng bằng số NCC giao đợt này.",
        });
        return false;
      }
    }

    return true;
  };

  // --- Actions ---
  const handleImportExcel = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isItemSourceLocked) return;
    const file = e.target.files?.[0];
    if (!file) return;
    const XLSX = await import("xlsx");
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const bstr = event.target?.result;
        const wb = XLSX.read(bstr, { type: "binary" });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(ws, { header: 1 }) as any[][];
        const headerIndex = rows.findIndex((r) =>
          JSON.stringify(r).toUpperCase().includes("SKU"),
        );
        if (headerIndex === -1) {
          toast.error("Không tìm thấy cột SKU.");
          return;
        }
        const data = XLSX.utils.sheet_to_json(ws, {
          range: headerIndex,
        }) as any[];
        if (!targetBranchId) {
          toast.error("Chọn chi nhánh trước.");
          return;
        }
        const loadingId = toast.loading("Đang xử lý...");
        const tasks = data.map(async (row) => {
          const sku = String(row["SKU"] || row["Mã sản phẩm"] || "").trim();
          if (!sku) return null;
          const apiRes = await ProductService.searchVariants(
            sku,
            targetBranchId,
          );
          const list = Array.isArray(apiRes) ? apiRes : apiRes?.data || [];
          const match = list.find((v: any) => v.sku === sku);
          return match
            ? {
                productCode: match.sku,
                productName: match.productName || "Sản phẩm",
                plannedQuantity: Number(row["Số lượng"] || 1),
                importPrice:
                  row["Giá nhập"] || row["Price"]
                    ? Number(row["Giá nhập"] || row["Price"])
                    : undefined,
                lotNumber:
                  row["Số lô"] ||
                  row["Lot"] ||
                  generateLotNumber(),
                expiryDate: row["Hạn dùng"] || "",
                imageUrl: match.imageUrl || "",
                note: "",
              }
            : null;
        });
        const results = (await Promise.all(tasks)).filter(Boolean);
        append(results as any);
        toast.success(`Đã nhập ${results.length} sản phẩm`, { id: loadingId });
      } catch (err) {
        toast.error("Lỗi đọc file.");
      }
    };
    reader.readAsBinaryString(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSelectProduct = (v: any) => {
    if (isItemSourceLocked) return;
    const idx = (getValues("items") || []).findIndex(
      (i: any) => i.productCode === v.sku,
    );
    if (idx > -1)
      setValue(
        `items.${idx}.plannedQuantity`,
        (Number(watchItems[idx].plannedQuantity) || 0) + 1,
      );
    else
      append({
        productCode: v.sku,
        productName: v.productName || "Sản phẩm",
        plannedQuantity: 1,
        importPrice: undefined,
        lotNumber: generateLotNumber(),
        expiryDate: "",
        imageUrl: v.imageUrl || "",
        note: "",
      } as any);
  };

  const toggleSelectedProduct = (productId: number | string) => {
    setSelectedProductIds((prev) =>
      prev.some((id) => String(id) === String(productId))
        ? prev.filter((id) => String(id) !== String(productId))
        : [...prev, productId],
    );
  };

  const handleAddSelectedProducts = () => {
    if (isItemSourceLocked) return;
    const selectedProducts = products.filter((product) =>
      selectedProductIds.some((id) => String(id) === String(product.id)),
    );
    if (selectedProducts.length === 0) {
      toast.warning("Vui lòng chọn ít nhất một sản phẩm");
      return;
    }
    selectedProducts.forEach((product) => handleSelectProduct(product));
    setIsProductDropdownOpen(false);
    setSearchProductText("");
    setSelectedProductIds([]);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsSupplierDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelectSupplier = (s: Supplier) => {
    if (isMasterDataLocked) return;
    setValue("supplierCode", s.code);
    setValue("supplierName", s.name);
    setSelectedSupplier(s);
    setIsSupplierDropdownOpen(false);
    setSearchSupplierText(s.name);
  };

  const onSaveDraft = async (data: Receipt) => {
    setIsSubmitting(true);
    try {
      const { creator, purchaseRequestCode, ...restOfData } = data;
      if (!validateReceiptItems(data.items)) {
        return;
      }
      const payloadItems = data.items
        .filter((i) => Number(i.plannedQuantity) > 0)
        .map((i) => {
          const acceptedQty = Number(i.quantityAccepted) || 0;
          const rejectedQty = Number(i.quantityRejected) || 0;
          return {
            productCode: i.productCode,
            plannedQuantity: Number(i.plannedQuantity),
            quantityReal: acceptedQty + rejectedQty,
            quantityAccepted: acceptedQty,
            quantityRejected: rejectedQty,
          lotNumber: i.lotNumber || "",
          expiryDate: i.expiryDate || "",
          importPrice: Number(i.importPrice) || 0,
          newSellingPrice: Number(i.newSellingPrice) || 0,
          note: i.note || "",
          };
        });

      const payload = {
        ...restOfData,
        status: isAdmin && !isEditMode ? "APPROVED" : data.status,
        items: payloadItems,
      };
      const savedReceipt = isEditMode
        ? await InventoryApiService.updateReceipt(receiptId!, payload)
        : await InventoryApiService.createReceipt(payload);
      toast.success(
        savedReceipt?.status === "COMPLETED"
          ? "Đã lưu và duyệt phiếu nhập thành công!"
          : savedReceipt?.status === "APPROVED"
            ? "Đã lưu và chuyển phiếu sang trạng thái đã duyệt."
            : "Đã lưu!",
      );
      router.push("/admin/receipts");
    } catch (e) {
      toast.error(getErrorMessage(e as any));
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- Effects ---
  useEffect(() => {
    if (isEditMode && receiptId && !hasFetched.current) {
      hasFetched.current = true;
      (async () => {
        try {
          setIsInitialLoading(true);
          const data = await InventoryApiService.getReceiptDetail(receiptId);
          if (data.status === "COMPLETED" || data.status === "IMPORTED")
            setIsReadOnly(true);

          // Map dữ liệu từ BE sang schema FE một cách an toàn
          const mappedItems = (data.items || []).map((i: any) => ({
            ...i,
            plannedQuantity: i.plannedQuantity || i.quantity || 0,
            acceptedBeforeQuantity:
              i.acceptedBeforeQuantity ||
              Math.max(
                (Number(i.requestedQuantity) || 0) -
                  (Number(i.remainingQuantity) || 0),
                0,
              ),
            quantityReal:
              i.quantityReal ??
              i.quantityActual ??
              0,
            quantityAccepted:
              i.quantityAccepted ??
              0,
            quantityRejected: i.quantityRejected ?? 0,
            importPrice: i.importPrice || i.price || i.unitPrice || i.cost || 0,
            note: i.note || "",
          }));

          reset({
            ...data,
            receiptCode: data.receiptCode || data.code || `PNK-${data.id}`,
            entryDate: data.entryDate?.slice(0, 10),
            deliverer:
              data.deliverer && data.deliverer !== "N/A"
                ? data.deliverer
                : "",
            creator:
              data.creatorName || data.createdByName || data.creator || "",
            items: mappedItems,
          });

          if (data.supplierCode) {
            setSelectedSupplier({
              code: data.supplierCode,
              name: data.supplierName,
            } as any);
            setSearchSupplierText(data.supplierName || "");
          }
          if (data.purchaseRequestId) {
            setLinkedPurchaseRequestMeta({
              id: data.purchaseRequestId,
              code:
                data.purchaseRequestCode ||
                `YCM-${data.purchaseRequestId}`,
            });
          }
        } catch (error) {
          router.push("/admin/receipts");
        } finally {
          setIsInitialLoading(false);
        }
      })();
    }
  }, [isEditMode, receiptId, reset, router]);

  useEffect(() => {
    if (
      isEditMode ||
      !purchaseRequestIdParam ||
      hasPrefilledPurchaseRequest.current
    ) {
      return;
    }

    hasPrefilledPurchaseRequest.current = true;

    (async () => {
      try {
        setIsInitialLoading(true);
        const purchaseRequest =
          await PurchaseRequestApiService.getById(purchaseRequestIdParam);
        const remainingItems = (purchaseRequest.items || []).filter(
          (item) => (item.remainingQty || 0) > 0,
        );

        if (remainingItems.length === 0) {
          toast.warning(
            "Phiếu yêu cầu này không còn mặt hàng nào cần tạo phiếu nhập.",
          );
          router.push(`/admin/purchase-requests/${purchaseRequestIdParam}`);
          return;
        }

        const currentValues = getValues();
        reset({
          ...currentValues,
          purchaseRequestId: purchaseRequest.id,
          purchaseRequestCode: purchaseRequest.code,
          supplierCode: purchaseRequest.supplierCode || supplierCodeParam,
          supplierName: purchaseRequest.supplierName,
          branchName: purchaseRequest.branchName || branchNameParam || "",
          items: remainingItems.map((item) => ({
            productCode: item.productCode,
            productName: item.productName,
            imageUrl: item.imageUrl || "",
            plannedQuantity: 0,
            requestedQuantity: item.requestedQty || 0,
            deliveredQuantity: item.deliveredQty || 0,
            acceptedBeforeQuantity: item.acceptedQty || 0,
            remainingQuantity: item.remainingQty || 0,
            quantityReal: 0,
            quantityAccepted: 0,
            quantityRejected: 0,
            lotNumber: generateLotNumber(),
            expiryDate: "",
            importPrice: Number(item.unitPrice) || 0,
            newSellingPrice: 0,
            note: item.note || "",
          })),
        });

        setSelectedSupplier({
          code: purchaseRequest.supplierCode,
          name: purchaseRequest.supplierName,
        } as any);
        setSearchSupplierText(purchaseRequest.supplierName || "");
        setLinkedPurchaseRequestMeta({
          id: purchaseRequest.id,
          code: purchaseRequest.code,
        });
      } catch (error) {
        toast.error("Không thể nạp dữ liệu từ phiếu yêu cầu mua.");
        router.push("/admin/purchase-requests");
      } finally {
        setIsInitialLoading(false);
      }
    })();
  }, [
    branchNameParam,
    getValues,
    isEditMode,
    purchaseRequestIdParam,
    reset,
    router,
    supplierCodeParam,
  ]);

  useEffect(() => {
    (async () => {
      const data = await branchService.getAll();
      const list = Array.isArray(data) ? data : data.content || [];
      setBranches(list);
      if (!isEditMode && !purchaseRequestIdParam && list.length > 0) {
        const mainWh = list.find((b: any) => b.branchCode === "MAIN_WH");
        if (mainWh) setValue("branchName", mainWh.name || mainWh.branchName);
      }
    })();
  }, [setValue, isEditMode, purchaseRequestIdParam]);

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (!isProductDropdownOpen || !targetBranchId || isItemSourceLocked)
        return;
      setIsLoadingProducts(true);
      try {
        const data = await ProductService.searchVariants(
          searchProductText,
          targetBranchId,
        );
        setProducts(Array.isArray(data) ? data : data?.content || []);
      } finally {
        setIsLoadingProducts(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [
    searchProductText,
    isProductDropdownOpen,
    targetBranchId,
    isItemSourceLocked,
  ]);

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (!isSupplierDropdownOpen || isMasterDataLocked) return;
      setIsLoadingSuppliers(true);
      try {
        const data = await supplierService.getAll(
          searchSupplierText,
          "ACTIVE",
          0,
          20,
        );
        setSuppliers(data.content || []);
      } finally {
        setIsLoadingSuppliers(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchSupplierText, isSupplierDropdownOpen, isMasterDataLocked]);

  const handleReject = async () => {
    if (!receiptId) return;
    showConfirm(
      "Xác nhận từ chối phiếu",
      "Hành động này sẽ từ chối đơn nhập hàng này. Bạn không thể hoàn tác.",
      async () => {
        setIsSubmitting(true);
        try {
          await InventoryApiService.rejectReceipt(receiptId);
          toast.success("Đã từ chối phiếu nhập!");
          router.push("/admin/receipts");
        } catch (e) {
          toast.error(getErrorMessage(e as any));
        } finally {
          setIsSubmitting(false);
        }
      },
      "destructive",
    );
  };

  const onSubmitWithConfirm = (data: Receipt) => {
    if (isMissingPurchaseRequestLink) {
      toast.error("Không thể tạo phiếu nhập nếu chưa có mã phiếu yêu cầu mua.");
      return;
    }

    const title = isAdmin
      ? "Xác nhận lưu và duyệt phiếu"
      : "Xác nhận lưu phiếu chờ duyệt";
    const msg = isAdmin
      ? "Phiếu nhập do người có quyền duyệt tạo sẽ được duyệt ngay. Nếu đã nhập đủ số lượng đạt/lỗi, hệ thống sẽ chốt luôn tồn kho và công nợ nhà cung cấp."
      : "Phiếu nhập sẽ được lưu ở trạng thái chờ duyệt. Khi được duyệt, hệ thống mới cập nhật tồn kho và công nợ.";

    showConfirm(title, msg, () => {
      onSaveDraft(data);
    });
  };

  if (isInitialLoading)
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="animate-spin text-blue-600" size={32} />
      </div>
    );

  if (isMissingPurchaseRequestLink) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="animate-spin text-blue-600" size={32} />
      </div>
    );
  }

  return (
    <div className="min-h-screen space-y-5 px-1 pb-[104px] text-slate-900">
      <div className="pt-2">
        <h1 className="text-[20px] font-semibold uppercase text-slate-900">
          {isEditMode ? "Cập nhật phiếu nhập" : "Thêm phiếu nhập"}
        </h1>
      </div>

      {linkedPurchaseRequestMeta && (
        <div className="flex items-start gap-3 border border-slate-200 bg-white p-4 text-slate-600">
          <AlertCircle size={18} className="shrink-0 mt-0.5" />
          <p className="text-[11.5px] leading-relaxed">
            Đang liên kết với yêu cầu mua <span className="font-semibold text-slate-800">{linkedPurchaseRequestMeta.code}</span>.
            Nhà cung cấp, kho nhận và các mặt hàng còn thiếu đã được nạp tự động.
          </p>
        </div>
      )}

      {/* 2. Information Row (Supplier & Receipt Info) */}
      <div className="border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-6 border-b border-slate-200 pb-4">
          <h2 className="text-[12px] font-semibold text-slate-900">1. Thông tin phiếu nhập</h2>
        </div>
        <div className="grid grid-cols-1 gap-x-5 gap-y-5 md:grid-cols-2 xl:grid-cols-3">
          <div>
          <Label className="mb-2 block text-[10.5px] font-semibold text-slate-500">Nhà cung cấp *</Label>
          <div className="relative" ref={dropdownRef}>
            <Search
              className="absolute left-3 top-3 text-slate-400"
              size={16}
            />
            <Input
              className={cn(
                "h-10 border-slate-200 pl-10 text-[13px] shadow-none",
                errors.supplierCode && "border-rose-500",
              )}
              placeholder="Tìm theo tên hoặc mã nhà cung cấp..."
              value={searchSupplierText}
              onChange={(e) => {
                setSearchSupplierText(e.target.value);
                setIsSupplierDropdownOpen(true);
              }}
              onFocus={() => setIsSupplierDropdownOpen(true)}
              disabled={isMasterDataLocked}
            />
            {isSupplierDropdownOpen && !isMasterDataLocked && (
              <div className="absolute top-full left-0 w-full mt-1 bg-white border shadow-xl z-50 max-h-40 overflow-auto text-xs">
                {isLoadingSuppliers ? (
                  <div className="p-3 text-center text-slate-400">
                    Đang tải...
                  </div>
                ) : suppliers.length > 0 ? (
                  suppliers.map((s) => (
                    <div
                      key={s.id}
                      className="p-2 border-b hover:bg-slate-50 cursor-pointer"
                      onClick={() => handleSelectSupplier(s)}
                    >
                      <p className="font-medium">{s.name}</p>
                      <p className="text-[10px] text-slate-400">#{s.code}</p>
                    </div>
                  ))
                ) : (
                  <div className="p-3 text-center text-slate-400">
                    Không tìm thấy NCC
                  </div>
                )}
              </div>
            )}
          </div>
          {errors.supplierCode && (
            <p className="mt-1 text-[10px] font-medium text-rose-500">
              {errors.supplierCode.message}
            </p>
          )}
        </div>

          <div>
            <Label className="mb-2 block text-[10.5px] font-semibold text-slate-500">
              Chi nhánh nhập (*)
            </Label>
            <div>
              <Controller
                name="branchName"
                control={control}
                rules={{ required: "Vui lòng chọn chi nhánh nhập" }}
                render={({ field }) => (
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                    disabled={isInfoReadOnly}
                  >
                    <SelectTrigger className="h-10 border-slate-200 text-[13px] shadow-none">
                      <SelectValue placeholder="-- Chọn chi nhánh nhập --" />
                    </SelectTrigger>
                    <SelectContent>
                      {branchSelectOptions.map((b) => (
                        <SelectItem
                          key={b.id}
                          value={b.name || b.branchName}
                          className="text-[12px]"
                        >
                          {b.name || b.branchName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.branchName && (
                <p className="text-[10px] text-rose-500 mt-1">
                  {errors.branchName.message}
                </p>
              )}
            </div>
          </div>

          <div>
            <Label className="mb-2 block text-[10.5px] font-semibold text-slate-500">
              Mã phiếu
            </Label>
            <Input
              readOnly
              {...register("receiptCode")}
              className="h-10 border-slate-200 bg-slate-50 text-[13px] text-slate-500"
            />
          </div>
          <div>
            <Label className="mb-2 block text-[10.5px] font-semibold text-slate-500">
              Mã phiếu yêu cầu
            </Label>
            <Input
              readOnly
              value={linkedPurchaseRequestMeta?.code || watch("purchaseRequestCode") || "Chưa liên kết"}
              className="h-10 border-slate-200 bg-slate-50 text-[13px] text-slate-500"
            />
          </div>
          <div>
            <Label className="mb-2 block text-[10.5px] font-semibold text-slate-500">
              Ngày nhập
            </Label>
            <input type="hidden" {...register("entryDate")} />
            <SharedDatePicker
              value={watchEntryDate}
              disabled={isInfoReadOnly}
              onChange={(nextValue) =>
                setValue("entryDate", nextValue, {
                  shouldDirty: true,
                  shouldValidate: true,
                  shouldTouch: true,
                })
              }
              placeholder="Chọn ngày nhập"
              variant="compact"
              buttonClassName="h-10 w-full border border-slate-200 bg-white text-[13px]"
            />
          </div>
          <div>
            <Label className="mb-2 block text-[10.5px] font-semibold text-slate-500">
              Người giao hàng *
            </Label>
            <Input
              {...register("deliverer")}
              disabled={isInfoReadOnly}
              placeholder="Nhập tên người giao hàng"
              className={cn(
                "h-10 border-slate-200 text-[13px] shadow-none",
                errors.deliverer && "border-rose-500",
              )}
            />
            {errors.deliverer && (
              <p className="mt-1 text-[10px] text-rose-500">
                {errors.deliverer.message}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* 3. Product Entry & Table */}
      <div className="flex flex-1 flex-col overflow-hidden border border-slate-200 bg-white shadow-sm">
          {!isItemSourceLocked && (
            <div className="p-4 border-b bg-white flex items-center justify-between gap-4 shrink-0">
              <div className="flex items-center gap-3 flex-1">
                <h3 className="whitespace-nowrap text-[12px] font-semibold text-slate-900">
                  2. Hàng hóa nhập kho
                </h3>
                <div className="relative flex-1 max-w-md">
                  <Search
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                    size={14}
                  />
                  <Input
                    className="pl-9 h-9 text-xs border-slate-200"
                    placeholder="Tìm tên, mã SKU, Barcode... (F3)"
                    value={searchProductText}
                    onChange={(e) => {
                      setSearchProductText(e.target.value);
                      setIsProductDropdownOpen(true);
                    }}
                    onFocus={() => setIsProductDropdownOpen(true)}
                  />
                  {isProductDropdownOpen && (
                    <div className="absolute top-full left-0 w-full mt-1 bg-white border shadow-2xl z-50 max-h-60 overflow-auto">
                      {products.length > 0 && (
                        <div className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b bg-slate-50 px-3 py-2 text-xs">
                          <span className="text-slate-500">
                            Đã chọn <span className="font-semibold text-slate-700">{selectedProductIds.length}</span> sản phẩm
                          </span>
                          <Button
                            type="button"
                            size="sm"
                            className="h-7 text-[11px]"
                            onClick={handleAddSelectedProducts}
                          >
                            Thêm đã chọn
                          </Button>
                        </div>
                      )}
                      {isLoadingProducts ? (
                        <div className="p-10 text-center">
                          <Loader2
                            size={24}
                            className="inline animate-spin text-blue-600"
                          />
                        </div>
                      ) : products.length > 0 ? (
                        products.map((v) => (
                          <div
                            key={v.sku}
                            className="p-2 border-b hover:bg-slate-50 cursor-pointer flex justify-between items-center text-xs"
                            onClick={() => handleSelectProduct(v)}
                          >
                            <div className="flex items-center gap-2">
                              <div
                                onClick={(e) => e.stopPropagation()}
                                className="flex items-center"
                              >
                                <Checkbox
                                  checked={selectedProductIds.some((id) => String(id) === String(v.id))}
                                  onCheckedChange={() => toggleSelectedProduct(v.id)}
                                />
                              </div>
                              <div className="flex flex-col">
                                <span className="font-medium">{v.productName}</span>
                                <span className="text-[10px] text-slate-400 font-mono">
                                #{v.sku}
                                </span>
                              </div>
                            </div>
                            <span className="text-[10px] font-medium text-slate-500">
                              Tồn {v.quantity || 0}
                            </span>
                          </div>
                        ))
                      ) : (
                        <div className="p-10 text-center text-xs text-slate-400">
                          Không có sản phẩm
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-9 text-[11px] font-medium"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <FileUp size={14} className="mr-2" /> Nhập Excel
                </Button>
                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  onChange={handleImportExcel}
                  accept=".xlsx,.xls"
                />
              </div>
            </div>
          )}

          <div className="flex-1 overflow-auto">
            <Table className="w-full table-fixed">
              <TableHeader className="sticky top-0 z-10 border-b border-slate-200 bg-slate-50">
                <TableRow>
                  <TableHead className="w-[30%] text-[11px] font-medium text-slate-500">
                    Sản phẩm
                  </TableHead>
                  <TableHead className="w-[17%] text-[11px] font-medium text-slate-500">
                    Lô / hạn
                  </TableHead>
                  <TableHead className="w-[34%] text-[11px] font-medium text-slate-500">
                    Kiểm nhận
                  </TableHead>
                  <TableHead className="w-[13%] text-right text-[11px] font-medium text-slate-500">
                    Đơn giá / tiền hàng
                  </TableHead>
                  <TableHead className="w-[72px]">
                    <span className="sr-only">Thao tác</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {fields.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={tableColCount}
                      className="h-40 text-center text-[12px] text-slate-400"
                    >
                      Chưa có sản phẩm nào
                    </TableCell>
                  </TableRow>
                ) : (
                  fields.map((field, idx) => {
                    const item = watchItems[idx];
                    const deliveredQty =
                      (Number(item.quantityAccepted) || 0) +
                      (Number(item.quantityRejected) || 0);
                    const acceptedQty = Number(item.quantityAccepted) || 0;
                    const rejectedQty = Number(item.quantityRejected) || 0;
                    const plannedQty = Number(item.plannedQuantity) || 0;
                    const hasQuantityMismatch =
                      plannedQty > 0 && deliveredQty !== plannedQty;
                    const isNoteOpen = !!noteExpandedRows[field.id];
                    const itemErrors = errors.items?.[idx];
                    const hasNote = Boolean((item.note || "").trim());
                    const acceptedBeforeQty =
                      Number(item.acceptedBeforeQuantity) || 0;
                    const defectiveBeforeQty = Math.max(
                      (Number(item.deliveredQuantity) || 0) - acceptedBeforeQty,
                      0,
                    );
                    const remainingAfterReceipt = isLinkedPurchaseRequest
                      ? Math.max(
                          (Number(item.requestedQuantity) || 0) -
                            acceptedBeforeQty -
                            acceptedQty,
                          0,
                        )
                      : 0;
                    const receivedAfterReceipt = acceptedBeforeQty + acceptedQty;
                    const acceptedLineTotal = acceptedQty * (Number(item.importPrice) || 0);
                    return (
                      <React.Fragment key={field.id}>
                        <TableRow className="border-b border-slate-100 hover:bg-slate-50/60">
                          <TableCell className="py-3 align-top">
                            <div className="flex gap-3">
                              <span className="mt-0.5 min-w-5 text-[11px] font-medium text-slate-400">
                                {idx + 1}
                              </span>
                              <div className="min-w-0">
                                <div className="truncate text-[12.5px] font-semibold text-slate-800">
                                  {item.productName}
                                </div>
                                <div className="mt-1 font-mono text-[10px] text-slate-400">
                                  {item.productCode}
                                </div>
                                {isLinkedPurchaseRequest ? (
                                  <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[10.5px] text-slate-500">
                                    <span>Yêu cầu {formatNumber(Number(item.requestedQuantity) || 0)}</span>
                                    <span>Đã nhập trước {formatNumber(acceptedBeforeQty)}</span>
                                    <span>Lỗi trước {formatNumber(defectiveBeforeQty)}</span>
                                  </div>
                                ) : null}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="px-2 py-3 align-top">
                            <div className="space-y-2">
                              <Input
                                readOnly
                                className="h-9 truncate border-slate-200 bg-slate-50 text-[11.5px] text-slate-600 shadow-none"
                                {...register(`items.${idx}.lotNumber`)}
                                disabled={isReadOnly}
                              />
                              <input
                                type="hidden"
                                {...register(`items.${idx}.expiryDate`)}
                              />
                              <SharedDatePicker
                                value={watchItems[idx]?.expiryDate || ""}
                                disabled={isInfoReadOnly}
                                onChange={(nextValue) =>
                                  setValue(`items.${idx}.expiryDate`, nextValue, {
                                    shouldDirty: true,
                                    shouldValidate: true,
                                    shouldTouch: true,
                                  })
                                }
                                placeholder="Hạn dùng"
                                heading="Hạn dùng"
                                emptyStateLabel="Chưa chọn hạn dùng"
                                toDate={MAX_EXPIRY_PICKER_DATE}
                                variant="compact"
                                buttonClassName="h-9 border-slate-200 px-2 text-[11.5px] shadow-none"
                              />
                            </div>
                          </TableCell>
                          <TableCell className="px-2 py-3 align-top">
                            <div className="grid grid-cols-3 gap-3">
                              <div className="space-y-1">
                                <span className="block text-[10.5px] font-medium text-slate-500">SL giao</span>
                                <Input
                                  type="number"
                                  min={0}
                                  className="h-9 min-w-0 border-slate-200 px-2 text-right text-[11.5px] shadow-none"
                                  {...register(`items.${idx}.plannedQuantity`, {
                                    valueAsNumber: true,
                                  })}
                                  disabled={isInfoReadOnly}
                                />
                                {itemErrors?.plannedQuantity && (
                                  <p className="mt-1 text-[10px] font-medium text-rose-500">
                                    {itemErrors.plannedQuantity.message}
                                  </p>
                                )}
                              </div>
                              <div className="space-y-1">
                                <span className="block text-[10.5px] font-medium text-slate-500">SL đạt</span>
                                <Input
                                  type="number"
                                  min={0}
                                  className={cn(
                                    "h-9 min-w-0 border-slate-200 px-2 text-right text-[11.5px] shadow-none",
                                    itemErrors?.quantityAccepted && "border-rose-500",
                                  )}
                                  {...register(`items.${idx}.quantityAccepted`, {
                                    valueAsNumber: true,
                                  })}
                                  disabled={isInfoReadOnly}
                                />
                              </div>
                              <div className="space-y-1">
                                <span className="block text-[10.5px] font-medium text-slate-500">SL lỗi</span>
                                <Input
                                  type="number"
                                  min={0}
                                  className={cn(
                                    "h-9 min-w-0 border-slate-200 px-2 text-right text-[11.5px] shadow-none",
                                    itemErrors?.quantityRejected && "border-rose-500",
                                  )}
                                  {...register(`items.${idx}.quantityRejected`, {
                                    valueAsNumber: true,
                                  })}
                                  disabled={isInfoReadOnly}
                                />
                              </div>
                            </div>
                            {(itemErrors?.quantityAccepted || itemErrors?.quantityRejected) && (
                              <p className="mt-2 text-[10px] font-medium text-rose-500">
                                {itemErrors.quantityAccepted?.message ||
                                  itemErrors.quantityRejected?.message}
                              </p>
                            )}
                            <div className="mt-2 grid grid-cols-3 gap-2 text-[10.5px] text-slate-500">
                              <span>Còn thiếu {formatNumber(remainingAfterReceipt)}</span>
                              <span>Đã nhận {formatNumber(receivedAfterReceipt)}</span>
                              <span className="text-right">
                                Thực nhập kho{" "}
                                <span className={cn("text-slate-800", hasQuantityMismatch && "text-rose-600")}>
                                  {formatNumber(acceptedQty)}
                                </span>
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="px-2 py-3 align-top">
                            <div className="space-y-2">
                              <div className="text-right text-[10.5px] font-medium text-slate-500">
                                Đơn giá
                              </div>
                              <Input
                                type="number"
                                readOnly
                                className="h-9 border-slate-200 bg-slate-50 text-right text-[11.5px] text-slate-600 shadow-none"
                                {...register(`items.${idx}.importPrice`, {
                                  valueAsNumber: true,
                                })}
                                disabled={isReadOnly}
                              />
                              <div className="flex items-center justify-between gap-2 text-[11.5px] font-semibold text-slate-800">
                                <span className="text-[10.5px] font-medium text-slate-500">Thành tiền</span>
                                <span>{formatNumber(acceptedLineTotal)}</span>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="px-2 py-3 align-top">
                            <div className="flex justify-end gap-2">
                              <button
                                type="button"
                                title={hasNote ? "Sửa ghi chú" : "Thêm ghi chú"}
                                className={cn(
                                  "inline-flex h-7 w-7 items-center justify-center text-slate-400 transition-colors hover:text-slate-700",
                                  hasNote && "text-blue-600",
                                )}
                                onClick={() =>
                                  setNoteExpandedRows((prev) => ({
                                    ...prev,
                                    [field.id]: !prev[field.id],
                                  }))
                                }
                              >
                                <FileText size={14} />
                              </button>
                            {!isInfoReadOnly && (
                              <button
                                type="button"
                                title="Xóa dòng"
                                className="inline-flex h-7 w-7 items-center justify-center text-slate-300 transition-colors hover:text-rose-500"
                                onClick={() => remove(idx)}
                              >
                                <Trash2 size={14} />
                              </button>
                            )}
                            </div>
                          </TableCell>
                        </TableRow>
                        {isNoteOpen ? (
                          <TableRow className="border-b border-slate-100 bg-slate-50/60">
                            <TableCell colSpan={tableColCount} className="px-4 py-3">
                              <div className="w-full">
                                <Label className="mb-2 block text-[10.5px] font-semibold text-slate-500">
                                  Ghi chú dòng hàng
                                </Label>
                                <textarea
                                  className="h-20 w-full resize-none border border-slate-200 bg-white p-2 text-[11.5px] outline-none placeholder:text-slate-400"
                                  {...register(`items.${idx}.note`)}
                                  placeholder="Nhập ghi chú kiểm nhận, lý do lỗi/hỏng nếu có..."
                                  disabled={isReadOnly}
                                />
                              </div>
                            </TableCell>
                          </TableRow>
                        ) : null}
                        {hasQuantityMismatch ? (
                          <TableRow className="bg-rose-50/70">
                            <TableCell colSpan={tableColCount} className="border-t-0 px-4 py-2">
                              <div className="text-[11px] font-medium text-rose-600">
                                Đạt + lỗi phải đúng bằng số lượng giao của dòng này.
                              </div>
                            </TableCell>
                          </TableRow>
                        ) : null}
                      </React.Fragment>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>

          <div className="flex shrink-0 flex-col items-start justify-between gap-8 border-t border-slate-200 bg-white p-6 md:flex-row">
            <div className="w-full flex-1 space-y-2 md:max-w-2xl">
              <Label className="text-[10.5px] font-semibold text-slate-500">
                Ghi chú
              </Label>
              <textarea
                {...register("note")}
                className="mt-1 h-20 w-full resize-none border border-slate-200 bg-white p-3 text-[12px] outline-none"
                placeholder="Ghi chú cho phiếu nhập..."
                disabled={isReadOnly}
              />
            </div>
            <div className="w-full space-y-3 md:w-80">
              <div className="flex justify-between text-[12px] text-slate-500">
                <span>Tổng tiền hàng:</span>
                <span className="font-semibold text-slate-900">
                  {formatNumber(subTotal)} VND
                </span>
              </div>
              <div className="space-y-1 border-t border-slate-100 pt-3 text-[11px] text-slate-500">
                <div className="flex justify-between">
                  <span>Giá trị hàng đạt</span>
                  <span className="text-slate-700">{formatNumber(subTotal)} VND</span>
                </div>
                <div className="flex justify-between">
                  <span>Giá trị hàng lỗi</span>
                  <span className="text-rose-600">{formatNumber(rejectedGoodsTotal)} VND</span>
                </div>
                <div className="flex justify-between">
                  <span>Tổng giá trị đợt nhập</span>
                  <span className="font-semibold text-slate-800">{formatNumber(batchTotalValue)} VND</span>
                </div>
              </div>
              <div className="flex justify-between border-t border-slate-200 pt-3 text-[13px] font-semibold text-slate-900">
                <span>Công nợ dự kiến:</span>
                <span>
                  {formatNumber(debtAmount)} VND
                </span>
              </div>
            </div>
          </div>
        </div>

      {/* 4. Footer Actions */}
      <div className="fixed bottom-0 left-0 right-0 z-[999] border-t border-slate-200 bg-white/95 px-6 py-3 shadow-[0_-4px_14px_rgba(15,23,42,0.06)] backdrop-blur lg:left-[260px]">
        <div className="flex items-center justify-end gap-3">
          <Button
            variant="outline"
            className="h-10 min-w-[104px] text-[12px] font-medium"
            onClick={() => router.back()}
          >
            Hủy
          </Button>
          {isEditMode && watchStatus === "PENDING" && isAdmin && (
            <Button
              variant="outline"
              className="h-10 px-5 text-[12px] font-medium text-rose-600"
              onClick={handleReject}
              disabled={isSubmitting}
            >
              <Ban size={14} className="mr-2" /> Từ chối
            </Button>
          )}

          {!isReadOnly && (
            <Button
              className="h-10 min-w-[190px] bg-blue-600 px-6 text-[12px] font-semibold text-white hover:bg-blue-700"
              onClick={handleSubmit(onSubmitWithConfirm)}
              disabled={isSubmitting || isMissingPurchaseRequestLink}
            >
              {isSubmitting && (
                <Loader2 size={14} className="animate-spin mr-2" />
              )}
              <>
                <Save size={14} className="mr-2" />{" "}
                {isAdmin ? "Lưu và duyệt phiếu" : "Lưu và gửi duyệt"}
              </>
            </Button>
          )}
        </div>
      </div>

      {/* AlertDialog dành cho các xác nhận quan trọng */}
      <AlertDialog
        open={confirmConfig.open}
        onOpenChange={(o) => setConfirmConfig({ ...confirmConfig, open: o })}
      >
        <AlertDialogContent className="rounded-md border border-slate-200 shadow-xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-[15px] font-semibold text-slate-900">
              <AlertCircle
                className={cn(
                  "w-5 h-5",
                  confirmConfig.variant === "destructive"
                    ? "text-rose-500"
                    : "text-blue-600",
                )}
              />
              {confirmConfig.title}
            </AlertDialogTitle>
            <AlertDialogDescription className="pt-2 text-[12px] font-normal leading-relaxed text-slate-500">
              {confirmConfig.description}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-3 pt-4">
            <AlertDialogCancel className="h-10 rounded-md border-slate-200 px-6 text-[12px] font-medium text-slate-600 hover:bg-slate-50">
              Quay lại
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmConfig.action}
              className={cn(
                "h-10 rounded-md px-8 text-[12px] font-semibold transition-colors",
                confirmConfig.variant === "destructive"
                  ? "bg-rose-600 hover:bg-rose-700"
                  : "bg-blue-600 hover:bg-blue-700",
              )}
            >
              Xác nhận
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default function Page() {
  return (
    <Suspense
      fallback={
        <div className="flex h-screen items-center justify-center bg-slate-50">
          <Loader2 className="animate-spin text-blue-600" size={32} />
        </div>
      }
    >
      <AdminReceiptFormContent />
    </Suspense>
  );
}

