"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ChangeEvent, ReactNode } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { AxiosError } from "axios";
import {
  BadgeCheck,
  BriefcaseBusiness,
  CalendarDays,
  Camera,
  Eye,
  EyeOff,
  Loader2,
  LockKeyhole,
  Mail,
  MapPin,
  Phone,
  RotateCcw,
  Save,
  ShieldCheck,
  User,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { AuthService } from "@/app/services/auth.service";
import { UserService } from "@/app/services/user.service";
import { changePasswordSchema, ChangePasswordFormValues, UserType } from "@/app/types/user.schema";
import { SharedDatePicker } from "@/components/admin/shared/BirthDatePicker";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getErrorMessage } from "@/lib/axios";
import { cn } from "@/lib/utils";
import { resolveImageUrl } from "@/lib/resolveImageUrl";
import { useAuthStore } from "@/stores/useAuthStore";

const phoneRegex = /^\d{10}$/;

const adminProfileSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(2, "Họ tên phải có ít nhất 2 ký tự")
    .max(100, "Họ tên không được quá 100 ký tự"),
  email: z.string().email("Email không hợp lệ").optional().or(z.literal("")),
  phoneNumber: z.string().trim().regex(phoneRegex, "Số điện thoại phải gồm 10 chữ số"),
  gender: z.enum(["MALE", "FEMALE", "OTHER"]).default("OTHER"),
  dateOfBirth: z.string().optional(),
  avatarUrl: z.string().optional(),
});

type AdminProfileFormValues = z.infer<typeof adminProfileSchema>;

const genderOptions = [
  { label: "Nam", value: "MALE" },
  { label: "Nữ", value: "FEMALE" },
  { label: "Khác", value: "OTHER" },
] as const;

const passwordFields = [
  {
    name: "currentPassword",
    label: "Mật khẩu hiện tại",
    placeholder: "Nhập mật khẩu đang sử dụng",
  },
  {
    name: "newPassword",
    label: "Mật khẩu mới",
    placeholder: "Tối thiểu 6 ký tự",
  },
  {
    name: "confirmPassword",
    label: "Xác nhận mật khẩu mới",
    placeholder: "Nhập lại mật khẩu mới",
  },
] as const;

const normalizeGender = (value: unknown): AdminProfileFormValues["gender"] => {
  if (value === "MALE" || value === 0 || value === "0") return "MALE";
  if (value === "FEMALE" || value === 1 || value === "1") return "FEMALE";
  return "OTHER";
};

const normalizeDate = (value: unknown) => {
  if (!value) return "";
  if (typeof value === "string") return value.split("T")[0];
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toISOString().split("T")[0];
  }
  return "";
};

const getRoleName = (user?: UserType | null) => {
  const role = user?.role;
  if (role && typeof role === "object") return role.displayName || role.slug || "Quản trị viên";
  return (role as string | undefined) || (user as any)?.roleName || "Quản trị viên";
};

const getBranchName = (user?: UserType | null) =>
  user?.branch?.name || (user as any)?.branchName || "Toàn hệ thống";

const getAvatarUrl = (user?: UserType | null) =>
  user?.avatar?.imageUrl || (user as any)?.avatarUrl || "";

const getInitials = (name?: string | null) => {
  const parts = (name || "Admin").trim().split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
};

export default function AdminProfilePage() {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [user, setUser] = useState<UserType | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [visiblePasswords, setVisiblePasswords] = useState<Record<string, boolean>>({});
  const setAuthUser = useAuthStore((state) => state.setUser);

  const profileForm = useForm<AdminProfileFormValues>({
    resolver: zodResolver(adminProfileSchema),
    mode: "onTouched",
    defaultValues: {
      fullName: "",
      email: "",
      phoneNumber: "",
      gender: "OTHER",
      dateOfBirth: "",
      avatarUrl: "",
    },
  });

  const passwordForm = useForm<ChangePasswordFormValues>({
    resolver: zodResolver(changePasswordSchema),
    mode: "onTouched",
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  const avatarUrl = profileForm.watch("avatarUrl");
  const selectedGender = profileForm.watch("gender");

  const hydrateForm = useCallback(
    (nextUser: UserType) => {
      profileForm.reset(
        {
          fullName: nextUser.fullName || nextUser.displayName || "",
          email: nextUser.email || "",
          phoneNumber: nextUser.phoneNumber || "",
          gender: normalizeGender((nextUser as any).gender),
          dateOfBirth: normalizeDate((nextUser as any).dateOfBirth || (nextUser as any).birthday),
          avatarUrl: getAvatarUrl(nextUser),
        },
        { keepDirty: false, keepTouched: false },
      );
    },
    [profileForm],
  );

  const fetchCurrentUser = useCallback(async () => {
    setIsLoading(true);
    try {
      const currentUser = await AuthService.me();
      setUser(currentUser);
      setAuthUser(currentUser);
      hydrateForm(currentUser);
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  }, [hydrateForm, setAuthUser]);

  useEffect(() => {
    void fetchCurrentUser();
  }, [fetchCurrentUser]);

  const profileSummary = useMemo(
    () => [
      {
        label: "Vai trò",
        value: getRoleName(user),
        icon: ShieldCheck,
        color: "text-blue-600",
        background: "bg-blue-50",
      },
      {
        label: "Phạm vi",
        value: getBranchName(user),
        icon: MapPin,
        color: "text-emerald-600",
        background: "bg-emerald-50",
      },
      {
        label: "Trạng thái",
        value: (user as any)?.status || "ACTIVE",
        icon: BadgeCheck,
        color: "text-violet-600",
        background: "bg-violet-50",
      },
    ],
    [user],
  );

  const handleAvatarChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Vui lòng chọn tệp hình ảnh.");
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast.error("Ảnh đại diện không được vượt quá 2MB.");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    setIsUploadingAvatar(true);
    try {
      const uploaded = await UserService.uploadAvatar(formData);
      const nextAvatarUrl = uploaded.imageUrl || (uploaded as any).url;

      if (!nextAvatarUrl) {
        toast.error("Không nhận được đường dẫn ảnh từ máy chủ.");
        return;
      }

      profileForm.setValue("avatarUrl", nextAvatarUrl, {
        shouldDirty: true,
        shouldTouch: true,
        shouldValidate: true,
      });
      toast.success("Tải ảnh đại diện thành công. Nhấn lưu để cập nhật hồ sơ.");
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setIsUploadingAvatar(false);
      event.target.value = "";
    }
  };

  const handleProfileSubmit = async (data: AdminProfileFormValues) => {
    try {
      const payload = {
        fullName: data.fullName.trim(),
        phoneNumber: data.phoneNumber.trim().replace(/\s|\./g, ""),
        gender: data.gender,
        dateOfBirth: data.dateOfBirth || null,
        avatarUrl: data.avatarUrl || undefined,
      };

      const savedUser = await UserService.updateProfile(payload as any);
      const savedProfile = savedUser as any;
      const mergedUser = {
        ...user,
        ...savedUser,
        role: user?.role,
        branch: user?.branch,
        displayName: savedUser.fullName || user?.displayName,
        avatar: savedProfile.avatarUrl
          ? { ...(user?.avatar || {}), imageUrl: savedProfile.avatarUrl }
          : user?.avatar,
      } as UserType;

      setUser(mergedUser);
      setAuthUser(mergedUser);
      hydrateForm(mergedUser);
      toast.success("Đã cập nhật hồ sơ admin.");
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  const handlePasswordSubmit = async (data: ChangePasswordFormValues) => {
    try {
      await UserService.changePassword(data);
      passwordForm.reset();
      toast.success("Đổi mật khẩu thành công.");
    } catch (error) {
      const message = getErrorMessage(error);
      if (error instanceof AxiosError) {
        passwordForm.setError("currentPassword", {
          type: "server",
          message,
        });
        return;
      }
      toast.error(message);
    }
  };

  const displayName = profileForm.watch("fullName") || user?.displayName || "Admin";

  if (isLoading) {
    return (
      <div className="flex min-h-[520px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 px-1 py-4 pb-10">
      <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400">
            Tài khoản admin
          </p>
          <h1 className="mt-1 text-[20px] font-semibold uppercase tracking-tight text-slate-900">
            Hồ sơ cá nhân
          </h1>
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={() => void fetchCurrentUser()}
          className="h-10 rounded-lg border-slate-200 bg-white text-[13px] font-semibold text-slate-600 hover:bg-slate-100"
        >
          <RotateCcw className="mr-2 h-4 w-4" />
          Tải lại dữ liệu
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[320px_minmax(0,1fr)]">
        <aside className="space-y-5">
          <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex flex-col items-center text-center">
              <div className="relative">
                <div className="flex h-28 w-28 items-center justify-center overflow-hidden rounded-full border border-slate-200 bg-slate-100 text-2xl font-black text-slate-500 shadow-sm">
                  {avatarUrl ? (
                    <img
                      src={resolveImageUrl(avatarUrl)}
                      alt={displayName}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    getInitials(displayName)
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploadingAvatar}
                  className="absolute bottom-1 right-1 flex h-9 w-9 items-center justify-center rounded-full border border-white bg-blue-600 text-white shadow-md transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
                  aria-label="Tải ảnh đại diện"
                >
                  {isUploadingAvatar ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Camera className="h-4 w-4" />
                  )}
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarChange}
                />
              </div>

              <h2 className="mt-4 text-[17px] font-bold text-slate-900">{displayName}</h2>
              <p className="mt-1 max-w-full truncate text-[13px] text-slate-500">
                {user?.email || user?.phoneNumber || "Chưa có thông tin đăng nhập"}
              </p>
            </div>

            <div className="mt-5 space-y-3">
              {profileSummary.map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.label} className="flex items-center gap-3 rounded-lg border border-slate-100 bg-slate-50/70 p-3">
                    <div className={cn("flex h-9 w-9 items-center justify-center rounded-lg", item.background)}>
                      <Icon className={cn("h-4 w-4", item.color)} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">
                        {item.label}
                      </p>
                      <p className="truncate text-[13px] font-semibold text-slate-800">
                        {item.value}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </aside>

        <div className="grid grid-cols-1 gap-5 2xl:grid-cols-[minmax(0,1fr)_420px]">
          <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 px-5 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                  <User className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-[15px] font-bold text-slate-900">Thông tin hồ sơ</h2>
                  <p className="text-[12px] text-slate-500">Cập nhật thông tin hiển thị trong hệ thống quản trị.</p>
                </div>
              </div>
            </div>

            <form onSubmit={profileForm.handleSubmit(handleProfileSubmit)} className="space-y-5 p-5">
              <input type="hidden" {...profileForm.register("avatarUrl")} />

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <Field label="Họ và tên" icon={User} error={profileForm.formState.errors.fullName?.message}>
                  <Input
                    {...profileForm.register("fullName")}
                    className={inputClass(Boolean(profileForm.formState.errors.fullName))}
                    placeholder="Nguyễn Văn A"
                  />
                </Field>

                <Field label="Email đăng nhập" icon={Mail} error={profileForm.formState.errors.email?.message}>
                  <Input
                    {...profileForm.register("email")}
                    disabled
                    className="h-10 rounded-lg border-slate-100 bg-slate-50 text-[13px] text-slate-500"
                  />
                </Field>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <Field label="Số điện thoại" icon={Phone} error={profileForm.formState.errors.phoneNumber?.message}>
                  <Input
                    {...profileForm.register("phoneNumber")}
                    className={inputClass(Boolean(profileForm.formState.errors.phoneNumber))}
                    placeholder="0901234567"
                  />
                </Field>

                <Field label="Ngày sinh" icon={CalendarDays} error={profileForm.formState.errors.dateOfBirth?.message}>
                  <input type="hidden" {...profileForm.register("dateOfBirth")} />
                  <SharedDatePicker
                    value={profileForm.watch("dateOfBirth")}
                    onChange={(nextValue) =>
                      profileForm.setValue("dateOfBirth", nextValue, {
                        shouldDirty: true,
                        shouldTouch: true,
                        shouldValidate: true,
                      })
                    }
                    placeholder="Chọn ngày sinh"
                    fromDate={new Date(1950, 0, 1)}
                    toDate={new Date()}
                    variant="compact"
                    buttonClassName={cn(
                      "h-10 rounded-lg text-[13px]",
                      profileForm.formState.errors.dateOfBirth && "border-rose-500",
                    )}
                  />
                </Field>
              </div>

              <div>
                <p className="mb-2 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.16em] text-slate-400">
                  <BriefcaseBusiness className="h-3.5 w-3.5" />
                  Giới tính
                </p>
                <div className="grid grid-cols-3 gap-3">
                  {genderOptions.map((option) => (
                    <label
                      key={option.value}
                      className={cn(
                        "flex h-10 cursor-pointer items-center justify-center rounded-lg border text-[13px] font-semibold transition",
                        selectedGender === option.value
                          ? "border-blue-500 bg-blue-50 text-blue-700"
                          : "border-slate-200 bg-white text-slate-500 hover:border-slate-300",
                      )}
                    >
                      <input
                        type="radio"
                        value={option.value}
                        {...profileForm.register("gender")}
                        className="sr-only"
                      />
                      {option.label}
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => user && hydrateForm(user)}
                  disabled={!profileForm.formState.isDirty || profileForm.formState.isSubmitting}
                  className="h-10 rounded-lg border-slate-200 bg-white text-[13px] font-semibold text-slate-600"
                >
                  <RotateCcw className="mr-2 h-4 w-4" />
                  Hủy thay đổi
                </Button>
                <Button
                  type="submit"
                  disabled={!profileForm.formState.isDirty || profileForm.formState.isSubmitting}
                  className="h-10 rounded-lg bg-blue-600 px-5 text-[13px] font-semibold text-white hover:bg-blue-700"
                >
                  {profileForm.formState.isSubmitting ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="mr-2 h-4 w-4" />
                  )}
                  Lưu hồ sơ
                </Button>
              </div>
            </form>
          </section>

          <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 px-5 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-rose-50 text-rose-600">
                  <LockKeyhole className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-[15px] font-bold text-slate-900">Đổi mật khẩu</h2>
                  <p className="text-[12px] text-slate-500">Cập nhật mật khẩu cho phiên đăng nhập admin.</p>
                </div>
              </div>
            </div>

            <form onSubmit={passwordForm.handleSubmit(handlePasswordSubmit)} className="space-y-4 p-5">
              {passwordFields.map((field) => {
                const error = passwordForm.formState.errors[field.name]?.message;
                const isVisible = visiblePasswords[field.name];
                return (
                  <Field key={field.name} label={field.label} error={error}>
                    <div className="relative">
                      <Input
                        {...passwordForm.register(field.name)}
                        type={isVisible ? "text" : "password"}
                        className={cn(inputClass(Boolean(error)), "pr-10")}
                        placeholder={field.placeholder}
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setVisiblePasswords((prev) => ({
                            ...prev,
                            [field.name]: !prev[field.name],
                          }))
                        }
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-slate-700"
                        aria-label={isVisible ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                      >
                        {isVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </Field>
                );
              })}

              <div className="rounded-lg border border-amber-100 bg-amber-50 px-3 py-2 text-[12px] leading-relaxed text-amber-700">
                Sau khi đổi mật khẩu, hãy dùng mật khẩu mới cho lần đăng nhập tiếp theo.
              </div>

              <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => passwordForm.reset()}
                  disabled={passwordForm.formState.isSubmitting}
                  className="h-10 rounded-lg border-slate-200 bg-white text-[13px] font-semibold text-slate-600"
                >
                  <RotateCcw className="mr-2 h-4 w-4" />
                  Xóa form
                </Button>
                <Button
                  type="submit"
                  disabled={passwordForm.formState.isSubmitting}
                  className="h-10 rounded-lg bg-slate-900 px-5 text-[13px] font-semibold text-white hover:bg-slate-800"
                >
                  {passwordForm.formState.isSubmitting ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <LockKeyhole className="mr-2 h-4 w-4" />
                  )}
                  Đổi mật khẩu
                </Button>
              </div>
            </form>
          </section>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  icon: Icon,
  error,
  children,
}: {
  label: string;
  icon?: LucideIcon;
  error?: string;
  children: ReactNode;
}) {
  return (
    <label className="block space-y-2">
      <span className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.16em] text-slate-400">
        {Icon ? <Icon className="h-3.5 w-3.5" /> : null}
        {label}
      </span>
      {children}
      <span className={cn("block min-h-4 text-[11px] font-semibold", error ? "text-rose-500" : "text-transparent")}>
        {error || "\u00A0"}
      </span>
    </label>
  );
}

function inputClass(hasError: boolean) {
  return cn(
    "h-10 rounded-lg border-slate-200 bg-white text-[13px] text-slate-800 shadow-none focus-visible:ring-blue-500",
    hasError && "border-rose-500 focus-visible:ring-rose-500",
  );
}
