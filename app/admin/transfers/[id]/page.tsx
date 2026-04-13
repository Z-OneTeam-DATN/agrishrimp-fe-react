"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { transferService } from "@/app/services/transfer.service";
import { branchService } from "@/app/services/branchService";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  ChevronLeft, Printer, Truck, CheckCircle2, ArrowRightLeft, 
  FileText, Package, Settings, HelpCircle, X, ArrowDownToLine, 
  Plus, AlertCircle, History, Edit, Ban, CheckSquare
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCurrentUser } from "@/hooks/useCurrentUser";

export default function TransferDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [transfer, setTransfer] = useState<any>(null);
  const [branches, setBranches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const { data: currentUser } = useCurrentUser();

  // Kiểm tra quyền Admin
  const isAdmin = currentUser?.role?.id === 1 || currentUser?.role?.displayName === 'Quản trị viên';

  // Quyền duyệt xuất: CHỈ DÀNH CHO ADMIN
  const canApproveShip = isAdmin;

  // Modal States
  const [showChangeBranchModal, setShowChangeBranchModal] = useState(false);
  const [newBranchId, setNewBranchId] = useState("");
  const [showInspectModal, setShowInspectModal] = useState(false);
  const [inspectItems, setInspectItems] = useState<any[]>([]);

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    try {
      const [transferData, branchData] = await Promise.all([
        transferService.getById(id as string),
        branchService.getAll()
      ]);
      setTransfer(transferData);
      setBranches(branchData || []);
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
      const updated = await transferService.getById(id as string);
      setTransfer(updated);
    } catch (error: any) {
      const errData = error.response?.data;
      let errMsg = "Lỗi xử lý hệ thống";
      if (typeof errData === 'string') {
          errMsg = errData;
      } else if (errData && typeof errData === 'object') {
          errMsg = String(errData.detail || errData.message || "Đã xảy ra lỗi hệ thống");
      }
      toast.error(errMsg);
    } finally {
      setIsProcessing(false);
    }
  };

  // 1. Duyệt xuất kho
  const handleApprove = () => {
    handleApiCall(() => transferService.approve(id as string), "Đã xuất kho thành công!");
  };

  // 2. Hủy phiếu
  const handleCancel = () => {
    handleApiCall(() => transferService.cancel(id as string), "Đã hủy phiếu thành công!");
  };

  // 3. Thay đổi chi nhánh nhận
  const handleChangeDestination = () => {
    if (!newBranchId) return toast.error("Vui lòng chọn chi nhánh mới");
    handleApiCall(() => transferService.changeDestination(id as string, newBranchId), "Đã đổi chi nhánh nhận thành công!");
    setShowChangeBranchModal(false);
  };

  // 4. Nhận đủ hàng nhanh
  const handleReceiveAll = () => {
    const payload = (transfer?.items || []).map((i: any) => ({
      variantId: i.variantId,
      quantityReal: i.quantityRequested,
      note: "Nhận đủ"
    }));
    handleApiCall(() => transferService.receive(id as string, payload), "Đã nhập kho nhận thành công!");
  };

  // 5. Kiểm đếm & Nhận hàng
  const openInspectModal = () => {
    setInspectItems((transfer?.items || []).map((i: any) => ({
      ...i,
      quantityReal: i.quantityRequested,
      note: ""
    })));
    setShowInspectModal(true);
  };

  const submitInspect = () => {
    const payload = inspectItems.map((i) => ({
      variantId: i.variantId,
      quantityReal: Number(i.quantityReal || 0),
      note: i.note || ""
    }));

    handleApiCall(() => transferService.receive(id as string, payload), "Đã kiểm đếm và nhập kho thành công!");
    setShowInspectModal(false);
  };

  if (loading) return <div className="p-10 text-center italic text-slate-400">Đang tải dữ liệu...</div>;
  if (!transfer) return <div className="p-10 text-center text-rose-500 font-bold">LỖI: PHIẾU KHÔNG TỒN TẠI</div>;

  const steps = [
    { label: "Khởi tạo", status: "completed", icon: Plus },
    { label: "Chờ xuất kho", status: transfer.status === "PENDING" ? "active" : "completed", icon: AlertCircle },
    { label: "Đang vận chuyển", status: transfer.status === "PENDING" ? "upcoming" : (["SHIPPING", "TRANSIT"].includes(transfer.status) ? "active" : "completed"), icon: Truck },
    { label: transfer.status === "CANCELLED" ? "Đã Hủy" : "Đã nhận hàng", status: transfer.status === "COMPLETED" ? "completed" : transfer.status === "CANCELLED" ? "active" : "upcoming", icon: transfer.status === "CANCELLED" ? Ban : CheckCircle2 },
  ];

  const auditLogs = [
    {
      time: new Date(transfer.createdAt || new Date()).toLocaleString('vi-VN'),
      user: "Hệ thống",
      action: "Khởi tạo phiếu dự thảo",
      detail: "Hệ thống tự động cấp mã phiếu",
    }
  ];
  if (transfer.status !== "PENDING" && transfer.status !== "CANCELLED") {
    auditLogs.unshift({
      time: transfer.transferDate ? new Date(transfer.transferDate).toLocaleString('vi-VN') : new Date().toLocaleString('vi-VN'),
      user: "Quản trị viên",
      action: "Xác nhận xuất kho",
      detail: "Đã trừ tồn kho và giao cho đơn vị vận chuyển",
    });
  }
  if (transfer.status === "COMPLETED") {
    auditLogs.unshift({
      time: new Date().toLocaleString('vi-VN'),
      user: "Quản trị viên",
      action: "Nhập kho chi nhánh nhận",
      detail: "Đã hoàn tất kiểm đếm và cộng tồn kho",
    });
  }
  if (transfer.status === "CANCELLED") {
    auditLogs.unshift({
      time: new Date().toLocaleString('vi-VN'),
      user: "Quản trị viên",
      action: "Hủy phiếu điều chuyển",
      detail: "Hệ thống đã tự động hoàn trả tồn kho",
    });
  }

  return (
    <div className="space-y-4 p-4 bg-slate-50/30 min-h-screen pb-20 relative">
      
      {/* HEADER */}
      <div className="flex items-center gap-4 mb-2 px-1">
        <Button variant="ghost" size="icon" onClick={() => router.back()} className="h-8 w-8 text-slate-400">
          <ChevronLeft size={20} />
        </Button>
        <div className="flex flex-col">
          <div className="flex items-center gap-3">
             <h1 className="text-[18px] font-black text-[#1f1f1f] tracking-tight uppercase">
               LẬP PHIẾU ĐIỀU CHUYỂN HÀNG HÓA
             </h1>
          </div>
          <div className="flex items-center gap-6 mt-1 opacity-70 pointer-events-none">
            <div className="flex items-center space-x-2">
              <div className={cn("w-3.5 h-3.5 rounded-full border-[4px]", transfer.transferType === "BETWEEN_WAREHOUSES" ? "border-emerald-500 bg-white" : "border-slate-300")} />
              <Label className={cn("text-[11px] font-bold uppercase tracking-wider", transfer.transferType === "BETWEEN_WAREHOUSES" ? "text-blue-600" : "text-slate-400")}>Điều chuyển liên kho</Label>
            </div>
            <div className="flex items-center space-x-2">
              <div className={cn("w-3.5 h-3.5 rounded-full border-[4px]", transfer.transferType !== "BETWEEN_WAREHOUSES" ? "border-emerald-500 bg-white" : "border-slate-300")} />
              <Label className={cn("text-[11px] font-bold uppercase tracking-wider", transfer.transferType !== "BETWEEN_WAREHOUSES" ? "text-blue-600" : "text-slate-400")}>Nội bộ</Label>
            </div>
          </div>
        </div>

        <div className="ms-auto flex items-center gap-3 text-gray-400">
          <div className={cn("hidden md:flex px-3 py-1.5 border items-center gap-2 rounded-none", transfer.status === "COMPLETED" ? "bg-emerald-50 border-emerald-200 text-emerald-700" : "bg-amber-50 border-amber-200 text-amber-700")}>
            <ArrowDownToLine size={14} />
            <span className="text-[10px] font-black uppercase tracking-widest">Nhập kho: {transfer.status === "COMPLETED" ? "Đã nhập" : "Chờ nhập"}</span>
          </div>
          <Settings size={18} className="cursor-pointer hover:text-blue-600 transition-colors" />
          <HelpCircle size={18} className="cursor-pointer hover:text-blue-600 transition-colors" />
          <Button type="button" variant="ghost" size="icon" onClick={() => router.back()} className="h-8 w-8"><X size={20} /></Button>
        </div>
      </div>

      <div className="flex items-center gap-2 bg-white p-3 border border-[#dcdcdc] shadow-sm justify-between">
         <div className="text-[14px] font-black text-slate-800 uppercase tracking-tighter flex items-center gap-2">
            MÃ PHIẾU: <span className="text-blue-600">{transfer.transferCode || "---"}</span>
         </div>
         <div className="flex items-center gap-2">
            <Button variant="outline" className="h-8 text-[11px] font-bold border-slate-300 rounded-none px-3 text-slate-600"><Printer size={14} className="mr-1.5" /> IN PHIẾU</Button>
           {transfer.status === "PENDING" && canApproveShip && (
             <Button onClick={handleApprove} className="bg-blue-600">
               XÁC NHẬN XUẤT KHO (BẮT ĐẦU VẬN CHUYỂN)
             </Button>
           )}
            {["SHIPPING", "TRANSIT"].includes(transfer.status) && (
              <React.Fragment>
                  <Button onClick={handleReceiveAll} disabled={isProcessing} className="h-8 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-[11px] rounded-none"><CheckSquare size={14} className="mr-1.5"/> ĐÃ NHẬN ĐỦ</Button>
                  <Button onClick={openInspectModal} disabled={isProcessing} className="h-8 bg-amber-500 hover:bg-amber-600 text-white font-black text-[11px] rounded-none"><Package size={14} className="mr-1.5"/> KIỂM ĐẾM & NHẬN</Button>
                  <Button onClick={handleCancel} disabled={isProcessing} variant="outline" className="h-8 text-rose-600 border-rose-200 hover:bg-rose-50 font-black text-[11px] rounded-none"><Ban size={14} className="mr-1.5"/> HỦY PHIẾU</Button>
              </React.Fragment>
            )}
         </div>
      </div>

      {/* STEP BAR */}
      <div className="bg-white border border-[#dcdcdc] p-6 rounded-none shadow-sm mb-4">
        <div className="flex items-center justify-between max-w-4xl mx-auto">
          {steps.map((step, idx) => (
            <React.Fragment key={idx}>
              <div className="flex flex-col items-center gap-2 relative z-10">
                <div className={cn("w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300", step.status === "completed" ? "bg-emerald-500 border-emerald-500 text-white" : step.status === "active" ? (transfer.status === 'CANCELLED' ? "bg-rose-500 border-rose-500 text-white" : "bg-blue-600 border-blue-600 text-white shadow-lg") : "bg-slate-50 border-slate-200 text-slate-300")}>
                  <step.icon size={20} />
                </div>
                <span className={cn("text-[10px] font-black uppercase tracking-tighter", step.status === "active" ? (transfer.status === 'CANCELLED' ? "text-rose-600" : "text-blue-600") : "text-slate-400")}>{step.label}</span>
              </div>
              {idx < steps.length - 1 && (
                <div className="flex-1 h-[3px] bg-slate-100 mx-2 -mt-6 relative">
                  <div className={cn("absolute inset-0 transition-all duration-500", steps[idx].status === "completed" ? "bg-emerald-500" : "bg-transparent")} />
                </div>
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="lg:col-span-9 space-y-5">
          {/* Thông tin kho */}
          <div className="bg-white border border-[#dcdcdc] p-6 rounded-none shadow-sm grid grid-cols-2 gap-6 relative">
            <div className="space-y-4">
               <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center font-black border border-blue-100">XUẤT</div>
                  <div>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Từ kho (Nguồn)</p>
                    <p className="text-[15px] font-black text-slate-700 uppercase">{transfer.fromBranchName || "---"}</p>
                  </div>
               </div>
               <div className="flex items-center gap-4 group">
                  <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center font-black border border-emerald-100">NHẬN</div>
                  <div>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Đến kho (Đích)</p>
                    <div className="flex items-center gap-2">
                       <p className="text-[15px] font-black text-slate-700 uppercase">{transfer.toBranchName || "---"}</p>
                       {["SHIPPING", "TRANSIT"].includes(transfer.status) && (
                         <button onClick={() => setShowChangeBranchModal(true)} className="text-blue-500 hover:text-blue-700 opacity-0 group-hover:opacity-100 transition-opacity" title="Thay đổi chi nhánh nhận"><Edit size={14}/></button>
                       )}
                    </div>
                  </div>
               </div>
            </div>
            <div className="border-l pl-8 border-slate-100 space-y-3 text-[13px]">
               <div className="flex justify-between"><span className="text-slate-400 uppercase text-[10px] font-bold">Ngày khởi tạo:</span><span className="font-bold">{transfer.createdAt ? new Date(transfer.createdAt).toLocaleString('vi-VN') : '---'}</span></div>
               <div className="flex justify-between"><span className="text-slate-400 uppercase text-[10px] font-bold">Tổng số lượng:</span><span className="font-black text-blue-600 text-lg">{transfer.totalQuantity || 0}</span></div>
            </div>
          </div>

          {/* Bảng hàng hóa */}
          <div className="bg-white border border-[#dcdcdc] rounded-none shadow-sm overflow-hidden">
             <div className="px-5 py-3 bg-slate-50 border-b font-black text-[11px] uppercase text-slate-500 tracking-widest flex items-center gap-2"><Package size={14}/> Danh mục vật tư điều chuyển</div>
             <table className="w-full text-[13px]">
                <thead className="bg-white border-b text-[10px] uppercase text-slate-400">
                   <tr>
                      <th className="p-4 text-left">Sản phẩm / SKU</th>
                      <th className="p-4 text-center">ĐVT</th>
                      <th className="p-4 text-right">SL Yêu cầu</th>
                      <th className="p-4 text-right bg-emerald-50/30 text-emerald-600">Thực nhận</th>
                   </tr>
                </thead>
                <tbody>
                   {(transfer.items || []).map((item: any, i: number) => (
                      <tr key={i} className="border-b last:border-0 hover:bg-slate-50/50 transition-colors">
                         <td className="p-4"><p className="font-black text-slate-700 uppercase">{item.productName || "---"}</p><p className="text-[11px] font-mono text-blue-500 font-bold">{item.sku || "---"}</p></td>
                         <td className="p-4 text-center text-slate-500 font-bold">{item.unit || "---"}</td>
                         <td className="p-4 text-right font-black text-slate-700 text-base">{item.quantityRequested || 0}</td>
                         <td className="p-4 text-right font-black text-emerald-600 text-base bg-emerald-50/20">{item.quantityReal || 0}</td>
                      </tr>
                   ))}
                </tbody>
             </table>
          </div>

          <div className="bg-white border border-[#dcdcdc] p-6 rounded-none shadow-sm">
            <div className="flex items-center gap-2 mb-4 text-slate-700 font-black text-[11px] uppercase tracking-widest border-b pb-3">
              <History size={16} /> Nhật ký xử lý chứng từ hệ thống
            </div>
            <div className="space-y-3">
              {auditLogs.map((log, i) => (
                <div key={i} className="flex gap-4 items-start text-[12px] border-l-2 border-slate-100 pl-4 ml-2 relative">
                  <div className={cn("absolute -left-[5px] top-1.5 w-2 h-2 rounded-full ring-4 ring-white", i === 0 ? "bg-blue-500" : "bg-slate-300")} />
                  <div className="min-w-[120px] text-slate-400 font-mono text-[11px] pt-0.5">{log.time}</div>
                  <div className="font-black text-blue-600 pt-0.5">{log.user}</div>
                  <div className="text-slate-600 pt-0.5">
                    {log.action}: <span className="text-slate-400 italic">{log.detail}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="lg:col-span-3 space-y-5">
           <div className="bg-white border border-[#dcdcdc] p-5 rounded-none shadow-sm space-y-4">
              <h3 className="font-black text-[11px] uppercase text-slate-400 border-b pb-2 flex items-center gap-2"><Truck size={14}/> Vận tải hàng hóa</h3>
              <div className="text-[13px] space-y-3">
                 <p className="flex justify-between border-b border-slate-50 pb-2"><span className="text-slate-400">Tài xế:</span><span className="font-bold">{transfer.transporter || 'Chưa cập nhật'}</span></p>
                 <p className="flex justify-between border-b border-slate-50 pb-2"><span className="text-slate-400">Phương tiện:</span><span className="font-bold text-blue-600">{transfer.vehicle || 'Chưa cập nhật'}</span></p>
                 <p className="flex flex-col gap-1"><span className="text-slate-400 text-[10px] font-bold uppercase">Lệnh điều động số:</span><span className="font-mono text-[12px] p-2 bg-slate-900 text-emerald-400 border border-slate-800">{transfer.dispatchOrder || '---'}</span></p>
              </div>
           </div>
           <div className="bg-amber-50 border border-amber-100 p-5 rounded-none">
              <h3 className="font-black text-[11px] uppercase text-amber-600 flex items-center gap-2 mb-2"><FileText size={14}/> Lý do điều chuyển</h3>
              <p className="text-[13px] text-amber-800 leading-relaxed italic font-medium">"{transfer.description || 'Không có nội dung ghi chú diễn giải cho phiếu này.'}"</p>
           </div>
        </div>
      </div>

      {/* MODAL 1: ĐỔI CHI NHÁNH NHẬN */}
      {showChangeBranchModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
           <div className="bg-white w-full max-w-md p-6 rounded-none shadow-2xl space-y-4">
              <h3 className="font-black text-[14px] uppercase border-b pb-2">Thay đổi chi nhánh nhận</h3>
              <div className="space-y-2">
                 <Label className="text-[11px] text-slate-500 font-bold">Chọn chi nhánh mới:</Label>
                 <Select value={newBranchId || undefined} onValueChange={setNewBranchId}>
                    <SelectTrigger className="rounded-none border-slate-300 font-bold"><SelectValue placeholder="Chọn chi nhánh..."/></SelectTrigger>
                    <SelectContent className="rounded-none">
                       {branches.map(b => (
                         <SelectItem key={b.id} value={b.id.toString()} disabled={b.name === transfer.fromBranchName}>{b.name}</SelectItem>
                       ))}
                    </SelectContent>
                 </Select>
                 <p className="text-[10px] text-amber-600 italic">Hàng đang về sẽ được chuyển hướng sang chi nhánh này.</p>
              </div>
              <div className="flex justify-end gap-2 pt-4">
                 <Button variant="outline" onClick={() => setShowChangeBranchModal(false)} className="rounded-none text-[11px] font-bold">HỦY</Button>
                 <Button onClick={handleChangeDestination} disabled={isProcessing} className="bg-blue-600 hover:bg-blue-700 text-white rounded-none text-[11px] font-black">XÁC NHẬN ĐỔI</Button>
              </div>
           </div>
        </div>
      )}

      {/* MODAL 2: KIỂM ĐẾM & NHẬN HÀNG */}
      {showInspectModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
           <div className="bg-white w-full max-w-4xl p-6 rounded-none shadow-2xl flex flex-col max-h-[90vh]">
              <h3 className="font-black text-[15px] uppercase border-b pb-3 mb-4 flex items-center gap-2"><Package size={18} className="text-amber-600"/> Phiếu kiểm đếm & Nhận hàng</h3>
              <div className="overflow-y-auto flex-1 border border-slate-200">
                 <table className="w-full text-left text-[12px]">
                    <thead className="bg-slate-50 border-b sticky top-0">
                       <tr className="text-[10px] uppercase text-slate-500">
                          <th className="p-3">Sản phẩm</th>
                          <th className="p-3 text-center">Yêu cầu</th>
                          <th className="p-3 text-center bg-amber-50 text-amber-700">Thực nhận</th>
                          <th className="p-3">Ghi chú (Thiếu/Hư hỏng)</th>
                       </tr>
                    </thead>
                    <tbody>
                       {inspectItems.map((item, idx) => (
                         <tr key={idx} className="border-b last:border-0 hover:bg-slate-50">
                            <td className="p-3 font-bold text-slate-700">{item.productName}</td>
                            <td className="p-3 text-center font-black">{item.quantityRequested}</td>
                            <td className="p-3 bg-amber-50/30">
                               <Input 
                                 type="number" 
                                 value={item.quantityReal || 0} 
                                 onChange={(e) => {
                                   const newItems = [...inspectItems];
                                   newItems[idx].quantityReal = e.target.value;
                                   setInspectItems(newItems);
                                 }}
                                 className="h-8 w-24 mx-auto text-center rounded-none border-amber-300 font-black text-emerald-600"
                               />
                            </td>
                            <td className="p-3">
                               <Input 
                                 value={item.note || ""} 
                                 onChange={(e) => {
                                   const newItems = [...inspectItems];
                                   newItems[idx].note = e.target.value;
                                   setInspectItems(newItems);
                                 }}
                                 placeholder="Lý do chênh lệch..." 
                                 className="h-8 rounded-none border-slate-200 text-[11px] italic"
                               />
                            </td>
                         </tr>
                       ))}
                    </tbody>
                 </table>
              </div>
              <div className="flex justify-end gap-3 pt-5 mt-auto">
                 <Button variant="outline" onClick={() => setShowInspectModal(false)} className="rounded-none text-[12px] font-bold">HỦY BỎ</Button>
                 <Button onClick={submitInspect} disabled={isProcessing} className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-none text-[12px] font-black"><CheckSquare size={16} className="mr-2"/> LƯU KIỂM ĐẾM & NHẬP KHO</Button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
}