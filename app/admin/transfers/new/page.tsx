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
    console.log("Lá»—i Validation cá»§a Zod:", errors);
    toast.error("Dá»¯ liá»‡u chÆ°a há»£p lá»‡! Vui lĂ²ng kiá»ƒm tra cĂ¡c Ă´ bĂ¡o lá»—i mĂ u Ä‘á».");
  };

  useEffect(() => {
    const fetchBranches = async () => {
      try {
        const data = await branchService.getAll();
        setBranches(data);
      } catch (error) {
        console.error("Lá»—i fetch chi nhĂ¡nh", error);
        toast.error("KhĂ´ng thá»ƒ táº£i danh sĂ¡ch chi nhĂ¡nh");
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
      transferType: "BETWEEN_WAREHOUSES",
      description: sourceCode ? `Xuáº¥t Ä‘iá»u chuyá»ƒn theo yĂªu cáº§u ${sourceCode}` : "",
      transporter: "",
      vehicle: "",
      dispatchOrder: "",
      transferCode: "PDC-" + Date.now().toString().slice(-6),
      sourceBranch: "",
      sourceWarehouse: "wh-hn",
      sourceAddress: "",
      transferDate: new Date().toISOString().slice(0, 16),
      destBranch: "",
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
  const currentSourceBranch = watch("sourceBranch");

  const { fields, append, remove } = useFieldArray({
    control,
    name: "items",
  });

  const auditLogs = [
    {
      time: new Date().toLocaleString("vi-VN"),
      user: "Há»‡ thá»‘ng",
      action: "Khá»Ÿi táº¡o phiáº¿u dá»± tháº£o",
      detail: "Há»‡ thá»‘ng tá»± Ä‘á»™ng cáº¥p mĂ£ phiáº¿u",
    },
  ];

  const onSubmit = async (formData: any) => {
    if (formData.sourceBranch === formData.destBranch) {
      toast.error("Chi nhĂ¡nh xuáº¥t vĂ  Chi nhĂ¡nh nháº­n khĂ´ng Ä‘Æ°á»£c trĂ¹ng nhau!");
      return;
    }

    setIsSubmitting(true);
    try {
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
        items: formData.items.map((item: any) => ({
         sku: item.productCode,
          quantity: Number(item.quantity),
          quantityRequested: Number(item.quantity),
          quantityReal: 0,
          itemNote: item.itemNote,
        })),
      };

      await transferService.create(payload);
      toast.success("ÄĂ£ táº¡o phiáº¿u vĂ  gá»­i yĂªu cáº§u duyá»‡t chuyá»ƒn kho!");
      router.push("/admin/transfers");
    } catch (error: any) {
      console.error("Lá»—i táº¡o phiáº¿u:", error);
      toast.error("Lá»—i há»‡ thá»‘ng: " + (error.response?.data || "KhĂ´ng thá»ƒ táº¡o phiáº¿u"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const steps = [
    { label: "Khá»Ÿi táº¡o", status: "completed", icon: Plus },
    { label: "Chá» xuáº¥t kho", status: "active", icon: AlertCircle },
    { label: "Äang váº­n chuyá»ƒn", status: "upcoming", icon: Truck },
    { label: "ÄĂ£ nháº­n hĂ ng", status: "upcoming", icon: CheckCircle2 },
  ];

  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedProductIds, setSelectedProductIds] = useState<(number | string)[]>([]);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const openProductDropdown = () => {
    if (!currentSourceBranch) {
      toast.error("Vui lĂ²ng chá»n 'Chi nhĂ¡nh xuáº¥t hĂ ng' trÆ°á»›c khi thĂªm hĂ ng hĂ³a!");
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

        if (document.activeElement?.getAttribute("placeholder")?.includes("TĂ¬m theo tĂªn")) {
          setShowDropdown(true);
        }
      } catch (error) {
        console.error("Lá»—i tĂ¬m sáº£n pháº©m", error);
      } finally {
        setIsSearching(false);
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm, currentSourceBranch]);

  const handleSelectProduct = (variant: any) => {
      // 1. Kiá»ƒm tra trĂ¹ng dá»±a trĂªn SKU giá»‘ng Nháº­p kho
      const isExist = fields.some((f: any) => f.productCode === variant.sku);
      if (isExist) {
        toast.error("Sáº£n pháº©m nĂ y Ä‘Ă£ cĂ³ trong danh sĂ¡ch!");
        return;
      }

      let displayName = variant.productName || "Sáº£n pháº©m";
      if (variant.sku) displayName += ` [${variant.sku}]`;

      // 2. Append dá»¯ liá»‡u - DĂ¹ng variant.sku lĂ m Ä‘á»‹nh danh chĂ­nh
      append({
        variantId: variant.id,
        productCode: variant.sku, // <--- SKU lĂ  duy nháº¥t
        productName: displayName,
        unit: variant.unit || "CĂ¡i",
        quantity: 1,
        availableQuantity: variant.quantity || 0,
        itemNote: "",
      });

      setSearchTerm("");
      setShowDropdown(false);
      toast.success("ÄĂ£ thĂªm biáº¿n thá»ƒ thĂ nh cĂ´ng!");
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
            Láº­p phiáº¿u Ä‘iá»u chuyá»ƒn hĂ ng hĂ³a
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
                      Äiá»u chuyá»ƒn liĂªn kho
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="INTERNAL" id="type-internal" />
                    <Label
                      htmlFor="type-internal"
                      className={cn("text-[11px] font-bold uppercase tracking-wider cursor-pointer", field.value === "INTERNAL" ? "text-blue-600" : "text-slate-400")}
                    >
                      Ná»™i bá»™
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
          {/* Section 1: ThĂ´ng tin lá»‡nh */}
          <div className="bg-white border border-[#dcdcdc] p-6 rounded-none shadow-sm">
            <div className="flex items-center gap-2 mb-6 text-blue-700 font-black text-[11px] uppercase tracking-widest border-b pb-3">
              <ArrowRightLeft size={16} /> 1. ThĂ´ng tin lá»‡nh Ä‘iá»u chuyá»ƒn hĂ ng hĂ³a
            </div>
            <div className="grid grid-cols-1 md:grid-cols-12 gap-x-6 gap-y-5">

              <div className="md:col-span-8 space-y-1.5">
                <Label className="text-[10px] font-black text-slate-500 uppercase tracking-tight">LĂ½ do Ä‘iá»u chuyá»ƒn / Diá»…n giáº£i *</Label>
                <Input
                  {...register("description")}
                  className={cn("h-[34px] text-[13px] rounded-none font-bold shadow-none", errors.description ? "border-rose-500 focus:border-rose-500" : "border-[#ccc] focus:border-blue-500")}
                />
                {/* HIá»‚N THá» Lá»–I */}
                {errors.description && <p className="text-rose-500 text-[10px] mt-1 font-medium">{errors.description.message as string}</p>}
              </div>

              <div className="md:col-span-4 space-y-1.5">
                <Label className="text-[10px] font-black text-rose-600 uppercase tracking-tight">MĂ£ phiáº¿u há»‡ thá»‘ng</Label>
                <Input
                  {...register("transferCode")}
                  readOnly
                  className="h-[34px] text-[13px] border-[#ccc] rounded-none bg-slate-50 font-mono text-slate-500 cursor-not-allowed"
                />
              </div>

              {transferType === "BETWEEN_WAREHOUSES" && (
                <React.Fragment>
                  <div className="md:col-span-4 space-y-1.5 animate-in fade-in zoom-in-95 duration-300">
                    <Label className="text-[10px] font-black text-blue-600 uppercase tracking-tight">PhÆ°Æ¡ng tiá»‡n váº­n chuyá»ƒn</Label>
                    <div className="relative">
                      <Car className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={14} />
                      <Input
                        {...register("vehicle")}
                        className={cn("h-[34px] pl-9 text-[13px] rounded-none shadow-none", errors.vehicle ? "border-rose-500" : "border-[#ccc] focus:border-blue-500")}
                        placeholder="Biá»ƒn sá»‘ xe..."
                      />
                    </div>
                  </div>
                  <div className="md:col-span-4 space-y-1.5 animate-in fade-in zoom-in-95 duration-300">
                    <Label className="text-[10px] font-black text-blue-600 uppercase tracking-tight">TĂ i xáº¿ váº­n chuyá»ƒn *</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={14} />
                      <Input
                        {...register("transporter")}
                        className={cn("h-[34px] pl-9 text-[13px] rounded-none shadow-none", errors.transporter ? "border-rose-500 focus:border-rose-500" : "border-[#ccc] focus:border-blue-500")}
                        placeholder="Há» tĂªn tĂ i xáº¿..."
                      />
                    </div>
                    {/* HIá»‚N THá» Lá»–I */}
                    {errors.transporter && <p className="text-rose-500 text-[10px] mt-1 font-medium">{errors.transporter.message as string}</p>}
                  </div>
                  <div className="md:col-span-4 space-y-1.5 animate-in fade-in zoom-in-95 duration-300">
                    <Label className="text-[10px] font-black text-blue-600 uppercase tracking-tight">Lá»‡nh Ä‘iá»u Ä‘á»™ng sá»‘</Label>
                    <div className="relative">
                      <FileText className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={14} />
                      <Input
                        {...register("dispatchOrder")}
                        className="h-[34px] pl-9 text-[13px] border-[#ccc] rounded-none font-mono focus:border-blue-500 shadow-none"
                        placeholder="Sá»‘ hiá»‡u vÄƒn báº£n..."
                      />
                    </div>
                  </div>
                </React.Fragment>
              )}
            </div>
          </div>

          {/* Section 2: Danh má»¥c hĂ ng hĂ³a */}
          <div className="bg-white border border-[#dcdcdc] rounded-none shadow-sm">
            <div className="px-5 py-3 border-b border-[#eee] bg-[#f8f9fa] flex flex-wrap items-center justify-between gap-4">
              <h3 className="text-[11px] font-black text-slate-700 uppercase flex items-center gap-2 tracking-wider whitespace-nowrap">
                <Plus size={16} className="text-blue-600" /> 2. Danh má»¥c váº­t tÆ° Ä‘iá»u chuyá»ƒn
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
                    placeholder={!currentSourceBranch ? "Vui lĂ²ng chá»n Kho xuáº¥t trÆ°á»›c..." : "TĂ¬m theo tĂªn, mĂ£ SKU...(F3)"}
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
                        <div className="p-3 text-center text-[12px] text-slate-400 italic">Äang táº£i dá»¯ liá»‡u...</div>
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
                                Tá»“n: {variant.quantity || 0}
                              </p>
                              <p className="text-[10px] text-slate-400">CĂ¡i</p>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="p-3 text-center text-[12px] text-slate-400">KhĂ´ng cĂ³ sáº£n pháº©m nĂ o</div>
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
                    <TableHead className="w-[150px] p-2 text-[10px] font-black uppercase text-slate-500">HĂ ng hĂ³a</TableHead>
                    <TableHead className="w-[80px] p-2 text-[10px] font-black uppercase text-slate-500">ÄVT</TableHead>
                    <TableHead className="w-[100px] text-right p-2 text-[10px] font-black uppercase text-slate-500">Tá»“n kho</TableHead>
                    <TableHead className="w-[100px] text-right p-2 text-[10px] font-black uppercase text-blue-600">SL chuyá»ƒn</TableHead>
                    <TableHead className="w-[100px] text-right p-2 text-[10px] font-black uppercase text-emerald-600">Thá»±c nháº­n</TableHead>
                    <TableHead className="p-2 text-[10px] font-black uppercase text-slate-500">Ghi chĂº</TableHead>
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
                        {/* HIá»‚N THá» Lá»–I ITEMS */}
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
            {/* Lá»–I Náº¾U CHÆ¯A CĂ“ ITEMS NĂ€O HOáº¶C Lá»–I Tá»ª ZOD ITEMS LEVEL */}
            {(errors.items?.message || errors.items?.root?.message) && (
                <div className="p-3 bg-rose-50 border-t border-rose-100 text-rose-500 text-[11px] font-bold text-center">
                    {errors.items?.message as string || errors.items?.root?.message as string}
                </div>
            )}
            {fields.length === 0 && (
              <div className="py-16 flex flex-col items-center justify-center bg-white space-y-4">
                <Search size={48} className="text-slate-200" />
                <div className="text-center">
                  <p className="text-[13px] font-black text-slate-600 uppercase tracking-widest">Danh má»¥c Ä‘iá»u chuyá»ƒn Ä‘ang trá»‘ng</p>
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
                  <Building2 size={12} /> Chi nhĂ¡nh xuáº¥t hĂ ng *
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
                        if (selectedBranch) setValue("sourceAddress", selectedBranch.addressDetail || "ChÆ°a cáº­p nháº­t Ä‘á»‹a chá»‰");
                      }}
                    >
                      <SelectTrigger className={cn("h-8 text-[12px] rounded-none font-bold focus:ring-0", errors.sourceBranch ? "border-rose-500" : "border-[#eee]")}>
                        <SelectValue placeholder="Chá»n kho xuáº¥t..." />
                      </SelectTrigger>
                      <SelectContent className="rounded-none">
                        {branches.map((b) => (
                          <SelectItem key={b.id} value={b.id.toString()}>{b.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {/* HIá»‚N THá» Lá»–I */}
                {errors.sourceBranch && <p className="text-rose-500 text-[10px] mt-1 font-medium">{errors.sourceBranch.message as string}</p>}
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] font-black text-slate-500 uppercase tracking-tight flex items-center gap-2">
                  <MapPin size={12} className="text-rose-500" /> Äá»‹a chá»‰ kho xuáº¥t
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
                  <Building2 size={12} /> Chi nhĂ¡nh nháº­n hĂ ng *
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
                        if (selectedBranch) setValue("destAddress", selectedBranch.addressDetail || "ChÆ°a cáº­p nháº­t Ä‘á»‹a chá»‰");
                      }}
                    >
                      <SelectTrigger className={cn("h-8 text-[12px] rounded-none font-bold focus:ring-0", errors.destBranch ? "border-rose-500" : "border-[#eee]")}>
                        <SelectValue placeholder="Chá»n kho nháº­n..." />
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
                {/* HIá»‚N THá» Lá»–I */}
                {errors.destBranch && <p className="text-rose-500 text-[10px] mt-1 font-medium">{errors.destBranch.message as string}</p>}
                {errors.destWarehouse && <p className="text-rose-500 text-[10px] mt-1 font-medium">{errors.destWarehouse.message as string}</p>}
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] font-black text-slate-500 uppercase tracking-tight flex items-center gap-2">
                  <MapPin size={12} className="text-emerald-500" /> Äá»‹a chá»‰ kho nháº­n
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
              <Label className="text-[9px] font-bold text-slate-400 uppercase">NgĂ y Ä‘iá»u chuyá»ƒn (24H) *</Label>
              <Input
                type="datetime-local"
                {...register("transferDate")}
                className={cn("h-[34px] text-[12px] rounded-none", errors.transferDate ? "border-rose-500" : "border-[#ccc]")}
              />
              {/* HIá»‚N THá» Lá»–I */}
              {errors.transferDate && <p className="text-rose-500 text-[10px] mt-1 font-medium">{errors.transferDate.message as string}</p>}
            </div>
            <div className="space-y-1.5">
              <Label className="text-[9px] font-bold text-slate-400 uppercase">Tham chiáº¿u chá»©ng tá»« *</Label>
              <Input
                {...register("referenceCode")}
                className={cn("h-[34px] text-[12px] rounded-none font-mono", errors.referenceCode ? "border-rose-500" : "border-[#ccc]")}
                placeholder="MĂ£ YCDC, MĂ£ ÄH..."
              />
              {/* HIá»‚N THá» Lá»–I */}
              {errors.referenceCode && <p className="text-rose-500 text-[10px] mt-1 font-medium">{errors.referenceCode.message as string}</p>}
            </div>
          </div>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="fixed bottom-0 left-0 lg:left-[260px] right-0 bg-[#f8f9fa] border-t border-[#ddd] p-[12px_30px] flex items-center justify-end gap-[15px] z-[999] shadow-[0_-4px_15px_rgba(0,0,0,0.05)]">
        <Button variant="outline" type="button" className="min-w-[110px] h-[38px] text-[12px] font-bold border-[#ccc] bg-white rounded-none uppercase hover:bg-slate-50 transition-all" onClick={() => router.back()}>
          Há»¦Y Bá»
        </Button>
        <Button type="submit" disabled={isSubmitting} className="min-w-[180px] h-[38px] text-[12px] font-black bg-blue-600 hover:bg-blue-700 text-white rounded-none shadow-md shadow-blue-100 uppercase transition-all active:scale-[0.98] flex items-center justify-center">
          {isSubmitting ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div> : <Save size={18} className="mr-2" />}
          {isSubmitting ? "ÄANG LÆ¯U..." : "LÆ¯U & Gá»¬I DUYá»†T"}
        </Button>
      </div>
    </form>
  );
}
