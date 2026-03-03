"use client";

import React, { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
    ChevronLeft,
    ChevronDown,
    HelpCircle,
    Download,
    Search,
    X,
    Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { FinancialService, SupplierDebtData } from "@/app/services/financial.service";
import { toast } from "sonner";
import * as XLSX from "xlsx";

export default function SupplierDebtReportPage() {
    const router = useRouter();

    const [loading, setLoading] = useState(false);
    const [data, setData] = useState<SupplierDebtData[]>([]);
    const [searchTerm, setSearchTerm] = useState("");

    // 👉 STATES LƯU TRỮ BỘ LỌC
    const [staffFilter, setStaffFilter] = useState<string>("all"); // "all", "user1", "user2"
    const [debtFilter, setDebtFilter] = useState<string>("not_zero"); // "all", "not_zero", "zero"
    const [groupFilter, setGroupFilter] = useState<string>("all"); // "all", "group1", "group2"

    useEffect(() => {
        const delayDebounceFn = setTimeout(async () => {
            setLoading(true);
            try {
                const res = await FinancialService.getSupplierDebts(searchTerm);
                setData(res);
            } catch (error) {
                console.error("Lỗi lấy công nợ:", error);
            } finally {
                setLoading(false);
            }
        }, 500);

        return () => clearTimeout(delayDebounceFn);
    }, [searchTerm]);

    // 👉 LOGIC LỌC DỮ LIỆU Ở FRONTEND
    // Dùng useMemo để không phải tính toán lại mỗi khi render trừ khi data hoặc bộ lọc đổi
    const filteredData = useMemo(() => {
        let result = [...data];

        // Lọc theo Nợ cuối kỳ
        if (debtFilter === "not_zero") {
            result = result.filter((item) => item.totalDebt > 0);
        } else if (debtFilter === "zero") {
            result = result.filter((item) => item.totalDebt === 0);
        }

        // Các bộ lọc Staff và Group tạm thời chưa có data trả về từ BE nên Tuu để sẵn khung logic
        if (staffFilter !== "all") {
            // result = result.filter((item) => item.staffId === staffFilter);
        }

        if (groupFilter !== "all") {
            // result = result.filter((item) => item.groupId === groupFilter);
        }

        return result;
    }, [data, debtFilter, staffFilter, groupFilter]);

    const handleExportExcel = () => {
        if (!filteredData || filteredData.length === 0) {
            toast.error("Không có dữ liệu để xuất!");
            return;
        }

        const excelData = filteredData.map((row) => ({
            "Mã nhà cung cấp": row.supplierCode,
            "Tên nhà cung cấp": row.supplierName,
            "Số điện thoại": row.phone || "---",
            "Nợ cuối kỳ (VNĐ)": row.totalDebt,
        }));

        const worksheet = XLSX.utils.json_to_sheet(excelData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Công Nợ NCC");

        const fileName = `Cong_No_Nha_Cung_Cap_${new Date().getTime()}.xlsx`;
        XLSX.writeFile(workbook, fileName);

        toast.success("Đã tải xuống file Excel!");
    };

    return (
        <div className="space-y-0 pb-10 bg-[#f0f2f5] min-h-screen">
            <div className="px-6 py-3 flex items-center gap-6 bg-white border-b border-slate-200 shadow-sm">
                <div className="flex items-center gap-3 border-r pr-6 border-slate-200">
                    <Button variant="ghost" size="icon" onClick={() => router.push("/admin/financial")} className="h-8 w-8 text-slate-500 hover:text-blue-600 transition-colors border border-slate-200 rounded-none">
                        <ChevronLeft size={20} />
                    </Button>
                    <h1 className="text-[18px] font-medium text-slate-800 tracking-tight whitespace-nowrap uppercase">Công nợ nhà cung cấp</h1>
                </div>

                <div className="flex items-center gap-3">
                    <span className="text-[12px] font-bold text-slate-500 uppercase">Thời gian</span>
                    <div className="flex items-center gap-0 border border-slate-300 bg-white px-3 h-8 cursor-pointer hover:bg-slate-50 transition-colors min-w-[200px]">
                        <span className="text-[12px] text-slate-600 font-medium">13/01/2026 - 11/02/2026</span>
                        <ChevronDown size={14} className="ml-auto text-slate-400" />
                    </div>
                </div>

                <div className="ms-auto flex items-center gap-6">
                    <button onClick={handleExportExcel} className="flex items-center gap-1.5 text-[11px] text-slate-600 font-black hover:text-emerald-600 transition-colors uppercase">
                        <Download size={16} /> Xuất file
                    </button>
                    <button className="flex items-center gap-1.5 text-[11px] text-slate-600 font-black hover:text-blue-600 transition-colors uppercase">
                        <HelpCircle size={16} /> Giải thích
                    </button>
                </div>
            </div>

            <div className="p-4">
                <div className="bg-white border border-[#dcdcdc] rounded-none shadow-sm min-h-[400px]">
                    <div className="px-6 py-4 flex flex-wrap items-start gap-3 bg-white border-b border-slate-100">
                        <div className="relative flex-1 min-w-[400px]">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                            <Input
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="Tìm kiếm theo tên, SĐT, mã nhà cung cấp"
                                className="h-[36px] pl-10 text-[13px] border-slate-200 rounded-none shadow-none focus:border-blue-500 w-full"
                            />
                        </div>

                        {/* 👉 BỘ LỌC NHÂN VIÊN */}
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <div className="flex items-center gap-0 border border-slate-200 h-[36px] px-3 bg-white cursor-pointer hover:bg-slate-50 group min-w-[160px]">
                                    <span className="text-[12px] text-slate-500 group-hover:text-slate-700">Nhân viên phụ trách</span>
                                    <ChevronDown size={14} className="ml-auto text-slate-300" />
                                </div>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="start" className="rounded-none w-[200px]">
                                <DropdownMenuItem onClick={() => setStaffFilter("all")} className="text-[13px] cursor-pointer">Tất cả nhân viên</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setStaffFilter("user1")} className="text-[13px] cursor-pointer">Admin Tuu</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setStaffFilter("user2")} className="text-[13px] cursor-pointer">Nhân viên Huy</DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>

                        {/* 👉 BỘ LỌC NỢ CUỐI KỲ */}
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <div className="flex items-center gap-0 border border-slate-200 h-[36px] px-3 bg-white cursor-pointer hover:bg-slate-50 group min-w-[120px]">
                                    <span className="text-[12px] text-slate-500 group-hover:text-slate-700">Nợ cuối kỳ</span>
                                    <ChevronDown size={14} className="ml-auto text-slate-300" />
                                </div>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="start" className="rounded-none w-[180px]">
                                <DropdownMenuItem onClick={() => setDebtFilter("all")} className="text-[13px] cursor-pointer">Tất cả</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setDebtFilter("not_zero")} className="text-[13px] cursor-pointer font-medium text-blue-600">Khác 0</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setDebtFilter("zero")} className="text-[13px] cursor-pointer font-medium">Bằng 0</DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>

                        {/* 👉 BỘ LỌC NHÓM NHÀ CUNG CẤP */}
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <div className="flex items-center gap-0 border border-slate-200 h-[36px] px-3 bg-white cursor-pointer hover:bg-slate-50 group min-w-[160px]">
                                    <span className="text-[12px] text-slate-500 group-hover:text-slate-700">Nhóm nhà cung cấp</span>
                                    <ChevronDown size={14} className="ml-auto text-slate-300" />
                                </div>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="start" className="rounded-none w-[200px]">
                                <DropdownMenuItem onClick={() => setGroupFilter("all")} className="text-[13px] cursor-pointer">Tất cả nhóm</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setGroupFilter("group1")} className="text-[13px] cursor-pointer">Thức ăn thủy sản</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setGroupFilter("group2")} className="text-[13px] cursor-pointer">Thuốc / Chế phẩm</DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>

                    {/* 👉 ACTIVE FILTER TAGS (HIỂN THỊ CÁC BỘ LỌC ĐANG CHỌN) */}
                    {(debtFilter !== "all" || staffFilter !== "all" || groupFilter !== "all") && (
                        <div className="px-6 py-2 flex items-center gap-2 bg-white border-b border-slate-50">
                            {debtFilter !== "all" && (
                                <div className="bg-blue-50 text-blue-600 px-2 py-1 flex items-center gap-2 text-[11px] font-medium border border-blue-100">
                                    Nợ cuối kỳ: {debtFilter === "not_zero" ? "Khác 0" : "Bằng 0"}
                                    <button onClick={() => setDebtFilter("all")} className="hover:text-blue-800"><X size={12} /></button>
                                </div>
                            )}
                            {staffFilter !== "all" && (
                                <div className="bg-emerald-50 text-emerald-600 px-2 py-1 flex items-center gap-2 text-[11px] font-medium border border-emerald-100">
                                    Nhân viên: {staffFilter === "user1" ? "Admin Tuu" : "Nhân viên Huy"}
                                    <button onClick={() => setStaffFilter("all")} className="hover:text-emerald-800"><X size={12} /></button>
                                </div>
                            )}
                            {groupFilter !== "all" && (
                                <div className="bg-purple-50 text-purple-600 px-2 py-1 flex items-center gap-2 text-[11px] font-medium border border-purple-100">
                                    Nhóm NCC: {groupFilter === "group1" ? "Thức ăn thủy sản" : "Thuốc / Chế phẩm"}
                                    <button onClick={() => setGroupFilter("all")} className="hover:text-purple-800"><X size={12} /></button>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Vùng hiển thị dữ liệu */}
                    {loading ? (
                        <div className="flex items-center justify-center py-24">
                            <Loader2 className="animate-spin text-blue-600" size={32}/>
                        </div>
                    ) : filteredData.length > 0 ? (
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-slate-50 hover:bg-slate-50">
                                        <TableHead className="font-bold text-[11px] uppercase pl-6 py-3">Mã NCC</TableHead>
                                        <TableHead className="font-bold text-[11px] uppercase py-3">Tên nhà cung cấp</TableHead>
                                        <TableHead className="font-bold text-[11px] uppercase py-3">SĐT</TableHead>
                                        <TableHead className="text-right font-bold text-[11px] uppercase pr-6 py-3">Nợ cuối kỳ</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredData.map((row) => (
                                        <TableRow key={row.id} className="hover:bg-slate-50 transition-colors">
                                            <TableCell className="font-mono text-[13px] text-blue-600 font-bold pl-6 py-3">
                                                {row.supplierCode}
                                            </TableCell>
                                            <TableCell className="text-[13px] font-medium py-3">
                                                {row.supplierName}
                                            </TableCell>
                                            <TableCell className="text-[13px] text-slate-500 py-3">
                                                {row.phone || "---"}
                                            </TableCell>
                                            <TableCell className="text-right pr-6 text-[14px] font-bold text-rose-600 py-3">
                                                {row.totalDebt.toLocaleString("vi-VN")} ₫
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-24 text-center">
                            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center text-slate-200 mb-6">
                                <Search size={40} strokeWidth={1.5} />
                            </div>
                            <h3 className="text-[15px] font-bold text-slate-700 mb-2">
                                Không tìm thấy nhà cung cấp hoặc nhà cung cấp không có công nợ
                            </h3>
                            <p className="text-[12px] text-slate-400 font-medium">
                                Thử thay đổi điều kiện lọc hoặc từ khóa tìm kiếm
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}