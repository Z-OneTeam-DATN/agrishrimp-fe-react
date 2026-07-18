"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Copy, Pencil, Lock, Unlock, Loader2, Key, Truck } from "lucide-react";
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
import { Driver } from "@/app/types/driver.schema";
import { toast } from "sonner";
import { driverService } from "@/app/services/driver.service";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { usePermissions } from "@/hooks/usePermissions";
import { useAuthStore } from "@/stores/useAuthStore";
import { isAdminRole } from "@/lib/roles";
import { P } from "@/lib/permissions";

interface AdminDriverTableProps {
    drivers: Driver[];
    currentPage?: number;
    pageSize?: number;
    onRefresh?: () => void;
}

export function AdminDriverTable({
    drivers,
    currentPage = 0,
    pageSize = 5,
    onRefresh,
}: AdminDriverTableProps) {
    const { hasPermission } = usePermissions();
    const { user } = useAuthStore();
    const isAdmin = isAdminRole(user?.role);
    const canUpdate = hasPermission(P.DRIVER_UPDATE) || isAdmin;

    const [driverToLock, setDriverToLock] = useState<Driver | null>(null);
    const [isLocking, setIsLocking] = useState(false);

    const handleToggleLock = async () => {
        if (!driverToLock) return;
        setIsLocking(true);
        const newStatus: "ACTIVE" | "INACTIVE" | "BUSY" = driverToLock.status === "INACTIVE" ? "ACTIVE" : "INACTIVE";
        const label = newStatus === "ACTIVE" ? "Mở khóa" : "Tạm khóa";
        try {
            const updatePayload = {
                fullName: driverToLock.fullName,
                phone: driverToLock.phone,
                email: driverToLock.email || "",
                idCard: driverToLock.idCard,
                licenseNumber: driverToLock.licenseNumber,
                licenseClass: driverToLock.licenseClass,
                avatarUrl: driverToLock.avatarUrl || "",
                licenseImageUrl: driverToLock.licenseImageUrl || "",
                status: newStatus,
                vehicleNumber: driverToLock.vehicleNumber || "",
                vehicleType: driverToLock.vehicleType || "",
            };
            await driverService.update(driverToLock.id, updatePayload);
            toast.success(`${label} tài xế thành công!`);
            setDriverToLock(null);
            onRefresh?.();
            window.dispatchEvent(new Event("driverUpdated"));
        } catch (error: any) {
            const msg = error?.response?.data?.message || `Lỗi khi ${label.toLowerCase()} tài xế`;
            toast.error(msg);
        } finally {
            setIsLocking(false);
        }
    };

    const getStatusInfo = (status: Driver["status"]) => {
        switch (status) {
            case "ACTIVE":
                return { label: "Đang hoạt động", class: "text-emerald-600" };
            case "BUSY":
                return { label: "Đang bận", class: "text-amber-600" };
            default:
                return { label: "Tạm ngừng", class: "text-slate-500" };
        }
    };

    const copyValue = async (label: string, value?: string) => {
        if (!value) {
            toast.warning(`Chưa có ${label.toLowerCase()} để sao chép`);
            return;
        }

        try {
            await navigator.clipboard.writeText(value);
            toast.success(`Đã sao chép ${label.toLowerCase()}`);
        } catch {
            toast.error(`Không thể sao chép ${label.toLowerCase()}`);
        }
    };

    const getInitials = (name: string) => {
        return name
            .split(" ")
            .map((n) => n[0])
            .slice(-2)
            .join("")
            .toUpperCase();
    };

    return (
        <div className="w-full overflow-x-auto">
            <Table className="table-custom min-w-[1100px] table-fixed border-collapse">
                <colgroup>
                    <col className="w-[50px]" />
                    <col className="w-[140px]" />
                    <col className="w-[220px]" />
                    <col className="w-[160px]" />
                    <col className="w-[200px]" />
                    <col className="w-[160px]" />
                    <col className="w-[120px]" />
                    <col className="w-[90px]" />
                </colgroup>
                <TableHeader>
                    <TableRow className="border-b border-slate-200 bg-slate-50 hover:bg-slate-50">
                        <TableHead className="p-2 pl-4 text-center text-[11px] font-medium text-slate-500">STT</TableHead>
                        <TableHead className="p-2 text-[11px] font-medium text-slate-500">Mã tài xế</TableHead>
                        <TableHead className="p-2 text-[11px] font-medium text-slate-500">Tên tài xế</TableHead>
                        <TableHead className="p-2 text-[11px] font-medium text-slate-500">Liên hệ</TableHead>
                        <TableHead className="p-2 text-[11px] font-medium text-slate-500">Giấy phép lái xe & CCCD</TableHead>
                        <TableHead className="p-2 text-[11px] font-medium text-slate-500">Phương tiện</TableHead>
                        <TableHead className="p-2 text-center text-[11px] font-medium text-slate-500">Trạng thái</TableHead>
                        <TableHead className="p-2 pr-4 text-right text-[11px] font-medium text-slate-500">Hành động</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {drivers.map((driver, index) => {
                        const statusInfo = getStatusInfo(driver.status);
                        const stt = currentPage * pageSize + index + 1;

                        return (
                            <TableRow key={driver.id} className="group border-b border-slate-100 transition-colors hover:bg-slate-50">
                                <TableCell className="p-2 pl-4 text-center text-[11px] text-slate-500">{stt}</TableCell>
                                
                                <TableCell className="p-2 align-top">
                                    <div className="flex items-center gap-1 mt-1">
                                        <span className="break-all text-[11px] font-mono text-slate-700">{driver.code || `#${driver.id}`}</span>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            className="h-6 w-6 text-slate-400 hover:text-emerald-600 rounded-[4px]"
                                            onClick={() => void copyValue("Mã tài xế", driver.code)}
                                        >
                                            <Copy size={11} />
                                        </Button>
                                    </div>
                                </TableCell>

                                <TableCell className="p-2 align-top">
                                    <div className="flex items-center gap-3">
                                        {driver.avatarUrl ? (
                                            <img
                                                src={driver.avatarUrl}
                                                alt={driver.fullName}
                                                className="h-9 w-9 rounded-full object-cover border border-slate-200"
                                            />
                                        ) : (
                                            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 border border-slate-200 text-slate-600 font-semibold text-[11px]">
                                                {getInitials(driver.fullName)}
                                            </div>
                                        )}
                                        <div className="flex min-w-0 flex-col">
                                            <span className="line-clamp-1 text-[12.5px] font-semibold text-slate-800">{driver.fullName}</span>
                                            {driver.email ? (
                                                <span className="text-[10px] text-slate-400 truncate">{driver.email}</span>
                                            ) : (
                                                <span className="text-[10px] text-slate-400 italic">Chưa cấu hình email</span>
                                            )}
                                        </div>
                                    </div>
                                </TableCell>

                                <TableCell className="p-2 align-top">
                                    <div className="flex flex-col gap-1 mt-0.5">
                                        <div className="flex items-center gap-1">
                                            <span className="text-[11px] text-slate-700 font-medium">{driver.phone || "---"}</span>
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                className="h-5 w-5 text-slate-400 hover:text-emerald-600 rounded-[4px]"
                                                onClick={() => void copyValue("SĐT", driver.phone)}
                                            >
                                                <Copy size={11} />
                                            </Button>
                                        </div>
                                        {driver.idCard && (
                                            <span className="text-[10px] font-mono text-slate-400">CCCD: {driver.idCard}</span>
                                        )}
                                    </div>
                                </TableCell>

                                <TableCell className="p-2 align-top">
                                    <div className="flex flex-col gap-0.5 mt-0.5">
                                        <div className="flex items-center gap-1.5">
                                            <span className="text-[11px] text-slate-700 font-medium">Hạng {driver.licenseClass || "---"}</span>
                                            <span className="text-[10px] text-slate-400">({driver.licenseNumber || "---"})</span>
                                        </div>
                                        {driver.licenseImageUrl && (
                                            <a
                                                href={driver.licenseImageUrl}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="text-[9px] text-blue-500 hover:underline flex items-center gap-1"
                                            >
                                                <Key size={10} /> Xem ảnh bằng lái
                                            </a>
                                        )}
                                    </div>
                                </TableCell>

                                <TableCell className="p-2 align-top">
                                    <div className="flex flex-col gap-0.5 mt-0.5">
                                        {driver.vehicleNumber ? (
                                            <div className="flex items-center gap-1">
                                                <Truck size={12} className="text-slate-400" />
                                                <span className="text-[11px] font-mono font-medium text-slate-700">{driver.vehicleNumber}</span>
                                            </div>
                                        ) : (
                                            <span className="text-[10px] text-slate-400 italic">Chưa giao xe</span>
                                        )}
                                        {driver.vehicleType && (
                                            <span className="text-[10px] text-slate-400">{driver.vehicleType}</span>
                                        )}
                                    </div>
                                </TableCell>

                                <TableCell className="p-2 text-center align-top">
                                    <span className={cn("inline-block whitespace-nowrap text-[11px] font-medium mt-1", statusInfo.class)}>
                                        {statusInfo.label}
                                    </span>
                                </TableCell>

                                <TableCell className="p-2 text-right pr-4 align-top">
                                    <div className="flex justify-end gap-1.5 mt-0.5">
                                        {canUpdate && (
                                            <Link href={`/admin/drivers/${driver.id}`}>
                                                <Button variant="ghost" size="icon" className="h-7 w-7 text-emerald-600 bg-emerald-50 hover:bg-emerald-600 hover:text-white transition-all rounded-[4px]">
                                                    <Pencil size={13} />
                                                </Button>
                                            </Link>
                                        )}
                                        {canUpdate && (
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                className={cn(
                                                    "h-7 w-7 transition-all rounded-[4px]",
                                                    driver.status === "INACTIVE"
                                                        ? "text-emerald-600 bg-emerald-50 hover:bg-emerald-600 hover:text-white"
                                                        : "text-amber-600 bg-amber-50 hover:bg-amber-600 hover:text-white"
                                                )}
                                                onClick={() => setDriverToLock(driver)}
                                            >
                                                {driver.status === "INACTIVE" ? <Unlock size={13} /> : <Lock size={13} />}
                                            </Button>
                                        )}
                                    </div>
                                </TableCell>
                            </TableRow>
                        );
                    })}
                </TableBody>
            </Table>

            <AlertDialog open={!!driverToLock} onOpenChange={(open) => !open && setDriverToLock(null)}>
                <AlertDialogContent className="rounded-[4px] border-slate-200 bg-white">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-[14px] font-semibold text-slate-900">
                            {driverToLock?.status === "INACTIVE" ? "Mở khóa tài xế" : "Tạm khóa tài xế"}
                        </AlertDialogTitle>
                        <AlertDialogDescription className="text-[12px] text-slate-500">
                            {driverToLock?.status === "INACTIVE"
                                ? `Bạn có chắc chắn muốn mở khóa hoạt động cho tài xế ${driverToLock?.fullName}?`
                                : `Bạn có chắc chắn muốn tạm khóa tài xế ${driverToLock?.fullName}? Tài xế bị khóa sẽ không thể tham gia các chuyến điều chuyển vận hành.`}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel className="rounded-[4px] h-9 text-[12px]" disabled={isLocking}>Hủy</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={(e) => {
                                e.preventDefault();
                                void handleToggleLock();
                            }}
                            className={cn(
                                "text-white rounded-[4px] h-9 text-[12px]",
                                driverToLock?.status === "INACTIVE"
                                    ? "bg-emerald-600 hover:bg-emerald-700"
                                    : "bg-amber-600 hover:bg-amber-700"
                            )}
                            disabled={isLocking}
                        >
                            {isLocking ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Đang xử lý...
                                </>
                            ) : driverToLock?.status === "INACTIVE" ? (
                                "Mở khóa"
                            ) : (
                                "Tạm khóa"
                            )}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
