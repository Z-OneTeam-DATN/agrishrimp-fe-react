"use client";

import React, { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronLeft,
  Search,
  Filter,
  Truck,
  Box,
  MapPin,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
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
import { cn } from "@/lib/utils";
import { toast } from "sonner";

// --- MOCK DATA ---
const READY_TO_SHIP_ORDERS = [
  {
    id: "#1010",
    trackingCode: "GHTK_8827192",
    carrier: "Giao Hàng Tiết Kiệm",
    customer: "Trại Tôm Bảy Sang",
    address: "Hòa Bình, Bạc Liêu",
    products: "Vi sinh xử lý đáy (10 gói)",
    weight: "2.5kg",
    cod: "1.200.000đ",
    status: "Chờ lấy hàng"
  },
  {
    id: "#1011",
    trackingCode: "GHTK_9912311",
    carrier: "Giao Hàng Tiết Kiệm",
    customer: "Đại lý Thuốc Thủy Sản Minh",
    address: "Đầm Dơi, Cà Mau",
    products: "Khoáng tạt (5 bao)",
    weight: "50kg",
    cod: "2.500.000đ",
    status: "Chờ lấy hàng"
  },
  {
    id: "#1012",
    trackingCode: "JNT_112233",
    carrier: "J&T Express",
    customer: "Anh Ba (Vuông tôm)",
    address: "Vĩnh Châu, Sóc Trăng",
    products: "Thức ăn tăng trọng (2 bao)",
    weight: "20kg",
    cod: "850.000đ",
    status: "Chờ lấy hàng"
  }
];

export default function CreateHandoverPage() {
  const router = useRouter();
  const [selectedCarrier, setSelectedCarrier] = useState<string>("all");
  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);

  const filteredOrders = useMemo(() => {
    if (selectedCarrier === "all") return READY_TO_SHIP_ORDERS;
    return READY_TO_SHIP_ORDERS.filter(o => o.carrier === selectedCarrier);
  }, [selectedCarrier]);

  const toggleSelectAll = () => {
    if (selectedOrders.length === filteredOrders.length) {
      setSelectedOrders([]);
    } else {
      setSelectedOrders(filteredOrders.map(o => o.id));
    }
  };

  const toggleSelectRow = (id: string) => {
    setSelectedOrders(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };
  const handleCreateHandover = () => {
    if (selectedOrders.length === 0) {
      toast.error("Vui lòng chọn ít nhất 1 đơn hàng để bàn giao");
      return;
    }

    const newHandoverId = "BG260214-001";

    toast.success(`Đã tạo biên bản bàn giao thành công!`);
    router.push(`/admin/orders-handover/${newHandoverId}`);
  };

  return (
    <div className="flex flex-col h-screen bg-slate-50">

      {/* --- HEADER --- */}
      <div className="h-[60px] bg-white border-b border-slate-200 px-4 flex items-center justify-between shrink-0 sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => router.back()} className="text-slate-500 hover:text-slate-800">
            <ChevronLeft size={20} />
          </Button>
          <div>
            <h1 className="text-[16px] font-bold text-slate-800 uppercase">Tạo biên bản bàn giao</h1>
            <p className="text-[11px] text-slate-500">Chọn các kiện hàng đã đóng gói để bàn giao cho bưu tá</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
            <div className="text-right mr-2 hidden sm:block">
                <p className="text-[12px] text-slate-500">Đã chọn</p>
                <p className="text-[14px] font-bold text-blue-600">{selectedOrders.length} kiện hàng</p>
            </div>
            <Button
                onClick={handleCreateHandover}
                disabled={selectedOrders.length === 0}
                className={cn(
                    "bg-blue-600 hover:bg-blue-700 text-white font-bold h-[36px] px-6 text-[13px] shadow-sm transition-all",
                    selectedOrders.length === 0 && "opacity-50 cursor-not-allowed bg-slate-300 text-slate-500 hover:bg-slate-300"
                )}
            >
                <CheckCircle2 size={16} className="mr-2" />
                TẠO BIÊN BẢN
            </Button>
        </div>
      </div>

      {/* --- BODY --- */}
      <div className="flex-1 p-4 overflow-y-auto">
        <div className="max-w-6xl mx-auto space-y-4">

            {/* Bộ lọc chọn ĐVVC */}
            <div className="bg-white p-4 rounded-[4px] border border-slate-200 shadow-sm">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                    <div className="space-y-1.5">
                        <label className="text-[12px] font-bold text-slate-600 uppercase">Đối tác vận chuyển</label>
                        <Select value={selectedCarrier} onValueChange={setSelectedCarrier}>
                            <SelectTrigger className="h-[36px] text-[13px] border-slate-300 font-medium">
                                <SelectValue placeholder="Chọn đối tác" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Tất cả đối tác</SelectItem>
                                <SelectItem value="Giao Hàng Tiết Kiệm">Giao Hàng Tiết Kiệm</SelectItem>
                                <SelectItem value="J&T Express">J&T Express</SelectItem>
                                <SelectItem value="Viettel Post">Viettel Post</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-1.5 flex-1">
                        <label className="text-[12px] font-bold text-slate-600 uppercase">Tìm kiếm nhanh</label>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                            <Input
                                placeholder="Mã vận đơn, Tên khách hàng..."
                                className="pl-9 h-[36px] text-[13px] border-slate-300"
                            />
                        </div>
                    </div>

                    <div>
                        <Button variant="outline" className="h-[36px] w-full border-slate-300 text-slate-600 text-[12px] font-bold bg-slate-50">
                            <Filter size={14} className="mr-2" /> Bộ lọc nâng cao
                        </Button>
                    </div>
                </div>
            </div>

            {/* Bảng danh sách đơn hàng */}
            <div className="bg-white rounded-[4px] border border-slate-200 shadow-sm overflow-hidden min-h-[400px]">
                <Table>
                    <TableHeader className="bg-[#f4f6f8] sticky top-0 z-10">
                        <TableRow className="border-b border-slate-200 hover:bg-[#f4f6f8]">
                            <TableHead className="w-[50px] text-center">
                                <Checkbox
                                    checked={selectedOrders.length === filteredOrders.length && filteredOrders.length > 0}
                                    onCheckedChange={toggleSelectAll}
                                    className="border-slate-400 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                                />
                            </TableHead>
                            <TableHead className="text-[12px] font-bold text-slate-700 uppercase">Mã vận đơn</TableHead>
                            <TableHead className="text-[12px] font-bold text-slate-700 uppercase">Đơn hàng</TableHead>
                            <TableHead className="text-[12px] font-bold text-slate-700 uppercase">Khách hàng</TableHead>
                            <TableHead className="text-[12px] font-bold text-slate-700 uppercase">Đơn vị vận chuyển</TableHead>
                            <TableHead className="text-[12px] font-bold text-slate-700 uppercase text-right">Trọng lượng</TableHead>
                            <TableHead className="text-[12px] font-bold text-slate-700 uppercase text-right pr-4">Tiền thu hộ</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredOrders.length > 0 ? (
                            filteredOrders.map((order) => (
                                <TableRow
                                    key={order.id}
                                    className={cn(
                                        "border-b border-slate-100 hover:bg-blue-50/30 transition-colors cursor-pointer",
                                        selectedOrders.includes(order.id) && "bg-blue-50/50"
                                    )}
                                    onClick={() => toggleSelectRow(order.id)}
                                >
                                    <TableCell className="text-center" onClick={(e) => e.stopPropagation()}>
                                        <Checkbox
                                            checked={selectedOrders.includes(order.id)}
                                            onCheckedChange={() => toggleSelectRow(order.id)}
                                            className="border-slate-300 data-[state=checked]:bg-blue-600"
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-col">
                                            <span className="text-[13px] font-bold text-slate-800">{order.trackingCode}</span>
                                            <span className="text-[11px] text-emerald-600 font-medium bg-emerald-50 w-fit px-1.5 rounded mt-0.5">
                                                {order.status}
                                            </span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-col gap-1">
                                            <span className="text-[13px] font-medium text-blue-600 hover:underline w-fit">{order.id}</span>
                                            <div className="text-[12px] text-slate-500 flex items-center gap-1.5" title={order.products}>
                                                <Box size={12} />
                                                <span className="truncate max-w-[200px]">{order.products}</span>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-col gap-0.5">
                                            <span className="text-[13px] font-medium text-slate-700">{order.customer}</span>
                                            <div className="text-[11px] text-slate-500 flex items-center gap-1">
                                                <MapPin size={10} /> {order.address}
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center">
                                                <Truck size={12} className="text-slate-500" />
                                            </div>
                                            <span className="text-[13px] text-slate-700">{order.carrier}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right text-[13px] font-medium text-slate-700">
                                        {order.weight}
                                    </TableCell>
                                    <TableCell className="text-right pr-4 text-[13px] font-bold text-slate-800">
                                        {order.cod}
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={7} className="h-[300px] text-center">
                                    <div className="flex flex-col items-center justify-center text-slate-400 gap-3">
                                        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center">
                                            <AlertCircle size={32} className="text-slate-300" />
                                        </div>
                                        <div className="text-center">
                                            <p className="text-[14px] font-medium text-slate-600">Không có đơn hàng nào chờ bàn giao</p>
                                            <p className="text-[12px]">Vui lòng kiểm tra lại bộ lọc hoặc trạng thái đơn hàng</p>
                                        </div>
                                    </div>
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
      </div>
    </div>
  );
}