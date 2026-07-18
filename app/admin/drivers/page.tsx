"use client";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus, Search } from "lucide-react";
import { AdminDriverTable } from "@/components/admin/AdminDriverTable";
import { driverService } from "@/app/services/driver.service";
import { Driver } from "@/app/types/driver.schema";
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
import { usePermissions } from "@/hooks/usePermissions";
import { useAuthStore } from "@/stores/useAuthStore";
import { isAdminRole } from "@/lib/roles";
import { P } from "@/lib/permissions";

export default function DriverListPage() {
    const router = useRouter();
    const { hasPermission } = usePermissions();
    const { user, isLoadingAuth } = useAuthStore();
    const isAdmin = isAdminRole(user?.role);
    const canViewDriver = hasPermission(P.DRIVER_VIEW) || isAdmin;
    const canCreate = hasPermission(P.DRIVER_CREATE) || isAdmin;

    const [drivers, setDrivers] = useState<Driver[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [keyword, setKeyword] = useState("");
    const [debouncedKeyword, setDebouncedKeyword] = useState("");
    const [status, setStatus] = useState("all");
    const [currentPage, setCurrentPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [totalElements, setTotalElements] = useState(0);
    const pageSize = 20;

    useEffect(() => {
        if (!isLoadingAuth && !canViewDriver) {
            router.push("/admin/forbidden");
        }
    }, [isLoadingAuth, canViewDriver, router]);

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedKeyword(keyword);
        }, 300);
        return () => clearTimeout(timer);
    }, [keyword]);

    const fetchDrivers = useCallback(async () => {
        if (!canViewDriver) return;
        setIsLoading(true);
        try {
            const data = await driverService.getAll(
                debouncedKeyword,
                status === "all" ? undefined : status,
                currentPage,
                pageSize,
            );
            setDrivers(data?.content ?? []);
            setTotalPages(data?.totalPages ?? 0);
            setTotalElements(data?.totalElements ?? 0);
        } catch (error) {
            toast.error("Không thể tải danh sách tài xế");
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    }, [currentPage, debouncedKeyword, status, canViewDriver]);

    useEffect(() => {
        if (canViewDriver) {
            void fetchDrivers();
        }
    }, [fetchDrivers, canViewDriver]);

    if (isLoadingAuth || !canViewDriver) {
        return (
            <div className="flex h-[200px] items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
            </div>
        );
    }

    const handleSearch = (value: string) => {
        setKeyword(value);
        setCurrentPage(0);
    };

    const visibleSummary = useMemo(() => {
        const activeCount = drivers.filter((d) => d.status === "ACTIVE").length;
        const busyCount = drivers.filter((d) => d.status === "BUSY").length;
        const inactiveCount = drivers.filter((d) => d.status === "INACTIVE").length;
        return { activeCount, busyCount, inactiveCount };
    }, [drivers]);

    return (
        <div className="space-y-3">
            <div className="mb-8 mt-2 space-y-4 px-1">
                <h1 className="text-[20px] font-semibold uppercase tracking-tight text-slate-900">
                    QUẢN LÝ TÀI XẾ
                </h1>

                <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
                    <div className="flex flex-col gap-2 lg:flex-row lg:items-center">
                        <div className="relative w-full lg:w-[300px]">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                            <Input
                                value={keyword}
                                onChange={(event) => handleSearch(event.target.value)}
                                placeholder="Tìm tên, SĐT, biển số xe, mã..."
                                className="h-[38px] rounded-[4px] border-slate-200 bg-white pl-10 text-[13px] shadow-none focus-visible:ring-emerald-500/20"
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
                                <SelectTrigger className="h-[38px] w-full rounded-[4px] border-slate-200 bg-white text-[13px] shadow-none focus:ring-0">
                                    <SelectValue placeholder="Tất cả trạng thái" />
                                </SelectTrigger>
                                <SelectContent className="rounded-[4px]">
                                    <SelectItem value="all">Tất cả trạng thái</SelectItem>
                                    <SelectItem value="ACTIVE">Đang hoạt động</SelectItem>
                                    <SelectItem value="BUSY">Đang bận</SelectItem>
                                    <SelectItem value="INACTIVE">Tạm ngừng</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {canCreate && (
                        <Button
                            onClick={() => router.push("/admin/drivers/add")}
                            className="h-[38px] rounded-[4px] bg-blue-600 px-4 text-[13px] font-medium text-white shadow-sm hover:bg-blue-700"
                        >
                            <Plus className="mr-2 h-4 w-4" />
                            Thêm tài xế
                        </Button>
                    )}
                </div>

                <div className="grid grid-cols-1 gap-2.5 md:grid-cols-2 xl:grid-cols-4">
                    {[
                        { title: "Tổng số tài xế", value: totalElements, description: "Số hồ sơ theo bộ lọc" },
                        { title: "Đang hoạt động", value: visibleSummary.activeCount, description: "Tài xế sẵn sàng vận chuyển" },
                        { title: "Đang bận (Vận hành)", value: visibleSummary.busyCount, description: "Tài xế đang giao chuyến" },
                        { title: "Tạm ngừng", value: visibleSummary.inactiveCount, description: "Tài xế đang nghỉ chế độ" },
                    ].map((card) => (
                        <div key={card.title} className="rounded-[4px] border border-slate-200 bg-white p-3 shadow-sm">
                            <p className="text-[11px] font-semibold text-slate-500">{card.title}</p>
                            <div className="mt-3 space-y-1">
                                <p className="text-[22px] font-semibold leading-none tracking-tight text-slate-900">{card.value}</p>
                                <p className="text-[10px] text-slate-400">{card.description}</p>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="mb-8 overflow-hidden rounded-[4px] border border-slate-200 bg-white shadow-sm">
                    {isLoading && drivers.length === 0 ? (
                        <AdminDataSyncLoader />
                    ) : (
                        <div className={cn("relative transition-opacity duration-200", isLoading && "opacity-60 pointer-events-none")}>
                            {isLoading && (
                                <div className="absolute inset-0 flex items-center justify-center bg-white/20 z-10">
                                    <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
                                </div>
                            )}
                            {drivers.length > 0 ? (
                                <>
                                    <AdminDriverTable drivers={drivers} currentPage={currentPage} pageSize={pageSize} onRefresh={fetchDrivers} />
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
                                                    className="h-8 text-[11px] font-medium bg-white rounded-[4px]"
                                                    onClick={() => setCurrentPage(currentPage - 1)}
                                                    disabled={currentPage === 0}
                                                >
                                                    ← trước
                                                </Button>
                                                <span className="min-w-[50px] text-center text-[11px] text-slate-500 font-medium">
                                                    {currentPage + 1} / {totalPages}
                                                </span>
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    size="sm"
                                                    className="h-8 text-[11px] font-medium bg-white rounded-[4px]"
                                                    onClick={() => setCurrentPage(currentPage + 1)}
                                                    disabled={currentPage >= totalPages - 1}
                                                >
                                                    sau →
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                </>
                            ) : (
                                <div className="p-16 text-center flex flex-col items-center justify-center gap-4">
                                    <div className="space-y-1">
                                        <p className="text-[13px] text-slate-600 font-semibold tracking-wider">
                                            {keyword || status !== "all" ? "không có tài xế khớp bộ lọc" : "chưa có tài xế nào"}
                                        </p>
                                        <p className="text-[12px] text-slate-400 max-w-[420px]">
                                            {keyword || status !== "all"
                                                ? "Thử tìm theo tên, số điện thoại hoặc đổi lại trạng thái lọc để xem thêm kết quả."
                                                : "Bắt đầu bằng việc tạo hồ sơ tài xế đầu tiên để dễ dàng điều chuyển kho vận."}
                                        </p>
                                    </div>
                                    {keyword || status !== "all" ? (
                                        <Button
                                            variant="outline"
                                            className="h-9 text-[11px] font-medium rounded-[4px]"
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
                                            className="h-9 bg-blue-600 text-[11px] font-medium hover:bg-blue-700 rounded-[4px]"
                                            onClick={() => router.push("/admin/drivers/add")}
                                        >
                                            + Tạo tài xế đầu tiên
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
