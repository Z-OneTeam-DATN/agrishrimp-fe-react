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
  Search,
  Download,
  Filter,
  Info,
  ChevronDown
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
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");

  const {
    register,
    handleSubmit,
    control,
    setValue,
    watch,
    formState: { errors },
  } = useForm<Receipt>({
    resolver: zodResolver(ReceiptSchema),
    mode: "onTouched",
    defaultValues: {
      receiptType: "NHAP_MUA",
      supplierCode: "",
      supplierName: "",
      receiptCode: "PNK" + Date.now().toString().slice(-6),
      warehouseId: "HH",
      branchName: "Chi nhánh mặc định",
      importStatus: "IMPORTED",
      deliverer: "Nhiên Lê",
      entryDate: new Date().toISOString().slice(0, 10),
      referenceCode: "REF-" + Date.now().toString().slice(-4),
      description: "",
      items: [],
      note: "",
      paymentAmount: 0,
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "items",
  });

  const watchItems = watch("items");
  const watchPaymentAmount = watch("paymentAmount") || 0;

  const calculateTotals = () => {
    const totalQty = watchItems.reduce((acc, item) => acc + (item.plannedQuantity || 0), 0);
    const subTotal = watchItems.reduce((acc, item) => {
      const amount = (item.plannedQuantity || 0) * (item.importPrice || 0);
      const discount = (item.discount || 0) / 100 * amount;
      return acc + (amount - discount);
    }, 0);
    return { totalQty, subTotal };
  };

  const { totalQty, subTotal } = calculateTotals();
  const debtAmount = Math.max(0, subTotal - watchPaymentAmount);

  const onSubmit = (data: Receipt) => {
    console.log("Saving receipt:", data);
    toast.success("Lập phiếu nhập thành công");
    router.push("/inventory/receipts");
  };

  const addTag = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && tagInput.trim()) {
      e.preventDefault();
      if (!tags.includes(tagInput.trim())) {
        setTags([...tags, tagInput.trim()]);
      }
      setTagInput("");
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 bg-[#f4f6f8] min-h-screen p-4 pb-[100px]">
      {/* Top Sections */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Supplier Info */}
        <div className="bg-white p-4 rounded-md shadow-sm border border-slate-200">
          <h2 className="text-[14px] font-bold text-slate-700 mb-4">Thông tin nhà cung cấp</h2>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <Input 
              placeholder="Tìm theo tên, SĐT, mã nhà cung cấp... (F4)"
              className="pl-10 h-10 border-slate-200 focus-visible:ring-1 focus-visible:ring-blue-500"
            />
          </div>
          <div className="mt-8 flex flex-col items-center justify-center py-4 text-slate-400 border-2 border-dashed border-slate-100 rounded-md">
            <Info size={32} className="opacity-20 mb-2" />
            <p className="text-[13px]">Chưa có thông tin nhà cung cấp</p>
          </div>
        </div>

        {/* Receipt Info */}
        <div className="bg-white p-4 rounded-md shadow-sm border border-slate-200">
          <h2 className="text-[14px] font-bold text-slate-700 mb-4">Thông tin đơn nhập hàng</h2>
          <div className="space-y-3">
            <div className="grid grid-cols-3 items-center gap-4">
              <Label className="text-[13px] text-slate-600">Nhập vào Kho</Label>
              <div className="col-span-2">
                <Controller
                  name="branchName"
                  control={control}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger className="h-9 text-[13px] border-slate-200">
                        <SelectValue placeholder="Chọn kho nhập" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Chi nhánh mặc định">KHO TỔNG (TRỤ SỞ)</SelectItem>
                        <SelectItem value="Kho Sóc Trăng">Kho Sóc Trăng</SelectItem>
                        <SelectItem value="Kho Bạc Liêu">Kho Bạc Liêu</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
            </div>

            <div className="grid grid-cols-3 items-center gap-4">
              <Label className="text-[13px] text-slate-600">Nhân viên</Label>
              <div className="col-span-2">
                <Controller
                  name="deliverer"
                  control={control}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger className="h-9 text-[13px] border-slate-200">
                        <SelectValue placeholder="Chọn nhân viên" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Nhiên Lê">Nhiên Lê</SelectItem>
                        <SelectItem value="Admin">Quản trị viên</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
            </div>

            <div className="grid grid-cols-3 items-center gap-4">
              <Label className="text-[13px] text-slate-600">Trạng thái nhập</Label>
              <div className="col-span-2">
                <Controller
                  name="importStatus"
                  control={control}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger className="h-9 text-[13px] border-slate-200">
                        <SelectValue placeholder="Chọn trạng thái" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="IMPORTED">Đã nhập kho</SelectItem>
                        <SelectItem value="PO">Đặt hàng - PO</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
            </div>

            <div className="grid grid-cols-3 items-center gap-4">
              <Label className="text-[13px] text-slate-600">Ngày hẹn giao</Label>
              <Input 
                type="date"
                {...register("entryDate")}
                className="col-span-2 h-9 text-[13px] border-slate-200"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Product Search & Table */}
      <div className="bg-white rounded-md shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-100">
          <h2 className="text-[14px] font-bold text-slate-700 mb-4">Thông tin sản phẩm</h2>
          <div className="flex flex-wrap gap-2 items-center">
            <div className="relative flex-1 min-w-[300px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <Input 
                placeholder="Tìm theo tên, mã SKU, hoặc quét mã Barcode...(F3)"
                className="pl-10 h-10 border-slate-200 focus-visible:ring-1 focus-visible:ring-blue-500"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    append({ 
                      productCode: "SP00" + (fields.length + 1), 
                      productName: "Sản phẩm mới " + (fields.length + 1), 
                      unit: "Chai", 
                      plannedQuantity: 1, 
                      lotNumber: "LOT-" + Date.now().toString().slice(-4),
                      expiryDate: "2026-12-31",
                      importPrice: 100000,
                      newSellingPrice: 120000,
                      discount: 0
                    });
                  }
                }}
              />
            </div>
            <Button type="button" variant="outline" className="h-10 text-[13px] border-slate-200">Chọn nhiều</Button>
            <Button type="button" variant="outline" className="h-10 text-[13px] border-slate-200"><Filter size={16} className="mr-1"/> (F10)</Button>
            <Select defaultValue="importPrice">
              <SelectTrigger className="h-10 w-[120px] text-[13px] border-slate-200">
                <SelectValue placeholder="Giá nhập" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="importPrice">Giá nhập</SelectItem>
                <SelectItem value="lastImportPrice">Giá nhập cuối</SelectItem>
              </SelectContent>
            </Select>
            <Button type="button" variant="outline" className="h-10 text-[13px] border-slate-200 bg-emerald-50 text-emerald-700 border-emerald-100 hover:bg-emerald-100">
              <Download size={16} className="mr-1"/> Import Excel
            </Button>
            <div className="flex items-center gap-2 ml-auto">
              <label className="flex items-center gap-2 text-[13px] text-slate-600 cursor-pointer">
                <input type="checkbox" className="rounded border-slate-300" />
                Tách dòng
              </label>
              <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-slate-400"><Settings size={18}/></Button>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto min-h-[300px]">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50/50 hover:bg-slate-50/50 border-b border-slate-100">
                <TableHead className="w-[50px] text-center text-[11px] font-bold text-slate-500 uppercase">STT</TableHead>
                <TableHead className="text-[11px] font-bold text-slate-500 uppercase">Sản phẩm</TableHead>
                <TableHead className="w-[80px] text-[11px] font-bold text-slate-500 uppercase">ĐVT</TableHead>
                <TableHead className="w-[120px] text-[11px] font-bold text-slate-500 uppercase">Số lô</TableHead>
                <TableHead className="w-[120px] text-[11px] font-bold text-slate-500 uppercase">Hạn dùng</TableHead>
                <TableHead className="w-[100px] text-right text-[11px] font-bold text-slate-500 uppercase">SL nhập</TableHead>
                <TableHead className="w-[120px] text-right text-[11px] font-bold text-slate-500 uppercase">Giá nhập</TableHead>
                <TableHead className="w-[120px] text-right text-[11px] font-bold text-slate-500 uppercase">Giá bán mới</TableHead>
                <TableHead className="w-[120px] text-right text-[11px] font-bold text-slate-500 uppercase">Thành tiền</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {fields.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} className="h-[200px] text-center">
                    <div className="flex flex-col items-center justify-center text-slate-400">
                      <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                        <Info size={32} className="opacity-20" />
                      </div>
                      <p className="text-[13px]">Đơn hàng nhập của bạn chưa có sản phẩm nào</p>
                      <Button type="button" variant="outline" onClick={() => append({ 
                        productCode: "SP001", productName: "Sản phẩm mẫu", unit: "Chai", plannedQuantity: 1, lotNumber: "LOT001", expiryDate: "2026-12-31", importPrice: 100000, discount: 0 
                      })} className="mt-4 text-blue-600 border-blue-200">Thêm sản phẩm</Button>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                fields.map((field, index) => {
                  const item = watchItems[index];
                  const amount = (item?.plannedQuantity || 0) * (item?.importPrice || 0);
                  const discount = (item?.discount || 0) / 100 * amount;
                  const finalAmount = amount - discount;

                  return (
                    <TableRow key={field.id} className="hover:bg-blue-50/30 border-b border-slate-50 last:border-0 transition-colors">
                      <TableCell className="text-center text-[13px] text-slate-500">{index + 1}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-slate-100 rounded border border-slate-200 flex-shrink-0" />
                          <div className="flex flex-col">
                            <span className="text-[13px] font-bold text-slate-900">{item?.productName}</span>
                            <span className="text-[11px] text-slate-500">{item?.productCode}</span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Input {...register(`items.${index}.unit`)} className="h-8 text-[13px] border-none shadow-none focus-visible:ring-0 px-0" />
                      </TableCell>
                      <TableCell>
                        <Input {...register(`items.${index}.lotNumber`)} className="h-8 text-[13px] border-slate-200 px-2" />
                      </TableCell>
                      <TableCell>
                        <Input type="date" {...register(`items.${index}.expiryDate`)} className="h-8 text-[13px] border-slate-200 px-2" />
                      </TableCell>
                      <TableCell>
                        <Input type="number" {...register(`items.${index}.plannedQuantity`)} className="h-8 text-[13px] text-right border-slate-200 px-2 font-bold" />
                      </TableCell>
                      <TableCell>
                        <Input type="number" {...register(`items.${index}.importPrice`)} className="h-8 text-[13px] text-right border-slate-200 px-2" />
                      </TableCell>
                      <TableCell>
                        <Input type="number" {...register(`items.${index}.newSellingPrice`)} className="h-8 text-[13px] text-right border-slate-200 px-2 text-blue-600" />
                      </TableCell>
                      <TableCell className="text-right text-[13px] font-bold text-slate-900">
                        {finalAmount.toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)} className="h-8 w-8 text-slate-300 hover:text-rose-600">
                          <Trash2 size={16} />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Bottom Sections */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 pt-4">
        {/* Notes & Tags */}
        <div className="md:col-span-4 space-y-4">
          <div className="space-y-1.5">
            <Label className="text-[13px] font-bold text-slate-700">Ghi chú đơn</Label>
            <textarea 
              {...register("note")}
              placeholder="VD: Hàng tặng gói riêng"
              className="w-full min-h-[80px] p-3 text-[13px] border border-slate-200 rounded-md focus:ring-1 focus:ring-blue-500 focus:outline-none"
            ></textarea>
          </div>
          <div className="space-y-1.5">
            <Label className="text-[13px] font-bold text-slate-700">Tags</Label>
            <div className="min-h-[40px] p-2 border border-slate-200 rounded-md bg-white flex flex-wrap gap-2">
              {tags.map(tag => (
                <span key={tag} className="inline-flex items-center gap-1 bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[12px]">
                  {tag}
                  <X size={12} className="cursor-pointer" onClick={() => setTags(tags.filter(t => t !== tag))} />
                </span>
              ))}
              <input 
                type="text" 
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={addTag}
                placeholder="Nhập ký tự và ấn enter"
                className="flex-1 min-w-[100px] border-none text-[13px] focus:ring-0 outline-none"
              />
            </div>
          </div>
        </div>

        {/* Totals & Payment */}
        <div className="md:col-span-4 md:col-start-9 space-y-3">
          <div className="flex justify-between items-center text-[13px]">
            <span className="text-slate-500">Số lượng</span>
            <span className="font-bold">{totalQty}</span>
          </div>
          <div className="flex justify-between items-center text-[13px]">
            <span className="text-slate-500">Tổng tiền</span>
            <span className="font-bold">{subTotal.toLocaleString()}</span>
          </div>
          <div className="flex justify-between items-center text-[13px] text-blue-600 cursor-pointer hover:underline">
            <span>Chiết khấu (F6)</span>
            <span className="font-bold">0</span>
          </div>
          
          <div className="pt-2">
            <p className="text-[13px] font-bold text-slate-700 mb-2">Chi phí nhập hàng</p>
            <Button type="button" variant="ghost" className="h-auto p-0 text-[13px] text-blue-600 flex items-center gap-1">
              <Plus size={14} /> Thêm chi phí (F7)
            </Button>
          </div>

          <div className="flex justify-between items-center text-[13px] pt-1">
            <div className="flex items-center gap-1">
              <span className="text-slate-500">Thuế</span>
              <HelpCircle size={14} className="text-slate-300" />
            </div>
            <span className="font-bold">0</span>
          </div>

          <div className="flex justify-between items-center text-[15px] font-bold pt-2 border-t border-slate-100">
            <span>Tiền cần trả</span>
            <span className="text-blue-600">{subTotal.toLocaleString()}</span>
          </div>

          <div className="pt-4 border-t border-slate-100">
            <p className="text-[13px] font-bold text-slate-700 mb-2">Thanh toán cho NCC</p>
            <div className="flex gap-2">
              <Input 
                type="number"
                {...register("paymentAmount")}
                className="h-9 text-[13px] border-slate-200 font-bold"
                placeholder="0"
              />
              <Button type="button" variant="outline" className="h-9 px-2 text-slate-400">
                <ChevronDown size={16} />
              </Button>
            </div>
            <Button type="button" variant="ghost" className="h-auto p-0 mt-2 text-[13px] text-blue-600 flex items-center gap-1">
              <Plus size={14} /> Thêm phương thức
            </Button>
          </div>

          <div className="flex justify-between items-center text-[14px] font-bold pt-3 text-slate-700">
            <span>Còn phải trả</span>
            <span>{debtAmount.toLocaleString()}</span>
          </div>
          {debtAmount > 0 && (
            <p className="text-[11px] text-amber-600 text-right font-medium italic">
              * Hệ thống sẽ tự động ghi vào công nợ NCC
            </p>
          )}
        </div>
      </div>

      {/* Fixed Footer */}
      <div className="fixed bottom-0 left-0 lg:left-[260px] right-0 bg-white border-t border-slate-200 p-4 flex items-center justify-end gap-3 z-[100] shadow-[0_-2px_10px_rgba(0,0,0,0.05)]">
        <Button 
          type="button" 
          variant="outline" 
          onClick={() => router.back()}
          className="min-w-[100px] h-10 border-slate-200 font-bold text-slate-600"
        >
          Hủy
        </Button>
        <div className="flex shadow-sm rounded-md overflow-hidden">
          <Button 
            type="submit"
            className="h-10 px-6 bg-blue-600 hover:bg-blue-700 text-white font-bold border-r border-blue-500"
          >
            Lưu phiếu (F9)
          </Button>
          <Button type="button" className="h-10 px-2 bg-blue-600 hover:bg-blue-700 text-white">
            <ChevronDown size={18} />
          </Button>
        </div>
      </div>
    </form>
  );
}

