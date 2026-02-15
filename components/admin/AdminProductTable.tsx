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
  Images,
  Camera,
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

interface Variant {
  id: string;
  formulation: string;
  packaging: string;
  weight: string;
  unit: string;
  price: string;
  costPrice: string;
  wholesalePrice: string;
  inventory: number;
  available: number;
  sold: number;
  barcode: string;
  image: string | null;
}

interface Product {
  id: number;
  sku: string;
  name: string;
  category: string;
  brand: string;
  origin: string;
  totalSold: number;
  inventory: number;
  available: number;
  createdAt: string;
  image: string;
  imageCount: number;
  techSpecs: { key: string; value: string }[];
  variants: Variant[];
  status: string;
}

interface AdminProductTableProps {
  products: Product[];
}

export function AdminProductTable({ products }: AdminProductTableProps) {
  const [expandedRows, setExpandedRows] = useState<number[]>([]);

  const toggleRow = (id: number) => {
    setExpandedRows((prev) =>
      prev.includes(id) ? prev.filter((rowId) => rowId !== id) : [...prev, id],
    );
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
              Tên sản phẩm & SKU
            </TableHead>
            <TableHead className="w-[120px] font-bold text-[#1f1f1f] text-[11px] uppercase p-2">
              Thương hiệu
            </TableHead>
            <TableHead className="w-[100px] text-center font-bold text-[#1f1f1f] text-[11px] uppercase p-2">
              Tồn kho
            </TableHead>
            <TableHead className="w-[100px] text-center font-bold text-[#1f1f1f] text-[11px] uppercase p-2">
              Có thể bán
            </TableHead>
            <TableHead className="w-[120px] font-bold text-[#1f1f1f] text-[11px] uppercase p-2 text-center">
              Trạng thái
            </TableHead>
            <TableHead className="w-[100px] text-right font-bold text-[#1f1f1f] text-[11px] uppercase p-2 pr-4">
              Hành động
            </TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {products.map((p) => {
            const isExpanded = expandedRows.includes(p.id);

            return (
              <React.Fragment key={p.id}>
                <TableRow
                  onClick={() => toggleRow(p.id)}
                  className={cn(
                    "cursor-pointer border-b border-[#eee] hover:bg-[#f0f8ff] transition-colors",
                    isExpanded && "bg-[#f8f9fa]",
                  )}
                >
                  <TableCell className="text-center p-2">
                    {isExpanded ? (
                      <ChevronUp size={12} className="text-blue-600" />
                    ) : (
                      <ChevronDown size={12} className="text-gray-400" />
                    )}
                  </TableCell>

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

                  <TableCell className="p-2 pl-4">
                    <div className="flex flex-col">
                      <span className="text-[#1f1f1f] font-bold text-[13px] leading-tight">
                        {p.name}
                      </span>
                      <span className="text-slate-500 text-[10px] font-mono">
                        #{p.sku}
                      </span>
                    </div>
                  </TableCell>

                  <TableCell className="p-2">
                    <span className="flex items-center gap-1 text-[11px] font-bold text-slate-400 uppercase">
                      <BadgeCheck size={12} className="text-emerald-500" />
                      {p.brand}
                    </span>
                  </TableCell>

                  <TableCell className="p-2 text-center">
                    <span className="text-[12px] font-bold text-slate-700">
                      {p.inventory.toLocaleString()}
                    </span>
                    <p className="text-[9px] text-slate-400 uppercase font-bold">
                      ({p.variants.length} SKU)
                    </p>
                  </TableCell>

                  <TableCell className="p-2 text-center">
                    <span className="text-[12px] font-bold text-emerald-600">
                      {p.available.toLocaleString()}
                    </span>
                    <p className="text-[9px] text-slate-400 uppercase font-bold">
                      Sẵn có
                    </p>
                  </TableCell>

                  <TableCell className="p-2 text-center">
                    <span
                      className={cn(
                        "text-[10px] font-bold px-1.5 py-0.5 rounded border tracking-tight uppercase",
                        p.status === "Đang kinh doanh"
                          ? "bg-emerald-50 text-emerald-600 border-emerald-100"
                          : "bg-slate-100 text-slate-400 border-slate-200",
                      )}
                    >
                      {p.status}
                    </span>
                  </TableCell>

                  <TableCell
                    className="p-2 text-right pr-4"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 hover:bg-slate-100"
                      >
                        <Pencil size={14} className="text-blue-600" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 hover:bg-rose-50"
                      >
                        <Trash2 size={14} className="text-rose-600" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>

                {isExpanded && (
                  <TableRow className="bg-[#fdfdfd]">
                    <TableCell
                      colSpan={8}
                      className="p-0 border-b border-[#eee]"
                    >
                      <div className="pl-[40px] pr-4 py-3 space-y-4">
                        <div className="space-y-2">
                          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 flex items-center gap-2">
                            <Layers size={12} /> Biến thể hàng hóa
                          </p>

                          {p.variants.map((v) => {
                            const priceNum =
                              parseInt(v.price.replace(/\D/g, "")) || 0;
                            const costNum =
                              parseInt(v.costPrice.replace(/\D/g, "")) || 0;
                            const margin =
                              priceNum > 0
                                ? Math.round(
                                    ((priceNum - costNum) / priceNum) * 100,
                                  )
                                : 0;
                            const marginColor =
                              margin > 30
                                ? "text-emerald-600"
                                : margin < 10
                                  ? "text-rose-600"
                                  : "text-amber-600";

                            return (
                              <div
                                key={v.id}
                                className="grid grid-cols-12 gap-4 items-center p-2 bg-white border border-slate-100 rounded-[2px] hover:border-blue-200 transition-colors"
                              >
                                <div className="col-span-3 flex items-center gap-3">
                                  <div className="w-8 h-8 border border-slate-200 rounded-[2px] flex items-center justify-center bg-slate-50 overflow-hidden">
                                    {v.image ? (
                                      <img
                                        src={v.image}
                                        className="w-full h-full object-cover p-0.5"
                                      />
                                    ) : (
                                      <Camera
                                        size={12}
                                        className="text-slate-300"
                                      />
                                    )}
                                  </div>
                                  <div className="min-w-0">
                                    <p className="text-[11px] font-bold text-slate-700 truncate uppercase">
                                      {v.formulation} / {v.packaging}
                                    </p>
                                    <p className="text-[9px] text-slate-400 font-bold">
                                      #{v.id}
                                    </p>
                                  </div>
                                </div>

                                <div className="col-span-2 text-center">
                                  <p className="text-[9px] text-slate-400 font-bold uppercase tracking-tighter mb-0.5">
                                    Kho / Bán
                                  </p>
                                  <p className="text-[11px] font-bold text-slate-600">
                                    {v.inventory} |{" "}
                                    <span className="text-blue-600">
                                      {v.sold}
                                    </span>
                                  </p>
                                </div>

                                <div className="col-span-2 text-right">
                                  <p className="text-[9px] text-slate-400 font-bold uppercase tracking-tighter mb-0.5">
                                    Giá vốn
                                  </p>
                                  <p className="text-[11px] font-bold text-slate-400">
                                    {v.costPrice}
                                  </p>
                                </div>

                                <div className="col-span-2 text-right">
                                  <p className="text-[9px] text-slate-400 font-bold uppercase tracking-tighter mb-0.5">
                                    Giá sỉ
                                  </p>
                                  <p className="text-[11px] font-bold text-orange-600">
                                    {v.wholesalePrice}
                                  </p>
                                </div>

                                <div className="col-span-3 text-right pr-2">
                                  <div className="flex items-center justify-end gap-2">
                                    <span
                                      className={cn(
                                        "text-[9px] font-bold uppercase px-1 bg-slate-50 border border-slate-100 rounded-[2px]",
                                        marginColor,
                                      )}
                                    >
                                      {margin}%
                                    </span>
                                    <div className="text-right">
                                      <p className="text-[9px] text-slate-400 font-bold uppercase tracking-tighter mb-0.5">
                                        Giá lẻ niêm yết
                                      </p>
                                      <p className="text-[12px] font-bold text-[#1f1f1f]">
                                        {v.price}
                                      </p>
                                    </div>
                                  </div>
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
    </div>
  );
}
