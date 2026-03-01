"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { SupplierSchema, SupplierFormValues } from "@/app/types/admin.schema";
import { supplierService } from "@/app/services/supplier.service";

import {
    ChevronLeft, Phone, Mail, MapPin, History, Info, Save, FileText, Warehouse,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { cn } from "@/lib/utils"; // Nhớ import cn để làm màu trạng thái

// Định nghĩa Type cho lịch sử nhập hàng
interface ImportHistoryItem {
    id: number;
    code: string;
    status: string;
    totalAmount: number;
    createdAt: string;
}

export default function SupplierDetailPage() {
    const router = useRouter();
    const params = useParams();
    const supplierId = Number(params.id);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    // State lưu lịch sử nhập hàng thật từ DB
    const [importHistory, setImportHistory] = useState<ImportHistoryItem[]>([]);

    const { control, register, handleSubmit, reset, watch, formState: { errors } } = useForm<SupplierFormValues>({
        resolver: zodResolver(SupplierSchema),
    });

    const supplierData = watch();

    useEffect(() => {
        const initData = async () => {
            if (!supplierId) return;
            try {
                // Gọi song song 2 API: Lấy chi tiết NCC và Lấy Lịch sử nhập hàng
                const [supplierInfo, historyData] = await Promise.all([
                    supplierService.getById(supplierId),
                    supplierService.getImportHistory(supplierId)
                ]);

                if (supplierInfo) {
                    reset({
                        ...supplierInfo,
                        status: supplierInfo.status?.toLowerCase() as SupplierFormValues["status"],
                    });
                }

                // Set data lịch sử vào state
                setImportHistory(historyData);

            } catch (error) {
                toast.error("Không tải được dữ liệu");
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
            window.dispatchEvent(new Event("supplierUpdated"));
            router.push("/admin/suppliers");
        } catch (error) {
            const message = error instanceof Error ? error.message : "Lỗi khi cập nhật";
            toast.error(message);
        } finally {
            setIsSaving(false);
        }
    };

    const onError = (errors: any) => {
        toast.error("Vui lòng kiểm tra lại! Có trường bắt buộc chưa được điền đúng.");
    };

    // Hàm format Tiền VNĐ
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
    };

    // Hàm format Ngày tháng
    const formatDate = (dateString: string) => {
        if (!dateString) return "---";
        const date = new Date(dateString);
        return date.toLocaleDateString('vi-VN') + " " + date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    };

    // Hàm mapping màu và chữ cho Trạng thái Phiếu nhập
    const getNoteStatus = (status: string) => {
        switch (status) {
            case "COMPLETED": return { label: "ĐÃ HOÀN THÀNH", class: "bg-emerald-50 text-emerald-600 border-emerald-200" };
            case "PENDING": return { label: "ĐANG XỬ LÝ", class: "bg-orange-50 text-orange-600 border-orange-200" };
            case "CANCELLED": return { label: "ĐÃ HỦY", class: "bg-rose-50 text-rose-600 border-rose-200" };
            default: return { label: status, class: "bg-slate-50 text-slate-600 border-slate-200" };
        }
    };

    if (isLoading) return (
        <div className="flex h-screen flex-col items-center justify-center gap-4 text-sm text-gray-500">
            <div className="w-8 h-8 animate-spin rounded-full border-4 border-emerald-600 border-t-transparent"></div>
            <p className="font-bold uppercase tracking-widest text-slate-400">Đang tải dữ liệu...</p>
        </div>
    );

    return (
        <form onSubmit={handleSubmit(onSave, onError)} className="space-y-4 pb-10">
            <div className="flex items-center gap-4 mb-2">
                <Button type="button" variant="ghost" size="icon" onClick={() => router.back()} className="h-8 w-8 text-slate-400 hover:text-emerald-600 transition-colors">
                    <ChevronLeft size={20} />
                </Button>
                <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                        <h1 className="text-[18px] font-black text-slate-800 uppercase tracking-tight">Chi tiết nhà cung cấp</h1>
                        <span className="text-[10px] font-bold px-2 py-0.5 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded uppercase">#{supplierData.taxCode || supplierId}</span>
                    </div>
                    <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest flex items-center gap-1">
                        <Warehouse size={12} /> Hệ thống quản lý nguồn cung ứng AgriShrimp
                    </p>
                </div>
                <div className="ms-auto flex gap-2">
                    <Button type="submit" disabled={isSaving} className="h-8 text-[11px] font-bold bg-emerald-600 hover:bg-emerald-700 uppercase">
                        <Save size={14} className="mr-1.5" /> {isSaving ? "Đang lưu..." : "Lưu thay đổi"}
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                <div className="lg:col-span-4 space-y-4">
                    <div className="bg-white border border-[#dcdcdc] rounded-[4px] shadow-sm overflow-hidden">
                        <div className="p-5 border-b border-slate-50 flex flex-col items-center text-center">
                            <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-600 mb-3 border-2 border-emerald-100">
                                <Warehouse size={32} />
                            </div>

                            <div className="w-full mb-1 px-2">
                                <Input {...register("name")} className="text-[15px] font-black text-slate-800 uppercase text-center border-none shadow-none focus-visible:ring-0 p-0 h-auto bg-transparent placeholder:text-slate-300" placeholder="TÊN NHÀ CUNG CẤP" />
                                {errors.name && <p className="text-[10px] text-red-500 mt-1">{errors.name.message}</p>}
                            </div>
                        </div>

                        <div className="p-4 space-y-3">
                            <div className="flex items-start gap-3">
                                <Phone size={14} className="text-slate-300 mt-2" />
                                <div className="flex flex-col w-full">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase">Điện thoại</span>
                                    <Input {...register("phone")} className="h-7 p-0 border-none shadow-none font-bold text-[13px] text-slate-700 focus-visible:ring-0" />
                                    {errors.phone && <p className="text-[10px] text-red-500">{errors.phone.message}</p>}
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <Mail size={14} className="text-slate-300 mt-2" />
                                <div className="flex flex-col w-full">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase">Email</span>
                                    <Input {...register("email")} className="h-7 p-0 border-none shadow-none font-bold text-[13px] text-slate-700 focus-visible:ring-0" />
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <FileText size={14} className="text-slate-300 mt-2" />
                                <div className="flex flex-col w-full">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase">Mã số thuế</span>
                                    <Input {...register("taxCode")} className="h-7 p-0 border-none shadow-none font-bold text-[13px] text-slate-700 font-mono focus-visible:ring-0" />
                                    {errors.taxCode && <p className="text-[10px] text-red-500">{errors.taxCode.message}</p>}
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <MapPin size={14} className="text-slate-300 mt-2" />
                                <div className="flex flex-col w-full">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase">Địa chỉ chính</span>
                                    <Textarea {...register("addressDetail")} className="min-h-[40px] p-0 border-none shadow-none font-medium text-[12px] text-slate-600 focus-visible:ring-0 resize-none" />
                                    {errors.addressDetail && <p className="text-[10px] text-red-500">{errors.addressDetail.message}</p>}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="lg:col-span-8">
                    <Tabs defaultValue="info" className="w-full">
                        <TabsList className="bg-white border border-[#dcdcdc] rounded-[4px] p-1 w-full flex justify-start gap-1 h-auto shadow-sm">
                            <TabsTrigger value="info" className="text-[11px] font-bold uppercase py-2 px-4 rounded-[3px] data-[state=active]:bg-emerald-600 data-[state=active]:text-white">
                                <Info size={14} className="mr-1.5" /> Thông tin chi tiết
                            </TabsTrigger>
                            <TabsTrigger value="history" className="text-[11px] font-bold uppercase py-2 px-4 rounded-[3px] data-[state=active]:bg-emerald-600 data-[state=active]:text-white">
                                <History size={14} className="mr-1.5" /> Lịch sử nhập hàng ({importHistory.length})
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value="info" className="space-y-4 mt-4">
                            <div className="bg-white border border-[#dcdcdc] p-6 rounded-none shadow-sm">
                                <Label className="text-[11px] font-black text-slate-700 uppercase block mb-5 tracking-widest border-b pb-3">Trạng thái vận hành</Label>
                                <Controller name="status" control={control} render={({ field }) => (
                                    <Select onValueChange={field.onChange} value={field.value}>
                                        <SelectTrigger className="h-[38px] text-[13px] border-[#ccc] rounded-none font-black text-emerald-600 shadow-none focus:ring-0">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className="rounded-none">
                                            <SelectItem value="active" className="text-emerald-600 font-bold uppercase tracking-tighter">ĐANG GIAO DỊCH</SelectItem>
                                            <SelectItem value="inactive" className="text-rose-600 font-bold uppercase tracking-tighter">TẠM NGỪNG</SelectItem>
                                        </SelectContent>
                                    </Select>
                                )} />
                            </div>
                        </TabsContent>

                        <TabsContent value="history" className="mt-4">
                            <div className="bg-white border border-[#dcdcdc] rounded-[4px] shadow-sm overflow-hidden">
                                <div className="px-4 py-3 border-b border-slate-50 flex justify-between items-center bg-[#fcfcfc]">
                                    <h3 className="text-[12px] font-black text-slate-700 uppercase flex items-center gap-2">
                                        <History size={14} className="text-emerald-600" /> Lịch sử phiếu nhập
                                    </h3>
                                </div>
                                <div className="p-0">
                                    <Table className="table-custom border-collapse">
                                        <TableHeader>
                                            <TableRow className="bg-slate-50 border-b border-slate-100">
                                                <TableHead className="text-[10px] font-bold uppercase py-3 pl-4">Mã Phiếu</TableHead>
                                                <TableHead className="text-[10px] font-bold uppercase py-3">Ngày tạo</TableHead>
                                                <TableHead className="text-[10px] font-bold uppercase py-3">Trạng thái</TableHead>
                                                <TableHead className="text-[10px] font-bold uppercase py-3 text-right pr-4">Tổng giá trị</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {importHistory.length > 0 ? importHistory.map((item) => {
                                                const sInfo = getNoteStatus(item.status);
                                                return (
                                                    <TableRow key={item.id} className="border-b border-slate-50 hover:bg-emerald-50/20">
                                                        <TableCell className="text-[12px] font-black text-emerald-600 pl-4">{item.code}</TableCell>
                                                        <TableCell className="text-[11px] text-slate-500 font-medium">{formatDate(item.createdAt)}</TableCell>
                                                        <TableCell>
                                                            <span className={cn("text-[9px] font-bold border px-1.5 py-0.5 rounded", sInfo.class)}>
                                                                {sInfo.label}
                                                            </span>
                                                        </TableCell>
                                                        <TableCell className="text-[12px] font-black text-slate-800 text-right pr-4">
                                                            {formatCurrency(item.totalAmount)}
                                                        </TableCell>
                                                    </TableRow>
                                                )
                                            }) : (
                                                <TableRow>
                                                    <TableCell colSpan={4} className="text-center py-8 text-[12px] text-slate-400 font-bold uppercase tracking-widest">
                                                        Chưa có lịch sử nhập hàng
                                                    </TableCell>
                                                </TableRow>
                                            )}
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