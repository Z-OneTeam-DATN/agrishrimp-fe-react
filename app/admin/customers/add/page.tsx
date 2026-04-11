"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
    X,
    Save,
    ChevronLeft,
    User,
    Mail,
    Phone,
    MapPin,
    UserCircle,
    ShieldCheck,
    Check,
    ChevronsUpDown,
    Loader2,
    AlertCircle,
    MapPin as MapPinIcon,
    Copy,
    CheckCircle2,
    Building2,
    Users,
    FileText
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
    const [submitMode, setSubmitMode] = useState<"list" | "add-more">("list");

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
    const [isCheckingDuplicate, setIsCheckingDuplicate] = useState(false);
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
        reset,
        getValues,
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
    const isAddressComplete = Boolean(selectedProvince && selectedDistrict && selectedWard && addressDetail?.trim());

    const step1Complete = isNameValid && isPhoneValid && isEmailValid;
    const step2Complete = isAddressComplete;
    const activeStep = !step1Complete ? 1 : !step2Complete ? 2 : 3;

    // Calculate form completion percentage
    const completionPercentage = Math.round(
        ((isNameValid ? 1 : 0) +
            (isPhoneValid ? 1 : 0) +
            (isEmailValid ? 1 : 0) +
            (Boolean(selectedProvince) ? 1 : 0) +
            (Boolean(selectedDistrict) ? 1 : 0) +
            (Boolean(selectedWard) ? 1 : 0) +
            (Boolean(addressDetail?.trim()) ? 1 : 0) +
            (Boolean(selectedBranch) ? 0.5 : 0)) /
            8 *
            100
    );

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
            if (submitMode === "add-more") {
                toast.success("Đã lưu khách hàng. Bạn có thể thêm khách hàng tiếp theo.");
                reset({
                    status: "ACTIVE",
                    gender: "MALE",
                    addressDetail: "",
                    provinceId: "",
                    districtId: "",
                    wardId: "",
                    name: "",
                    email: "",
                    phone: "",
                    branchId: "",
                    staffAssignedId: "",
                    internalNotes: "",
                });
                setDistricts([]);
                setWards([]);
                setSuggestions([]);
                setInlineDuplicate({});
                window.scrollTo({ top: 0, behavior: "smooth" });
            } else {
                toast.success("Thêm khách hàng và gửi mail thành công!");
                router.push("/admin/customers");
            }
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
            className="space-y-5 pb-[110px] bg-slate-50/30 min-h-screen px-4 md:px-6 lg:px-8 max-w-[1400px] mx-auto"
        >
            {/* Header */}
            <div className="flex items-center gap-4 mb-1 px-1">
                <Button type="button" variant="ghost" size="icon" onClick={() => router.back()} className="h-8 w-8 text-slate-400">
                    <ChevronLeft size={20} />
                </Button>
                <div className="flex flex-col">
                    <h1 className="text-[18px] font-black text-[#1f1f1f] tracking-tight uppercase">Thêm khách hàng mới</h1>
                    <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest flex items-center gap-1">
                        <UserCircle size={12} /> Hồ sơ đối tác & khách hàng AgriShrimp
                    </p>
                </div>
                <div className="ms-auto flex items-center gap-2 text-gray-400">
                    <Button type="button" variant="ghost" size="icon" onClick={() => router.back()} className="h-8 w-8">
                        <X size={20} />
                    </Button>
                </div>
            </div>

            {/* 🟢 Progress Bar */}
            <div className="bg-white border border-[#dcdcdc] rounded-[4px] shadow-sm p-4">
                <div className="flex items-center justify-between mb-2">
                    <p className="text-[10px] font-black text-slate-600 uppercase">Tiến độ hoàn thành</p>
                    <p className="text-[12px] font-black text-blue-600">{completionPercentage.toFixed(0)}%</p>
                </div>
                <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                    <div
                        className="h-full bg-gradient-to-r from-blue-500 to-emerald-500 transition-all duration-300"
                        style={{ width: `${completionPercentage}%` }}
                    />
                </div>
            </div>

            {/* Step Indicator */}
            <div className="bg-white border border-[#dcdcdc] rounded-[4px] shadow-sm p-3 md:p-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2 md:gap-3">
                    <div className={cn("flex items-center gap-2 px-3 py-2 border rounded-[4px]", activeStep >= 1 ? "border-blue-200 bg-blue-50" : "border-slate-200 bg-slate-50")}>
                        <span className={cn("w-5 h-5 rounded-full text-[10px] font-black flex items-center justify-center", activeStep >= 1 ? "bg-blue-600 text-white" : "bg-slate-300 text-slate-700")}>1</span>
                        <div>
                            <p className="text-[10px] font-black uppercase text-slate-700">Bước 1</p>
                            <p className="text-[11px] font-bold text-slate-600">Thông tin</p>
                        </div>
                    </div>
                    <div className={cn("flex items-center gap-2 px-3 py-2 border rounded-[4px]", activeStep >= 2 ? "border-blue-200 bg-blue-50" : "border-slate-200 bg-slate-50")}>
                        <span className={cn("w-5 h-5 rounded-full text-[10px] font-black flex items-center justify-center", activeStep >= 2 ? "bg-blue-600 text-white" : "bg-slate-300 text-slate-700")}>2</span>
                        <div>
                            <p className="text-[10px] font-black uppercase text-slate-700">Bước 2</p>
                            <p className="text-[11px] font-bold text-slate-600">Địa chỉ</p>
                        </div>
                    </div>
                    <div className={cn("flex items-center gap-2 px-3 py-2 border rounded-[4px]", activeStep >= 3 ? "border-emerald-200 bg-emerald-50" : "border-slate-200 bg-slate-50")}>
                        <span className={cn("w-5 h-5 rounded-full text-[10px] font-black flex items-center justify-center", activeStep >= 3 ? "bg-emerald-600 text-white" : "bg-slate-300 text-slate-700")}>3</span>
                        <div>
                            <p className="text-[10px] font-black uppercase text-slate-700">Bước 3</p>
                            <p className="text-[11px] font-bold text-slate-600">Xác nhận</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 xl:gap-5 items-start">
                <div className="lg:col-span-8 space-y-4">
                    {/* Section 1: Basic Information */}
                    <div className="bg-white border border-[#dcdcdc] p-5 rounded-[4px] shadow-sm">
                        <div className="flex items-center gap-2 mb-5 text-blue-700 font-black text-[11px] uppercase tracking-widest border-b pb-2.5">
                            <User size={16} /> 1. Thông tin định danh khách hàng
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-5">
                            {/* Name */}
                            <div className="md:col-span-3 space-y-1.5">
                                <Label className="text-[10px] font-black text-slate-500 uppercase tracking-tight flex items-center justify-between">
                                    <span>Họ và tên khách hàng *</span>
                                    {isNameValid && <CheckCircle2 size={14} className="text-emerald-500" />}
                                </Label>
                                <Input {...register("name")} placeholder="Ví dụ: Nguyễn Văn Đại..." className="h-[34px] text-[13px] border-[#ccc] rounded-none shadow-none font-bold focus:border-blue-500" />
                                {errors.name && <p className="text-[10px] text-red-500">{errors.name.message}</p>}
                            </div>

                            {/* Phone */}
                            <div className="space-y-1.5">
                                <Label className="text-[10px] font-black text-slate-500 uppercase tracking-tight flex items-center justify-between">
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
                                        className="h-[34px] pl-9 text-[13px] border-[#ccc] rounded-none shadow-none font-bold focus:border-blue-500"
                                    />
                                </div>
                                {errors.phone && <p className="text-[10px] text-red-500 flex items-center gap-1"><AlertCircle size={12} /> {errors.phone.message}</p>}
                            </div>

                            {/* Email */}
                            <div className="space-y-1.5">
                                <Label className="text-[10px] font-black text-slate-500 uppercase tracking-tight flex items-center justify-between">
                                    <span>Email liên hệ *</span>
                                    {isEmailValid && <CheckCircle2 size={14} className="text-emerald-500" />}
                                </Label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={14} />
                                    <Input
                                        {...register("email")}
                                        onBlur={() => handleCheckDuplicate("email")}
                                        placeholder="customer@gmail.com"
                                        className="h-[34px] pl-9 text-[13px] border-[#ccc] rounded-none shadow-none focus:border-blue-500"
                                    />
                                </div>
                                {errors.email && <p className="text-[10px] text-red-500 flex items-center gap-1"><AlertCircle size={12} /> {errors.email.message}</p>}
                            </div>

                            {/* Gender */}
                            <div className="space-y-1.5">
                                <Label className="text-[10px] font-black text-slate-500 uppercase tracking-tight">Giới tính</Label>
                                <Controller
                                    name="gender"
                                    control={control}
                                    render={({ field }) => (
                                        <Select onValueChange={field.onChange} value={field.value}>
                                            <SelectTrigger className="h-[34px] text-[13px] border-[#ccc] rounded-none shadow-none focus:ring-0">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent className="rounded-none font-bold text-[11px]">
                                                <SelectItem value="MALE">NAM GIỚI</SelectItem>
                                                <SelectItem value="FEMALE">NỮ GIỚI</SelectItem>
                                                <SelectItem value="OTHER">KHÁC</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    )}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Section 2: Address */}
                    <div className="bg-white border border-[#dcdcdc] p-5 rounded-[4px] shadow-sm">
                        <div className="flex items-center gap-2 mb-5 text-blue-700 font-black text-[11px] uppercase tracking-widest border-b pb-2.5">
                            <MapPin size={16} /> 2. Địa chỉ thường trú & Vị trí giao hàng
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-5">
                            {/* Province */}
                            <div className="space-y-1.5 flex flex-col">
                                <Label className="text-[10px] font-black text-slate-500 uppercase tracking-tight flex items-center justify-between">
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
                                                    className="h-[34px] justify-between text-[12px] border-[#ccc] rounded-none shadow-none font-normal px-3 bg-white"
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
                                <Label className="text-[10px] font-black text-slate-500 uppercase tracking-tight flex items-center justify-between">
                                    <span>Quận / Huyện *</span>
                                    {Boolean(selectedDistrict) && <CheckCircle2 size={14} className="text-emerald-500" />}
                                </Label>
                                <Controller
                                    name="districtId"
                                    control={control}
                                    render={({ field }) => (
                                        <Popover open={openDistrict} onOpenChange={setOpenDistrict}>
                                            <PopoverTrigger asChild>
                                                <Button variant="outline" role="combobox" aria-expanded={openDistrict} disabled={!selectedProvince} className="h-[34px] justify-between text-[12px] border-[#ccc] rounded-none shadow-none font-normal px-3 bg-white disabled:opacity-50">
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
                                <Label className="text-[10px] font-black text-slate-500 uppercase tracking-tight flex items-center justify-between">
                                    <span>Phường / Xã *</span>
                                    {Boolean(selectedWard) && <CheckCircle2 size={14} className="text-emerald-500" />}
                                </Label>
                                <Controller
                                    name="wardId"
                                    control={control}
                                    render={({ field }) => (
                                        <Popover open={openWard} onOpenChange={setOpenWard}>
                                            <PopoverTrigger asChild>
                                                <Button variant="outline" role="combobox" aria-expanded={openWard} disabled={!selectedDistrict} className="h-[34px] justify-between text-[12px] border-[#ccc] rounded-none shadow-none font-normal px-3 bg-white disabled:opacity-50">
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
                                <Label className="text-[10px] font-black text-slate-500 uppercase tracking-tight flex items-center justify-between">
                                    <span>Số nhà, tên đường (Địa chỉ chi tiết) *</span>
                                    {isSearchingMap && <span className="text-blue-500 flex items-center gap-1"><Loader2 size={10} className="animate-spin" /> Đang tìm...</span>}
                                </Label>
                                <div className="relative">
                                    <Input
                                        value={addressDetail}
                                        onChange={handleAddressChange}
                                        onFocus={() => { if (suggestions.length > 0) setShowSuggestions(true); }}
                                        placeholder={selectedProvince ? "Gõ số nhà, tên đường để Geoapify gợi ý..." : "Vui lòng chọn Tỉnh/Thành trước khi nhập địa chỉ..."}
                                        className="h-[34px] text-[13px] border-[#ccc] rounded-none focus:border-blue-500 shadow-none bg-blue-50/30"
                                        disabled={!selectedProvince}
                                        autoComplete="off"
                                    />

                                    {showSuggestions && suggestions.length > 0 && (
                                        <ul className="absolute z-50 w-full bg-white border border-[#ccc] shadow-lg mt-1 rounded-none max-h-[250px] overflow-y-auto animate-in fade-in slide-in-from-top-1 custom-scrollbar">
                                            {suggestions.map((addr, idx) => (
                                                <li
                                                    key={idx}
                                                    onClick={() => handleSelectSuggestion(addr)}
                                                    className="px-3 py-2.5 text-[12px] text-slate-700 hover:bg-blue-50 hover:text-blue-700 cursor-pointer border-b border-slate-100 last:border-0 flex items-start gap-2 transition-colors"
                                                >
                                                    <MapPinIcon size={14} className="mt-0.5 shrink-0 opacity-50 text-blue-500" />
                                                    <span className="line-clamp-2 leading-tight">{addr}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </div>

                                {/* Normalized Address Preview */}
                                <div className="mt-2 p-3 border border-blue-100 bg-blue-50/40 rounded-[4px] flex items-start justify-between gap-2">
                                    <div>
                                        <p className="text-[10px] font-black uppercase tracking-wider text-blue-700 mb-1">Địa chỉ chuẩn hóa trước khi lưu</p>
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
                                            className="h-8 w-8 shrink-0 hover:bg-blue-200"
                                        >
                                            {copiedAddress ? <CheckCircle2 size={16} className="text-emerald-500" /> : <Copy size={16} className="text-blue-600" />}
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Section 3: Assignment & Notes */}
                    <div className="bg-white border border-[#dcdcdc] p-5 rounded-[4px] shadow-sm">
                        <div className="flex items-center gap-2 mb-5 text-blue-700 font-black text-[11px] uppercase tracking-widest border-b pb-2.5">
                            <Building2 size={16} /> 3. Gán chi nhánh & Nhân viên phụ trách
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
                            {/* Branch */}
                            <div className="space-y-1.5 flex flex-col">
                                <Label className="text-[10px] font-black text-slate-500 uppercase tracking-tight">Chi nhánh</Label>
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
                                                    className="h-[34px] justify-between text-[12px] border-[#ccc] rounded-none shadow-none font-normal px-3 bg-white"
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
                                <Label className="text-[10px] font-black text-slate-500 uppercase tracking-tight">Nhân viên phụ trách</Label>
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
                                                    className="h-[34px] justify-between text-[12px] border-[#ccc] rounded-none shadow-none font-normal px-3 bg-white disabled:opacity-50"
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
                            <div className="md:col-span-2 space-y-1.5">
                                <Label className="text-[10px] font-black text-slate-500 uppercase tracking-tight flex items-center gap-2">
                                    <FileText size={14} /> Ghi chú nội bộ (chỉ nhân viên thấy)
                                </Label>
                                <Textarea
                                    {...register("internalNotes")}
                                    placeholder="Thêm ghi chú về khách hàng này cho bộ phận nội bộ..."
                                    className="h-[80px] text-[13px] border-[#ccc] rounded-none shadow-none focus:border-blue-500 resize-none font-medium"
                                />
                                {errors.internalNotes && <p className="text-[10px] text-red-500">{errors.internalNotes.message}</p>}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Sidebar */}
                <div className="lg:col-span-4 space-y-4 lg:sticky lg:top-4">
                    {/* Status */}
                    <div className="bg-white border border-[#dcdcdc] p-5 rounded-[4px] shadow-sm">
                        <Label className="text-[11px] font-black text-slate-700 uppercase block mb-5 tracking-widest border-b pb-3">
                            Trạng thái tài khoản
                        </Label>
                        <Controller
                            name="status"
                            control={control}
                            render={({ field }) => (
                                <Select onValueChange={field.onChange} value={field.value}>
                                    <SelectTrigger className="h-[38px] text-[13px] border-[#ccc] rounded-none font-black text-emerald-600 shadow-none uppercase focus:ring-0">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-none">
                                        <SelectItem value="ACTIVE" className="text-emerald-600 font-bold">ĐANG HOẠT ĐỘNG</SelectItem>
                                        <SelectItem value="LOCKED" className="text-rose-600 font-bold">ĐANG TẠM KHÓA</SelectItem>
                                    </SelectContent>
                                </Select>
                            )}
                        />
                    </div>

                    {/* Data Rules */}
                    <div className="p-4 bg-blue-50 border border-blue-100 rounded-[4px]">
                        <div className="flex items-center gap-2 text-blue-700 font-black text-[10px] uppercase mb-3 tracking-widest border-b border-blue-200 pb-1.5">
                            <ShieldCheck size={14} /> Quy tắc dữ liệu
                        </div>
                        <p className="text-[11px] text-blue-700/80 leading-relaxed font-medium italic">
                            * Hệ thống sẽ tự động gửi Email tài khoản ngay khi bạn nhấn lưu thành công.
                        </p>
                        {isCheckingDuplicate && (
                            <p className="text-[10px] mt-2 text-blue-600 font-bold">Đang kiểm tra trùng email/số điện thoại...</p>
                        )}
                    </div>
                </div>
            </div>

            {/* Footer Actions */}
            <div className="sticky bottom-3 bg-white/95 backdrop-blur border border-[#ddd] rounded-[6px] p-3 md:p-4 flex items-center justify-end gap-3 z-30 shadow-[0_8px_24px_rgba(0,0,0,0.08)]">
                <Button type="button" variant="outline" className="min-w-[110px] h-[38px] text-[12px] font-bold border-[#ccc] bg-white shadow-sm hover:bg-slate-50 transition-all uppercase" onClick={() => router.back()}>
                    HỦY BỎ
                </Button>
                <Button
                    type="submit"
                    disabled={isSubmitting}
                    onClick={() => setSubmitMode("add-more")}
                    className="min-w-[170px] h-[38px] text-[12px] font-black bg-indigo-600 hover:bg-indigo-700 text-white shadow-md transition-all active:scale-[0.98] uppercase"
                >
                    <Save size={16} className="mr-2" />
                    {isSubmitting ? "ĐANG LƯU..." : "LƯU & THÊM MỚI"}
                </Button>
                <Button
                    type="submit"
                    disabled={isSubmitting}
                    onClick={() => setSubmitMode("list")}
                    className="min-w-[180px] h-[38px] text-[12px] font-black bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-100 transition-all active:scale-[0.98] uppercase"
                >
                    <Save size={18} className="mr-2" />
                    {isSubmitting ? "ĐANG LƯU..." : "LƯU HỒ SƠ KHÁCH HÀNG"}
                </Button>
            </div>
        </form>
    );
}
