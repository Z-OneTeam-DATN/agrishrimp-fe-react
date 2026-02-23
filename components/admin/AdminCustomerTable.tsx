"use client";

import React from "react";
import Link from "next/link";
import { Eye, Phone, User, MapPin } from "lucide-react";
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

// 1. Cập nhật Interface khớp chính xác với CustomerResponse DTO từ Backend
interface CustomerData {
  userId: number;
  fullName: string;
  email: string;
  phone: string;
  provider: string; // LOCAL hoặc GOOGLE
  userStatus: string;
  createdAt: string;
  
  // Dữ liệu từ bảng Customer (Có thể null nếu khách chỉ login Google)
  customerId?: number;
  customerStatus?: string;
  addressDetail?: string;
}

interface AdminCustomerTableProps {
  customers: CustomerData[];
}

export function AdminCustomerTable({ customers }: AdminCustomerTableProps) {
  return (
    <div className="w-full">
      <Table className="table-custom border-collapse w-full">
        <TableHeader>
          <TableRow className="bg-[#f4f6f8] hover:bg-[#f4f6f8] border-b border-[#eee]">
            {/* Đã điều chỉnh độ rộng các cột để cân đối hơn */}
            <TableHead className="w-[80px] font-bold text-[#1f1f1f] text-[11px] uppercase p-3 pl-5">
              ID
            </TableHead>
            <TableHead className="w-[30%] font-bold text-[#1f1f1f] text-[11px] uppercase p-3">
              Thông tin khách hàng
            </TableHead>
            <TableHead className="w-[25%] font-bold text-[#1f1f1f] text-[11px] uppercase p-3">
              Liên hệ
            </TableHead>
            <TableHead className="w-[12%] text-right font-bold text-[#1f1f1f] text-[11px] uppercase p-3">
              Chi tiêu (₫)
            </TableHead>
            <TableHead className="w-[10%] text-center font-bold text-[#1f1f1f] text-[11px] uppercase p-3">
              Đơn hàng
            </TableHead>
            <TableHead className="w-[10%] font-bold text-[#1f1f1f] text-[11px] uppercase p-3 text-center">
              Trạng thái
            </TableHead>
            <TableHead className="w-[8%] text-right font-bold text-[#1f1f1f] text-[11px] uppercase p-3 pr-5">
              Hành động
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {customers?.length > 0 ? (
            customers.map((cus) => (
              <TableRow
                key={cus.userId}
                className="hover:bg-[#f8fbfd] border-b border-[#eee] transition-colors cursor-pointer"
                onClick={() =>
                  (window.location.href = `/admin/customers/${cus.userId}`)
                }
              >
                {/* Lấy UserID làm ID gốc */}
                <TableCell className="p-3 pl-5 text-[12px] font-bold text-slate-500">
                  #{cus.userId}
                </TableCell>

                <TableCell className="p-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 shrink-0 bg-blue-50/50 rounded-full flex items-center justify-center text-blue-600 border border-blue-100 shadow-sm">
                      <User size={16} />
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <div className="flex items-center gap-2">
                        <span className="text-[13px] font-bold text-slate-800 uppercase tracking-tight">
                          {cus.fullName || "Chưa cập nhật tên"}
                        </span>
                        
                        {/* Hiện nguồn tạo tài khoản */}
                        <span className={cn(
                            "text-[9px] px-1.5 py-0.5 rounded-[3px] font-black uppercase tracking-wider",
                            cus.provider === 'GOOGLE' ? "bg-red-50 text-red-600 border border-red-100" : "bg-blue-50 text-blue-600 border border-blue-100"
                        )}>
                          {cus.provider}
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-500 flex items-center gap-1 font-medium mt-0.5">
                        <MapPin size={11} className="text-slate-400" />{" "}
                        <span className="truncate max-w-[250px]">{cus.addressDetail || "Chưa cập nhật địa chỉ"}</span>
                      </span>
                    </div>
                  </div>
                </TableCell>

                <TableCell className="p-3">
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2 text-[12px] text-slate-700 font-semibold">
                      <Phone size={13} className="text-slate-400" /> {cus.phone || "---"}
                    </div>
                    <div className="text-[11px] text-slate-500 font-medium">
                      {cus.email || "---"}
                    </div>
                  </div>
                </TableCell>

                <TableCell className="p-3 text-right">
                  <span className="text-[13px] font-black text-emerald-600">
                    0 ₫
                  </span>
                </TableCell>

                <TableCell className="p-3 text-center font-bold text-slate-700 text-[13px]">
                  0
                </TableCell>

                <TableCell className="p-3 text-center">
                  <span
                    className={cn(
                      "text-[10px] font-bold px-2 py-1 rounded-[4px] tracking-wide uppercase whitespace-nowrap",
                      cus.userStatus === "ACTIVE"
                        ? "bg-emerald-50 text-emerald-600"
                        : "bg-rose-50 text-rose-600",
                    )}
                  >
                    {cus.userStatus === "ACTIVE" ? "Hoạt động" : "Bị Khóa"}
                  </span>
                </TableCell>

                <TableCell className="p-3 text-right pr-5">
                  <Link
                    href={`/admin/customers/${cus.userId}`}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-blue-600 hover:bg-blue-50 hover:text-blue-700 transition-all rounded-md"
                    >
                      <Eye size={18} />
                    </Button>
                  </Link>
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={7} className="h-40 text-center">
                <div className="flex flex-col items-center justify-center gap-2">
                  <p className="text-[12px] text-slate-400 italic font-bold uppercase tracking-widest">
                    Không có dữ liệu hiển thị
                  </p>
                </div>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      <div className="flex items-center justify-between px-5 py-3 border-t border-[#eee] bg-[#f8f9fa]">
        <p className="text-[11px] text-slate-500 font-bold uppercase tracking-tight">
          Đang hiển thị {customers?.length || 0} khách hàng & tài khoản
        </p>
        <div className="flex items-center gap-1.5">
          <Button variant="outline" size="sm" className="h-7 px-3 text-[11px] font-bold bg-white border-slate-200 text-slate-600 hover:bg-slate-50">
            Trước
          </Button>
          <Button variant="outline" size="sm" className="h-7 w-7 p-0 text-[11px] bg-blue-600 text-white border-blue-600 font-bold shadow-sm">
            1
          </Button>
          <Button variant="outline" size="sm" className="h-7 px-3 text-[11px] font-bold bg-white border-slate-200 text-slate-600 hover:bg-slate-50">
            Sau
          </Button>
        </div>
      </div>
    </div>
  );
}