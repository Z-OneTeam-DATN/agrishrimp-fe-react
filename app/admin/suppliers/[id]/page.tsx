"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { SupplierSchema, SupplierFormValues } from "@/app/types/admin.schema";
import { supplierService } from "@/app/services/supplier.service";

import {
  ChevronLeft,
  Phone,
  Mail,
  MapPin,
  History,
  Info,
  Plus,
  Save,
  FileText,
  Warehouse,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// Interface cho danh mục
interface Category {
  id: number;
  name: string;
}

export default function SupplierDetailPage() {
  const router = useRouter();
  const params = useParams();
  const supplierId = Number(params.id);

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]); // State lưu danh mục

  const {
    control,
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<SupplierFormValues>({
    resolver: zodResolver(SupplierSchema),
  });

  const supplierData = watch();

  // 2. Fetch danh mục và thông tin chi tiết qua Service
  useEffect(() => {
    const initData = async () => {
      if (!supplierId) return;
      try {
        // 👇 SỬA TẠI ĐÂY: Gọi qua Service thay vì apiJava trực tiếp
        const [categoriesData, supplierInfo] = await Promise.all([
          supplierService.getCategories(), // Hàm này Huy đã thêm vào service rồi đúng không?
          supplierService.getById(supplierId),
        ]);

        setCategories(categoriesData);

        if (supplierInfo) {
          reset({
            ...supplierInfo,
            // Map Object Category sang ID String cho Form
            category: supplierInfo.category?.id?.toString(),

            // Map các trường Enum/String khác
            status:
              supplierInfo.status?.toLowerCase() as SupplierFormValues["status"],
            paymentTerms:
              (supplierInfo.paymentTerm?.toLowerCase() as SupplierFormValues["paymentTerms"]) ||
              "",
            note: supplierInfo.note || "",
          });
        }
      } catch (error) {
        toast.error("Không tải được dữ liệu");
        console.error(error);
        router.push("/admin/suppliers");
      } finally {
        setIsLoading(false);
      }
    };

    initData();
  }, [supplierId, reset, router]);

  const onSave = async (data: SupplierFormValues) => {
    setIsSaving(true);
    try {
      await supplierService.update(supplierId, data);
      toast.success("Cập nhật thông tin thành công!");
      router.refresh();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Lỗi khi cập nhật";
      toast.error(message);
    } finally {
      setIsSaving(false);
    }
  };

  // Helper: Lấy tên danh mục đang chọn để hiển thị ra UI
  const getSelectedCategoryName = () => {
    const catId = supplierData.category;
    const found = categories.find((c) => c.id.toString() === catId);
    return found ? found.name : "Chưa phân loại";
  };

  const importHistory = [
    {
      id: "NH00124",
      status: "Đã nhận hàng",
      value: "25.000.000",
      branch: "Chi nhánh Cần Thơ",
      createdAt: "10/02/2026",
      updatedAt: "11/02/2026",
    },
    {
      id: "NH00115",
      status: "Chờ nhận hàng",
      value: "45.000.000",
      branch: "Chi nhánh Sóc Trăng",
      createdAt: "05/02/2026",
      updatedAt: "05/02/2026",
    },
  ];

  if (isLoading)
    return (
      <div className="flex h-screen items-center justify-center text-sm text-gray-500">
        Đang tải dữ liệu...
      </div>
    );

  return (
    <form onSubmit={handleSubmit(onSave)} className="space-y-4 pb-10">
      <div className="flex items-center gap-4 mb-2">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => router.back()}
          className="h-8 w-8 text-slate-400 hover:text-emerald-600 transition-colors"
        >
          <ChevronLeft size={20} />
        </Button>
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <h1 className="text-[18px] font-black text-slate-800 uppercase tracking-tight">
              Chi tiết nhà cung cấp
            </h1>
            <span className="text-[10px] font-bold px-2 py-0.5 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded uppercase">
              #{supplierData.taxCode || supplierId}
            </span>
          </div>
          <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest flex items-center gap-1">
            <Warehouse size={12} /> Hệ thống quản lý nguồn cung ứng AgriShrimp
          </p>
        </div>
        <div className="ms-auto flex gap-2">
          <Button
            type="submit"
            disabled={isSaving}
            className="h-8 text-[11px] font-bold bg-emerald-600 hover:bg-emerald-700 uppercase"
          >
            <Save size={14} className="mr-1.5" />{" "}
            {isSaving ? "Đang lưu..." : "Lưu thay đổi"}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* CỘT TRÁI: THÔNG TIN CHUNG */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white border border-[#dcdcdc] rounded-[4px] shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-50 flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-600 mb-3 border-2 border-emerald-100">
                <Warehouse size={32} />
              </div>

              <div className="w-full mb-1 px-2">
                <Input
                  {...register("name")}
                  className="text-[15px] font-black text-slate-800 uppercase text-center border-none shadow-none focus-visible:ring-0 p-0 h-auto bg-transparent placeholder:text-slate-300"
                  placeholder="TÊN NHÀ CUNG CẤP"
                />
                {errors.name && (
                  <p className="text-[10px] text-red-500">
                    {errors.name.message}
                  </p>
                )}
              </div>

              <p className="text-[11px] text-slate-400 font-bold uppercase">
                {getSelectedCategoryName()}
              </p>

              <div className="mt-4 grid grid-cols-2 gap-2 w-full">
                <div className="bg-slate-50 p-2 rounded text-center">
                  <p className="text-[9px] font-bold text-slate-400 uppercase mb-0.5">
                    Nợ hiện tại
                  </p>
                  <p className="text-[13px] font-black text-rose-600">
                    {new Intl.NumberFormat("vi-VN", {
                      style: "currency",
                      currency: "VND",
                    }).format(0)}
                  </p>
                </div>
                <div className="bg-slate-50 p-2 rounded text-center">
                  <p className="text-[9px] font-bold text-slate-400 uppercase mb-0.5">
                    Trạng thái
                  </p>
                  <p
                    className={cn(
                      "text-[10px] font-bold uppercase",
                      supplierData.status === "active"
                        ? "text-emerald-600"
                        : "text-rose-500",
                    )}
                  >
                    {supplierData.status === "active"
                      ? "Đang giao dịch"
                      : "Tạm ngừng"}
                  </p>
                </div>
              </div>
            </div>

            <div className="p-4 space-y-3">
              <div className="flex items-start gap-3">
                <Phone size={14} className="text-slate-300 mt-2" />
                <div className="flex flex-col w-full">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">
                    Điện thoại
                  </span>
                  <Input
                    {...register("phone")}
                    className="h-7 p-0 border-none shadow-none font-bold text-[13px] text-slate-700 focus-visible:ring-0"
                  />
                  {errors.phone && (
                    <p className="text-[10px] text-red-500">
                      {errors.phone.message}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Mail size={14} className="text-slate-300 mt-2" />
                <div className="flex flex-col w-full">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">
                    Email
                  </span>
                  <Input
                    {...register("email")}
                    className="h-7 p-0 border-none shadow-none font-bold text-[13px] text-slate-700 focus-visible:ring-0"
                  />
                </div>
              </div>
              <div className="flex items-start gap-3">
                <FileText size={14} className="text-slate-300 mt-2" />
                <div className="flex flex-col w-full">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">
                    Mã số thuế
                  </span>
                  <Input
                    {...register("taxCode")}
                    className="h-7 p-0 border-none shadow-none font-bold text-[13px] text-slate-700 font-mono focus-visible:ring-0"
                  />
                </div>
              </div>
              <div className="flex items-start gap-3">
                <MapPin size={14} className="text-slate-300 mt-2" />
                <div className="flex flex-col w-full">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">
                    Địa chỉ chính
                  </span>
                  <Textarea
                    {...register("addressDetail")}
                    className="min-h-[40px] p-0 border-none shadow-none font-medium text-[12px] text-slate-600 focus-visible:ring-0 resize-none"
                  />
                </div>
              </div>

              {/* Select Nhóm hàng */}
              <div className="flex items-start gap-3 pt-3 border-t border-dashed">
                <Warehouse size={14} className="text-slate-300 mt-2" />
                <div className="flex flex-col w-full">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">
                    Nhóm hàng
                  </span>
                  <Controller
                    name="category"
                    control={control}
                    render={({ field }) => (
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <SelectTrigger className="h-7 p-0 border-none shadow-none font-bold text-[13px] text-emerald-600 focus:ring-0">
                          <SelectValue placeholder="Chưa phân loại" />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map((cat) => (
                            <SelectItem key={cat.id} value={cat.id.toString()}>
                              {cat.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* CỘT PHẢI: TABS CHI TIẾT */}
        <div className="lg:col-span-8">
          <Tabs defaultValue="info" className="w-full">
            <TabsList className="bg-white border border-[#dcdcdc] rounded-[4px] p-1 w-full flex justify-start gap-1 h-auto shadow-sm">
              <TabsTrigger
                value="info"
                className="text-[11px] font-bold uppercase py-2 px-4 rounded-[3px] data-[state=active]:bg-emerald-600 data-[state=active]:text-white"
              >
                <Info size={14} className="mr-1.5" /> Thông tin chi tiết
              </TabsTrigger>
              <TabsTrigger
                value="history"
                className="text-[11px] font-bold uppercase py-2 px-4 rounded-[3px] data-[state=active]:bg-emerald-600 data-[state=active]:text-white"
              >
                <History size={14} className="mr-1.5" /> Lịch sử nhập hàng
              </TabsTrigger>
            </TabsList>

            <TabsContent value="info" className="space-y-4 mt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Trạng thái vận hành */}
                <div className="bg-white border border-[#dcdcdc] p-6 rounded-none shadow-sm">
                  <Label className="text-[11px] font-black text-slate-700 uppercase block mb-5 tracking-widest border-b pb-3">
                    Trạng thái vận hành
                  </Label>
                  <Controller
                    name="status"
                    control={control}
                    render={({ field }) => (
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <SelectTrigger className="h-[38px] text-[13px] border-[#ccc] rounded-none font-black text-emerald-600 shadow-none focus:ring-0">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="rounded-none">
                          <SelectItem
                            value="active"
                            className="text-emerald-600 font-bold uppercase tracking-tighter"
                          >
                            ĐANG GIAO DỊCH
                          </SelectItem>
                          <SelectItem
                            value="inactive"
                            className="text-rose-600 font-bold uppercase tracking-tighter"
                          >
                            TẠM NGỪNG
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>

                {/* Ghi chú */}
                <div className="bg-white border border-[#dcdcdc] p-6 rounded-none shadow-sm">
                  <Label className="text-[11px] font-black text-slate-700 uppercase block mb-4 tracking-widest">
                    Ghi chú nghiệp vụ
                  </Label>
                  <Textarea
                    {...register("note")}
                    placeholder="Nhập các lưu ý quan trọng..."
                    className="min-h-[100px] text-[13px] border-[#ccc] rounded-none shadow-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Thông tin tài chính */}
              <div className="bg-white border border-[#dcdcdc] rounded-[4px] shadow-sm p-4">
                <h3 className="text-[12px] font-black text-slate-700 uppercase flex items-center gap-2 mb-4 border-b pb-2">
                  <Plus size={14} className="text-blue-500" /> Cấu hình tài
                  chính
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <Label className="text-[10px] font-bold text-slate-500 uppercase">
                      Chu kỳ thanh toán
                    </Label>
                    <Controller
                      name="paymentTerms"
                      control={control}
                      render={({ field }) => (
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                        >
                          <SelectTrigger className="h-[30px] text-[12px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="immediate">
                              Thanh toán ngay
                            </SelectItem>
                            <SelectItem value="net30">
                              Công nợ 30 ngày
                            </SelectItem>
                            <SelectItem value="net15">
                              Công nợ 15 ngày
                            </SelectItem>
                            <SelectItem value="deferred">
                              Gối đầu đơn hàng
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[10px] font-bold text-slate-500 uppercase">
                      Hạn mức nợ
                    </Label>
                    <Input
                      {...register("creditLimit")}
                      type="number"
                      className="h-[30px] text-[12px]"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[10px] font-bold text-slate-500 uppercase">
                      Chiết khấu (%)
                    </Label>
                    <Input
                      {...register("discount")}
                      type="number"
                      className="h-[30px] text-[12px]"
                    />
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="history" className="mt-4">
              <div className="bg-white border border-[#dcdcdc] rounded-[4px] shadow-sm overflow-hidden">
                <div className="px-4 py-3 border-b border-slate-50 flex justify-between items-center bg-[#fcfcfc]">
                  <h3 className="text-[12px] font-black text-slate-700 uppercase flex items-center gap-2">
                    <History size={14} className="text-emerald-600" /> Lịch sử
                    nhập hàng
                  </h3>
                </div>
                <div className="p-0">
                  <Table className="table-custom border-collapse">
                    <TableHeader>
                      <TableRow className="bg-slate-50 border-b border-slate-100">
                        <TableHead className="text-[10px] font-bold uppercase py-3 pl-4">
                          Mã đơn nhập
                        </TableHead>
                        <TableHead className="text-[10px] font-bold uppercase py-3">
                          Trạng thái
                        </TableHead>
                        <TableHead className="text-[10px] font-bold uppercase py-3 text-right">
                          Giá trị đơn
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {importHistory.map((item) => (
                        <TableRow
                          key={item.id}
                          className="border-b border-slate-50 hover:bg-emerald-50/20"
                        >
                          <TableCell className="text-[12px] font-black text-emerald-600 pl-4">
                            #{item.id}
                          </TableCell>
                          <TableCell>
                            <span className="text-[9px] font-bold border px-1 rounded">
                              {item.status}
                            </span>
                          </TableCell>
                          <TableCell className="text-[12px] font-black text-slate-800 text-right">
                            {item.value}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </form>
  );
}
