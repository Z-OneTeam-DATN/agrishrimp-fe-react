"use client";

import React from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MoreHorizontal, Package } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { dashboardService } from "@/app/services/dashboard.service";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface TopProductsProps {
  branchId?: string;
}

// Định nghĩa Type chuẩn xác từ Backend trả về
interface TopProduct {
  productId: number;
  productName: string;
  quantitySold: number;
  revenue: number;
  imageUrl: string | null;
}

export default function TopProducts({ branchId }: TopProductsProps) {
  const { data: products = [], isLoading } = useQuery({
    queryKey: ["top-products", branchId],
    queryFn: () => dashboardService.getTopProducts(5, branchId),
  });

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-[4px] border border-slate-200 bg-white shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 bg-white px-4 py-3">
        <h2 className="text-[12px] font-semibold text-slate-900">
          Top sản phẩm bán chạy
        </h2>
        <div className="flex gap-2">
          <div className="w-32">
            <Select defaultValue="30days">
              <SelectTrigger className="h-8 rounded-[4px] border-slate-200 text-[12px] focus:ring-0">
                <SelectValue placeholder="30 ngày qua" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="30days">30 ngày qua</SelectItem>
                <SelectItem value="7days">7 ngày qua</SelectItem>
                <SelectItem value="all">Toàn thời gian</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <button className="rounded-[4px] border border-slate-200 p-1.5 text-slate-400 transition-colors hover:bg-slate-50 hover:text-slate-600">
            <MoreHorizontal size={14} />
          </button>
        </div>
      </div>

      {/* Danh sách sản phẩm */}
      <div className="flex-1">
        <div className="divide-y divide-gray-100">
          {isLoading ? (
            // Hiệu ứng Loading
            [...Array(5)].map((_, i) => (
              <div
                key={i}
                className="px-4 py-3 flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <Skeleton className="h-6 w-6 rounded-[4px]" /> {/* Rank */}
                  <Skeleton className="h-10 w-10 rounded-[4px]" /> {/* Image */}
                  <div className="space-y-2">
                    <Skeleton className="h-3 w-32" />
                    <Skeleton className="h-2 w-20" />
                  </div>
                </div>
                <div className="space-y-2 text-right">
                  <Skeleton className="h-3 w-20 ml-auto" />
                </div>
              </div>
            ))
          ) : products.length > 0 ? (
            // Render dữ liệu thật
            products.map((product: TopProduct, index: number) => {
              return (
                <div
                  key={product.productId}
                  className="group flex cursor-default items-center justify-between px-4 py-3 transition-colors hover:bg-slate-50"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    {/* Rank Badge */}
                    <div
                      className={cn(
                        "w-5 shrink-0 text-center text-[11px] font-medium text-slate-400",
                      )}
                    >
                      {index + 1}
                    </div>

                    {/* Image */}
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-[4px] border border-slate-100 bg-slate-50">
                      {product.imageUrl ? (
                        <img
                          src={product.imageUrl}
                          alt={product.productName}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                        />
                      ) : (
                        <Package size={18} className="text-gray-300" />
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0 pr-4">
                      <p
                        className="truncate text-[12.5px] font-semibold text-slate-900"
                        title={product.productName}
                      >
                        {product.productName}
                      </p>
                      <p className="mt-0.5 text-[10.5px] text-slate-500">
                        Đã bán:{" "}
                        <span className="font-medium text-slate-700">
                          {product.quantitySold.toLocaleString("vi-VN")}
                        </span>
                      </p>
                    </div>
                  </div>

                  {/* Revenue */}
                  <div className="text-right shrink-0">
                    <p className="text-[12px] font-semibold text-slate-900">
                      {product.revenue.toLocaleString("vi-VN")} ₫
                    </p>
                  </div>
                </div>
              );
            })
          ) : (
            // Empty State
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-[4px] bg-slate-50">
                <Package size={20} className="text-slate-300" />
              </div>
              <p className="text-xs font-medium text-gray-500">
                Chưa có dữ liệu bán hàng
              </p>
              <p className="text-[10px] text-gray-400 mt-1">
                Các sản phẩm bán được sẽ hiển thị tại đây
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-slate-100 bg-white p-3 text-center">
        <button className="text-[11px] font-medium text-slate-500 transition-colors hover:text-slate-700">
          Xem báo cáo chi tiết
        </button>
      </div>
    </div>
  );
}
