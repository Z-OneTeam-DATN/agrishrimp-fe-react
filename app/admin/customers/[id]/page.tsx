"use client";

import React, { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import {
    ChevronLeft,
    Phone,
    Mail,
    MapPin,
    User,
    History,
    ShoppingCart,
    Wallet,
    PackageCheck,
    Clock,
    Send,
    FileText,
    Activity,
    Download,
    AlertTriangle,
    Plus,
    Trash2,
    MapPinCheck,
    X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
    internalNotes?: InternalNote[];
    statusLogs?: CustomerStatusLog[];
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
        case 'COMPLETED': return 'text-emerald-700';
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

    // New states for enhancements
    const [orderSort, setOrderSort] = useState<'newest' | 'oldest' | 'highest'>('newest');
    const [orderStatusFilter, setOrderStatusFilter] = useState<string>('all');
    const [orderDateFrom, setOrderDateFrom] = useState<string>('');
    const [orderDateTo, setOrderDateTo] = useState<string>('');
    const [showNotesModal, setShowNotesModal] = useState(false);
    const [newNote, setNewNote] = useState('');
    const [notes, setNotes] = useState<InternalNote[]>([]);
    const [statusLogs, setStatusLogs] = useState<CustomerStatusLog[]>([]);
    const [activeTab, setActiveTab] = useState('history');

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
            setNotes(data.internalNotes || []);
            setStatusLogs(data.statusLogs || []);
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

    const handleAddNote = async () => {
        if (!newNote.trim() || !customer?.userId) return;
        try {
            const created = await customerService.addInternalNote(customer.userId, { content: newNote });
            setNotes([created, ...notes]);
            setNewNote('');
            toast.success('Ghi chú đã được thêm!');
        } catch (error) {
            console.error('Lỗi thêm ghi chú:', error);
            toast.error('Không thể thêm ghi chú nội bộ');
        }
    };

    const handleDeleteNote = async (noteId: number) => {
        try {
            await customerService.deleteInternalNote(noteId);
            setNotes(notes.filter(n => n.id !== noteId));
            toast.success('Ghi chú đã xóa!');
        } catch (error) {
            console.error('Lỗi xóa ghi chú:', error);
            toast.error('Không thể xóa ghi chú nội bộ');
        }
    };

    if (!mounted) return null;

    if (isLoading)
        return (
            <div className="p-20 text-center flex flex-col items-center justify-center gap-4">
                <div className="w-7 h-7 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
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
                            CẬP NHẬT KHÁCH HÀNG
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

            {/* Quick Stats Row */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="bg-white border border-slate-200 p-4 rounded-[4px] shadow-sm">
                    <div>
                        <p className="text-[10.5px] font-medium text-slate-500">Ngày đặt hàng gần nhất</p>
                        <p className="text-[14px] font-semibold text-slate-900 mt-1">
                            {customer?.lastOrderDate ? new Date(customer.lastOrderDate).toLocaleDateString('vi-VN') : 'Chưa có'}
                        </p>
                    </div>
                </div>
                <div className="bg-white border border-slate-200 p-4 rounded-[4px] shadow-sm">
                    <div>
                        <p className="text-[10.5px] font-medium text-slate-500">Giá trị đơn trung bình</p>
                        <p className="text-[14px] font-semibold text-slate-900 mt-1">
                            {customer?.averageOrderValue ? new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(customer.averageOrderValue) : '---'}
                        </p>
                    </div>
                </div>
                <div className="bg-white border border-slate-200 p-4 rounded-[4px] shadow-sm">
                    <div>
                        <p className="text-[10.5px] font-medium text-slate-500">Ngày tham gia</p>
                        <p className="text-[14px] font-semibold text-slate-900 mt-1">
                            {calculateDaysSinceSignup()} ngày trước
                        </p>
                    </div>
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
                <Button
                    variant="outline"
                    size="sm"
                    className="h-9 gap-2 text-[11px] font-medium rounded-[4px] border-slate-200"
                    onClick={() => {
                        setActiveTab('notes');
                        setShowNotesModal(true);
                    }}
                >
                    <FileText size={14} /> Ghi chú
                </Button>
                <Button
                    variant="outline"
                    size="sm"
                    className="h-9 gap-2 text-[11px] font-medium rounded-[4px] border-slate-200"
                    onClick={() => setActiveTab('activity')}
                >
                    <Activity size={14} /> Lịch sử
                </Button>
                <Button
                    variant="outline"
                    size="sm"
                    className="h-9 gap-2 text-[11px] font-medium rounded-[4px] border-slate-200"
                    onClick={() => window.print()}
                >
                    <Download size={14} /> PDF
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
                                <div className="flex flex-col">
                                    <span className="text-[10.5px] font-medium text-slate-500">Địa chỉ</span>
                                    <span className="text-[11px] font-medium text-slate-600 leading-snug">{customer?.addressDetail || "Chưa cập nhật địa chỉ"}</span>
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
                                                        ? "text-emerald-700"
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

                    {/* Addresses Section */}
                    <div className="bg-white border border-slate-200 rounded-[4px] shadow-sm overflow-hidden">
                        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                            <h3 className="text-[12px] font-semibold text-slate-900 flex items-center gap-2">
                                <MapPinCheck size={14} /> Địa chỉ giao hàng
                            </h3>
                            <Button size="icon" variant="ghost" className="h-7 w-7 text-slate-500 hover:bg-slate-100 rounded-[4px]">
                                <Plus size={14} />
                            </Button>
                        </div>
                        <div className="p-4 space-y-2">
                            {customer?.addresses && customer.addresses.length > 0 ? (
                                customer.addresses.map(addr => (
                                    <div key={addr.id} className="p-3 border border-slate-100 rounded bg-slate-50/30">
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="flex-1">
                                                <p className="text-[11px] font-bold text-slate-800">{addr.receiverName}</p>
                                                <p className="text-[10px] text-slate-600 mt-1">{addr.addressDetail}</p>
                                                <p className="text-[10px] text-slate-500 mt-1">📞 {addr.receiverPhone}</p>
                                            </div>
                                            {addr.isDefault && (
                                                <span className="text-[10px] font-medium text-emerald-700 whitespace-nowrap">
                                                    Mặc định
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p className="text-center text-[10px] text-slate-400 py-4">Chưa có địa chỉ</p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Cột phải: Tabs chi tiết */}
                <div className="lg:col-span-3">
                    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                        <TabsList className="bg-white border border-slate-200 rounded-[4px] p-1 w-full flex justify-start gap-1 h-auto shadow-sm overflow-x-auto">
                            <TabsTrigger
                                value="history"
                                className="text-[11px] font-medium py-2 px-4 rounded-[4px] data-[state=active]:bg-emerald-600 data-[state=active]:text-white whitespace-nowrap"
                            >
                                <History size={13} className="mr-1.5" /> Nhật ký giao dịch
                            </TabsTrigger>
                            <TabsTrigger
                                value="notes"
                                className="text-[11px] font-medium py-2 px-4 rounded-[4px] data-[state=active]:bg-emerald-600 data-[state=active]:text-white whitespace-nowrap"
                            >
                                <FileText size={13} className="mr-1.5" /> Ghi chú nội bộ
                            </TabsTrigger>
                            <TabsTrigger
                                value="activity"
                                className="text-[11px] font-medium py-2 px-4 rounded-[4px] data-[state=active]:bg-emerald-600 data-[state=active]:text-white whitespace-nowrap"
                            >
                                <Activity size={13} className="mr-1.5" /> Lịch sử thay đổi
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value="history" className="mt-0">
                            <div className="bg-white border border-slate-200 rounded-[4px] shadow-sm overflow-hidden min-h-[400px] mt-3">
                                {/* Filter & Sort Controls */}
                                <div className="p-3 border-b border-slate-100 flex items-center gap-2 flex-wrap bg-slate-50">
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
                                                        <div className="w-5 h-5 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
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
                        </TabsContent>

                        <TabsContent value="notes" className="mt-0">
                            <div className="bg-white border border-slate-200 rounded-[4px] shadow-sm overflow-hidden mt-3">
                                {/* Add Note Form */}
                                <div className="p-4 border-b border-slate-100 bg-slate-50">
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            placeholder="Thêm ghi chú nội bộ..."
                                            value={newNote}
                                            onChange={(e) => setNewNote(e.target.value)}
                                            className="flex-1 text-[11px] px-3 py-2 border border-slate-300 rounded bg-white"
                                            onKeyDown={(e) => e.key === 'Enter' && handleAddNote()}
                                        />
                                        <Button
                                            onClick={handleAddNote}
                                            size="sm"
                                            className="h-8 px-3 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-medium rounded-[4px]"
                                        >
                                            <Plus size={12} className="mr-1" /> Thêm
                                        </Button>
                                    </div>
                                </div>

                                {/* Notes List */}
                                <div className="p-4 space-y-2 max-h-[500px] overflow-y-auto">
                                    {notes.length > 0 ? (
                                        notes.map(note => (
                                            <div key={note.id} className="p-3 border border-slate-100 bg-slate-50 rounded">
                                                <div className="flex items-start justify-between gap-2">
                                                    <div className="flex-1">
                                                        <p className="text-[11px] text-slate-800">{note.content}</p>
                                                        <p className="text-[9px] text-slate-500 mt-1.5">
                                                            <strong>{note.authorName}</strong> • {new Date(note.createdAt).toLocaleDateString('vi-VN')} {new Date(note.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                                                        </p>
                                                    </div>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-6 w-6 text-rose-600 hover:bg-rose-50"
                                                        onClick={() => handleDeleteNote(note.id)}
                                                    >
                                                        <Trash2 size={12} />
                                                    </Button>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <p className="text-center text-[10px] text-slate-400 py-8">Chưa có ghi chú nào</p>
                                    )}
                                </div>
                            </div>
                        </TabsContent>

                        <TabsContent value="activity" className="mt-0">
                            <div className="bg-white border border-slate-200 rounded-[4px] shadow-sm overflow-hidden mt-3">
                                <div className="p-4 border-b border-slate-100 bg-slate-50">
                                    <h3 className="text-[12px] font-semibold text-slate-900">Lịch sử thay đổi trạng thái</h3>
                                </div>
                                <div className="p-4 space-y-2 max-h-[500px] overflow-y-auto">
                                    {statusLogs.length > 0 ? (
                                        statusLogs.map((log) => (
                                            <div key={log.id} className="p-3 border border-slate-100 bg-slate-50 rounded">
                                                <div className="flex items-center justify-between gap-2">
                                                    <div>
                                                        <p className="text-[11px] font-bold text-slate-800">
                                                            {translateStatusLabel(log.fromStatus)} → {translateStatusLabel(log.toStatus)}
                                                        </p>
                                                        <p className="text-[10px] text-slate-600 mt-1">{log.reason || 'Cập nhật trạng thái'}</p>
                                                        <p className="text-[9px] text-slate-500 mt-1.5">
                                                            <strong>{log.changedByName}</strong> • {new Date(log.createdAt).toLocaleDateString('vi-VN')} {new Date(log.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <p className="text-center text-[10px] text-slate-400 py-8">Chưa có lịch sử thay đổi</p>
                                    )}
                                </div>
                            </div>
                        </TabsContent>
                    </Tabs>
                </div>
            </div>

            {/* Notes Modal */}
            {showNotesModal && (
                <div className="fixed inset-0 z-[999] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm">
                    <div className="bg-white rounded-[4px] shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
                            <h3 className="text-[14px] font-semibold text-slate-900 flex items-center gap-2">
                                <FileText size={18} /> Thêm ghi chú nội bộ
                            </h3>
                            <button
                                onClick={() => setShowNotesModal(false)}
                                className="text-slate-400 hover:text-slate-600"
                            >
                                <X size={20} />
                            </button>
                        </div>
                        <div className="p-5">
                            <textarea
                                placeholder="Nhập ghi chú (VD: khách hàng VIP, khiếu nại, lưu ý đặc biệt...)"
                                value={newNote}
                                onChange={(e) => setNewNote(e.target.value)}
                                className="w-full text-[12px] px-3 py-2 border border-slate-300 rounded bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[120px] resize-none"
                            />
                        </div>
                        <div className="flex items-center justify-end gap-3 px-6 py-4 bg-slate-50 border-t border-slate-100">
                            <Button
                                variant="outline"
                                onClick={() => setShowNotesModal(false)}
                                className="text-[12px] font-medium h-9 rounded-[4px]"
                            >
                                Hủy
                            </Button>
                            <Button
                                onClick={async () => {
                                    await handleAddNote();
                                    setShowNotesModal(false);
                                }}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white text-[12px] font-medium h-9 rounded-[4px]"
                            >
                                <Plus size={14} className="mr-1" /> Thêm ghi chú
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
