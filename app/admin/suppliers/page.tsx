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
import AdminDataSyncLoader from "@/components/admin/shared/AdminDataSyncLoader";
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
    const [debouncedKeyword, setDebouncedKeyword] = useState("");
    const [status, setStatus] = useState("all");
    const [currentPage, setCurrentPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [totalElements, setTotalElements] = useState(0);
    const pageSize = 20;

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedKeyword(keyword);
        }, 300);
        return () => clearTimeout(timer);
    }, [keyword]);

    const fetchSuppliers = useCallback(async () => {
        setIsLoading(true);
        try {
            const data = await supplierService.getAll(
                debouncedKeyword,
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
    }, [currentPage, debouncedKeyword, status]);

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
                    <div className="flex flex-col gap-2 lg:flex-row lg:items-center">
                        <div className="relative w-full lg:w-[300px]">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                            <Input
                                value={keyword}
                                onChange={(event) => handleSearch(event.target.value)}
                                placeholder="Tìm tên, mã NCC, MST, SĐT..."
                                className="h-[38px] rounded-md border-slate-200 bg-white pl-10 text-[13px] shadow-none focus-visible:ring-blue-500/20"
                            />
                        </div>

                        <div className="w-full lg:w-[200px]">
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
                    </div>

                    <Button
                        onClick={() => router.push("/admin/suppliers/add")}
                        className="h-[38px] rounded-md bg-blue-600 px-4 text-[13px] font-medium text-white shadow-sm hover:bg-blue-700"
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

            <div className="mb-8 overflow-hidden rounded-[4px] border border-[#dcdcdc] bg-white shadow-sm">

                {isLoading && suppliers.length === 0 ? (
                    <AdminDataSyncLoader />
                ) : (
                    <div className={cn("relative transition-opacity duration-200", isLoading && "opacity-60 pointer-events-none")}>
                        {isLoading && (
                            <div className="absolute inset-0 flex items-center justify-center bg-white/20 z-10">
                                <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
                            </div>
                        )}
                        {suppliers.length > 0 ? (
                            <>
                                <AdminSupplierTable suppliers={suppliers} currentPage={currentPage} pageSize={pageSize} onRefresh={fetchSuppliers} />
                                <div className="flex flex-col gap-3 border-t border-slate-100 bg-[#fcfcfc] px-5 py-3 lg:flex-row lg:items-center lg:justify-between">
                                    <p className="text-[11px] text-slate-500">
                                        Hiển thị {currentPage * pageSize + 1} - {Math.min((currentPage + 1) * pageSize, totalElements)} trong {totalElements}
                                    </p>
                                    {totalPages > 0 && (
                                        <div className="flex items-center gap-2">
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                className="h-8 text-[11px] font-medium bg-white"
                                                onClick={() => setCurrentPage(currentPage - 1)}
                                                disabled={currentPage === 0}
                                            >
                                                ← Trước
                                            </Button>
                                            <span className="min-w-[50px] text-center text-[11px] text-slate-500 font-medium">
                                                {currentPage + 1} / {totalPages}
                                            </span>
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                className="h-8 text-[11px] font-medium bg-white"
                                                onClick={() => setCurrentPage(currentPage + 1)}
                                                disabled={currentPage >= totalPages - 1}
                                            >
                                                Sau →
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
                                            setDebouncedKeyword("");
                                            setStatus("all");
                                            setCurrentPage(0);
                                        }}
                                    >
                                        Đặt lại bộ lọc
                                    </Button>
                                ) : (
                                    <Button
                                        className="h-9 bg-blue-600 text-[11px] font-medium hover:bg-blue-700"
                                        onClick={() => router.push("/admin/suppliers/add")}
                                    >
                                        + Tạo supplier đầu tiên
                                    </Button>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </div>
            </div>
        </div>
    );
}
