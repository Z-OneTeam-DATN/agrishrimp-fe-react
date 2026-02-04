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
import { ExportSchema, Export } from "@/app/types/inventory.schema";
import { toast } from "sonner";

import { useSearchParams } from "next/navigation";

export default function NewExportPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sourceCode = searchParams.get("source");
  const [showNote, setShowNote] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    setValue,
    reset,
    formState: { errors },
  } = useForm<Export>({
    resolver: zodResolver(ExportSchema),
    mode: "onTouched",
    defaultValues: {
      exportType: sourceCode ? "XUAT_KHAC" : "",
      customerId: "",
      customerName: "",
      exportCode: "PXK00001",
      warehouseId: "",
      branchName: "",
      receiver: "",
      deliveryAddress: "",
      exportDate: new Date().toISOString().slice(0, 16),
      referenceCode: sourceCode || "",
      description: sourceCode ? `Xuất hàng theo yêu cầu ${sourceCode}` : "",
      items: [{ productCode: "", productName: "", unit: "", quantity: 1, lotNumber: "" }],
      note: ""
    },
  });

  // Giả lập load dữ liệu từ nguồn tham chiếu
  React.useEffect(() => {
    if (sourceCode) {
      toast.info(`Đã tự động lấy dữ liệu từ yêu cầu ${sourceCode}`);
      // Ở đây thực tế sẽ gọi API lấy chi tiết phiếu nhập tham chiếu
      setValue("customerName", "Chi nhánh Cà Mau");
      setValue("receiver", "Quản lý kho Cà Mau");
      setValue("items", [
        { productCode: "TA001", productName: "Thức ăn tôm Grobest", unit: "Bao", quantity: 50, lotNumber: "L001" },
        { productCode: "VS005", productName: "Vi sinh BZT", unit: "Gói", quantity: 20, lotNumber: "V99" },
      ]);
    }
  }, [sourceCode, setValue]);

  const { fields, append, remove } = useFieldArray({
    control,
    name: "items",
  });

  const onSubmit = (data: Export) => {
    console.log("Saving export:", data);
    toast.success("Lưu phiếu xuất kho thành công");
    router.push("/inventory/exports");
  };

  const customers = [
    { id: "KH001", name: "Nguyễn Văn A", address: "123 Đường Láng, HN" },
    { id: "KH002", name: "Công ty TNHH ABC", address: "456 Cầu Giấy, HN" },
    { id: "KH003", name: "Đại lý Miền Tây", address: "Ninh Kiều, Cần Thơ" },
  ];

  const updateCustomerInfo = (id: string) => {
    const cus = customers.find(x => x.id === id);
    if (cus) {
      setValue("customerName", cus.name);
      setValue("deliveryAddress", cus.address);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-3 pb-[80px]">
      {/* Page Header */}
      <div className="flex items-center gap-[15px] mb-[10px]">
        <h1 className="text-[18px] font-bold text-[#1f1f1f]">Phiếu xuất kho bán hàng <span className="text-gray-400">PXK00001</span></h1>
        
        <div className="flex flex-col">
          <Controller
            name="exportType"
            control={control}
            render={({ field }) => (
              <Select onValueChange={field.onChange} value={field.value} key={field.value}>
                <SelectTrigger className={`w-[180px] h-[32px] text-[13px] font-semibold border-red-500 text-red-600 rounded-[4px] focus:ring-0 ${errors.exportType ? 'border-red-600 bg-red-50' : ''}`}>
                  <SelectValue placeholder="-- Loại phiếu --" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="XUAT_BAN">Xuất kho bán hàng</SelectItem>
                  <SelectItem value="XUAT_KHAC">Xuất kho khác</SelectItem>
                </SelectContent>
              </Select>
            )}
          />
          {errors.exportType && <p className="text-[10px] text-red-500 mt-0.5">{errors.exportType.message}</p>}
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

      {/* Info Card */}
      <div className="bg-white border border-[#dcdcdc] p-[15px_20px] rounded-[4px] shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-x-4 gap-y-3">
          
          <div className="md:col-span-2 space-y-[2px]">
            <Label className="text-[12px] font-bold text-[#555]">Mã đối tượng <span className="text-red-500">*</span></Label>
            <div className="flex gap-0">
              <Controller
                name="customerId"
                control={control}
                render={({ field }) => (
                  <Select 
                    onValueChange={(val) => {
                      field.onChange(val);
                      updateCustomerInfo(val);
                    }} 
                    value={field.value} 
                    key={field.value}
                  >
                    <SelectTrigger className={`h-[32px] text-[13px] border-[#ccc] rounded-r-none rounded-l-[4px] focus:ring-0 ${errors.customerId ? 'border-red-500 bg-red-50' : ''}`}>
                      <SelectValue placeholder="-- Chọn KH --" />
                    </SelectTrigger>
                    <SelectContent>
                      {customers.map(c => <SelectItem key={c.id} value={c.id}>{c.id}</SelectItem>)}
                    </SelectContent>
                  </Select>
                )}
              />
              <Button type="button" variant="outline" size="icon" className="h-[32px] w-[32px] border-[#ccc] border-l-0 rounded-l-none rounded-r-[4px] bg-[#f0f0f0]"><Plus size={14}/></Button>
            </div>
            {errors.customerId && <p className="text-[11px] text-red-500">{errors.customerId.message}</p>}
          </div>

          <div className="md:col-span-5 space-y-[2px]">
            <Label className="text-[12px] font-bold text-[#555]">Tên đối tượng nhận hàng <span className="text-red-500">*</span></Label>
            <Input 
              {...register("customerName")}
              readOnly
              className={`h-[32px] text-[13px] bg-[#f8f9fa] text-[#6c757d] border-[#ccc] rounded-[4px] focus-visible:ring-0 ${errors.customerName ? 'border-red-500' : ''}`} 
            />
            {errors.customerName && <p className="text-[11px] text-red-500">{errors.customerName.message}</p>}
          </div>

          <div className="md:col-span-2 space-y-[2px]">
            <Label className="text-[12px] font-bold text-red-600">Kho xuất <span className="text-red-500">*</span></Label>
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

          <div className="md:col-span-3 border-l border-[#eee] ps-4 space-y-[2px]">
            <Label className="text-[12px] font-bold text-red-600">Số phiếu xuất kho</Label>
            <Input 
              {...register("exportCode")}
              readOnly
              className="h-[32px] text-[13px] font-bold border-[#ccc] rounded-[4px] bg-[#f8f9fa] text-[#6c757d] focus-visible:ring-0" 
            />
          </div>

          <div className="md:col-span-2 space-y-[2px]">
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
                    <SelectItem value="CN_CHINH">Cửa hàng chính</SelectItem>
                    <SelectItem value="CN_PHU">Chi nhánh phụ</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
            {errors.branchName && <p className="text-[11px] text-red-500">{errors.branchName.message}</p>}
          </div>

          <div className="md:col-span-2 space-y-[2px]">
            <Label className="text-[12px] font-bold text-[#555]">Người nhận <span className="text-red-500">*</span></Label>
            <Input 
              {...register("receiver")}
              placeholder="Tên người nhận"
              className={`h-[32px] text-[13px] border-[#ccc] rounded-[4px] focus-visible:ring-1 focus-visible:ring-[#007bff] ${errors.receiver ? 'border-red-500' : ''}`} 
            />
            {errors.receiver && <p className="text-[11px] text-red-500">{errors.receiver.message}</p>}
          </div>

          <div className="md:col-span-5 space-y-[2px]">
            <Label className="text-[12px] font-bold text-[#555]">Địa chỉ giao hàng <span className="text-red-500">*</span></Label>
            <Input 
              {...register("deliveryAddress")}
              className={`h-[32px] text-[13px] border-[#ccc] rounded-[4px] focus-visible:ring-1 focus-visible:ring-[#007bff] ${errors.deliveryAddress ? 'border-red-500' : ''}`} 
            />
            {errors.deliveryAddress && <p className="text-[11px] text-red-500">{errors.deliveryAddress.message}</p>}
          </div>

          <div className="md:col-span-3 border-l border-[#eee] ps-4 space-y-[2px]">
            <Label className="text-[12px] font-bold text-red-600">Ngày xuất kho <span className="text-red-500">*</span></Label>
            <Input 
              type="datetime-local"
              {...register("exportDate")}
              className={`h-[32px] text-[13px] border-[#ccc] rounded-[4px] focus-visible:ring-1 focus-visible:ring-[#007bff] ${errors.exportDate ? 'border-red-500' : ''}`} 
            />
            {errors.exportDate && <p className="text-[11px] text-red-500">{errors.exportDate.message}</p>}
          </div>

          <div className="md:col-span-7 space-y-[2px]">
            <Label className="text-[12px] font-bold text-[#555]">Diễn giải <span className="text-red-500">*</span></Label>
            <Input 
              {...register("description")}
              placeholder="Nhập lý do xuất kho..."
              className={`h-[32px] text-[13px] border-[#ccc] rounded-[4px] focus-visible:ring-1 focus-visible:ring-[#007bff] ${errors.description ? 'border-red-500' : ''}`} 
            />
            {errors.description && <p className="text-[11px] text-red-500">{errors.description.message}</p>}
          </div>

          <div className="md:col-span-5 space-y-[2px]">
            <Label className="text-[12px] font-bold text-[#555]">Tham chiếu</Label>
            <div className="flex gap-0">
               <Input 
                {...register("referenceCode")}
                className="h-[32px] text-[13px] border-[#ccc] rounded-r-none rounded-l-[4px] focus-visible:ring-1 focus-visible:ring-[#007bff]" 
               />
               <Button type="button" variant="outline" size="icon" className="h-[32px] w-[32px] border-[#ccc] border-l-0 rounded-l-none rounded-r-[4px] bg-[#f0f0f0]"><Search size={14}/></Button>
            </div>
          </div>

        </div>
      </div>

      {/* Items Table */}
      <div className="border border-[#dcdcdc] rounded-[4px] overflow-hidden bg-white shadow-[0_1px_2px_rgba(0,0,0,0.05)] min-h-[250px]">
        <div className="px-[15px] py-[10px] border-b border-[#eee] bg-white font-bold text-[13px] text-[#1f1f1f]">Hàng hóa</div>
        <Table className="table-custom">
          <TableHeader>
            <TableRow className="bg-[#f0f0f0] hover:bg-[#f0f0f0] border-b border-[#ccc]">
              <TableHead className="w-[50px] text-center p-[10px] font-bold text-[12px] text-[#1f1f1f] uppercase">#</TableHead>
              <TableHead className="w-[150px] p-[10px] font-bold text-[12px] text-[#1f1f1f] uppercase">Mã hàng</TableHead>
              <TableHead className="p-[10px] font-bold text-[12px] text-[#1f1f1f] uppercase">Tên hàng</TableHead>
              <TableHead className="w-[100px] p-[10px] font-bold text-[12px] text-[#1f1f1f] uppercase">ĐVT</TableHead>
              <TableHead className="w-[120px] text-right p-[10px] font-bold text-[12px] text-[#1f1f1f] uppercase">SL xuất</TableHead>
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
                    {...register(`items.${index}.quantity` as const)} 
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
      </div>

      <div className="flex justify-between items-start mt-2 px-1">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-3">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => append({ productCode: "", productName: "", unit: "", quantity: 1, lotNumber: "" })}
              className="h-[28px] text-[12px] font-bold text-[#007bff] bg-white border-[#ddd] px-3 rounded-[3px] flex gap-1 items-center"
            >
              <Plus size={14} /> Thêm dòng
            </Button>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => remove()}
              className="h-[28px] text-[12px] font-bold text-red-600 bg-white border-[#ddd] px-3 rounded-[3px] flex gap-1 items-center"
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

      <div className="mt-3 px-1">
        <Label className="font-bold mb-2 block">Đính kèm</Label>
        <div className="border-2 border-dashed border-[#ccc] rounded-[6px] p-8 text-center bg-[#f9f9f9] hover:bg-[#f0f8ff] hover:border-[#007bff] cursor-pointer transition-all group">
            <div className="text-[#007bff] font-bold mb-1 group-hover:scale-105 transition-transform">Chọn tệp hoặc kéo và thả tệp vào đây</div>
            <p className="text-gray-400 text-[12px]">Dung lượng tối đa 5MB</p>
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
