"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  X, Plus, Trash2, FileText, ChevronLeft, Save, ShoppingBag, Warehouse, UserCheck,
  MapPin, User, Phone, CalendarIcon, Hash, Search, ChevronDown, ChevronRight, BadgeCheck
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { cn, formatNumber } from "@/lib/utils";
import { ProductService } from "@/app/services/product.service";
import { useCurrentUser } from "@/hooks/useCurrentUser";

type ExportType = "INTERNAL" | "RETURN";

export default function NewExportCommandPage() {
  const router = useRouter();
  const { data: currentUser } = useCurrentUser();

  // Hàm tạo mã phiếu tự động
  const generateNoteCode = (type: ExportType) => {
    const prefix = type === "INTERNAL" ? "LXN" : "LXT";
    const date = new Date();
    const dateString = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}`;
    const randomSuffix = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `${prefix}-${dateString}-${randomSuffix}`;
  };

  // --- 1. Dữ liệu Form ---
  const [exportType, setExportType] = useState<ExportType>("INTERNAL");
  const [items, setItems] = useState<any[]>([]);
  const [form, setForm] = useState({
    noteCode: generateNoteCode("INTERNAL"),
    referenceCode: "",
    note: "",
    expectedDate: new Date().toLocaleDateString('en-CA'),
    specificReceiver: "",
    shippingAddress: "",
    creatorName: "" // Chỉ giữ lại tên người tạo
  });

  // Tự động cập nhật tên nhân viên khi có dữ liệu từ hook
  useEffect(() => {
    if (currentUser) {
      setForm(prev => ({
        ...prev,
        creatorName: currentUser.fullName || currentUser.displayName || "Admin"
      }));
    }
  }, [currentUser]);

  // --- 2. Dữ liệu động từ Backend ---
  const [branches, setBranches] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [selectedBranchId, setSelectedBranchId] = useState<string>("");
  const [selectedTargetId, setSelectedTargetId] = useState<string>("");

  const [allProducts, setAllProducts] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [expandedProducts, setExpandedProducts] = useState<Record<number, boolean>>({});
  const dropdownRef = useRef<HTMLDivElement>(null);

  // --- 3. useEffect: Gọi API lấy danh mục ---
  useEffect(() => {
    const loadMasterData = async () => {
      try {
        const token = typeof window !== 'undefined' ? localStorage.getItem("accessToken") : null;
        const headers = {
            "Content-Type": "application/json",
            ...(token ? { "Authorization": `Bearer ${token}` } : {})
        };

        const [resB, resS, resP] = await Promise.all([
          fetch("http://localhost:8080/api/branches", { headers }),
          fetch("http://localhost:8080/api/suppliers", { headers }),
          ProductService.getAll()
        ]);

        if (resB.ok) setBranches(await resB.json());
        if (resS.ok) {
           const supplierData = await resS.json();
           setSuppliers(Array.isArray(supplierData.content) ? supplierData.content : (Array.isArray(supplierData) ? supplierData : []));
        }
        if (resP) setAllProducts(resP);
      } catch (err) {
        console.error("Lỗi kết nối API:", err);
      }
    };
    loadMasterData();

    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
      setSelectedTargetId("");
      setForm(prev => ({
          ...prev,
          noteCode: generateNoteCode(exportType)
      }));
  }, [exportType]);

  // --- 4. Logic thêm hàng ---
  const toggleExpandProduct = (productId: number) => {
    setExpandedProducts(prev => ({ ...prev, [productId]: !prev[productId] }));
  };

  const addVariantToTable = (variant: any, productName: string) => {
    if (items.some(item => item.productVariantId === variant.id)) {
      toast.warning("Sản phẩm này đã có trong danh sách");
      return;
    }
    const newItem = {
      id: Date.now() + variant.id,
      productVariantId: variant.id,
      sku: variant.sku,
      name: `${productName} - ${variant.packaging || variant.unit}`,
      unit: variant.unit || "Cái",
      stock: variant.quantity || 0,
      quantity: 1,
      price: variant.price || 0,
      returnReason: ""
    };
    setItems(prev => [...prev, newItem]);
    setShowDropdown(false);
  };

  const selectAllVariants = (product: any) => {
    const newItemsToAdd: any[] = [];
    product.variants.forEach((v: any) => {
      if (!items.some(item => item.productVariantId === v.id)) {
        newItemsToAdd.push({
          id: Date.now() + v.id,
          productVariantId: v.id,
          sku: v.sku,
          name: `${product.name} - ${v.packaging || v.unit}`,
          unit: v.unit || "Cái",
          stock: v.quantity || 0,
          quantity: 1,
          price: v.price || 0,
          returnReason: ""
        });
      }
    });
    if (newItemsToAdd.length > 0) {
      setItems(prev => [...prev, ...newItemsToAdd]);
    }
    setShowDropdown(false);
  };

  const filteredProducts = allProducts.filter(p =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.baseSku?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const updateItem = (id: number, field: string, value: any) => {
    setItems(items.map((item) => (item.id === id ? { ...item, [field]: value } : item)));
  };

  // --- 5. Hàm Submit ---
  const handleCreate = async () => {
    if (items.length === 0) return toast.error("Vui lòng chọn ít nhất 1 sản phẩm!");
    if (!selectedBranchId) return toast.error("Vui lòng chọn kho xuất!");
    if (!selectedTargetId) return toast.error("Vui lòng chọn đối tượng nhận!");

    // CỐ ĐỊNH LẤY ID NGƯỜI DÙNG: Bọc nhiều trường hợp để không bị undefined
    const currentUserId = currentUser?.id || currentUser?.userId || currentUser?.sub;

    if (!currentUserId) {
        return toast.error("Lỗi xác thực: Không tìm thấy ID tài khoản của bạn. Vui lòng đăng nhập lại!");
    }

    const payload = {
      code: form.noteCode,
      exportType: exportType,
      referenceCode: form.referenceCode,
      note: form.note,
      expectedDate: form.expectedDate,
      branchId: parseInt(selectedBranchId),
      supplierId: exportType === "RETURN" ? parseInt(selectedTargetId) : null,
      targetBranchId: exportType === "INTERNAL" ? parseInt(selectedTargetId) : null,
      specificReceiver: form.specificReceiver,
      shippingAddress: form.shippingAddress,
      createdById: currentUserId, // Đã fix chắc chắn có ID
      details: items.map(it => ({
        productVariantId: it.productVariantId,
        requestedQuantity: it.quantity,
        price: it.price,
        note: exportType === "RETURN" ? it.returnReason : ""
      }))
    };

    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem("accessToken") : null;
      const res = await fetch("http://localhost:8080/api/v1/inventory/export-commands", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            ...(token ? { "Authorization": `Bearer ${token}` } : {}) // ĐÍNH KÈM TOKEN ĐỂ KHÔNG BỊ 401
        },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        toast.success("Tạo lệnh xuất kho thành công!");
        router.push("/admin/exports");
      } else {
        const err = await res.text();
        toast.error("Lỗi server: " + err);
      }
    } catch (e) {
      toast.error("Không thể kết nối đến server.");
    }
  };

  const selectedBranchAddress = selectedBranchId
    ? branches.find(b => b.id.toString() === selectedBranchId)?.addressDetail || "Chưa có địa chỉ"
    : "";

  let targetInfo = { name: "", phone: "", address: "" };
  if (selectedTargetId) {
      if (exportType === "INTERNAL") {
          const branch = branches.find(b => b.id?.toString() === selectedTargetId);
          if (branch) {
              targetInfo.name = branch.managerNames?.[0] || "Quản lý chi nhánh";
              targetInfo.phone = branch.phone || "Chưa có SĐT";
              targetInfo.address = branch.addressDetail || "Chưa có địa chỉ";
          }
      } else if (exportType === "RETURN") {
          const supplier = suppliers.find(s => s.id?.toString() === selectedTargetId);
          if (supplier) {
              targetInfo.name = supplier.contactName || "Người đại diện";
              targetInfo.phone = supplier.phone || "Chưa có SĐT";
              targetInfo.address = supplier.addressDetail || "Chưa có địa chỉ";
          }
      }
  }

  useEffect(() => {
      if (targetInfo.name) {
          setForm(prev => ({
              ...prev,
              specificReceiver: targetInfo.name,
              shippingAddress: targetInfo.address
          }));
      }
  }, [selectedTargetId, exportType]);

  return (
    <div className="space-y-4 pb-[100px] bg-slate-50/30 p-4 min-h-screen text-[#1f1f1f]">
      {/* Page Header */}
      <div className="flex items-center gap-4 mb-2">
        <Button variant="ghost" size="icon" onClick={() => router.back()}><ChevronLeft /></Button>
        <div className="flex flex-col">
            <h1 className="text-[18px] font-black uppercase tracking-tight text-[#1f1f1f]">Tạo lệnh xuất kho</h1>
            <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1">
                <Hash size={12}/> Phiếu mới: <span className="text-blue-600">{form.noteCode}</span>
            </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="lg:col-span-8 space-y-5">
          {/* 1. Thông tin chung */}
          <div className="bg-white border border-slate-200 p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-6 text-blue-700 font-black text-[11px] uppercase tracking-widest border-b pb-3">
              <FileText size={16} /> 1. Thông tin lệnh xuất kho
            </div>

            <div className="grid grid-cols-2 gap-x-6 gap-y-5">
              <div className="space-y-1.5 flex flex-col">
                <Label className="text-[10px] font-bold uppercase mb-1 text-slate-400 tracking-wider">Loại lệnh xuất (*)</Label>
                <Select value={exportType} onValueChange={(v: any) => setExportType(v)}>
                  <SelectTrigger className="rounded-none h-10 w-full shadow-none border-slate-200"><SelectValue /></SelectTrigger>
                  <SelectContent className="rounded-none">
                    <SelectItem value="INTERNAL">Xuất dùng nội bộ</SelectItem>
                    <SelectItem value="RETURN">Xuất trả NCC</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5 flex flex-col">
                <Label className="text-[10px] font-bold uppercase flex items-center gap-1 mb-1 text-slate-400 tracking-wider"><Hash size={12}/> Mã phiếu (Tự động)</Label>
                <Input value={form.noteCode} readOnly className="rounded-none bg-slate-50 text-slate-500 font-mono text-[13px] h-10 w-full border-slate-200" />
              </div>

              <div className="space-y-1.5 flex flex-col">
                <Label className="text-[10px] font-bold uppercase mb-1 text-slate-400 tracking-wider">Tham chiếu (Đơn hàng, hợp đồng...)</Label>
                <Input value={form.referenceCode} onChange={e => setForm({...form, referenceCode: e.target.value})} className="rounded-none text-[13px] h-10 w-full border-slate-200 shadow-none" placeholder="Nhập mã tham chiếu..." />
              </div>

              <div className="space-y-1.5 flex flex-col">
                <Label className="text-[10px] font-bold uppercase text-blue-600 flex items-center gap-1 mb-1 tracking-wider">Ngày hẹn xuất</Label>
                <div className="relative w-full">
                  <Input
                      type="date"
                      value={form.expectedDate}
                      onChange={e => setForm({...form, expectedDate: e.target.value})}
                      className="rounded-none border-slate-200 text-[13px] focus-visible:ring-blue-500 h-10 w-full pr-10 shadow-none block"
                  />
                  <CalendarIcon size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                </div>
              </div>

              <div className="col-span-2 space-y-1.5 flex flex-col mt-2">
                <Label className="text-[10px] font-bold uppercase mb-1 text-slate-400 tracking-wider">Lý do / Diễn giải</Label>
                <Textarea value={form.note} onChange={e => setForm({...form, note: e.target.value})} className="rounded-none min-h-[80px] text-[13px] w-full border-slate-200 shadow-none" placeholder="Nhập lý do xuất kho..." />
              </div>
            </div>
          </div>

          {/* 2. Danh mục sản phẩm */}
          <div className="bg-white border border-slate-200 shadow-sm overflow-visible">
             <div className="px-5 py-3 bg-[#f8f9fa] border-b flex flex-wrap items-center gap-4">
                <h3 className="text-[11px] font-black uppercase flex items-center gap-2 whitespace-nowrap"><ShoppingBag size={16} className="text-blue-600"/> 2. Danh mục sản phẩm</h3>

                <div className="relative flex-1 min-w-[300px]" ref={dropdownRef}>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <Input
                      placeholder="Tìm theo tên, SKU, danh mục..."
                      className="pl-10 h-10 text-[13px] border-slate-200 rounded-none bg-white w-full focus:border-blue-500 shadow-none"
                      value={searchTerm}
                      onChange={(e) => { setSearchTerm(e.target.value); setShowDropdown(true); }}
                      onFocus={() => setShowDropdown(true)}
                    />
                  </div>

                  {showDropdown && searchTerm.length > 0 && (
                    <div className="absolute top-full left-0 right-0 z-[100] bg-white border border-[#dcdcdc] shadow-xl mt-1 max-h-[400px] overflow-y-auto">
                      {filteredProducts.map(product => (
                        <div key={product.id} className="border-b last:border-0">
                          <div className="p-3 hover:bg-slate-50 cursor-pointer flex items-center gap-3">
                            <input
                              type="checkbox"
                              className="h-4 w-4 accent-blue-600 cursor-pointer"
                              onChange={() => selectAllVariants(product)}
                              checked={product.variants?.every((v: any) => items.some(it => it.productVariantId === v.id))}
                            />
                            <div className="flex-1 flex items-center gap-2" onClick={() => toggleExpandProduct(product.id)}>
                              {expandedProducts[product.id] ? <ChevronDown size={14}/> : <ChevronRight size={14}/>}
                              <div>
                                <div className="text-[13px] font-bold text-slate-700">{product.name}</div>
                                <div className="text-[11px] text-slate-400 uppercase font-bold tracking-tight">{product.baseSku} • {product.categoryName}</div>
                              </div>
                            </div>
                          </div>
                          {expandedProducts[product.id] && (
                            <div className="bg-slate-50/50 border-t border-slate-100">
                              {product.variants?.map((v: any) => (
                                <div key={v.id} className="flex items-center justify-between p-3 pl-12 hover:bg-blue-50 border-b border-slate-50 transition-colors" onClick={() => addVariantToTable(v, product.name)}>
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

                <Button size="sm" onClick={() => setShowDropdown(!showDropdown)} className="bg-blue-600 hover:bg-blue-700 text-white font-black text-[11px] uppercase h-10 px-4 rounded-none"><Plus size={16} className="mr-1"/> Thêm hàng</Button>
             </div>

             <div className="overflow-x-auto">
               <Table>
                  <TableHeader className="bg-slate-50">
                     <TableRow>
                        <TableHead className="w-[40px] text-[10px] font-black uppercase text-slate-500 text-center tracking-wider">#</TableHead>
                        <TableHead className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Mã SKU</TableHead>
                        <TableHead className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Tên sản phẩm</TableHead>
                        <TableHead className="text-right text-[10px] font-black uppercase text-blue-600 w-[110px] tracking-wider">SL Xuất</TableHead>
                        {exportType === "RETURN" && (
                          <TableHead className="text-[10px] font-black uppercase text-rose-600 min-w-[200px] tracking-wider">Lý do trả hàng</TableHead>
                        )}
                        <TableHead className="text-right text-[10px] font-black uppercase text-slate-500 tracking-wider">Đơn giá</TableHead>
                        <TableHead className="w-[50px]"></TableHead>
                     </TableRow>
                  </TableHeader>
                  <TableBody>
                     {items.length === 0 ? (
                        <TableRow><TableCell colSpan={exportType === "RETURN" ? 7 : 6} className="h-[150px] text-center text-slate-300 italic font-medium tracking-widest uppercase text-[11px]">Chưa có sản phẩm nào được chọn</TableCell></TableRow>
                     ) : (
                       items.map((item, index) => (
                         <TableRow key={item.id} className="hover:bg-slate-50/50">
                            <TableCell className="text-center text-slate-400 font-bold text-[11px]">{index + 1}</TableCell>
                            <TableCell className="font-mono text-[12px] text-slate-500">{item.sku}</TableCell>
                            <TableCell className="font-bold text-[13px] text-slate-700">{item.name}</TableCell>
                            <TableCell className="p-1">
                               <Input type="number" value={item.quantity} onChange={(e) => updateItem(item.id, "quantity", parseInt(e.target.value))} className="h-8 text-right font-black border-blue-200 rounded-none text-blue-600 focus:bg-white" />
                            </TableCell>
                            {exportType === "RETURN" && (
                              <TableCell className="p-1">
                                <Input placeholder="Nhập lý do lỗi, hết hạn..." value={item.returnReason} onChange={(e) => updateItem(item.id, "returnReason", e.target.value)} className="h-8 text-[12px] border-rose-100 rounded-none focus:border-rose-400 focus:bg-white" />
                              </TableCell>
                            )}
                            <TableCell className="text-right text-[12px] font-medium">{formatNumber(item.price)}</TableCell>
                            <TableCell className="text-center">
                               <button onClick={() => setItems(items.filter(i => i.id !== item.id))} className="text-slate-300 hover:text-red-500 transition-colors"><Trash2 size={16}/></button>
                            </TableCell>
                         </TableRow>
                       ))
                     )}
                  </TableBody>
               </Table>
             </div>
          </div>
        </div>

        <div className="lg:col-span-4 space-y-5">
          {/* 3. NGƯỜI TẠO PHIẾU - CHỈ GIỮ LẠI TÊN */}
          <div className="bg-white border border-slate-200 p-6 shadow-sm space-y-4">
             <div className="flex items-center gap-2 font-bold text-[11px] uppercase border-b pb-2">
                <BadgeCheck size={16} className="text-blue-600"/> Người tạo phiếu
             </div>
             <div className="space-y-1.5 flex flex-col">
                <Label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Tên nhân viên</Label>
                <Input
                  value={form.creatorName}
                  readOnly // Khóa cứng
                  className="rounded-none text-[13px] h-10 w-full border-slate-200 bg-slate-50 text-slate-500 font-bold cursor-not-allowed shadow-none"
                />
             </div>
          </div>

          {/* 4. Kho xuất */}
          <div className="bg-white border border-slate-200 p-6 shadow-sm space-y-4">
             <div className="flex items-center gap-2 font-bold text-[11px] uppercase border-b pb-2"><Warehouse size={16}/> Kho xuất hàng</div>
             <div className="space-y-1.5 flex flex-col">
                <Label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Chọn chi nhánh xuất hàng</Label>
                <Select value={selectedBranchId} onValueChange={setSelectedBranchId}>
                   <SelectTrigger className="rounded-none font-bold h-10 w-full border-slate-200 shadow-none"><SelectValue placeholder="-- Chọn kho xuất --" /></SelectTrigger>
                   <SelectContent className="rounded-none">{branches.map(b => <SelectItem key={b.id} value={b.id.toString()}>{b.name.toUpperCase()}</SelectItem>)}</SelectContent>
                </Select>
             </div>
             <div className="space-y-1.5 pt-1">
                <Label className="text-[10px] font-bold uppercase text-rose-500 flex items-center gap-1 mb-1 tracking-wider"><MapPin size={12} /> Địa chỉ kho xuất</Label>
                <Textarea readOnly value={selectedBranchAddress} className="min-h-[40px] text-[12px] border-[#e2e8f0] rounded-none bg-slate-50/80 resize-none text-slate-600 focus-visible:ring-0 focus-visible:ring-offset-0 cursor-default w-full shadow-none" placeholder="Địa chỉ tự động hiển thị..."/>
             </div>
          </div>

          {/* 5. Đối tượng nhận */}
          <div className="bg-white border border-slate-200 p-6 shadow-sm space-y-4">
             <div className="flex items-center gap-2 font-bold text-[11px] uppercase border-b pb-2"><UserCheck size={16}/> Đối tượng nhận</div>
             <div className="space-y-1.5 flex flex-col">
                <Label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Chọn đối tượng nhận (*)</Label>
                <Select value={selectedTargetId} onValueChange={setSelectedTargetId}>
                   <SelectTrigger className="rounded-none h-10 w-full font-bold border-slate-200 shadow-none"><SelectValue placeholder="-- Chọn đối tượng --" /></SelectTrigger>
                   <SelectContent className="rounded-none">
                      {exportType === "INTERNAL"
                        ? branches.filter(b => b.id?.toString() !== selectedBranchId).map(b => <SelectItem key={b.id} value={b.id.toString()}>{b.name.toUpperCase()}</SelectItem>)
                        : suppliers.map(s => <SelectItem key={s.id} value={s?.id?.toString() || ""}>{s.name?.toUpperCase()}</SelectItem>)
                      }
                   </SelectContent>
                </Select>
             </div>
             {selectedTargetId && (
                 <div className="bg-blue-50/50 p-3 border border-blue-100 space-y-2 mt-2 rounded-sm w-full">
                     <div className="flex items-center gap-2 text-[12px] text-slate-700"><User size={14} className="text-blue-500" /><span className="font-bold tracking-tight">{targetInfo.name}</span></div>
                     <div className="flex items-center gap-2 text-[12px] text-slate-700"><Phone size={14} className="text-green-500" /><span className="font-bold tracking-tight">{targetInfo.phone}</span></div>
                 </div>
             )}
             <div className="space-y-1.5 pt-2 flex flex-col">
                 <Label className="text-[10px] font-bold uppercase text-slate-400 mb-1 tracking-wider">Tên người nhận cụ thể</Label>
                 <Input value={form.specificReceiver} onChange={e => setForm({...form, specificReceiver: e.target.value})} className="rounded-none text-[13px] h-10 w-full border-slate-200 shadow-none" placeholder="Tên người đại diện nhận..." />
             </div>
             <div className="space-y-1.5 flex flex-col">
                 <Label className="text-[10px] font-bold uppercase text-slate-400 mb-1 tracking-wider">Địa chỉ giao hàng chi tiết</Label>
                 <Textarea value={form.shippingAddress} onChange={e => setForm({...form, shippingAddress: e.target.value})} className="rounded-none min-h-[60px] text-[13px] w-full border-slate-200 shadow-none" placeholder="Địa chỉ giao hàng thực tế..." />
             </div>
          </div>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="fixed bottom-0 left-0 lg:left-[260px] right-0 bg-white border-t p-3 flex justify-end gap-3 z-[999] shadow-[0_-4px_20px_rgba(0,0,0,0.1)]">
         <Button variant="outline" className="rounded-none uppercase px-8 border-slate-300" onClick={() => router.back()}>Hủy bỏ</Button>
         <Button onClick={handleCreate} className="bg-blue-600 hover:bg-blue-700 text-white rounded-none uppercase font-black px-10 transition-all shadow-lg active:scale-95"><Save size={18} className="mr-2"/> Tạo lệnh xuất</Button>
      </div>
    </div>
  );
}