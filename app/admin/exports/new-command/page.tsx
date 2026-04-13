"use client";

import React, { useState, useEffect, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm, Controller, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  X, Plus, Trash2, FileText, ChevronLeft, Save, ShoppingBag, Warehouse, UserCheck,
  MapPin, User, Phone, CalendarIcon, Hash, Search, BadgeCheck, Loader2, Package, AlertCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { cn, formatNumber } from "@/lib/utils";
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

import { branchService } from "@/app/services/branchService";
import { supplierService } from "@/app/services/supplier.service";
import { InventoryExportApiService } from "@/app/services/inventory.service";
import { ProductService } from "@/app/services/product.service";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { usePermissions } from "@/hooks/usePermissions";
import { P } from "@/lib/permissions";

// =================================================================
// 1. ĐỊNH NGHĨA ZOD SCHEMA ĐỂ BẮT LỖI (VALIDATION)
// =================================================================
const ExportItemSchema = z.object({
<<<<<<< Updated upstream
  productVariantId: z.number(), sku: z.string(), name: z.string(), unit: z.string(), stock: z.number(), price: z.number(),
=======
  productVariantId: z.number(), sku: z.string(), name: z.string(), unit: z.string(), 
  stock: z.number(), defectiveQuantity: z.number().optional().default(0), 
  plannedQuantity: z.number().optional().default(0), // Bổ sung trường yêu cầu
  price: z.number(),
  batchNumber: z.string().optional(), expiryDate: z.string().optional(),
>>>>>>> Stashed changes
  quantity: z.coerce.number().min(1, "Số lượng xuất phải lớn hơn 0"), returnReason: z.string().optional()
});

const ExportCommandSchema = z.object({
  noteCode: z.string(), exportType: z.literal("RETURN_SUPPLIER"), expectedDate: z.string().min(1, "Chọn ngày"),
  referenceCode: z.string(),
  note: z.string().min(1, "Nhập lý do trả hàng"), branchId: z.string().min(1, "Chọn kho xuất"), targetId: z.string().min(1, "Chọn nhà cung cấp"),
  specificReceiver: z.string(), shippingAddress: z.string(), creatorName: z.string(),
  items: z.array(ExportItemSchema).min(1, "Chọn ít nhất 1 sản phẩm lỗi để trả")
});

type ExportCommandFormValues = z.infer<typeof ExportCommandSchema>;

// =================================================================
// 2. MAIN COMPONENT
// =================================================================
function AdminExportFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const exportId = searchParams.get("id");
  const isEditMode = Boolean(exportId);

  const { data: currentUser } = useCurrentUser();
  const { hasPermission } = usePermissions();
<<<<<<< Updated upstream
=======
  
>>>>>>> Stashed changes
  const isAdmin = hasPermission(P.EXPORT_APPROVE);

  const [isReadOnly, setIsReadOnly] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(isEditMode);

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

  const showConfirm = (title: string, description: string, action: () => void, variant: "default" | "destructive" = "default") => {
    setConfirmConfig({ open: true, title, description, action, variant });
  };

  const [branches, setBranches] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [allProducts, setAllProducts] = useState<any[]>([]);
  const [defectiveItems, setDefectiveItems] = useState<any[]>([]);
  const [isLoadingDefective, setIsLoadingDefective] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
const hasFetched = useRef(false);
  const generateNoteCode = () => {
    const prefix = "LXT"; // Luôn là Lệnh Xuất Trả
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
<<<<<<< Updated upstream
      exportType: "INTERNAL",
      noteCode: generateNoteCode("INTERNAL"),
=======
      exportType: "RETURN_SUPPLIER",
      noteCode: generateNoteCode(),
      referenceCode: "",
>>>>>>> Stashed changes
      note: "",
      expectedDate: new Date().toLocaleDateString('en-CA'),
      branchId: "",
      targetId: "",
      specificReceiver: "",
      shippingAddress: "",
      items: []
    }
  });

  const { fields, append, remove } = useFieldArray({ control, name: "items" });

  const watchExportType = watch("exportType");
  const watchBranchId = watch("branchId");
  const watchTargetId = watch("targetId");
  const watchItems = watch("items");

  const totalAmount = watchItems.reduce((acc, item) => acc + ((item.quantity || 0) * (item.price || 0)), 0);

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsInitialLoading(true);
        // Tải danh mục trước để Select có dữ liệu map tên
        const [resB, resS] = await Promise.all([
          branchService.getAll(),
          supplierService.getAll(undefined, "ACTIVE", 0, 100),
        ]);
        
        const branchList = Array.isArray(resB) ? resB : (resB.content || []);
        setBranches(branchList);
        
        const supplierList = Array.isArray(resS) ? resS : (resS.content || []);
        setSuppliers(supplierList);

        if (isEditMode && exportId) {
          const data = await InventoryExportApiService.getExportCommandDetail(exportId);
          if (["COMPLETED", "APPROVED", "REJECTED"].includes(data.status)) setIsReadOnly(true);
          
          reset({
            status: data.status,
            exportType: "RETURN_SUPPLIER", 
            noteCode: data.code, 
            note: data.note || "",
            expectedDate: data.entryDate || new Date().toLocaleDateString('en-CA'),
            branchId: data.branchId?.toString() || "", 
            targetId: data.supplierId?.toString() || "",
            specificReceiver: data.deliverer || data.specificReceiver || "", 
            shippingAddress: data.shippingAddress || "",
            referenceCode: data.referenceCode || "", 
            creatorName: data.creatorName || data.createdByName || "",
            items: (data.details || []).map((item: any) => ({
              productVariantId: item.productVariantId, 
              sku: item.sku, 
              name: item.productName || item.name || "SP", 
              unit: item.unit || "Cái",
              stock: item.quantityReal || 0, 
              quantity: item.quantityRequested, 
              price: item.price || 0, 
              batchNumber: item.batchNumber || "",
              expiryDate: item.expiryDate || "",
              defectiveQuantity: item.quantityRejected || 0,
              plannedQuantity: item.quantity || 0,
              returnReason: item.note || ""
            }))
          });
        }
      } catch (err) {
        toast.error("Lỗi tải dữ liệu phiếu xuất");
      } finally {
        setIsInitialLoading(false);
      }
    };
    
    if (!hasFetched.current) {
      hasFetched.current = true;
      loadData();
    }
  }, [isEditMode, exportId, reset]);

  // 🔥 TỰ ĐỘNG ĐIỀN TÊN NGƯỜI TẠO KHI TẠO MỚI (ĐỒNG BỘ VỚI NHẬP KHO)
  useEffect(() => {
    if (!isEditMode && currentUser) {
      const name = currentUser.fullName || currentUser.displayName || (currentUser as any).fullname || "";
      if (name) {
        setValue("creatorName", name);
      }
    }
  }, [isEditMode, currentUser, setValue]);

  // 🔥 TỰ ĐỘNG ĐÓNG DROPDOWN KHI CLICK RA NGOÀI
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [dropdownRef]);

  // Xóa useEffect loadMasterData cũ vì đã gộp vào loadData trên
  // Xóa useEffect load chi tiết cũ vì đã gộp vào loadData trên

  // 🔥 TỰ ĐỘNG LẤY DANH SÁCH HÀNG LỖI KHI CHỌN NHÀ CUNG CẤP VÀ CHI NHÁNH
  useEffect(() => {
<<<<<<< Updated upstream
    if (!isEditMode) {
      setValue("targetId", "");
      setValue("noteCode", generateNoteCode(watchExportType));
    }
  }, [watchExportType, isEditMode, setValue]);

  let targetInfo = { name: "", phone: "", address: "" };
  if (watchTargetId) {
    if (watchExportType === "INTERNAL") {
      const branch = branches.find(b => b.id?.toString() === watchTargetId);
      if (branch) {
        targetInfo = { name: branch.managerNames?.[0] || "Quản lý", phone: branch.phone || "", address: branch.addressDetail || "" };
=======
    const fetchDefective = async () => {
      if (!watchTargetId || !watchBranchId || isReadOnly) {
        setAllProducts([]);
        return;
>>>>>>> Stashed changes
      }
      setIsLoadingDefective(true);
      try {
        const data = await InventoryExportApiService.getDefectiveItems(watchTargetId, watchBranchId);
        setAllProducts(Array.isArray(data) ? data : (data.content || []));
      } catch (err) {
        console.error("Lỗi lấy hàng lỗi:", err);
        setAllProducts([]);
      } finally {
        setIsLoadingDefective(false);
      }
    };
    fetchDefective();
  }, [watchTargetId, watchBranchId, isReadOnly]);

  // 🔥 LỌC SẢN PHẨM THEO TỪ KHÓA TÌM KIẾM
  const filteredProducts = allProducts.filter(item => {
    if (!searchTerm) return true;
    const q = searchTerm.toLowerCase();
    return (
      (item.productName || "").toLowerCase().includes(q) ||
      (item.sku || "").toLowerCase().includes(q) ||
      (item.batchNumber || "").toLowerCase().includes(q)
    );
  });

  const addBatchToTable = (batchItem: any) => {
    if (isReadOnly) return;
    
    // Kiểm tra xem lô hàng này đã có trong bảng chưa (so khớp productVariantId VÀ batchNumber)
    if (watchItems.some(item => item.productVariantId === batchItem.variantId && item.batchNumber === batchItem.batchNumber)) {
      toast.warning("Lô hàng này đã có trong danh sách");
      return;
    }
<<<<<<< Updated upstream
    append({
      productVariantId: variant.id,
      sku: variant.sku,
      name: `${productName} ${variant.packaging ? `- ${variant.packaging}` : ''}`,
      unit: variant.unit || "Cái",
      stock: variant.quantity || 0,
      quantity: 1,
      // 👇 ĐÃ CẬP NHẬT Ở ĐÂY: Lấy importPrice để làm giá trị xuất kho
      price: variant.importPrice || variant.price || 0,
      returnReason: ""
=======

    append({
      productVariantId: batchItem.variantId,
      sku: batchItem.sku,
      name: batchItem.productName,
      unit: batchItem.unit || "Cái",
      stock: batchItem.quantity || 0, // Tồn kho tốt thực tế
      defectiveQuantity: batchItem.defectiveQuantity || 0, // Số lượng lỗi tối đa có thể trả
      plannedQuantity: batchItem.plannedQuantity || 0, // 🔥 GÁN GIÁ TRỊ YÊU CẦU BAN ĐẦU
      quantity: batchItem.defectiveQuantity || 0, // Mặc định trả hết số lượng lỗi
      price: batchItem.importPrice || 0,
      batchNumber: batchItem.batchNumber,
      expiryDate: batchItem.expiryDate ? new Date(batchItem.expiryDate).toLocaleDateString('en-CA') : "",
      returnReason: batchItem.reason || "" // 🔥 ĐIỀN SẴN LÝ DO LỖI GỐC
>>>>>>> Stashed changes
    });
    setShowDropdown(false);
    setSearchTerm("");
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
      supplierId: parseInt(data.targetId), // Gửi supplierId cho đúng loại RETURN_SUPPLIER
      specificReceiver: data.specificReceiver,
      shippingAddress: data.shippingAddress,
      createdById: currentUserId,
      status: isAdmin && (!isEditMode || watch("status" as any) === "PENDING") ? "APPROVED" : (isEditMode ? (watch("status" as any)) : "PENDING"),
      details: data.items.map(it => ({
        productVariantId: it.productVariantId,
        requestedQuantity: it.quantity,
        batchNumber: it.batchNumber, // 🔥 BỔ SUNG GỬI SỐ LÔ
        expiryDate: it.expiryDate,     // 🔥 BỔ SUNG GỬI HẠN DÙNG
        defectiveQuantity: it.defectiveQuantity, // 🔥 BỔ SUNG GỬI SL LỖI
        plannedQuantity: it.plannedQuantity,     // 🔥 BỔ SUNG GỬI YÊU CẦU GỐC
        price: it.price,
        note: it.returnReason || ""
      }))
    };

    setIsSubmitting(true);
    try {
      if (isEditMode) {
        await InventoryExportApiService.updateExportCommand(exportId as string, payload);
        
        // Nếu là Admin và đơn đang PENDING, thực hiện gọi duyệt luôn sau khi update
        if (isAdmin && watchStatus === "PENDING") {
          await InventoryExportApiService.approveExportCommand(exportId as string);
          toast.success("Cập nhật và Duyệt lệnh xuất thành công!");
        } else {
          toast.success("Cập nhật lệnh xuất thành công!");
        }
      } else {
        await InventoryExportApiService.createExportCommand(payload);
        toast.success("Tạo lệnh xuất kho thành công!");
      }
      router.push("/admin/exports");
    } catch (e: any) {
      toast.error(e.response?.data?.message || "Lỗi server");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (!exportId) return;
    showConfirm(
      "Xác nhận TỪ CHỐI",
      "Bạn có chắc chắn muốn TỪ CHỐI lệnh xuất này? Hành động này không thể hoàn tác.",
      async () => {
        setIsSubmitting(true);
        try {
          await InventoryExportApiService.rejectExportCommand(exportId);
          toast.success("Đã từ chối lệnh xuất!");
          router.push("/admin/exports");
        } catch (e: any) {
          toast.error(e.response?.data?.message || "Lỗi từ chối lệnh");
        } finally {
          setIsSubmitting(false);
        }
      },
      "destructive"
    );
  };

  const handleApprove = async () => {
    if (!exportId) return;
    showConfirm(
      "Xác nhận DUYỆT lệnh",
      "Xác nhận DUYỆT lệnh xuất kho này? Sau khi duyệt, thủ kho có thể thực hiện xuất hàng thực tế.",
      async () => {
        setIsSubmitting(true);
        try {
          await InventoryExportApiService.approveExportCommand(exportId);
          toast.success("Đã duyệt lệnh xuất thành công!");
          router.push("/admin/exports");
        } catch (e: any) {
          toast.error(e.response?.data?.message || "Lỗi duyệt lệnh");
        } finally {
          setIsSubmitting(false);
        }
      }
    );
  };

  const handleComplete = async () => {
    if (!exportId) return;
    showConfirm(
      "Xác nhận HOÀN TẤT xuất kho",
      "Hệ thống sẽ trừ tồn kho thực tế theo lô hàng đã chọn. Bạn đã kiểm tra kỹ hàng hóa chưa?",
      async () => {
        setIsSubmitting(true);
        try {
          await InventoryExportApiService.completeExportCommand(exportId);
          toast.success("Đã hoàn tất xuất kho thành công!");
          router.push("/admin/exports");
        } catch (e: any) {
          toast.error(e.response?.data?.message || "Lỗi hoàn tất xuất kho");
        } finally {
          setIsSubmitting(false);
        }
      }
    );
  };

  // Stepper component nâng cấp thành sơ đồ quy trình cho Xuất kho
  const WorkflowDiagram = ({ currentStatus }: { currentStatus: string }) => {
    const steps = [
      { key: "PENDING", label: "Lập lệnh xuất", role: "Manager", icon: FileText, desc: "Tạo phiếu dự kiến" },
      { key: "COMPLETED", label: "Hoàn tất xuất", role: "Thủ kho", icon: CheckCircle2, desc: "Trừ tồn kho & Giao đi" },
    ];

    const currentIndex = steps.findIndex(s => s.key === currentStatus);
    const isCancelled = currentStatus === "CANCELLED";

    return (
      <div className="bg-white border border-[#dcdcdc] p-8 mb-6 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 left-0 w-1 h-full bg-blue-600"></div>
        <div className="flex items-center justify-around max-w-3xl mx-auto relative">
          {steps.map((step, idx) => {
            const isDone = idx < currentIndex || currentStatus === "COMPLETED";
            const isCurrent = idx === currentIndex;
            const StepIcon = step.icon;

            return (
              <React.Fragment key={step.key}>
                <div className="flex flex-col items-center gap-3 relative z-10 w-48">
                  <div className={cn(
                    "w-12 h-12 rounded-full flex items-center justify-center border-4 transition-all duration-500 shadow-md",
                    isDone ? "bg-emerald-500 border-emerald-100 text-white" : 
                    isCurrent ? (isCancelled ? "bg-rose-500 border-rose-100 text-white" : "bg-blue-600 border-blue-100 text-white scale-110") : 
                    "bg-slate-50 border-slate-100 text-slate-300"
                  )}>
                    <StepIcon size={22} />
                  </div>
                  <div className="text-center">
                    <p className={cn("text-[11px] font-black uppercase tracking-tighter", isCurrent ? "text-blue-600" : isDone ? "text-emerald-600" : "text-slate-400")}>
                      {step.label}
                    </p>
                    <p className="text-[9px] font-bold text-slate-400 uppercase mt-0.5">{step.role}</p>
                    <p className="text-[10px] text-slate-300 italic mt-1 hidden md:block">{step.desc}</p>
                  </div>
                </div>
                {idx < steps.length - 1 && (
                  <div className="flex-1 h-[2px] bg-slate-100 mx-4 -mt-10 relative overflow-hidden">
                    <div className={cn(
                      "absolute inset-0 transition-all duration-700",
                      isDone ? "bg-emerald-500" : "bg-transparent"
                    )} />
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>
    );
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

  const watchStatus = watch("status" as any) || "PENDING";

  return (
    <form onSubmit={handleSubmit(onSubmit)} className={`space-y-0 pb-[100px] bg-slate-50/30 min-h-screen text-[#1f1f1f] ${isReadOnly ? "select-none opacity-95" : ""}`}>
      {/* 1. Workflow Diagram (Đồng bộ style với Nhập kho) */}
      <div className="h-[80px] w-full bg-white border-b border-slate-200 flex items-center justify-center px-10 shrink-0 mb-6">
        <div className="flex items-center w-full max-w-4xl relative">
          {["LẬP LỆNH", "PHÊ DUYỆT", "XUẤT KHO", "HOÀN TẤT"].map((label, idx) => {
            const status = (watchStatus || "").toUpperCase();
            let activeIdx = 0;
            
            if (!isEditMode) {
              activeIdx = 0; 
            } else {
              if (status === "PENDING") activeIdx = 1;
              else if (status === "APPROVED") activeIdx = 2; 
              else if (status === "SHIPPING") activeIdx = 3; // Step index is 0..3, so step 4 is index 3
              else if (status === "COMPLETED") activeIdx = 3; 
              else if (status === "REJECTED" || status === "CANCELLED") activeIdx = 0;
              else activeIdx = 0;
            }

            // Adjustment for labels: 
            // 0: LẬP LỆNH (Done when PENDING)
            // 1: PHÊ DUYỆT (Done when APPROVED)
            // 2: XUẤT KHO (Done when SHIPPING)
            // 3: HOÀN TẤT (Current when COMPLETED)

            const isDone = idx < activeIdx || (status === "COMPLETED" && idx === 3); 
            const isCurrent = idx === activeIdx && status !== "COMPLETED";
            if (status === "COMPLETED" && idx === 3) {
                // isCurrent = true; // Special case for last step
            }
            const isError = (status === "REJECTED" || status === "CANCELLED") && idx === 0;

            return (
              <React.Fragment key={idx}>
                <div className="flex flex-col items-center z-10">
                  <div className={cn(
                    "w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold border-2 transition-all bg-white", 
                    isDone ? "border-emerald-500 text-emerald-500" : 
                    isCurrent ? (isError ? "border-rose-500 text-rose-500" : "border-blue-600 text-blue-600") : 
                    "border-slate-200 text-slate-300"
                  )}>
                    {isDone ? <BadgeCheck size={14} /> : (isError ? <X size={14}/> : idx + 1)}
                  </div>
                  <span className={cn(
                    "text-[10px] font-bold mt-1 uppercase tracking-tight whitespace-nowrap", 
                    isDone ? "text-emerald-600" : isCurrent ? (isError ? "text-rose-600" : "text-blue-600") : "text-slate-400"
                  )}>{label}</span>
                </div>
                {idx < 3 && <div className={cn("flex-1 h-[2px] mx-2 -mt-4", idx < activeIdx ? "bg-emerald-500" : "bg-slate-100")} />}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      <div className="px-4">
        <div className="flex items-center gap-4 mb-4">
          <Button type="button" variant="ghost" size="icon" onClick={() => router.back()}><ChevronLeft /></Button>
          <div className="flex flex-col">
              <h1 className="text-[18px] font-black uppercase tracking-tight text-[#1f1f1f]">
                 {isEditMode ? (isReadOnly ? "Chi tiết phiếu xuất hàng" : "Cập nhật lệnh xuất") : "Lập lệnh xuất kho"}
              </h1>
          </div>
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
                <div className="h-10 w-full border border-slate-200 bg-slate-50 flex items-center px-3 text-[13px] font-bold text-blue-600 uppercase">
                  <ShoppingBag size={14} className="mr-2"/> Xuất trả nhà cung cấp
                </div>
              </div>

              <div className="space-y-1.5 flex flex-col">
                <Label className="text-[10px] font-bold uppercase flex items-center gap-1 mb-1 text-slate-400 tracking-wider"><Hash size={12}/> Mã phiếu (Tự động)</Label>
                <Input {...register("noteCode")} readOnly className="rounded-none bg-slate-50 text-slate-500 font-mono text-[13px] h-10 w-full border-slate-200" />
              </div>

<<<<<<< Updated upstream
=======
              <div className="space-y-1.5 flex flex-col">
                <Label className="text-[10px] font-bold uppercase mb-1 text-slate-400 tracking-wider">Mã vận đơn / Tham chiếu</Label>
                <Input readOnly={isReadOnly} {...register("referenceCode")} className="rounded-none text-[13px] h-10 w-full border-slate-200 shadow-none" placeholder="Nhập mã tham chiếu..." />
              </div>
>>>>>>> Stashed changes

              <div className="space-y-1.5 flex flex-col">
                <Label className="text-[10px] font-bold uppercase text-blue-600 flex items-center gap-1 mb-1 tracking-wider">Ngày hẹn trả hàng</Label>
                <div className="relative w-full">
                  <Input readOnly={isReadOnly} type="date" {...register("expectedDate")} className={`rounded-none border-slate-200 text-[13px] h-10 w-full pr-10 shadow-none block ${errors.expectedDate ? "border-rose-500" : ""} ${isReadOnly ? 'bg-slate-50' : ''}`} />
                  <CalendarIcon size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                </div>
                {errors.expectedDate && <p className="text-rose-500 text-[10px] mt-1">{errors.expectedDate.message}</p>}
              </div>

              <div className="col-span-2 space-y-1.5 flex flex-col mt-2">
                <Label className="text-[10px] font-bold uppercase mb-1 text-slate-400 tracking-wider">Lý do trả hàng (*)</Label>
                <Textarea readOnly={isReadOnly} {...register("note")} className={`rounded-none min-h-[80px] text-[13px] w-full shadow-none ${errors.note ? "border-rose-500" : "border-slate-200"} ${isReadOnly ? 'bg-slate-50' : ''}`} placeholder="Nhập lý do xuất trả hàng lỗi cho NCC..." />
                {errors.note && <p className="text-rose-500 text-[10px] mt-1">{errors.note.message}</p>}
              </div>
            </div>
          </div>

          <div className="bg-white border border-slate-200 shadow-sm overflow-visible">
             <div className="px-5 py-3 bg-[#f8f9fa] border-b flex flex-wrap items-center gap-4">
                <h3 className="text-[11px] font-black uppercase flex items-center gap-2 whitespace-nowrap"><ShoppingBag size={16} className="text-blue-600"/> 2. Sản phẩm trả hàng (Hàng lỗi từ Đơn nhập)</h3>

                <div className="relative flex-1 min-w-[300px]" ref={dropdownRef}>
                  <div className="relative">
                    {!isReadOnly && <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />}
                    <Input 
                      readOnly={isReadOnly || !watchTargetId} 
                      placeholder={!watchTargetId ? "--- Vui lòng chọn Nhà cung cấp trước ---" : (isReadOnly ? "Phiếu đã xuất" : "Tìm tên SP, SKU trong danh sách hàng lỗi...")} 
                      className={cn(
                        "pl-10 h-10 text-[13px] border-slate-200 rounded-none w-full shadow-none",
                        !watchTargetId ? "bg-slate-50 cursor-not-allowed italic text-slate-400" : "bg-white",
                        isReadOnly ? 'bg-slate-50' : ''
                      )} 
                      value={searchTerm} 
                      onChange={(e) => { setSearchTerm(e.target.value); setShowDropdown(true); }} 
                      onFocus={() => setShowDropdown(true)} 
                    />
                  </div>

                  {showDropdown && !isReadOnly && watchTargetId && (
                    <div className="absolute top-full left-0 w-full mt-1 bg-white border border-slate-200 shadow-2xl rounded-sm overflow-hidden flex flex-col z-[9999]">
                      <div className="max-h-[400px] overflow-y-auto">
<<<<<<< Updated upstream
                        {allProducts.length > 0 ? (
                          allProducts.map((variant) => (
                            <div
                              key={variant.id || variant.sku}
                              className="p-3 border-b border-slate-100 hover:bg-slate-50 transition-colors cursor-pointer flex justify-between items-center group"
                              onClick={() => addVariantToTable(variant, variant.productName || variant.unit)}
                            >
                              <div className="flex items-center gap-3">
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
                                   </p>
                                 </div>
                              </div>

                              <div className="text-right">
                                {/* 👇 ĐÃ SỬA CẢ HIỂN THỊ TẠI DROPDOWN THÀNH GIÁ NHẬP */}
                                <p className="text-[13px] font-bold text-slate-700">{formatNumber(variant.importPrice || variant.price || 0)} ₫</p>
                                <p className={cn(
                                    "text-[11px] font-bold px-2 py-0.5 rounded-sm mt-1 inline-block border",
                                    variant.quantity > 0
                                      ? "text-blue-600 bg-blue-50 border-blue-100"
                                      : "text-rose-600 bg-rose-50 border-rose-100"
                                )}>
                                   Tồn kho xuất: {variant.quantity || 0}
                                </p>
=======
                        {isLoadingDefective ? (
                          <div className="p-10 text-center flex flex-col items-center gap-2">
                             <Loader2 className="animate-spin text-blue-600" size={24}/>
                             <p className="text-slate-500 text-[12px] font-medium uppercase">Đang tìm hàng lỗi...</p>
                          </div>
                        ) : filteredProducts.length > 0 ? (
                          filteredProducts.map((item, idx) => (
                            <div
                              key={idx}
                              className="p-3 border-b border-slate-50 hover:bg-slate-50 transition-colors cursor-pointer flex justify-between items-center group"
                              onClick={() => addBatchToTable(item)}
                            >
                              <div className="flex items-center gap-3">
                                 <div>
                                   <p className="text-[13px] font-bold text-slate-700">
                                     {item.productName}
                                   </p>
                                   <div className="flex items-center gap-3 mt-0.5 text-[11px] text-slate-500">
                                     <span className="font-mono">SKU: {item.sku}</span>
                                     <span className="text-slate-400">|</span>
                                     <span>Số lô: {item.batchNumber}</span>
                                     {item.expiryDate && (
                                       <>
                                         <span className="text-slate-400">|</span>
                                         <span>HSD: {new Date(item.expiryDate).toLocaleDateString('vi-VN')}</span>
                                       </>
                                     )}
                                   </div>
                                 </div>
                              </div>

                              <div className="text-right flex flex-col items-end gap-0.5">
                                {canSeePrice && (
                                  <p className="text-[12px] font-medium text-slate-600">
                                    {formatNumber(item.importPrice || 0)} ₫
                                  </p>
                                )}
                                <div className="text-[11px] flex flex-col items-end">
                                   <span className="text-slate-600">Yêu cầu: {item.plannedQuantity || 0}</span>
                                   <span className="text-rose-600 font-bold">SL Lỗi: {item.defectiveQuantity || 0}</span>
                                </div>
>>>>>>> Stashed changes
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="p-10 text-center flex flex-col items-center gap-2">
                             <AlertCircle className="text-slate-300" size={24}/>
                             <p className="text-slate-500 text-[12px] font-medium">
                                {searchTerm ? "Không tìm thấy hàng lỗi phù hợp." : "Nhà cung cấp này hiện không có hàng lỗi nào có thể trả."}
                             </p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
             </div>

             <div className="overflow-x-auto">
<<<<<<< Updated upstream
               <Table>
                  <TableHeader className="bg-slate-50">
                     <TableRow>
                        <TableHead className="w-[40px] text-[10px] font-black uppercase text-slate-500 text-center tracking-wider">#</TableHead>
                        <TableHead className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Mã SKU</TableHead>
                        <TableHead className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Tên sản phẩm</TableHead>
                        <TableHead className="text-right text-[10px] font-black uppercase text-blue-600 w-[110px] tracking-wider">SL Xuất</TableHead>
                        {watchExportType === "RETURN" && (
                          <TableHead className="text-[10px] font-black uppercase text-rose-600 min-w-[200px] tracking-wider">Lý do trả hàng</TableHead>
                        )}
                        <TableHead className="text-right text-[10px] font-black uppercase text-slate-500 tracking-wider">Giá Vốn</TableHead>
                        <TableHead className="w-[50px]"></TableHead>
=======
               <Table className="border-none w-full">
                  <TableHeader className="bg-transparent border-b border-slate-200">
                     <TableRow className="hover:bg-transparent border-none">
                        <TableHead className="w-[40px] text-[10px] font-bold uppercase text-slate-400 text-center whitespace-nowrap">#</TableHead>
                        <TableHead className="min-w-[200px] text-[10px] font-bold uppercase text-slate-400 whitespace-nowrap">Sản phẩm / SKU</TableHead>
                        <TableHead className="w-[120px] text-[10px] font-bold uppercase text-slate-400 whitespace-nowrap">Yêu cầu & Lỗi</TableHead>
                        <TableHead className="w-[150px] text-[10px] font-bold uppercase text-slate-400 text-center whitespace-nowrap">Số lô / Hạn dùng</TableHead>
                        {canSeePrice && (
                          <TableHead className="text-right text-[10px] font-bold uppercase text-slate-400 w-[120px] whitespace-nowrap">Giá nhập</TableHead>
                        )}
                        <TableHead className="text-right text-[10px] font-bold uppercase text-slate-400 w-[100px] whitespace-nowrap">SL Trả</TableHead>
                        <TableHead className="text-[10px] font-bold uppercase text-slate-400 min-w-[200px] whitespace-nowrap">Lý do lỗi gốc</TableHead>
                        <TableHead className="w-[50px] text-center"></TableHead>
>>>>>>> Stashed changes
                     </TableRow>
                  </TableHeader>
                  <TableBody>
                    {fields.length === 0 ? (
<<<<<<< Updated upstream
                      <TableRow><TableCell colSpan={watchExportType === "RETURN" ? 7 : 6} className="h-[150px] text-center text-slate-300 italic font-medium tracking-widest uppercase text-[11px]">Chưa có sản phẩm nào được chọn</TableCell></TableRow>
=======
                      <TableRow className="border-none"><TableCell colSpan={canSeePrice ? 7 : 6} className="h-[150px] text-center text-slate-300 italic font-medium uppercase text-[10px] tracking-widest">Chưa chọn sản phẩm</TableCell></TableRow>
>>>>>>> Stashed changes
                    ) : (
                      fields.map((field, index) => {
                        const currentItem = watchItems[index] as any;
                        
                        return (
<<<<<<< Updated upstream
                          <React.Fragment key={field.id}>
                            <TableRow className="hover:bg-slate-50/50">
                              <TableCell className="text-center text-slate-400 font-bold text-[11px]">{index + 1}</TableCell>
                              <TableCell className="font-mono text-[12px] text-slate-500">{currentItem?.sku}</TableCell>
                              <TableCell className="font-bold text-[13px] text-slate-700">
                                {currentItem?.name}
                                <div className="text-[10px] text-emerald-600 font-bold mt-0.5">
                                  Tồn kho xuất: {currentItem?.stock || 0}
                                </div>
                              </TableCell>
=======
                          <TableRow key={field.id} className="hover:bg-slate-50/50 border-b border-slate-100 last:border-none transition-colors">
                            <TableCell className="text-center text-slate-300 font-bold text-[11px]">{index + 1}</TableCell>
                            
                            <TableCell className="py-4">
                               <div className="font-bold text-[13px] text-slate-800 mb-1">{currentItem?.name}</div>
                               <div className="text-[10px] text-slate-400 font-mono uppercase">SKU: {currentItem?.sku}</div>
                            </TableCell>

                            <TableCell>
                               <div className="space-y-0.5">
                                  <div className="text-[11px] text-slate-900">Yêu cầu: {currentItem?.plannedQuantity || 0}</div>
                                  <div className="text-[11px] text-rose-600">Lỗi: {currentItem?.defectiveQuantity || 0}</div>
                               </div>
                            </TableCell>
>>>>>>> Stashed changes

                            <TableCell className="text-center">
                               <div className="text-[12px] text-slate-700 font-medium">{currentItem?.batchNumber || "---"}</div>
                               {currentItem?.expiryDate && (
                                 <div className="text-[10px] text-slate-400 mt-0.5 uppercase tracking-tighter">HSD: {currentItem.expiryDate}</div>
                               )}
                            </TableCell>

                            {canSeePrice && (
                              <TableCell className="text-right text-slate-700 text-[13px]">
                                {formatNumber(currentItem?.price || 0)} ₫
                              </TableCell>
<<<<<<< Updated upstream

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
                                <TableCell colSpan={watchExportType === "RETURN" ? 7 : 6} className="p-1 px-4 text-[11px] text-rose-500 font-bold">
                                  {hasQtyError && <span className="mr-4">• Lỗi SL: {hasQtyError.message}</span>}
                                  {hasReasonError && <span>• Lỗi Lý do: {hasReasonError.message}</span>}
                                </TableCell>
                              </TableRow>
=======
>>>>>>> Stashed changes
                            )}

                            <TableCell className="text-right">
                                <div className="text-[15px] font-black text-blue-600 pr-2">
                                  {currentItem?.quantity}
                                </div>
                                <input type="hidden" {...register(`items.${index}.quantity`)} />
                            </TableCell>

                            <TableCell className="py-4">
                                <div className="text-[11px] text-slate-500 italic leading-relaxed">
                                  {currentItem?.returnReason || "---"}
                                </div>
                                <input type="hidden" {...register(`items.${index}.returnReason`)} />
                            </TableCell>

                            <TableCell className="text-center">
                                {!isReadOnly && (
                                  <button type="button" onClick={() => remove(index)} className="p-2 text-slate-200 hover:text-rose-500 transition-colors">
                                    <Trash2 size={14}/>
                                  </button>
                                )}
                            </TableCell>
                          </TableRow>
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
                <Label className="text-[10px] font-bold uppercase text-slate-400">Chọn chi nhánh xuất hàng (*)</Label>
                <Controller
                  name="branchId"
                  control={control}
                  render={({ field }) => (
                    <Select onValueChange={(val) => {
                        field.onChange(val);
                    }} value={field.value} disabled={isReadOnly || isEditMode}>
                       <SelectTrigger className={`rounded-none font-bold h-10 ${errors.branchId ? "border-rose-500" : "border-slate-200"}`}><SelectValue placeholder="-- Chọn kho xuất --" /></SelectTrigger>
                       <SelectContent className="rounded-none">
                         {branches
                           .filter(b => b.branchType === "WAREHOUSE")
                           .map(b => (
                             <SelectItem key={b.id} value={b.id.toString()}>
                               {b.name.toUpperCase()} <span className="text-slate-400 ml-1 text-[10px]">(Kho tổng)</span>
                             </SelectItem>
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
             <div className="flex items-center gap-2 font-bold text-[11px] uppercase border-b pb-2"><UserCheck size={16}/> Nhà cung cấp nhận hàng</div>
             <div className="space-y-1.5 flex flex-col">
                <Label className="text-[10px] font-bold uppercase text-slate-400">Chọn nhà cung cấp trả hàng (*)</Label>
                <Controller
                  name="targetId"
                  control={control}
                  render={({ field }) => (
                    <Select onValueChange={(val) => {
                       field.onChange(val);
                       // Tự động điền thông tin khi chọn NCC
                       const supplier = suppliers.find(s => s.id?.toString() === val);
                       if (supplier) {
                         setValue("specificReceiver", supplier.contactName || "");
                         setValue("shippingAddress", supplier.addressDetail || "");
                       }
                    }} value={field.value} disabled={isReadOnly || isEditMode}>
                       <SelectTrigger className={`rounded-none h-10 font-bold ${errors.targetId ? "border-rose-500" : "border-slate-200"}`}><SelectValue placeholder="-- Chọn nhà cung cấp --" /></SelectTrigger>
                       <SelectContent className="rounded-none">
                          {suppliers.map(s => <SelectItem key={s.id} value={s?.id?.toString() || ""}>{s.name?.toUpperCase()}</SelectItem>)}
                       </SelectContent>
                    </Select>
                  )}
                />
                {errors.targetId && <p className="text-rose-500 text-[10px] mt-1">{errors.targetId.message}</p>}
             </div>
             <div className="space-y-1.5 pt-2 flex flex-col">
                 <Label className="text-[10px] font-bold uppercase text-slate-400 mb-1">Người đại diện NCC (*)</Label>
                 <Input readOnly={isReadOnly} {...register("specificReceiver")} className={`rounded-none text-[13px] h-10 ${errors.specificReceiver ? "border-rose-500" : "border-slate-200"}`} placeholder="Tên người nhận..." />
                 {errors.specificReceiver && <p className="text-rose-500 text-[10px] mt-1">{errors.specificReceiver.message}</p>}
             </div>
             <div className="space-y-1.5 flex flex-col">
                 <Label className="text-[10px] font-bold uppercase text-slate-400 mb-1">Địa chỉ trả hàng (*)</Label>
                 <Textarea readOnly={isReadOnly} {...register("shippingAddress")} className={`rounded-none min-h-[60px] text-[13px] ${errors.shippingAddress ? "border-rose-500" : "border-slate-200"}`} placeholder="Địa chỉ giao hàng thực tế..." />
                 {errors.shippingAddress && <p className="text-rose-500 text-[10px] mt-1">{errors.shippingAddress.message}</p>}
             </div>
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
               {formatNumber(watchItems.reduce((acc, i) => acc + ((Number(i.quantity) || 0) * (Number(i.price) || 0)), 0))} ₫
            </span></span>
         </div>
         <div className="flex gap-3">
           <Button type="button" variant="outline" className="rounded-none uppercase px-8 border-slate-300 bg-white" onClick={() => router.back()}>{isReadOnly ? "Quay lại" : "Hủy bỏ"}</Button>
           
           {isEditMode && watchStatus === "APPROVED" && (
             <Button type="button" className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-none font-black px-8 uppercase" onClick={handleComplete} disabled={isSubmitting}>
               {isSubmitting ? <Loader2 className="animate-spin mr-2" /> : <BadgeCheck size={18} className="mr-2" />}
               Hoàn tất xuất kho
             </Button>
           )}

           {isEditMode && watchStatus === "PENDING" && isAdmin && (
             <>
               <Button type="button" variant="outline" className="text-rose-600 border-rose-200 hover:bg-rose-50 rounded-none px-8 font-bold uppercase" onClick={handleReject} disabled={isSubmitting}>
                 Từ chối
               </Button>
               <Button type="submit" disabled={isSubmitting} className="bg-blue-600 hover:bg-blue-700 text-white rounded-none font-black px-10 uppercase">
                 {isSubmitting ? <Loader2 className="animate-spin mr-2" /> : <Save size={18} className="mr-2" />}
                 Duyệt lệnh
               </Button>
             </>
           )}

           {watchStatus === "PENDING" && !isAdmin && (
             <Button type="submit" disabled={isSubmitting} className="bg-blue-600 hover:bg-blue-700 text-white rounded-none font-black px-10 uppercase">
               {isSubmitting ? <Loader2 className="animate-spin mr-2" /> : <Save size={18} className="mr-2" />}
               Gửi duyệt
             </Button>
           )}

           {!isEditMode && isAdmin && (
             <Button type="submit" disabled={isSubmitting} className="bg-blue-600 hover:bg-blue-700 text-white rounded-none font-black px-10 uppercase">
               {isSubmitting ? <Loader2 className="animate-spin mr-2" /> : <Save size={18} className="mr-2" />}
               Lưu & Duyệt
             </Button>
           )}
         </div>
      </div>

      {/* AlertDialog dành cho các xác nhận quan trọng */}
      <AlertDialog open={confirmConfig.open} onOpenChange={(o) => setConfirmConfig({ ...confirmConfig, open: o })}>
        <AlertDialogContent className="rounded-none border-2 border-slate-200 shadow-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-[16px] font-black uppercase text-slate-800 flex items-center gap-2">
              <AlertCircle className={cn("w-5 h-5", confirmConfig.variant === "destructive" ? "text-rose-500" : "text-blue-500")} />
              {confirmConfig.title}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-[13px] font-medium text-slate-500 leading-relaxed pt-2">
              {confirmConfig.description}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="pt-4 gap-3">
            <AlertDialogCancel className="rounded-none border-slate-300 text-slate-500 font-bold uppercase text-[11px] h-9 px-6 hover:bg-slate-50">Quay lại</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmConfig.action}
              className={cn(
                "rounded-none font-black uppercase text-[11px] h-9 px-8 shadow-lg transition-all",
                confirmConfig.variant === "destructive" ? "bg-rose-600 hover:bg-rose-700" : "bg-blue-600 hover:bg-blue-700"
              )}
            >
              Xác nhận
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
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
