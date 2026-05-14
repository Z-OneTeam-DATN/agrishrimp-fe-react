"use client";

import React from "react";
import Link from "next/link";
import { AlertTriangle, Copy, Eye, Truck } from "lucide-react";
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

interface AdminSupplierTableProps {
    suppliers: Supplier[];
    currentPage?: number;
    pageSize?: number;
}

export function AdminSupplierTable({
    suppliers,
    currentPage = 0,
    pageSize = 5,
}: AdminSupplierTableProps) {
    const getStatusInfo = (status: Supplier["status"]) => {
        if (status === "ACTIVE") {
            return { label: "ĐANG GIAO DỊCH", class: "bg-emerald-50 text-emerald-700 border-emerald-100" };
        }
        return { label: "TẠM DỪNG", class: "bg-slate-100 text-slate-500 border-slate-200" };
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
            <Table className="table-custom border-collapse table-fixed min-w-[1040px]">
                <colgroup>
                    <col className="w-[64px]" />
                    <col className="w-[170px]" />
                    <col />
                    <col className="w-[230px]" />
                    <col className="w-[150px]" />
                    <col className="w-[100px]" />
                </colgroup>
                <TableHeader>
                    <TableRow className="bg-[#f0f0f0] hover:bg-[#f0f0f0] border-b border-[#ccc]">
                        <TableHead className="font-bold text-[#1f1f1f] text-[11px] uppercase p-2 pl-4 text-center">STT</TableHead>
                        <TableHead className="font-bold text-[#1f1f1f] text-[11px] uppercase p-2">Mã NCC</TableHead>
                        <TableHead className="font-bold text-[#1f1f1f] text-[11px] uppercase p-2">Nhà cung cấp & MST</TableHead>
                        <TableHead className="font-bold text-[#1f1f1f] text-[11px] uppercase p-2">Người liên hệ</TableHead>
                        <TableHead className="font-bold text-[#1f1f1f] text-[11px] uppercase p-2 text-center">Trạng thái</TableHead>
                        <TableHead className="text-right font-bold text-[#1f1f1f] text-[11px] uppercase p-2 pr-4">Chi tiết</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {suppliers.map((supplier, index) => {
                        const statusInfo = getStatusInfo(supplier.status);
                        const stt = currentPage * pageSize + index + 1;
                        const warningCount = supplier.warnings?.length ?? 0;

                        return (
                            <TableRow key={supplier.id} className="hover:bg-[#f0f8ff] border-b border-[#eee] transition-colors group">
                                <TableCell className="p-2 pl-4 text-[12px] font-bold text-slate-500 text-center">{stt}</TableCell>
                                <TableCell className="p-2 align-top">
                                    <div className="flex flex-col gap-1">
                                        <div className="flex items-center gap-1">
                                            <span className="text-[12px] font-bold text-slate-700 break-words">{supplier.code || `#${supplier.id}`}</span>
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
                                            <span className="inline-flex items-center gap-1 text-[9px] font-black uppercase px-2 py-1 rounded border border-amber-200 bg-amber-50 text-amber-700 w-fit">
                                                <AlertTriangle size={10} />
                                                {warningCount} cảnh báo
                                            </span>
                                        )}
                                    </div>
                                </TableCell>
                                <TableCell className="p-2 align-top">
                                    <div className="flex items-start gap-3">
                                        <div className="w-8 h-8 bg-orange-50 rounded flex items-center justify-center text-orange-600 border border-orange-100 group-hover:bg-orange-100 transition-colors shrink-0">
                                            <Truck size={14} />
                                        </div>
                                        <div className="flex flex-col gap-1 min-w-0">
                                            <span className="text-[13px] font-bold text-slate-800 uppercase tracking-tighter line-clamp-1">{supplier.name}</span>
                                            <div className="flex items-center gap-1">
                                                <span className="text-[10px] text-slate-400 font-mono font-bold">MST: {supplier.taxCode || "---"}</span>
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
                                        <span className="text-[12px] font-bold text-slate-700 line-clamp-2">{supplier.contactName || "---"}</span>
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
                                    <span className={cn("text-[10px] font-black px-2 py-1 rounded border tracking-tight uppercase whitespace-nowrap inline-block min-w-[110px]", statusInfo.class)}>
                                        {statusInfo.label}
                                    </span>
                                </TableCell>
                                <TableCell className="p-2 text-right pr-4 align-top">
                                    <Link href={`/admin/suppliers/${supplier.id}`}>
                                        <Button variant="ghost" size="icon" className="h-7 w-7 text-emerald-600 bg-emerald-50 hover:bg-emerald-600 hover:text-white transition-all rounded-md">
                                            <Eye size={16} />
                                        </Button>
                                    </Link>
                                </TableCell>
                            </TableRow>
                        );
                    })}
                </TableBody>
            </Table>
        </div>
    );
}
