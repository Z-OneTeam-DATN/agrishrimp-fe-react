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
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { cn, formatNumber } from "@/lib/utils";

import { branchService } from "@/app/services/branchService";
import { supplierService } from "@/app/services/supplier.service";
import { InventoryExportApiService } from "@/app/services/inventory.service";
import { ProductService } from "@/app/services/product.service";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { usePermissions } from "@/hooks/usePermissions";
import { P } from "@/lib/permissions";

// =================================================================
// 1. Äá»NH NGHÄ¨A ZOD SCHEMA Äá»‚ Báº®T Lá»–I (VALIDATION)
// =================================================================
const ExportItemSchema = z.object({
  productVariantId: z.number(), sku: z.string(), name: z.string(), unit: z.string(), stock: z.number(), price: z.number(),
  quantity: z.coerce.number().min(1, "Sá»‘ lÆ°á»£ng xuáº¥t pháº£i lá»›n hÆ¡n 0"), returnReason: z.string().optional()
});

const ExportCommandSchema = z.object({
  noteCode: z.string(), exportType: z.enum(["INTERNAL", "RETURN"]), expectedDate: z.string().min(1, "Chá»n ngĂ y"),
  referenceCode: z.string(),
  note: z.string().min(1, "Nháº­p lĂ½ do"), branchId: z.string().min(1, "Chá»n kho xuáº¥t"), targetId: z.string().min(1, "Chá»n Ä‘á»‘i tÆ°á»£ng"),
  specificReceiver: z.string(), shippingAddress: z.string(), creatorName: z.string(),
  items: z.array(ExportItemSchema).min(1, "Chá»n Ă­t nháº¥t 1 SP")
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
  const isAdmin = hasPermission(P.EXPORT_APPROVE);

  const [isReadOnly, setIsReadOnly] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(isEditMode);

  const [branches, setBranches] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [allProducts, setAllProducts] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedProductIds, setSelectedProductIds] = useState<(number | string)[]>([]);
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
      exportType: "INTERNAL",
      noteCode: generateNoteCode("INTERNAL"),
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

  const selectedBranchInfo = branches.find(b => b.id?.toString() === watchBranchId);
  const isMainBranch = !selectedBranchInfo || selectedBranchInfo.branchType === "WAREHOUSE";

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
              productVariantId: item.productVariantId, sku: item.sku, name: item.productName || "SP", unit: "CĂ¡i",
              stock: item.stock || 0, quantity: item.quantityRequested, price: item.price || 0, returnReason: item.note || ""
            }))
          });
          setIsInitialLoading(false);
        }).catch(() => {
          toast.error("KhĂ´ng thá»ƒ táº£i chi tiáº¿t phiáº¿u xuáº¥t");
          router.push("/admin/exports");
        });
      }
    }, [isEditMode, exportId, reset, router]);

  useEffect(() => {
    if (!showDropdown) return;
    const fetchProducts = async () => {
      if (!watchBranchId) {
        toast.warning("Vui lĂ²ng chá»n Kho xuáº¥t hĂ ng trÆ°á»›c khi tĂ¬m sáº£n pháº©m");
        setShowDropdown(false);
        return;
      }
      try {
        const data = await ProductService.searchVariants(searchTerm, watchBranchId);
        const productList = Array.isArray(data) ? data : (data?.data || data?.content || []);
        setAllProducts(productList);
      } catch (error) {
        toast.error("KhĂ´ng thá»ƒ táº£i danh sĂ¡ch sáº£n pháº©m");
      }
    };
    const debounceTimer = setTimeout(fetchProducts, 300);
    return () => clearTimeout(debounceTimer);
  }, [searchTerm, showDropdown, watchBranchId]);

  useEffect(() => {
    const loadMasterData = async () => {
      try {
        const [resB, resS] = await Promise.all([
          branchService.getAll(),
          supplierService.getAll(undefined, undefined, 0, 100),
        ]);
        if (resB) setBranches(resB);
        if (resS) setSuppliers(Array.isArray(resS.content) ? resS.content : []);
      } catch (err) { toast.error("Lá»—i táº£i danh má»¥c"); }
    };
    loadMasterData();

    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) setShowDropdown(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
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
        targetInfo = { name: branch.managerNames?.[0] || "Quáº£n lĂ½", phone: branch.phone || "", address: branch.addressDetail || "" };
      }
    } else {
      const supplier = suppliers.find(s => s.id?.toString() === watchTargetId);
      if (supplier) {
        targetInfo = { name: supplier.contactName || "NgÆ°á»i Ä‘áº¡i diá»‡n", phone: supplier.phone || "", address: supplier.addressDetail || "" };
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
    if (watchItems.some(item => item.productVariantId === variant.id)) {
      toast.warning("Sáº£n pháº©m Ä‘Ă£ cĂ³ trong danh sĂ¡ch");
      return;
    }
    append({
      productVariantId: variant.id,
      sku: variant.sku,
      name: `${productName} ${variant.packaging ? `- ${variant.packaging}` : ''}`,
      unit: variant.unit || "CĂ¡i",
      stock: variant.quantity || 0,
      quantity: 1,
      // đŸ‘‡ ÄĂƒ Cáº¬P NHáº¬T á» ÄĂ‚Y: Láº¥y importPrice Ä‘á»ƒ lĂ m giĂ¡ trá»‹ xuáº¥t kho
      price: variant.importPrice || variant.price || 0,
      returnReason: ""
    });
  };

  const toggleSelectedProduct = (productId: number | string) => {
    setSelectedProductIds((prev) =>
      prev.some((id) => String(id) === String(productId))
        ? prev.filter((id) => String(id) !== String(productId))
        : [...prev, productId],
    );
  };

  const addSelectedVariantsToTable = () => {
    const selectedVariants = allProducts.filter((variant) =>
      selectedProductIds.some((id) => String(id) === String(variant.id)),
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
      toast.error(`Sáº£n pháº©m ${invalidItems[0].name} cĂ³ sá»‘ lÆ°á»£ng xuáº¥t vÆ°á»£t quĂ¡ tá»“n kho hiá»‡n táº¡i.`);
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
        price: it.price,
        note: data.exportType === "RETURN" ? it.returnReason : ""
      }))
    };

    setIsSubmitting(true);
    try {
      if (isEditMode) {
        await InventoryExportApiService.updateExportCommand(exportId as string, payload);
        toast.success("Cáº­p nháº­t lá»‡nh xuáº¥t thĂ nh cĂ´ng!");
      } else {
        await InventoryExportApiService.createExportCommand(payload);
        toast.success("Táº¡o lá»‡nh xuáº¥t kho thĂ nh cĂ´ng!");
      }
      router.push("/admin/exports");
    } catch (e: any) {
      toast.error(e.response?.data?.message || "Lá»—i server");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isInitialLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <div className="text-center">
          <Loader2 className="animate-spin mx-auto text-blue-600 mb-2" size={32} />
          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Äang táº£i dá»¯ liá»‡u...</p>
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
               {isEditMode ? (isReadOnly ? "Chi tiáº¿t phiáº¿u xuáº¥t (ÄĂ£ xuáº¥t)" : "Chi tiáº¿t lá»‡nh xuáº¥t") : "Táº¡o lá»‡nh xuáº¥t kho"}
            </h1>
            <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1">
                <Hash size={12}/> MĂ£: <span className="text-blue-600">{watch("noteCode")}</span>
            </p>
        </div>
      </div>

      <div className={cn(
          "mt-2 p-3 border flex items-center gap-3 rounded-sm shadow-sm",
          isAdmin ? "bg-blue-50 border-blue-200 text-blue-700" : "bg-amber-50 border-amber-200 text-amber-700"
      )}>
        <AlertCircle size={18} />
        <p className="text-[12px] font-bold uppercase tracking-wide">
          {isAdmin
            ? "Cháº¿ Ä‘á»™ Quáº£n trá»‹: Há»‡ thá»‘ng sáº½ tá»± Ä‘á»™ng chá»‘t Ä‘Æ¡n vĂ  cáº­p nháº­t tá»“n kho ngay láº­p tá»©c."
            : "Cháº¿ Ä‘á»™ NhĂ¢n viĂªn: ÄÆ¡n sau khi lÆ°u sáº½ á»Ÿ tráº¡ng thĂ¡i Chá» Duyá»‡t bá»Ÿi Quáº£n trá»‹ viĂªn."}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="lg:col-span-8 space-y-5">
          <div className="bg-white border border-slate-200 p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-6 text-blue-700 font-black text-[11px] uppercase tracking-widest border-b pb-3">
              <FileText size={16} /> 1. ThĂ´ng tin lá»‡nh xuáº¥t kho
            </div>

            <div className="grid grid-cols-2 gap-x-6 gap-y-5">
              <div className="space-y-1.5 flex flex-col">
                <Label className="text-[10px] font-bold uppercase mb-1 text-slate-400 tracking-wider">Loáº¡i lá»‡nh xuáº¥t (*)</Label>
                <Controller
                  name="exportType"
                  control={control}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value} disabled={isReadOnly || isEditMode}>
                      <SelectTrigger className="rounded-none h-10 w-full shadow-none border-slate-200"><SelectValue /></SelectTrigger>
                      <SelectContent className="rounded-none">
                        <SelectItem value="INTERNAL">Xuáº¥t dĂ¹ng ná»™i bá»™</SelectItem>
                        {isMainBranch && <SelectItem value="RETURN">Xuáº¥t tráº£ NCC</SelectItem>}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>

              <div className="space-y-1.5 flex flex-col">
                <Label className="text-[10px] font-bold uppercase flex items-center gap-1 mb-1 text-slate-400 tracking-wider"><Hash size={12}/> MĂ£ phiáº¿u (Tá»± Ä‘á»™ng)</Label>
                <Input {...register("noteCode")} readOnly className="rounded-none bg-slate-50 text-slate-500 font-mono text-[13px] h-10 w-full border-slate-200" />
              </div>


              <div className="space-y-1.5 flex flex-col">
                <Label className="text-[10px] font-bold uppercase text-blue-600 flex items-center gap-1 mb-1 tracking-wider">NgĂ y háº¹n xuáº¥t</Label>
                <div className="relative w-full">
                  <Input readOnly={isReadOnly} type="date" {...register("expectedDate")} className={`rounded-none border-slate-200 text-[13px] h-10 w-full pr-10 shadow-none block ${errors.expectedDate ? "border-rose-500" : ""} ${isReadOnly ? 'bg-slate-50' : ''}`} />
                  <CalendarIcon size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                </div>
                {errors.expectedDate && <p className="text-rose-500 text-[10px] mt-1">{errors.expectedDate.message}</p>}
              </div>

              <div className="col-span-2 space-y-1.5 flex flex-col mt-2">
                <Label className="text-[10px] font-bold uppercase mb-1 text-slate-400 tracking-wider">LĂ½ do / Diá»…n giáº£i (*)</Label>
                <Textarea readOnly={isReadOnly} {...register("note")} className={`rounded-none min-h-[80px] text-[13px] w-full shadow-none ${errors.note ? "border-rose-500" : "border-slate-200"} ${isReadOnly ? 'bg-slate-50' : ''}`} placeholder="Nháº­p lĂ½ do xuáº¥t kho..." />
                {errors.note && <p className="text-rose-500 text-[10px] mt-1">{errors.note.message}</p>}
              </div>
            </div>
          </div>

          <div className="bg-white border border-slate-200 shadow-sm overflow-visible">
             <div className="px-5 py-3 bg-[#f8f9fa] border-b flex flex-wrap items-center gap-4">
                <h3 className="text-[11px] font-black uppercase flex items-center gap-2 whitespace-nowrap"><ShoppingBag size={16} className="text-blue-600"/> 2. Danh má»¥c sáº£n pháº©m</h3>

                <div className="relative flex-1 min-w-[300px]" ref={dropdownRef}>
                  <div className="relative">
                    {!isReadOnly && <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />}
                    <Input readOnly={isReadOnly} placeholder={isReadOnly ? "Phiáº¿u Ä‘Ă£ xuáº¥t" : "TĂ¬m theo tĂªn, SKU, danh má»¥c..."} className={`pl-10 h-10 text-[13px] border-slate-200 rounded-none bg-white w-full shadow-none ${isReadOnly ? 'bg-slate-50' : ''}`} value={searchTerm} onChange={(e) => { setSearchTerm(e.target.value); setShowDropdown(true); }} onFocus={() => setShowDropdown(true)} />
                  </div>

                  {showDropdown && !isReadOnly && (
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
                        {allProducts.length > 0 ? (
                          allProducts.map((variant) => (
                            <div
                              key={variant.id || variant.sku}
                              className="p-3 border-b border-slate-100 hover:bg-slate-50 transition-colors cursor-pointer flex justify-between items-center group"
                              onClick={() => addVariantToTable(variant, variant.productName || variant.unit)}
                            >
                              <div className="flex items-center gap-3">
                                 <div
                                   onClick={(e) => e.stopPropagation()}
                                   className="flex items-center"
                                 >
                                   <Checkbox
                                     checked={selectedProductIds.some((id) => String(id) === String(variant.id))}
                                     onCheckedChange={() => toggleSelectedProduct(variant.id)}
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
                                   </p>
                                 </div>
                              </div>

                              <div className="text-right">
                                {/* đŸ‘‡ ÄĂƒ Sá»¬A Cáº¢ HIá»‚N THá» Táº I DROPDOWN THĂ€NH GIĂ NHáº¬P */}
                                <p className="text-[13px] font-bold text-slate-700">{formatNumber(variant.importPrice || variant.price || 0)} â‚«</p>
                                <p className={cn(
                                    "text-[11px] font-bold px-2 py-0.5 rounded-sm mt-1 inline-block border",
                                    variant.quantity > 0
                                      ? "text-blue-600 bg-blue-50 border-blue-100"
                                      : "text-rose-600 bg-rose-50 border-rose-100"
                                )}>
                                   Tá»“n kho xuáº¥t: {variant.quantity || 0}
                                </p>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="p-4 text-center text-slate-500 text-[12px]">
                             {searchTerm ? "KhĂ´ng tĂ¬m tháº¥y sáº£n pháº©m nĂ o." : "HĂ£y gĂµ tá»« khĂ³a Ä‘á»ƒ tĂ¬m kiáº¿m..."}
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
                        <TableHead className="text-[10px] font-black uppercase text-slate-500 tracking-wider">MĂ£ SKU</TableHead>
                        <TableHead className="text-[10px] font-black uppercase text-slate-500 tracking-wider">TĂªn sáº£n pháº©m</TableHead>
                        <TableHead className="text-right text-[10px] font-black uppercase text-blue-600 w-[110px] tracking-wider">SL Xuáº¥t</TableHead>
                        {watchExportType === "RETURN" && (
                          <TableHead className="text-[10px] font-black uppercase text-rose-600 min-w-[200px] tracking-wider">LĂ½ do tráº£ hĂ ng</TableHead>
                        )}
                        <TableHead className="text-right text-[10px] font-black uppercase text-slate-500 tracking-wider">GiĂ¡ Vá»‘n</TableHead>
                        <TableHead className="w-[50px]"></TableHead>
                     </TableRow>
                  </TableHeader>
                  <TableBody>
                    {fields.length === 0 ? (
                      <TableRow><TableCell colSpan={watchExportType === "RETURN" ? 7 : 6} className="h-[150px] text-center text-slate-300 italic font-medium tracking-widest uppercase text-[11px]">ChÆ°a cĂ³ sáº£n pháº©m nĂ o Ä‘Æ°á»£c chá»n</TableCell></TableRow>
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
                                  Tá»“n kho xuáº¥t: {currentItem?.stock || 0}
                                </div>
                              </TableCell>

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
                                {/* đŸ‘‡ Cáº¢NH BĂO VÆ¯á»¢T Tá»’N KHO */}
                                {!isReadOnly && currentItem?.quantity > currentItem?.stock && (
                                   <div className="text-[10px] text-rose-500 font-bold mt-1 text-right animate-pulse">
                                     VÆ°á»£t tá»“n kho!
                                   </div>
                                )}
                              </TableCell>

                              {watchExportType === "RETURN" && (
                                <TableCell className="p-1">
                                  <Input readOnly={isReadOnly} placeholder="Nháº­p lĂ½ do..." {...register(`items.${index}.returnReason`)} className={`h-8 text-[12px] rounded-none focus:bg-white ${hasReasonError ? "border-rose-500" : "border-rose-100"} ${isReadOnly ? 'bg-slate-50 border-transparent' : ''}`} />
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
                                  {hasQtyError && <span className="mr-4">â€¢ Lá»—i SL: {hasQtyError.message}</span>}
                                  {hasReasonError && <span>â€¢ Lá»—i LĂ½ do: {hasReasonError.message}</span>}
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
             <div className="flex items-center gap-2 font-bold text-[11px] uppercase border-b pb-2"><Warehouse size={16}/> Kho xuáº¥t hĂ ng</div>
             <div className="space-y-1.5 flex flex-col">
                <Label className="text-[10px] font-bold uppercase text-slate-400">Chá»n chi nhĂ¡nh xuáº¥t hĂ ng (*)</Label>
                <Controller
                  name="branchId"
                  control={control}
                  render={({ field }) => (
                    <Select onValueChange={(val) => {
                        field.onChange(val);
                        const b = branches.find(x => x.id.toString() === val);
                        if (b && b.branchType !== 'WAREHOUSE' && watchExportType === 'RETURN') {
                            setValue('exportType', 'INTERNAL');
                            toast.warning("Kho láº» chá»‰ Ä‘Æ°á»£c phĂ©p xuáº¥t ná»™i bá»™. ÄĂ£ tá»± Ä‘á»™ng chuyá»ƒn loáº¡i phiáº¿u.");
                        }
                    }} value={field.value} disabled={isReadOnly || isEditMode}>
                       <SelectTrigger className={`rounded-none font-bold h-10 ${errors.branchId ? "border-rose-500" : "border-slate-200"}`}><SelectValue placeholder="-- Chá»n kho xuáº¥t --" /></SelectTrigger>
                       <SelectContent className="rounded-none">
                         {branches.map(b => (
                           <SelectItem key={b.id} value={b.id.toString()}>
                             {b.name.toUpperCase()} <span className="text-slate-400 ml-1 text-[10px]">{b.branchType === "WAREHOUSE" ? "(Kho tá»•ng)" : "(Kho láº»)"}</span>
                           </SelectItem>
                         ))}
                       </SelectContent>
                    </Select>
                  )}
                />
                {errors.branchId && <p className="text-rose-500 text-[10px] mt-1">{errors.branchId.message}</p>}
             </div>
             <div className="space-y-1.5 pt-1">
                <Label className="text-[10px] font-bold uppercase text-rose-500 flex items-center gap-1 mb-1"><MapPin size={12} /> Äá»‹a chá»‰ kho xuáº¥t</Label>
                <Textarea readOnly value={branches.find(b => b.id.toString() === watchBranchId)?.addressDetail || ""} className="min-h-[40px] text-[12px] border-slate-200 rounded-none bg-slate-50 resize-none text-slate-600" placeholder="Äá»‹a chá»‰ tá»± Ä‘á»™ng hiá»ƒn thá»‹..."/>
             </div>
          </div>

          <div className="bg-white border border-slate-200 p-6 shadow-sm space-y-4">
             <div className="flex items-center gap-2 font-bold text-[11px] uppercase border-b pb-2"><UserCheck size={16}/> Äá»‘i tÆ°á»£ng nháº­n</div>
             <div className="space-y-1.5 flex flex-col">
                <Label className="text-[10px] font-bold uppercase text-slate-400">Chá»n Ä‘á»‘i tÆ°á»£ng nháº­n (*)</Label>
                <Controller
                  name="targetId"
                  control={control}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value} disabled={isReadOnly || isEditMode}>
                       <SelectTrigger className={`rounded-none h-10 font-bold ${errors.targetId ? "border-rose-500" : "border-slate-200"}`}><SelectValue placeholder="-- Chá»n Ä‘á»‘i tÆ°á»£ng --" /></SelectTrigger>
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
                 <Label className="text-[10px] font-bold uppercase text-slate-400 mb-1">TĂªn ngÆ°á»i nháº­n (*)</Label>
                 <Input readOnly={isReadOnly} {...register("specificReceiver")} className={`rounded-none text-[13px] h-10 ${errors.specificReceiver ? "border-rose-500" : "border-slate-200"}`} placeholder="TĂªn ngÆ°á»i nháº­n..." />
                 {errors.specificReceiver && <p className="text-rose-500 text-[10px] mt-1">{errors.specificReceiver.message}</p>}
             </div>
             <div className="space-y-1.5 flex flex-col">
                 <Label className="text-[10px] font-bold uppercase text-slate-400 mb-1">Äá»‹a chá»‰ giao hĂ ng (*)</Label>
                 <Textarea readOnly={isReadOnly} {...register("shippingAddress")} className={`rounded-none min-h-[60px] text-[13px] ${errors.shippingAddress ? "border-rose-500" : "border-slate-200"}`} placeholder="Äá»‹a chá»‰ giao hĂ ng thá»±c táº¿..." />
                 {errors.shippingAddress && <p className="text-rose-500 text-[10px] mt-1">{errors.shippingAddress.message}</p>}
             </div>
          </div>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 lg:left-[260px] right-0 bg-[#f8f9fa] border-t p-[12px_30px] flex justify-between items-center z-[999] shadow-[0_-4px_20px_rgba(0,0,0,0.1)]">
         <div className="text-[12px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-4">
            <span>Tá»•ng sá»‘ lÆ°á»£ng: <span className="text-slate-800 font-black text-[14px]">
               {watchItems.reduce((acc, i) => acc + (Number(i.quantity) || 0), 0)}
            </span></span>
            <div className="h-4 w-[1px] bg-slate-300"></div>
            <span>Tá»•ng giĂ¡ trá»‹: <span className="text-blue-600 font-black text-[15px]">
               {formatNumber(watchItems.reduce((acc, i) => acc + ((Number(i.quantity) || 0) * (Number(i.price) || 0)), 0))} â‚«
            </span></span>
         </div>
         <div className="flex gap-3">
           <Button type="button" variant="outline" className="rounded-none uppercase px-8 border-slate-300 bg-white" onClick={() => router.back()}>{isReadOnly ? "Quay láº¡i" : "Há»§y bá»"}</Button>
           {!isReadOnly && (
             <Button type="submit" disabled={isSubmitting} className="bg-blue-600 hover:bg-blue-700 text-white rounded-none font-black px-10">
               {isSubmitting ? (
                 <Loader2 className="animate-spin mr-2" />
               ) : (
                 <>
                   <Save size={18} className="mr-2" />
                   {isAdmin ? "LÆ¯U & DUYá»†T NGAY" : "LÆ¯U & Gá»¬I DUYá»†T"}
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
