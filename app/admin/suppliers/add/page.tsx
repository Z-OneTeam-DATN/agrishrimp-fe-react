"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AxiosError } from "axios";
import {
    Save, Search
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
        }, 700);

        return () => clearTimeout(timer);
    }, [watchedValues, addressParts]);

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

            const createdSupplier = await supplierService.create(payload);
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
        toast.error("Vui lòng điền đầy đủ và đúng định dạng các trường bắt buộc!");
    };

    const handleOpenConfirm = async () => {
        const isValid = await trigger();
        if (!isValid) {
            onError();
            return;
        }

        if (duplicateTaxCode || duplicateName) {
            toast.error("Vui lòng xử lý cảnh báo trùng dữ liệu trước khi lưu.");
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
                        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
                            <div className="space-y-1.5">
                                <Label className="text-[10.5px] font-semibold text-slate-500">Tên công ty / Pháp nhân *</Label>
                                <Input {...register("name")} className="h-[38px] rounded-md border-slate-200 text-[13px] font-normal shadow-none focus:border-emerald-500" />
                                {errors.name && <p className="mt-1 text-[10px] font-medium text-rose-500">{errors.name.message}</p>}
                                {!errors.name && duplicateName && <p className="mt-1 text-[10px] font-medium text-amber-600">{duplicateName}</p>}
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-[10.5px] font-semibold text-slate-500">Mã số thuế *</Label>
                                <div className="flex gap-2">
                                    <Input {...register("taxCode")} className="h-[38px] rounded-md border-slate-200 font-mono text-[13px] shadow-none focus:border-emerald-500" />
                                    <Button type="button" variant="outline" onClick={handleLookupTaxCode} className="h-[38px] shrink-0 rounded-md border-slate-200 bg-white px-3 text-[11px] font-medium text-blue-600 hover:bg-blue-50">
                                        <Search size={14} className="mr-1" /> Tra cứu
                                    </Button>
                                </div>
                                {errors.taxCode && <p className="mt-1 text-[10px] font-medium text-rose-500">{errors.taxCode.message}</p>}
                                {!errors.taxCode && duplicateTaxCode && <p className="mt-1 text-[10px] font-medium text-amber-600">{duplicateTaxCode}</p>}
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-[10.5px] font-semibold text-slate-500">Trạng thái vận hành</Label>
                                <Controller name="status" control={control} render={({ field }) => (
                                    <Select onValueChange={field.onChange} value={field.value}>
                                        <SelectTrigger className="h-[38px] rounded-md border-slate-200 text-[13px] font-normal shadow-none focus:ring-0"><SelectValue /></SelectTrigger>
                                        <SelectContent className="rounded-md">
                                            <SelectItem value="active" className="text-emerald-600">Đang giao dịch</SelectItem>
                                            <SelectItem value="inactive" className="text-rose-600">Tạm ngừng</SelectItem>
                                        </SelectContent>
                                    </Select>
                                )} />
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-[10.5px] font-semibold text-slate-500">Họ và tên người đại diện *</Label>
                                <Input {...register("contactName")} className="h-[38px] rounded-md border-slate-200 text-[13px] shadow-none focus:border-emerald-500" />
                                {errors.contactName && <p className="mt-1 text-[10px] font-medium text-rose-500">{errors.contactName.message}</p>}
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-[10.5px] font-semibold text-slate-500">Số điện thoại di động *</Label>
                                <Input {...register("phone")} className="h-[38px] rounded-md border-slate-200 text-[13px] shadow-none focus:border-emerald-500" />
                                {errors.phone && <p className="mt-1 text-[10px] font-medium text-rose-500">{errors.phone.message}</p>}
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-[10.5px] font-semibold text-slate-500">Email liên hệ</Label>
                                <Input {...register("email")} className="h-[38px] rounded-md border-slate-200 text-[13px] shadow-none focus:border-emerald-500" />
                                {errors.email && <p className="mt-1 text-[10px] font-medium text-rose-500">{errors.email.message}</p>}
                            </div>
                        </div>
                    </div>

                    <div className="border border-slate-200 bg-white p-6 shadow-sm">
                        <div className="border-b border-slate-200 pb-3">
                            <span className="text-[11px] font-bold text-slate-800">2. Trụ sở / Kho bãi nhà cung cấp</span>
                        </div>
                        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-4">
                            <div className="space-y-1.5">
                                <Label className="text-[10.5px] font-semibold text-slate-500">Tỉnh / Thành phố *</Label>
                                <Controller name="provinceId" control={control} render={({ field }) => (
                                    <Select onValueChange={field.onChange} value={field.value}>
                                        <SelectTrigger className="h-[38px] rounded-md border-slate-200 text-[13px] shadow-none focus:ring-0"><SelectValue placeholder="Chọn Tỉnh/TP" /></SelectTrigger>
                                        <SelectContent className="max-h-[220px] rounded-md">
                                            {provinces.map((p) => (<SelectItem key={p.id} value={p.id}>{p.full_name}</SelectItem>))}
                                        </SelectContent>
                                    </Select>
                                )} />
                                {errors.provinceId && <p className="mt-1 text-[10px] font-medium text-rose-500">{errors.provinceId.message}</p>}
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-[10.5px] font-semibold text-slate-500">Số nhà / Tòa *</Label>
                                <Input
                                    value={addressParts.houseNumber}
                                    onChange={(e) => setAddressParts((prev) => ({ ...prev, houseNumber: e.target.value }))}
                                    className="h-[38px] rounded-md border-slate-200 text-[13px] shadow-none focus:border-emerald-500"
                                    placeholder="Ví dụ: 123 hoặc Lô B2"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-[10.5px] font-semibold text-slate-500">Tên đường *</Label>
                                <Input
                                    value={addressParts.street}
                                    onChange={(e) => setAddressParts((prev) => ({ ...prev, street: e.target.value }))}
                                    className="h-[38px] rounded-md border-slate-200 text-[13px] shadow-none focus:border-emerald-500"
                                    placeholder="Ví dụ: Nguyễn Văn Linh"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-[10.5px] font-semibold text-slate-500">Phường / Xã *</Label>
                                <Input
                                    value={addressParts.ward}
                                    onChange={(e) => setAddressParts((prev) => ({ ...prev, ward: e.target.value }))}
                                    className="h-[38px] rounded-md border-slate-200 text-[13px] shadow-none focus:border-emerald-500"
                                    placeholder="Ví dụ: Phường An Lạc"
                                />
                            </div>
                            <div className="space-y-1.5 md:col-span-4">
                                <Label className="text-[10.5px] font-semibold text-slate-500">Địa chỉ chuẩn hóa</Label>
                                <Input
                                    value={buildAddressDetail(addressParts)}
                                    readOnly
                                    className="h-[38px] rounded-md border-slate-200 bg-slate-50 text-[13px] shadow-none"
                                />
                                <input type="hidden" {...register("addressDetail")} />
                                {errors.addressDetail && <p className="mt-1 text-[10px] font-medium text-rose-500">{errors.addressDetail.message}</p>}
                            </div>
                        </div>
                    </div>
            </div>

            <div className="fixed bottom-0 left-0 right-0 z-[999] flex items-center justify-end gap-3 border-t border-slate-200 bg-white px-4 py-3 lg:left-[260px]">
                <Button type="button" variant="outline" className="h-10 min-w-[110px] rounded-md border-slate-300 bg-white px-6 text-[13px] font-medium text-slate-600" onClick={() => router.back()}>Hủy bỏ</Button>
                <Button type="button" disabled={isSubmitting} onClick={handleOpenConfirm} className="h-10 min-w-[180px] rounded-md bg-emerald-600 px-6 text-[13px] font-semibold text-white hover:bg-emerald-700">
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
