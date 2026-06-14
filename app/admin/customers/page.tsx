"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { AdminCustomerTable } from "@/components/admin/AdminCustomerTable";
import { customerService } from "@/app/services/customer.service";
import { useAuthStore } from "@/stores/useAuthStore";
import { toast } from "sonner";
import { usePermissions } from "@/hooks/usePermissions";
import { P } from "@/lib/permissions";
import { useRouter } from "next/navigation";
import { Loader2, Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import AdminDataSyncLoader from "@/components/admin/shared/AdminDataSyncLoader";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

interface CustomerSummary {
    userId: number;
    fullName: string;
    email: string;
    phone: string;
    provider: string;
    userStatus: string;
    createdAt: string;
    customerId?: number;
    customerStatus?: string;
    addressDetail?: string;
    totalOrders?: number;
    totalSpent?: number;
    reputationScore?: number;
    riskLevel?: string;
    onlinePaymentOnly?: boolean;
    avatarUrl?: string;
}

export default function CustomerManagementPage() {
    const { hasPermission } = usePermissions();
    const router = useRouter();
    const { isLoadingAuth } = useAuthStore();


    const [customers, setCustomers] = useState<CustomerSummary[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [keyword, setKeyword] = useState("");
    const [status, setStatus] = useState("all");
    const [page, setPage] = useState(0);
    const [pageSize] = useState(20);
    const [totalElements, setTotalElements] = useState(0);
    const [totalPages, setTotalPages] = useState(0);

    useEffect(() => {
        if (!isLoadingAuth && !hasPermission(P.CUSTOMER_VIEW)) {
            router.push("/admin/forbidden");
        }
    }, [isLoadingAuth, hasPermission, router]);

    const fetchCustomers = useCallback(async () => {
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
    }, [keyword, page, pageSize, status]);

    useEffect(() => {
        fetchCustomers();
    }, [fetchCustomers]);

    const statusFilters = [
        { label: "Tất cả trạng thái", value: "all" },
        { label: "Đang hoạt động", value: "ACTIVE" },
        { label: "Đang bị khóa", value: "INACTIVE" },
    ];

    const overviewCards = useMemo(() => {
        const activeCustomers = customers.filter((customer) => customer.userStatus === "ACTIVE").length;
        const lockedCustomers = customers.filter((customer) => customer.userStatus !== "ACTIVE").length;
        const oneMonthAgo = new Date();
        oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
        const newCustomersThisMonth = customers.filter((customer) => {
            if (!customer.createdAt) return false;
            const createdAt = new Date(customer.createdAt);
            return !Number.isNaN(createdAt.getTime()) && createdAt >= oneMonthAgo;
        }).length;

        return [
            {
                title: "Tổng khách hàng",
                value: totalElements,
                description: "Khách hàng trong hệ thống",
            },
            {
                title: "Đang hoạt động",
                value: activeCustomers,
                description: "Khách hàng đang hiển thị ở trang này",
            },
            {
                title: "Bị khóa",
                value: lockedCustomers,
                description: "Tài khoản tạm ngưng ở trang này",
            },
            {
                title: "Khách mới tháng này",
                value: newCustomersThisMonth,
                description: "Tăng trong 30 ngày gần nhất",
            },
        ];
    }, [customers, totalElements]);

    if (isLoadingAuth) {
        return (
            <div className="p-20 text-center flex flex-col items-center gap-2">
                <Loader2 className="h-7 w-7 animate-spin text-emerald-600" />
            </div>
        );
    }

    return (
        <div className="space-y-3">
            <div className="mt-2 mb-8 space-y-4 px-1">
                <div>
                    <h1 className="text-[20px] font-semibold tracking-tight uppercase text-slate-900">
                        Quản lý khách hàng
                    </h1>
                </div>

                <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 xl:grid-cols-4">
                    {overviewCards.map((card) => (
                        <div
                            key={card.title}
                            className="rounded-[4px] border border-[#dcdcdc] bg-white p-3 shadow-sm"
                        >
                            <p className="text-[11px] font-semibold text-slate-400">
                                {card.title}
                            </p>
                            <div className="mt-3 space-y-1">
                                <p className="text-[22px] font-semibold leading-none tracking-tight text-slate-900">
                                    {card.value.toLocaleString("vi-VN")}
                                </p>
                                <p className="text-[10px] leading-[18px] text-slate-500">
                                    {card.description}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
                    <div className="flex flex-col gap-2 lg:flex-row lg:items-center">
                        <Select
                            value={status}
                            onValueChange={(value) => {
                                setStatus(value);
                                setPage(0);
                            }}
                        >
                            <SelectTrigger className="h-[38px] w-full rounded-md border-slate-200 bg-white text-[13px] font-normal shadow-none focus:ring-0 lg:w-[190px]">
                                <SelectValue placeholder="Tất cả trạng thái" />
                            </SelectTrigger>
                            <SelectContent>
                                {statusFilters.map((item) => (
                                    <SelectItem key={item.value} value={item.value} className="text-[13px]">
                                        {item.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        <div className="relative w-full lg:w-[300px]">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                            <Input
                                value={keyword}
                                onChange={(event) => {
                                    setKeyword(event.target.value);
                                    setPage(0);
                                }}
                                placeholder="Tìm tên, số điện thoại..."
                                className="h-[38px] rounded-md border-slate-200 bg-white pl-10 text-[13px] shadow-none focus-visible:ring-blue-500/20"
                            />
                        </div>
                    </div>

                    {hasPermission(P.CUSTOMER_CREATE) && (
                        <Button
                            onClick={() => router.push("/admin/customers/add")}
                            className="h-[38px] rounded-md bg-emerald-600 px-4 text-[13px] font-medium text-white shadow-sm hover:bg-emerald-700"
                        >
                            <Plus size={15} className="mr-2" />
                            Thêm khách hàng
                        </Button>
                    )}
                </div>

            <div className="overflow-hidden rounded-[4px] border border-[#dcdcdc] bg-white shadow-sm">
                {isLoading ? (
                    <AdminDataSyncLoader />
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
        </div>
    );
}
