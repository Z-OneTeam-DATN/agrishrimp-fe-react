"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Eye, User, ChevronLeft, ChevronRight, Mail, Lock, LockOpen, Loader2 } from "lucide-react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { usePermissions } from "@/hooks/usePermissions";
import { P } from "@/lib/permissions";
import { customerService } from "@/app/services/customer.service";
import { toast } from "sonner";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

interface CustomerData {
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

interface AdminCustomerTableProps {
    customers: CustomerData[];
    currentPage: number;
    pageSize: number;
    totalPages: number;
    totalElements: number;
    onPageChange: (newPage: number) => void;
    onRefresh?: () => void;
}

export function AdminCustomerTable({
                                       customers,
                                       currentPage,
                                       pageSize,
                                       totalPages,
                                       totalElements,
                                       onPageChange,
                                       onRefresh,
                                   }: AdminCustomerTableProps) {
    const { hasPermission } = usePermissions();
    const [deleteId, setDeleteId] = useState<number | null>(null);
    const [selectedCustomer, setSelectedCustomer] = useState<CustomerData | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [resendingId, setResendingId] = useState<number | null>(null);

    const handleResendCredentials = async (userId: number) => {
        try {
            setResendingId(userId);
            const message = await customerService.resendCredentials(userId);
            if (message && message.includes("không gửi được email")) {
                toast.error(message, { duration: 10000 });
            } else {
                toast.success(message || "Đã gửi lại email thông tin tài khoản.");
            }
        } catch (error) {
            toast.error("Không thể gửi lại email. Vui lòng thử lại.");
        } finally {
            setResendingId(null);
        }
    };

    const handleToggleStatus = async () => {
        if (!deleteId) return;
        try {
            setIsDeleting(true);
            await customerService.toggleStatus(deleteId);
            const action = selectedCustomer?.userStatus === "INACTIVE" ? "Mở khóa" : "Tạm khóa";
            toast.success(`${action} tài khoản khách hàng thành công`);
            onRefresh?.();
        } catch (error) {
            toast.error("Không thể thay đổi trạng thái tài khoản này.");
        } finally {
            setIsDeleting(false);
            setDeleteId(null);
            setSelectedCustomer(null);
        }
    };

    const openDeleteDialog = (cus: CustomerData) => {
        setDeleteId(cus.userId);
        setSelectedCustomer(cus);
    };
    const canAction = hasPermission(P.CUSTOMER_VIEW) || hasPermission(P.CUSTOMER_UPDATE);

    return (
        <div className="w-full">
            <Table className="border-collapse w-full">
                <TableHeader>
                    <TableRow className="bg-slate-50 hover:bg-slate-50 border-b border-slate-200">
                        <TableHead className="w-[56px] text-center px-3 py-3 font-medium text-slate-500 text-[11px]">STT</TableHead>
                        <TableHead className="min-w-[260px] font-medium text-slate-500 text-[11px] px-3 py-3">Khách hàng</TableHead>
                        <TableHead className="w-[240px] font-medium text-slate-500 text-[11px] px-3 py-3">Liên hệ</TableHead>
                        <TableHead className="w-[130px] text-right font-medium text-slate-500 text-[11px] px-3 py-3">Chi tiêu</TableHead>
                        <TableHead className="w-[90px] text-center font-medium text-slate-500 text-[11px] px-3 py-3">Đơn hàng</TableHead>
                        <TableHead className="w-[120px] font-medium text-slate-500 text-[11px] px-3 py-3 text-center">Trạng thái</TableHead>
                        {canAction && <TableHead className="w-[72px] text-right font-medium text-slate-500 text-[11px] px-3 py-3 pr-4">Thao tác</TableHead>}
                    </TableRow>
                </TableHeader>

                <TableBody>
                    {customers?.length > 0 ? (
                        customers.map((cus, index) => {
                            // Tính STT dựa trên trang hiện tại và pageSize
                            const stt = currentPage * pageSize + index + 1;
                            return (
                                <TableRow
                                    key={cus.userId}
                                    className="hover:bg-slate-50 border-b border-slate-100 transition-colors cursor-pointer"
                                    onClick={() => hasPermission(P.CUSTOMER_VIEW) ? (window.location.href = `/admin/customers/${cus.userId}`) : undefined}
                                >
                                    <TableCell className="px-3 py-3 text-[12px] font-medium text-slate-500 text-center">{stt}</TableCell>
                                    <TableCell className="px-3 py-3">
                                        <div className="flex items-center gap-3">
                                            <div className="w-9 h-9 shrink-0 bg-slate-50 rounded-[4px] flex items-center justify-center text-slate-400 border border-slate-200 overflow-hidden">
                                                {cus.avatarUrl ? (
                                                    <img
                                                        src={cus.avatarUrl}
                                                        alt={cus.fullName}
                                                        className="w-full h-full object-cover"
                                                        onError={(e) => {
                                                            e.currentTarget.style.display = 'none';
                                                        }}
                                                    />
                                                ) : (
                                                    <User size={16} />
                                                )}
                                            </div>
                                            <div className="flex flex-col gap-0.5">
                                                <div className="flex items-center gap-2">
                                                    <span className={cn("text-[12.5px] font-semibold", cus.fullName ? "text-slate-900" : "text-slate-400 italic")}>
                                                        {cus.fullName || "Chưa có tên"}
                                                    </span>
                                                </div>
                                                <span className="text-[10.5px] text-slate-500 font-normal mt-0.5">
                                                    <span className="truncate max-w-[250px]">{cus.addressDetail || "Chưa cập nhật địa chỉ"}</span>
                                                </span>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell className="px-3 py-3">
                                        <div className="flex flex-col gap-1">
                                            <div className={cn("text-[12px] font-medium", cus.phone ? "text-slate-700" : "text-slate-400 italic")}>
                                                {cus.phone || "Chưa có SĐT"}
                                            </div>
                                            <div className={cn("text-[10.5px] font-normal", cus.email ? "text-slate-500" : "text-slate-400 italic")}>{cus.email || "Chưa có email"}</div>
                                        </div>
                                    </TableCell>
                                    <TableCell className="px-3 py-3 text-right">
                                        <span className="text-[12.5px] font-semibold text-slate-900">
                                            {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(cus.totalSpent || 0)}
                                        </span>
                                    </TableCell>
                                    <TableCell className="px-3 py-3 text-center font-medium text-slate-700 text-[12px]">
                                        {cus.totalOrders || 0}
                                    </TableCell>
                                    <TableCell className="px-3 py-3 text-center">
                                        <span
                                            className={cn(
                                                "text-[12px] font-medium whitespace-nowrap",
                                                cus.userStatus === "ACTIVE" ? "text-blue-700" : "text-slate-500",
                                            )}
                                        >
                                            {cus.userStatus === "ACTIVE" ? "Hoạt động" : "Bị khóa"}
                                        </span>
                                    </TableCell>

                                    {canAction && (
                                        <TableCell className="px-3 py-3 text-right pr-4" onClick={(e) => e.stopPropagation()}>
                                            <div className="flex items-center justify-end gap-1">
                                                {hasPermission(P.CUSTOMER_UPDATE) && (
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        title="Gửi lại email tài khoản"
                                                        className="h-8 w-8 text-sky-500 hover:bg-sky-50 hover:text-sky-700 transition-all rounded-[4px]"
                                                        disabled={resendingId === cus.userId}
                                                        onClick={() => handleResendCredentials(cus.userId)}
                                                    >
                                                        {resendingId === cus.userId ? (
                                                            <Loader2 size={15} className="animate-spin" />
                                                        ) : (
                                                            <Mail size={15} />
                                                        )}
                                                    </Button>
                                                )}
                                                {hasPermission(P.CUSTOMER_VIEW) && (
                                                    <Link href={`/admin/customers/${cus.userId}`}>
                                                        <Button variant="ghost" size="icon" title="Xem chi tiết" className="h-8 w-8 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-all rounded-[4px]">
                                                            <Eye size={16} />
                                                        </Button>
                                                    </Link>
                                                )}
                                                {hasPermission(P.CUSTOMER_UPDATE) && (
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        title={cus.userStatus === "ACTIVE" ? "Tạm khóa tài khoản" : "Mở khóa tài khoản"}
                                                        className={cn(
                                                            "h-8 w-8 transition-all rounded-[4px]",
                                                            cus.userStatus === "ACTIVE"
                                                                ? "text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                                                                : "text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700"
                                                        )}
                                                        onClick={() => openDeleteDialog(cus)}
                                                    >
                                                        {cus.userStatus === "ACTIVE" ? <Lock size={15} /> : <LockOpen size={15} />}
                                                    </Button>
                                                )}
                                            </div>
                                        </TableCell>
                                    )}
                                </TableRow>
                            );
                        })
                    ) : (
                        <TableRow>
                            <TableCell colSpan={canAction ? 7 : 6} className="h-40 text-center">
                                <div className="flex flex-col items-center justify-center gap-2">
                                    <p className="text-[12px] text-slate-400 font-medium">
                                        Không có dữ liệu
                                    </p>
                                </div>
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>

            <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100 bg-white">
                <p className="text-[11px] text-slate-500 font-medium">
                    Hiển thị {totalElements === 0 ? 0 : currentPage * pageSize + 1} - {Math.min((currentPage + 1) * pageSize, totalElements)} trong {totalElements} khách hàng
                </p>

                {totalPages > 0 && (
                    <div className="flex items-center gap-1.5">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onPageChange(currentPage - 1)}
                            disabled={currentPage === 0}
                            className="h-8 px-3 text-[11px] font-medium bg-white border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-50 transition-all rounded-[4px]"
                        >
                            <ChevronLeft size={14} className="mr-1" /> Trước
                        </Button>

                        <div className="flex items-center gap-1">
                            {Array.from({ length: totalPages }).map((_, index) => {
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
                                            onClick={() => onPageChange(index)}
                                            className={cn(
                                                "h-8 min-w-[30px] px-2 p-0 text-[11px] font-medium transition-all rounded-[4px]",
                                                currentPage === index
                                                    ? "bg-blue-600 text-white border-blue-600 hover:bg-blue-700 hover:text-white"
                                                    : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
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
                            onClick={() => onPageChange(currentPage + 1)}
                            disabled={currentPage >= totalPages - 1}
                            className="h-8 px-3 text-[11px] font-medium bg-white border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-50 transition-all rounded-[4px]"
                        >
                            Sau <ChevronRight size={14} className="ml-1" />
                        </Button>
                    </div>
                )}
            </div>

            <Dialog open={deleteId !== null} onOpenChange={(open) => !open && setDeleteId(null)}>
                <DialogContent className="sm:max-w-[420px] rounded-[4px]">
                    <DialogHeader>
                        <DialogTitle className="text-[16px] font-black uppercase tracking-tight">
                            {selectedCustomer?.userStatus === "ACTIVE" ? "Tạm khóa tài khoản" : "Mở khóa tài khoản"}
                        </DialogTitle>
                        <DialogDescription className="text-[12px]">
                            Hành động này sẽ thay đổi trạng thái đăng nhập của khách hàng trong hệ thống.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-2 text-[13px] text-slate-600">
                        Bạn có chắc chắn muốn {selectedCustomer?.userStatus === "ACTIVE" ? "tạm khóa" : "mở khóa"} tài khoản của khách hàng <strong>{selectedCustomer?.fullName}</strong>?
                    </div>
                    <DialogFooter className="gap-2">
                        <Button
                            variant="outline"
                            onClick={() => setDeleteId(null)}
                            className="rounded-[3px] text-[12px] h-9"
                            disabled={isDeleting}
                        >
                            Hủy
                        </Button>
                        <Button
                            onClick={handleToggleStatus}
                            className={cn(
                                "rounded-[3px] text-[12px] h-9 text-white",
                                selectedCustomer?.userStatus === "ACTIVE" ? "bg-rose-600 hover:bg-rose-700" : "bg-blue-600 hover:bg-blue-700"
                            )}
                            disabled={isDeleting}
                        >
                            {isDeleting ? <Loader2 size={15} className="animate-spin mr-1" /> : null}
                            Xác nhận {selectedCustomer?.userStatus === "ACTIVE" ? "Khóa" : "Mở khóa"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

