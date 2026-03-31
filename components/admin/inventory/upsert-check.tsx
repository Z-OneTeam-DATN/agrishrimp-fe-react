"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  X,
  ChevronLeft,
  Save,
  Calendar,
  Building2,
  User,
  Box,
  Trash2,
  Plus,
  Loader2,
  Search,
  ClipboardCheck,
  AlertCircle,
  FileText,
  Hash,
  CheckCircle2,
  Pencil,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { toast } from "sonner";
import { cn, formatNumber } from "@/lib/utils";
import { branchService } from "@/app/services/branchService";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { InventoryCheckApiService } from "@/app/services/inventory.service";
import { ProductService } from "@/app/services/product.service";
import { EmployeeService } from "@/app/services/employee.service";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { usePermissions } from "@/hooks/usePermissions";
import { P } from "@/lib/permissions";

interface InventoryUpsertProps {
  mode: "create" | "edit" | "view";
  initialData?: any;
  code?: string;
}

const generatePKKCode = () => {
  const now = new Date();
  const dateStr = now.getFullYear().toString() + 
                  (now.getMonth() + 1).toString().padStart(2, '0') + 
                  now.getDate().toString().padStart(2, '0');
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `PKK-${dateStr}${random}`;
};

export default function InventoryUpsert({ mode, initialData, code }: InventoryUpsertProps) {
  const router = useRouter();
  const { data: user } = useCurrentUser();
  const { hasPermission } = usePermissions();
  
  const [loading, setLoading] = useState(mode !== "create");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [branches, setBranches] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  
  // 1. General Info State
  const [formData, setFormData] = useState({
    type: initialData?.type || "PERIODIC",
    branchId: initialData?.branchId?.toString() || "",
    code: initialData?.code || code || (mode === "create" ? generatePKKCode() : "---"),
    checkDate: initialData?.checkDate || new Date().toISOString().split("T")[0],
    checkedBy: initialData?.checkedBy || "",
    createdByName: initialData?.createdByName || user?.fullName || "Admin",
    note: initialData?.note || "",
  });

  // 2. Items State
  const [items, setItems] = useState<any[]>(initialData?.details || []);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const [status, setStatus] = useState(initialData?.status || "PENDING");

  useEffect(() => {
    fetchBranches();
    if (mode !== "create" && !initialData && code) {
      fetchDetail();
    }
  }, [code]);

  useEffect(() => {
    fetchEmployees(formData.branchId);
  }, [formData.branchId]);

  const fetchBranches = async () => {
    try {
      const res = await branchService.getAll();
      const list = Array.isArray(res) ? res : (res?.data || res?.content || []);
      setBranches(list);
      if (mode === "create" && list.length > 0 && !formData.branchId) {
        setFormData(prev => ({ ...prev, branchId: list[0].id.toString() }));
      }
    } catch (error) {
      toast.error("Không thể tải danh sách chi nhánh");
    }
  };

  const fetchEmployees = async (branchId?: string) => {
    try {
      const params: any = { status: "ACTIVE", size: 500 };
      if (branchId) params.branchId = Number(branchId);
      const res = await EmployeeService.getAll(params);
      const list = Array.isArray(res) ? (res) : (res?.content || res?.data || []);
      
      // Lọc bỏ user và customer (người kiểm kê phải là nhân viên)
      const filtered = list.filter((emp: any) => {
        const roleSlug = emp.role?.slug?.toLowerCase() || "";
        return roleSlug !== "user" && roleSlug !== "customer";
      });

      setEmployees(filtered);
    } catch (error) {
      console.error("Error fetching employees:", error);
    }
  };

  const fetchDetail = async () => {
    try {
      setLoading(true);
      const res = await InventoryCheckApiService.getDetail(code!);
      
      // Ensure date is in YYYY-MM-DD format for input type="date"
      const formattedDate = res.checkDate 
        ? res.checkDate.split("T")[0] 
        : (res.createdAt ? res.createdAt.split("T")[0] : new Date().toISOString().split("T")[0]);

      setFormData({
        type: res.type || "PERIODIC",
        branchId: res.branchId?.toString() || "",
        code: res.code || code || "---",
        checkDate: formattedDate,
        checkedBy: res.checkedBy || "",
        createdByName: res.createdByName || "Admin",
        note: res.note || "",
      });
      
      // Mapping logic to ensure display fields match table keys based on BE update
      const mappedItems = (res.details || []).map((item: any) => ({
        productVariantId: item.productVariantId,
        name: item.name || item.productName || "N/A", // BE says use 'name'
        sku: item.sku || "N/A",
        unit: item.unit || "Cái",
        systemQuantity: item.systemQuantity || 0,
        actualQuantity: item.quantityReal || 0, // BE returns quantityReal
        reason: item.note || "", // BE returns item-level note as reason
      }));
      
      setItems(mappedItems);
      setStatus(res.status || "PENDING");
    } catch (error) {
      console.error("Error fetching detail:", error);
      toast.error("Không thể tải chi tiết phiếu");
    } finally {
      setLoading(false);
    }
  };

  const handleSearchProduct = async (term: string) => {
    if (!term.trim()) {
      setSearchResults([]);
      return;
    }
    if (!formData.branchId) {
      toast.warning("Vui lòng chọn kho trước khi tìm sản phẩm");
      return;
    }
    setIsSearching(true);
    try {
      // Dùng lại hàm tìm kiếm của Nhập kho (ProductService.searchVariants)
      const data = await ProductService.searchVariants(term, formData.branchId);
      const productList = Array.isArray(data) ? data : (data?.data || data?.content || []);
      setSearchResults(productList);
    } catch (error) {
      console.error(error);
      toast.error("Không thể tìm kiếm sản phẩm");
    } finally {
      setIsSearching(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchTerm) handleSearchProduct(searchTerm);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm, formData.branchId]);

  const addItem = (variant: any) => {
    const exists = items.find(i => i.productVariantId === variant.id);
    if (exists) return toast.warning("Sản phẩm đã có trong danh sách");

    const newItem = {
      productVariantId: variant.id,
      name: variant.productName || variant.name,
      sku: variant.sku,
      unit: variant.unit || "Cái",
      systemQuantity: variant.quantity || 0, // 'quantity' từ searchVariants là số lượng tồn hiện tại
      actualQuantity: variant.quantity || 0,
      batchNumber: variant.batchNumber || "N/A",
      importPrice: variant.importPrice || 0,
      reason: "",
    };
    setItems([newItem, ...items]);
    setSearchTerm("");
    setSearchResults([]);
  };

  const updateItem = (index: number, field: string, value: any) => {
    const newItems = [...items];
    newItems[index][field] = value;
    setItems(newItems);
  };

  const handleSubmit = async () => {
    if (!formData.branchId) return toast.error("Vui lòng chọn kho");
    if (items.length === 0) return toast.error("Vui lòng thêm sản phẩm");

    setIsSubmitting(true);
    try {
      const payload: any = {
        branchId: Number(formData.branchId),
        type: formData.type,
        checkDate: new Date(formData.checkDate).toISOString(),
        checkedBy: formData.checkedBy,
        note: formData.note,
        details: items.map(item => ({
          productVariantId: item.productVariantId,
          batchNumber: item.batchNumber || "N/A",
          importPrice: item.importPrice || 0,
          systemQuantity: Number(item.systemQuantity), // Gửi kèm số tồn hệ thống lúc tạo
          quantityReal: Number(item.actualQuantity),
          note: item.reason
        }))
      };

      // Handle Update if code/initialData exists
      if (mode === "edit" || (mode === "view" && initialData?.id)) {
        payload.id = initialData?.id;
      }

      await InventoryCheckApiService.saveCheck(payload);
      toast.success(payload.id ? "Cập nhật phiếu thành công" : "Tạo phiếu kiểm kê thành công");
      router.push("/admin/inventory-checks");
    } catch (error) {
      toast.error("Lỗi khi lưu dữ liệu");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleComplete = async () => {
    // Attempt to get ID from initialData or fetch it by code
    const checkId = initialData?.id || (await InventoryCheckApiService.getDetail(formData.code)).id;
    if (!checkId) return toast.error("Không tìm thấy ID phiếu để chốt");
    
    setIsSubmitting(true);
    try {
      await InventoryCheckApiService.completeCheck(checkId);
      toast.success("Đã chốt phiếu và cân bằng kho thành công");
      router.push("/admin/inventory-checks");
    } catch (error) {
      toast.error("Lỗi khi chốt phiếu");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin text-blue-600" /></div>;

  return (
    <div className="min-h-screen bg-[#f8fafc] pb-20">
      {/* Action Bar */}
      <div className="sticky top-0 z-40 bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500" onClick={() => router.push("/admin/inventory-checks")}>
            <ChevronLeft size={20} />
          </Button>
          <div>
            <h1 className="text-md font-black text-slate-800 uppercase flex items-center gap-2">
              {mode === "create" ? "Tạo phiếu kiểm kê" : mode === "edit" ? `Chỉnh sửa phiếu: ${formData.code}` : `Chi tiết phiếu: ${formData.code}`}
              {mode === "view" && <Badge className="bg-emerald-50 text-emerald-600 border-emerald-100 text-[9px]">VIEW ONLY</Badge>}
              {mode === "edit" && <Badge className="bg-amber-50 text-amber-600 border-amber-100 text-[9px]">EDIT MODE</Badge>}
            </h1>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="h-8 text-[11px] font-bold uppercase" onClick={() => router.back()}>Hủy</Button>
          {mode === "view" && status === "PENDING" && (
            <>
              {hasPermission(P.CHECK_UPDATE) && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="h-8 border-amber-200 text-amber-600 hover:bg-amber-50 text-[11px] font-bold uppercase px-4" 
                  onClick={() => router.push(`/admin/inventory-checks/${formData.code}?edit=true`)}
                >
                  <Pencil size={14} className="mr-2" />
                  Sửa phiếu
                </Button>
              )}
              {hasPermission(P.CHECK_APPROVE) && (
                <Button size="sm" className="h-8 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold uppercase px-4" onClick={handleComplete} disabled={isSubmitting}>
                  {isSubmitting ? <Loader2 className="animate-spin mr-2" size={14} /> : <CheckCircle2 size={14} className="mr-2" />}
                  Chốt phiếu
                </Button>
              )}
            </>
          )}
          {mode !== "view" && (
            <Button size="sm" className="h-8 bg-blue-600 text-white text-[11px] font-bold uppercase px-4" onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="animate-spin mr-2" size={14} /> : <Save size={14} className="mr-2" />}
              Lưu phiếu
            </Button>
          )}
        </div>
      </div>

      <div className="max-w-[1400px] mx-auto p-6 space-y-6">
        {/* 1. General Info */}
        <Card className="border-none shadow-sm p-5 bg-white">
          <div className="flex items-center gap-2 mb-4 border-b border-slate-50 pb-3">
             <div className="w-1 h-4 bg-blue-600 rounded-full" />
             <h3 className="text-[12px] font-black text-slate-800 uppercase tracking-wider">1. Thông tin chung</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-5">
            <div className="space-y-1.5">
              <Label className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">Loại kiểm kê</Label>
              <Select disabled={mode === "view"} value={formData.type} onValueChange={(v) => setFormData({...formData, type: v})}>
                <SelectTrigger className="h-8 text-[12px] border-slate-200 bg-slate-50/50">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PERIODIC">Định kỳ</SelectItem>
                  <SelectItem value="UNEXPECTED">Đột xuất</SelectItem>
                  <SelectItem value="YEAR_END">Cuối năm</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">Kho kiểm kê</Label>
              <Select disabled={mode !== "create"} value={formData.branchId} onValueChange={(v) => setFormData({...formData, branchId: v})}>
                <SelectTrigger className="h-8 text-[12px] border-slate-200 bg-slate-50/50">
                   <div className="flex items-center gap-2 truncate">
                      <Building2 size={12} className="text-slate-400" />
                      <SelectValue placeholder="Chọn kho" />
                   </div>
                </SelectTrigger>
                <SelectContent>
                  {branches.map(b => <SelectItem key={b.id} value={b.id.toString()}>{b.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">Số chứng từ</Label>
              <div className="h-8 flex items-center px-3 rounded-md bg-slate-100 border border-slate-200 text-[12px] font-black text-slate-600">
                <Hash size={12} className="mr-2 text-slate-400" /> {formData.code}
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">Ngày kiểm kê</Label>
              <Input 
                type="date" 
                disabled={mode === "view"}
                className="h-8 text-[12px] border-slate-200 bg-slate-50/50" 
                value={formData.checkDate}
                onChange={(e) => setFormData({...formData, checkDate: e.target.value})}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">Người kiểm kê</Label>
              <Select 
                disabled={mode === "view"} 
                value={formData.checkedBy.split(", ")[0]} 
                onValueChange={(v) => {
                  const emp = employees.find(e => e.fullName === v || e.employeeCode === v || e.email === v);
                  const name = emp ? emp.fullName : v;
                  if (formData.checkedBy.includes(name)) return;
                  const newVal = formData.checkedBy ? `${formData.checkedBy}, ${name}` : name;
                  setFormData({...formData, checkedBy: newVal});
                }}
              >
                <SelectTrigger className="h-8 text-[12px] border-slate-200 bg-slate-50/50">
                  <SelectValue placeholder="Chọn người kiểm" />
                </SelectTrigger>
                <SelectContent>
                   {employees.map(e => (
                     <SelectItem key={e.id} value={e.fullName}>{e.fullName} ({e.employeeCode || e.email})</SelectItem>
                   ))}
                </SelectContent>
              </Select>
              {formData.checkedBy && (
                <div className="flex flex-wrap gap-1 mt-1">
                  {formData.checkedBy.split(", ").filter(Boolean).map((n, i) => (
                    <Badge key={i} variant="secondary" className="text-[9px] py-0 h-4 flex items-center gap-1">
                      {n}
                      {mode !== "view" && (
                        <X 
                          size={10} 
                          className="cursor-pointer hover:text-rose-500" 
                          onClick={() => {
                            const filtered = formData.checkedBy.split(", ").filter(name => name !== n).join(", ");
                            setFormData({...formData, checkedBy: filtered});
                          }}
                        />
                      )}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
            <div className="space-y-1.5">
              <Label className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">Người tạo phiếu</Label>
              <div className="h-8 flex items-center px-3 rounded-md bg-slate-100 border border-slate-200 text-[12px] font-bold text-slate-500">
                <User size={12} className="mr-2 text-slate-400" /> {formData.createdByName}
              </div>
            </div>
          </div>
          <div className="mt-4 space-y-1.5">
              <Label className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">Ghi chú phiếu</Label>
              <Input 
                disabled={mode === "view"}
                placeholder="Nội dung đợt kiểm kê..."
                className="h-8 text-[12px] border-slate-200 bg-slate-50/50" 
                value={formData.note}
                onChange={(e) => setFormData({...formData, note: e.target.value})}
              />
          </div>
        </Card>

        {/* 2. Inventory Items */}
        <Card className="border-none shadow-sm bg-white overflow-hidden min-h-[400px]">
          <div className="p-5 flex flex-col h-full">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                 <div className="w-1 h-4 bg-blue-600 rounded-full" />
                 <h3 className="text-[12px] font-black text-slate-800 uppercase tracking-wider">2. Sản phẩm kiểm kê</h3>
                 <Badge className="bg-slate-100 text-slate-500 text-[10px] border-none font-bold uppercase ml-2">{items.length}</Badge>
              </div>
              
              {mode !== "view" && (
                <div className="relative w-[400px]">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                  <Input 
                    placeholder="Tìm sản phẩm thêm vào phiếu (F2)..." 
                    className="h-9 pl-9 text-[12px] border-blue-100 bg-blue-50/20 focus:ring-blue-500"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  {searchResults.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 shadow-xl rounded-lg z-50 max-h-[300px] overflow-auto divide-y divide-slate-50">
                      {searchResults.map(p => (
                        <div key={p.id} className="p-2.5 hover:bg-blue-50 cursor-pointer flex justify-between items-center group" onClick={() => addItem(p)}>
                          <div className="flex flex-col">
                            <span className="text-[12px] font-black text-slate-700">{p.productName || p.name}</span>
                            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">SKU: {p.sku} | Tồn: <span className="text-blue-600">{p.quantity}</span></span>
                          </div>
                          <Plus size={14} className="text-blue-500 opacity-0 group-hover:opacity-100" />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="border border-slate-100 rounded-lg overflow-hidden">
              <Table>
                <TableHeader className="bg-slate-50/50">
                  <TableRow className="hover:bg-transparent border-b border-slate-100">
                    <TableHead className="w-[50px] text-[10px] font-black uppercase text-slate-400 text-center">STT</TableHead>
                    <TableHead className="w-[140px] text-[10px] font-black uppercase text-slate-400">Mã biến thể</TableHead>
                    <TableHead className="text-[10px] font-black uppercase text-slate-400">Tên biến thể</TableHead>
                    <TableHead className="w-[70px] text-[10px] font-black uppercase text-slate-400 text-center">ĐVT</TableHead>
                    <TableHead className="w-[110px] text-right text-[10px] font-black uppercase text-blue-600">Số lượng tồn</TableHead>
                    <TableHead className="w-[110px] text-right text-[10px] font-black uppercase text-emerald-600">Kiểm kê</TableHead>
                    <TableHead className="w-[110px] text-right text-[10px] font-black uppercase text-slate-400">Chênh lệch</TableHead>
                    <TableHead className="w-[200px] text-center text-[10px] font-black uppercase text-slate-400">Nguyên nhân</TableHead>
                    {mode !== "view" && <TableHead className="w-[40px]"></TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={mode === "view" ? 8 : 9} className="h-40 text-center text-slate-300">
                        <div className="flex flex-col items-center gap-2">
                           <Box size={40} className="opacity-20" />
                           <p className="text-[11px] font-black uppercase tracking-widest opacity-50">Chưa có sản phẩm</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    items.map((item, index) => {
                      const diff = Number(item.actualQuantity || 0) - Number(item.systemQuantity || 0);
                      return (
                        <TableRow key={index} className="hover:bg-slate-50/30 border-b border-slate-50">
                          <TableCell className="text-center text-[11px] font-bold text-slate-400">{index + 1}</TableCell>
                          <TableCell className="text-[12px] font-mono font-bold text-slate-600 uppercase">{item.sku}</TableCell>
                          <TableCell className="text-[12px] font-black text-slate-700">{item.name}</TableCell>
                          <TableCell className="text-center text-[12px] font-bold text-slate-500">{item.unit}</TableCell>
                          <TableCell className="text-right text-[13px] font-black text-blue-700">{item.systemQuantity}</TableCell>
                          <TableCell className="text-right">
                            <Input 
                              type="number"
                              disabled={mode === "view"}
                              className="h-7 w-20 ml-auto text-right text-[13px] font-black text-emerald-700 border-emerald-100 bg-emerald-50/20"
                              value={item.actualQuantity}
                              onChange={(e) => updateItem(index, "actualQuantity", e.target.value)}
                            />
                          </TableCell>
                          <TableCell className="text-right">
                            <span className={cn(
                              "text-[12px] font-black",
                              diff > 0 ? "text-blue-600" : diff < 0 ? "text-rose-600" : "text-slate-300"
                            )}>
                              {diff > 0 ? `+${diff}` : diff}
                            </span>
                          </TableCell>
                          <TableCell>
                             <Input 
                                disabled={mode === "view"}
                                placeholder="Lý do chênh lệch..."
                                className="h-7 text-[11px] border-slate-100"
                                value={item.reason}
                                onChange={(e) => updateItem(index, "reason", e.target.value)}
                             />
                          </TableCell>
                          {mode !== "view" && (
                            <TableCell>
                              <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-300 hover:text-rose-500" onClick={() => setItems(items.filter((_, i) => i !== index))}>
                                <X size={14} />
                              </Button>
                            </TableCell>
                          )}
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
