"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { 
  X, 
  Plus, 
  Trash2, 
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { InventorySchema, InventoryAudit } from "@/app/types/inventory.schema";
import { toast } from "sonner";

export default function NewInventoryPage() {
  const router = useRouter();

  const {
    register,
    handleSubmit,
    control,
    watch,
    formState: { errors },
  } = useForm<InventoryAudit>({
    resolver: zodResolver(InventorySchema),
    mode: "onTouched",
    defaultValues: {
      inventoryCode: "PKK" + Date.now(),
      inventoryDate: new Date().toISOString().slice(0, 16),
      cutOffDate: new Date().toISOString().split('T')[0],
      branch: "Chi nhánh Hà Nội",
      warehouse: "",
      warehouseKeeper: "",
      auditType: "PERIODIC",
      description: "",
      scope: "all",
      selectedGroups: [],
      status: "Chưa thực hiện",
      isBlindAudit: false,
      includeZeroStock: true,
      members: [{ name: "Nguyễn Văn A", role: "Trưởng ban" }],
      items: []
    },
  });

  const scope = watch("scope");

  const { fields: memberFields, append: appendMember, remove: removeMember } = useFieldArray({
    control,
    name: "members",
  });

  const onSubmit = (data: InventoryAudit) => {
    console.log("Saving inventory request:", data);
    toast.success("Tạo phiếu kiểm kê thành công");
    router.push("/inventory/inventory-checks");
  };

  const branches = ["Chi nhánh Hà Nội", "Chi nhánh Hồ Chí Minh", "CN Bạc Liêu", "CN Cà Mau"];
  const warehouses = ["Kho Hàng Hóa", "Kho Lạnh", "Kho Nguyên Liệu", "Kho Thuốc"];
  const productGroups = ["Thuốc thủy sản", "Thức ăn tôm", "Hóa chất xử lý", "Dụng cụ nuôi"];

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-3 pb-[80px]">
      {/* Page Header */}
      <div className="flex justify-between items-center mb-3">
        <div>
          <h1 className="text-[18px] font-bold text-[#1f1f1f]">Tạo phiếu kiểm kê mới</h1>
          <p className="text-muted-foreground text-[12px] mt-1">Thiết lập thông tin ban đầu để lấy số liệu tồn kho</p>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={() => router.back()} className="h-[30px] border-[#ddd] bg-white">
          <X className="mr-1 h-4 w-4" /> Đóng
        </Button>
      </div>

      {/* Info Card */}
      <div className="bg-white border border-[#dcdcdc] p-[15px_20px] rounded-[4px] shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-x-4 gap-y-3">
          
          <div className="md:col-span-3 space-y-[2px]">
            <Label className="text-[12px] font-bold text-red-500">Chi nhánh *</Label>
            <Controller
              name="branch"
              control={control}
              render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value} key={field.value}>
                  <SelectTrigger className={`h-[32px] text-[13px] border-[#ccc] rounded-[4px] focus:ring-0 ${errors.branch ? 'border-red-500 bg-red-50' : ''}`}>
                    <SelectValue placeholder="-- Chọn chi nhánh --" />
                  </SelectTrigger>
                  <SelectContent>
                    {branches.map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          <div className="md:col-span-3 space-y-[2px]">
            <Label className="text-[12px] font-bold text-red-500">Kho kiểm kê *</Label>
            <Controller
              name="warehouse"
              control={control}
              render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value} key={field.value}>
                  <SelectTrigger className={`h-[32px] text-[13px] border-[#ccc] rounded-[4px] focus:ring-0 ${errors.warehouse ? 'border-red-500 bg-red-50' : ''}`}>
                    <SelectValue placeholder="-- Chọn kho --" />
                  </SelectTrigger>
                  <SelectContent>
                    {warehouses.map(w => <SelectItem key={w} value={w}>{w}</SelectItem>)}
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          <div className="md:col-span-3 space-y-[2px]">
            <Label className="text-[12px] font-bold text-red-500">Thủ kho *</Label>
            <Input 
              {...register("warehouseKeeper")}
              placeholder="Người chịu trách nhiệm kho..."
              className={`h-[32px] text-[13px] border-[#ccc] rounded-[4px] focus-visible:ring-1 focus-visible:ring-[#007bff] ${errors.warehouseKeeper ? 'border-red-500 bg-red-50' : ''}`} 
            />
          </div>

          <div className="md:col-span-3 border-l border-[#eee] ps-4 space-y-[2px]">
            <Label className="text-[12px] font-bold text-blue-600">Số phiếu (Tự sinh)</Label>
            <Input 
              {...register("inventoryCode")}
              readOnly
              className="h-[32px] text-[13px] font-bold border-[#ccc] rounded-[4px] bg-[#f8f9fa] text-[#007bff] focus-visible:ring-0" 
            />
          </div>

          <div className="md:col-span-3 space-y-[2px]">
            <Label className="text-[12px] font-bold text-[#555]">Loại kiểm kê</Label>
            <Controller
              name="auditType"
              control={control}
              render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value}>
                  <SelectTrigger className="h-[32px] text-[13px] border-[#ccc] rounded-[4px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PERIODIC">Kiểm kê định kỳ</SelectItem>
                    <SelectItem value="UNEXPECTED">Kiểm kê đột xuất</SelectItem>
                    <SelectItem value="YEAR_END">Kiểm kê cuối năm</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          <div className="md:col-span-3 space-y-[2px]">
            <Label className="text-[12px] font-bold text-red-500">Ngày kiểm kê *</Label>
            <Input 
              type="datetime-local"
              {...register("inventoryDate")}
              className={`h-[32px] text-[13px] border-[#ccc] rounded-[4px] focus-visible:ring-1 focus-visible:ring-[#007bff] ${errors.inventoryDate ? 'border-red-500' : ''}`} 
            />
          </div>

          <div className="md:col-span-3 space-y-[2px]">
            <Label className="text-[12px] font-bold text-red-500">Kiểm kê đến hết ngày *</Label>
            <Input 
              type="date"
              {...register("cutOffDate")}
              className={`h-[32px] text-[13px] border-[#ccc] rounded-[4px] focus-visible:ring-1 focus-visible:ring-[#007bff] ${errors.cutOffDate ? 'border-red-500' : ''}`} 
            />
          </div>

          <div className="md:col-span-3 border-l border-[#eee] ps-4 space-y-[2px]">
            <Label className="text-[12px] font-bold text-[#555]">Trạng thái thực hiện</Label>
            <Input 
              {...register("status")}
              readOnly
              className="h-[32px] text-[13px] border-[#ccc] rounded-[4px] bg-[#f8f9fa] text-orange-500 font-bold focus-visible:ring-0" 
            />
          </div>

          <div className="md:col-span-9 space-y-[2px]">
            <Label className="text-[12px] font-bold text-[#555]">Mục đích / Diễn giải <span className="text-red-500">*</span></Label>
            <Input 
              {...register("description")}
              placeholder="VD: Kiểm kê định kỳ cuối tháng 1/2026..."
              className={`h-[32px] text-[13px] border-[#ccc] rounded-[4px] focus-visible:ring-1 focus-visible:ring-[#007bff] ${errors.description ? 'border-red-500' : ''}`} 
            />
          </div>

          <div className="md:col-span-3 border-l border-[#eee] ps-4 flex flex-col justify-end space-y-2 pb-1">
             <div className="flex items-center space-x-2">
                <Controller
                  name="isBlindAudit"
                  control={control}
                  render={({ field }) => (
                    <Checkbox id="blind-audit" checked={field.value} onCheckedChange={field.onChange} />
                  )}
                />
                <Label htmlFor="blind-audit" className="text-[12px] font-medium text-gray-600 cursor-pointer">Kiểm kê mù (Ẩn tồn sổ sách)</Label>
             </div>
             <div className="flex items-center space-x-2">
                <Controller
                  name="includeZeroStock"
                  control={control}
                  render={({ field }) => (
                    <Checkbox id="zero-stock" checked={field.value} onCheckedChange={field.onChange} />
                  )}
                />
                <Label htmlFor="zero-stock" className="text-[12px] font-medium text-gray-600 cursor-pointer">Bao gồm hàng tồn bằng 0</Label>
             </div>
          </div>

        </div>
      </div>

      {/* Scope Card */}
      <div className="bg-white border border-[#dcdcdc] p-[15px_20px] rounded-[4px] shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
        <h6 className="font-bold text-[13px] text-[#555] border-bottom border-[#eee] pb-2 mb-3">Phạm vi kiểm kê</h6>
        <Controller
          name="scope"
          control={control}
          render={({ field }) => (
            <RadioGroup onValueChange={field.onChange} value={field.value} className="flex gap-10">
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="all" id="scope-all" />
                <Label htmlFor="scope-all" className="text-[13px] cursor-pointer">Tất cả vật tư hàng hóa</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="group" id="scope-group" />
                <Label htmlFor="scope-group" className="text-[13px] cursor-pointer">Chọn theo nhóm hàng</Label>
              </div>
            </RadioGroup>
          )}
        />

        {scope === "group" && (
          <div className="mt-4 p-3 bg-[#f8f9fa] rounded border border-dashed border-[#ccc]">
            <Label className="text-[12px] font-bold mb-2 block">Chọn nhóm vật tư cần kiểm:</Label>
            <div className="flex flex-wrap gap-4">
              {productGroups.map((grp) => (
                <div key={grp} className="flex items-center space-x-2">
                  <Checkbox id={`grp-${grp}`} />
                  <Label htmlFor={`grp-${grp}`} className="text-[13px] font-normal cursor-pointer">{grp}</Label>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Members Table */}
      <div className="bg-white border border-[#dcdcdc] rounded-[4px] shadow-[0_1px_2px_rgba(0,0,0,0.05)] overflow-hidden">
        <div className="px-[15px] py-[10px] border-b border-[#eee] flex justify-between items-center">
          <h6 className="font-bold text-[13px] text-[#555]">Ban kiểm kê</h6>
          <Button type="button" variant="outline" size="sm" onClick={() => appendMember({ name: "", role: "" })} className="h-[26px] text-[11px] font-bold text-blue-600 border-blue-200">
            <Plus className="mr-1 h-3 w-3" /> Thêm thành viên
          </Button>
        </div>
        <Table className="table-bordered border-collapse">
          <TableHeader>
            <TableRow className="bg-[#f0f0f0] hover:bg-[#f0f0f0]">
              <TableHead className="w-[50px] text-center p-[8px] font-bold text-[12px] text-[#333]">#</TableHead>
              <TableHead className="p-[8px] font-bold text-[12px] text-[#333]">Tên thành viên</TableHead>
              <TableHead className="p-[8px] font-bold text-[12px] text-[#333]">Chức vụ / Vai trò</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {memberFields.map((field, index) => (
              <TableRow key={field.id} className="border-b border-[#eee]">
                <TableCell className="text-center text-gray-400 p-[4px]">{index + 1}</TableCell>
                <TableCell className="p-[4px]">
                  <Input 
                    {...register(`members.${index}.name` as const)} 
                    placeholder="Nhập tên..."
                    className="h-7 text-[13px] border-none focus-visible:ring-1 focus-visible:ring-[#007bff] bg-transparent"
                  />
                </TableCell>
                <TableCell className="p-[4px]">
                  <Input 
                    {...register(`members.${index}.role` as const)} 
                    placeholder="Nhập chức vụ..."
                    className="h-7 text-[13px] border-none focus-visible:ring-1 focus-visible:ring-[#007bff] bg-transparent"
                  />
                </TableCell>
                <TableCell className="p-[4px] text-center">
                  {memberFields.length > 1 && (
                    <Trash2 
                      size={14} 
                      className="inline-block text-red-400 cursor-pointer hover:text-red-600 transition-opacity opacity-50 hover:opacity-100" 
                      onClick={() => removeMember(index)} 
                    />
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Footer Actions */}
      <div className="fixed bottom-0 left-0 lg:left-[260px] right-0 bg-[#f8f9fa] border-t border-[#ddd] p-[8px_20px] flex items-center justify-end gap-[10px] z-[999]">
        <Button type="button" variant="outline" className="min-w-[100px] h-[32px] text-[13px] font-semibold border-[#ccc] bg-white rounded-[4px]" onClick={() => router.back()}>
          Hủy bỏ
        </Button>
        <Button type="submit" className="min-w-[150px] h-[32px] text-[13px] font-semibold bg-[#007bff] hover:bg-[#0069d9] text-white rounded-[4px] shadow-none">
          Lưu và Lấy dữ liệu
        </Button>
      </div>
    </form>
  );
}
