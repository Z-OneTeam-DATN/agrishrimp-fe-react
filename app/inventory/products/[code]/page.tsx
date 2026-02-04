"use client";

import React, { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useForm, Controller, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { 
  X, 
  Settings, 
  HelpCircle, 
  Plus, 
  Trash2, 
  Save, 
  Eye
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
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { ProductSchema, Product } from "@/app/types/inventory.schema";
import { toast } from "sonner";

export default function EditProductPage() {
  const params = useParams();
  const router = useRouter();
  const code = params.code as string;

  const {
    register,
    handleSubmit,
    control,
    setValue,
    reset,
    trigger,
    formState: { errors, touchedFields, isSubmitted },
  } = useForm<Product>({
    resolver: zodResolver(ProductSchema),
    mode: "onTouched",
    defaultValues: {
      code: code,
      name: "",
      type: "Hàng hóa",
      group: "",
      unit: "",
      warranty: 0,
      tax: 8,
      minStock: 0,
      maxStock: 0,
      origin: "",
      description: "",
      status: "Đang kinh doanh",
      stock: 0,
      conversionUnits: [],
      manageByLot: false
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "conversionUnits",
  });
  
  // Mô phỏng logic lấy dữ liệu (Giả định dữ liệu thật từ API sẽ có đầy đủ các trường này)
  useEffect(() => {
    if (code === "TA001") {
      reset({
        code: "TA001",
        name: "Thức ăn tôm Grobest 40% đạm",
        unit: "Bao",
        group: "Thức ăn tôm",
        minStock: 150.0,
        maxStock: 5000.0,
        warranty: 6,
        origin: "Việt Nam",
        description: "Thức ăn tăng trọng cho tôm thẻ chân trắng, độ đạm cao giúp tôm lớn nhanh.",
        type: "Hàng hóa",
        tax: 8,
        status: "Đang kinh doanh",
        stock: 0,
        conversionUnits: [
          { name: "Gói nhỏ (Demo)", value: 0.5, operator: "*", price: 120000, barcode: "893000123" },
          { name: "Thùng (24 Gói)", value: 24, operator: "*", price: 2800000, barcode: "893000999" },
        ],
        manageByLot: false
      });
    } else if (code === "VS005") {
      reset({
        code: "VS005",
        name: "Men vi sinh xử lý đáy (BZT)",
        unit: "Gói",
        group: "Thuốc & Vi sinh",
        minStock: 50.0,
        maxStock: 2000.0,
        warranty: 12,
        origin: "Mỹ (USA)",
        description: "Công dụng: Phân hủy mùn bã hữu cơ, thức ăn dư thừa, làm sạch đáy ao nuôi tôm.",
        type: "Hàng hóa",
        tax: 8,
        status: "Đang kinh doanh",
        stock: 0,
        conversionUnits: [],
        manageByLot: true
      });
    } else {
      // Dữ liệu mặc định cho các mã khác để tránh để trống các trường bắt buộc
      reset({
        code: code,
        name: "Sản phẩm mới cập nhật",
        unit: "Kg",
        group: "Hóa chất xử lý",
        minStock: 10,
        maxStock: 100,
        warranty: 0,
        origin: "Chưa xác định",
        description: "",
        type: "Hàng hóa",
        tax: 8,
        status: "Đang kinh doanh",
        stock: 0,
        conversionUnits: [],
        manageByLot: false
      });
    }
  }, [code, reset]);

  const onSubmit = (data: Product) => {
    console.log("Saving product:", data);
    toast.success("Đã lưu thông tin hàng hóa thành công");
  };

  const handleSaveAndAdd = async () => {
    const isValid = await trigger();
    if (isValid) {
      const data = control._formValues;
      console.log("Saving and adding new:", data);
      toast.success("Đã lưu và chuẩn bị thêm mới");
    } else {
      toast.error("Vui lòng kiểm tra lại thông tin nhập liệu");
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-2 pb-[80px]">
      {/* Page Header */}
      <div className="flex items-center gap-[15px] mb-[10px]">
        <h1 className="text-[20px] font-bold text-[#333]">
          Sửa hàng hóa <span className="text-[#007bff]">{code}</span>
        </h1>
        <div className="flex flex-col">
          <Controller
            name="status"
            control={control}
            render={({ field }) => (
              <Select onValueChange={field.onChange} value={field.value}>
                <SelectTrigger className={`w-[150px] h-[32px] text-[13px] font-semibold border-[#28a745] text-[#28a745] focus:ring-0 ${errors.status ? 'border-red-500' : ''}`}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Đang kinh doanh">Đang kinh doanh</SelectItem>
                  <SelectItem value="Ngừng kinh doanh">Ngừng kinh doanh</SelectItem>
                </SelectContent>
              </Select>
            )}
          />
          {errors.status && <p className="text-[10px] text-red-500 mt-0.5">{errors.status.message}</p>}
        </div>
        
        <div className="ms-auto flex items-center gap-3 text-gray-400">
          <Settings size={20} className="cursor-pointer hover:text-gray-600" />
          <HelpCircle size={20} className="cursor-pointer hover:text-gray-600" />
          <Button type="button" variant="ghost" size="icon" onClick={() => router.back()} className="h-8 w-8 text-gray-400">
            <X size={20} />
          </Button>
        </div>
      </div>

      {/* Main Info Box (card-box) */}
      <div className="bg-white border border-[#dcdcdc] p-[15px_20px] mb-[10px] rounded-[4px] shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-x-2 gap-y-3">
          <div className="space-y-[2px]">
            <Label className="text-[12px] font-bold text-[#555]">Mã hàng <span className="text-[#e54848]">*</span></Label>
            <Input {...register("code")} disabled className="h-[32px] text-[13px] bg-[#f8f9fa] text-[#6c757d] border-[#ccc] rounded-[3px]" />
            {errors.code && <p className="text-[11px] text-red-500 mt-1">{errors.code.message}</p>}
          </div>
          <div className="md:col-span-2 space-y-[2px]">
            <Label className="text-[12px] font-bold text-[#555]">Tên hàng hóa <span className="text-[#e54848]">*</span></Label>
            <Input 
              {...register("name")}
              className={`h-[32px] text-[13px] font-bold border-[#ccc] rounded-[3px] focus-visible:ring-1 focus-visible:ring-[#007bff] focus-visible:outline-none ${errors.name ? 'border-red-500 bg-red-50' : ''}`} 
            />
            {errors.name && <p className="text-[11px] text-red-500 mt-1">{errors.name.message}</p>}
          </div>
          <div className="space-y-[2px]">
            <Label className="text-[12px] font-bold text-[#555]">Loại hàng</Label>
            <Controller
              name="type"
              control={control}
              render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value}>
                  <SelectTrigger className={`h-[32px] text-[13px] border-[#ccc] rounded-[3px] focus:ring-0 ${errors.type ? 'border-red-500' : ''}`}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Hàng hóa">Hàng hóa</SelectItem>
                    <SelectItem value="Dịch vụ">Dịch vụ</SelectItem>
                    <SelectItem value="Combo">Combo</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
            {errors.type && <p className="text-[11px] text-red-500 mt-1">{errors.type.message}</p>}
          </div>

          <div className="space-y-[2px]">
            <Label className="text-[12px] font-bold text-[#555]">Nhóm VTHH <span className="text-[#e54848]">*</span></Label>
            <div className="flex flex-col gap-1">
              <Controller
                name="group"
                control={control}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value} key={field.value}>
                    <SelectTrigger className={`h-[32px] text-[13px] border-[#ccc] rounded-[3px] focus:ring-0 ${errors.group ? 'border-red-500 bg-red-50' : ''}`}>
                      <SelectValue placeholder="-- Chọn nhóm --" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Thức ăn tôm">Thức ăn tôm</SelectItem>
                      <SelectItem value="Thuốc & Vi sinh">Thuốc & Vi sinh</SelectItem>
                      <SelectItem value="Hóa chất xử lý">Hóa chất xử lý</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.group && <p className="text-[11px] text-red-500">{errors.group.message}</p>}
            </div>
          </div>

          <div className="space-y-[2px]">
            <Label className="text-[12px] font-bold text-[#555]">Đơn vị tính chính <span className="text-[#e54848]">*</span></Label>
            <div className="flex flex-col gap-1">
              <Controller
                name="unit"
                control={control}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value} key={field.value}>
                    <SelectTrigger className={`h-[32px] text-[13px] border-[#ccc] rounded-[3px] focus:ring-0 ${errors.unit ? 'border-red-500 bg-red-50' : ''}`}>
                      <SelectValue placeholder="-- ĐVT --" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Bao">Bao</SelectItem>
                      <SelectItem value="Gói">Gói</SelectItem>
                      <SelectItem value="Kg">Kg</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.unit && <p className="text-[11px] text-red-500">{errors.unit.message}</p>}
            </div>
          </div>

          <div className="space-y-[2px]">
            <Label className="text-[12px] font-bold text-[#555]">Thời gian bảo hành</Label>
            <div className="flex h-[32px]">
              <Input 
                type="number" 
                {...register("warranty")}
                className={`h-full text-[13px] text-right border-r-0 rounded-r-none border-[#ccc] focus-visible:ring-0 shadow-none ${errors.warranty ? 'border-red-500 bg-red-50' : ''}`} 
              />
              <div className="flex items-center px-[10px] bg-[#f0f0f0] border border-[#ccc] rounded-r-[3px] text-[12px] text-gray-500 whitespace-nowrap">Tháng</div>
            </div>
            {errors.warranty && <p className="text-[11px] text-red-500">{errors.warranty.message}</p>}
          </div>

          <div className="space-y-[2px]">
            <Label className="text-[12px] font-bold text-[#555]">Thuế GTGT (%)</Label>
            <Input 
              type="number" 
              {...register("tax")}
              className={`h-[32px] text-[13px] text-right border-[#ccc] rounded-[3px] focus-visible:ring-1 focus-visible:ring-[#007bff] ${errors.tax ? 'border-red-500 bg-red-50' : ''}`} 
            />
            {errors.tax && <p className="text-[11px] text-red-500">{errors.tax.message}</p>}
          </div>

          <div className="space-y-[2px]">
            <Label className="text-[12px] font-bold text-[#555]">Tồn kho tối thiểu <span className="text-[#e54848]">*</span></Label>
            <Input 
              type="number" 
              {...register("minStock")}
              className={`h-[32px] text-[13px] text-right border-[#ccc] rounded-[3px] focus-visible:ring-1 focus-visible:ring-[#007bff] ${errors.minStock ? 'border-red-500 bg-red-50' : ''}`} 
            />
            {errors.minStock && <p className="text-[11px] text-red-500">{errors.minStock.message}</p>}
          </div>
          <div className="space-y-[2px]">
            <Label className="text-[12px] font-bold text-[#555]">Tồn kho tối đa <span className="text-[#e54848]">*</span></Label>
            <Input 
              type="number" 
              {...register("maxStock")}
              className={`h-[32px] text-[13px] text-right border-[#ccc] rounded-[3px] focus-visible:ring-1 focus-visible:ring-[#007bff] ${errors.maxStock ? 'border-red-500 bg-red-50' : ''}`} 
            />
            {errors.maxStock && <p className="text-[11px] text-red-500">{errors.maxStock.message}</p>}
          </div>
          <div className="space-y-[2px]">
            <Label className="text-[12px] font-bold text-[#555]">Nguồn gốc/Xuất xứ <span className="text-[#e54848]">*</span></Label>
            <Input 
              {...register("origin")}
              className={`h-[32px] text-[13px] border-[#ccc] rounded-[3px] focus-visible:ring-1 focus-visible:ring-[#007bff] ${errors.origin ? 'border-red-500 bg-red-50' : ''}`} 
            />
            {errors.origin && <p className="text-[11px] text-red-500">{errors.origin.message}</p>}
          </div>
          <div className="space-y-[2px]">
            <Label className="text-[12px] font-bold text-[#555]">Hình ảnh</Label>
            <div className="flex gap-0">
              <Input type="file" className="h-[32px] text-[11px] pt-[6px] border-[#ccc] rounded-r-none shadow-none focus-visible:ring-0" />
              <Button type="button" variant="outline" size="icon" className="h-[32px] w-[32px] border-[#ccc] border-l-0 rounded-l-none bg-[#f0f0f0]"><Eye size={14}/></Button>
            </div>
          </div>
        </div>
      </div>

      {/* Detail Description Box */}
      <div className="bg-white border border-[#dcdcdc] p-[8px_10px] mb-[10px] rounded-[4px] flex flex-col shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
        <div className="flex items-center">
          <Label className="text-[#333] font-bold text-[12px] uppercase w-32 flex-shrink-0">Mô tả chi tiết:</Label>
          <Input 
            placeholder="Nhập mô tả sản phẩm..." 
            {...register("description")}
            className={`border-none shadow-none focus-visible:ring-0 text-[13px] h-auto py-0 bg-transparent flex-grow ${errors.description ? 'text-red-500' : ''}`} 
          />
        </div>
        {errors.description && <p className="text-[11px] text-red-500 ml-32">{errors.description.message}</p>}
      </div>

      {/* Table Unit Conversion (table-custom-wrapper) */}
      <div className={`border border-[#dcdcdc] rounded-[4px] overflow-hidden bg-white shadow-[0_1px_2px_rgba(0,0,0,0.05)] ${errors.conversionUnits ? 'border-red-500 ring-1 ring-red-200' : ''}`}>
        <div className="px-[15px] py-[10px] border-b border-[#eee] flex justify-between items-center">
          <h3 className="text-[14px] font-bold text-[#333]">
            Đơn vị chuyển đổi & Thuộc tính
          </h3>
          {errors.conversionUnits?.root?.message && (
            <p className="text-[12px] text-red-500 font-medium">{errors.conversionUnits.root.message}</p>
          )}
          {errors.conversionUnits && !errors.conversionUnits.root && (
            <p className="text-[12px] text-red-500 font-medium">Lỗi dữ liệu trong bảng quy đổi</p>
          )}
        </div>
        <Table className="table-custom">
          <TableHeader>
            <TableRow className="bg-[#f0f0f0] hover:bg-[#f0f0f0]">
              <TableHead className="w-[50px] text-center p-[8px_10px] font-bold text-[12px] text-[#333]">#</TableHead>
              <TableHead className="p-[8px_10px] font-bold text-[12px] text-[#333]">Tên đơn vị / Thuộc tính</TableHead>
              <TableHead className="w-[150px] text-right p-[8px_10px] font-bold text-[12px] text-[#333]">Giá trị quy đổi</TableHead>
              <TableHead className="w-[150px] p-[8px_10px] font-bold text-[12px] text-[#333]">Phép tính</TableHead>
              <TableHead className="w-[150px] text-right p-[8px_10px] font-bold text-[12px] text-[#333]">Giá bán lẻ</TableHead>
              <TableHead className="w-[180px] p-[8px_10px] font-bold text-[12px] text-[#333]">Mã vạch (Barcode)</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {fields.map((field, index) => (
              <TableRow key={field.id} className="border-b border-[#eee]">
                <TableCell className="text-center text-gray-400 p-[6px_10px] font-medium">{index + 1}</TableCell>
                <TableCell className="p-[6px_10px]">
                   <Input 
                    {...register(`conversionUnits.${index}.name` as const)} 
                    className={`w-full text-[13px] border-none focus-visible:ring-1 focus-visible:ring-[#007bff] p-[4px_0] bg-transparent transition-all h-7 ${errors.conversionUnits?.[index]?.name ? 'ring-1 ring-red-500 bg-red-50' : ''}`}
                   />
                   {errors.conversionUnits?.[index]?.name && <p className="text-[10px] text-red-500">{errors.conversionUnits[index]?.name?.message}</p>}
                </TableCell>
                <TableCell className="p-[6px_10px]">
                   <Input 
                    type="number"
                    {...register(`conversionUnits.${index}.value` as const)} 
                    className={`w-full text-[13px] text-right border-none focus-visible:ring-1 focus-visible:ring-[#007bff] p-[4px_0] bg-transparent transition-all h-7 ${errors.conversionUnits?.[index]?.value ? 'ring-1 ring-red-500 bg-red-50' : ''}`} 
                   />
                   {errors.conversionUnits?.[index]?.value && <p className="text-[10px] text-red-500 text-right">{errors.conversionUnits[index]?.value?.message}</p>}
                </TableCell>
                <TableCell className="p-[6px_10px]">
                  <Controller
                    name={`conversionUnits.${index}.operator` as const}
                    control={control}
                    render={({ field }) => (
                      <select 
                        {...field}
                        className={`w-full text-[13px] border-none bg-transparent focus:outline-none h-[24px] cursor-pointer ${errors.conversionUnits?.[index]?.operator ? 'text-red-500' : ''}`}
                      >
                        <option value="*">Phép nhân (*)</option>
                        <option value="/">Phép chia (/)</option>
                      </select>
                    )}
                  />
                </TableCell>
                <TableCell className="p-[6px_10px]">
                   <Input 
                    type="number"
                    {...register(`conversionUnits.${index}.price` as const)} 
                    className={`w-full text-[13px] text-right font-bold text-gray-700 border-none focus-visible:ring-1 focus-visible:ring-[#007bff] p-[4px_0] bg-transparent transition-all h-7 ${errors.conversionUnits?.[index]?.price ? 'ring-1 ring-red-500 bg-red-50' : ''}`} 
                   />
                   {errors.conversionUnits?.[index]?.price && <p className="text-[10px] text-red-500 text-right">{errors.conversionUnits[index]?.price?.message}</p>}
                </TableCell>
                <TableCell className="p-[6px_10px]">
                   <Input 
                    {...register(`conversionUnits.${index}.barcode` as const)} 
                    className={`w-full text-[13px] border-none focus-visible:ring-1 focus-visible:ring-[#007bff] p-[4px_0] bg-transparent transition-all h-7 ${errors.conversionUnits?.[index]?.barcode ? 'ring-1 ring-red-500 bg-red-50' : ''}`} 
                   />
                   {errors.conversionUnits?.[index]?.barcode && <p className="text-[10px] text-red-500">{errors.conversionUnits[index]?.barcode?.message}</p>}
                </TableCell>
                <TableCell className="p-[6px_10px]">
                  <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)} className="h-7 w-7 text-gray-400 hover:text-red-600">
                    <Trash2 size={14} />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <div className="p-2 border-t border-[#eee] bg-[#f8f9fa] flex gap-2">
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => append({ name: "", value: 1, operator: "*", price: 0 })}
            className="h-[28px] text-[12px] font-bold text-[#007bff] bg-white border-[#ddd] px-3 rounded-[3px]"
          >
            <Plus size={14} className="mr-1" /> Thêm dòng
          </Button>
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => remove()}
            className="h-[28px] text-[12px] font-bold text-[#e54848] bg-white border-[#ddd] px-3 rounded-[3px]"
          >
            <Trash2 size={14} className="mr-1" /> Xóa hết dòng
          </Button>
        </div>
      </div>

      <div className="flex items-center space-x-2 px-1 pt-2">
        <Controller
          name="manageByLot"
          control={control}
          render={({ field }) => (
            <Checkbox 
              id="lot-manage" 
              className="h-4 w-4 rounded-[2px]" 
              checked={field.value}
              onCheckedChange={field.onChange}
            />
          )}
        />
        <label htmlFor="lot-manage" className="text-[12px] font-medium text-gray-500 cursor-pointer">
          Cho phép quản lý theo số lô, hạn sử dụng
        </label>
      </div>

      {/* Footer Actions (footer-action) */}
      <div className="fixed bottom-0 left-0 lg:left-[260px] right-0 bg-[#f8f9fa] border-t border-[#ddd] p-[8px_20px] flex items-center justify-end gap-[10px] z-[999]">
        <Button type="button" variant="outline" className="min-w-[100px] h-[32px] text-[13px] font-semibold border-[#ccc] bg-white rounded-[3px]" onClick={() => router.back()}>
          Hủy
        </Button>
        <Button 
          type="button" 
          variant="outline" 
          onClick={handleSaveAndAdd}
          className="min-w-[100px] h-[32px] text-[13px] font-semibold border-[#007bff] text-[#007bff] bg-white rounded-[3px]"
        >
          Cất & Thêm
        </Button>
        <Button type="submit" className="min-w-[100px] h-[32px] text-[13px] font-semibold bg-[#007bff] hover:bg-[#0069d9] text-white rounded-[3px] shadow-none">
          <Save size={16} className="mr-2" />
          Cất
        </Button>
      </div>
    </form>
  );
}