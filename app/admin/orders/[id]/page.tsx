"use client";

import React, { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronLeft,
  Printer,
  MoreHorizontal,
  Edit,
  CheckCircle2,
  Package,
  ChevronRight,
  PenLine,
  ChevronDown,
  Store,
  Clock,
  User,
  MapPin,
  RotateCcw,
  Copy,
  X,
  Plus,
  Search,
  ArrowLeft,
  Trash2,
  AlertCircle,
  Loader2,
  Truck,
  ArrowUpDown,
  FileCheck // Icon cho Đã đóng gói
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

// --- MOCK LIST ---
const BANK_LIST = [{ id: "vcb", name: "Vietcombank", code: "VCB" }, { id: "mb", name: "MBBank", code: "MB" }];
const STAFF_LIST = [
    { id: "admin", name: "Admin Z-OneTeam" },
    { id: "staff1", name: "Nguyễn Văn A" },
    { id: "staff2", name: "Trần Thị B" },
];

const SHIPPING_PARTNERS_MOCK = [
    { id: "sapo", name: "Sapo Express", logo: "Sapo", connected: true, error: "Bạn đang vượt quá mức tín dụng cho phép..." },
    { id: "vnpost", name: "Vietnam Post", logo: "VNPost", connected: false },
    { id: "viettel", name: "Viettel Post", logo: "Viettel", connected: false },
];

export default function OrderDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();

  // --- STATES QUẢN LÝ LOGIC CHUNG ---
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<'unpaid' | 'paid'>('unpaid');
  
  // TRẠNG THÁI XỬ LÝ ĐƠN HÀNG: 'unfulfilled' -> 'ready_to_pack' -> 'shipping' -> 'delivered'
  const [fulfillmentStatus, setFulfillmentStatus] = useState<'unfulfilled' | 'ready_to_pack' | 'shipping' | 'delivered'>('unfulfilled');
  
  // TRẠNG THÁI ĐÓNG GÓI CHI TIẾT
  const [packingStatus, setPackingStatus] = useState<'pending' | 'labeling' | 'packed'>('pending');

  const [isPrinted, setIsPrinted] = useState(false);
  const [printedTime, setPrintedTime] = useState("");

  // --- STATES CHO TRẢ HÀNG ---
  const [isReturnMode, setIsReturnMode] = useState(false);
  const [returnQuantities, setReturnQuantities] = useState<Record<number, number>>({});
  const [returnReason, setReturnReason] = useState("");

  // --- STATES MODALS ---
  const [showQRModal, setShowQRModal] = useState(false);
  const [showAddBankModal, setShowAddBankModal] = useState(false);
  const [showReceiveMoneyModal, setShowReceiveMoneyModal] = useState(false);
  const [showFulfillmentModal, setShowFulfillmentModal] = useState(false);
  const [showBatchModal, setShowBatchModal] = useState(false); 
  const [showRequestPackingModal, setShowRequestPackingModal] = useState(false); 
  const [showChangePackingModal, setShowChangePackingModal] = useState(false);
  const [showPushShippingModal, setShowPushShippingModal] = useState(false);
  const [showConfirmDeliveredModal, setShowConfirmDeliveredModal] = useState(false);

  const [shippingTab, setShippingTab] = useState<'integrated' | 'self'>('integrated');

  // Logic đóng gói & vận chuyển
  const [isFulfillmentMode, setIsFulfillmentMode] = useState(false); 
  const [selectedPacker, setSelectedPacker] = useState("admin"); 
  const [tempPackingStatus, setTempPackingStatus] = useState<string>("");
  const [activeProductId, setActiveProductId] = useState<number | string | null>(null);
  const [batchRows, setBatchRows] = useState<any[]>([]);
  const [fulfillmentItems, setFulfillmentItems] = useState<any[]>([]); 

  // --- FORM STATES KHÁC ---
  const [receiveMoneyForm, setReceiveMoneyForm] = useState({ method: "cash", amount: "110,000", reference: "" });
  const [bankAccounts, setBankAccounts] = useState<any[]>([]);
  const [selectedBankId, setSelectedBankId] = useState<string>("");
  const [newBankForm, setNewBankForm] = useState({ bank: "", accountNumber: "", accountName: "", note: "" });

  const [orderHistory, setOrderHistory] = useState([
    { time: "01:10", date: "15/02/2026", actor: "Admin Z-OneTeam", action: "Đã tạo mới đơn hàng" },
    { time: "01:10", date: "15/02/2026", actor: "Admin Z-OneTeam", action: "Khoản thanh toán 110,000 VND đang chờ xử lý", detail: "COD" },
    { time: "01:11", date: "15/02/2026", actor: "Admin Z-OneTeam", action: "Thêm mới khách hàng Bình Nguyễn vào đơn hàng" },
    { time: "01:11", date: "15/02/2026", actor: "Admin Z-OneTeam", action: "Đã thêm số điện thoại liên hệ 0986543987 vào đơn hàng" },
    { time: "01:11", date: "15/02/2026", actor: "Admin Z-OneTeam", action: "Đã thêm địa chỉ giao hàng cho đơn hàng" },
  ]);

  // --- MOCK DATA ---
  const order = {
    id: "#1002",
    createdAt: "15/02/2026 01:10",
    fulfillmentStatusLabel: fulfillmentStatus === 'delivered' ? "Đã giao hàng" : (fulfillmentStatus === 'shipping' ? "Đang giao hàng" : (fulfillmentStatus === 'ready_to_pack' ? "Đang giao dịch" : "Chưa xử lý")), 
    customer: {
      name: "Bình Nguyễn",
      phone: "0986543987",
      email: "Không có email",
      group: "Không áp dụng nhóm khách hàng",
      shippingAddress: "7890, Xã Thanh Mai, Huyện Chợ Mới, Bắc Kạn, Vietnam",
      billingAddress: "7890, Xã Thanh Mai, Huyện Chợ Mới, Bắc Kạn, Vietnam"
    },
    items: [
      { id: 1, name: "Thức ăn cho tôm", sku: "TACT010", unit: "kg", packaging: "bao", quantity: 1, price: 110000, total: 110000, image: "https://github.com/shadcn.png" }
    ],
    pricing: { subtotal: 110000, total: 110000 },
    info: { branch: "Cửa hàng chính", source: "Admin", staff: "Admin Z-OneTeam", creator: "Admin Z-OneTeam", deliveryDate: "Chưa có ngày hẹn giao" }
  };

  // --- LOGIC TÍNH TOÁN ---
  const totalReturnCount = useMemo(() => Object.values(returnQuantities).reduce((a, b) => a + b, 0), [returnQuantities]);
  const totalReturnAmount = useMemo(() => order.items.reduce((sum, item) => sum + ((returnQuantities[item.id] || 0) * item.price), 0), [returnQuantities, order.items]);

  const getPackingStatusLabel = (status: string) => {
      switch(status) {
          case 'pending': return "Chờ đóng gói";
          case 'labeling': return "Chờ dán phiếu giao hàng";
          case 'packed': return "Đã đóng gói";
          default: return "Chờ đóng gói";
      }
  }

  // --- HANDLERS ---
  const handleConfirmOrder = () => {
    setIsConfirmed(true);
    addHistoryLog("Đã xác nhận đơn hàng");
    toast.success("Xác nhận đơn hàng thành công!");
  };

  const handleEnterFulfillmentMode = () => { setFulfillmentItems(order.items.map(i => ({ ...i, selectedBatch: null }))); setIsFulfillmentMode(true); }
  const handleCancelFulfillmentMode = () => { setIsFulfillmentMode(false); setFulfillmentItems([]); }
  const handleOpenBatchModal = (item: any) => { setActiveProductId(item.id); setBatchRows([{ id: 1, code: "DEFAULT", quantity: 1, expiry: "---", status: "Còn hạn" }, { id: 2, code: "Lô Mới 2026", quantity: 0, expiry: "01/01/2026", status: "Còn hạn" }]); setShowBatchModal(true); };
  const handleBatchQtyChange = (index: number, value: string) => { const newQty = Number(value); const newRows = [...batchRows]; newRows[index].quantity = newQty; if (newRows.length === 2) { const otherIndex = index === 0 ? 1 : 0; newRows[otherIndex].quantity = 1 - newQty; } setBatchRows(newRows); };
  const handleConfirmBatch = () => { if (activeProductId !== null) { setFulfillmentItems(prev => prev.map(item => { if (item.id === activeProductId) { return { ...item, selectedBatch: { name: batchRows[0].code, quantity: item.quantity } }; } return item; })); setShowBatchModal(false); setActiveProductId(null); toast.success("Đã chọn lô thành công"); } };
  const handleSubmitFulfillment = () => { const missingBatch = fulfillmentItems.find(i => !i.selectedBatch); if (missingBatch) { toast.error("Vui lòng chọn lô cho tất cả sản phẩm"); return; } setShowRequestPackingModal(true); }
  const handleFinalizePackingRequest = () => { setShowRequestPackingModal(false); setIsFulfillmentMode(false); setFulfillmentStatus('ready_to_pack'); const packerName = STAFF_LIST.find(s => s.id === selectedPacker)?.name || "Admin Z-OneTeam"; addHistoryLog("Yêu cầu đóng gói", `Gán cho nhân viên: ${packerName}`); toast.success("Tạo yêu cầu đóng gói thành công"); }
  const handleOpenChangePackingStatus = () => { setTempPackingStatus(packingStatus); setShowChangePackingModal(true); }
  const handleConfirmChangePackingStatus = () => { if (tempPackingStatus !== packingStatus) { setPackingStatus(tempPackingStatus as any); addHistoryLog("Cập nhật trạng thái đóng gói", `Từ ${getPackingStatusLabel(packingStatus)} sang ${getPackingStatusLabel(tempPackingStatus)}`); toast.success("Cập nhật trạng thái thành công"); setShowChangePackingModal(false); } }
  
  const handleOpenPushShipping = () => { setShowPushShippingModal(true); }
  const handlePushShipping = () => {
      setShowPushShippingModal(false);
      setFulfillmentStatus('shipping'); 
      addHistoryLog("Đẩy vận chuyển thành công", shippingTab === 'integrated' ? "Đối tác tích hợp" : "Tự liên hệ");
      toast.success("Đã đẩy đơn sang đối tác vận chuyển");
  }

  const handlePrintShippingLabel = () => {
      window.print();
      setTimeout(() => {
          setIsPrinted(true);
          const now = new Date();
          const timeString = `${now.getDate().toString().padStart(2, '0')}/${(now.getMonth()+1).toString().padStart(2, '0')}/${now.getFullYear()} ${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
          setPrintedTime(timeString);
          addHistoryLog("Đã in phiếu giao hàng");
      }, 1000);
  }

  const handleOpenConfirmDelivered = () => {
      setShowConfirmDeliveredModal(true);
  }

  const handleConfirmDeliveredSuccess = () => {
      setShowConfirmDeliveredModal(false);
      setFulfillmentStatus('delivered'); 
      setPackingStatus('packed'); 
      addHistoryLog("Giao hàng thành công", "Hoàn tất đơn hàng");
      toast.success("Đã xác nhận giao hàng thành công");
  }

  const addHistoryLog = (action: string, detail?: string) => { const now = new Date(); const newLog = { time: `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`, date: "15/02/2026", actor: "Admin Z-OneTeam", action: action, detail: detail }; setOrderHistory([newLog, ...orderHistory]); }
  const handleReturnQuantityChange = (itemId: number, val: string) => { setReturnQuantities(prev => ({...prev, [itemId]: Number(val)})); };
  const handleSubmitReturn = () => { addHistoryLog("Đã tạo đơn trả hàng"); toast.success("Thành công"); setIsReturnMode(false); };
  const handleDeleteOrder = () => { if (confirm("Xóa đơn hàng?")) { toast.success("Đã xóa"); router.push("/admin/orders"); } }
  const handleSaveBankAccount = () => { setShowAddBankModal(false); toast.success("Đã thêm tài khoản"); }
  const handleProcessPayment = () => { setPaymentStatus('paid'); setShowReceiveMoneyModal(false); addHistoryLog("Đã thanh toán"); toast.success("Thanh toán thành công"); }

  // ====================================================================================
  // [CẬP NHẬT] GIAO DIỆN TẠO ĐƠN TRẢ HÀNG (ĐẦY ĐỦ)
  // ====================================================================================
  if (isReturnMode) {
    return (
      <div className="bg-[#f0f2f5] min-h-screen pb-10 font-sans text-slate-800">
          <div className="bg-white border-b border-slate-200 px-4 py-3 flex items-center gap-3 sticky top-0 z-30 shadow-sm">
              <Button variant="outline" size="icon" onClick={() => setIsReturnMode(false)} className="h-8 w-8 border-slate-300">
                  <ArrowLeft size={18} />
              </Button>
              <h1 className="text-[18px] font-bold text-slate-800">Tạo đơn trả hàng</h1>
          </div>

          <div className="max-w-[1200px] mx-auto p-4 grid grid-cols-12 gap-4">
              {/* CỘT TRÁI */}
              <div className="col-span-12 lg:col-span-8 space-y-4">
                  {/* Block Chọn Sản Phẩm */}
                  <div className="bg-white rounded-sm shadow-sm border border-slate-200 p-4">
                      <div className="flex justify-between items-center mb-4">
                          <h3 className="font-bold text-[14px]">Chọn sản phẩm trả hàng</h3>
                      </div>
                      
                      <div className="flex justify-between items-center mb-4 text-[13px]">
                          <span className="font-bold text-slate-500 uppercase">FUN000006</span>
                          <span className="text-blue-600 flex items-center gap-1"><MapPin size={12}/> Cửa hàng chính</span>
                      </div>

                      <div className="bg-[#f9fafb] border border-slate-200 rounded-sm overflow-hidden">
                          <div className="flex text-[12px] font-bold text-slate-600 border-b border-slate-200 bg-[#f4f6f8] py-2 px-4">
                              <div className="flex-1">Sản phẩm</div>
                              <div className="w-32 text-center">Số lượng</div>
                              <div className="w-24 text-right">Đơn giá</div>
                              <div className="w-24 text-right">Thành tiền</div>
                          </div>
                          
                          <div className="bg-white">
                              {order.items.map((item) => (
                                  <div key={item.id} className="flex items-center py-3 px-4 border-b border-slate-100 last:border-0">
                                      <div className="flex-1 flex gap-3">
                                          <div className="w-10 h-10 bg-slate-100 rounded border border-slate-200 flex items-center justify-center shrink-0 overflow-hidden">
                                              <img src={item.image} alt="img" className="w-full h-full object-cover"/>
                                          </div>
                                          <div>
                                              <p className="text-[13px] font-bold text-slate-800">{item.name}</p>
                                              <p className="text-[11px] text-slate-500">{item.packaging}</p>
                                              <p className="text-[11px] text-slate-500">{item.sku}</p>
                                          </div>
                                      </div>
                                      <div className="w-32 flex justify-center">
                                          <Input 
                                              type="number" 
                                              className="h-8 w-20 text-center text-[13px]" 
                                              value={returnQuantities[item.id] || 0}
                                              onChange={(e) => handleReturnQuantityChange(item.id, e.target.value)}
                                              min={0}
                                              max={item.quantity}
                                          />
                                      </div>
                                      <div className="w-24 text-right text-[13px]">{item.price.toLocaleString()}đ</div>
                                      <div className="w-24 text-right text-[13px] font-bold">
                                          {((returnQuantities[item.id] || 0) * item.price).toLocaleString()}đ
                                      </div>
                                  </div>
                              ))}
                          </div>
                      </div>
                  </div>

                  {/* Block Ghi chú */}
                  <div className="bg-white rounded-sm shadow-sm border border-slate-200 p-4">
                      <h3 className="font-bold text-[14px] mb-2">Ghi chú</h3>
                      <Textarea 
                          placeholder="Nhập lý do hoàn trả hàng" 
                          className="text-[13px] min-h-[80px]"
                          value={returnReason}
                          onChange={(e) => setReturnReason(e.target.value)}
                      />
                      <p className="text-[11px] text-slate-500 mt-2">Chỉ có bạn và nhân viên trong cửa hàng có thể nhìn thấy lý do này</p>
                  </div>
              </div>

              {/* CỘT PHẢI */}
              <div className="col-span-12 lg:col-span-4 space-y-4">
                  {/* Chi nhánh trả hàng */}
                  <div className="bg-white rounded-sm shadow-sm border border-slate-200 p-4 space-y-4">
                      <div className="space-y-1">
                          <label className="text-[13px] text-slate-600">Chi nhánh trả hàng</label>
                          <Select defaultValue="main">
                              <SelectTrigger className="h-9 text-[13px]"><SelectValue/></SelectTrigger>
                              <SelectContent><SelectItem value="main">Cửa hàng chính</SelectItem></SelectContent>
                          </Select>
                      </div>
                      <div className="space-y-1">
                          <label className="text-[13px] text-slate-600">Mã đơn trả hàng</label>
                          <Input placeholder="Nhập mã đơn trả hàng" className="h-9 text-[13px]"/>
                      </div>
                  </div>

                  {/* Tóm tắt */}
                  <div className="bg-white rounded-sm shadow-sm border border-slate-200 p-4">
                      <h3 className="font-bold text-[14px] mb-3">Tóm tắt</h3>
                      
                      {totalReturnCount === 0 ? (
                          <p className="text-[13px] text-slate-500 py-2">Chưa có sản phẩm nào được chọn</p>
                      ) : (
                          <div className="space-y-2 mb-4">
                              <div className="flex justify-between text-[13px]">
                                  <span className="text-slate-600">Số lượng hoàn trả</span>
                                  <span className="font-bold">{totalReturnCount}</span>
                              </div>
                              <div className="flex justify-between text-[13px]">
                                  <span className="text-slate-600">Cần hoàn tiền</span>
                                  <span className="font-bold text-blue-600">{totalReturnAmount.toLocaleString()}đ</span>
                              </div>
                          </div>
                      )}

                      <Separator className="my-3"/>
                      
                      <Button 
                          className="w-full bg-[#f4f6f8] text-slate-400 hover:bg-slate-200 data-[active=true]:bg-blue-600 data-[active=true]:text-white data-[active=true]:hover:bg-blue-700 transition-colors"
                          data-active={totalReturnCount > 0}
                          disabled={totalReturnCount === 0}
                          onClick={handleSubmitReturn}
                      >
                          Tạo đơn trả hàng
                      </Button>
                  </div>
              </div>
          </div>
      </div>
    );
  }

  // --- CẤU HÌNH TIMELINE ---
  const steps = [
    { id: "order_placed", label: "Đặt hàng", date: order.createdAt },
    { id: "confirmed", label: "Xác nhận", date: isConfirmed ? "15/02/2026 16:10" : "" }, 
    { id: "packing", label: "ĐTVC lấy hàng", date: (fulfillmentStatus === 'shipping' || fulfillmentStatus === 'delivered') ? "15/02/2026 17:17" : "" },
    { id: "shipping", label: "Giao hàng", date: (fulfillmentStatus === 'shipping' || fulfillmentStatus === 'delivered') ? "15/02/2026 17:37" : "" },
    { id: "completed", label: "Hoàn thành", date: fulfillmentStatus === 'delivered' ? "15/02/2026 17:37" : "" },
  ];
  let activeIndex = 0;
  if (isConfirmed) activeIndex = 1;
  if (fulfillmentStatus === 'shipping') activeIndex = 3; 
  if (fulfillmentStatus === 'delivered') activeIndex = 4;

  const displayItems = isFulfillmentMode || fulfillmentStatus === 'ready_to_pack' || fulfillmentStatus === 'shipping' || fulfillmentStatus === 'delivered' ? fulfillmentItems : order.items;
  const packerNameDisplay = STAFF_LIST.find(s => s.id === selectedPacker)?.name || "Admin Z-OneTeam";

  return (
    <div className="bg-[#f0f2f5] min-h-screen pb-10 font-sans text-slate-800">
      
      {/* 1. HEADER */}
      <div className="sticky top-0 z-30 bg-[#f0f2f5] pt-4 pb-4 px-4 shadow-sm border-b border-transparent"> 
        <div className="max-w-[1200px] mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
                <Button variant="outline" size="icon" onClick={() => router.back()} className="bg-white border-slate-300 h-8 w-8 hover:bg-slate-50 shadow-sm"><ChevronLeft size={18}/></Button>
                <div className="flex items-center gap-2">
                    <h1 className="text-[20px] font-bold text-slate-800">{order.id}</h1>
                    <span className="text-[11px] text-slate-500 font-normal">{order.createdAt}</span>
                    <span className="bg-[#fff7e6] text-[#d46b08] border border-[#ffbb96] px-2 py-0.5 rounded text-[11px] font-medium">{order.paymentStatusLabel}</span>
                    <span className={cn("px-2 py-0.5 rounded text-[11px] font-medium border transition-colors", isConfirmed ? "bg-blue-50 text-blue-600 border-blue-200" : "bg-[#fff7e6] text-[#d46b08] border-[#ffbb96]")}>{isConfirmed ? "Đang xử lý" : "Chưa xử lý"}</span>
                </div>
            </div>
            <div className="flex items-center gap-2">
                {!isConfirmed ? (<Button onClick={handleConfirmOrder} className="bg-blue-600 hover:bg-blue-700 text-white h-8 text-[13px] font-medium shadow-sm"><CheckCircle2 size={14} className="mr-1.5"/> Xác nhận đơn hàng</Button>) : (<Button variant="outline" className="bg-white border-rose-600 text-rose-600 hover:bg-rose-50 h-8 text-[13px] font-medium shadow-sm" onClick={() => setIsReturnMode(true)}><RotateCcw size={14} className="mr-1.5"/> Trả hàng</Button>)}
                <Button variant="outline" className="bg-white border-slate-300 h-8 text-[13px] font-medium text-slate-700 hover:bg-slate-50 shadow-sm"><Edit size={14} className="mr-1.5"/> Sửa đơn</Button>
                <Button variant="outline" className="bg-white border-slate-300 h-8 w-8 p-0 text-slate-600 hover:bg-slate-50 shadow-sm"><Printer size={16}/></Button>
                <div className="flex shadow-sm"><Button variant="outline" className="bg-white border-slate-300 h-8 text-[13px] font-medium text-slate-700 rounded-r-none border-r-0 hover:bg-slate-50">Thao tác khác</Button><Button variant="outline" className="bg-white border-slate-300 h-8 w-6 p-0 text-slate-700 rounded-l-none hover:bg-slate-50"><ChevronDown size={14}/></Button></div>
                <div className="flex gap-1 ml-2"><Button variant="outline" size="icon" className="h-8 w-8 bg-slate-100 border-slate-300 text-slate-400 cursor-not-allowed shadow-sm" disabled><ChevronLeft size={16}/></Button><Button variant="outline" size="icon" className="h-8 w-8 bg-white border-slate-300 text-slate-600 hover:bg-slate-50 shadow-sm"><ChevronRight size={16}/></Button></div>
            </div>
        </div>
      </div>

      <div className="max-w-[1200px] mx-auto px-4">
        {/* TIMELINE */}
        <div className="flex items-start justify-between w-full px-6 py-5 bg-white border border-slate-200 rounded-sm mb-4 overflow-x-auto shadow-sm">
           {steps.map((step, index) => (
             <div key={step.id} className="flex flex-col items-center relative flex-1 last:flex-none min-w-[80px]">
                 {index < steps.length - 1 && (<div className={cn("absolute top-3 left-[55%] w-full h-[2px] transition-colors duration-500", index < activeIndex ? "bg-emerald-500" : "bg-slate-200")}></div>)}
                 <div className={cn("w-6 h-6 rounded-full flex items-center justify-center z-10 text-white text-[10px] transition-all duration-500 shadow-sm", index <= activeIndex ? "bg-emerald-500" : "bg-slate-200")}>{index <= activeIndex && <CheckCircle2 size={14}/>}</div>
                 <div className="mt-2 text-center"><p className={cn("text-[13px] font-bold whitespace-nowrap", index <= activeIndex ? "text-slate-800" : "text-slate-400")}>{step.label}</p>{step.date && <p className="text-[10px] text-slate-500 mt-0.5 animate-in fade-in">{step.date}</p>}</div>
             </div>
           ))}
        </div>

        <div className="grid grid-cols-12 gap-4">
            {/* CỘT TRÁI */}
            <div className="col-span-12 lg:col-span-8 space-y-4">
                
                {/* [ĐÃ SỬA] BLOCK: SẢN PHẨM / CHUẨN BỊ HÀNG */}
                <div className="bg-white rounded-sm shadow-sm border border-slate-200 overflow-hidden transition-all duration-300">
                    
                    {/* Header Block */}
                    {fulfillmentStatus === 'delivered' ? (
                        <div className="px-4 py-3 border-b border-slate-200 flex justify-between items-center bg-white">
                            <div className="flex items-center gap-2 text-emerald-600 animate-in fade-in">
                                <CheckCircle2 size={18} className="fill-emerald-600 text-white"/>
                                <span className="font-bold text-[14px]">Đã giao hàng</span>
                            </div>
                            <MoreHorizontal size={16} className="text-slate-400 cursor-pointer hover:text-slate-600"/>
                        </div>
                    ) : fulfillmentStatus === 'ready_to_pack' || fulfillmentStatus === 'shipping' ? (
                        <div className="px-4 py-3 border-b border-slate-200 flex justify-between items-center bg-white">
                            <div className="flex items-center gap-2 text-blue-600 animate-in fade-in">
                                <Loader2 size={18} className={cn(fulfillmentStatus === 'shipping' ? "" : "animate-spin")}/>
                                <span className="font-bold text-[14px]">Chuẩn bị hàng</span>
                            </div>
                            <MoreHorizontal size={16} className="text-slate-400 cursor-pointer hover:text-slate-600"/>
                        </div>
                    ) : (
                        <div className="px-4 py-3 border-b border-slate-200 flex justify-between items-center bg-slate-50/50">
                            <div className="flex items-center gap-2">
                                <div className={cn("w-5 h-5 rounded-full border flex items-center justify-center p-[2px] transition-colors", isConfirmed ? "border-emerald-500" : "border-orange-400")}>
                                    <div className={cn("w-full h-full rounded-full", isConfirmed ? "bg-emerald-500" : "bg-orange-400")}></div>
                                </div>
                                <span className="font-bold text-[14px] text-slate-800">{isConfirmed ? "Đang xử lý" : "Chưa xử lý"}</span>
                            </div>
                            <MoreHorizontal size={16} className="text-slate-400 cursor-pointer hover:text-slate-600"/>
                        </div>
                    )}
                    
                    <div className="p-4 border-b border-slate-200">
                        {/* Thông tin Chi nhánh & Kiện hàng */}
                        <div className="flex flex-col gap-2 mb-4">
                            <div className="flex justify-between items-center">
                                <span className="text-[13px] text-slate-600 font-bold w-24">Chi nhánh:</span>
                                <span className="text-[13px] text-slate-800 flex-1">{order.info.branch}</span>
                            </div>
                            {(fulfillmentStatus === 'ready_to_pack' || fulfillmentStatus === 'shipping' || fulfillmentStatus === 'delivered') && (
                                <div className="animate-in fade-in slide-in-from-top-1 space-y-2">
                                    <div className="flex items-center">
                                        <span className="text-[13px] text-slate-600 font-bold w-24">Kiện hàng:</span>
                                        <div className="flex items-center gap-2">
                                            <span className="text-[13px] text-slate-800">FUN000006</span>
                                            {/* Badge trạng thái đóng gói */}
                                            {fulfillmentStatus === 'delivered' ? (
                                                <span className="text-[11px] px-1.5 py-0.5 rounded flex items-center gap-1 border bg-slate-100 border-slate-200 text-slate-600">
                                                    <FileCheck size={10} /> Đã đóng gói
                                                </span>
                                            ) : (
                                                <span className={cn("text-[11px] px-1.5 py-0.5 rounded flex items-center gap-1 border transition-all",
                                                    packingStatus === 'pending' ? "text-[#d46b08] bg-[#fff7e6] border-[#ffbb96]" : 
                                                    packingStatus === 'labeling' ? "text-blue-600 bg-blue-50 border-blue-200" : 
                                                    "text-emerald-600 bg-emerald-50 border-emerald-200"
                                                )}>
                                                    <Package size={10} /> {getPackingStatusLabel(packingStatus)}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex items-center">
                                        <span className="text-[13px] text-slate-600 font-bold w-24">NV đóng gói:</span>
                                        <span className="text-[13px] text-slate-800">{packerNameDisplay}</span>
                                    </div>

                                    {/* HIỂN THỊ THÔNG TIN KHI ĐÃ ĐẨY VẬN CHUYỂN HOẶC HOÀN THÀNH */}
                                    {(fulfillmentStatus === 'shipping' || fulfillmentStatus === 'delivered') && (
                                        <>
                                            <div className="flex items-center">
                                                <span className="text-[13px] text-slate-600 font-bold w-24">Phiếu giao hàng:</span>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-[13px] text-blue-600 cursor-pointer hover:underline">1003</span>
                                                    {isPrinted ? (
                                                        <span className="text-[11px] text-slate-600 bg-slate-100 border border-slate-300 px-1.5 py-0.5 rounded flex items-center gap-1">
                                                            <Printer size={10} /> Đã in
                                                        </span>
                                                    ) : (
                                                        <span className="text-[11px] text-[#d46b08] bg-[#fff7e6] border border-[#ffbb96] px-1.5 py-0.5 rounded flex items-center gap-1">
                                                            <Printer size={10} /> Chưa in
                                                        </span>
                                                    )}
                                                    {isPrinted && <span className="text-[12px] text-slate-500">{printedTime}</span>}
                                                </div>
                                            </div>
                                            <div className="flex items-center">
                                                <span className="text-[13px] text-slate-600 font-bold w-24">Vận chuyển:</span>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-[13px] text-slate-800">Bình Nguyễn | #1003</span>
                                                    <Copy size={12} className="text-slate-400 cursor-pointer hover:text-slate-600"/>
                                                    <ChevronDown size={14} className="text-slate-400 cursor-pointer"/>
                                                </div>
                                            </div>
                                        </>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Table Header */}
                        <div className="flex text-[12px] font-bold text-slate-800 mb-3 border-b border-slate-100 pb-2 uppercase bg-[#f9fafb] p-2">
                            <div className="flex-1">Sản phẩm</div>
                            <div className="w-24 text-center">Số lượng</div>
                            <div className="w-24 text-right">Đơn giá</div>
                            <div className="w-24 text-right">Thành tiền</div>
                        </div>
                        
                        {/* Product List */}
                        {displayItems.map((item) => (
                            <div key={item.id} className="flex items-start py-3 border-b border-dashed border-slate-100 last:border-0 px-2">
                                <div className="flex-1 flex gap-3">
                                    <div className="w-12 h-12 bg-slate-100 rounded border border-slate-200 flex items-center justify-center shrink-0 overflow-hidden">
                                        <img src={item.image} alt="img" className="w-full h-full object-cover"/>
                                    </div>
                                    <div>
                                        <p className="text-[13px] font-bold text-blue-600 cursor-pointer hover:underline mb-0.5">{item.name}</p>
                                        <div className="flex items-center gap-2 mb-0.5">{item.packaging && <span className="text-[11px] text-slate-500 bg-slate-100 px-1.5 rounded">{item.packaging}</span>}<span className="text-[11px] text-slate-400">|</span><span className="text-[11px] text-slate-500">{item.sku}</span><span className="text-[11px] text-slate-400">|</span><span className="text-[11px] text-slate-500">Đơn vị: <b>{item.unit}</b></span></div>
                                        
                                        {/* LOGIC HIỂN THỊ LÔ HÀNG */}
                                        {isFulfillmentMode ? (
                                            <div className="mt-2 animate-in fade-in">
                                                {!item.selectedBatch ? (
                                                    <div className="flex items-center gap-1.5 text-[12px] font-bold text-red-500 mb-2"><AlertCircle size={14} className="fill-red-100 text-red-500"/> Vui lòng chọn lô hàng</div>
                                                ) : (
                                                    <div className="mt-1 inline-flex items-center gap-1 bg-blue-50 text-blue-700 text-[12px] px-2 py-1 rounded border border-blue-100 mb-2">
                                                        <span className="font-bold">{item.selectedBatch.name}</span><span className="text-slate-400">|</span><span>SL: {item.selectedBatch.quantity}</span>
                                                        <button onClick={() => setFulfillmentItems(prev => prev.map(pi => pi.id === item.id ? { ...pi, selectedBatch: null } : pi))} className="ml-1 text-slate-400 hover:text-red-500"><X size={12}/></button>
                                                    </div>
                                                )}
                                                <div className="flex gap-4"><span className="text-[13px] text-blue-600 cursor-pointer hover:underline">Thêm ghi chú</span><span className="text-[13px] text-blue-600 cursor-pointer hover:underline" onClick={() => handleOpenBatchModal(item)}>Chọn lô bán hàng</span></div>
                                            </div>
                                        ) : (fulfillmentStatus === 'ready_to_pack' || fulfillmentStatus === 'shipping' || fulfillmentStatus === 'delivered') ? (
                                            <div className="mt-2 animate-in fade-in">
                                                <span className="bg-[#e6f4ff] text-slate-700 text-[11px] px-2 py-1 rounded font-medium border border-slate-200">
                                                    DEFAULT <span className="text-slate-400">|</span> SL: 1
                                                </span>
                                                <p className="text-[12px] text-blue-600 cursor-pointer hover:underline mt-2">Thêm ghi chú</p>
                                            </div>
                                        ) : (
                                            <p className="text-[12px] text-blue-600 cursor-pointer hover:underline mt-1 flex items-center gap-1"><Edit size={10} /> Thêm ghi chú</p>
                                        )}
                                    </div>
                                </div>
                                <div className="w-24 text-center text-[13px] pt-1 font-medium">{item.quantity}</div>
                                <div className="w-24 text-right text-[13px] pt-1 text-slate-600">{item.price.toLocaleString()}đ</div>
                                <div className="w-24 text-right text-[13px] font-bold pt-1 text-slate-800">{item.total.toLocaleString()}đ</div>
                            </div>
                        ))}
                    </div>
                    
                    {/* BUTTONS: THAY ĐỔI THEO TRẠNG THÁI */}
                    {fulfillmentStatus !== 'delivered' && (
                        <div className="px-4 py-3 bg-white flex justify-end gap-2 transition-all">
                            {isFulfillmentMode ? (
                                <>
                                    <Button variant="outline" className="h-9 px-4 border-blue-500 text-blue-600 hover:bg-blue-50" onClick={handleCancelFulfillmentMode}>Hủy</Button>
                                    <Button className="bg-[#f4f6f8] text-slate-400 hover:bg-slate-200 border-none h-9 px-4 font-medium data-[active=true]:bg-blue-600 data-[active=true]:text-white data-[active=true]:hover:bg-blue-700" data-active={fulfillmentItems.every(i => i.selectedBatch)} onClick={handleSubmitFulfillment}>Phân lô & Yêu cầu đóng gói</Button>
                                </>
                            ) : fulfillmentStatus === 'shipping' ? (
                                <>
                                    <Button variant="outline" className="h-9 px-4 border-blue-600 text-blue-600 hover:bg-blue-50" onClick={handleOpenConfirmDelivered}>Xác nhận đã giao</Button>
                                    <Button variant="outline" className="h-9 px-4 border-blue-600 text-blue-600 hover:bg-blue-50" onClick={handleOpenChangePackingStatus}>Chuyển trạng thái đóng gói</Button>
                                    
                                    {!isPrinted ? (
                                        <Button className="bg-blue-600 hover:bg-blue-700 text-white h-9 px-4 font-medium" onClick={handlePrintShippingLabel}>In phiếu giao hàng</Button>
                                    ) : (
                                        <Button variant="outline" className="h-9 px-4 bg-slate-100 text-slate-500 border-slate-200 cursor-not-allowed" disabled>Đã in phiếu</Button>
                                    )}
                                </>
                            ) : fulfillmentStatus === 'ready_to_pack' ? (
                                <>
                                    <Button variant="outline" className="h-9 px-4 border-blue-600 text-blue-600 hover:bg-blue-50" onClick={handleOpenChangePackingStatus}>Chuyển trạng thái đóng gói</Button>
                                    <Button className="bg-blue-600 hover:bg-blue-700 text-white h-9 px-4 font-medium" onClick={handleOpenPushShipping}>Đẩy vận chuyển</Button>
                                </>
                            ) : (
                                <>
                                    <Button variant="outline" className="bg-white border-blue-600 text-blue-600 hover:bg-blue-50 h-8 text-[13px] font-medium shadow-sm" onClick={handleEnterFulfillmentMode}>Yêu cầu đóng gói</Button>
                                    <Button className="bg-blue-600 hover:bg-blue-700 text-white h-8 text-[13px] font-medium shadow-sm" onClick={handleEnterFulfillmentMode}>Đẩy vận chuyển</Button>
                                </>
                            )}
                        </div>
                    )}
                </div>

                {/* ... (Các block Thanh toán, Lịch sử giữ nguyên) ... */}
                <div className="bg-white rounded-sm shadow-sm border border-slate-200 overflow-hidden"><div className="px-4 py-3 border-b border-slate-200 flex items-center gap-2 bg-slate-50/50"><div className={cn("w-5 h-5 rounded-full border flex items-center justify-center p-[2px]", paymentStatus === 'paid' ? "border-emerald-500" : "border-orange-400")}><div className={cn("w-full h-full rounded-full", paymentStatus === 'paid' ? "bg-emerald-500" : "bg-orange-400")}></div></div><span className="font-bold text-[14px] text-slate-800">{paymentStatus === 'paid' ? "Đã thanh toán" : "Chưa thanh toán"}</span></div><div className="p-4"><div className="flex justify-between items-center text-[13px] mb-2"><span className="text-slate-600">Tổng tiền hàng</span><span className="font-bold text-slate-800">{order.pricing.subtotal.toLocaleString()}đ</span></div><div className="flex justify-between items-center text-[13px] font-bold pt-3 border-t border-slate-100 mt-2 text-[14px]"><span className="text-slate-800">Thành tiền</span><span className="text-slate-800">{order.pricing.total.toLocaleString()}đ</span></div>{paymentStatus === 'paid' && (<div className="flex justify-between items-center text-[13px] mt-2 pt-2 border-t border-slate-100 text-emerald-600 font-medium"><span>Đã thanh toán</span><span>{order.pricing.total.toLocaleString()}đ</span></div>)}</div>{paymentStatus === 'unpaid' && (<div className="px-4 py-3 border-t border-slate-100 flex justify-end gap-2 bg-white"><Button variant="outline" className="bg-white border-blue-600 text-blue-600 hover:bg-blue-50 h-8 text-[13px] font-medium shadow-sm" onClick={() => setShowQRModal(true)}>Lấy mã QR</Button><Button className="bg-blue-600 hover:bg-blue-700 text-white h-8 text-[13px] font-medium shadow-sm" onClick={() => setShowReceiveMoneyModal(true)}>Nhận tiền</Button></div>)}</div>
                <div className="bg-white rounded-sm shadow-sm border border-slate-200 p-4 shadow-sm"><h3 className="font-bold text-[14px] mb-4 text-slate-700">Lịch sử đơn hàng</h3><div className="space-y-6 relative pl-2"><div className="absolute top-2 left-[5px] bottom-2 w-[2px] bg-slate-100"></div>{orderHistory.map((log, index) => (<div key={index} className="flex gap-4 relative z-10 animate-in slide-in-from-left-2 duration-300"><div className={cn("w-3 h-3 rounded-full mt-1.5 shrink-0 outline outline-4 outline-white transition-colors duration-500", log.action.includes("Đã xác nhận") ? "bg-emerald-500" : "bg-blue-500")}></div><div className="flex-1"><div className="flex gap-2 mb-0.5 items-baseline"><span className="font-bold text-[13px] text-slate-800">{log.time}</span><span className="text-[13px] text-slate-800 font-medium">{log.actor}</span></div><p className={cn("text-[13px]", log.action.includes("Đã xác nhận") ? "text-emerald-600 font-bold" : "text-slate-600")}>{log.action}</p>{log.detail && <div className="mt-1 flex items-center justify-between bg-slate-50 p-2 rounded border border-slate-100"><span className="text-[12px] text-slate-500 font-medium">{log.detail}</span><ChevronDown size={14} className="text-slate-400 cursor-pointer"/></div>}</div></div>))}</div></div>
            </div>

            {/* CỘT PHẢI - GIỮ NGUYÊN */}
            <div className="col-span-12 lg:col-span-4 space-y-4">
                <div className="bg-white rounded-sm shadow-sm border border-slate-200 p-4 shadow-sm"><h3 className="font-bold text-[13px] mb-2 text-slate-700">Nguồn đơn</h3><div className="flex items-center gap-2"><div className="w-5 h-5 bg-amber-400 rounded flex items-center justify-center text-white shadow-sm"><Store size={12}/></div><span className="text-[13px] font-medium text-slate-800">{order.info.source}</span></div></div>
                <div className="bg-white rounded-sm shadow-sm border border-slate-200 p-4 space-y-4 shadow-sm">
                    <h3 className="font-bold text-[13px] text-slate-700 flex justify-between">Khách hàng <User size={14} className="text-slate-400"/></h3>
                    <div><p className="text-[13px] text-blue-600 font-bold cursor-pointer hover:underline mb-1 flex items-center gap-1">{order.customer.name} <Copy size={12} className="text-slate-300 hover:text-slate-500"/></p><div className="flex justify-between text-[12px] text-slate-600 mb-1"><span>Tổng chi tiêu (1 đơn hàng)</span><span className="font-bold text-slate-800">0đ</span></div><div className="flex justify-between text-[12px] text-slate-600"><span>Đơn gần nhất</span><span className="text-blue-600 cursor-pointer hover:underline">{order.id}</span></div></div>
                    <Separator/><div className="group relative"><div className="flex justify-between items-center mb-1"><span className="text-[13px] font-bold text-slate-700">Thông tin liên hệ</span><PenLine size={12} className="text-slate-400 cursor-pointer opacity-0 group-hover:opacity-100 hover:text-blue-600"/></div><p className="text-[12px] text-slate-500 mb-1">{order.customer.email}</p><p className="text-[13px] text-blue-600 font-medium cursor-pointer hover:underline">{order.customer.phone}</p></div>
                    <Separator/><div className="group relative"><div className="flex justify-between items-center mb-1"><span className="text-[13px] font-bold text-slate-700">Địa chỉ giao hàng</span><PenLine size={12} className="text-slate-400 cursor-pointer opacity-0 group-hover:opacity-100 hover:text-blue-600"/></div><p className="text-[12px] text-slate-800 font-medium mb-1">{order.customer.name} - {order.customer.phone}</p><p className="text-[12px] text-slate-600 leading-snug">{order.customer.shippingAddress}</p><div className="flex items-center gap-1 mt-1.5 text-[11px] text-blue-600 cursor-pointer hover:underline"><MapPin size={10} /> Xem bản đồ</div></div>
                </div>
                <div className="bg-white rounded-sm shadow-sm border border-slate-200 p-4 space-y-3 shadow-sm">
                    <h3 className="font-bold text-[14px] text-slate-700 mb-2">Thông tin bổ sung</h3>
                    <div><p className="text-[12px] font-bold mb-1 text-slate-600">Bán tại chi nhánh</p><p className="text-[12px] text-slate-800">{order.info.branch}</p></div>
                    <Separator className="bg-slate-100"/><div className="group"><div className="flex justify-between items-center mb-1"><p className="text-[12px] font-bold text-slate-600">Nhân viên phụ trách</p><PenLine size={12} className="text-slate-400 cursor-pointer opacity-0 group-hover:opacity-100 hover:text-blue-600"/></div><p className="text-[12px] text-slate-800">{order.info.staff}</p></div>
                    <Separator className="bg-slate-100"/><div><p className="text-[12px] font-bold mb-1 text-slate-600">Nhân viên tạo đơn</p><p className="text-[12px] text-slate-800">{order.info.creator}</p></div>
                    <Separator className="bg-slate-100"/><div><p className="text-[12px] font-bold mb-1 text-slate-600">Ngày đặt hàng</p><p className="text-[12px] text-slate-800">{order.createdAt}</p></div>
                    <Separator className="bg-slate-100"/><div className="group"><div className="flex justify-between items-center mb-1"><p className="text-[12px] font-bold text-slate-600">Ngày hẹn giao</p><PenLine size={12} className="text-slate-400 cursor-pointer opacity-0 group-hover:opacity-100 hover:text-blue-600"/></div><p className="text-[12px] text-slate-400 italic">{order.info.deliveryDate}</p></div>
                    <Separator className="bg-slate-100"/><div><div className="flex justify-between items-center mb-2"><p className="text-[12px] font-bold text-slate-600">Tag</p><span className="text-[12px] text-blue-600 cursor-pointer hover:underline">Danh sách tag</span></div><Input placeholder="Tìm kiếm hoặc thêm mới tag" className="h-9 text-[12px] bg-white border-slate-200 focus-visible:ring-blue-500 placeholder:text-slate-400"/></div>
                </div>
            </div>
        </div>

        <div className="mt-6 mb-10"><Separator className="bg-slate-200 mb-4"/><div className="flex justify-end"><Button variant="outline" className="border-red-500 text-red-500 hover:bg-red-50 hover:text-red-600 hover:border-red-600 h-9 px-6 text-[13px] font-medium transition-colors" onClick={handleDeleteOrder}>Xóa đơn hàng</Button></div></div>
      </div>

      {/* ================= MODAL ĐẨY VẬN CHUYỂN ================= */}
      {showPushShippingModal && (<div className="fixed inset-0 bg-black/50 z-[90] flex items-center justify-center animate-in fade-in duration-200"><div className="bg-white rounded-lg shadow-xl w-[900px] max-w-[95vw] h-[600px] overflow-hidden flex flex-col"><div className="flex justify-between items-center px-6 py-4 border-b border-slate-200"><h2 className="text-[18px] font-bold text-slate-800">Đẩy qua đối tác vận chuyển</h2><button onClick={() => setShowPushShippingModal(false)} className="text-slate-400 hover:text-slate-600"><X size={24}/></button></div><div className="flex flex-1 overflow-hidden"><div className="w-[300px] bg-[#f9fafb] border-r border-slate-200 p-4 space-y-4 overflow-y-auto"><div className="space-y-1"><div className="flex justify-between"><label className="text-[13px] font-bold text-slate-700">Địa chỉ giao hàng</label><Edit size={12} className="text-slate-400 cursor-pointer"/></div><p className="text-[12px] text-slate-600">{order.customer.name}, {order.customer.phone}</p><p className="text-[12px] text-slate-600">{order.customer.shippingAddress}</p></div><div className="space-y-1"><label className="text-[13px] font-bold text-slate-700">Địa chỉ lấy hàng</label><Select defaultValue="main"><SelectTrigger className="h-9 text-[13px] bg-white"><SelectValue/></SelectTrigger><SelectContent><SelectItem value="main">Cửa hàng chính</SelectItem></SelectContent></Select></div><div className="space-y-2"><div className="flex justify-between"><label className="text-[13px] font-bold text-slate-700">Thông tin giao hàng</label><span className="text-[11px] text-blue-600 cursor-pointer">Cấu hình gói hàng</span></div><div className="grid grid-cols-2 gap-2"><div><label className="text-[11px] text-slate-500">Tiền thu hộ COD</label><div className="relative"><Input className="h-8 text-[12px] bg-white pr-6" defaultValue="110,000"/><span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-slate-400">đ</span></div></div><div><label className="text-[11px] text-slate-500">Khối lượng</label><div className="relative"><Input className="h-8 text-[12px] bg-white pr-6" defaultValue="5,000"/><span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-slate-400">g</span></div></div></div><div className="flex gap-2"><div className="relative flex-1"><Input className="h-8 text-[12px] bg-white text-center" defaultValue="10"/><span className="absolute right-1 top-1/2 -translate-y-1/2 text-[10px] text-slate-400">cm</span></div><div className="relative flex-1"><Input className="h-8 text-[12px] bg-white text-center" defaultValue="10"/><span className="absolute right-1 top-1/2 -translate-y-1/2 text-[10px] text-slate-400">cm</span></div><div className="relative flex-1"><Input className="h-8 text-[12px] bg-white text-center" defaultValue="10"/><span className="absolute right-1 top-1/2 -translate-y-1/2 text-[10px] text-slate-400">cm</span></div></div></div><div className="space-y-1"><label className="text-[12px] text-slate-500">Yêu cầu giao hàng</label><Select defaultValue="view"><SelectTrigger className="h-8 text-[12px] bg-white"><SelectValue/></SelectTrigger><SelectContent><SelectItem value="view">Cho xem hàng không cho thử</SelectItem></SelectContent></Select></div><div className="space-y-1"><label className="text-[12px] text-slate-500">Ghi chú</label><Textarea className="h-20 text-[12px] bg-white" placeholder="Nhập ghi chú"/></div></div><div className="flex-1 flex flex-col"><div className="p-4 border-b border-slate-200 flex gap-4"><button className={cn("flex items-center gap-2 px-4 py-2 rounded-md text-[13px] font-medium transition-colors border", shippingTab === 'integrated' ? "bg-blue-50 border-blue-600 text-blue-600" : "bg-white border-transparent text-slate-600 hover:bg-slate-50")} onClick={() => setShippingTab('integrated')}><Truck size={16}/> Vận chuyển tích hợp</button><button className={cn("flex items-center gap-2 px-4 py-2 rounded-md text-[13px] font-medium transition-colors border", shippingTab === 'self' ? "bg-blue-50 border-blue-600 text-blue-600" : "bg-white border-transparent text-slate-600 hover:bg-slate-50")} onClick={() => setShippingTab('self')}><Truck size={16}/> Vận chuyển tự liên hệ</button></div><div className="flex-1 p-6 overflow-y-auto bg-white">{shippingTab === 'integrated' ? (<div className="space-y-4"><div className="flex justify-between items-center"><span className="text-[13px] text-slate-600">Chọn đối tác vận chuyển</span><span className="text-[12px] text-blue-600 cursor-pointer flex items-center gap-1"><ArrowUpDown size={12}/> Sắp xếp đối tác</span></div><div className="bg-slate-50 text-center py-2 text-[12px] text-slate-500 rounded border border-slate-100">Không có dịch vụ nào phù hợp</div><div className="space-y-4">{SHIPPING_PARTNERS_MOCK.map(partner => (<div key={partner.id} className="border border-slate-200 rounded p-4 flex gap-4"><div className="w-24 font-bold text-blue-600 text-[14px]">{partner.logo}</div><div className="flex-1 space-y-2">{partner.error ? (<div className="bg-orange-50 border border-orange-200 rounded p-3 text-[12px] text-orange-800 flex gap-2"><AlertCircle size={16} className="shrink-0 text-orange-500" /><div><span className="font-bold">Rất tiếc!</span><p>{partner.error} <span className="text-blue-600 cursor-pointer hover:underline">tại đây</span></p></div></div>) : (<div className="flex justify-between items-center"><span className="text-[13px] text-slate-500">Dịch vụ vận chuyển không khả dụng</span><Button variant="outline" className="h-8 text-blue-600 border-blue-200 hover:bg-blue-50 text-[12px]">Kết nối ngay</Button></div>)}<span className="text-[12px] text-blue-500 cursor-pointer hover:underline">Xem các tuyến ngừng hỗ trợ</span></div></div>))}</div></div>) : (<div className="space-y-6 animate-in fade-in"><div className="grid grid-cols-2 gap-6"><div className="space-y-1.5"><label className="text-[13px] font-medium text-slate-600">Chọn đối tác</label><Select><SelectTrigger className="h-9 text-[13px]"><SelectValue placeholder="Chọn đối tác"/></SelectTrigger><SelectContent><SelectItem value="grab">Grab Express</SelectItem><SelectItem value="aha">Ahamove</SelectItem><SelectItem value="other">Khác</SelectItem></SelectContent></Select></div><div className="space-y-1.5"><label className="text-[13px] font-medium text-slate-600">Người trả phí</label><RadioGroup defaultValue="shop" className="flex gap-6 pt-2"><div className="flex items-center space-x-2"><RadioGroupItem value="shop" id="shop-pay-push" className="text-blue-600 border-slate-300"/><Label htmlFor="shop-pay-push" className="font-normal text-[13px]">Shop trả</Label></div><div className="flex items-center space-x-2"><RadioGroupItem value="customer" id="cust-pay-push" /><Label htmlFor="cust-pay-push" className="font-normal text-[13px]">Khách trả</Label></div></RadioGroup></div></div><div className="grid grid-cols-2 gap-6"><div className="space-y-1.5"><label className="text-[13px] font-medium text-slate-600">Mã vận đơn</label><Input placeholder="Nhập mã vận đơn" className="h-9 text-[13px]"/></div><div className="space-y-1.5"><label className="text-[13px] font-medium text-slate-600">Phí vận chuyển</label><div className="relative"><Input placeholder="0" className="h-9 text-[13px] pr-8"/><span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 text-[13px]">đ</span></div></div></div><div className="bg-[#f4f6f8] rounded p-4 flex justify-between items-center"><span className="text-[13px] font-medium text-slate-700">Tiền thu hộ COD</span><span className="text-[14px] font-bold text-slate-900">110,000đ</span><span className="text-[13px] font-medium text-slate-700">Phí vận chuyển</span><span className="text-[14px] font-bold text-slate-900">0đ</span></div></div>)}</div><div className="p-4 border-t border-slate-200 flex justify-end gap-2 bg-white"><Button variant="outline" onClick={() => setShowPushShippingModal(false)}>Hủy</Button>{shippingTab === 'self' && <Button className="bg-blue-600 hover:bg-blue-700" onClick={handlePushShipping}>Gửi yêu cầu vận chuyển</Button>}</div></div></div></div></div>)}

      {/* ================= MODAL YÊU CẦU ĐÓNG GÓI ================= */}
      {showRequestPackingModal && (<div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center animate-in fade-in duration-200"><div className="bg-white rounded-lg shadow-xl w-[500px] max-w-[95vw] overflow-hidden flex flex-col"><div className="flex justify-between items-center px-4 py-3 border-b border-slate-200"><h2 className="text-[16px] font-bold text-slate-800">Yêu cầu đóng gói</h2><button onClick={() => setShowRequestPackingModal(false)} className="text-slate-400 hover:text-slate-600"><X size={20}/></button></div><div className="p-4 space-y-4"><div className="space-y-1.5"><label className="text-[13px] font-medium text-slate-600">Nhân viên đóng gói</label><Select value={selectedPacker} onValueChange={setSelectedPacker}><SelectTrigger className="h-9 text-[13px]"><SelectValue placeholder="Chọn nhân viên đóng gói"/></SelectTrigger><SelectContent>{STAFF_LIST.map(staff => <SelectItem key={staff.id} value={staff.id}>{staff.name}</SelectItem>)}</SelectContent></Select><p className="text-[12px] text-slate-500 italic">Việc chọn nhân viên để gán là không bắt buộc</p></div></div><div className="px-4 py-3 border-t border-slate-200 flex justify-end gap-2"><Button variant="outline" className="h-9 px-4 border-slate-300 text-slate-700" onClick={() => setShowRequestPackingModal(false)}>Hủy</Button><Button className="bg-blue-600 hover:bg-blue-700 h-9 px-4 font-medium" onClick={handleFinalizePackingRequest}>Yêu cầu đóng gói</Button></div></div></div>)}

      {/* ================= MODAL CHUYỂN TRẠNG THÁI ĐÓNG GÓI ================= */}
      {showChangePackingModal && (<div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center animate-in fade-in duration-200"><div className="bg-white rounded-lg shadow-xl w-[500px] max-w-[95vw] overflow-hidden flex flex-col"><div className="flex justify-between items-center px-4 py-3 border-b border-slate-200"><h2 className="text-[16px] font-bold text-slate-800">Chuyển trạng thái đóng gói</h2><button onClick={() => setShowChangePackingModal(false)} className="text-slate-400 hover:text-slate-600"><X size={20}/></button></div><div className="p-4 space-y-4"><div className="space-y-1.5"><label className="text-[13px] font-medium text-slate-600">Trạng thái đóng gói<span className="text-red-500">*</span></label><Select value={tempPackingStatus} onValueChange={setTempPackingStatus}><SelectTrigger className="h-9 text-[13px]"><SelectValue placeholder="Chọn trạng thái"/></SelectTrigger><SelectContent><SelectItem value="pending">Chờ đóng gói</SelectItem><SelectItem value="labeling">Chờ dán phiếu giao hàng</SelectItem><SelectItem value="packed">Đã đóng gói</SelectItem></SelectContent></Select></div></div><div className="px-4 py-3 border-t border-slate-200 flex justify-end gap-2"><Button variant="outline" className="h-9 px-4 border-slate-300 text-slate-700" onClick={() => setShowChangePackingModal(false)}>Hủy</Button><Button className="bg-blue-600 hover:bg-blue-700 h-9 px-4 font-medium disabled:bg-slate-200 disabled:text-slate-400" disabled={tempPackingStatus === packingStatus} onClick={handleConfirmChangePackingStatus}>Xác nhận</Button></div></div></div>)}

      {/* ================= MODAL CHỌN LÔ HÀNG (REUSED) ================= */}
      {showBatchModal && (<div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center animate-in fade-in duration-200"><div className="bg-white rounded-md shadow-xl w-[900px] max-w-[95vw] overflow-hidden"><div className="flex justify-between items-center px-4 py-3 border-b border-slate-200"><h2 className="text-[16px] font-bold text-slate-800">Chọn lô bán hàng</h2><button onClick={() => setShowBatchModal(false)} className="text-slate-400 hover:text-slate-600"><X size={20}/></button></div><div className="p-4 space-y-4"><div className="bg-slate-50 p-3 rounded text-[13px] text-slate-700 space-y-1"><div className="flex justify-between"><span>Số lượng sản phẩm bán:</span><span className="font-bold">{fulfillmentItems.find(i=>i.id===activeProductId)?.quantity} sản phẩm</span></div><div className="flex justify-between"><span>Số lượng phân bổ lô đang chọn:</span><span className="font-bold">{fulfillmentItems.find(i=>i.id===activeProductId)?.quantity} sản phẩm trong {batchRows.length} lô</span></div></div><div className="flex gap-2"><div className="relative flex-1"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14}/><Input placeholder="Tìm kiếm theo mã lô" className="pl-9 h-9 text-[13px]"/></div></div><div className="border border-slate-200 rounded-sm"><table className="w-full text-[13px]"><thead className="bg-[#f4f6f8] font-bold text-slate-700 border-b border-slate-200"><tr><th className="py-2 px-4 text-left">Mã lô</th><th className="py-2 px-4 text-left">Trạng thái</th><th className="py-2 px-4 text-left">Ngày sản xuất</th><th className="py-2 px-4 text-left">Hạn sử dụng</th><th className="py-2 px-4 text-center">SL tồn kho</th><th className="py-2 px-4 text-left w-[120px]">SL bán</th><th className="py-2 px-4"></th></tr></thead><tbody>{batchRows.map((row: any, index: number) => (<tr key={row.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors animate-in fade-in slide-in-from-top-1"><td className="py-3 px-4 font-medium text-blue-600 cursor-pointer hover:underline">{row.code}</td><td className="py-3 px-4"><span className="text-emerald-600 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-full text-[11px]">{row.status}</span></td><td className="py-3 px-4 text-slate-500">{row.expiry === "---" ? "---" : "01/01/2026"}</td><td className="py-3 px-4 text-slate-500">{row.expiry}</td><td className="py-3 px-4 text-center">100</td><td className="py-3 px-4"><Input className="h-8 w-20 text-center border-blue-500 ring-1 ring-blue-500 focus-visible:ring-offset-0" value={row.quantity} onChange={(e) => handleBatchQtyChange(index, e.target.value)} type="number"/></td><td className="py-3 px-4 text-right">{index > 0 ? (<button onClick={() => handleDeleteBatchRow(index)} className="text-slate-400 hover:text-red-500 transition-colors"><Trash2 size={16} /></button>) : (<span className="text-blue-600 cursor-pointer hover:underline text-[12px]">Bỏ chọn</span>)}</td></tr>))}</tbody></table></div></div><div className="px-4 py-3 border-t border-slate-200 flex justify-end gap-2"><Button variant="outline" onClick={() => setShowBatchModal(false)}>Hủy</Button><Button className="bg-blue-600 hover:bg-blue-700" onClick={handleConfirmBatch}>Xác nhận</Button></div></div></div>)}

      {/* MODAL QR, NHẬN TIỀN, THÊM BANK (GIỮ NGUYÊN) */}
      {showQRModal && (<div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center animate-in fade-in duration-200"><div className="bg-white rounded-lg shadow-xl w-[850px] max-w-[95vw] overflow-hidden flex flex-col"><div className="flex justify-between items-center px-6 py-4 border-b border-slate-200"><h2 className="text-[18px] font-bold text-slate-800">Mã VietQR thanh toán</h2><button onClick={() => setShowQRModal(false)} className="text-slate-400 hover:text-slate-600"><X size={24}/></button></div><div className="flex p-6 gap-8"><div className="flex-1 space-y-4"><div className="space-y-1.5"><label className="text-[13px] text-slate-600 font-medium">Tài khoản nhận tiền*</label><Select value={selectedBankId} onValueChange={(val) => { if(val === "add_new") { setShowAddBankModal(true); } else { setSelectedBankId(val); } }}><SelectTrigger className="h-10 text-[13px]"><SelectValue placeholder="Chọn tài khoản nhận tiền"/></SelectTrigger><SelectContent><div className="p-2 border-b border-slate-100"><div className="relative"><Search className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400" size={14}/><input className="w-full pl-8 h-8 text-[13px] border border-slate-200 rounded outline-none focus:border-blue-500" placeholder="Tìm kiếm"/></div></div><div className="p-1"><SelectItem value="add_new" className="text-blue-600 cursor-pointer font-medium pl-8 py-2"><span className="flex items-center gap-2"><Plus size={16} className="bg-blue-600 text-white rounded-full p-0.5"/> Thêm mới tài khoản thụ hưởng</span></SelectItem></div>{bankAccounts.length > 0 && <Separator className="my-1"/>}{bankAccounts.map(acc => (<SelectItem key={acc.id} value={acc.id} className="text-[13px]">{acc.bank} - {acc.accountNumber} - {acc.accountName}</SelectItem>))}</SelectContent></Select></div><div className="space-y-1.5"><label className="text-[13px] text-slate-600 font-medium">Số tiền thanh toán*</label><div className="relative"><Input className="h-10 text-[14px] pr-8 font-bold text-slate-800" defaultValue="110,000"/><span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 text-[13px]">đ</span></div></div></div><div className="w-[400px] border-[4px] border-blue-100 rounded-lg p-6 flex flex-col items-center justify-center bg-white relative"><p className="text-[13px] text-slate-800 mb-2 font-medium">Mở Ứng Dụng Ngân Hàng Quét QRCode</p><div className="w-[200px] h-[200px] bg-slate-50 mb-4 relative flex items-center justify-center">{selectedBankId ? (<img src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=vietqr_${selectedBankId}_110000`} className="w-full h-full" alt="QR"/>) : (<img src="https://upload.wikimedia.org/wikipedia/commons/d/d0/QR_code_for_mobile_English_Wikipedia.svg" className="w-full h-full opacity-20" alt="QR Placeholder"/>)}</div><div className="w-full space-y-2 text-[13px]"><div className="flex justify-between"><span className="text-slate-500">Số tiền:</span><span className="font-bold">110,000đ</span></div><div className="flex justify-between"><span className="text-slate-500">Nội dung CK:</span><span className="font-medium text-slate-800">DH 1002</span></div></div><p className="text-[10px] text-slate-400 mt-4">Giải pháp được cung cấp trên nền tảng <span className="text-blue-500 font-bold">Sapo</span></p></div></div></div></div>)}
      {showAddBankModal && (<div className="fixed inset-0 bg-black/50 z-[110] flex items-center justify-center animate-in fade-in zoom-in-95 duration-200"><div className="bg-white rounded-lg shadow-xl w-[650px] max-w-[95vw] overflow-hidden flex flex-col"><div className="flex justify-between items-center px-6 py-4 border-b border-slate-200"><h2 className="text-[18px] font-bold text-slate-800">Thêm tài khoản thụ hưởng</h2><button onClick={() => setShowAddBankModal(false)} className="text-slate-400 hover:text-slate-600"><X size={24}/></button></div><div className="p-6 space-y-4"><div className="grid grid-cols-2 gap-6"><div className="space-y-1.5"><label className="text-[13px] font-medium text-slate-600">Ngân hàng thụ hưởng<span className="text-red-500">*</span></label><Select value={newBankForm.bank} onValueChange={(val) => setNewBankForm({...newBankForm, bank: val})}><SelectTrigger className="h-9 text-[13px]"><SelectValue placeholder="Chọn ngân hàng thụ hưởng"/></SelectTrigger><SelectContent>{BANK_LIST.map(bank => (<SelectItem key={bank.id} value={bank.code}>{bank.name} ({bank.code})</SelectItem>))}</SelectContent></Select></div><div className="space-y-1.5"><label className="text-[13px] font-medium text-slate-600">Số tài khoản<span className="text-red-500">*</span></label><Input placeholder="Nhập số tài khoản thụ hưởng" className="h-9 text-[13px]" value={newBankForm.accountNumber} onChange={(e) => setNewBankForm({...newBankForm, accountNumber: e.target.value})}/></div></div><div className="grid grid-cols-2 gap-6"><div className="space-y-1.5"><label className="text-[13px] font-medium text-slate-600">Tên chủ tài khoản<span className="text-red-500">*</span></label><Input placeholder="Nhập tên chủ tài khoản" className="h-9 text-[13px]" value={newBankForm.accountName} onChange={(e) => setNewBankForm({...newBankForm, accountName: e.target.value})}/></div><div className="space-y-1.5"><label className="text-[13px] font-medium text-slate-600">Ghi chú</label><Input placeholder="Nhập ghi chú" className="h-9 text-[13px]" value={newBankForm.note} onChange={(e) => setNewBankForm({...newBankForm, note: e.target.value})}/></div></div></div><div className="px-6 py-4 border-t border-slate-200 flex justify-end gap-3"><Button variant="outline" className="h-9 px-6 border-slate-300 text-slate-700" onClick={() => setShowAddBankModal(false)}>Hủy</Button><Button className="bg-blue-600 hover:bg-blue-700 h-9 px-6 font-medium" onClick={handleSaveBankAccount}>Lưu</Button></div></div></div>)}
      {showReceiveMoneyModal && (<div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center animate-in fade-in zoom-in-95 duration-200"><div className="bg-white rounded-lg shadow-xl w-[500px] max-w-[95vw] overflow-hidden flex flex-col"><div className="flex justify-between items-center px-4 py-3 border-b border-slate-200"><h2 className="text-[16px] font-bold text-slate-800">Nhận tiền</h2><button onClick={() => setShowReceiveMoneyModal(false)} className="text-slate-400 hover:text-slate-600"><X size={20}/></button></div><div className="p-4 space-y-4"><div className="grid grid-cols-2 gap-4"><div className="space-y-1"><label className="text-[13px] font-medium text-slate-600">Phương thức thanh toán<span className="text-red-500">*</span></label><Select value={receiveMoneyForm.method} onValueChange={(val) => setReceiveMoneyForm({...receiveMoneyForm, method: val})}><SelectTrigger className="h-9 text-[13px]"><SelectValue placeholder="Chọn phương thức"/></SelectTrigger><SelectContent><SelectItem value="cash">Tiền mặt</SelectItem><SelectItem value="transfer">Chuyển khoản</SelectItem><SelectItem value="pos">Quẹt thẻ (POS)</SelectItem></SelectContent></Select></div><div className="space-y-1"><label className="text-[13px] font-medium text-slate-600">Số tiền nhận</label><div className="relative"><Input className="h-9 text-[13px] pr-8 text-right font-medium" value={receiveMoneyForm.amount} onChange={(e) => setReceiveMoneyForm({...receiveMoneyForm, amount: e.target.value})}/><span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 text-[13px]">đ</span></div></div></div><div className="space-y-1"><label className="text-[13px] font-medium text-slate-600">Tham chiếu</label><Input placeholder="Nhập tham chiếu" className="h-9 text-[13px]" value={receiveMoneyForm.reference} onChange={(e) => setReceiveMoneyForm({...receiveMoneyForm, reference: e.target.value})}/></div></div><div className="px-4 py-3 border-t border-slate-200 flex justify-end gap-2"><Button variant="outline" className="h-9 px-4 border-slate-300 text-slate-700" onClick={() => setShowReceiveMoneyModal(false)}>Hủy</Button><Button className="bg-blue-600 hover:bg-blue-700 h-9 px-4 font-medium" onClick={handleProcessPayment}>Nhận tiền</Button></div></div></div>)}

      {/* ================= [MỚI] MODAL XÁC NHẬN ĐÃ GIAO ================= */}
      {showConfirmDeliveredModal && (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center animate-in fade-in duration-200">
            <div className="bg-white rounded-lg shadow-xl w-[500px] max-w-[95vw] overflow-hidden flex flex-col">
                <div className="flex justify-between items-center px-4 py-3 border-b border-slate-200">
                    <h2 className="text-[16px] font-bold text-slate-800">Xác nhận đã giao hàng</h2>
                    <button onClick={() => setShowConfirmDeliveredModal(false)} className="text-slate-400 hover:text-slate-600"><X size={20}/></button>
                </div>
                <div className="p-6">
                    <p className="text-[14px] text-slate-700">Bạn có chắc chắn chuyển trạng thái thành đã giao hàng không?</p>
                </div>
                <div className="px-4 py-3 border-t border-slate-200 flex justify-end gap-2">
                    <Button variant="outline" className="h-9 px-4 border-slate-300 text-slate-700" onClick={() => setShowConfirmDeliveredModal(false)}>Hủy</Button>
                    <Button className="bg-blue-600 hover:bg-blue-700 h-9 px-4 font-medium" onClick={handleConfirmDeliveredSuccess}>Xác nhận</Button>
                </div>
            </div>
        </div>
      )}

    </div>
  );
}