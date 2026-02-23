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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { customerService } from "@/app/services/customer.service";

// 1. Cập nhật Interface khớp chính xác với DTO từ Backend
interface CustomerData {
  userId: number;
  fullName: string;
  email: string;
  phone: string;
  provider: string; // LOCAL hoặc GOOGLE
  userStatus: string; // Trạng thái tài khoản (Gốc)
  createdAt: string;
  
  // Dữ liệu từ bảng Customer (Có thể null)
  customerId?: number;
  customerStatus?: string;
  addressDetail?: string;
}

export default function CustomerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();

  // Giải nén params theo chuẩn Next.js 15
  const resolvedParams = use(params);
  const customerId = resolvedParams.id;

  const [customer, setCustomer] = useState<CustomerData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  // Tránh lỗi Hydration
  useEffect(() => {
    setMounted(true);
  }, []);

  // Fetch dữ liệu từ API
  useEffect(() => {
    const fetchDetail = async () => {
      if (!mounted) return;
      setIsLoading(true);
      try {
        const data = await customerService.getById(Number(customerId));
        setCustomer(data);
      } catch (error: any) {
        console.error("Lỗi fetch:", error);
        toast.error("Không thể tải thông tin khách hàng");
        router.push("/admin/customers");
      } finally {
        setIsLoading(false);
      }
    };
    fetchDetail();
  }, [customerId, mounted, router]);

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
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <h1 className="text-[18px] font-black text-slate-800 uppercase tracking-tight">
              Chi tiết hồ sơ khách hàng
            </h1>
            <span className="text-[10px] font-bold px-2 py-0.5 bg-blue-50 text-blue-600 border border-blue-100 rounded uppercase">
              #{customerId}
            </span>
          </div>
          <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest flex items-center gap-1">
            <UserCircle size={12} /> Hệ thống quản trị AgriShrimp
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Cột trái: Thông tin tổng quan */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white border border-[#dcdcdc] rounded-none shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-50 flex flex-col items-center text-center">
              <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center text-blue-600 mb-4 border-2 border-blue-100 shadow-sm relative group">
                <User size={40} />
                {/* Hiện Provider (GOOGLE/LOCAL) thay vì Role cũ */}
                {customer?.provider && (
                  <span className={cn(
                    "absolute -bottom-1 text-white text-[8px] font-black px-2 py-0.5 rounded-full uppercase",
                    customer.provider === 'GOOGLE' ? "bg-red-500" : "bg-blue-600"
                  )}>
                    {customer.provider}
                  </span>
                )}
              </div>
              <h2 className="text-[16px] font-black text-slate-800 uppercase leading-tight mb-1">
                {customer?.fullName || "Chưa cập nhật tên"}
              </h2>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                Mã định danh:{" "}
                {customer?.userId
                  ? `USR-${customer.userId}`
                  : "KHÔNG CÓ TÀI KHOẢN"}
              </p>

              <div className="mt-6 grid grid-cols-2 gap-3 w-full">
                <div className="bg-emerald-50/50 p-3 border border-emerald-100 text-center">
                  <p className="text-[9px] font-bold text-emerald-600 uppercase mb-1 flex items-center justify-center gap-1">
                    <Wallet size={10} /> Chi tiêu
                  </p>
                  <p className="text-[14px] font-black text-emerald-700">0 ₫</p>
                </div>
                <div className="bg-blue-50/50 p-3 border border-blue-100 text-center">
                  <p className="text-[9px] font-bold text-blue-600 uppercase mb-1 flex items-center justify-center gap-1">
                    <ShoppingCart size={10} /> Đơn hàng
                  </p>
                  <p className="text-[14px] font-black text-blue-700">0</p>
                </div>
              </div>
            </div>

            <div className="p-5 space-y-4">
              <div className="flex items-start gap-3">
                <Phone size={14} className="text-slate-300 mt-1" />
                <div className="flex flex-col">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">
                    Đường dây liên lạc
                  </span>
                  <span className="text-[13px] font-bold text-slate-700">
                    {customer?.phone || "N/A"}
                  </span>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Mail size={14} className="text-slate-300 mt-1" />
                <div className="flex flex-col">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">
                    Hòm thư điện tử
                  </span>
                  <span className="text-[13px] font-bold text-slate-700">
                    {customer?.email || "Chưa cập nhật"}
                  </span>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <MapPin size={14} className="text-slate-300 mt-1" />
                <div className="flex flex-col">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">
                    Địa chỉ thường trú
                  </span>
                  <span className="text-[12px] font-medium text-slate-600 leading-snug">
                    {customer?.addressDetail || "Chưa cập nhật địa chỉ cụ thể"}
                  </span>
                </div>
              </div>
              
              <div className="pt-2 border-t border-slate-50 flex justify-between items-center">
                <span className="text-[10px] font-black text-slate-400 uppercase">
                  Trạng thái vận hành
                </span>
                {/* SỬ DỤNG userStatus ĐỂ CHECK ĐÚNG CHUẨN */}
                <span
                  className={cn(
                    "text-[10px] font-black px-2 py-0.5 rounded-none border uppercase tracking-tighter",
                    customer?.userStatus === "ACTIVE"
                      ? "bg-emerald-50 text-emerald-600 border-emerald-100"
                      : "bg-rose-50 text-rose-600 border-rose-100",
                  )}
                >
                  {customer?.userStatus === "ACTIVE"
                    ? "ĐANG HOẠT ĐỘNG"
                    : "TẠM KHÓA"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Cột phải: Tabs chi tiết */}
        <div className="lg:col-span-8">
          <Tabs defaultValue="history" className="w-full">
            <TabsList className="bg-white border border-[#dcdcdc] rounded-none p-1 w-full flex justify-start gap-1 h-auto shadow-sm">
              <TabsTrigger
                value="history"
                className="text-[11px] font-black uppercase py-2.5 px-6 rounded-none data-[state=active]:bg-blue-600 data-[state=active]:text-white"
              >
                <History size={14} className="mr-2" /> Nhật ký giao dịch
              </TabsTrigger>
              <TabsTrigger
                value="info"
                className="text-[11px] font-black uppercase py-2.5 px-6 rounded-none data-[state=active]:bg-blue-600 data-[state=active]:text-white"
              >
                <Info size={14} className="mr-2" /> Chỉ số uy tín
              </TabsTrigger>
            </TabsList>

            <TabsContent value="history" className="mt-4">
              <div className="bg-white border border-[#dcdcdc] rounded-none shadow-sm overflow-hidden text-center p-20">
                <div className="flex flex-col items-center gap-2">
                  <ShoppingCart size={32} className="text-slate-100" />
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                    Hiện tại khách hàng chưa phát sinh đơn hàng
                  </p>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="info" className="mt-4">
              <div className="bg-white border border-[#dcdcdc] rounded-none shadow-sm p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-orange-50 rounded-none flex items-center justify-center text-orange-600 border border-orange-100 shadow-sm">
                      <CheckCircle2 size={28} />
                    </div>
                    <div>
                      <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-1">
                        Tỉ lệ thanh toán đúng hạn
                      </p>
                      <p className="text-[24px] font-black text-orange-700 leading-none">
                        -- %
                      </p>
                    </div>
                  </div>
                  <div className="text-right bg-emerald-50 px-4 py-2 border border-emerald-100">
                    <p className="text-[10px] font-bold text-emerald-600 uppercase">
                      Phân loại
                    </p>
                    <p className="text-[13px] font-black text-emerald-700 uppercase">
                      Đối tác mới
                    </p>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}