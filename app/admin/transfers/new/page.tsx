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

  // State quản lý API
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [branches, setBranches] = useState<any[]>([]);

  const onError = (errors: any) => {
    console.log("Lỗi Validation của Zod:", errors);
    toast.error("Dữ liệu chưa hợp lệ! Vui lòng kiểm tra lại các ô nhập liệu.");
  };

  // Kéo danh sách Chi nhánh thật lúc load trang
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

  const {
    register,
    handleSubmit,
    control,
    setValue,
    watch,
    formState: { errors },
  } = useForm<any>({
    resolver: zodResolver(TransferSchema),
    mode: "all",
    defaultValues: {
      transferType: "BETWEEN_WAREHOUSES",
      description: sourceCode
        ? `Xuất điều chuyển theo yêu cầu ${sourceCode}`
        : "",
      transporter: "",
      vehicle: "",
      dispatchOrder: "",
      transferCode: "PDC-" + Date.now().toString().slice(-6),
      sourceBranch: "", // Để trống để lát chọn
      sourceWarehouse: "wh-hn",
      sourceAddress: "",
      transferDate: new Date().toISOString().slice(0, 16),
      destBranch: "", // Để trống để lát chọn
      destWarehouse: "wh-st",
      destAddress: "",
      status: "DRAFT",
      importStatus: "PENDING",
      referenceCode: sourceCode || "",
      items: sourceCode ? [] : [],
      note: "",
    },
  });

  const transferType = watch("transferType");
  const importStatus = watch("importStatus");
  const currentSourceBranch = watch("sourceBranch"); // Dùng để chặn chọn trùng kho

  const { fields, append, remove } = useFieldArray({
    control,
    name: "items",
  });

  const auditLogs = [
    {
      time: new Date().toLocaleString('vi-VN'),
      user: "Hệ thống",
      action: "Khởi tạo phiếu dự thảo",
      detail: "Hệ thống tự động cấp mã phiếu",
    },
  ];

  // HÀM SUBMIT GỌI API THẬT
  const onSubmit = async (formData: any) => {
    // 1. Validate form cơ bản
    if (!formData.sourceBranch || !formData.destBranch) {
      toast.error("Vui lòng chọn đầy đủ Chi nhánh xuất và Chi nhánh nhận!");
      return;
    }
    if (formData.sourceBranch === formData.destBranch) {
      toast.error("Chi nhánh xuất và Chi nhánh nhận không được trùng nhau!");
      return;
    }
    if (!formData.items || formData.items.length === 0) {
      toast.error("Vui lòng thêm ít nhất 1 sản phẩm để điều chuyển!");
      return;
    }

    setIsSubmitting(true);
    try {
      // Chuẩn bị Payload khớp với Backend DTO
      const payload = {
        fromBranchId: Number(formData.sourceBranch),
        toBranchId: Number(formData.destBranch),
        transferType: formData.transferType,
        description: formData.description,
        transporter: formData.transporter,
        vehicle: formData.vehicle,
        dispatchOrder: formData.dispatchOrder,
        referenceCode: formData.referenceCode,
        priority: "NORMAL",
        transferDate: formData.transferDate ? new Date(formData.transferDate).toISOString() : null,
        deadline: formData.transferDate ? new Date(formData.transferDate).toISOString() : null,

        // SỬA CHỖ NÀY: Gửi "bao lô" 3 biến số lượng luôn cho Backend tự bốc
        items: formData.items.map((item: any) => ({
          variantId: Number(item.variantId) || 1,
          quantity: Number(item.quantity),           // Cột quantity chung
          quantityRequested: Number(item.quantity),  // Cột quantity_requested (Số lượng yêu cầu)
          quantityReal: 0,                           // Cột quantity_real (Thực nhận ban đầu = 0)
          itemNote: item.itemNote
        }))
      };

      // 3. Gửi request tạo mới
      await transferService.create(payload);

      toast.success("Đã tạo phiếu và gửi yêu cầu duyệt chuyển kho!");
      router.push("/admin/transfers");

    } catch (error: any) {
      console.error("Lỗi tạo phiếu:", error);
      toast.error("Lỗi hệ thống: " + (error.response?.data || "Không thể tạo phiếu"));
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
  // 1. Khai báo ref để trỏ tới ô Input tìm kiếm
  const searchInputRef = useRef<HTMLInputElement>(null);

  // 2. Hàm xử lý khi bấm nút "Thêm hàng hóa" hoặc "Chọn từ danh sách"
  const openProductDropdown = () => {
    // KHÓA TÌM KIẾM NẾU CHƯA CHỌN KHO
    if (!currentSourceBranch) {
      toast.error("Vui lòng chọn 'Chi nhánh xuất hàng' trước khi thêm hàng hóa!");
      return;
    }
    if (searchInputRef.current) {
      searchInputRef.current.focus(); // Tự động trỏ chuột vào ô tìm kiếm
    }
    setShowDropdown(true); // Bật dropdown lên
  };

  // Hook tìm kiếm (Debounce 500ms)
  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      // Bỏ qua nếu không gõ gì HOẶC chưa chọn chi nhánh xuất
      if (!searchTerm && !showDropdown) return;
      if (!currentSourceBranch) return;

      setIsSearching(true);
      try {
        // GỌI API CÙNG VỚI ID KHO XUẤT ĐỂ LẤY ĐÚNG TỒN KHO
        const results = await ProductService.searchVariants(searchTerm, currentSourceBranch);

        // Đề phòng API trả về dạng { data: [...] } hoặc chỉ [...]
        const finalData = Array.isArray(results) ? results : (results?.data || []);
        setSearchResults(finalData);

        // Cập nhật lại UI Dropdown nếu đang Focus
        if (document.activeElement?.getAttribute('placeholder')?.includes('Tìm theo tên')) {
           setShowDropdown(true);
        }
      } catch (error) {
        console.error("Lỗi tìm sản phẩm", error);
      } finally {
        setIsSearching(false);
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm, currentSourceBranch]); // Lắng nghe cả thay đổi kho xuất

  // Hàm xử lý khi click chọn 1 sản phẩm từ danh sách gợi ý
 // Hàm xử lý khi click chọn 1 sản phẩm từ danh sách gợi ý
   const handleSelectProduct = (variant: any) => {
     const isExist = fields.some((f: any) => f.variantId === variant.id);
     if (isExist) {
       toast.error("Sản phẩm này đã có trong danh sách!");
       return;
     }

     // GỘP TÊN SẢN PHẨM, SKU VÀ THUỘC TÍNH RÕ RÀNG
     let displayName = variant.productName || "Tên sản phẩm";

     if (variant.sku) {
       displayName += ` - ${variant.sku}`;
     }

     if (variant.attributeValues && variant.attributeValues.length > 0) {
       const attributes = variant.attributeValues.map((attr: any) => attr.value).join(", ");
       displayName += ` (${attributes})`;
     }

     append({
       variantId: variant.id,
       productCode: variant.sku || variant.barcode,
       productName: displayName, // Gán tên siêu chi tiết vào bảng
       unit: variant.unit || "Cái",
       quantity: 1,
       availableQuantity: variant.quantity || 0, // Tồn kho thực tế
       itemNote: "",
     });

     setSearchTerm("");
     setSearchResults([]);
     setShowDropdown(false);
     toast.success("Đã thêm sản phẩm vào phiếu!");
   };



  return (
    <form
      onSubmit={handleSubmit(onSubmit, onError)}
      className="space-y-4 pb-[100px] bg-slate-50/30 p-4 min-h-screen"
    >
      {/* Page Header - Synchronized with Admin UI */}
      <div className="flex items-center gap-4 mb-2 px-1">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => router.back()}
          className="h-8 w-8 text-slate-400"
        >
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
                <RadioGroup
                  onValueChange={field.onChange}
                  value={field.value}
                  className="flex items-center gap-6"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="BETWEEN_WAREHOUSES" id="type-wh" />
                    <Label
                      htmlFor="type-wh"
                      className={cn(
                        "text-[11px] font-bold uppercase tracking-wider cursor-pointer",
                        field.value === "BETWEEN_WAREHOUSES"
                          ? "text-blue-600"
                          : "text-slate-400",
                      )}
                    >
                      Điều chuyển liên kho
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="INTERNAL" id="type-internal" />
                    <Label
                      htmlFor="type-internal"
                      className={cn(
                        "text-[11px] font-bold uppercase tracking-wider cursor-pointer",
                        field.value === "INTERNAL"
                          ? "text-blue-600"
                          : "text-slate-400",
                      )}
                    >
                      Nội bộ
                    </Label>
                  </div>
                </RadioGroup>
              )}
            />
          </div>
        </div>

        <div className="ms-auto flex items-center gap-3 text-gray-400">
          {/* Trạng thái nhập kho Badge */}
          <div
            className={cn(
              "hidden md:flex px-3 py-1.5 border items-center gap-2 rounded-none",
              importStatus === "PENDING"
                ? "bg-amber-50 border-amber-200 text-amber-700"
                : "bg-emerald-50 border-emerald-200 text-emerald-700",
            )}
          >
            <ArrowDownToLine size={14} />
            <span className="text-[10px] font-black uppercase tracking-widest">
              Nhập kho: {importStatus === "PENDING" ? "Chờ nhập" : "Đã nhập"}
            </span>
          </div>
          <Settings
            size={18}
            className="cursor-pointer hover:text-blue-600 transition-colors"
          />
          <HelpCircle
            size={18}
            className="cursor-pointer hover:text-blue-600 transition-colors"
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => router.back()}
            className="h-8 w-8"
          >
            <X size={20} />
          </Button>
        </div>
      </div>

      {/* Step Bar - Integrated style */}
      <div className="bg-white border border-[#dcdcdc] p-6 rounded-none shadow-sm mb-4">
        <div className="flex items-center justify-between max-w-4xl mx-auto">
          {steps.map((step, idx) => (
            <React.Fragment key={idx}>
              <div className="flex flex-col items-center gap-2 relative z-10">
                <div
                  className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300",
                    step.status === "completed"
                      ? "bg-emerald-500 border-emerald-500 text-white"
                      : step.status === "active"
                        ? "bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-100"
                        : "bg-slate-50 border-slate-200 text-slate-300",
                  )}
                >
                  <step.icon size={20} />
                </div>
                <span
                  className={cn(
                    "text-[10px] font-black uppercase tracking-tighter",
                    step.status === "active"
                      ? "text-blue-600"
                      : "text-slate-400",
                  )}
                >
                  {step.label}
                </span>
              </div>
              {idx < steps.length - 1 && (
                <div className="flex-1 h-[3px] bg-slate-100 mx-2 -mt-6 relative">
                  <div
                    className={cn(
                      "absolute inset-0 transition-all duration-500",
                      steps[idx].status === "completed"
                        ? "bg-emerald-500"
                        : "bg-transparent",
                    )}
                  />
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
              <ArrowRightLeft size={16} /> 1. Thông tin lệnh điều chuyển hàng
              hóa
            </div>
            <div className="grid grid-cols-1 md:grid-cols-12 gap-x-6 gap-y-5">
              <div className="md:col-span-8 space-y-1.5">
                <Label className="text-[10px] font-black text-slate-500 uppercase tracking-tight">
                  Lý do điều chuyển / Diễn giải *
                </Label>
                <Input
                  {...register("description")}
                  className="h-[34px] text-[13px] border-[#ccc] rounded-none font-bold focus:border-blue-500 shadow-none"
                />
              </div>
              <div className="md:col-span-4 space-y-1.5">
                <Label className="text-[10px] font-black text-rose-600 uppercase tracking-tight">
                  Mã phiếu hệ thống
                </Label>
                <Input
                  {...register("transferCode")}
                  readOnly
                  className="h-[34px] text-[13px] border-[#ccc] rounded-none bg-slate-50 font-mono text-slate-500 cursor-not-allowed"
                />
              </div>

              {transferType === "BETWEEN_WAREHOUSES" && (
                <React.Fragment>
                  <div className="md:col-span-4 space-y-1.5 animate-in fade-in zoom-in-95 duration-300">
                    <Label className="text-[10px] font-black text-blue-600 uppercase tracking-tight">
                      Phương tiện vận chuyển
                    </Label>
                    <div className="relative">
                      <Car
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300"
                        size={14}
                      />
                      <Input
                        {...register("vehicle")}
                        className="h-[34px] pl-9 text-[13px] border-[#ccc] rounded-none focus:border-blue-500 shadow-none"
                        placeholder="Biển số xe..."
                      />
                    </div>
                  </div>
                  <div className="md:col-span-4 space-y-1.5 animate-in fade-in zoom-in-95 duration-300">
                    <Label className="text-[10px] font-black text-blue-600 uppercase tracking-tight">
                      Tài xế vận chuyển
                    </Label>
                    <div className="relative">
                      <User
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300"
                        size={14}
                      />
                      <Input
                        {...register("transporter")}
                        className="h-[34px] pl-9 text-[13px] border-[#ccc] rounded-none focus:border-blue-500 shadow-none"
                        placeholder="Họ tên tài xế..."
                      />
                    </div>
                  </div>
                  <div className="md:col-span-4 space-y-1.5 animate-in fade-in zoom-in-95 duration-300">
                    <Label className="text-[10px] font-black text-blue-600 uppercase tracking-tight">
                      Lệnh điều động số
                    </Label>
                    <div className="relative">
                      <FileText
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300"
                        size={14}
                      />
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
                <Plus size={16} className="text-blue-600" /> 2. Danh mục vật tư
                điều chuyển
              </h3>

              <div className="flex flex-1 items-center gap-2 min-w-[300px] max-w-[600px]">
                {/* Ô Tìm kiếm với Dropdown */}
              <div className="relative flex-1">
                <Search
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  size={16}
                />
                <Input
                  ref={searchInputRef}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onFocus={openProductDropdown}
                  onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
                  disabled={!currentSourceBranch} // Khóa nếu chưa chọn kho xuất
                  placeholder={!currentSourceBranch ? "Vui lòng chọn Kho xuất trước..." : "Tìm theo tên, mã SKU...(F3)"}
                  className="pl-10 h-9 text-[13px] border-slate-200 rounded-none focus:border-blue-500 shadow-none bg-white relative z-20 disabled:bg-slate-50"
                />

                {/* Dropdown Gợi ý sản phẩm */}
                {showDropdown && currentSourceBranch && (
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
                    ) : (
                      <div className="p-3 text-center text-[12px] text-slate-400">Không có sản phẩm nào</div>
                    )}
                  </div>
                )}
              </div>
                <Button
                  type="button"
                  variant="outline"
                  className="h-9 text-[12px] border-slate-200 rounded-none px-3 font-bold text-slate-600 hover:bg-slate-50"
                >
                  <ScanBarcode size={16} className="mr-1.5" /> Quét mã
                </Button>
              </div>

              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={openProductDropdown}
                  className="h-9 text-[10px] font-black text-blue-600 border-blue-200 rounded-none uppercase px-4"
                >
                  <Plus size={14} className="mr-1" /> Thêm hàng hóa
                </Button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <Table className="table-custom border-collapse min-w-[1250px]">
                <TableHeader>
                  <TableRow className="bg-slate-50 border-b border-[#ccc]">
                    <TableHead className="w-[40px] text-center p-2 text-[10px] font-black uppercase text-slate-500">
                      STT
                    </TableHead>
                    <TableHead className="w-[150px] p-2 text-[10px] font-black uppercase text-slate-500">
                      Hàng hóa
                    </TableHead>
                    <TableHead className="w-[80px] p-2 text-[10px] font-black uppercase text-slate-500">
                      ĐVT
                    </TableHead>
                    <TableHead className="w-[100px] p-2 text-[10px] font-black uppercase text-slate-500">
                      Quy đổi
                    </TableHead>
                    <TableHead className="w-[100px] text-right p-2 text-[10px] font-black uppercase text-slate-500">
                      Tồn kho
                    </TableHead>
                    <TableHead className="w-[100px] text-right p-2 text-[10px] font-black uppercase text-blue-600">
                      SL chuyển
                    </TableHead>
                    <TableHead className="w-[100px] text-right p-2 text-[10px] font-black uppercase text-emerald-600">
                      Thực nhận
                    </TableHead>
                    <TableHead className="w-[120px] p-2 text-[10px] font-black uppercase text-slate-500">
                      Vị trí đi
                    </TableHead>
                    <TableHead className="w-[120px] p-2 text-[10px] font-black uppercase text-slate-500">
                      Vị trí đến
                    </TableHead>
                    <TableHead className="p-2 text-[10px] font-black uppercase text-slate-500">
                      Ghi chú
                    </TableHead>
                    <TableHead className="w-[40px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {fields.map((field, index) => (
                    <TableRow
                      key={field.id}
                      className="border-b border-slate-100 hover:bg-blue-50/20 transition-colors"
                    >
                      <TableCell className="text-center text-slate-400 font-bold text-[11px]">
                        {index + 1}
                      </TableCell>
                      <TableCell className="p-1">
                        <Input
                          {...register(`items.${index}.productName`)}
                          className="h-8 text-[12px] border-none bg-transparent font-bold focus:ring-0"
                          readOnly
                        />
                      </TableCell>
                      <TableCell className="p-1">
                        <Input
                          {...register(`items.${index}.unit`)}
                          className="h-8 text-[12px] border-none bg-transparent text-center focus:ring-0"
                          readOnly
                        />
                      </TableCell>
                      <TableCell className="p-1 text-center text-[10px] font-medium text-slate-400 italic">
                        --
                      </TableCell>
                      <TableCell className="p-1 text-right font-bold text-slate-500 pr-3">
                        {(watch(`items.${index}.availableQuantity`) || 0).toLocaleString("vi-VN")}
                      </TableCell>
                      <TableCell className="p-1">
                        <Input
                          type="number"
                          {...register(`items.${index}.quantity`)}
                          className="h-8 text-[13px] text-right border-blue-200 bg-blue-50/30 rounded-none font-black text-blue-700 focus:border-blue-500 focus:ring-0"
                        />
                      </TableCell>
                      <TableCell className="p-1">
                        <Input
                          type="number"
                          {...register(`items.${index}.receivedQuantity`)}
                          readOnly
                          className="h-8 text-[13px] text-right border-emerald-100 bg-emerald-50/30 rounded-none text-emerald-700 font-bold focus:ring-0 cursor-not-allowed"
                        />
                      </TableCell>
                      <TableCell className="p-1">
                        <Input
                          {...register(`items.${index}.fromLoc`)}
                          className="h-8 text-[11px] border-slate-200 rounded-none focus:border-blue-500 focus:ring-0"
                          placeholder="A-01..."
                        />
                      </TableCell>
                      <TableCell className="p-1">
                        <Input
                          {...register(`items.${index}.toLoc`)}
                          className="h-8 text-[11px] border-slate-200 rounded-none focus:border-blue-500 focus:ring-0"
                          placeholder="B-05..."
                        />
                      </TableCell>
                      <TableCell className="p-1">
                        <Input
                          {...register(`items.${index}.itemNote`)}
                          className="h-8 text-[11px] border-none italic bg-transparent focus:ring-0"
                          placeholder="..."
                        />
                      </TableCell>
                      <TableCell className="p-1 text-center">
                        <button
                          type="button"
                          onClick={() => remove(index)}
                          className="text-slate-300 hover:text-rose-500 transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            {fields.length === 0 && (
              <div className="py-16 flex flex-col items-center justify-center bg-white space-y-4">
                <Search size={48} className="text-slate-200" />
                <div className="text-center">
                  <p className="text-[13px] font-black text-slate-600 uppercase tracking-widest">
                    Danh mục điều chuyển đang trống
                  </p>
                </div>
                <div className="flex gap-3">
                  <Button
                    type="button"
                    onClick={openProductDropdown}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-black text-[11px] uppercase rounded-none shadow-lg shadow-blue-100 flex gap-2"
                  >
                    <ListPlus size={18} /> Chọn hàng từ danh sách
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Audit Log */}
          <div className="bg-white border border-[#dcdcdc] p-6 rounded-none shadow-sm">
            <div className="flex items-center gap-2 mb-4 text-slate-700 font-black text-[11px] uppercase tracking-widest border-b pb-3">
              <History size={16} /> Nhật ký xử lý chứng từ hệ thống
            </div>
            <div className="space-y-3">
              {auditLogs.map((log, i) => (
                <div
                  key={i}
                  className="flex gap-4 items-start text-[12px] border-l-2 border-slate-100 pl-4 ml-2"
                >
                  <div className="min-w-[120px] text-slate-400 font-mono">
                    {log.time}
                  </div>
                  <div className="font-black text-blue-600">{log.user}</div>
                  <div className="text-slate-600">
                    {log.action}:{" "}
                    <span className="text-slate-400 italic">{log.detail}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar - Right */}
        <div className="lg:col-span-3 space-y-5">
          <div className="bg-white border border-[#dcdcdc] p-6 rounded-none shadow-sm space-y-6">
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-[10px] font-black text-slate-400 uppercase flex items-center gap-2">
                  <Building2 size={12} /> Chi nhánh xuất hàng
                </Label>
                <Controller
                  name="sourceBranch"
                  control={control}
                  render={({ field }) => (
                    <Select
                      value={field.value}
                      onValueChange={(val) => {
                        field.onChange(val);
                        // Khi đổi chi nhánh xuất, xóa hết sản phẩm cũ đang chọn (do tồn kho khác nhau)
                        remove();
                        const selectedBranch = branches.find(b => b.id.toString() === val);
                        if (selectedBranch) {
                          setValue("sourceAddress", selectedBranch.addressDetail || "Chi nhánh chưa cập nhật địa chỉ");
                        }
                      }}
                    >
                      <SelectTrigger className="h-8 text-[12px] border-[#eee] rounded-none font-bold focus:ring-0">
                        <SelectValue placeholder="Chọn kho xuất..." />
                      </SelectTrigger>
                      <SelectContent className="rounded-none">
                        {branches.map(b => (
                          <SelectItem key={b.id} value={b.id.toString()}>{b.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] font-black text-slate-500 uppercase tracking-tight flex items-center gap-2">
                  <MapPin size={12} className="text-rose-500" /> Địa chỉ kho
                  xuất
                </Label>
                <Controller
                  name="sourceAddress"
                  control={control}
                  render={({ field }) => (
                    <Textarea
                      {...field}
                      readOnly // KHÓA NHẬP TAY
                      placeholder="Địa chỉ chi tiết..."
                      className="min-h-[60px] text-[12px] border-[#ccc] rounded-none focus:border-blue-500 shadow-none resize-none bg-slate-50 text-slate-600 cursor-not-allowed"
                    />
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
                  <Building2 size={12} /> Chi nhánh nhận hàng
                </Label>
                <Controller
                  name="destBranch"
                  control={control}
                  render={({ field }) => (
                    <Select
                      value={field.value}
                      onValueChange={(val) => {
                        field.onChange(val); // Lưu ID chi nhánh vào form
                        // Tìm chi nhánh vừa chọn trong mảng branches
                        const selectedBranch = branches.find(b => b.id.toString() === val);
                        if (selectedBranch) {
                          // Tự động điền địa chỉ vào ô text area
                          setValue("destAddress", selectedBranch.addressDetail || "Chi nhánh chưa cập nhật địa chỉ");
                        }
                      }}
                    >
                      <SelectTrigger className="h-8 text-[12px] border-[#eee] rounded-none font-bold focus:ring-0">
                        <SelectValue placeholder="Chọn kho nhận..." />
                      </SelectTrigger>
                      <SelectContent className="rounded-none">
                        {branches.map(b => (
                          <SelectItem
                            key={b.id}
                            value={b.id.toString()}
                            disabled={b.id.toString() === currentSourceBranch}
                          >
                            {b.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] font-black text-slate-500 uppercase tracking-tight flex items-center gap-2">
                  <MapPin size={12} className="text-emerald-500" /> Địa chỉ kho
                  nhận
                </Label>
                <Controller
                  name="destAddress"
                  control={control}
                  render={({ field }) => (
                    <Textarea
                      {...field}
                      readOnly // KHÓA NHẬP TAY
                      placeholder="Địa chỉ chi tiết..."
                      className="min-h-[60px] text-[12px] border-[#ccc] rounded-none focus:border-blue-500 shadow-none resize-none bg-slate-50 text-slate-600 cursor-not-allowed"
                    />
                  )}
                />
              </div>
            </div>
          </div>

          <div className="bg-white border border-[#dcdcdc] p-6 rounded-none shadow-sm space-y-4">
            <div className="space-y-1.5">
              <Label className="text-[9px] font-bold text-slate-400 uppercase">
                Ngày điều chuyển (24H)
              </Label>
              <Input
                type="datetime-local"
                {...register("transferDate")}
                className="h-[34px] text-[12px] border-[#ccc] rounded-none focus:border-blue-500"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[9px] font-bold text-slate-400 uppercase">
                Tham chiếu chứng từ
              </Label>
              <Input
                {...register("referenceCode")}
                className="h-[34px] text-[12px] border-[#ccc] rounded-none font-mono focus:border-blue-500"
                placeholder="Mã YCDC, Mã ĐH..."
              />
            </div>
          </div>

          <div className="p-5 bg-amber-50 border border-amber-100 rounded-none flex gap-3">
            <AlertCircle size={18} className="text-amber-600 shrink-0" />
            <p className="text-[11px] text-amber-700 leading-relaxed font-bold italic uppercase tracking-tighter">
              Lưu ý: Tồn khả dụng sẽ được cập nhật ngay sau khi xác nhận xuất
              kho.
            </p>
          </div>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="fixed bottom-0 left-0 lg:left-[260px] right-0 bg-[#f8f9fa] border-t border-[#ddd] p-[12px_30px] flex items-center justify-end gap-[15px] z-[999] shadow-[0_-4px_15px_rgba(0,0,0,0.05)]">
        <Button
          variant="outline"
          type="button"
          className="min-w-[110px] h-[38px] text-[12px] font-bold border-[#ccc] bg-white rounded-none uppercase hover:bg-slate-50 transition-all"
          onClick={() => router.back()}
        >
          HỦY BỎ
        </Button>
        <Button
          type="submit"
          disabled={isSubmitting}
          className="min-w-[180px] h-[38px] text-[12px] font-black bg-blue-600 hover:bg-blue-700 text-white rounded-none shadow-md shadow-blue-100 uppercase transition-all active:scale-[0.98] flex items-center justify-center"
        >
          {isSubmitting ? (
             <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
          ) : (
             <Save size={18} className="mr-2" />
          )}
          {isSubmitting ? "ĐANG LƯU..." : "LƯU & GỬI DUYỆT"}
        </Button>
      </div>
    </form>
  );
}