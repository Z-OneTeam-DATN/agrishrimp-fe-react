"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import {
    ChevronLeft,
    Printer,
    Download,
    Phone,
    MapPin,
    Calendar,
    Truck,
    User,
    Loader2
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
import { orderService } from "@/app/services/order.service";
import { toast } from "sonner";

const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(amount || 0);

export default function HandoverDetailPage() {
    const router = useRouter();
    const params = useParams();
    const [data, setData] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);

    // 1. GỌI API LẤY CHI TIẾT
    useEffect(() => {
        const fetchDetail = async () => {
            try {
                if (params.id) {
                    const res = await orderService.getHandoverDetail(params.id as string);
                    setData(res);
                }
            } catch (error) {
                toast.error("Không thể tải chi tiết phiếu bàn giao");
            } finally {
                setIsLoading(false);
            }
        };
        fetchDetail();
    }, [params.id]);

    const handlePrint = () => {
        window.print();
    };

    if (isLoading) {
        return (
            <div className="h-screen flex flex-col items-center justify-center gap-2">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                <p className="text-slate-500 text-sm font-medium">Đang chuẩn bị bản in...</p>
            </div>
        );
    }

    if (!data) return <div className="text-center p-10">Không tìm thấy dữ liệu phiếu bàn giao.</div>;

    return (
        <div className="min-h-screen bg-slate-100 p-4 md:p-8 flex flex-col items-center">

            {/* --- HEADER ACTIONS (Sẽ bị ẩn khi in) --- */}
            <div className="w-full max-w-4xl flex items-center justify-between mb-6 print:hidden">
                <div className="flex items-center gap-3">
                    <Button variant="outline" size="icon" onClick={() => router.back()} className="bg-white border-slate-300 shadow-sm">
                        <ChevronLeft size={20} />
                    </Button>
                    <div>
                        <h1 className="text-[18px] font-bold text-slate-800">Chi tiết bàn giao</h1>
                        <p className="text-[12px] text-slate-500">Mã phiếu hệ thống: #{data.id}</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" className="bg-white border-slate-300 text-slate-700 font-bold">
                        <Download size={16} className="mr-2" /> Xuất Excel
                    </Button>
                    <Button onClick={handlePrint} className="bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-md">
                        <Printer size={16} className="mr-2" /> In biên bản (A4)
                    </Button>
                </div>
            </div>

            {/* --- PHẦN GIẤY A4 (Vùng in chính) --- */}
            <div className="w-full max-w-4xl bg-white shadow-lg rounded-sm p-10 print:shadow-none print:p-0 print:w-full min-h-[1123px]">

                {/* Header phiếu */}
                <div className="border-b-2 border-slate-900 pb-6 mb-8">
                    <div className="flex justify-between items-start">
                        <div className="space-y-1.5">
                            <h2 className="text-[22px] font-black text-slate-900 uppercase tracking-tighter">AGRISHRIMP VIETNAM</h2>
                            <div className="text-[12px] text-slate-600 flex items-center gap-2">
                                <MapPin size={12} /> {data.branchAddress || "Hệ thống chi nhánh AgriShrimp"}
                            </div>
                            <div className="text-[12px] text-slate-600 flex items-center gap-2 font-medium">
                                <Phone size={12} /> Hotline: 1900 1234
                            </div>
                        </div>
                        <div className="text-right">
                            <h1 className="text-[24px] font-black text-slate-800 uppercase">BIÊN BẢN BÀN GIAO</h1>
                            <p className="text-[14px] text-blue-700 font-black mt-1">MÃ: {data.code}</p>
                            <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 rounded text-[12px] font-bold text-slate-700 border border-slate-200">
                                <Calendar size={12} /> Ngày tạo: {new Date(data.createdAt).toLocaleString("vi-VN")}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Thông tin đối tác */}
                <div className="grid grid-cols-2 gap-8 mb-8 bg-slate-50 p-5 rounded-lg border border-slate-200">
                    <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase mb-1.5 tracking-widest">Đơn vị vận chuyển</p>
                        <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600">
                                <Truck size={18} />
                            </div>
                            <span className="text-[15px] font-black text-slate-800">{data.carrier}</span>
                        </div>
                    </div>
                    <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase mb-1.5 tracking-widest">Nhân viên kho bàn giao</p>
                        <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600">
                                <User size={18} />
                            </div>
                            <span className="text-[15px] font-black text-slate-800">{data.creatorName}</span>
                        </div>
                    </div>
                </div>

                {/* Danh sách hàng hóa thực tế */}
                <div className="mb-10">
                    <h3 className="text-[13px] font-black text-slate-800 uppercase mb-4 border-l-4 border-blue-600 pl-3">Danh sách kiện hàng ({data.totalOrders} kiện)</h3>
                    <div className="border border-slate-300 rounded-md overflow-hidden shadow-sm">
                        <Table>
                            <TableHeader className="bg-slate-100">
                                <TableRow className="border-b border-slate-300">
                                    <TableHead className="w-[50px] text-center font-black text-slate-700 text-[11px] uppercase">STT</TableHead>
                                    <TableHead className="font-black text-slate-700 text-[11px] uppercase">Mã vận đơn / Đơn hàng</TableHead>
                                    <TableHead className="font-black text-slate-700 text-[11px] uppercase">Khách hàng</TableHead>
                                    <TableHead className="text-right font-black text-slate-700 text-[11px] uppercase">Trọng lượng</TableHead>
                                    <TableHead className="text-right font-black text-slate-700 text-[11px] uppercase pr-5">Thu hộ (COD)</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {data.subOrders && data.subOrders.length > 0 ? data.subOrders.map((sub: any, index: number) => (
                                    <TableRow key={sub.id} className="border-b border-slate-200 hover:bg-white transition-none">
                                        <TableCell className="text-center text-[12px] text-slate-500 font-medium">{index + 1}</TableCell>
                                        <TableCell>
                                            <div className="flex flex-col">
                                                <span className="text-[13px] font-black text-slate-900">{sub.trackingCode || "Chưa có mã"}</span>
                                                <span className="text-[11px] text-slate-500 font-mono">Đơn: {sub.orderCode}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col">
                                                <span className="text-[12px] font-bold text-slate-800">{sub.customerName}</span>
                                                <span className="text-[10px] text-slate-400 truncate max-w-[200px] italic">{sub.shippingAddress}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right text-[12px] text-slate-800 font-medium">{sub.weight || "0.0"} kg</TableCell>
                                        <TableCell className="text-right text-[13px] font-black text-slate-900 pr-5">
                                            {sub.paymentStatus === "PAID" ? "0đ" : formatCurrency(sub.subtotal)}
                                        </TableCell>
                                    </TableRow>
                                )) : (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center py-10 text-slate-400 italic">Phiếu bàn giao này không có dữ liệu đơn hàng.</TableCell>
                                    </TableRow>
                                )}
                                {/* Hàng tổng kết cực nổi bật */}
                                <TableRow className="bg-slate-50 border-t-2 border-slate-900 font-black">
                                    <TableCell colSpan={3} className="text-right text-[12px] text-slate-800 uppercase pr-6">Tổng cộng bàn giao:</TableCell>
                                    <TableCell className="text-right text-[13px] text-blue-700">{data.totalWeight || 0} kg</TableCell>
                                    <TableCell className="text-right text-[15px] text-blue-700 pr-5">{formatCurrency(data.totalCod)}</TableCell>
                                </TableRow>
                            </TableBody>
                        </Table>
                    </div>
                </div>

                {/* Chữ ký xác nhận */}
                <div className="grid grid-cols-2 gap-20 mt-16 pt-6">
                    <div className="text-center space-y-20">
                        <div>
                            <p className="text-[12px] font-black text-slate-800 uppercase mb-1">Đại diện AgriShrimp</p>
                            <p className="text-[11px] text-slate-500 italic">(Ký và đóng dấu)</p>
                        </div>
                        <p className="text-[14px] font-black text-slate-900 underline decoration-slate-300 underline-offset-8">{data.creatorName}</p>
                    </div>
                    <div className="text-center space-y-20">
                        <div>
                            <p className="text-[12px] font-black text-slate-800 uppercase mb-1">Nhân viên bưu tá</p>
                            <p className="text-[11px] text-slate-500 italic">(Ký và ghi rõ họ tên)</p>
                        </div>
                        <div className="border-b-2 border-dotted border-slate-300 w-3/4 mx-auto"></div>
                    </div>
                </div>

                {/* Footer ghi chú nhỏ */}
                <div className="mt-24 pt-8 border-t border-slate-100 text-center">
                    <p className="text-[10px] text-slate-400 italic font-medium uppercase tracking-widest">
                        Vui lòng kiểm tra kỹ số lượng kiện hàng trước khi ký nhận. Mọi khiếu nại sau khi bưu tá rời kho sẽ không được giải quyết.
                    </p>
                </div>

            </div>
        </div>
    );
}
