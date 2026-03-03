"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
    Search,
    Download,
    PlusCircle,
    Filter,
    Settings,
    ChevronDown,
    ChevronUp,
    ChevronLeft,
    ChevronRight,
    FileText,
    Truck,
    Package,
    Calendar,
    User,
    Loader2,
    AlertCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { orderService } from "@/app/services/order.service";
import { toast } from "sonner";

const HANDOVER_TABS = [
    { id: "all", label: "Tất cả" },
    { id: "WAITING", label: "Chờ bàn giao" },
    { id: "COMPLETED", label: "Đã bàn giao" },
];

const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(amount || 0);

export default function HandoverPage() {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState("all");
    const [expandedId, setExpandedId] = useState<number | null>(null);

    // --- STATE DỮ LIỆU THẬT ---
    const [handovers, setHandovers] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");

    // 1. GỌI API LẤY DANH SÁCH PHIẾU
    const loadHandovers = async () => {
        setIsLoading(true);
        try {
            const data = await orderService.getHandoverList();
            setHandovers(data);
        } catch (error) {
            toast.error("Không thể tải lịch sử bàn giao");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadHandovers();
    }, []);

    // 2. LỌC DỮ LIỆU THEO TAB VÀ SEARCH
    const filteredData = useMemo(() => {
        return handovers.filter((item) => {
            const matchTab = activeTab === "all" || item.status === activeTab;
            const matchSearch = searchTerm === "" ||
                item.code.toLowerCase().includes(searchTerm.toLowerCase());
            return matchTab && matchSearch;
        });
    }, [handovers, activeTab, searchTerm]);

    const toggleRow = (id: number) => {
        setExpandedId(expandedId === id ? null : id);
    };

    return (
        <div className="p-4 space-y-4 bg-slate-50 min-h-screen">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <h1 className="text-[18px] font-bold text-slate-800 uppercase tracking-tight">
                    Lịch sử bàn giao vận chuyển
                </h1>
                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        className="h-[32px] bg-white border-slate-300 text-slate-600 text-[12px] font-bold"
                        onClick={loadHandovers}
                    >
                        Làm mới
                    </Button>

                    <Button
                        onClick={() => router.push('/admin/orders-handover/create')}
                        className="h-[32px] bg-blue-600 hover:bg-blue-700 text-white text-[12px] font-bold shadow-sm"
                    >
                        <PlusCircle size={14} className="mr-2" /> Tạo biên bản mới
                    </Button>
                </div>
            </div>

            {/* SEARCH & FILTER */}
            <div className="bg-white p-3 rounded-[4px] border border-[#dcdcdc] shadow-sm space-y-3">
                <div className="flex gap-2">
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <Input
                            placeholder="Tìm kiếm theo mã phiếu bàn giao (VD: BG...)"
                            className="pl-9 h-[34px] text-[13px] border-slate-300 bg-white"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <div className="flex flex-wrap gap-2">
                    <FilterButton label="Đối tác vận chuyển" />
                    <FilterButton label="Thời gian tạo" />
                </div>
            </div>

            <div className="bg-white rounded-[4px] border border-[#dcdcdc] shadow-sm overflow-hidden">
                {/* TABS */}
                <div className="flex items-center border-b border-[#eee] px-4 overflow-x-auto bg-[#fcfcfc]">
                    {HANDOVER_TABS.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={cn(
                                "py-3 px-4 text-[13px] font-medium border-b-2 transition-colors whitespace-nowrap",
                                activeTab === tab.id
                                    ? "border-blue-600 text-blue-600 font-bold"
                                    : "border-transparent text-slate-500 hover:text-blue-500"
                            )}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                <div className="w-full overflow-x-auto">
                    <Table>
                        <TableHeader className="bg-[#f8fafc]">
                            <TableRow className="border-b border-slate-200">
                                <TableHead className="w-[40px] pl-4"><Settings size={14} className="text-slate-400" /></TableHead>
                                <TableHead className="text-[12px] font-bold text-slate-700 uppercase">Mã phiếu</TableHead>
                                <TableHead className="text-[12px] font-bold text-slate-700 uppercase">Thời gian tạo</TableHead>
                                <TableHead className="text-[12px] font-bold text-slate-700 uppercase">Đối tác</TableHead>
                                <TableHead className="text-[12px] font-bold text-slate-700 uppercase text-center">Số kiện</TableHead>
                                <TableHead className="text-[12px] font-bold text-slate-700 uppercase text-right">Tổng COD</TableHead>
                                <TableHead className="text-[12px] font-bold text-slate-700 uppercase text-center">Trạng thái</TableHead>
                                <TableHead className="text-[12px] font-bold text-slate-700 uppercase">Người tạo</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                <TableRow>
                                    <TableCell colSpan={8} className="h-40 text-center">
                                        <Loader2 className="h-8 w-8 animate-spin mx-auto text-slate-300" />
                                    </TableCell>
                                </TableRow>
                            ) : filteredData.length > 0 ? (
                                filteredData.map((item) => {
                                    const isExpanded = expandedId === item.id;
                                    return (
                                        <React.Fragment key={item.id}>
                                            <TableRow
                                                className={cn(
                                                    "border-b border-slate-100 transition-colors cursor-pointer hover:bg-slate-50",
                                                    isExpanded && "bg-blue-50/30"
                                                )}
                                                onClick={() => toggleRow(item.id)}
                                            >
                                                <TableCell className="pl-4 text-center text-slate-400">
                                                    {isExpanded ? <ChevronDown size={14} className="text-blue-600" /> : <ChevronRight size={14} />}
                                                </TableCell>
                                                <TableCell>
                                                    <span className="text-[13px] font-bold text-blue-600">{item.code}</span>
                                                </TableCell>
                                                <TableCell className="text-[12px] text-slate-600">
                                                    {new Date(item.createdAt).toLocaleString("vi-VN")}
                                                </TableCell>
                                                <TableCell className="text-[13px] font-semibold text-slate-700">
                                                    {item.carrier}
                                                </TableCell>
                                                <TableCell className="text-[13px] text-center font-bold text-slate-800">
                                                    {item.totalOrders}
                                                </TableCell>
                                                <TableCell className="text-[13px] text-right font-black text-emerald-700">
                                                    {formatCurrency(item.totalCod)}
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    <StatusBadge status={item.status} />
                                                </TableCell>
                                                <TableCell className="text-[12px] text-slate-600 font-medium">
                                                    {item.creatorName}
                                                </TableCell>
                                            </TableRow>

                                            {isExpanded && (
                                                <TableRow className="bg-[#fcfdfe]">
                                                    <TableCell colSpan={8} className="p-5 border-b border-blue-100">
                                                        <div className="flex items-center justify-between bg-white p-4 rounded border border-slate-200 shadow-sm">
                                                            <div className="flex items-center gap-4">
                                                                <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center text-blue-600">
                                                                    <FileText size={20} />
                                                                </div>
                                                                <div>
                                                                    <p className="text-[14px] font-bold text-slate-800">Chi tiết biên bản {item.code}</p>
                                                                    <p className="text-[12px] text-slate-500">Bấm nút bên phải để xem danh sách đơn và in phiếu</p>
                                                                </div>
                                                            </div>
                                                            <Button
                                                                size="sm"
                                                                className="bg-blue-600 hover:bg-blue-700 font-bold text-[12px]"
                                                                onClick={() => router.push(`/admin/orders-handover/${item.id}`)}
                                                            >
                                                                Xem & In biên bản bàn giao
                                                            </Button>
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            )}
                                        </React.Fragment>
                                    );
                                })
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={8} className="h-40 text-center text-slate-400">
                                        <div className="flex flex-col items-center gap-2">
                                            <AlertCircle size={30} className="opacity-20" />
                                            <p className="text-[14px]">Không tìm thấy phiếu bàn giao nào</p>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
            </div>
        </div>
    );
}

const FilterButton = ({ label }: { label: string }) => (
    <Button variant="outline" className="h-[30px] px-3 text-[11px] font-bold text-slate-500 bg-white border-slate-300 uppercase tracking-tighter">
        {label} <ChevronDown size={12} className="ml-1 opacity-50" />
    </Button>
);

const StatusBadge = ({ status }: { status: string }) => {
    const config: any = {
        WAITING: { label: "Chờ bàn giao", class: "bg-amber-50 text-amber-600 border-amber-100" },
        COMPLETED: { label: "Đã bàn giao", class: "bg-emerald-50 text-emerald-600 border-emerald-100" }
    };

    const style = config[status] || { label: status, class: "bg-slate-50 text-slate-500 border-slate-200" };

    return (
        <span className={cn("px-2.5 py-0.5 rounded-full text-[10px] border font-bold uppercase tracking-tight", style.class)}>
             ● {style.label}
        </span>
    )
}