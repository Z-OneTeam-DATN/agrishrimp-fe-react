"use client";

import { useEffect, useRef, useState } from "react";
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
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [avatarPreview, setAvatarPreview] = useState(initialValues.avatarUrl);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<UserData>({
    resolver: zodResolver(updateProfileSchema),
    mode: "onTouched",
    defaultValues: {
      ...initialValues,
      // Thẻ input type="date" cần format chuẩn YYYY-MM-DD
      birthday: initialValues.birthday
        ? new Date(initialValues.birthday).toISOString().split("T")[0]
        : "",
    } as any,
  });

  // Đồng bộ UI khi dữ liệu từ Component Cha thay đổi
  useEffect(() => {
    reset({
      ...initialValues,
      birthday: initialValues.birthday
        ? new Date(initialValues.birthday).toISOString().split("T")[0]
        : "",
    } as any);
    setAvatarPreview(initialValues.avatarUrl);
  }, [initialValues, reset]);

  const currentGender = watch("gender");

  const handleImageChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Vui lòng chọn file hình ảnh!");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Kích thước ảnh tối đa 5MB");
      return;
    }

    try {
      setIsUploadingImage(true);
      // Hiển thị mượt mà trên UI ngay lập tức
      setAvatarPreview(URL.createObjectURL(file));

      const formData = new FormData();
      formData.append("file", file);

      const uploadResult = await UserService.uploadAvatar(formData);

      if (uploadResult && uploadResult.imageUrl) {
        setAvatarPreview(uploadResult.imageUrl);
        setValue("avatarUrl", uploadResult.imageUrl, { shouldDirty: true });
        toast.success("Tải ảnh lên thành công!");
      }
    } catch (error: any) {
      console.error("Lỗi Upload:", error);
      toast.error("Tải ảnh thất bại!");
      setAvatarPreview(initialValues.avatarUrl);
    } finally {
      setIsUploadingImage(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const onSubmit = async (data: UserData) => {
    try {
      let formattedDate = null;

      // 1. XỬ LÝ NGÀY SINH AN TOÀN TUYỆT ĐỐI
      if (data.birthday) {
        if (typeof data.birthday === "string") {
          formattedDate = data.birthday;
        } else if (data.birthday instanceof Date) {
          formattedDate = data.birthday.toISOString().split("T")[0];
        }
      }

      // 2. CHẮC CHẮN GIỮ ĐƯỢC ẢNH
      const finalAvatarUrl = data.avatarUrl || initialValues.avatarUrl;

      const payload = {
        fullName: data.fullname,
        phoneNumber: data.phone,
        gender: data.gender,
        dateOfBirth: formattedDate,
        avatarUrl: finalAvatarUrl,
      };

      console.log("🚀 Payload chuẩn bị gửi lên Backend:", payload);

      // 3. Gửi xuống Backend
      await UserService.updateProfile(payload as any);

      // 4. Thành công -> Báo cho component Cha cập nhật
      if (onUpdateSuccess) onUpdateSuccess(payload);
      toast.success("Cập nhật thông tin thành công!");
    } catch (error: any) {
      console.error("🚨 Lỗi cập nhật (Chi tiết từ Backend):", error.response?.data);

      // 5. BẮT LỖI TỪ BACKEND CHUYÊN NGHIỆP (Đã thêm trường detail)
      const backendData = error.response?.data;

      const errorMsg =
        backendData?.detail ||    // <--- Cực kỳ quan trọng cho Spring Boot 3 ProblemDetail
        backendData?.message ||   // <--- Backup nếu dùng Map<String, String> tự chế
        backendData?.error ||     // <--- Backup lỗi mặc định khác
        "Không thể lưu thay đổi do dữ liệu không hợp lệ!";

      toast.error(errorMsg);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 pb-20 lg:pb-0">
      <div className="flex flex-col items-center mb-6">
        <div
          className="relative w-24 h-24 mb-3 group cursor-pointer"
          onClick={() => !isUploadingImage && fileInputRef.current?.click()}
        >
          <Image
            src={avatarPreview || "/default-avatar.png"}
            alt="Avatar"
            fill
            className={cn(
              "rounded-full object-cover border-4 border-white shadow-md transition-all",
              isUploadingImage && "opacity-50"
            )}
          />

          {isUploadingImage && (
            <div className="absolute inset-0 flex items-center justify-center z-10">
              <Loader2 className="animate-spin text-emerald-600" />
            </div>
          )}

          <button
            type="button"
            className="absolute bottom-0 right-0 bg-white border p-1.5 rounded-full text-gray-600 group-hover:text-emerald-600 shadow-sm transition-colors"
          >
            <Camera size={14} />
          </button>

          <input
            type="file"
            className="hidden"
            ref={fileInputRef}
            accept="image/*"
            onChange={handleImageChange}
          />
        </div>
        <div className="text-center">
          <div className="font-bold text-gray-800">{initialValues.fullname}</div>
          <div className="text-[10px] font-bold text-emerald-600 uppercase bg-emerald-50 px-2 py-0.5 rounded-full inline-block mt-1">
            Thành viên thân thiết
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
          <User size={12} /> Họ và tên
        </label>
        <input
          {...register("fullname")}
          className={cn(
            "w-full px-4 h-12 bg-white border rounded-lg text-sm focus:ring-1 focus:ring-emerald-500",
            errors.fullname ? "border-red-500" : "border-gray-200"
          )}
        />
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
          className={cn(
            "w-full px-4 h-12 bg-white border rounded-lg text-sm focus:ring-1 focus:ring-emerald-500",
            errors.phone ? "border-red-500" : "border-gray-200"
          )}
        />
      </div>

      <div className="space-y-2">
        <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
          Giới tính
        </label>
        <div className="flex gap-3 mt-1">
          {[
            { label: "Nam", value: "MALE" },
            { label: "Nữ", value: "FEMALE" },
            { label: "Khác", value: "OTHER" },
          ].map((g) => (
            <label
              key={g.value}
              className={cn(
                "flex-1 text-center py-2 px-4 rounded-lg border cursor-pointer h-12 flex items-center justify-center text-sm font-bold uppercase",
                currentGender === g.value
                  ? "bg-emerald-50 border-emerald-500 text-emerald-700"
                  : "bg-white border-gray-200 text-gray-500"
              )}
            >
              <input
                type="radio"
                value={g.value}
                {...register("gender")}
                className="hidden"
              />
              {g.label}
            </label>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
          <Calendar size={12} /> Ngày sinh
        </label>
        <input
          type="date"
          {...register("birthday")}
          className={cn(
            "w-full px-4 h-12 bg-white border rounded-lg text-sm focus:ring-1 focus:ring-emerald-500",
            errors.birthday ? "border-red-500" : "border-gray-200"
          )}
        />
      </div>

      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white shadow-lg lg:relative lg:p-0 lg:bg-transparent lg:shadow-none z-10">
        <button
          type="submit"
          disabled={isSubmitting || isUploadingImage}
          className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black uppercase tracking-widest h-12 rounded-lg shadow-md flex items-center justify-center gap-2 disabled:opacity-70"
        >
          {isSubmitting ? (
            <Loader2 className="animate-spin" size={18} />
          ) : (
            <>
              <Save size={18} /> Lưu thay đổi
            </>
          )}
        </button>
      </div>
    </form>
  );
}