"use client";

import React, { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  ChevronLeft,
  RotateCcw,
  XCircle,
  Archive,
  ArrowLeft,
  Info,
  CheckCircle2,
  ChevronDown,
  Box,
  X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

// --- MOCK DATA ---
const RETURN_DETAIL = {
  id: "1006-R1",
  createdAt: "15/02/2026 17:50",
  orderRef: "#1006",
  customer: { name: "Bình Nguyễn", phone: "0986543987" },
  items: [
    { id: 1, name: "Thức ăn cho tôm", sku: "TACT010", image: "https://github.com/shadcn.png", packaging: "bao", quantity: 1, price: 110000, total: 110000, reason: "Không xác định" }
  ],
  info: { branch: "Cửa hàng chính", creator: "Admin Z-OneTeam", cancelDate: "---" },
  note: "Chưa có ghi chú"
};

export default function ReturnOrderDetailPage() {
  const router = useRouter();
  const params = useParams();
  const displayId = params?.id ? decodeURIComponent(params.id as string) : "1006-R1";

  // --- STATES QUẢN LÝ ---
  const [isRefundMode, setIsRefundMode] = useState(false); 
  const [showReceiveModal, setShowReceiveModal] = useState(false); // Modal nhận hàng
  
  const [receiveStatus, setReceiveStatus] = useState<"pending" | "received">("pending");
  const [refundStatus, setRefundStatus] = useState<"pending" | "refunded">("pending");

  // Form hoàn tiền
  const [refundAmount, setRefundAmount] = useState("110,000");
  const [refundMethod, setRefundMethod] = useState("cash");

  // --- HANDLERS ---
  const handleFinalizeRefund = () => {
      setRefundStatus("refunded");
      setIsRefundMode(false);
      toast.success(`Đã hoàn trả ${refundAmount}đ cho khách hàng`);
  };

  const handleConfirmReceiveSuccess = () => {
      setReceiveStatus("received");
      setShowReceiveModal(false);
      toast.success("Đã xác nhận nhận hàng trả lại thành công");
  };

  const handleCancelReturn = () => {
      if(confirm("Bạn có chắc muốn hủy phiếu trả hàng này?")) {
          toast.info("Đã hủy phiếu trả hàng");
          router.push("/admin/orders/returns");
      }
  };

  // ====================================================================================
  // 1. GIAO DIỆN HOÀN TRẢ (Màn hình Form Hoàn tiền)
  // ====================================================================================
  if (isRefundMode) {
    return (
      <div className="bg-[#f0f2f5] min-h-screen pb-10 font-sans text-slate-800">
        <div className="bg-white border-b border-slate-200 px-4 py-3 flex items-center gap-3 sticky top-0 z-30 shadow-sm text-slate-800">
          <Button variant="outline" size="icon" onClick={() => setIsRefundMode(false)} className="h-8 w-8 border-slate-300">
            <ArrowLeft size={18} />
          </Button>
          <h1 className="text-[18px] font-bold">Hoàn trả</h1>
        </div>

        <div className="max-w-[1200px] mx-auto p-4 grid grid-cols-12 gap-4 animate-in fade-in duration-300">
          <div className="col-span-12 lg:col-span-8 space-y-4 text-slate-800">
            <div className="bg-white rounded-sm shadow-sm border border-slate-200 overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-200 flex items-center gap-2 bg-white">
                <div className="w-5 h-5 rounded-full border border-orange-400 flex items-center justify-center p-[2px]">
                  <div className="w-full h-full rounded-full bg-orange-400"></div>
                </div>
                <span className="font-bold text-[14px]">Chưa hoàn trả</span>
              </div>

              <div className="p-0">
                <div className="flex text-[12px] font-bold text-slate-600 bg-[#f4f6f8] py-2 px-4 border-b border-slate-200 uppercase">
                  <div className="flex-1">Sản phẩm</div>
                  <div className="w-32 text-center">Số lượng</div>
                  <div className="w-24 text-right">Đơn giá</div>
                  <div className="w-24 text-right">Thành tiền</div>
                </div>
                {RETURN_DETAIL.items.map((item) => (
                  <div key={item.id} className="flex items-center py-4 px-4 bg-white border-b border-slate-50 last:border-0">
                    <div className="flex-1 flex gap-3">
                      <div className="w-12 h-12 bg-slate-100 rounded border border-slate-200 flex items-center justify-center shrink-0 overflow-hidden">
                        <img src={item.image} alt="img" className="w-full h-full object-cover" />
                      </div>
                      <div>
                        <p className="text-[13px] font-bold text-blue-600 hover:underline">{item.name}</p>
                        <div className="text-[11px] text-slate-500 flex gap-2"><span>{item.packaging}</span><span>|</span><span>{item.sku}</span></div>
                      </div>
                    </div>
                    <div className="w-32 text-center text-[13px]">{item.quantity}</div>
                    <div className="w-24 text-right text-[13px]">{item.price.toLocaleString()}đ</div>
                    <div className="w-24 text-right text-[13px] font-bold">{item.total.toLocaleString()}đ</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="col-span-12 lg:col-span-4 space-y-4">
            <div className="bg-white rounded-sm shadow-sm border border-slate-200 p-4 shadow-sm">
              <h3 className="font-bold text-[14px] mb-4 text-slate-800 uppercase tracking-tight">Tóm tắt</h3>
              <div className="space-y-2.5 text-[13px]">
                <div className="flex justify-between items-center text-slate-800">
                  <span className="text-slate-600">Tổng hoàn sản phẩm</span>
                  <span className="font-medium">110,000đ</span>
                </div>
                <p className="text-[11px] text-slate-400">1 sản phẩm</p>
                <div className="flex justify-between items-center text-slate-800"><span className="text-slate-600">Hoàn trả thuế</span><span>0đ</span></div>
                <div className="flex justify-between items-center text-slate-800"><span className="text-slate-600">Phí vận chuyển</span><span>0đ</span></div>
                <Separator className="my-2" />
                <div className="flex justify-between font-bold text-[15px] text-slate-900"><span>Tổng</span><span>110,000đ</span></div>
              </div>

              <div className="mt-8 space-y-5">
                <div className="space-y-1.5">
                  <label className="text-[13px] font-bold text-slate-700">Tùy chỉnh tiền hoàn</label>
                  <div className="relative">
                    <Input className="h-10 text-[14px] pr-8 font-bold text-slate-800 border-slate-300 focus-visible:ring-blue-500" value={refundAmount} onChange={(e) => setRefundAmount(e.target.value)} />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-[13px]">đ</span>
                  </div>
                  <p className="text-[11px] text-slate-500 italic font-medium">Có thể hoàn trả tối đa: 110,000đ</p>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[13px] font-bold text-slate-700">Phương thức hoàn tiền<span className="text-red-500">*</span></label>
                  <Select value={refundMethod} onValueChange={setRefundMethod}>
                    <SelectTrigger className="h-10 text-[13px] border-slate-300 font-medium"><SelectValue placeholder="Chọn phương thức" /></SelectTrigger>
                    <SelectContent><SelectItem value="cash">Tiền mặt</SelectItem><SelectItem value="transfer">Chuyển khoản</SelectItem></SelectContent>
                  </Select>
                </div>
                <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold h-11 text-[14px] shadow-sm transition-all" onClick={handleFinalizeRefund}>Hoàn tiền {refundAmount}đ</Button>
                <div className="flex items-center space-x-2 pt-1">
                  <Checkbox id="send-email" defaultChecked className="border-slate-300" />
                  <label htmlFor="send-email" className="text-[12px] text-slate-600 cursor-pointer">Gửi thông báo qua email đến khách hàng</label>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ====================================================================================
  // 2. GIAO DIỆN CHI TIẾT (Mặc định)
  // ====================================================================================
  return (
    <div className="bg-[#f0f2f5] min-h-screen pb-10 font-sans text-slate-800">
      <div className="bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between sticky top-0 z-30 shadow-sm text-slate-800">
         <div className="flex items-center gap-3">
             <Button variant="outline" size="icon" onClick={() => router.back()} className="h-8 w-8 border-slate-300 hover:bg-slate-50 shadow-sm"><ChevronLeft size={18}/></Button>
             <div className="flex items-center gap-2">
                 <h1 className="text-[18px] font-bold">#{displayId}</h1>
                 <span className={cn("px-2 py-0.5 rounded text-[11px] font-medium border transition-colors", receiveStatus === 'received' ? "bg-slate-100 text-slate-500 border-slate-300" : "bg-[#fff7e6] text-[#d46b08] border-[#ffbb96]")}>{receiveStatus === 'received' ? "Đã nhận hàng" : "Chưa nhận hàng"}</span>
                 <span className={cn("px-2 py-0.5 rounded text-[11px] font-medium border transition-colors", refundStatus === 'refunded' ? "bg-slate-100 text-slate-500 border-slate-300" : "bg-[#fff7e6] text-[#d46b08] border-[#ffbb96]")}>{refundStatus === 'refunded' ? "Đã hoàn trả" : "Chưa hoàn trả"}</span>
             </div>
         </div>
         <div className="flex items-center gap-2">
             <Button variant="ghost" className="h-8 text-[13px] text-slate-600 hover:bg-slate-50" onClick={handleCancelReturn}><XCircle size={14} className="mr-1.5 text-slate-400"/> Huỷ đơn trả hàng</Button>
             <Button variant="ghost" className="h-8 text-[13px] text-slate-600 hover:bg-slate-50"><Archive size={14} className="mr-1.5 text-slate-400"/> Lưu trữ</Button>
         </div>
      </div>

      <div className="max-w-[1200px] mx-auto p-4 flex items-center gap-2 text-[12px] text-slate-500 mb-2"><span>{RETURN_DETAIL.createdAt}</span></div>

      <div className="max-w-[1200px] mx-auto px-4 grid grid-cols-12 gap-4">
          <div className="col-span-12 lg:col-span-9 space-y-4 text-slate-800">
              <div className="bg-white rounded-sm shadow-sm border border-slate-200 overflow-hidden">
                  <div className="px-4 py-3 border-b border-slate-200 flex items-center gap-2 bg-white">
                      <div className={cn("w-6 h-6 rounded-full flex items-center justify-center text-white transition-colors", receiveStatus === 'received' ? "bg-blue-500" : "bg-blue-100 text-blue-600")}>
                          {receiveStatus === 'received' ? <CheckCircle2 size={14}/> : <RotateCcw size={14} />}
                      </div>
                      <span className="font-bold text-[14px]">{receiveStatus === 'received' ? "Đã trả hàng" : "Đang trả hàng"}</span>
                  </div>

                  <div className="p-4">
                      <div className="flex text-[12px] font-bold text-slate-800 border-b border-slate-100 pb-2 mb-3 uppercase">
                          <div className="flex-1">Sản phẩm</div>
                          <div className="w-24 text-center">Số lượng</div>
                          <div className="w-32 text-right">Đơn giá</div>
                          <div className="w-32 text-right">Thành tiền</div>
                      </div>

                      {RETURN_DETAIL.items.map((item) => (
                          <div key={item.id} className="flex items-start py-3 border-b border-dashed border-slate-100 last:border-0">
                              <div className="flex-1 flex gap-3">
                                  <div className="w-12 h-12 bg-slate-100 rounded border border-slate-200 flex items-center justify-center shrink-0 overflow-hidden"><img src={item.image} alt="product" className="w-full h-full object-cover"/></div>
                                  <div>
                                      <p className="text-[13px] font-bold text-blue-600 cursor-pointer hover:underline">{item.name}</p>
                                      <div className="text-[11px] text-slate-500 flex gap-2 font-medium"><span>{item.packaging}</span><span>|</span><span>{item.sku}</span></div>
                                      <p className="text-[11px] text-slate-800 mt-1.5 font-medium">• Lý do: {item.reason}</p>
                                      {refundStatus === 'refunded' && <p className="text-[11px] text-slate-800 mt-0.5 font-medium">• Đã hoàn trả</p>}
                                      {/* [MỚI] Hiển thị dòng Đã nhận lại hàng */}
                                      {receiveStatus === 'received' && (
                                          <p className="text-[11px] text-blue-600 mt-0.5 font-bold flex items-center gap-1">• <Box size={10}/> Đã nhận lại hàng <ChevronDown size={12}/></p>
                                      )}
                                  </div>
                              </div>
                              <div className="w-24 text-center text-[13px] pt-1 font-medium">{item.quantity}</div>
                              <div className="w-32 text-right text-[13px] pt-1 font-medium">{item.price.toLocaleString()}đ</div>
                              <div className="w-32 text-right text-[13px] font-bold pt-1">{item.total.toLocaleString()}đ</div>
                          </div>
                      ))}
                      
                      <div className="mt-8 space-y-3 border-t border-slate-100 pt-5 text-slate-800">
                          <div className="flex justify-between text-[13px]"><span className="text-slate-600 font-medium">Tổng tiền hàng</span><div className="flex gap-12 font-medium"><span className="text-slate-500 text-[12px]">1 sản phẩm</span><span className="text-slate-800">110,000đ</span></div></div>
                          <div className="flex justify-between text-[14px] font-bold text-slate-900 border-t border-slate-50 pt-2 uppercase"><span>Tổng hoàn trả</span><span>110,000đ</span></div>
                          {refundStatus === 'refunded' && (
                              <div className="flex justify-between text-[13px] pt-4 border-t border-slate-100 text-slate-800 font-medium">
                                  <div className="flex flex-col"><span>Hoàn tiền</span><span className="text-slate-400 text-[11px]">Tổng tiền hoàn</span></div>
                                  <div className="flex gap-32"><span className="text-slate-400">Tiền mặt</span><span className="font-bold">{refundAmount}đ</span></div>
                              </div>
                          )}
                      </div>

                      {/* NÚT BẤM DƯỚI CÙNG (Ẩn nếu đã xong cả 2 bước) */}
                      {!(refundStatus === 'refunded' && receiveStatus === 'received') && (
                        <div className="mt-10 pt-5 border-t border-slate-100 flex justify-end gap-3 transition-all">
                             {refundStatus === 'pending' && <div className="flex-1 flex items-center"><span className="text-[13px] font-bold">Gợi ý hoàn tiền</span><span className="text-[14px] font-bold ml-auto">110,000đ</span></div>}
                             {refundStatus === 'pending' && <Button variant="outline" className="border-blue-600 text-blue-600 hover:bg-blue-50 h-9 px-6 font-bold shadow-sm" onClick={() => setIsRefundMode(true)}>Hoàn tiền</Button>}
                             {receiveStatus === 'pending' && <Button className="bg-blue-600 hover:bg-blue-700 text-white h-9 px-6 font-bold shadow-sm" onClick={() => setShowReceiveModal(true)}>Nhận hàng</Button>}
                        </div>
                      )}
                  </div>
              </div>
          </div>

          <div className="col-span-12 lg:col-span-3 space-y-4 text-slate-800">
              <div className="bg-white rounded-sm shadow-sm border border-slate-200 p-4 shadow-sm">
                  <h3 className="font-bold text-[13px] mb-3 text-slate-800 uppercase tracking-tight">Khách hàng</h3>
                  <div className="space-y-1"><p className="text-[13px] text-blue-600 cursor-pointer hover:underline font-bold">{RETURN_DETAIL.customer.name}</p><p className="text-[12px] text-slate-600 font-medium">{RETURN_DETAIL.customer.phone}</p></div>
              </div>
              <div className="bg-white rounded-sm shadow-sm border border-slate-200 p-4 shadow-sm">
                  <h3 className="font-bold text-[13px] mb-3 text-slate-800 uppercase tracking-tight">Đơn hàng</h3>
                  <div><p className="text-[12px] text-slate-500 mb-1 font-medium">Mã đơn hàng</p><p className="text-[13px] text-blue-600 cursor-pointer hover:underline font-bold">{RETURN_DETAIL.orderRef}</p></div>
              </div>
              <div className="bg-white rounded-sm shadow-sm border border-slate-200 p-4 space-y-3.5 shadow-sm">
                  <h3 className="font-bold text-[13px] mb-1 text-slate-800 uppercase tracking-tight">Thông tin phiếu</h3>
                  <div className="flex justify-between items-start text-[12px]"><span className="text-slate-500 font-medium">Chi nhánh trả hàng</span><span className="text-slate-800 text-right w-[100px] font-semibold">{RETURN_DETAIL.info.branch}</span></div>
                  <div className="flex justify-between items-start text-[12px]"><span className="text-slate-500 font-medium">Ngày tạo</span><span className="text-slate-800 text-right font-semibold">{RETURN_DETAIL.createdAt}</span></div>
                  <div className="flex justify-between items-start text-[12px]"><span className="text-slate-500 font-medium">Ngày huỷ đơn trả</span><span className="text-slate-800 text-right font-semibold">{RETURN_DETAIL.info.cancelDate}</span></div>
                  <div className="flex justify-between items-start text-[12px]"><span className="text-slate-500 font-medium">Nhân viên trả hàng</span><span className="text-slate-800 text-right font-semibold">{RETURN_DETAIL.info.creator}</span></div>
              </div>
          </div>
      </div>

      {/* ====================================================================================
          MODAL XÁC NHẬN NHẬN HÀNG (image_d692da.png)
          ==================================================================================== */}
      {showReceiveModal && (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center animate-in fade-in duration-200">
            <div className="bg-white rounded-lg shadow-xl w-[900px] max-w-[95vw] overflow-hidden flex flex-col">
                <div className="flex justify-between items-center px-4 py-3 border-b border-slate-200">
                    <h2 className="text-[16px] font-bold text-slate-800">Xác nhận đã nhận hàng</h2>
                    <button onClick={() => setShowReceiveModal(false)} className="text-slate-400 hover:text-slate-600"><X size={20}/></button>
                </div>
                
                <div className="p-4 space-y-4">
                    <div className="bg-blue-50 border border-blue-200 rounded p-3 flex gap-3">
                        <Info size={18} className="text-blue-600 shrink-0 mt-0.5"/>
                        <div className="space-y-1">
                            <p className="text-[13px] font-bold text-blue-900">Tính năng nhận hàng</p>
                            <ul className="text-[12px] text-blue-800 space-y-0.5 list-disc pl-4">
                                <li>Được sử dụng khi bạn muốn kiểm tra và nhận hàng trả lại trước khi hoàn tiền cho khách hàng.</li>
                                <li>Với sản phẩm không đủ điều kiện nhập kho (ví dụ lỗi, hỏng, hoặc bị mất) bạn có thể không nhập lại kho sản phẩm.</li>
                            </ul>
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-[13px] font-bold text-slate-700">Kho nhận hàng trả lại</label>
                        <Select defaultValue="main">
                            <SelectTrigger className="h-10 text-[13px] border-slate-300 w-[300px]"><SelectValue/></SelectTrigger>
                            <SelectContent><SelectItem value="main">Cửa hàng chính</SelectItem></SelectContent>
                        </Select>
                    </div>

                    <div className="border border-slate-200 rounded overflow-hidden">
                        <div className="grid grid-cols-12 bg-[#f4f6f8] py-2 px-4 border-b border-slate-200 text-[12px] font-bold text-slate-600 uppercase">
                            <div className="col-span-5">Sản phẩm</div>
                            <div className="col-span-3 text-center">Số lượng nhận</div>
                            <div className="col-span-2 text-center">Nhập kho</div>
                            <div className="col-span-2 text-center">Không nhập kho</div>
                        </div>
                        <div className="p-4 grid grid-cols-12 items-center text-[13px]">
                            <div className="col-span-5 flex gap-3">
                                <div className="w-10 h-10 bg-slate-100 rounded border border-slate-200"></div>
                                <div>
                                    <p className="font-bold text-slate-800">Thức ăn cho tôm</p>
                                    <p className="text-[11px] text-slate-500">TACT010</p>
                                    <p className="text-[11px] text-blue-600 font-bold cursor-pointer hover:underline mt-1">Chọn lô hoàn hàng</p>
                                    <div className="mt-1 inline-flex items-center gap-1 bg-blue-50 text-blue-600 text-[11px] px-1.5 py-0.5 rounded border border-blue-100">
                                        DEFAULT | SL: 1 <X size={10} className="cursor-pointer"/>
                                    </div>
                                </div>
                            </div>
                            <div className="col-span-3 flex justify-center"><Input defaultValue="1" className="h-9 w-20 text-center border-slate-300"/></div>
                            <div className="col-span-2 flex justify-center"><Input defaultValue="1" className="h-9 w-20 text-center border-slate-300"/></div>
                            <div className="col-span-2 text-center font-bold">0</div>
                        </div>
                    </div>
                </div>

                <div className="px-4 py-3 border-t border-slate-200 flex justify-end gap-2 bg-slate-50">
                    <Button variant="outline" className="h-9 px-6 border-slate-300 text-slate-700" onClick={() => setShowReceiveModal(false)}>Huỷ</Button>
                    <Button className="bg-blue-600 hover:bg-blue-700 h-9 px-6 font-bold shadow-sm" onClick={handleConfirmReceiveSuccess}>Xác nhận</Button>
                </div>
            </div>
        </div>
      )}

    </div>
  );
}
