"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Save } from "lucide-react";
import { toast } from "sonner";
import {
  Voucher,
  voucherService,
  VoucherUpsertPayload,
} from "@/app/services/voucher.service";

type VoucherFormData = {
  code: string;
  title: string;
  discountType: Voucher["discountType"];
  discountValue: string;
  minOrderValue: string;
  maxDiscount: string;
  startDate: string;
  endDate: string;
  quantity: string;
  usageLimit: string;
  status: Voucher["status"];
};

type VoucherFormErrors = Partial<
  Record<
    | "code"
    | "title"
    | "discountValue"
    | "minOrderValue"
    | "maxDiscount"
    | "quantity"
    | "usageLimit"
    | "startDate"
    | "endDate",
    string
  >
>;

type VoucherApiErrorItem = {
  field?: string;
  defaultMessage?: string;
};

type VoucherApiErrorResponse = {
  message?: string;
  error?: string;
  errors?: VoucherApiErrorItem[];
};

type VoucherFormProps = {
  initialData?: Voucher;
};

const sanitizeNumericInput = (value: string) => value.replace(/\D/g, "");

const normalizeDigitString = (value: string) =>
  sanitizeNumericInput(value).replace(/^0+(?=\d)/, "");

const normalizeNumericValue = (value: number | string | undefined | null) => {
  if (value === undefined || value === null || value === "") return "";
  if (typeof value === "number") {
    return Number.isFinite(value) ? String(Math.trunc(value)) : "";
  }

  const normalized = value.replace(/,/g, "").trim();
  if (!normalized) return "";

  const parsed = Number(normalized);
  if (Number.isFinite(parsed)) {
    return String(Math.trunc(parsed));
  }

  return normalizeDigitString(normalized);
};

const toNumber = (value: number | string | undefined | null) =>
  typeof value === "number"
    ? value
    : Number(
        typeof value === "string"
          ? value.replace(/,/g, "").trim() || 0
          : value || 0,
      );

const isEmptyNumeric = (value: string) => sanitizeNumericInput(value) === "";

const normalizeErrorText = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

const getFieldErrorsFromApiMessage = (message: string): VoucherFormErrors => {
  const normalizedMessage = normalizeErrorText(message);

  if (normalizedMessage.includes("ma voucher")) return { code: message };
  if (normalizedMessage.includes("ten chuong trinh")) return { title: message };
  if (
    normalizedMessage.includes("giam toi da") ||
    normalizedMessage.includes("max discount")
  ) {
    return { maxDiscount: message };
  }
  if (
    normalizedMessage.includes("ngay ket thuc") ||
    normalizedMessage.includes("ket thuc")
  ) {
    return { endDate: message };
  }
  if (normalizedMessage.includes("ngay bat dau")) return { startDate: message };
  if (
    normalizedMessage.includes("gia tri giam gia") ||
    normalizedMessage.includes("muc giam") ||
    normalizedMessage.includes("phan tram")
  ) {
    return { discountValue: message };
  }
  if (
    normalizedMessage.includes("don hang toi thieu") ||
    normalizedMessage.includes("don toi thieu")
  ) {
    return { minOrderValue: message };
  }
  if (
    normalizedMessage.includes("luot su dung") ||
    normalizedMessage.includes("luot dung")
  ) {
    return { usageLimit: message };
  }
  if (normalizedMessage.includes("so luong")) return { quantity: message };

  return {};
};

const createEmptyFormData = (): VoucherFormData => {
  const now = new Date();
  now.setMinutes(now.getMinutes() - now.getTimezoneOffset());

  const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const code = `VC${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

  return {
    code,
    title: "",
    discountType: "FIXED",
    discountValue: "",
    minOrderValue: "",
    maxDiscount: "",
    startDate: now.toISOString().slice(0, 16),
    endDate: nextWeek.toISOString().slice(0, 16),
    quantity: "",
    usageLimit: "",
    status: "ACTIVE",
  };
};

const mapVoucherToFormData = (voucher: Voucher): VoucherFormData => ({
  code: voucher.code,
  title: voucher.title || "",
  discountType: voucher.discountType || "FIXED",
  discountValue: normalizeNumericValue(voucher.value ?? voucher.discountValue),
  minOrderValue: normalizeNumericValue(voucher.minOrderValue),
  maxDiscount: normalizeNumericValue(voucher.maxDiscount),
  startDate: voucher.startDate ? voucher.startDate.substring(0, 16) : "",
  endDate: voucher.endDate ? voucher.endDate.substring(0, 16) : "",
  quantity: normalizeNumericValue(voucher.quantity),
  usageLimit: normalizeNumericValue(
    voucher.maxUsagePerUser ?? voucher.usageLimit,
  ),
  status: voucher.status || "ACTIVE",
});

const validateVoucherForm = (
  formData: VoucherFormData,
  dateError: string,
): VoucherFormErrors => {
  const nextErrors: VoucherFormErrors = {};
  const discountValue = toNumber(formData.discountValue);
  const minOrderValue = toNumber(formData.minOrderValue);
  const maxDiscount =
    formData.maxDiscount === "" ? 0 : toNumber(formData.maxDiscount);
  const quantity = toNumber(formData.quantity);
  const usageLimit = toNumber(formData.usageLimit);

  if (!formData.code.trim()) {
    nextErrors.code = "Mã voucher không hợp lệ, vui lòng tạo lại";
  }
  if (!formData.title.trim()) {
    nextErrors.title = "Vui lòng nhập tên chương trình voucher";
  }
  if (isEmptyNumeric(formData.discountValue)) {
    nextErrors.discountValue =
      formData.discountType === "PERCENT"
        ? "Vui lòng nhập mức giảm phần trăm"
        : "Vui lòng nhập mức giảm tiền";
  } else if (formData.discountType === "PERCENT") {
    if (discountValue <= 0) {
      nextErrors.discountValue = "Mức giảm phần trăm phải lớn hơn 0%";
    } else if (discountValue > 50) {
      nextErrors.discountValue = "Mức giảm phần trăm không được vượt quá 50%";
    }

    if (isEmptyNumeric(formData.maxDiscount)) {
      nextErrors.maxDiscount = "Vui lòng nhập mức giảm tối đa";
    } else if (maxDiscount <= 0) {
      nextErrors.maxDiscount = "Mức giảm tối đa phải lớn hơn 0đ";
    }
  } else if (discountValue <= 1000) {
    nextErrors.discountValue = "Mức giảm tiền phải lớn hơn 1.000đ";
  } else if (
    !isEmptyNumeric(formData.minOrderValue) &&
    discountValue > minOrderValue / 2
  ) {
    nextErrors.discountValue =
      "Mức giảm (VNĐ) không được vượt quá một nửa đơn tối thiểu";
  }

  if (isEmptyNumeric(formData.minOrderValue)) {
    nextErrors.minOrderValue = "Vui lòng nhập đơn tối thiểu";
  }
  if (isEmptyNumeric(formData.quantity)) {
    nextErrors.quantity = "Vui lòng nhập tổng số lượng phát hành";
  } else if (quantity <= 0) {
    nextErrors.quantity = "Số lượng phải lớn hơn 0";
  }
  if (isEmptyNumeric(formData.usageLimit)) {
    nextErrors.usageLimit = "Vui lòng nhập lượt dùng tối đa mỗi người";
  } else if (usageLimit <= 0) {
    nextErrors.usageLimit = "Lượt dùng tối đa phải lớn hơn 0";
  }
  if (!formData.startDate) {
    nextErrors.startDate = "Vui lòng chọn ngày bắt đầu";
  }
  if (!formData.endDate) {
    nextErrors.endDate = "Vui lòng chọn ngày kết thúc";
  } else if (dateError) {
    nextErrors.endDate = dateError;
  }

  return nextErrors;
};

const fieldLabelClass =
  "mb-1.5 block text-[10.5px] font-semibold text-slate-500";
const fieldClass =
  "h-10 w-full rounded-[4px] border px-3 text-[13px] font-normal text-slate-900 outline-none placeholder:text-slate-400 focus:border-emerald-500";
const errorClass = "mt-1 text-[11px] font-medium text-red-500";

export default function VoucherForm({ initialData }: VoucherFormProps) {
  const router = useRouter();
  const isEdit = Boolean(initialData?.id);
  const [formData, setFormData] = useState<VoucherFormData>(() =>
    initialData ? mapVoucherToFormData(initialData) : createEmptyFormData(),
  );
  const [errors, setErrors] = useState<VoucherFormErrors>({});
  const [dateError, setDateError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (initialData) {
      setFormData(mapVoucherToFormData(initialData));
    }
  }, [initialData]);

  useEffect(() => {
    if (formData.startDate && formData.endDate) {
      const start = new Date(formData.startDate).getTime();
      const end = new Date(formData.endDate).getTime();
      if (end <= start) {
        setDateError("Ngày kết thúc phải lớn hơn ngày bắt đầu");
      } else if (end <= new Date().getTime()) {
        setDateError("Ngày kết thúc không được ở trong quá khứ");
      } else {
        setDateError("");
      }
    } else {
      setDateError("");
    }
  }, [formData.startDate, formData.endDate]);

  const clearFieldError = useCallback((field: keyof VoucherFormErrors) => {
    setErrors((prev) => (prev[field] ? { ...prev, [field]: "" } : prev));
  }, []);

  const updateNumericField = useCallback(
    (
      field:
        | "discountValue"
        | "minOrderValue"
        | "maxDiscount"
        | "quantity"
        | "usageLimit",
      value: string,
    ) => {
      setFormData((prev) => ({
        ...prev,
        [field]: normalizeDigitString(value),
      }));
      clearFieldError(field);
    },
    [clearFieldError],
  );

  const actionLabel = useMemo(
    () => (isEdit ? "Lưu thay đổi" : "Thêm voucher"),
    [isEdit],
  );

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const nextErrors = validateVoucherForm(formData, dateError);

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    setErrors({});
    setIsSubmitting(true);

    try {
      const maxDiscount =
        formData.maxDiscount === "" ? 0 : toNumber(formData.maxDiscount);
      const payload: VoucherUpsertPayload = {
        code: formData.code.trim().toUpperCase(),
        title: formData.title.trim(),
        discountType: formData.discountType,
        value: toNumber(formData.discountValue),
        minOrderValue: toNumber(formData.minOrderValue),
        maxDiscount: formData.maxDiscount === "" ? null : maxDiscount,
        startDate:
          formData.startDate.length === 16
            ? `${formData.startDate}:00`
            : formData.startDate,
        endDate:
          formData.endDate.length === 16
            ? `${formData.endDate}:00`
            : formData.endDate,
        quantity: toNumber(formData.quantity),
        maxUsagePerUser: toNumber(formData.usageLimit),
        status: formData.status,
      };

      if (payload.discountType === "FIXED") {
        payload.maxDiscount = null;
      }

      if (isEdit && initialData?.id) {
        await voucherService.update(initialData.id, payload);
        toast.success("Cập nhật voucher thành công");
      } else {
        await voucherService.create(payload);
        toast.success("Tạo voucher thành công");
      }

      router.push("/admin/vouchers");
      router.refresh();
    } catch (error: unknown) {
      const apiError = error as {
        response?: { data?: unknown };
        message?: string;
      };
      const data = apiError.response?.data as
        | VoucherApiErrorResponse
        | string
        | undefined;
      let message = "Có lỗi xảy ra khi lưu voucher";

      if (typeof data === "string") {
        message = data;
      } else if (data?.message) {
        message = data.message;
      } else if (data?.error) {
        message = data.error;
      } else if (data?.errors?.length) {
        message = data.errors[0].defaultMessage || message;
      } else if (apiError.message) {
        message = apiError.message;
      }

      const fieldErrors = getFieldErrorsFromApiMessage(message);
      if (Object.keys(fieldErrors).length > 0) {
        setErrors((prev) => ({ ...prev, ...fieldErrors }));
      }
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5 pb-[100px] text-slate-800" noValidate>
      <section className="rounded-[4px] border border-slate-200 bg-white p-6 shadow-sm">
        <div className="border-b border-slate-200 pb-4">
          <h2 className="text-[12px] font-semibold text-slate-900">
            1. Thông tin voucher
          </h2>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-x-5 gap-y-6 sm:grid-cols-2 xl:grid-cols-3">
          <div>
            <label className={fieldLabelClass}>Mã voucher</label>
            <input
              readOnly
              value={formData.code}
              className={`h-10 w-full cursor-not-allowed rounded-[4px] border bg-slate-50 px-3 text-[13px] font-normal text-slate-700 outline-none ${
                errors.code ? "border-red-400" : "border-slate-200"
              }`}
            />
            {errors.code && <p className={errorClass}>{errors.code}</p>}
          </div>

          <div>
            <label className={fieldLabelClass}>Tên chương trình</label>
            <input
              value={formData.title}
              onChange={(event) => {
                setFormData((prev) => ({ ...prev, title: event.target.value }));
                clearFieldError("title");
              }}
              placeholder="VD: Khuyến mãi mùa hè 2026..."
              className={`${fieldClass} ${
                errors.title ? "border-red-400" : "border-slate-200"
              }`}
            />
            {errors.title && <p className={errorClass}>{errors.title}</p>}
          </div>

          <div>
            <label className={fieldLabelClass}>Trạng thái</label>
            <select
              value={formData.status}
              onChange={(event) =>
                setFormData((prev) => ({
                  ...prev,
                  status: event.target.value as VoucherFormData["status"],
                }))
              }
              className={`${fieldClass} border-slate-200 bg-white`}
            >
              <option value="ACTIVE">Đang hoạt động</option>
              <option value="INACTIVE">Tạm ẩn</option>
              {isEdit && <option value="EXPIRED">Đã hết hạn</option>}
            </select>
          </div>

          <div>
            <label className={fieldLabelClass}>Loại giảm giá</label>
            <select
              value={formData.discountType}
              onChange={(event) => {
                setFormData((prev) => ({
                  ...prev,
                  discountType: event.target
                    .value as VoucherFormData["discountType"],
                  discountValue: "",
                  maxDiscount: "",
                }));
                setErrors((prev) => ({
                  ...prev,
                  discountValue: "",
                  maxDiscount: "",
                }));
              }}
              className={`${fieldClass} border-slate-200 bg-white`}
            >
              <option value="FIXED">Giảm số tiền cố định (VNĐ)</option>
              <option value="PERCENT">Giảm theo phần trăm (%)</option>
            </select>
          </div>

          <div>
            <label className={fieldLabelClass}>
              Mức giảm {formData.discountType === "PERCENT" ? "(%)" : "(VNĐ)"}
            </label>
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              value={formData.discountValue}
              onChange={(event) =>
                updateNumericField("discountValue", event.target.value)
              }
              placeholder={formData.discountType === "PERCENT" ? "VD: 10" : "VD: 50000"}
              className={`${fieldClass} ${
                errors.discountValue ? "border-red-400" : "border-slate-200"
              }`}
            />
            {errors.discountValue && (
              <p className={errorClass}>{errors.discountValue}</p>
            )}
          </div>

          <div>
            <label className={fieldLabelClass}>Đơn tối thiểu (VNĐ)</label>
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              value={formData.minOrderValue}
              onChange={(event) =>
                updateNumericField("minOrderValue", event.target.value)
              }
              placeholder="VD: 100000"
              className={`${fieldClass} ${
                errors.minOrderValue ? "border-red-400" : "border-slate-200"
              }`}
            />
            {errors.minOrderValue && (
              <p className={errorClass}>{errors.minOrderValue}</p>
            )}
          </div>

          <div>
            <label className={fieldLabelClass}>Giảm tối đa (VNĐ)</label>
            {formData.discountType === "PERCENT" ? (
              <>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={formData.maxDiscount}
                  onChange={(event) =>
                    updateNumericField("maxDiscount", event.target.value)
                  }
                  placeholder="VD: 30000"
                  className={`${fieldClass} ${
                    errors.maxDiscount ? "border-red-400" : "border-slate-200"
                  }`}
                />
                {errors.maxDiscount && (
                  <p className={errorClass}>{errors.maxDiscount}</p>
                )}
              </>
            ) : (
              <input
                readOnly
                value="Không áp dụng"
                className="h-10 w-full cursor-not-allowed rounded-[4px] border border-slate-200 bg-slate-50 px-3 text-[13px] font-normal text-slate-400 outline-none"
              />
            )}
          </div>

          <div>
            <label className={fieldLabelClass}>Tổng số lượng phát hành</label>
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              value={formData.quantity}
              onChange={(event) =>
                updateNumericField("quantity", event.target.value)
              }
              placeholder="VD: 100"
              className={`${fieldClass} ${
                errors.quantity ? "border-red-400" : "border-slate-200"
              }`}
            />
            {errors.quantity && <p className={errorClass}>{errors.quantity}</p>}
          </div>

          <div>
            <label className={fieldLabelClass}>Lượt dùng tối đa / 1 người</label>
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              value={formData.usageLimit}
              onChange={(event) =>
                updateNumericField("usageLimit", event.target.value)
              }
              placeholder="VD: 1"
              className={`${fieldClass} ${
                errors.usageLimit ? "border-red-400" : "border-slate-200"
              }`}
            />
            {errors.usageLimit && (
              <p className={errorClass}>{errors.usageLimit}</p>
            )}
          </div>

          <div>
            <label className={fieldLabelClass}>Ngày bắt đầu</label>
            <input
              type="datetime-local"
              value={formData.startDate}
              onChange={(event) => {
                setFormData((prev) => ({
                  ...prev,
                  startDate: event.target.value,
                }));
                setErrors((prev) => ({ ...prev, startDate: "", endDate: "" }));
              }}
              className={`${fieldClass} ${
                errors.startDate ? "border-red-400" : "border-slate-200"
              }`}
            />
            {errors.startDate && (
              <p className={errorClass}>{errors.startDate}</p>
            )}
          </div>

          <div>
            <label className={fieldLabelClass}>Ngày kết thúc</label>
            <input
              type="datetime-local"
              value={formData.endDate}
              onChange={(event) => {
                setFormData((prev) => ({
                  ...prev,
                  endDate: event.target.value,
                }));
                clearFieldError("endDate");
              }}
              className={`${fieldClass} ${
                errors.endDate || dateError
                  ? "border-red-400"
                  : "border-slate-200"
              }`}
            />
            {(errors.endDate || dateError) && (
              <p className={errorClass}>{errors.endDate || dateError}</p>
            )}
          </div>
        </div>
      </section>

      <div className="fixed bottom-0 left-0 right-0 z-[999] border-t border-slate-200 bg-white px-4 py-3 lg:left-[260px]">
        <div className="flex flex-wrap justify-end gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="h-10 min-w-[120px] rounded-[4px] border border-slate-200 bg-white px-5 text-[13px] font-semibold text-slate-700 transition-colors hover:bg-slate-50"
          >
            Hủy
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex h-10 min-w-[170px] items-center justify-center gap-2 rounded-[4px] bg-emerald-600 px-5 text-[13px] font-semibold text-white transition-colors hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? (
              <Loader2 className="animate-spin" size={16} />
            ) : (
              <Save size={16} />
            )}
            {actionLabel}
          </button>
        </div>
      </div>
    </form>
  );
}
