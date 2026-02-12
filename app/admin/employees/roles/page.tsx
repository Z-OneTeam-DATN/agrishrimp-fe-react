"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { Plus, ChevronLeft, ChevronRight, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue 
} from "@/components/ui/select";
import { AdminSearchFilter } from "@/components/admin/shared/AdminSearchFilter";

const rolesData = [
  { id: 1, name: "Nhân viên kho", activeCount: 0, inactiveCount: 0, createdAt: "05/02/2026", updatedAt: "05/02/2026", note: "" },
  { id: 2, name: "Nhân viên bán hàng", activeCount: 0, inactiveCount: 0, createdAt: "05/02/2026", updatedAt: "05/02/2026", note: "" },
  { id: 3, name: "Quản lý chi nhánh", activeCount: 0, inactiveCount: 0, createdAt: "05/02/2026", updatedAt: "05/02/2026", note: "" },
];

export default function RolesManagementPage() {
  const router = useRouter();

  return (
    <div className="space-y-4 min-h-screen bg-[#f0f2f5]">
      {/* Header Bar */}
      <div className="bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => router.push("/admin/employees")} className="h-8 w-8 text-slate-400 hover:text-emerald-600 transition-colors">
            <ChevronLeft size={20} />
          </Button>
          <h1 className="text-[18px] font-black text-slate-800 uppercase tracking-tight">Danh sách vai trò hệ thống</h1>
        </div>
        <Button 
          onClick={() => router.push("/admin/employees/roles/add")}
          className="h-[34px] bg-blue-600 hover:bg-blue-700 text-white rounded-none px-6 text-[12px] font-black uppercase shadow-md"
        >
          <Plus size={16} className="mr-1.5" /> Thêm vai trò
        </Button>
      </div>

      <div className="p-4">
        <div className="bg-white border border-[#dcdcdc] rounded-none shadow-sm overflow-hidden">
          {/* Tabs */}
          <div className="px-6 border-b border-slate-100 flex items-center h-12">
            <div className="h-full border-b-2 border-blue-600 flex items-center px-4">
              <span className="text-blue-600 text-[12px] font-black uppercase tracking-wider">Tất cả vai trò</span>
            </div>
          </div>

          <AdminSearchFilter 
            placeholder="Tìm kiếm tên vai trò quản trị..." 
            onRefresh={() => console.log("Refreshing roles...")}
          />

          {/* Table Container */}
          <div className="overflow-x-auto">
            <Table className="table-custom border-collapse">
              <TableHeader>
                <TableRow className="bg-[#f8f9fa] border-b border-[#eee]">
                  <TableHead className="text-[11px] font-black text-slate-800 p-4 pl-6 text-left uppercase">Vai trò</TableHead>
                  <TableHead className="text-[11px] font-black text-slate-800 p-4 text-center uppercase">Nhân viên Đang làm việc</TableHead>
                  <TableHead className="text-[11px] font-black text-slate-800 p-4 text-center uppercase">Nhân viên Đã nghỉ việc</TableHead>
                  <TableHead className="text-[11px] font-black text-slate-800 p-4 text-center uppercase">Ngày tạo</TableHead>
                  <TableHead className="text-[11px] font-black text-slate-800 p-4 text-center uppercase">Ngày cập nhật cuối</TableHead>
                  <TableHead className="text-[11px] font-black text-slate-800 p-4 text-left uppercase">Ghi chú</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rolesData.map((role) => (
                  <TableRow key={role.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors cursor-pointer group">
                    <TableCell className="p-4 pl-6 text-[13px] text-slate-700 font-bold group-hover:text-blue-600 transition-colors uppercase">
                      {role.name}
                    </TableCell>
                    <TableCell className="p-4 text-center text-[13px] text-slate-600">
                      {role.activeCount}
                    </TableCell>
                    <TableCell className="p-4 text-center text-[13px] text-slate-600">
                      {role.inactiveCount}
                    </TableCell>
                    <TableCell className="p-4 text-center text-[11px] font-bold text-slate-400">
                      {role.createdAt}
                    </TableCell>
                    <TableCell className="p-4 text-center text-[11px] font-bold text-slate-400">
                      {role.updatedAt}
                    </TableCell>
                    <TableCell className="p-4 text-[12px] text-slate-400 italic">
                      {role.note || ""}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Pagination Footer */}
          <div className="px-6 py-4 bg-[#f8f9fa] border-t border-slate-100 flex items-center justify-end gap-6">
            <div className="flex items-center gap-2 text-[11px] font-bold text-slate-500 uppercase">
              <span>Hiển thị</span>
              <div className="w-[70px]">
                <Select defaultValue="20">
                  <SelectTrigger className="h-8 rounded-none border-slate-200 bg-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-none">
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="20">20</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <span>kết quả</span>
            </div>
            
            <div className="text-[11px] font-bold text-slate-500 uppercase">
              Từ 1 đến 3 trên tổng 3
            </div>

            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-300 disabled:opacity-50" disabled>
                <ChevronLeft size={18} />
              </Button>
              <div className="w-8 h-8 bg-blue-600 text-white flex items-center justify-center rounded-none text-[12px] font-black">
                1
              </div>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-300 disabled:opacity-50" disabled>
                <ChevronRight size={18} />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}