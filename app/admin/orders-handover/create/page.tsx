"use client";

import React, { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
    ChevronLeft,
    Search,
    Filter,
    Truck,
    Box,
    MapPin,
    CheckCircle2,
    AlertCircle,
    Loader2
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
import { orderService } from "@/app/services/order.service";
import { BranchOrder } from "@/app/types/order.types";

const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(amount || 0);

export default function CreateHandoverPage() {
    const router = useRouter();

    // --- STATE DỮ LIỆU THẬT ---
    const [orders, setOrders] = useState<BranchOrder[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [selectedCarrier, setSelectedCarrier] = useState<string>("all");
    const [selectedOrders, setSelectedOrders] = useState<number[]>([]); // Lưu subOrderId (number)
    const [searchTerm, setSearchTerm] = useState("");

    // 1. LOAD DỮ LIỆU TỪ BACKEND
    const fetchReadyOrders = async () => {
        setIsLoading(true);
        try {
            // Chỉ lấy các đơn đang ở trạng thái PROCESSING (Đã đóng gói)
            const data = await orderService.getReadyToShipSubOrders();
            setOrders(data);
        } catch (error) {
            toast.error("Không thể tải danh sách đơn hàng chờ bàn giao");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchReadyOrders();
    }, []);

    // 2. LỌC DỮ LIỆU TRÊN UI
    const filteredOrders = useMemo(() => {
        return orders.filter(o => {
            const matchCarrier = selectedCarrier === "all" || o.carrier === selectedCarrier;
            const matchSearch = searchTerm === "" ||
                o.orderCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
                o.customerName.toLowerCase().includes(searchTerm.toLowerCase());
            return matchCarrier && matchSearch;
        });
    }, [orders, selectedCarrier, searchTerm]);

    // 3. XỬ LÝ CHỌN DÒNG
    const toggleSelectAll = () => {
        if (selectedOrders.length === filteredOrders.length) {
            setSelectedOrders([]);
        } else {
            setSelectedOrders(filteredOrders.map(o => o.subOrderId));
        }
    };

    const toggleSelectRow = (subOrderId: number) => {
        setSelectedOrders(prev =>
            prev.includes(subOrderId) ? prev.filter(id => id !== subOrderId) : [...prev, subOrderId]
        );
    };

    // 4. GỌI API TẠO BIÊN BẢN (THẬT)
    const handleCreateHandover = async () => {
        if (selectedOrders.length === 0) {
            toast.error("Vui lòng chọn ít nhất 1 đơn hàng để bàn giao");
            return;
        }

        setIsSubmitting(true);
        try {
            const payload = {
                subOrderIds: selectedOrders,
                carrier: selectedCarrier === "all" ? "Chưa xác định" : selectedCarrier,
                totalWeight: 0 // Huy có thể bổ sung logic tính cân nặng nếu muốn
            };

            const result = await orderService.createHandover(payload);

            toast.success(`Đã tạo biên bản bàn giao ${result.code} thành công!`);

            // Chuyển về trang danh sách để xem phiếu vừa tạo
            router.push(`/admin/orders-handover`);
        } catch (error) {
            toast.error("Lỗi khi tạo biên bản bàn giao. Vui lòng kiểm tra lại.");
        } finally {
            setIsSubmitting(false);
        }
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
                        <h1 className="text-[16px] font-bold text-slate-800 uppercase tracking-tight">Tạo biên bản bàn giao</h1>
                        <p className="text-[11px] text-slate-500">Chọn các kiện hàng đã đóng gói để giao bưu tá</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <div className="text-right mr-2 hidden sm:block">
                        <p className="text-[11px] text-slate-400 uppercase font-bold">Đã chọn</p>
                        <p className="text-[14px] font-black text-blue-600">{selectedOrders.length} kiện hàng</p>
                    </div>
                    <Button
                        onClick={handleCreateHandover}
                        disabled={selectedOrders.length === 0 || isSubmitting}
                        className={cn(
                            "bg-blue-600 hover:bg-blue-700 text-white font-bold h-[36px] px-6 text-[13px] shadow-md transition-all",
                            (selectedOrders.length === 0 || isSubmitting) && "opacity-50 cursor-not-allowed bg-slate-300"
                        )}
                    >
                        {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 size={16} className="mr-2" />}
                        XÁC NHẬN BÀN GIAO
                    </Button>
                </div>
            </div>

            {/* --- BODY --- */}
            <div className="flex-1 p-4 overflow-y-auto">
                <div className="max-w-6xl mx-auto space-y-4">

                    {/* BỘ LỌC */}
                    <div className="bg-white p-4 rounded-[4px] border border-slate-200 shadow-sm">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                            <div className="space-y-1.5">
                                <label className="text-[11px] font-bold text-slate-500 uppercase">Đối tác vận chuyển</label>
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
                                <label className="text-[11px] font-bold text-slate-500 uppercase">Tìm nhanh (Mã đơn/Tên khách)</label>
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                    <Input
                                        placeholder="Nhập mã đơn hoặc tên khách hàng..."
                                        className="pl-9 h-[36px] text-[13px] border-slate-300"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div>
                                <Button
                                    variant="outline"
                                    className="h-[36px] w-full border-slate-300 text-slate-600 text-[12px] font-bold bg-slate-50"
                                    onClick={fetchReadyOrders}
                                >
                                    Làm mới danh sách
                                </Button>
                            </div>
                        </div>
                    </div>

                    {/* BẢNG DỮ LIỆU */}
                    <div className="bg-white rounded-[4px] border border-slate-200 shadow-sm overflow-hidden min-h-[400px]">
                        <Table>
                            <TableHeader className="bg-[#f8fafc] sticky top-0 z-10">
                                <TableRow className="border-b border-slate-200">
                                    <TableHead className="w-[50px] text-center">
                                        <Checkbox
                                            checked={selectedOrders.length === filteredOrders.length && filteredOrders.length > 0}
                                            onCheckedChange={toggleSelectAll}
                                            className="border-slate-400 data-[state=checked]:bg-blue-600"
                                        />
                                    </TableHead>
                                    <TableHead className="text-[12px] font-bold text-slate-700 uppercase">Đơn hàng</TableHead>
                                    <TableHead className="text-[12px] font-bold text-slate-700 uppercase">Khách hàng</TableHead>
                                    <TableHead className="text-[12px] font-bold text-slate-700 uppercase">Địa chỉ</TableHead>
                                    <TableHead className="text-[12px] font-bold text-slate-700 uppercase">ĐV Vận chuyển</TableHead>
                                    <TableHead className="text-[12px] font-bold text-slate-700 uppercase text-right pr-6">Tiền thu hộ (COD)</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isLoading ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="h-[300px] text-center text-slate-400">
                                            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2 opacity-20" />
                                            Đang tải dữ liệu đơn hàng...
                                        </TableCell>
                                    </TableRow>
                                ) : filteredOrders.length > 0 ? (
                                    filteredOrders.map((order) => (
                                        <TableRow
                                            key={order.subOrderId}
                                            className={cn(
                                                "border-b border-slate-100 hover:bg-blue-50/30 transition-colors cursor-pointer",
                                                selectedOrders.includes(order.subOrderId) && "bg-blue-50/50"
                                            )}
                                            onClick={() => toggleSelectRow(order.subOrderId)}
                                        >
                                            <TableCell className="text-center" onClick={(e) => e.stopPropagation()}>
                                                <Checkbox
                                                    checked={selectedOrders.includes(order.subOrderId)}
                                                    onCheckedChange={() => toggleSelectRow(order.subOrderId)}
                                                    className="border-slate-300 data-[state=checked]:bg-blue-600"
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-col">
                                                    <span className="text-[13px] font-bold text-blue-600">{order.orderCode}</span>
                                                    <span className="text-[10px] text-slate-400 font-mono italic">#{order.subOrderId}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <span className="text-[13px] font-medium text-slate-700">{order.customerName}</span>
                                                <p className="text-[11px] text-slate-400">{order.customerPhone}</p>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-start gap-1 max-w-[250px]">
                                                    <MapPin size={12} className="text-slate-300 mt-0.5 shrink-0" />
                                                    <span className="text-[12px] text-slate-500 line-clamp-2">{order.shippingAddress}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <Truck size={13} className="text-slate-400" />
                                                    <span className="text-[12px] text-slate-700 font-medium">{order.carrier || "Chưa chọn"}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right pr-6 text-[13px] font-bold text-emerald-700">
                                                {/* Nếu đơn đã thanh toán thì COD = 0, ngược lại = subtotal */}
                                                {order.paymentStatus === "PAID" ? "0đ" : formatCurrency(order.subtotal)}
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={6} className="h-[300px] text-center">
                                            <div className="flex flex-col items-center justify-center text-slate-400 gap-3">
                                                <AlertCircle size={32} className="opacity-20" />
                                                <div className="text-center">
                                                    <p className="text-[14px] font-medium text-slate-600">Không có đơn hàng nào chờ bàn giao</p>
                                                    <p className="text-[12px]">Đơn hàng cần được chuyển sang trạng thái "Đóng gói" trước khi hiện ở đây</p>
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