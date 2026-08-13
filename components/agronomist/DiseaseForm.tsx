"use client";

import { useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "@tanstack/react-query";
import { ImagePlus, Plus, X } from "lucide-react";
import { toast } from "sonner";
import { aiKnowledgeService } from "@/app/services/aiKnowledge.service";
import { FileService } from "@/app/services/file.service";
import { PublicProductService } from "@/app/services/publicProduct.service";
import ProductMultiSelect from "@/components/agronomist/ProductMultiSelect";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { getErrorMessage } from "@/lib/axios";
import { resolveImageUrl } from "@/lib/resolveImageUrl";
import { cn } from "@/lib/utils";
import {
  AgronomistPanel,
  agronomistInputClassName,
  agronomistOutlineButtonClassName,
  agronomistPrimaryButtonClassName,
  agronomistTextareaClassName,
} from "@/components/agronomist/agronomist-ui";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type {
  AiDiseaseKnowledge,
  AiKnowledgeCategory,
} from "@/app/types/ai-knowledge.types";
import type { PublicProductListItem } from "@/app/types/product.schema";

import "react-quill-new/dist/quill.snow.css";

const ReactQuill = dynamic(() => import("react-quill-new"), { ssr: false });

const TREATMENT_STAGE_QUILL_MODULES = {
  toolbar: [
    [{ header: [3, 4, false] }],
    ["bold", "italic", "underline", "strike"],
    [{ list: "ordered" }, { list: "bullet" }],
    [{ indent: "-1" }, { indent: "+1" }],
    ["blockquote", "link"],
    ["clean"],
  ],
};

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
  engineerName: string;
  engineerPhone: string;
  imageUrls: string[];
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
  engineerName?: string;
  engineerPhone?: string;
  imageUrls: string[];
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

const inputClassName = agronomistInputClassName;
const textareaClassName = cn("resize-none", agronomistTextareaClassName);
const invalidFieldClassName = "border-rose-500 focus-visible:ring-rose-200";

const splitLines = (value: string) =>
  value
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);

const HTML_TAG_PATTERN = /<\/?[a-z][\s\S]*>/i;

const escapeStageHtml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

const isHtmlEmpty = (value: string) => {
  const normalized = value
    .replace(/<p><br><\/p>/gi, "")
    .replace(/<br\s*\/?>/gi, "")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .trim();

  return normalized.length === 0;
};

const stageInstructionsToEditorHtml = (instructions: string[] = []) => {
  const visibleInstructions = instructions
    .map((instruction) => instruction.trim())
    .filter(Boolean);

  if (visibleInstructions.length === 0) return "";
  if (
    visibleInstructions.length === 1 &&
    HTML_TAG_PATTERN.test(visibleInstructions[0])
  ) {
    return visibleInstructions[0];
  }

  return `<ul>${visibleInstructions
    .map((instruction) => `<li>${escapeStageHtml(instruction)}</li>`)
    .join("")}</ul>`;
};

const stageInstructionsToPayload = (value: string) => {
  const trimmed = value.trim();
  return trimmed && !isHtmlEmpty(trimmed) ? [trimmed] : [];
};

const optionalText = (value: string) => {
  const trimmed = value.trim();
  return trimmed ? trimmed : undefined;
};

const numberOrFallback = (value: number, fallback: number) =>
  Number.isFinite(Number(value)) ? Number(value) : fallback;

const resolveProductOptionImage = (product: PublicProductListItem) => {
  const imageCandidates = [
    ...(product.variants ?? []).flatMap((variant) =>
      (variant.imageUrl || "").split(","),
    ),
    ...(product.imageUrls ?? []).flatMap((imageUrl) =>
      (imageUrl || "").split(","),
    ),
  ]
    .map((imageUrl) => imageUrl.trim())
    .filter((imageUrl) => imageUrl && imageUrl !== "/placeholder.svg");

  const firstImage = imageCandidates[0];
  return firstImage ? resolveImageUrl(firstImage, "/placeholder.svg") : null;
};

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
    engineerName: optionalText(form.engineerName),
    engineerPhone: optionalText(form.engineerPhone),
    imageUrls: form.imageUrls,
    enabled: form.enabled,
    confidenceThreshold: numberOrFallback(form.confidenceThreshold, 0.65),
    matchThreshold: numberOrFallback(form.matchThreshold, 0.4),
    priority: numberOrFallback(form.priority, 0),
    canonical: form.canonical,
    status: form.status,
    treatmentStages: form.treatmentStages
      .map((stage) => {
        const instructions = stageInstructionsToPayload(
          stage.instructionsText,
        );
        return {
          stageTitle: stage.stageTitle.trim(),
          instructions,
          productIds: stage.productIds,
          extraProductNames: splitLines(stage.extraProductNamesText),
        };
      })
      .filter(
        (stage) =>
          stage.stageTitle ||
          stage.instructions.length > 0 ||
          stage.productIds.length > 0 ||
          stage.extraProductNames.length > 0,
      ),
  };
}

function validateDiseasePayload(
  payload: DiseasePayload,
  form: DiseaseFormState,
) {
  const errors: DiseaseFormErrors = {};

  if (!payload.code) errors.code = "Vui lòng nhập mã bệnh.";
  if (payload.code && !/^[A-Z0-9_-]{2,50}$/.test(payload.code)) {
    errors.code =
      "Mã bệnh chỉ gồm chữ in hoa, số, dấu gạch ngang/gạch dưới và dài 2-50 ký tự.";
  }
  if (!payload.nameVi) errors.nameVi = "Vui lòng nhập tên bệnh.";
  if (!payload.symptomKeywordsRaw) {
    errors.symptomKeywordsRaw =
      "Vui lòng nhập dấu hiệu / triệu chứng để AI nhận diện.";
  }
  if (!payload.signsSummary)
    errors.signsSummary = "Vui lòng nhập mô tả dấu hiệu.";
  if (payload.causes.length === 0)
    errors.causesText = "Vui lòng nhập ít nhất một nguyên nhân.";

  let hasStage = false;
  form.treatmentStages.forEach((stage, index) => {
    const instructions = stageInstructionsToPayload(stage.instructionsText);
    const extraProductNames = splitLines(stage.extraProductNamesText);
    const hasStageContent =
      Boolean(stage.stageTitle.trim()) ||
      instructions.length > 0 ||
      stage.productIds.length > 0 ||
      extraProductNames.length > 0;

    if (!hasStageContent) return;
    hasStage = true;

    const stageErrors: StageFormErrors = {};
    if (!stage.stageTitle.trim())
      stageErrors.stageTitle = "Vui lòng nhập tên giai đoạn.";
    if (instructions.length === 0)
      stageErrors.instructionsText = "Vui lòng nhập ít nhất một hướng dẫn.";
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
    errors.confidenceThreshold =
      "Ngưỡng tin cậy phải nằm trong khoảng 0 đến 1.";
  }
  if (payload.matchThreshold < 0 || payload.matchThreshold > 1) {
    errors.matchThreshold = "Ngưỡng match phải nằm trong khoảng 0 đến 1.";
  }

  return errors;
}

function hasFormErrors(errors: DiseaseFormErrors) {
  const hasFieldError = Object.entries(errors).some(
    ([key, value]) => key !== "stages" && Boolean(value),
  );
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
  return (
    <p className="mt-1 text-[10px] font-medium text-rose-500">{message}</p>
  );
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
      engineerName: "",
      engineerPhone: "",
      imageUrls: [],
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
    engineerName: item.engineerName || "",
    engineerPhone: item.engineerPhone || "",
    imageUrls: item.imageUrls ?? [],
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
            instructionsText: stageInstructionsToEditorHtml(
              stage.instructions,
            ),
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
  const [form, setForm] = useState<DiseaseFormState>(() =>
    buildFormState(initialData),
  );
  const [formErrors, setFormErrors] = useState<DiseaseFormErrors>({});
  const [isUploadingImages, setIsUploadingImages] = useState(false);

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
        imageUrl: resolveProductOptionImage(product),
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
      toast.success(
        "Đã lưu phác đồ. Phác đồ đang ở trạng thái chờ Admin duyệt trước khi AI dùng để trả lời.",
      );
      router.push("/admin/ai-knowledge/diseases");
    },
    onError: (error: unknown) => {
      const message = getErrorMessage(error) || "Không thể lưu phác đồ.";
      setFormErrors(mapApiErrorToFormErrors(message));
      toast.error(message);
    },
  });

  const updateField = <Field extends keyof DiseaseFormState>(
    field: Field,
    value: DiseaseFormState[Field],
  ) => {
    setFormErrors((current) => ({
      ...current,
      [field]: undefined,
      submit: undefined,
    }));
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
    setFormErrors((current) => ({
      ...current,
      stages: undefined,
      submit: undefined,
    }));
    setForm((current) => ({
      ...current,
      treatmentStages: [...current.treatmentStages, { ...EMPTY_STAGE }],
    }));
  };

  const removeStage = (index: number) => {
    setFormErrors((current) => ({
      ...current,
      stages: undefined,
      submit: undefined,
    }));
    setForm((current) => ({
      ...current,
      treatmentStages:
        current.treatmentStages.length === 1
          ? current.treatmentStages
          : current.treatmentStages.filter(
              (_, stageIndex) => stageIndex !== index,
            ),
    }));
  };

  const handleImageFilesSelected = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    const files = Array.from(fileList);
    setIsUploadingImages(true);
    try {
      const uploadedUrls: string[] = [];
      for (const file of files) {
        const formData = new FormData();
        formData.append("file", file);
        const response = (await FileService.tmpUpload(formData)) as any;
        const imgUrl =
          response?.url ||
          response?.data?.url ||
          response?.data?.tmpPath ||
          response?.tmpPath ||
          response?.data?.imageUrl ||
          response?.imageUrl;
        if (imgUrl) uploadedUrls.push(imgUrl);
      }
      if (uploadedUrls.length > 0) {
        setForm((current) => ({
          ...current,
          imageUrls: [...current.imageUrls, ...uploadedUrls],
        }));
      }
      if (uploadedUrls.length < files.length) {
        toast.error("Một số ảnh tải lên thất bại, vui lòng thử lại.");
      }
    } catch (error: unknown) {
      toast.error(getErrorMessage(error) || "Không thể tải ảnh lên.");
    } finally {
      setIsUploadingImages(false);
    }
  };

  const removeImageUrl = (index: number) => {
    setForm((current) => ({
      ...current,
      imageUrls: current.imageUrls.filter((_, i) => i !== index),
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
    <AgronomistPanel className="p-6">
      {initialData?.reviewNote && (
        <div className="mb-4 rounded-[4px] border border-amber-200 bg-amber-50 px-4 py-3">
          <p className="text-[11px] font-semibold uppercase text-amber-700">
            Admin yêu cầu chỉnh sửa
          </p>
          <p className="mt-1 text-[13px] text-amber-800">
            {initialData.reviewNote}
          </p>
        </div>
      )}
      <div className="grid gap-4 md:grid-cols-4">
        <div className="space-y-2">
          <Label className="text-[12px] font-semibold text-[#232323]">
            Mã bệnh
          </Label>
          <Input
            value={form.code}
            onChange={(event) => updateField("code", event.target.value)}
            aria-invalid={Boolean(formErrors.code)}
            className={cn(
              inputClassName,
              formErrors.code && invalidFieldClassName,
            )}
          />
          <FieldError message={formErrors.code} />
        </div>
        <div className="space-y-2">
          <Label className="text-[12px] font-semibold text-[#232323]">
            Tên bệnh
          </Label>
          <Input
            value={form.nameVi}
            onChange={(event) => updateField("nameVi", event.target.value)}
            aria-invalid={Boolean(formErrors.nameVi)}
            className={cn(
              inputClassName,
              formErrors.nameVi && invalidFieldClassName,
            )}
          />
          <FieldError message={formErrors.nameVi} />
        </div>
        <div className="space-y-2">
          <Label className="text-[12px] font-semibold text-[#232323]">
            Tên tiếng Anh
          </Label>
          <Input
            value={form.nameEn}
            onChange={(event) => updateField("nameEn", event.target.value)}
            className={inputClassName}
          />
        </div>
        <div className="space-y-2">
          <Label className="text-[12px] font-semibold text-[#232323]">
            Danh mục
          </Label>
          <Select
            value={form.categoryId || undefined}
            onValueChange={(value) => updateField("categoryId", value)}
          >
            <SelectTrigger
              aria-invalid={Boolean(formErrors.categoryId)}
              className={cn(
                inputClassName,
                formErrors.categoryId && invalidFieldClassName,
              )}
            >
              <SelectValue placeholder="Chưa gán danh mục" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((category) => (
                <SelectItem
                  key={category.id}
                  value={String(category.id)}
                  className="text-[13px]"
                >
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
          <Label className="text-[12px] font-semibold text-[#232323]">
            Tên gọi khác
          </Label>
          <Textarea
            value={form.aliasesRaw}
            onChange={(event) => updateField("aliasesRaw", event.target.value)}
            rows={3}
            className={textareaClassName}
          />
        </div>
        <div className="space-y-2">
          <Label className="text-[12px] font-semibold text-[#232323]">
            Dấu hiệu / triệu chứng
          </Label>
          <Textarea
            value={form.symptomKeywordsRaw}
            onChange={(event) =>
              updateField("symptomKeywordsRaw", event.target.value)
            }
            rows={3}
            aria-invalid={Boolean(formErrors.symptomKeywordsRaw)}
            className={cn(
              textareaClassName,
              formErrors.symptomKeywordsRaw && invalidFieldClassName,
            )}
          />
          <FieldError message={formErrors.symptomKeywordsRaw} />
        </div>
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label className="text-[12px] font-semibold text-[#232323]">
            Mô tả dấu hiệu
          </Label>
          <Textarea
            value={form.signsSummary}
            onChange={(event) =>
              updateField("signsSummary", event.target.value)
            }
            rows={4}
            aria-invalid={Boolean(formErrors.signsSummary)}
            className={cn(
              textareaClassName,
              formErrors.signsSummary && invalidFieldClassName,
            )}
          />
          <FieldError message={formErrors.signsSummary} />
        </div>
        <div className="space-y-2">
          <Label className="text-[12px] font-semibold text-[#232323]">
            Nguyên nhân
          </Label>
          <Textarea
            value={form.causesText}
            onChange={(event) => updateField("causesText", event.target.value)}
            rows={4}
            aria-invalid={Boolean(formErrors.causesText)}
            className={cn(
              textareaClassName,
              formErrors.causesText && invalidFieldClassName,
            )}
          />
          <FieldError message={formErrors.causesText} />
        </div>
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label className="text-[12px] font-semibold text-[#232323]">
            Tên kỹ sư phụ trách
          </Label>
          <Input
            value={form.engineerName}
            onChange={(event) =>
              updateField("engineerName", event.target.value)
            }
            placeholder="Hiển thị làm nguồn khi AI trả lời — để trống nếu không cần nêu tên cụ thể."
            className={inputClassName}
          />
        </div>
        <div className="space-y-2">
          <Label className="text-[12px] font-semibold text-[#232323]">
            SĐT liên hệ khẩn cấp
          </Label>
          <Input
            value={form.engineerPhone}
            onChange={(event) =>
              updateField("engineerPhone", event.target.value)
            }
            placeholder="Hiển thị kèm phác đồ để bà con liên hệ khi cần gấp — để trống nếu không cần."
            className={inputClassName}
          />
        </div>
      </div>

      <div className="mt-4 space-y-2">
        <Label className="text-[12px] font-semibold text-[#232323]">
          Ảnh minh họa bệnh
        </Label>
        <p className="text-[11px] text-slate-500">
          Ảnh thực tế tôm mắc bệnh này — hiển thị kèm phác đồ để bà con đối
          chiếu quan sát, giống cách AI mô tả ảnh khi tư vấn.
        </p>
        <div className="flex flex-wrap gap-3">
          {form.imageUrls.map((url, index) => (
            <div
              key={`${url}-${index}`}
              className="group relative h-24 w-24 overflow-hidden rounded-[4px] border border-[#e1e4ec]"
            >
              <img
                src={url}
                alt={`Ảnh minh họa ${index + 1}`}
                className="h-full w-full object-cover"
              />
              <button
                type="button"
                onClick={() => removeImageUrl(index)}
                className="absolute right-1 top-1 rounded-full bg-black/60 p-1 text-white opacity-0 transition-opacity group-hover:opacity-100"
                aria-label="Xóa ảnh"
              >
                <X size={12} />
              </button>
            </div>
          ))}
          <label
            className={cn(
              "flex h-24 w-24 cursor-pointer flex-col items-center justify-center gap-1 rounded-[4px] border border-dashed border-[#c9cedd] text-center text-[11px] text-slate-500 hover:border-slate-400 hover:text-slate-700",
              isUploadingImages && "pointer-events-none opacity-60",
            )}
          >
            <ImagePlus size={18} />
            {isUploadingImages ? "Đang tải..." : "Thêm ảnh"}
            <input
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              disabled={isUploadingImages}
              onChange={(event) => {
                void handleImageFilesSelected(event.target.files);
                event.target.value = "";
              }}
            />
          </label>
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

      <div className="mt-6 rounded-[4px] border border-[#e1e4ec] bg-[#f7f8fa] p-5">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="text-[13px] font-semibold uppercase text-[#232323]">
              Phác đồ điều trị theo giai đoạn
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={addStage}
            className="h-9 rounded-[4px] border-[#c9cedd] bg-white text-[12px] font-medium text-slate-700 shadow-none hover:bg-white"
          >
            <Plus size={14} className="mr-1.5" />
            Thêm giai đoạn
          </Button>
        </div>

        <div className="space-y-4">
          {form.treatmentStages.map((stage, index) => {
            const stageErrors = formErrors.stages?.[index];

            return (
              <div
                key={`${index}-${stage.stageTitle}`}
                className="rounded-[4px] border border-[#e1e4ec] bg-white p-4"
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="text-[13px] font-semibold text-[#232323]">
                    Giai đoạn {index + 1}
                  </p>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => removeStage(index)}
                    className="h-8 rounded-[4px] text-[12px] font-medium text-[#d2453f] hover:bg-rose-50"
                  >
                    Bỏ giai đoạn
                  </Button>
                </div>
                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label className="text-[12px] font-semibold text-[#232323]">
                      Tên giai đoạn
                    </Label>
                    <Input
                      value={stage.stageTitle}
                      onChange={(event) =>
                        updateStage(index, { stageTitle: event.target.value })
                      }
                      aria-invalid={Boolean(stageErrors?.stageTitle)}
                      className={cn(
                        inputClassName,
                        stageErrors?.stageTitle && invalidFieldClassName,
                      )}
                    />
                    <FieldError message={stageErrors?.stageTitle} />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[12px] font-semibold text-[#232323]">
                      Sản phẩm áp dụng
                    </Label>
                    <ProductMultiSelect
                      options={productOptions}
                      value={stage.productIds}
                      onChange={(productIds) =>
                        updateStage(index, { productIds })
                      }
                      loading={productsQuery.isLoading}
                      emptyMessage="Chưa có sản phẩm đang hoạt động trong catalog."
                    />
                  </div>
                </div>
                <div className="mt-4 space-y-2">
                  <Label className="text-[12px] font-semibold text-[#232323]">
                    Hướng dẫn điều trị
                  </Label>
                  <div
                    aria-invalid={Boolean(stageErrors?.instructionsText)}
                    className={cn(
                      "overflow-hidden rounded-[4px] border border-[#d0d7e6] bg-white [&_.ql-container]:min-h-[180px] [&_.ql-container]:border-0 [&_.ql-container]:text-[13px] [&_.ql-editor]:min-h-[180px] [&_.ql-editor]:leading-6 [&_.ql-toolbar]:border-0 [&_.ql-toolbar]:border-b [&_.ql-toolbar]:border-[#e1e4ec]",
                      stageErrors?.instructionsText &&
                        "border-rose-500 ring-2 ring-rose-100",
                    )}
                  >
                    <ReactQuill
                      theme="snow"
                      value={stage.instructionsText}
                      onChange={(value) =>
                        updateStage(index, {
                          instructionsText: value,
                        })
                      }
                      modules={TREATMENT_STAGE_QUILL_MODULES}
                      placeholder="Nhập hướng dẫn điều trị..."
                    />
                  </div>
                  <FieldError message={stageErrors?.instructionsText} />
                </div>

                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  <div className="space-y-2 md:col-span-2">
                    <Label className="text-[12px] font-semibold text-[#232323]">
                      Tên thuốc/sản phẩm khác
                    </Label>
                    <Textarea
                      value={stage.extraProductNamesText}
                      onChange={(event) =>
                        updateStage(index, {
                          extraProductNamesText: event.target.value,
                        })
                      }
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
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push("/admin/ai-knowledge/diseases")}
          className={cn(agronomistOutlineButtonClassName, "h-10 px-6")}
        >
          Hủy
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={saveMutation.isPending}
          className={cn(agronomistPrimaryButtonClassName, "h-10 px-8")}
        >
          {saveMutation.isPending
            ? "Đang lưu..."
            : form.id
              ? "Cập nhật phác đồ"
              : "Tạo phác đồ"}
        </Button>
      </div>
    </AgronomistPanel>
  );
}
