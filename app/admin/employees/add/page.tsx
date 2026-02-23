"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
    ChevronLeft, Save, X, Users, Building2, 
    ShieldCheck, Calendar, Mail, Phone, MapPin, 
    Key, Info, Loader2, Camera, UserCircle2, Briefcase, Fingerprint
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { getErrorMessage, apiJava } from "@/lib/axios";
import { EmployeeService } from "@/app/services/employee.service";
import { RoleService } from "@/app/services/RoleService";
import { BranchService } from "@/app/services/branchService";
import { FileService } from "@/app/services/file.service";
import { RoleType } from "@/app/types/role.schema";
import { BranchType, UserRequest } from "@/app/types/employee.schema";

export default function AddEmployeePage() {
    const router = useRouter();
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Form States
    const [formData, setFormData] = useState({
        fullName: "",
        employeeCode: "NV-" + Math.floor(1000 + Math.random() * 9000), 
        email: "",
        password: "Agri@2024",
        phoneNumber: "",
        citizenId: "",
        address: "",
        dateOfBirth: "",
        avatarUrl: "",
        status: "ACTIVE",
        startDate: new Date().toISOString().split('T')[0],
        branchId: "",
        roleId: "",
        gender: "1" 
    });

    // Data States
    const [roles, setRoles] = useState<RoleType[]>([]);
    const [branches, setBranches] = useState<BranchType[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [uploading, setUploading] = useState(false);

    useEffect(() => {
        async function loadInitData() {
            setLoading(true);
            try {
                const [rolesRes, branchesRes] = await Promise.all([
                    RoleService.getAll(),
                    BranchService.getAll()
                ]);
                
                const rolesList = Array.isArray(rolesRes) ? rolesRes : (rolesRes as any).content || [];
                setRoles(rolesList);

                const branchesList = Array.isArray(branchesRes.data) ? branchesRes.data : (branchesRes.data as any).content || [];
                setBranches(branchesList);
            } catch (error) {
                console.error("Init Error:", error);
                toast.error("Không thể tải dữ liệu hệ thống.");
            } finally {
                setLoading(false);
            }
        }
        loadInitData();
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSelectChange = (name: string, value: string) => {
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleAvatarClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            setUploading(true);
            const formDataUpload = new FormData();
            
            // THỬ NGHIỆM: Backend Java thường dùng 'file' hoặc 'multipartFile'
            formDataUpload.append("file", file); 
            
            // Gọi trực tiếp qua apiJava để kiểm soát headers chặt chẽ hơn
            const response = await apiJava.post('/files/tmpUpload', formDataUpload, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            const resData = response.data;
            const avatarUrl = resData.tmpPath || resData.fileUrl || resData.url || resData.data?.url || resData.data?.tmpPath;
            
            if (avatarUrl) {
                setFormData(prev => ({ ...prev, avatarUrl }));
                toast.success("Tải ảnh lên thành công!");
            } else {
                toast.error("Tải lên thành công nhưng không tìm thấy URL ảnh.");
            }
        } catch (error: any) {
            console.error("Upload Failed:", error);
            // Nếu lỗi 500, có thể do sai tên trường 'file'. Thử lại với 'multipartFile' nếu cần.
            toast.error("Lỗi máy chủ (500) khi tải ảnh. Vui lòng kiểm tra lại dịch vụ lưu trữ.");
        } finally {
            setUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = "";
        }
    };

    const handleSave = async () => {
        if (!formData.fullName.trim()) return toast.error("Vui lòng nhập họ tên.");
        if (!formData.email.trim()) return toast.error("Vui lòng nhập email.");
        if (formData.citizenId.length !== 12) return toast.error("Số CCCD phải đủ 12 chữ số.");
        if (!formData.branchId) return toast.error("Vui lòng chọn chi nhánh.");
        if (!formData.roleId) return toast.error("Vui lòng chọn vai trò.");

        try {
            setSaving(true);
            const payload: UserRequest = {
                fullName: formData.fullName.trim(),
                employeeCode: formData.employeeCode.trim(),
                email: formData.email.trim(),
                password: formData.password,
                phoneNumber: formData.phoneNumber.trim(),
                citizenId: formData.citizenId.trim(),
                address: formData.address.trim(),
                dateOfBirth: formData.dateOfBirth,
                avatarUrl: formData.avatarUrl,
                status: formData.status,
                startDate: formData.startDate,
                branchId: Number(formData.branchId),
                roleId: Number(formData.roleId),
                gender: Number(formData.gender)
            };

            await EmployeeService.create(payload);
            toast.success("Thêm nhân viên thành công!");
            router.push("/admin/employees");
        } catch (error: any) {
            toast.error(getErrorMessage(error) || "Lỗi khi tạo nhân viên.");
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="min-h-screen flex items-center justify-center bg-slate-50"><Loader2 className="animate-spin text-blue-600" size={32} /></div>;

    return (
        <div className="space-y-4 pb-[100px] bg-slate-50 min-h-screen text-slate-800">
            <div className="bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between sticky top-0 z-30 shadow-sm">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => router.back()} className="text-slate-400">
                        <ChevronLeft size={20} />
                    </Button>
                    <h1 className="text-[16px] font-bold text-slate-800 uppercase">Thêm nhân viên mới</h1>
                </div>
            </div>

            <div className="max-w-[1200px] mx-auto p-4 grid grid-cols-12 gap-6">
                <div className="col-span-8 space-y-4">
                    <div className="bg-white border border-slate-200 p-6 shadow-sm">
                        <div className="flex items-center gap-2 mb-6 border-b pb-3 text-blue-600">
                            <Users size={16} />
                            <span className="text-[11px] font-black uppercase text-slate-800 tracking-widest">1. Thông tin cá nhân</span>
                        </div>
                        
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <Label className="text-[10px] font-bold uppercase text-slate-400">Họ và tên *</Label>
                                    <Input name="fullName" value={formData.fullName} onChange={handleChange} className="h-9 text-[13px] font-medium" placeholder="Nguyễn Văn A" />
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-[10px] font-bold uppercase text-slate-400">Giới tính</Label>
                                    <Select value={formData.gender} onValueChange={(val) => handleSelectChange("gender", val)}>
                                        <SelectTrigger className="h-9 text-[13px]"><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="1">Nam</SelectItem><SelectItem value="0">Nữ</SelectItem><SelectItem value="2">Khác</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <Label className="text-[10px] font-bold uppercase text-slate-400 flex items-center gap-1.5"><Fingerprint size={10} /> Số CCCD (12 số) *</Label>
                                    <Input name="citizenId" value={formData.citizenId} onChange={handleChange} className="h-9 text-[13px] font-bold" placeholder="0..." maxLength={12} />
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-[10px] font-bold uppercase text-slate-400">Ngày sinh *</Label>
                                    <Input type="date" name="dateOfBirth" value={formData.dateOfBirth} onChange={handleChange} className="h-9 text-[13px]" />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <Label className="text-[10px] font-bold uppercase text-slate-400 flex items-center gap-1.5"><Phone size={10} /> Số điện thoại *</Label>
                                    <Input name="phoneNumber" value={formData.phoneNumber} onChange={handleChange} className="h-9 text-[13px]" placeholder="090..." />
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-[10px] font-bold uppercase text-slate-400 flex items-center gap-1.5"><MapPin size={10} /> Địa chỉ liên hệ</Label>
                                    <Input name="address" value={formData.address} onChange={handleChange} className="h-9 text-[13px]" placeholder="Số nhà, tên đường..." />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white border border-slate-200 p-6 shadow-sm">
                        <div className="flex items-center gap-2 mb-6 border-b pb-3 text-blue-600">
                            <Briefcase size={16} />
                            <span className="text-[11px] font-black uppercase text-slate-800 tracking-widest">2. Công tác & Phân quyền</span>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <Label className="text-[10px] font-bold uppercase text-slate-400">Mã nhân viên *</Label>
                                <Input name="employeeCode" value={formData.employeeCode} onChange={handleChange} className="h-9 text-[13px] bg-slate-50 font-bold" />
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-[10px] font-bold uppercase text-slate-400">Ngày vào làm *</Label>
                                <Input type="date" name="startDate" value={formData.startDate} onChange={handleChange} className="h-9 text-[13px]" />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 mt-4">
                            <div className="space-y-1.5">
                                <Label className="text-[10px] font-bold uppercase text-slate-400">Chi nhánh làm việc *</Label>
                                <Select value={formData.branchId} onValueChange={(val) => handleSelectChange("branchId", val)}>
                                    <SelectTrigger className="h-9 text-[13px]"><SelectValue placeholder="Chọn chi nhánh" /></SelectTrigger>
                                    <SelectContent>
                                        {branches.map(b => <SelectItem key={b.id} value={String(b.id)}>{b.name}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-[10px] font-bold uppercase text-slate-400">Vai trò hệ thống *</Label>
                                <Select value={formData.roleId} onValueChange={(val) => handleSelectChange("roleId", val)}>
                                    <SelectTrigger className="h-9 text-[13px]"><SelectValue placeholder="Chọn vai trò" /></SelectTrigger>
                                    <SelectContent>
                                        {roles.map(r => <SelectItem key={r.id} value={String(r.id)}>{r.displayName}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="col-span-4 space-y-4">
                    <div className="bg-white border border-slate-200 p-6 shadow-sm flex flex-col items-center">
                        <Label className="text-[10px] font-bold uppercase text-slate-400 mb-4 self-start">Ảnh đại diện</Label>
                        <div className="relative group cursor-pointer" onClick={handleAvatarClick}>
                            <div className="w-32 h-32 bg-slate-100 border-2 border-dashed border-slate-200 rounded-full flex items-center justify-center overflow-hidden">
                                {uploading ? <Loader2 className="animate-spin text-blue-600" /> : formData.avatarUrl ? <img src={formData.avatarUrl} alt="Avatar" className="w-full h-full object-cover" /> : <UserCircle2 size={80} className="text-slate-200" />}
                            </div>
                            <div className="absolute bottom-0 right-0 bg-blue-600 text-white p-2 rounded-full shadow-lg hover:bg-blue-700 transition-transform active:scale-90"><Camera size={16} /></div>
                            <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" />
                        </div>
                        <p className="text-[10px] text-slate-400 mt-4 text-center">Click vào hình tròn để chọn ảnh.</p>
                    </div>

                    <div className="bg-white border border-slate-200 p-6 shadow-sm space-y-4">
                        <div className="space-y-1.5">
                            <Label className="text-[10px] font-bold uppercase text-slate-400 flex items-center gap-1.5"><Mail size={10} /> Email (Tài khoản) *</Label>
                            <Input name="email" value={formData.email} onChange={handleChange} className="h-9 text-[13px]" placeholder="email@example.com" />
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-[10px] font-bold uppercase text-slate-400">Trạng thái tài khoản</Label>
                            <Select value={formData.status} onValueChange={(val) => handleSelectChange("status", val)}>
                                <SelectTrigger className="h-9 text-[12px] font-bold uppercase"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="ACTIVE" className="text-emerald-600 font-bold">ĐANG HOẠT ĐỘNG</SelectItem>
                                    <SelectItem value="INACTIVE" className="text-rose-600 font-bold">TẠM KHÓA</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-[10px] font-bold uppercase text-slate-400 flex items-center gap-1.5"><Key size={10} /> Mật khẩu khởi tạo</Label>
                            <Input name="password" value={formData.password} onChange={handleChange} className="h-9 text-[13px] bg-slate-50" />
                        </div>
                    </div>
                </div>
            </div>

            <div className="fixed bottom-0 left-0 lg:left-[260px] right-0 bg-white border-t p-3 flex justify-end gap-3 z-[999] shadow-inner">
                <Button variant="ghost" onClick={() => router.back()} className="font-bold uppercase text-[11px]">Hủy bỏ</Button>
                <Button onClick={handleSave} disabled={saving || uploading} className="h-9 px-10 text-[11px] font-black bg-slate-900 text-white uppercase shadow-xl">
                    {saving ? <Loader2 className="animate-spin mr-2" /> : "LƯU NHÂN VIÊN"}
                </Button>
            </div>
        </div>
    );
}
