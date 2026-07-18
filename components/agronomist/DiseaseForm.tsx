"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { aiKnowledgeService } from "@/app/services/aiKnowledge.service";
import { PublicProductService } from "@/app/services/publicProduct.service";
import ProductMultiSelect from "@/components/agronomist/ProductMultiSelect";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { getErrorMessage } from "@/lib/axios";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { AiDiseaseKnowledge, AiKnowledgeCategory } from "@/app/types/ai-knowledge.types";
import type { PublicProductListItem } from "@/app/types/product.schema";

type KnowledgeStageForm = {
  stageTitle: string;
  instructionsText: string;
  productIds: number[];
  extraProductNamesText: string;
};

type DiseaseFormState = {
  id: number | null;
  code: string;
  nameVi: string;
  nameEn: string;
  categoryId: string;
  aliasesRaw: string;
  symptomKeywordsRaw: string;
  signsSummary: string;
  causesText: string;
  enabled: boolean;
  confidenceThreshold: number;
  matchThreshold: number;
  priority: number;
  canonical: boolean;
  status: string;
  treatmentStages: KnowledgeStageForm[];
};

type DiseasePayload = {
  code: string;
  nameVi: string;
  nameEn?: string;
  categoryId?: number;
  aliasesRaw?: string;
  symptomKeywordsRaw: string;
  signsSummary: string;
  causes: string[];
  enabled: boolean;
  confidenceThreshold: number;
  matchThreshold: number;
  priority: number;
  canonical: boolean;
  status: string;
  treatmentStages: {
    stageTitle: string;
    instructions: string[];
    productIds: number[];
    extraProductNames: string[];
  }[];
};

type StageFormErrors = {
  stageTitle?: string;
  instructionsText?: string;
};

type DiseaseFormErrors = {
  code?: string;
  nameVi?: string;
  categoryId?: string;
  symptomKeywordsRaw?: string;
  signsSummary?: string;
  causesText?: string;
  confidenceThreshold?: string;
  matchThreshold?: string;
  stages?: Record<number, StageFormErrors>;
  submit?: string;
};

const EMPTY_STAGE: KnowledgeStageForm = {
  stageTitle: "",
  instructionsText: "",
  productIds: [],
  extraProductNamesText: "",
};

const inputClassName = "h-[38px] rounded-[4px] bg-white text-[13px] shadow-none";
const textareaClassName = "resize-none rounded-[4px] bg-white text-[13px] shadow-none";
const invalidFieldClassName = "border-rose-500 focus-visible:ring-rose-200";

const splitLines = (value: string) =>
  value
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);

const optionalText = (value: string) => {
  const trimmed = value.trim();
  return trimmed ? trimmed : undefined;
};

const numberOrFallback = (value: number, fallback: number) =>
  Number.isFinite(Number(value)) ? Number(value) : fallback;

function buildDiseasePayload(form: DiseaseFormState): DiseasePayload {
  return {
    code: form.code.trim().toUpperCase(),
    nameVi: form.nameVi.trim(),
    nameEn: optionalText(form.nameEn),
    categoryId: form.categoryId ? Number(form.categoryId) : undefined,
    aliasesRaw: optionalText(form.aliasesRaw),
    symptomKeywordsRaw: form.symptomKeywordsRaw.trim(),
    signsSummary: form.signsSummary.trim(),
    causes: splitLines(form.causesText),
    enabled: form.enabled,
    confidenceThreshold: numberOrFallback(form.confidenceThreshold, 0.65),
    matchThreshold: numberOrFallback(form.matchThreshold, 0.4),
    priority: numberOrFallback(form.priority, 0),
    canonical: form.canonical,
    status: form.status,
    treatmentStages: form.treatmentStages
      .map((stage) => ({
        stageTitle: stage.stageTitle.trim(),
        instructions: splitLines(stage.instructionsText),
        productIds: stage.productIds,
        extraProductNames: splitLines(stage.extraProductNamesText),
      }))
      .filter(
        (stage) =>
          stage.stageTitle ||
          stage.instructions.length > 0 ||
          stage.productIds.length > 0 ||
          stage.extraProductNames.length > 0,
      ),
  };
}

function validateDiseasePayload(payload: DiseasePayload, form: DiseaseFormState) {
  const errors: DiseaseFormErrors = {};

  if (!payload.code) errors.code = "Vui lòng nhập mã bệnh.";
  if (payload.code && !/^[A-Z0-9_-]{2,50}$/.test(payload.code)) {
    errors.code = "Mã bệnh chỉ gồm chữ in hoa, số, dấu gạch ngang/gạch dưới và dài 2-50 ký tự.";
  }
  if (!payload.nameVi) errors.nameVi = "Vui lòng nhập tên bệnh.";
  if (!payload.symptomKeywordsRaw) {
    errors.symptomKeywordsRaw = "Vui lòng nhập dấu hiệu / triệu chứng để AI nhận diện.";
  }
  if (!payload.signsSummary) errors.signsSummary = "Vui lòng nhập mô tả dấu hiệu.";
  if (payload.causes.length === 0) errors.causesText = "Vui lòng nhập ít nhất một nguyên nhân.";

  let hasStage = false;
  form.treatmentStages.forEach((stage, index) => {
    const instructions = splitLines(stage.instructionsText);
    const extraProductNames = splitLines(stage.extraProductNamesText);
    const hasStageContent =
      Boolean(stage.stageTitle.trim()) ||
      instructions.length > 0 ||
      stage.productIds.length > 0 ||
      extraProductNames.length > 0;

    if (!hasStageContent) return;
    hasStage = true;

    const stageErrors: StageFormErrors = {};
    if (!stage.stageTitle.trim()) stageErrors.stageTitle = "Vui lòng nhập tên giai đoạn.";
    if (instructions.length === 0) stageErrors.instructionsText = "Vui lòng nhập ít nhất một hướng dẫn.";
    if (stageErrors.stageTitle || stageErrors.instructionsText) {
      errors.stages = { ...(errors.stages ?? {}), [index]: stageErrors };
    }
  });

  if (!hasStage) {
    errors.stages = {
      0: {
        stageTitle: "Vui lòng nhập tên giai đoạn.",
        instructionsText: "Vui lòng nhập ít nhất một hướng dẫn.",
      },
    };
  }

  if (payload.confidenceThreshold < 0 || payload.confidenceThreshold > 1) {
    errors.confidenceThreshold = "Ngưỡng tin cậy phải nằm trong khoảng 0 đến 1.";
  }
  if (payload.matchThreshold < 0 || payload.matchThreshold > 1) {
    errors.matchThreshold = "Ngưỡng match phải nằm trong khoảng 0 đến 1.";
  }

  return errors;
}

function hasFormErrors(errors: DiseaseFormErrors) {
  const hasFieldError = Object.entries(errors).some(([key, value]) => key !== "stages" && Boolean(value));
  const hasStageError = Object.values(errors.stages ?? {}).some(
    (stage) => Boolean(stage.stageTitle) || Boolean(stage.instructionsText),
  );
  return hasFieldError || hasStageError;
}

function firstFormError(errors: DiseaseFormErrors) {
  const fields: Array<keyof Omit<DiseaseFormErrors, "stages">> = [
    "code",
    "nameVi",
    "categoryId",
    "symptomKeywordsRaw",
    "signsSummary",
    "causesText",
    "confidenceThreshold",
    "matchThreshold",
    "submit",
  ];

  for (const field of fields) {
    if (errors[field]) return errors[field];
  }

  const firstStageError = Object.values(errors.stages ?? {}).find(
    (stage) => stage.stageTitle || stage.instructionsText,
  );
  return firstStageError?.stageTitle || firstStageError?.instructionsText || "";
}

function mapApiErrorToFormErrors(message: string): DiseaseFormErrors {
  const normalized = message.toLowerCase();

  if (normalized.includes("mã bệnh")) return { code: message };
  if (normalized.includes("tên bệnh")) return { nameVi: message };
  if (normalized.includes("danh mục")) return { categoryId: message };
  if (normalized.includes("dấu hiệu") || normalized.includes("triệu chứng")) {
    return { symptomKeywordsRaw: message };
  }
  if (normalized.includes("mô tả")) return { signsSummary: message };
  if (normalized.includes("nguyên nhân") || normalized.includes("causes")) {
    return { causesText: message };
  }

  return { submit: message };
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="mt-1 text-[10px] font-medium text-rose-500">{message}</p>;
}

function buildFormState(item?: AiDiseaseKnowledge | null): DiseaseFormState {
  if (!item) {
    return {
      id: null,
      code: "",
      nameVi: "",
      nameEn: "",
      categoryId: "",
      aliasesRaw: "",
      symptomKeywordsRaw: "",
      signsSummary: "",
      causesText: "",
      enabled: true,
      confidenceThreshold: 0.65,
      matchThreshold: 0.4,
      priority: 0,
      canonical: false,
      status: "IN_REVIEW",
      treatmentStages: [EMPTY_STAGE],
    };
  }

  return {
    id: item.id,
    code: item.code,
    nameVi: item.nameVi,
    nameEn: item.nameEn || "",
    categoryId: item.category?.id ? String(item.category.id) : "",
    aliasesRaw: item.aliasesRaw || "",
    symptomKeywordsRaw: item.symptomKeywordsRaw,
    signsSummary: item.signsSummary,
    causesText: item.causes.join("\n"),
    enabled: item.enabled,
    confidenceThreshold: item.confidenceThreshold,
    matchThreshold: item.matchThreshold,
    priority: item.priority,
    canonical: item.canonical,
    status: item.status,
    treatmentStages:
      item.treatmentStages.length > 0
        ? item.treatmentStages.map((stage) => ({
            stageTitle: stage.stageTitle,
            instructionsText: stage.instructions.join("\n"),
            productIds: stage.productIds ?? [],
            extraProductNamesText: (stage.extraProductNames ?? []).join("\n"),
          }))
        : [EMPTY_STAGE],
  };
}

export default function DiseaseForm({
  categories,
  initialData,
}: {
  categories: AiKnowledgeCategory[];
  initialData?: AiDiseaseKnowledge | null;
}) {
  const router = useRouter();
  const [form, setForm] = useState<DiseaseFormState>(() => buildFormState(initialData));
  const [formErrors, setFormErrors] = useState<DiseaseFormErrors>({});

  const productsQuery = useQuery({
    queryKey: ["agronomist-products"],
    queryFn: async () => {
      const page = await PublicProductService.getList({
        page: 0,
        size: 200,
        sort: "name-asc",
      });
      return page.content;
    },
  });
  const productOptions = useMemo(
    () =>
      (productsQuery.data ?? []).map((product: PublicProductListItem) => ({
        id: product.id,
        label: `${product.name} #${product.id}`,
        imageUrl: product.variants?.find((variant) => variant.imageUrl)?.imageUrl || product.imageUrls?.[0] || null,
      })),
    [productsQuery.data],
  );

  const saveMutation = useMutation({
    mutationFn: async (payload: DiseasePayload) => {
      if (form.id) {
        return aiKnowledgeService.updateDisease(form.id, payload);
      }
      return aiKnowledgeService.createDisease(payload);
    },
    onSuccess: () => {
      toast.success("Đã lưu phác đồ. Phác đồ đang ở trạng thái chờ Admin duyệt trước khi AI dùng để trả lời.");
      router.push("/agronomist/diseases");
    },
    onError: (error: unknown) => {
      const message = getErrorMessage(error) || "Không thể lưu phác đồ.";
      setFormErrors(mapApiErrorToFormErrors(message));
      toast.error(message);
    },
  });

  const updateField = <Field extends keyof DiseaseFormState>(field: Field, value: DiseaseFormState[Field]) => {
    setFormErrors((current) => ({ ...current, [field]: undefined, submit: undefined }));
    setForm((current) => ({ ...current, [field]: value }));
  };

  const updateStage = (index: number, patch: Partial<KnowledgeStageForm>) => {
    setFormErrors((current) => {
      const stages = { ...(current.stages ?? {}) };
      delete stages[index];
      return {
        ...current,
        stages: Object.keys(stages).length > 0 ? stages : undefined,
        submit: undefined,
      };
    });
    setForm((current) => ({
      ...current,
      treatmentStages: current.treatmentStages.map((stage, stageIndex) =>
        stageIndex === index ? { ...stage, ...patch } : stage,
      ),
    }));
  };

  const addStage = () => {
    setFormErrors((current) => ({ ...current, stages: undefined, submit: undefined }));
    setForm((current) => ({
      ...current,
      treatmentStages: [...current.treatmentStages, { ...EMPTY_STAGE }],
    }));
  };

  const removeStage = (index: number) => {
    setFormErrors((current) => ({ ...current, stages: undefined, submit: undefined }));
    setForm((current) => ({
      ...current,
      treatmentStages:
        current.treatmentStages.length === 1
          ? current.treatmentStages
          : current.treatmentStages.filter((_, stageIndex) => stageIndex !== index),
    }));
  };

  const handleSubmit = () => {
    const payload = buildDiseasePayload(form);
    const errors = validateDiseasePayload(payload, form);

    if (hasFormErrors(errors)) {
      setFormErrors(errors);
      toast.error(firstFormError(errors));
      return;
    }

    setFormErrors({});
    saveMutation.mutate(payload);
  };

  return (
    <div className="rounded-[4px] border border-[#dcdcdc] bg-white p-6 shadow-sm">
      <div className="grid gap-4 md:grid-cols-4">
        <div className="space-y-2">
          <Label className="text-[10.5px] font-semibold text-slate-500">Mã bệnh</Label>
          <Input
            value={form.code}
            onChange={(event) => updateField("code", event.target.value)}
            aria-invalid={Boolean(formErrors.code)}
            className={cn(inputClassName, formErrors.code && invalidFieldClassName)}
          />
          <FieldError message={formErrors.code} />
        </div>
        <div className="space-y-2">
          <Label className="text-[10.5px] font-semibold text-slate-500">Tên bệnh</Label>
          <Input
            value={form.nameVi}
            onChange={(event) => updateField("nameVi", event.target.value)}
            aria-invalid={Boolean(formErrors.nameVi)}
            className={cn(inputClassName, formErrors.nameVi && invalidFieldClassName)}
          />
          <FieldError message={formErrors.nameVi} />
        </div>
        <div className="space-y-2">
          <Label className="text-[10.5px] font-semibold text-slate-500">Tên tiếng Anh</Label>
          <Input
            value={form.nameEn}
            onChange={(event) => updateField("nameEn", event.target.value)}
            className={inputClassName}
          />
        </div>
        <div className="space-y-2">
          <Label className="text-[10.5px] font-semibold text-slate-500">Danh mục</Label>
          <Select
            value={form.categoryId || undefined}
            onValueChange={(value) => updateField("categoryId", value)}
          >
            <SelectTrigger
              aria-invalid={Boolean(formErrors.categoryId)}
              className={cn(inputClassName, formErrors.categoryId && invalidFieldClassName)}
            >
              <SelectValue placeholder="Chưa gán danh mục" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((category) => (
                <SelectItem key={category.id} value={String(category.id)} className="text-[13px]">
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FieldError message={formErrors.categoryId} />
        </div>
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label className="text-[10.5px] font-semibold text-slate-500">Tên gọi khác</Label>
          <Textarea
            value={form.aliasesRaw}
            onChange={(event) => updateField("aliasesRaw", event.target.value)}
            rows={3}
            className={textareaClassName}
          />
        </div>
        <div className="space-y-2">
          <Label className="text-[10.5px] font-semibold text-slate-500">Dấu hiệu / triệu chứng</Label>
          <Textarea
            value={form.symptomKeywordsRaw}
            onChange={(event) => updateField("symptomKeywordsRaw", event.target.value)}
            rows={3}
            aria-invalid={Boolean(formErrors.symptomKeywordsRaw)}
            className={cn(textareaClassName, formErrors.symptomKeywordsRaw && invalidFieldClassName)}
          />
          <FieldError message={formErrors.symptomKeywordsRaw} />
        </div>
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label className="text-[10.5px] font-semibold text-slate-500">Mô tả dấu hiệu</Label>
          <Textarea
            value={form.signsSummary}
            onChange={(event) => updateField("signsSummary", event.target.value)}
            rows={4}
            aria-invalid={Boolean(formErrors.signsSummary)}
            className={cn(textareaClassName, formErrors.signsSummary && invalidFieldClassName)}
          />
          <FieldError message={formErrors.signsSummary} />
        </div>
        <div className="space-y-2">
          <Label className="text-[10.5px] font-semibold text-slate-500">Nguyên nhân</Label>
          <Textarea
            value={form.causesText}
            onChange={(event) => updateField("causesText", event.target.value)}
            rows={4}
            aria-invalid={Boolean(formErrors.causesText)}
            className={cn(textareaClassName, formErrors.causesText && invalidFieldClassName)}
          />
          <FieldError message={formErrors.causesText} />
        </div>
      </div>

      <label className="mt-4 flex items-center gap-2 text-[13px] text-slate-600">
        <input
          type="checkbox"
          checked={form.enabled}
          onChange={(event) => updateField("enabled", event.target.checked)}
        />
        Đang bật
      </label>

      <div className="mt-6 rounded-[4px] border border-slate-200 bg-slate-50 p-5">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="text-sm font-black text-slate-900">Phác đồ điều trị theo giai đoạn</p>
          </div>
          <Button type="button" variant="outline" onClick={addStage}
            className="h-9 rounded-[4px] border-slate-300 text-[13px] font-medium text-slate-600 hover:bg-white">
            <Plus size={14} className="mr-1.5" />
            Thêm giai đoạn
          </Button>
        </div>

        <div className="space-y-4">
          {form.treatmentStages.map((stage, index) => {
            const stageErrors = formErrors.stages?.[index];

            return (
              <div key={`${index}-${stage.stageTitle}`} className="rounded-[4px] border border-slate-200 bg-white p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-bold text-slate-900">Giai đoạn {index + 1}</p>
                  <Button type="button" variant="ghost" onClick={() => removeStage(index)}
                    className="h-8 rounded-[4px] text-[12px] font-medium text-rose-600 hover:bg-rose-50">
                    Bỏ giai đoạn
                  </Button>
                </div>
                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label className="text-[10.5px] font-semibold text-slate-500">Tên giai đoạn</Label>
                    <Input
                      value={stage.stageTitle}
                      onChange={(event) => updateStage(index, { stageTitle: event.target.value })}
                      aria-invalid={Boolean(stageErrors?.stageTitle)}
                      className={cn(inputClassName, stageErrors?.stageTitle && invalidFieldClassName)}
                    />
                    <FieldError message={stageErrors?.stageTitle} />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10.5px] font-semibold text-slate-500">Sản phẩm áp dụng</Label>
                    <ProductMultiSelect
                      options={productOptions}
                      value={stage.productIds}
                      onChange={(productIds) => updateStage(index, { productIds })}
                      loading={productsQuery.isLoading}
                      emptyMessage="Chưa có sản phẩm đang hoạt động trong catalog."
                    />
                  </div>
                </div>
                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label className="text-[10.5px] font-semibold text-slate-500">Hướng dẫn điều trị</Label>
                    <Textarea
                      value={stage.instructionsText}
                      onChange={(event) => updateStage(index, { instructionsText: event.target.value })}
                      rows={4}
                      aria-invalid={Boolean(stageErrors?.instructionsText)}
                      className={cn(textareaClassName, stageErrors?.instructionsText && invalidFieldClassName)}
                    />
                    <FieldError message={stageErrors?.instructionsText} />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10.5px] font-semibold text-slate-500">Tên thuốc/sản phẩm khác</Label>
                    <Textarea
                      value={stage.extraProductNamesText}
                      onChange={(event) => updateStage(index, { extraProductNamesText: event.target.value })}
                      rows={4}
                      className={textareaClassName}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-6 flex justify-end gap-3 border-t border-slate-200 pt-4">
        <div className="mr-auto flex items-center">
          <FieldError message={formErrors.submit} />
        </div>
        <Button type="button" variant="outline" onClick={() => router.push("/agronomist/diseases")}
          className="h-10 rounded-md border-slate-300 px-6 text-[13px] font-medium text-slate-600 hover:bg-slate-50">
          Hủy
        </Button>
        <Button onClick={handleSubmit} disabled={saveMutation.isPending}
          className="h-10 rounded-md bg-blue-600 px-8 text-[13px] font-semibold text-white hover:bg-blue-700">
          {saveMutation.isPending ? "Đang lưu..." : form.id ? "Cập nhật phác đồ" : "Tạo phác đồ"}
        </Button>
      </div>
    </div>
  );
}
