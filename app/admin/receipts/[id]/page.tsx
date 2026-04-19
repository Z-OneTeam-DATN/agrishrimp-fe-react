"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { InventoryApiService } from "@/app/services/inventory.service";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  ChevronLeft, Printer, CheckCircle2, FileText, Package, 
  Settings, HelpCircle, X, ArrowDownToLine, History, 
  Ban, CheckSquare, ListChecks, Play, ImageIcon, AlertCircle, Wallet, PlusCircle
} from "lucide-react";
import { cn, formatNumber } from "@/lib/utils";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { usePermissions } from "@/hooks/usePermissions";
import { useAuthStore } from "@/stores/useAuthStore";
import { P } from "@/lib/permissions";
import { getErrorMessage } from "@/lib/axios";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function ReceiptDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [receipt, setReceipt] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const { data: currentUser } = useCurrentUser();
  const { hasPermission } = usePermissions();
  const { user } = useAuthStore();

  // AlertDialog State
  const [confirmConfig, setConfirmConfig] = useState<{
    open: boolean;
    title: string;
    description: string;
    action: () => void;
    variant?: "default" | "destructive";
  }>({
    open: false,
    title: "",
    description: "",
    action: () => {},
  });

  const showConfirm = (title: string, description: string, action: () => void, variant: "default" | "destructive" = "default") => {
    setConfirmConfig({ open: true, title, description, action, variant });
  };

  // Kiểm tra quyền
  const isAdmin = user?.role?.slug === "ADMIN";
  const canSeePrice = isAdmin || hasPermission(P.IMPORT_VIEW) || hasPermission(P.CHECK_VIEW);
  const canApprove = isAdmin || hasPermission(P.IMPORT_APPROVE);
  const canCreateReturn = isAdmin || hasPermission(P.EXPORT_CREATE);

  // Modal States
  const [showInspectModal, setShowInspectModal] = useState(false);
  const [inspectItems, setInspectItems] = useState<any[]>([]);
  const [paymentHistory, setPaymentHistory] = useState<any[]>([]);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentForm, setPaymentForm] = useState({
    amount: "",
    paymentMethod: "TRANSFER",
    paymentDate: new Date().toISOString().slice(0, 10),
    referenceCode: "",
    note: "",
  });

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    try {
      const [data, payments] = await Promise.all([
        InventoryApiService.getReceiptDetail(id as string),
        InventoryApiService.getReceiptPayments(id as string),
      ]);
      setReceipt(data);
      setPaymentHistory(Array.isArray(payments) ? payments : []);
    } catch (error) {
      toast.error("Lỗi tải dữ liệu. Vui lòng thử lại!");
    } finally {
      setLoading(false);
    }
  };

  const handleApiCall = async (action: () => Promise<any>, successMsg: string) => {
    setIsProcessing(true);
    try {
      await action();
      toast.success(successMsg);
      await fetchData();
    } catch (error: any) {
      toast.error(getErrorMessage(error));
    } finally {
      setIsProcessing(false);
    }
  };

  const currentDebt = Number(
    receipt?.debtAmount ?? ((receipt?.totalAmount || 0) - (receipt?.paymentAmount || 0)),
  );
  const canRecordPayment =
    (isAdmin || hasPermission(P.REPORT_FINANCE_VIEW) || hasPermission(P.IMPORT_APPROVE)) &&
    receipt?.status === "COMPLETED" &&
    currentDebt > 0;
  const hasRejectedItems = (receipt?.items || []).some(
    (item: any) => Number(item.quantityRejected || 0) > 0,
  );
  const canCreateSupplierReturn =
    canCreateReturn &&
    hasRejectedItems &&
    ["APPROVED", "COMPLETED"].includes(receipt?.status || "");

  const openPaymentModal = (payFull = false) => {
    setPaymentForm({
      amount: payFull ? String(currentDebt) : "",
      paymentMethod: "TRANSFER",
      paymentDate: new Date().toISOString().slice(0, 10),
      referenceCode: "",
      note: "",
    });
    setShowPaymentModal(true);
  };

  const submitPayment = async () => {
    const amount = Number(paymentForm.amount || 0);
    if (!amount || amount <= 0) {
      toast.error("Vui lòng nhập số tiền thanh toán hợp lệ");
      return;
    }
    if (amount > currentDebt) {
      toast.error("Số tiền thanh toán vượt quá công nợ còn lại");
      return;
    }

    setIsProcessing(true);
    try {
      await InventoryApiService.createReceiptPayment(id as string, {
        amount,
        paymentMethod: paymentForm.paymentMethod,
        paymentDate: paymentForm.paymentDate,
        referenceCode: paymentForm.referenceCode,
        note: paymentForm.note,
      });
      toast.success("Đã ghi nhận thanh toán NCC");
      setShowPaymentModal(false);
      await fetchData();
    } catch (error: any) {
      toast.error(getErrorMessage(error));
    } finally {
      setIsProcessing(false);
    }
  };

  // GIAI ĐOẠN 2: Duyệt phiếu (POST)
  const handleApprove = () => {
    showConfirm(
      "Xác nhận DUYỆT phiếu",
      "Admin duyệt phiếu này sẽ ghi nhận ngay tồn kho hàng đạt, tách hàng lỗi sang kho chờ trả và cộng công nợ nhà cung cấp.",
      () => handleApiCall(() => InventoryApiService.approveReceipt(id as string), "Đã duyệt phiếu thành công!")
    );
  };

  const handleReject = () => {
    showConfirm(
      "Xác nhận TỪ CHỐI phiếu",
      "Hành động này sẽ từ chối kế hoạch nhập hàng hiện tại. Bạn có chắc chắn không?",
      () => handleApiCall(() => InventoryApiService.rejectReceipt(id as string), "Đã từ chối phiếu nhập!"),
      "destructive"
    );
  };

  const handleCancel = () => {
    showConfirm(
      "Xác nhận HỦY phiếu",
      "Bạn có chắc chắn muốn hủy phiếu nhập hàng này không? Hành động này không thể hoàn tác.",
      () => handleApiCall(() => InventoryApiService.rejectReceipt(id as string), "Đã hủy phiếu thành công!"),
      "destructive"
    );
  };

  const handleCreateSupplierReturn = () => {
    if (!receipt) return;
    const query = new URLSearchParams({
      exportType: "RETURN",
      fromReceiptId: String(receipt.id || id),
    });
    router.push(`/admin/exports/new-command?${query.toString()}`);
  };

  // GIAI ĐOẠN 3: Kiểm đếm QC & Nhập kho
  const openInspectModal = () => {
    setInspectItems((receipt?.items || []).map((i: any) => ({
      ...i,
      plannedQuantity: i.plannedQuantity || i.quantity || 0,
      quantityDelivered: i.quantityReal || i.plannedQuantity || i.quantity || 0,
      quantityAccepted: i.quantityAccepted || i.plannedQuantity || i.quantity || 0,
      quantityRejected: 0,
      lotNumber: i.lotNumber || "",
      expiryDate: i.expiryDate || "",
      note: ""
    })));
    setShowInspectModal(true);
  };

  const submitInspect = () => {
    // Validation logic QC: phân tách rõ NCC giao / đạt QC / lỗi
    for (const item of inspectItems) {
      const planned = Number(item.plannedQuantity) || 0;
      const delivered = Number(item.quantityDelivered) || 0;
      const accepted = Number(item.quantityAccepted) || 0;
      const rejected = Number(item.quantityRejected) || 0;

      if (delivered > planned) {
        toast.error(`SP ${item.productName}: Số NCC giao (${delivered}) không được lớn hơn số lượng của đợt này (${planned})`);
        return;
      }
      if (accepted + rejected !== delivered) {
        toast.error(`SP ${item.productName}: Đạt QC + Lỗi phải đúng bằng số NCC giao`);
        return;
      }
      if (accepted < 0 || rejected < 0) {
        toast.error(`SP ${item.productName}: Số lượng đạt/lỗi không được âm`);
        return;
      }

      if (delivered > 0 && (!item.lotNumber?.trim() || !item.expiryDate)) {
        toast.error(`SP ${item.productName}: Vui lòng điền đầy đủ Số lô và Hạn dùng`);
        return;
      }
      if ((rejected > 0 || delivered < planned) && !item.note?.trim()) {
        toast.error(`SP ${item.productName}: Vui lòng ghi rõ lý do lỗi hoặc phần giao thiếu`);
        return;
      }
    }

    showConfirm(
      "Xác nhận NHẬP KHO",
      "Hệ thống sẽ cập nhật tồn kho thực tế ngay lập tức. Bạn đã kiểm tra kỹ số lượng thực nhận chưa?",
      () => {
        const payload = inspectItems.map((i) => ({
          productCode: i.productCode,
          quantityReal: Number(i.quantityAccepted || 0),
          quantityDelivered: Number(i.quantityDelivered || 0),
          quantityRejected: Number(i.quantityRejected || 0),
          lotNumber: i.lotNumber,
          expiryDate: i.expiryDate,
          note: i.note || ""
        }));

        handleApiCall(() => InventoryApiService.completeReceipt(id as string, { items: payload }), "Hoàn tất nhập kho thành công!");
        setShowInspectModal(false);
      }
    );
  };

  if (loading) return <div className="p-10 text-center flex justify-center items-center h-screen"><div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div></div>;
  if (!receipt) return <div className="p-10 text-center text-rose-500 font-bold">LỖI: PHIẾU KHÔNG TỒN TẠI</div>;

  // Sơ đồ quy trình 3 giai đoạn
  const WorkflowDiagram = ({ currentStatus }: { currentStatus: string }) => {
    // 🔥 CHUẨN HÓA TRẠNG THÁI (TRÁNH LỖI CASE-SENSITIVE)
    const status = (currentStatus || "").toUpperCase();

    const steps = [
      { key: "PLANNING", label: "GĐ 1: Lập kế hoạch", role: "Manager", icon: FileText, desc: "Tạo phiếu dự kiến" },
      { key: "PENDING", label: "GĐ 2: Phê duyệt", role: "Admin/Kế toán", icon: ListChecks, desc: "Xác nhận đơn hàng" },
      { key: "APPROVED", label: "GĐ 3: Kiểm hàng QC", role: "Thủ kho", icon: CheckCircle2, desc: "Nhập kho thực tế" },
    ];

    // Xác định bước HIỆN TẠI (Active) và bước ĐÃ XONG (Done)
    // - PENDING: GĐ 1 đã xong, đang chờ GĐ 2 (Phê duyệt) -> ActiveIdx = 1
    // - APPROVED: GĐ 1 & 2 đã xong, đang chờ GĐ 3 (Kiểm hàng) -> ActiveIdx = 2
    // - COMPLETED: Tất cả đã xong -> ActiveIdx = 3
    let activeIdx = 0;
    if (status === "PENDING" || status === "PO") activeIdx = 1;
    else if (status === "APPROVED") activeIdx = 2;
    else if (status === "COMPLETED" || status === "IMPORTED") activeIdx = 3;

    const isCancelled = status === "CANCELLED" || status === "REJECTED";

    return (
      <div className="bg-white border border-[#dcdcdc] p-8 mb-6 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 left-0 w-1 h-full bg-blue-600"></div>
        <div className="flex items-center justify-between max-w-5xl mx-auto relative">
          {steps.map((step, idx) => {
            const isDone = idx < activeIdx;
            const isCurrent = idx === activeIdx;
            const StepIcon = step.icon;

            return (
              <React.Fragment key={idx}>
                <div className="flex flex-col items-center gap-3 relative z-10 w-40">
                  <div className={cn(
                    "w-12 h-12 rounded-full flex items-center justify-center border-4 transition-all duration-500 shadow-md",
                    isDone ? "bg-emerald-500 border-emerald-100 text-white" : 
                    isCurrent ? (isCancelled ? "bg-rose-500 border-rose-100 text-white animate-pulse" : "bg-blue-600 border-blue-100 text-white scale-110 shadow-lg shadow-blue-200") : 
                    "bg-slate-50 border-slate-100 text-slate-300"
                  )}>
                    <StepIcon size={22} />
                  </div>
                  <div className="text-center">
                    <p className={cn("text-[11px] font-black uppercase tracking-tighter", isCurrent ? "text-blue-600" : isDone ? "text-emerald-600" : "text-slate-400")}>
                      {step.label}
                    </p>
                    <p className="text-[9px] font-bold text-slate-400 uppercase mt-0.5">{step.role}</p>
                    <p className="text-[10px] text-slate-300 italic mt-1 hidden md:block">
                       {isDone ? "Đã hoàn tất" : isCurrent ? (isCancelled ? "Đã bị hủy" : "Đang chờ...") : "Chưa khả dụng"}
                    </p>
                  </div>
                </div>
                {idx < steps.length - 1 && (
                  <div className="flex-1 h-[2px] bg-slate-100 mx-4 -mt-10 relative overflow-hidden">
                    <div className={cn(
                      "absolute inset-0 transition-all duration-700",
                      isDone ? "bg-emerald-500" : "bg-transparent"
                    )} />
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>
    );
  };

  const auditLogs = [
    { time: new Date(receipt.createdAt).toLocaleString('vi-VN'), user: receipt.creatorName || "Manager", action: "Khởi tạo kế hoạch", detail: "Phiếu đang chờ duyệt" }
  ];
  if (["APPROVED", "COMPLETED"].includes(receipt.status)) {
    auditLogs.unshift({ time: new Date(receipt.updatedAt).toLocaleString('vi-VN'), user: "Quản trị viên", action: "Phê duyệt phiếu", detail: "Hợp lệ, chờ hàng về" });
  }
  if (receipt.status === "COMPLETED") {
    auditLogs.unshift({ time: new Date().toLocaleString('vi-VN'), user: "Nhân viên kho", action: "Xác nhận nhập kho", detail: "Đã hoàn tất QC và tăng tồn kho" });
  }

  const isQCMode = receipt.status === "COMPLETED";

  return (
    <div className="space-y-4 p-4 bg-slate-50/30 min-h-screen pb-20 relative">
      
      {/* HEADER */}
      <div className="flex items-center gap-4 mb-2 px-1">
        <Button variant="ghost" size="icon" onClick={() => router.back()} className="h-8 w-8 text-slate-400">
          <ChevronLeft size={20} />
        </Button>
        <div className="flex flex-col">
          <h1 className="text-[18px] font-black text-[#1f1f1f] tracking-tight uppercase">Chi tiết phiếu nhập hàng từ NCC</h1>
          <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">Mã chứng từ: <span className="text-blue-600 font-mono">#{receipt.receiptCode || receipt.code}</span></p>
        </div>

        <div className="ms-auto flex items-center gap-3">
          <div className={cn("px-3 py-1.5 border items-center gap-2 rounded-none shadow-sm flex", receipt.status === "COMPLETED" ? "bg-emerald-50 border-emerald-200 text-emerald-700" : "bg-amber-50 border-amber-200 text-amber-700")}>
            <ArrowDownToLine size={14} />
            <span className="text-[10px] font-black uppercase tracking-widest">{receipt.status}</span>
          </div>
          <Button type="button" variant="ghost" size="icon" onClick={() => router.back()} className="h-8 w-8"><X size={20} /></Button>
        </div>
      </div>

      <div className="flex items-center gap-2 bg-white p-3 border border-[#dcdcdc] shadow-sm justify-between">
         <div className="text-[13px] font-bold text-slate-500 uppercase tracking-tighter">
            Nhà cung cấp: <span className="text-slate-800 font-black">{receipt.supplierName}</span>
         </div>
         <div className="flex items-center gap-2">
            <Button variant="outline" className="h-8 text-[11px] font-bold border-slate-300 rounded-none px-3 text-slate-600"><Printer size={14} className="mr-1.5" /> IN PHIẾU</Button>
            
            {receipt.status === "PENDING" && canApprove && (
              <div className="flex gap-2">
                <Button onClick={handleApprove} disabled={isProcessing} className="h-8 bg-blue-600 hover:bg-blue-700 text-white font-black text-[11px] rounded-none px-6">
                  <ListChecks size={14} className="mr-1.5"/> DUYỆT PHIẾU
                </Button>
                <Button onClick={handleReject} disabled={isProcessing} variant="outline" className="h-8 text-rose-600 border-rose-200 hover:bg-rose-50 font-black text-[11px] rounded-none px-6">
                  <Ban size={14} className="mr-1.5"/> TỪ CHỐI
                </Button>
              </div>
            )}

            {canCreateSupplierReturn && (
              <Button onClick={handleCreateSupplierReturn} disabled={isProcessing} className="h-8 bg-rose-600 hover:bg-rose-700 text-white font-black text-[11px] rounded-none px-6 shadow-lg shadow-rose-100">
                <Package size={14} className="mr-1.5"/> TẠO PHIẾU XUẤT TRẢ NCC
              </Button>
            )}

            {["PENDING", "APPROVED"].includes(receipt.status) && (
              <Button onClick={handleCancel} disabled={isProcessing} variant="outline" className="h-8 text-rose-600 border-rose-200 hover:bg-rose-50 font-black text-[11px] rounded-none px-4">
                <Ban size={14} className="mr-1.5"/> HỦY PHIẾU
              </Button>
            )}
         </div>
      </div>

      {/* SƠ ĐỒ QUY TRÌNH */}
      <WorkflowDiagram currentStatus={receipt.status} />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="lg:col-span-9 space-y-5">
          {/* Thông tin đơn vị */}
          <div className="bg-white border border-[#dcdcdc] p-6 rounded-none shadow-sm grid grid-cols-2 gap-6">
            <div className="space-y-4">
               <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center font-black border border-blue-100">NCC</div>
                  <div>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Thông tin Nhà cung cấp</p>
                    <p className="text-[15px] font-black text-slate-700 uppercase">{receipt.supplierName}</p>
                    <p className="text-[11px] font-mono text-slate-400">Mã: {receipt.supplierCode}</p>
                  </div>
               </div>
               <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center font-black border border-emerald-100">KHO</div>
                  <div>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Kho nhập vào</p>
                    <p className="text-[15px] font-black text-slate-700 uppercase">{receipt.branchName}</p>
                  </div>
               </div>
            </div>
            <div className="border-l pl-8 border-slate-100 space-y-3 text-[13px]">
               <div className="flex justify-between"><span className="text-slate-400 uppercase text-[10px] font-bold">Ngày chứng từ:</span><span className="font-bold">{new Date(receipt.entryDate).toLocaleDateString('vi-VN')}</span></div>
               <div className="flex justify-between"><span className="text-slate-400 uppercase text-[10px] font-bold">Người giao hàng:</span><span className="font-bold">{receipt.deliverer || '---'}</span></div>
               <div className="flex justify-between border-t pt-2 mt-2"><span className="text-slate-400 uppercase text-[10px] font-bold text-blue-600">Tổng giá trị đơn:</span><span className="font-black text-blue-600 text-lg">{formatNumber(receipt.totalAmount || 0)} ₫</span></div>
            </div>
          </div>

          {/* Bảng hàng hóa */}
          <div className="bg-white border border-[#dcdcdc] rounded-none shadow-sm overflow-hidden overflow-x-auto">
             <div className="px-5 py-3 bg-slate-50 border-b font-black text-[11px] uppercase text-slate-500 tracking-widest flex items-center gap-2"><Package size={14}/> Danh sách hàng hóa thực nhập</div>
             <table className="w-full text-[13px] min-w-[900px]">
                <thead className="bg-white border-b text-[10px] uppercase text-slate-400">
                   <tr>
                      <th className="p-4 text-left w-[220px]">Sản phẩm / SKU</th>
                      <th className="p-4 text-center">ĐVT</th>
                      <th className="p-4 text-center">Số lô / Hạn dùng</th>
                      <th className="p-4 text-right">SL Đợt Nhập</th>
                      {isQCMode ? (
                        <>
                          <th className="p-4 text-right text-blue-600 bg-blue-50/50 whitespace-nowrap">NCC GIAO</th>
                          <th className="p-4 text-right text-emerald-600 bg-emerald-50/50 whitespace-nowrap">ĐẠT QC</th>
                          <th className="p-4 text-right text-rose-600 bg-rose-50/50 whitespace-nowrap">LỖI</th>
                        </>
                      ) : null}
                      <th className="p-4 text-right">Giá nhập</th>
                      <th className="p-4 text-right text-emerald-600">Giá bán mới</th>
                      <th className="p-4 text-right">Thành tiền</th>
                   </tr>
                </thead>
                <tbody>
                   {(receipt.items || []).map((item: any, i: number) => {
                      const planned = item.plannedQuantity || item.quantity || 0;
                      const delivered = item.quantityReal || 0;
                      const accepted = item.quantityAccepted || 0;
                      const rejected = item.quantityRejected || 0;

                      return (
                      <tr key={i} className="border-b last:border-0 hover:bg-slate-50/50 transition-colors">
                         <td className="p-4">
                            <div className="flex items-center gap-3">
                               <div className="w-10 h-10 border flex items-center justify-center bg-white shadow-sm shrink-0">
                                  {item.imageUrl ? <img src={item.imageUrl} className="w-full h-full object-cover" /> : <ImageIcon size={16} className="text-slate-200" />}
                               </div>
                               <div>
                                  <p className="font-black text-slate-700 uppercase leading-tight">{item.productName}</p>
                                  <p className="text-[10px] font-mono text-blue-500 font-bold mt-0.5">#{item.productCode}</p>
                               </div>
                            </div>
                         </td>
                         <td className="p-4 text-center text-slate-500 font-bold">{item.unit || "Cái"}</td>
                         <td className="p-4 text-center">
                            {item.lotNumber ? (
                               <div className="flex flex-col">
                                  <span className="font-bold text-slate-700">{item.lotNumber}</span>
                                  <span className="text-[10px] text-rose-500 font-medium">Hạn: {item.expiryDate}</span>
                               </div>
                            ) : <span className="text-slate-300 italic">---</span>}
                         </td>
                         <td className="p-4 text-right font-black text-slate-700 text-base">{planned}</td>
                         
                         {isQCMode ? (
                           <>
                              <td className="p-4 text-right font-black text-blue-600 text-base bg-blue-50/30 border-l border-blue-100">{delivered}</td>
                              <td className="p-4 text-right font-black text-emerald-600 text-base bg-emerald-50/30">{accepted}</td>
                              <td className="p-4 text-right font-black text-rose-600 text-base bg-rose-50/30">{rejected > 0 ? rejected : "-"}</td>
                           </>
                         ) : null}
                         
                         <td className="p-4 text-right font-bold text-slate-600">{formatNumber(item.importPrice || 0)} ₫</td>
                         <td className="p-4 text-right font-black text-emerald-600">{formatNumber(item.newSellingPrice || 0)} ₫</td>
                         <td className="p-4 text-right font-black text-slate-900">{formatNumber((isQCMode ? delivered : planned) * (item.importPrice || 0))} ₫</td>
                      </tr>
                   )})}
                </tbody>
             </table>
          </div>

          <div className="bg-white border border-[#dcdcdc] p-6 rounded-none shadow-sm">
            <div className="flex items-center gap-2 mb-4 text-slate-700 font-black text-[11px] uppercase tracking-widest border-b pb-3">
              <History size={16} /> Nhật ký vận hành hệ thống
            </div>
            <div className="space-y-3">
              {auditLogs.map((log, i) => (
                <div key={i} className="flex gap-4 items-start text-[12px] border-l-2 border-slate-100 pl-4 ml-2 relative">
                  <div className={cn("absolute -left-[5px] top-1.5 w-2 h-2 rounded-full ring-4 ring-white", i === 0 ? "bg-blue-500" : "bg-slate-300")} />
                  <div className="min-w-[120px] text-slate-400 font-mono text-[11px] pt-0.5">{log.time}</div>
                  <div className="font-black text-blue-600 pt-0.5">{log.user}</div>
                  <div className="text-slate-600 pt-0.5">{log.action}: <span className="text-slate-400 italic">{log.detail}</span></div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="lg:col-span-3 space-y-5">
           <div className="bg-white border border-[#dcdcdc] p-5 rounded-none shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b pb-2">
                <h3 className="font-black text-[11px] uppercase text-slate-400 flex items-center gap-2"><CheckCircle2 size={14}/> Thanh toán Nhà cung cấp</h3>
                {canRecordPayment ? (
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 rounded-none border-emerald-200 text-[11px] font-bold text-emerald-700"
                      onClick={() => openPaymentModal(true)}
                    >
                      <Wallet size={12} className="mr-1" />
                      Thanh toán đủ
                    </Button>
                    <Button
                      size="sm"
                      className="h-7 rounded-none bg-blue-600 text-[11px] font-bold hover:bg-blue-700"
                      onClick={() => openPaymentModal(false)}
                    >
                      <PlusCircle size={12} className="mr-1" />
                      Ghi nhận thanh toán
                    </Button>
                  </div>
                ) : null}
              </div>
              <div className="text-[13px] space-y-3">
                 <p className="flex justify-between border-b border-slate-50 pb-2"><span className="text-slate-400">Giá trị phải trả sau QC:</span><span className="font-black text-blue-600">{formatNumber(receipt.totalAmount || 0)} ₫</span></p>
                 <p className="flex justify-between border-b border-slate-50 pb-2"><span className="text-slate-400">Đã thanh toán:</span><span className="font-black text-emerald-600">{formatNumber(receipt.paymentAmount || 0)} ₫</span></p>
                 <p className="flex justify-between border-b border-slate-50 pb-2"><span className="text-slate-400">Còn nợ NCC:</span><span className="font-black text-rose-600">{formatNumber(currentDebt)} ₫</span></p>
              </div>
              {receipt.status !== "COMPLETED" ? (
                <p className="text-[11px] leading-relaxed text-amber-700 bg-amber-50 border border-amber-100 p-3">
                  Công nợ và thanh toán chỉ được chốt sau khi phiếu nhập hoàn tất kiểm hàng. Trước thời điểm đó, hệ thống chưa ghi nhận tiền chi thực tế.
                </p>
              ) : null}
           </div>
           <div className="bg-white border border-[#dcdcdc] p-5 rounded-none shadow-sm space-y-4">
              <h3 className="font-black text-[11px] uppercase text-slate-400 border-b pb-2 flex items-center gap-2"><History size={14}/> Lịch sử thanh toán</h3>
              {paymentHistory.length === 0 ? (
                <p className="text-[12px] text-slate-400 italic">Chưa có lần thanh toán nào được ghi nhận.</p>
              ) : (
                <div className="space-y-3">
                  {paymentHistory.map((payment) => (
                    <div key={payment.id} className="border border-slate-100 bg-slate-50/50 p-3 rounded-sm">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-[12px] font-black text-slate-700">
                            {formatNumber(payment.amount || 0)} ₫
                          </p>
                          <p className="text-[10px] text-slate-400">
                            {payment.paymentMethod} · {payment.paymentDate ? new Date(payment.paymentDate).toLocaleDateString("vi-VN") : "Không có ngày"}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] uppercase text-slate-400">Còn nợ sau lần này</p>
                          <p className="text-[12px] font-black text-rose-600">{formatNumber(payment.remainingDebtAfter || 0)} ₫</p>
                        </div>
                      </div>
                      {(payment.referenceCode || payment.note || payment.createdByName) ? (
                        <div className="mt-2 space-y-1 text-[11px] text-slate-500">
                          {payment.referenceCode ? <p>Tham chiếu: <span className="font-semibold text-slate-700">{payment.referenceCode}</span></p> : null}
                          {payment.createdByName ? <p>Người ghi nhận: <span className="font-semibold text-slate-700">{payment.createdByName}</span></p> : null}
                          {payment.note ? <p>Ghi chú: <span className="font-semibold text-slate-700">{payment.note}</span></p> : null}
                        </div>
                      ) : null}
                    </div>
                  ))}
                </div>
              )}
           </div>
           <div className="bg-amber-50 border border-amber-100 p-5 rounded-none">
              <h3 className="font-black text-[11px] uppercase text-amber-600 flex items-center gap-2 mb-2"><AlertCircle size={14}/> Diễn giải ghi chú</h3>
              <p className="text-[13px] text-amber-800 leading-relaxed italic font-medium">"{receipt.note || 'Không có ghi chú.'}"</p>
           </div>
        </div>
      </div>

      {/* MODAL GIAI ĐOẠN 3: KIỂM ĐẾM QC & XÁC NHẬN NHẬP (Lời khuyên UI) */}
      {showInspectModal && (
        <div className="fixed inset-0 bg-black/60 z-[9999] flex items-center justify-center p-4 backdrop-blur-sm">
           <div className="bg-white w-full max-w-[1150px] p-0 rounded-none shadow-2xl flex flex-col max-h-[95vh] animate-in zoom-in-95 duration-200">
              <div className="p-5 border-b bg-slate-900 text-white flex items-center justify-between">
                <div className="flex flex-col">
                   <h3 className="font-black text-[16px] uppercase flex items-center gap-2"><CheckSquare size={20} className="text-emerald-400"/> GĐ 3: Kiểm định chất lượng hàng hóa thực nhập (QC)</h3>
                   <p className="text-[10px] text-slate-400 uppercase tracking-widest mt-1">Xác nhận số lượng thực đếm và phân loại hàng đạt chuẩn</p>
                </div>
                <button onClick={() => setShowInspectModal(false)} className="text-slate-400 hover:text-white transition-colors"><X size={24}/></button>
              </div>

              <div className="overflow-y-auto flex-1 bg-slate-50 p-6">
                 <div className="bg-blue-50 border border-blue-100 p-4 mb-6 flex items-start gap-4 text-blue-700 shadow-sm rounded-sm">
                    <AlertCircle size={20} className="mt-0.5 shrink-0" />
                    <div className="text-[12px]">
                       <p className="font-black uppercase mb-1">Hướng dẫn kiểm đếm:</p>
                       <ul className="list-disc pl-4 space-y-1 font-bold">
                          <li>Cột <span className="bg-slate-200 px-1">SL đợt này</span> là số lượng đã lập cho đợt giao hiện tại.</li>
                          <li>Nhập riêng <span className="text-blue-700 underline">NCC giao</span>, <span className="text-emerald-700 underline">Đạt QC</span> và <span className="text-rose-700 underline">Lỗi</span>.</li>
                          <li>Cần nhập đủ <span className="text-blue-700 underline">Số lô</span> và <span className="text-blue-700 underline">Hạn dùng</span> để truy xuất nguồn gốc.</li>
                          <li>Công thức bắt buộc: <span className="text-blue-600">NCC giao</span> = <span className="text-emerald-600">Đạt QC</span> + <span className="text-rose-600">Lỗi/Hỏng</span>.</li>
                          <li>Nếu có hàng lỗi hoặc NCC giao thiếu so với đợt này, bắt buộc phải ghi chú lý do để đối soát.</li>
                       </ul>
                    </div>
                 </div>

                 <table className="w-full text-left text-[12px] bg-white border border-slate-200 shadow-xl">
                    <thead className="bg-slate-100 border-b sticky top-0 shadow-sm z-10">
                       <tr className="text-[10px] font-black uppercase text-slate-500 tracking-wider">
                          <th className="p-4 border-r w-[240px]">Sản phẩm / SKU</th>
                          <th className="p-4 text-center border-r w-[140px]">Số lô / Hạn dùng (*)</th>
                          <th className="p-4 text-center border-r w-[90px] bg-slate-200/50 text-slate-600">SL Đợt</th>
                          <th className="p-4 text-center bg-blue-50 text-blue-700 border-r w-[120px]">NCC giao</th>
                          <th className="p-4 text-center bg-emerald-50 text-emerald-700 border-r w-[120px]">Đạt QC</th>
                          <th className="p-4 text-center bg-rose-50 text-rose-700 border-r w-[100px]">Lỗi</th>
                          <th className="p-4 text-left">Lý do lỗi / Ghi chú</th>
                       </tr>
                    </thead>
                    <tbody>
                       {inspectItems.map((item, idx) => {
                          const planned = item.plannedQuantity || 0;
                          const delivered = Number(item.quantityDelivered) || 0;
                          const accepted = Number(item.quantityAccepted) || 0;
                          const rejected = Number(item.quantityRejected) || 0;
                          const isNoteRequired = rejected > 0 || delivered < planned;

                          return (
                         <tr key={idx} className="border-b last:border-0 hover:bg-slate-50/50 transition-colors">
                            <td className="p-4 border-r">
                              <p className="font-black text-slate-700 uppercase leading-tight">{item.productName}</p>
                              <p className="text-[10px] font-mono text-slate-400 mt-1">#{item.productCode}</p>
                            </td>
                            
                            <td className="p-2 border-r space-y-1 bg-slate-50/30">
                               <Input 
                                 placeholder="Số lô hàng..."
                                 value={item.lotNumber || ""}
                                 onChange={(e) => {
                                   const newItems = [...inspectItems];
                                   newItems[idx].lotNumber = e.target.value;
                                   setInspectItems(newItems);
                                 }}
                                 className="h-8 text-[11px] font-bold border-slate-300 rounded-none shadow-none focus-visible:ring-blue-500 bg-white"
                               />
                               <Input 
                                 type="date"
                                 value={item.expiryDate || ""}
                                 onChange={(e) => {
                                   const newItems = [...inspectItems];
                                   newItems[idx].expiryDate = e.target.value;
                                   setInspectItems(newItems);
                                 }}
                                 className="h-8 text-[11px] border-slate-300 rounded-none shadow-none focus-visible:ring-blue-500 bg-white"
                               />
                            </td>

                            <td className="p-4 text-center font-black text-[15px] text-slate-400 border-r bg-slate-100/50">{planned}</td>
                            
                            <td className="p-2 bg-blue-50/30 border-r">
                               <Input 
                                 type="number"
                                 min={0}
                                 value={item.quantityDelivered}
                                 onChange={(e) => {
                                   const newItems = [...inspectItems];
                                   newItems[idx].quantityDelivered = e.target.value;
                                   setInspectItems(newItems);
                                 }}
                                 className="h-10 w-full text-right font-black text-blue-700 border-blue-300 rounded-none shadow-inner focus-visible:ring-blue-500 bg-white"
                               />
                            </td>

                            <td className="p-2 bg-emerald-50/30 border-r">
                               <Input 
                                 type="number"
                                 min={0}
                                 value={item.quantityAccepted} 
                                 onChange={(e) => {
                                   const newItems = [...inspectItems];
                                   newItems[idx].quantityAccepted = e.target.value;
                                   setInspectItems(newItems);
                                 }}
                                 className="h-10 w-full text-right font-black text-emerald-700 border-emerald-300 rounded-none shadow-inner focus-visible:ring-emerald-500 bg-white"
                               />
                            </td>

                            <td className="p-2 bg-rose-50/30 border-r">
                               <Input
                                 type="number"
                                 min={0}
                                 value={item.quantityRejected}
                                 onChange={(e) => {
                                   const newItems = [...inspectItems];
                                   newItems[idx].quantityRejected = e.target.value;
                                   setInspectItems(newItems);
                                 }}
                                 className="h-10 w-full text-right font-black text-rose-600 border-rose-300 rounded-none shadow-inner focus-visible:ring-rose-500 bg-white"
                               />
                            </td>

                            <td className="p-2">
                               <Input 
                                 value={item.note || ""} 
                                 onChange={(e) => {
                                   const newItems = [...inspectItems];
                                   newItems[idx].note = e.target.value;
                                   setInspectItems(newItems);
                                 }}
                                 placeholder={isNoteRequired ? "Bắt buộc: Nêu lý do lỗi hoặc giao thiếu..." : "Ghi chú thêm..."} 
                                 className={cn(
                                   "h-10 rounded-none border-slate-200 text-[11px] font-medium italic shadow-none transition-all bg-white", 
                                   isNoteRequired ? "border-rose-400 bg-rose-50 ring-1 ring-rose-200" : ""
                                 )}
                               />
                            </td>
                         </tr>
                       )})}
                    </tbody>
                 </table>
              </div>
              <div className="p-6 border-t bg-white flex justify-end gap-4 shadow-[0_-15px_30px_rgba(0,0,0,0.05)]">
                 <Button variant="outline" onClick={() => setShowInspectModal(false)} className="rounded-none h-11 text-[13px] font-bold border-slate-300 text-slate-600 px-8 hover:bg-slate-50">HỦY BỎ</Button>
                 <Button onClick={submitInspect} disabled={isProcessing} className="h-11 px-12 bg-emerald-600 hover:bg-emerald-700 text-white rounded-none text-[13px] font-black shadow-lg shadow-emerald-100 flex items-center gap-2"><CheckCircle2 size={18}/> HOÀN TẤT KIỂM HÀNG & NHẬP KHO</Button>
              </div>
           </div>
        </div>
      )}

      {showPaymentModal && (
        <div className="fixed inset-0 bg-black/60 z-[9999] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white w-full max-w-[560px] rounded-none shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b px-5 py-4">
              <div>
                <h3 className="text-[16px] font-black uppercase text-slate-800">Ghi nhận thanh toán NCC</h3>
                <p className="text-[11px] text-slate-400 mt-1">Phiếu {receipt.code} · Còn nợ {formatNumber(currentDebt)} ₫</p>
              </div>
              <button onClick={() => setShowPaymentModal(false)} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label className="text-[12px] font-bold text-slate-500 uppercase">Số tiền thanh toán</Label>
                  <Input
                    type="number"
                    min={0}
                    value={paymentForm.amount}
                    onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                    className="h-10 rounded-none text-right font-bold"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[12px] font-bold text-slate-500 uppercase">Ngày thanh toán</Label>
                  <Input
                    type="date"
                    value={paymentForm.paymentDate}
                    onChange={(e) => setPaymentForm({ ...paymentForm, paymentDate: e.target.value })}
                    className="h-10 rounded-none"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label className="text-[12px] font-bold text-slate-500 uppercase">Phương thức</Label>
                  <select
                    value={paymentForm.paymentMethod}
                    onChange={(e) => setPaymentForm({ ...paymentForm, paymentMethod: e.target.value })}
                    className="h-10 w-full border border-slate-200 px-3 text-[13px] font-medium outline-none"
                  >
                    <option value="TRANSFER">Chuyển khoản</option>
                    <option value="CASH">Tiền mặt</option>
                    <option value="OTHER">Khác</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <Label className="text-[12px] font-bold text-slate-500 uppercase">Tham chiếu</Label>
                  <Input
                    value={paymentForm.referenceCode}
                    onChange={(e) => setPaymentForm({ ...paymentForm, referenceCode: e.target.value })}
                    className="h-10 rounded-none"
                    placeholder="UNC / mã giao dịch..."
                  />
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-[12px] font-bold text-slate-500 uppercase">Ghi chú</Label>
                <Input
                  value={paymentForm.note}
                  onChange={(e) => setPaymentForm({ ...paymentForm, note: e.target.value })}
                  className="h-10 rounded-none"
                  placeholder="Ví dụ: thanh toán đợt 1, chuyển khoản ngân hàng..."
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 border-t bg-slate-50 px-5 py-4">
              <Button
                variant="outline"
                className="h-9 rounded-none"
                onClick={() => setShowPaymentModal(false)}
                disabled={isProcessing}
              >
                Hủy
              </Button>
              <Button
                className="h-9 rounded-none bg-blue-600 hover:bg-blue-700"
                onClick={submitPayment}
                disabled={isProcessing}
              >
                {isProcessing ? "Đang ghi nhận..." : "Xác nhận thanh toán"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* AlertDialog dành cho các xác nhận quan trọng */}
      <AlertDialog open={confirmConfig.open} onOpenChange={(o) => setConfirmConfig({ ...confirmConfig, open: o })}>
        <AlertDialogContent className="rounded-none border-2 border-slate-200 shadow-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-[16px] font-black uppercase text-slate-800 flex items-center gap-2">
              <AlertCircle className={cn("w-5 h-5", confirmConfig.variant === "destructive" ? "text-rose-500" : "text-blue-500")} />
              {confirmConfig.title}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-[13px] font-medium text-slate-500 leading-relaxed pt-2">
              {confirmConfig.description}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="pt-4 gap-3">
            <AlertDialogCancel className="rounded-none border-slate-300 text-slate-500 font-bold uppercase text-[11px] h-9 px-6 hover:bg-slate-50">Quay lại</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmConfig.action}
              className={cn(
                "rounded-none font-black uppercase text-[11px] h-9 px-8 shadow-lg transition-all",
                confirmConfig.variant === "destructive" ? "bg-rose-600 hover:bg-rose-700" : "bg-blue-600 hover:bg-blue-700"
              )}
            >
              Xác nhận
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
