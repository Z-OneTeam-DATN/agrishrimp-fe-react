"use client";

import React, { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { 
  ChevronLeft, Phone, Mail, MapPin, User, 
  History, Info, Plus, Trash2, Edit, Save, 
  ShoppingCart, Calendar, FileText, CheckCircle2, 
  Clock, UserCircle, Search, Wallet, CreditCard
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function CustomerDetailPage() {
  const router = useRouter();
  const params = useParams();
  const customerId = params.id;

  // Mock data cho khách hàng
  const [customer, setCustomer] = useState({
    id: customerId,
    name: "Nguyễn Văn Đại",
    type: "Chủ ao nuôi",
    phone: "0901 222 333",
    email: "dai.nguyen@gmail.com",
    totalSpent: "125.000.000",
    totalOrders: 12,
    status: "Hoạt động",
    address: "Ấp 3, xã Vĩnh Trạch, TP. Bạc Liêu",
    contacts: [
      { id: 1, name: "Nguyễn Văn Đại", phone: "0901 222 333", email: "dai.nguyen@gmail.com", role: "Chủ sở hữu" },
      { id: 2, name: "Lê Văn Tám", phone: "0912 333 444", email: "tam.le@gmail.com", role: "Quản lý ao" },
    ],
    addresses: [
      { id: 1, label: "Nhà riêng", detail: "Ấp 3, xã Vĩnh Trạch, TP. Bạc Liêu" },
      { id: 2, label: "Ao nuôi số 1", detail: "Kênh Cầu Sập, Bạc Liêu" },
    ],
    notes: [
      { id: 1, content: "Khách hàng thân thiết, ưu tiên giao hàng nhanh vào sáng sớm.", time: "10/02/2026" }
    ]
  });

  // Mock lịch sử mua hàng
  const orderHistory = [
    { id: "DH-9921", status: "Hoàn thành", value: "15.500.000", branch: "Chi nhánh Bạc Liêu", createdAt: "10/02/2026", paymentStatus: "Đã thanh toán" },
    { id: "DH-9850", status: "Đang giao", value: "8.200.000", branch: "Chi nhánh Bạc Liêu", createdAt: "05/02/2026", paymentStatus: "Chờ thanh toán" },
    { id: "DH-9712", status: "Hoàn thành", value: "22.000.000", branch: "Tổng kho AgriShrimp", createdAt: "20/01/2026", paymentStatus: "Đã thanh toán" },
  ];

  return (
    <div className="space-y-4 pb-10">
      {/* Header */}
      <div className="flex items-center gap-4 mb-2">
        <Button variant="ghost" size="icon" onClick={() => router.back()} className="h-8 w-8 text-slate-400 hover:text-blue-600 transition-colors">
          <ChevronLeft size={20} />
        </Button>
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <h1 className="text-[18px] font-black text-slate-800 uppercase tracking-tight">Chi tiết khách hàng</h1>
            <span className="text-[10px] font-bold px-2 py-0.5 bg-blue-50 text-blue-600 border border-blue-100 rounded uppercase">#{customerId}</span>
          </div>
          <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest flex items-center gap-1">
            <UserCircle size={12} /> Quản lý khách hàng AgriShrimp
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Cột trái: Thông tin tổng quan */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white border border-[#dcdcdc] rounded-none shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-50 flex flex-col items-center text-center">
              <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center text-blue-600 mb-4 border-2 border-blue-100">
                <User size={40} />
              </div>
              <h2 className="text-[16px] font-black text-slate-800 uppercase leading-tight mb-1">{customer.name}</h2>
              <span className="text-[10px] font-bold px-2 py-0.5 bg-slate-100 text-slate-500 rounded uppercase">{customer.type}</span>
              
              <div className="mt-6 grid grid-cols-2 gap-3 w-full">
                <div className="bg-emerald-50/50 p-3 rounded-none border border-emerald-100 text-center">
                  <p className="text-[9px] font-bold text-emerald-600 uppercase mb-1 flex items-center justify-center gap-1">
                    <Wallet size={10} /> Tổng chi tiêu
                  </p>
                  <p className="text-[14px] font-black text-emerald-700">{customer.totalSpent} ₫</p>
                </div>
                <div className="bg-blue-50/50 p-3 rounded-none border border-blue-100 text-center">
                  <p className="text-[9px] font-bold text-blue-600 uppercase mb-1 flex items-center justify-center gap-1">
                    <ShoppingCart size={10} /> Đơn hàng
                  </p>
                  <p className="text-[14px] font-black text-blue-700">{customer.totalOrders}</p>
                </div>
              </div>
            </div>
            <div className="p-5 space-y-4">
              <div className="flex items-start gap-3">
                <Phone size={14} className="text-slate-300 mt-1" />
                <div className="flex flex-col">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">Điện thoại di động</span>
                  <span className="text-[13px] font-bold text-slate-700">{customer.phone}</span>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Mail size={14} className="text-slate-300 mt-1" />
                <div className="flex flex-col">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">Email liên hệ</span>
                  <span className="text-[13px] font-bold text-slate-700">{customer.email}</span>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <MapPin size={14} className="text-slate-300 mt-1" />
                <div className="flex flex-col">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">Địa chỉ thường trú</span>
                  <span className="text-[12px] font-medium text-slate-600 leading-snug">{customer.address}</span>
                </div>
              </div>
              <div className="pt-2 border-t border-slate-50 flex justify-between items-center">
                 <span className="text-[10px] font-black text-slate-400 uppercase">Trạng thái tài khoản</span>
                 <span className={cn(
                    "text-[10px] font-black px-2 py-0.5 rounded-none border uppercase",
                    customer.status === "Hoạt động" ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-rose-50 text-rose-600 border-rose-100"
                 )}>{customer.status}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Cột phải: Tabs chi tiết & Lịch sử */}
        <div className="lg:col-span-8">
          <Tabs defaultValue="info" className="w-full">
            <TabsList className="bg-white border border-[#dcdcdc] rounded-none p-1 w-full flex justify-start gap-1 h-auto shadow-sm">
              <TabsTrigger value="info" className="text-[11px] font-black uppercase py-2.5 px-6 rounded-none data-[state=active]:bg-blue-600 data-[state=active]:text-white">
                <Info size={14} className="mr-2" /> Hồ sơ chi tiết
              </TabsTrigger>
              <TabsTrigger value="history" className="text-[11px] font-black uppercase py-2.5 px-6 rounded-none data-[state=active]:bg-blue-600 data-[state=active]:text-white">
                <History size={14} className="mr-2" /> Lịch sử mua hàng
              </TabsTrigger>
            </TabsList>

            {/* TAB: Thông tin chi tiết */}
            <TabsContent value="info" className="space-y-4 mt-4">
              {/* Địa chỉ giao hàng */}
              <div className="bg-white border border-[#dcdcdc] rounded-none shadow-sm overflow-hidden">
                <div className="px-5 py-3 border-b border-slate-50 flex justify-between items-center bg-[#fcfcfc]">
                  <h3 className="text-[12px] font-black text-slate-700 uppercase flex items-center gap-2 tracking-wider">
                    <MapPin size={14} className="text-red-500" /> Danh sách địa chỉ nhận hàng
                  </h3>
                </div>
                <div className="divide-y divide-slate-100">
                  {customer.addresses.map((addr) => (
                    <div key={addr.id} className="p-4 flex items-start justify-between hover:bg-slate-50/50 transition-colors group">
                      <div className="flex items-start gap-4">
                        <div className="p-2 rounded-none bg-slate-100 text-slate-400 group-hover:bg-red-50 group-hover:text-red-500 transition-all">
                          <MapPin size={16} />
                        </div>
                        <div>
                          <p className="text-[11px] font-black text-slate-500 uppercase tracking-widest mb-0.5">{addr.label}</p>
                          <p className="text-[13px] font-medium text-slate-700">{addr.detail}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Khối Uy tín giao hàng - Dưới địa chỉ */}
              <div className="bg-white border border-[#dcdcdc] rounded-none shadow-sm p-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 bg-orange-50 rounded-none flex items-center justify-center text-orange-600 border border-orange-100 shadow-sm">
                          <CheckCircle2 size={28} />
                      </div>
                      <div>
                          <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-1">Tỷ lệ nhận hàng thành công</p>
                          <p className="text-[24px] font-black text-orange-700 leading-none">98.5%</p>
                      </div>
                    </div>
                    <div className="text-right bg-emerald-50 px-4 py-2 border border-emerald-100">
                      <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-tight">Đánh giá uy tín</p>
                      <p className="text-[13px] font-black text-emerald-700 uppercase tracking-tighter">Khách hàng tin cậy</p>
                    </div>
                </div>
                <div className="mt-6 pt-5 border-t border-slate-100">
                    <div className="flex justify-between items-center text-[11px] mb-2">
                      <span className="font-black text-slate-500 uppercase flex items-center gap-2">
                          <div className="w-2 h-2 bg-emerald-500"></div> Chỉ số tin cậy hệ thống
                      </span>
                      <span className="font-black text-emerald-600 tracking-widest">RANK: CAO</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-none overflow-hidden">
                      <div className="bg-emerald-500 h-full w-[98.5%] transition-all duration-1000"></div>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-3 italic">* Dữ liệu được tính toán dựa trên lịch sử giao dịch thực tế trong 12 tháng gần nhất.</p>
                </div>
              </div>
            </TabsContent>

            {/* TAB: Lịch sử mua hàng */}
            <TabsContent value="history" className="mt-4">
              <div className="bg-white border border-[#dcdcdc] rounded-none shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-slate-50 flex justify-between items-center bg-[#fcfcfc]">
                  <h3 className="text-[12px] font-black text-slate-700 uppercase flex items-center gap-2 tracking-wider">
                    <History size={14} className="text-blue-600" /> Nhật ký giao dịch mua hàng
                  </h3>
                  <div className="flex items-center gap-3 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={12} />
                    <Input placeholder="Tìm mã đơn hàng..." className="h-8 w-40 pl-8 text-[11px] border-slate-200 rounded-none shadow-none" />
                  </div>
                </div>
                <div className="p-0">
                  <Table className="table-custom border-collapse">
                    <TableHeader>
                      <TableRow className="bg-slate-50/50 border-b border-slate-100">
                        <TableHead className="text-[10px] font-black uppercase py-4 pl-5 text-slate-500">Mã đơn hàng</TableHead>
                        <TableHead className="text-[10px] font-black uppercase py-4 text-slate-500">Trạng thái</TableHead>
                        <TableHead className="text-[10px] font-black uppercase py-4 text-slate-500">Thanh toán</TableHead>
                        <TableHead className="text-[10px] font-black uppercase py-4 text-slate-500">Nơi mua</TableHead>
                        <TableHead className="text-[10px] font-black uppercase py-4 text-right text-slate-500">Giá trị đơn (₫)</TableHead>
                        <TableHead className="text-[10px] font-black uppercase py-4 pr-5 text-slate-500 text-center">Ngày tạo</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {orderHistory.map((order) => (
                        <TableRow key={order.id} className="border-b border-slate-50 hover:bg-blue-50/20 transition-colors cursor-pointer group">
                          <TableCell className="text-[12px] font-black text-blue-600 pl-5 group-hover:underline">#{order.id}</TableCell>
                          <TableCell>
                            <span className={cn(
                              "text-[9px] font-black px-2 py-0.5 rounded-none border uppercase tracking-tighter",
                              order.status === "Hoàn thành" ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-blue-50 text-blue-600 border-blue-100"
                            )}>
                              {order.status}
                            </span>
                          </TableCell>
                          <TableCell>
                             <div className="flex items-center gap-1 text-[10px] font-bold text-slate-500 uppercase">
                                <CreditCard size={10} className={order.paymentStatus === "Đã thanh toán" ? "text-emerald-500" : "text-amber-500"} />
                                {order.paymentStatus}
                             </div>
                          </TableCell>
                          <TableCell className="text-[11px] font-bold text-slate-500 uppercase">{order.branch}</TableCell>
                          <TableCell className="text-[13px] font-black text-slate-800 text-right">{order.value}</TableCell>
                          <TableCell className="text-[11px] font-bold text-slate-400 text-center pr-5">{order.createdAt}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                <div className="p-4 bg-slate-50/50 flex justify-between items-center border-t border-slate-100">
                   <p className="text-[10px] font-bold text-slate-400 uppercase italic">Hệ thống tự động thống kê từ dữ liệu bán hàng thực tế</p>
                   <Button variant="link" className="h-auto p-0 text-[10px] font-black text-blue-600 uppercase tracking-widest hover:no-underline hover:text-blue-800 transition-colors">Xem toàn bộ báo cáo mua hàng</Button>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
