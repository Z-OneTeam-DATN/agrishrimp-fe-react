"use client";

import React, { useState } from "react";
import {
    Pencil,
    Trash2,
    Image as ImageIcon,
    ChevronDown,
    ChevronUp,
    Ban,
    Play,
    PackageSearch,
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
import { cn, cleanSupplierName } from "@/lib/utils";
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
import { P } from "@/lib/permissions";
import { isAdminRole } from "@/lib/roles";

interface Batch {
    inventoryId: number;
    branchName: string;
    batchNumber: string;
    quantity: number;
    importPrice: number | null;
    sellingPrice: number;
}

interface AttributeValueDisplay {
    attributeName: string;
    value: string;
}

interface Variant {
    id: number;
    sku: string;
    barcode: string;
    quantity: number; // Tổng tồn kho từ các lô hàng
    price: number;
    importPrice: number | null;
    batches: Batch[];
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
    supplierName: string;
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
    onEnable?: (id: number) => void;
}

const STATUS_MAP: Record<string, { label: string; className: string }> = {
    ACTIVE:   { label: "Đang kinh doanh", className: "bg-emerald-50 text-emerald-600 border-emerald-100" },
    INACTIVE: { label: "Ngừng kinh doanh", className: "bg-slate-100 text-slate-400 border-slate-200" },
    DRAFT:    { label: "Lưu nháp",         className: "bg-amber-50 text-amber-600 border-amber-100" },
};

export function AdminProductTable({
    products,
    currentPage,
    pageSize,
    onDelete,
    onEdit,
    onDisable,
    onEnable,
}: AdminProductTableProps) {
    const { hasPermission } = usePermissions();
    const { user } = useAuthStore();
    const isAdmin = isAdminRole(user?.role); // 👉 BIẾN QUYẾT ĐỊNH ẨN/HIỆN GIÁ VỐN
    const canAction = hasPermission(P.PRODUCT_UPDATE) || hasPermission(P.PRODUCT_DELETE);

    const [expandedRows, setExpandedRows] = useState<number[]>([]);
    const [expandedVariantRows, setExpandedVariantRows] = useState<number[]>([]);
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [confirmConfig, setConfirmConfig] = useState<{
        id: number | null;
        ids: number[];
        type: "delete" | "disable" | "enable";
        title: string;
        description: string;
        actionLabel: string;
        variant: "default" | "destructive";
    }>({
        id: null,
        ids: [],
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

    const toggleVariantRow = (id: number) => {
        setExpandedVariantRows((prev) =>
            prev.includes(id) ? prev.filter((rowId) => rowId !== id) : [...prev, id],
        );
    };

    const openDeleteConfirm = (id: number) => {
        setConfirmConfig({
            id,
            ids: [],
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
            ids: [],
            type: "disable",
            title: "Xác nhận ngừng kinh doanh",
            description:
                "Sản phẩm này sẽ không còn xuất hiện trên cửa hàng nhưng vẫn được lưu trữ trong hệ thống.",
            actionLabel: "Ngừng kinh doanh",
            variant: "default",
        });
        setConfirmOpen(true);
    };

    const openEnableConfirm = (id: number) => {
        setConfirmConfig({
            id,
            ids: [],
            type: "enable",
            title: "Xác nhận kinh doanh lại",
            description:
                "Sản phẩm này sẽ được hiển thị trở lại trên cửa hàng để khách hàng có thể tìm kiếm và đặt mua.",
            actionLabel: "Kinh doanh lại",
            variant: "default",
        });
        setConfirmOpen(true);
    };

    const handleConfirmAction = () => {
        if (confirmConfig.type === "delete") {
            if (confirmConfig.id === null) return;
            onDelete?.(confirmConfig.id);
        } else if (confirmConfig.type === "disable") {
            if (confirmConfig.id === null) return;
            onDisable?.(confirmConfig.id);
        } else if (confirmConfig.type === "enable") {
            if (confirmConfig.id === null) return;
            onEnable?.(confirmConfig.id);
        }
        setConfirmOpen(false);
    };

    return (
        <div className="w-full">
            <Table className="table-custom w-full table-fixed border-collapse">
                <colgroup>
                    <col className="w-[5%]" />
                    <col className="w-[5%]" />
                    <col className="w-[15%]" />
                    <col className="w-[30%]" />
                    <col className="w-[20%]" />
                    <col className="w-[8%]" />
                    <col className="w-[10%]" />
                    {canAction && <col className="w-[7%]" />}
                </colgroup>
                <TableHeader>
                    <TableRow className="bg-[#f0f0f0] hover:bg-[#f0f0f0] border-b border-[#ccc]">
                        <TableHead className="p-2 text-center text-[10px] font-semibold text-[#1f1f1f]">STT</TableHead>
                        <TableHead className="p-2" />
                        <TableHead className="p-2 text-center text-[10px] font-semibold text-[#1f1f1f]">Ảnh</TableHead>
                        <TableHead className="p-2 pl-4 text-[10px] font-semibold text-[#1f1f1f]">Tên sản phẩm & danh mục</TableHead>
                        <TableHead className="p-2 text-[10px] font-semibold text-[#1f1f1f]">Nhà cung cấp</TableHead>
                        <TableHead className="p-2 text-center text-[10px] font-semibold text-[#1f1f1f]">Tổng tồn</TableHead>
                        <TableHead className="p-2 text-center text-[10px] font-semibold text-[#1f1f1f]">Trạng thái</TableHead>
                        {canAction && (
                            <TableHead className="p-2 pr-4 text-right text-[10px] font-semibold text-[#1f1f1f]">Thao tác</TableHead>
                        )}
                    </TableRow>
                </TableHeader>

                <TableBody>
                    {products.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={canAction ? 8 : 7} className="h-56 p-8">
                                <div className="flex flex-col items-center justify-center text-center space-y-2">
                                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-50 text-slate-400 mb-1">
                                        <PackageSearch className="h-6 w-6 text-slate-400" />
                                    </div>
                                    <p className="text-[13px] font-medium text-slate-700">
                                        Không có sản phẩm phù hợp bộ lọc
                                    </p>
                                    <p className="text-[11px] text-slate-400 leading-normal max-w-sm">
                                        Thử đổi bộ lọc danh mục, trạng thái, nhà cung cấp hoặc tìm theo tên sản phẩm, mã SKU.
                                    </p>
                                </div>
                            </TableCell>
                        </TableRow>
                    ) : (
                        products.map((p, index) => {
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
                                        <TableCell className="p-2 text-center text-[11px] font-medium text-slate-500">{stt}</TableCell>

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
                                                 {p.imageUrls && p.imageUrls.length > 0 ? (
                                                     <img src={p.imageUrls[0]} alt={p.name} className="w-full h-full object-contain p-0.5" />
                                                 ) : p.variants?.[0]?.imageUrl ? (
                                                     <img src={p.variants[0].imageUrl} alt={p.name} className="w-full h-full object-contain p-0.5" />
                                                 ) : (
                                                     <ImageIcon size={16} className="text-slate-200" />
                                                 )}
                                            </div>
                                        </TableCell>

                                        {/* Tên + danh mục + baseSku */}
                                        <TableCell className="p-2 pl-4">
                                            <div className="flex flex-col">
                                                <span className="truncate text-[11px] font-semibold leading-tight text-[#1f1f1f]" title={p.name}>{p.name}</span>
                                                <span className="mt-0.5 truncate text-[10px] text-slate-400">
                                                    {p.categoryName}
                                                    {p.baseSku && <span className="ml-2 font-mono text-slate-300">#{p.baseSku}</span>}
                                                </span>
                                            </div>
                                        </TableCell>

                                        {/* Thương hiệu */}
                                        <TableCell className="p-2">
                                            <span className="block truncate text-[11px] font-normal text-slate-500" title={p.supplierName || ""}>
                                                {cleanSupplierName(p.supplierName) || "—"}
                                            </span>
                                        </TableCell>

                                        {/* Tổng Tồn kho */}
                                        <TableCell className="p-2 text-center">
                                            <span className="text-[11px] font-semibold text-slate-700">
                                                {p.inventory.toLocaleString("vi-VN")}
                                            </span>
                                            <p className="text-[9px] font-medium text-slate-400">
                                                ({p.variants.length} SKU)
                                            </p>
                                        </TableCell>

                                        {/* Trạng thái */}
                                        <TableCell className="p-2 text-center">
                                            <span className={cn("whitespace-nowrap text-[11px] font-medium tracking-tight", 
                                                p.status === "ACTIVE" ? "text-emerald-600 font-semibold" : 
                                                p.status === "INACTIVE" ? "text-slate-400" : "text-amber-600"
                                            )}>
                                                {statusInfo.label}
                                            </span>
                                        </TableCell>

                                        {/* Hành động */}
                                        {canAction && (
                                            <TableCell className="p-2 text-right pr-4" onClick={(e) => e.stopPropagation()}>
                                                <div className="flex justify-end gap-1">
                                                    {hasPermission(P.PRODUCT_UPDATE) && (
                                                        <Button variant="ghost" size="icon" className="h-7 w-7 hover:bg-slate-100" onClick={() => onEdit?.(p.id)} title="Chỉnh sửa">
                                                            <Pencil size={14} className="text-blue-600" />
                                                        </Button>
                                                    )}
                                                    {hasPermission(P.PRODUCT_DELETE) && (
                                                        <Button variant="ghost" size="icon" className="h-7 w-7 hover:bg-rose-50" onClick={() => openDeleteConfirm(p.id)} title="Xóa vĩnh viễn">
                                                            <Trash2 size={14} className="text-rose-600" />
                                                        </Button>
                                                    )}
                                                </div>
                                            </TableCell>
                                        )}
                                    </TableRow>

                                    {/* Danh sách biến thể dạng phẳng, mỗi SKU một hàng. */}
                                    {isExpanded && (
                                        <TableRow className="bg-[#fdfdfd]">
                                            <TableCell colSpan={canAction ? 8 : 7} className="p-0 border-b border-[#eee]">
                                                <div className="overflow-x-auto py-2 pl-[50px] pr-4">
                                                    <table className="w-full min-w-[900px] table-fixed border-collapse overflow-hidden rounded-[4px] border border-slate-200 bg-white">
                                                        <thead>
                                                            <tr className="border-b border-slate-200 bg-slate-50">
                                                                <th className="w-[82px] px-3 py-2 text-left text-[10px] font-normal text-slate-500">Ảnh</th>
                                                                <th className="px-3 py-2 text-left text-[10px] font-normal text-slate-500">Quy cách / SKU</th>
                                                                <th className="w-[110px] px-3 py-2 text-center text-[10px] font-normal text-slate-500">Lô hàng</th>
                                                                <th className="w-[110px] px-3 py-2 text-center text-[10px] font-normal text-slate-500">Kho chứa</th>
                                                                <th className="w-[80px] px-3 py-2 text-center text-[10px] font-normal text-slate-500">Tồn</th>
                                                                {isAdmin && (
                                                                    <th className="w-[120px] px-3 py-2 text-right text-[10px] font-normal text-slate-500">Giá vốn</th>
                                                                )}
                                                                <th className="w-[130px] px-3 py-2 text-right text-[10px] font-normal text-slate-500">Giá bán</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                        {p.variants.map((v) => {
                                                            const attrLabel = v.attributeValues.length > 0
                                                                ? v.attributeValues.map((a) => `${a.attributeName}: ${a.value}`).join(" / ")
                                                                : "Chưa phân loại";
                                                            const batches = v.batches || [];
                                                            const batchNumbers = Array.from(
                                                                new Set(batches.map((batch) => batch.batchNumber).filter(Boolean)),
                                                            );
                                                            const branchNames = Array.from(
                                                                new Set(batches.map((batch) => batch.branchName).filter(Boolean)),
                                                            );
                                                            const importPrice =
                                                                v.importPrice ??
                                                                batches.find((batch) => batch.importPrice != null)?.importPrice ??
                                                                null;
                                                            const sellingPrice =
                                                                v.price ||
                                                                batches.find((batch) => batch.sellingPrice > 0)?.sellingPrice ||
                                                                0;
                                                            const isVariantExpanded = expandedVariantRows.includes(v.id);
                                                            const variantColumnCount = isAdmin ? 7 : 6;

                                                            return (
                                                                <React.Fragment key={v.id}>
                                                                    <tr className={cn("border-b border-slate-100 hover:bg-[#f0f8ff]", isVariantExpanded && "bg-blue-50/40")}>
                                                                        <td className="px-3 py-2">
                                                                            <div className="flex items-center gap-2">
                                                                                <button
                                                                                    type="button"
                                                                                    onClick={() => toggleVariantRow(v.id)}
                                                                                    disabled={batches.length === 0}
                                                                                    className="flex h-6 w-6 shrink-0 items-center justify-center rounded-[4px] text-slate-400 hover:bg-white hover:text-blue-600 disabled:cursor-default disabled:opacity-25"
                                                                                    title={batches.length > 0 ? "Xem chi tiết lô và kho" : "Chưa có tồn kho"}
                                                                                    aria-label={isVariantExpanded ? "Thu gọn chi tiết tồn kho" : "Mở chi tiết tồn kho"}
                                                                                >
                                                                                    {isVariantExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                                                                                </button>
                                                                                <div className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-[3px] border border-slate-200 bg-white">
                                                                                    {v.imageUrl && (
                                                                                        <img src={v.imageUrl} className="h-full w-full object-contain p-0.5" alt={v.sku} />
                                                                                    )}
                                                                                </div>
                                                                            </div>
                                                                        </td>
                                                                        <td className="px-3 py-2">
                                                                            <p className="truncate text-[11px] font-normal text-slate-700">{attrLabel}</p>
                                                                            <p className="mt-0.5 truncate text-[10px] font-normal text-blue-600">
                                                                                {v.sku || "—"}
                                                                                {v.barcode && <span className="ml-2 text-slate-400">BC: {v.barcode}</span>}
                                                                            </p>
                                                                        </td>
                                                                        <td className="px-3 py-2 text-center text-[11px] font-normal text-slate-600">
                                                                            {batchNumbers.length} lô
                                                                        </td>
                                                                        <td className="px-3 py-2 text-center text-[11px] font-normal text-slate-600">
                                                                            {branchNames.length} kho
                                                                        </td>
                                                                        <td className="px-3 py-2 text-center text-[11px] font-medium text-slate-700">
                                                                            {v.quantity.toLocaleString("vi-VN")}
                                                                        </td>
                                                                        {isAdmin && (
                                                                            <td className="whitespace-nowrap px-3 py-2 text-right text-[11px] font-normal text-blue-600">
                                                                                {importPrice != null ? `${importPrice.toLocaleString("vi-VN")} ₫` : "—"}
                                                                            </td>
                                                                        )}
                                                                        <td className="whitespace-nowrap px-3 py-2 text-right text-[11px] font-normal text-emerald-600">
                                                                            {sellingPrice > 0 ? `${sellingPrice.toLocaleString("vi-VN")} ₫` : "—"}
                                                                        </td>
                                                                    </tr>

                                                                    {isVariantExpanded && (
                                                                        <tr className="border-b border-slate-100 bg-slate-50/70">
                                                                            <td colSpan={variantColumnCount} className="px-3 py-3">
                                                                                <div className="ml-8 overflow-hidden rounded-[4px] border border-slate-200 bg-white">
                                                                                    <table className="w-full table-fixed border-collapse">
                                                                                        <thead>
                                                                                            <tr className="border-b border-slate-200 bg-[#f8f9fa]">
                                                                                                <th className="w-[28%] px-3 py-2 text-left text-[10px] font-normal text-slate-500">Mã lô</th>
                                                                                                <th className="px-3 py-2 text-left text-[10px] font-normal text-slate-500">Kho / chi nhánh</th>
                                                                                                <th className="w-[90px] px-3 py-2 text-center text-[10px] font-normal text-slate-500">Tồn</th>
                                                                                                {isAdmin && (
                                                                                                    <th className="w-[130px] px-3 py-2 text-right text-[10px] font-normal text-slate-500">Giá vốn</th>
                                                                                                )}
                                                                                                <th className="w-[140px] px-3 py-2 text-right text-[10px] font-normal text-slate-500">Giá bán</th>
                                                                                            </tr>
                                                                                        </thead>
                                                                                        <tbody>
                                                                                            {batches.map((batch, batchIndex) => (
                                                                                                <tr key={`${v.id}-${batch.inventoryId || batchIndex}`} className="border-b border-slate-100 last:border-b-0 hover:bg-blue-50/40">
                                                                                                    <td className="truncate px-3 py-2 text-[11px] font-normal text-slate-700" title={batch.batchNumber}>
                                                                                                        {batch.batchNumber || "Mặc định"}
                                                                                                    </td>
                                                                                                    <td className="truncate px-3 py-2 text-[11px] font-normal text-slate-600" title={batch.branchName}>
                                                                                                        {batch.branchName || "—"}
                                                                                                    </td>
                                                                                                    <td className="px-3 py-2 text-center text-[11px] font-medium text-slate-700">
                                                                                                        {batch.quantity.toLocaleString("vi-VN")}
                                                                                                    </td>
                                                                                                    {isAdmin && (
                                                                                                        <td className="whitespace-nowrap px-3 py-2 text-right text-[11px] font-normal text-blue-600">
                                                                                                            {batch.importPrice != null ? `${batch.importPrice.toLocaleString("vi-VN")} ₫` : "—"}
                                                                                                        </td>
                                                                                                    )}
                                                                                                    <td className="whitespace-nowrap px-3 py-2 text-right text-[11px] font-normal text-emerald-600">
                                                                                                        {batch.sellingPrice > 0 ? `${batch.sellingPrice.toLocaleString("vi-VN")} ₫` : "—"}
                                                                                                    </td>
                                                                                                </tr>
                                                                                            ))}
                                                                                        </tbody>
                                                                                    </table>
                                                                                </div>
                                                                            </td>
                                                                        </tr>
                                                                    )}
                                                                </React.Fragment>
                                                            );
                                                        })}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </React.Fragment>
                            );
                        })
                    )}
                </TableBody>
            </Table>

            {/* Dialog Xác nhận */}
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
