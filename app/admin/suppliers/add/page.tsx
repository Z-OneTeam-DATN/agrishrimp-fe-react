"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AxiosError } from "axios";
import {
    Save, Search, CalendarIcon
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { AddSupplierSchema, SupplierFormValues } from "@/app/types/admin.schema";
import { supplierService } from "@/app/services/supplier.service";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format, parse } from "date-fns";
import { cn } from "@/lib/utils";

interface Province { id: string; name: string; full_name: string; }
interface ErrorResponse { message: string; }

const formatDateForInput = (dateStr?: string | null): string => {
    if (!dateStr) return "";
    const cleaned = dateStr.trim();
    if (!cleaned) return "";

    if (/^\d{4}-\d{2}-\d{2}$/.test(cleaned)) {
        return cleaned;
    }
    if (/^\d{4}-\d{2}-\d{2}T/.test(cleaned)) {
        return cleaned.substring(0, 10);
    }
    const slashMatch = cleaned.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/);
    if (slashMatch) {
        const day = slashMatch[1].padStart(2, "0");
        const month = slashMatch[2].padStart(2, "0");
        const year = slashMatch[3];
        return `${year}-${month}-${day}`;
    }

    try {
        const d = new Date(cleaned);
        if (!Number.isNaN(d.getTime())) {
            return d.toISOString().substring(0, 10);
        }
    } catch {
        // ignore
    }
    return "";
};

/**
 * Chuẩn hoá số điện thoại:
 * - Nếu là di động VN (03/05/07/08/09 + 8 số) → trả về 10 số chuẩn
 * - Nếu là số bàn (bắt đầu 02x, có dấu gạch/khoảng trắng/số nội bộ) → giữ nguyên
 * - Nếu không nhận ra → vẫn trả về raw để người dùng tự sửa
 */
const normalizePhone = (raw?: string | null): string => {
    if (!raw) return "";
    const trimmed = raw.trim();
    if (!trimmed) return "";

    // Lấy chỉ chữ số để thử nhận dạng di động
    const digits = trimmed.replace(/[^0-9]/g, "");
    if (!digits) return trimmed;

    // Bỏ prefix quốc tế 84 → 0
    const local = digits.startsWith("84") ? "0" + digits.slice(2) : digits;

    // Số di động VN: 10 chữ số bắt đầu 03/05/07/08/09 → chuẩn hoá
    if (/^(0)(3|5|7|8|9)[0-9]{8}$/.test(local)) {
        return local;
    }

    // Số bàn hoặc định dạng khác → giữ nguyên raw (ví dụ: "02703 962736-2")
    return trimmed;
};

export default function AddSupplierPage() {
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [provinces, setProvinces] = useState<Province[]>([]);
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [duplicateTaxCode, setDuplicateTaxCode] = useState<string | null>(null);
    const [duplicateName, setDuplicateName] = useState<string | null>(null);

    const DRAFT_KEY = "supplier-add-draft-v1";

    const { register, handleSubmit, control, watch, setValue, trigger, reset, formState: { errors } } = useForm<SupplierFormValues>({
        resolver: zodResolver(AddSupplierSchema),
        mode: "onChange",
        defaultValues: {
            status: "active",
            provinceId: "",
            issueDate: "",
            taxAuthority: "",
            mainBusinessSector: "",
            addressDetail: "",
        },
    });

    const watchedValues = watch();

    useEffect(() => {
        const fetchData = async () => {
            try {
                const provRes = await fetch("https://esgoo.net/api-tinhthanh/1/0.htm");
                const provData = await provRes.json();
                if (provData.error === 0) setProvinces(provData.data);
            } catch (error) {
                console.error("Lỗi fetch dữ liệu ban đầu:", error);
            }
        };
        fetchData();
    }, []);

    const detectProvince = (fullAddress: string) => {
        if (!fullAddress || provinces.length === 0) return "";
        const addressLower = fullAddress.toLowerCase();
        const foundProvince = provinces.find((p) => {
            const cleanName = p.name.toLowerCase().replace("tỉnh ", "").replace("thành phố ", "");
            return addressLower.includes(cleanName);
        });
        return foundProvince ? foundProvince.id : "";
    };


    const normalizeName = (value: string) => value.trim().toLowerCase().replace(/\s+/g, " ");
    const normalizeTaxCode = (value: string) => value.trim().replace(/\s+/g, "");

    const checkDuplicateSuppliers = useCallback(async (nameValue: string, taxCodeValue: string) => {
        const normalizedName = normalizeName(nameValue || "");
        const normalizedTax = normalizeTaxCode(taxCodeValue || "");

        if (!normalizedName && !normalizedTax) {
            setDuplicateName(null);
            setDuplicateTaxCode(null);
            return;
        }

        try {
            const lookupKeyword = normalizedTax || normalizedName;
            const data = await supplierService.getAll(lookupKeyword, undefined, 0, 50);
            const candidates = data?.content ?? [];

            const duplicateByTax = normalizedTax
                ? candidates.find((item) => normalizeTaxCode(item.taxCode || "") === normalizedTax)
                : null;

            const duplicateByName = normalizedName
                ? candidates.find((item) => normalizeName(item.name || "") === normalizedName)
                : null;

            setDuplicateTaxCode(duplicateByTax ? `MST đã tồn tại: ${duplicateByTax.name}` : null);
            setDuplicateName(duplicateByName ? `Tên nhà cung cấp đã tồn tại: ${duplicateByName.taxCode || duplicateByName.code}` : null);
        } catch {
            setDuplicateName(null);
            setDuplicateTaxCode(null);
        }
    }, []);

    const [draftPromptOpen, setDraftPromptOpen] = useState(false);
    const [pendingDraftData, setPendingDraftData] = useState<SupplierFormValues | null>(null);
    const [pendingDraftSavedAt, setPendingDraftSavedAt] = useState<number | null>(null);

    const hasLoadedDraftRef = useRef(false);

    useEffect(() => {
        if (hasLoadedDraftRef.current) return;
        const savedDraftRaw = localStorage.getItem(DRAFT_KEY);
        if (!savedDraftRaw) return;

        try {
            const parsed = JSON.parse(savedDraftRaw);
            const draftData = parsed && typeof parsed === "object" && "formData" in parsed
                ? (parsed.formData as SupplierFormValues)
                : (parsed as SupplierFormValues);

            setPendingDraftData(draftData);
            setPendingDraftSavedAt(parsed && parsed.savedAt ? parsed.savedAt : null);
            setDraftPromptOpen(true);
            hasLoadedDraftRef.current = true;
        } catch {
            localStorage.removeItem(DRAFT_KEY);
        }
    }, [reset]);

    const handleRestoreDraft = () => {
        if (!pendingDraftData) {
            setDraftPromptOpen(false);
            return;
        }

        reset({
            ...pendingDraftData,
            status: pendingDraftData.status || "active",
            provinceId: pendingDraftData.provinceId || "",
            addressDetail: pendingDraftData.addressDetail || "",
        });
        setDraftPromptOpen(false);
        toast.success("Đã khôi phục bản nháp.");
    };

    const handleDiscardDraft = () => {
        localStorage.removeItem(DRAFT_KEY);
        setPendingDraftData(null);
        setPendingDraftSavedAt(null);
        setDraftPromptOpen(false);
    };

    const watchedAddressDetail = watchedValues.addressDetail || "";
    useEffect(() => {
        if (watchedAddressDetail) {
            const detectedId = detectProvince(watchedAddressDetail);
            if (detectedId) {
                setValue("provinceId", detectedId, { shouldValidate: true });
            }
        }
    }, [watchedAddressDetail, provinces, setValue]);

    useEffect(() => {
        if (pendingDraftData || draftPromptOpen) return;

        const timer = setTimeout(() => {
            const hasInput = !!(
                watchedValues.name?.trim() ||
                watchedValues.taxCode?.trim() ||
                watchedValues.contactName?.trim() ||
                watchedValues.phone?.trim() ||
                watchedValues.email?.trim() ||
                watchedValues.addressDetail?.trim() ||
                (watchedValues.provinceId && watchedValues.provinceId !== "") ||
                (watchedValues.issueDate && watchedValues.issueDate !== "") ||
                watchedValues.taxAuthority?.trim() ||
                watchedValues.mainBusinessSector?.trim()
            );

            if (!hasInput) {
                localStorage.removeItem(DRAFT_KEY);
                return;
            }

            const dataToSave = {
                formData: {
                    ...watchedValues,
                },
                savedAt: Date.now(),
            };
            localStorage.setItem(DRAFT_KEY, JSON.stringify(dataToSave));
        }, 700);

        return () => clearTimeout(timer);
    }, [watchedValues, pendingDraftData, draftPromptOpen]);


    useEffect(() => {
        const timer = setTimeout(() => {
            checkDuplicateSuppliers(watchedValues.name || "", watchedValues.taxCode || "");
        }, 450);

        return () => clearTimeout(timer);
    }, [checkDuplicateSuppliers, watchedValues.name, watchedValues.taxCode]);

    const handleLookupTaxCode = async () => {
        const taxCode = watch("taxCode");
        if (!taxCode) { toast.error("Vui lòng nhập MST"); return; }
        const loadingToast = toast.loading("Đang tra cứu từ tổng cục thuế...");
        
        // Clear các dữ liệu cũ trước khi bắt đầu tra cứu
        setValue("name", "", { shouldValidate: false });
        setValue("addressDetail", "", { shouldValidate: false });
        setValue("provinceId", "", { shouldValidate: false });
        setValue("contactName", "", { shouldValidate: false });
        setValue("phone", "", { shouldValidate: false });
        setValue("email", "", { shouldValidate: false });
        setValue("issueDate", "", { shouldValidate: false });
        setValue("taxAuthority", "", { shouldValidate: false });
        setValue("mainBusinessSector", "", { shouldValidate: false });

        try {
            const businessInfo = await supplierService.lookupTaxCode(taxCode);
            if (businessInfo) {
                if (businessInfo.name) setValue("name", businessInfo.name, { shouldValidate: true });
                if (businessInfo.address) {
                    setValue("addressDetail", businessInfo.address, { shouldValidate: true });
                    const detectedId = detectProvince(businessInfo.address);
                    if (detectedId) setValue("provinceId", detectedId, { shouldValidate: true });
                }
                if (businessInfo.owner) setValue("contactName", businessInfo.owner, { shouldValidate: true });

                const normalizedPhoneVal = normalizePhone(businessInfo.phone);
                if (normalizedPhoneVal) setValue("phone", normalizedPhoneVal, { shouldValidate: true });

                if (businessInfo.email) setValue("email", businessInfo.email, { shouldValidate: true });
                
                if (businessInfo.issueDate) {
                    const formatted = formatDateForInput(businessInfo.issueDate);
                    if (formatted) setValue("issueDate", formatted, { shouldValidate: true });
                }
                if (businessInfo.taxAuthority) {
                    setValue("taxAuthority", businessInfo.taxAuthority, { shouldValidate: true });
                }
                if (businessInfo.mainBusinessSector) {
                    setValue("mainBusinessSector", businessInfo.mainBusinessSector, { shouldValidate: true });
                }
                
                const missingFields: string[] = [];
                const statuses = businessInfo.fieldStatuses as Record<string, string> | undefined;
                if (statuses) {
                    if (statuses.name !== "FOUND") missingFields.push("Tên công ty");
                    if (statuses.owner !== "FOUND") missingFields.push("Người đại diện");
                    if (statuses.phone !== "FOUND") missingFields.push("SĐT");
                    if (statuses.issueDate !== "FOUND") missingFields.push("Ngày thành lập");
                    if (statuses.mainBusinessSector !== "FOUND") missingFields.push("Ngành nghề");
                }
                if (missingFields.length > 0) {
                    toast.warning(`Tra cứu thành công. Một số thông tin chưa tìm được: ${missingFields.join(", ")}`);
                } else {
                    toast.success("Đã điền đầy đủ thông tin từ tra cứu MST!");
                }
            } else {
                toast.error("Không tìm thấy doanh nghiệp với MST này.");
            }
        } catch {
            toast.error("Không tìm thấy thông tin hoặc API lỗi.");
        } finally {
            toast.dismiss(loadingToast);
        }
    };

    const onSubmit = async (data: SupplierFormValues) => {
        setIsSubmitting(true);
        try {
            const createdSupplier = await supplierService.create(data);
            if (createdSupplier.warnings?.length) {
                toast.warning(createdSupplier.warnings[0].message);
            }
            localStorage.removeItem(DRAFT_KEY);
            toast.success("Đã lưu thông tin nhà cung cấp thành công!");
            window.dispatchEvent(new Event("supplierUpdated"));
            router.push("/admin/suppliers");
        } catch (error) {
            const axiosError = error as AxiosError<ErrorResponse>;
            toast.error(axiosError.response?.data?.message || "Lỗi hệ thống");
        } finally {
            setIsSubmitting(false);
        }
    };

    const onError = () => {
    };

    const handleOpenConfirm = async () => {
        const isValid = await trigger();
        if (!isValid) {
            onError();
            return;
        }

        setIsConfirmOpen(true);
    };

    return (
        <form onSubmit={handleSubmit(onSubmit, onError)} className="space-y-3 pb-[100px] text-slate-800">
            <div className="mb-8 mt-2 px-1">
                <h1 className="text-[20px] font-semibold uppercase tracking-tight text-slate-900">
                    Thêm nhà cung cấp mới
                </h1>
            </div>

            <div className="space-y-5 px-1">
                    <div className="border border-slate-200 bg-white p-6 shadow-sm">
                        <div className="border-b border-slate-200 pb-3">
                            <span className="text-[11px] font-bold text-slate-800">
                                1. Thông tin pháp nhân nhà cung cấp
                            </span>
                        </div>
                        {/* Hàng 1 (3 cột: MST, Tên công ty, Họ tên đại diện) */}
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-3 mt-4">
                            <div className="space-y-1.5">
                                <Label className="text-[10.5px] font-semibold text-slate-500">Mã số thuế *</Label>
                                <div className="flex gap-2">
                                    <Input {...register("taxCode")} className="h-[38px] flex-1 rounded-md border-slate-200 font-mono text-[13px] shadow-none focus:border-emerald-500" />
                                    {!duplicateTaxCode && (
                                        <Button type="button" variant="outline" onClick={handleLookupTaxCode} className="h-[38px] shrink-0 rounded-md border-slate-200 bg-white px-3 text-[11px] font-medium text-blue-600 hover:bg-blue-50">
                                            <Search size={14} className="mr-1" /> Tra cứu
                                        </Button>
                                    )}
                                </div>
                                {errors.taxCode && <p className="mt-1 text-[10px] font-medium text-rose-500">{errors.taxCode.message}</p>}
                                {!errors.taxCode && duplicateTaxCode && <p className="mt-1 text-[10px] font-medium text-amber-600">{duplicateTaxCode}</p>}
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-[10.5px] font-semibold text-slate-500">Tên công ty / Pháp nhân *</Label>
                                <Input {...register("name")} disabled={!!duplicateTaxCode} className="h-[38px] rounded-md border-slate-200 text-[13px] font-normal shadow-none focus:border-emerald-500" />
                                {errors.name && <p className="mt-1 text-[10px] font-medium text-rose-500">{errors.name.message}</p>}
                                {!errors.name && duplicateName && <p className="mt-1 text-[10px] font-medium text-amber-600">{duplicateName}</p>}
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-[10.5px] font-semibold text-slate-500">Họ và tên người đại diện *</Label>
                                <Input {...register("contactName")} disabled={!!duplicateTaxCode} className="h-[38px] rounded-md border-slate-200 text-[13px] shadow-none focus:border-emerald-500" />
                                {errors.contactName && <p className="mt-1 text-[10px] font-medium text-rose-500">{errors.contactName.message}</p>}
                            </div>
                        </div>

                        {/* Hàng 2 (3 cột: Trạng thái, Ngày thành lập, SĐT) */}
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-3 mt-4">
                            <div className="space-y-1.5">
                                <Label className="text-[10.5px] font-semibold text-slate-500">Trạng thái vận hành</Label>
                                <Controller name="status" control={control} render={({ field }) => (
                                    <Select onValueChange={field.onChange} value={field.value}>
                                        <SelectTrigger disabled={!!duplicateTaxCode} className="h-[38px] rounded-md border-slate-200 text-[13px] font-normal shadow-none focus:ring-0"><SelectValue /></SelectTrigger>
                                        <SelectContent className="rounded-md">
                                            <SelectItem value="active" className="text-emerald-600">Đang giao dịch</SelectItem>
                                            <SelectItem value="inactive" className="text-rose-600">Tạm ngừng</SelectItem>
                                        </SelectContent>
                                    </Select>
                                )} />
                            </div>
                            <div className="space-y-1.5 flex flex-col">
                                <Label className="text-[10.5px] font-semibold text-slate-500">Ngày cấp / Thành lập *</Label>
                                <Controller
                                    name="issueDate"
                                    control={control}
                                    render={({ field }) => {
                                        let dateValue: Date | undefined = undefined;
                                        if (field.value) {
                                            try {
                                                dateValue = parse(field.value, "yyyy-MM-dd", new Date());
                                                if (isNaN(dateValue.getTime())) {
                                                    dateValue = undefined;
                                                }
                                            } catch {
                                                dateValue = undefined;
                                            }
                                        }
                                        return (
                                            <Popover>
                                                <PopoverTrigger asChild>
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        disabled={!!duplicateTaxCode}
                                                        className={cn(
                                                            "w-full h-[38px] justify-between text-left font-normal border-slate-200 shadow-none rounded-md px-3 text-[13px] bg-white hover:bg-slate-50",
                                                            !field.value && "text-muted-foreground"
                                                        )}
                                                    >
                                                        <span>
                                                            {dateValue
                                                                ? format(dateValue, "dd/MM/yyyy")
                                                                : "dd/mm/yyyy"}
                                                        </span>
                                                        <CalendarIcon className="h-4 w-4 opacity-50" />
                                                    </Button>
                                                </PopoverTrigger>
                                                <PopoverContent className="w-auto p-0 z-[1000]" align="start">
                                                    <Calendar
                                                        mode="single"
                                                        selected={dateValue}
                                                        onSelect={(date) => {
                                                            if (date) {
                                                                field.onChange(format(date, "yyyy-MM-dd"));
                                                            } else {
                                                                field.onChange("");
                                                            }
                                                        }}
                                                        disabled={(date) => date > new Date() || date < new Date("1900-01-01")}
                                                        initialFocus
                                                    />
                                                </PopoverContent>
                                            </Popover>
                                        );
                                    }}
                                />
                                {errors.issueDate && <p className="mt-1 text-[10px] font-medium text-rose-500">{errors.issueDate.message}</p>}
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-[10.5px] font-semibold text-slate-500">SĐT di động *</Label>
                                <Input {...register("phone")} disabled={!!duplicateTaxCode} className="h-[38px] rounded-md border-slate-200 text-[13px] shadow-none focus:border-emerald-500" />
                                {errors.phone && <p className="mt-1 text-[10px] font-medium text-rose-500">{errors.phone.message}</p>}
                            </div>
                        </div>

                        {/* Hàng 3 (3 cột: Cơ quan thuế, Ngành nghề chính, Email) */}
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-3 mt-4">
                            <div className="space-y-1.5">
                                <Label className="text-[10.5px] font-semibold text-slate-500">Cơ quan thuế quản lý *</Label>
                                <Input {...register("taxAuthority")} disabled={!!duplicateTaxCode} className="h-[38px] rounded-md border-slate-200 text-[13px] shadow-none focus:border-emerald-500" />
                                {errors.taxAuthority && <p className="mt-1 text-[10px] font-medium text-rose-500">{errors.taxAuthority.message}</p>}
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-[10.5px] font-semibold text-slate-500">Ngành nghề kinh doanh chính *</Label>
                                <Input {...register("mainBusinessSector")} disabled={!!duplicateTaxCode} className="h-[38px] rounded-md border-slate-200 text-[13px] shadow-none focus:border-emerald-500" />
                                {errors.mainBusinessSector && <p className="mt-1 text-[10px] font-medium text-rose-500">{errors.mainBusinessSector.message}</p>}
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-[10.5px] font-semibold text-slate-500">Email liên hệ</Label>
                                <Input {...register("email")} disabled={!!duplicateTaxCode} className="h-[38px] rounded-md border-slate-200 text-[13px] shadow-none focus:border-emerald-500" />
                                {errors.email && <p className="mt-1 text-[10px] font-medium text-rose-500">{errors.email.message}</p>}
                            </div>
                        </div>

                        {/* Hàng 4 (Địa chỉ chi tiết / Trụ sở) */}
                        <div className="space-y-1.5 mt-4">
                            <Label className="text-[10.5px] font-semibold text-slate-500">Địa chỉ chi tiết / Trụ sở *</Label>
                            <Input
                                {...register("addressDetail")}
                                disabled={!!duplicateTaxCode}
                                className="h-[38px] rounded-md border-slate-200 text-[13px] shadow-none focus:border-emerald-500"
                                placeholder="Ví dụ: Số 123, đường Nguyễn Văn Linh, Phường An Lạc, Quận Ninh Kiều, TP. Cần Thơ"
                            />
                            {errors.addressDetail && <p className="mt-1 text-[10px] font-medium text-rose-500">{errors.addressDetail.message}</p>}
                        </div>
                    </div>
            </div>

            <div className="fixed bottom-0 left-0 right-0 z-[999] flex items-center justify-end gap-3 border-t border-slate-200 bg-white px-4 py-3 lg:left-[260px]">
                <Button type="button" variant="outline" className="h-10 min-w-[110px] rounded-md border-slate-300 bg-white px-6 text-[13px] font-medium text-slate-600" onClick={() => router.back()}>Hủy bỏ</Button>
                <Button type="button" disabled={isSubmitting || !!duplicateTaxCode || !!duplicateName} onClick={handleOpenConfirm} className="h-10 min-w-[180px] rounded-md bg-emerald-600 px-6 text-[13px] font-semibold text-white hover:bg-emerald-700">
                    <Save size={16} className="mr-2" /> {isSubmitting ? "Đang lưu..." : "Lưu nhà cung cấp"}
                </Button>
            </div>

            <Dialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
                <DialogContent className="sm:max-w-[560px] rounded-[6px]">
                    <DialogHeader>
                        <DialogTitle className="text-[16px] font-black uppercase tracking-tight">Xác nhận lưu nhà cung cấp</DialogTitle>
                        <DialogDescription className="text-[12px] text-slate-500">
                            Kiểm tra nhanh dữ liệu chính trước khi tạo mới để tránh sai sót.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid grid-cols-2 gap-3 text-[12px]">
                        <div className="rounded-[4px] border border-slate-200 p-3">
                            <p className="text-[10px] uppercase font-bold text-slate-400">Tên công ty</p>
                            <p className="mt-1 font-semibold text-slate-700">{watchedValues.name || "---"}</p>
                        </div>
                        <div className="rounded-[4px] border border-slate-200 p-3">
                            <p className="text-[10px] uppercase font-bold text-slate-400">Mã số thuế</p>
                            <p className="mt-1 font-semibold text-slate-700">{watchedValues.taxCode || "---"}</p>
                        </div>
                        <div className="rounded-[4px] border border-slate-200 p-3">
                            <p className="text-[10px] uppercase font-bold text-slate-400">Người đại diện</p>
                            <p className="mt-1 font-semibold text-slate-700">{watchedValues.contactName || "---"}</p>
                        </div>
                        <div className="rounded-[4px] border border-slate-200 p-3">
                            <p className="text-[10px] uppercase font-bold text-slate-400">Điện thoại</p>
                            <p className="mt-1 font-semibold text-slate-700">{watchedValues.phone || "---"}</p>
                        </div>
                        <div className="rounded-[4px] border border-slate-200 p-3 col-span-2">
                            <p className="text-[10px] uppercase font-bold text-slate-400">Địa chỉ chi tiết / Trụ sở</p>
                            <p className="mt-1 font-semibold text-slate-700">
                                {watchedValues.addressDetail || "---"}
                            </p>
                        </div>
                        <div className="rounded-[4px] border border-slate-200 p-3 col-span-2">
                            <p className="text-[10px] uppercase font-bold text-slate-400">Trạng thái vận hành</p>
                            <p className="mt-1 font-semibold text-slate-700">{watchedValues.status === "inactive" ? "TẠM NGỪNG" : "ĐANG GIAO DỊCH"}</p>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setIsConfirmOpen(false)}>Xem lại</Button>
                        <Button
                            type="button"
                            disabled={isSubmitting}
                            onClick={async () => {
                                setIsConfirmOpen(false);
                                await handleSubmit(onSubmit, onError)();
                            }}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white"
                        >
                            {isSubmitting ? "Đang lưu..." : "Xác nhận lưu"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={draftPromptOpen} onOpenChange={setDraftPromptOpen}>
                <DialogContent className="sm:max-w-[560px] bg-white">
                    <DialogHeader>
                        <DialogTitle className="text-[18px] font-black text-slate-800">Khôi phục bản nháp gần nhất?</DialogTitle>
                        <DialogDescription className="text-[13px] text-slate-500">
                            Hệ thống phát hiện bạn có bản nháp chưa hoàn tất cho form thêm nhà cung cấp.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-3">
                        <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                            <p className="text-[12px] text-slate-600">
                                Nháp hiện tại: {pendingDraftSavedAt ? new Date(pendingDraftSavedAt).toLocaleString("vi-VN") : "Không rõ thời gian"}
                            </p>
                        </div>
                    </div>

                    <DialogFooter className="gap-2">
                        <Button type="button" variant="outline" onClick={handleDiscardDraft}>Bỏ nháp</Button>
                        <Button type="button" onClick={handleRestoreDraft} className="bg-emerald-600 hover:bg-emerald-700 text-white">Khôi phục nháp</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </form>
    );
}
