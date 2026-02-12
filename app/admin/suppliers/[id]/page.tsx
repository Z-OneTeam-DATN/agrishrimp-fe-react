"use client";

import React, { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { 
  ChevronLeft, Phone, Mail, MapPin, User, 
  History, Info, Plus, Trash2, Edit, Save, 
  DollarSign, Calendar, FileText, CheckCircle2, 
  Clock, Warehouse, Search
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from "@/components/ui/table";
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger 
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function SupplierDetailPage() {
  const router = useRouter();
  const params = useParams();
  const supplierId = params.id;

  // Mock data cho nhà cung cấp
  const [supplier, setSupplier] = useState({
    id: supplierId,
    name: "CÔNG TY CỔ PHẦN CHĂN NUÔI C.P. VIỆT NAM",
    group: "Thức ăn chăn nuôi",
    taxCode: "0101234567",
    phone: "028 3844 1111",
    email: "contact@cp.com.vn",
    debt: "150.000.000",
    status: "Đang giao dịch",
    address: "KCN Biên Hòa 2, Đồng Nai",
    contacts: [
      { id: 1, name: "Nguyễn Văn An", phone: "0901234567", email: "an.nv@cp.com.vn", position: "Trưởng phòng KD" },
    ],
    addresses: [
      { id: 1, label: "Trụ sở chính", detail: "KCN Biên Hòa 2, TP. Biên Hòa, Đồng Nai" },
      { id: 2, label: "Kho miền Tây", detail: "KCN Trà Nóc, Cần Thơ" },
    ],
    notes: [
      { id: 1, content: "Nhà cung cấp chiến lược, chiết khấu 5% cho đơn hàng trên 500 triệu", time: "20/01/2026" }
    ]
  });

  // Mock lịch sử nhập hàng
  const importHistory = [
    { id: "NH00124", status: "Đã nhận hàng", value: "25.000.000", branch: "Chi nhánh Cần Thơ", createdAt: "10/02/2026", updatedAt: "11/02/2026" },
    { id: "NH00115", status: "Chờ nhận hàng", value: "45.000.000", branch: "Chi nhánh Sóc Trăng", createdAt: "05/02/2026", updatedAt: "05/02/2026" },
    { id: "NH00098", status: "Đã nhận hàng", value: "12.500.000", branch: "Chi nhánh Bạc Liêu", createdAt: "28/01/2026", updatedAt: "29/01/2026" },
  ];

  return (
    <div className="space-y-4 pb-10">
      {/* Header */}
      <div className="flex items-center gap-4 mb-2">
        <Button variant="ghost" size="icon" onClick={() => router.back()} className="h-8 w-8 text-slate-400 hover:text-emerald-600 transition-colors">
          <ChevronLeft size={20} />
        </Button>
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <h1 className="text-[18px] font-black text-slate-800 uppercase tracking-tight">Chi tiết nhà cung cấp</h1>
            <span className="text-[10px] font-bold px-2 py-0.5 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded uppercase">#{supplierId}</span>
          </div>
          <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest flex items-center gap-1">
            <Warehouse size={12} /> Hệ thống quản lý nguồn cung ứng AgriShrimp
          </p>
        </div>
        <div className="ms-auto flex gap-2">
          <Button variant="outline" className="h-8 text-[11px] font-bold border-slate-200 uppercase">
            <Edit size={14} className="mr-1.5" /> Chỉnh sửa
          </Button>
          <Button className="h-8 text-[11px] font-bold bg-emerald-600 hover:bg-emerald-700 uppercase">
            <Save size={14} className="mr-1.5" /> Lưu thay đổi
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Cột trái: Thông tin tổng quan */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white border border-[#dcdcdc] rounded-[4px] shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-50 flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-600 mb-3 border-2 border-emerald-100">
                <Warehouse size={32} />
              </div>
              <h2 className="text-[15px] font-black text-slate-800 uppercase leading-tight mb-1">{supplier.name}</h2>
              <p className="text-[11px] text-slate-400 font-bold uppercase">{supplier.group}</p>
              <div className="mt-4 grid grid-cols-2 gap-2 w-full">
                <div className="bg-slate-50 p-2 rounded text-center">
                  <p className="text-[9px] font-bold text-slate-400 uppercase mb-0.5">Nợ hiện tại</p>
                  <p className="text-[13px] font-black text-rose-600">{supplier.debt} ₫</p>
                </div>
                <div className="bg-slate-50 p-2 rounded text-center">
                  <p className="text-[9px] font-bold text-slate-400 uppercase mb-0.5">Trạng thái</p>
                  <p className="text-[10px] font-bold text-emerald-600 uppercase">{supplier.status}</p>
                </div>
              </div>
            </div>
            <div className="p-4 space-y-3">
              <div className="flex items-start gap-3">
                <Phone size={14} className="text-slate-300 mt-1" />
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Điện thoại</span>
                  <span className="text-[13px] font-bold text-slate-700">{supplier.phone}</span>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Mail size={14} className="text-slate-300 mt-1" />
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Email</span>
                  <span className="text-[13px] font-bold text-slate-700">{supplier.email}</span>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <FileText size={14} className="text-slate-300 mt-1" />
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Mã số thuế</span>
                  <span className="text-[13px] font-bold text-slate-700 font-mono">{supplier.taxCode}</span>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <MapPin size={14} className="text-slate-300 mt-1" />
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Địa chỉ chính</span>
                  <span className="text-[12px] font-medium text-slate-600 leading-snug">{supplier.address}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Cột phải: Tabs chi tiết & Lịch sử */}
        <div className="lg:col-span-8">
          <Tabs defaultValue="info" className="w-full">
            <TabsList className="bg-white border border-[#dcdcdc] rounded-[4px] p-1 w-full flex justify-start gap-1 h-auto shadow-sm">
              <TabsTrigger value="info" className="text-[11px] font-bold uppercase py-2 px-4 rounded-[3px] data-[state=active]:bg-emerald-600 data-[state=active]:text-white">
                <Info size={14} className="mr-1.5" /> Thông tin chi tiết
              </TabsTrigger>
              <TabsTrigger value="history" className="text-[11px] font-bold uppercase py-2 px-4 rounded-[3px] data-[state=active]:bg-emerald-600 data-[state=active]:text-white">
                <History size={14} className="mr-1.5" /> Lịch sử nhập hàng
              </TabsTrigger>
            </TabsList>

            {/* TAB: Thông tin chi tiết */}
            <TabsContent value="info" className="space-y-4 mt-4">
              {/* Liên hệ */}
              <div className="bg-white border border-[#dcdcdc] rounded-[4px] shadow-sm overflow-hidden">
                <div className="px-4 py-3 border-b border-slate-50 flex justify-between items-center bg-[#fcfcfc]">
                  <h3 className="text-[12px] font-black text-slate-700 uppercase flex items-center gap-2">
                    <User size={14} className="text-blue-500" /> Người liên hệ
                  </h3>
                  <Button variant="ghost" size="sm" className="h-7 text-[10px] font-black text-emerald-600 uppercase hover:bg-emerald-50">
                    <Plus size={14} className="mr-1" /> Thêm mới liên hệ
                  </Button>
                </div>
                <div className="p-0">
                  <Table className="table-custom border-collapse">
                    <TableHeader>
                      <TableRow className="bg-slate-50 border-b border-slate-100">
                        <TableHead className="text-[10px] font-bold uppercase py-2 pl-4">Họ tên</TableHead>
                        <TableHead className="text-[10px] font-bold uppercase py-2">Chức vụ</TableHead>
                        <TableHead className="text-[10px] font-bold uppercase py-2">Điện thoại</TableHead>
                        <TableHead className="text-[10px] font-bold uppercase py-2">Email</TableHead>
                        <TableHead className="text-[10px] font-bold uppercase py-2 text-right pr-4">Hành động</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {supplier.contacts.map((contact) => (
                        <TableRow key={contact.id} className="border-b border-slate-50 hover:bg-blue-50/30 transition-colors">
                          <TableCell className="text-[12px] font-bold text-slate-700 pl-4">{contact.name}</TableCell>
                          <TableCell className="text-[11px] text-slate-400 font-medium">{contact.position}</TableCell>
                          <TableCell className="text-[11px] font-bold text-slate-600">{contact.phone}</TableCell>
                          <TableCell className="text-[11px] text-slate-500 underline">{contact.email}</TableCell>
                          <TableCell className="text-right pr-4">
                             <div className="flex justify-end gap-1">
                                <button className="p-1.5 text-slate-300 hover:text-emerald-600 transition-colors"><Edit size={12}/></button>
                                <button className="p-1.5 text-slate-300 hover:text-rose-500 transition-colors"><Trash2 size={12}/></button>
                             </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>

              {/* Địa chỉ */}
              <div className="bg-white border border-[#dcdcdc] rounded-[4px] shadow-sm overflow-hidden">
                <div className="px-4 py-3 border-b border-slate-50 flex justify-between items-center bg-[#fcfcfc]">
                  <h3 className="text-[12px] font-black text-slate-700 uppercase flex items-center gap-2">
                    <MapPin size={14} className="text-red-500" /> Danh sách địa chỉ
                  </h3>
                  <Button variant="ghost" size="sm" className="h-7 text-[10px] font-black text-emerald-600 uppercase hover:bg-emerald-50">
                    <Plus size={14} className="mr-1" /> Thêm mới địa chỉ
                  </Button>
                </div>
                <div className="divide-y divide-slate-50">
                  {supplier.addresses.map((addr) => (
                    <div key={addr.id} className="p-3 flex items-start justify-between hover:bg-slate-50 transition-colors group">
                      <div className="flex items-start gap-3">
                        <div className="p-1.5 rounded bg-slate-100 text-slate-400 group-hover:bg-red-50 group-hover:text-red-500 transition-all">
                          <MapPin size={14} />
                        </div>
                        <div>
                          <p className="text-[11px] font-black text-slate-500 uppercase tracking-tighter">{addr.label}</p>
                          <p className="text-[12px] font-medium text-slate-700">{addr.detail}</p>
                        </div>
                      </div>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button className="p-1.5 text-slate-300 hover:text-emerald-600"><Edit size={12}/></button>
                        <button className="p-1.5 text-slate-300 hover:text-rose-500"><Trash2 size={12}/></button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Ghi chú */}
              <div className="bg-white border border-[#dcdcdc] rounded-[4px] shadow-sm overflow-hidden">
                <div className="px-4 py-3 border-b border-slate-50 flex justify-between items-center bg-[#fcfcfc]">
                  <h3 className="text-[12px] font-black text-slate-700 uppercase flex items-center gap-2">
                    <FileText size={14} className="text-orange-500" /> Ghi chú nghiệp vụ
                  </h3>
                  <Button variant="ghost" size="sm" className="h-7 text-[10px] font-black text-emerald-600 uppercase hover:bg-emerald-50">
                    <Plus size={14} className="mr-1" /> Thêm ghi chú
                  </Button>
                </div>
                <div className="p-4 space-y-3">
                  {supplier.notes.map((note) => (
                    <div key={note.id} className="relative pl-4 border-l-2 border-emerald-500 bg-emerald-50/30 p-3 rounded-r">
                      <p className="text-[12px] text-slate-600 leading-relaxed font-medium italic">"{note.content}"</p>
                      <div className="mt-2 flex items-center justify-between">
                        <p className="text-[10px] text-slate-400 font-bold uppercase flex items-center gap-1">
                          <Clock size={10} /> Ngày tạo: {note.time}
                        </p>
                        <button className="text-[10px] font-bold text-rose-500 uppercase hover:underline">Xóa ghi chú</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>

            {/* TAB: Lịch sử nhập hàng */}
            <TabsContent value="history" className="mt-4">
              <div className="bg-white border border-[#dcdcdc] rounded-[4px] shadow-sm overflow-hidden">
                <div className="px-4 py-3 border-b border-slate-50 flex justify-between items-center bg-[#fcfcfc]">
                  <h3 className="text-[12px] font-black text-slate-700 uppercase flex items-center gap-2">
                    <History size={14} className="text-emerald-600" /> Lịch sử nhập hàng
                  </h3>
                  <div className="flex items-center gap-2 relative">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-300" size={12} />
                    <Input placeholder="Tìm mã đơn..." className="h-7 w-32 pl-7 text-[11px] border-slate-200" />
                  </div>
                </div>
                <div className="p-0">
                  <Table className="table-custom border-collapse">
                    <TableHeader>
                      <TableRow className="bg-slate-50 border-b border-slate-100">
                        <TableHead className="text-[10px] font-bold uppercase py-3 pl-4">Mã đơn nhập</TableHead>
                        <TableHead className="text-[10px] font-bold uppercase py-3">Trạng thái</TableHead>
                        <TableHead className="text-[10px] font-bold uppercase py-3">Chi nhánh nhận</TableHead>
                        <TableHead className="text-[10px] font-bold uppercase py-3 text-right">Giá trị đơn (₫)</TableHead>
                        <TableHead className="text-[10px] font-bold uppercase py-3">Ngày tạo</TableHead>
                        <TableHead className="text-[10px] font-bold uppercase py-3 pr-4">Cập nhật cuối</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {importHistory.map((item) => (
                        <TableRow key={item.id} className="border-b border-slate-50 hover:bg-emerald-50/20 transition-colors cursor-pointer group">
                          <TableCell className="text-[12px] font-black text-emerald-600 pl-4 group-hover:underline">#{item.id}</TableCell>
                          <TableCell>
                            <span className={cn(
                              "text-[9px] font-bold px-1.5 py-0.5 rounded border uppercase tracking-tighter",
                              item.status === "Đã nhận hàng" ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-orange-50 text-orange-600 border-orange-100"
                            )}>
                              {item.status}
                            </span>
                          </TableCell>
                          <TableCell className="text-[11px] font-bold text-slate-500 uppercase">{item.branch}</TableCell>
                          <TableCell className="text-[12px] font-black text-slate-800 text-right">{item.value}</TableCell>
                          <TableCell className="text-[11px] font-medium text-slate-400">{item.createdAt}</TableCell>
                          <TableCell className="text-[11px] font-medium text-slate-400 pr-4 italic">{item.updatedAt}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                <div className="p-3 bg-slate-50/50 flex justify-between items-center border-t border-slate-100">
                   <p className="text-[10px] font-bold text-slate-400 uppercase italic">Thống kê dữ liệu thực tế tại chi nhánh</p>
                   <Button variant="link" className="h-auto p-0 text-[10px] font-black text-emerald-600 uppercase">Xem toàn bộ báo cáo nợ NCC</Button>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
