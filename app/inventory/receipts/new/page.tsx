"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { 
  X, 
  Settings, 
  HelpCircle, 
  Plus, 
  Trash2, 
  Keyboard,
  Paperclip
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { ReceiptSchema, Receipt } from "@/app/types/inventory.schema";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function NewReceiptPage() {
  const router = useRouter();
  const [showNote, setShowNote] = useState(false);
  const [sourceType, setSourceType] = useState<"SUPPLIER" | "BRANCH">("SUPPLIER");

  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors },
  } = useForm<Receipt>({
    resolver: zodResolver(ReceiptSchema),
    mode: "onTouched",
    defaultValues: {
      receiptType: "NHAP_MUA",
      supplierCode: "",
      supplierName: "",
      receiptCode: "PNK" + Date.now().toString().slice(-6),
      warehouseId: "",
      branchName: "Chi nhánh Cà Mau",
      deliverer: "",
      entryDate: new Date().toISOString().slice(0, 16),
      referenceCode: "",
      description: "",
      items: [{ productCode: "", productName: "", unit: "", plannedQuantity: 1 }],
      note: ""
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "items",
  });

  const onSubmit = (data: Receipt) => {
    console.log("Saving receipt:", { ...data, sourceType });
    toast.success(`Lập phiếu nhập từ ${sourceType === "SUPPLIER" ? "Nhà cung cấp" : "Chi nhánh"} thành công`);
    router.push("/inventory/receipts");
  };

  const suppliers = [
    { code: "NCC001", name: "GROBEST VIỆT NAM" },
    { code: "NCC002", name: "C.P. VIỆT NAM" },
    { code: "NCC003", name: "CÔNG TY THỦY SẢN TOÀN CẦU" },
  ];

  const branches = [
    { code: "CN_HCM", name: "Chi nhánh Hồ Chí Minh" },
    { code: "CN_HN", name: "Chi nhánh Hà Nội" },
  ];

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-3 pb-[80px]">
      {/* Page Header */}
      <div className="flex items-center gap-[15px] mb-[10px]">
        <h1 className="text-[18px] font-bold text-[#1f1f1f]">Phiếu nhập kho mới</h1>
        
        <div className="flex flex-col">
          <Controller
            name="receiptType"
            control={control}
            render={({ field }) => (
              <Select onValueChange={field.onChange} value={field.value} key={field.value}>
                <SelectTrigger className={`w-[200px] h-[32px] text-[13px] font-semibold border-[#ccc] rounded-[4px] focus:ring-0 ${errors.receiptType ? 'border-red-500' : ''}`}>
                  <SelectValue placeholder="-- Loại phiếu --" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="NHAP_MUA">Nhập kho mua hàng</SelectItem>
                  <SelectItem value="NHAP_TP">Nhập kho thành phẩm</SelectItem>
                  <SelectItem value="NHAP_KHAC">Nhập kho khác</SelectItem>
                </SelectContent>
              </Select>
            )}
          />
        </div>
        
        <div className="ms-auto flex items-center gap-4 text-gray-400">
          <span title="Phím tắt" className="cursor-pointer hover:text-gray-600">
            <Keyboard size={20} />
          </span>
          <span title="Cài đặt" className="cursor-pointer hover:text-gray-600">
            <Settings size={20} />
          </span>
          <span title="Giúp đỡ" className="cursor-pointer hover:text-gray-600">
            <HelpCircle size={20} />
          </span>
          <Button type="button" variant="ghost" size="icon" onClick={() => router.back()} className="h-8 w-8 text-gray-400">
            <X size={20} />
          </Button>
        </div>
      </div>

      {/* Source Selection Tags */}
      <div className="flex gap-2 mb-2">
        <button
          type="button"
          onClick={() => setSourceType("SUPPLIER")}
          className={cn(
            "px-4 py-1.5 text-[12px] font-bold rounded-t-lg border-t border-x transition-all",
            sourceType === "SUPPLIER" 
              ? "bg-white border-[#dcdcdc] text-blue-600 -mb-[1px] z-10" 
              : "bg-slate-50 border-transparent text-slate-400 hover:text-slate-600"
          )}
        >
          Nhập từ Nhà cung cấp
        </button>
        <button
          type="button"
          onClick={() => setSourceType("BRANCH")}
          className={cn(
            "px-4 py-1.5 text-[12px] font-bold rounded-t-lg border-t border-x transition-all",
            sourceType === "BRANCH" 
              ? "bg-white border-[#dcdcdc] text-indigo-600 -mb-[1px] z-10" 
              : "bg-slate-50 border-transparent text-slate-400 hover:text-slate-600"
          )}
        >
          Nhập từ Chi nhánh
        </button>
      </div>

      {/* Info Card */}
      <div className="bg-white border border-[#dcdcdc] p-[15px_20px] rounded-[4px] rounded-tl-none shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-x-4 gap-y-3">
          
          <div className="md:col-span-2 space-y-[2px]">
            <Label className="text-[12px] font-bold text-[#555]">
              {sourceType === "SUPPLIER" ? "Mã nhà cung cấp" : "Mã chi nhánh"} <span className="text-red-500">*</span>
            </Label>
            <div className="flex gap-0">
              <Controller
                name="supplierCode"
                control={control}
                render={({ field }) => (
                  <Select 
                    onValueChange={(val) => {
                      field.onChange(val);
                      const list = sourceType === "SUPPLIER" ? suppliers : branches;
                      const found = list.find(x => x.code === val);
                      if (found) setValue("supplierName", found.name);
                    }} 
                    value={field.value} 
                    key={field.value}
                  >
                    <SelectTrigger className={`h-[32px] text-[13px] border-[#ccc] rounded-r-none rounded-l-[4px] focus:ring-0 ${errors.supplierCode ? 'border-red-500 bg-red-50' : ''}`}>
                      <SelectValue placeholder={sourceType === "SUPPLIER" ? "-- NCC --" : "-- CN --"} />
                    </SelectTrigger>
                    <SelectContent>
                      {(sourceType === "SUPPLIER" ? suppliers : branches).map(s => (
                        <SelectItem key={s.code} value={s.code}>{s.code}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              <Button type="button" variant="outline" size="icon" className="h-[32px] w-[32px] border-[#ccc] border-l-0 rounded-l-none rounded-r-[4px] bg-[#f0f0f0]"><Plus size={14}/></Button>
            </div>
            {errors.supplierCode && <p className="text-[11px] text-red-500">{errors.supplierCode.message}</p>}
          </div>

          <div className="md:col-span-7 space-y-[2px]">
            <Label className="text-[12px] font-bold text-[#555]">
              {sourceType === "SUPPLIER" ? "Tên đối tượng giao hàng" : "Tên chi nhánh xuất hàng"} <span className="text-red-500">*</span>
            </Label>
            <Input 
              {...register("supplierName")}
              readOnly
              className={`h-[32px] text-[13px] bg-[#f8f9fa] text-[#6c757d] border-[#ccc] rounded-[4px] focus-visible:ring-0 ${errors.supplierName ? 'border-red-500' : ''}`} 
            />
            {errors.supplierName && <p className="text-[11px] text-red-500">{errors.supplierName.message}</p>}
          </div>

          <div className="md:col-span-3 border-l border-[#eee] ps-4 space-y-[2px]">
            <Label className="text-[12px] font-bold text-red-600">Số phiếu nhập kho</Label>
            <Input 
              {...register("receiptCode")}
              className="h-[32px] text-[13px] font-bold border-[#ccc] rounded-[4px] focus-visible:ring-1 focus-visible:ring-[#007bff]" 
            />
          </div>

          <div className="md:col-span-2 space-y-[2px]">
            <Label className="text-[12px] font-bold text-red-600">Kho nhập <span className="text-red-500">*</span></Label>
            <Controller
              name="warehouseId"
              control={control}
              render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value} key={field.value}>
                  <SelectTrigger className={`h-[32px] text-[13px] border-[#ccc] rounded-[4px] focus:ring-0 ${errors.warehouseId ? 'border-red-500' : ''}`}>
                    <SelectValue placeholder="-- Chọn kho --" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="HH">HH (Kho hàng hóa)</SelectItem>
                    <SelectItem value="KL">KL (Kho lạnh)</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
            {errors.warehouseId && <p className="text-[11px] text-red-500">{errors.warehouseId.message}</p>}
          </div>

          <div className="md:col-span-3 space-y-[2px]">
            <Label className="text-[12px] font-bold text-[#555]">Chi nhánh <span className="text-red-500">*</span></Label>
            <Controller
              name="branchName"
              control={control}
              render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value} key={field.value}>
                  <SelectTrigger className={`h-[32px] text-[13px] border-[#ccc] rounded-[4px] focus:ring-0 ${errors.branchName ? 'border-red-500' : ''}`}>
                    <SelectValue placeholder="-- Chọn chi nhánh --" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CN1">Cửa hàng Cầu Giấy</SelectItem>
                    <SelectItem value="CN2">Chi nhánh Hồ Chí Minh</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
            {errors.branchName && <p className="text-[11px] text-red-500">{errors.branchName.message}</p>}
          </div>

          <div className="md:col-span-4 space-y-[2px]">
            <Label className="text-[12px] font-bold text-[#555]">Người giao <span className="text-red-500">*</span></Label>
            <Input 
              {...register("deliverer")}
              className={`h-[32px] text-[13px] border-[#ccc] rounded-[4px] focus-visible:ring-1 focus-visible:ring-[#007bff] ${errors.deliverer ? 'border-red-500' : ''}`} 
            />
            {errors.deliverer && <p className="text-[11px] text-red-500">{errors.deliverer.message}</p>}
          </div>

          <div className="md:col-span-3 border-l border-[#eee] ps-4 space-y-[2px]">
            <Label className="text-[12px] font-bold text-red-600">Ngày nhập kho <span className="text-red-500">*</span></Label>
            <Input 
              type="datetime-local"
              {...register("entryDate")}
              className={`h-[32px] text-[13px] border-[#ccc] rounded-[4px] focus-visible:ring-1 focus-visible:ring-[#007bff] ${errors.entryDate ? 'border-red-500' : ''}`} 
            />
            {errors.entryDate && <p className="text-[11px] text-red-500">{errors.entryDate.message}</p>}
          </div>

          <div className="md:col-span-2 space-y-[2px]">
            <Label className="text-[12px] font-bold text-[#555]">Tham chiếu <span className="text-red-500">*</span></Label>
            <Input 
              {...register("referenceCode")}
              className={`h-[32px] text-[13px] border-[#ccc] rounded-[4px] focus-visible:ring-1 focus-visible:ring-[#007bff] ${errors.referenceCode ? 'border-red-500' : ''}`} 
            />
            {errors.referenceCode && <p className="text-[11px] text-red-500">{errors.referenceCode.message}</p>}
          </div>

          <div className="md:col-span-10 space-y-[2px]">
            <Label className="text-[12px] font-bold text-[#555]">Diễn giải <span className="text-red-500">*</span></Label>
            <Input 
              {...register("description")}
              placeholder="Nhập lý do nhập kho..."
              className={`h-[32px] text-[13px] border-[#ccc] rounded-[4px] focus-visible:ring-1 focus-visible:ring-[#007bff] ${errors.description ? 'border-red-500' : ''}`} 
            />
            {errors.description && <p className="text-[11px] text-red-500">{errors.description.message}</p>}
          </div>

        </div>
      </div>

      {/* Items Table */}
      <div className="border border-[#dcdcdc] rounded-[4px] overflow-hidden bg-white shadow-[0_1px_2px_rgba(0,0,0,0.05)] min-h-[300px]">
        <div className="px-[15px] py-[10px] border-b border-[#eee] bg-white font-bold text-[13px] text-[#1f1f1f]">Hàng hóa</div>
        <Table className="table-custom">
          <TableHeader>
            <TableRow className="bg-[#f0f0f0] hover:bg-[#f0f0f0] border-b border-[#ccc]">
              <TableHead className="w-[50px] text-center p-[10px] font-bold text-[12px] text-[#1f1f1f] uppercase">#</TableHead>
              <TableHead className="w-[150px] p-[10px] font-bold text-[12px] text-[#1f1f1f] uppercase">Mã hàng</TableHead>
              <TableHead className="p-[10px] font-bold text-[12px] text-[#1f1f1f] uppercase">Tên hàng</TableHead>
              <TableHead className="w-[100px] p-[10px] font-bold text-[12px] text-[#1f1f1f] uppercase">ĐVT</TableHead>
              <TableHead className="w-[120px] text-right p-[10px] font-bold text-[12px] text-[#1f1f1f] uppercase">SL Kế hoạch</TableHead>
              <TableHead className="w-[150px] p-[10px] font-bold text-[12px] text-[#1f1f1f] uppercase">Số lô</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {fields.map((field, index) => (
              <TableRow key={field.id} className="border-b border-[#eee] hover:bg-[#f0f8ff]">
                <TableCell className="text-center text-gray-400 p-[4px]">{index + 1}</TableCell>
                <TableCell className="p-[4px]">
                  <Input 
                    {...register(`items.${index}.productCode` as const)} 
                    className="h-7 text-[13px] border-none focus-visible:ring-1 focus-visible:ring-[#007bff] bg-transparent"
                  />
                </TableCell>
                <TableCell className="p-[4px]">
                  <Input 
                    {...register(`items.${index}.productName` as const)} 
                    className="h-7 text-[13px] border-none focus-visible:ring-1 focus-visible:ring-[#007bff] bg-transparent"
                  />
                </TableCell>
                <TableCell className="p-[4px]">
                  <Input 
                    {...register(`items.${index}.unit` as const)} 
                    className="h-7 text-[13px] border-none focus-visible:ring-1 focus-visible:ring-[#007bff] bg-transparent"
                  />
                </TableCell>
                <TableCell className="p-[4px]">
                   <Input 
                    type="number"
                    {...register(`items.${index}.plannedQuantity` as const)} 
                    className="h-7 text-[13px] text-right border-none focus-visible:ring-1 focus-visible:ring-[#007bff] bg-transparent font-bold text-[#1f1f1f]" 
                   />
                </TableCell>
                <TableCell className="p-[4px]">
                   <Input 
                    {...register(`items.${index}.lotNumber` as const)} 
                    className="h-7 text-[13px] border-none focus-visible:ring-1 focus-visible:ring-[#007bff] bg-transparent" 
                   />
                </TableCell>
                <TableCell className="p-[4px]">
                  <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)} className="h-7 w-7 text-gray-400 hover:text-red-600">
                    <Trash2 size={14} />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {errors.items?.message && <p className="text-[11px] text-red-500 p-2">{errors.items.message}</p>}
      </div>

      <div className="flex justify-between items-start mt-2 px-1">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-3">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => append({ productCode: "", productName: "", unit: "", plannedQuantity: 1, actualQuantity: 0, damagedQuantity: 0, lotNumber: "" })}
              className="h-[28px] text-[12px] font-bold text-[#007bff] bg-white border-[#ddd] px-3 rounded-[3px] flex gap-1 items-center hover:bg-[#007bff] hover:text-white transition-colors"
            >
              <Plus size={14} /> Thêm dòng
            </Button>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => remove()}
              className="h-[28px] text-[12px] font-bold text-red-600 bg-white border-[#ddd] px-3 rounded-[3px] flex gap-1 items-center hover:bg-red-600 hover:text-white transition-colors"
            >
              <Trash2 size={14} /> Xóa hết dòng
            </Button>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setShowNote(!showNote)}
              className="h-[28px] text-[12px] font-bold text-gray-600 bg-white border-[#ddd] px-3 rounded-[3px] flex gap-1 items-center"
            >
              <Paperclip size={14} /> Thêm ghi chú
            </Button>
          </div>
          
          {showNote && (
            <div className="mt-2 w-[500px]">
              <Input {...register("note")} placeholder="Nhập ghi chú..." className="h-8 text-[13px] border-[#ddd] rounded-[4px]" />
            </div>
          )}
        </div>
      </div>

      {/* Footer Actions */}
      <div className="fixed bottom-0 left-0 lg:left-[260px] right-0 bg-[#f8f9fa] border-t border-[#ddd] p-[8px_20px] flex items-center justify-end gap-[10px] z-[999]">
        <Button type="button" variant="outline" className="min-w-[100px] h-[32px] text-[13px] font-semibold border-[#ccc] bg-white rounded-[4px]" onClick={() => router.back()}>
          Hủy
        </Button>
        <Button type="submit" className="min-w-[100px] h-[32px] text-[13px] font-semibold bg-[#007bff] hover:bg-[#0069d9] text-white rounded-[4px] shadow-none">
          Lưu phiếu dự kiến
        </Button>
      </div>
    </form>
  );
}
