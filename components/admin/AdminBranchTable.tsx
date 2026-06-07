"use client";

import React from "react";
import {
  Pencil,
  Trash2,
  Phone,
  Mail,
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
import { useRouter } from "next/navigation";

import { usePermissions } from "@/hooks/usePermissions";
import { P } from "@/lib/permissions";

interface Branch {
  id: number;
  branchCode: string;
  name: string;
  branchType: string;
  phone: string;
  email: string;
  addressDetail: string;
  province?: string;
  district?: string;
  ward?: string;
  status: string;
  managerNames: string[];
  managerIds: number[];
  managerAvatarUrls?: (string | null)[];
}

interface AdminBranchTableProps {
  branches: Branch[];
  onDeleteClick: (id: number, name: string) => void;
}

export function AdminBranchTable({ branches, onDeleteClick }: AdminBranchTableProps) {
  const router = useRouter();
  const { hasPermission } = usePermissions();
  const canAction = hasPermission(P.BRANCH_UPDATE) || hasPermission(P.BRANCH_DELETE);
  const sortedBranches = React.useMemo(
    () =>
      [...branches].sort((a, b) => {
        const aIsWarehouse = a.branchType === "WAREHOUSE";
        const bIsWarehouse = b.branchType === "WAREHOUSE";

        if (aIsWarehouse !== bIsWarehouse) {
          return aIsWarehouse ? -1 : 1;
        }

        return a.name.localeCompare(b.name, "vi-VN");
      }),
    [branches]
  );

  const formatBranchName = (value?: string) => {
    const source = (value || "").trim();
    if (!source) return "Chưa có tên";

    return source
      .toLocaleLowerCase("vi-VN")
      .split(/\s+/)
      .map((part) => part.charAt(0).toLocaleUpperCase("vi-VN") + part.slice(1))
      .join(" ");
  };

  const formatBranchAddress = (branch: Branch) => {
    return [
      branch.addressDetail,
      branch.ward,
      branch.district,
      branch.province,
    ]
      .filter(Boolean)
      .join(", ");
  };

  return (
    <div className="w-full">
      <Table className="table-custom border-collapse min-w-[1120px]">
        <TableHeader>
          <TableRow className="bg-[#f0f0f0] border-b border-[#ccc] hover:bg-[#f0f0f0]">
            <TableHead className="w-[70px] font-semibold text-[12px] p-2 pl-6 text-[#1f1f1f]">STT</TableHead>
            <TableHead className="w-[100px] font-semibold text-[12px] p-2 pl-6 text-[#1f1f1f]">Mã CN</TableHead>
            <TableHead className="w-[420px] font-semibold text-[12px] p-2 text-[#1f1f1f]">Thông tin chi nhánh</TableHead>
            <TableHead className="w-[320px] font-semibold text-[12px] p-2 text-[#1f1f1f]">Quản lý</TableHead>
            <TableHead className="w-[130px] font-semibold text-[12px] p-2 text-center text-[#1f1f1f]">Trạng thái</TableHead>
            {canAction && (
              <TableHead className="w-[100px] text-right font-semibold text-[12px] p-2 pr-6 text-[#1f1f1f]">Thao tác</TableHead>
            )}
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedBranches.map((branch, index) => {
            const isWarehouse = branch.branchType === "WAREHOUSE";
            const isActive = branch.status === "ACTIVE";

            return (
              <TableRow
                key={branch.id}
                className={cn(
                  "h-[108px] hover:bg-[#f0f8ff] border-b border-[#eee] transition-colors cursor-pointer",
                  isWarehouse && "bg-amber-50/40"
                )}
              >
                <TableCell className="h-[108px] p-2 pl-6 align-middle text-[12px] font-semibold text-slate-600">
                  {index + 1}
                </TableCell>
                <TableCell className="h-[108px] p-2 pl-6 align-middle text-[12px] font-semibold text-slate-600">#{branch.branchCode}</TableCell>

                <TableCell className="h-[108px] p-2 align-middle">
                  <div className="flex items-center gap-3">
                    <div className="flex min-h-[76px] flex-col justify-center gap-1.5">
                      <span className="text-[13px] font-medium text-slate-800 tracking-tight line-clamp-1">
                        {formatBranchName(branch.name)}
                      </span>
                      <span className="max-w-[280px] line-clamp-2 text-[11px] font-normal leading-5 text-slate-500">
                      {formatBranchAddress(branch)}
                      </span>
                    </div>
                  </div>
                </TableCell>

                <TableCell className="h-[108px] p-2 align-middle">
                  <div className="flex min-h-[76px] flex-col justify-center gap-1.5">
                    <span className="text-[12px] font-semibold text-slate-700 capitalize line-clamp-1">
                      {branch.managerNames?.[0] || "Chưa có"}
                    </span>
                    <div className="flex items-center gap-1.5 text-[11px] font-normal text-slate-600 whitespace-nowrap">
                      <Phone size={10} className="text-slate-400" /> {branch.phone}
                    </div>
                    <div className="flex items-center gap-1.5 text-[10px] font-normal text-slate-400 truncate">
                      <Mail size={10} className="text-slate-400" /> {branch.email}
                    </div>
                  </div>
                </TableCell>

                <TableCell className="h-[108px] p-2 align-middle text-center">
                  <span className={cn(
                    "text-[11px] font-medium tracking-tight capitalize whitespace-nowrap",
                    isActive ? "text-emerald-600" : "text-rose-600"
                  )}>
                    {isActive ? "Đang hoạt động" : "Ngừng hoạt động"}
                  </span>
                </TableCell>

                {canAction && (
                  <TableCell className="h-[108px] p-2 align-middle text-right pr-6">
                    <div className="flex justify-end gap-1">
                      {hasPermission(P.BRANCH_UPDATE) && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 hover:bg-slate-100"
                          onClick={() => router.push(`/admin/branches/add?id=${branch.id}`)}
                        >
                          <Pencil size={14} className="text-blue-600" />
                        </Button>
                      )}
                      
                      {hasPermission(P.BRANCH_DELETE) && (
                        isWarehouse ? (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 opacity-20 cursor-not-allowed"
                            disabled
                            title="Không thể xóa kho tổng"
                          >
                            <Trash2 size={14} className="text-slate-400" />
                          </Button>
                        ) : (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 hover:bg-rose-50"
                            onClick={() => onDeleteClick(branch.id, branch.name)}
                          >
                            <Trash2 size={14} className="text-rose-600" />
                          </Button>
                        )
                      )}
                    </div>
                  </TableCell>
                )}
              </TableRow>
            );
          })}
        </TableBody>
      </Table>

      {/* Footer Pagination */}
      <div className="flex items-center justify-between px-3 py-2 border-t border-[#eee] bg-[#f8f9fa]">
        <p className="text-[11px] text-gray-400 font-bold tracking-wide">
          Tổng số {branches.length} chi nhánh & kho hàng
        </p>
        <div className="flex items-center gap-1">
          <Button variant="outline" size="sm" className="h-6 px-2 text-[10px] font-bold bg-white border-[#ddd]">
            Trước
          </Button>
          <Button variant="outline" size="sm" className="h-6 w-6 p-0 text-[10px] bg-emerald-600 text-white border-emerald-600 font-bold">
            1
          </Button>
          <Button variant="outline" size="sm" className="h-6 px-2 text-[10px] font-bold bg-white border-[#ddd]">
            Sau
          </Button>
        </div>
      </div>
    </div>
  );
}
