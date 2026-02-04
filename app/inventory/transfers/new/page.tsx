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
  Paperclip,
  Search
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { TransferSchema, Transfer } from "@/app/types/inventory.schema";
import { toast } from "sonner";

import { useSearchParams } from "next/navigation";

export default function NewTransferPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sourceCode = searchParams.get("source");
  const [showNote, setShowNote] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    setValue,
    watch,
    formState: { errors },
  } = useForm<Transfer>({
    resolver: zodResolver(TransferSchema),
    mode: "onTouched",
    defaultValues: {
      transferType: "INTERNAL",
      description: sourceCode ? `Xuất điều chuyển theo yêu cầu ${sourceCode}` : "",
      transporter: "",
      transferCode: "PDC00001",
      sourceBranch: "Chi nhánh Hà Nội", 
      sourceWarehouse: "",
      sourceAddress: "",
      transferDate: new Date().toISOString().slice(0, 16),
      destBranch: sourceCode ? "Chi nhánh Cà Mau" : "Chi nhánh Hà Nội",
      destWarehouse: "",
      destAddress: "",
      status: "Chờ xử lý",
      referenceCode: sourceCode || "",
      items: [{ productCode: "", productName: "", unit: "", quantity: 1, receivedQuantity: 0 }],
      note: ""
    },
  });

  // Giả lập load dữ liệu từ yêu cầu điều chuyển (YCDC)
  React.useEffect(() => {
    if (sourceCode) {
      toast.info(`Đã lấy dữ liệu từ yêu cầu ${sourceCode}. Vui lòng kiểm tra kho và xác nhận xuất hàng.`);
      // Tự động điền hàng hóa từ yêu cầu
      setValue("items", [
        { productCode: "TA001", productName: "Thức ăn tôm Grobest", unit: "Bao", quantity: 200, receivedQuantity: 0 },
        { productCode: "HC003", productName: "Azomite khoáng", unit: "Kg", quantity: 50, receivedQuantity: 0 },
      ]);
    }
  }, [sourceCode, setValue]);

  const transferType = watch("transferType");
  const sourceBranch = watch("sourceBranch");

  // Khi thay đổi loại điều chuyển hoặc chi nhánh xuất
  React.useEffect(() => {
    if (transferType === "INTERNAL") {
      setValue("destBranch", sourceBranch);
    }
  }, [transferType, sourceBranch, setValue]);

  const { fields, append, remove } = useFieldArray({
    control,
    name: "items",
  });

  const onSubmit = (data: Transfer) => {
    console.log("Saving transfer:", data);
    toast.success("Lưu phiếu điều chuyển thành công");
    router.push("/inventory/transfers");
  };

  const branches = ["Chi nhánh Hà Nội", "Chi nhánh Hồ Chí Minh", "Cửa hàng Cầu Giấy"];
  const warehouses = ["Kho Hàng Hóa (HH)", "Kho Lạnh (KL)", "Kho Nguyên Liệu (NL)"];

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-3 pb-[80px]">
      {/* Page Header */}
      <div className="flex items-center justify-between mb-[10px] flex-wrap gap-2">
        <div className="flex items-center gap-6">
          <h1 className="text-[18px] font-bold text-[#1f1f1f]">Phiếu điều chuyển</h1>
          
          <Controller
            name="transferType"
            control={control}
            render={({ field }) => (
              <RadioGroup 
                onValueChange={field.onChange} 
                value={field.value} 
                className="flex items-center gap-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="BETWEEN_WAREHOUSES" id="type-wh" className="text-blue-600 border-blue-600" />
                  <Label htmlFor="type-wh" className={field.value === "BETWEEN_WAREHOUSES" ? "text-blue-600 font-bold text-[13px] cursor-pointer" : "text-gray-500 text-[13px] cursor-pointer"}>
                    Điều chuyển giữa các kho
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="INTERNAL" id="type-internal" className="text-blue-600 border-blue-600" />
                  <Label htmlFor="type-internal" className={field.value === "INTERNAL" ? "text-blue-600 font-bold text-[13px] cursor-pointer" : "text-gray-500 text-[13px] cursor-pointer"}>
                    Điều chuyển nội bộ
                  </Label>
                </div>
              </RadioGroup>
            )}
          />
        </div>
        
        <div className="flex items-center gap-4 text-gray-400">
          <span title="Cài đặt" className="cursor-pointer hover:text-gray-600">
            <Settings size={20} />
          </span>
          <Button type="button" variant="ghost" size="icon" onClick={() => router.back()} className="h-8 w-8 text-gray-400">
            <X size={20} />
          </Button>
        </div>
      </div>

      {/* Info Card */}
      <div className="bg-white border border-[#dcdcdc] p-[15px_20px] rounded-[4px] shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-x-4 gap-y-3">
          
          <div className="md:col-span-6 space-y-[2px]">
            <Label className="text-[12px] font-bold text-[#555]">Lý do điều chuyển <span className="text-red-500">*</span></Label>
            <Input 
              {...register("description")}
              placeholder="Nhập lý do..."
              className={`h-[32px] text-[13px] border-[#ccc] rounded-[4px] focus-visible:ring-1 focus-visible:ring-[#007bff] ${errors.description ? 'border-red-500 bg-red-50' : ''}`} 
            />
            {errors.description && <p className="text-[11px] text-red-500">{errors.description.message}</p>}
          </div>

          <div className="md:col-span-3 space-y-[2px]">
            <Label className="text-[12px] font-bold text-[#555]">Người vận chuyển <span className="text-red-500">*</span></Label>
            <Input 
              {...register("transporter")}
              className={`h-[32px] text-[13px] border-[#ccc] rounded-[4px] focus-visible:ring-1 focus-visible:ring-[#007bff] ${errors.transporter ? 'border-red-500 bg-red-50' : ''}`} 
            />
            {errors.transporter && <p className="text-[11px] text-red-500">{errors.transporter.message}</p>}
          </div>

          <div className="md:col-span-3 border-l border-[#eee] ps-4 space-y-[2px]">
            <Label className="text-[12px] font-bold text-red-600">Số phiếu điều chuyển</Label>
            <Input 
              {...register("transferCode")}
              readOnly
              className="h-[32px] text-[13px] font-bold border-[#ccc] rounded-[4px] bg-[#f8f9fa] text-[#6c757d] focus-visible:ring-0" 
            />
          </div>

          {/* Source Section */}
          <div className="md:col-span-3 space-y-[2px]">
            <Label className="text-[12px] font-bold text-[#1f1f1f]">Chi nhánh xuất <span className="text-red-500">*</span></Label>
            <Controller
              name="sourceBranch"
              control={control}
              render={({ field }) => (
                <Select 
                  onValueChange={field.onChange} 
                  value={field.value} 
                  key={field.value}
                  disabled={transferType === "INTERNAL"}
                >
                  <SelectTrigger className={`h-[32px] text-[13px] border-[#ccc] rounded-[4px] focus:ring-0 ${errors.sourceBranch ? 'border-red-500 bg-red-50' : ''} ${transferType === "INTERNAL" ? 'bg-[#f8f9fa] text-[#6c757d]' : ''}`}>
                    <SelectValue placeholder="-- Chọn chi nhánh --" />
                  </SelectTrigger>
                  <SelectContent>
                    {branches.map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.sourceBranch && <p className="text-[11px] text-red-500">{errors.sourceBranch.message}</p>}
          </div>

          <div className="md:col-span-3 space-y-[2px]">
            <Label className="text-[12px] font-bold text-red-600">Kho xuất *</Label>
            <Controller
              name="sourceWarehouse"
              control={control}
              render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value} key={field.value}>
                  <SelectTrigger className={`h-[32px] text-[13px] border-[#ccc] rounded-[4px] focus:ring-0 ${errors.sourceWarehouse ? 'border-red-500 bg-red-50' : ''}`}>
                    <SelectValue placeholder="-- Chọn kho xuất --" />
                  </SelectTrigger>
                  <SelectContent>
                    {warehouses.map(w => <SelectItem key={w} value={w}>{w}</SelectItem>)}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.sourceWarehouse && <p className="text-[11px] text-red-500">{errors.sourceWarehouse.message}</p>}
          </div>

          <div className="md:col-span-3 space-y-[2px]">
            <Label className="text-[12px] font-bold text-[#1f1f1f]">Địa chỉ kho xuất <span className="text-red-500">*</span></Label>
            <Input 
              {...register("sourceAddress")}
              className={`h-[32px] text-[13px] border-[#ccc] rounded-[4px] focus-visible:ring-1 focus-visible:ring-[#007bff] ${errors.sourceAddress ? 'border-red-500 bg-red-50' : ''}`} 
            />
            {errors.sourceAddress && <p className="text-[11px] text-red-500">{errors.sourceAddress.message}</p>}
          </div>

          <div className="md:col-span-3 border-l border-[#eee] ps-4 space-y-[2px]">
            <Label className="text-[12px] font-bold text-red-600">Ngày điều chuyển *</Label>
            <Input 
              type="datetime-local"
              {...register("transferDate")}
              className={`h-[32px] text-[13px] border-[#ccc] rounded-[4px] focus-visible:ring-1 focus-visible:ring-[#007bff] ${errors.transferDate ? 'border-red-500 bg-red-50' : ''}`} 
            />
            {errors.transferDate && <p className="text-[11px] text-red-500">{errors.transferDate.message}</p>}
          </div>

          {/* Destination Section */}
          <div className="md:col-span-3 space-y-[2px]">
            <Label className="text-[12px] font-bold text-[#1f1f1f]">Chi nhánh nhận <span className="text-red-500">*</span></Label>
            <Controller
              name="destBranch"
              control={control}
              render={({ field }) => (
                <Select 
                  onValueChange={field.onChange} 
                  value={field.value} 
                  key={field.value}
                  disabled={transferType === "INTERNAL"}
                >
                  <SelectTrigger className={`h-[32px] text-[13px] border-[#ccc] rounded-[4px] focus:ring-0 ${errors.destBranch ? 'border-red-500 bg-red-50' : ''} ${transferType === "INTERNAL" ? 'bg-[#f8f9fa] text-[#6c757d]' : ''}`}>
                    <SelectValue placeholder="-- Chọn chi nhánh --" />
                  </SelectTrigger>
                  <SelectContent>
                    {branches.map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.destBranch && <p className="text-[11px] text-red-500">{errors.destBranch.message}</p>}
          </div>

          <div className="md:col-span-3 space-y-[2px]">
            <Label className="text-[12px] font-bold text-red-600">Kho nhập *</Label>
            <Controller
              name="destWarehouse"
              control={control}
              render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value} key={field.value}>
                  <SelectTrigger className={`h-[32px] text-[13px] border-[#ccc] rounded-[4px] focus:ring-0 ${errors.destWarehouse ? 'border-red-500 bg-red-50' : ''}`}>
                    <SelectValue placeholder="-- Chọn kho nhập --" />
                  </SelectTrigger>
                  <SelectContent>
                    {warehouses.map(w => <SelectItem key={w} value={w}>{w}</SelectItem>)}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.destWarehouse && <p className="text-[11px] text-red-500">{errors.destWarehouse.message}</p>}
          </div>

          <div className="md:col-span-3 space-y-[2px]">
            <Label className="text-[12px] font-bold text-[#1f1f1f]">Địa chỉ kho nhập <span className="text-red-500">*</span></Label>
            <Input 
              {...register("destAddress")}
              className={`h-[32px] text-[13px] border-[#ccc] rounded-[4px] focus-visible:ring-1 focus-visible:ring-[#007bff] ${errors.destAddress ? 'border-red-500 bg-red-50' : ''}`} 
            />
            {errors.destAddress && <p className="text-[11px] text-red-500">{errors.destAddress.message}</p>}
          </div>

          <div className="md:col-span-3 border-l border-[#eee] ps-4 space-y-[2px]">
            <Label className="text-[12px] font-bold text-[#555]">Tình trạng thực hiện</Label>
            <Input 
              {...register("status")}
              readOnly
              className="h-[32px] text-[13px] border-[#ccc] rounded-[4px] bg-[#f8f9fa] text-[#6c757d] focus-visible:ring-0" 
            />
          </div>

          <div className="md:col-span-12 space-y-[2px]">
            <Label className="text-[12px] font-bold text-[#555]">Tham chiếu <span className="text-red-500">*</span></Label>
            <div className="flex gap-0">
               <Input 
                {...register("referenceCode")}
                placeholder="Tìm kiếm tham chiếu..."
                className={`h-[32px] text-[13px] border-[#ccc] rounded-r-none rounded-l-[4px] focus-visible:ring-1 focus-visible:ring-[#007bff] ${errors.referenceCode ? 'border-red-500 bg-red-50' : ''}`} 
               />
               <Button type="button" variant="outline" size="icon" className="h-[32px] w-[32px] border-[#ccc] border-l-0 rounded-l-none rounded-r-[4px] bg-[#f0f0f0]"><Search size={14}/></Button>
            </div>
            {errors.referenceCode && <p className="text-[11px] text-red-500">{errors.referenceCode.message}</p>}
          </div>

        </div>
      </div>

      {/* Items Table */}
      <div className="border border-[#dcdcdc] rounded-[4px] overflow-hidden bg-white shadow-[0_1px_2px_rgba(0,0,0,0.05)] min-h-[250px]">
        <div className="px-[15px] py-[10px] border-b border-[#eee] bg-white font-bold text-[13px] text-[#1f1f1f]">Hàng hóa</div>
        <div className="overflow-x-auto">
          <Table className="table-custom" style={{ minWidth: '1000px' }}>
            <TableHeader>
              <TableRow className="bg-[#f0f0f0] hover:bg-[#f0f0f0] border-b border-[#ccc]">
                <TableHead className="w-[40px] text-center p-[10px] font-bold text-[12px] text-[#1f1f1f] uppercase">#</TableHead>
                <TableHead className="w-[150px] p-[10px] font-bold text-[12px] text-[#1f1f1f] uppercase">Mã hàng</TableHead>
                <TableHead className="p-[10px] font-bold text-[12px] text-[#1f1f1f] uppercase">Tên hàng</TableHead>
                <TableHead className="w-[80px] p-[10px] font-bold text-[12px] text-[#1f1f1f] uppercase">ĐVT</TableHead>
                <TableHead className="w-[120px] text-right p-[10px] font-bold text-[12px] text-[#1f1f1f] uppercase">SL điều chuyển</TableHead>
                <TableHead className="w-[180px] text-right p-[10px] font-bold text-[12px] text-[#1f1f1f] uppercase">SL Đ/C theo ĐVT</TableHead>
                <TableHead className="w-[120px] text-right p-[10px] font-bold text-[12px] text-[#1f1f1f] uppercase">SL thực nhận</TableHead>
                <TableHead className="w-[180px] text-right p-[10px] font-bold text-[12px] text-[#1f1f1f] uppercase">SL nhận theo ĐVT</TableHead>
                <TableHead className="w-[40px]"></TableHead>
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
                      {...register(`items.${index}.quantity` as const)} 
                      className="h-7 text-[13px] text-right border-none focus-visible:ring-1 focus-visible:ring-[#007bff] bg-transparent font-bold text-[#1f1f1f]" 
                     />
                  </TableCell>
                  <TableCell className="p-[4px]">
                     <Input 
                      readOnly
                      placeholder="Quy đổi..."
                      className="h-7 text-[13px] text-right border-none bg-transparent" 
                     />
                  </TableCell>
                  <TableCell className="p-[4px]">
                     <Input 
                      type="number"
                      {...register(`items.${index}.receivedQuantity` as const)} 
                      className="h-7 text-[13px] text-right border-none focus-visible:ring-1 focus-visible:ring-[#007bff] bg-transparent" 
                     />
                  </TableCell>
                  <TableCell className="p-[4px]">
                     <Input 
                      readOnly
                      placeholder="Quy đổi..."
                      className="h-7 text-[13px] text-right border-none bg-transparent" 
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
        </div>
      </div>

      <div className="flex justify-between items-start mt-2 px-1">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-3">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => append({ productCode: "", productName: "", unit: "", quantity: 1, receivedQuantity: 0 })}
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
        </div>
      </div>

      {/* Footer Actions */}
      <div className="fixed bottom-0 left-0 lg:left-[260px] right-0 bg-[#f8f9fa] border-t border-[#ddd] p-[8px_20px] flex items-center justify-end gap-[10px] z-[999]">
        <Button type="button" variant="outline" className="min-w-[100px] h-[32px] text-[13px] font-semibold border-[#ccc] bg-white rounded-[4px]" onClick={() => router.back()}>
          Hủy
        </Button>
        <Button type="submit" className="min-w-[100px] h-[32px] text-[13px] font-semibold bg-[#007bff] hover:bg-[#0069d9] text-white rounded-[4px] shadow-none">
          Lưu
        </Button>
      </div>
    </form>
  );
}
