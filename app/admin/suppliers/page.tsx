"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, Loader2, PackageSearch, Plus, Search, Truck } from "lucide-react";
import { AdminSupplierTable } from "@/components/admin/AdminSupplierTable";
import { supplierService } from "@/app/services/supplier.service";
import { Supplier } from "@/app/types/supplier.type";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

export default function SupplierListPage() {
    const router = useRouter();
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [keyword, setKeyword] = useState("");
    const [status, setStatus] = useState("all");
    const [currentPage, setCurrentPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [totalElements, setTotalElements] = useState(0);
    const pageSize = 5;

    const fetchSuppliers = useCallback(async () => {
        setIsLoading(true);
        try {
            const data = await supplierService.getAll(
                keyword,
                status === "all" ? undefined : status,
                currentPage,
                pageSize,
            );

            setSuppliers(data?.content ?? []);
            setTotalPages(data?.totalPages ?? 0);
            setTotalElements(data?.totalElements ?? 0);
        } catch (error) {
            toast.error("Không thể tải danh sách nhà cung cấp");
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    }, [currentPage, keyword, status]);

    useEffect(() => {
        void fetchSuppliers();
        const handleUpdate = () => void fetchSuppliers();
        window.addEventListener("supplierUpdated", handleUpdate);
        return () => window.removeEventListener("supplierUpdated", handleUpdate);
    }, [fetchSuppliers]);

    const handleSearch = (value: string) => {
        setKeyword(value);
        setCurrentPage(0);
    };

    const visibleSummary = useMemo(() => {
        const activeCount = suppliers.filter((supplier) => supplier.status === "ACTIVE").length;
        const inactiveCount = suppliers.filter((supplier) => supplier.status === "INACTIVE").length;
        const warningCount = suppliers.reduce((sum, supplier) => sum + (supplier.warnings?.length ?? 0), 0);
        return { activeCount, inactiveCount, warningCount };
    }, [suppliers]);

    return (
        <div className="space-y-3">
            <div className="mb-8 mt-2 space-y-4 px-1">
                <h1 className="text-[20px] font-semibold uppercase tracking-tight text-slate-900">
                    Quản lý nhà cung cấp
                </h1>

                <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
                    <div className="w-full xl:max-w-[260px]">
                        <Select
                            value={status}
                            onValueChange={(value) => {
                                setStatus(value);
                                setCurrentPage(0);
                            }}
                        >
                            <SelectTrigger className="h-[38px] w-full rounded-md border-slate-200 bg-white text-[13px] shadow-none focus:ring-0">
                                <SelectValue placeholder="Tất cả trạng thái" />
                            </SelectTrigger>
                            <SelectContent className="rounded-md">
                                <SelectItem value="all">Tất cả trạng thái</SelectItem>
                                <SelectItem value="ACTIVE">Đang giao dịch</SelectItem>
                                <SelectItem value="INACTIVE">Tạm ngừng</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <Button
                        onClick={() => router.push("/admin/suppliers/add")}
                        className="h-[38px] rounded-md bg-emerald-600 px-4 text-[13px] font-medium text-white shadow-sm hover:bg-emerald-700"
                    >
                        <Plus className="mr-2 h-4 w-4" />
                        Thêm nhà cung cấp
                    </Button>
                </div>

                <div className="grid grid-cols-1 gap-2.5 md:grid-cols-2 xl:grid-cols-4">
                    {[
                        { title: "Tổng nhà cung cấp", value: totalElements, description: "Số hồ sơ theo bộ lọc hiện tại" },
                        { title: "Đang giao dịch", value: visibleSummary.activeCount, description: "Nhà cung cấp đang hoạt động trong trang" },
                        { title: "Tạm ngừng", value: visibleSummary.inactiveCount, description: "Nhà cung cấp đang tạm dừng trong trang" },
                        { title: "Cảnh báo dữ liệu", value: visibleSummary.warningCount, description: "Thông tin cần kiểm tra hoặc bổ sung" },
                    ].map((card) => (
                        <div key={card.title} className="rounded-[4px] border border-[#dcdcdc] bg-white p-3 shadow-sm">
                            <p className="text-[11px] font-semibold text-slate-400">{card.title}</p>
                            <div className="mt-3 space-y-1">
                                <p className="text-[22px] font-semibold leading-none tracking-tight text-slate-900">{card.value}</p>
                                <p className="text-[10px] leading-4.5 text-slate-500">{card.description}</p>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="flex justify-end">
                    <div className="relative w-full xl:max-w-[360px]">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                        <Input
                            value={keyword}
                            onChange={(event) => handleSearch(event.target.value)}
                            placeholder="Tìm tên, mã NCC, MST, SĐT..."
                            className="h-[38px] rounded-md border-slate-200 bg-white pl-10 text-[13px] shadow-none focus-visible:ring-blue-500/20"
                        />
                    </div>
                </div>

            <div className="mb-8 overflow-hidden rounded-[4px] border border-[#dcdcdc] bg-white shadow-sm">

                {isLoading ? (
                    <div className="flex flex-col items-center justify-center bg-white py-20 text-slate-400">
                        <Loader2 className="mb-3 h-8 w-8 animate-spin text-emerald-600" />
                        <p className="px-10 text-center text-[11px] uppercase tracking-widest text-slate-400">
                            Đang tải dữ liệu...
                        </p>
                    </div>
                ) : suppliers.length > 0 ? (
                    <>
                        <AdminSupplierTable suppliers={suppliers} currentPage={currentPage} pageSize={pageSize} />
                        <div className="flex flex-col gap-3 border-t border-slate-100 bg-[#f8f9fa] px-5 py-3 lg:flex-row lg:items-center lg:justify-between">
                            <div className="flex flex-wrap items-center gap-3 text-[11px] font-medium text-slate-500">
                                <span>Hiển thị {suppliers.length} / {totalElements} kết quả</span>
                                {keyword.trim() && (
                                    <span className="inline-flex items-center gap-1 text-blue-600">
                                        <PackageSearch size={12} />
                                        Từ khóa: {keyword.trim()}
                                    </span>
                                )}
                            </div>
                            {totalPages > 0 && (
                                <div className="flex items-center gap-1.5">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setCurrentPage(currentPage - 1)}
                                        disabled={currentPage === 0}
                                        className="h-7 px-2 text-[11px] font-bold bg-white border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-50 transition-all"
                                    >
                                        <ChevronLeft size={14} className="mr-1" /> Trước
                                    </Button>
                                    <div className="flex items-center gap-1">
                                        {Array.from({ length: totalPages }).map((_, index) => {
                                            if (index === 0 || index === totalPages - 1 || (index >= currentPage - 1 && index <= currentPage + 1)) {
                                                return (
                                                    <Button
                                                        key={index}
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => setCurrentPage(index)}
                                                        className={cn(
                                                            "h-7 min-w-[28px] px-2 p-0 text-[11px] font-bold shadow-sm transition-all",
                                                            currentPage === index
                                                                ? "bg-emerald-600 text-white border-emerald-600 hover:bg-emerald-700 hover:text-white"
                                                                : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50",
                                                        )}
                                                    >
                                                        {index + 1}
                                                    </Button>
                                                );
                                            }

                                            if (index === currentPage - 2 || index === currentPage + 2) {
                                                return <span key={index} className="text-slate-400 text-[10px] px-1 tracking-widest">...</span>;
                                            }

                                            return null;
                                        })}
                                    </div>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setCurrentPage(currentPage + 1)}
                                        disabled={currentPage >= totalPages - 1}
                                        className="h-7 px-2 text-[11px] font-bold bg-white border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-50 transition-all"
                                    >
                                        Sau <ChevronRight size={14} className="ml-1" />
                                    </Button>
                                </div>
                            )}
                        </div>
                    </>
                ) : (
                    <div className="p-16 text-center flex flex-col items-center justify-center gap-4">
                        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-300 border-2 border-slate-100">
                            {keyword || status !== "all" ? <PackageSearch size={32} /> : <Truck size={32} />}
                        </div>
                        <div className="space-y-1">
                            <p className="text-[13px] text-slate-600 font-black uppercase tracking-widest">
                                {keyword || status !== "all" ? "Không có nhà cung cấp khớp bộ lọc" : "Chưa có nhà cung cấp nào"}
                            </p>
                            <p className="text-[12px] text-slate-400 max-w-[420px]">
                                {keyword || status !== "all"
                                    ? "Thử tìm theo mã NCC, MST, email hoặc đổi lại trạng thái lọc để xem thêm kết quả."
                                    : "Bắt đầu bằng việc tạo hồ sơ supplier đầu tiên để quản lý catalog và lịch sử nhập hàng rõ ràng hơn."}
                            </p>
                        </div>
                        {keyword || status !== "all" ? (
                            <Button
                                variant="outline"
                                className="h-9 text-[11px] font-medium"
                                onClick={() => {
                                    setKeyword("");
                                    setStatus("all");
                                    setCurrentPage(0);
                                }}
                            >
                                Đặt lại bộ lọc
                            </Button>
                        ) : (
                            <Button
                                className="h-9 bg-emerald-600 text-[11px] font-medium hover:bg-emerald-700"
                                onClick={() => router.push("/admin/suppliers/add")}
                            >
                                + Tạo supplier đầu tiên
                            </Button>
                        )}
                    </div>
                )}
            </div>
            </div>
        </div>
    );
}
