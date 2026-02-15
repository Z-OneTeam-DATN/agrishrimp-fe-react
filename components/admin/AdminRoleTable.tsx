"use client";

import React from "react";
import { Pencil, Trash2, Users, Calendar, Shield } from "lucide-react";
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
import { cn } from "@/lib/utils";

interface Role {
  id: number;
  name: string;
  group: string;
  activeCount: number;
  inactiveCount: number;
  moduleCount: number;
  actionCount: number;
  powerLevel: "LIMITED" | "MEDIUM" | "HIGH" | "FULL";
  createdAt: string;
  updatedAt: string;
  note: string;
}

interface AdminRoleTableProps {
  roles: Role[];
}

export function AdminRoleTable({ roles }: AdminRoleTableProps) {
  return (
    <div className="w-full">
      <Table className="table-custom border-collapse min-w-[1000px]">
        <TableHeader>
          <TableRow className="bg-[#f0f0f0] hover:bg-[#f0f0f0] border-b border-[#ccc]">
            <TableHead className="w-[40px] text-center p-2">
              <Checkbox className="h-3.5 w-3.5" />
            </TableHead>
            <TableHead className="w-[100px] font-bold text-[#1f1f1f] text-[11px] uppercase p-2 pl-4">
              ID
            </TableHead>
            <TableHead className="font-bold text-[#1f1f1f] text-[11px] uppercase p-2">
              Tên vai trò & Phân nhóm
            </TableHead>
            <TableHead className="w-[180px] font-bold text-[#1f1f1f] text-[11px] uppercase p-2 text-center">
              Phạm vi Module
            </TableHead>
            <TableHead className="w-[180px] font-bold text-[#1f1f1f] text-[11px] uppercase p-2 text-center">
              Nhân sự áp dụng
            </TableHead>
            <TableHead className="w-[150px] font-bold text-[#1f1f1f] text-[11px] uppercase p-2 text-center">
              Ngày tạo
            </TableHead>
            <TableHead className="w-[100px] text-right font-bold text-[#1f1f1f] text-[11px] uppercase p-2 pr-4">
              Thao tác
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {roles.map((role) => (
            <TableRow
              key={role.id}
              className="hover:bg-[#f0f8ff] border-b border-[#eee] transition-colors"
            >
              <TableCell className="text-center p-2">
                <Checkbox className="h-3.5 w-3.5" />
              </TableCell>
              <TableCell className="text-[12px] font-bold text-slate-500 pl-4">
                #00{role.id}
              </TableCell>
              <TableCell className="p-2">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 text-[10px] font-bold border border-slate-200 uppercase">
                    {role.name.substring(0, 2)}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[13px] font-bold text-slate-800 uppercase tracking-tighter">
                      {role.name}
                    </span>
                    <span className="text-[10px] text-slate-400 flex items-center gap-1 font-medium italic">
                      {role.group} • {role.note || "Không có mô tả"}
                    </span>
                  </div>
                </div>
              </TableCell>
              <TableCell className="p-2 text-center">
                <span className="bg-slate-50 text-slate-500 border border-slate-200 px-2 py-0.5 rounded text-[10px] font-bold inline-flex items-center gap-1 uppercase tracking-tight">
                  <Shield size={10} className="text-emerald-500" />{" "}
                  {role.moduleCount} / 18 MODULE
                </span>
              </TableCell>
              <TableCell className="p-2 text-center">
                <div className="flex flex-col">
                  <span className="text-[13px] font-bold text-emerald-600">
                    {role.activeCount} nhân viên
                  </span>
                  <span className="text-[10px] text-slate-400 font-medium italic">
                    Đang hoạt động
                  </span>
                </div>
              </TableCell>
              <TableCell className="p-2 text-center">
                <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-500 font-medium">
                  <Calendar size={12} className="text-slate-300" />{" "}
                  {role.createdAt}
                </div>
              </TableCell>
              <TableCell className="p-2 text-right pr-4">
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
          ))}
        </TableBody>
      </Table>

      <div className="flex items-center justify-between px-3 py-2 border-t border-[#eee] bg-[#f8f9fa]">
        <p className="text-[11px] text-gray-400 font-bold uppercase tracking-widest">
          Tổng số {roles.length} vai trò hệ thống
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
            className="h-6 w-6 p-0 text-[10px] bg-emerald-600 text-white border-emerald-600 font-bold"
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
