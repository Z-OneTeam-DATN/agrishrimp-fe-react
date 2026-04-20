"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
    ChevronLeft,
    ChevronDown,
    HelpCircle,
    Download,
    Search,
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
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { FinancialService, SupplierDebtData } from "@/app/services/financial.service";
import { branchService } from "@/app/services/branchService";
import { toast } from "sonner";
import * as XLSX from "xlsx";
import { useAuthStore } from "@/stores/useAuthStore";
import { isAdminRole } from "@/lib/roles";

type BranchOption = { id: number; name: string };
type StaffOption = { id: number; displayName: string };
type BranchApiItem = { id?: number | string; name?: string };
type StaffApiItem = { id?: number | string; displayName?: string; name?: string; username?: string };

const toIsoDate = (date: Date) => date.toISOString().slice(0, 10);

export default function SupplierDebtReportPage() {
    const router = useRouter();
    const { user, warehouseId } = useAuthStore();
    const isAdmin = isAdminRole(user?.role);
    const ownBranchId = (user?.branch?.id ?? warehouseId)?.toString() || "";

    const [loading, setLoading] = useState(false);
    const [data, setData] = useState<SupplierDebtData[]>([]);
    const [searchTerm, setSearchTerm] = useState("");
    const today = new Date();
    const [startDate, setStartDate] = useState(() => toIsoDate(new Date(today.getFullYear(), today.getMonth(), 1)));
    const [endDate, setEndDate] = useState(() => toIsoDate(today));
    const [branchId, setBranchId] = useState<string>(isAdmin ? "all" : ownBranchId || "all");
    const [staffId, setStaffId] = useState<string>("all");
    const [branches, setBranches] = useState<BranchOption[]>([]);
    const [staffs, setStaffs] = useState<StaffOption[]>([]);
    const [isExplainOpen, setIsExplainOpen] = useState(false);

    const [debtFilter, setDebtFilter] = useState<string>("not_zero"); // "all", "not_zero", "zero"

    useEffect(() => {
        const loadOptions = async () => {
            try {
                const [branchRes, staffRes] = await Promise.all([
                    branchService.getAll(),
                    branchService.getAllStaff(),
                ]);

                const branchItems = Array.isArray(branchRes) ? branchRes : (branchRes?.data || branchRes?.content || []);
                const normalizedBranches = (branchItems as BranchApiItem[]).map((item) => ({ id: Number(item.id), name: item.name || "Chi nhánh" }));
                if (!isAdmin && ownBranchId) {
                    setBranches(normalizedBranches.filter((item) => String(item.id) === ownBranchId));
                } else {
                    setBranches(normalizedBranches);
                }

                const staffItems = Array.isArray(staffRes) ? staffRes : (staffRes?.data || staffRes?.content || []);
                setStaffs(
                    (staffItems as StaffApiItem[])
                        .filter((item) => item?.id)
                        .map((item) => ({
                            id: Number(item.id),
                            displayName: item.displayName || item.name || item.username || `User ${item.id}`,
                        }))
                );
            } catch (error) {
                console.error("Lỗi tải bộ lọc công nợ", error);
            }
        };

        loadOptions();
    }, [isAdmin, ownBranchId]);

    useEffect(() => {
        if (!isAdmin && ownBranchId) {
            setBranchId(ownBranchId);
        }
    }, [isAdmin, ownBranchId]);

    useEffect(() => {
        const delayDebounceFn = setTimeout(async () => {
            setLoading(true);
            try {
                const res = await FinancialService.getSupplierDebts({
                    search: searchTerm,
                    startDate,
                    endDate,
                    branchId,
                    staffId,
                    debtFilter: debtFilter as "all" | "not_zero" | "zero",
                });
                setData(Array.isArray(res) ? res : []);
            } catch (error) {
                console.error("Lỗi lấy công nợ:", error);
            } finally {
                setLoading(false);
            }
        }, 400);

        return () => clearTimeout(delayDebounceFn);
    }, [searchTerm, startDate, endDate, branchId, staffId, debtFilter]);

    const handleExportExcel = () => {
        if (!data || data.length === 0) {
            toast.error("Không có dữ liệu để xuất!");
            return;
        }

        const excelData = data.map((row) => ({
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

                <div className="ms-auto flex items-center gap-3">
                    <Input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="h-8 w-[140px] text-[12px] border-slate-300 rounded-none shadow-none font-medium"
                    />
                    <Input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="h-8 w-[140px] text-[12px] border-slate-300 rounded-none shadow-none font-medium"
                    />
                    <button onClick={handleExportExcel} className="flex items-center gap-1.5 text-[11px] text-slate-600 font-black hover:text-emerald-600 transition-colors uppercase">
                        <Download size={16} /> Xuất file
                    </button>
                    <button onClick={() => setIsExplainOpen(true)} className="flex items-center gap-1.5 text-[11px] text-slate-600 font-black hover:text-blue-600 transition-colors uppercase">
                        <HelpCircle size={16} /> Trợ giúp
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

                        <Select value={branchId} onValueChange={setBranchId}>
                            <SelectTrigger className="h-[36px] w-[180px] rounded-none border-slate-200 text-[12px] shadow-none" disabled={!isAdmin}>
                                <SelectValue placeholder="Chi nhánh" />
                            </SelectTrigger>
                            <SelectContent className="rounded-none">
                                {isAdmin && <SelectItem value="all">Tất cả chi nhánh</SelectItem>}
                                {branches.map((branch) => (
                                    <SelectItem key={branch.id} value={String(branch.id)}>{branch.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        <Select value={staffId} onValueChange={setStaffId}>
                            <SelectTrigger className="h-[36px] w-[180px] rounded-none border-slate-200 text-[12px] shadow-none">
                                <SelectValue placeholder="Nhân viên phụ trách" />
                            </SelectTrigger>
                            <SelectContent className="rounded-none">
                                <SelectItem value="all">Tất cả nhân viên</SelectItem>
                                {staffs.map((staff) => (
                                    <SelectItem key={staff.id} value={String(staff.id)}>{staff.displayName}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {debtFilter !== "all" && (
                        <div className="px-6 py-2 flex items-center gap-2 bg-white border-b border-slate-50">
                            <div className="bg-blue-50 text-blue-600 px-2 py-1 text-[11px] font-medium border border-blue-100">
                                Nợ cuối kỳ: {debtFilter === "not_zero" ? "Khác 0" : "Bằng 0"}
                            </div>
                        </div>
                    )}

                    {/* Vùng hiển thị dữ liệu */}
                    {loading ? (
                        <div className="flex items-center justify-center py-24">
                            <Loader2 className="animate-spin text-blue-600" size={32}/>
                        </div>
                    ) : data.length > 0 ? (
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
                                    {data.map((row) => (
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

            <Dialog open={isExplainOpen} onOpenChange={setIsExplainOpen}>
                <DialogContent className="max-w-2xl rounded-none">
                    <DialogHeader>
                        <DialogTitle className="uppercase">Trợ giúp công nợ nhà cung cấp</DialogTitle>
                        <DialogDescription>
                            Màn này lọc công nợ thật theo kỳ, chi nhánh, nhân viên phụ trách và trạng thái nợ cuối kỳ.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-3 text-sm text-slate-600">
                        <p><span className="font-bold text-slate-800">Từ ngày / đến ngày:</span> lọc các phiếu nhập có phát sinh công nợ trong khoảng thời gian đã chọn.</p>
                        <p><span className="font-bold text-slate-800">Chi nhánh / nhân viên phụ trách:</span> thu hẹp dữ liệu theo đơn vị xử lý thực tế.</p>
                        <p><span className="font-bold text-slate-800">Nợ cuối kỳ:</span> chọn tất cả, chỉ NCC còn nợ hoặc chỉ NCC bằng 0.</p>
                        <p><span className="font-bold text-slate-800">Xuất file:</span> tải danh sách công nợ ra Excel để đối soát hoặc gửi kế toán.</p>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}