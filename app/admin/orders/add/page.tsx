"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronLeft, Search, Plus, Box, Info, ChevronDown, ChevronUp, X, CheckCircle2, Trash2, AlertTriangle, ArrowRight, RefreshCcw, Pencil, Navigation
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch"; 
import { cn } from "@/lib/utils";
import { toast } from "sonner";

// --- MOCK DATA API ĐỊA CHÍNH (Giả lập DB) ---
const LOCATION_DB: any = {
    provinces: [ 
        { id: "01", name: "Thành phố Hà Nội" }, 
        { id: "79", name: "Thành phố Hồ Chí Minh" }, 
        { id: "24", name: "Tỉnh Bắc Kạn" },
        { id: "92", name: "Thành phố Cần Thơ" } 
    ],
    districts: {
        "01": [ { id: "001", name: "Quận Ba Đình" }, { id: "002", name: "Quận Hoàn Kiếm" }, { id: "003", name: "Quận Tây Hồ" } ],
        "79": [ { id: "760", name: "Quận 1" }, { id: "761", name: "Quận 12" }, { id: "764", name: "Quận Gò Vấp" } ],
        "24": [ { id: "100", name: "Huyện Chợ Mới" } ],
        "92": [ { id: "916", name: "Quận Ninh Kiều" }, { id: "917", name: "Quận Bình Thủy" }, { id: "918", name: "Quận Cái Răng" } ]
    },
    wards: {
        "001": [{ id: "00001", name: "Phường Phúc Xá" }, { id: "00004", name: "Phường Trúc Bạch" }], 
        "002": [{ id: "00037", name: "Phường Phúc Tân" }, { id: "00040", name: "Phường Đồng Xuân" }], 
        "760": [{ id: "26734", name: "Phường Tân Định" }, { id: "26740", name: "Phường Đa Kao" }], 
        "764": [{ id: "27196", name: "Phường 1" }, { id: "27199", name: "Phường 3" }, { id: "27208", name: "Phường 13" }],
        "100": [{ id: "999", name: "Xã Thanh Mai" }],
        "916": [{ id: "31147", name: "Phường Cái Khế" }, { id: "31150", name: "Phường An Hòa" }]
    }
};

// --- MOCK DATA ĐỐI TÁC VẬN CHUYỂN ---
const SHIPPING_PARTNERS = [
    { id: "sapo", name: "Sapo Express", connected: true, price: 35000, error: "Bạn đang vượt quá mức tín dụng..." },
    { id: "vnpost", name: "Vietnam Post", connected: false },
    { id: "viettel", name: "Viettel Post", connected: false },
    { id: "spx", name: "SPX Express", connected: false, logo: "SPX" } 
];

// Mock sản phẩm
const MOCK_PRODUCT = {
  id: 1, sku: "TACT010", name: "Thức ăn cho tôm bao", unit: "kg", packaging: "bao", price: 110000, quantity: 5,
};

export default function CreateOrderPage() {
  const router = useRouter();

  // --- STATES CHÍNH ---
  const [orderItems, setOrderItems] = useState<any[]>([]);
  const [shippingMethod, setShippingMethod] = useState<"gateway" | "self" | "delivered" | "later">("gateway");
  const [paymentStatus, setPaymentStatus] = useState<"paid" | "later">("later");
  const [customer, setCustomer] = useState<any>(null);
  const [paidAmount, setPaidAmount] = useState<string>(""); 

  // --- MODAL STATES ---
  const [showInventoryModal, setShowInventoryModal] = useState(false);
  const [showBatchModal, setShowBatchModal] = useState(false);
  const [showNoteModal, setShowNoteModal] = useState(false); 
  const [showCustomProductModal, setShowCustomProductModal] = useState(false);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false); 
  const [showDiscountModal, setShowDiscountModal] = useState(false);
  const [showShippingFeeModal, setShowShippingFeeModal] = useState(false); 
  const [showPartnerConnectModal, setShowPartnerConnectModal] = useState(false); 
  const [showAddCustomerModal, setShowAddCustomerModal] = useState(false);
  const [showAddPartnerModal, setShowAddPartnerModal] = useState(false);
  const [showEditGroupModal, setShowEditGroupModal] = useState(false);
  const [showEditContactModal, setShowEditContactModal] = useState(false);
  const [showEditAddressModal, setShowEditAddressModal] = useState<"shipping" | "billing" | null>(null);
   
  // --- STATE CHI TIẾT ---
  const [activeProductId, setActiveProductId] = useState<number | string | null>(null);
  const [tempNote, setTempNote] = useState(""); 
  const [batchRows, setBatchRows] = useState<any[]>([]);
  const [isNoInvoice, setIsNoInvoice] = useState(false); 
  const [discountForm, setDiscountForm] = useState({ code: "", isAuto: false, isManual: false, manualType: "value" as "value" | "percent", manualValue: "", reason: "" });
  const [appliedDiscount, setAppliedDiscount] = useState(0);
  const [shippingAddress, setShippingAddress] = useState({ province: "", district: "", ward: "" });
  const [districts, setDistricts] = useState<any[]>([]);
  const [wards, setWards] = useState<any[]>([]);
  const [shippingFeeConfig, setShippingFeeConfig] = useState({ type: "delivery" as "delivery" | "custom", customFee: "", selectedPartnerId: "" });
  const [appliedShippingFee, setAppliedShippingFee] = useState(0);
  const [customProduct, setCustomProduct] = useState({ name: "", price: "", quantity: 1, isTaxable: false, isShippable: false, weight: 0, weightUnit: "g" });
  const [newPartnerForm, setNewPartnerForm] = useState({ name: "", phone: "", email: "", address: "", note: "", payer: "shop" });
  const [activeFilters, setActiveFilters] = useState<{status: string | null, stock: string | null}>({ status: "Còn hạn", stock: null });
  const [openFilterDropdown, setOpenFilterDropdown] = useState<"status" | "stock" | null>(null);
  const [tempFilterValue, setTempFilterValue] = useState<string>("");
   
  // State cho Tự giao hàng
  const [selfShippingFee, setSelfShippingFee] = useState<string>("0"); 

  // State cho Khách hàng
  const [isCustomerSearchFocused, setIsCustomerSearchFocused] = useState(false);
  const [expandCustomerInfo, setExpandCustomerInfo] = useState(false);
  const [isNewAddressFormat, setIsNewAddressFormat] = useState(false); 
  const [isCustomerDetailCollapsed, setIsCustomerDetailCollapsed] = useState(false);

  // State cho địa chỉ trong modal (thêm mới khách hàng)
  const [modalAddress, setModalAddress] = useState({
    provinceId: "",
    districtId: "",
    wardId: "",
    detail: ""
  });

  const [modalDistricts, setModalDistricts] = useState<any[]>([]);
  const [modalWards, setModalWards] = useState<any[]>([]);

  // Auto-fill địa chỉ cụ thể
  useEffect(() => {
    if (modalAddress.provinceId && modalAddress.districtId && modalAddress.wardId) {
      const p = LOCATION_DB.provinces.find((i:any) => i.id === modalAddress.provinceId)?.name;
      const d = modalDistricts.find((i:any) => i.id === modalAddress.districtId)?.name;
      const w = modalWards.find((i:any) => i.id === modalAddress.wardId)?.name;
      
      if (p && d && w) {
        setModalAddress(prev => ({
          ...prev,
          detail: `${w}, ${d}, ${p}`
        }));
      }
    }
  }, [modalAddress.provinceId, modalAddress.districtId, modalAddress.wardId, modalDistricts, modalWards]);

  // --- LOGIC ---
  const handleModalProvinceChange = (val: string) => {
    setModalAddress({ provinceId: val, districtId: "", wardId: "", detail: "" });
    setModalDistricts(LOCATION_DB.districts[val] || []);
    setModalWards([]);
  };

  const handleModalDistrictChange = (val: string) => {
    setModalAddress(prev => ({ ...prev, districtId: val, wardId: "", detail: "" }));
    setModalWards(LOCATION_DB.wards[val] || []);
  };

  const handleModalWardChange = (val: string) => {
    setModalAddress(prev => ({ ...prev, wardId: val }));
  };

  const handleAddProductMock = () => { const existing = orderItems.find(i => i.id === MOCK_PRODUCT.id); if (existing) { setOrderItems(orderItems.map(i => i.id === MOCK_PRODUCT.id ? { ...i, quantity: i.quantity + 1 } : i)); } else { setOrderItems([...orderItems, { ...MOCK_PRODUCT }]); } toast.success("Đã thêm sản phẩm"); };
  const updateQuantity = (id: number | string, delta: number) => { setOrderItems(prev => prev.map(item => { if (item.id === id) return { ...item, quantity: Math.max(1, item.quantity + delta) }; return item; })); };
  const removeProduct = (id: number | string) => { setOrderItems(prev => prev.filter(i => i.id !== id)); }
  const handleConfirmBatch = () => { if (activeProductId !== null) { setOrderItems(prev => prev.map(item => { if (item.id === activeProductId) { return { ...item, selectedBatch: { name: "DEFAULT", quantity: 1 } }; } return item; })); setShowBatchModal(false); setActiveProductId(null); toast.success("Đã phân bổ lô thành công"); } };
  const handleRemoveBatch = (itemId: number | string) => { setOrderItems(prev => prev.map(item => { if (item.id === itemId) { const newItem = { ...item }; delete newItem.selectedBatch; return newItem; } return item; })); };
  const handleOpenNoteModal = (item: any) => { setActiveProductId(item.id); setTempNote(item.note || ""); setShowNoteModal(true); };
  const handleSaveNote = () => { if (activeProductId !== null) { setOrderItems(prev => prev.map(item => { if (item.id === activeProductId) { return { ...item, note: tempNote.trim() }; } return item; })); setShowNoteModal(false); setActiveProductId(null); setTempNote(""); toast.success("Đã lưu ghi chú"); } };
  const handleApplyDiscount = () => { let discountVal = 0; const currentTotal = orderItems.reduce((sum, item) => sum + (item.price * item.quantity), 0); if (discountForm.isManual) { const val = Number(discountForm.manualValue) || 0; if (discountForm.manualType === "value") { discountVal = val; } else { discountVal = (currentTotal * val) / 100; } } setAppliedDiscount(discountVal); setShowDiscountModal(false); toast.success("Đã áp dụng giảm giá"); };
  const handleProvinceChange = (provId: string) => { setShippingAddress({ province: provId, district: "", ward: "" }); const newDistricts = LOCATION_DB.districts[provId] || []; setDistricts(newDistricts); setWards([]); };
  const handleDistrictChange = (distId: string) => { setShippingAddress({ ...shippingAddress, district: distId, ward: "" }); const newWards = LOCATION_DB.wards[distId] || []; setWards(newWards); };
  const handleWardChange = (wardId: string) => { setShippingAddress({ ...shippingAddress, ward: wardId }); toast.info("Đang cập nhật phí vận chuyển..."); };
  const handleSaveShippingFee = () => { let fee = 0; if (shippingFeeConfig.type === "custom") { fee = Number(shippingFeeConfig.customFee) || 0; } else if (shippingFeeConfig.type === "delivery") { fee = 35000; } setAppliedShippingFee(fee); setShowShippingFeeModal(false); toast.success("Đã cập nhật phí giao hàng"); };
  const handleAddCustomProduct = () => { if (!customProduct.name) return; const newProduct = { id: Date.now(), sku: "CUSTOM", name: customProduct.name, unit: "cái", packaging: "", price: Number(customProduct.price) || 0, quantity: Number(customProduct.quantity) || 1, isCustom: true }; setOrderItems([...orderItems, newProduct]); setShowCustomProductModal(false); setCustomProduct({ name: "", price: "", quantity: 1, isTaxable: false, isShippable: false, weight: 0, weightUnit: "g" }); toast.success("Đã thêm sản phẩm tùy chỉnh"); };
  const applyFilter = (type: any) => { setActiveFilters(prev => ({...prev, [type]: tempFilterValue})); setOpenFilterDropdown(null); }
  const removeFilter = (type: any) => { setActiveFilters(prev => ({...prev, [type]: null})); }
  
  // Logic Batch Modal
  const handleOpenBatchModal = (item: any) => { setActiveProductId(item.id); const totalQty = item.quantity; const qty1 = 1; const qty2 = Math.max(0, totalQty - 1); setBatchRows([ { id: 1, code: "DEFAULT", quantity: qty1, expiry: "---", status: "Còn hạn" }, { id: 2, code: "Lô Mới 2026", quantity: qty2, expiry: "01/01/2026", status: "Còn hạn" } ]); setShowBatchModal(true); };
  const handleBatchQtyChange = (index: number, value: string) => { const activeItem = orderItems.find(i => i.id === activeProductId); const totalLimit = activeItem?.quantity || 0; let newQty = Number(value); if (newQty < 0) newQty = 0; if (newQty > totalLimit) newQty = totalLimit; const newRows = [...batchRows]; newRows[index].quantity = newQty; if (newRows.length === 2) { const otherIndex = index === 0 ? 1 : 0; newRows[otherIndex].quantity = totalLimit - newQty; } setBatchRows(newRows); };
  const handleDeleteBatchRow = (index: number) => { const activeItem = orderItems.find(i => i.id === activeProductId); const totalLimit = activeItem?.quantity || 0; const newRows = batchRows.filter((_, i) => i !== index); if (newRows.length === 1) { newRows[0].quantity = totalLimit; } setBatchRows(newRows); };
  const handleRemoveBatchTag = (itemId: number | string) => { setOrderItems(prev => prev.map(item => { if (item.id === itemId) { const newItem = { ...item }; delete newItem.selectedBatch; return newItem; } return item; })); }

  const handleSaveNewCustomer = () => {
      setCustomer({ 
        name: "Bình Nguyễn", 
        phone: "0986543987", 
        email: "Không có email", 
        totalSpent: 0, 
        lastOrder: "#1002", 
        group: "Không áp dụng nhóm khách hàng", 
        address: modalAddress.detail, 
        billingAddress: modalAddress.detail 
      });
      setShowAddCustomerModal(false); 
      setIsCustomerSearchFocused(false); 
      toast.success("Thêm khách hàng thành công");
  }
  const handleUpdateCustomerInfo = () => { toast.success("Đã cập nhật thông tin khách hàng"); setShowEditGroupModal(false); setShowEditContactModal(false); setShowEditAddressModal(null); }
  
  const handleSaveNewPartner = () => {
      if (!newPartnerForm.name) { toast.error("Vui lòng nhập tên đối tác"); return; }
      toast.success("Đã thêm đối tác: " + newPartnerForm.name);
      setShowAddPartnerModal(false);
      setNewPartnerForm({ name: "", phone: "", email: "", address: "", note: "", payer: "shop" });
  };

  // [MỚI] LOGIC ĐỔ DỮ LIỆU TỪ ĐƠN NHÁP
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const draftId = urlParams.get('draftId');

    // Giả lập đổ dữ liệu khi click "Chỉnh sửa" từ trang nháp
    if (draftId === "DRAFT-1005") {
      setCustomer({
        name: "Nguyễn Hoàng Gia Huy",
        phone: "0901234567",
        email: "huy.software@fpt.edu.vn",
        address: "Chi nhánh Cần Thơ",
        group: "Khách hàng thân thiết"
      });

      setOrderItems([
        {
          id: 1,
          sku: "TACT010",
          name: "Thức ăn cho tôm bao",
          unit: "kg",
          packaging: "bao",
          price: 110000,
          quantity: 2,
        },
        {
          id: 2,
          sku: "VS-PRO",
          name: "Vi sinh xử lý đáy",
          unit: "chai",
          packaging: "hộp",
          price: 1030000,
          quantity: 1,
        }
      ]);
      toast.info("Đã tải dữ liệu từ đơn hàng nháp " + draftId);
    } else if (draftId === "DRAFT-1004") {
        setCustomer({
            name: "Khách lẻ",
            phone: "---",
            email: "---",
            address: "Hệ thống",
            group: "Chưa phân loại"
        });
        setOrderItems([
            { id: 3, sku: "VOI02", name: "Vôi nông nghiệp", unit: "kg", packaging: "bao", price: 55000, quantity: 10 }
        ]);
        toast.info("Đã tải dữ liệu từ đơn hàng nháp " + draftId);
    }
  }, []);

  const totalAmount = orderItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const totalQuantity = orderItems.reduce((sum, item) => sum + item.quantity, 0);
  const shippingCost = shippingMethod === 'later' ? 0 : (shippingMethod === 'self' ? (Number(selfShippingFee) || 0) : appliedShippingFee);
  const finalAmount = Math.max(0, totalAmount - appliedDiscount) + shippingCost;
  
  useEffect(() => { if (paymentStatus === "paid") { setPaidAmount(finalAmount.toLocaleString()); } }, [finalAmount, paymentStatus]);
  const hasProducts = orderItems.length > 0;
  const isValidCustomProduct = customProduct.name && customProduct.name.trim() !== "" && customProduct.price;

  return (
    <div className="bg-[#f0f2f5] min-h-screen pb-10 font-sans text-slate-800 relative">
      <div className="bg-white border-b border-slate-200 px-4 py-3 flex items-center gap-3 sticky top-0 z-40 shadow-sm">
        <Button variant="outline" size="icon" onClick={() => router.back()} className="h-8 w-8 border-slate-300"><ChevronLeft size={18} /></Button>
        <h1 className="text-[18px] font-bold text-slate-800">Tạo đơn hàng</h1>
      </div>

      <div className="max-w-[1200px] mx-auto p-4 grid grid-cols-12 gap-4">
        {/* CỘT TRÁI */}
        <div className="col-span-12 lg:col-span-8 space-y-4">
          <div className="bg-white rounded-sm shadow-sm p-4">
             <div className="flex justify-between items-center mb-3">
                <h3 className="font-bold text-[14px]">Sản phẩm</h3>
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2"><Checkbox id="split-row" /><label htmlFor="split-row" className="text-[13px] cursor-pointer select-none text-slate-600">Tách dòng</label></div>
                    {hasProducts && (<button onClick={() => setShowInventoryModal(true)} className="text-[13px] text-blue-600 hover:underline">Kiểm tra tồn kho</button>)}
                </div>
             </div>
             <div className="flex gap-2 mb-4">
                <div className="relative flex-1"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16}/><Input placeholder="Tìm theo tên, mã SKU... (F3)" className="pl-9 h-10 border-blue-300 focus-visible:ring-blue-500" onKeyDown={(e) => e.key === 'Enter' && handleAddProductMock()}/></div>
                <Button variant="outline" className="border-slate-300 text-slate-700 h-10">Chọn nhiều</Button>
             </div>
             <div className={cn("py-4", hasProducts ? "border-t border-slate-100" : "")}>
                {!hasProducts ? (
                    <div className="flex flex-col items-center justify-center h-40 text-slate-400 gap-3 border border-dashed border-slate-200 rounded bg-slate-50/50"><Box size={48} strokeWidth={1} className="text-slate-300" /><span className="text-[13px]">Bạn chưa thêm sản phẩm nào</span><Button variant="outline" className="text-blue-600 border-blue-600 hover:bg-blue-50 h-8" onClick={handleAddProductMock}>Thêm sản phẩm</Button></div>
                ) : (
                    <div className="space-y-0">
                        <div className="flex items-center px-2 pb-2 text-[12px] font-bold text-slate-800"><div className="flex-1">Sản phẩm</div><div className="w-24 text-center">Số lượng</div><div className="w-24 text-right">Đơn giá</div><div className="w-24 text-right pr-8">Thành tiền</div></div>
                        {orderItems.map((item) => (
                            <div key={item.id} className="flex items-start gap-3 border-t border-dashed border-slate-200 py-3 group hover:bg-slate-50/50 transition-colors animate-in fade-in">
                                <div className="w-10 h-10 border border-slate-200 rounded flex items-center justify-center bg-slate-50 shrink-0 mt-1"><Box size={18} className="text-slate-400"/></div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-[13px] font-bold text-blue-600 cursor-pointer hover:underline truncate">{item.name}</p>
                                    <div className="text-[12px] text-slate-500 mb-1 flex items-center gap-2"><span>{item.packaging}</span><span className="w-[1px] h-3 bg-slate-300"></span><span>{item.sku}</span><span className="w-[1px] h-3 bg-slate-300"></span><span>Đơn vị: <span className="font-bold text-slate-700">{item.unit}</span></span></div>
                                    {item.selectedBatch && (<div className="inline-flex items-center gap-1 bg-blue-100 text-slate-800 text-[12px] px-2 py-0.5 rounded mb-1 border border-blue-200"><span className="font-semibold">{item.selectedBatch.name}</span><span className="text-slate-400">|</span><span>SL:{item.selectedBatch.quantity}</span><button onClick={() => handleRemoveBatchTag(item.id)} className="ml-1 text-slate-400 hover:text-red-500"><X size={12} /></button></div>)}
                                    {item.note && (<div className="text-[12px] text-slate-600 mb-1 flex items-start gap-1"><span className="font-bold text-slate-400 shrink-0">Ghi chú:</span><span className="break-words">{item.note}</span></div>)}
                                    <div className="flex gap-4 mt-1"><button onClick={() => handleOpenNoteModal(item)} className="text-[12px] text-blue-600 hover:underline">{item.note ? "Sửa ghi chú" : "Thêm ghi chú"}</button><button onClick={() => handleOpenBatchModal(item)} className="text-[12px] text-blue-600 hover:underline">Chọn lô bán hàng</button></div>
                                </div>
                                <div className="w-24 flex justify-center"><div className="flex items-center border border-slate-300 rounded bg-white h-8 w-[80px]"><input className="w-full text-center text-[13px] outline-none bg-transparent" value={item.quantity} readOnly /><div className="flex flex-col border-l border-slate-300 h-full"><button onClick={() => updateQuantity(item.id, 1)} className="px-1 h-4 hover:bg-slate-100 flex items-center justify-center border-b border-slate-300"><ChevronDown size={10} className="rotate-180"/></button><button onClick={() => updateQuantity(item.id, -1)} className="px-1 h-3.5 hover:bg-slate-100 flex items-center justify-center"><ChevronDown size={10}/></button></div></div></div>
                                <div className="w-24 text-right pt-1.5"><span className="text-[13px] text-blue-600 font-medium">{item.price.toLocaleString()}đ</span></div>
                                <div className="w-24 text-right pt-1.5 flex items-start justify-end gap-2"><span className="text-[13px] font-bold text-slate-800">{(item.price * item.quantity).toLocaleString()}đ</span><button onClick={() => removeProduct(item.id)} className="text-slate-400 hover:text-slate-600 mt-0.5"><X size={14}/></button></div>
                            </div>
                        ))}
                    </div>
                )}
             </div>
             <div className="pt-2 border-t border-slate-100 mt-2">
                <button onClick={() => setShowCustomProductModal(true)} className="flex items-center gap-1 text-[13px] text-blue-600 font-medium hover:underline"><Plus size={14}/> Thêm sản phẩm hoặc dịch vụ tùy chỉnh</button>
             </div>
          </div>

          <div className="bg-white rounded-sm shadow-sm p-4">
            <h3 className="font-bold text-[14px] mb-3">Thanh toán</h3>
            <div className="space-y-2 mb-4 text-[13px]">
                <div className="flex justify-between items-center"><span className="text-slate-600">Tổng tiền hàng</span>{hasProducts && <span className="text-slate-500 text-[12px]">{totalQuantity} sản phẩm</span>}<span className="font-bold">{totalAmount > 0 ? totalAmount.toLocaleString() : 0}đ</span></div>
                <div className="flex justify-between text-blue-600 cursor-pointer hover:underline" onClick={() => setShowDiscountModal(true)}><span>Thêm giảm giá (F6)</span><span className={appliedDiscount > 0 ? "text-red-500" : "text-slate-400"}>{appliedDiscount > 0 ? `-${appliedDiscount.toLocaleString()}đ` : "0đ"}</span></div>
                
                <div 
                    className={cn("flex justify-between text-blue-600 cursor-pointer hover:underline", shippingMethod === 'later' && "opacity-50 pointer-events-none hidden")} 
                    onClick={() => { if(shippingMethod !== 'self' && shippingMethod !== 'later') setShowShippingFeeModal(true); }}
                >
                    <span>Thêm phí giao hàng (F7)</span>
                    <span className={shippingCost > 0 ? "text-slate-800 font-bold" : "text-slate-400"}>
                        {shippingCost > 0 ? `${shippingCost.toLocaleString()}đ` : "0đ"}
                    </span>
                </div>

                {hasProducts && (<div className="flex justify-between items-center font-bold text-[16px] border-t border-slate-100 pt-3 mt-1"><span>Thành tiền</span><span className="text-slate-800">{finalAmount.toLocaleString()}đ</span></div>)}
            </div>
            {hasProducts && (
                <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                    <RadioGroup defaultValue="later" value={paymentStatus} onValueChange={(val: any) => setPaymentStatus(val)} className="space-y-4 mt-4">
                        <div><div className="flex items-center space-x-2 mb-2"><RadioGroupItem value="later" id="later" className="text-blue-600 border-slate-300" /><Label htmlFor="later" className="font-normal text-[13px]">Thanh toán sau</Label></div>{paymentStatus === "later" && (<div className="pl-6 animate-in fade-in slide-in-from-top-1 duration-200"><p className="text-[12px] text-slate-500 mb-1">Hình thức thanh toán</p><Select defaultValue="cash"><SelectTrigger className="h-9 w-[300px] text-[13px]"><SelectValue/></SelectTrigger><SelectContent><SelectItem value="cash">Tiền mặt</SelectItem><SelectItem value="transfer">Chuyển khoản</SelectItem><SelectItem value="cod">COD</SelectItem></SelectContent></Select></div>)}</div>
                        <div><div className="flex items-center space-x-2 mb-2"><RadioGroupItem value="paid" id="paid" className="text-blue-600 border-slate-300" /><Label htmlFor="paid" className="font-normal text-[13px]">Đã thanh toán</Label></div>{paymentStatus === "paid" && (<div className="pl-6 flex gap-4 animate-in fade-in slide-in-from-top-1 duration-200"><div className="flex-1"><p className="text-[12px] text-slate-500 mb-1">Hình thức thanh toán</p><Select defaultValue="cash"><SelectTrigger className="h-9 text-[13px]"><SelectValue/></SelectTrigger><SelectContent><SelectItem value="cash">Tiền mặt</SelectItem><SelectItem value="transfer">Chuyển khoản</SelectItem><SelectItem value="cod">Thẻ</SelectItem></SelectContent></Select></div><div className="flex-1"><p className="text-[12px] text-slate-500 mb-1">Số tiền</p><div className="relative"><Input className="h-9 text-[13px] pr-8" value={paidAmount} onChange={(e) => setPaidAmount(e.target.value)} /><span className="absolute right-3 top-1/2 -translate-y-1/2 text-[13px] text-slate-500">đ</span></div></div></div>)}</div>
                    </RadioGroup>
                </div>
            )}
          </div>

          <div className="col-span-12 mt-6 pt-4 border-t border-slate-300 flex justify-end gap-3">
              <Button variant="outline" className="border-blue-600 text-blue-600 hover:bg-blue-50 font-medium h-9 px-6 bg-white">Lưu nháp</Button>
              <div className="flex">
                  <Button className="rounded-r-none bg-blue-600 hover:bg-blue-700 font-bold h-9 px-6">
                      {shippingMethod === 'later' ? "Tạo đơn hàng" : "Tạo đơn và giao hàng"}
                  </Button>
                  <div className="w-[1px] bg-blue-500"></div>
                  <Button className="rounded-l-none bg-blue-600 hover:bg-blue-700 h-9 px-2"><ChevronDown size={16}/></Button>
              </div>
          </div>
        </div>

        {/* ================= CỘT PHẢI (SIDEBAR) ================= */}
        <div className="col-span-12 lg:col-span-4 space-y-4">
             <div className="bg-white rounded-sm shadow-sm p-4"><label className="text-[13px] font-bold mb-2 block">Nguồn đơn</label><Select><SelectTrigger className="h-9 text-[13px]"><SelectValue placeholder="Chọn nguồn đơn"/></SelectTrigger><SelectContent><SelectItem value="pos">Tại quầy</SelectItem><SelectItem value="web">Website</SelectItem></SelectContent></Select><p className="text-[11px] text-slate-400 mt-2 leading-tight">Nguồn đơn sẽ giúp xác định nguồn bán hàng.</p></div>
             <div className="bg-white rounded-sm shadow-sm p-4 relative z-20"><div className="flex justify-between items-center mb-2"><label className="text-[13px] font-bold">Khách hàng</label>{customer && (<button onClick={() => setCustomer(null)} className="text-slate-400 hover:text-red-500"><X size={16}/></button>)}</div>{!customer ? (<div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14}/><Input placeholder="Tìm theo tên, SĐT... (F4)" className="pl-9 h-9 text-[13px]" onFocus={() => setIsCustomerSearchFocused(true)} onBlur={() => setTimeout(() => setIsCustomerSearchFocused(false), 200)}/>{isCustomerSearchFocused && (<div className="absolute top-full left-0 w-full bg-white shadow-xl border border-slate-200 rounded-md mt-1 z-30 overflow-hidden animate-in fade-in zoom-in-95 duration-100"><div className="p-2.5 flex items-center gap-2 text-blue-600 cursor-pointer hover:bg-blue-50 border-b border-slate-100" onClick={() => setShowAddCustomerModal(true)}><div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center"><Plus size={14} /></div><span className="text-[13px] font-medium">Thêm mới khách hàng</span></div><div className="max-h-[200px] overflow-y-auto"><div className="p-2.5 flex items-center gap-3 cursor-pointer hover:bg-slate-50 transition-colors" onClick={() => setCustomer({name: "Bình Nguyễn", phone: "0986543987", email: "Không có email", totalSpent: 0, lastOrder: "#1002", group: "Không áp dụng nhóm khách hàng", address: "7890, Xã Thanh Mai, Huyện Chợ Mới, Bắc Kạn, Vietnam", billingAddress: "7890, Xã Thanh Mai, Huyện Chợ Mới, Bắc Kạn, Vietnam"})}><div className="w-8 h-8 rounded-full bg-rose-200 text-rose-600 flex items-center justify-center text-[12px] font-bold">Bì</div><div><p className="text-[13px] font-bold text-slate-700">Bình Nguyễn</p><p className="text-[11px] text-slate-500">0986543987</p></div></div></div></div>)}</div>) : (<div className="space-y-3 animate-in fade-in"><div className="flex items-start justify-between"><div><p className="text-[13px] font-bold text-blue-600 cursor-pointer hover:underline">{customer.name}</p></div></div><div className="space-y-2 border-t border-slate-100 pt-2"><div className="flex justify-between text-[13px]"><span className="text-slate-600">Tổng chi tiêu (1 đơn hàng)</span><span className="font-bold">{customer.totalSpent || 0}đ</span></div><div className="flex justify-between text-[13px]"><span className="text-slate-600">Đơn gần nhất</span><span className="text-blue-600 cursor-pointer hover:underline">{customer.lastOrder || "Chưa có"}</span></div></div><div className={cn("space-y-3 border-t border-slate-100 pt-2 overflow-hidden transition-all duration-300", isCustomerDetailCollapsed ? "max-h-0 opacity-0 pt-0 border-none" : "max-h-[500px] opacity-100")}><div className="group"><div className="flex justify-between items-center"><span className="text-[13px] font-bold">Nhóm khách hàng</span><Pencil size={12} className="text-slate-400 cursor-pointer opacity-0 group-hover:opacity-100 hover:text-blue-600" onClick={() => setShowEditGroupModal(true)}/></div><p className="text-[12px] text-slate-500">{customer.group}</p></div><div className="group"><div className="flex justify-between items-center"><span className="text-[13px] font-bold">Thông tin liên hệ</span><Pencil size={12} className="text-slate-400 cursor-pointer opacity-0 group-hover:opacity-100 hover:text-blue-600" onClick={() => setShowEditContactModal(true)}/></div><p className="text-[12px] text-slate-500">{customer.email}</p><p className="text-[12px] text-slate-500">{customer.phone}</p></div><div className="group"><div className="flex justify-between items-center"><span className="text-[13px] font-bold">Địa chỉ giao hàng</span><Pencil size={12} className="text-slate-400 cursor-pointer opacity-0 group-hover:opacity-100 hover:text-blue-600" onClick={() => setShowEditAddressModal("shipping")}/></div><p className="text-[12px] font-medium">{customer.name}</p><p className="text-[12px] text-slate-500">{customer.phone}</p><p className="text-[12px] text-slate-500">{customer.address}</p></div><div className="group"><div className="flex justify-between items-center"><span className="text-[13px] font-bold">Địa chỉ thanh toán</span><Pencil size={12} className="text-slate-400 cursor-pointer opacity-0 group-hover:opacity-100 hover:text-blue-600" onClick={() => setShowEditAddressModal("billing")}/></div><p className="text-[12px] font-medium">{customer.name}</p><p className="text-[12px] text-slate-500">{customer.phone}</p><p className="text-[12px] text-slate-500">{customer.billingAddress || customer.address}</p></div></div><div className="border-t border-slate-100 pt-2 flex justify-center"><button onClick={() => setIsCustomerDetailCollapsed(!isCustomerDetailCollapsed)} className="text-[12px] text-blue-600 flex items-center gap-1 hover:underline">{isCustomerDetailCollapsed ? "Mở rộng" : "Thu gọn"} {isCustomerDetailCollapsed ? <ChevronDown size={12}/> : <ChevronUp size={12}/>}</button></div></div>)}</div>
             <div className="bg-white rounded-sm shadow-sm p-4"><label className="text-[13px] font-bold mb-2 block">Ghi chú</label><Textarea placeholder="VD: Nhận hàng ghi công nợ" className="h-20 text-[13px] resize-none" /></div>
             <div className="bg-white rounded-sm shadow-sm p-4 space-y-3"><h3 className="font-bold text-[13px]">Thông tin bổ sung</h3><div className="space-y-1"><label className="text-[12px] text-slate-500">Bán tại chi nhánh</label><Select defaultValue="main"><SelectTrigger className="h-9 text-[13px]"><SelectValue/></SelectTrigger><SelectContent><SelectItem value="main">Cửa hàng chính</SelectItem></SelectContent></Select></div><div className="space-y-1"><label className="text-[12px] text-slate-500">Nhân viên phụ trách</label><Select defaultValue="admin"><SelectTrigger className="h-9 text-[13px]"><SelectValue/></SelectTrigger><SelectContent><SelectItem value="admin">Admin Z-OneTeam</SelectItem></SelectContent></Select></div><div className="space-y-1"><label className="text-[12px] text-slate-500 flex items-center gap-1">Ngày đặt hàng <Info size={10}/></label><div className="relative"><Input className="h-9 text-[13px] pl-3" type="date" /></div></div><div className="space-y-1"><label className="text-[12px] text-slate-500">Ngày hẹn giao</label><div className="relative"><Input className="h-9 text-[13px] pl-3" type="date" /></div></div><div className="space-y-1 pt-2 border-t border-slate-100"><div className="flex justify-between"><label className="text-[12px] text-slate-500">Tag</label><span className="text-[11px] text-blue-600 cursor-pointer">Danh sách tag</span></div><Input placeholder="Tìm kiếm hoặc thêm mới tag" className="h-9 text-[13px]" /></div></div>
        </div>
      </div>

      {/* ================= MODALS ================= */}
      {showInventoryModal && (<div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center animate-in fade-in duration-200"><div className="bg-white rounded-md shadow-xl w-[900px] max-w-[95vw] overflow-hidden"><div className="flex justify-between items-center px-4 py-3 border-b border-slate-200"><h2 className="text-[16px] font-bold text-slate-800">Kiểm tra tồn kho</h2><button onClick={() => setShowInventoryModal(false)} className="text-slate-400 hover:text-slate-600 transition-colors"><X size={20} /></button></div><div className="p-4 space-y-4"><div className="space-y-1"><label className="text-[13px] font-medium text-slate-600">Chi nhánh</label><Select defaultValue="main"><SelectTrigger className="h-9 w-[300px] text-[13px]"><SelectValue/></SelectTrigger><SelectContent><SelectItem value="main">Cửa hàng chính</SelectItem></SelectContent></Select></div><div className="border border-slate-200 rounded-sm"><table className="w-full text-[13px]"><thead className="bg-[#f4f6f8] text-slate-600 font-bold border-b border-slate-200"><tr><th className="py-2 px-4 text-left border-r border-slate-200" rowSpan={2}>Tên sản phẩm</th><th className="py-2 px-4 text-left border-r border-slate-200" rowSpan={2}>Mã SKU</th><th className="py-2 px-4 text-center border-r border-slate-200" rowSpan={2}>Số lượng</th><th className="py-1 px-4 text-center border-b border-slate-200 bg-white" colSpan={2}><div className="flex flex-col items-center"><span>Cửa hàng chính</span><span className="flex items-center gap-1 text-[11px] text-emerald-600 font-normal mt-0.5"><CheckCircle2 size={12} className="fill-emerald-600 text-white"/> Còn hàng</span></div></th></tr><tr className="bg-[#f9fafb]"><th className="py-1 px-4 text-center font-medium text-slate-500 border-r border-slate-200 w-[120px]">Tồn kho</th><th className="py-1 px-4 text-center font-medium text-slate-500 w-[120px]">Có thể bán</th></tr></thead><tbody>{orderItems.map((item) => (<tr key={item.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50"><td className="py-3 px-4 font-medium text-slate-700 border-r border-slate-100">{item.name}</td><td className="py-3 px-4 text-slate-600 border-r border-slate-100">{item.sku}</td><td className="py-3 px-4 text-center font-bold text-slate-800 border-r border-slate-100">{item.quantity}</td><td className="py-3 px-4 text-center text-slate-600 border-r border-slate-100">0</td><td className="py-3 px-4 text-center text-slate-600">0</td></tr>))}</tbody></table></div></div><div className="px-4 py-3 border-t border-slate-200 flex justify-end"><Button onClick={() => setShowInventoryModal(false)} className="bg-blue-600 hover:bg-blue-700 h-9 px-6 font-medium">Đóng</Button></div></div></div>)}
      {showBatchModal && (<div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center animate-in fade-in duration-200"><div className="bg-white rounded-md shadow-xl w-[900px] max-w-[95vw] overflow-hidden" onClick={() => setOpenFilterDropdown(null)}><div className="flex justify-between items-center px-4 py-3 border-b border-slate-200"><h2 className="text-[16px] font-bold text-slate-800">Chọn lô bán hàng</h2><button onClick={() => setShowBatchModal(false)} className="text-slate-400 hover:text-slate-600"><X size={20}/></button></div><div className="p-4 space-y-4"><div className="bg-slate-50 p-3 rounded text-[13px] text-slate-700 space-y-1"><div className="flex justify-between"><span>Số lượng sản phẩm bán:</span><span className="font-bold">{orderItems.find(i=>i.id===activeProductId)?.quantity} sản phẩm</span></div><div className="flex justify-between"><span>Số lượng phân bổ lô đang chọn:</span><span className="font-bold">{orderItems.find(i=>i.id===activeProductId)?.quantity} sản phẩm trong {batchRows.length} lô</span></div></div><div className="flex gap-2"><div className="relative flex-1"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14}/><Input placeholder="Tìm kiếm theo mã lô" className="pl-9 h-9 text-[13px]"/></div><div className="relative" onClick={(e) => e.stopPropagation()}><Button variant="outline" className={cn("h-9 text-[13px] font-normal", openFilterDropdown === 'status' && "border-blue-500 text-blue-600 bg-blue-50")} onClick={() => { setOpenFilterDropdown(openFilterDropdown === 'status' ? null : 'status'); setTempFilterValue("Còn hạn"); }}>Trạng thái <ChevronDown size={14} className="ml-1"/></Button>{openFilterDropdown === 'status' && (<div className="absolute top-10 right-0 bg-white shadow-xl border border-slate-200 rounded p-3 z-20 w-[200px] animate-in fade-in zoom-in-95 duration-100"><RadioGroup value={tempFilterValue} onValueChange={setTempFilterValue} className="space-y-3 mb-3"><div className="flex items-center space-x-2"><RadioGroupItem value="Hết hạn" id="r1" /><Label htmlFor="r1" className="font-normal text-[13px] cursor-pointer">Hết hạn</Label></div><div className="flex items-center space-x-2"><RadioGroupItem value="Còn hạn" id="r2" /><Label htmlFor="r2" className="font-normal text-[13px] cursor-pointer">Còn hạn</Label></div></RadioGroup><Button className="w-full bg-blue-600 hover:bg-blue-700 h-8 text-[13px]" onClick={() => applyFilter('status')}>Lọc</Button></div>)}</div><div className="relative" onClick={(e) => e.stopPropagation()}><Button variant="outline" className={cn("h-9 text-[13px] font-normal", openFilterDropdown === 'stock' && "border-blue-500 text-blue-600 bg-blue-50")} onClick={() => { setOpenFilterDropdown(openFilterDropdown === 'stock' ? null : 'stock'); setTempFilterValue("Còn hàng"); }}>Tồn kho <ChevronDown size={14} className="ml-1"/></Button>{openFilterDropdown === 'stock' && (<div className="absolute top-10 right-0 bg-white shadow-xl border border-slate-200 rounded p-3 z-20 w-[200px] animate-in fade-in zoom-in-95 duration-100"><RadioGroup value={tempFilterValue} onValueChange={setTempFilterValue} className="space-y-3 mb-3"><div className="flex items-center space-x-2"><RadioGroupItem value="Hết hàng" id="s1" /><Label htmlFor="s1" className="font-normal text-[13px] cursor-pointer">Hết hàng</Label></div><div className="flex items-center space-x-2"><RadioGroupItem value="Còn hàng" id="s2" /><Label htmlFor="s2" className="font-normal text-[13px] cursor-pointer">Còn hàng</Label></div></RadioGroup><Button className="w-full bg-blue-600 hover:bg-blue-700 h-8 text-[13px]" onClick={() => applyFilter('stock')}>Lọc</Button></div>)}</div></div><div className="flex flex-wrap gap-2">{activeFilters.status && (<span className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-[12px] flex items-center gap-1 animate-in fade-in zoom-in">Trạng thái: {activeFilters.status} <X size={14} className="cursor-pointer hover:text-blue-900 ml-1" onClick={() => removeFilter('status')}/></span>)}{activeFilters.stock && (<span className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-[12px] flex items-center gap-1 animate-in fade-in zoom-in">Tồn kho: {activeFilters.stock} <X size={14} className="cursor-pointer hover:text-blue-900 ml-1" onClick={() => removeFilter('stock')}/></span>)}</div><div className="border border-slate-200 rounded-sm"><table className="w-full text-[13px]"><thead className="bg-[#f4f6f8] font-bold text-slate-700 border-b border-slate-200"><tr><th className="py-2 px-4 text-left">Mã lô</th><th className="py-2 px-4 text-left">Trạng thái</th><th className="py-2 px-4 text-left">Ngày sản xuất</th><th className="py-2 px-4 text-left">Hạn sử dụng</th><th className="py-2 px-4 text-center">SL tồn kho</th><th className="py-2 px-4 text-left w-[120px]">SL bán</th><th className="py-2 px-4"></th></tr></thead><tbody>{batchRows.map((row: any, index: number) => (<tr key={row.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors animate-in fade-in slide-in-from-top-1"><td className="py-3 px-4 font-medium text-blue-600 cursor-pointer hover:underline">{row.code}</td><td className="py-3 px-4"><span className="text-emerald-600 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-full text-[11px]">{row.status}</span></td><td className="py-3 px-4 text-slate-500">{row.expiry === "---" ? "---" : "01/01/2026"}</td><td className="py-3 px-4 text-slate-500">{row.expiry}</td><td className="py-3 px-4 text-center">100</td><td className="py-3 px-4"><Input className="h-8 w-20 text-center border-blue-500 ring-1 ring-blue-500 focus-visible:ring-offset-0" value={row.quantity} onChange={(e) => handleBatchQtyChange(index, e.target.value)} type="number"/></td><td className="py-3 px-4 text-right">{index > 0 ? (<button onClick={() => handleDeleteBatchRow(index)} className="text-slate-400 hover:text-red-500 transition-colors"><Trash2 size={16} /></button>) : (<span className="text-blue-600 cursor-pointer hover:underline text-[12px]">Bỏ chọn</span>)}</td></tr>))}</tbody></table></div></div><div className="px-4 py-3 border-t border-slate-200 flex justify-end gap-2"><Button variant="outline" onClick={() => setShowBatchModal(false)}>Hủy</Button><Button variant="outline" className="text-red-600 border-red-200 hover:bg-red-50" onClick={() => { if (activeProductId) { handleRemoveBatch(activeProductId); setShowBatchModal(false); }}}>Xóa phân bổ lô</Button><Button className="bg-blue-600 hover:bg-blue-700" onClick={handleConfirmBatch}>Xác nhận</Button></div></div></div>)}
      {showNoteModal && (<div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center animate-in fade-in duration-200"><div className="bg-white rounded-md shadow-xl w-[500px] max-w-[95vw] overflow-hidden"><div className="flex justify-between items-center px-4 py-3 border-b border-slate-200"><h2 className="text-[16px] font-bold text-slate-800">Thêm ghi chú</h2><button onClick={() => setShowNoteModal(false)} className="text-slate-400 hover:text-slate-600"><X size={20}/></button></div><div className="p-4"><Textarea placeholder="Nhập nội dung ghi chú" className="h-24 text-[13px]" value={tempNote} onChange={(e) => setTempNote(e.target.value)}/></div><div className="px-4 py-3 border-t border-slate-200 flex justify-end gap-2"><Button variant="outline" onClick={() => setShowNoteModal(false)}>Hủy</Button><Button className="bg-blue-600 hover:bg-blue-700" onClick={handleSaveNote}>Lưu</Button></div></div></div>)}
      {showCustomProductModal && (<div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center animate-in fade-in duration-200"><div className="bg-white rounded-md shadow-xl w-[600px] max-w-[95vw] overflow-hidden"><div className="flex justify-between items-center px-4 py-3 border-b border-slate-200"><h2 className="text-[16px] font-bold text-slate-800">Thêm sản phẩm hoặc dịch vụ tùy chỉnh</h2><button onClick={() => setShowCustomProductModal(false)} className="text-slate-400 hover:text-slate-600"><X size={20}/></button></div><div className="p-4 space-y-3"><div className="space-y-1"><label className="text-[13px] font-medium text-red-500">Tên sản phẩm*</label><Input placeholder="Nhập tên sản phẩm (tối đa 320 ký tự)" className="h-9 text-[13px]" value={customProduct.name} onChange={(e) => setCustomProduct({...customProduct, name: e.target.value})}/></div><div className="grid grid-cols-2 gap-4"><div className="space-y-1"><label className="text-[13px] font-medium text-red-500">Giá bán*</label><div className="relative"><Input placeholder="Nhập giá bán" className="h-9 text-[13px] pr-8" type="number" value={customProduct.price} onChange={(e) => setCustomProduct({...customProduct, price: e.target.value})}/><span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-[13px]">đ</span></div></div><div className="space-y-1"><label className="text-[13px] font-medium">Số lượng</label><Input type="number" className="h-9 text-[13px]" value={customProduct.quantity} onChange={(e) => setCustomProduct({...customProduct, quantity: Number(e.target.value)})}/></div></div><div className="space-y-2 pt-1"><div className="flex items-center space-x-2"><Checkbox id="tax" checked={customProduct.isTaxable} onCheckedChange={(c) => setCustomProduct({...customProduct, isTaxable: !!c})}/><label htmlFor="tax" className="text-[13px] font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Tính thuế cho sản phẩm này</label></div><div className="flex items-center space-x-2"><Checkbox id="ship" checked={customProduct.isShippable} onCheckedChange={(c) => setCustomProduct({...customProduct, isShippable: !!c})}/><label htmlFor="ship" className="text-[13px] font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Đây là sản phẩm có vận chuyển</label></div></div>{customProduct.isShippable && (<div className="space-y-1 animate-in fade-in slide-in-from-top-1 duration-200"><label className="text-[13px] font-medium text-slate-600">Khối lượng</label><div className="flex"><Input type="number" className="h-9 text-[13px] rounded-r-none border-r-0 w-[200px]" value={customProduct.weight} onChange={(e) => setCustomProduct({...customProduct, weight: Number(e.target.value)})}/><Select defaultValue="g" value={customProduct.weightUnit} onValueChange={(val) => setCustomProduct({...customProduct, weightUnit: val})}><SelectTrigger className="h-9 w-[60px] rounded-l-none bg-slate-50 text-[13px]"><SelectValue/></SelectTrigger><SelectContent><SelectItem value="g">g</SelectItem><SelectItem value="kg">kg</SelectItem></SelectContent></Select></div></div>)}</div><div className="px-4 py-3 border-t border-slate-200 flex justify-end gap-2"><Button variant="outline" onClick={() => setShowCustomProductModal(false)}>Hủy</Button><Button className="bg-blue-600 hover:bg-blue-700" onClick={handleAddCustomProduct} disabled={!isValidCustomProduct}>Áp dụng</Button></div></div></div>)}
      {showInvoiceModal && (<div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center animate-in fade-in duration-200"><div className="bg-white rounded-md shadow-xl w-[700px] max-w-[95vw] overflow-hidden"><div className="flex justify-between items-center px-4 py-3 border-b border-slate-200"><h2 className="text-[16px] font-bold text-slate-800">Thông tin xuất hóa đơn</h2><button onClick={() => setShowInvoiceModal(false)} className="text-slate-400 hover:text-slate-600"><X size={20}/></button></div><div className="p-4 space-y-4 max-h-[80vh] overflow-y-auto"><div className="space-y-3"><div className="grid grid-cols-2 gap-4"><div className="space-y-1"><label className="text-[13px] font-medium text-slate-600">Mã số thuế</label><div className="flex"><Input placeholder="Nhập mã số thuế" className={cn("h-9 text-[13px] rounded-r-none border-r-0", isNoInvoice && "bg-slate-100 cursor-not-allowed")} disabled={isNoInvoice} /><Button variant="outline" className={cn("h-9 rounded-l-none bg-slate-50 text-[13px] font-normal border-l-0", isNoInvoice && "bg-slate-100 cursor-not-allowed")} disabled={isNoInvoice}>Lấy thông tin</Button></div></div><div className="space-y-1"><label className="text-[13px] font-medium text-slate-600">Tên công ty</label><Input placeholder="Nhập tên công ty" className={cn("h-9 text-[13px]", isNoInvoice && "bg-slate-100 cursor-not-allowed")} disabled={isNoInvoice}/></div></div><div className="space-y-1"><label className="text-[13px] font-medium text-slate-600">Địa chỉ</label><Input placeholder="Nhập địa chỉ" className={cn("h-9 text-[13px]", isNoInvoice && "bg-slate-100 cursor-not-allowed")} disabled={isNoInvoice}/></div><div className="grid grid-cols-2 gap-4"><div className="space-y-1"><label className="text-[13px] font-medium text-slate-600">Tên người mua</label><Input placeholder="Nhập tên người mua" className={cn("h-9 text-[13px]", isNoInvoice && "bg-slate-100 cursor-not-allowed")} disabled={isNoInvoice}/></div><div className="space-y-1"><label className="text-[13px] font-medium text-slate-600">Căn cước công dân</label><Input placeholder="Nhập căn cước công dân" className={cn("h-9 text-[13px]", isNoInvoice && "bg-slate-100 cursor-not-allowed")} disabled={isNoInvoice}/></div></div><div className="grid grid-cols-2 gap-4"><div className="space-y-1"><label className="text-[13px] font-medium text-slate-600">Mã đơn vị quan hệ ngân sách</label><Input placeholder="Nhập mã đơn vị quan hệ ngân sách" className={cn("h-9 text-[13px]", isNoInvoice && "bg-slate-100 cursor-not-allowed")} disabled={isNoInvoice}/></div><div className="space-y-1"><label className="text-[13px] font-medium text-slate-600">Số điện thoại</label><div className="relative"><Input placeholder="Nhập số điện thoại" className={cn("h-9 text-[13px] pr-10", isNoInvoice && "bg-slate-100 cursor-not-allowed")} disabled={isNoInvoice}/><span className="absolute right-2 top-1/2 -translate-y-1/2">🇻🇳</span></div></div></div><div className="space-y-1"><label className="text-[13px] font-medium text-slate-600">Email nhận hóa đơn</label><Input placeholder="Nhập email nhận hóa đơn" className={cn("h-9 text-[13px]", isNoInvoice && "bg-slate-100 cursor-not-allowed")} disabled={isNoInvoice}/></div></div><div className="pt-2"><div className="flex items-start space-x-2"><Checkbox id="no-invoice" checked={isNoInvoice} onCheckedChange={(c) => setIsNoInvoice(!!c)}/><div className="grid gap-1.5 leading-none"><label htmlFor="no-invoice" className="text-[13px] font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Người mua không lấy hóa đơn</label><p className="text-[11px] text-slate-500 text-muted-foreground">Với hóa đơn chưa có thông tin người mua, hệ thống hiện tên người mua theo thông tin đã cấu hình <span className="text-blue-600 cursor-pointer hover:underline">tại đây</span></p></div></div></div></div><div className="px-4 py-3 border-t border-slate-200 flex justify-end gap-2"><Button variant="outline" onClick={() => setShowInvoiceModal(false)}>Hủy</Button><Button className="bg-blue-600 hover:bg-blue-700" onClick={() => setShowInvoiceModal(false)}>Xác nhận</Button></div></div></div>)}
      {showDiscountModal && (<div className="fixed inset-0 bg-black/50 z-[70] flex items-center justify-center animate-in fade-in duration-200"><div className="bg-white rounded-md shadow-xl w-[550px] max-w-[95vw] overflow-hidden"><div className="flex justify-between items-center px-4 py-3 border-b border-slate-200"><h2 className="text-[16px] font-bold text-slate-800">Thêm giảm giá</h2><button onClick={() => setShowDiscountModal(false)} className="text-slate-400 hover:text-slate-600"><X size={20}/></button></div><div className="p-4 space-y-4"><div className="space-y-1"><label className="text-[13px] font-medium text-slate-600">Mã giảm giá</label><Input placeholder="Vui lòng nhập mã giảm giá của bạn..." className="h-10 text-[13px]" value={discountForm.code} onChange={(e) => setDiscountForm({...discountForm, code: e.target.value})}/></div><div className="space-y-3 pt-1"><div className="space-y-2"><div className="flex items-center space-x-2"><Checkbox id="auto-promo" checked={discountForm.isAuto} onCheckedChange={(c) => setDiscountForm({...discountForm, isAuto: !!c, isManual: false})} /><label htmlFor="auto-promo" className="text-[13px] font-medium cursor-pointer">Tự động thêm chương trình khuyến mại phù hợp</label></div>{discountForm.isAuto && (<p className="pl-6 text-[12px] text-slate-400 animate-in fade-in slide-in-from-top-1">Không có chương trình khuyến mại phù hợp được áp dụng</p>)}</div><div className="space-y-3"><div className="flex items-center space-x-2"><Checkbox id="manual-disc" checked={discountForm.isManual} onCheckedChange={(c) => setDiscountForm({...discountForm, isManual: !!c, isAuto: false})} /><label htmlFor="manual-disc" className="text-[13px] font-medium cursor-pointer">Thêm giảm giá thủ công cho đơn hàng</label></div>{discountForm.isManual && (<div className="pl-6 space-y-3 animate-in fade-in slide-in-from-top-1 duration-200"><div className="flex items-center gap-3"><div className="flex border border-blue-200 rounded overflow-hidden shrink-0"><button className={cn("px-4 py-1.5 text-[12px] font-bold transition-colors", discountForm.manualType === "value" ? "bg-blue-600 text-white" : "bg-white text-blue-600")} onClick={() => setDiscountForm({...discountForm, manualType: "value"})}>Giá trị</button><button className={cn("px-5 py-1.5 text-[12px] font-bold transition-colors", discountForm.manualType === "percent" ? "bg-blue-600 text-white" : "bg-white text-blue-600")} onClick={() => setDiscountForm({...discountForm, manualType: "percent"})}>%</button></div><div className="relative flex-1"><Input type="number" className="h-9 pr-8 text-right font-bold" value={discountForm.manualValue} onChange={(e) => setDiscountForm({...discountForm, manualValue: e.target.value})}/><span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-[12px]">{discountForm.manualType === "value" ? "đ" : "%"}</span></div></div><div className="space-y-1"><label className="text-[12px] text-slate-500 font-medium">Lý do giảm giá</label><Input placeholder="Nhập lý do giảm giá..." className="h-9 text-[13px]" value={discountForm.reason} onChange={(e) => setDiscountForm({...discountForm, reason: e.target.value})}/></div></div>)}</div></div></div><div className="px-4 py-3 border-t border-slate-200 flex justify-end gap-2"><Button variant="outline" onClick={() => setShowDiscountModal(false)}>Hủy</Button><Button className="bg-blue-600 hover:bg-blue-700 px-6 font-bold" onClick={handleApplyDiscount}>Thêm</Button></div></div></div>)}

      {/* 7. Modal Phí giao hàng */}
      {showShippingFeeModal && (<div className="fixed inset-0 bg-black/50 z-[80] flex items-center justify-center animate-in fade-in duration-200"><div className="bg-white rounded-md shadow-xl w-[900px] max-w-[95vw] flex overflow-hidden h-[550px]"><div className="w-[320px] bg-[#f9fafb] border-r border-slate-200 flex flex-col"><div className="p-4 border-b border-slate-200"><h2 className="text-[16px] font-bold text-slate-800">Thêm phí giao hàng</h2></div><div className="p-4 space-y-4 flex-1 overflow-y-auto"><div className="space-y-1"><label className="text-[12px] font-bold text-slate-700">Địa chỉ lấy hàng</label><Select defaultValue="main"><SelectTrigger className="h-9 text-[13px] bg-white"><SelectValue/></SelectTrigger><SelectContent><SelectItem value="main">Cửa hàng chính</SelectItem></SelectContent></Select></div><div className="space-y-3"><label className="text-[12px] font-bold text-slate-700">Địa chỉ giao hàng</label><div className="space-y-1"><label className="text-[11px] text-slate-500">Khu vực</label><Select value={shippingAddress.province} onValueChange={handleProvinceChange}><SelectTrigger className="h-9 text-[13px] bg-white"><SelectValue placeholder="Chọn khu vực"/></SelectTrigger><SelectContent>{LOCATION_DB.provinces.map((p:any) => (<SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>))}</SelectContent></Select>{!shippingAddress.province && <p className="text-[11px] text-red-500">Thiếu thông tin khu vực giao hàng</p>}</div>{shippingAddress.province && (<div className="space-y-1 animate-in fade-in slide-in-from-top-1"><label className="text-[11px] text-slate-500">Quận/Huyện</label><Select value={shippingAddress.district} onValueChange={handleDistrictChange}><SelectTrigger className="h-9 text-[13px] bg-white"><SelectValue placeholder="Chọn quận huyện"/></SelectTrigger><SelectContent>{districts.map(d => (<SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>))}</SelectContent></Select></div>)}<div className="space-y-1"><label className="text-[11px] text-slate-500">Phường xã</label><Select value={shippingAddress.ward} onValueChange={handleWardChange} disabled={!shippingAddress.district}><SelectTrigger className="h-9 text-[13px] bg-white"><SelectValue placeholder="Chọn Phường xã"/></SelectTrigger><SelectContent>{wards.map(w => (<SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>))}</SelectContent></Select>{!shippingAddress.ward && <p className="text-[11px] text-red-500">Thiếu thông tin phường xã</p>}</div></div><div className="pt-2 border-t border-slate-200"><div className="flex justify-between mb-2"><span className="text-[12px] font-bold">Thông tin gói hàng</span><span className="text-[11px] text-blue-600 cursor-pointer">Cấu hình gói hàng</span></div><div className="space-y-2"><div className="space-y-1"><label className="text-[11px] text-slate-500">Giá trị</label><div className="relative"><Input className="h-8 text-[12px] pr-8 bg-white" defaultValue="110,000" /><span className="absolute right-2 top-1/2 -translate-y-1/2 text-[11px] text-slate-400">đ</span></div></div><div className="grid grid-cols-2 gap-2"><div className="space-y-1"><label className="text-[11px] text-slate-500">Tiền thu hộ COD</label><div className="relative"><Input className="h-8 text-[12px] pr-8 bg-white" defaultValue="110,000" /><span className="absolute right-2 top-1/2 -translate-y-1/2 text-[11px] text-slate-400">đ</span></div></div><div className="space-y-1"><label className="text-[11px] text-slate-500">Khối lượng</label><div className="relative"><Input className="h-8 text-[12px] pr-8 bg-white" defaultValue="5,000" /><span className="absolute right-2 top-1/2 -translate-y-1/2 text-[11px] text-slate-400">g</span></div></div></div></div></div></div></div><div className="flex-1 flex flex-col bg-white"><div className="p-4 border-b border-slate-200 flex justify-end gap-2"><Button variant="outline" onClick={() => setShowShippingFeeModal(false)}>Hủy</Button><Button className="bg-blue-600 hover:bg-blue-700" onClick={handleSaveShippingFee}>Lưu</Button></div><div className="p-6 overflow-y-auto flex-1">{!shippingAddress.ward ? (<div className="bg-orange-50 border border-orange-200 rounded p-3 mb-6 flex gap-3"><AlertTriangle className="text-orange-500 shrink-0 mt-0.5" size={16} /><div className="text-[13px] text-slate-800"><span className="font-bold">Để lấy thông tin phí vận chuyển đã cấu hình và phí gợi ý của đối tác vận chuyển, bạn cần:</span><ul className="list-disc pl-5 mt-1 text-slate-600"><li>Bổ sung địa chỉ giao hàng</li></ul></div></div>) : (<div className="mb-6 animate-in fade-in slide-in-from-top-2"><div className="flex justify-between items-center mb-3"><h3 className="font-bold text-[13px]">Phí gợi ý của đối tác vận chuyển</h3><span className="text-[12px] text-blue-600 cursor-pointer flex items-center gap-1"><ArrowRight size={12}/> Sắp xếp đối tác</span></div><div className="border border-slate-200 rounded-md"><div className="bg-slate-50 p-2 text-[11px] text-slate-500 text-center border-b border-slate-200">Không có dịch vụ nào phù hợp</div><div className="divide-y divide-slate-100">{SHIPPING_PARTNERS.map(partner => (<div key={partner.id} className="p-4 flex items-start gap-4 hover:bg-slate-50 transition-colors"><div className="w-[100px] font-bold text-slate-700">{partner.name}</div><div className="flex-1">{partner.connected ? (partner.error ? (<div className="bg-orange-50 border border-orange-200 rounded p-2 text-[12px] text-orange-700 flex gap-2"><AlertTriangle size={14} className="shrink-0 mt-0.5"/><div><span className="font-bold">Rất tiếc!</span><p>{partner.error} <span className="text-blue-600 cursor-pointer hover:underline">tại đây</span></p></div></div>) : (<div><span className="text-[13px] font-bold">{partner.price?.toLocaleString()}đ</span></div>)) : (<div className="flex justify-between items-center"><span className="text-[12px] text-slate-400 italic">Dịch vụ vận chuyển không khả dụng</span><Button variant="outline" className="h-8 text-blue-600 border-blue-200 hover:bg-blue-50 text-[12px]" onClick={() => setShowPartnerConnectModal(true)}>Kết nối ngay</Button></div>)}</div></div>))}</div></div></div>)}<div><div className="flex justify-between items-center mb-3"><h3 className="font-bold text-[13px]">Phí cấu hình</h3><span className="text-[12px] text-blue-600 cursor-pointer">Cấu hình phí vận chuyển</span></div><div className="border border-slate-200 rounded-md p-4"><RadioGroup value={shippingFeeConfig.type} onValueChange={(val: any) => setShippingFeeConfig({...shippingFeeConfig, type: val})}>{shippingAddress.ward && (<div className="flex items-center justify-between py-2 border-b border-dashed border-slate-200 mb-2 animate-in fade-in"><div className="flex items-center space-x-2"><RadioGroupItem value="delivery" id="delivery" className="text-blue-600 border-slate-300" /><Label htmlFor="delivery" className="font-normal text-[13px]">Giao hàng tận nơi</Label></div><span className="text-[13px] font-bold">35,000đ</span></div>)}<div className="flex items-center space-x-2 mb-2"><RadioGroupItem value="custom" id="custom" className="text-blue-600 border-slate-300" /><Label htmlFor="custom" className="font-normal text-[13px]">Phí Khác</Label></div>{shippingFeeConfig.type === "custom" && (<div className="pl-6 animate-in fade-in slide-in-from-top-1"><div className="relative w-[200px]"><Input className="h-8 text-[13px] pr-8" value={shippingFeeConfig.customFee} onChange={(e) => setShippingFeeConfig({...shippingFeeConfig, customFee: e.target.value})}/><span className="absolute right-2 top-1/2 -translate-y-1/2 text-[12px] text-slate-400">đ</span></div></div>)}</RadioGroup></div></div></div></div></div></div>)}

      {/* 8. Modal Kết nối đối tác */}
      {showPartnerConnectModal && (<div className="fixed inset-0 bg-black/50 z-[90] flex items-center justify-center animate-in fade-in duration-200"><div className="bg-white rounded-md shadow-xl w-[500px] max-w-[95vw] overflow-hidden"><div className="flex justify-between items-center px-4 py-3 border-b border-slate-200"><h2 className="text-[16px] font-bold text-slate-800">Kết nối đối tác</h2><button onClick={() => setShowPartnerConnectModal(false)} className="text-slate-400 hover:text-slate-600"><X size={20}/></button></div><div className="p-6"><div className="bg-slate-50 rounded-lg p-4 flex justify-center items-center gap-4 mb-6"><span className="text-blue-600 font-bold text-xl">Sapo</span><div className="text-slate-400">⇄</div><span className="text-orange-500 font-bold text-xl italic">SPX <span className="text-[10px] not-italic text-black">EXPRESS</span></span></div><h3 className="font-bold text-[14px] mb-3">Đăng nhập tài khoản SPX Express</h3><div className="grid grid-cols-2 gap-4 mb-4"><div className="space-y-1"><label className="text-[12px] text-slate-600">Mã khách hàng (User ID)<span className="text-red-500">*</span></label><Input placeholder="Nhập mã khách hàng" className="h-9 text-[13px]"/></div><div className="space-y-1"><label className="text-[12px] text-slate-600">Mã khóa (Secret Key)<span className="text-red-500">*</span></label><Input placeholder="Nhập mã khóa" className="h-9 text-[13px]"/></div></div><div className="flex items-start space-x-2 mb-4"><Checkbox id="policy" /><label htmlFor="policy" className="text-[12px] leading-tight text-slate-600 cursor-pointer">Tôi đã đọc, hiểu và đồng ý với <span className="text-blue-600 hover:underline">Chính sách bảo vệ dữ liệu cá nhân</span></label></div><div className="space-y-1 text-[12px]"><p className="text-blue-600 hover:underline cursor-pointer">• Đăng ký tài khoản SPX Express</p><p className="text-blue-600 hover:underline cursor-pointer">• Hướng dẫn kết nối SPX Express</p><p className="text-blue-600 hover:underline cursor-pointer">• Tìm hiểu thêm về SPX Express</p></div></div><div className="px-4 py-3 border-t border-slate-200 flex justify-end gap-2"><Button variant="outline" onClick={() => setShowPartnerConnectModal(false)}>Hủy</Button><Button className="bg-slate-100 text-slate-400 hover:bg-slate-200">Kết nối</Button></div></div></div>)}

      {/* 9. Modal Thêm Mới Khách Hàng */}
      {showAddCustomerModal && (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center animate-in fade-in duration-200">
             <div className="bg-white rounded-md shadow-xl w-[800px] max-w-[95vw] overflow-hidden flex flex-col max-h-[90vh]">
                 <div className="flex justify-between items-center px-4 py-3 border-b border-slate-200">
                    <h2 className="text-[16px] font-bold text-slate-800">Thêm mới khách hàng</h2>
                    <button onClick={() => setShowAddCustomerModal(false)} className="text-slate-400 hover:text-slate-600"><X size={20}/></button>
                 </div>
                 <div className="p-6 overflow-y-auto flex-1 space-y-6">
                     <div className="grid grid-cols-2 gap-4">
                         <div className="space-y-1"><label className="text-[13px] font-medium text-slate-600">Họ</label><Input placeholder="Nhập họ" className="h-9 text-[13px]" /></div>
                         <div className="space-y-1"><label className="text-[13px] font-medium text-slate-600">Tên</label><Input placeholder="Nhập tên" className="h-9 text-[13px]" /></div>
                         <div className="space-y-1"><label className="text-[13px] font-medium text-slate-600">Email</label><Input placeholder="Nhập email" className="h-9 text-[13px]" /></div>
                         <div className="space-y-1">
                             <label className="text-[13px] font-medium text-slate-600">Số điện thoại</label>
                             <div className="relative"><Input placeholder="Nhập số điện thoại" className="h-9 text-[13px] pr-10" /><span className="absolute right-2 top-1/2 -translate-y-1/2">🇻🇳</span></div>
                         </div>
                     </div>
                     <div>
                         <div className="text-blue-600 text-[13px] cursor-pointer hover:underline flex items-center gap-1 mb-2" onClick={() => setExpandCustomerInfo(!expandCustomerInfo)}>
                            {expandCustomerInfo ? "Thu gọn" : "Thông tin thêm"} <ChevronDown size={14} className={cn("transition-transform", expandCustomerInfo && "rotate-180")}/>
                         </div>
                         {expandCustomerInfo && (
                             <div className="grid grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-1">
                                 <div className="space-y-1"><label className="text-[13px] font-medium text-slate-600">Ngày sinh</label><Input type="date" className="h-9 text-[13px]" /></div>
                                 <div className="space-y-1">
                                     <label className="text-[13px] font-medium text-slate-600">Giới tính</label>
                                     <RadioGroup defaultValue="male" className="flex gap-4 pt-1.5"><div className="flex items-center space-x-2"><RadioGroupItem value="male" id="male" /><Label htmlFor="male" className="font-normal text-[13px]">Nam</Label></div><div className="flex items-center space-x-2"><RadioGroupItem value="female" id="female" /><Label htmlFor="female" className="font-normal text-[13px]">Nữ</Label></div><div className="flex items-center space-x-2"><RadioGroupItem value="other" id="other" /><Label htmlFor="other" className="font-normal text-[13px]">Khác</Label></div></RadioGroup>
                                 </div>
                                 <div className="col-span-2 space-y-1"><label className="text-[13px] font-medium text-slate-600">Tag</label><Input placeholder="Tìm hoặc thêm mới tag" className="h-9 text-[13px]" /></div>
                                 <div className="col-span-2 flex items-center space-x-2 pt-1"><Checkbox id="promo-email" /><label htmlFor="promo-email" className="text-[13px] leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Nhận email quảng cáo</label></div>
                             </div>
                         )}
                     </div>
                     <div className="border-t border-slate-100 pt-4">
                         <h3 className="font-bold text-[14px] mb-3">Địa chỉ nhận hàng</h3>
                         <div className="grid grid-cols-2 gap-4 mb-4">
                             <div className="space-y-1"><label className="text-[13px] font-medium text-slate-600">Họ</label><Input placeholder="Nhập họ" className="h-9 text-[13px]" /></div>
                             <div className="space-y-1"><label className="text-[13px] font-medium text-slate-600">Tên</label><Input placeholder="Nhập tên" className="h-9 text-[13px]" /></div>
                             <div className="space-y-1"><label className="text-[13px] font-medium text-slate-600">Công ty</label><Input placeholder="Nhập tên công ty" className="h-9 text-[13px]" /></div>
                             <div className="space-y-1"><label className="text-[13px] font-medium text-slate-600">Số điện thoại</label><Input placeholder="Nhập số điện thoại" className="h-9 text-[13px]" /></div>
                             <div className="space-y-1"><label className="text-[13px] font-medium text-slate-600">Quốc gia</label><Select defaultValue="vn"><SelectTrigger className="h-9 text-[13px]"><SelectValue/></SelectTrigger><SelectContent><SelectItem value="vn">Vietnam</SelectItem></SelectContent></Select></div>
                             <div className="space-y-1"><label className="text-[13px] font-medium text-slate-600">Postal/Zipcode</label><Input placeholder="Nhập Postal/Zipcode" className="h-9 text-[13px]" /></div>
                         </div>
                         <div className="bg-slate-50 p-4 rounded-md space-y-4">
                             <div className="flex items-center justify-between">
                                 <div className="flex items-center space-x-2">
                                     <Switch id="new-address-mode" checked={isNewAddressFormat} onCheckedChange={setIsNewAddressFormat} />
                                     <Label htmlFor="new-address-mode" className="text-[13px] font-bold text-slate-700 flex items-center gap-1">Địa chỉ mới <Info size={12} className="text-blue-500"/></Label>
                                 </div>
                                 <Button variant="ghost" className="h-7 text-[11px] text-teal-600 flex items-center gap-1 px-2"><Navigation size={12}/> Dùng vị trí hiện tại</Button>
                             </div>
                             
                             <div className="grid grid-cols-2 gap-4 animate-in fade-in">
                                 <div className="space-y-1">
                                     <label className="text-[13px] font-medium text-slate-600">Tỉnh/Thành phố</label>
                                     <Select value={modalAddress.provinceId} onValueChange={handleModalProvinceChange}>
                                         <SelectTrigger className="h-9 text-[13px] bg-white">
                                             <SelectValue placeholder="Chọn tỉnh/thành phố"/>
                                         </SelectTrigger>
                                         <SelectContent>
                                             {LOCATION_DB.provinces.map((p:any) => (
                                                 <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                                             ))}
                                         </SelectContent>
                                     </Select>
                                 </div>

                                 <div className="space-y-1">
                                     <label className="text-[13px] font-medium text-slate-600">Quận/Huyện *</label>
                                     <Select value={modalAddress.districtId} onValueChange={handleModalDistrictChange} disabled={!modalAddress.provinceId}>
                                         <SelectTrigger className="h-9 text-[13px] bg-white">
                                             <SelectValue placeholder="Chọn quận/huyện"/>
                                         </SelectTrigger>
                                         <SelectContent>
                                             {modalDistricts.map((d:any) => (
                                                 <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                                             ))}
                                         </SelectContent>
                                     </Select>
                                 </div>

                                 <div className="space-y-1">
                                     <label className="text-[13px] font-medium text-slate-600">Phường/Xã *</label>
                                     <Select value={modalAddress.wardId} onValueChange={handleModalWardChange} disabled={!modalAddress.districtId}>
                                         <SelectTrigger className="h-9 text-[13px] bg-white">
                                             <SelectValue placeholder="Chọn phường/xã"/>
                                         </SelectTrigger>
                                         <SelectContent>
                                             {modalWards.map((w:any) => (
                                                 <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>
                                             ))}
                                         </SelectContent>
                                     </Select>
                                 </div>

                                 <div className="col-span-2 space-y-1">
                                     <label className="text-[13px] font-medium text-slate-600">Địa chỉ cụ thể *</label>
                                     <Input 
                                        placeholder="Nhập địa chỉ cụ thể" 
                                        className="h-9 text-[13px] bg-white" 
                                        value={modalAddress.detail} 
                                        onChange={(e) => setModalAddress(prev => ({ ...prev, detail: e.target.value }))}
                                     />
                                 </div>
                             </div>
                         </div>
                     </div>
                 </div>
                 <div className="px-6 py-4 border-t border-slate-200 flex justify-between items-center bg-white">
                     <button className="text-[13px] text-blue-600 hover:underline flex items-center gap-1"><RefreshCcw size={12}/> Chuyển đổi địa chỉ</button>
                     <div className="flex gap-2">
                         <Button variant="outline" onClick={() => setShowAddCustomerModal(false)}>Hủy</Button>
                         <Button className="bg-blue-600 hover:bg-blue-700 px-6" onClick={handleSaveNewCustomer}>Lưu</Button>
                     </div>
                 </div>
             </div>
         </div>
      )}

      {/* 10. Các Modal Sửa Thông Tin Khách Hàng (3 cái) */}
      {showEditGroupModal && (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center animate-in fade-in duration-200">
             <div className="bg-white rounded-md shadow-xl w-[400px] max-w-[95vw] overflow-hidden">
                 <div className="flex justify-between items-center px-4 py-3 border-b border-slate-200">
                    <h2 className="text-[16px] font-bold text-slate-800">Nhóm khách hàng</h2>
                    <button onClick={() => setShowEditGroupModal(false)} className="text-slate-400 hover:text-slate-600"><X size={20}/></button>
                 </div>
                 <div className="p-4">
                     <div className="relative">
                         <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14}/>
                         <Select defaultValue="none">
                             <SelectTrigger className="h-9 text-[13px] pl-9"><SelectValue placeholder="Tìm theo tên nhóm khách hàng..."/></SelectTrigger>
                             <SelectContent>
                                 <SelectItem value="none">Không áp dụng nhóm khách hàng</SelectItem>
                                 <SelectItem value="vip">Khách hàng thân thiết</SelectItem>
                                 <SelectItem value="wholesale">Khách sỉ</SelectItem>
                             </SelectContent>
                         </Select>
                     </div>
                 </div>
                 <div className="px-4 py-3 border-t border-slate-200 flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setShowEditGroupModal(false)}>Hủy</Button>
                    <Button className="bg-blue-600 hover:bg-blue-700" onClick={handleUpdateCustomerInfo}>Lưu</Button>
                 </div>
             </div>
        </div>
      )}
      {showEditContactModal && (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center animate-in fade-in duration-200">
             <div className="bg-white rounded-md shadow-xl w-[600px] max-w-[95vw] overflow-hidden">
                 <div className="flex justify-between items-center px-4 py-3 border-b border-slate-200">
                    <h2 className="text-[16px] font-bold text-slate-800">Sửa thông tin liên hệ</h2>
                    <button onClick={() => setShowEditContactModal(false)} className="text-slate-400 hover:text-slate-600"><X size={20}/></button>
                 </div>
                 <div className="p-4 space-y-4">
                     <div className="grid grid-cols-2 gap-4">
                         <div className="space-y-1"><label className="text-[13px] font-medium text-slate-600">Email</label><Input placeholder="Nhập email" className="h-9 text-[13px]" defaultValue={customer?.email}/></div>
                         <div className="space-y-1"><label className="text-[13px] font-medium text-slate-600">Số điện thoại</label><Input placeholder="Nhập số điện thoại" className="h-9 text-[13px]" defaultValue={customer?.phone}/></div>
                     </div>
                     <div className="flex items-center space-x-2">
                         <Checkbox id="update-profile" defaultChecked />
                         <label htmlFor="update-profile" className="text-[13px] leading-none cursor-pointer">Cập nhật hồ sơ khách hàng</label>
                     </div>
                 </div>
                 <div className="px-4 py-3 border-t border-slate-200 flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setShowEditContactModal(false)}>Hủy</Button>
                    <Button className="bg-blue-600 hover:bg-blue-700" onClick={handleUpdateCustomerInfo}>Lưu</Button>
                 </div>
             </div>
        </div>
      )}
      {showEditAddressModal && (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center animate-in fade-in duration-200">
             <div className="bg-white rounded-md shadow-xl w-[800px] max-w-[95vw] overflow-hidden flex flex-col max-h-[90vh]">
                 <div className="flex justify-between items-center px-4 py-3 border-b border-slate-200">
                    <h2 className="text-[16px] font-bold text-slate-800">Sửa địa chỉ {showEditAddressModal === 'shipping' ? 'giao hàng' : 'thanh toán'}</h2>
                    <button onClick={() => setShowEditAddressModal(null)} className="text-slate-400 hover:text-slate-600"><X size={20}/></button>
                 </div>
                 <div className="p-6 overflow-y-auto flex-1 space-y-4">
                     <div className="space-y-1">
                         <label className="text-[13px] font-medium text-slate-600">Chọn địa chỉ</label>
                         <Select defaultValue="current"><SelectTrigger className="h-9 text-[13px]"><SelectValue/></SelectTrigger><SelectContent><SelectItem value="current">{customer?.address || "Địa chỉ hiện tại"}</SelectItem></SelectContent></Select>
                     </div>
                     <div className="grid grid-cols-2 gap-4">
                         <div className="space-y-1"><label className="text-[13px] font-medium text-slate-600">Họ</label><Input placeholder="Nhập họ" className="h-9 text-[13px]" defaultValue="Bình"/></div>
                         <div className="space-y-1"><label className="text-[13px] font-medium text-slate-600">Tên</label><Input placeholder="Nhập tên" className="h-9 text-[13px]" defaultValue="Nguyễn"/></div>
                         <div className="space-y-1"><label className="text-[13px] font-medium text-slate-600">Công ty</label><Input placeholder="Nhập tên công ty" className="h-9 text-[13px]" /></div>
                         <div className="space-y-1"><label className="text-[13px] font-medium text-slate-600">Số điện thoại</label><Input placeholder="Nhập số điện thoại" className="h-9 text-[13px]" defaultValue="0986543987"/></div>
                         <div className="space-y-1"><label className="text-[13px] font-medium text-slate-600">Quốc gia</label><Select defaultValue="vn"><SelectTrigger className="h-9 text-[13px]"><SelectValue/></SelectTrigger><SelectContent><SelectItem value="vn">Vietnam</SelectItem></SelectContent></Select></div>
                         <div className="space-y-1"><label className="text-[13px] font-medium text-slate-600">Postal/Zipcode</label><Input placeholder="Nhập Postal/Zipcode" className="h-9 text-[13px]" /></div>
                     </div>
                     <div className="bg-slate-50 p-4 rounded-md space-y-4">
                         <div className="flex items-center justify-between">
                             <div className="flex items-center space-x-2">
                                 <Switch id="edit-address-mode" checked={isNewAddressFormat} onCheckedChange={setIsNewAddressFormat} />
                                 <Label htmlFor="edit-address-mode" className="text-[13px] font-bold text-slate-700 flex items-center gap-1">Địa chỉ mới <Info size={12} className="text-blue-500"/></Label>
                             </div>
                             <Button variant="ghost" className="h-7 text-[11px] text-teal-600 flex items-center gap-1 px-2"><Navigation size={12}/> Dùng vị trí hiện tại</Button>
                         </div>
                         
                         <div className="grid grid-cols-2 gap-4 animate-in fade-in">
                             <div className="space-y-1">
                                 <label className="text-[13px] font-medium text-slate-600">Tỉnh/Thành phố</label>
                                 <Select value={modalAddress.provinceId} onValueChange={handleModalProvinceChange}>
                                     <SelectTrigger className="h-9 text-[13px] bg-white">
                                         <SelectValue placeholder="Chọn tỉnh/thành phố"/>
                                     </SelectTrigger>
                                     <SelectContent>
                                         {LOCATION_DB.provinces.map((p:any) => (
                                             <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                                         ))}
                                     </SelectContent>
                                 </Select>
                             </div>

                             <div className="space-y-1">
                                 <label className="text-[13px] font-medium text-slate-600">Quận/Huyện *</label>
                                 <Select value={modalAddress.districtId} onValueChange={handleModalDistrictChange} disabled={!modalAddress.provinceId}>
                                     <SelectTrigger className="h-9 text-[13px] bg-white">
                                         <SelectValue placeholder="Chọn quận/huyện"/>
                                     </SelectTrigger>
                                     <SelectContent>
                                         {modalDistricts.map((d:any) => (
                                             <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                                         ))}
                                     </SelectContent>
                                 </Select>
                             </div>

                             <div className="space-y-1">
                                 <label className="text-[13px] font-medium text-slate-600">Phường/Xã *</label>
                                 <Select value={modalAddress.wardId} onValueChange={handleModalWardChange} disabled={!modalAddress.districtId}>
                                     <SelectTrigger className="h-9 text-[13px] bg-white">
                                         <SelectValue placeholder="Chọn phường/xã"/>
                                     </SelectTrigger>
                                     <SelectContent>
                                         {modalWards.map((w:any) => (
                                             <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>
                                         ))}
                                     </SelectContent>
                                 </Select>
                             </div>

                             <div className="col-span-2 space-y-1">
                                 <label className="text-[13px] font-medium text-slate-600">Địa chỉ cụ thể *</label>
                                 <Input 
                                    placeholder="Nhập địa chỉ cụ thể" 
                                    className="h-9 text-[13px] bg-white" 
                                    value={modalAddress.detail} 
                                    onChange={(e) => setModalAddress(prev => ({ ...prev, detail: e.target.value }))}
                                 />
                             </div>
                         </div>
                     </div>
                 </div>
                 <div className="px-6 py-4 border-t border-slate-200 flex justify-between items-center bg-white">
                     <button className="text-[13px] text-blue-600 hover:underline flex items-center gap-1"><RefreshCcw size={12}/> Chuyển đổi địa chỉ</button>
                     <div className="flex gap-2">
                         <Button variant="outline" onClick={() => setShowEditAddressModal(null)}>Hủy</Button>
                         <Button className="bg-blue-600 hover:bg-blue-700 px-6" onClick={handleUpdateCustomerInfo}>Lưu</Button>
                     </div>
                 </div>
             </div>
         </div>
      )}
      {/* 11. Modal Thêm Đối Tác Tự Liên Hệ */}
      {showAddPartnerModal && (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center animate-in fade-in duration-200">
             <div className="bg-white rounded-md shadow-xl w-[700px] max-w-[95vw] overflow-hidden">
                 <div className="flex justify-between items-center px-4 py-3 border-b border-slate-200">
                    <h2 className="text-[16px] font-bold text-slate-800">Thêm mới đối tác tự liên hệ</h2>
                    <button onClick={() => setShowAddPartnerModal(false)} className="text-slate-400 hover:text-slate-600"><X size={20}/></button>
                 </div>
                 <div className="p-6 space-y-4">
                     <div className="grid grid-cols-2 gap-4">
                         <div className="space-y-1"><label className="text-[13px] font-medium text-slate-600">Tên đối tác<span className="text-red-500">*</span></label><Input placeholder="Nhập tên đối tác" className="h-9 text-[13px]" value={newPartnerForm.name} onChange={(e) => setNewPartnerForm({...newPartnerForm, name: e.target.value})}/></div>
                         <div className="space-y-1"><label className="text-[13px] font-medium text-slate-600">Số điện thoại</label><Input placeholder="Nhập số điện thoại" className="h-9 text-[13px]" value={newPartnerForm.phone} onChange={(e) => setNewPartnerForm({...newPartnerForm, phone: e.target.value})}/></div>
                     </div>
                     <div className="grid grid-cols-2 gap-4">
                         <div className="space-y-1"><label className="text-[13px] font-medium text-slate-600">Email</label><Input placeholder="Nhập email" className="h-9 text-[13px]" value={newPartnerForm.email} onChange={(e) => setNewPartnerForm({...newPartnerForm, email: e.target.value})}/></div>
                         <div className="space-y-1"><label className="text-[13px] font-medium text-slate-600">Địa chỉ</label><Input placeholder="Nhập địa chỉ" className="h-9 text-[13px]" value={newPartnerForm.address} onChange={(e) => setNewPartnerForm({...newPartnerForm, address: e.target.value})}/></div>
                     </div>
                     <div className="grid grid-cols-2 gap-4">
                         <div className="space-y-1"><label className="text-[13px] font-medium text-slate-600">Ghi chú</label><Input placeholder="Nhập ghi chú" className="h-9 text-[13px]" value={newPartnerForm.note} onChange={(e) => setNewPartnerForm({...newPartnerForm, note: e.target.value})}/></div>
                         <div className="space-y-1">
                             <label className="text-[13px] font-medium text-slate-600">Người trả phí:</label>
                             <RadioGroup value={newPartnerForm.payer} onValueChange={(val) => setNewPartnerForm({...newPartnerForm, payer: val})} className="flex gap-6 pt-2">
                                 <div className="flex items-center space-x-2"><RadioGroupItem value="shop" id="shop-payer-add" className="text-blue-600 border-slate-300"/><Label htmlFor="shop-payer-add" className="font-normal text-[13px]">Shop trả</Label></div>
                                 <div className="flex items-center space-x-2"><RadioGroupItem value="customer" id="cust-payer-add" /><Label htmlFor="cust-payer-add" className="font-normal text-[13px]">Khách trả</Label></div>
                             </RadioGroup>
                         </div>
                     </div>
                 </div>
                 <div className="px-4 py-3 border-t border-slate-200 flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setShowAddPartnerModal(false)}>Hủy</Button>
                    <Button className="bg-blue-600 hover:bg-blue-700 px-6" onClick={handleSaveNewPartner}>Lưu</Button>
                 </div>
             </div>
        </div>
      )}

    </div>
  );
}