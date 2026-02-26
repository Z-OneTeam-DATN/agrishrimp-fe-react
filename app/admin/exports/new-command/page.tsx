"use client";

import React, { useState, useEffect, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm, Controller, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  X, Plus, Trash2, FileText, ChevronLeft, Save, ShoppingBag, Warehouse, UserCheck,
  MapPin, User, Phone, CalendarIcon, Hash, Search, ChevronDown, ChevronRight, BadgeCheck, Loader2, Package
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { cn, formatNumber } from "@/lib/utils";

import { branchService } from "@/app/services/branchService";
import { supplierService } from "@/app/services/supplier.service";
import { InventoryExportApiService } from "@/app/services/inventory.service";
import { useCurrentUser } from "@/hooks/useCurrentUser";

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
  quantity: z.coerce.number({ invalid_type_error: "Vui lòng nhập số" })
    .min(1, "Số lượng xuất phải lớn hơn 0"),
  returnReason: z.string().optional()
});

const ExportCommandSchema = z.object({
  noteCode: z.string(),
  exportType: z.enum(["INTERNAL", "RETURN"]),
  referenceCode: z.string().optional(),
  expectedDate: z.string().min(1, "Vui lòng chọn ngày xuất"),
  note: z.string().min(1, "Vui lòng nhập lý do/diễn giải"),
  branchId: z.string().min(1, "Vui lòng chọn kho xuất"),
  targetId: z.string().min(1, "Vui lòng chọn đối tượng nhận"),
  specificReceiver: z.string().min(1, "Vui lòng nhập người nhận"),
  shippingAddress: z.string().min(1, "Vui lòng nhập địa chỉ"),
  creatorName: z.string(),
  items: z.array(ExportItemSchema).min(1, "Vui lòng chọn ít nhất 1 sản phẩm")
}).superRefine((data, ctx) => {
  if (data.exportType === "RETURN") {
    data.items.forEach((item, index) => {
      if (!item.returnReason || item.returnReason.trim() === "") {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Vui lòng nhập lý do trả (lỗi, hết hạn...)",
          path: ["items", index, "returnReason"]
        });
      }
    });
  }
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

  const [isReadOnly, setIsReadOnly] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(isEditMode);

  const [branches, setBranches] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [allProducts, setAllProducts] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [expandedProducts, setExpandedProducts] = useState<Record<number, boolean>>({});
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
      referenceCode: "",
      note: "",
      expectedDate: new Date().toLocaleDateString('en-CA'),
      branchId: "",
      targetId: "",
      specificReceiver: "",
      shippingAddress: "",
      creatorName: "",
      items: []
    }
  });

  const { fields, append, remove } = useFieldArray({ control, name: "items" });

  const watchExportType = watch("exportType");
  const watchBranchId = watch("branchId");
  const watchTargetId = watch("targetId");
  const watchItems = watch("items");

  // Kiểm tra loại kho đang chọn để quyết định giao diện
  const selectedBranchInfo = branches.find(b => b.id?.toString() === watchBranchId);
  const isMainBranch = !selectedBranchInfo || selectedBranchInfo.branchType === "WAREHOUSE";

  const totalAmount = watchItems.reduce((acc, item) => acc + ((item.quantity || 0) * (item.price || 0)), 0);

  useEffect(() => {
    if (isEditMode && exportId) {
      const fetchDetail = async () => {
        setIsInitialLoading(true);
        try {
          const data = await InventoryExportApiService.getExportCommandDetail(exportId);
          if (data.status === "COMPLETED") setIsReadOnly(true);

          const type = data.exportType || "INTERNAL";
          const target = type === "INTERNAL" ? data.partnerBranchId : data.supplierId;

          reset({
            exportType: type,
            noteCode: data.code,
            referenceCode: data.referenceCode || "",
            note: data.note || "",
            expectedDate: data.entryDate || new Date().toLocaleDateString('en-CA'),
            branchId: data.branchId?.toString() || "",
            targetId: target?.toString() || "",
            specificReceiver: data.deliverer || "",
            shippingAddress: data.shippingAddress || "",
            creatorName: data.creatorName || "",
            items: (data.details || []).map((item: any) => ({
              productVariantId: item.productVariantId,
              sku: item.sku,
              name: item.productName || "Sản phẩm lỗi",
              unit: item.unit || "Cái",
              stock: 0,
              quantity: item.quantityRequested,
              price: item.price || 0,
              returnReason: item.note || ""
            }))
          });
        } catch (err) {
          toast.error("Không thể tải chi tiết phiếu xuất");
          router.push("/admin/exports");
        } finally {
          setIsInitialLoading(false);
        }
      };
      fetchDetail();
    }
  }, [isEditMode, exportId, router, reset]);

  useEffect(() => {
    const loadMasterData = async () => {
      try {
        const [resB, resS, resP] = await Promise.all([
          branchService.getAll(),
          supplierService.getAll(undefined, undefined, undefined, 0, 100),
          InventoryExportApiService.getAllProductsForExport()
        ]);
        if (resB) setBranches(resB);
        if (resS) setSuppliers(Array.isArray(resS.content) ? resS.content : []);
        if (resP) setAllProducts(resP);
      } catch (err) { toast.error("Lỗi tải danh mục"); }
    };
    loadMasterData();

    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) setShowDropdown(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (currentUser && !isEditMode) setValue("creatorName", currentUser.fullName || "Admin");
  }, [currentUser, isEditMode, setValue]);

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
        targetInfo = { name: branch.managerNames?.[0] || "Quản lý", phone: branch.phone || "", address: branch.addressDetail || "" };
      }
    } else {
      const supplier = suppliers.find(s => s.id?.toString() === watchTargetId);
      if (supplier) {
        targetInfo = { name: supplier.contactName || "Người đại diện", phone: supplier.phone || "", address: supplier.addressDetail || "" };
      }
    }
  }

  useEffect(() => {
    if (targetInfo.name && !isEditMode) {
      setValue("specificReceiver", targetInfo.name);
      setValue("shippingAddress", targetInfo.address);
    }
  }, [watchTargetId, watchExportType, isEditMode, setValue]);

  const addVariantToTable = (variant: any, productName: string) => {
    if (isReadOnly) return;
    if (watchItems.some(item => item.productVariantId === variant.id)) {
      toast.warning("Sản phẩm đã có trong danh sách");
      return;
    }
    append({
      productVariantId: variant.id,
      sku: variant.sku,
      name: `${productName} - ${variant.packaging || variant.unit}`,
      unit: variant.unit || "Cái",
      stock: variant.quantity || 0,
      quantity: 1,
      price: variant.price || 0,
      returnReason: ""
    });
    setShowDropdown(false);
  };

  const selectAllVariants = (product: any) => {
    if (isReadOnly) return;
    let count = 0;
    product.variants.forEach((v: any) => {
      if (!watchItems.some(item => item.productVariantId === v.id)) {
        append({
          productVariantId: v.id,
          sku: v.sku,
          name: `${product.name} - ${v.packaging || v.unit}`,
          unit: v.unit || "Cái",
          stock: v.quantity || 0,
          quantity: 1,
          price: v.price || 0,
          returnReason: ""
        });
        count++;
      }
    });
    if(count > 0) toast.success(`Đã thêm ${count} sản phẩm`);
    setShowDropdown(false);
  };

  const filteredProducts = allProducts.filter(p =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.baseSku?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const onSubmit = async (data: ExportCommandFormValues) => {
    if (isReadOnly) return;
    const currentUserId = currentUser?.id || currentUser?.userId || currentUser?.sub;

    const payload = {
      code: data.noteCode,
      exportType: data.exportType,
      referenceCode: data.referenceCode,
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
        toast.success("Cập nhật lệnh xuất thành công!");
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

  return (
    <form onSubmit={handleSubmit(onSubmit)} className={`space-y-4 pb-[100px] bg-slate-50/30 p-4 min-h-screen text-[#1f1f1f] ${isReadOnly ? "select-none opacity-95" : ""}`}>
      <div className="flex items-center gap-4 mb-2">
        <Button type="button" variant="ghost" size="icon" onClick={() => router.back()}><ChevronLeft /></Button>
        <div className="flex flex-col">
            <h1 className="text-[18px] font-black uppercase tracking-tight text-[#1f1f1f]">
               {isEditMode ? (isReadOnly ? "Chi tiết phiếu xuất (Đã xuất)" : "Chi tiết lệnh xuất") : "Tạo lệnh xuất kho"}
            </h1>
            <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1">
                <Hash size={12}/> Mã: <span className="text-blue-600">{watch("noteCode")}</span>
            </p>
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
                <Controller
                  name="exportType"
                  control={control}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value} disabled={isReadOnly || isEditMode}>
                      <SelectTrigger className="rounded-none h-10 w-full shadow-none border-slate-200"><SelectValue /></SelectTrigger>
                      <SelectContent className="rounded-none">
                        <SelectItem value="INTERNAL">Xuất dùng nội bộ</SelectItem>
                        {/* CHỈ KHO TỔNG MỚI ĐƯỢC CHỌN XUẤT TRẢ NCC */}
                        {isMainBranch && <SelectItem value="RETURN">Xuất trả NCC</SelectItem>}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>

              <div className="space-y-1.5 flex flex-col">
                <Label className="text-[10px] font-bold uppercase flex items-center gap-1 mb-1 text-slate-400 tracking-wider"><Hash size={12}/> Mã phiếu (Tự động)</Label>
                <Input {...register("noteCode")} readOnly className="rounded-none bg-slate-50 text-slate-500 font-mono text-[13px] h-10 w-full border-slate-200" />
              </div>

              <div className="space-y-1.5 flex flex-col">
                <Label className="text-[10px] font-bold uppercase mb-1 text-slate-400 tracking-wider">Tham chiếu (Đơn hàng...)</Label>
                <Input readOnly={isReadOnly} {...register("referenceCode")} className="rounded-none text-[13px] h-10 w-full border-slate-200 shadow-none" placeholder="Nhập mã tham chiếu..." />
              </div>

              <div className="space-y-1.5 flex flex-col">
                <Label className="text-[10px] font-bold uppercase text-blue-600 flex items-center gap-1 mb-1 tracking-wider">Ngày hẹn xuất</Label>
                <div className="relative w-full">
                  <Input readOnly={isReadOnly} type="date" {...register("expectedDate")} className={`rounded-none border-slate-200 text-[13px] h-10 w-full pr-10 shadow-none block ${errors.expectedDate ? "border-rose-500" : ""} ${isReadOnly ? 'bg-slate-50' : ''}`} />
                  <CalendarIcon size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                </div>
                {errors.expectedDate && <p className="text-rose-500 text-[10px] mt-1">{errors.expectedDate.message}</p>}
              </div>

              <div className="col-span-2 space-y-1.5 flex flex-col mt-2">
                <Label className="text-[10px] font-bold uppercase mb-1 text-slate-400 tracking-wider">Lý do / Diễn giải (*)</Label>
                <Textarea readOnly={isReadOnly} {...register("note")} className={`rounded-none min-h-[80px] text-[13px] w-full shadow-none ${errors.note ? "border-rose-500" : "border-slate-200"} ${isReadOnly ? 'bg-slate-50' : ''}`} placeholder="Nhập lý do xuất kho..." />
                {errors.note && <p className="text-rose-500 text-[10px] mt-1">{errors.note.message}</p>}
              </div>
            </div>
          </div>

          <div className="bg-white border border-slate-200 shadow-sm overflow-visible">
             <div className="px-5 py-3 bg-[#f8f9fa] border-b flex flex-wrap items-center gap-4">
                <h3 className="text-[11px] font-black uppercase flex items-center gap-2 whitespace-nowrap"><ShoppingBag size={16} className="text-blue-600"/> 2. Danh mục sản phẩm</h3>

                <div className="relative flex-1 min-w-[300px]" ref={dropdownRef}>
                  <div className="relative">
                    {!isReadOnly && <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />}
                    <Input readOnly={isReadOnly} placeholder={isReadOnly ? "Phiếu đã xuất" : "Tìm theo tên, SKU, danh mục..."} className={`pl-10 h-10 text-[13px] border-slate-200 rounded-none bg-white w-full shadow-none ${isReadOnly ? 'bg-slate-50' : ''}`} value={searchTerm} onChange={(e) => { setSearchTerm(e.target.value); setShowDropdown(true); }} onFocus={() => setShowDropdown(true)} />
                  </div>

                  {showDropdown && !isReadOnly && searchTerm.length > 0 && (
                    <div className="absolute top-full left-0 right-0 z-[100] bg-white border border-[#dcdcdc] shadow-xl mt-1 max-h-[400px] overflow-y-auto">
                      {filteredProducts.map(product => (
                        <div key={product.id} className="border-b last:border-0">
                          <div className="p-3 hover:bg-slate-50 cursor-pointer flex items-center gap-3">
                            <input type="checkbox" className="h-4 w-4 accent-blue-600" onChange={() => selectAllVariants(product)} checked={product.variants?.every((v: any) => watchItems.some(it => it.productVariantId === v.id))} />
                            <div className="flex-1 flex items-center gap-2" onClick={() => setExpandedProducts(prev => ({ ...prev, [product.id]: !prev[product.id] }))}>
                              {expandedProducts[product.id] ? <ChevronDown size={14}/> : <ChevronRight size={14}/>}
                              <div><div className="text-[13px] font-bold text-slate-700">{product.name}</div><div className="text-[11px] text-slate-400 uppercase font-bold">{product.baseSku} • {product.categoryName}</div></div>
                            </div>
                          </div>
                          {expandedProducts[product.id] && (
                            <div className="bg-slate-50/50 border-t border-slate-100">
                              {product.variants?.map((v: any) => (
                                <div key={v.id} className="flex items-center justify-between p-3 pl-12 hover:bg-blue-50 border-b border-slate-50" onClick={() => addVariantToTable(v, product.name)}>
                                  <div className="text-[12px] font-medium text-blue-700">{v.packaging || v.unit} <span className="text-slate-400 text-[11px] ml-2">({v.sku})</span></div>
                                  <div className="text-[12px] font-black text-slate-700">{formatNumber(v.price)}</div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
             </div>

             <div className="overflow-x-auto">
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
                        <TableHead className="text-right text-[10px] font-black uppercase text-slate-500 tracking-wider">Đơn giá</TableHead>
                        <TableHead className="w-[50px]"></TableHead>
                     </TableRow>
                  </TableHeader>
                  <TableBody>
                    {fields.length === 0 ? (
                      <TableRow><TableCell colSpan={watchExportType === "RETURN" ? 7 : 6} className="h-[150px] text-center text-slate-300 italic font-medium tracking-widest uppercase text-[11px]">Chưa có sản phẩm nào được chọn</TableCell></TableRow>
                    ) : (
                      fields.map((field, index) => {
                        const hasQtyError = errors.items?.[index]?.quantity;
                        const hasReasonError = errors.items?.[index]?.returnReason;

                        return (
                          <React.Fragment key={field.id}>
                            <TableRow className="hover:bg-slate-50/50">
                              <TableCell className="text-center text-slate-400 font-bold text-[11px]">{index + 1}</TableCell>
                              <TableCell className="font-mono text-[12px] text-slate-500">{watchItems[index]?.sku}</TableCell>
                              <TableCell className="font-bold text-[13px] text-slate-700">{watchItems[index]?.name}</TableCell>

                              <TableCell className="p-1">
                                <Input readOnly={isReadOnly} type="number" {...register(`items.${index}.quantity`)} className={`h-8 text-right font-black rounded-none text-blue-600 focus:bg-white ${hasQtyError ? "border-rose-500" : "border-blue-200"} ${isReadOnly ? 'bg-slate-50 border-transparent' : ''}`} />
                              </TableCell>

                              {watchExportType === "RETURN" && (
                                <TableCell className="p-1">
                                  <Input readOnly={isReadOnly} placeholder="Nhập lý do lỗi..." {...register(`items.${index}.returnReason`)} className={`h-8 text-[12px] rounded-none focus:bg-white ${hasReasonError ? "border-rose-500" : "border-rose-100 focus:border-rose-400"} ${isReadOnly ? 'bg-slate-50 border-transparent' : ''}`} />
                                </TableCell>
                              )}

                              <TableCell className="text-right text-[12px] font-medium">{formatNumber(watchItems[index]?.price || 0)}</TableCell>
                              <TableCell className="text-center">
                                {!isReadOnly && <button type="button" onClick={() => remove(index)} className="text-slate-300 hover:text-red-500 transition-colors"><Trash2 size={16}/></button>}
                              </TableCell>
                            </TableRow>
                            {(hasQtyError || hasReasonError) && (
                              <TableRow className="bg-rose-50">
                                <TableCell colSpan={watchExportType === "RETURN" ? 7 : 6} className="p-1 px-4 text-[11px] text-rose-500 font-bold">
                                  {hasQtyError && <span className="mr-4">• Lỗi SL: {hasQtyError.message}</span>}
                                  {hasReasonError && <span>• Lỗi Lý do: {hasReasonError.message}</span>}
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
             <div className="flex items-center gap-2 font-bold text-[11px] uppercase border-b pb-2">
                <BadgeCheck size={16} className="text-blue-600"/> Người tạo phiếu
             </div>
             <div className="space-y-1.5 flex flex-col">
                <Label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Tên nhân viên</Label>
                <Input readOnly {...register("creatorName")} className="rounded-none text-[13px] h-10 w-full border-slate-200 bg-slate-50 text-slate-500 font-bold cursor-not-allowed shadow-none" />
             </div>
          </div>

          <div className="bg-white border border-slate-200 p-6 shadow-sm space-y-4">
             <div className="flex items-center gap-2 font-bold text-[11px] uppercase border-b pb-2"><Warehouse size={16}/> Kho xuất hàng</div>
             <div className="space-y-1.5 flex flex-col">
                <Label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Chọn chi nhánh xuất hàng (*)</Label>
                <Controller
                  name="branchId"
                  control={control}
                  render={({ field }) => (
                    <Select onValueChange={(val) => {
                        field.onChange(val);
                        // ---- TỰ ĐỘNG CHUYỂN LOẠI XUẤT NẾU CHỌN KHO LẺ ----
                        const b = branches.find(x => x.id.toString() === val);
                       if (b && b.branchType !== 'WAREHOUSE' && watchExportType === 'RETURN') {
                            setValue('exportType', 'INTERNAL');
                            toast.warning("Kho lẻ chỉ được phép xuất nội bộ. Đã tự động chuyển loại phiếu.");
                        }
                    }} value={field.value} disabled={isReadOnly || isEditMode}>
                       <SelectTrigger className={`rounded-none font-bold h-10 w-full shadow-none ${errors.branchId ? "border-rose-500" : "border-slate-200"}`}><SelectValue placeholder="-- Chọn kho xuất --" /></SelectTrigger>
                       <SelectContent className="rounded-none">
                         {branches.map(b => (
                           <SelectItem key={b.id} value={b.id.toString()}>
                             {b.name.toUpperCase()} <span className="text-slate-400 ml-1 text-[10px]">{b.branchType === "WAREHOUSE" ? "(Kho tổng)" : "(Kho lẻ)"}</span>
                           </SelectItem>
                         ))}
                       </SelectContent>
                    </Select>
                  )}
                />
                {errors.branchId && <p className="text-rose-500 text-[10px] mt-1">{errors.branchId.message}</p>}
             </div>
             <div className="space-y-1.5 pt-1">
                <Label className="text-[10px] font-bold uppercase text-rose-500 flex items-center gap-1 mb-1 tracking-wider"><MapPin size={12} /> Địa chỉ kho xuất</Label>
                <Textarea readOnly value={branches.find(b => b.id.toString() === watchBranchId)?.addressDetail || ""} className="min-h-[40px] text-[12px] border-[#e2e8f0] rounded-none bg-slate-50/80 resize-none text-slate-600 cursor-default shadow-none" placeholder="Địa chỉ tự động hiển thị..."/>
             </div>
          </div>

          <div className="bg-white border border-slate-200 p-6 shadow-sm space-y-4">
             <div className="flex items-center gap-2 font-bold text-[11px] uppercase border-b pb-2"><UserCheck size={16}/> Đối tượng nhận</div>
             <div className="space-y-1.5 flex flex-col">
                <Label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Chọn đối tượng nhận (*)</Label>
                <Controller
                  name="targetId"
                  control={control}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value} disabled={isReadOnly || isEditMode}>
                       <SelectTrigger className={`rounded-none h-10 w-full font-bold shadow-none ${errors.targetId ? "border-rose-500" : "border-slate-200"}`}><SelectValue placeholder="-- Chọn đối tượng --" /></SelectTrigger>
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
             {watchTargetId && (
                 <div className="bg-blue-50/50 p-3 border border-blue-100 space-y-2 mt-2 rounded-sm w-full">
                     <div className="flex items-center gap-2 text-[12px] text-slate-700"><User size={14} className="text-blue-500" /><span className="font-bold tracking-tight">{targetInfo.name}</span></div>
                     <div className="flex items-center gap-2 text-[12px] text-slate-700"><Phone size={14} className="text-green-500" /><span className="font-bold tracking-tight">{targetInfo.phone}</span></div>
                 </div>
             )}
             <div className="space-y-1.5 pt-2 flex flex-col">
                 <Label className="text-[10px] font-bold uppercase text-slate-400 mb-1 tracking-wider">Tên người nhận (*)</Label>
                 <Input readOnly={isReadOnly} {...register("specificReceiver")} className={`rounded-none text-[13px] h-10 w-full shadow-none ${errors.specificReceiver ? "border-rose-500" : "border-slate-200"} ${isReadOnly ? 'bg-slate-50' : ''}`} placeholder="Tên người đại diện nhận..." />
                 {errors.specificReceiver && <p className="text-rose-500 text-[10px] mt-1">{errors.specificReceiver.message}</p>}
             </div>
             <div className="space-y-1.5 flex flex-col">
                 <Label className="text-[10px] font-bold uppercase text-slate-400 mb-1 tracking-wider">Địa chỉ giao hàng (*)</Label>
                 <Textarea readOnly={isReadOnly} {...register("shippingAddress")} className={`rounded-none min-h-[60px] text-[13px] w-full shadow-none ${errors.shippingAddress ? "border-rose-500" : "border-slate-200"} ${isReadOnly ? 'bg-slate-50' : ''}`} placeholder="Địa chỉ giao hàng thực tế..." />
                 {errors.shippingAddress && <p className="text-rose-500 text-[10px] mt-1">{errors.shippingAddress.message}</p>}
             </div>
          </div>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 lg:left-[260px] right-0 bg-[#f8f9fa] border-t p-[12px_30px] flex justify-between items-center z-[999] shadow-[0_-4px_20px_rgba(0,0,0,0.1)]">
         <div className="text-[12px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-4">
            <span>Tổng số lượng: <span className="text-slate-800 font-black text-[14px]">{watchItems.reduce((acc, i) => acc + (i.quantity || 0), 0)}</span></span>
            <div className="h-4 w-[1px] bg-slate-300"></div>
            <span>Tổng giá trị: <span className="text-blue-600 font-black text-[15px]">{formatNumber(totalAmount)} ₫</span></span>
         </div>
         <div className="flex gap-3">
           <Button type="button" variant="outline" className="rounded-none uppercase px-8 border-slate-300 bg-white" onClick={() => router.back()}>{isReadOnly ? "Quay lại" : "Hủy bỏ"}</Button>
           {!isReadOnly && (
             <Button type="submit" disabled={isSubmitting} className="bg-blue-600 hover:bg-blue-700 text-white rounded-none uppercase font-black px-10 transition-all shadow-md active:scale-95">
               {isSubmitting ? <Loader2 className="animate-spin mr-2" size={18} /> : <Save size={18} className="mr-2"/>} {isEditMode ? "Cập nhật lệnh xuất" : "Tạo lệnh xuất"}
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