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
  Plus, AlertCircle, History, Edit, Ban, CheckSquare, ListChecks, Play
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCurrentUser } from "@/hooks/useCurrentUser";
<<<<<<< Updated upstream
=======
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
>>>>>>> Stashed changes

export default function TransferDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [transfer, setTransfer] = useState<any>(null);
  const [branches, setBranches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const { data: currentUser } = useCurrentUser();

<<<<<<< Updated upstream
  // Kiểm tra quyền Admin
  const isAdmin = currentUser?.role?.id === 1 || currentUser?.role?.displayName === 'Quản trị viên';
=======
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
>>>>>>> Stashed changes

  const showConfirm = (title: string, description: string, action: () => void, variant: "default" | "destructive" = "default") => {
    setConfirmConfig({ open: true, title, description, action, variant });
  };

  // Kiểm tra quyền
  const isAdmin = user?.role?.slug === "ADMIN";
  const isManager = user?.role?.slug === "MANAGER";
  
  const canSeePrice = isAdmin || isManager || hasPermission(P.IMPORT_VIEW) || hasPermission(P.EXPORT_VIEW) || hasPermission(P.CHECK_VIEW);
  
  const canApprove = isAdmin; // CHỈ ADMIN mới có quyền duyệt yêu cầu từ Manager
  const canShip = isAdmin || isManager || hasPermission(P.TRANSFER_EXPORT); // Quyền xuất kho gửi
  const canReceive = isAdmin || isManager || hasPermission(P.TRANSFER_IMPORT); // Quyền nhận hàng & QC

  const isQCMode = transfer?.status === "SHIPPING" || transfer?.status === "COMPLETED";

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
      toast.error(getErrorMessage(error));
    } finally {
      setIsProcessing(false);
    }
  };

  // 1. Duyệt yêu cầu
  const handleApprove = () => {
    showConfirm(
      "Xác nhận duyệt yêu cầu",
      "Bạn có chắc chắn muốn duyệt yêu cầu điều chuyển này không? Sau khi duyệt, kho gửi có thể thực hiện xuất hàng.",
      () => handleApiCall(() => transferService.approve(id as string), "Đã duyệt phiếu thành công!")
    );
  };

  // 2. Xuất kho
  const handleShip = () => {
    showConfirm(
      "Xác nhận XUẤT KHO",
      "Hệ thống sẽ trừ tồn kho thực tế tại kho gửi và bắt đầu quá trình vận chuyển. Bạn đã kiểm tra kỹ chưa?",
      () => handleApiCall(() => transferService.ship(id as string), "Đã xuất kho và bắt đầu vận chuyển!")
    );
  };

  // 3. Hủy phiếu
  const handleCancel = () => {
    showConfirm(
      "Xác nhận HỦY phiếu",
      "Hành động này sẽ hủy bỏ phiếu điều chuyển hiện tại và không thể hoàn tác. Bạn có chắc chắn không?",
      () => handleApiCall(() => transferService.cancel(id as string), "Đã hủy phiếu thành công!"),
      "destructive"
    );
  };

  // 3.1 Từ chối phiếu
  const handleReject = () => {
    showConfirm(
      "Xác nhận TỪ CHỐI phiếu",
      "Bạn có chắc chắn muốn từ chối yêu cầu điều chuyển này không?",
      () => handleApiCall(() => transferService.reject(id as string), "Đã từ chối phiếu thành công!"),
      "destructive"
    );
  };

  // 4. Thay đổi chi nhánh nhận
  const handleChangeDestination = () => {
    if (!newBranchId) return toast.error("Vui lòng chọn chi nhánh mới");
    handleApiCall(() => transferService.changeDestination(id as string, newBranchId), "Đã đổi chi nhánh nhận thành công!");
    setShowChangeBranchModal(false);
  };

  // 5. Kiểm đếm & Nhận hàng (QC)
  const openInspectModal = () => {
    setInspectItems((transfer?.items || []).map((i: any) => ({
      ...i,
      quantityReal: i.quantityRequested || i.plannedQuantity || 0,
      quantityAccepted: i.quantityRequested || i.plannedQuantity || 0,
      quantityRejected: 0,
      itemNote: i.itemNote || i.note || ""
    })));
    setShowInspectModal(true);
  };

  const submitInspect = () => {
    const payload = inspectItems.map((i) => ({
      variantId: i.variantId || i.id,
      quantityReal: Number(i.quantityReal || 0),
      quantityAccepted: Number(i.quantityAccepted || 0),
      quantityRejected: Number(i.quantityRejected || 0),
      note: i.itemNote || ""
    }));

    handleApiCall(() => transferService.receive(id as string, payload), "Đã hoàn tất nhận hàng và cập nhật tồn kho!");
    setShowInspectModal(false);
  };

  if (loading) return <div className="p-10 text-center flex justify-center items-center h-screen"><div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div></div>;
  if (!transfer) return <div className="p-10 text-center text-rose-500 font-bold">LỖI: PHIẾU KHÔNG TỒN TẠI</div>;

  // Sơ đồ quy trình đơn giản (Số + Trạng thái) đồng bộ style nhập xuất
  const WorkflowDiagram = ({ currentStatus }: { currentStatus: string }) => {
    const status = (currentStatus || "").toUpperCase();

    const steps = [
      { key: "PENDING", label: "Yêu cầu", role: "Manager" },
      { key: "APPROVED", label: "Phê duyệt", role: "Admin" },
      { key: "SHIPPING", label: "Vận chuyển", role: "Kho gửi" },
      { key: "COMPLETED", label: "Hoàn thành", role: "Kho nhận" },
    ];

    let activeIdx = 0;
    if (status === "PENDING") activeIdx = 0;
    else if (status === "APPROVED") activeIdx = 1;
    else if (status === "SHIPPING" || status === "TRANSIT") activeIdx = 2;
    else if (status === "COMPLETED") activeIdx = 3;

    const isCancelled = status === "CANCELLED" || status === "REJECTED";

    return (
      <div className="bg-white border border-slate-200 p-6 mb-6 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 left-0 w-1 h-full bg-blue-600"></div>
        <div className="flex items-center justify-between max-w-4xl mx-auto relative px-4">
          {steps.map((step, idx) => {
            const isDone = idx < activeIdx || status === "COMPLETED";
            const isCurrent = idx === activeIdx && status !== "COMPLETED";

            return (
              <React.Fragment key={idx}>
                <div className="flex flex-col items-center gap-2 relative z-10">
                  <div className={cn(
                    "w-9 h-9 rounded-full flex items-center justify-center border-2 transition-all duration-500 text-[13px] font-black",
                    isDone ? "bg-emerald-500 border-emerald-500 text-white shadow-sm" : 
                    isCurrent ? (isCancelled ? "bg-rose-500 border-rose-500 text-white" : "bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-100") : 
                    "bg-white border-slate-200 text-slate-400"
                  )}>
                    {idx + 1}
                  </div>
                  <div className="text-center">
                    <p className={cn("text-[10px] font-black uppercase tracking-tight", isCurrent ? "text-blue-600" : isDone ? "text-emerald-600" : "text-slate-400")}>
                      {step.label}
                    </p>
                    <p className="text-[9px] font-bold text-slate-300 uppercase">{step.role}</p>
                  </div>
                </div>
                {idx < steps.length - 1 && (
                  <div className="flex-1 h-[2px] bg-slate-100 mx-4 -mt-8 relative overflow-hidden">
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
        {isCancelled && (
          <div className="mt-4 p-1.5 bg-rose-50 border border-rose-100 text-rose-600 text-center text-[10px] font-black uppercase tracking-widest">
             Phiếu điều chuyển này đã bị {status === "REJECTED" ? "từ chối" : "hủy bỏ"}
          </div>
        )}
      </div>
    );
  };

  const auditLogs = [
    {
      time: new Date(transfer.createdAt || new Date()).toLocaleString('vi-VN'),
      user: "Hệ thống",
      action: "Khởi tạo yêu cầu",
      detail: "Phiếu đang chờ duyệt",
    }
  ];
  
  if (["APPROVED", "SHIPPING", "COMPLETED"].includes(transfer.status)) {
    auditLogs.unshift({
      time: new Date(transfer.updatedAt || new Date()).toLocaleString('vi-VN'),
      user: "Quản trị viên",
      action: "Duyệt yêu cầu",
      detail: "Cho phép kho gửi chuẩn bị hàng",
    });
  }
  
  if (["SHIPPING", "COMPLETED"].includes(transfer.status)) {
    auditLogs.unshift({
      time: transfer.transferDate ? new Date(transfer.transferDate).toLocaleString('vi-VN') : new Date().toLocaleString('vi-VN'),
      user: "Thủ kho xuất",
      action: "Xác nhận xuất kho",
      detail: "Đã trừ tồn kho và bàn giao cho vận chuyển",
    });
  }

  if (transfer.status === "COMPLETED") {
    auditLogs.unshift({
      time: new Date().toLocaleString('vi-VN'),
      user: "Thủ kho nhận",
      action: "Nhập kho chi nhánh nhận",
      detail: "Đã hoàn tất kiểm đếm QC và cộng tồn kho",
    });
  }

  if (transfer.status === "CANCELLED" || transfer.status === "REJECTED") {
    auditLogs.unshift({
      time: new Date().toLocaleString('vi-VN'),
      user: "Quản trị viên",
      action: transfer.status === "REJECTED" ? "Từ chối phiếu" : "Hủy phiếu điều chuyển",
      detail: transfer.status === "REJECTED" ? "Yêu cầu bị từ chối" : "Phiếu đã bị hủy bỏ",
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
               ĐIỀU CHUYỂN LIÊN KHO
             </h1>
          </div>
        </div>

        <div className="ms-auto flex items-center gap-3 text-gray-400">
          <div className={cn("hidden md:flex px-3 py-1.5 border items-center gap-2 rounded-none", transfer.status === "COMPLETED" ? "bg-emerald-50 border-emerald-200 text-emerald-700" : "bg-amber-50 border-amber-200 text-amber-700")}>
            <ArrowDownToLine size={14} />
            <span className="text-[10px] font-black uppercase tracking-widest">Trạng thái: {transfer.status}</span>
          </div>
          <Settings size={18} className="cursor-pointer hover:text-blue-600 transition-colors" />
          <HelpCircle size={18} className="cursor-pointer hover:text-blue-600 transition-colors" />
          <Button type="button" variant="ghost" size="icon" onClick={() => router.back()} className="h-8 w-8"><X size={20} /></Button>
        </div>
      </div>

      <div className="flex items-center gap-2 bg-white p-3 border border-[#dcdcdc] shadow-sm justify-between">
         <div className="text-[14px] font-black text-slate-800 uppercase tracking-tighter flex items-center gap-2">
            MÃ PHIẾU: <span className="text-blue-600">{transfer.transferCode || transfer.code || "---"}</span>
         </div>
         <div className="flex items-center gap-2">
            <Button variant="outline" className="h-8 text-[11px] font-bold border-slate-300 rounded-none px-3 text-slate-600"><Printer size={14} className="mr-1.5" /> IN PHIẾU</Button>
            
            {transfer.status === "PENDING" && canApprove && (
              <>
                <Button onClick={handleApprove} disabled={isProcessing} className="h-8 bg-blue-600 hover:bg-blue-700 text-white font-black text-[11px] rounded-none">
                  <ListChecks size={14} className="mr-1.5"/> DUYỆT YÊU CẦU
                </Button>
                <Button onClick={handleReject} disabled={isProcessing} variant="outline" className="h-8 text-rose-600 border-rose-200 hover:bg-rose-50 font-black text-[11px] rounded-none">
                  <Ban size={14} className="mr-1.5"/> TỪ CHỐI
                </Button>
              </>
            )}

            {transfer.status === "APPROVED" && canShip && (
              <>
                <Button onClick={handleShip} disabled={isProcessing} className="h-8 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-[11px] rounded-none">
                  <Play size={14} className="mr-1.5"/> XÁC NHẬN XUẤT KHO
                </Button>
                <Button onClick={handleCancel} disabled={isProcessing} variant="outline" className="h-8 text-rose-600 border-rose-200 hover:bg-rose-50 font-black text-[11px] rounded-none">
                  <Ban size={14} className="mr-1.5"/> HỦY PHIẾU
                </Button>
              </>
            )}

            {transfer.status === "SHIPPING" && canReceive && (
              <Button onClick={openInspectModal} disabled={isProcessing} className="h-8 bg-amber-500 hover:bg-amber-600 text-white font-black text-[11px] rounded-none">
                <CheckSquare size={14} className="mr-1.5"/> KIỂM ĐẾM & NHẬN HÀNG
              </Button>
            )}
         </div>
      </div>

      <WorkflowDiagram currentStatus={transfer.status} />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="lg:col-span-9 space-y-5">
          {/* Thông tin kho */}
          <div className="bg-white border border-[#dcdcdc] p-6 rounded-none shadow-sm grid grid-cols-2 gap-6 relative">
            <div className="space-y-4">
               <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center font-black border border-blue-100">XUẤT</div>
                  <div>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Từ kho gửi (Source)</p>
                    <p className="text-[15px] font-black text-slate-700 uppercase">{transfer.fromBranchName || transfer.sourceBranchName || "---"}</p>
                  </div>
               </div>
               <div className="flex items-center gap-4 group">
                  <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center font-black border border-emerald-100">NHẬN</div>
                  <div>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Đến kho nhận (Dest)</p>
                    <div className="flex items-center gap-2">
                       <p className="text-[15px] font-black text-slate-700 uppercase">{transfer.toBranchName || transfer.destBranchName || "---"}</p>
                       {["APPROVED", "SHIPPING"].includes(transfer.status) && (
                         <button onClick={() => setShowChangeBranchModal(true)} className="text-blue-500 hover:text-blue-700 opacity-0 group-hover:opacity-100 transition-opacity" title="Thay đổi chi nhánh nhận"><Edit size={14}/></button>
                       )}
                    </div>
                  </div>
               </div>
            </div>
            <div className="border-l pl-8 border-slate-100 space-y-3 text-[13px]">
               <div className="flex justify-between"><span className="text-slate-400 uppercase text-[10px] font-bold">Ngày khởi tạo:</span><span className="font-bold">{transfer.createdAt ? new Date(transfer.createdAt).toLocaleString('vi-VN') : '---'}</span></div>
               <div className="flex justify-between"><span className="text-slate-400 uppercase text-[10px] font-bold">Tổng số lượng xuất:</span><span className="font-black text-blue-600 text-lg">{transfer.totalQuantity || 0}</span></div>
            </div>
          </div>

          {/* Bảng hàng hóa */}
          <div className="bg-white border border-[#dcdcdc] rounded-none shadow-sm overflow-hidden overflow-x-auto">
             <div className="px-5 py-3 bg-slate-50 border-b font-black text-[11px] uppercase text-slate-500 tracking-widest flex items-center gap-2"><Package size={14}/> Danh mục vật tư điều chuyển</div>
             <table className="w-full text-[13px] min-w-[800px]">
                <thead className="bg-white border-b text-[10px] uppercase text-slate-400">
                   <tr>
                      <th className="p-4 text-left">Sản phẩm / SKU</th>
                      <th className="p-4 text-center">ĐVT</th>
                      <th className="p-4 text-right">SL Yêu cầu</th>
<<<<<<< Updated upstream
                      <th className="p-4 text-right bg-emerald-50/30 text-emerald-600">Thực nhận</th>
=======
                      {isQCMode ? (
                        <>
                          <th className="p-4 text-right text-amber-600 bg-amber-50/50">Thực nhận</th>
                          <th className="p-4 text-right text-emerald-600 bg-emerald-50/50">Đạt (OK)</th>
                          <th className="p-4 text-right text-rose-600 bg-rose-50/50">Lỗi (NG)</th>
                        </>
                      ) : null}
                      <th className="p-4 text-left">Ghi chú</th>
>>>>>>> Stashed changes
                   </tr>
                </thead>
                <tbody>
                   {(transfer.items || []).map((item: any, i: number) => {
                      const planned = item.quantityRequested || item.plannedQuantity || 0;
                      const actual = item.quantityReal || 0;
                      const accepted = item.quantityAccepted || 0;
                      const rejected = item.quantityRejected || 0;

                      return (
                      <tr key={i} className="border-b last:border-0 hover:bg-slate-50/50 transition-colors">
                         <td className="p-4">
                            <p className="font-black text-slate-700 uppercase">{item.productName || "---"}</p>
                            <p className="text-[11px] font-mono text-blue-500 font-bold">{item.sku || item.productCode || "---"}</p>
                         </td>
                         <td className="p-4 text-center text-slate-500 font-bold">{item.unit || "---"}</td>
<<<<<<< Updated upstream
                         <td className="p-4 text-right font-black text-slate-700 text-base">{item.quantityRequested || 0}</td>
                         <td className="p-4 text-right font-black text-emerald-600 text-base bg-emerald-50/20">{item.quantityReal || 0}</td>
=======
                         <td className="p-4 text-right font-black text-slate-700 text-base">{planned}</td>
                         
                         {isQCMode ? (
                           <>
                              <td className="p-4 text-right font-black text-amber-700 text-base bg-amber-50/30 border-l border-amber-100">{actual}</td>
                              <td className="p-4 text-right font-black text-emerald-600 text-base bg-emerald-50/30">{accepted}</td>
                              <td className="p-4 text-right font-black text-rose-600 text-base bg-rose-50/30">{rejected > 0 ? rejected : "-"}</td>
                           </>
                         ) : null}
                         
                         <td className="p-4 text-left text-slate-500 italic text-[11px]">{item.itemNote || item.note || "---"}</td>
>>>>>>> Stashed changes
                      </tr>
                   )})}
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
                 <p className="flex justify-between border-b border-slate-50 pb-2"><span className="text-slate-400">Tài xế/NV:</span><span className="font-bold">{transfer.transporter || 'Chưa cập nhật'}</span></p>
                 <p className="flex justify-between border-b border-slate-50 pb-2"><span className="text-slate-400">Phương tiện:</span><span className="font-bold text-blue-600">{transfer.vehicle || 'Chưa cập nhật'}</span></p>
                 <p className="flex flex-col gap-1"><span className="text-slate-400 text-[10px] font-bold uppercase">Lệnh điều động số:</span><span className="font-mono text-[12px] p-2 bg-slate-900 text-emerald-400 border border-slate-800">{transfer.dispatchOrder || transfer.referenceCode || '---'}</span></p>
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
                 <p className="text-[10px] text-amber-600 italic">Hàng đang đi đường sẽ được chuyển hướng sang chi nhánh này.</p>
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
        <div className="fixed inset-0 bg-black/50 z-[9999] flex items-center justify-center p-4">
           <div className="bg-white w-full max-w-[1000px] p-0 rounded-none shadow-2xl flex flex-col max-h-[90vh]">
              <div className="p-5 border-b bg-slate-900 text-white flex items-center justify-between">
                <h3 className="font-black text-[15px] uppercase flex items-center gap-2"><ListChecks size={18} className="text-emerald-400"/> Phiếu kiểm đếm & Nhận hàng QC</h3>
                <button onClick={() => setShowInspectModal(false)} className="text-slate-400 hover:text-white"><X size={20}/></button>
              </div>

              <div className="overflow-y-auto flex-1 bg-slate-50 p-5">
                 <table className="w-full text-left text-[12px] bg-white border border-slate-200">
                    <thead className="bg-slate-100 border-b sticky top-0 shadow-sm z-10">
                       <tr className="text-[10px] font-black uppercase text-slate-500 tracking-wider">
                          <th className="p-4 border-r w-[250px]">Sản phẩm / SKU</th>
                          <th className="p-4 text-center border-r w-[100px]">Yêu cầu</th>
                          <th className="p-4 text-center bg-amber-50 text-amber-700 border-r w-[120px]">Thực nhận</th>
                          <th className="p-4 text-center bg-emerald-50 text-emerald-700 border-r w-[120px]">Đạt (OK)</th>
                          <th className="p-4 text-center bg-rose-50 text-rose-700 border-r w-[100px]">Lỗi (NG)</th>
                          <th className="p-4 text-left">Ghi chú (Thiếu/Hư hỏng)</th>
                       </tr>
                    </thead>
                    <tbody>
                       {inspectItems.map((item, idx) => {
                          const planned = item.quantityRequested || item.plannedQuantity || 0;
                          const actual = Number(item.quantityReal) || 0;
                          const accepted = Number(item.quantityAccepted) || 0;
                          const rejected = Math.max(0, actual - accepted);

                          return (
                         <tr key={idx} className="border-b last:border-0 hover:bg-slate-50/50">
                            <td className="p-4 border-r">
                              <p className="font-black text-slate-700">{item.productName}</p>
                              <p className="text-[10px] font-mono text-slate-400 mt-1">{item.productCode || item.sku}</p>
                            </td>
                            <td className="p-4 text-center font-black text-[14px] text-slate-400 border-r">{planned}</td>
                            
                            <td className="p-3 bg-amber-50/30 border-r">
                               <Input 
                                 type="number" 
                                 value={item.quantityReal} 
                                 onChange={(e) => {
                                   const newItems = [...inspectItems];
                                   newItems[idx].quantityReal = e.target.value;
                                   if (Number(e.target.value) >= Number(newItems[idx].quantityAccepted)) {
                                     newItems[idx].quantityAccepted = e.target.value;
                                   }
                                   newItems[idx].quantityRejected = Math.max(0, Number(newItems[idx].quantityReal) - Number(newItems[idx].quantityAccepted));
                                   setInspectItems(newItems);
                                 }}
                                 className="h-9 w-full text-right font-black text-amber-700 border-amber-300 rounded-none shadow-none focus-visible:ring-amber-500"
                               />
                            </td>

                            <td className="p-3 bg-emerald-50/30 border-r">
                               <Input 
                                 type="number" 
                                 value={item.quantityAccepted} 
                                 onChange={(e) => {
                                   const newItems = [...inspectItems];
                                   newItems[idx].quantityAccepted = e.target.value;
                                   newItems[idx].quantityRejected = Math.max(0, Number(newItems[idx].quantityReal) - Number(newItems[idx].quantityAccepted));
                                   setInspectItems(newItems);
                                 }}
                                 className="h-9 w-full text-right font-black text-emerald-700 border-emerald-300 rounded-none shadow-none focus-visible:ring-emerald-500"
                               />
                            </td>

                            <td className="p-4 text-center border-r bg-rose-50/30">
                              <span className={cn("text-[14px] font-black", rejected > 0 ? "text-rose-600 animate-pulse" : "text-slate-300")}>
                                {rejected}
                              </span>
                            </td>

                            <td className="p-3">
                               <Input 
                                 value={item.itemNote || ""} 
                                 onChange={(e) => {
                                   const newItems = [...inspectItems];
                                   newItems[idx].itemNote = e.target.value;
                                   setInspectItems(newItems);
                                 }}
                                 placeholder="Ghi chú lỗi nếu có..." 
                                 className={cn("h-9 rounded-none border-slate-200 text-[12px]", rejected > 0 ? "bg-rose-50 border-rose-200" : "bg-white")}
                               />
                            </td>
                         </tr>
                       )})}
                    </tbody>
                 </table>
              </div>
              <div className="p-5 border-t bg-white flex justify-end gap-3 shadow-[0_-10px_20px_rgba(0,0,0,0.02)]">
                 <Button variant="outline" onClick={() => setShowInspectModal(false)} className="rounded-none h-10 text-[12px] font-bold border-slate-300 text-slate-600 px-6">HỦY BỎ</Button>
                 <Button onClick={submitInspect} disabled={isProcessing} className="h-10 px-8 bg-emerald-600 hover:bg-emerald-700 text-white rounded-none text-[12px] font-black"><CheckSquare size={16} className="mr-2"/> LƯU KIỂM ĐẾM & NHẬP KHO</Button>
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
