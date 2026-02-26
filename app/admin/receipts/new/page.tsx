"use client";

import React, { useState, useEffect, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm, Controller, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  X, Search, Info, Settings, Plus, Trash2, Package, Save, Image as ImageIcon, Download, Loader2, User, Clock, ChevronLeft, Warehouse
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { ReceiptSchema, Receipt } from "@/app/types/inventory.schema";
import { toast } from "sonner";
import { formatNumber } from "@/lib/utils";

import { supplierService } from "@/app/services/supplier.service";
import { Supplier } from "@/app/types/supplier.type";
import { branchService } from '@/app/services/branchService';
import { ProductService } from '@/app/services/product.service';
import { InventoryApiService } from "@/app/services/inventory.service";
import { useCurrentUser } from "@/hooks/useCurrentUser";

function AdminReceiptFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const receiptId = searchParams.get("id");
  const isEditMode = Boolean(receiptId);

  const [isReadOnly, setIsReadOnly] = useState(false);

  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(isEditMode);

  const { data: user, isLoading: isUserLoading } = useCurrentUser();

  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [isLoadingSuppliers, setIsLoadingSuppliers] = useState(false);
  const [searchSupplierText, setSearchSupplierText] = useState("");
  const [isSupplierDropdownOpen, setIsSupplierDropdownOpen] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);

  const [branches, setBranches] = useState<any[]>([]);
  const [isLoadingBranches, setIsLoadingBranches] = useState(false);

  const [products, setProducts] = useState<any[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);
  const [searchProductText, setSearchProductText] = useState("");
  const [isProductDropdownOpen, setIsProductDropdownOpen] = useState(false);

  const [checkedItems, setCheckedItems] = useState<any[]>([]);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const productSearchRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const hasFetched = useRef(false);

  // --- FORM SETUP ---
  const {
    register, handleSubmit, control, setValue, watch, getValues, reset,
    formState: { errors },
  } = useForm<Receipt>({
    resolver: zodResolver(ReceiptSchema),
    mode: "onTouched",
    defaultValues: {
      importType: "SUPPLIER",
      sourceBranchId: "",
      receiptType: "NHAP_MUA",
      supplierCode: "",
      supplierName: "",
      receiptCode: "PNK" + Date.now().toString().slice(-6),
      warehouseId: "HH",
      branchName: "",
      importStatus: "PO",
      deliverer: "",
      entryDate: new Date().toISOString().slice(0, 10),
      items: [],
      note: "",
      paymentAmount: 0,
      tags: [],
    },
  });

  const { fields, append, remove, replace } = useFieldArray({
    control,
    name: "items",
  });

  // --- WATCHERS ---
  const watchItems = watch("items") || [];
  const watchPaymentAmount = watch("paymentAmount") || 0;
  const currentTargetBranch = watch("branchName");
  const importType = watch("importType");
  const sourceBranchId = watch("sourceBranchId");

  // XÁC ĐỊNH ID KHO NHẬP VÀO VÀ CHECK QUYỀN
  const selectedDestBranch = React.useMemo(() => {
    return branches.find(b => (b.name || b.branchName || b.id.toString()) === currentTargetBranch);
  }, [branches, currentTargetBranch]);

  const targetBranchId = selectedDestBranch?.id?.toString() || "";
  const isDestMainBranch = !selectedDestBranch || selectedDestBranch.branchType === "WAREHOUSE";

  // TÍNH TOÁN TỔNG
  const subTotal = watchItems.reduce((acc, item) => acc + (Number(item.plannedQuantity) || 0) * (Number(item.importPrice) || 0), 0);
  const totalQty = watchItems.reduce((acc, item) => acc + (Number(item.plannedQuantity) || 0), 0);
  const debtAmount = importType === "INTERNAL" ? 0 : subTotal - watchPaymentAmount;

  // --- USE EFFECTS ---

  // 1. Fetch Dữ liệu khi Sửa (Edit Mode)
  useEffect(() => {
    if (isEditMode && receiptId && !hasFetched.current) {
      hasFetched.current = true;

      const fetchDetail = async () => {
        try {
          setIsInitialLoading(true);
          const data = await InventoryApiService.getReceiptDetail(receiptId);

          if (data.status === "COMPLETED") {
            setIsReadOnly(true);
          }

          const mappedItems = (data.items || []).map((item: any) => ({
            productCode: item.productCode || "",
            productName: item.productName || "",
            plannedQuantity: item.quantity || 1,
            maxQuantity: 0, // Edit mode sẽ bypass vụ check max Qty (hoặc fetch thủ công nếu muốn)
            importPrice: item.price || 0,
            newSellingPrice: item.newSellingPrice || 0,
            lotNumber: item.lotNumber || "",
            expiryDate: item.expiryDate || "",
            imageUrl: item.imageUrl || ""
          }));

          const resolvedImportType = data.importType || (data.sourceBranchId ? "INTERNAL" : "SUPPLIER");

          reset({
            importType: resolvedImportType,
            sourceBranchId: data.sourceBranchId ? data.sourceBranchId.toString() : "",
            receiptCode: data.code || "",
            supplierName: data.supplierName || "",
            supplierCode: data.supplierCode || "",
            branchName: data.branchName || "",
            deliverer: data.deliverer || "",
            entryDate: data.entryDate ? new Date(data.entryDate).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10),
            note: data.note || "",
            paymentAmount: data.paymentAmount || 0,
            importStatus: data.status === "PENDING" ? "PO" : "IMPORTED",
            tags: data.tags || [],
            items: [],
          });

          replace(mappedItems);
          setTags(data.tags || []);

          if (resolvedImportType === "SUPPLIER" && (data.supplierName || data.supplierCode)) {
             try {
                const supplierRes = await supplierService.getAll(data.supplierCode || data.supplierName, undefined, "ACTIVE", 0, 1);
                if (supplierRes && supplierRes.content && supplierRes.content.length > 0) {
                    setSelectedSupplier(supplierRes.content[0]);
                } else {
                    setSelectedSupplier({ name: data.supplierName, code: data.supplierCode || "N/A", phone: "Liên hệ NCC", email: "N/A" } as any);
                }
             } catch (err) {
                 setSelectedSupplier({ name: data.supplierName, code: data.supplierCode || "N/A", phone: "N/A", email: "N/A" } as any);
             }
          }
        } catch (error) {
          toast.error("Không thể tải thông tin phiếu nhập");
          router.push("/admin/receipts");
        } finally {
          setIsInitialLoading(false);
        }
      };
      fetchDetail();
    }
  }, [isEditMode, receiptId, reset, replace, router]);

  // 2. Fetch danh sách chi nhánh
  useEffect(() => {
    const fetchBranches = async () => {
      setIsLoadingBranches(true);
      try {
        const data = await branchService.getAll();
        const branchList = Array.isArray(data) ? data : (data.content || []);
        setBranches(branchList);
        if (!isEditMode && branchList.length > 0) {
           setValue("branchName", branchList[0].name || branchList[0].branchName);
        }
      } catch (error) { console.error(error); } finally { setIsLoadingBranches(false); }
    };
    fetchBranches();
  }, [setValue, isEditMode]);

  // 3. Set nhân viên mặc định
  useEffect(() => {
    if (user && !isEditMode) {
      setValue("deliverer", user.fullName || user.displayName || "Quản trị viên");
    }
  }, [user, setValue, isEditMode]);

  // 4. Tìm kiếm Sản Phẩm
  useEffect(() => {
    if (!isProductDropdownOpen) return;

    const fetchProducts = async () => {
      let queryBranchId = "";

      if (importType === "INTERNAL") {
         if (!sourceBranchId) {
            toast.warning("Vui lòng chọn 'Kho xuất hàng đi' trước khi thêm sản phẩm");
            setIsProductDropdownOpen(false);
            return;
         }
         queryBranchId = sourceBranchId;
      } else {
         if (!targetBranchId) {
            toast.warning("Vui lòng chọn 'Chi nhánh nhập vào' trước khi thêm sản phẩm");
            setIsProductDropdownOpen(false);
            return;
         }
         queryBranchId = targetBranchId;
      }

      setIsLoadingProducts(true);
      try {
        const data = await ProductService.searchVariants(searchProductText, queryBranchId);
        const productList = Array.isArray(data) ? data : (data?.data || data?.content || []);
        setProducts(productList);
      } catch (error) { toast.error("Không thể tải danh sách sản phẩm"); } finally { setIsLoadingProducts(false); }
    };

    const debounceTimer = setTimeout(fetchProducts, 300);
    return () => clearTimeout(debounceTimer);
  }, [searchProductText, isProductDropdownOpen, importType, sourceBranchId, targetBranchId]);

  // 5. Tìm kiếm nhà cung cấp
  useEffect(() => {
    const fetchSuppliers = async () => {
      if (!searchSupplierText.trim() && !isSupplierDropdownOpen) return;
      setIsLoadingSuppliers(true);
      try {
        const data = await supplierService.getAll(searchSupplierText, undefined, "ACTIVE", 0, 20);
        setSuppliers(data.content || []);
      } catch (error) { console.error(error); } finally { setIsLoadingSuppliers(false); }
    };
    const debounceTimer = setTimeout(fetchSuppliers, 300);
    return () => clearTimeout(debounceTimer);
  }, [searchSupplierText, isSupplierDropdownOpen]);

  // 6. Xử lý click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) setIsSupplierDropdownOpen(false);
      if (productSearchRef.current && !productSearchRef.current.contains(event.target as Node)) {
        setIsProductDropdownOpen(false);
        setCheckedItems([]);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // --- HANDLERS ---
  const handleSelectSupplier = (supplier: Supplier) => {
    if (isReadOnly) return;
    setValue("supplierCode", supplier.code);
    setValue("supplierName", supplier.name);
    setSelectedSupplier(supplier);
    setSearchSupplierText("");
    setIsSupplierDropdownOpen(false);
  };

  const handleClearSupplier = () => {
    if (isReadOnly) return;
    setValue("supplierCode", "");
    setValue("supplierName", "");
    setSelectedSupplier(null);
  };

  const isVariantChecked = (sku: string) => checkedItems.some((item) => item.sku === sku);

  const toggleVariant = (variant: any) => {
    if (isReadOnly) return;
    setCheckedItems((prev) => {
      const exists = prev.find((item) => item.sku === variant.sku);
      if (exists) return prev.filter((item) => item.sku !== variant.sku);
      return [...prev, variant];
    });
  };

  const handleAddSelectedToTable = () => {
    if (isReadOnly) return;
    if (checkedItems.length === 0) return;
    const currentItems = getValues("items") || [];

    checkedItems.forEach((variant) => {
      const productCode = variant.sku || "N/A";
      const existingIndex = currentItems.findIndex((item: any) => item.productCode === productCode);

      if (existingIndex > -1) {
        const currentQty = Number(currentItems[existingIndex].plannedQuantity) || 0;
        setValue(`items.${existingIndex}.plannedQuantity`, currentQty + 1);
      } else {
        append({
          productCode: productCode,
          productName: variant.productName || variant.unit || "Sản phẩm không tên",
          plannedQuantity: 1,
          maxQuantity: Number(variant.quantity) || 0, // Lưu tồn kho để check
          lotNumber: "",
          expiryDate: "",
          importPrice: Number(variant.costPrice) || 0,
          newSellingPrice: Number(variant.price) || 0,
          imageUrl: variant.imageUrl || "",
        } as any);
      }
    });
    toast.success(`Đã thêm ${checkedItems.length} sản phẩm`);
    setIsProductDropdownOpen(false);
    setCheckedItems([]);
  };

  const handleAddTag = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && tagInput.trim()) {
      e.preventDefault();
      if (isReadOnly) return;
      if (!tags.includes(tagInput.trim())) setTags([...tags, tagInput.trim()]);
      setTagInput("");
    }
  };

  // --- SUBMIT ---
  const onSubmit = async (data: Receipt) => {
    if (isReadOnly) return;

    setIsSubmitting(true);
    try {
      const payload = {
        importType: data.importType,
        sourceBranchId: data.importType === "INTERNAL" ? Number(data.sourceBranchId) : null,
        supplierCode: data.importType === "SUPPLIER" ? data.supplierCode : null,
        receiptCode: data.receiptCode,
        branchName: data.branchName,
        deliverer: data.deliverer,
        entryDate: data.entryDate,
        note: data.note,
        importStatus: data.importStatus,
        paymentAmount: data.importType === "INTERNAL" ? 0 : (Number(data.paymentAmount) || 0),
        tags: tags,
        items: data.items.map(item => ({
          productCode: item.productCode,
          plannedQuantity: Number(item.plannedQuantity),
          lotNumber: item.lotNumber,
          expiryDate: item.expiryDate,
          importPrice: Number(item.importPrice),
          newSellingPrice: Number(item.newSellingPrice)
        }))
      };

      if (isEditMode && receiptId) {
        await InventoryApiService.updateReceipt(receiptId, payload);
        toast.success("Cập nhật phiếu nhập hàng thành công!");
      } else {
        await InventoryApiService.createReceipt(payload);
        toast.success("Tạo phiếu nhập hàng thành công!");
      }
      router.push("/admin/receipts");
    } catch (error: any) {
      console.error("Submit error:", error);
      toast.error(error.response?.data?.message || "Có lỗi xảy ra khi lưu phiếu nhập");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isInitialLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <div className="text-center">
          <Loader2 className="animate-spin mx-auto text-blue-600 mb-2" size={32} />
          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Đang tải dữ liệu phiếu nhập...</p>
        </div>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className={`p-6 bg-slate-50 min-h-screen space-y-4 pb-[100px] font-sans text-slate-900 ${isReadOnly ? "select-none opacity-95" : ""}`}
    >
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
        <h1 className="text-[18px] font-black text-[#1f1f1f] tracking-tight uppercase">
          {isEditMode ? (isReadOnly ? "Chi tiết phiếu nhập hàng (Đã nhập)" : "Cập nhật phiếu nhập hàng") : "Tạo phiếu nhập hàng mới"}
        </h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 relative z-20">

        {/* NGUỒN NHẬP HÀNG */}
        <div className="md:col-span-7 bg-white border border-[#dcdcdc] p-5 rounded-none shadow-sm flex flex-col gap-4">

          {/* LOẠI PHIẾU NHẬP */}
          <div className="border-b pb-4">
             <Label className="text-[12px] font-bold text-slate-700 mb-2 block uppercase tracking-wider">Nguồn nhập hàng (*)</Label>
             <Controller
               name="importType"
               control={control}
               render={({ field }) => (
                 <Select value={field.value} onValueChange={(v: any) => {
                     field.onChange(v);
                     handleClearSupplier();
                     setValue("sourceBranchId", "");
                     replace([]); // Clear sản phẩm khi đổi nguồn
                 }} disabled={isReadOnly}>
                    <SelectTrigger className="h-10 text-[13px] border-[#ccc] rounded-none shadow-none focus:ring-0 font-bold bg-slate-50">
                      <SelectValue placeholder="Chọn nguồn nhập" />
                    </SelectTrigger>
                    <SelectContent className="rounded-none z-[9999]">
                      {/* CHỈ HIỂN THỊ NGUỒN NHÀ CUNG CẤP NẾU KHO ĐÍCH LÀ KHO TỔNG */}
                      {isDestMainBranch && <SelectItem value="SUPPLIER">Nhập mua từ Nhà cung cấp</SelectItem>}
                      <SelectItem value="INTERNAL">Nhập chuyển từ Kho nội bộ</SelectItem>
                    </SelectContent>
                 </Select>
               )}
             />
          </div>

          {/* RẼ NHÁNH GIAO DIỆN THEO NGUỒN */}
          {importType === "SUPPLIER" ? (
             <div className="relative">
                <Label className="text-[12px] font-bold text-slate-500 mb-2 block">Thông tin Nhà cung cấp</Label>
                {!selectedSupplier ? (
                  <div className="relative mb-2" ref={dropdownRef}>
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <Input
                      readOnly={isReadOnly}
                      value={searchSupplierText}
                      onChange={(e) => { setSearchSupplierText(e.target.value); setIsSupplierDropdownOpen(true); }}
                      onFocus={() => setIsSupplierDropdownOpen(true)}
                      placeholder={isReadOnly ? "Phiếu đã nhập kho" : "Tìm theo tên, SĐT, mã nhà cung cấp... (F4)"}
                      className={`pl-10 h-10 border-[#ccc] rounded-none focus-visible:ring-blue-500/20 shadow-none text-[13px] ${errors.supplierCode ? "border-rose-500" : ""} ${isReadOnly ? "bg-slate-50" : ""}`}
                    />
                    {errors.supplierCode && <p className="text-rose-500 text-[11px] mt-1 font-medium">{errors.supplierCode.message}</p>}

                    {isSupplierDropdownOpen && !isReadOnly && (
                      <div className="absolute top-full left-0 w-full mt-1 bg-white border border-slate-200 shadow-2xl z-[9999]">
                        <div className="p-3 border-b border-slate-200 flex items-center gap-2 text-blue-600 bg-blue-50/50 hover:bg-blue-100 cursor-pointer transition-colors"
                          onClick={() => router.push('/admin/suppliers/add')}>
                          <Plus size={16} className="font-bold" />
                          <span className="text-[13px] font-bold">Thêm nhà cung cấp mới</span>
                        </div>
                        <div className="max-h-[250px] overflow-y-auto">
                          {isLoadingSuppliers ? (
                            <div className="flex items-center justify-center p-4 text-slate-400">
                              <Loader2 size={20} className="animate-spin mr-2" />
                              <span className="text-[12px]">Đang tải...</span>
                            </div>
                          ) : suppliers.length > 0 ? (
                            suppliers.map((supplier) => (
                              <div key={supplier.id} onClick={() => handleSelectSupplier(supplier)}
                                className="p-3 border-b border-slate-100 last:border-0 hover:bg-slate-50 cursor-pointer transition-colors">
                                <p className="text-[13px] font-bold text-slate-800">{supplier.name}</p>
                                <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-500">
                                  <span className="font-mono bg-slate-100 px-1.5 py-0.5">{supplier.code}</span>
                                  {supplier.phone && <span>• {supplier.phone}</span>}
                                </div>
                              </div>
                            ))
                          ) : (
                            <div className="p-4 text-center text-slate-500 text-[12px]">Không tìm thấy nhà cung cấp nào.</div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="border border-[#e2e8f0] bg-[#f8fafc] p-4 relative group rounded-sm shadow-sm">
                    {!isReadOnly && (
                      <button type="button" onClick={handleClearSupplier} className="absolute top-3 right-3 text-slate-400 hover:text-slate-700 hover:bg-slate-200 p-1 rounded-full transition-colors">
                        <X size={18} />
                      </button>
                    )}
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-full bg-blue-400 flex items-center justify-center text-white shrink-0 shadow-inner">
                        <User size={24} />
                      </div>
                      <div className="flex flex-col space-y-2 mt-1 w-full pr-6">
                        <span className="text-[15px] font-bold text-blue-500">{selectedSupplier.name}</span>
                        <div className="pt-2 border-t border-slate-200 space-y-1.5 mt-1">
                          <p className="text-[13px] font-bold text-slate-700">Thông tin nhà cung cấp</p>
                          <p className="text-[13px] text-slate-500">{selectedSupplier.email || "Không có email"}</p>
                          <p className="text-[13px] text-slate-800 font-medium">{selectedSupplier.phone || "Chưa cập nhật SĐT"}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
             </div>
          ) : (
             <div className="space-y-3">
                 <Label className="text-[12px] font-bold text-slate-500 block">Chọn Kho xuất hàng đi</Label>
                 <Controller
                    name="sourceBranchId"
                    control={control}
                    render={({ field }) => (
                      <Select value={field.value} onValueChange={(v) => { field.onChange(v); replace([]); }} disabled={isReadOnly}>
                        <SelectTrigger className={`rounded-none font-bold h-10 w-full shadow-none ${errors.sourceBranchId ? "border-rose-500" : "border-[#ccc]"}`}>
                           <SelectValue placeholder="-- Chọn chi nhánh xuất --" />
                        </SelectTrigger>
                        <SelectContent className="rounded-none z-[9999]">
                           {branches
                             .filter(b => (b.name || b.branchName || b.id.toString()) !== currentTargetBranch)
                             .map(b => (
                                <SelectItem key={b.id} value={b.id.toString()}>
                                   {(b.name || b.branchName).toUpperCase()}
                                </SelectItem>
                           ))}
                        </SelectContent>
                      </Select>
                    )}
                 />
                 {errors.sourceBranchId && <p className="text-rose-500 text-[11px] mt-1 font-medium">{errors.sourceBranchId.message}</p>}

                 {sourceBranchId && (
                    <div className="mt-2 text-[12px] text-slate-600 bg-orange-50/50 p-3 border border-orange-100 rounded-sm flex items-center gap-2">
                       <Warehouse size={16} className="text-orange-500"/>
                       <span>Hàng sẽ được chuyển từ chi nhánh này về kho của bạn.</span>
                    </div>
                 )}
             </div>
          )}
        </div>

        {/* THÔNG TIN ĐƠN NHẬP HÀNG */}
        <div className="md:col-span-5 bg-white border border-[#dcdcdc] p-5 rounded-none shadow-sm space-y-3">
          <h2 className="text-[13px] font-bold text-slate-700 mb-4 border-b pb-2">Thông tin đơn nhập hàng</h2>

          <div className="grid grid-cols-12 items-center gap-2">
            <Label className="col-span-4 text-[12px] font-bold text-slate-500">Trạng thái phiếu</Label>
            <div className="col-span-8">
              <Controller
                name="importStatus"
                control={control}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value} disabled={isReadOnly}>
                    <SelectTrigger className={`h-9 text-[13px] border-[#ccc] rounded-none shadow-none focus:ring-0 font-medium ${errors.importStatus ? "border-rose-500" : ""}`}>
                      <SelectValue placeholder="Chọn trạng thái" />
                    </SelectTrigger>
                    <SelectContent className="rounded-none z-[9999]">
                      <SelectItem value="PO">Phiếu tạm (Chờ nhập)</SelectItem>
                      <SelectItem value="IMPORTED">Đã nhập kho</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
          </div>

          <div className="grid grid-cols-12 items-center gap-2">
            <Label className="col-span-4 text-[12px] font-bold text-slate-500">Nhập vào kho</Label>
            <div className="col-span-8">
              <Controller
                name="branchName"
                control={control}
                render={({ field }) => (
                  <Select onValueChange={(val) => {
                      field.onChange(val);
                      replace([]);

                      // Tự động gạt về Nội Bộ nếu chọn kho lẻ
                      const b = branches.find(x => (x.name || x.branchName) === val);
                      if (b && b.branchType !== 'WAREHOUSE' && watch('importType') === 'SUPPLIER') {
                          setValue('importType', 'INTERNAL');
                          toast.warning("Kho lẻ chỉ được phép nhận hàng nội bộ. Đã tự động đổi nguồn.");
                      }
                  }} value={field.value} disabled={isLoadingBranches || isReadOnly}>
                    <SelectTrigger className={`h-9 text-[13px] border-[#ccc] rounded-none shadow-none focus:ring-0 font-medium ${errors.branchName ? "border-rose-500" : ""}`}>
                      <SelectValue placeholder={isLoadingBranches ? "Đang tải..." : "Chọn chi nhánh"} />
                    </SelectTrigger>
                    <SelectContent className="rounded-none z-[9999]">
                      {branches.map((branch) => (
                        <SelectItem key={branch.id} value={branch.name || branch.branchName || branch.id.toString()}>
                          {(branch.name || branch.branchName).toUpperCase()} <span className="text-slate-400 ml-1 text-[10px]">{branch.branchType === "WAREHOUSE" ? "(Kho tổng)" : "(Kho lẻ)"}</span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.branchName && <p className="text-rose-500 text-[10px] mt-1">{errors.branchName.message}</p>}
            </div>
          </div>
          <div className="grid grid-cols-12 items-center gap-2">
            <Label className="col-span-4 text-[12px] font-bold text-slate-500">Nhân viên</Label>
            <div className="col-span-8 relative">
              <Input {...register("deliverer")} readOnly placeholder={isUserLoading ? "Đang tải..." : "Tên nhân viên"}
                className={`h-9 text-[13px] border-[#ccc] rounded-none shadow-none font-medium bg-slate-50 cursor-default focus-visible:ring-0 ${errors.deliverer ? "border-rose-500" : ""}`} />
              <User size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
              {errors.deliverer && <p className="text-rose-500 text-[10px] mt-1">{errors.deliverer.message}</p>}
            </div>
          </div>
          <div className="grid grid-cols-12 items-center gap-2">
            <Label className="col-span-4 text-[12px] font-bold text-slate-500">Ngày hẹn giao</Label>
            <div className="col-span-8 relative">
              <Input readOnly={isReadOnly} type="date" {...register("entryDate")} className={`h-9 text-[13px] border-[#ccc] rounded-none shadow-none font-medium pr-10 ${errors.entryDate ? "border-rose-500" : ""} ${isReadOnly ? "bg-slate-50" : ""}`} />
              <Clock size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              {errors.entryDate && <p className="text-rose-500 text-[10px] mt-1">{errors.entryDate.message}</p>}
            </div>
          </div>
        </div>
      </div>

      {/* 2. Middle Section: Product Table */}
      <div className="bg-white border border-[#dcdcdc] rounded-none shadow-sm overflow-visible relative z-10">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex flex-wrap items-center gap-3 flex-1">
            <h2 className="text-[13px] font-bold text-slate-700 whitespace-nowrap">Thông tin sản phẩm</h2>
            <div className="relative flex-1 max-w-[600px]" ref={productSearchRef}>
              {!isReadOnly && <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />}
              <Input
                readOnly={isReadOnly}
                ref={searchInputRef}
                value={searchProductText}
                onChange={(e) => { setSearchProductText(e.target.value); setIsProductDropdownOpen(true); }}
                onFocus={() => setIsProductDropdownOpen(true)}
                placeholder={isReadOnly ? "Phiếu này đã nhập kho, không thể thêm sản phẩm" : "Tìm tên, mã SKU, Barcode... (F3)"}
                className={`pl-10 h-10 border-[#ccc] rounded-none focus-visible:ring-blue-500/20 shadow-none text-[13px] ${isReadOnly ? "bg-slate-50" : ""}`}
              />
              {isProductDropdownOpen && !isReadOnly && (
                <div className="absolute top-full left-0 w-full mt-1 bg-white border border-slate-200 shadow-2xl rounded-sm overflow-hidden flex flex-col z-[9999]">
                  <div className="max-h-[450px] overflow-y-auto">
                    {isLoadingProducts ? (
                      <div className="flex items-center justify-center p-4">
                        <Loader2 size={20} className="animate-spin mr-2 text-blue-600" />
                        <span className="text-[12px]">Đang tải danh sách...</span>
                      </div>
                    ) : products.length > 0 ? (
                      products.map((variant) => (
                        <div key={variant.id || variant.sku} className="p-3 border-b border-slate-100 hover:bg-slate-50 transition-colors group flex justify-between items-center">
                          <div className="flex items-center gap-3">
                             <input
                                type="checkbox"
                                className="w-4 h-4 cursor-pointer accent-blue-600 rounded-sm"
                                checked={isVariantChecked(variant.sku)}
                                onChange={() => toggleVariant(variant)}
                             />
                             <div className="flex items-center gap-3 cursor-pointer" onClick={() => toggleVariant(variant)}>
                               <div className="w-10 h-10 bg-white border border-slate-200 rounded-sm overflow-hidden flex items-center justify-center">
                                  {variant.imageUrl ? (
                                    <img src={variant.imageUrl} alt={variant.sku} className="w-full h-full object-cover" />
                                  ) : <Package size={16} className="text-slate-300" />}
                               </div>
                               <div>
                                 <p className="text-[13px] font-bold text-slate-800 group-hover:text-blue-600">
                                   {variant.productName || variant.unit}
                                 </p>
                                 <p className="text-[11px] text-slate-500 mt-0.5">
                                   SKU: <span className="font-mono text-blue-600">{variant.sku}</span>
                                 </p>
                               </div>
                             </div>
                          </div>

                          <div className="text-right">
                            <p className="text-[13px] font-bold text-rose-600">{formatNumber(variant.costPrice || 0)} ₫</p>
                            <p className="text-[11px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-sm mt-1 inline-block border border-blue-100">
                               Tồn {importType === "INTERNAL" ? "kho xuất" : "tại kho"}: {variant.quantity || 0}
                            </p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="p-4 text-center text-slate-500 text-[12px]">Không tìm thấy sản phẩm nào.</div>
                    )}
                  </div>

                  {checkedItems.length > 0 && (
                    <div className="sticky bottom-0 left-0 w-full p-3 bg-blue-50 border-t border-blue-100 flex justify-between items-center z-[110] shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
                      <span className="text-[12px] font-bold text-blue-700">Đã chọn {checkedItems.length}</span>
                      <Button type="button" onClick={handleAddSelectedToTable} className="h-8 bg-blue-600 hover:bg-blue-700 text-[12px] shadow-sm">
                        Thêm vào đơn
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>
            {!isReadOnly && (
              <>
                <Button type="button" variant="outline" className="h-10 text-[12px] border-[#ccc] rounded-none">Chọn nhiều</Button>
                <Button type="button" variant="outline" className="h-10 text-[12px] border-emerald-200 bg-emerald-50 text-emerald-700 rounded-none">
                  <Download size={16} className="mr-2" /> Nhập Excel
                </Button>
              </>
            )}
          </div>
        </div>

        <div className="min-h-[300px] overflow-x-auto relative z-0">
          <Table className="min-w-[1200px]">
            <TableHeader>
              <TableRow className="bg-[#fcfcfc] border-b border-[#eee]">
                <TableHead className="w-[50px] text-center p-3 text-[11px] font-bold text-slate-400">STT</TableHead>
                <TableHead className="w-[250px] font-bold text-slate-400 text-[11px] p-3">Sản phẩm</TableHead>
                <TableHead className="w-[130px] font-bold text-slate-400 text-[11px] p-3 text-center">Số lô</TableHead>
                <TableHead className="w-[130px] font-bold text-slate-400 text-[11px] p-3 text-center">Hạn dùng</TableHead>
                <TableHead className="w-[130px] text-[11px] font-bold text-slate-400 p-3 text-right">Số lượng</TableHead>
                <TableHead className="w-[130px] text-[11px] font-bold text-slate-400 p-3 text-right">Giá nhập</TableHead>
                <TableHead className="w-[130px] font-bold text-emerald-600 text-[11px] p-3 text-right">Giá bán</TableHead>
                <TableHead className="w-[150px] text-[11px] font-bold text-slate-400 p-3 text-right">Thành tiền</TableHead>
                <TableHead className="w-[40px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {fields.length === 0 ? (
                <TableRow><TableCell colSpan={9} className="h-64 text-center text-slate-300 font-bold uppercase tracking-widest">Chưa có sản phẩm nào</TableCell></TableRow>
              ) : (
                fields.map((field: any, index) => {
                  const currentItem = watchItems[index] as any;

                  return (
                    <React.Fragment key={field.id}>
                      <TableRow className="border-b hover:bg-slate-50/30 transition-colors">
                        <TableCell className="text-center text-slate-300 text-[11px] font-bold">{index + 1}</TableCell>
                        <TableCell className="p-3">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 border shrink-0 flex items-center justify-center overflow-hidden bg-white">
                              {currentItem?.imageUrl ? <img src={currentItem.imageUrl} className="w-full h-full object-cover" /> : <ImageIcon size={16} className="text-slate-200" />}
                            </div>
                            <div className="min-w-0">
                              <p className="text-[13px] font-bold text-slate-700 truncate">{currentItem?.productName}</p>
                              <p className="text-[10px] text-slate-400 font-mono">#{currentItem?.productCode}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="p-3">
                          <Input readOnly={isReadOnly} {...register(`items.${index}.lotNumber`)} className={`h-8 text-[12px] border-[#ccc] rounded-none text-center font-bold ${errors.items?.[index]?.lotNumber ? "border-rose-500" : ""} ${isReadOnly ? "bg-slate-50" : ""}`} />
                        </TableCell>
                        <TableCell className="p-3">
                          <Input readOnly={isReadOnly} type="date" {...register(`items.${index}.expiryDate`)} className={`h-8 text-[12px] border-[#ccc] rounded-none ${errors.items?.[index]?.expiryDate ? "border-rose-500" : ""} ${isReadOnly ? "bg-slate-50" : ""}`} />
                        </TableCell>
                        <TableCell className="p-3">
                          <Input
                            readOnly={isReadOnly}
                            type="number"
                            {...register(`items.${index}.plannedQuantity`, { valueAsNumber: true })}
                            className={`h-8 text-[12px] text-right font-bold ${errors.items?.[index]?.plannedQuantity ? "border-rose-500" : ""} ${isReadOnly ? "bg-slate-50" : ""}`}
                          />
                          {!isReadOnly && importType === "INTERNAL" && currentItem?.maxQuantity !== undefined && (
                             <div className="text-[10px] text-blue-600 font-bold mt-1 text-right bg-blue-50 px-1 py-0.5 rounded-sm inline-block w-full">
                                Tồn kho xuất: {currentItem.maxQuantity}
                             </div>
                          )}
                        </TableCell>
                        <TableCell className="p-3">
                          <Input
                            readOnly={isReadOnly}
                            type="number"
                            {...register(`items.${index}.importPrice`, { valueAsNumber: true })}
                            className={`h-8 text-[12px] text-right font-bold text-blue-600 ${errors.items?.[index]?.importPrice ? "border-rose-500" : ""} ${isReadOnly ? "bg-slate-50" : ""}`}
                          />
                        </TableCell>
                        <TableCell className="p-3">
                          <Input readOnly={isReadOnly} type="number" {...register(`items.${index}.newSellingPrice`, { valueAsNumber: true })} className={`h-8 text-[12px] text-right font-bold text-emerald-700 bg-emerald-50/30 ${isReadOnly ? "bg-slate-50" : ""}`} />
                        </TableCell>
                        <TableCell className="p-3 text-right font-bold text-[13px] text-slate-900">{formatNumber((Number(currentItem?.plannedQuantity) || 0) * (Number(currentItem?.importPrice) || 0))}</TableCell>
                        <TableCell className="p-3 text-center">
                          {!isReadOnly && <button type="button" onClick={() => remove(index)} className="text-slate-300 hover:text-rose-600"><Trash2 size={16} /></button>}
                        </TableCell>
                      </TableRow>
                      {(errors.items?.[index]?.lotNumber || errors.items?.[index]?.expiryDate || errors.items?.[index]?.plannedQuantity || errors.items?.[index]?.importPrice) && (
                        <TableRow className="bg-rose-50/30">
                          <TableCell colSpan={9} className="p-1 px-4">
                            <div className="flex gap-4 text-[10px] text-rose-500 font-medium">
                              {errors.items?.[index]?.lotNumber && <span>• {(errors.items?.[index]?.lotNumber as any)?.message}</span>}
                              {errors.items?.[index]?.expiryDate && <span>• {(errors.items?.[index]?.expiryDate as any)?.message}</span>}
                              {errors.items?.[index]?.plannedQuantity && <span>• {(errors.items?.[index]?.plannedQuantity as any)?.message}</span>}
                              {errors.items?.[index]?.importPrice && <span>• {(errors.items?.[index]?.importPrice as any)?.message}</span>}
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </TableBody>
          </Table>
          {errors.items?.root && <p className="p-4 text-rose-500 text-sm font-bold bg-rose-50">{errors.items.root.message}</p>}
          {errors.items && !Array.isArray(errors.items) && <p className="p-4 text-rose-500 text-sm font-bold bg-rose-50">{(errors.items as any).message}</p>}
        </div>
      </div>

      {/* 3. Bottom Summary Section */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 pt-6">
        <div className="md:col-span-5 space-y-6">
          <div className="space-y-2">
            <Label className="text-[12px] font-bold text-slate-500 uppercase">Ghi chú đơn</Label>
            <textarea readOnly={isReadOnly} {...register("note")} className={`w-full min-h-[90px] p-3 text-[13px] border border-[#ccc] outline-none shadow-inner ${isReadOnly ? "bg-slate-50" : ""}`} placeholder="Nhập ghi chú..."></textarea>
          </div>
          <div className="space-y-2">
            <Label className="text-[12px] font-bold text-slate-500 uppercase">Thẻ phân loại (Tags)</Label>
            <div className={`min-h-[44px] p-2 border border-[#ccc] bg-white flex flex-wrap gap-2 ${isReadOnly ? "bg-slate-50" : ""}`}>
              {tags.map((tag) => (
                <span key={tag} className="bg-slate-100 px-2 py-1 text-[11px] font-bold border flex items-center gap-1">
                  {tag} {!isReadOnly && <X size={10} className="cursor-pointer" onClick={() => setTags(tags.filter((t) => t !== tag))} />}
                </span>
              ))}
              {!isReadOnly && <input type="text" value={tagInput} onChange={(e) => setTagInput(e.target.value)} onKeyDown={handleAddTag} placeholder="Nhập tag..." className="flex-1 min-w-[150px] outline-none text-[12px]" />}
            </div>
          </div>
        </div>

        <div className="md:col-span-4 md:col-start-9 space-y-4 pr-2">
          <div className="flex justify-between items-center text-[13px]">
            <span className="text-slate-500 font-bold uppercase">Số lượng hàng</span>
            <span className="text-slate-900 font-black">{totalQty}</span>
          </div>

          <div className="flex justify-between items-center text-[13px]">
            <span className="text-slate-500 font-bold uppercase">Tổng tiền hàng</span>
            <span className="text-slate-900 font-black">{formatNumber(subTotal)} ₫</span>
          </div>

          {/* NẾU NHẬP TỪ NCC MỚI HIỆN THÔNG TIN THANH TOÁN (Cần trả, Thanh toán, Còn nợ) */}
          {importType === "SUPPLIER" ? (
            <>
              <div className="pt-3 border-t border-dashed border-slate-300 flex justify-between items-center">
                <span className="text-[12px] font-black text-slate-900 uppercase">Cần trả NCC</span>
                <span className="text-[18px] font-black text-slate-900">{formatNumber(subTotal)} ₫</span>
              </div>
              <div className="pt-4 border-t">
                <p className="text-[12px] font-bold text-slate-800 uppercase">Thanh toán cho NCC</p>
                <div className="relative mt-2">
                <Input readOnly={isReadOnly} type="number" {...register("paymentAmount", { valueAsNumber: true })} className={`h-10 text-[16px] font-black text-blue-600 border-[#ccc] text-right bg-blue-50/30 ${errors.paymentAmount ? "border-rose-500" : ""} ${isReadOnly ? "bg-slate-100" : ""}`} />
                {errors.paymentAmount && <p className="text-rose-500 text-[10px] mt-1">{errors.paymentAmount.message}</p>}</div>
              </div>
             <div className="pt-4 flex justify-between items-center border-t border-slate-200">
               <span className="text-[12px] font-black text-slate-900 uppercase">Còn nợ</span>
               <span className={`text-[16px] font-black ${debtAmount < 0 ? "text-blue-600" : "text-rose-600"}`}>
                 {debtAmount < 0 ? `Trả dư: ${formatNumber(Math.abs(debtAmount))}` : formatNumber(debtAmount)} ₫
               </span>
             </div>
            </>
          ) : (
            <div className="mt-4 p-4 bg-blue-50/50 border border-blue-100 rounded-sm text-center">
               <p className="text-[12px] text-blue-700 font-bold uppercase">Luân chuyển nội bộ</p>
               <p className="text-[11px] text-slate-500 mt-1">Không phát sinh thanh toán chi phí với đối tác bên ngoài.</p>
            </div>
          )}
        </div>
      </div>

      {/* 4. Fixed Footer Actions */}
      <div className="fixed bottom-0 left-0 lg:left-[260px] right-0 bg-[#f8f9fa] border-t p-[12px_30px] flex items-center justify-end gap-[15px] z-[999]">
        <Button type="button" variant="outline" onClick={() => router.back()} className="min-w-[110px] text-[12px] font-bold uppercase border-[#ccc] bg-white rounded-none">
          {isReadOnly ? "Quay lại" : "Hủy bỏ"}
        </Button>

        {!isReadOnly && (
          <Button
            type="submit"
            disabled={isSubmitting}
            className="min-w-[180px] text-[12px] font-black bg-blue-600 text-white uppercase rounded-none shadow-md"
          >
            {isSubmitting ? <Loader2 className="animate-spin" size={18} /> : <><Save size={18} className="mr-2" /> Lưu phiếu nhập</>}
          </Button>
        )}
      </div>
    </form>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center bg-slate-50"><Loader2 className="animate-spin text-blue-600" size={32} /></div>}>
      <AdminReceiptFormContent />
    </Suspense>
  );
}