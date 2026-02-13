"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
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
  CheckCircle2,
  AlertCircle,
  ArrowUpFromLine,
  ChevronLeft,
  Save,
  ScanBarcode,
  ListPlus,
  MapPin,
  Building2,
  Warehouse,
  ShoppingBag,
  Users,
  UserCheck
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
  SelectValue 
} from "@/components/ui/select";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { toast } from "sonner";
import { cn, formatNumber } from "@/lib/utils";

type ExportType = "SELL" | "INTERNAL" | "WASTE" | "RETURN";

export default function NewExportCommandPage() {
  const router = useRouter();
  
  const [exportType, setExportType] = useState<ExportType>("SELL");
  const [items, setItems] = useState<any[]>([]);
  
  const steps = [
    { label: "Khởi tạo", status: "active", icon: Plus },
    { label: "Chờ duyệt", status: "upcoming", icon: FileText },
    { label: "Đang xử lý", status: "upcoming", icon: Truck },
    { label: "Hoàn thành", status: "upcoming", icon: CheckCircle2 },
  ];

  const addNewItem = () => {
    const newItem = {
      id: Date.now(),
      sku: "SKU-" + Math.floor(Math.random() * 1000),
      name: "Sản phẩm mới",
      unit: "Cái",
      stock: 100,
      quantity: 0,
      price: 50000,
      note: ""
    };
    setItems([...items, newItem]);
  };

  const removeItem = (id: number) => {
    setItems(items.filter(item => item.id !== id));
  };

  const updateItem = (id: number, field: string, value: any) => {
    setItems(items.map(item => {
      if (item.id === id) {
        if (field === "quantity" && value > item.stock) {
          toast.error("Số lượng vượt quá tồn kho!");
        }
        return { ...item, [field]: value };
      }
      return item;
    }));
  };

  const handleCreate = () => {
    if (items.length === 0) {
      toast.error("Vui lòng thêm ít nhất một sản phẩm.");
      return;
    }
    toast.success("Đã tạo lệnh xuất kho thành công!");
    router.push("/admin/exports");
  };

  return (
    <div className="space-y-4 pb-[100px] bg-slate-50/30 p-4 min-h-screen">
      {/* Page Header */}
      <div className="flex items-center gap-4 mb-2 px-1">
        <Button type="button" variant="ghost" size="icon" onClick={() => router.back()} className="h-8 w-8 text-slate-400">
          <ChevronLeft size={20} />
        </Button>
        <div className="flex flex-col">
          <h1 className="text-[18px] font-black text-[#1f1f1f] tracking-tight uppercase">
            Tạo lệnh xuất kho
          </h1>
          <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">Phiếu mới: LXK-{new Date().getFullYear()}{new Date().getMonth() + 1}-001</p>
        </div>
        
        <div className="ms-auto flex items-center gap-3 text-gray-400">
          <Settings size={18} className="cursor-pointer hover:text-blue-600 transition-colors" />
          <HelpCircle size={18} className="cursor-pointer hover:text-blue-600 transition-colors" />
          <Button type="button" variant="ghost" size="icon" onClick={() => router.back()} className="h-8 w-8"><X size={20} /></Button>
        </div>
      </div>

      {/* Stepper Bar */}
      <div className="bg-white border border-[#dcdcdc] p-6 rounded-none shadow-sm mb-4">
        <div className="flex items-center justify-between max-w-4xl mx-auto">
          {steps.map((step, idx) => (
            <React.Fragment key={idx}>
              <div className="flex flex-col items-center gap-2 relative z-10">
                <div className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300",
                  step.status === "completed" ? "bg-emerald-500 border-emerald-500 text-white" :
                  step.status === "active" ? "bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-100" :
                  "bg-slate-50 border-slate-200 text-slate-300"
                )}><step.icon size={20} /></div>
                <span className={cn("text-[10px] font-black uppercase tracking-tighter", step.status === "active" ? "text-blue-600" : "text-slate-400")}>{step.label}</span>
              </div>
              {idx < steps.length - 1 && <div className="flex-1 h-[3px] bg-slate-100 mx-2 -mt-6 relative" />}
            </React.Fragment>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="lg:col-span-8 space-y-5">
          {/* Main Info Form */}
          <div className="bg-white border border-[#dcdcdc] p-6 rounded-none shadow-sm">
            <div className="flex items-center gap-2 mb-6 text-blue-700 font-black text-[11px] uppercase tracking-widest border-b pb-3">
              <FileText size={16} /> 1. Thông tin lệnh xuất kho
            </div>
            <div className="grid grid-cols-1 md:grid-cols-12 gap-x-6 gap-y-5">
              <div className="md:col-span-6 space-y-1.5">
                <Label className="text-[10px] font-black text-slate-500 uppercase tracking-tight">Loại lệnh xuất (*)</Label>
                <Select value={exportType} onValueChange={(v: any) => setExportType(v)}>
                  <SelectTrigger className="h-[34px] border-[#ccc] rounded-none focus:ring-0">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-none">
                    <SelectItem value="SELL">Xuất bán hàng</SelectItem>
                    <SelectItem value="INTERNAL">Xuất dùng nội bộ</SelectItem>
                    <SelectItem value="WASTE">Xuất hủy hàng hỏng</SelectItem>
                    <SelectItem value="RETURN">Xuất trả nhà cung cấp</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="md:col-span-6 space-y-1.5">
                <Label className="text-[10px] font-black text-slate-400 uppercase tracking-tight">Mã phiếu (Tự động)</Label>
                <Input disabled value="LXK-2602-001" className="h-[34px] border-[#ccc] rounded-none bg-slate-50 font-mono" />
              </div>
              <div className="md:col-span-12 space-y-1.5">
                <Label className="text-[10px] font-black text-slate-500 uppercase tracking-tight">Lý do / Diễn giải</Label>
                <Textarea placeholder="Nhập lý do xuất kho..." className="min-h-[80px] text-[13px] border-[#ccc] rounded-none focus:border-blue-500 shadow-none resize-none" />
              </div>
              <div className="md:col-span-6 space-y-1.5">
                <Label className="text-[10px] font-black text-slate-500 uppercase tracking-tight">Tham chiếu (Mã đơn hàng, Hợp đồng...)</Label>
                <Input className="h-[34px] border-[#ccc] rounded-none focus:border-blue-500" placeholder="Nhập mã tham chiếu..." />
              </div>
              <div className="md:col-span-6 space-y-1.5">
                <Label className="text-[10px] font-black text-blue-600 uppercase tracking-tight">Ngày hẹn xuất</Label>
                <Input type="date" className="h-[34px] border-[#ccc] rounded-none focus:border-blue-500" defaultValue={new Date().toISOString().split('T')[0]} />
              </div>
            </div>
          </div>

          {/* Product Grid */}
          <div className="bg-white border border-[#dcdcdc] rounded-none shadow-sm overflow-hidden">
            <div className="px-5 py-3 border-b border-[#eee] bg-[#f8f9fa] flex flex-wrap items-center justify-between gap-4">
              <h3 className="text-[11px] font-black text-slate-700 uppercase flex items-center gap-2 tracking-wider whitespace-nowrap">
                <ShoppingBag size={16} className="text-blue-600" /> 2. Danh mục sản phẩm xuất kho
              </h3>
              
              <div className="flex flex-1 items-center gap-2 min-w-[300px] max-w-[500px]">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <Input 
                    placeholder="Tìm theo tên, SKU, barcode (F3)..."
                    className="pl-10 h-9 text-[13px] border-slate-200 rounded-none focus:border-blue-500 shadow-none bg-white"
                  />
                </div>
                <Button type="button" variant="outline" className="h-9 text-[12px] border-slate-200 rounded-none px-3 font-bold text-slate-600">
                  <ScanBarcode size={16} className="mr-1.5" /> Quét mã
                </Button>
              </div>

              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={addNewItem} className="h-9 text-[10px] font-black text-blue-600 border-blue-200 rounded-none uppercase px-4"><Plus size={14} className="mr-1" /> Thêm hàng</Button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <Table className="table-custom border-collapse min-w-[1000px]">
                <TableHeader>
                  <TableRow className="bg-slate-50 border-b border-[#ccc]">
                    <TableHead className="w-[40px] text-center p-2 text-[10px] font-black uppercase text-slate-500">#</TableHead>
                    <TableHead className="w-[120px] p-2 text-[10px] font-black uppercase text-slate-500">Mã SKU</TableHead>
                    <TableHead className="p-2 text-[10px] font-black uppercase text-slate-500">Tên sản phẩm</TableHead>
                    <TableHead className="w-[80px] p-2 text-[10px] font-black uppercase text-slate-500">ĐVT</TableHead>
                    <TableHead className="w-[100px] text-right p-2 text-[10px] font-black uppercase text-slate-500">Tồn kho</TableHead>
                    <TableHead className="w-[120px] text-right p-2 text-[10px] font-black uppercase text-blue-600">SL Yêu cầu</TableHead>
                    <TableHead className="w-[120px] text-right p-2 text-[10px] font-black uppercase text-slate-500">Đơn giá</TableHead>
                    <TableHead className="w-[150px] p-2 text-[10px] font-black uppercase text-slate-500">Ghi chú dòng</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item, index) => (
                    <TableRow key={item.id} className="border-b border-slate-100 hover:bg-blue-50/20 transition-colors">
                      <TableCell className="text-center text-slate-400 font-bold text-[11px]">{index + 1}</TableCell>
                      <TableCell className="p-2 font-mono text-[12px]">{item.sku}</TableCell>
                      <TableCell className="p-2 font-bold text-[13px] text-slate-700">{item.name}</TableCell>
                      <TableCell className="p-2 text-center text-[12px] text-slate-500">{item.unit}</TableCell>
                      <TableCell className="p-2 text-right font-bold text-slate-500">{item.stock}</TableCell>
                      <TableCell className="p-1">
                        <Input 
                          type="number" 
                          value={item.quantity}
                          onChange={(e) => updateItem(item.id, "quantity", parseInt(e.target.value))}
                          className={cn(
                            "h-8 text-right font-black text-[13px] border-blue-200 bg-blue-50/30 rounded-none text-blue-700",
                            item.quantity > item.stock && "border-rose-500 bg-rose-50 text-rose-600"
                          )}
                        />
                      </TableCell>
                      <TableCell className="p-2 text-right text-[12px] font-medium">{formatNumber(item.price)}</TableCell>
                      <TableCell className="p-1">
                        <Input 
                          placeholder="..." 
                          value={item.note}
                          onChange={(e) => updateItem(item.id, "note", e.target.value)}
                          className="h-8 text-[11px] border-none bg-transparent focus:ring-0 italic" 
                        />
                      </TableCell>
                      <TableCell className="p-1 text-center">
                        <button onClick={() => removeItem(item.id)} className="text-slate-300 hover:text-rose-500 transition-colors">
                          <Trash2 size={16} />
                        </button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            {items.length === 0 && (
              <div className="py-16 flex flex-col items-center justify-center bg-white space-y-4">
                <div className="w-16 h-16 bg-slate-50 flex items-center justify-center rounded-full border-2 border-dashed border-slate-200">
                  <ShoppingBag size={24} className="text-slate-300" />
                </div>
                <p className="text-[13px] font-black text-slate-400 uppercase tracking-widest text-center">Chưa có sản phẩm nào được chọn</p>
                <Button type="button" onClick={addNewItem} className="bg-blue-600 hover:bg-blue-700 text-white font-black text-[11px] uppercase rounded-none shadow-lg shadow-blue-100 flex gap-2">
                  <ListPlus size={18} /> Chọn hàng từ danh mục
                </Button>
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-4 space-y-5">
          {/* Warehouse Source Selection */}
          <div className="bg-white border border-[#dcdcdc] p-6 rounded-none shadow-sm space-y-6">
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-4 text-slate-700 font-black text-[11px] uppercase tracking-widest border-b pb-2">
                <Warehouse size={16} className="text-blue-600" /> Kho xuất hàng
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] font-black text-slate-400 uppercase flex items-center gap-2"><Building2 size={12} /> Chi nhánh xuất</Label>
                <Select defaultValue="wh-hn">
                  <SelectTrigger className="h-8 text-[12px] border-[#eee] rounded-none font-bold focus:ring-0">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-none">
                    <SelectItem value="wh-hn">KHO TỔNG HÀ NỘI</SelectItem>
                    <SelectItem value="wh-lt">KHO LẠNH TRUNG TÂM</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] font-black text-slate-500 uppercase tracking-tight flex items-center gap-2"><MapPin size={12} className="text-rose-500" /> Địa chỉ kho xuất</Label>
                <Textarea readOnly value="123 Đường Láng, Đống Đa, Hà Nội" className="min-h-[60px] text-[12px] border-[#ccc] rounded-none bg-slate-50/50 resize-none" />
              </div>
            </div>
          </div>

          {/* Receiver Information - DYNAMIC */}
          <div className="bg-white border border-[#dcdcdc] p-6 rounded-none shadow-sm space-y-6">
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-4 text-slate-700 font-black text-[11px] uppercase tracking-widest border-b pb-2">
                <UserCheck size={16} className="text-emerald-600" /> Đối tượng nhận hàng
              </div>
              
              {exportType === "SELL" && (
                <div className="space-y-1.5 animate-in fade-in slide-in-from-top-1 duration-300">
                  <Label className="text-[10px] font-black text-slate-400 uppercase flex items-center gap-2"><Users size={12} /> Chọn Khách hàng</Label>
                  <Select defaultValue="kh-01">
                    <SelectTrigger className="h-8 text-[12px] border-[#eee] rounded-none font-bold focus:ring-0">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-none">
                      <SelectItem value="kh-01">LÊ VĂN CHÂU (KH0012)</SelectItem>
                      <SelectItem value="kh-02">NGUYỄN THỊ MAI (KH0045)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              {exportType === "INTERNAL" && (
                <div className="space-y-1.5 animate-in fade-in slide-in-from-top-1 duration-300">
                  <Label className="text-[10px] font-black text-slate-400 uppercase flex items-center gap-2"><Users size={12} /> Nhân viên / Phòng ban</Label>
                  <Select defaultValue="pb-mkt">
                    <SelectTrigger className="h-8 text-[12px] border-[#eee] rounded-none font-bold focus:ring-0">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-none">
                      <SelectItem value="pb-mkt">PHÒNG MARKETING</SelectItem>
                      <SelectItem value="pb-sale">PHÒNG KINH DOANH</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              {exportType === "RETURN" && (
                <div className="space-y-1.5 animate-in fade-in slide-in-from-top-1 duration-300">
                  <Label className="text-[10px] font-black text-slate-400 uppercase flex items-center gap-2"><Truck size={12} /> Nhà cung cấp</Label>
                  <Select defaultValue="ncc-01">
                    <SelectTrigger className="h-8 text-[12px] border-[#eee] rounded-none font-bold focus:ring-0">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-none">
                      <SelectItem value="ncc-01">CÔNG TY CP VIỆT NAM</SelectItem>
                      <SelectItem value="ncc-02">GROBEST VIỆT NAM</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              {exportType !== "WASTE" && (
                <>
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-black text-slate-500 uppercase tracking-tight flex items-center gap-2"><User size={12} className="text-blue-500" /> Người nhận cụ thể</Label>
                    <Input className="h-8 text-[12px] border-[#ccc] rounded-none focus:border-blue-500" placeholder="Tên người nhận..." />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-black text-slate-500 uppercase tracking-tight flex items-center gap-2"><MapPin size={12} className="text-emerald-500" /> Địa chỉ giao hàng</Label>
                    <Textarea placeholder="Địa chỉ chi tiết..." className="min-h-[60px] text-[12px] border-[#ccc] rounded-none focus:border-blue-500 resize-none bg-white" />
                  </div>
                </>
              )}

              {exportType === "WASTE" && (
                <div className="p-4 bg-rose-50 border border-rose-100 text-rose-700 rounded-none flex gap-3 animate-in fade-in duration-300">
                  <AlertCircle size={18} className="shrink-0" />
                  <p className="text-[11px] leading-relaxed font-bold italic">Lưu ý: Xuất hủy sẽ thực hiện giảm tồn ngay lập tức sau khi duyệt mà không cần đối tượng nhận.</p>
                </div>
              )}
            </div>
          </div>

          <div className="p-5 bg-amber-50 border border-amber-100 rounded-none flex gap-3">
            <AlertCircle size={18} className="text-amber-600 shrink-0" />
            <p className="text-[11px] text-amber-700 leading-relaxed font-bold italic uppercase tracking-tighter">
              Lưu ý: Sau khi bấm "Tạo lệnh", chứng từ sẽ ở trạng thái Chờ thực hiện.
            </p>
          </div>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="fixed bottom-0 left-0 lg:left-[260px] right-0 bg-[#f8f9fa] border-t border-[#ddd] p-[12px_30px] flex items-center justify-end gap-[15px] z-[999] shadow-[0_-4px_15px_rgba(0,0,0,0.05)]">
        <Button variant="outline" type="button" className="min-w-[110px] h-[38px] text-[12px] font-bold border-[#ccc] bg-white rounded-none uppercase hover:bg-slate-50 transition-all" onClick={() => router.back()}>HỦY BỎ</Button>
        <Button type="button" variant="outline" className="min-w-[140px] h-[38px] text-[12px] font-bold border-[#ccc] bg-white rounded-none uppercase hover:bg-slate-50">LƯU NHÁP</Button>
        <Button 
          type="button" 
          onClick={handleCreate}
          className="min-w-[180px] h-[38px] text-[12px] font-black bg-blue-600 hover:bg-blue-700 text-white rounded-none shadow-md shadow-blue-100 uppercase transition-all active:scale-[0.98]"
        >
          <Save size={18} className="mr-2" /> TẠO LỆNH XUẤT
        </Button>
      </div>
    </div>
  );
}
