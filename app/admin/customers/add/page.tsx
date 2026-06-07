"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
    Save,
    Mail,
    Phone,
    Check,
    ChevronsUpDown,
    Loader2,
    AlertCircle,
    MapPin as MapPinIcon,
    Copy,
    CheckCircle2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { CustomerSchema, CustomerFormValues } from "@/app/types/admin.schema";
import { customerService } from "@/app/services/customer.service";

const GEOAPIFY_TOKEN = "56418528a46b4ca390f6f7937e0b4591";
const DRAFT_STORAGE_KEY = "customer_form_draft";
const DRAFT_AUTO_SAVE_INTERVAL = 5000; // 5 seconds

interface LocationItem {
    id: string;
    full_name: string;
}

interface Branch {
    id: number;
    name: string;
    branchCode: string;
}

interface StaffMember {
    id: number;
    fullName: string;
    email: string;
    phoneNumber: string;
}

export default function AddCustomerPage() {
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);

    // States lưu data địa chỉ
    const [provinces, setProvinces] = useState<LocationItem[]>([]);
    const [districts, setDistricts] = useState<LocationItem[]>([]);
    const [wards, setWards] = useState<LocationItem[]>([]);

    // States quản lý Combobox
    const [openProvince, setOpenProvince] = useState(false);
    const [openDistrict, setOpenDistrict] = useState(false);
    const [openWard, setOpenWard] = useState(false);
    const [openBranch, setOpenBranch] = useState(false);
    const [openStaff, setOpenStaff] = useState(false);

    // States cho Geoapify Autocomplete
    const [suggestions, setSuggestions] = useState<string[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [isSearchingMap, setIsSearchingMap] = useState(false);
    const [, setIsCheckingDuplicate] = useState(false);
    const [inlineDuplicate, setInlineDuplicate] = useState<{ email?: string; phone?: string }>({});

    // 🟢 New states for branches, staff, and copy functionality
    const [branches, setBranches] = useState<Branch[]>([]);
    const [staffList, setStaffList] = useState<StaffMember[]>([]);
    const [isLoadingBranches, setIsLoadingBranches] = useState(false);
    const [isLoadingStaff, setIsLoadingStaff] = useState(false);
    const [copiedAddress, setCopiedAddress] = useState(false);

    const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const autoSaveRef = useRef<NodeJS.Timeout | null>(null);
    const wrapperRef = useRef<HTMLDivElement>(null);

    const {
        register,
        handleSubmit,
        control,
        watch,
        setValue,
        setError,
        clearErrors,
        formState: { errors },
    } = useForm<CustomerFormValues>({
        resolver: zodResolver(CustomerSchema),
        defaultValues: {
            status: "ACTIVE",
            gender: "MALE",
            addressDetail: "",
            branchId: "",
            staffAssignedId: "",
            internalNotes: "",
        },
    });

    const selectedProvince = watch("provinceId");
    const selectedDistrict = watch("districtId");
    const selectedWard = watch("wardId");
    const selectedBranch = watch("branchId");
    const addressDetail = watch("addressDetail");
    const nameValue = watch("name");
    const phoneValue = watch("phone");
    const emailValue = watch("email");
    const allFormValues = watch();

    // 🟢 Load branches on mount
    useEffect(() => {
        loadBranches();
        loadLocationData();
        loadDraftFromStorage();
    }, []);

    // 🟢 Auto-save draft every 5 seconds
    useEffect(() => {
        if (autoSaveRef.current) clearTimeout(autoSaveRef.current);
        autoSaveRef.current = setTimeout(() => {
            saveDraftToStorage(allFormValues);
        }, DRAFT_AUTO_SAVE_INTERVAL);
        return () => {
            if (autoSaveRef.current) clearTimeout(autoSaveRef.current);
        };
    }, [allFormValues]);

    // Load branches
    const loadBranches = async () => {
        try {
            setIsLoadingBranches(true);
            const data = await customerService.getAllBranches();
            setBranches(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error("Error loading branches:", error);
            toast.error("Không thể tải danh sách chi nhánh");
        } finally {
            setIsLoadingBranches(false);
        }
    };

    // Load staff when branch changes
    useEffect(() => {
        if (selectedBranch) {
            loadStaffByBranch(selectedBranch);
        } else {
            setStaffList([]);
            setValue("staffAssignedId", "");
        }
    }, [selectedBranch]);

    const loadStaffByBranch = async (branchId: string) => {
        try {
            setIsLoadingStaff(true);
            const data = await customerService.getStaffByBranch(branchId);
            setStaffList(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error("Error loading staff:", error);
            toast.error("Không thể tải danh sách nhân viên");
        } finally {
            setIsLoadingStaff(false);
        }
    };

    // 🟢 Load draft from localStorage
    const loadDraftFromStorage = () => {
        if (typeof window === "undefined") return;
        const draft = localStorage.getItem(DRAFT_STORAGE_KEY);
        if (draft) {
            try {
                const data = JSON.parse(draft);
                Object.keys(data).forEach((key) => {
                    setValue(key as keyof CustomerFormValues, data[key]);
                });
                toast.success("Đã tải lại bản nháp");
            } catch (error) {
                console.error("Error loading draft:", error);
            }
        }
    };

    // 🟢 Save draft to localStorage
    const saveDraftToStorage = (data: any) => {
        if (typeof window === "undefined") return;
        try {
            localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(data));
        } catch (error) {
            console.error("Error saving draft:", error);
        }
    };

    // Clear draft on successful submit
    const clearDraft = () => {
        if (typeof window === "undefined") return;
        localStorage.removeItem(DRAFT_STORAGE_KEY);
    };

    // Load location data
    const loadLocationData = async () => {
        try {
            const res = await fetch("https://esgoo.net/api-tinhthanh/1/0.htm");
            const data = await res.json();
            if (data.error === 0) setProvinces(data.data);
        } catch (error) {
            console.error("Error loading provinces:", error);
        }
    };

    // Load districts when province changes
    useEffect(() => {
        if (selectedProvince) {
            fetch(`https://esgoo.net/api-tinhthanh/2/${selectedProvince}.htm`)
                .then((res) => res.json())
                .then((data) => {
                    if (data.error === 0) {
                        setDistricts(data.data);
                        setWards([]);
                        setValue("districtId", "");
                        setValue("wardId", "");
                    }
                });
        }
    }, [selectedProvince, setValue]);

    // Load wards when district changes
    useEffect(() => {
        if (selectedDistrict) {
            fetch(`https://esgoo.net/api-tinhthanh/3/${selectedDistrict}.htm`)
                .then((res) => res.json())
                .then((data) => {
                    if (data.error === 0) setWards(data.data);
                });
        }
    }, [selectedDistrict, setValue]);

    // Close suggestions on outside click
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setShowSuggestions(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Remove accents helper
    const removeAccents = (str: string) => {
        if (!str) return "";
        return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
    };

    // 🟢 Phone formatting
    const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let value = e.target.value.replace(/\D/g, "");
        if (value.length > 10) value = value.slice(0, 10);
        
        let formatted = "";
        if (value.length > 0) formatted = value.slice(0, 3);
        if (value.length > 3) formatted += " " + value.slice(3, 6);
        if (value.length > 6) formatted += " " + value.slice(6, 10);
        
        setValue("phone", formatted, { shouldValidate: true });
    };

    // Handle address autocomplete
    const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setValue("addressDetail", value, { shouldValidate: true });

        if (!value || value.length < 3) {
            setSuggestions([]);
            setShowSuggestions(false);
            return;
        }

        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

        typingTimeoutRef.current = setTimeout(async () => {
            setIsSearchingMap(true);
            try {
                const rawPName = provinces.find((p) => p.id === selectedProvince)?.full_name || "";
                const rawDName = districts.find((d) => d.id === selectedDistrict)?.full_name || "";

                const cleanPName = rawPName.replace(/^(Tỉnh|Thành phố)\s+/i, "").trim();
                const cleanDName = rawDName.replace(/^(Quận|Huyện|Thị xã|Thành phố)\s+/i, "").trim();

                const contextArr = [cleanDName, cleanPName].filter(Boolean);
                const searchQuery = contextArr.length > 0 ? `${value}, ${contextArr.join(", ")}` : value;

                const res = await fetch(
                    `https://api.geoapify.com/v1/geocode/autocomplete?text=${encodeURIComponent(searchQuery)}&filter=countrycode:vn&lang=vi&limit=15&format=json&apiKey=${GEOAPIFY_TOKEN}`
                );
                const data = await res.json();

                if (data.results && data.results.length > 0) {
                    const normalizedSelectedProvince = removeAccents(cleanPName);
                    const filteredSuggestions = data.results
                        .map((r: any) => r.formatted)
                        .filter((addr: string) => {
                            if (!addr) return false;
                            const normalizedAddr = removeAccents(addr);
                            return normalizedAddr.includes(normalizedSelectedProvince);
                        });

                    setSuggestions(filteredSuggestions);
                    setShowSuggestions(filteredSuggestions.length > 0);
                } else {
                    setSuggestions([]);
                    setShowSuggestions(false);
                }
            } catch (error) {
                console.error("Geoapify API Error:", error);
            } finally {
                setIsSearchingMap(false);
            }
        }, 500);
    };

    const handleSelectSuggestion = (address: string) => {
        setValue("addressDetail", address, { shouldValidate: true });
        setShowSuggestions(false);
    };

    // 🟢 Copy address to clipboard
    const copyAddressToClipboard = () => {
        navigator.clipboard.writeText(normalizedAddressPreview);
        setCopiedAddress(true);
        toast.success("Đã copy địa chỉ");
        setTimeout(() => setCopiedAddress(false), 2000);
    };

    const normalizedAddressPreview = (() => {
        const provinceName = provinces.find((p) => p.id === selectedProvince)?.full_name;
        const districtName = districts.find((d) => d.id === selectedDistrict)?.full_name;
        const wardName = wards.find((w) => w.id === selectedWard)?.full_name;
        return [addressDetail?.trim(), wardName, districtName, provinceName].filter(Boolean).join(", ");
    })();

    // Validation helpers
    const isNameValid = Boolean(nameValue?.trim());
    const isPhoneValid = Boolean(phoneValue?.trim() && phoneValue.replace(/\D/g, "").length === 10);
    const isEmailValid = Boolean(emailValue?.trim() && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailValue));
    const handleCheckDuplicate = async (field: "email" | "phone") => {
        const email = (watch("email") || "").trim();
        const phone = (watch("phone") || "").replace(/\D+/g, "");
        if (field === "email" && !email) return;
        if (field === "phone" && !phone) return;

        setIsCheckingDuplicate(true);
        try {
            const result = await customerService.checkDuplicate(email || undefined, phone || undefined);
            setInlineDuplicate((prev) => ({
                ...prev,
                email: result.emailExists ? "Email đã tồn tại trong hệ thống" : undefined,
                phone: result.phoneExists ? "Số điện thoại đã tồn tại trong hệ thống" : undefined,
            }));

            if (result.emailExists) {
                setError("email", { type: "manual", message: "Email đã tồn tại trong hệ thống" });
            } else {
                clearErrors("email");
            }

            if (result.phoneExists) {
                setError("phone", { type: "manual", message: "Số điện thoại đã tồn tại trong hệ thống" });
            } else {
                clearErrors("phone");
            }
        } catch (error) {
            console.error("Lỗi check duplicate:", error);
        } finally {
            setIsCheckingDuplicate(false);
        }
    };

    const onSave = async (data: CustomerFormValues) => {
        if (inlineDuplicate.email || inlineDuplicate.phone) {
            toast.error("Vui lòng xử lý lỗi trùng dữ liệu trước khi lưu");
            return;
        }

        setIsSubmitting(true);
        try {
            await customerService.create(data);
            clearDraft();
            window.dispatchEvent(new Event("customerUpdated"));
            toast.success("Thêm khách hàng thành công");
            router.push("/admin/customers");
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "Lỗi hệ thống";
            toast.error(errorMessage);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <form
            onSubmit={handleSubmit(onSave)}
            className="space-y-5 pb-[104px] w-full"
        >
            <div className="flex items-center justify-between px-1">
                <h1 className="text-[20px] font-semibold text-slate-900">THÊM KHÁCH HÀNG</h1>
            </div>

            <div className="space-y-4">
                <div className="space-y-4">
                    {/* Section 1: Basic Information */}
                    <div className="bg-white border border-slate-200 p-6 rounded-[4px] shadow-sm">
                        <div className="mb-6 text-[12px] font-semibold text-slate-900 border-b border-slate-200 pb-3">
                            1. Thông tin chính
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-x-5 gap-y-6">
                            {/* Name */}
                            <div className="space-y-1.5">
                                <Label className="text-[10.5px] font-semibold text-slate-500 flex items-center justify-between">
                                    <span>Họ và tên khách hàng *</span>
                                    {isNameValid && <CheckCircle2 size={14} className="text-emerald-500" />}
                                </Label>
                                <Input {...register("name")} placeholder="Ví dụ: Nguyễn Văn Đại..." className="h-10 text-[13px] border-slate-200 rounded-[4px] shadow-none font-normal focus:border-emerald-500" />
                                {errors.name && <p className="text-[10px] text-red-500">{errors.name.message}</p>}
                            </div>

                            {/* Phone */}
                            <div className="space-y-1.5">
                                <Label className="text-[10.5px] font-semibold text-slate-500 flex items-center justify-between">
                                    <span>Số điện thoại *</span>
                                    {isPhoneValid && <CheckCircle2 size={14} className="text-emerald-500" />}
                                </Label>
                                <div className="relative">
                                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={14} />
                                    <Input
                                        placeholder="090x xxx xxx"
                                        onChange={handlePhoneChange}
                                        onBlur={() => handleCheckDuplicate("phone")}
                                        value={phoneValue || ""}
                                        className="h-10 pl-9 text-[13px] border-slate-200 rounded-[4px] shadow-none font-normal focus:border-emerald-500"
                                    />
                                </div>
                                {errors.phone && <p className="text-[10px] text-red-500 flex items-center gap-1"><AlertCircle size={12} /> {errors.phone.message}</p>}
                            </div>

                            {/* Email */}
                            <div className="space-y-1.5">
                                <Label className="text-[10.5px] font-semibold text-slate-500 flex items-center justify-between">
                                    <span>Email liên hệ *</span>
                                    {isEmailValid && <CheckCircle2 size={14} className="text-emerald-500" />}
                                </Label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={14} />
                                    <Input
                                        {...register("email")}
                                        onBlur={() => handleCheckDuplicate("email")}
                                        placeholder="customer@gmail.com"
                                        className="h-10 pl-9 text-[13px] border-slate-200 rounded-[4px] shadow-none focus:border-emerald-500"
                                    />
                                </div>
                                {errors.email && <p className="text-[10px] text-red-500 flex items-center gap-1"><AlertCircle size={12} /> {errors.email.message}</p>}
                            </div>

                            {/* Gender */}
                            <div className="space-y-1.5">
                                <Label className="text-[10.5px] font-semibold text-slate-500">Giới tính</Label>
                                <Controller
                                    name="gender"
                                    control={control}
                                    render={({ field }) => (
                                        <Select onValueChange={field.onChange} value={field.value}>
                                            <SelectTrigger className="h-10 text-[13px] border-slate-200 rounded-[4px] shadow-none focus:ring-0">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent className="rounded-[4px] text-[12px]">
                                                <SelectItem value="MALE">Nam</SelectItem>
                                                <SelectItem value="FEMALE">Nữ</SelectItem>
                                                <SelectItem value="OTHER">Khác</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    )}
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-[10.5px] font-semibold text-slate-500">Trạng thái tài khoản</Label>
                                <Controller
                                    name="status"
                                    control={control}
                                    render={({ field }) => (
                                        <Select onValueChange={field.onChange} value={field.value}>
                                            <SelectTrigger className="h-10 text-[13px] border-slate-200 rounded-[4px] font-normal shadow-none focus:ring-0">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent className="rounded-[4px] text-[12px]">
                                                <SelectItem value="ACTIVE">Đang hoạt động</SelectItem>
                                                <SelectItem value="LOCKED">Tạm khóa</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    )}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Section 2: Address */}
                    <div className="bg-white border border-slate-200 p-6 rounded-[4px] shadow-sm">
                        <div className="mb-6 text-[12px] font-semibold text-slate-900 border-b border-slate-200 pb-3">
                            2. Địa chỉ
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-x-5 gap-y-6">
                            {/* Province */}
                            <div className="space-y-1.5 flex flex-col">
                                <Label className="text-[10.5px] font-semibold text-slate-500 flex items-center justify-between">
                                    <span>Tỉnh / Thành phố *</span>
                                    {Boolean(selectedProvince) && <CheckCircle2 size={14} className="text-emerald-500" />}
                                </Label>
                                <Controller
                                    name="provinceId"
                                    control={control}
                                    render={({ field }) => (
                                        <Popover open={openProvince} onOpenChange={setOpenProvince}>
                                            <PopoverTrigger asChild>
                                                <Button
                                                    variant="outline"
                                                    role="combobox"
                                                    aria-expanded={openProvince}
                                                    className="h-10 justify-between text-[13px] border-slate-200 rounded-[4px] shadow-none font-normal px-3 bg-white"
                                                >
                                                    {field.value
                                                        ? provinces.find((p) => p.id === field.value)?.full_name
                                                        : "-- Chọn hoặc Gõ Tỉnh/TP --"}
                                                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                                </Button>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-[--radix-popover-trigger-width] p-0 rounded-none">
                                                <Command className="rounded-none">
                                                    <CommandInput placeholder="Tìm kiếm Tỉnh/TP..." className="text-[12px] h-9" />
                                                    <CommandEmpty className="text-[12px] py-3 text-center">Không tìm thấy Tỉnh/TP.</CommandEmpty>
                                                    <CommandList>
                                                        <CommandGroup>
                                                            {provinces.map((p) => (
                                                                <CommandItem key={p.id} value={p.full_name} onSelect={() => { field.onChange(p.id); setOpenProvince(false); }} className="text-[12px]">
                                                                    <Check className={cn("mr-2 h-4 w-4", field.value === p.id ? "opacity-100" : "opacity-0")} />
                                                                    {p.full_name}
                                                                </CommandItem>
                                                            ))}
                                                        </CommandGroup>
                                                    </CommandList>
                                                </Command>
                                            </PopoverContent>
                                        </Popover>
                                    )}
                                />
                            </div>

                            {/* District */}
                            <div className="space-y-1.5 flex flex-col">
                                <Label className="text-[10.5px] font-semibold text-slate-500 flex items-center justify-between">
                                    <span>Quận / Huyện *</span>
                                    {Boolean(selectedDistrict) && <CheckCircle2 size={14} className="text-emerald-500" />}
                                </Label>
                                <Controller
                                    name="districtId"
                                    control={control}
                                    render={({ field }) => (
                                        <Popover open={openDistrict} onOpenChange={setOpenDistrict}>
                                            <PopoverTrigger asChild>
                                                <Button variant="outline" role="combobox" aria-expanded={openDistrict} disabled={!selectedProvince} className="h-10 justify-between text-[13px] border-slate-200 rounded-[4px] shadow-none font-normal px-3 bg-white disabled:opacity-50">
                                                    {field.value ? districts.find((d) => d.id === field.value)?.full_name : "-- Chọn hoặc Gõ Quận/Huyện --"}
                                                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                                </Button>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-[--radix-popover-trigger-width] p-0 rounded-none">
                                                <Command className="rounded-none">
                                                    <CommandInput placeholder="Tìm kiếm Quận/Huyện..." className="text-[12px] h-9" />
                                                    <CommandEmpty className="text-[12px] py-3 text-center">Không tìm thấy Quận/Huyện.</CommandEmpty>
                                                    <CommandList>
                                                        <CommandGroup>
                                                            {districts.map((d) => (
                                                                <CommandItem key={d.id} value={d.full_name} onSelect={() => { field.onChange(d.id); setOpenDistrict(false); }} className="text-[12px]">
                                                                    <Check className={cn("mr-2 h-4 w-4", field.value === d.id ? "opacity-100" : "opacity-0")} />
                                                                    {d.full_name}
                                                                </CommandItem>
                                                            ))}
                                                        </CommandGroup>
                                                    </CommandList>
                                                </Command>
                                            </PopoverContent>
                                        </Popover>
                                    )}
                                />
                            </div>

                            {/* Ward */}
                            <div className="space-y-1.5 flex flex-col">
                                <Label className="text-[10.5px] font-semibold text-slate-500 flex items-center justify-between">
                                    <span>Phường / Xã *</span>
                                    {Boolean(selectedWard) && <CheckCircle2 size={14} className="text-emerald-500" />}
                                </Label>
                                <Controller
                                    name="wardId"
                                    control={control}
                                    render={({ field }) => (
                                        <Popover open={openWard} onOpenChange={setOpenWard}>
                                            <PopoverTrigger asChild>
                                                <Button variant="outline" role="combobox" aria-expanded={openWard} disabled={!selectedDistrict} className="h-10 justify-between text-[13px] border-slate-200 rounded-[4px] shadow-none font-normal px-3 bg-white disabled:opacity-50">
                                                    {field.value ? wards.find((w) => w.id === field.value)?.full_name : "-- Chọn hoặc Gõ Phường/Xã --"}
                                                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                                </Button>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-[--radix-popover-trigger-width] p-0 rounded-none">
                                                <Command className="rounded-none">
                                                    <CommandInput placeholder="Tìm kiếm Phường/Xã..." className="text-[12px] h-9" />
                                                    <CommandEmpty className="text-[12px] py-3 text-center">Không tìm thấy Phường/Xã.</CommandEmpty>
                                                    <CommandList>
                                                        <CommandGroup>
                                                            {wards.map((w) => (
                                                                <CommandItem key={w.id} value={w.full_name} onSelect={() => { field.onChange(w.id); setOpenWard(false); }} className="text-[12px]">
                                                                    <Check className={cn("mr-2 h-4 w-4", field.value === w.id ? "opacity-100" : "opacity-0")} />
                                                                    {w.full_name}
                                                                </CommandItem>
                                                            ))}
                                                        </CommandGroup>
                                                    </CommandList>
                                                </Command>
                                            </PopoverContent>
                                        </Popover>
                                    )}
                                />
                            </div>

                            {/* Address Detail with Geoapify */}
                            <div className="md:col-span-3 space-y-1.5" ref={wrapperRef}>
                                <Label className="text-[10.5px] font-semibold text-slate-500 flex items-center justify-between">
                                    <span>Số nhà, tên đường (Địa chỉ chi tiết) *</span>
                                    {isSearchingMap && <span className="text-blue-500 flex items-center gap-1"><Loader2 size={10} className="animate-spin" /> Đang tìm...</span>}
                                </Label>
                                <div className="relative">
                                    <Input
                                        value={addressDetail}
                                        onChange={handleAddressChange}
                                        onFocus={() => { if (suggestions.length > 0) setShowSuggestions(true); }}
                                        placeholder={selectedProvince ? "Gõ số nhà, tên đường để Geoapify gợi ý..." : "Vui lòng chọn Tỉnh/Thành trước khi nhập địa chỉ..."}
                                        className="h-10 text-[13px] border-slate-200 rounded-[4px] focus:border-emerald-500 shadow-none bg-white"
                                        disabled={!selectedProvince}
                                        autoComplete="off"
                                    />

                                    {showSuggestions && suggestions.length > 0 && (
                                        <ul className="absolute z-50 w-full bg-white border border-slate-200 shadow-lg mt-1 rounded-[4px] max-h-[250px] overflow-y-auto animate-in fade-in slide-in-from-top-1 custom-scrollbar">
                                            {suggestions.map((addr, idx) => (
                                                <li
                                                    key={idx}
                                                    onClick={() => handleSelectSuggestion(addr)}
                                                    className="px-3 py-2.5 text-[12px] text-slate-700 hover:bg-slate-50 cursor-pointer border-b border-slate-100 last:border-0 flex items-start gap-2 transition-colors"
                                                >
                                                    <MapPinIcon size={14} className="mt-0.5 shrink-0 opacity-50 text-blue-500" />
                                                    <span className="line-clamp-2 leading-tight">{addr}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </div>

                                {/* Normalized Address Preview */}
                                <div className="mt-2 p-3 border border-slate-200 bg-slate-50 rounded-[4px] flex items-start justify-between gap-2">
                                    <div>
                                        <p className="text-[10.5px] font-semibold text-slate-500 mb-1">Địa chỉ chuẩn hóa</p>
                                        <p className="text-[11px] text-slate-700 leading-relaxed">
                                            {normalizedAddressPreview || "Chưa đủ dữ liệu để chuẩn hóa địa chỉ"}
                                        </p>
                                    </div>
                                    {normalizedAddressPreview && (
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            onClick={copyAddressToClipboard}
                                            className="h-7 w-7 shrink-0 hover:bg-slate-200 rounded-[4px]"
                                        >
                                            {copiedAddress ? <CheckCircle2 size={14} className="text-emerald-600" /> : <Copy size={14} className="text-slate-500" />}
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Section 3: Assignment & Notes */}
                    <div className="bg-white border border-slate-200 p-6 rounded-[4px] shadow-sm">
                        <div className="mb-6 text-[12px] font-semibold text-slate-900 border-b border-slate-200 pb-3">
                            3. Phụ trách & ghi chú
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-x-5 gap-y-6">
                            {/* Branch */}
                            <div className="space-y-1.5 flex flex-col">
                                <Label className="text-[10.5px] font-semibold text-slate-500">Chi nhánh</Label>
                                <Controller
                                    name="branchId"
                                    control={control}
                                    render={({ field }) => (
                                        <Popover open={openBranch} onOpenChange={setOpenBranch}>
                                            <PopoverTrigger asChild>
                                                <Button
                                                    variant="outline"
                                                    role="combobox"
                                                    aria-expanded={openBranch}
                                                    className="h-10 justify-between text-[13px] border-slate-200 rounded-[4px] shadow-none font-normal px-3 bg-white"
                                                >
                                                    {isLoadingBranches ? (
                                                        <span className="flex items-center gap-1"><Loader2 size={12} className="animate-spin" /> Đang tải...</span>
                                                    ) : field.value
                                                        ? branches.find((b) => b.id.toString() === field.value)?.name
                                                        : "-- Chọn chi nhánh --"
                                                    }
                                                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                                </Button>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-[--radix-popover-trigger-width] p-0 rounded-none">
                                                <Command className="rounded-none">
                                                    <CommandInput placeholder="Tìm kiếm chi nhánh..." className="text-[12px] h-9" />
                                                    <CommandEmpty className="text-[12px] py-3 text-center">Không tìm thấy chi nhánh.</CommandEmpty>
                                                    <CommandList>
                                                        <CommandGroup>
                                                            {branches.map((b) => (
                                                                <CommandItem key={b.id} value={b.name} onSelect={() => { field.onChange(b.id.toString()); setOpenBranch(false); }} className="text-[12px]">
                                                                    <Check className={cn("mr-2 h-4 w-4", field.value === b.id.toString() ? "opacity-100" : "opacity-0")} />
                                                                    {b.name}
                                                                </CommandItem>
                                                            ))}
                                                        </CommandGroup>
                                                    </CommandList>
                                                </Command>
                                            </PopoverContent>
                                        </Popover>
                                    )}
                                />
                            </div>

                            {/* Staff */}
                            <div className="space-y-1.5 flex flex-col">
                                <Label className="text-[10.5px] font-semibold text-slate-500">Nhân viên phụ trách</Label>
                                <Controller
                                    name="staffAssignedId"
                                    control={control}
                                    render={({ field }) => (
                                        <Popover open={openStaff} onOpenChange={setOpenStaff}>
                                            <PopoverTrigger asChild>
                                                <Button
                                                    variant="outline"
                                                    role="combobox"
                                                    aria-expanded={openStaff}
                                                    disabled={!selectedBranch}
                                                    className="h-10 justify-between text-[13px] border-slate-200 rounded-[4px] shadow-none font-normal px-3 bg-white disabled:opacity-50"
                                                >
                                                    {isLoadingStaff ? (
                                                        <span className="flex items-center gap-1"><Loader2 size={12} className="animate-spin" /> Đang tải...</span>
                                                    ) : field.value
                                                        ? staffList.find((s) => s.id.toString() === field.value)?.fullName
                                                        : "-- Chọn nhân viên --"
                                                    }
                                                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                                </Button>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-[--radix-popover-trigger-width] p-0 rounded-none">
                                                <Command className="rounded-none">
                                                    <CommandInput placeholder="Tìm kiếm nhân viên..." className="text-[12px] h-9" />
                                                    <CommandEmpty className="text-[12px] py-3 text-center">Không tìm thấy nhân viên.</CommandEmpty>
                                                    <CommandList>
                                                        <CommandGroup>
                                                            {staffList.map((s) => (
                                                                <CommandItem key={s.id} value={s.fullName} onSelect={() => { field.onChange(s.id.toString()); setOpenStaff(false); }} className="text-[12px]">
                                                                    <Check className={cn("mr-2 h-4 w-4", field.value === s.id.toString() ? "opacity-100" : "opacity-0")} />
                                                                    <div className="flex flex-col">
                                                                        <span>{s.fullName}</span>
                                                                        <span className="text-[10px] text-slate-500">{s.email}</span>
                                                                    </div>
                                                                </CommandItem>
                                                            ))}
                                                        </CommandGroup>
                                                    </CommandList>
                                                </Command>
                                            </PopoverContent>
                                        </Popover>
                                    )}
                                />
                            </div>

                            {/* Internal Notes */}
                            <div className="sm:col-span-2 xl:col-span-3 space-y-1.5">
                                <Label className="text-[10.5px] font-semibold text-slate-500">
                                    Ghi chú nội bộ
                                </Label>
                                <Textarea
                                    {...register("internalNotes")}
                                    placeholder="Thêm ghi chú về khách hàng này cho bộ phận nội bộ..."
                                    className="min-h-[84px] text-[13px] border-slate-200 rounded-[4px] shadow-none focus:border-emerald-500 resize-none font-normal"
                                />
                                {errors.internalNotes && <p className="text-[10px] text-red-500">{errors.internalNotes.message}</p>}
                            </div>
                        </div>
                    </div>
                </div>

            </div>

            <div className="fixed bottom-0 left-0 right-0 z-[999] border-t border-slate-200 bg-white px-4 py-3 lg:left-[260px] flex items-center justify-end gap-3">
                <Button type="button" variant="outline" className="min-w-[120px] h-10 text-[13px] font-medium border-slate-200 bg-white shadow-none hover:bg-slate-50 transition-all rounded-[4px]" onClick={() => router.back()}>
                    Hủy
                </Button>
                <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="min-w-[180px] h-10 text-[13px] font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-none transition-all active:scale-[0.98] rounded-[4px]"
                >
                    <Save size={16} className="mr-2" />
                    {isSubmitting ? "Đang lưu..." : "Thêm khách hàng"}
                </Button>
            </div>
        </form>
    );
}
