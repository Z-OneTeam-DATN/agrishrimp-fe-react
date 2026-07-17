"use client";

import React from "react";
import Link from "next/link";
import { Search, RotateCw, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";

export default function TransferRequestsPage() {
  const incomingRequests = [
    {
      code: "YCDC0045",
      date: "23/02/2026",
      from: "Chi nhánh Hà Nội",
      items: 3,
      priority: "Gấp",
    },
    {
      code: "YCDC0042",
      date: "22/02/2026",
      from: "Chi nhánh Hồ Chí Minh",
      items: 7,
      priority: "Bình thường",
    },
    {
      code: "YCDC0039",
      date: "21/02/2026",
      from: "Chi nhánh Bạc Liêu",
      items: 15,
      priority: "Bình thường",
    },
  ];

  return (
    <div className="space-y-3">
      <div className="flex flex-col justify-between gap-2 md:flex-row md:items-center">
        <h1 className="text-[18px] font-bold text-[#1f1f1f]">
          Yêu cầu điều chuyển (Đơn vị khác yêu cầu)
        </h1>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="h-[32px] border-[#ddd] bg-white font-semibold text-gray-500"
          >
            <RotateCw className="mr-1.5 h-3.5 w-3.5" /> Làm mới
          </Button>
        </div>
      </div>

      <div className="overflow-hidden rounded-[4px] border border-[#dcdcdc] bg-white shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
        <div className="flex items-center justify-between border-b border-[#eee] bg-[#f8f9fa] p-2">
          <div className="relative w-full max-w-[300px]">
            <Search
              className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400"
              size={14}
            />
            <Input
              placeholder="Tìm mã yêu cầu, chi nhánh..."
              className="h-[30px] rounded-[4px] border-[#ddd] bg-white pl-8 text-[13px] focus-visible:ring-1 focus-visible:ring-[#007bff]"
            />
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              className="h-[30px] w-[30px] border-[#ddd] bg-white text-gray-500"
            >
              <Settings size={14} />
            </Button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <Table className="table-custom">
            <TableHeader>
              <TableRow className="border-b border-[#ccc] bg-[#f0f0f0] hover:bg-[#f0f0f0]">
                <TableHead className="w-[40px] p-[10px] text-center">
                  <Checkbox className="h-3.5 w-3.5" />
                </TableHead>
                <TableHead className="whitespace-nowrap p-[10px] text-[12px] font-bold uppercase text-[#1f1f1f]">
                  Mã yêu cầu
                </TableHead>
                <TableHead className="whitespace-nowrap p-[10px] text-[12px] font-bold uppercase text-[#1f1f1f]">
                  Đơn vị yêu cầu
                </TableHead>
                <TableHead className="whitespace-nowrap p-[10px] text-[12px] font-bold uppercase text-[#1f1f1f]">
                  Ngày yêu cầu
                </TableHead>
                <TableHead className="whitespace-nowrap p-[10px] text-right text-[12px] font-bold uppercase text-[#1f1f1f]">
                  Số mặt hàng
                </TableHead>
                <TableHead className="whitespace-nowrap p-[10px] text-center text-[12px] font-bold uppercase text-[#1f1f1f]">
                  Độ ưu tiên
                </TableHead>
                <TableHead className="w-[150px] whitespace-nowrap p-[10px] text-center text-[12px] font-bold uppercase text-[#1f1f1f]">
                  Thao tác
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {incomingRequests.map((req) => (
                <TableRow
                  key={req.code}
                  className="cursor-pointer border-b border-[#eee] transition-colors hover:bg-[#f0f8ff]"
                >
                  <TableCell className="p-[10px] text-center">
                    <Checkbox className="h-3.5 w-3.5" />
                  </TableCell>
                  <TableCell className="p-[10px] font-bold text-[#007bff]">
                    {req.code}
                  </TableCell>
                  <TableCell className="p-[10px] font-medium text-[#1f1f1f]">
                    {req.from}
                  </TableCell>
                  <TableCell className="p-[10px] text-[#555]">
                    {req.date}
                  </TableCell>
                  <TableCell className="p-[10px] text-right font-bold text-[#1f1f1f]">
                    {req.items}
                  </TableCell>
                  <TableCell className="p-[10px] text-center">
                    <span
                      className={`text-[11px] font-bold ${
                        req.priority === "Gấp"
                          ? "text-red-600"
                          : "text-gray-500"
                      }`}
                    >
                      {req.priority}
                    </span>
                  </TableCell>
                  <TableCell className="p-[10px] text-center">
                    <Link href={`/admin/transfers/new?source=${req.code}`}>
                      <Button
                        variant="outline"
                        className="h-[28px] rounded-[4px] border-[#007bff] px-3 text-[11px] font-bold text-[#007bff] hover:bg-[#007bff] hover:text-white"
                      >
                        Duyệt & Xuất kho
                      </Button>
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <div className="flex items-center justify-between border-t border-[#eee] bg-[#f8f9fa] px-3 py-2">
          <p className="text-[12px] text-gray-500">
            Hiển thị 1 - 3 trên tổng số 3 bản ghi
          </p>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              className="h-[28px] border-[#ddd] bg-white px-2 text-[12px]"
            >
              Trước
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-[28px] w-[28px] border-[#007bff] bg-[#007bff] p-0 text-[12px] text-white"
            >
              1
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-[28px] border-[#ddd] bg-white px-2 text-[12px]"
            >
              Sau
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
