"use client";

import { useEffect } from "react"; // ✅ Import thêm useEffect
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Save, User, Calendar, Camera, Mail, Phone, Loader2 } from "lucide-react";
import Image from "next/image";
import { updateProfileSchema, UserData } from "@/app/types/user.schema";
import { UserService } from "@/app/services/user.service";
import { cn } from "@/lib/utils";

interface EditProfileFormProps {
  initialValues: UserData;
  isGoogleAuth?: boolean;
  onUpdateSuccess?: (updatedUser: any) => void;
}

export default function EditProfileForm({
  initialValues,
  isGoogleAuth,
  onUpdateSuccess,
}: EditProfileFormProps) {
  const {
    register,
    handleSubmit,
    watch,
    reset, // ✅ Lấy thêm hàm reset để ép Form cập nhật UI
    formState: { errors, isSubmitting },
  } = useForm<UserData>({
    resolver: zodResolver(updateProfileSchema),
    mode: "onTouched",
    defaultValues: {
      ...initialValues,
      birthday: initialValues.birthday
        ? new Date(initialValues.birthday).toISOString().split("T")[0]
        : "",
    } as any,
  });

  // ✅ ĐÃ THÊM: Theo dõi khi initialValues thay đổi (do gọi API thành công) thì ép Form load lại dữ liệu mới
  useEffect(() => {
    reset({
      ...initialValues,
      birthday: initialValues.birthday
        ? new Date(initialValues.birthday).toISOString().split("T")[0]
        : "",
    } as any);
  }, [initialValues, reset]);

  const currentGender = watch("gender");

  const onSubmit = async (data: UserData) => {
    try {
      // ✅ ĐÃ SỬA: Ép chuẩn múi giờ và định dạng YYYY-MM-DD để Spring Boot không bị lỗi parse
      let formattedDate = null;
      if (data.birthday) {
        const dateObj = new Date(data.birthday);
        const offset = dateObj.getTimezoneOffset() * 60000;
        formattedDate = new Date(dateObj.getTime() - offset).toISOString().split("T")[0];
      }

      const payload = {
        fullName: data.fullname,
        phoneNumber: data.phone,
        gender: data.gender,
        dateOfBirth: formattedDate, // Đã ép chuẩn định dạng
      };

      await UserService.updateProfile(payload as any);

      if (onUpdateSuccess) onUpdateSuccess(payload);
      toast.success("Cập nhật thông tin thành công!");
    } catch (error: any) {
      console.error("Lỗi cập nhật:", error);
      toast.error(error.response?.data?.message || "Không thể lưu thay đổi. Vui lòng thử lại!");
    }
  };

  const onInvalid = (validationErrors: any) => {
    console.error("Lỗi Validate Form:", validationErrors);
    toast.error("Vui lòng kiểm tra lại các thông tin bị lỗi viền đỏ!");
  };

  return (
    <form onSubmit={handleSubmit(onSubmit, onInvalid)} className="space-y-6 pb-20 lg:pb-0">
      <div className="flex flex-col items-center mb-6">
        <div className="relative w-24 h-24 mb-3">
          <Image
            src={initialValues.avatarUrl || "/default-avatar.png"}
            alt="Avatar"
            fill
            className="rounded-full object-cover border-4 border-white shadow-md"
          />
          <button type="button" className="absolute bottom-0 right-0 bg-white border p-1.5 rounded-full text-gray-600 hover:text-emerald-600 shadow-sm">
            <Camera size={14} />
          </button>
        </div>
        <div className="text-center">
          <div className="font-bold text-gray-800">{initialValues.fullname}</div>
          <div className="text-[10px] font-bold text-emerald-600 uppercase bg-emerald-50 px-2 py-0.5 rounded-full inline-block mt-1">Thành viên thân thiết</div>
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
          <User size={12} /> Họ và tên
        </label>
        <input
          {...register("fullname")}
          className={cn("w-full px-4 h-12 bg-white border rounded-lg text-sm transition-all focus:outline-none focus:ring-1 focus:ring-emerald-500", errors.fullname ? "border-red-500" : "border-gray-200")}
        />
        {errors.fullname && <p className="text-red-500 text-xs font-medium">{errors.fullname.message as string}</p>}
      </div>

      <div className="space-y-2">
        <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
          <Mail size={12} /> Email đăng nhập
        </label>
        <input
          {...register("email")}
          disabled
          className="w-full px-4 h-12 bg-gray-50 border border-gray-100 rounded-lg text-sm text-gray-400 cursor-not-allowed"
        />
      </div>

      <div className="space-y-2">
        <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
          <Phone size={12} /> Số điện thoại
        </label>
        <input
          {...register("phone")}
          className={cn("w-full px-4 h-12 bg-white border rounded-lg text-sm transition-all focus:outline-none focus:ring-1 focus:ring-emerald-500", errors.phone ? "border-red-500" : "border-gray-200")}
        />
        {errors.phone && <p className="text-red-500 text-xs font-medium">{errors.phone.message as string}</p>}
      </div>

      <div className="space-y-2">
        <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Giới tính</label>
        <div className="flex gap-3 mt-1">
          {[
            { label: "Nam", value: "MALE" },
            { label: "Nữ", value: "FEMALE" },
            { label: "Khác", value: "OTHER" }
          ].map((g) => (
            <label
              key={g.value}
              className={cn(
                "flex-1 text-center py-2 px-4 rounded-lg border cursor-pointer transition-all h-12 flex items-center justify-center text-sm font-bold uppercase tracking-tighter",
                currentGender === g.value
                  ? "bg-emerald-50 border-emerald-500 text-emerald-700 shadow-sm ring-2 ring-emerald-500/10"
                  : "bg-white border-gray-200 text-gray-500 hover:bg-slate-50"
              )}
            >
              <input type="radio" value={g.value} {...register("gender")} className="hidden" />
              {g.label}
            </label>
          ))}
        </div>
        {errors.gender && <p className="text-red-500 text-xs font-medium">{errors.gender.message as string}</p>}
      </div>

      <div className="space-y-2">
        <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
          <Calendar size={12} /> Ngày sinh
        </label>
        <input
          type="date"
          {...register("birthday")}
          className={cn("w-full px-4 h-12 bg-white border rounded-lg text-sm transition-all focus:outline-none focus:ring-1 focus:ring-emerald-500", errors.birthday ? "border-red-500" : "border-gray-200")}
        />
        {errors.birthday && <p className="text-red-500 text-xs font-medium">{errors.birthday.message as string}</p>}
      </div>

      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white shadow-lg lg:relative lg:p-0 lg:bg-transparent lg:shadow-none z-10">
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black uppercase tracking-widest h-12 rounded-lg shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-70"
        >
          {isSubmitting ? <Loader2 className="animate-spin" size={18} /> : <><Save size={18} /> Lưu thay đổi</>}
        </button>
      </div>
    </form>
  );
}