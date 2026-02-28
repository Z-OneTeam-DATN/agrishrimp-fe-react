"use client";

import React, { useEffect, useState } from "react";
import { AdminPageHeader } from "@/components/admin/shared/AdminPageHeader";
import { AdminSearchFilter } from "@/components/admin/shared/AdminSearchFilter";
import { AdminCustomerTable } from "@/components/admin/AdminCustomerTable";
import { customerService } from "@/app/services/customer.service";
import { toast } from "sonner";

export default function CustomerManagementPage() {
    const [customers, setCustomers] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [keyword, setKeyword] = useState("");
    const [status, setStatus] = useState("all");
    const [page, setPage] = useState(0);
    const [pageSize] = useState(5);
    const [totalElements, setTotalElements] = useState(0);
    const [totalPages, setTotalPages] = useState(0);

    const fetchCustomers = async () => {
        setIsLoading(true);
        try {
            const data = await customerService.getAll(
                keyword,
                status,
                page,
                pageSize,
            );
            setCustomers(data.content || []);
            setTotalElements(data.totalElements || 0);
            setTotalPages(data.totalPages || 0);
        } catch (error) {
            console.error("Lỗi fetch khách hàng:", error);
            toast.error("Không thể tải danh sách khách hàng");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchCustomers();
    }, [keyword, status, page]);

    const statusFilters = [
        { label: "Trạng thái: Tất cả", value: "all" },
        { label: "Đang hoạt động", value: "ACTIVE" },
        { label: "Đang bị khóa", value: "INACTIVE" },
    ];

    return (
        <div className="space-y-3 relative">
            <AdminPageHeader
                title="Quản lý danh sách khách hàng"
                addBtnLabel="Thêm khách hàng"
                addBtnHref="/admin/customers/add"
            />

            <div className="bg-white border border-[#dcdcdc] rounded-[4px] shadow-[0_1px_2px_rgba(0,0,0,0.05)] overflow-hidden mb-8">
                <AdminSearchFilter
                    placeholder="Tìm tên, số điện thoại..."
                    // ✅ THÊM 2 DÒNG NÀY ĐỂ ẨN Ô TRỐNG VÀ Ô MỚI NHẤT
                    hideFilter1={true}
                    hideSort={true}
                    // ============================================
                    filter2Placeholder="Trạng thái tài khoản"
                    filter2Options={statusFilters}
                    onSearch={(val) => {
                        setKeyword(val);
                        setPage(0);
                    }}
                    onFilter2Change={(val) => {
                        setStatus(val);
                        setPage(0);
                    }}
                    onRefresh={fetchCustomers}
                />

                {isLoading ? (
                    <div className="p-20 text-center flex flex-col items-center gap-2">
                        <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                        <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">
                            Đang truy xuất dữ liệu...
                        </p>
                    </div>
                ) : (
                    <AdminCustomerTable
                        customers={customers}
                        currentPage={page}
                        pageSize={pageSize}
                        totalPages={totalPages}
                        totalElements={totalElements}
                        onPageChange={(newPage) => setPage(newPage)}
                    />
                )}
            </div>
        </div>
    );
}