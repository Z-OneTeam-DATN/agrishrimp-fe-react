"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { X, Save, Loader2 } from "lucide-react";
import { toast } from "sonner";

import {
  createAttribute,
  getAttributeById,
  updateAttribute,
} from "@/app/services/AttributeService";
import { AdminAttributeSchema } from "@/app/types/admin.schema";
import { getErrorMessage } from "@/lib/axios";
import { cn } from "@/lib/utils";
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

const AdminAttributePageSchema = AdminAttributeSchema.omit({
  description: true,
  code: true,
});

type AdminAttributePageForm = z.infer<typeof AdminAttributePageSchema>;

export default function AddVariantPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [newValueInput, setNewValueInput] = useState("");
  const [valueInputError, setValueInputError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const idFromUrl = searchParams.get("id");
  const isEditMode = Boolean(idFromUrl);

  const {
    register,
    handleSubmit,
    control,
    setValue,
    watch,
    reset,
    clearErrors,
    formState: { errors },
  } = useForm<AdminAttributePageForm>({
    resolver: zodResolver(AdminAttributePageSchema),
    mode: "onTouched",
    defaultValues: {
      name: "",
      status: "ACTIVE",
      values: [],
    },
  });

  useEffect(() => {
    if (!isEditMode || !idFromUrl) return;

    const fetchDetail = async () => {
      try {
        const data = await getAttributeById(Number(idFromUrl));
        reset({
          name: data.name,
          status: data.status,
          values: data.values || [],
        });
      } catch (error) {
        toast.error("Không tìm thấy thuộc tính yêu cầu!");
        router.push("/admin/variants");
      }
    };

    void fetchDetail();
  }, [idFromUrl, isEditMode, reset, router]);

  const values = watch("values") || [];
  const fieldLabelClass = "text-[10.5px] font-semibold text-slate-500";
  const fieldControlClass =
    "h-[38px] text-[13px] font-normal text-slate-800 shadow-none placeholder:text-slate-400";
  const sectionCardClass = "border border-slate-200 bg-white p-6 shadow-sm";
  const sectionTitleClass = "text-[11px] font-bold text-slate-800";

  const normalizeValueForCompare = (value: string) =>
    value.trim().replace(/\s+/g, " ").toLocaleLowerCase("vi");

  useEffect(() => {
    const nextVal = newValueInput.trim();
    if (!nextVal) {
      setValueInputError("");
      return;
    }

    const isDuplicate = values.some(
      (item) =>
        normalizeValueForCompare(item) === normalizeValueForCompare(nextVal),
    );

    setValueInputError(
      isDuplicate
        ? "Giá trị này đã tồn tại (không phân biệt hoa thường)."
        : "",
    );
  }, [newValueInput, values]);

  const addValue = () => {
    const val = newValueInput.trim();
    if (!val || valueInputError) return;

    const isDuplicate = values.some(
      (item) =>
        normalizeValueForCompare(item) === normalizeValueForCompare(val),
    );
    if (isDuplicate) {
      setValueInputError(
        "Giá trị này đã tồn tại (không phân biệt hoa thường).",
      );
      return;
    }

    setValue("values", [...values, val], { shouldValidate: true });
    setNewValueInput("");
    setValueInputError("");
    clearErrors("values");
  };

  const removeValue = (val: string) => {
    setValue(
      "values",
      values.filter((item) => item !== val),
      { shouldValidate: true },
    );
  };

  const onSave = async (data: AdminAttributePageForm) => {
    try {
      setIsSubmitting(true);

      if (isEditMode) {
        await updateAttribute(Number(idFromUrl), data);
        toast.success("Cập nhật thành công!");
      } else {
        await createAttribute(data);
        toast.success("Thêm mới thành công!");
      }

      router.push("/admin/variants");
    } catch (error) {
      toast.error(getErrorMessage(error as any));
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
        <h1 className="text-[20px] font-semibold tracking-tight uppercase text-slate-900">
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
            <Label className={fieldLabelClass}>Trạng thái sử dụng</Label>
            <Controller
              name="status"
              control={control}
              render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value}>
                  <SelectTrigger
                    className={cn(
                      fieldControlClass,
                      "border-slate-200 bg-white",
                    )}
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
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
              onChange={(e) => setNewValueInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
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
            {values.map((val) => (
              <div
                key={val}
                className="flex h-8 items-center rounded-[4px] border border-slate-200 bg-white px-3 shadow-sm"
              >
                <span className="mr-2 text-[12px] font-semibold text-slate-700">
                  {val}
                </span>
                <button
                  type="button"
                  onClick={() => removeValue(val)}
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
