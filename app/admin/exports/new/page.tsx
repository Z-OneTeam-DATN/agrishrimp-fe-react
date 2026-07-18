"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  X,
  Printer,
  ChevronLeft,
  ArrowRight,
  Truck,
  User,
  Package,
  MapPin,
  Clock,
  AlertTriangle,
  Info,
  CheckCircle2,
  ExternalLink,
  Car,
  StickyNote,
  ScanBarcode,
  Search,
  Warehouse,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// Mock data inherited from a "Lệnh xuất" (Export Command)
const INHERITED_COMMAND_DATA = {
  commandCode: "LXK-202602-001",
  docDate: "14/02/2026",
  warehouse: "KHO TỔNG HÀ NỘI",
  reason: "Xuất bán hàng theo đơn DH-123",
  receiver: "LÊ VĂN CHÂU (KH0012)",
  items: [
    {
      id: 1,
      name: "Thức ăn tôm Grobest",
      sku: "TA-001",
      unit: "Bao",
      location: "Kệ A-01",
      requestedQty: 50,
      image: "https://placehold.co/40x40",
    },
    {
      id: 2,
      name: "Vi sinh xử lý đáy Super",
      sku: "VS-005",
      unit: "Gói",
      location: "Kệ B-05",
      requestedQty: 20,
      image: "https://placehold.co/40x40",
    },
    {
      id: 3,
      name: "Thuốc khử trùng Bio",
      sku: "TK-012",
      unit: "Chai",
      location: "Khu Hóa Chất",
      requestedQty: 10,
      image: "https://placehold.co/40x40",
    },
  ],
};

export default function NewExportReceiptPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const firstInputRef = useRef<HTMLInputElement>(null);

  // State for items - default actualQty to requestedQty
  const [items, setItems] = useState(
    INHERITED_COMMAND_DATA.items.map((item) => ({
      ...item,
      actualQty: item.requestedQty,
      note: "",
    })),
  );

  // Shipping state
  const [shipping, setShipping] = useState({
    driver: "",
    plate: "",
    note: "",
  });

  // Focus on the first input upon page load
  useEffect(() => {
    if (firstInputRef.current) {
      firstInputRef.current.focus();
    }
  }, []);

  const handleQtyChange = (id: number, val: string) => {
    const numVal = parseInt(val) || 0;
    setItems(
      items.map((item) =>
        item.id === id ? { ...item, actualQty: numVal } : item,
      ),
    );
  };

  const handleConfirmExport = () => {
    toast.success("Xác nhận xuất kho thành công! Tồn kho đã được cập nhật.");
    router.push("/admin/exports");
  };

  const totalActual = items.reduce((sum, item) => sum + item.actualQty, 0);

  return (
    <div className="flex flex-col min-h-screen bg-[#f8fafc]">
      {/* HEADER SECTION */}
      <div className="bg-white border-b border-slate-200 px-6 py-3 sticky top-0 z-20 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.back()}
              className="h-9 w-9 text-slate-400"
            >
              <ChevronLeft size={22} />
            </Button>
            <div className="flex items-center gap-3">
              <h1 className="text-[18px] font-black text-[#0f172a] tracking-tight uppercase">
                Phiếu xuất kho:{" "}
                <span className="text-blue-600">PXK-2026-008</span>
              </h1>
              <Badge className="bg-orange-50 text-orange-600 border-orange-100 hover:bg-orange-50 font-bold px-2 py-0">
                ĐANG SOẠN HÀNG
              </Badge>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              className="h-8 text-[11px] font-bold border-slate-200 gap-1.5 text-slate-600"
            >
              <Printer size={14} /> IN PHIẾU NHẶT HÀNG
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.back()}
              className="text-slate-400"
            >
              <X size={20} />
            </Button>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6 pb-[100px]">
        {/* INFO CARDS SECTION */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Card 1: Reference Information */}
          <div className="bg-white border border-slate-200 rounded-none shadow-sm overflow-hidden">
            <div className="bg-slate-50/80 px-5 py-2.5 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-[11px] font-black text-slate-700 uppercase tracking-widest flex items-center gap-2">
                <Info size={14} className="text-blue-600" /> Thông tin tham
                chiếu
              </h3>
              <span className="text-[10px] text-slate-400 font-medium italic">
                Dữ liệu từ hệ thống
              </span>
            </div>
            <div className="p-5 grid grid-cols-2 gap-y-4">
              <div className="space-y-1">
                <Label className="text-[10px] font-black text-slate-400 uppercase">
                  Lệnh xuất gốc
                </Label>
                <div className="flex items-center gap-1.5 text-blue-600 font-bold text-[13px] hover:underline cursor-pointer">
                  {INHERITED_COMMAND_DATA.commandCode}{" "}
                  <ExternalLink size={12} />
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] font-black text-slate-400 uppercase">
                  Ngày chứng từ
                </Label>
                <p className="text-[13px] font-bold text-slate-700">
                  {INHERITED_COMMAND_DATA.docDate}
                </p>
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] font-black text-slate-400 uppercase">
                  Kho xuất
                </Label>
                <div className="flex items-center gap-1.5 text-[13px] font-bold text-slate-700 uppercase">
                  <Warehouse size={14} className="text-slate-300" />{" "}
                  {INHERITED_COMMAND_DATA.warehouse}
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] font-black text-slate-400 uppercase">
                  Lý do xuất
                </Label>
                <p className="text-[13px] font-bold text-slate-700">
                  {INHERITED_COMMAND_DATA.reason}
                </p>
              </div>
            </div>
          </div>

          {/* Card 2: Shipping Information */}
          <div className="bg-white border border-slate-200 rounded-none shadow-sm overflow-hidden">
            <div className="bg-slate-50/80 px-5 py-2.5 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-[11px] font-black text-slate-700 uppercase tracking-widest flex items-center gap-2">
                <Truck size={14} className="text-blue-600" /> Thông tin vận
                chuyển
              </h3>
              <span className="text-[10px] text-blue-600 font-bold uppercase tracking-tighter">
                Thủ kho nhập
              </span>
            </div>
            <div className="p-5 grid grid-cols-2 gap-x-6 gap-y-4">
              <div className="col-span-2 space-y-1">
                <Label className="text-[10px] font-black text-slate-400 uppercase">
                  Đối tượng nhận
                </Label>
                <p className="text-[13px] font-black text-slate-800 uppercase tracking-tight">
                  {INHERITED_COMMAND_DATA.receiver}
                </p>
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] font-black text-slate-500 uppercase">
                  Tài xế vận chuyển
                </Label>
                <div className="relative">
                  <User
                    className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-300"
                    size={14}
                  />
                  <Input
                    placeholder="Tên tài xế..."
                    className="h-8 pl-9 text-[12px] border-slate-200 rounded-none focus:border-blue-500 shadow-none"
                    value={shipping.driver}
                    onChange={(e) =>
                      setShipping({ ...shipping, driver: e.target.value })
                    }
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] font-black text-slate-500 uppercase">
                  Biển số xe (*)
                </Label>
                <div className="relative">
                  <Car
                    className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-300"
                    size={14}
                  />
                  <Input
                    placeholder="29C-123.45..."
                    className="h-8 pl-9 text-[12px] border-slate-200 rounded-none focus:border-blue-500 shadow-none font-bold"
                    value={shipping.plate}
                    onChange={(e) =>
                      setShipping({ ...shipping, plate: e.target.value })
                    }
                  />
                </div>
              </div>
              <div className="col-span-2 space-y-1.5">
                <Label className="text-[10px] font-black text-slate-500 uppercase">
                  Ghi chú vận đơn
                </Label>
                <Input
                  placeholder="Ghi chú cho tài xế hoặc người nhận..."
                  className="h-8 text-[12px] border-slate-200 rounded-none focus:border-blue-500 shadow-none"
                  value={shipping.note}
                  onChange={(e) =>
                    setShipping({ ...shipping, note: e.target.value })
                  }
                />
              </div>
            </div>
          </div>
        </div>

        {/* PICKING GRID SECTION */}
        <div className="bg-white border border-slate-200 rounded-none shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-4">
            <h3 className="text-[11px] font-black text-slate-700 uppercase tracking-widest flex items-center gap-2">
              <Package size={14} className="text-blue-600" /> Danh mục soạn hàng
              (Picking List)
            </h3>
            <div className="flex items-center gap-2">
              <div className="relative w-[300px]">
                <ScanBarcode
                  className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400"
                  size={16}
                />
                <Input
                  placeholder="Quét mã vạch sản phẩm (F3)..."
                  className="h-8 pl-9 text-[12px] border-slate-200 rounded-none focus:ring-0"
                />
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <Table className="table-custom border-collapse min-w-[1100px]">
              <TableHeader>
                <TableRow className="bg-slate-50/80 border-b border-slate-200">
                  <TableHead className="w-[50px] text-center p-3 text-[10px] font-black uppercase text-slate-500">
                    STT
                  </TableHead>
                  <TableHead className="w-[60px] p-3"></TableHead>
                  <TableHead className="p-3 text-[10px] font-black uppercase text-slate-500">
                    Thông tin hàng hóa
                  </TableHead>
                  <TableHead className="w-[150px] p-3 text-[10px] font-black uppercase text-slate-500">
                    Vị trí kho
                  </TableHead>
                  <TableHead className="w-[120px] text-right p-3 text-[10px] font-black uppercase text-slate-400">
                    SL Yêu cầu
                  </TableHead>
                  <TableHead className="w-[140px] text-right p-3 text-[10px] font-black uppercase text-blue-600">
                    SL Thực xuất
                  </TableHead>
                  <TableHead className="p-3 text-[10px] font-black uppercase text-slate-500">
                    Ghi chú dòng
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item, index) => {
                  const isShort = item.actualQty < item.requestedQty;
                  return (
                    <TableRow
                      key={item.id}
                      className={cn(
                        "border-b border-slate-100 hover:bg-slate-50/50 transition-colors h-[60px]",
                        isShort && "bg-amber-50/20",
                      )}
                    >
                      <TableCell className="text-center text-slate-400 font-bold text-[11px]">
                        {index + 1}
                      </TableCell>
                      <TableCell className="p-2">
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-10 h-10 rounded border border-slate-100 object-cover"
                        />
                      </TableCell>
                      <TableCell className="p-3">
                        <div className="flex flex-col">
                          <span className="font-bold text-[13px] text-slate-700 leading-tight">
                            {item.name}
                          </span>
                          <span className="text-[10px] font-mono text-slate-400 uppercase mt-0.5">
                            {item.sku}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="p-3">
                        <div className="flex items-center gap-1.5 text-[11px] font-black text-slate-600 bg-slate-100 px-2 py-1 rounded-sm w-fit">
                          <MapPin size={12} className="text-slate-400" />{" "}
                          {item.location}
                        </div>
                      </TableCell>
                      <TableCell className="p-3 text-right text-[13px] font-bold text-slate-400 pr-6 italic">
                        {item.requestedQty}
                      </TableCell>
                      <TableCell className="p-3 relative">
                        <Input
                          ref={index === 0 ? firstInputRef : null}
                          type="number"
                          value={item.actualQty}
                          onChange={(e) =>
                            handleQtyChange(item.id, e.target.value)
                          }
                          className={cn(
                            "h-9 text-right font-black text-[15px] border-blue-400 bg-white rounded-none text-blue-700 focus:ring-2 focus:ring-blue-100 shadow-sm transition-all",
                            isShort &&
                              "border-amber-500 text-amber-700 bg-amber-50/50",
                          )}
                        />
                        {isShort && (
                          <Badge className="absolute -top-1 right-3 bg-amber-500 text-white border-none text-[8px] px-1 py-0 h-3.5 tracking-tighter">
                            XUẤT THIẾU
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="p-3">
                        <div className="relative">
                          <StickyNote
                            className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-300"
                            size={14}
                          />
                          <Input
                            placeholder={
                              isShort ? "Lý do thiếu hàng..." : "Ghi chú..."
                            }
                            value={item.note}
                            onChange={(e) =>
                              setItems(
                                items.map((i) =>
                                  i.id === item.id
                                    ? { ...i, note: e.target.value }
                                    : i,
                                ),
                              )
                            }
                            className="h-8 pl-8 text-[11px] border-slate-100 focus:border-slate-300 bg-transparent rounded-none italic"
                          />
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>

      {/* STICKY FOOTER ACTIONS */}
      <div className="fixed bottom-0 left-0 lg:left-[260px] right-0 bg-white border-t border-slate-200 p-4 px-8 flex items-center justify-between z-[999] shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
        <div className="flex items-center gap-8">
          <div className="flex flex-col">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
              Tổng thực xuất
            </span>
            <p className="text-[18px] font-black text-slate-800 tracking-tighter">
              {totalActual}
            </p>
          </div>
          <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-blue-50 border border-blue-100 rounded-sm">
            <AlertTriangle size={16} className="text-blue-600" />
            <p className="text-[11px] text-blue-700 font-bold italic leading-tight">
              Hành động này sẽ trừ tồn kho ngay lập tức sau khi xác nhận.
            </p>
          </div>
        </div>

        <div className="flex gap-4">
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="text-slate-400 font-bold hover:text-slate-600 uppercase text-[12px] tracking-widest"
          >
            Hủy bỏ
          </Button>
          <Button
            variant="outline"
            className="min-w-[120px] h-10 border-blue-600 text-blue-600 font-black uppercase text-[11px] tracking-widest hover:bg-blue-50 rounded-none transition-all"
          >
            Lưu tạm
          </Button>
          <Button
            onClick={handleConfirmExport}
            className="min-w-[220px] h-10 bg-blue-600 hover:bg-blue-700 text-white font-black uppercase text-[11px] tracking-widest rounded-none shadow-xl shadow-blue-200 transition-all active:scale-[0.98]"
          >
            <CheckCircle2 size={18} className="mr-2" /> XÁC NHẬN XUẤT KHO
          </Button>
        </div>
      </div>
    </div>
  );
}

