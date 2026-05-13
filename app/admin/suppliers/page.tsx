"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, ChevronLeft, ChevronRight, PackageSearch, Truck } from "lucide-react";
import { AdminSearchFilter } from "@/components/admin/shared/AdminSearchFilter";
import { AdminSupplierTable } from "@/components/admin/AdminSupplierTable";
import { supplierService } from "@/app/services/supplier.service";
import { Supplier } from "@/app/types/supplier.type";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

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
        <div className="space-y-4 pb-10">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-1 py-1">
                <div>
                    <h1 className="text-[18px] font-black uppercase text-[#1f1f1f] tracking-tight">QUẢN LÝ NHÀ CUNG CẤP</h1>
                    <p className="text-[12px] text-slate-500 font-medium mt-1">
                        Theo dõi hồ sơ đối tác, trạng thái vận hành và chất lượng dữ liệu supplier mà không ảnh hưởng các module kho, mua và bán.
                    </p>
                </div>
                <Button
                    onClick={() => router.push("/admin/suppliers/add")}
                    className="h-[38px] text-[12px] font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-[3px] uppercase px-5"
                >
                    + Thêm nhà cung cấp
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <div className="rounded-[4px] border border-slate-200 bg-white p-4 shadow-sm">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Tổng kết quả</p>
                    <p className="mt-2 text-[22px] font-black text-slate-800">{totalElements}</p>
                    <p className="text-[11px] text-slate-500 mt-1">Theo bộ lọc hiện tại</p>
                </div>
                <div className="rounded-[4px] border border-emerald-100 bg-emerald-50 p-4 shadow-sm">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-700">Đang giao dịch</p>
                    <p className="mt-2 text-[22px] font-black text-emerald-700">{visibleSummary.activeCount}</p>
                    <p className="text-[11px] text-emerald-700/80 mt-1">Trong trang đang hiển thị</p>
                </div>
                <div className="rounded-[4px] border border-slate-200 bg-slate-50 p-4 shadow-sm">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-600">Tạm dừng</p>
                    <p className="mt-2 text-[22px] font-black text-slate-700">{visibleSummary.inactiveCount}</p>
                    <p className="text-[11px] text-slate-500 mt-1">Trong trang đang hiển thị</p>
                </div>
                <div className="rounded-[4px] border border-amber-200 bg-amber-50 p-4 shadow-sm">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-amber-700">Cảnh báo dữ liệu</p>
                    <p className="mt-2 text-[22px] font-black text-amber-700">{visibleSummary.warningCount}</p>
                    <p className="text-[11px] text-amber-700/80 mt-1">Trùng liên hệ hoặc thiếu catalog</p>
                </div>
            </div>

            <div className="bg-white border border-[#dcdcdc] rounded-[4px] shadow-[0_1px_2px_rgba(0,0,0,0.05)] overflow-hidden mb-8">
                <AdminSearchFilter
                    placeholder="Tìm theo tên, mã NCC, MST, SĐT, email..."
                    onSearch={handleSearch}
                    onRefresh={fetchSuppliers}
                    hideSort
                    hideFilter2
                    filter1Placeholder="Tất cả trạng thái"
                    filter1Options={[
                        { label: "Tất cả trạng thái", value: "all" },
                        { label: "Đang giao dịch", value: "ACTIVE" },
                        { label: "Tạm ngừng", value: "INACTIVE" },
                    ]}
                    onFilter1Change={(value) => {
                        setStatus(value);
                        setCurrentPage(0);
                    }}
                />

                {isLoading ? (
                    <div className="p-20 text-center flex flex-col items-center gap-2">
                        <div className="w-6 h-6 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
                        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                            Đang tải dữ liệu...
                        </p>
                    </div>
                ) : suppliers.length > 0 ? (
                    <>
                        <AdminSupplierTable suppliers={suppliers} currentPage={currentPage} pageSize={pageSize} />
                        <div className="flex flex-col gap-3 px-5 py-3 border-t border-[#eee] bg-[#f8f9fa] lg:flex-row lg:items-center lg:justify-between">
                            <div className="flex flex-wrap items-center gap-3 text-[11px] font-bold uppercase tracking-tight text-slate-500">
                                <span>Hiển thị {suppliers.length} / {totalElements} kết quả</span>
                                {keyword.trim() && (
                                    <span className="inline-flex items-center gap-1 rounded border border-blue-200 bg-blue-50 px-2 py-1 text-blue-700">
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
                                className="h-9 text-[11px] font-bold uppercase"
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
                                className="h-9 text-[11px] font-bold uppercase bg-blue-600 hover:bg-blue-700"
                                onClick={() => router.push("/admin/suppliers/add")}
                            >
                                + Tạo supplier đầu tiên
                            </Button>
                        )}
                        <div className="inline-flex items-center gap-2 rounded border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] font-medium text-amber-700">
                            <AlertTriangle size={14} />
                            Tìm kiếm supplier hiện hỗ trợ tên, mã NCC, MST, SĐT và email.
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
