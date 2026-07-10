"use client";

import React, { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import {
    ChevronLeft,
    Phone,
    Mail,
    MapPin,
    User,
    ShoppingCart,
    Wallet,
    PackageCheck,
    Clock,
    Send,
    AlertTriangle,
    Plus,
    MapPinCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { customerService } from "@/app/services/customer.service";

// ... (Giữ nguyên các interface và hàm hỗ trợ như cũ) ...
interface OrderData {
    id: number;
    code: string;
    finalAmount: number;
    status: string;
    createdAt: string;
}

interface InternalNote {
    id: number;
    content: string;
    authorName: string;
    createdAt: string;
    updatedAt?: string;
}

interface AddressData {
    id: number;
    receiverName: string;
    receiverPhone: string;
    addressDetail: string;
    isDefault: boolean;
    createdAt: string;
}

interface CustomerStatusLog {
    id: number;
    fromStatus: string;
    toStatus: string;
    reason?: string;
    changedByName: string;
    createdAt: string;
}

interface CustomerData {
    userId: number;
    fullName: string;
    email: string;
    phone: string;
    provider: string;
    userStatus: string;
    createdAt: string;
    customerId?: number;
    customerStatus?: string;
    addressDetail?: string;
    totalOrders?: number;
    totalSpent?: number;
    reputationScore?: number;
    riskLevel?: string;
    onlinePaymentOnly?: boolean;
    avatarUrl?: string;
    lastOrderDate?: string;
    averageOrderValue?: number;
    addresses?: AddressData[];
}

const translateStatusLabel = (status: string) => {
    switch (status) {
        case 'PENDING': return 'Chờ xử lý';
        case 'CONFIRMED': return 'Đã xác nhận';
        case 'AWAITING_REPLENISHMENT': return 'Chờ bổ sung hàng';
        case 'PROCESSING': return 'Đang xử lý';
        case 'SHIPPING': return 'Đang giao hàng';
        case 'COMPLETED': return 'Hoàn thành';
        case 'CANCELLED': return 'Đã hủy';
        case 'RETURNED': return 'Hoàn trả';
        case 'ACTIVE': return 'Hoạt động';
        case 'INACTIVE': return 'Tạm ngưng';
        case 'SUSPENDED': return 'Tạm ngưng';
        case 'LOCKED': return 'Bị khóa';
        case 'BLOCKED': return 'Bị khóa';
        default: return status;
    }
};

const translateOrderStatus = (status: string) => translateStatusLabel(status);

const getOrderStatusColor = (status: string) => {
    switch (status) {
        case 'COMPLETED': return 'text-blue-700';
        case 'CANCELLED':
        case 'RETURNED': return 'text-rose-600';
        case 'SHIPPING': return 'text-slate-700';
        case 'CONFIRMED': return 'text-slate-700';
        case 'PENDING': return 'text-amber-700';
        default: return 'text-slate-600';
    }
};

export default function CustomerDetailPage({
                                               params,
                                           }: {
    params: Promise<{ id: string }>;
}) {
    const router = useRouter();
    const resolvedParams = use(params);
    const customerIdentifier = resolvedParams.id;

    const [customer, setCustomer] = useState<CustomerData | null>(null);
    const [orders, setOrders] = useState<OrderData[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isOrdersLoading, setIsOrdersLoading] = useState(false);
    const [mounted, setMounted] = useState(false);

    // Filter/sort states for orders
    const [orderSort, setOrderSort] = useState<'newest' | 'oldest' | 'highest'>('newest');
    const [orderStatusFilter, setOrderStatusFilter] = useState<string>('all');
    const [orderDateFrom, setOrderDateFrom] = useState<string>('');
    const [orderDateTo, setOrderDateTo] = useState<string>('');

    useEffect(() => {
        setMounted(true);
    }, []);

    const fetchOrders = async (userId: number) => {
        setIsOrdersLoading(true);
        try {
            const data = await customerService.getCustomerOrders(userId);
            setOrders(data || []);
        } catch (error) {
            console.error("Lỗi fetch đơn hàng:", error);
        } finally {
            setIsOrdersLoading(false);
        }
    };

    const fetchDetail = async () => {
        if (!mounted) return;
        setIsLoading(true);
        try {
            const data = await customerService.getDetailById(Number(customerIdentifier));
            setCustomer(data);
            if (data?.userId) {
                fetchOrders(data.userId);
            } else {
                setOrders([]);
            }
        } catch (error) {
            console.error("Lỗi fetch:", error);
            toast.error("Không thể tải thông tin khách hàng");
            router.push("/admin/customers");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchDetail();
    }, [customerIdentifier, mounted, router]);

    // Utility functions
    const calculateDaysSinceSignup = () => {
        if (!customer?.createdAt) return 0;
        const signupDate = new Date(customer.createdAt);
        const today = new Date();
        return Math.floor((today.getTime() - signupDate.getTime()) / (1000 * 60 * 60 * 24));
    };

    const getSortedAndFilteredOrders = () => {
        let filtered = orders;
        if (orderStatusFilter !== 'all') {
            filtered = orders.filter(o => o.status === orderStatusFilter);
        }

        if (orderDateFrom) {
            filtered = filtered.filter(o => new Date(o.createdAt) >= new Date(orderDateFrom));
        }
        if (orderDateTo) {
            const endDate = new Date(orderDateTo);
            endDate.setHours(23, 59, 59, 999);
            filtered = filtered.filter(o => new Date(o.createdAt) <= endDate);
        }
        
        const sorted = [...filtered].sort((a, b) => {
            switch (orderSort) {
                case 'newest':
                    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
                case 'oldest':
                    return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
                case 'highest':
                    return (b.finalAmount || 0) - (a.finalAmount || 0);
                default:
                    return 0;
            }
        });
        return sorted;
    };

    const getCancellationStats = () => {
        const cancelled = orders.filter(o => ['CANCELLED', 'RETURNED'].includes(o.status)).length;
        return cancelled;
    };

    const isRiskAccount = () => {
        return customer?.riskLevel === 'HIGH';
    };

    if (!mounted) return null;

    if (isLoading)
        return (
            <div className="p-20 text-center flex flex-col items-center justify-center gap-4">
                <div className="w-7 h-7 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-[12px] font-medium text-slate-400">
                    Đang tải hồ sơ khách hàng...
                </p>
            </div>
        );

    return (
        <div className="space-y-4 pb-10 bg-slate-50 min-h-screen">
            {/* Header */}
            <div className="flex items-center gap-3 mb-2">
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => router.back()}
                    className="h-8 w-8 text-slate-400 hover:text-slate-700 rounded-[4px]"
                >
                    <ChevronLeft size={20} />
                </Button>
                <div className="flex flex-col flex-1">
                    <div className="flex items-center justify-between">
                        <h1 className="text-[20px] font-semibold text-slate-900">
                            CHI TIẾT KHÁCH HÀNG
                        </h1>
                        {customer?.onlinePaymentOnly && (
                            <div className="text-[11px] font-medium px-3 py-1.5 bg-white text-rose-700 border border-rose-200 rounded-[4px]">
                                Chỉ thanh toán online
                            </div>
                        )}
                    </div>
                    <p className="text-[10.5px] text-slate-500 font-normal">
                        Mã khách hàng: {customerIdentifier}
                    </p>
                </div>
            </div>

            {/* Action Buttons Bar */}
            <div className="flex gap-2 items-center flex-wrap">
                <Button
                    variant="outline"
                    size="sm"
                    className="h-9 gap-2 text-[11px] font-medium rounded-[4px] border-slate-200"
                    onClick={() => {
                        if (!customer?.email) {
                            toast.error('Khách hàng chưa có email');
                            return;
                        }
                        window.location.href = `mailto:${customer.email}?subject=${encodeURIComponent(`Hỗ trợ tài khoản #${customer.userId}`)}`;
                    }}
                >
                    <Send size={14} /> Email
                </Button>
                {isRiskAccount() && (
                    <div className="flex items-center gap-2 ml-auto px-3 py-2 bg-rose-50 border border-rose-200 rounded text-[11px]">
                        <AlertTriangle size={14} className="text-rose-600" />
                        <span className="font-medium text-rose-700">Tài khoản rủi ro khóa</span>
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                {/* Cột trái: Thông tin tổng quan */}
                <div className="lg:col-span-2 space-y-4">
                    <div className="bg-white border border-slate-200 rounded-[4px] shadow-sm overflow-hidden">
                        <div className="p-5 border-b border-slate-50 flex flex-col items-center text-center">
                            <div className="relative mb-4 group">
                                <div className="w-20 h-20 bg-slate-50 rounded-[4px] flex items-center justify-center text-slate-400 border border-slate-200 overflow-hidden">
                                    {customer?.avatarUrl ? (
                                        <img
                                            src={customer.avatarUrl}
                                            alt={customer?.fullName || "Avatar"}
                                            className="w-full h-full object-cover"
                                            onError={(e) => {
                                                e.currentTarget.style.display = 'none';
                                            }}
                                        />
                                    ) : (
                                        <User size={40} />
                                    )}
                                </div>
                                {/* Đã bỏ hiển thị provider ở đây */}
                            </div>

                            <h2 className="text-[14px] font-semibold text-slate-900 leading-tight mb-1 mt-2">
                                {customer?.fullName || "Chưa cập nhật tên"}
                            </h2>
                            <p className="text-[10.5px] font-normal text-slate-500">
                                Mã định danh: {customer?.userId ? `USR-${customer.userId}` : "KHÔNG CÓ TÀI KHOẢN"}
                            </p>

                            <div className="mt-5 grid grid-cols-2 gap-2 w-full">
                                <div className="bg-white p-3 border border-slate-200 text-center rounded-[4px]">
                                    <p className="text-[10px] font-medium text-slate-500 mb-1 flex items-center justify-center gap-1">
                                        <Wallet size={10} /> Chi tiêu
                                    </p>
                                    <p className="text-[13px] font-semibold text-slate-900">
                                        {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(customer?.totalSpent || 0)}
                                    </p>
                                </div>
                                <div className="bg-white p-3 border border-slate-200 text-center rounded-[4px]">
                                    <p className="text-[10px] font-medium text-slate-500 mb-1 flex items-center justify-center gap-1">
                                        <ShoppingCart size={10} /> Đơn hàng
                                    </p>
                                    <p className="text-[13px] font-semibold text-slate-900">
                                        {customer?.totalOrders || 0}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="p-4 space-y-3">
                            <div className="flex items-start gap-3">
                                <Phone size={14} className="text-slate-300 mt-0.5 flex-shrink-0" />
                                <div className="flex flex-col">
                                    <span className="text-[10.5px] font-medium text-slate-500">Điện thoại</span>
                                    <span className="text-[12px] font-medium text-slate-700">{customer?.phone || "N/A"}</span>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <Mail size={14} className="text-slate-300 mt-0.5 flex-shrink-0" />
                                <div className="flex flex-col">
                                    <span className="text-[10.5px] font-medium text-slate-500">Email</span>
                                    <span className="text-[12px] font-medium text-slate-700">{customer?.email || "Chưa cập nhật"}</span>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <MapPin size={14} className="text-slate-300 mt-0.5 flex-shrink-0" />
                                <div className="flex flex-col w-full min-w-0">
                                    <span className="text-[10.5px] font-medium text-slate-500">Địa chỉ</span>
                                    <span className="text-[11px] font-medium text-slate-600 leading-snug">{customer?.addressDetail || "Chưa cập nhật địa chỉ"}</span>
                                    
                                    {/* Danh sách địa chỉ giao hàng nằm dưới địa chỉ chính */}
                                    <div className="mt-2.5 pt-2.5 border-t border-slate-100 space-y-2">
                                        <div className="flex items-center justify-between">
                                            <span className="text-[10px] font-bold text-slate-700 uppercase tracking-wider">Địa chỉ giao hàng</span>
                                        </div>
                                        {customer?.addresses && customer.addresses.length > 0 ? (
                                            <div className="space-y-1.5 max-h-[160px] overflow-y-auto pr-1">
                                                {customer.addresses.map(addr => (
                                                    <div key={addr.id} className="p-2 border border-slate-100 rounded-[3px] bg-slate-50/50 text-[10px]">
                                                        <div className="flex items-start justify-between gap-1">
                                                            <div className="min-w-0 flex-1">
                                                                <p className="font-bold text-slate-800 truncate">
                                                                    {addr.receiverName}
                                                                    {addr.isDefault && (
                                                                        <span className="text-[8px] font-semibold text-blue-700 bg-blue-50 px-1 py-0.5 rounded ml-1.5">
                                                                            Mặc định
                                                                        </span>
                                                                    )}
                                                                </p>
                                                                <p className="text-slate-600 mt-0.5 font-normal">{addr.addressDetail}</p>
                                                                <p className="text-slate-500 mt-0.5 font-normal">📞 {addr.receiverPhone}</p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <p className="text-[10px] text-slate-400 font-normal">Chưa có địa chỉ giao hàng</p>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="pt-3 border-t border-slate-50 flex justify-between items-center">
                                <span className="text-[10.5px] font-medium text-slate-500">
                                  Trạng thái vận hành
                                </span>
                                <div className="flex flex-col items-end gap-1">
                                    <span
                                        className={cn(
                                            "text-[12px] font-medium",
                                            customer?.userStatus === "ACTIVE"
                                                ? "text-blue-700"
                                                : "text-slate-600",
                                        )}
                                    >
                                      {customer?.userStatus === "ACTIVE" ? "Đang hoạt động" : "Tạm ngưng"}
                                    </span>
                                    {customer?.onlinePaymentOnly && (
                                        <span className="text-[11px] font-medium text-rose-600">PayOS bắt buộc</span>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Cột phải: Tab giao dịch */}
                <div className="lg:col-span-3">
                    <div className="bg-white border border-slate-200 rounded-[4px] shadow-sm overflow-hidden min-h-[400px]">
                        {/* Filter & Sort Controls */}
                        <div className="p-3 border-b border-slate-100 flex items-center gap-2 flex-wrap bg-slate-50">
                            <span className="text-[11px] font-semibold text-slate-700 mr-1">Nhật ký giao dịch</span>
                            <select
                                value={orderStatusFilter}
                                onChange={(e) => setOrderStatusFilter(e.target.value)}
                                className="text-[11px] font-medium px-2 py-1.5 border border-slate-200 rounded-[4px] bg-white"
                            >
                                <option value="all">Tất cả trạng thái</option>
                                <option value="PENDING">Chờ xử lý</option>
                                <option value="CONFIRMED">Đã xác nhận</option>
                                <option value="AWAITING_REPLENISHMENT">Chờ bổ sung hàng</option>
                                <option value="PROCESSING">Đang xử lý</option>
                                <option value="SHIPPING">Đang giao</option>
                                <option value="COMPLETED">Hoàn thành</option>
                                <option value="CANCELLED">Đã hủy</option>
                                <option value="RETURNED">Hoàn trả</option>
                            </select>
                            <select
                                value={orderSort}
                                onChange={(e) => setOrderSort(e.target.value as 'newest' | 'oldest' | 'highest')}
                                className="text-[11px] font-medium px-2 py-1.5 border border-slate-200 rounded-[4px] bg-white"
                            >
                                <option value="newest">Mới nhất</option>
                                <option value="oldest">Cũ nhất</option>
                                <option value="highest">Giá cao nhất</option>
                            </select>
                            <input
                                type="date"
                                value={orderDateFrom}
                                onChange={(e) => setOrderDateFrom(e.target.value)}
                                className="text-[10px] font-bold px-2 py-1.5 border border-slate-300 rounded bg-white"
                            />
                            <input
                                type="date"
                                value={orderDateTo}
                                onChange={(e) => setOrderDateTo(e.target.value)}
                                className="text-[10px] font-bold px-2 py-1.5 border border-slate-300 rounded bg-white"
                            />
                            {getCancellationStats() > 0 && (
                                <div className="ml-auto text-[11px] font-medium text-amber-700 px-2 py-1">
                                    {getCancellationStats()} đơn hủy/hoàn trả
                                </div>
                            )}
                        </div>
                        <Table>
                                    <TableHeader className="bg-slate-50/80">
                                        <TableRow className="hover:bg-transparent">
                                            <TableHead className="w-[120px] text-[11px] font-medium text-slate-500 p-3">Mã đơn</TableHead>
                                            <TableHead className="w-[130px] text-[11px] font-medium text-slate-500 p-3">Ngày giao dịch</TableHead>
                                            <TableHead className="w-[140px] text-right text-[11px] font-medium text-slate-500 p-3">Tổng tiền</TableHead>
                                            <TableHead className="w-[110px] text-center text-[11px] font-medium text-slate-500 p-3">Trạng thái</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {isOrdersLoading ? (
                                            <TableRow>
                                                <TableCell colSpan={4} className="h-40 text-center">
                                                    <div className="flex flex-col items-center gap-2 opacity-50">
                                                        <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                                                        <p className="text-[11px] font-medium">Đang tải lịch sử...</p>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ) : orders.length > 0 ? (
                                            getSortedAndFilteredOrders().map((order) => (
                                                <TableRow key={order.id} className="hover:bg-slate-50/50 cursor-pointer transition-colors group">
                                                    <TableCell className="p-3">
                                                        <span className="text-[11.5px] font-semibold text-slate-900 group-hover:underline">{order.code}</span>
                                                    </TableCell>
                                                    <TableCell className="p-3">
                                                        <div className="flex items-center gap-1 text-[10px] font-bold text-slate-500">
                                                            <Clock size={11} className="text-slate-300" />
                                                            {new Date(order.createdAt).toLocaleDateString('vi-VN')}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="p-3 text-right text-[12px] font-semibold text-slate-900">
                                                        {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(order.finalAmount || 0)}
                                                    </TableCell>
                                                    <TableCell className="p-3 text-center">
                            <span className={cn(
                                "text-[11px] font-medium",
                                getOrderStatusColor(order.status)
                            )}>
                              {translateOrderStatus(order.status)}
                            </span>
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        ) : (
                                            <TableRow>
                                                <TableCell colSpan={4} className="h-60 text-center">
                                                    <div className="flex flex-col items-center justify-center gap-2 opacity-20">
                                                        <PackageCheck size={48} />
                                                        <p className="text-[12px] font-medium">Khách hàng chưa có giao dịch</p>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                    </div>
            </div>
        </div>
    );
}

