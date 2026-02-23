"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  X, Search, Info, Settings, Plus, Trash2, Package, Save, Image as ImageIcon, Download, Loader2, User, Clock,
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
import { AdminPageHeader } from "@/components/admin/shared/AdminPageHeader";

import { supplierService } from "@/app/services/supplier.service";
import { Supplier } from "@/app/types/supplier.type";
import { branchService } from '@/app/services/branchService';
import { ProductService } from '@/app/services/product.service';
import { useCurrentUser } from "@/hooks/useCurrentUser";

export default function AdminNewReceiptPage() {
  const router = useRouter();
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");

  const { data: user, isLoading: isUserLoading } = useCurrentUser();

  // --- QUẢN LÝ NHÀ CUNG CẤP ---
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [isLoadingSuppliers, setIsLoadingSuppliers] = useState(false);
  const [searchSupplierText, setSearchSupplierText] = useState("");
  const [isSupplierDropdownOpen, setIsSupplierDropdownOpen] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);

  // --- QUẢN LÝ CHI NHÁNH ---
  const [branches, setBranches] = useState<any[]>([]);
  const [isLoadingBranches, setIsLoadingBranches] = useState(false);

  // --- QUẢN LÝ SẢN PHẨM ---
  const [allProducts, setAllProducts] = useState<any[]>([]); // Cache toàn bộ sản phẩm
  const [products, setProducts] = useState<any[]>([]); // Sản phẩm hiển thị (đã filter)
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);
  const [searchProductText, setSearchProductText] = useState("");
  const [isProductDropdownOpen, setIsProductDropdownOpen] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const productSearchRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null); // Ref để auto-focus ô tìm kiếm

  const {
    register, handleSubmit, control, setValue, watch,
    formState: { errors },
  } = useForm<Receipt>({
    resolver: zodResolver(ReceiptSchema),
    mode: "onTouched",
    defaultValues: {
      receiptType: "NHAP_MUA",
      supplierCode: "",
      supplierName: "",
      receiptCode: "PNK" + Date.now().toString().slice(-6),
      warehouseId: "HH",
      branchName: "",
      importStatus: "IMPORTED",
      deliverer: "",
      entryDate: new Date().toISOString().slice(0, 10),
      items: [],
      note: "",
      paymentAmount: 0,
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "items",
  });

  const watchItems = watch("items");
  const watchPaymentAmount = watch("paymentAmount") || 0;

  const subTotal = watchItems.reduce((acc, item) => acc + (item.plannedQuantity || 0) * (item.importPrice || 0), 0);
  const totalQty = watchItems.reduce((acc, item) => acc + (Number(item.plannedQuantity) || 0), 0);
  const debtAmount = Math.max(0, subTotal - watchPaymentAmount);

  // --- GỌI API CHI NHÁNH ---
  useEffect(() => {
    const fetchBranches = async () => {
      setIsLoadingBranches(true);
      try {
        const data = await branchService.getAll();
        const branchList = Array.isArray(data) ? data : (data.content || []);
        setBranches(branchList);
        if (branchList.length > 0) {
           setValue("branchName", branchList[0].name || branchList[0].branchName);
        }
      } catch (error) { console.error(error); } finally { setIsLoadingBranches(false); }
    };
    fetchBranches();
  }, [setValue]);

  // --- GÁN THÔNG TIN NGƯỜI DÙNG ---
  useEffect(() => {
    if (user) {
      setValue("deliverer", user.fullName || user.displayName || "Quản trị viên");
    }
  }, [user, setValue]);

  // --- LOGIC GỌI API SẢN PHẨM (TỐI ƯU HIỆU SUẤT) ---
  useEffect(() => {
    const fetchProducts = async () => {
      // Chỉ gọi API 1 lần duy nhất khi mở dropdown và dữ liệu chưa được load
      if (!isProductDropdownOpen || allProducts.length > 0) return;

      setIsLoadingProducts(true);
      try {
        const data = await ProductService.getAll();
        // Xử lý dữ liệu an toàn (hỗ trợ .data.data nếu backend bọc thêm 1 lớp)
        const productList = Array.isArray(data) ? data : (data?.data || data?.content || []);

        setAllProducts(productList);
        setProducts(productList);
      } catch (error) {
        console.error("Lỗi tải sản phẩm:", error);
        toast.error("Không thể tải danh sách sản phẩm");
      } finally {
        setIsLoadingProducts(false);
      }
    };

    fetchProducts();
  }, [isProductDropdownOpen, allProducts.length]);

  // --- LỌC SẢN PHẨM (CLIENT-SIDE) ---
  useEffect(() => {
    if (!searchProductText.trim()) {
      setProducts(allProducts);
      return;
    }
    const filtered = allProducts.filter((p: any) =>
      p.name?.toLowerCase().includes(searchProductText.toLowerCase()) ||
      p.sku?.toLowerCase().includes(searchProductText.toLowerCase()) ||
      p.code?.toLowerCase().includes(searchProductText.toLowerCase())
    );
    setProducts(filtered);
  }, [searchProductText, allProducts]);

  // --- CLICK NGOÀI ĐỂ ĐÓNG DROPDOWN ---
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsSupplierDropdownOpen(false);
      }
      if (productSearchRef.current && !productSearchRef.current.contains(event.target as Node)) {
        setIsProductDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // --- LOGIC NHÀ CUNG CẤP ---
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

  const handleSelectSupplier = (supplier: Supplier) => {
    setValue("supplierCode", supplier.code);
    setValue("supplierName", supplier.name);
    setSelectedSupplier(supplier);
    setSearchSupplierText("");
    setIsSupplierDropdownOpen(false);
  };

  const handleClearSupplier = () => {
    setValue("supplierCode", "");
    setValue("supplierName", "");
    setSelectedSupplier(null);
  };

  const handleSelectProduct = (product: any) => {
      // 1. TRÍCH XUẤT BIẾN THỂ ĐẦU TIÊN (Nếu có)
      const firstVariant = product.variants && product.variants.length > 0 ? product.variants[0] : {};

      // 2. LẤY MÃ SẢN PHẨM: Ưu tiên mã của biến thể (sku), nếu không có thì lấy baseSku của sản phẩm cha
      const productCode = firstVariant.sku || product.baseSku || "N/A";

      // 3. LẤY GIÁ NHẬP & GIÁ BÁN TỪ BIẾN THỂ
      // (Lưu ý: Bạn cần check xem ProductVariantResponse của bạn đặt tên biến giá là gì.
      // Thường là importPrice, costPrice, hoặc price).
      const importPrice = firstVariant.importPrice || firstVariant.costPrice || firstVariant.price || 0;
      const sellingPrice = firstVariant.sellingPrice || firstVariant.retailPrice || firstVariant.price || 0;

      const existingIndex = watchItems.findIndex((item) => item.productCode === productCode);

      if (existingIndex > -1) {
        const currentQty = watchItems[existingIndex].plannedQuantity || 0;
        setValue(`items.${existingIndex}.plannedQuantity`, Number(currentQty) + 1);
        toast.info(`Đã tăng số lượng: ${product.name}`);
      } else {
        append({
          productCode: productCode,
          productName: product.name,
          unit: product.unit || firstVariant.unit || "Cái", // Backend chưa thấy có unit, tạm để "Cái"
          plannedQuantity: 1,
          lotNumber: "",
          expiryDate: "",
          importPrice: importPrice,
          newSellingPrice: sellingPrice,
        });
        toast.success(`Đã thêm: ${product.name}`);
      }
      setIsProductDropdownOpen(false);
      setSearchProductText("");
    };

  const handleAddTag = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && tagInput.trim()) {
      e.preventDefault();
      if (!tags.includes(tagInput.trim())) setTags([...tags, tagInput.trim()]);
      setTagInput("");
    }
  };

  const onSubmit = (data: Receipt) => {
    console.log("Submit Data: ", data);
    toast.success("Đã lưu thông tin phiếu nhập");
    router.push("/admin/receipts");
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="p-6 bg-slate-50 min-h-screen space-y-4 pb-[100px] font-sans text-slate-900"
    >
      <AdminPageHeader title="Tạo phiếu nhập hàng" />

      {/* 1. Top Section: Supplier & Order Info */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
        {/* THÔNG TIN NHÀ CUNG CẤP */}
        <div className="md:col-span-7 bg-white border border-[#dcdcdc] p-5 rounded-none shadow-sm">
          <h2 className="text-[14px] font-bold text-slate-800 mb-4 border-b pb-2">Nhà cung cấp</h2>
          {!selectedSupplier ? (
            <div className="relative mb-2" ref={dropdownRef}>
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <Input
                value={searchSupplierText}
                onChange={(e) => { setSearchSupplierText(e.target.value); setIsSupplierDropdownOpen(true); }}
                onFocus={() => setIsSupplierDropdownOpen(true)}
                placeholder="Tìm theo tên, SĐT, mã nhà cung cấp... (F4)"
                className="pl-10 h-10 border-[#ccc] rounded-none focus-visible:ring-blue-500/20 shadow-none text-[13px]"
              />
              {isSupplierDropdownOpen && (
                <div className="absolute top-full left-0 w-full mt-1 bg-white border border-slate-200 shadow-xl z-50">
                  <div className="p-3 border-b border-slate-200 flex items-center gap-2 text-blue-600 bg-blue-50/50 hover:bg-blue-100 cursor-pointer transition-colors"
                    onClick={() => router.push('/admin/suppliers/new')}>
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
              <button type="button" onClick={handleClearSupplier} className="absolute top-3 right-3 text-slate-400 hover:text-slate-700 hover:bg-slate-200 p-1 rounded-full transition-colors">
                <X size={18} />
              </button>
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
                    <p className="text-[13px] text-slate-700 leading-snug">{selectedSupplier.addressDetail || "Chưa cập nhật địa chỉ"}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
          {!selectedSupplier && (
            <div className="flex flex-col items-center justify-center py-6 text-slate-300">
              <ImageIcon size={32} className="opacity-20 mb-2" />
              <p className="text-[12px] font-bold">Chưa có thông tin nhà cung cấp</p>
            </div>
          )}
        </div>

        {/* THÔNG TIN ĐƠN NHẬP HÀNG */}
        <div className="md:col-span-5 bg-white border border-[#dcdcdc] p-5 rounded-none shadow-sm space-y-3">
          <h2 className="text-[13px] font-bold text-slate-700 mb-4 border-b pb-2">Thông tin đơn nhập hàng</h2>
          <div className="grid grid-cols-12 items-center gap-2">
            <Label className="col-span-4 text-[12px] font-bold text-slate-500">Nhập vào kho</Label>
            <div className="col-span-8">
              <Controller
                name="branchName"
                control={control}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value} disabled={isLoadingBranches}>
                    <SelectTrigger className="h-9 text-[13px] border-[#ccc] rounded-none shadow-none focus:ring-0 font-medium">
                      <SelectValue placeholder={isLoadingBranches ? "Đang tải..." : "Chọn chi nhánh"} />
                    </SelectTrigger>
                    <SelectContent className="rounded-none">
                      {branches.map((branch) => (
                        <SelectItem key={branch.id} value={branch.name || branch.branchName || branch.id.toString()}>
                          {branch.name || branch.branchName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
          </div>
          <div className="grid grid-cols-12 items-center gap-2">
            <Label className="col-span-4 text-[12px] font-bold text-slate-500">Nhân viên</Label>
            <div className="col-span-8 relative">
              <Input {...register("deliverer")} readOnly placeholder={isUserLoading ? "Đang tải..." : "Tên nhân viên"}
                className="h-9 text-[13px] border-[#ccc] rounded-none shadow-none font-medium bg-slate-50 cursor-default focus-visible:ring-0" />
              <User size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
            </div>
          </div>
          <div className="grid grid-cols-12 items-center gap-2">
            <Label className="col-span-4 text-[12px] font-bold text-slate-500">Ngày hẹn giao</Label>
            <div className="col-span-8 relative">
              <Input type="date" {...register("entryDate")} className="h-9 text-[13px] border-[#ccc] rounded-none shadow-none font-medium pr-10" />
              <Clock size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>
          </div>
        </div>
      </div>

      {/* 2. Middle Section: Product Table */}
      <div className="bg-white border border-[#dcdcdc] rounded-none shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex flex-wrap items-center gap-3 flex-1">
            <h2 className="text-[13px] font-bold text-slate-700 whitespace-nowrap">Thông tin sản phẩm</h2>

            {/* SEARCH SẢN PHẨM TỪ DB */}
            <div className="relative flex-1 max-w-[600px]" ref={productSearchRef}>
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <Input
                ref={searchInputRef} // Gắn ref để auto-focus
                value={searchProductText}
                onChange={(e) => { setSearchProductText(e.target.value); setIsProductDropdownOpen(true); }}
                onFocus={() => setIsProductDropdownOpen(true)}
                placeholder="Tìm tên, mã SKU, Barcode... (F3)"
                className="pl-10 h-10 border-[#ccc] rounded-none focus-visible:ring-blue-500/20 shadow-none text-[13px]"
              />

              {/* Phần hiển thị kết quả trong Input Search */}
              {isProductDropdownOpen && (
                <div className="absolute top-full left-0 w-full mt-1 bg-white border border-slate-200 shadow-xl z-50">
                  <div className="max-h-[300px] overflow-y-auto">
                    {isLoadingProducts ? (
                      <div className="flex items-center justify-center p-4">
                        <Loader2 size={20} className="animate-spin mr-2 text-blue-600" />
                        <span className="text-[12px]">Đang tải danh sách...</span>
                      </div>
                    ) : products.length > 0 ? (
                      products.map((product) => (
                        <div
                          key={product.id}
                          onClick={() => handleSelectProduct(product)}
                          className="p-3 border-b border-slate-100 last:border-0 hover:bg-blue-50 cursor-pointer transition-colors group flex justify-between items-center"
                        >
                          <div className="flex items-center gap-3">
                             <div className="w-8 h-8 bg-slate-100 flex items-center justify-center">
                                <Package size={14} className="text-slate-400" />
                             </div>
                             <div>
                               <p className="text-[13px] font-bold text-slate-800 group-hover:text-blue-600">
                                  {product.name}
                               </p>
                               <p className="text-[11px] text-slate-500">
                                  Mã: <span className="font-mono text-blue-500">{product.sku || product.code}</span>
                                  {product.unit && ` • ĐVT: ${product.unit}`}
                               </p>
                             </div>
                          </div>
                          <div className="text-right">
                             <p className="text-[12px] font-bold text-rose-600">{formatNumber(product.importPrice || 0)} ₫</p>
                             <p className="text-[10px] text-slate-400">Tồn kho: {product.stockQuantity || 0}</p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="p-4 text-center text-slate-500 text-[12px]">
                         Không tìm thấy sản phẩm nào phù hợp.
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <Button type="button" variant="outline" className="h-10 text-[12px] font-bold border-[#ccc] rounded-none px-4 shadow-none hover:bg-slate-50">Chọn nhiều</Button>
            <Button type="button" variant="outline" className="h-10 text-[12px] font-bold border-emerald-200 bg-emerald-50 text-emerald-700 rounded-none px-4 shadow-none hover:bg-emerald-100">
              <Download size={16} className="mr-2" /> Nhập từ Excel
            </Button>
          </div>
          <div className="flex items-center gap-3 ml-auto">
            <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-slate-400"><Settings size={18} /></Button>
          </div>
        </div>

        <div className="min-h-[300px] overflow-x-auto">
          <Table className="min-w-[1200px]">
            <TableHeader>
              <TableRow className="bg-[#fcfcfc] border-b border-[#eee]">
                <TableHead className="w-[50px] text-center p-3 text-[11px] font-bold text-slate-400 whitespace-nowrap">STT</TableHead>
                <TableHead className="font-bold text-slate-400 text-[11px] p-3 whitespace-nowrap">Mã SKU / Tên sản phẩm</TableHead>
                <TableHead className="w-[80px] text-[11px] font-bold text-slate-400 p-3 text-center whitespace-nowrap">ĐVT</TableHead>
                <TableHead className="w-[130px] font-bold text-slate-400 text-[11px] p-3 text-center whitespace-nowrap">Số lô (Batch)</TableHead>
                <TableHead className="w-[130px] font-bold text-slate-400 text-[11px] p-3 text-center whitespace-nowrap">Hạn dùng</TableHead>
                <TableHead className="w-[90px] text-[11px] font-bold text-slate-400 p-3 text-right whitespace-nowrap">Số lượng</TableHead>
                <TableHead className="w-[120px] text-[11px] font-bold text-slate-400 p-3 text-right whitespace-nowrap">Giá nhập</TableHead>
                <TableHead className="w-[120px] font-bold text-emerald-600 text-[11px] p-3 text-right whitespace-nowrap">Giá bán mới</TableHead>
                <TableHead className="w-[120px] text-[11px] font-bold text-slate-400 p-3 text-right whitespace-nowrap">Thành tiền</TableHead>
                <TableHead className="w-[40px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {fields.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} className="h-64 text-center">
                    <div className="flex flex-col items-center justify-center space-y-4">
                      <Package size={32} className="text-slate-100" />
                      <p className="text-[13px] font-bold text-slate-300 uppercase tracking-widest">Đơn hàng nhập của bạn chưa có sản phẩm nào</p>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setIsProductDropdownOpen(true);
                          // Delay nhẹ để UI render ô Input rồi mới focus
                          setTimeout(() => searchInputRef.current?.focus(), 100);
                        }}
                        className="text-blue-600 border-blue-200 h-9 px-6 rounded-none font-bold text-[11px] uppercase hover:bg-blue-50"
                      >Thêm sản phẩm</Button>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                fields.map((field, index) => (
                  <TableRow key={field.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/30 transition-colors group">
                    <TableCell className="text-center text-slate-300 text-[11px] font-bold">{index + 1}</TableCell>
                    <TableCell className="p-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-slate-50 border border-slate-100 rounded-none shrink-0 flex items-center justify-center overflow-hidden">
                          <ImageIcon size={16} className="text-slate-200" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-[13px] font-bold text-slate-700 truncate uppercase">{watchItems[index]?.productName}</p>
                          <p className="text-[10px] text-slate-400 font-mono">#{watchItems[index]?.productCode}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="p-3 text-center whitespace-nowrap">
                      <span className="text-[12px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5">{watchItems[index]?.unit}</span>
                    </TableCell>
                    <TableCell className="p-3">
                      <Input {...register(`items.${index}.lotNumber`)} placeholder="Nhập lô..." className="h-8 text-[12px] border-[#ccc] rounded-none text-center font-bold uppercase shadow-none focus:border-blue-500" />
                    </TableCell>
                    <TableCell className="p-3">
                      <Input type="date" {...register(`items.${index}.expiryDate`)} className="h-8 text-[12px] border-[#ccc] rounded-none px-1 shadow-none focus:border-blue-500" />
                    </TableCell>
                    <TableCell className="p-3 text-right">
                      <Input type="number" {...register(`items.${index}.plannedQuantity`)} className="h-8 text-[12px] border-[#ccc] rounded-none text-right font-bold shadow-none focus:border-blue-500" />
                    </TableCell>
                    <TableCell className="p-3 text-right">
                      <Input type="number" {...register(`items.${index}.importPrice`)} className="h-8 text-[12px] border-[#ccc] rounded-none text-right font-bold text-blue-600 shadow-none focus:border-blue-500" />
                    </TableCell>
                    <TableCell className="p-3 text-right">
                      <Input type="number" {...register(`items.${index}.newSellingPrice`)} className="h-8 text-[12px] border-emerald-200 bg-emerald-50/30 rounded-none text-right font-bold text-emerald-700 shadow-none focus:border-emerald-500" />
                    </TableCell>
                    <TableCell className="p-3 text-right font-bold text-[13px] text-slate-900">
                      {formatNumber((watchItems[index]?.plannedQuantity || 0) * (watchItems[index]?.importPrice || 0))}
                    </TableCell>
                    <TableCell className="p-3 text-center">
                      <button type="button" onClick={() => remove(index)} className="text-slate-300 hover:text-rose-600 transition-colors"><Trash2 size={16} /></button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* 3. Bottom Summary Section */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 pt-6">
        <div className="md:col-span-5 space-y-6">
          <div className="space-y-2">
            <Label className="text-[12px] font-bold text-slate-500 uppercase">Ghi chú đơn</Label>
            <textarea {...register("note")} placeholder="VD: Hàng tặng gói riêng..." className="w-full min-h-[90px] p-3 text-[13px] border border-[#ccc] rounded-none focus:ring-1 focus:ring-blue-500 outline-none shadow-inner"></textarea>
          </div>
          <div className="space-y-2">
            <Label className="text-[12px] font-bold text-slate-500 uppercase">Thẻ phân loại (Tags)</Label>
            <div className="min-h-[44px] p-2 border border-[#ccc] rounded-none bg-white flex flex-wrap gap-2 shadow-inner">
              {tags.map((tag) => (
                <span key={tag} className="inline-flex items-center gap-1 bg-slate-100 text-slate-600 px-2 py-1 text-[11px] font-bold border border-slate-200">
                  {tag} <X size={10} className="cursor-pointer hover:text-rose-500" onClick={() => setTags(tags.filter((t) => t !== tag))} />
                </span>
              ))}
              <input type="text" value={tagInput} onChange={(e) => setTagInput(e.target.value)} onKeyDown={handleAddTag} placeholder="Nhập và Enter..." className="flex-1 min-w-[150px] border-none text-[12px] focus:ring-0 outline-none" />
            </div>
          </div>
        </div>

        {/* Right Column: Financial Summary */}
        <div className="md:col-span-4 md:col-start-9 space-y-4 pr-2">
          <div className="flex justify-between items-center text-[13px]">
            <span className="text-slate-500 font-bold uppercase tracking-tighter">Số lượng hàng</span>
            <span className="text-slate-900 font-black">{totalQty}</span>
          </div>
          <div className="flex justify-between items-center text-[13px]">
            <span className="text-slate-500 font-bold uppercase tracking-tighter">Tổng tiền hàng</span>
            <span className="text-slate-900 font-black">{formatNumber(subTotal)} ₫</span>
          </div>
          <div className="flex justify-between items-center text-[13px]">
            <span className="text-blue-600 font-bold uppercase tracking-tighter cursor-pointer hover:underline">Chiết khấu đơn (F6)</span>
            <span className="text-slate-900 font-black">0 ₫</span>
          </div>
          <div className="pt-2 border-t border-slate-100">
            <p className="text-[12px] font-bold text-slate-800 uppercase tracking-widest">Chi phí nhập hàng</p>
            <button type="button" className="text-[12px] text-blue-600 flex items-center gap-1 mt-2 font-black hover:underline uppercase tracking-tighter">
              <Plus size={14} /> Thêm chi phí (F7)
            </button>
          </div>
          <div className="flex justify-between items-center text-[13px]">
            <div className="flex items-center gap-1">
              <span className="text-slate-500 font-bold uppercase tracking-tighter">Thuế GTGT</span>
              <Info size={14} className="text-slate-200" />
            </div>
            <span className="text-slate-900 font-black">0 ₫</span>
          </div>
          <div className="pt-3 border-t border-dashed border-slate-300 flex justify-between items-center">
            <span className="text-[12px] font-black text-slate-900 uppercase tracking-widest">Tiền cần trả</span>
            <span className="text-[18px] font-black text-slate-900">{formatNumber(subTotal)} ₫</span>
          </div>
          <div className="pt-4 border-t border-slate-100">
            <p className="text-[12px] font-bold text-slate-800 uppercase tracking-widest">Thanh toán cho NCC</p>
            <div className="relative mt-2">
              <Input type="number" {...register("paymentAmount")} className="h-10 text-[16px] font-black text-blue-600 border-[#ccc] rounded-none text-right pr-8 bg-blue-50/30 shadow-none" />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] font-black text-blue-300">₫</span>
            </div>
          </div>
          <div className="pt-4 flex justify-between items-center border-t border-slate-200 mt-2">
            <span className="text-[12px] font-black text-slate-900 uppercase tracking-widest">Còn phải trả</span>
            <span className="text-[16px] font-black text-rose-600">{formatNumber(debtAmount)} ₫</span>
          </div>
        </div>
      </div>

      {/* 4. Fixed Footer Actions */}
      <div className="fixed bottom-0 left-0 lg:left-[260px] right-0 bg-[#f8f9fa] border-t border-[#ddd] p-[12px_30px] flex items-center justify-end gap-[15px] z-[999] shadow-[0_-4px_15px_rgba(0,0,0,0.05)]">
        <Button type="button" variant="outline" onClick={() => router.back()} className="min-w-[110px] h-[38px] text-[12px] font-bold border-[#ccc] bg-white rounded-none shadow-sm hover:bg-slate-50 transition-all uppercase">Hủy bỏ</Button>
        <Button type="submit" onClick={() => setValue("importStatus", "PO")} className="min-w-[150px] h-[38px] text-[12px] font-bold bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-none shadow-sm transition-all uppercase">Tạo & chưa nhập</Button>
        <Button type="submit" onClick={() => setValue("importStatus", "IMPORTED")} className="min-w-[180px] h-[38px] text-[12px] font-black bg-blue-600 hover:bg-blue-700 text-white rounded-none shadow-md shadow-blue-100 transition-all active:scale-[0.98] uppercase">
          <Save size={18} className="mr-2" /> Tạo & nhập hàng (F9)
        </Button>
      </div>
    </form>
  );
}