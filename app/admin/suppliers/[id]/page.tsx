"use client";

import React, { useEffect, useMemo, useState } from "react";
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
    Save,
    FileText,
    Warehouse,
    Search,
    ShieldCheck,
    Star,
    Gauge,
    PencilLine,
    Check,
    CalendarClock,
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

interface ImportHistoryItem {
    id: number;
    code: string;
    status: string;
    totalAmount: number;
    createdAt: string;
}

interface SupplierMeta {
    createdAt?: string;
    updatedAt?: string;
}

export default function SupplierDetailPage() {
    const router = useRouter();
    const params = useParams();
    const supplierId = Number(params.id);

    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isContactEdit, setIsContactEdit] = useState(false);
    const [supplierMeta, setSupplierMeta] = useState<SupplierMeta>({});
    const [importHistory, setImportHistory] = useState<ImportHistoryItem[]>([]);

    const [historyKeyword, setHistoryKeyword] = useState("");
    const [historyStatus, setHistoryStatus] = useState("all");
    const [fromDate, setFromDate] = useState("");
    const [toDate, setToDate] = useState("");

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

    useEffect(() => {
        const initData = async () => {
            if (!supplierId) return;

            try {
                const [supplierInfo, historyData] = await Promise.all([
                    supplierService.getById(supplierId),
                    supplierService.getImportHistory(supplierId),
                ]);

                if (supplierInfo) {
                    reset({
                        ...supplierInfo,
                        status: supplierInfo.status?.toLowerCase() as SupplierFormValues["status"],
                    });

                    setSupplierMeta({
                        createdAt: (supplierInfo as any)?.createdAt,
                        updatedAt: (supplierInfo as any)?.updatedAt,
                    });
                }

                setImportHistory(Array.isArray(historyData) ? historyData : []);
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

    const onError = () => {
        toast.error("Vui lòng kiểm tra lại! Có trường bắt buộc chưa được điền đúng.");
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(amount || 0);
    };

    const formatDate = (dateString?: string) => {
        if (!dateString) return "---";
        const date = new Date(dateString);
        if (Number.isNaN(date.getTime())) return "---";
        return `${date.toLocaleDateString("vi-VN")} ${date.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}`;
    };

    const getNoteStatus = (status: string) => {
        switch (status) {
            case "COMPLETED":
                return { label: "ĐÃ HOÀN THÀNH", class: "bg-emerald-50 text-emerald-600 border-emerald-200" };
            case "PENDING":
                return { label: "ĐANG XỬ LÝ", class: "bg-orange-50 text-orange-600 border-orange-200" };
            case "CANCELLED":
                return { label: "ĐÃ HỦY", class: "bg-rose-50 text-rose-600 border-rose-200" };
            default:
                return { label: status || "KHÔNG XÁC ĐỊNH", class: "bg-slate-50 text-slate-600 border-slate-200" };
        }
    };

    const latestImport = useMemo(() => {
        if (importHistory.length === 0) return null;
        return [...importHistory].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
    }, [importHistory]);

    const totalImportValue = useMemo(
        () => importHistory.reduce((sum, item) => sum + (item.totalAmount || 0), 0),
        [importHistory],
    );

    const cancelledRate = useMemo(() => {
        if (importHistory.length === 0) return 0;
        const cancelledCount = importHistory.filter((item) => item.status === "CANCELLED").length;
        return cancelledCount / importHistory.length;
    }, [importHistory]);

    const priorityBadge = useMemo(() => {
        if (totalImportValue >= 1_000_000_000 || importHistory.length >= 20) {
            return { label: "Ưu tiên cao", className: "bg-blue-50 text-blue-700 border-blue-200" };
        }
        if (totalImportValue >= 300_000_000 || importHistory.length >= 8) {
            return { label: "Ưu tiên trung bình", className: "bg-amber-50 text-amber-700 border-amber-200" };
        }
        return { label: "Ưu tiên cơ bản", className: "bg-slate-100 text-slate-600 border-slate-200" };
    }, [totalImportValue, importHistory.length]);

    const reliabilityBadge = useMemo(() => {
        if (importHistory.length === 0) {
            return { label: "Cần theo dõi", className: "bg-slate-100 text-slate-600 border-slate-200" };
        }
        if (cancelledRate <= 0.1) {
            return { label: "Độ tin cậy tốt", className: "bg-emerald-50 text-emerald-700 border-emerald-200" };
        }
        if (cancelledRate <= 0.25) {
            return { label: "Độ tin cậy ổn định", className: "bg-amber-50 text-amber-700 border-amber-200" };
        }
        return { label: "Độ tin cậy thấp", className: "bg-rose-50 text-rose-700 border-rose-200" };
    }, [cancelledRate, importHistory.length]);

    const lastOperationalUpdate = supplierMeta.updatedAt || latestImport?.createdAt || supplierMeta.createdAt;

    const filteredHistory = useMemo(() => {
        return importHistory.filter((item) => {
            const keywordOk = item.code?.toLowerCase().includes(historyKeyword.toLowerCase().trim());
            const statusOk = historyStatus === "all" || item.status === historyStatus;

            const itemTime = new Date(item.createdAt).getTime();
            const fromTime = fromDate ? new Date(`${fromDate}T00:00:00`).getTime() : null;
            const toTime = toDate ? new Date(`${toDate}T23:59:59`).getTime() : null;

            const fromOk = fromTime == null || itemTime >= fromTime;
            const toOk = toTime == null || itemTime <= toTime;

            return keywordOk && statusOk && fromOk && toOk;
        });
    }, [importHistory, historyKeyword, historyStatus, fromDate, toDate]);

    const timelineEvents = useMemo(
        () => [
            {
                id: "created",
                title: "Khởi tạo nhà cung cấp",
                at: supplierMeta.createdAt,
                detail: "Hồ sơ nhà cung cấp được tạo trong hệ thống.",
            },
            {
                id: "updated",
                title: "Cập nhật hồ sơ gần nhất",
                at: lastOperationalUpdate,
                detail: "Dữ liệu vận hành được cập nhật gần nhất.",
            },
            {
                id: "latest-import",
                title: "Phiếu nhập gần nhất",
                at: latestImport?.createdAt,
                detail: latestImport ? `${latestImport.code} · ${formatCurrency(latestImport.totalAmount)}` : "Chưa có phát sinh phiếu nhập",
            },
        ],
        [supplierMeta.createdAt, lastOperationalUpdate, latestImport],
    );

    if (isLoading) {
        return (
            <div className="flex h-screen flex-col items-center justify-center gap-4 text-sm text-gray-500">
                <div className="w-8 h-8 animate-spin rounded-full border-4 border-emerald-600 border-t-transparent"></div>
                <p className="font-bold uppercase tracking-widest text-slate-400">Đang tải dữ liệu...</p>
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit(onSave, onError)} className="space-y-4 pb-10">
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
                        <h1 className="text-[18px] font-black text-slate-800 uppercase tracking-tight">CHI TIẾT NHÀ CUNG CẤP</h1>
                        <span className="text-[10px] font-bold px-2 py-0.5 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded uppercase">
                            #{supplierData.taxCode || supplierId}
                        </span>
                    </div>
                    <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest flex items-center gap-1">
                        <Warehouse size={12} /> Trung tâm theo dõi hồ sơ và hiệu suất đối tác
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
                        <div className="p-5 border-b border-slate-100 flex flex-col items-center text-center">
                            <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-600 mb-3 border-2 border-emerald-100">
                                <Warehouse size={32} />
                            </div>
                            <p className="text-[15px] font-black text-slate-800 uppercase leading-tight line-clamp-2">{supplierData.name || "---"}</p>
                            <p className="text-[10px] mt-2 text-slate-400 font-mono font-bold">MST: {supplierData.taxCode || "---"}</p>
                        </div>

                        <div className="p-4 grid grid-cols-2 gap-2">
                            <div className="rounded-[4px] border border-slate-200 bg-slate-50 px-2 py-2">
                                <p className="text-[9px] uppercase text-slate-400 font-bold tracking-wide">Ngày tạo</p>
                                <p className="text-[11px] font-bold text-slate-700 mt-1">{formatDate(supplierMeta.createdAt)}</p>
                            </div>
                            <div className="rounded-[4px] border border-slate-200 bg-slate-50 px-2 py-2">
                                <p className="text-[9px] uppercase text-slate-400 font-bold tracking-wide">Cập nhật</p>
                                <p className="text-[11px] font-bold text-slate-700 mt-1">{formatDate(lastOperationalUpdate)}</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white border border-[#dcdcdc] rounded-[4px] shadow-sm overflow-hidden">
                        <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                            <h3 className="text-[11px] font-black uppercase tracking-wide text-slate-700">Thông tin liên hệ</h3>
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => setIsContactEdit((prev) => !prev)}
                                className="h-7 text-[10px] font-bold uppercase"
                            >
                                {isContactEdit ? <Check size={12} className="mr-1" /> : <PencilLine size={12} className="mr-1" />}
                                {isContactEdit ? "Xong" : "Chỉnh sửa"}
                            </Button>
                        </div>

                        <div className="p-4 space-y-4">
                            <div className="flex items-start gap-3">
                                <FileText size={14} className="text-slate-300 mt-1.5" />
                                <div className="w-full">
                                    <p className="text-[10px] uppercase text-slate-400 font-bold">Người liên hệ</p>
                                    {isContactEdit ? (
                                        <>
                                            <Input {...register("contactName")} className="h-8 mt-1 text-[12px]" />
                                            {errors.contactName && <p className="text-[10px] text-red-500 mt-1">{errors.contactName.message}</p>}
                                        </>
                                    ) : (
                                        <p className="text-[12px] font-bold text-slate-700 mt-1">{supplierData.contactName || "---"}</p>
                                    )}
                                </div>
                            </div>

                            <div className="flex items-start gap-3">
                                <Phone size={14} className="text-slate-300 mt-1.5" />
                                <div className="w-full">
                                    <p className="text-[10px] uppercase text-slate-400 font-bold">Điện thoại</p>
                                    {isContactEdit ? (
                                        <>
                                            <Input {...register("phone")} className="h-8 mt-1 text-[12px]" />
                                            {errors.phone && <p className="text-[10px] text-red-500 mt-1">{errors.phone.message}</p>}
                                        </>
                                    ) : (
                                        <p className="text-[12px] font-bold text-slate-700 mt-1">{supplierData.phone || "---"}</p>
                                    )}
                                </div>
                            </div>

                            <div className="flex items-start gap-3">
                                <Mail size={14} className="text-slate-300 mt-1.5" />
                                <div className="w-full">
                                    <p className="text-[10px] uppercase text-slate-400 font-bold">Email</p>
                                    {isContactEdit ? (
                                        <>
                                            <Input {...register("email")} className="h-8 mt-1 text-[12px]" />
                                            {errors.email && <p className="text-[10px] text-red-500 mt-1">{errors.email.message}</p>}
                                        </>
                                    ) : (
                                        <p className="text-[12px] font-semibold text-slate-700 mt-1 break-all">{supplierData.email || "---"}</p>
                                    )}
                                </div>
                            </div>

                            <div className="flex items-start gap-3">
                                <MapPin size={14} className="text-slate-300 mt-1.5" />
                                <div className="w-full">
                                    <p className="text-[10px] uppercase text-slate-400 font-bold">Địa chỉ</p>
                                    {isContactEdit ? (
                                        <>
                                            <Textarea {...register("addressDetail")} className="mt-1 text-[12px] min-h-[72px]" />
                                            {errors.addressDetail && <p className="text-[10px] text-red-500 mt-1">{errors.addressDetail.message}</p>}
                                        </>
                                    ) : (
                                        <p className="text-[12px] text-slate-700 mt-1 leading-relaxed">{supplierData.addressDetail || "---"}</p>
                                    )}
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
                                <History size={14} className="mr-1.5" /> Lịch sử nhập hàng ({filteredHistory.length})
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value="info" className="space-y-4 mt-4">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                <div className="bg-white border border-[#dcdcdc] rounded-[4px] p-4 shadow-sm">
                                    <p className="text-[10px] font-bold uppercase text-slate-400">Tổng số phiếu nhập</p>
                                    <p className="text-[22px] mt-1 font-black text-slate-800">{importHistory.length}</p>
                                </div>
                                <div className="bg-white border border-[#dcdcdc] rounded-[4px] p-4 shadow-sm">
                                    <p className="text-[10px] font-bold uppercase text-slate-400">Tổng giá trị nhập</p>
                                    <p className="text-[18px] mt-1 font-black text-emerald-700 line-clamp-1">{formatCurrency(totalImportValue)}</p>
                                </div>
                                <div className="bg-white border border-[#dcdcdc] rounded-[4px] p-4 shadow-sm">
                                    <p className="text-[10px] font-bold uppercase text-slate-400">Lần nhập gần nhất</p>
                                    <p className="text-[12px] mt-2 font-bold text-slate-700">{formatDate(latestImport?.createdAt)}</p>
                                    {latestImport?.code && <p className="text-[10px] mt-1 text-slate-400 font-bold">{latestImport.code}</p>}
                                </div>
                            </div>

                            <div className="bg-white border border-[#dcdcdc] rounded-[4px] shadow-sm p-5">
                                <Label className="text-[11px] font-black text-slate-700 uppercase block mb-4 tracking-widest border-b pb-3">Trạng thái vận hành</Label>

                                <div className="flex flex-wrap gap-2 mb-4">
                                    <span className={cn("inline-flex items-center gap-1 text-[10px] font-black uppercase border px-2 py-1 rounded", "bg-slate-50 text-slate-700 border-slate-200")}>
                                        <CalendarClock size={12} /> Cập nhật: {formatDate(lastOperationalUpdate)}
                                    </span>
                                    <span className={cn("inline-flex items-center gap-1 text-[10px] font-black uppercase border px-2 py-1 rounded", priorityBadge.className)}>
                                        <Star size={12} /> {priorityBadge.label}
                                    </span>
                                    <span className={cn("inline-flex items-center gap-1 text-[10px] font-black uppercase border px-2 py-1 rounded", reliabilityBadge.className)}>
                                        <ShieldCheck size={12} /> {reliabilityBadge.label}
                                    </span>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <Label className="text-[10px] font-bold text-slate-500 uppercase mb-2 block">Trạng thái NCC</Label>
                                        <Controller
                                            name="status"
                                            control={control}
                                            render={({ field }) => (
                                                <Select onValueChange={field.onChange} value={field.value}>
                                                    <SelectTrigger className="h-[38px] text-[13px] border-[#ccc] font-black shadow-none focus:ring-0">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="active" className="text-emerald-600 font-bold uppercase tracking-tighter">ĐANG GIAO DỊCH</SelectItem>
                                                        <SelectItem value="inactive" className="text-rose-600 font-bold uppercase tracking-tighter">TẠM NGỪNG</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            )}
                                        />
                                    </div>
                                    <div className="rounded-[4px] border border-slate-200 bg-slate-50 px-3 py-2">
                                        <p className="text-[10px] uppercase text-slate-400 font-bold">Chỉ số rủi ro</p>
                                        <p className="mt-1 text-[12px] font-black text-slate-700 flex items-center gap-1">
                                            <Gauge size={13} className="text-emerald-600" />
                                            {Math.round(cancelledRate * 100)}% phiếu bị hủy trên tổng giao dịch
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white border border-[#dcdcdc] rounded-[4px] shadow-sm p-5">
                                <Label className="text-[11px] font-black text-slate-700 uppercase block mb-4 tracking-widest border-b pb-3">Thông tin pháp nhân</Label>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <Label className="text-[10px] font-bold text-slate-500 uppercase mb-2 block">Tên nhà cung cấp</Label>
                                        <Input {...register("name")} className="h-[38px] text-[12px] font-bold uppercase" />
                                        {errors.name && <p className="text-[10px] text-red-500 mt-1">{errors.name.message}</p>}
                                    </div>
                                    <div>
                                        <Label className="text-[10px] font-bold text-slate-500 uppercase mb-2 block">Mã số thuế</Label>
                                        <Input {...register("taxCode")} className="h-[38px] text-[12px] font-bold font-mono" />
                                        {errors.taxCode && <p className="text-[10px] text-red-500 mt-1">{errors.taxCode.message}</p>}
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white border border-[#dcdcdc] rounded-[4px] shadow-sm p-5">
                                <Label className="text-[11px] font-black text-slate-700 uppercase block mb-4 tracking-widest border-b pb-3">Timeline hoạt động</Label>
                                <div className="space-y-4">
                                    {timelineEvents.map((event, index) => (
                                        <div key={event.id} className="relative pl-6">
                                            {index < timelineEvents.length - 1 && <span className="absolute left-[7px] top-4 h-[calc(100%+8px)] w-[1px] bg-slate-200" />}
                                            <span className="absolute left-0 top-1.5 h-4 w-4 rounded-full border-2 border-emerald-200 bg-emerald-50" />
                                            <p className="text-[12px] font-black text-slate-800 uppercase">{event.title}</p>
                                            <p className="text-[11px] text-slate-500 mt-0.5">{event.detail}</p>
                                            <p className="text-[10px] font-bold text-emerald-600 mt-1">{formatDate(event.at)}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </TabsContent>

                        <TabsContent value="history" className="mt-4">
                            <div className="bg-white border border-[#dcdcdc] rounded-[4px] shadow-sm overflow-hidden">
                                <div className="px-4 py-3 border-b border-slate-100 bg-[#fcfcfc]">
                                    <h3 className="text-[12px] font-black text-slate-700 uppercase flex items-center gap-2 mb-3">
                                        <History size={14} className="text-emerald-600" /> Lịch sử phiếu nhập
                                    </h3>

                                    <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
                                        <div className="relative md:col-span-2">
                                            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                            <Input
                                                value={historyKeyword}
                                                onChange={(e) => setHistoryKeyword(e.target.value)}
                                                placeholder="Tìm mã phiếu..."
                                                className="h-[34px] pl-9 text-[12px]"
                                            />
                                        </div>

                                        <Select value={historyStatus} onValueChange={setHistoryStatus}>
                                            <SelectTrigger className="h-[34px] text-[12px]">
                                                <SelectValue placeholder="Trạng thái phiếu" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">Tất cả trạng thái</SelectItem>
                                                <SelectItem value="COMPLETED">Đã hoàn thành</SelectItem>
                                                <SelectItem value="PENDING">Đang xử lý</SelectItem>
                                                <SelectItem value="CANCELLED">Đã hủy</SelectItem>
                                            </SelectContent>
                                        </Select>

                                        <Button
                                            type="button"
                                            variant="outline"
                                            className="h-[34px] text-[11px] font-bold uppercase"
                                            onClick={() => {
                                                setHistoryKeyword("");
                                                setHistoryStatus("all");
                                                setFromDate("");
                                                setToDate("");
                                            }}
                                        >
                                            Đặt lại lọc
                                        </Button>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
                                        <Input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className="h-[34px] text-[12px]" />
                                        <Input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} className="h-[34px] text-[12px]" />
                                    </div>
                                </div>

                                <div className="p-0">
                                    <Table className="table-custom border-collapse table-fixed min-w-[740px]">
                                        <colgroup>
                                            <col className="w-[180px]" />
                                            <col className="w-[190px]" />
                                            <col className="w-[160px]" />
                                            <col />
                                        </colgroup>
                                        <TableHeader>
                                            <TableRow className="bg-slate-50 border-b border-slate-100">
                                                <TableHead className="text-[10px] font-bold uppercase py-3 pl-4">Mã phiếu</TableHead>
                                                <TableHead className="text-[10px] font-bold uppercase py-3">Ngày tạo</TableHead>
                                                <TableHead className="text-[10px] font-bold uppercase py-3">Trạng thái</TableHead>
                                                <TableHead className="text-[10px] font-bold uppercase py-3 text-right pr-4">Tổng giá trị</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {filteredHistory.length > 0 ? (
                                                filteredHistory.map((item) => {
                                                    const statusInfo = getNoteStatus(item.status);
                                                    return (
                                                        <TableRow key={item.id} className="border-b border-slate-50 hover:bg-emerald-50/20">
                                                            <TableCell className="text-[12px] font-black text-emerald-600 pl-4">{item.code}</TableCell>
                                                            <TableCell className="text-[11px] text-slate-500 font-medium">{formatDate(item.createdAt)}</TableCell>
                                                            <TableCell>
                                                                <span className={cn("text-[9px] font-bold border px-1.5 py-0.5 rounded", statusInfo.class)}>
                                                                    {statusInfo.label}
                                                                </span>
                                                            </TableCell>
                                                            <TableCell className="text-[12px] font-black text-slate-800 text-right pr-4">
                                                                {formatCurrency(item.totalAmount)}
                                                            </TableCell>
                                                        </TableRow>
                                                    );
                                                })
                                            ) : (
                                                <TableRow>
                                                    <TableCell colSpan={4} className="text-center py-8 text-[12px] text-slate-400 font-bold uppercase tracking-widest">
                                                        Không có phiếu nhập phù hợp bộ lọc
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