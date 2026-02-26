"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Eye, Printer, Calendar, ArrowRight, User, FileText, Warehouse, Trash2 } from "lucide-react";
import { cn, formatNumber } from "@/lib/utils";

export function InventoryExportReceiptTable({ receipts }: any) {
  const router = useRouter();

  const formatDate = (dateString: string) => {
    if (!dateString) return "---";
    const date = new Date(dateString);
    return date.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
  };

  const totalAmount = receipts.reduce((acc: number, item: any) => acc + (item.totalAmount || 0), 0);

  return (
    <div className="w-full">
      <div className="overflow-x-auto no-scrollbar">
        <Table className="table-custom border-collapse min-w-[1100px]">
          <TableHeader>
            <TableRow className="bg-[#f0f0f0] hover:bg-[#f0f0f0] border-b border-[#ccc]">
              <TableHead className="w-[100px] font-bold text-[11px] uppercase p-2 pl-6 text-[#1f1f1f]">ID</TableHead>
              <TableHead className="font-bold text-[11px] uppercase p-2 text-[#1f1f1f]">Phiếu & Thời gian</TableHead>
              <TableHead className="w-[280px] font-bold text-[11px] uppercase p-2 text-[#1f1f1f]">Đối tác nhận</TableHead>
              <TableHead className="w-[180px] font-bold text-[11px] uppercase p-2 text-[#1f1f1f]">Kho xuất</TableHead>
              <TableHead className="w-[150px] text-right font-bold text-[11px] uppercase p-2 text-[#1f1f1f]">Tổng giá trị</TableHead>
              <TableHead className="w-[130px] font-bold text-[11px] uppercase p-2 text-center text-[#1f1f1f]">Trạng thái</TableHead>
              <TableHead className="w-[120px] text-right font-bold text-[11px] uppercase p-2 pr-6 text-[#1f1f1f]">Thao tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {receipts && receipts.length > 0 ? (
              receipts.map((item: any) => {
                const isInternal = item.exportType === "INTERNAL" || (item.displayPartnerName && item.displayPartnerName.includes("Nội bộ"));
                let displayPartner = item.displayPartnerName;

                if (!displayPartner || displayPartner === "N/A") {
                    if (isInternal) {
                        displayPartner = item.partnerBranchName ? `[Nội bộ] ${item.partnerBranchName}` : "[Nội bộ] Chi nhánh nhận";
                    } else {
                        displayPartner = item.supplierName ? `[Trả NCC] ${item.supplierName}` : "N/A";
                    }
                }

                return (
                  <TableRow key={item.id || item.code} className="hover:bg-[#f0f8ff] border-b border-[#eee] transition-colors cursor-pointer group h-[52px]">

                    <TableCell className="p-2 pl-6 text-[12px] font-black text-slate-500 uppercase" onClick={() => router.push(`/admin/exports/new-command?id=${item.id}`)}>#{item.id || "0"}</TableCell>

                    <TableCell className="p-2" onClick={() => router.push(`/admin/exports/new-command?id=${item.id}`)}>
                      <div className="flex flex-col">
                        <span className="text-[13px] font-black text-slate-800 uppercase tracking-tighter flex items-center gap-1.5">
                          <FileText size={14} className={isInternal ? "text-emerald-500" : "text-blue-500"} />
                          {item.code}
                        </span>
                        <span className="text-[10px] text-slate-400 font-bold mt-0.5 flex items-center gap-1">
                          <Calendar size={10} className="text-slate-300" /> {formatDate(item.createdAt)}
                        </span>
                      </div>
                    </TableCell>

                    <TableCell className="p-2" onClick={() => router.push(`/admin/exports/new-command?id=${item.id}`)}>
                      <div className="flex flex-col">
                        <span className={cn("text-[13px] font-bold leading-tight flex items-center gap-1", isInternal ? "text-blue-600" : "text-slate-700")}>
                          {isInternal ? <ArrowRight size={14} className="text-blue-500"/> : <User size={14} className="text-slate-400"/>}
                          {displayPartner}
                        </span>
                        <span className="text-[10px] text-slate-400 font-medium mt-1 flex items-center gap-1">
                          <User size={10} /> Người lập: {item.creatorName || "Hệ thống"}
                        </span>
                      </div>
                    </TableCell>

                    <TableCell className="p-2" onClick={() => router.push(`/admin/exports/new-command?id=${item.id}`)}>
                      <div className="flex items-center gap-1.5 text-[11px] text-slate-600 font-bold">
                        <Warehouse size={12} className="text-slate-400" /> {item.branchName || "N/A"}
                      </div>
                    </TableCell>

                    <TableCell className="p-2 text-right text-[14px] font-black text-slate-900" onClick={() => router.push(`/admin/exports/new-command?id=${item.id}`)}>
                      {formatNumber(item.totalAmount || 0)}
                    </TableCell>

                    <TableCell className="p-2 text-center" onClick={() => router.push(`/admin/exports/new-command?id=${item.id}`)}>
                      <span className="text-[10px] font-black px-2 py-0.5 rounded border tracking-tight uppercase text-emerald-600 bg-emerald-50 border-emerald-100">
                        Đã xuất
                      </span>
                    </TableCell>

                    <TableCell className="p-2 text-right pr-6">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" className="h-7 w-7 hover:bg-slate-100" title="Xem chi tiết" onClick={(e) => { e.stopPropagation(); router.push(`/admin/exports/new-command?id=${item.id}`); }}>
                          <Eye size={14} className="text-blue-600" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 hover:bg-slate-100" title="In phiếu" onClick={(e) => e.stopPropagation()}>
                          <Printer size={14} className="text-slate-500" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 opacity-20 cursor-not-allowed" disabled title="Không thể xóa phiếu đã hoàn thành">
                          <Trash2 size={14} className="text-slate-400" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            ) : (
              <TableRow><TableCell colSpan={9} className="h-[400px] text-center text-slate-400 text-[11px] font-black uppercase">Chưa có dữ liệu phiếu xuất</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between px-3 py-2 border-t border-[#eee] bg-[#f8f9fa]">
        <div className="flex items-center gap-6">
          <p className="text-[11px] text-gray-400 font-bold uppercase tracking-widest">Tổng cộng {receipts.length} phiếu</p>
          <div className="h-4 w-[1px] bg-slate-200" />
          <p className="text-[11px] font-bold uppercase">Tổng giá trị: <span className="text-blue-600 font-black">{formatNumber(totalAmount)}</span></p>
        </div>
      </div>
    </div>
  );
}