"use client";

import React, { useState } from "react";
import {
    Pencil,
    Trash2,
    Image as ImageIcon,
    ChevronDown,
    ChevronUp,
    BadgeCheck,
    Layers,
    Camera,
    Ban,
    Package,
} from "lucide-react";

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

interface AttributeValueDisplay {
    attributeName: string;
    value: string;
}

interface Variant {
    id: number;
    sku: string;
    barcode: string;
    quantity: number; // Tổng tồn kho từ các lô hàng
    imageUrl: string | null;
    status: string;
    attributeValues: AttributeValueDisplay[];
}

interface Product {
    id: number;
    name: string;
    slug: string;
    baseSku: string;
    categoryName: string;
    brandName: string;
    origin: string;
    status: string;
    image: string;
    imageUrls: string[];
    inventory: number;
    variants: Variant[];
}

interface AdminProductTableProps {
    products: Product[];
    currentPage: number;
    pageSize: number;
    onDelete?: (id: number) => void;
    onEdit?: (id: number) => void;
    onDisable?: (id: number) => void;
}

const STATUS_MAP: Record<string, { label: string; className: string }> = {
    ACTIVE:   { label: "Đang kinh doanh", className: "bg-emerald-50 text-emerald-600 border-emerald-100" },
    INACTIVE: { label: "Ngừng kinh doanh", className: "bg-slate-100 text-slate-400 border-slate-200" },
    DRAFT:    { label: "Lưu nháp",         className: "bg-amber-50 text-amber-600 border-amber-100" },
};

export function AdminProductTable({ products, currentPage, pageSize, onDelete, onEdit, onDisable }: AdminProductTableProps) {
    const [expandedRows, setExpandedRows] = useState<number[]>([]);

    const [confirmOpen, setConfirmOpen] = useState(false);
    const [confirmConfig, setConfirmConfig] = useState<{
        id: number | null;
        type: "delete" | "disable";
        title: string;
        description: string;
        actionLabel: string;
        variant: "default" | "destructive";
    }>({
        id: null,
        type: "delete",
        title: "",
        description: "",
        actionLabel: "",
        variant: "default",
    });

    const toggleRow = (id: number) => {
        setExpandedRows((prev) =>
            prev.includes(id) ? prev.filter((rowId) => rowId !== id) : [...prev, id],
        );
    };

    const openDeleteConfirm = (id: number) => {
        setConfirmConfig({
            id,
            type: "delete",
            title: "Xác nhận xóa vĩnh viễn",
            description:
                "Bạn có chắc chắn muốn xóa vĩnh viễn sản phẩm này? Hành động này không thể hoàn tác và chỉ thực hiện được khi sản phẩm chưa có giao dịch và hết tồn kho.",
            actionLabel: "Xóa sản phẩm",
            variant: "destructive",
        });
        setConfirmOpen(true);
    };

    const openDisableConfirm = (id: number) => {
        setConfirmConfig({
            id,
            type: "disable",
            title: "Xác nhận ngừng kinh doanh",
            description:
                "Sản phẩm này sẽ không còn xuất hiện trên cửa hàng nhưng vẫn được lưu trữ trong hệ thống.",
            actionLabel: "Ngừng kinh doanh",
            variant: "default",
        });
        setConfirmOpen(true);
    };

    const handleConfirmAction = () => {
        if (confirmConfig.id === null) return;
        if (confirmConfig.type === "delete") {
            onDelete?.(confirmConfig.id);
        } else {
            onDisable?.(confirmConfig.id);
        }
        setConfirmOpen(false);
    };

    return (
        <div className="w-full">
            <Table className="table-custom border-collapse">
                <TableHeader>
                    <TableRow className="bg-[#f0f0f0] hover:bg-[#f0f0f0] border-b border-[#ccc]">
                        <TableHead className="w-[40px] text-center p-2 font-bold text-[#1f1f1f] text-[11px] uppercase">STT</TableHead>
                        <TableHead className="w-[30px] p-2" />
                        <TableHead className="w-[60px] text-center p-2 font-bold text-[#1f1f1f] text-[11px] uppercase">Ảnh</TableHead>
                        <TableHead className="font-bold text-[#1f1f1f] text-[11px] uppercase p-2 pl-4">Tên sản phẩm & Danh mục</TableHead>
                        <TableHead className="w-[130px] font-bold text-[#1f1f1f] text-[11px] uppercase p-2">Thương hiệu</TableHead>
                        <TableHead className="w-[100px] text-center font-bold text-[#1f1f1f] text-[11px] uppercase p-2">Tổng Tồn</TableHead>
                        <TableHead className="w-[120px] font-bold text-[#1f1f1f] text-[11px] uppercase p-2 text-center">Trạng thái</TableHead>
                        <TableHead className="w-[130px] text-right font-bold text-[#1f1f1f] text-[11px] uppercase p-2 pr-4">Hành động</TableHead>
                    </TableRow>
                </TableHeader>

                <TableBody>
                    {products.map((p, index) => {
                        const stt = currentPage * pageSize + index + 1;
                        const isExpanded = expandedRows.includes(p.id);
                        const isInactive = p.status === "INACTIVE";
                        const statusInfo = STATUS_MAP[p.status] ?? { label: p.status, className: "bg-slate-100 text-slate-400 border-slate-200" };

                        return (
                            <React.Fragment key={p.id}>
                                <TableRow
                                    onClick={() => toggleRow(p.id)}
                                    className={cn(
                                        "cursor-pointer border-b border-[#eee] hover:bg-[#f0f8ff] transition-colors",
                                        isExpanded && "bg-[#f8f9fa]",
                                    )}
                                >
                                    {/* STT */}
                                    <TableCell className="p-2 text-center font-bold text-slate-500 text-[12px]">{stt}</TableCell>

                                    {/* Expand toggle */}
                                    <TableCell className="text-center p-2">
                                        {isExpanded ? (
                                            <ChevronUp size={14} className="text-blue-600" />
                                        ) : (
                                            <ChevronDown size={14} className="text-gray-400" />
                                        )}
                                    </TableCell>

                                    {/* Ảnh */}
                                    <TableCell className="p-2">
                                        <div className="w-10 h-10 mx-auto bg-white border border-[#ddd] rounded-[3px] flex items-center justify-center overflow-hidden shadow-sm">
                                            {p.image ? (
                                                <img src={p.image} alt={p.name} className="w-full h-full object-contain p-0.5" />
                                            ) : (
                                                <ImageIcon size={16} className="text-slate-200" />
                                            )}
                                        </div>
                                    </TableCell>

                                    {/* Tên + danh mục + baseSku */}
                                    <TableCell className="p-2 pl-4">
                                        <div className="flex flex-col">
                                            <span className="text-[#1f1f1f] font-bold text-[13px] leading-tight">{p.name}</span>
                                            <span className="text-slate-400 text-[10px] mt-0.5">
                        {p.categoryName}
                                                {p.baseSku && <span className="ml-2 font-mono text-slate-300">#{p.baseSku}</span>}
                      </span>
                                        </div>
                                    </TableCell>

                                    {/* Thương hiệu */}
                                    <TableCell className="p-2">
                    <span className="flex items-center gap-1 text-[11px] font-bold text-slate-500 uppercase">
                      <BadgeCheck size={12} className="text-emerald-500 shrink-0" />
                        {p.brandName || "—"}
                    </span>
                                    </TableCell>

                                    {/* Tổng Tồn kho */}
                                    <TableCell className="p-2 text-center">
                    <span className="text-[13px] font-black text-slate-700">
                      {p.inventory.toLocaleString("vi-VN")}
                    </span>
                                        <p className="text-[9px] text-slate-400 uppercase font-bold">
                                            ({p.variants.length} SKU)
                                        </p>
                                    </TableCell>

                                    {/* Trạng thái */}
                                    <TableCell className="p-2 text-center">
                    <span className={cn("text-[10px] font-bold px-1.5 py-0.5 rounded border tracking-tight uppercase whitespace-nowrap", statusInfo.className)}>
                      {statusInfo.label}
                    </span>
                                    </TableCell>

                                    {/* Hành động */}
                                    <TableCell className="p-2 text-right pr-4" onClick={(e) => e.stopPropagation()}>
                                        <div className="flex justify-end gap-1">
                                            <Button variant="ghost" size="icon" className="h-7 w-7 hover:bg-slate-100" onClick={() => onEdit?.(p.id)} title="Chỉnh sửa">
                                                <Pencil size={14} className="text-blue-600" />
                                            </Button>
                                            <Button variant="ghost" size="icon" className="h-7 w-7 hover:bg-amber-50" onClick={() => openDisableConfirm(p.id)} disabled={isInactive} title="Ngừng kinh doanh">
                                                <Ban size={14} className={isInactive ? "text-slate-300" : "text-amber-600"} />
                                            </Button>
                                            <Button variant="ghost" size="icon" className="h-7 w-7 hover:bg-rose-50" onClick={() => openDeleteConfirm(p.id)} title="Xóa vĩnh viễn">
                                                <Trash2 size={14} className="text-rose-600" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>

                                {/* Expanded — danh sách biến thể (ẨN GIÁ) */}
                                {isExpanded && (
                                    <TableRow className="bg-[#fdfdfd]">
                                        <TableCell colSpan={8} className="p-0 border-b border-[#eee]">
                                            <div className="pl-[50px] pr-4 py-3 space-y-2">
                                                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 flex items-center gap-2 mb-2">
                                                    <Layers size={12} /> Biến thể hàng hóa ({p.variants.length} SKU)
                                                </p>

                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                    {p.variants.map((v) => {
                                                        const attrLabel = v.attributeValues.length > 0
                                                            ? v.attributeValues.map((a) => `${a.attributeName}: ${a.value}`).join(" / ")
                                                            : "Chưa phân loại";

                                                        return (
                                                            <div key={v.id} className="flex items-center justify-between p-2.5 bg-white border border-slate-100 rounded-[2px] hover:border-blue-200 transition-colors">
                                                                <div className="flex items-center gap-3">
                                                                    <div className="w-9 h-9 border border-slate-200 rounded-[2px] flex items-center justify-center bg-slate-50 overflow-hidden shrink-0">
                                                                        {v.imageUrl ? (
                                                                            <img src={v.imageUrl} className="w-full h-full object-cover p-0.5" alt={v.sku} />
                                                                        ) : (
                                                                            <Camera size={14} className="text-slate-300" />
                                                                        )}
                                                                    </div>
                                                                    <div className="flex flex-col">
                                                                        <p className="text-[11px] font-bold text-slate-700 uppercase">{attrLabel}</p>
                                                                        <div className="flex items-center gap-2 mt-0.5">
                                                                            <span className="text-[10px] text-blue-600 font-mono font-bold bg-blue-50 px-1 rounded">{v.sku}</span>
                                                                            {v.barcode && <span className="text-[9px] text-slate-400 font-mono">BC: {v.barcode}</span>}
                                                                        </div>
                                                                    </div>
                                                                </div>

                                                                <div className="text-right pl-3 border-l border-slate-100">
                                                                    <p className="text-[9px] text-slate-400 font-bold uppercase tracking-tighter mb-0.5 flex items-center justify-end gap-1">
                                                                        <Package size={10} /> Tồn kho hệ thống
                                                                    </p>
                                                                    <p className="text-[13px] font-black text-emerald-600">
                                                                        {v.quantity.toLocaleString("vi-VN")} <span className="text-[10px] font-medium text-slate-400">SP</span>
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                )}
                            </React.Fragment>
                        );
                    })}
                </TableBody>
            </Table>

            <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
                <AlertDialogContent className="rounded-none border-[#dcdcdc] shadow-xl">
                    <AlertDialogHeader className="space-y-3">
                        <AlertDialogTitle className="text-[16px] font-black uppercase tracking-tight text-[#1f1f1f]">
                            {confirmConfig.title}
                        </AlertDialogTitle>
                        <AlertDialogDescription className="text-[13px] text-slate-500 leading-relaxed">
                            {confirmConfig.description}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="mt-6 gap-3">
                        <AlertDialogCancel className="h-9 text-[12px] font-bold border-[#ccc] rounded-none hover:bg-slate-50 uppercase min-w-[100px]">
                            Hủy bỏ
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleConfirmAction}
                            className={cn(
                                "h-9 text-[12px] font-black rounded-none shadow-sm uppercase min-w-[120px]",
                                confirmConfig.variant === "destructive"
                                    ? "bg-rose-600 hover:bg-rose-700 text-white"
                                    : "bg-emerald-600 hover:bg-emerald-700 text-white",
                            )}
                        >
                            {confirmConfig.actionLabel}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}