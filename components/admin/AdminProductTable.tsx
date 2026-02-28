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

import { usePermissions } from "@/hooks/usePermissions";
import { P } from "@/lib/permissions";

interface AttributeValueDisplay {
  attributeName: string;
  value: string;
}

interface Variant {
  id: number;
  sku: string;
  barcode: string;
  costPrice: number | null; // ✅ Cập nhật: Cho phép null
  price: number;
  wholesalePrice: number;
  quantity: number;
  shippingWeight: number | null;
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
  onDelete?: (id: number) => void;
  onEdit?: (id: number) => void;
  onDisable?: (id: number) => void;
}

const STATUS_MAP: Record<string, { label: string; className: string }> = {
  ACTIVE:   { label: "Đang kinh doanh", className: "bg-emerald-50 text-emerald-600 border-emerald-100" },
  INACTIVE: { label: "Ngừng kinh doanh", className: "bg-slate-100 text-slate-400 border-slate-200" },
  DRAFT:    { label: "Lưu nháp",         className: "bg-amber-50 text-amber-600 border-amber-100" },
};

function formatPrice(n: number) {
  return n?.toLocaleString("vi-VN") + " ₫";
}

export function AdminProductTable({ products, onDelete, onEdit, onDisable }: AdminProductTableProps) {
  const { hasPermission } = usePermissions();
  const [expandedRows, setExpandedRows] = useState<number[]>([]);

  const canAction = hasPermission(P.PRODUCT_UPDATE) || hasPermission(P.PRODUCT_DELETE);

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
            <TableHead className="w-[30px] p-2" />
            <TableHead className="w-[60px] text-center p-2 font-bold text-[#1f1f1f] text-[11px] uppercase">
              Ảnh
            </TableHead>
            <TableHead className="font-bold text-[#1f1f1f] text-[11px] uppercase p-2 pl-4">
              Tên sản phẩm & Danh mục
            </TableHead>
            <TableHead className="w-[130px] font-bold text-[#1f1f1f] text-[11px] uppercase p-2">
              Thương hiệu
            </TableHead>
            <TableHead className="w-[100px] text-center font-bold text-[#1f1f1f] text-[11px] uppercase p-2">
              Tồn kho
            </TableHead>
            <TableHead className="w-[120px] font-bold text-[#1f1f1f] text-[11px] uppercase p-2 text-center">
              Trạng thái
            </TableHead>
            {canAction && (
              <TableHead className="w-[130px] text-right font-bold text-[#1f1f1f] text-[11px] uppercase p-2 pr-4">
                Hành động
              </TableHead>
            )}
          </TableRow>
        </TableHeader>

        <TableBody>
          {products.map((p) => {
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
                  {/* Expand toggle */}
                  <TableCell className="text-center p-2">
                    {isExpanded ? (
                      <ChevronUp size={12} className="text-blue-600" />
                    ) : (
                      <ChevronDown size={12} className="text-gray-400" />
                    )}
                  </TableCell>

                  {/* Ảnh */}
                  <TableCell className="p-2">
                    <div className="w-10 h-10 mx-auto bg-white border border-[#ddd] rounded-[3px] flex items-center justify-center overflow-hidden shadow-sm">
                      {p.image ? (
                        <img
                          src={p.image}
                          alt={p.name}
                          className="w-full h-full object-contain p-0.5"
                        />
                      ) : (
                        <ImageIcon size={16} className="text-slate-200" />
                      )}
                    </div>
                  </TableCell>

                  {/* Tên + danh mục + baseSku */}
                  <TableCell className="p-2 pl-4">
                    <div className="flex flex-col">
                      <span className="text-[#1f1f1f] font-bold text-[13px] leading-tight">
                        {p.name}
                      </span>
                      <span className="text-slate-400 text-[10px] mt-0.5">
                        {p.categoryName}
                        {p.baseSku && (
                          <span className="ml-2 font-mono text-slate-300">#{p.baseSku}</span>
                        )}
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

                  {/* Tồn kho */}
                  <TableCell className="p-2 text-center">
                    <span className="text-[12px] font-bold text-slate-700">
                      {p.inventory.toLocaleString("vi-VN")}
                    </span>
                    <p className="text-[9px] text-slate-400 uppercase font-bold">
                      ({p.variants.length} SKU)
                    </p>
                  </TableCell>

                  {/* Trạng thái */}
                  <TableCell className="p-2 text-center">
                    <span
                      className={cn(
                        "text-[10px] font-bold px-1.5 py-0.5 rounded border tracking-tight uppercase whitespace-nowrap",
                        statusInfo.className,
                      )}
                    >
                      {statusInfo.label}
                    </span>
                  </TableCell>

                  {/* Hành động */}
                  {canAction && (
                    <TableCell
                      className="p-2 text-right pr-4"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex justify-end gap-1">
                        {hasPermission(P.PRODUCT_UPDATE) && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 hover:bg-slate-100"
                            onClick={() => onEdit?.(p.id)}
                            title="Chỉnh sửa"
                          >
                            <Pencil size={14} className="text-blue-600" />
                          </Button>
                        )}

                        {hasPermission(P.PRODUCT_UPDATE) && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 hover:bg-amber-50"
                            onClick={() => openDisableConfirm(p.id)}
                            disabled={isInactive}
                            title="Ngừng kinh doanh"
                          >
                            <Ban
                              size={14}
                              className={isInactive ? "text-slate-300" : "text-amber-600"}
                            />
                          </Button>
                        )}

                        {hasPermission(P.PRODUCT_DELETE) && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 hover:bg-rose-50"
                            onClick={() => openDeleteConfirm(p.id)}
                            title="Xóa vĩnh viễn"
                          >
                            <Trash2 size={14} className="text-rose-600" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  )}
                </TableRow>

                {/* Expanded — danh sách biến thể */}
                {isExpanded && (
                  <TableRow className="bg-[#fdfdfd]">
                    <TableCell colSpan={7} className="p-0 border-b border-[#eee]">
                      <div className="pl-[40px] pr-4 py-3 space-y-2">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 flex items-center gap-2 mb-2">
                          <Layers size={12} /> Biến thể hàng hóa ({p.variants.length} SKU)
                        </p>

                        {p.variants.map((v) => {
                          // ✅ CỜ XÁC ĐỊNH: Có hiển thị giá vốn hay không? (Chỉ Admin mới có !== null)
                          const hasCostPrice = v.costPrice !== null && v.costPrice !== undefined;

                          // Chỉ tính biên lợi nhuận nếu là Admin (có giá vốn)
                          const margin = (v.price > 0 && hasCostPrice)
                              ? Math.round(((v.price - v.costPrice!) / v.price) * 100)
                              : null;

                          const marginColor =
                            margin !== null && margin > 30
                              ? "text-emerald-600"
                              : margin !== null && margin < 10
                              ? "text-rose-600"
                              : "text-amber-600";

                          const attrLabel =
                            v.attributeValues.length > 0
                              ? v.attributeValues
                                  .map((a) => `${a.attributeName}: ${a.value}`)
                                  .join(" / ")
                              : null;

                          return (
                            <div
                              key={v.id}
                              className="grid grid-cols-12 gap-3 items-center p-2 bg-white border border-slate-100 rounded-[2px] hover:border-blue-200 transition-colors"
                            >
                              {/* ✅ NẾU KHÔNG CÓ GIÁ VỐN -> MỞ RỘNG CỘT TÊN THÀNH col-span-6 ĐỂ GIỮ BỐ CỤC ĐẸP */}
                              <div className={cn("flex items-center gap-3", hasCostPrice ? "col-span-4" : "col-span-6")}>
                                <div className="w-8 h-8 border border-slate-200 rounded-[2px] flex items-center justify-center bg-slate-50 overflow-hidden shrink-0">
                                  {v.imageUrl ? (
                                    <img
                                      src={v.imageUrl}
                                      className="w-full h-full object-cover p-0.5"
                                      alt={v.sku}
                                    />
                                  ) : (
                                    <Camera size={12} className="text-slate-300" />
                                  )}
                                </div>
                                <div className="min-w-0">
                                  {attrLabel && (
                                    <p className="text-[11px] font-bold text-slate-700 truncate uppercase">
                                      {attrLabel}
                                    </p>
                                  )}
                                  <p className="text-[9px] text-slate-400 font-mono">
                                    {v.sku}
                                    {v.barcode && (
                                      <span className="ml-1 text-slate-300">· {v.barcode}</span>
                                    )}
                                  </p>
                                </div>
                              </div>

                              {/* Kho (Số lượng động tùy thuộc tài khoản đăng nhập) */}
                              <div className="col-span-2 text-center">
                                <p className="text-[9px] text-slate-400 font-bold uppercase tracking-tighter mb-0.5">
                                  Tồn kho
                                </p>
                                <p className="text-[11px] font-bold text-slate-600">
                                  {v.quantity.toLocaleString("vi-VN")}
                                </p>
                              </div>

                              {/* ✅ Giá vốn: Chỉ hiển thị khối này khi hasCostPrice = true */}
                              {hasCostPrice && (
                                <div className="col-span-2 text-right">
                                  <p className="text-[9px] text-slate-400 font-bold uppercase tracking-tighter mb-0.5">
                                    Giá vốn
                                  </p>
                                  <p className="text-[11px] font-bold text-slate-400">
                                    {formatPrice(v.costPrice!)}
                                  </p>
                                </div>
                              )}

                              {/* Giá sỉ */}
                              <div className="col-span-2 text-right">
                                <p className="text-[9px] text-slate-400 font-bold uppercase tracking-tighter mb-0.5">
                                  Giá sỉ
                                </p>
                                <p className="text-[11px] font-bold text-orange-500">
                                  {v.wholesalePrice ? formatPrice(v.wholesalePrice) : "—"}
                                </p>
                              </div>

                              {/* Giá lẻ + biên lợi nhuận */}
                              <div className="col-span-2 text-right pr-1">
                                <div className="flex items-center justify-end gap-2">
                                  {/* ✅ Biên lợi nhuận: Chỉ tính và hiện nếu là Admin (Có Giá vốn) */}
                                  {margin !== null && (
                                    <span
                                      className={cn(
                                        "text-[9px] font-bold uppercase px-1 bg-slate-50 border border-slate-100 rounded-[2px]",
                                        marginColor,
                                      )}
                                    >
                                      {margin}%
                                    </span>
                                  )}
                                  <div className="text-right">
                                    <p className="text-[9px] text-slate-400 font-bold uppercase tracking-tighter mb-0.5">
                                      Giá lẻ
                                    </p>
                                    <p className="text-[12px] font-bold text-[#1f1f1f]">
                                      {formatPrice(v.price)}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </React.Fragment>
            );
          })}
        </TableBody>
      </Table>

      <div className="flex items-center justify-between px-3 py-2 border-t border-[#eee] bg-[#f8f9fa]">
        <p className="text-[11px] text-gray-400 font-bold uppercase tracking-widest">
          Tổng số {products.length} sản phẩm hệ thống
        </p>
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="sm"
            className="h-6 px-2 text-[10px] font-bold bg-white border-[#ddd]"
          >
            Trước
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-6 w-6 p-0 text-[10px] bg-blue-600 text-white border-blue-600"
          >
            1
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-6 px-2 text-[10px] font-bold bg-white border-[#ddd]"
          >
            Sau
          </Button>
        </div>
      </div>

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