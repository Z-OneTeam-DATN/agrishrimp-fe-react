"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
    X,
    Settings,
    HelpCircle,
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
    MapPin as MapPinIcon
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
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { CustomerSchema, CustomerFormValues } from "@/app/types/admin.schema";
import { customerService } from "@/app/services/customer.service";

// ==========================================
// ĐIỀN GEOAPIFY API KEY CỦA BẠN VÀO ĐÂY
// ==========================================
const GEOAPIFY_TOKEN = "56418528a46b4ca390f6f7937e0b4591";

interface LocationItem {
    id: string;
    full_name: string;
}

export default function AddCustomerPage() {
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);

    // States lưu data địa chỉ (Combobox)
    const [provinces, setProvinces] = useState<LocationItem[]>([]);
    const [districts, setDistricts] = useState<LocationItem[]>([]);
    const [wards, setWards] = useState<LocationItem[]>([]);

    // States quản lý đóng mở Combobox
    const [openProvince, setOpenProvince] = useState(false);
    const [openDistrict, setOpenDistrict] = useState(false);
    const [openWard, setOpenWard] = useState(false);

    // States cho Geoapify Autocomplete
    const [suggestions, setSuggestions] = useState<string[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [isSearchingMap, setIsSearchingMap] = useState(false);
    const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const wrapperRef = useRef<HTMLDivElement>(null);

    const {
        register,
        handleSubmit,
        control,
        watch,
        setValue,
        formState: { errors },
    } = useForm<CustomerFormValues>({
        resolver: zodResolver(CustomerSchema),
        defaultValues: {
            status: "ACTIVE",
            gender: "MALE",
            addressDetail: "",
        },
    });

    const selectedProvince = watch("provinceId");
    const selectedDistrict = watch("districtId");
    const selectedWard = watch("wardId");
    const addressDetail = watch("addressDetail");

    // 1. Load Tỉnh/Thành khi mount
    useEffect(() => {
        fetch("https://esgoo.net/api-tinhthanh/1/0.htm")
            .then((res) => res.json())
            .then((data) => {
                if (data.error === 0) setProvinces(data.data);
            });
    }, []);

    // 2. Load Quận/Huyện khi Tỉnh thay đổi
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

    // 3. Load Phường/Xã khi Huyện thay đổi
    useEffect(() => {
        if (selectedDistrict) {
            fetch(`https://esgoo.net/api-tinhthanh/3/${selectedDistrict}.htm`)
                .then((res) => res.json())
                .then((data) => {
                    if (data.error === 0) setWards(data.data);
                });
        }
    }, [selectedDistrict, setValue]);

    // 4. Click ra ngoài để đóng dropdown Gợi ý
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setShowSuggestions(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // 🟢 Hàm phụ trợ: Loại bỏ dấu tiếng Việt để so sánh chuẩn xác 100%
    const removeAccents = (str: string) => {
        if (!str) return "";
        return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
    };

    // 5. Hàm xử lý khi người dùng gõ vào ô Địa chỉ chi tiết (Gọi Geoapify API)
    const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setValue("addressDetail", value, { shouldValidate: true });

        if (!value || value.length < 3) {
            setSuggestions([]);
            setShowSuggestions(false);
            return;
        }

        // Debounce: Chờ khách ngừng gõ 500ms mới gọi API
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

        typingTimeoutRef.current = setTimeout(async () => {
            setIsSearchingMap(true);
            try {
                // 1. LẤY DATA VÀ CẮT BỎ TIỀN TỐ GÂY NHIỄU CHO BẢN ĐỒ
                const rawPName = provinces.find((p) => p.id === selectedProvince)?.full_name || "";
                const rawDName = districts.find((d) => d.id === selectedDistrict)?.full_name || "";

                // Biến "Tỉnh Kiên Giang" -> "Kiên Giang", "Thành phố Hồ Chí Minh" -> "Hồ Chí Minh"
                const cleanPName = rawPName.replace(/^(Tỉnh|Thành phố)\s+/i, "").trim();
                const cleanDName = rawDName.replace(/^(Quận|Huyện|Thị xã|Thành phố)\s+/i, "").trim();

                // Ghép chuỗi truy vấn siêu sạch (VD: "123 Trần Hưng Đạo, Tân Hiệp, Kiên Giang")
                const contextArr = [cleanDName, cleanPName].filter(Boolean);
                const searchQuery = contextArr.length > 0 ? `${value}, ${contextArr.join(", ")}` : value;

                // Gọi API Geoapify (Thêm &lang=vi để ép trả về Tiếng Việt)
                const res = await fetch(
                    `https://api.geoapify.com/v1/geocode/autocomplete?text=${encodeURIComponent(searchQuery)}&filter=countrycode:vn&lang=vi&limit=15&format=json&apiKey=${GEOAPIFY_TOKEN}`
                );
                const data = await res.json();

                if (data.results && data.results.length > 0) {

                    // 2. BỘ LỌC CỨNG: Chặn đứng các địa chỉ ở Tỉnh/Thành khác trả về
                    const normalizedSelectedProvince = removeAccents(cleanPName);

                    const filteredSuggestions = data.results
                        .map((r: any) => r.formatted)
                        .filter((addr: string) => {
                            if (!addr) return false;
                            // Ép về không dấu để kiểm tra (VD: Cần Thơ = can tho)
                            const normalizedAddr = removeAccents(addr);
                            // Chỉ giữ lại kết quả nếu nó có chứa tên Tỉnh mình đang chọn
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

    const onSave = async (data: CustomerFormValues) => {
        setIsSubmitting(true);
        try {
            await customerService.create(data);
            window.dispatchEvent(new Event("customerUpdated"));
            toast.success("Thêm khách hàng và gửi mail thành công!");
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
            className="space-y-4 pb-[100px] bg-slate-50/30 p-4 min-h-screen"
        >
            <div className="flex items-center gap-4 mb-2 px-1">
                <Button type="button" variant="ghost" size="icon" onClick={() => router.back()} className="h-8 w-8 text-slate-400">
                    <ChevronLeft size={20} />
                </Button>
                <div className="flex flex-col">
                    <h1 className="text-[18px] font-black text-[#1f1f1f] tracking-tight uppercase">Thêm khách hàng mới</h1>
                    <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest flex items-center gap-1">
                        <UserCircle size={12} /> Hồ sơ đối tác & khách hàng AgriShrimp
                    </p>
                </div>
                <div className="ms-auto flex items-center gap-3 text-gray-400">
                    <Settings size={18} className="cursor-pointer hover:text-blue-600 transition-colors" />
                    <HelpCircle size={18} className="cursor-pointer hover:text-blue-600 transition-colors" />
                    <Button type="button" variant="ghost" size="icon" onClick={() => router.back()} className="h-8 w-8">
                        <X size={20} />
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                <div className="lg:col-span-9 space-y-5">
                    {/* 1. Thông tin cơ bản */}
                    <div className="bg-white border border-[#dcdcdc] p-6 rounded-none shadow-sm">
                        <div className="flex items-center gap-2 mb-6 text-blue-700 font-black text-[11px] uppercase tracking-widest border-b pb-3">
                            <User size={16} /> 1. Thông tin định danh khách hàng
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-5">
                            <div className="md:col-span-3 space-y-1.5">
                                <Label className="text-[10px] font-black text-slate-500 uppercase tracking-tight">Họ và tên khách hàng *</Label>
                                <Input {...register("name")} placeholder="Ví dụ: Nguyễn Văn Đại..." className="h-[34px] text-[13px] border-[#ccc] rounded-none shadow-none font-bold focus:border-blue-500" />
                                {errors.name && <p className="text-[10px] text-red-500">{errors.name.message}</p>}
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-[10px] font-black text-slate-500 uppercase tracking-tight">Số điện thoại *</Label>
                                <div className="relative">
                                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={14} />
                                    <Input {...register("phone")} placeholder="090x xxx xxx" className="h-[34px] pl-9 text-[13px] border-[#ccc] rounded-none shadow-none font-bold focus:border-blue-500" />
                                </div>
                                {errors.phone && <p className="text-[10px] text-red-500">{errors.phone.message}</p>}
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-[10px] font-black text-slate-500 uppercase tracking-tight">Email liên hệ *</Label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={14} />
                                    <Input {...register("email")} placeholder="customer@gmail.com" className="h-[34px] pl-9 text-[13px] border-[#ccc] rounded-none shadow-none focus:border-blue-500" />
                                </div>
                                {errors.email && <p className="text-[10px] text-red-500">{errors.email.message}</p>}
                            </div>
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

                    {/* 2. Địa chỉ động & Geoapify Autocomplete */}
                    <div className="bg-white border border-[#dcdcdc] p-6 rounded-none shadow-sm">
                        <div className="flex items-center gap-2 mb-6 text-blue-700 font-black text-[11px] uppercase tracking-widest border-b pb-3">
                            <MapPin size={16} /> 2. Địa chỉ thường trú & Vị trí giao hàng
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-5">

                            {/* Tỉnh/Thành Combobox */}
                            <div className="space-y-1.5 flex flex-col">
                                <Label className="text-[10px] font-black text-slate-500 uppercase tracking-tight">Tỉnh / Thành phố *</Label>
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

                            {/* Quận/Huyện Combobox */}
                            <div className="space-y-1.5 flex flex-col">
                                <Label className="text-[10px] font-black text-slate-500 uppercase tracking-tight">Quận / Huyện *</Label>
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

                            {/* Phường/Xã Combobox */}
                            <div className="space-y-1.5 flex flex-col">
                                <Label className="text-[10px] font-black text-slate-500 uppercase tracking-tight">Phường / Xã *</Label>
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

                            {/* Gõ địa chỉ chi tiết (GEOAPIFY AUTOCOMPLETE) */}
                            <div className="md:col-span-3 space-y-1.5" ref={wrapperRef}>
                                <Label className="text-[10px] font-black text-slate-500 uppercase tracking-tight flex items-center justify-between">
                                    <span>Số nhà, tên đường (Địa chỉ chi tiết) *</span>
                                    {isSearchingMap && <span className="text-blue-500 flex items-center gap-1"><Loader2 size={10} className="animate-spin" /> Đang tìm...</span>}
                                </Label>
                                <div className="relative">
                                    <Input
                                        value={addressDetail}
                                        onChange={handleAddressChange}
                                        onFocus={() => { if(suggestions.length > 0) setShowSuggestions(true); }}
                                        placeholder={selectedProvince ? "Gõ số nhà, tên đường để Geoapify gợi ý..." : "Vui lòng chọn Tỉnh/Thành trước khi nhập địa chỉ..."}
                                        className="h-[34px] text-[13px] border-[#ccc] rounded-none focus:border-blue-500 shadow-none bg-blue-50/30"
                                        disabled={!selectedProvince}
                                        autoComplete="off"
                                    />

                                    {/* Dropdown Gợi ý địa chỉ từ Geoapify */}
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
                            </div>
                        </div>
                    </div>
                </div>

                {/* Sidebar - Right */}
                <div className="lg:col-span-3 space-y-5">
                    <div className="bg-white border border-[#dcdcdc] p-6 rounded-none shadow-sm">
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

                    <div className="p-5 bg-blue-50 border border-blue-100 rounded-none">
                        <div className="flex items-center gap-2 text-blue-700 font-black text-[10px] uppercase mb-3 tracking-widest border-b border-blue-200 pb-1.5">
                            <ShieldCheck size={14} /> Quy tắc dữ liệu
                        </div>
                        <p className="text-[11px] text-blue-700/80 leading-relaxed font-medium italic">
                            * Hệ thống sẽ tự động gửi Email tài khoản ngay khi bạn nhấn lưu thành công.
                        </p>
                    </div>
                </div>
            </div>

            {/* Footer Actions */}
            <div className="fixed bottom-0 left-0 lg:left-[260px] right-0 bg-[#f8f9fa] border-t border-[#ddd] p-[12px_30px] flex items-center justify-end gap-[15px] z-[999] shadow-[0_-4px_15px_rgba(0,0,0,0.05)]">
                <Button type="button" variant="outline" className="min-w-[110px] h-[38px] text-[12px] font-bold border-[#ccc] bg-white rounded-none shadow-sm hover:bg-slate-50 transition-all uppercase" onClick={() => router.back()}>
                    HỦY BỎ
                </Button>
                <Button type="submit" disabled={isSubmitting} className="min-w-[180px] h-[38px] text-[12px] font-black bg-blue-600 hover:bg-blue-700 text-white rounded-none shadow-md shadow-blue-100 transition-all active:scale-[0.98] uppercase">
                    <Save size={18} className="mr-2" />
                    {isSubmitting ? "ĐANG LƯU..." : "LƯU HỒ SƠ KHÁCH HÀNG"}
                </Button>
            </div>
        </form>
    );
}