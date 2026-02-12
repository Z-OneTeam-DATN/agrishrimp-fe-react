"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm, Controller, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { 
  X, 
  Settings, 
  HelpCircle, 
  Plus, 
  Trash2, 
  Search,
  Truck,
  User,
  FileText,
  ChevronRight,
  CheckCircle2,
  AlertCircle,
  ArrowRightLeft,
  ChevronLeft,
  Save,
  Car,
  ScanBarcode,
  ListPlus,
  History,
  MapPin,
  Building2,
  ArrowDownToLine
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { TransferSchema } from "@/app/types/inventory.schema";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function NewTransferPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sourceCode = searchParams.get("source");

  const {
    register,
    handleSubmit,
    control,
    setValue,
    watch,
    formState: { errors },
  } = useForm<any>({
    resolver: zodResolver(TransferSchema),
    mode: "all",
    defaultValues: {
      transferType: "BETWEEN_WAREHOUSES",
      description: sourceCode ? `Xuất điều chuyển theo yêu cầu ${sourceCode}` : "",
      transporter: "",
      vehicle: "",
      dispatchOrder: "",
      transferCode: "PDC-" + Date.now().toString().slice(-6),
      sourceBranch: "Chi nhánh Hà Nội", 
      sourceWarehouse: "wh-hn",
      sourceAddress: "123 Đường Láng, Đống Đa, Hà Nội",
      transferDate: new Date().toISOString().slice(0, 16),
      destBranch: "Chi nhánh Hồ Chí Minh",
      destWarehouse: "wh-st",
      destAddress: "456 Lê Lợi, Quận 1, TP. HCM",
      status: "DRAFT", // Trạng thái phiếu
      importStatus: "PENDING", // BẮT BUỘC: Trạng thái nhập kho
      referenceCode: sourceCode || "",
      items: sourceCode ? [] : [],
      note: ""
    },
  });

  const transferType = watch("transferType");
  const sourceWarehouse = watch("sourceWarehouse");
  const destWarehouse = watch("destWarehouse");
  const importStatus = watch("importStatus");

  const { fields, append, remove } = useFieldArray({
    control,
    name: "items",
  });

  // Audit Log giả lập
  const auditLogs = [
    { time: "12/02/2026 16:13", user: "Nhiên Lê (Thủ kho)", action: "Khởi tạo phiếu dự thảo", detail: "Hệ thống tự động cấp mã PDC-123456" },
  ];

  const addNewItem = () => {
    append({ 
      productCode: "", 
      productName: "", 
      unit: "", 
      convUnit: "Chai", // NÊN thêm: ĐVT quy đổi
      convRatio: 12,
      quantity: 0, 
      receivedQuantity: 0, // BẮT BUỘC: SL thực nhận
      availableQuantity: 100, 
      fromLoc: "", // BẮT BUỘC: Vị trí đi
      toLoc: "",   // BẮT BUỘC: Vị trí đến
      itemNote: "" 
    });
  };

  const onSubmit = (data: any) => {
    toast.success("Đã tạo phiếu và gửi yêu cầu duyệt chuyển kho!");
    router.push("/inventory/transfers");
  };

  const steps = [
    { label: "Khởi tạo", status: "completed", icon: Plus },
    { label: "Chờ xuất kho", status: "active", icon: AlertCircle },
    { label: "Đang vận chuyển", status: "upcoming", icon: Truck },
    { label: "Đã nhận hàng", status: "upcoming", icon: CheckCircle2 },
  ];

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 bg-[#f0f2f5] min-h-screen p-4 pb-[100px]">
      {/* Header */}
      <div className="flex items-center justify-between mb-2 px-1">
        <div className="flex items-center gap-4">
          <Button type="button" variant="ghost" size="icon" onClick={() => router.back()} className="h-8 w-8 text-slate-400">
            <ChevronLeft size={20} />
          </Button>
          <div>
            <h1 className="text-[18px] font-black text-[#1f1f1f] tracking-tight uppercase">Lập phiếu điều chuyển hàng hóa</h1>
            <div className="mt-1">
               <Controller
                name="transferType"
                control={control}
                render={({ field }) => (
                  <RadioGroup onValueChange={field.onChange} value={field.value} className="flex items-center gap-6">
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="BETWEEN_WAREHOUSES" id="type-wh" />
                      <Label htmlFor="type-wh" className={cn("text-[12px] font-bold uppercase tracking-wider cursor-pointer", field.value === "BETWEEN_WAREHOUSES" ? "text-blue-600" : "text-slate-400")}>Điều chuyển liên kho</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="INTERNAL" id="type-internal" />
                      <Label htmlFor="type-internal" className={cn("text-[12px] font-bold uppercase tracking-wider cursor-pointer", field.value === "INTERNAL" ? "text-blue-600" : "text-slate-400")}>Nội bộ</Label>
                    </div>
                  </RadioGroup>
                )}
              />
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          {/* Trạng thái nhập kho - BẮT BUỘC */}
          <div className={cn(
            "px-3 py-1.5 border flex items-center gap-2 rounded-none",
            importStatus === "PENDING" ? "bg-amber-50 border-amber-200 text-amber-700" : "bg-emerald-50 border-emerald-200 text-emerald-700"
          )}>
            <ArrowDownToLine size={14} />
            <span className="text-[10px] font-black uppercase tracking-widest">Nhập kho: {importStatus === "PENDING" ? "Chờ nhập" : "Đã nhập"}</span>
          </div>
          <Settings size={20} className="text-slate-400 cursor-pointer hover:text-blue-600" />
        </div>
      </div>

      {/* Step Bar */}
      <div className="bg-white border border-[#dcdcdc] p-6 rounded-none shadow-sm mb-4">
        <div className="flex items-center justify-between max-w-4xl mx-auto">
          {steps.map((step, idx) => (
            <React.Fragment key={idx}>
              <div className="flex flex-col items-center gap-2 relative z-10">
                <div className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300",
                  step.status === "completed" ? "bg-emerald-500 border-emerald-500 text-white" :
                  step.status === "active" ? "bg-blue-600 border-blue-600 text-white shadow-lg" : "bg-slate-50 border-slate-200 text-slate-300"
                )}><step.icon size={20} /></div>
                <span className={cn("text-[10px] font-black uppercase tracking-tighter", step.status === "active" ? "text-blue-600" : "text-slate-400")}>{step.label}</span>
              </div>
              {idx < steps.length - 1 && <div className="flex-1 h-[3px] bg-slate-100 mx-2 -mt-6 relative"><div className={cn("absolute inset-0", steps[idx].status === "completed" ? "bg-emerald-500" : "bg-transparent")} /></div>}
            </React.Fragment>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="lg:col-span-9 space-y-5">
          {/* Form Thông tin */}
          <div className="bg-white border border-[#dcdcdc] p-6 rounded-none shadow-sm">
            <div className="flex items-center gap-2 mb-6 text-blue-700 font-black text-[11px] uppercase tracking-widest border-b pb-3">
              <ArrowRightLeft size={16} /> 1. Thông tin lệnh điều chuyển
            </div>
            <div className="grid grid-cols-1 md:grid-cols-12 gap-x-6 gap-y-5">
              <div className="md:col-span-8 space-y-1.5">
                <Label className="text-[10px] font-black text-slate-500 uppercase">Lý do điều chuyển *</Label>
                <Input {...register("description")} className="h-[34px] text-[13px] border-[#ccc] rounded-none font-bold" />
              </div>
              <div className="md:col-span-4 space-y-1.5">
                <Label className="text-[10px] font-black text-rose-600 uppercase">Mã phiếu</Label>
                <Input {...register("transferCode")} readOnly className="h-[34px] text-[13px] border-[#ccc] rounded-none bg-slate-50 font-mono" />
              </div>

              {transferType === "BETWEEN_WAREHOUSES" && (
                <React.Fragment>
                  <div className="md:col-span-4 space-y-1.5 animate-in fade-in zoom-in-95">
                    <Label className="text-[10px] font-black text-blue-600 uppercase">Phương tiện</Label>
                    <Input {...register("vehicle")} className="h-[34px] text-[13px] border-[#ccc] rounded-none" placeholder="Biển số xe..." />
                  </div>
                  <div className="md:col-span-4 space-y-1.5 animate-in fade-in zoom-in-95">
                    <Label className="text-[10px] font-black text-blue-600 uppercase">Tài xế</Label>
                    <Input {...register("transporter")} className="h-[34px] text-[13px] border-[#ccc] rounded-none" placeholder="Họ tên tài xế..." />
                  </div>
                  <div className="md:col-span-4 space-y-1.5 animate-in fade-in zoom-in-95">
                    <Label className="text-[10px] font-black text-blue-600 uppercase">Lệnh điều động số</Label>
                    <Input {...register("dispatchOrder")} className="h-[34px] text-[13px] border-[#ccc] rounded-none font-mono" placeholder="Số hiệu văn bản..." />
                  </div>
                </React.Fragment>
              )}
            </div>
          </div>

          {/* Grid hàng hóa */}
          <div className="bg-white border border-[#dcdcdc] rounded-none shadow-sm overflow-hidden">
            <div className="px-5 py-3 border-b border-[#eee] bg-[#f8f9fa] flex flex-wrap items-center justify-between gap-4">
              <h3 className="text-[11px] font-black text-slate-700 uppercase flex items-center gap-2 tracking-wider whitespace-nowrap">
                <Plus size={16} className="text-blue-600" /> 2. Danh mục vật tư điều chuyển
              </h3>
              
              <div className="flex flex-1 items-center gap-2 min-w-[300px] max-w-[600px]">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <Input 
                    placeholder="Tìm theo tên, mã SKU, hoặc quét mã Barcode...(F3)"
                    className="pl-10 h-9 text-[13px] border-slate-200 rounded-none focus:border-blue-500 shadow-none bg-white"
                  />
                </div>
                <Button type="button" variant="outline" className="h-9 text-[12px] border-slate-200 rounded-none px-3 font-bold text-slate-600 hover:bg-slate-50">
                  <ScanBarcode size={16} className="mr-1.5" /> Quét mã
                </Button>
              </div>

              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={addNewItem} className="h-9 text-[10px] font-black text-blue-600 border-blue-200 rounded-none uppercase px-4"><Plus size={14} className="mr-1" /> Thêm hàng hóa</Button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <Table className="table-custom border-collapse min-w-[1200px]">
                <TableHeader>
                  <TableRow className="bg-slate-50 border-b border-[#ccc]">
                    <TableHead className="w-[40px] text-center p-2 text-[10px] font-black uppercase text-slate-500">STT</TableHead>
                    <TableHead className="w-[150px] p-2 text-[10px] font-black uppercase text-slate-500">Hàng hóa</TableHead>
                    <TableHead className="w-[80px] p-2 text-[10px] font-black uppercase text-slate-500">ĐVT</TableHead>
                    <TableHead className="w-[100px] p-2 text-[10px] font-black uppercase text-slate-500">ĐVT Quy đổi</TableHead>
                    <TableHead className="w-[100px] text-right p-2 text-[10px] font-black uppercase text-slate-500">Tồn kho</TableHead>
                    <TableHead className="w-[100px] text-right p-2 text-[10px] font-black uppercase text-blue-600">SL chuyển</TableHead>
                    <TableHead className="w-[100px] text-right p-2 text-[10px] font-black uppercase text-emerald-600">SL Thực nhận</TableHead>
                    <TableHead className="w-[120px] p-2 text-[10px] font-black uppercase text-slate-500">Vị trí đi</TableHead>
                    <TableHead className="w-[120px] p-2 text-[10px] font-black uppercase text-slate-500">Vị trí đến</TableHead>
                    <TableHead className="p-2 text-[10px] font-black uppercase text-slate-500">Ghi chú</TableHead>
                    <TableHead className="w-[40px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {fields.map((field, index) => (
                    <TableRow key={field.id} className="border-b border-slate-100 hover:bg-blue-50/20">
                      <TableCell className="text-center text-slate-400 font-bold text-[11px]">{index + 1}</TableCell>
                      <TableCell className="p-1"><Input {...register(`items.${index}.productName`)} className="h-8 text-[12px] border-none bg-transparent font-bold" placeholder="Tên hàng..." /></TableCell>
                      <TableCell className="p-1"><Input {...register(`items.${index}.unit`)} className="h-8 text-[12px] border-none bg-transparent text-center" /></TableCell>
                      <TableCell className="p-1 text-center text-[11px] font-medium text-slate-500 italic">1 Thùng = 12 Chai</TableCell>
                      <TableCell className="p-1 text-right font-bold text-slate-500 pr-3">{watch(`items.${index}.availableQuantity`)}</TableCell>
                      <TableCell className="p-1"><Input type="number" {...register(`items.${index}.quantity`)} className="h-8 text-[13px] text-right border-blue-200 bg-blue-50/30 rounded-none font-black text-blue-700" /></TableCell>
                      <TableCell className="p-1"><Input type="number" {...register(`items.${index}.receivedQuantity`)} readOnly className="h-8 text-[13px] text-right border-emerald-100 bg-emerald-50/30 rounded-none text-emerald-700 font-bold" /></TableCell>
                      <TableCell className="p-1"><Input {...register(`items.${index}.fromLoc`)} className="h-8 text-[11px] border-slate-200 rounded-none" placeholder="Khu A-01..." /></TableCell>
                      <TableCell className="p-1"><Input {...register(`items.${index}.toLoc`)} className="h-8 text-[11px] border-slate-200 rounded-none" placeholder="Khu B-05..." /></TableCell>
                      <TableCell className="p-1"><Input {...register(`items.${index}.itemNote`)} className="h-8 text-[11px] border-none italic bg-transparent" /></TableCell>
                      <TableCell className="p-1 text-center"><button type="button" onClick={() => remove(index)} className="text-slate-300 hover:text-rose-500"><Trash2 size={16} /></button></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>

          {/* Audit Log - NÊN thêm */}
          <div className="bg-white border border-[#dcdcdc] p-6 rounded-none shadow-sm">
            <div className="flex items-center gap-2 mb-4 text-slate-700 font-black text-[11px] uppercase tracking-widest border-b pb-3">
              <History size={16} /> Nhật ký xử lý chứng từ (Audit Log)
            </div>
            <div className="space-y-3">
              {auditLogs.map((log, i) => (
                <div key={i} className="flex gap-4 items-start text-[12px] border-l-2 border-slate-100 pl-4 ml-2">
                  <div className="min-w-[120px] text-slate-400 font-mono">{log.time}</div>
                  <div className="font-black text-blue-600">{log.user}</div>
                  <div className="text-slate-600">{log.action}: <span className="text-slate-400 italic">{log.detail}</span></div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-3 space-y-5">
          <div className="bg-white border border-[#dcdcdc] p-6 rounded-none shadow-sm space-y-6">
            {/* NÊN thêm: Chi nhánh xuất/nhận */}
            {/* Chi nhánh & Địa chỉ xuất/nhận */}
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-[10px] font-black text-slate-400 uppercase flex items-center gap-2"><Building2 size={12} /> Chi nhánh xuất</Label>
                <Select defaultValue="cn-hn"><SelectTrigger className="h-8 text-[12px] border-[#eee] rounded-none font-bold"><SelectValue /></SelectTrigger><SelectContent className="rounded-none"><SelectItem value="cn-hn">CHI NHÁNH MIỀN BẮC</SelectItem></SelectContent></Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] font-black text-slate-500 uppercase tracking-tight flex items-center gap-2"><MapPin size={12} className="text-rose-500" /> Địa chỉ kho xuất</Label>
                <Controller name="sourceAddress" control={control} render={({ field }) => (
                  <Textarea 
                    {...field}
                    placeholder="Nhập địa chỉ chi tiết kho xuất..." 
                    className="min-h-[60px] text-[12px] border-[#ccc] rounded-none focus:border-blue-500 shadow-none resize-none bg-slate-50/50" 
                  />
                )} />
              </div>
            </div>

            <div className="flex justify-center -my-2 relative"><div className="absolute inset-0 flex items-center"><div className="w-full border-t border-dashed border-slate-200"></div></div><div className="relative w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 border border-blue-100 shadow-sm"><ArrowRightLeft size={16} className="rotate-90 md:rotate-0" /></div></div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-[10px] font-black text-slate-400 uppercase flex items-center gap-2"><Building2 size={12} /> Chi nhánh nhận</Label>
                <Select defaultValue="cn-hcm"><SelectTrigger className="h-8 text-[12px] border-[#eee] rounded-none font-bold"><SelectValue /></SelectTrigger><SelectContent className="rounded-none"><SelectItem value="cn-hcm">CHI NHÁNH MIỀN NAM</SelectItem></SelectContent></Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] font-black text-slate-500 uppercase tracking-tight flex items-center gap-2"><MapPin size={12} className="text-emerald-500" /> Địa chỉ kho nhận</Label>
                <Controller name="destAddress" control={control} render={({ field }) => (
                  <Textarea 
                    {...field}
                    placeholder="Nhập địa chỉ chi tiết kho nhận..." 
                    className="min-h-[60px] text-[12px] border-[#ccc] rounded-none focus:border-blue-500 shadow-none resize-none bg-slate-50/50" 
                  />
                )} />
              </div>
            </div>
          </div>

          <div className="bg-white border border-[#dcdcdc] p-6 rounded-none shadow-sm space-y-4">
            <div className="space-y-1.5"><Label className="text-[9px] font-bold text-slate-400 uppercase">Ngày điều chuyển</Label><Input type="datetime-local" {...register("transferDate")} className="h-[34px] text-[12px] border-[#ccc] rounded-none" /></div>
            <div className="space-y-1.5"><Label className="text-[9px] font-bold text-slate-400 uppercase">Tham chiếu</Label><Input {...register("referenceCode")} className="h-[34px] text-[12px] border-[#ccc] rounded-none font-mono" /></div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="fixed bottom-0 left-0 lg:left-[260px] right-0 bg-[#f8f9fa] border-t border-[#ddd] p-[12px_30px] flex items-center justify-end gap-[15px] z-[999] shadow-[0_-4px_15px_rgba(0,0,0,0.05)]">
        <Button variant="outline" type="button" className="min-w-[110px] h-[38px] text-[12px] font-bold border-[#ccc] bg-white rounded-none uppercase" onClick={() => router.back()}>HỦY BỎ</Button>
        <Button type="submit" className="min-w-[180px] h-[38px] text-[12px] font-black bg-blue-600 hover:bg-blue-700 text-white rounded-none shadow-md shadow-blue-100 uppercase"><Save size={18} className="mr-2" /> LƯU & GỬI DUYỆT</Button>
      </div>
    </form>
  );
}
