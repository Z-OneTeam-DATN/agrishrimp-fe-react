"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2, CheckCircle, FileText, Calendar, Warehouse, ArrowRight, User, AlertCircle } from "lucide-react";
import { cn, formatNumber } from "@/lib/utils";
import { toast } from "sonner";
import { InventoryExportApiService } from "@/app/services/inventory.service";
import { usePermissions } from "@/hooks/usePermissions";
import { P } from "@/lib/permissions";
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

interface InventoryExportTableProps {
  exports: any[];
  onRefresh?: () => Promise<void>;
  totalCount: number;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export function InventoryExportTable({ 
  exports, 
  onRefresh,
  totalCount,
  currentPage,
  totalPages,
  onPageChange
}: InventoryExportTableProps) {
  const router = useRouter();
  const { hasPermission } = usePermissions();
  const [isProcessing, setIsProcessing] = useState(false);

  // AlertDialog State
  const [confirmConfig, setConfirmConfig] = useState<{
    open: boolean;
    title: string;
    description: string;
    action: () => void;
    variant?: "default" | "destructive";
  }>({
    open: false,
    title: "",
    description: "",
    action: () => {},
  });

  const showConfirm = (title: string, description: string, action: () => void, variant: "default" | "destructive" = "default") => {
    setConfirmConfig({ open: true, title, description, action, variant });
  };

  const canApprove = hasPermission(P.EXPORT_APPROVE);

  const formatDate = (dateString: string) => {
    if (!dateString) return "---";
    const date = new Date(dateString);
    return date.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
  };

  const handleApprove = async (id: number, code: string) => {
    showConfirm(
      "Xác nhận DUYỆT lệnh",
      `Bạn có chắc chắn muốn duyệt lệnh xuất ${code}? Sau khi duyệt, nhân viên kho có thể thực hiện xuất hàng.`,
      async () => {
        setIsProcessing(true);
        try {
          await InventoryExportApiService.approveExportCommand(id);
          toast.success(`Đã duyệt lệnh ${code} thành công!`);
          if (onRefresh) await onRefresh();
        } catch (error: any) {
          toast.error(error.response?.data?.message || "Lỗi khi duyệt lệnh");
        } finally { setIsProcessing(false); }
      }
    );
  };

  const handleComplete = async (id: number, code: string) => {
    showConfirm(
      "Xác nhận HOÀN TẤT xuất kho",
      `Hệ thống sẽ trừ tồn kho thực tế cho lệnh ${code}. Bạn đã kiểm tra kỹ hàng hóa chưa?`,
      async () => {
        setIsProcessing(true);
        try {
          await InventoryExportApiService.completeExportCommand(id);
          toast.success(`Đã hoàn tất xuất kho phiếu ${code}!`);
          if (onRefresh) await onRefresh();
        } catch (error: any) {
          toast.error(error.response?.data?.message || "Lỗi khi chốt xuất kho");
        } finally { setIsProcessing(false); }
      }
    );
  };

  const handleDelete = async (id: number, code: string) => {
    showConfirm(
      "Xác nhận XÓA lệnh",
      `Bạn có chắc chắn muốn XÓA lệnh ${code}? Hành động này không thể hoàn tác.`,
      async () => {
        setIsProcessing(true);
        try {
          await InventoryExportApiService.deleteExportCommand(id);
          toast.success("Đã xóa lệnh xuất thành công");
          if (onRefresh) await onRefresh();
        } catch (error: any) {
          toast.error("Không thể xóa lệnh này");
        } finally { setIsProcessing(false); }
      },
      "destructive"
    );
  };

  const totalAmount = exports.reduce((acc, item) => acc + (item.totalAmount || 0), 0);

  const getStatusStyle = (status: string) => {
    switch (status) {
      case "PENDING":
        return "text-amber-500 bg-white border-amber-200";
      case "APPROVED":
        return "text-blue-500 bg-white border-blue-200";
      case "COMPLETED":
        return "text-emerald-600 bg-white border-emerald-200";
      case "CANCELLED":
      case "REJECTED":
        return "text-slate-400 bg-white border-slate-200";
      default:
        return "text-slate-500 bg-white border-slate-100";
    }
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="flex-1 overflow-x-auto overflow-y-hidden relative custom-scrollbar">
        <Table className="table-custom border-collapse min-w-[1400px] w-full">
          <TableHeader className="sticky top-0 z-20 bg-white shadow-sm">
            <TableRow className="bg-white border-b border-slate-100 hover:bg-white">
              <TableHead className="w-[60px] font-bold text-[10px] uppercase p-3 pl-5 text-slate-400">ID</TableHead>
              <TableHead className="w-[140px] font-bold text-[10px] uppercase p-3 text-slate-400">Mã lệnh</TableHead>
              <TableHead className="w-[160px] font-bold text-[10px] uppercase p-3 text-slate-400">Thời gian</TableHead>
              <TableHead className="w-[160px] font-bold text-[10px] uppercase p-3 text-slate-400">Người tạo</TableHead>
              <TableHead className="min-w-[250px] font-bold text-[10px] uppercase p-3 text-slate-400">Đối tác nhận</TableHead>
              <TableHead className="w-[180px] font-bold text-[10px] uppercase p-3 text-slate-400">Kho xuất</TableHead>
              <TableHead className="w-[130px] text-right font-bold text-[10px] uppercase p-3 text-slate-400">Tổng giá trị</TableHead>
              <TableHead className="w-[130px] font-bold text-[10px] uppercase p-3 text-center text-slate-400">Trạng thái</TableHead>
              <TableHead className="w-[120px] text-right font-bold text-[10px] uppercase p-3 pr-5 text-slate-400">Thao tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {exports.map((item: any) => {
              const status = (item.status || "").toUpperCase();
              const isInternal = item.exportType === "INTERNAL";
              let displayPartner = item.displayPartnerName || item.supplierName || item.partnerBranchName || "N/A";

              return (
                <TableRow key={item.id} className="hover:bg-slate-50/50 border-b border-slate-50 transition-colors cursor-pointer group h-[64px]">
                  <TableCell className="p-3 pl-5 text-[11px] font-bold text-slate-300 uppercase">#{item.id || "0"}</TableCell>

                  <TableCell className="p-3">
                    <span className="text-[12px] font-bold text-slate-700 uppercase tracking-tight flex items-center gap-1.5 whitespace-nowrap">
                      <FileText size={13} className="text-slate-300 group-hover:text-blue-500 transition-colors" />
                      {item.code}
                    </span>
                  </TableCell>

                  <TableCell className="p-3">
                    <span className="text-[11px] text-slate-500 font-medium flex items-center gap-1.5 whitespace-nowrap uppercase">
                      {formatDate(item.createdAt)}
                    </span>
                  </TableCell>

                  <TableCell className="p-3">
                    <span className="text-[11px] text-slate-500 font-medium flex items-center gap-1.5 uppercase whitespace-nowrap">
                      {item.creatorName || "Hệ thống"}
                    </span>
                  </TableCell>

                  <TableCell className="p-3">
                    <span className={cn(
                      "text-[12px] font-bold leading-tight flex items-center gap-1 truncate max-w-[300px]",
                      isInternal ? "text-blue-500" : "text-slate-600"
                    )} title={displayPartner}>
                      {isInternal ? <ArrowRight size={12} className="text-blue-400"/> : <User size={12} className="text-slate-300"/>}
                      {displayPartner}
                    </span>
                  </TableCell>

                  <TableCell className="p-3">
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-bold uppercase whitespace-nowrap">
                      <Warehouse size={12} className="text-slate-300" /> {item.branchName || "N/A"}
                    </div>
                  </TableCell>

                  <TableCell className="p-3 text-right text-[12px] font-bold text-slate-700 whitespace-nowrap">{formatNumber(item.totalAmount || 0)}</TableCell>

                  <TableCell className="p-3 text-center">
                    <span className={cn("text-[9px] font-black px-2 py-0.5 rounded-full border tracking-tight uppercase whitespace-nowrap", getStatusStyle(status))}>
                      {status === "PENDING" ? "Chờ duyệt" : status === "APPROVED" ? "Đã duyệt" : status === "COMPLETED" ? "Đã xuất" : "Đã hủy"}
                    </span>
                  </TableCell>

                  <TableCell className="p-3 text-right pr-5">
                    <div className="flex justify-end gap-1 opacity-40 group-hover:opacity-100 transition-opacity">
                      {status === "PENDING" && (
                        <Button variant="ghost" size="icon" className="h-7 w-7" title="Chỉnh sửa" onClick={(e) => { e.stopPropagation(); router.push(`/admin/exports/new-command?id=${item.id}`); }}>
                          <Pencil size={13} className="text-slate-400 hover:text-blue-600" />
                        </Button>
                      )}
                      
                      {status === "PENDING" && canApprove && (
                        <Button variant="ghost" size="icon" className="h-7 w-7" title="Duyệt lệnh" onClick={(e) => { e.stopPropagation(); handleApprove(item.id, item.code); }}>
                          <CheckCircle size={13} className="text-blue-500" />
                        </Button>
                      )}

                      {status === "APPROVED" && (
                        <Button variant="ghost" size="icon" className="h-7 w-7" title="Hoàn tất" onClick={(e) => { e.stopPropagation(); handleComplete(item.id, item.code); }}>
                          <CheckCircle size={13} className="text-emerald-500" />
                        </Button>
                      )}

                      {status === "PENDING" && (
                        <Button variant="ghost" size="icon" className="h-7 w-7" title="Xóa" onClick={(e) => { e.stopPropagation(); handleDelete(item.id, item.code); }}>
                          <Trash2 size={13} className="text-slate-400 hover:text-rose-600" />
                        </Button>
                      )}

                      {status !== "PENDING" && (
                        <Button variant="ghost" size="icon" className="h-7 w-7" title="Xem chi tiết" onClick={(e) => { e.stopPropagation(); router.push(`/admin/exports/new-command?id=${item.id}`); }}>
                          <FileText size={13} className="text-slate-400 hover:text-blue-600" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Footer thanh tổng cộng */}
      <div className="flex items-center justify-between px-5 py-3 border-t border-slate-100 bg-white min-w-full shrink-0">
        <div className="flex items-center gap-8 whitespace-nowrap">
          <p className="text-[10px] text-slate-300 font-bold uppercase tracking-widest">Hiển thị {exports.length} / {totalCount} bản ghi</p>
          <div className="flex items-center gap-6">
            <p className="text-[11px] font-bold text-slate-400 uppercase">Tổng giá trị: <span className="text-slate-700 ml-1">{formatNumber(totalAmount)} ₫</span></p>
          </div>
        </div>
        <div className="flex items-center gap-1 ml-4">
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-7 px-3 text-[10px] font-bold text-slate-400 uppercase hover:text-slate-600 disabled:opacity-30"
            disabled={currentPage === 1}
            onClick={() => onPageChange(currentPage - 1)}
          >
            Trước
          </Button>
          <div className="flex items-center justify-center h-7 w-auto px-3 text-[10px] font-black bg-slate-100 text-slate-600 rounded-full min-w-[28px]">
            {currentPage} / {totalPages || 1}
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-7 px-3 text-[10px] font-bold text-slate-400 uppercase hover:text-slate-600 disabled:opacity-30"
            disabled={currentPage === totalPages || totalPages === 0}
            onClick={() => onPageChange(currentPage + 1)}
          >
            Sau
          </Button>
        </div>
      </div>

      {/* AlertDialog dành cho các xác nhận quan trọng */}
      <AlertDialog open={confirmConfig.open} onOpenChange={(o) => setConfirmConfig({ ...confirmConfig, open: o })}>
        <AlertDialogContent className="rounded-none border-2 border-slate-200 shadow-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-[16px] font-black uppercase text-slate-800 flex items-center gap-2">
              <AlertCircle className={cn("w-5 h-5", confirmConfig.variant === "destructive" ? "text-rose-500" : "text-blue-500")} />
              {confirmConfig.title}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-[13px] font-medium text-slate-500 leading-relaxed pt-2">
              {confirmConfig.description}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="pt-4 gap-3">
            <AlertDialogCancel className="rounded-none border-slate-300 text-slate-500 font-bold uppercase text-[11px] h-9 px-6 hover:bg-slate-50">Quay lại</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmConfig.action}
              className={cn(
                "rounded-none font-black uppercase text-[11px] h-9 px-8 shadow-lg transition-all",
                confirmConfig.variant === "destructive" ? "bg-rose-600 hover:bg-rose-700" : "bg-blue-600 hover:bg-blue-700"
              )}
            >
              Xác nhận
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
