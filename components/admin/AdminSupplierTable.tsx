"use client";

import React, { useState } from "react";
import Link from "next/link";
import { AlertTriangle, Copy, Pencil, Trash2, Loader2 } from "lucide-react";
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
import { Supplier } from "@/app/types/supplier.type";
import { toast } from "sonner";
import { supplierService } from "@/app/services/supplier.service";
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

interface AdminSupplierTableProps {
    suppliers: Supplier[];
    currentPage?: number;
    pageSize?: number;
    onRefresh?: () => void;
}

export function AdminSupplierTable({
    suppliers,
    currentPage = 0,
    pageSize = 5,
    onRefresh,
}: AdminSupplierTableProps) {
    const [supplierToDelete, setSupplierToDelete] = useState<Supplier | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const handleDelete = async () => {
        if (!supplierToDelete) return;
        setIsDeleting(true);
        try {
            await supplierService.delete(supplierToDelete.id);
            toast.success("Xóa nhà cung cấp thành công!");
            setSupplierToDelete(null);
            onRefresh?.();
        } catch (error: any) {
            const msg = error?.response?.data?.message || "Lỗi khi xóa nhà cung cấp";
            toast.error(msg);
        } finally {
            setIsDeleting(false);
        }
    };
    const getStatusInfo = (status: Supplier["status"]) => {
        if (status === "ACTIVE") {
            return { label: "Đang giao dịch", class: "text-emerald-600" };
        }
        return { label: "Tạm ngừng", class: "text-slate-500" };
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

    return (
        <div className="w-full overflow-x-auto">
            <Table className="table-custom min-w-[980px] table-fixed border-collapse">
                <colgroup>
                    <col className="w-[64px]" />
                    <col className="w-[170px]" />
                    <col />
                    <col className="w-[230px]" />
                    <col className="w-[150px]" />
                    <col className="w-[100px]" />
                </colgroup>
                <TableHeader>
                    <TableRow className="border-b border-slate-200 bg-slate-50 hover:bg-slate-50">
                        <TableHead className="p-2 pl-4 text-center text-[10px] font-semibold text-[#1f1f1f]">STT</TableHead>
                        <TableHead className="p-2 text-[10px] font-semibold text-[#1f1f1f]">Mã NCC</TableHead>
                        <TableHead className="p-2 text-[10px] font-semibold text-[#1f1f1f]">Nhà cung cấp & MST</TableHead>
                        <TableHead className="p-2 text-[10px] font-semibold text-[#1f1f1f]">Người liên hệ</TableHead>
                        <TableHead className="p-2 text-center text-[10px] font-semibold text-[#1f1f1f]">Trạng thái</TableHead>
                        <TableHead className="p-2 pr-4 text-right text-[10px] font-semibold text-[#1f1f1f]">Chi tiết</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {suppliers.map((supplier, index) => {
                        const statusInfo = getStatusInfo(supplier.status);
                        const stt = currentPage * pageSize + index + 1;
                        const warningCount = supplier.warnings?.length ?? 0;

                        return (
                            <TableRow key={supplier.id} className="group border-b border-slate-100 transition-colors hover:bg-sky-50/50">
                                <TableCell className="p-2 pl-4 text-center text-[11px] font-normal text-slate-500">{stt}</TableCell>
                                <TableCell className="p-2 align-top">
                                    <div className="flex flex-col gap-1">
                                        <div className="flex items-center gap-1">
                                            <span className="break-words text-[11px] font-medium text-slate-700">{supplier.code || `#${supplier.id}`}</span>
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                className="h-6 w-6 text-slate-400 hover:text-emerald-600"
                                                onClick={() => void copyValue("Mã NCC", supplier.code)}
                                            >
                                                <Copy size={12} />
                                            </Button>
                                        </div>
                                        {warningCount > 0 && (
                                            <span className="inline-flex w-fit items-center gap-1 text-[9px] font-medium text-amber-600">
                                                <AlertTriangle size={10} />
                                                {warningCount} cảnh báo
                                            </span>
                                        )}
                                    </div>
                                </TableCell>
                                <TableCell className="p-2 align-top">
                                    <div className="flex items-start">
                                        <div className="flex min-w-0 flex-col gap-1">
                                            <span className="line-clamp-1 text-[12px] font-medium text-slate-800">{supplier.name}</span>
                                            <div className="flex items-center gap-1">
                                                <span className="font-mono text-[10px] font-normal text-slate-400">MST: {supplier.taxCode || "---"}</span>
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-5 w-5 text-slate-400 hover:text-emerald-600"
                                                    onClick={() => void copyValue("MST", supplier.taxCode)}
                                                >
                                                    <Copy size={11} />
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                </TableCell>
                                <TableCell className="p-2 align-top">
                                    <div className="flex flex-col gap-1">
                                        <span className="line-clamp-2 text-[11px] font-medium text-slate-700">{supplier.contactName || "---"}</span>
                                        <div className="flex items-center gap-1">
                                            <span className="text-[10px] text-slate-400 font-medium truncate">{supplier.phone || "---"}</span>
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                className="h-5 w-5 text-slate-400 hover:text-emerald-600"
                                                onClick={() => void copyValue("SĐT", supplier.phone)}
                                            >
                                                <Copy size={11} />
                                            </Button>
                                        </div>
                                        <span className="text-[10px] text-slate-400 truncate">{supplier.email || "Chưa có email"}</span>
                                    </div>
                                </TableCell>
                                <TableCell className="p-2 text-center align-top">
                                    <span className={cn("inline-block whitespace-nowrap text-[11px] font-medium", statusInfo.class)}>
                                        {statusInfo.label}
                                    </span>
                                </TableCell>
                                <TableCell className="p-2 text-right pr-4 align-top">
                                    <div className="flex justify-end gap-1.5">
                                        <Link href={`/admin/suppliers/${supplier.id}`}>
                                            <Button variant="ghost" size="icon" className="h-7 w-7 text-emerald-600 bg-emerald-50 hover:bg-emerald-600 hover:text-white transition-all rounded-md">
                                                <Pencil size={14} />
                                            </Button>
                                        </Link>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            className="h-7 w-7 text-rose-600 bg-rose-50 hover:bg-rose-600 hover:text-white transition-all rounded-md"
                                            onClick={() => setSupplierToDelete(supplier)}
                                        >
                                            <Trash2 size={14} />
                                        </Button>
                                    </div>
                                </TableCell>
                            </TableRow>
                        );
                    })}
                </TableBody>
            </Table>

            <AlertDialog open={!!supplierToDelete} onOpenChange={(open) => !open && setSupplierToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Xóa nhà cung cấp</AlertDialogTitle>
                        <AlertDialogDescription>
                            Bạn có chắc chắn muốn xóa nhà cung cấp <span className="font-semibold text-slate-800">{supplierToDelete?.name}</span> không? Hành động này không thể hoàn tác.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isDeleting}>Hủy</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={(e) => {
                                e.preventDefault();
                                void handleDelete();
                            }}
                            className="bg-rose-600 text-white hover:bg-rose-700"
                            disabled={isDeleting}
                        >
                            {isDeleting ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Đang xóa...
                                </>
                            ) : (
                                "Xác nhận xóa"
                            )}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
