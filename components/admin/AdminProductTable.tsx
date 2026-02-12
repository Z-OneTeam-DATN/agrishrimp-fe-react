"use client";

import React, { useState } from "react";
import {
  Pencil,
  Trash2,
  Image as ImageIcon,
  ChevronDown,
  ChevronUp,
  BadgeCheck,
  ScanLine,
  ListTree,
  Layers,
  Globe2,
  Images,
  FileText,
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
  image: string;
  imageCount: number;
  techSpecs: { key: string; value: string }[];
  variants: Variant[];
}

interface AdminProductTableProps {
  products: Product[];
}

export function AdminProductTable({ products }: AdminProductTableProps) {
  const [expandedRows, setExpandedRows] = useState<number[]>([]);

  const toggleRow = (id: number) => {
    setExpandedRows((prev) =>
      prev.includes(id)
        ? prev.filter((rowId) => rowId !== id)
        : [...prev, id]
    );
  };

  return (
    <div className="w-full">
      <Table className="table-custom border-collapse">
        <TableHeader>
          <TableRow className="bg-[#f0f0f0] border-b border-[#ccc]">
            <TableHead className="w-[30px] p-2" />
            <TableHead className="w-[50px] text-center text-[11px] font-bold uppercase p-2">
              Ảnh
            </TableHead>

            <TableHead className="text-[11px] font-bold uppercase p-2">
              Tên sản phẩm
            </TableHead>
            <TableHead className="w-[110px] text-[11px] font-bold uppercase p-2">
              SKU
            </TableHead>
            <TableHead className="w-[120px] text-[11px] font-bold uppercase p-2">
              Thương hiệu
            </TableHead>
            <TableHead className="w-[120px] text-[11px] font-bold uppercase p-2">
              Xuất xứ
            </TableHead>
            <TableHead className="w-[140px] text-[11px] font-bold uppercase p-2">
              Danh mục
            </TableHead>
            <TableHead className="w-[80px] text-right text-[11px] font-bold uppercase p-2">
              Đã bán
            </TableHead>
            <TableHead className="w-[80px] text-right text-[11px] font-bold uppercase p-2 pr-4">
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
                    "cursor-pointer border-b border-[#eee] hover:bg-[#f0f8ff]",
                    isExpanded && "bg-[#f8f9fa]"
                  )}
                >
                  <TableCell className="text-center p-2">
                    {isExpanded ? (
                      <ChevronUp size={12} className="text-emerald-600" />
                    ) : (
                      <ChevronDown size={12} className="text-gray-400" />
                    )}
                  </TableCell>

                  <TableCell className="p-2">
                    <div className="relative w-10 h-10 mx-auto bg-white border border-[#ddd] rounded flex items-center justify-center overflow-hidden">
                      {p.image ? (
                        <img
                          src={p.image}
                          alt={p.name}
                          className="w-full h-full object-contain"
                        />
                      ) : (
                        <ImageIcon size={14} className="text-gray-200" />
                      )}
                      <div className="absolute bottom-0 right-0 bg-black/60 text-white text-[8px] px-1 flex items-center gap-0.5">
                        <Images size={8} /> {p.imageCount}
                      </div>
                    </div>
                  </TableCell>

                  <TableCell className="p-2 font-bold text-[12px] text-[#1f1f1f]">
                    {p.name}
                  </TableCell>

                  <TableCell className="p-2">
                    <span className="text-[10px] font-mono text-slate-400 bg-slate-50 px-1 border border-slate-100 rounded">
                      #{p.sku}
                    </span>
                  </TableCell>

                  <TableCell className="p-2">
                    <span className="flex items-center gap-1 text-[10px] font-bold text-slate-400 uppercase">
                      <BadgeCheck size={10} className="text-emerald-500" />
                      {p.brand}
                    </span>
                  </TableCell>

                  <TableCell className="p-2">
                    <span className="flex items-center gap-1 text-[10px] font-bold text-slate-400 uppercase">
                      <Globe2 size={10} className="text-blue-400" />
                      {p.origin}
                    </span>
                  </TableCell>

                  <TableCell className="p-2 text-[11px] font-semibold text-slate-500">
                    {p.category}
                  </TableCell>

                  <TableCell className="p-2 text-right font-bold text-emerald-600 text-[12px]">
                    {p.totalSold}
                  </TableCell>

                  <TableCell
                    className="p-2 pr-4 text-right"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                      >
                        <Pencil size={12} className="text-blue-600" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                      >
                        <Trash2 size={12} className="text-rose-600" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>

                {isExpanded && (
                  <TableRow className="bg-[#fdfdfd]">
                    <TableCell colSpan={9} className="p-0 border-b border-[#eee]">
                      <div className="pl-[40px] pr-4 py-3 space-y-4">
                        {/* Thông số kỹ thuật */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-2">
                            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 flex items-center gap-2">
                              <ListTree size={12} /> Đặc tính kỹ thuật
                            </p>
                            <div className="grid grid-cols-2 gap-2">
                              {p.techSpecs.map((s, i) => (
                                <div
                                  key={i}
                                  className="bg-white border p-1.5 rounded"
                                >
                                  <span className="text-[9px] uppercase text-slate-400 font-bold">
                                    {s.key}
                                  </span>
                                  <p className="text-[11px] font-semibold text-slate-600">
                                    {s.value}
                                  </p>
                                </div>
                              ))}
                            </div>
                          </div>

                          <div className="space-y-2">
                            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 flex items-center gap-2">
                              <FileText size={12} /> Mô tả
                            </p>
                            <div className="text-[11px] text-slate-500 bg-white border p-2 rounded">
                              Sản phẩm đạt chuẩn GMP-WHO, an toàn và hiệu quả cho
                              môi trường ao nuôi.
                            </div>
                          </div>
                        </div>

                        {/* Variants */}
                        <div className="space-y-2">
                          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 flex items-center gap-2">
                            <Layers size={12} /> Biến thể SKU
                          </p>

                          {p.variants.map((v) => (
                            <div
                              key={v.id}
                              className="flex justify-between items-center p-2 bg-white border rounded"
                            >
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 border rounded flex items-center justify-center">
                                  {v.image ? (
                                    <img
                                      src={v.image}
                                      className="w-full h-full object-cover"
                                    />
                                  ) : (
                                    <Camera size={12} />
                                  )}
                                </div>
                                <div>
                                  <p className="text-[11px] font-bold">
                                    {v.formulation} / {v.packaging}
                                  </p>
                                  <p className="text-[10px] text-slate-400">
                                    {v.weight} {v.unit}
                                  </p>
                                </div>
                              </div>

                              <div className="text-right">
                                <p className="text-[11px] font-bold text-slate-700">
                                  {v.price}
                                </p>
                                <div className="flex items-center gap-1 text-[10px] text-slate-400 justify-end">
                                  <ScanLine size={10} /> {v.barcode}
                                </div>
                              </div>
                            </div>
                          ))}
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
    </div>
  );
}
