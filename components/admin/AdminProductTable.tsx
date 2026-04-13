"use client";

import React, { useEffect, useMemo, useState } from "react";
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
    Play,
    Package,
    Box,
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
import { Checkbox } from "@/components/ui/checkbox";
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

import { usePermissions } from "@/hooks/usePermissions";
import { useAuthStore } from "@/stores/useAuthStore";
import { P } from "@/lib/permissions";

const formatMoney = (amount: number) => amount.toLocaleString("vi-VN") + "đ";

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
    onEnable?: (id: number) => void;
    onBulkDelete?: (ids: number[]) => void;
    onBulkEnable?: (ids: number[]) => void;
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
    onBulkDelete,
    onBulkEnable,
}: AdminProductTableProps) {
    const { hasPermission } = usePermissions();
    const { user } = useAuthStore();
    const isAdmin = user?.role?.slug === "ADMIN"; // 👉 BIẾN QUYẾT ĐỊNH ẨN/HIỆN GIÁ VỐN
    const canAction = hasPermission(P.PRODUCT_UPDATE) || hasPermission(P.PRODUCT_DELETE);

    const [expandedRows, setExpandedRows] = useState<number[]>([]);
    const [selectedProductIds, setSelectedProductIds] = useState<number[]>([]);

    const [confirmOpen, setConfirmOpen] = useState(false);
    const [confirmConfig, setConfirmConfig] = useState<{
        id: number | null;
        ids: number[];
        type: "delete" | "disable" | "enable" | "bulkDelete" | "bulkEnable";
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

    const currentPageIds = useMemo(() => products.map((item) => item.id), [products]);
    const selectedInCurrentPage = selectedProductIds.filter((id) => currentPageIds.includes(id));
    const allSelectedInCurrentPage = currentPageIds.length > 0 && selectedInCurrentPage.length === currentPageIds.length;

    useEffect(() => {
        // Loại bỏ các id không còn trong danh sách hiện tại để tránh thao tác nhầm.
        setSelectedProductIds((prev) => prev.filter((id) => currentPageIds.includes(id)));
    }, [currentPageIds]);

    const toggleRow = (id: number) => {
        setExpandedRows((prev) =>
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

    const openBulkEnableConfirm = () => {
        if (selectedProductIds.length === 0) return;
        setConfirmConfig({
            id: null,
            ids: selectedProductIds,
            type: "bulkEnable",
            title: "Xác nhận kinh doanh lại hàng loạt",
            description: `Bạn sắp kinh doanh lại ${selectedProductIds.length} sản phẩm đã chọn.`,
            actionLabel: "Kinh doanh lại",
            variant: "default",
        });
        setConfirmOpen(true);
    };

    const openBulkDeleteConfirm = () => {
        if (selectedProductIds.length === 0) return;
        setConfirmConfig({
            id: null,
            ids: selectedProductIds,
            type: "bulkDelete",
            title: "Xác nhận xóa hàng loạt",
            description: `Bạn sắp xóa ${selectedProductIds.length} sản phẩm đã chọn. Hành động này không thể hoàn tác.`,
            actionLabel: "Xóa sản phẩm",
            variant: "destructive",
        });
        setConfirmOpen(true);
    };

    const toggleSelectProduct = (id: number) => {
        setSelectedProductIds((prev) =>
            prev.includes(id) ? prev.filter((itemId) => itemId !== id) : [...prev, id]
        );
    };

    const toggleSelectAllCurrentPage = () => {
        if (allSelectedInCurrentPage) {
            setSelectedProductIds([]);
            return;
        }
        setSelectedProductIds(currentPageIds);
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
        } else if (confirmConfig.type === "bulkEnable") {
            onBulkEnable?.(confirmConfig.ids);
            setSelectedProductIds([]);
        } else if (confirmConfig.type === "bulkDelete") {
            onBulkDelete?.(confirmConfig.ids);
            setSelectedProductIds([]);
        }
        setConfirmOpen(false);
    };

    return (
        <div className="w-full">
            <div className="flex items-center justify-between px-4 py-3 border-b border-[#eee] bg-[#f8f9fa]">
                <p className="text-[11px] font-bold uppercase text-slate-500">
                    Đang chọn {selectedProductIds.length}/{products.length} sản phẩm
                </p>
                <div className="flex items-center gap-2">
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-7 text-[10px] font-bold uppercase"
                        onClick={toggleSelectAllCurrentPage}
                    >
                        {allSelectedInCurrentPage ? "Bỏ chọn tất cả" : "Chọn tất cả"}
                    </Button>
                    {hasPermission(P.PRODUCT_UPDATE) && (
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="h-7 text-[10px] font-bold uppercase border-emerald-200 text-emerald-700"
                            disabled={selectedProductIds.length === 0}
                            onClick={openBulkEnableConfirm}
                        >
                            Mở kinh doanh đã chọn
                        </Button>
                    )}
                    {hasPermission(P.PRODUCT_DELETE) && (
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="h-7 text-[10px] font-bold uppercase border-rose-200 text-rose-600"
                            disabled={selectedProductIds.length === 0}
                            onClick={openBulkDeleteConfirm}
                        >
                            Xóa đã chọn
                        </Button>
                    )}
                </div>
            </div>

            <Table className="table-custom border-collapse table-fixed min-w-[1140px]">
                <colgroup>
                    <col className="w-[44px]" />
                    <col className="w-[56px]" />
                    <col className="w-[34px]" />
                    <col className="w-[72px]" />
                    <col />
                    <col className="w-[148px]" />
                    <col className="w-[110px]" />
                    <col className="w-[122px]" />
                    {canAction && <col className="w-[124px]" />}
                </colgroup>
                <TableHeader>
                    <TableRow className="bg-[#f0f0f0] hover:bg-[#f0f0f0] border-b border-[#ccc]">
                        <TableHead className="w-[44px] text-center p-2">
                            <Checkbox
                                checked={allSelectedInCurrentPage}
                                onCheckedChange={toggleSelectAllCurrentPage}
                                aria-label="Chọn tất cả sản phẩm"
                            />
                        </TableHead>
                        <TableHead className="w-[56px] text-center p-2 font-bold text-[#1f1f1f] text-[11px] uppercase">STT</TableHead>
                        <TableHead className="w-[34px] p-2" />
                        <TableHead className="w-[72px] text-center p-2 font-bold text-[#1f1f1f] text-[11px] uppercase">Ảnh</TableHead>
                        <TableHead className="font-bold text-[#1f1f1f] text-[11px] uppercase p-2 pl-4">Tên sản phẩm & Danh mục</TableHead>
                        <TableHead className="w-[148px] font-bold text-[#1f1f1f] text-[11px] uppercase p-2">Thương hiệu</TableHead>
                        <TableHead className="w-[110px] text-center font-bold text-[#1f1f1f] text-[11px] uppercase p-2">Tổng Tồn</TableHead>
                        <TableHead className="w-[122px] font-bold text-[#1f1f1f] text-[11px] uppercase p-2 text-center">Trạng thái</TableHead>
                        {canAction && (
                            <TableHead className="w-[124px] text-right font-bold text-[#1f1f1f] text-[11px] uppercase p-2 pr-4">Hành động</TableHead>
                        )}
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
                                    <TableCell className="p-2 text-center" onClick={(e) => e.stopPropagation()}>
                                        <Checkbox
                                            checked={selectedProductIds.includes(p.id)}
                                            onCheckedChange={() => toggleSelectProduct(p.id)}
                                            aria-label={`Chọn sản phẩm ${p.name}`}
                                        />
                                    </TableCell>
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
                                            {p.imageUrls && p.imageUrls.length > 0 ? (
                                                <img src={p.imageUrls[0]} alt={p.name} className="w-full h-full object-contain p-0.5" />
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
                                    {canAction && (
                                        <TableCell className="p-2 text-right pr-4" onClick={(e) => e.stopPropagation()}>
                                            <div className="flex justify-end gap-1">
                                                {hasPermission(P.PRODUCT_UPDATE) && (
                                                    <Button variant="ghost" size="icon" className="h-7 w-7 hover:bg-slate-100" onClick={() => onEdit?.(p.id)} title="Chỉnh sửa">
                                                        <Pencil size={14} className="text-blue-600" />
                                                    </Button>
                                                )}
                                                {hasPermission(P.PRODUCT_UPDATE) && (
                                                    isInactive ? (
                                                        <Button variant="ghost" size="icon" className="h-7 w-7 hover:bg-emerald-50" onClick={() => openEnableConfirm(p.id)} title="Kinh doanh lại">
                                                            <Play size={14} className="text-emerald-600" />
                                                        </Button>
                                                    ) : (
                                                        <Button variant="ghost" size="icon" className="h-7 w-7 hover:bg-amber-50" onClick={() => openDisableConfirm(p.id)} title="Ngừng kinh doanh">
                                                            <Ban size={14} className="text-amber-600" />
                                                        </Button>
                                                    )
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

                                {/* ─── EXPANDED: DANH SÁCH BIẾN THỂ VÀ BẢNG LÔ HÀNG ─── */}
                                {isExpanded && (
                                    <TableRow className="bg-[#fdfdfd]">
                                        <TableCell colSpan={canAction ? 9 : 8} className="p-0 border-b border-[#eee]">
                                            <div className="pl-[50px] pr-4 py-4 space-y-4">
                                                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 flex items-center gap-2">
                                                    <Layers size={12} /> Biến thể hàng hóa ({p.variants.length} SKU)
                                                </p>

                                                <div className="flex flex-col gap-4">
                                                    {p.variants.map((v) => {
                                                        const attrLabel = v.attributeValues.length > 0
                                                            ? v.attributeValues.map((a) => `${a.attributeName}: ${a.value}`).join(" / ")
                                                            : "Chưa phân loại";

                                                        return (
                                                            <div key={v.id} className="bg-white border border-slate-200 rounded-[4px] shadow-sm overflow-hidden transition-all hover:border-emerald-200">

                                                                {/* PHẦN ĐẦU: THÔNG TIN BIẾN THỂ */}
                                                                <div className="flex items-center justify-between p-3 border-b border-slate-100 bg-slate-50/50">
                                                                    <div className="flex items-center gap-3">
                                                                        <div className="w-10 h-10 border border-slate-200 rounded-[2px] flex items-center justify-center bg-white overflow-hidden shrink-0">
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
                                                                    <div className="text-right">
                                                                        <p className="text-[9px] text-slate-400 font-bold uppercase tracking-tighter mb-0.5 flex items-center justify-end gap-1">
                                                                            <Package size={10} /> Tổng tồn kho
                                                                        </p>
                                                                        <p className="text-[13px] font-black text-emerald-600">
                                                                            {v.quantity.toLocaleString("vi-VN")} <span className="text-[10px] font-medium text-slate-400">SP</span>
                                                                        </p>
                                                                    </div>
                                                                </div>

                                                                {/* PHẦN DƯỚI: BẢNG CHI TIẾT LÔ HÀNG Y HỆT TRANG EDIT */}
                                                                <div className="bg-white">
                                                                    <div className="px-3 py-2 border-b flex justify-between items-center bg-[#f4f6f8]">
                                                                        <span className="text-[10px] font-black text-slate-700 uppercase flex items-center gap-1.5">
                                                                            <Box size={12} className="text-blue-600"/> Lô hàng hiện tại
                                                                        </span>
                                                                    </div>

                                                                    {v.batches && v.batches.length > 0 ? (
                                                                        <div className="overflow-x-auto">
                                                                            <table className="w-full text-left">
                                                                                <thead className="bg-white border-b">
                                                                                <tr>
                                                                                    <th className="p-2 pl-4 text-[9px] font-bold text-slate-400 uppercase whitespace-nowrap">Mã Lô</th>
                                                                                    <th className="p-2 text-[9px] font-bold text-slate-400 uppercase whitespace-nowrap">Vị trí</th>
                                                                                    <th className="p-2 text-[9px] font-bold text-slate-400 uppercase text-center whitespace-nowrap">Tồn</th>
                                                                                    {isAdmin && <th className="p-2 text-[9px] font-bold text-blue-500 uppercase text-right whitespace-nowrap">Giá vốn</th>}
                                                                                    <th className="p-2 pr-4 text-[9px] font-bold text-emerald-600 uppercase text-right whitespace-nowrap">Giá bán niêm yết</th>
                                                                                </tr>
                                                                                </thead>
                                                                                <tbody className="divide-y divide-slate-50">
                                                                                {v.batches.map((b: any, bIdx: number) => (
                                                                                    <tr key={`batch-${v.id}-${b.inventoryId || bIdx}`} className="hover:bg-slate-50 transition-colors">
                                                                                        <td className="p-2 pl-4 text-[11px] font-mono font-bold text-slate-700 whitespace-nowrap">
                                                                                            {b.batchNumber || "Mặc định"}
                                                                                            {bIdx === 0 && <span className="ml-2 text-[8px] bg-blue-100 text-blue-700 px-1 py-[2px] rounded uppercase">Đang xuất</span>}
                                                                                        </td>
                                                                                        <td className="p-2 text-[10px] font-medium text-slate-500 whitespace-nowrap">{b.branchName}</td>
                                                                                        <td className="p-2 text-[11px] font-black text-slate-700 text-center">{b.quantity}</td>
                                                                                        {isAdmin && (
                                                                                            <td className="p-2 text-[11px] font-bold text-blue-600 text-right whitespace-nowrap">
                                                                                                {b.importPrice != null ? `${b.importPrice.toLocaleString('vi-VN')} ₫` : "—"}
                                                                                            </td>
                                                                                        )}
                                                                                        <td className="p-2 pr-4 text-[11px] font-black text-emerald-600 text-right whitespace-nowrap">
                                                                                            {b.sellingPrice ? `${b.sellingPrice.toLocaleString('vi-VN')} ₫` : "—"}
                                                                                        </td>
                                                                                    </tr>
                                                                                ))}
                                                                                </tbody>
                                                                            </table>
                                                                        </div>
                                                                    ) : (
                                                                        <div className="p-4 flex items-center justify-center bg-white">
                                                                            <p className="text-[11px] font-medium text-slate-400">Không có lô hàng nào (Hết hàng).</p>
                                                                        </div>
                                                                    )}
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