"use client";

import React from "react";
import Link from "next/link";
import { Eye, Phone, User, MapPin, ChevronLeft, ChevronRight, AlertTriangle } from "lucide-react";
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
}

export function AdminCustomerTable({
                                       customers,
                                       currentPage,
                                       pageSize,
                                       totalPages,
                                       totalElements,
                                       onPageChange,
                                   }: AdminCustomerTableProps) {
    const { hasPermission } = usePermissions();
    const canAction = hasPermission(P.CUSTOMER_VIEW);

    const getRiskLabel = (riskLevel?: string) => {
        switch (riskLevel) {
            case "HIGH":
                return "Rủi ro cao";
            case "MEDIUM":
                return "Cần theo dõi";
            case "UNKNOWN":
                return "Chưa đủ dữ liệu";
            default:
                return "Uy tín tốt";
        }
    };

    return (
        <div className="w-full">
            <Table className="table-custom border-collapse w-full">
                <TableHeader>
                    <TableRow className="bg-[#f4f6f8] hover:bg-[#f4f6f8] border-b border-[#eee]">
                        <TableHead className="w-[60px] text-center p-2 font-bold text-[#1f1f1f] text-[11px] uppercase">STT</TableHead>
                        <TableHead className="w-[280px] font-bold text-[#1f1f1f] text-[11px] uppercase p-2 pl-4">Thông tin khách hàng</TableHead>
                        <TableHead className="w-[200px] font-bold text-[#1f1f1f] text-[11px] uppercase p-2">Liên hệ</TableHead>
                        <TableHead className="w-[140px] text-right font-bold text-[#1f1f1f] text-[11px] uppercase p-2">Chi tiêu (₫)</TableHead>
                        <TableHead className="w-[100px] text-center font-bold text-[#1f1f1f] text-[11px] uppercase p-2">Đơn hàng</TableHead>
                        <TableHead className="w-[120px] font-bold text-[#1f1f1f] text-[11px] uppercase p-2 text-center">Trạng thái</TableHead>
                        <TableHead className="w-[140px] font-bold text-[#1f1f1f] text-[11px] uppercase p-2 text-center">Rủi ro</TableHead>
                        {canAction && <TableHead className="w-[80px] text-right font-bold text-[#1f1f1f] text-[11px] uppercase p-2 pr-4">Xem</TableHead>}
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
                                    className="hover:bg-[#f8fbfd] border-b border-[#eee] transition-colors cursor-pointer"
                                    onClick={() => hasPermission(P.CUSTOMER_VIEW) ? (window.location.href = `/admin/customers/${cus.userId}`) : undefined}
                                >
                                    <TableCell className="p-2 pl-4 text-[12px] font-bold text-slate-500 text-center">{stt}</TableCell>
                                    <TableCell className="p-2">
                                        <div className="flex items-center gap-3">
                                            <div className="w-9 h-9 shrink-0 bg-blue-50/50 rounded-full flex items-center justify-center text-blue-600 border border-blue-100 shadow-sm overflow-hidden">
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
                                                    <span className="text-[13px] font-bold text-slate-800 uppercase tracking-tight">
                                                        {cus.fullName || "Chưa cập nhật tên"}
                                                    </span>
                                                </div>
                                                <span className="text-[11px] text-slate-500 flex items-center gap-1 font-medium mt-0.5">
                                                    <MapPin size={11} className="text-slate-400" />{" "}
                                                    <span className="truncate max-w-[250px]">{cus.addressDetail || "Chưa cập nhật địa chỉ"}</span>
                                                </span>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell className="p-2">
                                        <div className="flex flex-col gap-1">
                                            <div className="flex items-center gap-2 text-[12px] text-slate-700 font-semibold">
                                                <Phone size={13} className="text-slate-400" /> {cus.phone || "---"}
                                            </div>
                                            <div className="text-[11px] text-slate-500 font-medium">{cus.email || "---"}</div>
                                        </div>
                                    </TableCell>
                                    <TableCell className="p-2 text-right">
                                        <span className="text-[13px] font-black text-emerald-600">
                                            {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(cus.totalSpent || 0)}
                                        </span>
                                    </TableCell>
                                    <TableCell className="p-2 text-center font-bold text-slate-700 text-[13px]">
                                        {cus.totalOrders || 0}
                                    </TableCell>
                                    <TableCell className="p-2 text-center">
                                        <span
                                            className={cn(
                                                "text-[10px] font-bold px-2 py-1 rounded-[4px] tracking-wide uppercase whitespace-nowrap",
                                                cus.userStatus === "ACTIVE" ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600",
                                            )}
                                        >
                                            {cus.userStatus === "ACTIVE" ? "Hoạt động" : "Bị Khóa"}
                                        </span>
                                    </TableCell>
                                    <TableCell className="p-2 text-center">
                                        <span
                                            className={cn(
                                                "inline-flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-[4px] tracking-wide uppercase whitespace-nowrap border",
                                                cus.riskLevel === "HIGH"
                                                    ? "bg-rose-50 text-rose-600 border-rose-100"
                                                    : cus.riskLevel === "MEDIUM"
                                                        ? "bg-orange-50 text-orange-600 border-orange-100"
                                                        : cus.riskLevel === "UNKNOWN"
                                                            ? "bg-slate-50 text-slate-500 border-slate-200"
                                                        : "bg-emerald-50 text-emerald-600 border-emerald-100",
                                            )}
                                        >
                                            {cus.riskLevel === "HIGH" && <AlertTriangle size={11} />}
                                            {getRiskLabel(cus.riskLevel)}
                                        </span>
                                        {cus.onlinePaymentOnly && (
                                            <p className="mt-1 text-[10px] font-bold text-rose-500 uppercase">Chỉ PayOS</p>
                                        )}
                                    </TableCell>

                                    {canAction && (
                                        <TableCell className="p-2 text-right pr-4">
                                            <div className="flex items-center justify-end gap-1">
                                                {hasPermission(P.CUSTOMER_VIEW) && (
                                                    <Link href={`/admin/customers/${cus.userId}`} onClick={(e) => e.stopPropagation()}>
                                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-600 hover:bg-blue-50 hover:text-blue-700 transition-all rounded-md">
                                                            <Eye size={18} />
                                                        </Button>
                                                    </Link>
                                                )}
                                            </div>
                                        </TableCell>
                                    )}
                                </TableRow>
                            );
                        })
                    ) : (
                        <TableRow>
                            <TableCell colSpan={canAction ? 8 : 7} className="h-40 text-center">
                                <div className="flex flex-col items-center justify-center gap-2">
                                    <p className="text-[12px] text-slate-400 italic font-bold uppercase tracking-widest">
                                        Không có dữ liệu hiển thị
                                    </p>
                                </div>
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>

            <div className="flex items-center justify-between px-4 py-2 border-t border-[#eee] bg-[#f8f9fa]">
                <p className="text-[11px] text-slate-500 font-bold uppercase tracking-tight">
                    Đang hiển thị {customers?.length || 0} / Tổng số {totalElements} khách hàng
                </p>

                {totalPages > 0 && (
                    <div className="flex items-center gap-1.5">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onPageChange(currentPage - 1)}
                            disabled={currentPage === 0}
                            className="h-7 px-2 text-[11px] font-bold bg-white border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-50 transition-all"
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
                                                "h-7 min-w-[28px] px-2 p-0 text-[11px] font-bold shadow-sm transition-all",
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
                            className="h-7 px-2 text-[11px] font-bold bg-white border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-50 transition-all"
                        >
                            Sau <ChevronRight size={14} className="ml-1" />
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
}