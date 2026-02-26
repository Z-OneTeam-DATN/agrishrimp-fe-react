"use client";

import React, { useEffect, useState } from "react";
import { AdminPageHeader } from "@/components/admin/shared/AdminPageHeader";
import { AdminSearchFilter } from "@/components/admin/shared/AdminSearchFilter";
import { AdminSupplierTable } from "@/components/admin/AdminSupplierTable";
import { supplierService } from "@/app/services/supplier.service";
import { Supplier } from "@/app/types/supplier.type";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { ChevronLeft, ChevronRight, Truck } from "lucide-react";
import { cn } from "@/lib/utils";

export default function SupplierListPage() {
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [keyword, setKeyword] = useState("");
    const [categoryId, setCategoryId] = useState("all");
    const [status, setStatus] = useState("all");
    const [currentPage, setCurrentPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [totalElements, setTotalElements] = useState(0);
    const [dynamicCategories, setDynamicCategories] = useState<{ label: string; value: string }[]>([]);
    const pageSize = 5;

    const fetchDynamicCategories = async () => {
        try {
            const data = await supplierService.getCategories();
            const options = data.map((cat: { id: number | string; name: string }) => ({
                label: cat.name,
                value: cat.id.toString(),
            }));
            setDynamicCategories(options);
        } catch (error) {
            console.error("Không load được danh mục động:", error);
        }
    };

    const fetchSuppliers = async () => {
        setIsLoading(true);
        try {
            const data = await supplierService.getAll(
                keyword,
                categoryId === "all" ? undefined : categoryId,
                status === "all" ? undefined : status,
                currentPage,
                pageSize,
            );

            setSuppliers(data.content);
            setTotalPages(data.totalPages);
            setTotalElements(data.totalElements);
        } catch (error) {
            toast.error("Không thể tải danh sách nhà cung cấp");
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchDynamicCategories();
    }, []);

    useEffect(() => {
        fetchSuppliers();
        const handleUpdate = () => fetchSuppliers();
        window.addEventListener("supplierUpdated", handleUpdate);
        return () => window.removeEventListener("supplierUpdated", handleUpdate);

    }, [keyword, currentPage, categoryId, status]);

    const handleSearch = (val: string) => {
        setKeyword(val);
        setCurrentPage(0);
    };

    return (
        <div className="space-y-3 pb-10">
            <AdminPageHeader
                title="Quản lý nhà cung cấp hàng hóa"
                addBtnLabel="Thêm nhà cung cấp"
                addBtnHref="/admin/suppliers/add"
            />

            <div className="bg-white border border-[#dcdcdc] rounded-[4px] shadow-[0_1px_2px_rgba(0,0,0,0.05)] overflow-hidden mb-8">
                <AdminSearchFilter
                    placeholder="Tìm tên, MST, SĐT..."
                    onSearch={handleSearch}
                    onRefresh={fetchSuppliers}
                    filter1Options={dynamicCategories}
                    onFilter1Change={(val) => {
                        setCategoryId(val);
                        setCurrentPage(0);
                    }}
                    onFilter2Change={(val) => {
                        setStatus(val);
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
                        <AdminSupplierTable suppliers={suppliers} />

                        {/* 👇 THANH PHÂN TRANG CHUẨN XỊN NHƯ SHOPEE NẰM Ở ĐÂY */}
                        <div className="flex items-center justify-between px-5 py-3 border-t border-[#eee] bg-[#f8f9fa]">
                            <p className="text-[11px] text-slate-500 font-bold uppercase tracking-tight">
                                Đang hiển thị {suppliers.length} / Tổng số {totalElements} kết quả
                            </p>

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
                                            // Chỉ hiện trang đầu, cuối, trang hiện tại, trước và sau trang hiện tại 1 đơn vị
                                            if (
                                                index === 0 ||
                                                index === totalPages - 1 ||
                                                (index >= currentPage - 1 && index <= currentPage + 1)
                                            ) {
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
                                                                : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                                                        )}
                                                    >
                                                        {index + 1}
                                                    </Button>
                                                );
                                            }

                                            // Hiện dấu ... thay cho những trang bị ẩn
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
                    <div className="p-20 text-center flex flex-col items-center justify-center gap-3">
                        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-300 border-2 border-slate-100">
                            <Truck size={32} />
                        </div>
                        <p className="text-[12px] text-slate-400 font-bold uppercase tracking-widest">
                            Không tìm thấy nhà cung cấp nào
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}