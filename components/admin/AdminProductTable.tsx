"use client";

import React, { useState } from "react";
import { 
  Pencil, 
  Trash2, 
  Image as ImageIcon, 
  ChevronLeft, 
  ChevronRight, 
  ChevronDown, 
  ChevronUp, 
  Package,
  Tag,
  BadgeCheck,
  ScanLine,
  ListTree,
  FlaskConical,
  Layers,
  Globe2,
  ArrowRight,
  Images,
  FileText,
  Camera
} from "lucide-react";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

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
  sku: string; // Mã SKU gốc
  name: string;
  category: string;
  brand: string;
  origin: string;
  priceRange: string;
  totalSold: number;
  status: string;
  image: string;
  imageCount: number; // Số lượng ảnh trong album
  techSpecs: { key: string; value: string }[];
  variants: Variant[];
}

interface AdminProductTableProps {
  products: Product[];
}

export function AdminProductTable({ products }: AdminProductTableProps) {
  const [expandedRows, setExpandedRows] = useState<number[]>([]);

  const toggleRow = (id: number) => {
    setExpandedRows(prev => 
      prev.includes(id) ? prev.filter(rowId => rowId !== id) : [...prev, id]
    );
  };

  return (
    <div className="w-full">
      <Table className="table-custom border-collapse">
        <TableHeader>
          <TableRow className="bg-[#f0f0f0] hover:bg-[#f0f0f0] border-b border-[#ccc]">
            <TableHead className="w-[30px] text-center p-2"></TableHead>
            <TableHead className="w-[50px] text-center font-bold text-[#1f1f1f] text-[11px] uppercase p-2">Ảnh</TableHead>
            <TableHead className="font-bold text-[#1f1f1f] text-[11px] uppercase p-2">Thông tin hàng hóa</TableHead>
            <TableHead className="w-[120px] font-bold text-[#1f1f1f] text-[11px] uppercase p-2">Danh mục</TableHead>
            <TableHead className="w-[140px] text-right font-bold text-[#1f1f1f] text-[11px] uppercase p-2">Giá bán lẻ</TableHead>
            <TableHead className="w-[80px] text-right font-bold text-[#1f1f1f] text-[11px] uppercase p-2">Đã bán</TableHead>
            <TableHead className="w-[110px] font-bold text-[#1f1f1f] text-[11px] uppercase p-2">Trạng thái</TableHead>
            <TableHead className="w-[80px] text-right font-bold text-[#1f1f1f] text-[11px] uppercase p-2 pr-4">Hành động</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {products.map((p) => {
            const isExpanded = expandedRows.includes(p.id);
            return (
              <React.Fragment key={p.id}>
                <TableRow 
                  className={cn(
                    "hover:bg-[#f0f8ff] border-b border-[#eee] transition-colors cursor-pointer",
                    isExpanded && "bg-[#f8f9fa]"
                  )}
                  onClick={() => toggleRow(p.id)}
                >
                  <TableCell className="text-center p-2">
                    <div className="flex items-center justify-center">
                      {isExpanded ? <ChevronUp size={12} className="text-emerald-600" /> : <ChevronDown size={12} className="text-gray-400" />}
                    </div>
                  </TableCell>
                  <TableCell className="p-2">
                    <div className="relative w-10 h-10 mx-auto bg-white border border-[#ddd] rounded-[3px] flex items-center justify-center overflow-hidden">
                      {p.image ? <img src={p.image} alt={p.name} className="w-full h-full object-contain" /> : <ImageIcon size={14} className="text-gray-200" />}
                      <div className="absolute bottom-0 right-0 bg-black/60 text-white text-[8px] px-1 font-bold flex items-center gap-0.5">
                        <Images size={8} /> {p.imageCount}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="p-2">
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        <span className="text-[#1f1f1f] font-bold text-[12px] leading-tight">{p.name}</span>
                        <span className="text-[10px] font-mono text-slate-400 bg-slate-50 px-1 border border-slate-100 rounded">#{p.sku}</span>
                      </div>
                      <div className="flex items-center gap-3 mt-0.5">
                        <span className="flex items-center gap-1 text-[10px] font-bold text-slate-400 uppercase"><BadgeCheck size={10} className="text-emerald-500"/> {p.brand}</span>
                        <span className="flex items-center gap-1 text-[10px] font-bold text-slate-400 uppercase"><Globe2 size={10} className="text-blue-400"/> {p.origin}</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="p-2">
                    <span className="text-[11px] text-slate-500 font-semibold">{p.category}</span>
                  </TableCell>
                  <TableCell className="text-right p-2 font-bold text-[#1f1f1f] text-[12px] whitespace-nowrap">
                    {p.priceRange}
                  </TableCell>
                  <TableCell className="text-right p-2 font-bold text-emerald-600 text-[12px]">
                    {p.totalSold}
                  </TableCell>
                  <TableCell className="p-2">
                    <span className={cn(
                      "text-[10px] font-bold px-1.5 py-0.5 rounded border tracking-tight",
                      p.status === "Đang kinh doanh" ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-rose-50 text-rose-600 border-rose-100"
                    )}>{p.status}</span>
                  </TableCell>
                  <TableCell className="text-right p-2 pr-4" onClick={(e) => e.stopPropagation()}>
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon" className="h-6 w-6 hover:bg-slate-100">
                        <Pencil size={12} className="text-blue-600" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-6 w-6 hover:bg-rose-50">
                        <Trash2 size={12} className="text-rose-600" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>

                {/* Expanded Full Info View */}
                {isExpanded && (
                  <TableRow className="bg-[#fdfdfd] hover:bg-[#fdfdfd]">
                    <TableCell colSpan={8} className="p-0 border-b border-[#eee]">
                      <div className="pl-[40px] pr-4 py-3 space-y-4">
                        
                        {/* 1. Thông số kỹ thuật & Mô tả tóm tắt */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {p.techSpecs && p.techSpecs.length > 0 && (
                            <div className="space-y-2">
                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                <ListTree size={12} className="text-emerald-500" /> Đặc tính kỹ thuật chung
                              </p>
                              <div className="grid grid-cols-2 gap-2">
                                {p.techSpecs.map((spec, idx) => (
                                  <div key={idx} className="bg-white border border-[#f0f0f0] p-1.5 rounded-[2px] flex flex-col">
                                    <span className="text-[9px] text-slate-400 font-bold uppercase truncate">{spec.key}</span>
                                    <span className="text-[11px] text-slate-600 font-semibold">{spec.value}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                          <div className="space-y-2">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                              <FileText size={12} className="text-blue-500" /> Mô tả sản phẩm
                            </p>
                            <div className="text-[11px] text-slate-500 line-clamp-3 bg-white border border-[#f0f0f0] p-2 rounded-[2px]">
                              Sản phẩm đạt chuẩn GMP-WHO, hỗ trợ xử lý môi trường ao nuôi hiệu quả cao, an toàn cho tôm cá và người sử dụng. Xem chi tiết trong phần chỉnh sửa.
                            </div>
                          </div>
                        </div>

                        {/* 2. Danh sách biến thể chi tiết với ẢNH MẪU */}
                        <div className="space-y-2">
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                            <Layers size={12} className="text-emerald-500" /> Cấu hình các mẫu biến thể (SKUs)
                          </p>
                          <div className="grid grid-cols-1 gap-1.5">
                            {p.variants.map((v) => (
                              <div key={v.id} className="flex items-center justify-between p-2 rounded bg-white border border-[#f0f0f0] group/var transition-all hover:border-emerald-200">
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 bg-slate-50 border border-slate-100 rounded flex items-center justify-center overflow-hidden">
                                    {v.image ? <img src={v.image} className="w-full h-full object-cover" /> : <Camera size={12} className="text-slate-200" />}
                                  </div>
                                  <div className="flex flex-col">
                                    <span className="text-[11px] font-bold text-slate-700">{v.formulation} / {v.packaging}</span>
                                    <div className="flex items-center gap-2">
                                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter bg-slate-50 px-1 rounded">Trọng lượng: {v.weight} {v.unit}</span>
                                      <span className="text-[10px] font-mono text-slate-300">SKU: {v.id}</span>
                                    </div>
                                  </div>
                                </div>
                                <div className="flex items-center gap-8">
                                  <div className="text-right min-w-[100px] whitespace-nowrap">
                                    <p className="text-[11px] font-bold text-slate-800">{v.price}</p>
                                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">Giá niêm yết</p>
                                  </div>
                                  <div className="text-right min-w-[120px]">
                                    <div className="flex items-center justify-end gap-1.5 text-slate-400">
                                      <ScanLine size={10} />
                                      <span className="text-[10px] font-mono uppercase">{v.barcode}</span>
                                    </div>
                                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">Mã vạch (Barcode)</p>
                                  </div>
                                  <div className="text-right min-w-[60px]">
                                    <p className="text-[11px] font-bold text-emerald-600">{v.sold}</p>
                                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">Đã bán</p>
                                  </div>
                                  <div className="flex gap-1 opacity-0 group-hover/var:opacity-100 transition-opacity">
                                    <button className="text-slate-400 hover:text-blue-600 p-1"><Pencil size={12}/></button>
                                    <button className="text-slate-400 hover:text-rose-600 p-1"><Trash2 size={12}/></button>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
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
        <p className="text-[11px] text-gray-400 font-bold uppercase">Hiển thị {products.length} bản ghi hệ thống</p>
        <div className="flex items-center gap-1">
          <Button variant="outline" size="sm" className="h-6 px-2 text-[10px] font-bold bg-white">Trước</Button>
          <Button variant="outline" size="sm" className="h-6 w-6 p-0 text-[10px] bg-blue-600 text-white border-blue-600">1</Button>
          <Button variant="outline" size="sm" className="h-6 px-2 text-[10px] font-bold bg-white">Sau</Button>
        </div>
      </div>
    </div>
  );
}
