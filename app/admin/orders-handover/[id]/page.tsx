"use client";

import React from "react";
import { useRouter } from "next/navigation";
import {
  ChevronLeft,
  Printer,
  Download,
  Phone,
  MapPin,
  Calendar,
  Truck,
  User
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

// --- MOCK DATA: Chi tiết 1 phiếu bàn giao ---
const HANDOVER_DETAIL = {
  id: "BG260214-001",
  createdDate: "14/02/2026 15:30",
  carrier: "Giao Hàng Tiết Kiệm",
  warehouse: "Kho Tổng Cà Mau",
  warehouseAddress: "Số 10, Lý Thường Kiệt, P6, TP Cà Mau",
  creator: "Admin Agri",
  totalOrders: 3,
  totalWeight: "5.0 kg",
  totalCOD: "2.850.000đ",
  orders: [
    {
      code: "#1010",
      tracking: "GHTK_8827192",
      customer: "Trại Tôm Bảy Sang",
      address: "Hòa Bình, Bạc Liêu",
      product: "Vi sinh xử lý đáy (10 gói)",
      weight: "2.5kg",
      cod: "1.200.000đ"
    },
    {
      code: "#1011",
      tracking: "GHTK_9912311",
      customer: "Đại lý Thuốc Thủy Sản Minh",
      address: "Đầm Dơi, Cà Mau",
      product: "Khoáng tạt (2 bao)",
      weight: "20kg",
      cod: "1.500.000đ"
    },
    {
      code: "#1015",
      tracking: "GHTK_1122334",
      customer: "Nguyễn Văn A",
      address: "TP Bạc Liêu",
      product: "Vó tôm",
      weight: "0.5kg",
      cod: "150.000đ"
    }
  ]
};

export default function HandoverDetailPage() {
  const router = useRouter();

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-slate-100 p-4 md:p-8 flex flex-col items-center">

      {/* --- HEADER ACTIONS  --- */}
      <div className="w-full max-w-4xl flex items-center justify-between mb-6 print:hidden">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="icon" onClick={() => router.back()} className="bg-white border-slate-300">
            <ChevronLeft size={20} />
          </Button>
          <div>
            <h1 className="text-[18px] font-bold text-slate-800">Chi tiết bàn giao</h1>
            <p className="text-[12px] text-slate-500">Mã phiếu: {HANDOVER_DETAIL.id}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="bg-white border-slate-300 text-slate-700">
            <Download size={16} className="mr-2" /> Xuất Excel
          </Button>
          <Button onClick={handlePrint} className="bg-blue-600 hover:bg-blue-700 text-white">
            <Printer size={16} className="mr-2" /> In biên bản
          </Button>
        </div>
      </div>

      {/* --- PHẦN GIẤY A4 (Sẽ được in) --- */}
      <div className="w-full max-w-4xl bg-white shadow-lg rounded-sm p-8 print:shadow-none print:p-0 print:w-full">

        {/* Header phiếu */}
        <div className="border-b border-slate-200 pb-6 mb-6">
          <div className="flex justify-between items-start">
            <div className="space-y-1">
                <h2 className="text-[20px] font-black text-slate-900 uppercase tracking-tight">AGRISHRIMP VIETNAM</h2>
                <div className="text-[12px] text-slate-500 flex items-center gap-2">
                    <MapPin size={12} /> {HANDOVER_DETAIL.warehouseAddress}
                </div>
                <div className="text-[12px] text-slate-500 flex items-center gap-2">
                    <Phone size={12} /> 0909.123.456
                </div>
            </div>
            <div className="text-right">
                <h1 className="text-[22px] font-bold text-slate-800 uppercase">BIÊN BẢN BÀN GIAO</h1>
                <p className="text-[13px] text-slate-500 font-mono mt-1">#{HANDOVER_DETAIL.id}</p>
                <div className="mt-2 inline-flex items-center gap-1 px-3 py-1 bg-slate-100 rounded text-[12px] font-medium text-slate-700">
                    <Calendar size={12} /> {HANDOVER_DETAIL.createdDate}
                </div>
            </div>
          </div>
        </div>

        {/* Thông tin chung */}
        <div className="grid grid-cols-2 gap-8 mb-8 bg-slate-50 p-4 rounded border border-slate-100">
            <div>
                <p className="text-[11px] font-bold text-slate-400 uppercase mb-1">Đơn vị vận chuyển</p>
                <div className="flex items-center gap-2">
                    <Truck size={18} className="text-blue-600" />
                    <span className="text-[14px] font-bold text-slate-800">{HANDOVER_DETAIL.carrier}</span>
                </div>
            </div>
            <div>
                <p className="text-[11px] font-bold text-slate-400 uppercase mb-1">Nhân viên bàn giao</p>
                <div className="flex items-center gap-2">
                    <User size={18} className="text-emerald-600" />
                    <span className="text-[14px] font-bold text-slate-800">{HANDOVER_DETAIL.creator}</span>
                </div>
            </div>
        </div>

        {/* Danh sách hàng hóa */}
        <div className="mb-8">
            <h3 className="text-[13px] font-bold text-slate-800 uppercase mb-3 border-l-4 border-blue-600 pl-3">Danh sách kiện hàng</h3>
            <div className="border border-slate-200 rounded-sm overflow-hidden">
                <Table>
                    <TableHeader className="bg-slate-100">
                        <TableRow className="hover:bg-slate-100 border-b border-slate-200">
                            <TableHead className="w-[50px] text-center font-bold text-slate-700 text-[12px]">STT</TableHead>
                            <TableHead className="font-bold text-slate-700 text-[12px]">Mã vận đơn / Đơn hàng</TableHead>
                            <TableHead className="font-bold text-slate-700 text-[12px]">Khách hàng</TableHead>
                            <TableHead className="font-bold text-slate-700 text-[12px]">Hàng hóa</TableHead>
                            <TableHead className="text-right font-bold text-slate-700 text-[12px]">Trọng lượng</TableHead>
                            <TableHead className="text-right font-bold text-slate-700 text-[12px]">Thu hộ (COD)</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {HANDOVER_DETAIL.orders.map((order, index) => (
                            <TableRow key={index} className="border-b border-slate-100 hover:bg-white">
                                <TableCell className="text-center text-[12px] text-slate-600">{index + 1}</TableCell>
                                <TableCell>
                                    <div className="flex flex-col">
                                        <span className="text-[13px] font-bold text-slate-900">{order.tracking}</span>
                                        <span className="text-[11px] text-slate-500">Đơn: {order.code}</span>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <div className="flex flex-col">
                                        <span className="text-[12px] font-medium text-slate-800">{order.customer}</span>
                                        <span className="text-[11px] text-slate-500 truncate max-w-[150px]">{order.address}</span>
                                    </div>
                                </TableCell>
                                <TableCell className="text-[12px] text-slate-600 max-w-[200px] truncate">
                                    {order.product}
                                </TableCell>
                                <TableCell className="text-right text-[12px] text-slate-800">{order.weight}</TableCell>
                                <TableCell className="text-right text-[13px] font-bold text-slate-900">{order.cod}</TableCell>
                            </TableRow>
                        ))}
                        {/* Hàng tổng kết */}
                        <TableRow className="bg-slate-50 font-bold border-t border-slate-300">
                            <TableCell colSpan={4} className="text-right text-[12px] text-slate-600 uppercase pr-4">Tổng cộng ({HANDOVER_DETAIL.totalOrders} kiện):</TableCell>
                            <TableCell className="text-right text-[13px] text-slate-900">{HANDOVER_DETAIL.totalWeight}</TableCell>
                            <TableCell className="text-right text-[14px] text-slate-900">{HANDOVER_DETAIL.totalCOD}</TableCell>
                        </TableRow>
                    </TableBody>
                </Table>
            </div>
        </div>

        {/* Chữ ký */}
        <div className="grid grid-cols-2 gap-20 mt-12 pt-4 page-break-inside-avoid">
            <div className="text-center">
                <p className="text-[12px] font-bold text-slate-800 uppercase mb-1">Người bàn giao</p>
                <p className="text-[11px] text-slate-500 italic mb-16">(Ký và ghi rõ họ tên)</p>
                <p className="text-[13px] font-bold text-slate-800">{HANDOVER_DETAIL.creator}</p>
            </div>
            <div className="text-center">
                <p className="text-[12px] font-bold text-slate-800 uppercase mb-1">Nhân viên bưu tá</p>
                <p className="text-[11px] text-slate-500 italic mb-16">(Ký và ghi rõ họ tên)</p>
                <div className="border-b border-dotted border-slate-400 w-2/3 mx-auto"></div>
            </div>
        </div>

      </div>
    </div>
  );
}