"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
    ChevronLeft,
    Download,
    HelpCircle,
    ChevronRight,
    Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { cn, formatNumber } from "@/lib/utils";
import { FinancialService, ProfitLossData } from "@/app/services/financial.service";
import { apiJava } from "@/lib/axios"; // Dùng để gọi API danh sách chi nhánh
import { toast } from "sonner";
import * as XLSX from "xlsx";

// Helper tính khoảng thời gian kỳ trước
const getPrevPeriod = (start: string, end: string) => {
    const startDate = new Date(start);
    const endDate = new Date(end);
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    const prevEnd = new Date(startDate);
    prevEnd.setDate(prevEnd.getDate() - 1);
    const prevStart = new Date(prevEnd);
    prevStart.setDate(prevStart.getDate() - diffDays);

    return {
        prevStart: prevStart.toISOString().split("T")[0],
        prevEnd: prevEnd.toISOString().split("T")[0],
    };
};

// Helper Format Date (YYYY-MM-DD -> DD/MM/YYYY)
const formatDateVN = (dateStr: string) => {
    if (!dateStr) return "";
    const [y, m, d] = dateStr.split("-");
    return `${d}/${m}/${y}`;
};

export default function ProfitLossReportPage() {
    const router = useRouter();

    // 👉 STATES BỘ LỌC
    const today = new Date();
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    const [startDate, setStartDate] = useState(firstDayOfMonth.toISOString().split("T")[0]);
    const [endDate, setEndDate] = useState(today.toISOString().split("T")[0]);
    const [branchId, setBranchId] = useState("all");
    const [branches, setBranches] = useState<Array<{ id: number; name: string }>>([]);

    // 👉 STATES DỮ LIỆU
    const [loading, setLoading] = useState(true);
    const [currentData, setCurrentData] = useState<ProfitLossData | null>(null);
    const [prevData, setPrevData] = useState<ProfitLossData | null>(null);

    // Lấy danh sách chi nhánh khi load trang
    useEffect(() => {
        const fetchBranches = async () => {
            try {
                const res = await apiJava.get("/branches"); // Sửa lại endpoint nếu dự án của bạn dùng link khác
                setBranches(res.data?.content || res.data || []);
            } catch (error) {
                console.error("Lỗi lấy danh sách chi nhánh", error);
            }
        };
        fetchBranches();
    }, []);

    // Gọi API Báo cáo mỗi khi bộ lọc thay đổi
    useEffect(() => {
        const fetchReportData = async () => {
            setLoading(true);
            try {
                const { prevStart, prevEnd } = getPrevPeriod(startDate, endDate);

                // Gọi song song 2 API: Kỳ hiện tại & Kỳ trước
                const [currRes, prevRes] = await Promise.all([
                    FinancialService.getProfitLoss(startDate, endDate, branchId),
                    FinancialService.getProfitLoss(prevStart, prevEnd, branchId),
                ]);

                setCurrentData(currRes);
                setPrevData(prevRes);
            } catch (error) {
                console.error("Lỗi lấy dữ liệu báo cáo:", error);
                toast.error("Không thể tải dữ liệu báo cáo!");
            } finally {
                setLoading(false);
            }
        };

        if (startDate && endDate) {
            fetchReportData();
        }
    }, [startDate, endDate, branchId]);

    // 👉 HÀM XỬ LÝ SỐ LIỆU VÀ TÍNH % THAY ĐỔI
    const processData = (d: ProfitLossData | null) => {
        if (!d) return { rev: 0, ret: 0, vat: 0, shipC: 0, disc: 0, cogs: 0, point: 0, shipP: 0, inc: 0, retF: 0, ex: 0, netRev: 0, cost: 0, totalInc: 0, net: 0 };

        const netProductRevenue = d.revenue - d.returnedGoods;
        const netRev = netProductRevenue + d.vat + d.shippingFeeCollected - d.discount;
        const cost = d.cogs + d.pointPayment + d.shippingFeePaid;
        const totalInc = d.otherIncome + d.customerReturnFee;
        const net = netRev + totalInc - cost - d.otherExpenses;

        return { rev: d.revenue, ret: d.returnedGoods, vat: d.vat, shipC: d.shippingFeeCollected, disc: d.discount, cogs: d.cogs, point: d.pointPayment, shipP: d.shippingFeePaid, inc: d.otherIncome, retF: d.customerReturnFee, ex: d.otherExpenses, netProductRevenue, netRev, cost, totalInc, net };
    };

    const calcPercent = (curr: number, prev: number) => {
        if (prev === 0) return curr > 0 ? "+100%" : "0%";
        const percent = ((curr - prev) / prev) * 100;
        return (percent > 0 ? "+" : "") + percent.toFixed(1) + "%";
    };

    const curr = processData(currentData);
    const prev = processData(prevData);

    // Mảng dữ liệu Map ra Table
    const reportRows = [
        { id: "I", label: "I. Doanh thu bán hàng", prev: prev.netRev, current: curr.netRev, change: calcPercent(curr.netRev, prev.netRev), isBold: true },
        { id: "1", label: "1. Tiền hàng thực bán (1a - 1b)", prev: prev.netProductRevenue, current: curr.netProductRevenue, change: calcPercent(curr.netProductRevenue, prev.netProductRevenue), padding: "pl-8" },
        { id: "1a", label: "a. Tiền hàng bán ra", prev: prev.rev, current: curr.rev, change: calcPercent(curr.rev, prev.rev), padding: "pl-12", isItalic: true },
        { id: "1b", label: "b. Tiền hàng trả lại", prev: prev.ret, current: curr.ret, change: calcPercent(curr.ret, prev.ret), padding: "pl-12", isItalic: true },
        { id: "2", label: "2. Thuế VAT", prev: prev.vat, current: curr.vat, change: calcPercent(curr.vat, prev.vat), padding: "pl-8" },
        { id: "3", label: "3. Phí giao hàng thu của khách", prev: prev.shipC, current: curr.shipC, change: calcPercent(curr.shipC, prev.shipC), padding: "pl-8" },
        { id: "4", label: "4. Chiết khấu", prev: prev.disc, current: curr.disc, change: calcPercent(curr.disc, prev.disc), padding: "pl-8" },

        { id: "II", label: "II. Chi phí bán hàng (1 + 2 + 3)", prev: prev.cost, current: curr.cost, change: calcPercent(curr.cost, prev.cost), isBold: true, spaceTop: true },
        { id: "II-1", label: "1. Chi phí giá vốn hàng hóa", prev: prev.cogs, current: curr.cogs, change: calcPercent(curr.cogs, prev.cogs), padding: "pl-8" },
        { id: "II-2", label: "2. Thanh toán bằng điểm", prev: prev.point, current: curr.point, change: calcPercent(curr.point, prev.point), padding: "pl-8" },
        { id: "II-3", label: "3. Phí giao hàng trả đối tác", prev: prev.shipP, current: curr.shipP, change: calcPercent(curr.shipP, prev.shipP), padding: "pl-8" },

        { id: "III", label: "III. Thu nhập khác (1 + 2)", prev: prev.totalInc, current: curr.totalInc, change: calcPercent(curr.totalInc, prev.totalInc), isBold: true, spaceTop: true },
        { id: "III-1", label: "1. Phiếu thu khác", prev: prev.inc, current: curr.inc, change: calcPercent(curr.inc, prev.inc), padding: "pl-8", hasLink: true },
        { id: "III-2", label: "2. Phí khách trả hàng", prev: prev.retF, current: curr.retF, change: calcPercent(curr.retF, prev.retF), padding: "pl-8" },

        { id: "IV", label: "IV. Chi phí khác", prev: prev.ex, current: curr.ex, change: calcPercent(curr.ex, prev.ex), isBold: true, spaceTop: true },
        { id: "IV-1", label: "1. Phiếu chi khác", prev: prev.ex, current: curr.ex, change: calcPercent(curr.ex, prev.ex), padding: "pl-8", hasLink: true },

        { id: "RESULT", label: "Lợi nhuận (I + III - II - IV)", prev: prev.net, current: curr.net, change: calcPercent(curr.net, prev.net), isBold: true, isResult: true, spaceTop: true },
    ];

    // 👉 HÀM XUẤT EXCEL
    const handleExportExcel = () => {
        if (!currentData) {
            toast.error("Không có dữ liệu để xuất!");
            return;
        }

        const excelData = reportRows.map((row) => ({
            "Chỉ tiêu báo cáo": row.label.replace(/a\.|b\.|1\.|2\.|3\.|4\./g, "").trim(),
            "Kỳ trước (VNĐ)": row.prev,
            "Kỳ hiện tại (VNĐ)": row.current,
            "% Thay đổi": row.change,
        }));

        const worksheet = XLSX.utils.json_to_sheet(excelData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Báo Cáo Lãi Lỗ");
        XLSX.writeFile(workbook, `Bao_Cao_Lai_Lo_${startDate}_den_${endDate}.xlsx`);
        toast.success("Xuất file Excel thành công!");
    };

    const { prevStart, prevEnd } = getPrevPeriod(startDate, endDate);

    return (
        <div className="space-y-0 pb-10 bg-[#f0f2f5] min-h-screen">
            {/* HEADER BỘ LỌC */}
            <div className="px-6 py-3 flex items-center gap-5 bg-white border-b border-slate-200 shadow-sm flex-wrap">
                <div className="flex items-center gap-3 border-r pr-5 border-slate-200">
                    <Button variant="ghost" size="icon" onClick={() => router.push("/admin/financial")} className="h-8 w-8 text-slate-500 hover:text-blue-600 border border-slate-200 rounded-none">
                        <ChevronLeft size={20} />
                    </Button>
                    <h1 className="text-[17px] font-bold text-slate-800 uppercase">Báo cáo lãi lỗ</h1>
                </div>

                {/* Lọc ngày bắt đầu */}
                <div className="flex items-center gap-2">
                    <span className="text-[11px] font-bold text-slate-500 uppercase">Từ ngày</span>
                    <Input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="h-8 w-[140px] text-[12px] border-slate-300 rounded-none shadow-none font-medium"
                    />
                </div>

                {/* Lọc ngày kết thúc */}
                <div className="flex items-center gap-2">
                    <span className="text-[11px] font-bold text-slate-500 uppercase">Đến ngày</span>
                    <Input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="h-8 w-[140px] text-[12px] border-slate-300 rounded-none shadow-none font-medium"
                    />
                </div>

                {/* Lọc chi nhánh */}
                <div className="flex items-center gap-2 border-l pl-5 border-slate-200">
                    <span className="text-[11px] font-bold text-slate-500 uppercase">Chi nhánh</span>
                    <Select value={branchId} onValueChange={setBranchId}>
                        <SelectTrigger className="h-8 w-[180px] text-[12px] border-slate-300 rounded-none shadow-none bg-white font-medium focus:ring-0">
                            <SelectValue placeholder="Tất cả chi nhánh" />
                        </SelectTrigger>
                        <SelectContent className="rounded-none">
                            <SelectItem value="all">Tất cả chi nhánh</SelectItem>
                            {branches.map(b => (
                                <SelectItem key={b.id} value={String(b.id)}>{b.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {/* Action Buttons */}
                <div className="ms-auto flex items-center gap-5">
                    <button onClick={handleExportExcel} className="flex items-center gap-1.5 text-[11px] text-slate-600 font-black hover:text-emerald-600 transition-colors uppercase">
                        <Download size={15} /> Xuất file
                    </button>
                    <button className="flex items-center gap-1.5 text-[11px] text-slate-600 font-black hover:text-blue-600 transition-colors uppercase">
                        <HelpCircle size={15} /> Giải thích
                    </button>
                </div>
            </div>

            {/* NỘI DUNG BÁO CÁO */}
            <div className="p-4">
                <div className="bg-white border border-[#dcdcdc] rounded-none shadow-sm overflow-hidden relative min-h-[500px]">

                    {/* Hiệu ứng xoay tròn khi đang gọi API */}
                    {loading && (
                        <div className="absolute inset-0 bg-white/70 flex flex-col items-center justify-center z-10">
                            <Loader2 className="animate-spin text-blue-600 mb-2" size={32} />
                            <span className="text-[12px] font-medium text-slate-500">Đang tổng hợp số liệu...</span>
                        </div>
                    )}

                    <Table className="border-collapse">
                        <TableHeader>
                            <TableRow className="bg-[#5c7293] hover:bg-[#5c7293] h-12">
                                <TableHead className="text-white font-bold text-[11px] uppercase border-r border-white/10 pl-6 w-[40%]">
                                    Chỉ tiêu báo cáo
                                </TableHead>
                                <TableHead className="text-white font-bold text-[11px] uppercase border-r border-white/10 text-center w-[20%]">
                                    <p>Kỳ trước</p>
                                    <p className="text-[9px] font-medium text-blue-200">
                                        ({formatDateVN(prevStart)} - {formatDateVN(prevEnd)})
                                    </p>
                                </TableHead>
                                <TableHead className="text-white font-bold text-[11px] uppercase border-r border-white/10 text-center w-[20%]">
                                    <p>Kỳ hiện tại</p>
                                    <p className="text-[9px] font-medium text-emerald-200">
                                        ({formatDateVN(startDate)} - {formatDateVN(endDate)})
                                    </p>
                                </TableHead>
                                <TableHead className="text-white font-bold text-[11px] uppercase text-center w-[20%]">
                                    % thay đổi
                                </TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {reportRows.map((row) => (
                                <TableRow
                                    key={row.id}
                                    className={cn(
                                        "border-b border-slate-100 hover:bg-slate-50 transition-colors h-10",
                                        row.isBold ? "bg-slate-50/30" : "bg-white",
                                        row.isResult && "bg-blue-50/50 hover:bg-blue-50 border-t-2 border-t-blue-100"
                                    )}
                                >
                                    <TableCell
                                        className={cn(
                                            "py-2 text-[13px] border-r border-slate-50 flex items-center gap-2",
                                            row.padding || "pl-6",
                                            row.isBold ? "font-black text-slate-800" : "text-slate-600",
                                            row.isItalic && "italic",
                                            row.isResult && "text-blue-700"
                                        )}
                                    >
                                        {row.label}
                                        {row.hasLink && <ChevronRight size={14} className="text-blue-400 cursor-pointer" />}
                                    </TableCell>
                                    <TableCell className={cn("py-2 text-center text-[13px] border-r border-slate-50", row.isBold ? "font-bold text-slate-800" : "text-slate-600")}>
                                        {formatNumber(row.prev)}
                                    </TableCell>
                                    <TableCell className={cn("py-2 text-center text-[13px] border-r border-slate-50", row.isBold ? "font-black text-slate-800" : "text-slate-600", row.isResult && "text-blue-700 text-[15px]")}>
                                        {formatNumber(row.current)}
                                    </TableCell>
                                    <TableCell className={cn("py-2 text-center text-[13px] font-bold", row.change === "0%" ? "text-slate-400" : row.change.includes("-") ? "text-rose-500" : "text-emerald-600")}>
                                        {row.change}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </div>
        </div>
    );
}