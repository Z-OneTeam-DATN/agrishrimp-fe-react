"use client";

import React, { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useFieldArray, useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { transferService } from "@/app/services/transfer.service";
import { branchService } from "@/app/services/branchService";
import { ProductService } from "@/app/services/product.service";
import {
  Plus,
  Trash2,
  Search,
  Truck,
  CheckCircle2,
  AlertCircle,
  Save,
  DollarSign,
  Loader2,
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
import { TransferSchema } from "@/app/types/inventory.schema";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function NewTransferPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sourceCode = searchParams.get("source");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [branches, setBranches] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedProductIds, setSelectedProductIds] = useState<(number | string)[]>([]);
  const searchInputRef = useRef<HTMLInputElement>(null);

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
      transferBusinessType: "STOCK_TRANSFER" as const,
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

  const transferBusinessType = watch("transferBusinessType");
  const currentSourceBranch = watch("sourceBranch");
  const watchedItems = watch("items");
  const isInternalSale = transferBusinessType === "INTERNAL_SALE";
  const totalTransferQuantity = (watchedItems || []).reduce(
    (sum: number, item: any) => sum + (Number(item.quantity) || 0),
    0,
  );
  const totalTransferAmount = isInternalSale
    ? (watchedItems || []).reduce((sum: number, item: any) => {
        const qty = Number(item.quantity) || 0;
        const price = Number(item.unitTransferPrice) || 0;
        return sum + qty * price;
      }, 0)
    : 0;

  useEffect(() => {
    setValue(
      "transferType",
      isInternalSale ? "INTERNAL" : "BETWEEN_WAREHOUSES",
      { shouldValidate: true },
    );
  }, [isInternalSale, setValue]);

  const { fields, append, remove } = useFieldArray({
    control,
    name: "items",
  });

  const onSubmit = async (formData: any) => {
    setIsSubmitting(true);
    try {
      const isInternalSalePayload =
        formData.transferBusinessType === "INTERNAL_SALE";
      const resolvedTransferType = isInternalSalePayload
        ? "INTERNAL"
        : "BETWEEN_WAREHOUSES";
      const payload = {
        fromBranchId: Number(formData.sourceBranch),
        toBranchId: Number(formData.destBranch),
        transferType: resolvedTransferType,
        transferBusinessType:
          formData.transferBusinessType || "STOCK_TRANSFER",
        description: formData.description,
        transporter: formData.transporter || null,
        vehicle: formData.vehicle || null,
        dispatchOrder: formData.dispatchOrder || null,
        referenceCode: formData.referenceCode || null,
        priority: "NORMAL",
        transferDate: formData.transferDate
          ? new Date(formData.transferDate).toISOString()
          : null,
        deadline: formData.transferDate
          ? new Date(formData.transferDate).toISOString()
          : null,
        items: formData.items.map((item: any) => ({
          sku: item.productCode,
          quantity: Number(item.quantity),
          quantityRequested: Number(item.quantity),
          quantityReal: 0,
          itemNote: item.itemNote || "",
          unitTransferPrice: isInternalSalePayload
            ? Number(item.unitTransferPrice) || 0
            : null,
        })),
      };

      await transferService.create(payload);
      toast.success("Đã tạo phiếu và gửi yêu cầu duyệt chuyển kho!");
      router.push("/admin/transfers");
    } catch (error: any) {
      const errMsg =
        error.response?.data?.message ||
        error.response?.data ||
        "Không thể tạo phiếu";
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
  const fieldLabelClass = "text-[10.5px] font-semibold text-slate-500";
  const fieldControlClass =
    "h-[38px] text-[13px] font-normal text-slate-800 shadow-none placeholder:text-slate-400";
  const selectTriggerClass =
    "h-[38px] text-[13px] font-normal text-slate-800 data-[placeholder]:text-slate-400";

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
        const results = await ProductService.searchVariants(
          searchTerm,
          currentSourceBranch,
        );
        const finalData = Array.isArray(results) ? results : results?.data || [];
        setSearchResults(
          finalData.filter((v: any) => Number(v.quantity ?? 0) > 0),
        );

        if (
          document.activeElement?.getAttribute("placeholder")?.includes("Tìm theo tên")
        ) {
          setShowDropdown(true);
        }
      } catch (error) {
        console.error("Lỗi tìm sản phẩm", error);
      } finally {
        setIsSearching(false);
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm, currentSourceBranch, showDropdown]);

  const handleSelectProduct = (variant: any) => {
    const isExist = fields.some((f: any) => f.productCode === variant.sku);
    if (isExist) {
      toast.error("Sản phẩm này đã có trong danh sách!");
      return;
    }

    let displayName = variant.productName || "Sản phẩm";
    if (variant.sku) displayName += ` [${variant.sku}]`;

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
    setSelectedProductIds([]);
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
      className="space-y-3 pb-[100px] text-slate-800"
    >
      <div className="mt-2 mb-8 space-y-4 px-1">
        <div className="flex items-center gap-3">
          <h1 className="text-[20px] font-semibold tracking-tight uppercase text-slate-900">
            Lập phiếu điều chuyển hàng hóa
          </h1>
        </div>
      </div>

      <div className="border border-slate-200 bg-white px-4 py-4 shadow-sm">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-2">
          {steps.map((step, idx) => (
            <React.Fragment key={idx}>
              <div className="relative z-10 flex min-w-0 flex-col items-center gap-2">
                <div
                  className={cn(
                    "flex h-7 w-7 items-center justify-center rounded-full border text-[10px] transition-colors",
                    step.status === "completed"
                      ? "border-blue-200 bg-blue-50 text-blue-600"
                      : step.status === "active"
                        ? "border-sky-200 bg-sky-50 text-sky-600"
                        : "border-slate-200 bg-slate-50 text-slate-300",
                  )}
                >
                  <step.icon size={15} />
                </div>
                <span
                  className={cn(
                    "text-center text-[10px] font-medium",
                    step.status === "active"
                      ? "text-sky-600"
                      : "text-slate-500",
                  )}
                >
                  {step.label}
                </span>
              </div>
              {idx < steps.length - 1 && (
                <div className="relative -mt-5 h-px flex-1 bg-slate-200">
                  <div
                    className={cn(
                      "absolute inset-y-0 left-0 transition-all duration-500",
                      steps[idx].status === "completed"
                        ? "w-full bg-blue-300"
                        : "w-0 bg-transparent",
                    )}
                  />
                </div>
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      <div className="space-y-5 px-1">
        <div className="border border-slate-200 bg-white p-6 shadow-sm">
          <div className="border-b border-slate-200 pb-3">
            <span className="text-[11px] font-bold text-slate-800">
              1. Thông tin lệnh điều chuyển hàng hóa
            </span>
          </div>

          <div className="mt-4 space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-12">
              <div className="space-y-1.5 md:col-span-3">
                <Label className={fieldLabelClass}>
                  Loại nghiệp vụ điều chuyển *
                </Label>
                <Controller
                  name="transferBusinessType"
                  control={control}
                  render={({ field }) => (
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                    >
                      <SelectTrigger className={cn(selectTriggerClass, "border-slate-200")}>
                        <SelectValue placeholder="Chọn loại điều chuyển" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="STOCK_TRANSFER">
                          Điều chuyển kho thuần
                        </SelectItem>
                        <SelectItem value="INTERNAL_SALE">
                          Bán nội bộ (có hạch toán)
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>

              <div className="space-y-1.5 md:col-span-3">
                <Label className={fieldLabelClass}>
                  Chi nhánh xuất hàng *
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
                        const selectedBranch = branches.find(
                          (b) => b.id.toString() === val,
                        );
                        if (selectedBranch) {
                          setValue(
                            "sourceAddress",
                            selectedBranch.addressDetail ||
                              "Chưa cập nhật địa chỉ",
                          );
                        }
                      }}
                    >
                      <SelectTrigger
                        className={cn(
                          selectTriggerClass,
                          errors.sourceBranch
                            ? "border-rose-500"
                            : "border-slate-200",
                        )}
                      >
                        <SelectValue placeholder="Chọn kho xuất..." />
                      </SelectTrigger>
                      <SelectContent className="rounded-md">
                        {(transferBusinessType === "STOCK_TRANSFER"
                          ? branches.filter((b) => {
                              const code = String(
                                b.branchCode || "",
                              ).toUpperCase();
                              const type = String(
                                b.branchType || "",
                              ).toUpperCase();
                              const name = String(b.name || "").toLowerCase();
                              if (code === "SYSTEM_DEFECT") return false;
                              if (code === "MAIN_WH") return true;
                              return (
                                type === "WAREHOUSE" &&
                                name.includes("kho tổng")
                              );
                            })
                          : branches
                        ).map((b) => (
                          <SelectItem key={b.id} value={b.id.toString()}>
                            {b.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.sourceBranch && (
                  <p className="mt-1 text-[10px] font-medium text-rose-500">
                    {errors.sourceBranch.message as string}
                  </p>
                )}
              </div>

              <div className="space-y-1.5 md:col-span-3">
                <Label className={fieldLabelClass}>
                  Chi nhánh nhận hàng *
                </Label>
                <Controller
                  name="destBranch"
                  control={control}
                  render={({ field }) => (
                    <Select
                      value={field.value}
                      onValueChange={(val) => {
                        field.onChange(val);
                        const selectedBranch = branches.find(
                          (b) => b.id.toString() === val,
                        );
                        if (selectedBranch) {
                          setValue(
                            "destAddress",
                            selectedBranch.addressDetail ||
                              "Chưa cập nhật địa chỉ",
                          );
                        }
                      }}
                    >
                      <SelectTrigger
                        className={cn(
                          selectTriggerClass,
                          errors.destBranch
                            ? "border-rose-500"
                            : "border-slate-200",
                        )}
                      >
                        <SelectValue placeholder="Chọn kho nhận..." />
                      </SelectTrigger>
                      <SelectContent className="rounded-md">
                        {branches.map((b) => (
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
                {errors.destBranch && (
                  <p className="mt-1 text-[10px] font-medium text-rose-500">
                    {errors.destBranch.message as string}
                  </p>
                )}
                {errors.destWarehouse && (
                  <p className="mt-1 text-[10px] font-medium text-rose-500">
                    {errors.destWarehouse.message as string}
                  </p>
                )}
              </div>

              <div className="space-y-1.5 md:col-span-3">
                <Label className={fieldLabelClass}>
                  Lý do điều chuyển / Diễn giải *
                </Label>
                <Input
                  {...register("description")}
                  className={cn(
                    fieldControlClass,
                    errors.description
                      ? "border-rose-500 focus-visible:ring-rose-500"
                      : "border-slate-200",
                  )}
                  placeholder="Nhập lý do điều chuyển..."
                />
                {errors.description && (
                  <p className="mt-1 text-[10px] font-medium text-rose-500">
                    {errors.description.message as string}
                  </p>
                )}
              </div>

              <div className="space-y-1.5 md:col-span-3">
                <Label className={fieldLabelClass}>
                  Mã phiếu hệ thống
                </Label>
                <Input
                  {...register("transferCode")}
                  readOnly
                  className={cn(fieldControlClass, "cursor-not-allowed border-slate-200 bg-slate-50 text-slate-500")}
                />
              </div>

              <div className="space-y-1.5 md:col-span-3">
                <Label className={fieldLabelClass}>
                  Ngày điều chuyển (24H) *
                </Label>
                <Input
                  type="datetime-local"
                  {...register("transferDate")}
                  className={cn(
                    fieldControlClass,
                    errors.transferDate
                      ? "border-rose-500 focus-visible:ring-rose-500"
                      : "border-slate-200",
                  )}
                />
                {errors.transferDate && (
                  <p className="mt-1 text-[10px] font-medium text-rose-500">
                    {errors.transferDate.message as string}
                  </p>
                )}
              </div>

              <div className="space-y-1.5 md:col-span-3">
                <Label className={fieldLabelClass}>
                  Trạng thái nhập
                </Label>
                <Controller
                  name="importStatus"
                  control={control}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger className={cn(selectTriggerClass, "border-slate-200")}>
                        <SelectValue placeholder="Chọn trạng thái nhập" />
                      </SelectTrigger>
                      <SelectContent className="rounded-md">
                        <SelectItem value="PENDING">Chờ nhập</SelectItem>
                        <SelectItem value="PARTIAL">Nhập một phần</SelectItem>
                        <SelectItem value="COMPLETED">Đã nhập đủ</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>

              <div className="space-y-1.5 md:col-span-3">
                <Label className={fieldLabelClass}>
                  Tham chiếu chứng từ *
                </Label>
                <Input
                  {...register("referenceCode")}
                  className={cn(
                    fieldControlClass,
                    errors.referenceCode
                      ? "border-rose-500 focus-visible:ring-rose-500"
                      : "border-slate-200",
                  )}
                  placeholder="Mã YCDC, Mã ĐH..."
                />
                {errors.referenceCode && (
                  <p className="mt-1 text-[10px] font-medium text-rose-500">
                    {errors.referenceCode.message as string}
                  </p>
                )}
              </div>

              <div className="space-y-1.5 md:col-span-3">
                <Label className={fieldLabelClass}>
                  Phương tiện vận chuyển
                </Label>
                <Input
                  {...register("vehicle")}
                  className={cn(
                    fieldControlClass,
                    errors.vehicle
                      ? "border-rose-500 focus-visible:ring-rose-500"
                      : "border-slate-200",
                  )}
                  placeholder="Biển số xe..."
                />
              </div>

              <div className="space-y-1.5 md:col-span-3">
                <Label className={fieldLabelClass}>
                  Tài xế vận chuyển *
                </Label>
                <Input
                  {...register("transporter")}
                  className={cn(
                    fieldControlClass,
                    errors.transporter
                      ? "border-rose-500 focus-visible:ring-rose-500"
                      : "border-slate-200",
                  )}
                  placeholder="Họ tên tài xế..."
                />
                {errors.transporter && (
                  <p className="mt-1 text-[10px] font-medium text-rose-500">
                    {errors.transporter.message as string}
                  </p>
                )}
              </div>

              <div className="space-y-1.5 md:col-span-3">
                <Label className={fieldLabelClass}>
                  Lệnh điều động số
                </Label>
                <Input
                  {...register("dispatchOrder")}
                  className={cn(fieldControlClass, "border-slate-200")}
                  placeholder="Số hiệu văn bản..."
                />
              </div>

            </div>

            {isInternalSale && (
              <div className="flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2.5 text-amber-800">
                <DollarSign size={14} className="mt-0.5 shrink-0" />
                <p className="text-[11px] font-medium">
                  Chế độ <strong>Bán nội bộ</strong>: cần nhập đơn giá điều
                  chuyển cho từng mặt hàng.
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 px-6 py-4">
            <h3 className="text-[11px] font-bold text-slate-800">
              3. Danh sách vật tư điều chuyển
            </h3>

            <div className="flex min-w-[300px] flex-1 items-center gap-2 lg:max-w-[600px]">
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
                  disabled={!currentSourceBranch}
                  placeholder={
                    !currentSourceBranch
                      ? "Vui lòng chọn kho xuất trước..."
                      : "Tìm theo tên, mã SKU..."
                  }
                  className="relative z-20 h-9 bg-white pl-10 text-[13px] shadow-none disabled:bg-slate-50"
                />

                {showDropdown && currentSourceBranch && (
                  <div className="absolute left-0 right-0 top-full z-50 mt-1 max-h-[320px] overflow-y-auto rounded-md border border-slate-200 bg-white shadow-xl">
                    {searchResults.length > 0 && (
                      <div className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b bg-slate-50 px-3 py-2 text-xs">
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
                          className="h-7 rounded-md bg-blue-600 px-3 text-[11px] hover:bg-blue-700"
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={handleAddSelectedProducts}
                        >
                          Thêm đã chọn
                        </Button>
                      </div>
                    )}
                    {isSearching ? (
                      <div className="p-3 text-center text-[12px] italic text-slate-400">
                        Đang tải dữ liệu...
                      </div>
                    ) : searchResults.length > 0 ? (
                      searchResults.map((variant) => (
                        <div
                          key={variant.id}
                          onMouseDown={() => handleSelectProduct(variant)}
                          className="flex cursor-pointer items-center justify-between border-b border-slate-100 p-2.5 transition-colors hover:bg-sky-50"
                        >
                          <div className="flex items-center gap-2">
                            <div
                              onMouseDown={(e) => e.stopPropagation()}
                              className="flex items-center"
                            >
                              <Checkbox
                                checked={selectedProductIds.some(
                                  (id) => String(id) === String(variant.id),
                                )}
                                onCheckedChange={() =>
                                  toggleSelectedProduct(variant.id)
                                }
                              />
                            </div>
                            <div>
                              <p className="text-[12px] font-semibold text-slate-800">
                                {variant.productName || variant.unit}
                              </p>
                              <p className="text-[10px] text-slate-500">
                                SKU:{" "}
                                <span className="font-mono text-sky-600">
                                  {variant.sku}
                                </span>
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p
                              className={cn(
                                "text-[11px] font-semibold",
                                (variant.quantity || 0) > 0
                                  ? "text-blue-600"
                                  : "text-rose-500",
                              )}
                            >
                              Tồn: {variant.quantity || 0}
                            </p>
                            <p className="text-[10px] text-slate-400">Cái</p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="p-3 text-center text-[12px] text-slate-400">
                        Không có sản phẩm nào
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="overflow-x-auto px-3 py-3">
            <div className="overflow-hidden border border-slate-200">
              <Table
                className={cn(
                  "table-custom table-fixed border-collapse",
                  isInternalSale ? "min-w-[920px]" : "min-w-[760px]",
                )}
              >
                <TableHeader className="bg-slate-50">
                  <TableRow className="border-b border-slate-200">
                    <TableHead className="w-[40px] px-1.5 py-2 text-center text-[10px] font-semibold text-slate-700">
                      STT
                    </TableHead>
                    <TableHead className="w-[220px] px-1.5 py-2 text-[10px] font-semibold text-slate-700">
                      Sản phẩm
                    </TableHead>
                    <TableHead className="w-[54px] px-1.5 py-2 text-[10px] font-semibold text-slate-700">
                      ĐVT
                    </TableHead>
                    <TableHead className="w-[70px] px-1.5 py-2 text-right text-[10px] font-semibold text-slate-700">
                      Tồn kho
                    </TableHead>
                    <TableHead className="w-[78px] px-1.5 py-2 text-right text-[10px] font-semibold text-slate-700">
                      SL chuyển
                    </TableHead>
                    <TableHead className="w-[78px] px-1.5 py-2 text-right text-[10px] font-semibold text-slate-700">
                      Thực nhận
                    </TableHead>
                    {isInternalSale && (
                      <>
                        <TableHead className="w-[86px] px-1.5 py-2 text-right text-[10px] font-semibold text-slate-700">
                          Đơn giá NB
                        </TableHead>
                        <TableHead className="w-[94px] px-1.5 py-2 text-right text-[10px] font-semibold text-slate-700">
                          Thành tiền NB
                        </TableHead>
                      </>
                    )}
                    <TableHead className="w-[160px] px-1.5 py-2 text-[10px] font-semibold text-slate-700">
                      Ghi chú
                    </TableHead>
                    <TableHead className="w-[38px] px-1.5 py-2 text-center text-[10px] font-semibold text-slate-700">
                      Xóa
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {fields.map((field, index) => {
                    const qty = Number(watch(`items.${index}.quantity`)) || 0;
                    const unitPrice =
                      Number(watch(`items.${index}.unitTransferPrice`)) || 0;
                    const lineTotal = qty * unitPrice;
                    const itemErrors = (errors?.items as any)?.[index];
                    const hasRowError = Boolean(
                      itemErrors?.quantity || itemErrors?.unitTransferPrice,
                    );
                    const colSpan = isInternalSale ? 10 : 8;

                    return (
                      <React.Fragment key={field.id}>
                        <TableRow className="border-b border-slate-100 hover:bg-sky-50/40">
                          <TableCell className="px-1.5 py-2 text-center text-[11px] font-medium text-slate-500">
                            {index + 1}
                          </TableCell>
                          <TableCell className="px-1.5 py-1.5">
                            <Input
                              {...register(`items.${index}.productName`)}
                              className="h-7 truncate border-none bg-transparent px-0 text-[11px] font-semibold focus-visible:ring-0"
                              readOnly
                            />
                          </TableCell>
                          <TableCell className="px-1.5 py-1.5">
                            <Input
                              {...register(`items.${index}.unit`)}
                              className="h-7 truncate border-none bg-transparent px-0 text-[11px] focus-visible:ring-0"
                              readOnly
                            />
                          </TableCell>
                          <TableCell className="px-1.5 py-2 text-right text-[11px] font-medium text-slate-500">
                            {(
                              watch(`items.${index}.availableQuantity`) || 0
                            ).toLocaleString("vi-VN")}
                          </TableCell>
                          <TableCell className="px-1.5 py-1.5 text-right">
                            <Input
                              type="number"
                              step="any"
                              {...register(`items.${index}.quantity`)}
                              className={cn(
                                "h-7 rounded-md border-sky-200 bg-sky-50/40 px-2 text-right text-[11px] font-semibold text-sky-700 focus-visible:ring-0",
                                itemErrors?.quantity ? "border-rose-500" : "",
                              )}
                            />
                          </TableCell>
                          <TableCell className="px-1.5 py-1.5">
                            <Input
                              type="number"
                              {...register(`items.${index}.receivedQuantity`)}
                              readOnly
                              className="h-7 cursor-not-allowed rounded-md border-blue-200 bg-blue-50/40 px-2 text-right text-[11px] font-medium text-blue-700 focus-visible:ring-0"
                            />
                          </TableCell>
                          {isInternalSale && (
                            <>
                              <TableCell className="px-1.5 py-1.5 text-right">
                                <Input
                                  type="number"
                                  step="any"
                                  {...register(
                                    `items.${index}.unitTransferPrice`,
                                  )}
                                  className={cn(
                                    "h-7 rounded-md border-amber-200 bg-amber-50/50 px-2 text-right text-[11px] font-semibold text-amber-700 focus-visible:ring-0",
                                    itemErrors?.unitTransferPrice
                                      ? "border-rose-500"
                                      : "",
                                  )}
                                  placeholder="0"
                                />
                              </TableCell>
                              <TableCell className="px-1.5 py-2 text-right text-[11px] font-semibold text-amber-700">
                                {lineTotal > 0 ? (
                                  lineTotal.toLocaleString("vi-VN")
                                ) : (
                                  <span className="text-slate-300">—</span>
                                )}
                              </TableCell>
                            </>
                          )}
                          <TableCell className="px-1.5 py-1.5">
                            <Input
                              {...register(`items.${index}.itemNote`)}
                              className="h-7 truncate border-none bg-transparent px-0 text-[11px] italic focus-visible:ring-0"
                              placeholder="..."
                            />
                          </TableCell>
                          <TableCell className="px-1.5 py-1.5 text-center">
                            <button
                              type="button"
                              onClick={() => remove(index)}
                              className="text-slate-300 transition-colors hover:text-rose-500"
                            >
                              <Trash2 size={14} />
                            </button>
                          </TableCell>
                        </TableRow>
                        {hasRowError && (
                          <TableRow className="bg-rose-50/70">
                            <TableCell
                              colSpan={colSpan}
                              className="px-3 py-2 text-[10px] font-medium text-rose-600"
                            >
                              <div className="flex flex-wrap gap-x-4 gap-y-1">
                                {itemErrors?.quantity && (
                                  <span>
                                    SL chuyển:{" "}
                                    {itemErrors.quantity.message as string}
                                  </span>
                                )}
                                {itemErrors?.unitTransferPrice && (
                                  <span>
                                    Đơn giá NB:{" "}
                                    {itemErrors.unitTransferPrice.message as string}
                                  </span>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        )}
                      </React.Fragment>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </div>

          {isInternalSale && fields.length > 0 && (
            <div className="flex items-center justify-end gap-3 border-t border-amber-200 bg-amber-50 px-6 py-3">
              <span className="text-[11px] font-medium text-amber-700">
                Tổng thành tiền nội bộ
              </span>
              <span className="font-mono text-[16px] font-semibold text-amber-700">
                {totalTransferAmount.toLocaleString("vi-VN")} ₫
              </span>
            </div>
          )}

          {(errors.items?.message || errors.items?.root?.message) && (
            <div className="border-t border-rose-100 bg-rose-50 p-3 text-center text-[11px] font-semibold text-rose-500">
              {errors.items?.message as string ||
                errors.items?.root?.message as string}
            </div>
          )}

          {fields.length === 0 && (
            <div className="flex flex-col items-center justify-center space-y-3 px-6 py-16">
              <Search size={42} className="text-slate-200" />
              <div className="text-center">
                <p className="text-[13px] font-semibold text-slate-500">
                  Danh mục điều chuyển đang trống
                </p>
              </div>
            </div>
          )}
        </div>

      </div>

      <div className="fixed bottom-0 left-0 right-0 z-[999] border-t border-slate-200 bg-white px-4 py-3 lg:left-[260px]">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-wrap items-center gap-4 text-[11px] font-medium text-slate-400">
            <span>
              Tổng số lượng:{" "}
              <span className="text-[14px] font-semibold tracking-normal text-slate-800">
                {totalTransferQuantity}
              </span>
            </span>
            {isInternalSale && (
              <>
                <div className="hidden h-4 w-px bg-slate-300 md:block"></div>
                <span>
                  Tổng tiền nội bộ:{" "}
                  <span className="text-[14px] font-semibold tracking-normal text-amber-700">
                    {totalTransferAmount.toLocaleString("vi-VN")} ₫
                  </span>
                </span>
              </>
            )}
          </div>

          <div className="flex flex-wrap justify-end gap-3">
            <Button
              variant="outline"
              type="button"
              className="h-10 min-w-[110px] rounded-md border-slate-300 bg-white px-6 text-slate-600 hover:bg-slate-50"
              onClick={() => router.back()}
            >
              Hủy bỏ
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="h-10 min-w-[180px] rounded-md bg-blue-600 px-6 font-semibold text-white hover:bg-blue-700"
            >
              {isSubmitting ? (
                <Loader2 size={16} className="mr-2 animate-spin" />
              ) : (
                <Save size={16} className="mr-2" />
              )}
              {isSubmitting ? "Đang lưu..." : "Lưu & gửi duyệt"}
            </Button>
          </div>
        </div>
      </div>
    </form>
  );
}

