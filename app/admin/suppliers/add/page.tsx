"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AxiosError } from "axios";
import {
    Save, ChevronLeft, User, MapPin, Truck, Search, ShieldCheck
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { SupplierSchema, SupplierFormValues } from "@/app/types/admin.schema";
import { supplierService } from "@/app/services/supplier.service";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

interface Province { id: string; name: string; full_name: string; }
interface ErrorResponse { message: string; }

export default function AddSupplierPage() {
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [provinces, setProvinces] = useState<Province[]>([]);
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [duplicateTaxCode, setDuplicateTaxCode] = useState<string | null>(null);
    const [duplicateName, setDuplicateName] = useState<string | null>(null);
    const [lastDraftSavedAt, setLastDraftSavedAt] = useState<string>("");
    const [addressParts, setAddressParts] = useState({
        houseNumber: "",
        street: "",
        ward: "",
    });

    const DRAFT_KEY = "supplier-add-draft-v1";

    const { register, handleSubmit, control, watch, setValue, trigger, reset, formState: { errors } } = useForm<SupplierFormValues>({
        resolver: zodResolver(SupplierSchema),
        defaultValues: { status: "active", provinceId: "" },
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

    const parseAddressDetail = (fullAddress: string) => {
        if (!fullAddress) {
            return { houseNumber: "", street: "", ward: "" };
        }

        const chunks = fullAddress
            .split(",")
            .map((part) => part.trim())
            .filter(Boolean);

        return {
            houseNumber: chunks[0] || "",
            street: chunks[1] || "",
            ward: chunks.slice(2).join(", ") || "",
        };
    };

    const buildAddressDetail = (parts: { houseNumber: string; street: string; ward: string }) => {
        return [parts.houseNumber, parts.street, parts.ward]
            .map((part) => part.trim())
            .filter(Boolean)
            .join(", ");
    };

    const normalizeName = (value: string) => value.trim().toLowerCase().replace(/\s+/g, " ");
    const normalizeTaxCode = (value: string) => value.trim().replace(/\s+/g, "");

    const checkDuplicateSuppliers = async (nameValue: string, taxCodeValue: string) => {
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
    };

    useEffect(() => {
        const savedDraftRaw = localStorage.getItem(DRAFT_KEY);
        if (!savedDraftRaw) return;

        try {
            const savedDraft = JSON.parse(savedDraftRaw) as SupplierFormValues;
            reset({
                ...savedDraft,
                status: savedDraft.status || "active",
                provinceId: savedDraft.provinceId || "",
            });
            setAddressParts(parseAddressDetail(savedDraft.addressDetail || ""));
            toast.info("Đã khôi phục bản nháp nhà cung cấp trước đó");
        } catch {
            localStorage.removeItem(DRAFT_KEY);
        }
    }, [reset]);

    useEffect(() => {
        const combinedAddress = buildAddressDetail(addressParts);
        setValue("addressDetail", combinedAddress, { shouldValidate: true });
    }, [addressParts, setValue]);

    useEffect(() => {
        const timer = setTimeout(() => {
            const dataToSave = {
                ...watchedValues,
                addressDetail: buildAddressDetail(addressParts),
            };
            localStorage.setItem(DRAFT_KEY, JSON.stringify(dataToSave));
            setLastDraftSavedAt(new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit", second: "2-digit" }));
        }, 700);

        return () => clearTimeout(timer);
    }, [watchedValues, addressParts]);

    useEffect(() => {
        const timer = setTimeout(() => {
            checkDuplicateSuppliers(watchedValues.name || "", watchedValues.taxCode || "");
        }, 450);

        return () => clearTimeout(timer);
    }, [watchedValues.name, watchedValues.taxCode]);

    const qualityChecks = useMemo(() => {
        const checks = [
            { label: "Tên pháp nhân", ok: Boolean(watchedValues.name?.trim()) },
            { label: "Mã số thuế", ok: Boolean(watchedValues.taxCode?.trim()) },
            { label: "Người đại diện", ok: Boolean(watchedValues.contactName?.trim()) },
            { label: "Số điện thoại", ok: Boolean(watchedValues.phone?.trim()) },
            { label: "Email", ok: Boolean(watchedValues.email?.trim()) },
            { label: "Tỉnh/Thành", ok: Boolean(watchedValues.provinceId?.trim()) },
            { label: "Số nhà", ok: Boolean(addressParts.houseNumber.trim()) },
            { label: "Tên đường", ok: Boolean(addressParts.street.trim()) },
            { label: "Phường/Xã", ok: Boolean(addressParts.ward.trim()) },
        ];

        const doneCount = checks.filter((item) => item.ok).length;
        const score = Math.round((doneCount / checks.length) * 100);

        return {
            score,
            missing: checks.filter((item) => !item.ok).map((item) => item.label),
        };
    }, [watchedValues, addressParts]);

    const handleLookupTaxCode = async () => {
        const taxCode = watch("taxCode");
        if (!taxCode) { toast.error("Vui lòng nhập MST"); return; }
        const loadingToast = toast.loading("Đang tra cứu từ tổng cục thuế...");
        try {
            const businessInfo = await supplierService.lookupTaxCode(taxCode);
            if (businessInfo) {
                setValue("name", businessInfo.name, { shouldValidate: true });
                setValue("addressDetail", businessInfo.address, { shouldValidate: true });
                setAddressParts(parseAddressDetail(businessInfo.address));
                const detectedId = detectProvince(businessInfo.address);
                if (detectedId) setValue("provinceId", detectedId, { shouldValidate: true });
                if (businessInfo.owner) setValue("contactName", businessInfo.owner, { shouldValidate: true });
                if (businessInfo.phone) setValue("phone", businessInfo.phone, { shouldValidate: true });
                if (businessInfo.email) setValue("email", businessInfo.email, { shouldValidate: true });
                toast.success("Đã tìm thấy thông tin!");
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
            const payload = {
                ...data,
                addressDetail: buildAddressDetail(addressParts),
            };

            await supplierService.create(payload);
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

    const onError = (errors: any) => {
        toast.error("Vui lòng điền đầy đủ và đúng định dạng các trường bắt buộc!");
    };

    const handleOpenConfirm = async () => {
        const isValid = await trigger();
        if (!isValid) {
            onError(errors);
            return;
        }

        if (duplicateTaxCode || duplicateName) {
            toast.error("Vui lòng xử lý cảnh báo trùng dữ liệu trước khi lưu.");
            return;
        }

        setIsConfirmOpen(true);
    };

    return (
        <form onSubmit={handleSubmit(onSubmit, onError)} className="space-y-4 pb-24 min-h-screen">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-2 px-1">
                <div className="flex items-start gap-3">
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => router.back()}
                        className="h-8 w-8 text-slate-400 hover:text-emerald-600"
                    >
                        <ChevronLeft size={20} />
                    </Button>
                    <div>
                        <h1 className="text-[18px] font-black text-[#1f1f1f] tracking-tight uppercase">THÊM NHÀ CUNG CẤP MỚI</h1>
                        <p className="text-[12px] text-slate-500 font-medium mt-1">Khai báo hồ sơ pháp nhân, thông tin liên hệ và trạng thái vận hành nhà cung cấp</p>
                    </div>
                </div>
                <div className="sm:ms-auto">
                    <span className="inline-flex items-center h-7 px-2 rounded-[4px] border border-emerald-100 bg-emerald-50 text-emerald-700 text-[10px] font-bold uppercase tracking-wide">
                        Tạo mới đối tác
                    </span>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                <div className="lg:col-span-8 space-y-5">
                    <div className="bg-white border border-[#dcdcdc] p-6 rounded-[4px] shadow-sm">
                        <div className="flex items-center gap-2 mb-6 text-emerald-700 font-black text-[11px] uppercase tracking-widest border-b pb-3">
                            <Truck size={16} /> 1. Thông tin pháp nhân nhà cung cấp
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
                            <div className="md:col-span-2 space-y-1.5">
                                <Label className="text-[10px] font-black text-slate-500 uppercase tracking-tight">Tên công ty / Pháp nhân *</Label>
                                <Input {...register("name")} className="h-[36px] text-[13px] border-[#ccc] rounded-[3px] shadow-none focus:border-emerald-500" />
                                {errors.name && <p className="text-[10px] text-red-500 font-bold mt-1">{errors.name.message}</p>}
                                {!errors.name && duplicateName && <p className="text-[10px] text-amber-600 font-bold mt-1">{duplicateName}</p>}
                            </div>
                            <div className="space-y-1.5 md:col-span-2">
                                <Label className="text-[10px] font-black text-slate-500 uppercase tracking-tight">Mã số thuế *</Label>
                                <div className="flex gap-2">
                                    <Input {...register("taxCode")} className="h-[36px] text-[13px] border-[#ccc] rounded-[3px] shadow-none font-mono focus:border-emerald-500" />
                                    <Button type="button" variant="outline" onClick={handleLookupTaxCode} className="h-[36px] shrink-0 bg-slate-50 border-[#ccc] rounded-[3px] px-3 text-[10px] font-black text-blue-600 hover:bg-blue-50">
                                        <Search size={14} className="mr-1" /> TRA CỨU
                                    </Button>
                                </div>
                                {errors.taxCode && <p className="text-[10px] text-red-500 font-bold mt-1">{errors.taxCode.message}</p>}
                                {!errors.taxCode && duplicateTaxCode && <p className="text-[10px] text-amber-600 font-bold mt-1">{duplicateTaxCode}</p>}
                            </div>
                        </div>
                    </div>

                    <div className="bg-white border border-[#dcdcdc] p-6 rounded-[4px] shadow-sm">
                        <div className="flex items-center gap-2 mb-6 text-emerald-700 font-black text-[11px] uppercase tracking-widest border-b pb-3">
                            <User size={16} /> 2. Thông tin liên hệ trực tiếp
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-5 gap-y-5">
                            <div className="space-y-1.5">
                                <Label className="text-[10px] font-black text-slate-500 uppercase tracking-tight">Họ và tên người đại diện *</Label>
                                <Input {...register("contactName")} className="h-[36px] text-[13px] border-[#ccc] rounded-[3px] shadow-none focus:border-emerald-500" />
                                {errors.contactName && <p className="text-[10px] text-red-500 font-bold mt-1">{errors.contactName.message}</p>}
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-[10px] font-black text-slate-500 uppercase tracking-tight">Số điện thoại di động *</Label>
                                <Input {...register("phone")} className="h-[36px] text-[13px] border-[#ccc] rounded-[3px] shadow-none focus:border-emerald-500" />
                                {errors.phone && <p className="text-[10px] text-red-500 font-bold mt-1">{errors.phone.message}</p>}
                            </div>
                            <div className="space-y-1.5 md:col-span-2">
                                <Label className="text-[10px] font-black text-slate-500 uppercase tracking-tight">Email liên hệ</Label>
                                <Input {...register("email")} className="h-[36px] text-[13px] border-[#ccc] rounded-[3px] shadow-none focus:border-emerald-500" />
                                {errors.email && <p className="text-[10px] text-red-500 font-bold mt-1">{errors.email.message}</p>}
                            </div>
                        </div>
                    </div>

                    <div className="bg-white border border-[#dcdcdc] p-6 rounded-[4px] shadow-sm">
                        <div className="flex items-center gap-2 mb-6 text-emerald-700 font-black text-[11px] uppercase tracking-widest border-b pb-3">
                            <MapPin size={16} /> 3. Trụ sở / Kho bãi nhà cung cấp
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-x-5 gap-y-5">
                            <div className="space-y-1.5">
                                <Label className="text-[10px] font-black text-slate-500 uppercase tracking-tight">Tỉnh / Thành phố *</Label>
                                <Controller name="provinceId" control={control} render={({ field }) => (
                                    <Select onValueChange={field.onChange} value={field.value}>
                                        <SelectTrigger className="h-[36px] text-[13px] border-[#ccc] rounded-[3px] shadow-none focus:ring-0"><SelectValue placeholder="-- Chọn Tỉnh/TP --" /></SelectTrigger>
                                        <SelectContent className="rounded-[4px] max-h-[220px]">
                                            {provinces.map((p) => (<SelectItem key={p.id} value={p.id}>{p.full_name}</SelectItem>))}
                                        </SelectContent>
                                    </Select>
                                )} />
                                {errors.provinceId && <p className="text-[10px] text-red-500 font-bold mt-1">{errors.provinceId.message}</p>}
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-[10px] font-black text-slate-500 uppercase tracking-tight">Số nhà / Tòa *</Label>
                                <Input
                                    value={addressParts.houseNumber}
                                    onChange={(e) => setAddressParts((prev) => ({ ...prev, houseNumber: e.target.value }))}
                                    className="h-[36px] text-[13px] border-[#ccc] rounded-[3px] shadow-none focus:border-emerald-500"
                                    placeholder="Ví dụ: 123 hoặc Lô B2"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-[10px] font-black text-slate-500 uppercase tracking-tight">Tên đường *</Label>
                                <Input
                                    value={addressParts.street}
                                    onChange={(e) => setAddressParts((prev) => ({ ...prev, street: e.target.value }))}
                                    className="h-[36px] text-[13px] border-[#ccc] rounded-[3px] shadow-none focus:border-emerald-500"
                                    placeholder="Ví dụ: Nguyễn Văn Linh"
                                />
                            </div>
                            <div className="md:col-span-2 space-y-1.5">
                                <Label className="text-[10px] font-black text-slate-500 uppercase tracking-tight">Phường / Xã *</Label>
                                <Input
                                    value={addressParts.ward}
                                    onChange={(e) => setAddressParts((prev) => ({ ...prev, ward: e.target.value }))}
                                    className="h-[36px] text-[13px] border-[#ccc] rounded-[3px] shadow-none focus:border-emerald-500"
                                    placeholder="Ví dụ: Phường An Lạc"
                                />
                            </div>
                            <div className="md:col-span-3 space-y-1.5">
                                <Label className="text-[10px] font-black text-slate-500 uppercase tracking-tight">Địa chỉ chuẩn hóa</Label>
                                <Input
                                    value={buildAddressDetail(addressParts)}
                                    readOnly
                                    className="h-[36px] text-[13px] border-[#ccc] rounded-[3px] shadow-none bg-slate-50"
                                />
                                <input type="hidden" {...register("addressDetail")} />
                                {errors.addressDetail && <p className="text-[10px] text-red-500 font-bold mt-1">{errors.addressDetail.message}</p>}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="lg:col-span-4 space-y-5">
                    <div className="bg-white border border-[#dcdcdc] p-6 rounded-[4px] shadow-sm lg:sticky lg:top-4">
                        <Label className="text-[11px] font-black text-slate-700 uppercase block mb-5 tracking-widest border-b pb-3">Trạng thái vận hành</Label>
                        <Controller name="status" control={control} render={({ field }) => (
                            <Select onValueChange={field.onChange} value={field.value}>
                                <SelectTrigger className="h-[38px] text-[13px] border-[#ccc] rounded-[3px] font-black text-emerald-600 shadow-none focus:ring-0"><SelectValue /></SelectTrigger>
                                <SelectContent className="rounded-[4px]">
                                    <SelectItem value="active" className="text-emerald-600 font-bold uppercase tracking-tighter">ĐANG GIAO DỊCH</SelectItem>
                                    <SelectItem value="inactive" className="text-rose-600 font-bold uppercase tracking-tighter">TẠM NGỪNG</SelectItem>
                                </SelectContent>
                            </Select>
                        )} />

                        <div className="mt-5 rounded-[4px] p-4 bg-emerald-50 border border-emerald-100">
                            <div className="flex items-center gap-2 text-emerald-700 font-black text-[10px] uppercase mb-3 tracking-widest border-b border-emerald-200 pb-1.5">
                                <ShieldCheck size={14} /> Quy tắc hệ thống
                            </div>
                            <p className="text-[11px] text-emerald-700/80 leading-relaxed font-medium italic">
                                * Hệ thống sẽ tự động đối soát thông tin qua hệ thống Thuế Việt Nam để đảm bảo tính minh bạch.
                            </p>
                        </div>

                        <div className="mt-4 rounded-[4px] border border-slate-200 bg-slate-50 px-3 py-3">
                            <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Mẹo nhập nhanh</p>
                            <ul className="mt-2 space-y-1 text-[11px] text-slate-600 font-medium">
                                <li>- Nhập MST rồi bấm Tra cứu để điền nhanh thông tin pháp nhân.</li>
                                <li>- Ưu tiên email công ty để nhận chứng từ tự động.</li>
                                <li>- Kiểm tra lại tỉnh thành trước khi lưu để tránh sai lệch kho.</li>
                            </ul>
                        </div>

                        <div className="mt-4 rounded-[4px] border border-slate-200 bg-white px-3 py-3">
                            <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Điểm chất lượng hồ sơ</p>
                            <div className="mt-2 h-2 rounded-full bg-slate-100 overflow-hidden">
                                <div
                                    className={`h-full transition-all ${qualityChecks.score >= 80 ? "bg-emerald-500" : qualityChecks.score >= 50 ? "bg-amber-500" : "bg-rose-500"}`}
                                    style={{ width: `${qualityChecks.score}%` }}
                                />
                            </div>
                            <p className="mt-2 text-[12px] font-black text-slate-700">{qualityChecks.score}% hoàn thiện</p>
                            {qualityChecks.missing.length > 0 && (
                                <div className="mt-2">
                                    <p className="text-[10px] font-bold uppercase text-slate-400">Cần bổ sung</p>
                                    <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">{qualityChecks.missing.join(", ")}</p>
                                </div>
                            )}
                            {lastDraftSavedAt && <p className="mt-2 text-[10px] text-slate-400 font-medium">Đã lưu nháp lúc {lastDraftSavedAt}</p>}
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="mt-3 h-7 text-[10px] font-bold uppercase"
                                onClick={() => {
                                    localStorage.removeItem(DRAFT_KEY);
                                    toast.success("Đã xóa bản nháp");
                                }}
                            >
                                Xóa bản nháp
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="fixed bottom-0 left-0 lg:left-[260px] right-0 bg-[#f8f9fa]/95 backdrop-blur border-t border-[#ddd] px-4 sm:px-8 py-3 flex items-center justify-end gap-3 z-[999]">
                <Button type="button" variant="outline" className="min-w-[110px] h-[38px] text-[12px] font-bold border-[#ccc] bg-white rounded-[3px]" onClick={() => router.back()}>HỦY BỎ</Button>
                <Button type="button" disabled={isSubmitting} onClick={handleOpenConfirm} className="min-w-[180px] h-[38px] text-[12px] font-black bg-emerald-600 hover:bg-emerald-700 text-white rounded-[3px]">
                    <Save size={18} className="mr-2" /> {isSubmitting ? "ĐANG LƯU..." : "LƯU NHÀ CUNG CẤP"}
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
                            <p className="text-[10px] uppercase font-bold text-slate-400">Địa chỉ chuẩn hóa</p>
                            <p className="mt-1 font-semibold text-slate-700">{buildAddressDetail(addressParts) || "---"}</p>
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
        </form>
    );
}