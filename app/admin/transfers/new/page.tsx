"use client";

import React, { useState, useEffect, useRef } from "react";
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
  History,
  MapPin,
  Building2,
  ArrowDownToLine,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
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
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function NewTransferPage() {
  const router = useRouter();
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
        setBranches(Array.isArray(data) ? data : data?.content || []);
      } catch (error) {
        console.error("Lỗi fetch chi nhánh", error);
        toast.error("Không thể tải danh sách chi nhánh");
      }
    };
    fetchBranches();
  }, []);

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
      transferType: "BETWEEN_WAREHOUSES" as const,
      description: sourceCode ? `Xuất điều chuyển theo yêu cầu ${sourceCode}` : "",
      transporter: "",
      vehicle: "",
      dispatchOrder: "",
      transferCode: "PDC-" + Date.now().toString().slice(-6),
      sourceBranch: "",
      sourceWarehouse: "",
      sourceAddress: "",
      transferDate: new Date().toISOString().slice(0, 16),
      destBranch: "",
      destWarehouse: "",
      destAddress: "",
      status: "DRAFT" as const,
      importStatus: "PENDING",
      referenceCode: sourceCode || "",
      items: [],
      note: "",
    },
  });

  const transferType = watch("transferType");
  const importStatus = watch("importStatus");
  const currentSourceBranch = watch("sourceBranch");

  const { fields, append, remove } = useFieldArray({
    control,
    name: "items",
  });

  const auditLogs = [
    {
      time: new Date().toLocaleString("vi-VN"),
      user: "Hệ thống",
      action: "Khởi tạo phiếu dự thảo",
      detail: "Hệ thống tự động cấp mã phiếu",
    },
  ];

  const onSubmit = async (formData: any) => {
    setIsSubmitting(true);
    try {
      const payload = {
        fromBranchId: Number(formData.sourceBranch),
        toBranchId: Number(formData.destBranch),
        transferType: formData.transferType,
        description: formData.description,
        transporter: formData.transporter || null,
        vehicle: formData.vehicle || null,
        dispatchOrder: formData.dispatchOrder || null,
        referenceCode: formData.referenceCode || null,
        priority: "NORMAL",
        transferDate: formData.transferDate ? new Date(formData.transferDate).toISOString() : null,
        deadline: formData.transferDate ? new Date(formData.transferDate).toISOString() : null,
        items: formData.items.map((item: any) => ({
          sku: item.productCode,
          quantity: Number(item.quantity),
          quantityRequested: Number(item.quantity),
          quantityReal: 0,
          itemNote: item.itemNote || "",
        })),
      };

      await transferService.create(payload);
      toast.success("Đã tạo phiếu và gửi yêu cầu duyệt chuyển kho!");
      router.push("/admin/transfers");
    } catch (error: any) {
      const errMsg = error.response?.data?.message || error.response?.data || "Không thể tạo phiếu";
      toast.error("Lỗi: " + errMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const steps = [
    { label: "Khởi tạo", status: "completed", icon: Plus },
    { label: "Chờ xuất kho", status: "active", icon: AlertCircle },
    { label: "Đang vận chuyển", status: "upcoming", icon: Truck },
    { label: "Đã nhận hàng", status: "upcoming", icon: CheckCircle2 },
  ];

  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedProductIds, setSelectedProductIds] = useState<(number | string)[]>([]);
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
      if (!searchTerm && !showDropdown) return;
      if (!currentSourceBranch) return;

      setIsSearching(true);
      try {
        const results = await ProductService.searchVariants(searchTerm, currentSourceBranch);
        const finalData = Array.isArray(results) ? results : results?.data || [];
        setSearchResults(finalData);

        if (document.activeElement?.getAttribute("placeholder")?.includes("Tìm theo tên")) {
          setShowDropdown(true);
        }
      } catch (error) {
        console.error("Lỗi tìm sản phẩm", error);
      } finally {
        setIsSearching(false);
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm, currentSourceBranch]);

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
      append({
        variantId: variant.id,
        productCode: variant.sku,
        productName: displayName,
        unit: variant.unit || "Cái",
        quantity: 1,
        availableQuantity: variant.quantity || 0,
        receivedQuantity: 0,
        itemNote: "",
      });

      setSearchTerm("");
      setShowDropdown(false);
      toast.success("Đã thêm biến thể thành công!");
  };

  const toggleSelectedProduct = (productId: number | string) => {
    setSelectedProductIds((prev) =>
      prev.some((id) => String(id) === String(productId))
        ? prev.filter((id) => String(id) !== String(productId))
        : [...prev, productId],
    );
  };

  const handleAddSelectedProducts = () => {
    const selectedVariants = searchResults.filter((variant) =>
      selectedProductIds.some((id) => String(id) === String(variant.id)),
    );
    if (selectedVariants.length === 0) {
      toast.warning("Vui lòng chọn ít nhất một sản phẩm");
      return;
    }
    selectedVariants.forEach((variant) => handleSelectProduct(variant));
    setSearchTerm("");
    setShowDropdown(false);
    setSelectedProductIds([]);
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit, onError)}
      className="space-y-4 pb-[100px] bg-slate-50/30 p-4 min-h-screen"
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
          <div className="flex items-center gap-3 mt-1">
            <Controller
              name="transferType"
              control={control}
              render={({ field }) => (
                <RadioGroup onValueChange={field.onChange} value={field.value} className="flex items-center gap-6">
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="BETWEEN_WAREHOUSES" id="type-wh" />
                    <Label
                      htmlFor="type-wh"
                      className={cn("text-[11px] font-bold uppercase tracking-wider cursor-pointer", field.value === "BETWEEN_WAREHOUSES" ? "text-blue-600" : "text-slate-400")}
                    >
                      Điều chuyển liên kho
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="INTERNAL" id="type-internal" />
                    <Label
                      htmlFor="type-internal"
                      className={cn("text-[11px] font-bold uppercase tracking-wider cursor-pointer", field.value === "INTERNAL" ? "text-blue-600" : "text-slate-400")}
                    >
                      Nội bộ
                    </Label>
                  </div>
                </RadioGroup>
              )}
            />
          </div>
        </div>
      </div>

      {/* Step Bar */}
      <div className="bg-white border border-[#dcdcdc] p-6 rounded-none shadow-sm mb-4">
        <div className="flex items-center justify-between max-w-4xl mx-auto">
          {steps.map((step, idx) => (
            <React.Fragment key={idx}>
              <div className="flex flex-col items-center gap-2 relative z-10">
                <div
                  className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300",
                    step.status === "completed" ? "bg-emerald-500 border-emerald-500 text-white" : step.status === "active" ? "bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-100" : "bg-slate-50 border-slate-200 text-slate-300"
                  )}
                >
                  <step.icon size={20} />
                </div>
                <span className={cn("text-[10px] font-black uppercase tracking-tighter", step.status === "active" ? "text-blue-600" : "text-slate-400")}>
                  {step.label}
                </span>
              </div>
              {idx < steps.length - 1 && (
                <div className="flex-1 h-[3px] bg-slate-100 mx-2 -mt-6 relative">
                  <div className={cn("absolute inset-0 transition-all duration-500", steps[idx].status === "completed" ? "bg-emerald-500" : "bg-transparent")} />
                </div>
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="lg:col-span-9 space-y-5">
          {/* Section 1: Thông tin lệnh */}
          <div className="bg-white border border-[#dcdcdc] p-6 rounded-none shadow-sm">
            <div className="flex items-center gap-2 mb-6 text-blue-700 font-black text-[11px] uppercase tracking-widest border-b pb-3">
              <ArrowRightLeft size={16} /> 1. Thông tin lệnh điều chuyển hàng hóa
            </div>
            <div className="grid grid-cols-1 md:grid-cols-12 gap-x-6 gap-y-5">

              <div className="md:col-span-8 space-y-1.5">
                <Label className="text-[10px] font-black text-slate-500 uppercase tracking-tight">Lý do điều chuyển / Diễn giải *</Label>
                <Input
                  {...register("description")}
                  className={cn("h-[34px] text-[13px] rounded-none font-bold shadow-none", errors.description ? "border-rose-500 focus:border-rose-500" : "border-[#ccc] focus:border-blue-500")}
                />
                {/* HIỂN THỊ LỖI */}
                {errors.description && <p className="text-rose-500 text-[10px] mt-1 font-medium">{errors.description.message as string}</p>}
              </div>

              <div className="md:col-span-4 space-y-1.5">
                <Label className="text-[10px] font-black text-rose-600 uppercase tracking-tight">Mã phiếu hệ thống</Label>
                <Input
                  {...register("transferCode")}
                  readOnly
                  className="h-[34px] text-[13px] border-[#ccc] rounded-none bg-slate-50 font-mono text-slate-500 cursor-not-allowed"
                />
              </div>

              {transferType === "BETWEEN_WAREHOUSES" && (
                <React.Fragment>
                  <div className="md:col-span-4 space-y-1.5 animate-in fade-in zoom-in-95 duration-300">
                    <Label className="text-[10px] font-black text-blue-600 uppercase tracking-tight">Phương tiện vận chuyển</Label>
                    <div className="relative">
                      <Car className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={14} />
                      <Input
                        {...register("vehicle")}
                        className={cn("h-[34px] pl-9 text-[13px] rounded-none shadow-none", errors.vehicle ? "border-rose-500" : "border-[#ccc] focus:border-blue-500")}
                        placeholder="Biển số xe..."
                      />
                    </div>
                  </div>
                  <div className="md:col-span-4 space-y-1.5 animate-in fade-in zoom-in-95 duration-300">
                    <Label className="text-[10px] font-black text-blue-600 uppercase tracking-tight">Tài xế vận chuyển *</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={14} />
                      <Input
                        {...register("transporter")}
                        className={cn("h-[34px] pl-9 text-[13px] rounded-none shadow-none", errors.transporter ? "border-rose-500 focus:border-rose-500" : "border-[#ccc] focus:border-blue-500")}
                        placeholder="Họ tên tài xế..."
                      />
                    </div>
                    {/* HIỂN THỊ LỖI */}
                    {errors.transporter && <p className="text-rose-500 text-[10px] mt-1 font-medium">{errors.transporter.message as string}</p>}
                  </div>
                  <div className="md:col-span-4 space-y-1.5 animate-in fade-in zoom-in-95 duration-300">
                    <Label className="text-[10px] font-black text-blue-600 uppercase tracking-tight">Lệnh điều động số</Label>
                    <div className="relative">
                      <FileText className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={14} />
                      <Input
                        {...register("dispatchOrder")}
                        className="h-[34px] pl-9 text-[13px] border-[#ccc] rounded-none font-mono focus:border-blue-500 shadow-none"
                        placeholder="Số hiệu văn bản..."
                      />
                    </div>
                  </div>
                </React.Fragment>
              )}
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
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 shadow-xl z-50 max-h-[300px] overflow-y-auto">
                      {searchResults.length > 0 && (
                        <div className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b bg-slate-50 px-3 py-2 text-xs">
                          <span className="text-slate-500">
                            Đã chọn <span className="font-bold text-slate-700">{selectedProductIds.length}</span> sản phẩm
                          </span>
                          <Button type="button" size="sm" className="h-7 text-[11px]" onMouseDown={(e) => e.preventDefault()} onClick={handleAddSelectedProducts}>
                            Thêm đã chọn
                          </Button>
                        </div>
                      )}
                      {isSearching ? (
                        <div className="p-3 text-center text-[12px] text-slate-400 italic">Đang tải dữ liệu...</div>
                      ) : searchResults.length > 0 ? (
                        searchResults.map((variant) => (
                          <div
                            key={variant.id}
                            onMouseDown={() => handleSelectProduct(variant)}
                            className="flex items-center justify-between p-2.5 hover:bg-blue-50 border-b border-slate-100 cursor-pointer transition-colors"
                          >
                            <div className="flex items-center gap-2">
                              <div onMouseDown={(e) => e.stopPropagation()} className="flex items-center">
                                <Checkbox
                                  checked={selectedProductIds.some((id) => String(id) === String(variant.id))}
                                  onCheckedChange={() => toggleSelectedProduct(variant.id)}
                                />
                              </div>
                              <div>
                                <p className="text-[12px] font-bold text-slate-800">{variant.productName || variant.unit}</p>
                                <p className="text-[10px] text-slate-500">SKU: <span className="font-mono text-blue-600">{variant.sku}</span></p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className={cn("text-[11px] font-black", (variant.quantity || 0) > 0 ? "text-emerald-600" : "text-rose-500")}>
                                Tồn: {variant.quantity || 0}
                              </p>
                              <p className="text-[10px] text-slate-400">Cái</p>
                            </div>
                          </div>
                        ))
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
                    <TableHead className="w-[100px] text-right p-2 text-[10px] font-black uppercase text-blue-600">SL chuyển</TableHead>
                    <TableHead className="w-[100px] text-right p-2 text-[10px] font-black uppercase text-emerald-600">Thực nhận</TableHead>
                    <TableHead className="p-2 text-[10px] font-black uppercase text-slate-500">Ghi chú</TableHead>
                    <TableHead className="w-[40px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
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
                </TableBody>
              </Table>
            </div>
            {/* Lỗi nếu chưa có items nào hoặc lỗi từ Zod items level */}
            {(errors.items?.message || errors.items?.root?.message) && (
                <div className="p-3 bg-rose-50 border-t border-rose-100 text-rose-500 text-[11px] font-bold text-center">
                    {errors.items?.message as string || errors.items?.root?.message as string}
                </div>
            )}
            {fields.length === 0 && (
              <div className="py-16 flex flex-col items-center justify-center bg-white space-y-4">
                <Search size={48} className="text-slate-200" />
                <div className="text-center">
                  <p className="text-[13px] font-black text-slate-600 uppercase tracking-widest">Danh mục điều chuyển đang trống</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar - Right */}
        <div className="lg:col-span-3 space-y-5">
          <div className="bg-white border border-[#dcdcdc] p-6 rounded-none shadow-sm space-y-6">
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-[10px] font-black text-slate-400 uppercase flex items-center gap-2">
                  <Building2 size={12} /> Chi nhánh xuất hàng *
                </Label>
                <Controller
                  name="sourceBranch"
                  control={control}
                  render={({ field }) => (
                    <Select
                      value={field.value}
                      onValueChange={(val) => {
                        field.onChange(val);
                        remove();
                        const selectedBranch = branches.find((b) => b.id.toString() === val);
                        if (selectedBranch) setValue("sourceAddress", selectedBranch.addressDetail || "Chưa cập nhật địa chỉ");
                      }}
                    >
                      <SelectTrigger className={cn("h-8 text-[12px] rounded-none font-bold focus:ring-0", errors.sourceBranch ? "border-rose-500" : "border-[#eee]")}>
                        <SelectValue placeholder="Chọn kho xuất..." />
                      </SelectTrigger>
                      <SelectContent className="rounded-none">
                        {branches.map((b) => (
                          <SelectItem key={b.id} value={b.id.toString()}>{b.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {/* HIỂN THỊ LỖI */}
                {errors.sourceBranch && <p className="text-rose-500 text-[10px] mt-1 font-medium">{errors.sourceBranch.message as string}</p>}
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] font-black text-slate-500 uppercase tracking-tight flex items-center gap-2">
                  <MapPin size={12} className="text-rose-500" /> Địa chỉ kho xuất
                </Label>
                <Controller
                  name="sourceAddress"
                  control={control}
                  render={({ field }) => (
                    <Textarea {...field} readOnly className="min-h-[60px] text-[12px] border-[#ccc] rounded-none resize-none bg-slate-50 text-slate-600 cursor-not-allowed" />
                  )}
                />
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
                  <Building2 size={12} /> Chi nhánh nhận hàng *
                </Label>
                <Controller
                  name="destBranch"
                  control={control}
                  render={({ field }) => (
                    <Select
                      value={field.value}
                      onValueChange={(val) => {
                        field.onChange(val);
                        const selectedBranch = branches.find((b) => b.id.toString() === val);
                        if (selectedBranch) setValue("destAddress", selectedBranch.addressDetail || "Chưa cập nhật địa chỉ");
                      }}
                    >
                      <SelectTrigger className={cn("h-8 text-[12px] rounded-none font-bold focus:ring-0", errors.destBranch ? "border-rose-500" : "border-[#eee]")}>
                        <SelectValue placeholder="Chọn kho nhận..." />
                      </SelectTrigger>
                      <SelectContent className="rounded-none">
                        {branches.map((b) => (
                          <SelectItem key={b.id} value={b.id.toString()} disabled={b.id.toString() === currentSourceBranch}>
                            {b.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {/* HIỂN THỊ LỖI */}
                {errors.destBranch && <p className="text-rose-500 text-[10px] mt-1 font-medium">{errors.destBranch.message as string}</p>}
                {errors.destWarehouse && <p className="text-rose-500 text-[10px] mt-1 font-medium">{errors.destWarehouse.message as string}</p>}
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] font-black text-slate-500 uppercase tracking-tight flex items-center gap-2">
                  <MapPin size={12} className="text-emerald-500" /> Địa chỉ kho nhận
                </Label>
                <Controller
                  name="destAddress"
                  control={control}
                  render={({ field }) => (
                    <Textarea {...field} readOnly className="min-h-[60px] text-[12px] border-[#ccc] rounded-none resize-none bg-slate-50 text-slate-600 cursor-not-allowed" />
                  )}
                />
              </div>
            </div>
          </div>

          <div className="bg-white border border-[#dcdcdc] p-6 rounded-none shadow-sm space-y-4">
            <div className="space-y-1.5">
              <Label className="text-[9px] font-bold text-slate-400 uppercase">Ngày điều chuyển (24H) *</Label>
              <Input
                type="datetime-local"
                {...register("transferDate")}
                className={cn("h-[34px] text-[12px] rounded-none", errors.transferDate ? "border-rose-500" : "border-[#ccc]")}
              />
              {/* HIỂN THỊ LỖI */}
              {errors.transferDate && <p className="text-rose-500 text-[10px] mt-1 font-medium">{errors.transferDate.message as string}</p>}
            </div>
            <div className="space-y-1.5">
              <Label className="text-[9px] font-bold text-slate-400 uppercase">Tham chiếu chứng từ *</Label>
              <Input
                {...register("referenceCode")}
                className={cn("h-[34px] text-[12px] rounded-none font-mono", errors.referenceCode ? "border-rose-500" : "border-[#ccc]")}
                placeholder="Mã YCDC, Mã ĐH..."
              />
              {/* HIỂN THỊ LỖI */}
              {errors.referenceCode && <p className="text-rose-500 text-[10px] mt-1 font-medium">{errors.referenceCode.message as string}</p>}
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
