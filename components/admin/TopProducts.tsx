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
        <div className="bg-white border border-gray-200 rounded-sm shadow-sm h-full flex flex-col">
            {/* Header */}
            <div className="px-4 py-3 border-b border-gray-100 flex justify-between items-center">
                <h2 className="text-sm font-semibold text-gray-700 uppercase">
                    Top sản phẩm bán chạy
                </h2>
                <div className="flex gap-2">
                    <div className="w-32">
                        <Select defaultValue="30days">
                            <SelectTrigger className="h-8 text-xs focus:ring-0">
                                <SelectValue placeholder="30 ngày qua" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="30days">30 ngày qua</SelectItem>
                                <SelectItem value="7days">7 ngày qua</SelectItem>
                                <SelectItem value="all">Toàn thời gian</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <button className="p-1.5 border rounded-sm text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-colors">
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
                            <div key={i} className="px-4 py-3 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <Skeleton className="w-6 h-6 rounded-full" /> {/* Rank */}
                                    <Skeleton className="w-10 h-10 rounded-sm" /> {/* Image */}
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
                                    className="px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors group cursor-default"
                                >
                                    <div className="flex items-center gap-3 flex-1 min-w-0">
                                        {/* Rank Badge */}
                                        <div
                                            className={cn(
                                                "w-6 h-6 shrink-0 flex items-center justify-center rounded-full text-[11px] font-bold shadow-sm",
                                                index === 0 ? "bg-amber-100 text-amber-600" :
                                                    index === 1 ? "bg-slate-200 text-slate-600" :
                                                        index === 2 ? "bg-orange-100 text-orange-600" :
                                                            "bg-gray-50 text-gray-400 border border-gray-100 shadow-none"
                                            )}
                                        >
                                            {index + 1}
                                        </div>

                                        {/* Image */}
                                        <div className="w-10 h-10 shrink-0 rounded-sm overflow-hidden border border-gray-100 bg-gray-50 flex items-center justify-center">
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
                                            <p className="text-xs font-bold text-gray-800 truncate" title={product.productName}>
                                                {product.productName}
                                            </p>
                                            <p className="text-[10px] text-gray-500 mt-0.5">
                                                Đã bán: <span className="font-bold text-emerald-600">{product.quantitySold.toLocaleString('vi-VN')}</span>
                                            </p>
                                        </div>
                                    </div>

                                    {/* Revenue */}
                                    <div className="text-right shrink-0">
                                        <p className="text-xs font-bold text-blue-600">
                                            {product.revenue.toLocaleString('vi-VN')} ₫
                                        </p>
                                    </div>
                                </div>
                            );
                        })
                    ) : (
                        // Empty State
                        <div className="py-12 flex flex-col items-center justify-center text-center">
                            <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mb-3">
                                <Package size={24} className="text-gray-300" />
                            </div>
                            <p className="text-xs font-medium text-gray-500">Chưa có dữ liệu bán hàng</p>
                            <p className="text-[10px] text-gray-400 mt-1">Các sản phẩm bán được sẽ hiển thị tại đây</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Footer */}
            <div className="p-3 border-t border-gray-100 text-center bg-gray-50/50">
                <button className="text-[11px] text-blue-600 font-bold hover:text-blue-700 transition-colors uppercase tracking-wide">
                    Xem báo cáo chi tiết
                </button>
            </div>
        </div>
    );
}