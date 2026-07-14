"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Save, X } from "lucide-react";
import { toast } from "sonner";

import {
  createAttribute,
  getAttributeById,
  getAttributes,
  updateAttribute,
} from "@/app/services/AttributeService";
import { AdminAttributeSchema } from "@/app/types/admin.schema";
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
import { getErrorMessage } from "@/lib/axios";
import { cn } from "@/lib/utils";

const ATTRIBUTE_STATUS_PLACEHOLDER = "__ATTRIBUTE_STATUS_PLACEHOLDER__";

const AdminAttributePageSchema = AdminAttributeSchema.omit({
  description: true,
  code: true,
}).extend({
  status: z.preprocess(
    (value) =>
      value === "" || value === ATTRIBUTE_STATUS_PLACEHOLDER ? undefined : value,
    z.enum(["ACTIVE", "INACTIVE"], {
      required_error: "Vui lòng chọn trạng thái sử dụng",
      invalid_type_error: "Vui lòng chọn trạng thái sử dụng",
    }),
  ),
});

type AdminAttributePageForm = z.infer<typeof AdminAttributePageSchema>;

type AttributeLookupItem = {
  id?: number;
  name?: string;
  values?: string[];
};

type ValueConflictInfo = {
  attributeName: string;
};

const normalizeValueForCompare = (value: string) =>
  value.trim().replace(/\s+/g, " ").toLocaleLowerCase("vi");

export default function AddVariantPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [newValueInput, setNewValueInput] = useState("");
  const [valueInputError, setValueInputError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [allAttributes, setAllAttributes] = useState<AttributeLookupItem[]>([]);

  const idFromUrl = searchParams.get("id");
  const currentAttributeId = idFromUrl ? Number(idFromUrl) : null;
  const isEditMode = currentAttributeId !== null && !Number.isNaN(currentAttributeId);

  const {
    register,
    handleSubmit,
    control,
    setValue,
    setError,
    watch,
    reset,
    clearErrors,
    formState: { errors },
  } = useForm<AdminAttributePageForm>({
    resolver: zodResolver(AdminAttributePageSchema),
    mode: "onTouched",
    defaultValues: {
      name: "",
      values: [],
    },
  });

  useEffect(() => {
    let isMounted = true;

    const fetchPageData = async () => {
      const [attributesResult, detailResult] = await Promise.allSettled([
        getAttributes(),
        isEditMode && currentAttributeId !== null
          ? getAttributeById(currentAttributeId)
          : Promise.resolve(null),
      ]);

      if (!isMounted) return;

      if (attributesResult.status === "fulfilled") {
        setAllAttributes(Array.isArray(attributesResult.value) ? attributesResult.value : []);
      } else {
        setAllAttributes([]);
        toast.error("Không thể tải danh sách thuộc tính để kiểm tra trùng giá trị.");
      }

      if (!isEditMode) return;

      if (detailResult.status === "fulfilled" && detailResult.value) {
        reset({
          name: detailResult.value.name,
          status: detailResult.value.status,
          values: detailResult.value.values || [],
        });
        return;
      }

      toast.error("Không tìm thấy thuộc tính yêu cầu!");
      router.push("/admin/variants");
    };

    void fetchPageData();

    return () => {
      isMounted = false;
    };
  }, [currentAttributeId, isEditMode, reset, router]);

  const values = watch("values", []);
  const fieldLabelClass = "text-[10.5px] font-semibold text-slate-500";
  const fieldControlClass =
    "h-[38px] text-[13px] font-normal text-slate-800 shadow-none placeholder:text-slate-400";
  const sectionCardClass = "border border-slate-200 bg-white p-6 shadow-sm";
  const sectionTitleClass = "text-[11px] font-bold text-slate-800";

  const conflictingValueLookup = allAttributes.reduce<Record<string, ValueConflictInfo>>(
    (acc, attribute) => {
      if (!attribute) return acc;
      if (
        currentAttributeId !== null &&
        typeof attribute.id === "number" &&
        attribute.id === currentAttributeId
      ) {
        return acc;
      }

      const attributeName = attribute.name?.trim() || "thuộc tính khác";
      for (const rawValue of attribute.values || []) {
        const normalizedValue = normalizeValueForCompare(rawValue);
        if (!normalizedValue || acc[normalizedValue]) continue;

        acc[normalizedValue] = {
          attributeName,
        };
      }

      return acc;
    },
    {},
  );

  const getDuplicateMessage = () =>
    "Giá trị này đã tồn tại trong thuộc tính này.";

  const getConflictMessage = (conflict: ValueConflictInfo) =>
    `Giá trị này đã tồn tại ở thuộc tính "${conflict.attributeName}".`;

  const getCrossAttributeConflict = (value: string) =>
    conflictingValueLookup[normalizeValueForCompare(value)] || null;

  useEffect(() => {
    const nextValue = newValueInput.trim();
    if (!nextValue) {
      setValueInputError("");
      return;
    }

    const isDuplicateInCurrentAttribute = values.some(
      (item) => normalizeValueForCompare(item) === normalizeValueForCompare(nextValue),
    );

    if (isDuplicateInCurrentAttribute) {
      setValueInputError(getDuplicateMessage());
      return;
    }

    const crossAttributeConflict =
      conflictingValueLookup[normalizeValueForCompare(nextValue)] || null;
    if (crossAttributeConflict) {
      setValueInputError(getConflictMessage(crossAttributeConflict));
      return;
    }

    setValueInputError("");
  }, [newValueInput, values, conflictingValueLookup]);

  useEffect(() => {
    if (values.length === 0) {
      if (errors.values?.type === "manual") {
        clearErrors("values");
      }
      return;
    }

    const seenValues = new Set<string>();
    for (const value of values) {
      const normalizedValue = normalizeValueForCompare(value);
      if (seenValues.has(normalizedValue)) {
        setError("values", {
          type: "manual",
          message: getDuplicateMessage(),
        });
        return;
      }
      seenValues.add(normalizedValue);
    }

    for (const value of values) {
      const conflict = conflictingValueLookup[normalizeValueForCompare(value)] || null;
      if (conflict) {
        setError("values", {
          type: "manual",
          message: `Giá trị "${value}" đã tồn tại ở thuộc tính "${conflict.attributeName}".`,
        });
        return;
      }
    }

    if (errors.values?.type === "manual") {
      clearErrors("values");
    }
  }, [
    clearErrors,
    errors.values?.type,
    setError,
    values,
    conflictingValueLookup,
  ]);

  const addValue = () => {
    const nextValue = newValueInput.trim();
    if (!nextValue) return;

    const isDuplicateInCurrentAttribute = values.some(
      (item) => normalizeValueForCompare(item) === normalizeValueForCompare(nextValue),
    );
    if (isDuplicateInCurrentAttribute) {
      setValueInputError(getDuplicateMessage());
      return;
    }

    const crossAttributeConflict = getCrossAttributeConflict(nextValue);
    if (crossAttributeConflict) {
      setValueInputError(getConflictMessage(crossAttributeConflict));
      return;
    }

    setValue("values", [...values, nextValue], {
      shouldValidate: true,
      shouldDirty: true,
      shouldTouch: true,
    });
    setNewValueInput("");
    setValueInputError("");
  };

  const removeValue = (valueToRemove: string) => {
    setValue(
      "values",
      values.filter((item) => item !== valueToRemove),
      {
        shouldValidate: true,
        shouldDirty: true,
        shouldTouch: true,
      },
    );
  };

  const onSave = async (data: AdminAttributePageForm) => {
    const duplicatedValue = data.values.find((value, index, currentValues) => {
      const normalizedValue = normalizeValueForCompare(value);
      return (
        currentValues.findIndex(
          (item) => normalizeValueForCompare(item) === normalizedValue,
        ) !== index
      );
    });

    if (duplicatedValue) {
      const message = getDuplicateMessage();
      setError("values", {
        type: "manual",
        message,
      });
      toast.error(message);
      return;
    }

    const conflictingValue = data.values.find((value) => getCrossAttributeConflict(value));
    if (conflictingValue) {
      const conflict = getCrossAttributeConflict(conflictingValue);
      if (conflict) {
        const message = `Giá trị "${conflictingValue}" đã tồn tại ở thuộc tính "${conflict.attributeName}".`;
        setError("values", {
          type: "manual",
          message,
        });
        toast.error(message);
        return;
      }
    }

    try {
      setIsSubmitting(true);

      if (isEditMode && currentAttributeId !== null) {
        await updateAttribute(currentAttributeId, data);
        toast.success("Cập nhật thành công!");
      } else {
        await createAttribute(data);
        toast.success("Thêm mới thành công!");
      }

      router.push("/admin/variants");
    } catch (error) {
      toast.error(getErrorMessage(error as never));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit(onSave)}
      className="space-y-5 px-1 pb-[100px] text-slate-800"
    >
      <div className="mb-8 mt-2 space-y-4">
        <h1 className="text-[20px] font-semibold uppercase tracking-tight text-slate-900">
          {isEditMode ? "Chỉnh sửa thuộc tính" : "Thêm thuộc tính mới"}
        </h1>
      </div>

      <div className={sectionCardClass}>
        <div className="border-b border-slate-200 pb-3">
          <span className={sectionTitleClass}>1. Thông tin thuộc tính</span>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-x-6 gap-y-5 md:grid-cols-2">
          <div className="space-y-1.5 md:col-span-2">
            <Label className={fieldLabelClass}>
              Tên thuộc tính <span className="text-rose-500">*</span>
            </Label>
            <Input
              {...register("name")}
              placeholder="Ví dụ: Đơn vị tính..."
              className={cn(fieldControlClass, "border-slate-200 bg-white")}
            />
            {errors.name && (
              <p className="text-[10px] font-medium text-rose-500">
                {errors.name.message}
              </p>
            )}
          </div>

          <div className="space-y-1.5 md:col-span-2">
            <Label className={fieldLabelClass}>
              Trạng thái sử dụng <span className="text-rose-500">*</span>
            </Label>
            <Controller
              name="status"
              control={control}
              render={({ field }) => (
                <Select
                  onValueChange={(value) =>
                    field.onChange(
                      value === ATTRIBUTE_STATUS_PLACEHOLDER ? "" : value,
                    )
                  }
                  value={field.value || ATTRIBUTE_STATUS_PLACEHOLDER}
                >
                  <SelectTrigger
                    className={cn(
                      fieldControlClass,
                      "border-slate-200 bg-white",
                      !field.value && "text-slate-400",
                    )}
                  >
                    <SelectValue placeholder="-- Chọn trạng thái --" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem
                      value={ATTRIBUTE_STATUS_PLACEHOLDER}
                      className="text-[13px] text-slate-400"
                    >
                      -- Chọn trạng thái --
                    </SelectItem>
                    <SelectItem value="ACTIVE" className="text-[13px]">
                      Đang sử dụng
                    </SelectItem>
                    <SelectItem value="INACTIVE" className="text-[13px]">
                      Tạm ngừng
                    </SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
            {errors.status && (
              <p className="text-[10px] font-medium text-rose-500">
                {errors.status.message}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className={sectionCardClass}>
        <div className="border-b border-slate-200 pb-3">
          <span className={sectionTitleClass}>2. Danh sách giá trị hợp lệ</span>
        </div>

        <div className="mt-4 space-y-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <Input
              placeholder="Nhập giá trị mới rồi nhấn Enter..."
              className={cn(
                fieldControlClass,
                "bg-white sm:max-w-[420px]",
                valueInputError
                  ? "border-rose-300 focus-visible:ring-rose-500/20"
                  : "border-slate-200",
              )}
              value={newValueInput}
              onChange={(event) => setNewValueInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  addValue();
                }
              }}
            />
            <Button
              type="button"
              onClick={addValue}
              className="h-[38px] rounded-[4px] bg-blue-600 px-4 text-[13px] font-medium text-white hover:bg-blue-700"
            >
              Thêm
            </Button>
          </div>

          {valueInputError && (
            <p className="text-[10px] font-medium text-rose-500">
              {valueInputError}
            </p>
          )}

          <div
            className={cn(
              "flex min-h-[120px] flex-wrap content-start gap-2 rounded-[4px] border bg-slate-50 p-4",
              errors.values ? "border-rose-200" : "border-slate-200",
            )}
          >
            {values.map((value) => (
              <div
                key={value}
                className="flex h-8 items-center rounded-[4px] border border-slate-200 bg-white px-3 shadow-sm"
              >
                <span className="mr-2 text-[12px] font-semibold text-slate-700">
                  {value}
                </span>
                <button
                  type="button"
                  onClick={() => removeValue(value)}
                  className="text-slate-300 transition-colors hover:text-rose-500"
                >
                  <X size={13} />
                </button>
              </div>
            ))}

            {values.length === 0 && (
              <span className="m-auto text-[12px] font-medium text-slate-300">
                Chưa có giá trị nào
              </span>
            )}
          </div>

          {errors.values && (
            <p className="text-[10px] font-medium text-rose-500">
              {errors.values.message}
            </p>
          )}

          <p className="text-[10px] text-slate-400">
            Mẹo: nhấn Enter để thêm nhanh từng giá trị.
          </p>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 z-[999] border-t border-slate-200 bg-white px-4 py-3 lg:left-[260px]">
        <div className="flex flex-wrap justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            className="h-10 min-w-[110px] rounded-md border-slate-300 bg-white px-6 text-[13px] font-medium text-slate-600 hover:bg-slate-50"
            onClick={() => router.back()}
          >
            Hủy
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting}
            className="h-10 min-w-[160px] rounded-md bg-blue-600 px-6 text-[13px] font-semibold text-white hover:bg-blue-700"
          >
            {isSubmitting ? (
              <Loader2 className="mr-2 animate-spin" size={16} />
            ) : (
              <Save className="mr-2" size={16} />
            )}
            {isEditMode ? "Lưu thay đổi" : "Tạo thuộc tính"}
          </Button>
        </div>
      </div>
    </form>
  );
}
