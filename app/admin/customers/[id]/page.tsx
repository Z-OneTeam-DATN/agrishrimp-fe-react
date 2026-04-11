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
    Info,
    ShoppingCart,
    CheckCircle2,
    UserCircle,
    Wallet,
    PackageCheck,
    Clock,
    Unlock, // Thêm icon Unlock
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
    avatarUrl?: string;
}

const translateOrderStatus = (status: string) => {
    switch (status) {
        case 'PENDING': return 'Chờ xử lý';
        case 'CONFIRMED': return 'Đã xác nhận';
        case 'SHIPPING': return 'Đang giao hàng';
        case 'COMPLETED': return 'Hoàn thành';
        case 'CANCELLED': return 'Đã hủy';
        case 'RETURNED': return 'Hoàn trả';
        default: return status;
    }
};

const getOrderStatusColor = (status: string) => {
    switch (status) {
        case 'COMPLETED': return 'bg-emerald-50 text-emerald-600 border-emerald-100';
        case 'CANCELLED':
        case 'RETURNED': return 'bg-rose-50 text-rose-600 border-rose-100';
        case 'SHIPPING': return 'bg-blue-50 text-blue-600 border-blue-100';
        case 'CONFIRMED': return 'bg-purple-50 text-purple-600 border-purple-100';
        case 'PENDING': return 'bg-orange-50 text-orange-600 border-orange-100';
        default: return 'bg-slate-50 text-slate-600 border-slate-200';
    }
};

export default function CustomerDetailPage({
                                               params,
                                           }: {
    params: Promise<{ id: string }>;
}) {
    const router = useRouter();
    const resolvedParams = use(params);
    const customerId = resolvedParams.id;

    const [customer, setCustomer] = useState<CustomerData | null>(null);
    const [orders, setOrders] = useState<OrderData[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isOrdersLoading, setIsOrdersLoading] = useState(false);
    const [mounted, setMounted] = useState(false);

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
            const data = await customerService.getById(Number(customerId));
            setCustomer(data);
            fetchOrders(Number(customerId));
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
    }, [customerId, mounted, router]);

    // Hàm xử lý khôi phục tài khoản
    const handleRestoreAccount = async () => {
        if (!customer?.userId) return;
        const toastId = toast.loading("Đang khôi phục tài khoản...");
        try {
            await customerService.toggleStatus(customer.userId); // Gọi hàm toggle cũ (sẽ chuyển INACTIVE -> ACTIVE)
            toast.success("Khôi phục tài khoản thành công!", { id: toastId });
            fetchDetail(); // Fetch lại data để cập nhật UI
        } catch (error) {
            console.error("Lỗi khôi phục:", error);
            toast.error("Khôi phục thất bại. Vui lòng thử lại!", { id: toastId });
        }
    };

    if (!mounted) return null;

    if (isLoading)
        return (
            <div className="p-20 text-center flex flex-col items-center justify-center gap-4">
                <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-sm font-black uppercase text-slate-400 tracking-widest">
                    Đang truy xuất hồ sơ khách hàng...
                </p>
            </div>
        );

    return (
        <div className="space-y-4 pb-10">
            {/* Header */}
            <div className="flex items-center gap-4 mb-2">
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => router.back()}
                    className="h-8 w-8 text-slate-400 hover:text-blue-600"
                >
                    <ChevronLeft size={20} />
                </Button>
                <div className="flex flex-col flex-1">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <h1 className="text-[18px] font-black text-slate-800 uppercase tracking-tight">
                                Chi tiết hồ sơ khách hàng
                            </h1>
                            <span className="text-[10px] font-bold px-2 py-0.5 bg-blue-50 text-blue-600 border border-blue-100 rounded uppercase">
                  #{customerId}
                </span>
                        </div>
                        {/* NÚT KHÔI PHỤC TÀI KHOẢN KHI BỊ KHÓA */}
                        {customer?.userStatus === "INACTIVE" && (
                            <Button
                                onClick={handleRestoreAccount}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white h-8 px-4 text-[11px] font-bold uppercase rounded shadow-sm"
                            >
                                <Unlock size={14} className="mr-2" /> Khôi phục tài khoản
                            </Button>
                        )}
                    </div>
                    <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest flex items-center gap-1">
                        <UserCircle size={12} /> Hệ thống quản trị AgriShrimp
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                {/* Cột trái: Thông tin tổng quan */}
                <div className="lg:col-span-2 space-y-4">
                    <div className="bg-white border border-[#dcdcdc] rounded-none shadow-sm overflow-hidden">
                        <div className="p-5 border-b border-slate-50 flex flex-col items-center text-center">
                            <div className="relative mb-4 group">
                                <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center text-blue-600 border-2 border-blue-100 shadow-sm overflow-hidden">
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

                            <h2 className="text-[16px] font-black text-slate-800 uppercase leading-tight mb-1 mt-2">
                                {customer?.fullName || "Chưa cập nhật tên"}
                            </h2>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                                Mã định danh: {customer?.userId ? `USR-${customer.userId}` : "KHÔNG CÓ TÀI KHOẢN"}
                            </p>

                            <div className="mt-5 grid grid-cols-2 gap-2 w-full">
                                <div className="bg-emerald-50/50 p-3 border border-emerald-100 text-center">
                                    <p className="text-[9px] font-bold text-emerald-600 uppercase mb-1 flex items-center justify-center gap-1">
                                        <Wallet size={10} /> Chi tiêu
                                    </p>
                                    <p className="text-[13px] font-black text-emerald-700">
                                        {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(customer?.totalSpent || 0)}
                                    </p>
                                </div>
                                <div className="bg-blue-50/50 p-3 border border-blue-100 text-center">
                                    <p className="text-[9px] font-bold text-blue-600 uppercase mb-1 flex items-center justify-center gap-1">
                                        <ShoppingCart size={10} /> Đơn hàng
                                    </p>
                                    <p className="text-[13px] font-black text-blue-700">
                                        {customer?.totalOrders || 0}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="p-4 space-y-3">
                            <div className="flex items-start gap-3">
                                <Phone size={14} className="text-slate-300 mt-0.5 flex-shrink-0" />
                                <div className="flex flex-col">
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">Đường dây liên lạc</span>
                                    <span className="text-[12px] font-bold text-slate-700">{customer?.phone || "N/A"}</span>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <Mail size={14} className="text-slate-300 mt-0.5 flex-shrink-0" />
                                <div className="flex flex-col">
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">Hòm thư điện tử</span>
                                    <span className="text-[12px] font-bold text-slate-700">{customer?.email || "Chưa cập nhật"}</span>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <MapPin size={14} className="text-slate-300 mt-0.5 flex-shrink-0" />
                                <div className="flex flex-col">
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">Địa chỉ giao dịch</span>
                                    <span className="text-[11px] font-medium text-slate-600 leading-snug">{customer?.addressDetail || "Chưa cập nhật địa chỉ"}</span>
                                </div>
                            </div>

                            <div className="pt-3 border-t border-slate-50 flex justify-between items-center">
                <span className="text-[10px] font-black text-slate-400 uppercase">
                  Trạng thái vận hành
                </span>
                                <span
                                    className={cn(
                                        "text-[10px] font-black px-2 py-0.5 rounded-none border uppercase tracking-tighter",
                                        customer?.userStatus === "ACTIVE"
                                            ? "bg-emerald-50 text-emerald-600 border-emerald-100"
                                            : "bg-rose-50 text-rose-600 border-rose-100",
                                    )}
                                >
                  {customer?.userStatus === "ACTIVE" ? "ĐANG HOẠT ĐỘNG" : "ĐÃ BỊ KHÓA BỞI HỆ THỐNG"}
                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Cột phải: Tabs chi tiết */}
                <div className="lg:col-span-3">
                    <Tabs defaultValue="history" className="w-full">
                        <TabsList className="bg-white border border-[#dcdcdc] rounded-none p-1 w-full flex justify-start gap-0.5 h-auto shadow-sm">
                            <TabsTrigger
                                value="history"
                                className="text-[10px] font-black uppercase py-2 px-5 rounded-none data-[state=active]:bg-blue-600 data-[state=active]:text-white"
                            >
                                <History size={13} className="mr-1.5" /> Nhật ký giao dịch
                            </TabsTrigger>
                            <TabsTrigger
                                value="info"
                                className="text-[10px] font-black uppercase py-2 px-5 rounded-none data-[state=active]:bg-blue-600 data-[state=active]:text-white"
                            >
                                <Info size={13} className="mr-1.5" /> Chỉ số uy tín
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value="history" className="mt-0">
                            <div className="bg-white border border-t-0 border-[#dcdcdc] rounded-none shadow-sm overflow-hidden min-h-[400px]">
                                <Table>
                                    <TableHeader className="bg-slate-50/80">
                                        <TableRow className="hover:bg-transparent">
                                            <TableHead className="w-[120px] text-[10px] font-black uppercase tracking-widest p-3">Mã đơn</TableHead>
                                            <TableHead className="w-[130px] text-[10px] font-black uppercase tracking-widest p-3">Ngày giao dịch</TableHead>
                                            <TableHead className="w-[140px] text-right text-[10px] font-black uppercase tracking-widest p-3">Tổng tiền</TableHead>
                                            <TableHead className="w-[110px] text-center text-[10px] font-black uppercase tracking-widest p-3">Trạng thái</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {isOrdersLoading ? (
                                            <TableRow>
                                                <TableCell colSpan={4} className="h-40 text-center">
                                                    <div className="flex flex-col items-center gap-2 opacity-50">
                                                        <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                                                        <p className="text-[10px] font-bold uppercase tracking-widest">Đang tải lịch sử...</p>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ) : orders.length > 0 ? (
                                            orders.map((order) => (
                                                <TableRow key={order.id} className="hover:bg-slate-50/50 cursor-pointer transition-colors group">
                                                    <TableCell className="p-3">
                                                        <span className="text-[11px] font-black text-blue-600 group-hover:underline uppercase">#{order.code}</span>
                                                    </TableCell>
                                                    <TableCell className="p-3">
                                                        <div className="flex items-center gap-1 text-[10px] font-bold text-slate-500">
                                                            <Clock size={11} className="text-slate-300" />
                                                            {new Date(order.createdAt).toLocaleDateString('vi-VN')}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="p-3 text-right text-[12px] font-black text-slate-700">
                                                        {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(order.finalAmount || 0)}
                                                    </TableCell>
                                                    <TableCell className="p-3 text-center">
                            <span className={cn(
                                "text-[9px] font-black px-2 py-0.5 rounded-none uppercase tracking-tighter border",
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
                                                        <p className="text-[11px] font-black uppercase tracking-[0.2em]">Khách hàng chưa có giao dịch</p>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        </TabsContent>

                        <TabsContent value="info" className="mt-0">
                            <div className="bg-white border border-t-0 border-[#dcdcdc] rounded-none shadow-sm p-5">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="w-14 h-14 bg-orange-50 rounded-none flex items-center justify-center text-orange-600 border border-orange-100 shadow-sm">
                                            <CheckCircle2 size={28} />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
                                                Tỉ lệ nhận hàng thành công
                                            </p>
                                            <p className={cn(
                                                "text-[24px] font-black leading-none",
                                                (customer?.reputationScore || 0) >= 80 ? "text-emerald-600" :
                                                    (customer?.reputationScore || 0) >= 50 ? "text-orange-500" : "text-rose-600"
                                            )}>
                                                {customer?.reputationScore || 0} %
                                            </p>
                                        </div>
                                    </div>
                                    <div className={cn(
                                        "text-right px-3 py-2 border",
                                        (customer?.reputationScore || 0) >= 80 ? "bg-emerald-50 border-emerald-100" :
                                            (customer?.reputationScore || 0) >= 50 ? "bg-orange-50 border-orange-100" : "bg-rose-50 border-rose-100"
                                    )}>
                                        <p className={cn(
                                            "text-[10px] font-bold uppercase",
                                            (customer?.reputationScore || 0) >= 80 ? "text-emerald-600" :
                                                (customer?.reputationScore || 0) >= 50 ? "text-orange-600" : "text-rose-600"
                                        )}>
                                            Phân loại
                                        </p>
                                        <p className={cn(
                                            "text-[12px] font-black uppercase",
                                            (customer?.reputationScore || 0) >= 80 ? "text-emerald-700" :
                                                (customer?.reputationScore || 0) >= 50 ? "text-orange-700" : "text-rose-700"
                                        )}>
                                            {(customer?.reputationScore || 0) >= 80 ? "Đối tác uy tín" :
                                                (customer?.reputationScore || 0) >= 50 ? "Cần theo dõi" : "Rủi ro cao"}
                                        </p>
                                    </div>
                                </div>

                                {/* Thêm phần chú thích về quy tắc khóa tài khoản */}
                                <div className="mt-5 pt-3 border-t border-slate-100 text-[10px] text-slate-500 bg-slate-50 p-3">
                                    <h4 className="font-bold text-slate-700 mb-2 flex items-center gap-1 uppercase text-[11px]">
                                        <Info size={13} className="text-blue-500"/> Quy tắc hệ thống tự động:
                                    </h4>
                                    <ul className="list-disc pl-4 space-y-0.5">
                                        <li><span className="font-semibold text-orange-600">Dưới 50%</span>: Gửi Email cảnh báo tỷ lệ hủy/boom hàng cao.</li>
                                        <li><span className="font-semibold text-rose-600">Dưới 30%</span>: Hệ thống tự động <span className="font-bold">KHÓA TÀI KHOẢN</span>.</li>
                                    </ul>
                                </div>
                            </div>
                        </TabsContent>
                    </Tabs>
                </div>
            </div>
        </div>
    );
}