"use client";

import React, { useState, useEffect, useRef, Suspense, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm, Controller, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  X,
  Search,
  Plus,
  Trash2,
  Package,
  Save,
  Loader2,
  ChevronLeft,
  CheckCircle2,
  User,
  Clock,
  FileUp,
  AlertCircle,
  Ban,
} from "lucide-react";
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

function AdminReceiptFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const receiptId = searchParams.get("id");
  const purchaseRequestIdParam = searchParams.get("purchaseRequestId");
  const isEditMode = Boolean(receiptId);
  const isCreateFromPurchaseRequest =
    !isEditMode && Boolean(purchaseRequestIdParam);
  const hasFetched = useRef(false);
  const hasPrefilledPurchaseRequest = useRef(false);

  const { data: currentUser } = useCurrentUser();
  const { hasPermission } = usePermissions();
  const isAdmin = hasPermission(P.IMPORT_APPROVE);

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

  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [isLoadingSuppliers, setIsLoadingSuppliers] = useState(false);
  const [searchSupplierText, setSearchSupplierText] = useState("");
  const [isSupplierDropdownOpen, setIsSupplierDropdownOpen] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(
    null,
  );

  const [branches, setBranches] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);
  const [searchProductText, setSearchProductText] = useState("");
  const [isProductDropdownOpen, setIsProductDropdownOpen] = useState(false);
  const [selectedProductIds, setSelectedProductIds] = useState<(number | string)[]>([]);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    control,
    setValue,
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
      deliverer: "N/A",
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
    if (Object.keys(errors).length > 0) {
      console.log("Form Errors:", errors);
      const firstError = Object.values(errors)[0] as any;

      if (errors.items && Array.isArray(errors.items)) {
        const itemError = errors.items.find(Boolean) as any;
        if (itemError) {
          const fieldName = Object.keys(itemError)[0];
          const message = itemError[fieldName]?.message;
          if (message) {
            toast.error(`Lỗi sản phẩm: ${message}`);
            return;
          }
        }
      }

      if (firstError?.message) toast.error(firstError.message);
      else toast.error("Vui lòng kiểm tra lại thông tin các trường bắt buộc");
    }
  }, [errors]);

  const { fields, append, remove, replace } = useFieldArray({
    control,
    name: "items",
  });
  const watchItems = watch("items") || [];
  const watchPurchaseRequestId = watch("purchaseRequestId");
  const watchStatus = watch("status") || "PENDING";
  const watchPaymentAmount = watch("paymentAmount") || 0;
  const currentTargetBranch = watch("branchName");

  // Kiểm hàng khi trạng thái là APPROVED hoặc đã hoàn tất (COMPLETED/IMPORTED)
  const isQCMode =
    (watchStatus || "").toUpperCase() === "APPROVED" ||
    (watchStatus || "").toUpperCase() === "COMPLETED" ||
    (watchStatus || "").toUpperCase() === "IMPORTED";

  // Các trường thông tin chung không được sửa khi đang kiểm hàng (EditMode + status >= APPROVED)
  const isInfoReadOnly = isReadOnly || (isEditMode && isQCMode);
  const isLinkedPurchaseRequest = Boolean(watchPurchaseRequestId);
  const isMasterDataLocked = isInfoReadOnly || isLinkedPurchaseRequest;
  const isItemSourceLocked = isInfoReadOnly || isLinkedPurchaseRequest;

  const selectedDestBranch = useMemo(() => {
    return branches.find(
      (b) =>
        (b.name || b.branchName || b.id.toString()) === currentTargetBranch,
    );
  }, [branches, currentTargetBranch]);

  const targetBranchId = selectedDestBranch?.id?.toString() || "";

  // Tính tổng tiền dựa trên số lượng (Yêu cầu khi tạo, Thực nhận khi kiểm)
  const subTotal = watchItems.reduce((acc, item) => {
    const qty = isQCMode
      ? Number(item.quantityReal) || 0
      : Number(item.plannedQuantity) || 0;
    const price = Number(item.importPrice) || 0;
    return acc + qty * price;
  }, 0);

  const totalQty = watchItems.reduce(
    (acc, item) => acc + (Number(item.plannedQuantity) || 0),
    0,
  );
  const debtAmount = subTotal - watchPaymentAmount;

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
        let headerIndex = rows.findIndex((r) =>
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
                  "L" + Date.now().toString().slice(-6),
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
        lotNumber: "L" + Date.now().toString().slice(-6),
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

  const handleClearSupplier = () => {
    if (isMasterDataLocked) return;
    setValue("supplierCode", "");
    setValue("supplierName", "");
    setSelectedSupplier(null);
    setSearchSupplierText("");
  };

  const onSaveDraft = async (data: Receipt) => {
    setIsSubmitting(true);
    try {
      const { creator, purchaseRequestCode, ...restOfData } = data;
      const payload = {
        ...restOfData,
        status: isAdmin && !isEditMode ? "APPROVED" : data.status,
        items: data.items.map((i) => {
          return {
            ...i,
            plannedQuantity: Number(i.plannedQuantity),
            importPrice: Number(i.importPrice),
            quantityReal: Number(i.quantityReal) || 0,
          };
        }),
      };
      isEditMode
        ? await InventoryApiService.updateReceipt(receiptId!, payload)
        : await InventoryApiService.createReceipt(payload);
      toast.success("Đã lưu!");
      router.push("/admin/receipts");
    } catch (e) {
      toast.error(getErrorMessage(e as any));
    } finally {
      setIsSubmitting(false);
    }
  };

  const onConfirmComplete = async (data: Receipt) => {
    setIsSubmitting(true);
    try {
      // Khi nhấn "Xác nhận nhập kho", gửi object chứa items
      const payloadItems = data.items.map((i) => {
        return {
          ...i,
          quantityReal: Number(i.quantityReal) || 0,
        };
      });
      await InventoryApiService.completeReceipt(receiptId!, {
        items: payloadItems,
      });
      toast.success("Đã hoàn tất nhập kho!");
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
            quantityReal:
              i.quantityReal ||
              i.quantityActual ||
              i.quantity ||
              i.plannedQuantity ||
              0,
            importPrice: i.importPrice || i.price || i.unitPrice || i.cost || 0,
            note: i.note || "",
          }));

          reset({
            ...data,
            receiptCode: data.receiptCode || data.code || `PNK-${data.id}`,
            entryDate: data.entryDate?.slice(0, 10),
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
          supplierCode: purchaseRequest.supplierCode,
          supplierName: purchaseRequest.supplierName,
          branchName: purchaseRequest.branchName,
          items: remainingItems.map((item) => ({
            productCode: item.productCode,
            productName: item.productName,
            imageUrl: item.imageUrl || "",
            plannedQuantity: item.remainingQty || 0,
            remainingQuantity: item.remainingQty || 0,
            quantityReal: 0,
            quantityAccepted: 0,
            quantityRejected: 0,
            lotNumber: "",
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
    getValues,
    isEditMode,
    purchaseRequestIdParam,
    reset,
    router,
  ]);

  useEffect(() => {
    (async () => {
      const data = await branchService.getAll();
      const list = Array.isArray(data) ? data : data.content || [];
      setBranches(list);
      if (!isEditMode && !purchaseRequestIdParam && list.length > 0) {
        const mainWh = list.find((b: any) => b.branchType === "WAREHOUSE");
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
      "Xác nhận TỪ CHỐI phiếu",
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
    const isComplete = watchStatus === "APPROVED";
    const title = isComplete ? "Xác nhận NHẬP KHO" : "Xác nhận LƯU PHIẾU";
    const msg = isComplete
      ? "Hệ thống sẽ ghi nhận số lượng đạt và số lượng lỗi vào tồn kho. Bạn đã kiểm tra kỹ số lượng thực nhận chưa?"
      : "Hệ thống sẽ lưu lại thông tin phiếu nhập hiện tại. Bạn có chắc chắn không?";

    showConfirm(title, msg, () => {
      if (isComplete) onConfirmComplete(data);
      else onSaveDraft(data);
    });
  };

  if (isInitialLoading)
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="animate-spin text-blue-600" size={32} />
      </div>
    );

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900 pb-20">
      {/* 1. Workflow Diagram (Fixed 80px) */}
      <div className="h-[80px] w-full bg-white border-b border-slate-200 flex items-center justify-center px-10 shrink-0">
        <div className="flex items-center w-full max-w-4xl relative">
          {["LẬP PHIẾU", "PHÊ DUYỆT", "KIỂM HÀNG", "HOÀN TẤT"].map(
            (label, idx) => {
              const status = (watchStatus || "").toUpperCase();
              let activeIdx = 0;
              if (status === "APPROVED") activeIdx = 2;
              else if (status === "COMPLETED" || status === "IMPORTED")
                activeIdx = 3;
              else if (status !== "PENDING") activeIdx = 1;
              const isDone = idx < activeIdx;
              const isCurrent = idx === activeIdx;
              return (
                <React.Fragment key={idx}>
                  <div className="flex flex-col items-center z-10">
                    <div
                      className={cn(
                        "w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold border-2 transition-all bg-white",
                        isDone || isCurrent
                          ? "border-blue-600 text-blue-600"
                          : "border-slate-200 text-slate-300",
                      )}
                    >
                      {isDone ? <CheckCircle2 size={14} /> : idx + 1}
                    </div>
                    <span
                      className={cn(
                        "text-[10px] font-bold mt-1 uppercase tracking-tight",
                        isCurrent ? "text-blue-600" : "text-slate-400",
                      )}
                    >
                      {label}
                    </span>
                  </div>
                  {idx < 3 && (
                    <div
                      className={cn(
                        "flex-1 h-[2px] mx-2 -mt-4",
                        idx < activeIdx ? "bg-blue-600" : "bg-slate-100",
                      )}
                    />
                  )}
                </React.Fragment>
              );
            },
          )}
        </div>
      </div>

      {isQCMode && !isReadOnly && (
        <div className="mx-6 mt-4 p-3 bg-amber-50 border border-amber-200 rounded-sm flex items-center gap-3 text-amber-800">
          <AlertCircle size={18} className="shrink-0" />
          <p className="text-xs font-bold uppercase tracking-wide">
            Chế độ kiểm hàng: Vui lòng nhập số lượng thực nhận và kiểm tra chất
            lượng sản phẩm.
          </p>
        </div>
      )}

      <div className="mx-6 mt-4 p-3 bg-white border border-slate-200 rounded-sm flex items-start gap-3 text-slate-700">
        <AlertCircle size={18} className="shrink-0 mt-0.5" />
        <p className="text-xs font-bold uppercase tracking-wide">
          Nghiệp vụ chuẩn: chỉ kho tổng mới nhập hàng trực tiếp từ nhà cung cấp. Các kho khác nhận hàng qua điều chuyển. Sau khi duyệt phiếu, hàng phải qua bước kiểm hàng; phần lỗi sẽ được lưu riêng vào tồn lỗi trong kho.
        </p>
      </div>

      {linkedPurchaseRequestMeta && (
        <div className="mx-6 mt-4 p-3 bg-blue-50 border border-blue-200 rounded-sm flex items-start gap-3 text-blue-800">
          <AlertCircle size={18} className="shrink-0 mt-0.5" />
          <p className="text-xs font-bold uppercase tracking-wide leading-relaxed">
            Phiếu nhập này đang liên kết với yêu cầu mua{" "}
            <span className="text-blue-600">{linkedPurchaseRequestMeta.code}</span>.
            Hệ thống đã tự nạp nhà cung cấp, kho nhận và các mặt hàng còn thiếu.
            Người dùng chỉ cần điều chỉnh số lượng của đợt nhập này, rồi thực hiện kiểm hàng theo thực tế.
          </p>
        </div>
      )}

      {/* 2. Information Row (Supplier & Receipt Info) */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 p-6 shrink-0">
        {/* Left: Supplier Info */}
        <div className="md:col-span-7 bg-white border border-slate-200 p-5 shadow-sm rounded-sm min-h-[160px] flex flex-col">
          <h2 className="text-[12px] font-bold text-slate-400 uppercase tracking-widest mb-4">
            Nhà cung cấp
          </h2>
          <div className="relative mb-4" ref={dropdownRef}>
            <Search
              className="absolute left-3 top-3 text-slate-400"
              size={16}
            />
            <Input
              className="pl-10 h-10 text-xs border-slate-200"
              placeholder="Tìm theo tên hoặc mã NCC (F4)..."
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
                      <p className="font-bold">{s.name}</p>
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

          {selectedSupplier && (
            <div className="flex items-start gap-4 bg-blue-50/50 border border-blue-100 p-4 rounded-sm relative animate-in fade-in duration-300">
              {!isMasterDataLocked && (
                <button
                  type="button"
                  onClick={handleClearSupplier}
                  className="absolute top-2 right-2 text-slate-300 hover:text-rose-500 transition-colors"
                >
                  <X size={16} />
                </button>
              )}
              <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white shrink-0 shadow-sm">
                <User size={20} />
              </div>
              <div className="flex flex-col">
                <span className="text-[14px] font-bold text-blue-700">
                  {selectedSupplier.name}
                </span>
                <span className="text-[11px] text-slate-500 mt-1">
                  Mã NCC: {selectedSupplier.code}
                </span>
                <span className="text-[11px] text-slate-500">
                  {selectedSupplier.phone || "Chưa có SĐT"}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Right: Receipt Info */}
        <div className="md:col-span-5 bg-white border border-slate-200 p-5 shadow-sm rounded-sm space-y-3">
          <h2 className="text-[12px] font-bold text-slate-400 uppercase tracking-widest mb-4">
            Thông tin phiếu
          </h2>

          <div className="grid grid-cols-12 items-center gap-2">
            <Label className="col-span-4 text-[11px] font-bold text-slate-500">
              Chi nhánh nhập (*)
            </Label>
            <div className="col-span-8">
              <Controller
                name="branchName"
                control={control}
                rules={{ required: "Vui lòng chọn chi nhánh nhập" }}
                render={({ field }) => (
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                    disabled={isMasterDataLocked}
                  >
                    <SelectTrigger className="h-8 text-xs border-slate-200 shadow-none font-bold text-blue-600">
                      <SelectValue placeholder="-- Chọn chi nhánh nhập --" />
                    </SelectTrigger>
                    <SelectContent>
                      {branches
                        .filter((b) => b.branchType === "WAREHOUSE")
                        .map((b) => (
                          <SelectItem
                            key={b.id}
                            value={b.name || b.branchName}
                            className="text-xs font-bold uppercase"
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

          <div className="grid grid-cols-12 items-center gap-2">
            <Label className="col-span-4 text-[11px] font-bold text-slate-500">
              Mã phiếu
            </Label>
            <Input
              readOnly
              {...register("receiptCode")}
              className="col-span-8 h-8 text-xs bg-slate-50 border-slate-200 font-bold text-blue-600"
            />
          </div>
          <div className="grid grid-cols-12 items-center gap-2">
            <Label className="col-span-4 text-[11px] font-bold text-slate-500">
              Ngày nhập
            </Label>
            <div className="col-span-8 relative">
              <input
                type="date"
                {...register("entryDate")}
                className="w-full h-8 text-xs border rounded-sm px-2 bg-slate-50 font-medium outline-none border-slate-200"
                disabled={isInfoReadOnly}
              />
              <Clock
                size={14}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
              />
            </div>
          </div>
          <div className="grid grid-cols-12 items-center gap-2">
            <Label className="col-span-4 text-[11px] font-bold text-slate-500">
              Người tạo
            </Label>
            <Input
              readOnly
              value={watch("creator") || "..."}
              className="col-span-8 h-8 text-xs bg-slate-50 border-slate-200 font-medium"
            />
          </div>
        </div>
      </div>

      {/* 3. Product Entry & Table */}
      <div className="flex-1 flex flex-col px-6 pb-6 overflow-hidden">
        <div className="bg-white border border-slate-200 rounded-sm shadow-sm flex flex-col h-full overflow-hidden">
          {!isItemSourceLocked && (
            <div className="p-4 border-b bg-white flex items-center justify-between gap-4 shrink-0">
              <div className="flex items-center gap-3 flex-1">
                <h3 className="text-[12px] font-bold text-slate-700 whitespace-nowrap uppercase">
                  Thông tin sản phẩm
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
                            Đã chọn <span className="font-bold text-slate-700">{selectedProductIds.length}</span> sản phẩm
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
                            className="animate-spin text-blue-600 inline"
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
                                <span className="font-bold">{v.productName}</span>
                                <span className="text-[10px] text-slate-400 font-mono">
                                #{v.sku}
                                </span>
                              </div>
                            </div>
                            <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 border">
                              TỒN: {v.quantity || 0}
                            </span>
                          </div>
                        ))
                      ) : (
                        <div className="p-10 text-center text-slate-400 text-xs font-bold italic">
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
                  className="h-8 text-[10px] font-bold"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <FileUp size={14} className="mr-2" /> NHẬP EXCEL
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
            <Table>
              <TableHeader className="bg-slate-50 sticky top-0 z-10 border-b">
                <TableRow>
                  <TableHead className="w-10 text-center text-[10px] font-bold text-slate-400">
                    #
                  </TableHead>
                  <TableHead className="text-[10px] font-bold text-slate-400">
                    SẢN PHẨM / SKU
                  </TableHead>
                  <TableHead className="w-32 text-center text-[10px] font-bold text-slate-400">
                    SỐ LÔ
                  </TableHead>
                  <TableHead className="w-32 text-center text-[10px] font-bold text-slate-400">
                    HẠN DÙNG
                  </TableHead>
                  {isQCMode ? (
                    <>
                      <TableHead className="w-20 text-right text-[10px] font-bold text-slate-400 whitespace-nowrap">
                        YÊU CẦU
                      </TableHead>
                      <TableHead className="w-20 text-right text-[10px] font-bold text-emerald-600 whitespace-nowrap">
                        THỰC NHẬN
                      </TableHead>
                      <TableHead className="w-20 text-right text-[10px] font-bold text-rose-600 whitespace-nowrap">
                        LỖI
                      </TableHead>
                    </>
                  ) : (
                    <TableHead className="w-24 text-right text-[10px] font-bold text-slate-400 whitespace-nowrap">
                      YÊU CẦU
                    </TableHead>
                  )}
                  <TableHead className="w-32 text-right text-[10px] font-bold text-blue-600">
                    GIÁ NHẬP (₫)
                  </TableHead>
                  <TableHead className="w-32 text-right text-[10px] font-bold text-slate-400">
                    THÀNH TIỀN
                  </TableHead>
                  <TableHead className="w-40 text-[10px] font-bold text-slate-400">
                    GHI CHÚ / NGUYÊN NHÂN
                  </TableHead>
                  <TableHead className="w-10"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {fields.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={isQCMode ? 11 : 9}
                      className="h-40 text-center text-slate-300 text-xs font-bold uppercase tracking-widest"
                    >
                      Chưa có sản phẩm nào
                    </TableCell>
                  </TableRow>
                ) : (
                  fields.map((field, idx) => {
                    const item = watchItems[idx];
                    return (
                      <TableRow
                        key={field.id}
                        className="h-12 border-b border-slate-50 hover:bg-slate-50/50"
                      >
                        <TableCell className="text-center text-[10px] text-slate-300 font-bold">
                          {idx + 1}
                        </TableCell>
                        <TableCell>
                          <div className="text-[11px] font-bold text-slate-700">
                            {item.productName}
                          </div>
                          <div className="text-[9px] text-slate-400 font-mono mt-0.5">
                            #{item.productCode}
                          </div>
                        </TableCell>
                        <TableCell className="px-1">
                          <Input
                            className="h-7 text-xs text-center border-slate-200"
                            {...register(`items.${idx}.lotNumber`)}
                            disabled={isInfoReadOnly}
                          />
                        </TableCell>
                        <TableCell className="px-1">
                          <Input
                            type="date"
                            className="h-7 text-xs px-1 border-slate-200"
                            {...register(`items.${idx}.expiryDate`)}
                            disabled={isInfoReadOnly}
                          />
                        </TableCell>
                        {isQCMode ? (
                          <>
                            <TableCell className="text-right text-xs font-bold text-slate-400">
                              {item.plannedQuantity}
                            </TableCell>
                            <TableCell className="px-1">
                              <Input
                                type="number"
                                className="h-7 text-xs text-right border-emerald-200 bg-emerald-50/10 font-bold text-emerald-700"
                                {...register(`items.${idx}.quantityReal`, {
                                  valueAsNumber: true,
                                })}
                                disabled={isReadOnly}
                              />
                            </TableCell>
                            <TableCell className="text-right text-xs font-bold text-rose-600 pr-4">
                              {(Number(item.plannedQuantity) || 0) -
                                (Number(item.quantityReal) || 0)}
                            </TableCell>
                          </>
                        ) : (
                          <TableCell className="px-1">
                            <Input
                              type="number"
                              className="h-7 text-xs text-right font-bold border-slate-200"
                              {...register(`items.${idx}.plannedQuantity`, {
                                valueAsNumber: true,
                              })}
                              disabled={isInfoReadOnly}
                            />
                          </TableCell>
                        )}
                        <TableCell className="px-1 bg-blue-50/20">
                          <Input
                            type="number"
                            className="h-7 text-xs text-right text-blue-600 font-bold border-blue-200"
                            {...register(`items.${idx}.importPrice`, {
                              valueAsNumber: true,
                            })}
                            disabled={isInfoReadOnly}
                          />
                        </TableCell>
                        <TableCell className="text-right text-xs font-bold text-slate-900 pr-4">
                          {formatNumber(
                            (Number(
                              isQCMode
                                ? item.quantityReal
                                : item.plannedQuantity,
                            ) || 0) * (Number(item.importPrice) || 0),
                          )}
                        </TableCell>
                        <TableCell className="px-1 min-w-[150px]">
                          <Input
                            className="h-7 text-[10px] border-slate-200 bg-slate-50/30 italic"
                            {...register(`items.${idx}.note`)}
                            placeholder="Nguyên nhân..."
                            disabled={isReadOnly}
                          />
                        </TableCell>
                        <TableCell className="text-center">
                          {!isInfoReadOnly && (
                            <Trash2
                              size={14}
                              className="text-slate-200 hover:text-rose-500 cursor-pointer transition-colors"
                              onClick={() => remove(idx)}
                            />
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>

          <div className="p-6 bg-slate-50/50 border-t flex flex-col md:flex-row justify-between items-start gap-10 shrink-0">
            <div className="flex-1 w-full md:max-w-lg space-y-2">
              <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                Ghi chú / Nguyên nhân
              </Label>
              <textarea
                {...register("note")}
                className="w-full mt-1 border border-slate-200 rounded-sm p-3 text-xs outline-none h-20 bg-white"
                placeholder="..."
                disabled={isReadOnly}
              />
            </div>
            <div className="w-full md:w-80 space-y-3">
              <div className="flex justify-between text-xs font-bold text-slate-500 uppercase">
                <span>Tổng tiền hàng:</span>
                <span className="text-slate-900">
                  {formatNumber(subTotal)} VND
                </span>
              </div>
              <div className="flex justify-between items-center text-xs font-bold text-emerald-600 uppercase">
                <span>Đã thanh toán:</span>
                <Input
                  type="number"
                  className="h-8 w-32 text-right font-bold text-emerald-600 border-emerald-300"
                  {...register("paymentAmount", { valueAsNumber: true })}
                  disabled={isReadOnly}
                />
              </div>
              <div className="pt-3 border-t border-slate-200 flex justify-between text-[14px] font-black uppercase">
                <span>Còn nợ NCC:</span>
                <span
                  className={
                    debtAmount > 0 ? "text-rose-600" : "text-emerald-600"
                  }
                >
                  {formatNumber(debtAmount)} VND
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Footer Actions */}
      <div className="fixed bottom-0 left-0 lg:left-[260px] right-0 h-16 bg-white border-t border-slate-200 px-8 flex items-center justify-between z-50 shadow-lg">
        <div className="flex gap-2">
          <Button
            variant="ghost"
            className="text-xs font-bold uppercase text-slate-400"
            onClick={() => router.back()}
          >
            Hủy bỏ
          </Button>
        </div>

        <div className="flex gap-3">
          {isEditMode && watchStatus === "PENDING" && isAdmin && (
            <Button
              variant="outline"
              className="text-xs font-bold uppercase text-rose-600 border-rose-200 hover:bg-rose-50 h-9 px-6 rounded-sm"
              onClick={handleReject}
              disabled={isSubmitting}
            >
              <Ban size={14} className="mr-2" /> Từ chối
            </Button>
          )}

          {!isReadOnly && (
            <Button
              className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold uppercase px-8 rounded-sm h-9 shadow-md"
              onClick={handleSubmit(onSubmitWithConfirm)}
              disabled={isSubmitting}
            >
              {isSubmitting && (
                <Loader2 size={14} className="animate-spin mr-2" />
              )}
              {watchStatus === "APPROVED" ? (
                <>
                  <CheckCircle2 size={14} className="mr-2" /> Xác nhận nhập kho
                </>
              ) : (
                <>
                  <Save size={14} className="mr-2" />{" "}
                  {isAdmin ? "Lưu & Duyệt ngay" : "Lưu & Gửi duyệt"}
                </>
              )}
            </Button>
          )}
        </div>
      </div>

      {/* AlertDialog dành cho các xác nhận quan trọng */}
      <AlertDialog
        open={confirmConfig.open}
        onOpenChange={(o) => setConfirmConfig({ ...confirmConfig, open: o })}
      >
        <AlertDialogContent className="rounded-none border-2 border-slate-200 shadow-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-[16px] font-black uppercase text-slate-800 flex items-center gap-2">
              <AlertCircle
                className={cn(
                  "w-5 h-5",
                  confirmConfig.variant === "destructive"
                    ? "text-rose-500"
                    : "text-blue-500",
                )}
              />
              {confirmConfig.title}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-[13px] font-medium text-slate-500 leading-relaxed pt-2">
              {confirmConfig.description}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="pt-4 gap-3">
            <AlertDialogCancel className="rounded-none border-slate-300 text-slate-500 font-bold uppercase text-[11px] h-9 px-6 hover:bg-slate-50">
              Quay lại
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmConfig.action}
              className={cn(
                "rounded-none font-black uppercase text-[11px] h-9 px-8 shadow-lg transition-all",
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
