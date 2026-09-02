"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { AlertCircle, Check, Eye, Pencil, Trash2 } from "lucide-react";
import {
  cn,
  formatDateTimeVN,
  formatNumber,
  repairVietnameseText,
  resolveExportPartnerName,
} from "@/lib/utils";
import { toast } from "sonner";
import { InventoryExportApiService } from "@/app/services/inventory.service";
import { getErrorMessage } from "@/lib/axios";
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
  pageSize: number;
  onPageChange: (page: number) => void;
}

export function InventoryExportTable({ 
  exports, 
  onRefresh,
  totalCount,
  currentPage,
  totalPages,
  pageSize,
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
  const canUpdate = hasPermission(P.EXPORT_UPDATE);
  const canComplete = canApprove || canUpdate;
  const canDelete = hasPermission(P.EXPORT_DELETE);

  const formatDate = (dateString: string) => {
    return formatDateTimeVN(dateString);
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
          toast.error(getErrorMessage(error) || "Lỗi khi duyệt lệnh");
        } finally { setIsProcessing(false); }
      }
    );
  };

  const handleComplete = async (id: number, code: string) => {
    showConfirm(
      "Xác nhận xuất kho",
      `Hệ thống sẽ trừ tồn kho thực tế cho lệnh ${code}. Bạn đã kiểm tra kỹ hàng hóa chưa?`,
      async () => {
        setIsProcessing(true);
        try {
          await InventoryExportApiService.completeExportCommand(id);
          toast.success(`Đã xuất kho phiếu ${code}!`);
          if (onRefresh) await onRefresh();
        } catch (error: any) {
          toast.error(getErrorMessage(error) || "Lỗi khi chốt xuất kho");
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
        return "text-amber-600";
      case "APPROVED":
        return "text-blue-600";
      case "COMPLETED":
        return "text-blue-600";
      case "CANCELLED":
      case "REJECTED":
        return "text-slate-500";
      default:
        return "text-slate-500";
    }
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="flex-1 overflow-x-auto overflow-y-hidden relative custom-scrollbar">
        <Table className="table-custom w-full table-auto border-collapse">
          <TableHeader className="sticky top-0 z-20">
            <TableRow className="border-b border-[#ccc] bg-[#f0f0f0] hover:bg-[#f0f0f0]">
              <TableHead className="w-[44px] px-1.5 py-2 pl-4 text-[10px] font-semibold text-[#1f1f1f] whitespace-nowrap">STT</TableHead>
              <TableHead className="w-[130px] px-1.5 py-2 text-[10px] font-semibold text-[#1f1f1f] whitespace-nowrap">Mã lệnh</TableHead>
              <TableHead className="w-[150px] px-1.5 py-2 text-[10px] font-semibold text-[#1f1f1f] whitespace-nowrap">Thời gian</TableHead>
              <TableHead className="w-[100px] px-1.5 py-2 text-[10px] font-semibold text-[#1f1f1f] whitespace-nowrap">Người tạo</TableHead>
              <TableHead className="min-w-[280px] px-1.5 py-2 text-[10px] font-semibold text-[#1f1f1f] whitespace-nowrap">Đối tác nhận</TableHead>
              <TableHead className="w-[180px] px-1.5 py-2 text-[10px] font-semibold text-[#1f1f1f] whitespace-nowrap">Kho xuất</TableHead>
              <TableHead className="w-[120px] px-1.5 py-2 text-right text-[10px] font-semibold text-[#1f1f1f] whitespace-nowrap">Tổng giá trị</TableHead>
              <TableHead className="w-[100px] px-1.5 py-2 text-center text-[10px] font-semibold text-[#1f1f1f] whitespace-nowrap">Trạng thái</TableHead>
              <TableHead className="w-[80px] px-1.5 py-2 pr-4 text-right text-[10px] font-semibold text-[#1f1f1f] whitespace-nowrap">Thao tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {exports.map((item: any, index: number) => {
              const status = (item.status || "").toUpperCase();
              const displayPartner = resolveExportPartnerName(item);

              return (
                <TableRow key={item.id} className="group cursor-pointer border-b border-[#eee] transition-colors hover:bg-[#f0f8ff]">
                  <TableCell className="px-1.5 py-2 pl-4 text-[11px] font-medium text-slate-500 transition-colors group-hover:text-blue-500">
                    {(currentPage - 1) * pageSize + index + 1}
                  </TableCell>
                  <TableCell className="px-1.5 py-2">
                    <span className="flex items-center gap-1.5 whitespace-nowrap text-[11px] font-semibold tracking-tight text-slate-700">
                      {item.code}
                    </span>
                  </TableCell>

                  <TableCell className="px-1.5 py-2">
                    <span className="flex items-center gap-1.5 whitespace-nowrap text-[11px] font-medium text-slate-500">
                      {formatDate(item.createdAt)}
                    </span>
                  </TableCell>

                  <TableCell className="px-1.5 py-2">
                    <span className="flex items-center gap-1.5 whitespace-nowrap text-[11px] font-medium text-slate-500">
                      {repairVietnameseText(item.creatorName || "Hệ thống")}
                    </span>
                  </TableCell>

                  <TableCell className="px-1.5 py-2">
                    <span className={cn(
                      "block max-w-[420px] truncate text-[11px] font-semibold leading-tight text-slate-600"
                    )} title={displayPartner}>
                      {displayPartner}
                    </span>
                  </TableCell>

                  <TableCell className="px-1.5 py-2">
                    <div className="flex items-center gap-1.5 whitespace-nowrap text-[11px] font-medium text-slate-500">
                      {repairVietnameseText(item.branchName || "N/A")}
                    </div>
                  </TableCell>

                  <TableCell className="px-1.5 py-2 text-right text-[11px] font-semibold text-slate-700 whitespace-nowrap">{formatNumber(item.totalAmount || 0)}</TableCell>

                  <TableCell className="px-1.5 py-2 text-center">
                    <span className={cn("whitespace-nowrap text-[11px] font-medium", getStatusStyle(status))}>
                      {status === "PENDING" ? "Chờ duyệt" : status === "APPROVED" ? "Đã duyệt" : status === "COMPLETED" ? "Đã xuất kho" : "Đã hủy"}
                    </span>
                  </TableCell>

                  <TableCell className="px-1.5 py-2 pr-4 text-right">
                    <div className="flex justify-end gap-1 opacity-40 group-hover:opacity-100 transition-opacity">
                      {status === "PENDING" && canUpdate && (
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-400 hover:text-blue-600" title="Chỉnh sửa" onClick={(e) => { e.stopPropagation(); router.push(`/admin/exports/new-command?id=${item.id}`); }}>
                          <Pencil size={13} />
                        </Button>
                      )}
                      
                      {status === "PENDING" && canApprove && (
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-blue-500 hover:text-blue-600" title="Duyệt lệnh" disabled={isProcessing} onClick={(e) => { e.stopPropagation(); handleApprove(item.id, item.code); }}>
                          <Check size={14} />
                        </Button>
                      )}

                      {status === "APPROVED" && canComplete && (
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-blue-500 hover:text-blue-600" title="Xuất kho" disabled={isProcessing} onClick={(e) => { e.stopPropagation(); handleComplete(item.id, item.code); }}>
                          <Check size={14} />
                        </Button>
                      )}

                      {status === "PENDING" && canDelete && (
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-400 hover:text-rose-600" title="Xóa" disabled={isProcessing} onClick={(e) => { e.stopPropagation(); handleDelete(item.id, item.code); }}>
                          <Trash2 size={13} />
                        </Button>
                      )}

                      {status !== "PENDING" && (
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-400 hover:text-blue-600" title="Xem chi tiết" onClick={(e) => { e.stopPropagation(); router.push(`/admin/exports/new-command?id=${item.id}`); }}>
                          <Eye size={14} />
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
      <div className="flex min-w-full shrink-0 items-center justify-between border-t border-slate-100 bg-[#f8f9fa] px-5 py-3">
        <div className="flex items-center gap-8 whitespace-nowrap">
          <p className="text-[12px] font-semibold text-slate-500">Hiển thị {exports.length} / {totalCount} bản ghi</p>
          <div className="flex items-center gap-6">
            <p className="text-[12px] font-semibold text-slate-500">Tổng giá trị: <span className="ml-1 text-slate-700">{formatNumber(totalAmount)} ₫</span></p>
          </div>
        </div>
        <div className="flex items-center gap-1 ml-4">
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-7 px-3 text-[11px] font-bold text-slate-400 uppercase hover:text-slate-600 disabled:opacity-30"
            disabled={currentPage === 1}
            onClick={() => onPageChange(currentPage - 1)}
          >
            Trước
          </Button>
          <div className="flex h-7 min-w-[28px] w-auto items-center justify-center rounded-full bg-slate-100 px-3 text-[11px] font-black text-slate-600">
            {currentPage} / {totalPages || 1}
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-7 px-3 text-[11px] font-bold text-slate-400 uppercase hover:text-slate-600 disabled:opacity-30"
            disabled={currentPage === totalPages || totalPages === 0}
            onClick={() => onPageChange(currentPage + 1)}
          >
            Sau
          </Button>
        </div>
      </div>

      {/* AlertDialog dành cho các xác nhận quan trọng */}
      <AlertDialog open={confirmConfig.open} onOpenChange={(o) => setConfirmConfig({ ...confirmConfig, open: o })}>
        <AlertDialogContent className="max-w-[420px] rounded-[6px] border border-slate-200 bg-white shadow-xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-[16px] font-bold uppercase tracking-tight text-slate-800">
              <AlertCircle className={cn("w-5 h-5", confirmConfig.variant === "destructive" ? "text-rose-500" : "text-blue-500")} />
              {confirmConfig.title}
            </AlertDialogTitle>
            <AlertDialogDescription className="pt-2 text-[13px] leading-relaxed text-slate-500">
              {confirmConfig.description}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="pt-4 gap-3">
            <AlertDialogCancel className="h-[32px] rounded-[3px] border-slate-300 text-[12px] font-bold">
              Quay lại
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmConfig.action}
              className={cn(
                "h-[32px] rounded-[3px] px-6 text-[12px] font-bold text-white",
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

