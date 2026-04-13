"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm, Controller, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { transferService } from "@/app/services/transfer.service";
import { branchService } from "@/app/services/branchService";
import { ProductService } from "@/app/services/product.service";
import {
  X,
  Settings,
  HelpCircle,
  Plus,
  Trash2,
  Search,
  Truck,
  User,
  FileText,
  ChevronRight,
  CheckCircle2,
  AlertCircle,
  ArrowRightLeft,
  ChevronLeft,
  Save,
  Car,
  ScanBarcode,
  ListPlus,
  ListChecks,
  History,
  MapPin,
  Building2,
  ArrowDownToLine,
  Warehouse,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { TransferSchema } from "@/app/types/inventory.schema";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function NewTransferPage() {
  const router = useRouter();
<<<<<<< Updated upstream
=======
  const { hasPermission } = usePermissions();
  const { user } = useAuthStore();
  
  // 🔥 CẬP NHẬT: Cho phép tất cả nhân viên (không phải USER) thấy giá & lô
  const isAdmin = hasPermission(P.TRANSFER_APPROVE);
  const canSeePrice = user?.role?.slug !== "USER"; 
  
>>>>>>> Stashed changes
  const searchParams = useSearchParams();
  const sourceCode = searchParams.get("source");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [branches, setBranches] = useState<any[]>([]);

  const onError = (errors: any) => {
    console.log("Lỗi Validation của Zod:", errors);
    toast.error("Dữ liệu chưa hợp lệ! Vui lòng kiểm tra các ô báo lỗi màu đỏ.");
  };

  useEffect(() => {
    const fetchBranches = async () => {
      try {
        const data = await branchService.getAll();
        setBranches(data);
      } catch (error) {
        console.error("Lỗi fetch chi nhánh", error);
        toast.error("Không thể tải danh sách chi nhánh");
      }
    };
    fetchBranches();
  }, []);

  const userRole = user?.role?.slug || "USER";
  const initialStatus = userRole === "ADMIN" ? "APPROVED" : "PENDING";

  const {
    register,
    handleSubmit,
    control,
    setValue,
    watch,
    formState: { errors },
  } = useForm<any>({
    resolver: zodResolver(TransferSchema),
    mode: "onTouched",
    defaultValues: {
      transferCode: "PDC-" + Date.now().toString().slice(-6),
      sourceBranchId: "",
      destBranchId: "",
      transferDate: new Date().toISOString().slice(0, 16),
      status: initialStatus,
      priority: "MEDIUM",
      transferType: "WAREHOUSE_TRANSFER",
      referenceCode: sourceCode || "",
      items: [],
      note: "",
      description: sourceCode ? `Xuất điều chuyển theo yêu cầu ${sourceCode}` : "",
      transporter: "",
    },
  });

  const watchStatus = watch("status") || "PENDING";
  const currentSourceBranch = watch("sourceBranchId");
  const currentDestBranch = watch("destBranchId");

  const selectedSourceData = useMemo(() => {
    return branches.find(b => b.id.toString() === currentSourceBranch);
  }, [branches, currentSourceBranch]);

  const selectedDestData = useMemo(() => {
    return branches.find(b => b.id.toString() === currentDestBranch);
  }, [branches, currentDestBranch]);

  const { fields, append, remove } = useFieldArray({
    control,
    name: "items",
  });

  const isQCMode = watchStatus === "SHIPPING" || watchStatus === "COMPLETED";

  const onSubmit = async (formData: any) => {
    setIsSubmitting(true);
    try {
      const payload = {
        fromBranchId: formData.sourceBranchId,
        toBranchId: formData.destBranchId,
        transferDate: formData.transferDate,
        description: formData.description,
        transporter: formData.transporter,
        referenceCode: formData.referenceCode,
        status: formData.status,
        priority: formData.priority,
        transferType: formData.transferType,
        note: formData.note,
        items: formData.items.map((item: any) => ({
          sku: item.productCode,
          productName: item.productName,
          unit: item.unit,
          quantity: Number(item.plannedQuantity),
          quantityReal: Number(item.quantityReal) || 0,
          quantityAccepted: Number(item.quantityAccepted) || 0,
          quantityRejected: Number(item.quantityRejected) || 0,
          lotNumber: item.lotNumber,
          expiryDate: item.expiryDate,
        })),
      };

      await transferService.create(payload);
      toast.success("Đã tạo phiếu điều chuyển thành công!");
      router.push("/admin/transfers");
    } catch (error: any) {
      toast.error(error?.response?.data?.message || error?.message || "Đã xảy ra lỗi!");
    } finally {
      setIsSubmitting(false);
    }
  };

  const steps = [
    { key: "START", label: "Khởi tạo", role: "Manager" },
    { key: "PENDING", label: "Phê duyệt", role: "Admin" },
    { key: "SHIPPING", label: "Vận chuyển", role: "Kho gửi" },
    { key: "COMPLETED", label: "Hoàn thành", role: "Kho nhận" },
  ];

  const WorkflowDiagram = () => {
    return (
      <div className="bg-white border border-slate-200 p-6 mb-6 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 left-0 w-1 h-full bg-blue-600"></div>
        <div className="flex items-center justify-between max-w-4xl mx-auto relative px-4">
          {steps.map((step, idx) => {
            const isDone = idx < 0; 
            const isCurrent = idx === 0;

            return (
              <React.Fragment key={idx}>
                <div className="flex flex-col items-center gap-2 relative z-10">
                  <div className={cn(
                    "w-9 h-9 rounded-full flex items-center justify-center border-2 transition-all duration-500 text-[13px] font-black",
                    isDone ? "bg-emerald-500 border-emerald-500 text-white shadow-sm" : 
                    isCurrent ? "bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-100" : 
                    "bg-white border-slate-200 text-slate-400"
                  )}>
                    {idx + 1}
                  </div>
                  <div className="text-center">
                    <p className={cn("text-[10px] font-black uppercase tracking-tight", isCurrent ? "text-blue-600" : isDone ? "text-emerald-600" : "text-slate-400")}>
                      {step.label}
                    </p>
                    <p className="text-[9px] font-bold text-slate-300 uppercase">{step.role}</p>
                  </div>
                </div>
                {idx < steps.length - 1 && (
                  <div className="flex-1 h-[2px] bg-slate-100 mx-4 -mt-8 relative overflow-hidden">
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

  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const openProductDropdown = () => {
    if (!currentSourceBranch) {
      toast.error("Vui lòng chọn 'Chi nhánh xuất hàng' trước khi thêm hàng hóa!");
      return;
    }
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
    setShowDropdown(true);
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      // Chỉ fetch khi dropdown mở (onFocus) hoặc có searchTerm
      if (!showDropdown || !currentSourceBranch) return;

      setIsSearching(true);
      try {
        const results = await ProductService.searchVariants(searchTerm, currentSourceBranch);
        // Hỗ trợ cả Page object (content) và ApiResponse (data) hoặc Array trực tiếp
        const finalData = Array.isArray(results) 
          ? results 
          : (results?.content || results?.data || []);
        
        setSearchResults(finalData);
      } catch (error: any) {
        console.error("Lỗi tìm sản phẩm chi tiết:", error);
        // Handle Network Error or other API errors
        toast.error("Lỗi kết nối khi tìm sản phẩm. Vui lòng kiểm tra backend hoặc CORS.");
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm, currentSourceBranch, showDropdown]);

<<<<<<< Updated upstream
  const handleSelectProduct = (variant: any) => {
      // 1. Kiểm tra trùng dựa trên SKU giống Nhập kho
      const isExist = fields.some((f: any) => f.productCode === variant.sku);
      if (isExist) {
        toast.error("Sản phẩm này đã có trong danh sách!");
        return;
      }

      let displayName = variant.productName || "Sản phẩm";
      if (variant.sku) displayName += ` [${variant.sku}]`;

      // 2. Append dữ liệu - Dùng variant.sku làm định danh chính
=======
  const handleSelectProduct = (variant: any, batch?: any) => {
      // 1. Xác định thông tin lô thực tế được chọn
      const actualBatchNumber = batch ? batch.batchNumber : (variant.batchNumber || "");
      const actualExpiryDate = batch ? batch.expiryDate : (variant.expiryDate || "");
      const actualQuantity = batch ? batch.quantity : (variant.quantity || 0);

      // 2. Kiểm tra trùng dựa trên SKU + Số lô
      const isExist = fields.some((f: any) => 
        f.productCode === variant.sku && 
        (f.batchNumber || "") === (actualBatchNumber || "")
      );
      
      if (isExist) {
        toast.error(`Lô hàng "${actualBatchNumber || 'Mặc định'}" của sản phẩm này đã có trong danh sách!`);
        return;
      }

      let displayName = variant.productName || variant.unit || "Sản phẩm";
      if (variant.sku) displayName += ` [${variant.sku}]`;

      // 3. Append dữ liệu vào bảng
>>>>>>> Stashed changes
      append({
        variantId: variant.id,
        productCode: variant.sku, // <--- SKU là duy nhất
        productName: displayName,
        unit: variant.unit || "Cái",
<<<<<<< Updated upstream
        quantity: 1,
        availableQuantity: variant.quantity || 0,
=======
        plannedQuantity: 1,
        importPrice: variant.importPrice || 0,
        availableQuantity: actualQuantity,
        batchNumber: actualBatchNumber,
        expiryDate: actualExpiryDate,
>>>>>>> Stashed changes
        itemNote: "",
      });

      setSearchTerm("");
      setShowDropdown(false);
<<<<<<< Updated upstream
      toast.success("Đã thêm biến thể thành công!");
=======
      toast.success(`Đã thêm lô "${actualBatchNumber || 'Mặc định'}" thành công!`);
>>>>>>> Stashed changes
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit, onError)}
      className="space-y-4 pb-[100px] bg-slate-50/30 p-4"
    >
      {/* Page Header */}
      <div className="flex items-center gap-4 mb-2 px-1">
        <Button type="button" variant="ghost" size="icon" onClick={() => router.back()} className="h-8 w-8 text-slate-400">
          <ChevronLeft size={20} />
        </Button>
        <div className="flex flex-col">
          <h1 className="text-[18px] font-black text-[#1f1f1f] tracking-tight uppercase">
            Lập phiếu điều chuyển hàng hóa
          </h1>
        </div>
      </div>

      {/* SƠ ĐỒ QUY TRÌNH */}
      <WorkflowDiagram />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="lg:col-span-9 space-y-5">
          {/* Section 1: Thông tin lệnh */}
          <div className="bg-white border border-[#dcdcdc] p-6 rounded-none shadow-sm">
            <div className="flex items-center gap-2 mb-6 text-blue-700 font-black text-[11px] uppercase tracking-widest border-b pb-3">
              <ArrowRightLeft size={16} /> 1. Thông tin lệnh điều chuyển hàng hóa
            </div>
            <div className="grid grid-cols-1 md:grid-cols-12 gap-x-6 gap-y-5">

              <div className="md:col-span-4 space-y-1.5">
                <Label className="text-[10px] font-black text-rose-600 uppercase tracking-tight">Mã phiếu hệ thống</Label>
                <Input
                  {...register("transferCode")}
                  readOnly
                  className="h-[34px] text-[13px] border-[#ccc] rounded-none bg-slate-50 font-mono text-slate-500 cursor-not-allowed"
                />
              </div>

              <div className="md:col-span-8 space-y-1.5 animate-in fade-in zoom-in-95 duration-300">
                <Label className="text-[10px] font-black text-blue-600 uppercase tracking-tight">Người / Tài xế vận chuyển</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={14} />
                  <Input
                    {...register("transporter")}
                    className={cn("h-[34px] pl-9 text-[13px] rounded-none shadow-none", errors.transporter ? "border-rose-500 focus:border-rose-500" : "border-[#ccc] focus:border-blue-500")}
                    placeholder="Họ tên người vận chuyển..."
                  />
                </div>
                {errors.transporter && <p className="text-rose-500 text-[10px] font-medium">{errors.transporter.message as string}</p>}
              </div>

              <div className="md:col-span-12 space-y-1.5">
                <Label className="text-[10px] font-black text-slate-500 uppercase tracking-tight">Lý do điều chuyển / Diễn giải *</Label>
                <Input
                  {...register("description")}
                  className={cn("h-[34px] text-[13px] rounded-none font-bold shadow-none", errors.description ? "border-rose-500 focus:border-rose-500" : "border-[#ccc] focus:border-blue-500")}
                />
                {errors.description && <p className="text-rose-500 text-[10px] font-medium">{errors.description.message as string}</p>}
              </div>

            </div>
          </div>

          {/* Section 2: Danh mục hàng hóa */}
          <div className="bg-white border border-[#dcdcdc] rounded-none shadow-sm">
            <div className="px-5 py-3 border-b border-[#eee] bg-[#f8f9fa] flex flex-wrap items-center justify-between gap-4">
              <h3 className="text-[11px] font-black text-slate-700 uppercase flex items-center gap-2 tracking-wider whitespace-nowrap">
                <Plus size={16} className="text-blue-600" /> 2. Danh mục vật tư điều chuyển
              </h3>

              <div className="flex flex-1 items-center gap-2 min-w-[300px] max-w-[600px]">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <Input
                    ref={searchInputRef}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onFocus={openProductDropdown}
                    onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
                    disabled={!currentSourceBranch}
                    placeholder={!currentSourceBranch ? "Vui lòng chọn Kho xuất trước..." : "Tìm theo tên, mã SKU...(F3)"}
                    className="pl-10 h-9 text-[13px] border-slate-200 rounded-none focus:border-blue-500 shadow-none bg-white relative z-20 disabled:bg-slate-50"
                  />

                  {showDropdown && currentSourceBranch && (
<<<<<<< Updated upstream
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 shadow-xl z-50 max-h-[300px] overflow-y-auto">
                      {isSearching ? (
                        <div className="p-3 text-center text-[12px] text-slate-400 italic">Đang tải dữ liệu...</div>
                      ) : searchResults.length > 0 ? (
                        searchResults.map((variant) => (
                          <div
                            key={variant.id}
                            onMouseDown={() => handleSelectProduct(variant)}
                            className="flex items-center justify-between p-2.5 hover:bg-blue-50 border-b border-slate-100 cursor-pointer transition-colors"
                          >
                            <div>
                              <p className="text-[12px] font-bold text-slate-800">{variant.productName || variant.unit}</p>
                              <p className="text-[10px] text-slate-500">SKU: <span className="font-mono text-blue-600">{variant.sku}</span></p>
                            </div>
                            <div className="text-right">
                              <p className={cn("text-[11px] font-black", (variant.quantity || 0) > 0 ? "text-emerald-600" : "text-rose-500")}>
                                Tồn: {variant.quantity || 0}
                              </p>
                              <p className="text-[10px] text-slate-400">Cái</p>
                            </div>
                          </div>
                        ))
=======
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 shadow-xl z-[1001] max-h-[400px] overflow-y-auto">
                      {isSearching ? (
                        <div className="p-3 text-center text-[12px] text-slate-400 italic">Đang tải dữ liệu...</div>
                      ) : searchResults.length > 0 ? (
                        searchResults.map((variant, variantIdx) => {
                          // Nếu variant có mảng batches, hiện từng batch
                          if (variant.batches && variant.batches.length > 0) {
                            return variant.batches.map((batch: any, batchIdx: number) => (
                              <div
                                key={`v-${variant.id || variant.sku}-b-${batch.id || batch.batchNumber || 'no-batch'}-${variantIdx}-${batchIdx}`}
                                onMouseDown={() => handleSelectProduct(variant, batch)}
                                className="flex items-center justify-between p-2.5 hover:bg-blue-50 border-b border-slate-100 cursor-pointer transition-colors group"
                              >
                                <div className="flex items-center gap-3">
                                   <div className="w-10 h-10 bg-white border border-slate-200 rounded-sm overflow-hidden flex items-center justify-center">
                                      {variant.imageUrl ? (
                                        <img src={variant.imageUrl} alt={variant.sku} className="w-full h-full object-cover" />
                                      ) : <Package size={16} className="text-slate-300" />}
                                   </div>
                                   <div>
                                     <p className="text-[12px] font-bold text-slate-800 group-hover:text-blue-600 uppercase tracking-tight">{variant.productName || variant.unit}</p>
                                     <div className="flex flex-col gap-0.5">
                                       <p className="text-[10px] text-slate-500 font-medium italic">
                                         SKU: <span className="font-mono text-blue-600 not-italic">{variant.sku}</span>
                                       </p>
                                       <div className="flex items-center gap-2 mt-0.5">
                                          <div className="flex items-center gap-1 text-[9px] font-bold bg-amber-50 text-amber-700 px-1.5 py-0.5 border border-amber-100 rounded-sm uppercase">
                                            LÔ: {batch.batchNumber || 'N/A'}
                                          </div>
                                          {batch.expiryDate && (
                                            <div className="flex items-center gap-1 text-[9px] font-bold bg-rose-50 text-rose-700 px-1.5 py-0.5 border border-rose-100 rounded-sm uppercase">
                                              HSD: {batch.expiryDate}
                                            </div>
                                          )}
                                       </div>
                                     </div>
                                   </div>
                                </div>
                                <div className="text-right">
                                  <div className="flex flex-col items-end gap-1">
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tồn kho lô này</span>
                                    <p className={cn(
                                      "text-[14px] font-black px-3 py-1 rounded-none border-2 shadow-sm",
                                      (batch.quantity || 0) > 0 ? "text-emerald-600 border-emerald-500" : "text-rose-600 border-rose-500"
                                    )}>
                                      {batch.quantity || 0} <span className="text-[10px] ml-0.5">{variant.unit || "SP"}</span>
                                    </p>
                                  </div>
                                </div>
                              </div>
                            ));
                          }

                          // Trường hợp ko có lô (hiển thị variant gốc)
                          return (
                            <div
                              key={variant.id || variant.sku}
                              onMouseDown={() => handleSelectProduct(variant)}
                              className="flex items-center justify-between p-2.5 hover:bg-blue-50 border-b border-slate-100 cursor-pointer transition-colors group"
                            >
                              <div className="flex items-center gap-3">
                                 <div className="w-10 h-10 bg-white border border-slate-200 rounded-sm overflow-hidden flex items-center justify-center">
                                    {variant.imageUrl ? (
                                      <img src={variant.imageUrl} alt={variant.sku} className="w-full h-full object-cover" />
                                    ) : <Package size={16} className="text-slate-300" />}
                                 </div>
                                 <div>
                                   <p className="text-[12px] font-bold text-slate-800 group-hover:text-blue-600 uppercase tracking-tight">{variant.productName || variant.unit}</p>
                                   <div className="flex flex-col gap-0.5">
                                     <p className="text-[10px] text-slate-500 font-medium italic">
                                       SKU: <span className="font-mono text-blue-600 not-italic">{variant.sku}</span>
                                     </p>
                                   </div>
                                 </div>
                              </div>
                              <div className="text-right">
                                <div className="flex flex-col items-end gap-1">
                                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tồn kho tại nguồn</span>
                                  <p className={cn(
                                    "text-[14px] font-black px-3 py-1 rounded-none border-2 shadow-sm transition-all",
                                    (variant.quantity || 0) > 0 ? "text-emerald-600 border-emerald-500" : "text-rose-600 border-rose-500 animate-pulse"
                                  )}>
                                    {variant.quantity || 0} <span className="text-[10px] ml-0.5">{variant.unit || "SP"}</span>
                                  </p>
                                </div>
                              </div>
                            </div>
                          );
                        })
>>>>>>> Stashed changes
                      ) : (
                        <div className="p-3 text-center text-[12px] text-slate-400">Không có sản phẩm nào</div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <Table className="table-custom border-collapse min-w-[1250px]">
                <TableHeader>
                  <TableRow className="bg-slate-50 border-b border-[#ccc]">
                    <TableHead className="w-[40px] text-center p-2 text-[10px] font-black uppercase text-slate-500">STT</TableHead>
                    <TableHead className="w-[150px] p-2 text-[10px] font-black uppercase text-slate-500">Hàng hóa</TableHead>
                    <TableHead className="w-[80px] p-2 text-[10px] font-black uppercase text-slate-500">ĐVT</TableHead>
                    <TableHead className="w-[100px] text-right p-2 text-[10px] font-black uppercase text-slate-500">Tồn kho</TableHead>
<<<<<<< Updated upstream
=======
                    <TableHead className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Số lô / Hạn dùng</TableHead>
                    
>>>>>>> Stashed changes
                    <TableHead className="w-[100px] text-right p-2 text-[10px] font-black uppercase text-blue-600">SL chuyển</TableHead>
                    <TableHead className="w-[100px] text-right p-2 text-[10px] font-black uppercase text-emerald-600">Thực nhận</TableHead>
                    <TableHead className="p-2 text-[10px] font-black uppercase text-slate-500">Ghi chú</TableHead>
                    <TableHead className="w-[40px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
<<<<<<< Updated upstream
                  {fields.map((field, index) => (
                    <TableRow key={field.id} className="border-b border-slate-100 hover:bg-blue-50/20 transition-colors">
                      <TableCell className="text-center text-slate-400 font-bold text-[11px]">{index + 1}</TableCell>
                      <TableCell className="p-1">
                        <Input {...register(`items.${index}.productName`)} className="h-8 text-[12px] border-none bg-transparent font-bold focus:ring-0" readOnly />
                      </TableCell>
                      <TableCell className="p-1">
                        <Input {...register(`items.${index}.unit`)} className="h-8 text-[12px] border-none bg-transparent focus:ring-0" readOnly />
                      </TableCell>
                      <TableCell className="p-1 text-right font-bold text-slate-500 pr-3">
                        {(watch(`items.${index}.availableQuantity`) || 0).toLocaleString("vi-VN")}
                      </TableCell>
                      <TableCell className="p-1 text-right">
                        <Input
                          type="number"
                          step="any"
                          {...register(`items.${index}.quantity`)}
                          className={cn("h-8 text-[13px] text-right bg-blue-50/30 rounded-none font-black text-blue-700 focus:ring-0", (errors?.items as any)?.[index]?.quantity ? "border-rose-500" : "border-blue-200")}
                        />
                        {/* HIỂN THỊ LỖI ITEMS */}
                        {(errors?.items as any)?.[index]?.quantity && (
                          <p className="text-rose-500 text-[9px] mt-0.5 font-medium">{(errors.items as any)[index].quantity?.message as string}</p>
                        )}
                      </TableCell>
                      <TableCell className="p-1">
                        <Input type="number" {...register(`items.${index}.receivedQuantity`)} readOnly className="h-8 text-[13px] text-right border-emerald-100 bg-emerald-50/30 rounded-none text-emerald-700 font-bold focus:ring-0 cursor-not-allowed" />
                      </TableCell>
                      <TableCell className="p-1">
                        <Input {...register(`items.${index}.itemNote`)} className="h-8 text-[11px] border-none italic bg-transparent focus:ring-0" placeholder="..." />
                      </TableCell>
                      <TableCell className="p-1 text-center">
                        <button type="button" onClick={() => remove(index)} className="text-slate-300 hover:text-rose-500 transition-colors">
                          <Trash2 size={16} />
                        </button>
                      </TableCell>
                    </TableRow>
                  ))}
=======
                  {fields.map((field: any, index: number) => {
                    const rowError = (errors?.items as any)?.[index];
                    return (
                      <React.Fragment key={field.id}>
                        <TableRow 
                          className={cn(
                            "border-b border-slate-100 hover:bg-blue-50/20 transition-colors",
                            rowError ? "bg-rose-50/30" : ""
                          )}
                        >
                          <TableCell className="text-center text-slate-400 font-bold text-[11px]">{index + 1}</TableCell>
                          <TableCell className="p-1">
                            <Input {...register(`items.${index}.productName`)} className="h-8 text-[12px] border-none bg-transparent font-bold focus:ring-0" readOnly />
                          </TableCell>
                          <TableCell className="p-1">
                            <Input {...register(`items.${index}.unit`)} className="h-8 text-[12px] border-none bg-transparent focus:ring-0" readOnly />
                          </TableCell>
                          <TableCell className="p-1 text-right font-bold text-slate-500 pr-3">
                            {(watch(`items.${index}.availableQuantity`) || 0).toLocaleString("vi-VN")}
                          </TableCell>
                          
                          <TableCell className="text-[12px] text-slate-600">
                            {watch(`items.${index}.batchNumber`) ? (
                              <div className="flex flex-col">
                                <span className="font-bold text-slate-800">{watch(`items.${index}.batchNumber`)}</span>
                                {watch(`items.${index}.expiryDate`) && (
                                  <span className="text-[10px] text-rose-500 font-medium">Hạn: {watch(`items.${index}.expiryDate`)}</span>
                                )}
                              </div>
                            ) : (
                              <span className="text-slate-300 italic">Mặc định</span>
                            )}
                          </TableCell>

                          <TableCell className="p-1 text-right">
                            <Input
                              type="number"
                              step="any"
                              {...register(`items.${index}.plannedQuantity`)}
                              className={cn(
                                "h-8 text-[13px] text-right bg-blue-50/30 rounded-none font-black text-blue-700 focus:ring-0", 
                                rowError?.plannedQuantity ? "border-rose-500 bg-rose-50" : "border-blue-200"
                              )}
                            />
                          </TableCell>
                          <TableCell className="p-1">
                            <Input {...register(`items.${index}.itemNote`)} className="h-8 text-[11px] border-none italic bg-transparent focus:ring-0" placeholder="..." />
                          </TableCell>
                          <TableCell className="p-1 text-center">
                            <button type="button" onClick={() => remove(index)} className="text-slate-300 hover:text-rose-500 transition-colors">
                              <Trash2 size={16} />
                            </button>
                          </TableCell>
                        </TableRow>
                        
                        {/* Dòng hiển thị lỗi riêng biệt */}
                        {rowError?.plannedQuantity && (
                          <TableRow className="bg-rose-50/40 border-none hover:bg-rose-50/40 animate-in fade-in slide-in-from-top-1 duration-200">
                            <TableCell colSpan={8} className="py-1 px-4">
                              <div className="flex items-center gap-1.5 text-rose-600 font-black text-[10px] uppercase tracking-wider">
                                <AlertCircle size={12} strokeWidth={3} />
                                {rowError.plannedQuantity.message}
                              </div>
                            </TableCell>
                          </TableRow>
                        )}
                      </React.Fragment>
                    );
                  })}
>>>>>>> Stashed changes
                </TableBody>
              </Table>
            </div>
          </div>
        </div>

        {/* Sidebar - Right */}
        <div className="lg:col-span-3 space-y-5">
          <div className="bg-white border border-[#dcdcdc] p-6 rounded-none shadow-sm space-y-6">
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-[10px] font-black text-slate-400 uppercase flex items-center gap-2">
                  <Warehouse size={12} className="text-blue-600" /> Chi nhánh xuất hàng *
                </Label>
                <Controller
                  name="sourceBranchId"
                  control={control}
                  render={({ field }) => (
                    <Select
                      value={field.value}
                      onValueChange={(val) => {
                        field.onChange(val);
                        remove();
                      }}
                    >
                      <SelectTrigger className={cn("h-auto min-h-[40px] text-[12px] rounded-none font-bold focus:ring-0 py-2", errors.sourceBranchId ? "border-rose-500" : "border-[#eee]")}>
                        <SelectValue placeholder="Chọn kho xuất..." />
                      </SelectTrigger>
                      <SelectContent className="rounded-none max-w-[300px]">
                        {branches.map((b) => (
                          <SelectItem key={b.id} value={b.id.toString()} className="py-2">
                            <div className="flex flex-col gap-0.5">
                              <span className="font-black text-slate-700 uppercase text-[11px]">{b.name || b.branchName}</span>
                              {(b.addressDetail) && (
                                <span className="text-[10px] text-slate-400 font-medium line-clamp-1 flex items-center gap-1">
                                  <MapPin size={10} /> {b.addressDetail}
                                </span>
                              )}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {selectedSourceData && (
                  <div className="mt-2 space-y-1 animate-in fade-in slide-in-from-top-1 duration-300">
                    <Label className="text-[9px] font-bold text-slate-400 uppercase flex items-center gap-1">
                      <MapPin size={10} className="text-rose-500" /> Địa chỉ kho xuất
                    </Label>
                    <Input
                      readOnly
                      value={selectedSourceData.addressDetail || ""}
                      className="h-8 text-[11px] bg-slate-50 border-slate-200 text-slate-500 rounded-none cursor-not-allowed italic"
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-center -my-2 relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-dashed border-slate-200"></div>
              </div>
              <div className="relative w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 border border-blue-100 shadow-sm">
                <ArrowRightLeft size={16} className="rotate-90 md:rotate-0" />
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-[10px] font-black text-slate-400 uppercase flex items-center gap-2">
                  <Warehouse size={12} className="text-emerald-600" /> Chi nhánh nhận hàng *
                </Label>
                <Controller
                  name="destBranchId"
                  control={control}
                  render={({ field }) => (
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                    >
                      <SelectTrigger className={cn("h-auto min-h-[40px] text-[12px] rounded-none font-bold focus:ring-0 py-2", errors.destBranchId ? "border-rose-500" : "border-[#eee]")}>
                        <SelectValue placeholder="Chọn kho nhận..." />
                      </SelectTrigger>
                      <SelectContent className="rounded-none max-w-[300px]">
                        {branches.map((b) => (
                          <SelectItem key={b.id} value={b.id.toString()} disabled={b.id.toString() === currentSourceBranch} className="py-2">
                            <div className="flex flex-col gap-0.5">
                              <span className="font-black text-slate-700 uppercase text-[11px]">{b.name || b.branchName}</span>
                              {(b.addressDetail) && (
                                <span className="text-[10px] text-slate-400 font-medium line-clamp-1 flex items-center gap-1">
                                  <MapPin size={10} /> {b.addressDetail}
                                </span>
                              )}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {selectedDestData && (
                  <div className="mt-2 space-y-1 animate-in fade-in slide-in-from-top-1 duration-300">
                    <Label className="text-[9px] font-bold text-slate-400 uppercase flex items-center gap-1">
                      <MapPin size={10} className="text-emerald-500" /> Địa chỉ kho nhận
                    </Label>
                    <Input
                      readOnly
                      value={selectedDestData.addressDetail || ""}
                      className="h-8 text-[11px] bg-slate-50 border-slate-200 text-slate-500 rounded-none cursor-not-allowed italic"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-[9px] font-bold text-slate-400 uppercase">Ngày điều chuyển *</Label>
                <Input
                  type="datetime-local"
                  {...register("transferDate")}
                  className={cn("h-[34px] text-[12px] rounded-none", errors.transferDate ? "border-rose-500" : "border-[#ccc]")}
                />
                {errors.transferDate && <p className="text-rose-500 text-[10px] font-medium">{errors.transferDate.message as string}</p>}
              </div>
              <div className="space-y-1.5">
                <Label className="text-[9px] font-bold text-slate-400 uppercase">Tham chiếu *</Label>
                <Input
                  {...register("referenceCode")}
                  className={cn("h-[34px] text-[12px] rounded-none font-mono", errors.referenceCode ? "border-rose-500" : "border-[#ccc]")}
                  placeholder="Mã YCDC, Mã ĐH..."
                />
                {errors.referenceCode && <p className="text-rose-500 text-[10px] font-medium">{errors.referenceCode.message as string}</p>}
              </div>

              <div className="space-y-1.5">
                <Label className="text-[9px] font-bold text-slate-400 uppercase">Mức độ ưu tiên</Label>
                <Controller
                  name="priority"
                  control={control}
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger className="h-[34px] text-[12px] rounded-none border-[#ccc] focus:ring-0">
                        <SelectValue placeholder="Chọn mức độ..." />
                      </SelectTrigger>
                      <SelectContent className="rounded-none">
                        <SelectItem value="LOW">Thấp</SelectItem>
                        <SelectItem value="MEDIUM">Trung bình</SelectItem>
                        <SelectItem value="HIGH">Cao</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-[9px] font-bold text-slate-400 uppercase">Loại điều chuyển</Label>
                <Controller
                  name="transferType"
                  control={control}
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger className="h-[34px] text-[12px] rounded-none border-[#ccc] focus:ring-0">
                        <SelectValue placeholder="Chọn loại..." />
                      </SelectTrigger>
                      <SelectContent className="rounded-none">
                        <SelectItem value="WAREHOUSE_TRANSFER">Điều chuyển kho</SelectItem>
                        <SelectItem value="BRANCH_TRANSFER">Điều chuyển chi nhánh</SelectItem>
                        <SelectItem value="OTHER">Khác</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
            </div>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="fixed bottom-0 left-0 lg:left-[260px] right-0 bg-[#f8f9fa] border-t border-[#ddd] p-[12px_30px] flex items-center justify-end gap-[15px] z-[999] shadow-[0_-4px_15px_rgba(0,0,0,0.05)]">
        <Button variant="outline" type="button" className="min-w-[110px] h-[38px] text-[12px] font-bold border-[#ccc] bg-white rounded-none uppercase hover:bg-slate-50 transition-all" onClick={() => router.back()}>
          HỦY BỎ
        </Button>
        <Button type="submit" disabled={isSubmitting} className="min-w-[180px] h-[38px] text-[12px] font-black bg-blue-600 hover:bg-blue-700 text-white rounded-none shadow-md shadow-blue-100 uppercase transition-all active:scale-[0.98] flex items-center justify-center">
          {isSubmitting ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div> : <Save size={18} className="mr-2" />}
          {isSubmitting ? "ĐANG LƯU..." : "LƯU & GỬI DUYỆT"}
        </Button>
      </div>
    </form>
  );
}