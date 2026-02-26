"use client";

import React from "react";
import { useRouter } from "next/navigation";
import {
  Pencil,
  Trash2,
  Eye,
  Copy,
  Clock,
  DollarSign,
  ArrowRight,
  Truck,
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
import { cn, formatNumber } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface AdminTransferTableProps {
  data: any[];
  mode: string;
  selectedIds: string[];
  onSelectionChange: (ids: string[]) => void;
  onDelete: (id: string) => void;
}

export function AdminTransferTable({
  data,
  mode,
  selectedIds,
  onSelectionChange,
  onDelete,
}: AdminTransferTableProps) {
  const router = useRouter();

  const getStatusStyle = (status: string) => {
    switch (status) {
      case "PENDING":
        return "bg-amber-50 text-amber-600 border-amber-100";
      case "TRANSIT":
      case "SHIPPING":
        return "bg-blue-50 text-blue-600 border-blue-100";
      case "COMPLETED":
        return "bg-emerald-50 text-emerald-600 border-emerald-100";
      case "OVERDUE":
        return "bg-rose-50 text-rose-600 border-rose-100";
      default:
        return "bg-slate-50 text-slate-500 border-slate-100";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "PENDING": return "CHỜ XUẤT KHO";
      case "TRANSIT":
      case "SHIPPING": return "ĐANG CHUYỂN";
      case "COMPLETED": return "ĐÃ NHẬN";
      case "OVERDUE": return "QUÁ HẠN";
      case "CANCELLED": return "ĐÃ HỦY";
      default: return status;
    }
  };

  const toggleSelect = (id: string) => {
    const newSelected = selectedIds.includes(id)
      ? selectedIds.filter((i) => i !== id)
      : [...selectedIds, id];
    onSelectionChange(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === data.length) {
      onSelectionChange([]);
    } else {
      onSelectionChange(data.map((item) => item.id));
    }
  };

  const handleViewDetail = (id: any) => {
    router.push(`/admin/transfers/${id}`);
  };

  return (
    <TooltipProvider>
      <div className="w-full">
        <Table className="table-custom border-collapse min-w-[1200px]">
          <TableHeader>
            <TableRow className="bg-[#f0f0f0] border-b border-[#ccc] hover:bg-[#f0f0f0]">
              <TableHead className="w-[40px] text-center p-2 pl-4">
                <Checkbox
                  checked={selectedIds.length === data.length && data.length > 0}
                  onCheckedChange={toggleSelectAll}
                />
              </TableHead>
              <TableHead className="w-[160px] font-black text-[#1f1f1f] text-[10px] uppercase p-2 whitespace-nowrap">
                Mã phiếu / Ngày
              </TableHead>
              <TableHead className="w-[100px] font-black text-[#1f1f1f] text-[10px] uppercase p-2 whitespace-nowrap">
                Mức độ
              </TableHead>
              <TableHead className="w-[280px] font-black text-[#1f1f1f] text-[10px] uppercase p-2 whitespace-nowrap">
                Lộ trình (Gửi → Nhận)
              </TableHead>
              <TableHead className="w-[200px] font-black text-[#1f1f1f] text-[10px] uppercase p-2 whitespace-nowrap">
                Người giao / Tài xế
              </TableHead>
              <TableHead className="w-[130px] text-right font-black text-[#1f1f1f] text-[10px] uppercase p-2 whitespace-nowrap">
                Số lượng SP
              </TableHead>
              <TableHead className="w-[140px] text-right font-black text-[#1f1f1f] text-[10px] uppercase p-2 whitespace-nowrap">
                Giá trị hàng
              </TableHead>
              <TableHead className="w-[130px] font-black text-[#1f1f1f] text-[10px] uppercase p-2 text-center whitespace-nowrap">
                Trạng thái
              </TableHead>
              <TableHead className="w-[120px] text-right font-black text-[#1f1f1f] text-[10px] uppercase p-2 pr-4 whitespace-nowrap">
                Hành động
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((item) => {
              const canDelete = item.status === "PENDING" || item.status === "DRAFT";

              return (
                <TableRow
                  key={item.id}
                  onClick={() => handleViewDetail(item.id)}
                  className={cn(
                    "hover:bg-blue-50/20 border-b border-[#eee] transition-colors cursor-pointer group",
                    selectedIds.includes(item.id) && "bg-blue-50",
                  )}
                >
                  <TableCell className="p-2 pl-4 text-center">
                    <Checkbox
                      checked={selectedIds.includes(item.id)}
                      onCheckedChange={() => toggleSelect(item.id)}
                      onClick={(e) => e.stopPropagation()}
                    />
                  </TableCell>

                  <TableCell className="p-2 whitespace-nowrap">
                    <div className="flex flex-col">
                      <span className="text-[#1f1f1f] font-black text-[13px] tracking-tighter uppercase">
                        {item.transferCode || item.code}
                      </span>
                      <span className="text-slate-400 text-[10px] font-bold">
                        {item.date || new Date(item.createdAt).toLocaleDateString('vi-VN')}
                      </span>
                    </div>
                  </TableCell>

                  <TableCell className="p-2 whitespace-nowrap">
                    <div className="flex items-center gap-1.5">
                      <div
                        className={cn(
                          "w-1.5 h-1.5 rounded-full",
                          item.priority === "HIGH"
                            ? "bg-rose-600 animate-pulse"
                            : item.priority === "NORMAL"
                              ? "bg-amber-500"
                              : "bg-slate-300",
                        )}
                      />
                      <span className="text-[10px] font-black uppercase tracking-tighter text-slate-600">
                        {item.priority === "HIGH" ? "Khẩn" : item.priority === "NORMAL" ? "Bình thường" : "Thấp"}
                      </span>
                    </div>
                  </TableCell>

                  <TableCell className="p-2 whitespace-nowrap">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[11px] font-bold text-slate-500 uppercase">
                          {item.fromBranchName || item.fromWarehouse}
                        </span>
                        <ArrowRight size={10} className="text-slate-300" />
                        <span className="text-[11px] font-black text-slate-800 uppercase tracking-tighter">
                          {item.toBranchName || item.toWarehouse}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 text-[10px] font-black text-slate-400">
                        <Clock size={10} /> {item.age || 'Vừa xong'}
                      </div>
                    </div>
                  </TableCell>

                  <TableCell className="p-2 whitespace-nowrap">
                    <div className="flex items-center gap-1.5">
                      <Truck size={12} className="text-slate-300 shrink-0" />
                      <span className="text-[11px] font-bold text-slate-600 leading-tight truncate">
                        {item.transporter || 'Chưa cập nhật'}
                      </span>
                    </div>
                  </TableCell>

                  <TableCell className="p-2 text-right whitespace-nowrap">
                    <div className="flex flex-col items-end">
                      <span className="text-[13px] font-black text-slate-800 tracking-tighter">
                        {item.totalQuantity || item.totalQty} SP
                      </span>
                      <span className="text-[10px] font-bold text-slate-400 uppercase">
                        ({item.itemCount} mặt hàng)
                      </span>
                    </div>
                  </TableCell>

                  <TableCell className="p-2 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-1">
                      <span className="text-[12px] font-black text-slate-700">
                        {formatNumber(item.totalValue)}
                      </span>
                      {item.totalValue > 10000000 && (
                        <Tooltip>
                          <TooltipTrigger>
                            <DollarSign size={14} className="text-emerald-600" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="text-[10px] font-bold">Hàng giá trị cao</p>
                          </TooltipContent>
                        </Tooltip>
                      )}
                    </div>
                  </TableCell>

                  <TableCell className="p-2 text-center whitespace-nowrap">
                    <span
                      className={cn(
                        "text-[9px] font-black px-2 py-0.5 rounded border tracking-widest uppercase",
                        getStatusStyle(item.status),
                      )}
                    >
                      {getStatusLabel(item.status)}
                    </span>
                  </TableCell>

                  <TableCell
                    className="p-2 text-right pr-4 whitespace-nowrap"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="flex justify-end gap-1 opacity-40 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 hover:bg-slate-100"
                        onClick={() => handleViewDetail(item.id)}
                      >
                        <Eye size={14} className="text-slate-600" />
                      </Button>

                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 hover:bg-blue-50"
                      >
                        <Copy size={14} className="text-blue-600" />
                      </Button>

                      <Button
                        variant="ghost"
                        size="icon"
                        className={cn(
                          "h-7 w-7 hover:bg-rose-50",
                          !canDelete && "opacity-20 cursor-not-allowed hover:bg-transparent",
                        )}
                        disabled={!canDelete}
                        onClick={(e) => {
                          e.stopPropagation();
                          onDelete(item.id);
                        }}
                      >
                        <Trash2 size={14} className="text-rose-600" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>

        <div className="flex items-center justify-between px-3 py-2 border-t border-[#eee] bg-[#f8f9fa]">
          <p className="text-[11px] text-slate-400 font-black uppercase tracking-widest">
            Tổng số: {data.length} bản ghi
          </p>
          <div className="flex items-center gap-1">
            <Button variant="outline" size="sm" className="h-6 px-2 text-[10px] font-black border-slate-300 rounded-none uppercase">Trước</Button>
            <Button variant="outline" size="sm" className="h-6 w-6 p-0 text-[10px] font-black bg-blue-600 text-white border-blue-600 rounded-none">1</Button>
            <Button variant="outline" size="sm" className="h-6 px-2 text-[10px] font-black border-slate-300 rounded-none uppercase">Sau</Button>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}