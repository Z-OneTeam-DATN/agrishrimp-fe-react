"use client";

import { useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Save, User, Calendar, Mail, Phone, Loader2, RotateCcw } from "lucide-react";
import { SharedDatePicker } from "@/components/admin/shared/BirthDatePicker";
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
  const normalizedInitialValues = useMemo(
    () => ({
      ...initialValues,
      birthday: initialValues.birthday
        ? new Date(initialValues.birthday).toISOString().split("T")[0]
        : "",
    }),
    [initialValues],
  );

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<UserData>({
    resolver: zodResolver(updateProfileSchema),
    mode: "onTouched",
    defaultValues: normalizedInitialValues as any,
  });

  // Đồng bộ UI khi dữ liệu từ Component Cha thay đổi
  useEffect(() => {
    reset(normalizedInitialValues as any);
  }, [normalizedInitialValues, reset]);

  const currentGender = watch("gender");
  const currentBirthday = watch("birthday");
  const currentBirthdayValue =
    typeof currentBirthday === "string"
      ? currentBirthday
      : currentBirthday instanceof Date
        ? currentBirthday.toISOString().split("T")[0]
        : "";

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

      const payload = {
        fullName: data.fullname,
        phoneNumber: data.phone,
        gender: data.gender,
        dateOfBirth: formattedDate,
        avatarUrl: initialValues.avatarUrl,
      };

      console.log("🚀 Payload chuẩn bị gửi lên Backend:", payload);

      // 3. Gửi xuống Backend
      await UserService.updateProfile(payload as any);

      // 4. Thành công -> Báo cho component Cha cập nhật
      if (onUpdateSuccess) onUpdateSuccess(payload);
      reset(
        {
          ...data,
          birthday: formattedDate ?? "",
        } as any,
        {
          keepDirty: false,
          keepTouched: false,
        },
      );
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

  const handleCancel = () => {
    reset(normalizedInitialValues as any, {
      keepDirty: false,
      keepTouched: false,
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 pb-20 lg:pb-0">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
            <User size={12} /> Họ và tên
          </label>
          <input
            {...register("fullname")}
            className={cn(
              "w-full px-4 h-12 bg-white border rounded-lg text-sm focus:ring-1 focus:ring-blue-500",
              errors.fullname ? "border-red-500" : "border-gray-200"
            )}
          />
        </div>

        <div className="space-y-2">
          <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
            <Calendar size={12} /> Ngày sinh
          </label>
          <input type="hidden" {...register("birthday")} />
          <SharedDatePicker
            value={currentBirthdayValue}
            hasError={!!errors.birthday}
            onChange={(nextValue) =>
              setValue("birthday", nextValue as never, {
                shouldDirty: true,
                shouldValidate: true,
                shouldTouch: true,
              })
            }
            placeholder="Chọn ngày sinh"
            variant="compact"
            buttonClassName={cn(
              "w-full h-12 bg-white border rounded-lg text-sm focus:ring-1 focus:ring-blue-500",
              errors.birthday ? "border-red-500" : "border-gray-200"
            )}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
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
              "w-full px-4 h-12 bg-white border rounded-lg text-sm focus:ring-1 focus:ring-blue-500",
              errors.phone ? "border-red-500" : "border-gray-200"
            )}
          />
        </div>
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
                  ? "bg-blue-50 border-blue-500 text-blue-700"
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

      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white shadow-lg lg:relative lg:p-0 lg:bg-transparent lg:shadow-none z-10">
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={handleCancel}
            disabled={!isDirty || isSubmitting}
            className="h-12 rounded-lg border border-gray-200 bg-white text-sm font-semibold text-gray-600 transition hover:border-gray-300 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <span className="flex items-center justify-center gap-2">
              <RotateCcw size={16} /> Hủy
            </span>
          </button>

        <button
          type="submit"
          disabled={!isDirty || isSubmitting}
          className={cn(
            "h-12 rounded-lg text-sm font-semibold shadow-md flex items-center justify-center gap-2 transition",
            isDirty && !isSubmitting
              ? "bg-blue-600 text-white hover:bg-blue-700"
              : "bg-blue-200 text-white cursor-not-allowed shadow-none",
          )}
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
      </div>
    </form>
  );
}
