"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, Plus } from "lucide-react";
import { toast } from "sonner";
import { aiKnowledgeService } from "@/app/services/aiKnowledge.service";
import { ProductService } from "@/app/services/product.service";
import type { AiDiseaseKnowledge } from "@/app/types/ai-knowledge.types";
import type { ProductListItem } from "@/app/types/product.schema";

type KnowledgeStageForm = {
  stageTitle: string;
  instructionsText: string;
  productIds: number[];
};

const DEFAULT_DISEASE_FORM = {
  id: null as number | null,
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
  treatmentStages: [
    {
      stageTitle: "",
      instructionsText: "",
      productIds: [],
    },
  ] as KnowledgeStageForm[],
};

export default function AgronomistDiseasesPage() {
  return (
    <Suspense fallback={null}>
      <AgronomistDiseasesForm />
    </Suspense>
  );
}

function AgronomistDiseasesForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editingId = searchParams.get("id");
  const queryClient = useQueryClient();
  const [diseaseForm, setDiseaseForm] = useState(DEFAULT_DISEASE_FORM);

  const categoriesQuery = useQuery({
    queryKey: ["ai-knowledge", "categories"],
    queryFn: () => aiKnowledgeService.getCategories(),
  });
  const diseasesQuery = useQuery({
    queryKey: ["ai-knowledge", "diseases"],
    queryFn: () => aiKnowledgeService.getDiseases(),
  });
  const productsQuery = useQuery({
    queryKey: ["agronomist-products"],
    queryFn: () => ProductService.getAll({ status: "ACTIVE" }),
  });

  const categories = categoriesQuery.data ?? [];
  const diseases = diseasesQuery.data ?? [];
  const products = productsQuery.data ?? [];

  useEffect(() => {
    if (!editingId || diseases.length === 0) return;
    const item = diseases.find((disease) => String(disease.id) === editingId);
    if (item) {
      loadDiseaseToForm(item);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editingId, diseases.length]);

  const productOptions = useMemo(
    () =>
      products.map((product: ProductListItem) => ({
        id: product.id,
        label: `${product.name} #${product.id}`,
      })),
    [products],
  );

  const diseaseMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        code: diseaseForm.code,
        nameVi: diseaseForm.nameVi,
        nameEn: diseaseForm.nameEn || undefined,
        categoryId: diseaseForm.categoryId ? Number(diseaseForm.categoryId) : undefined,
        aliasesRaw: diseaseForm.aliasesRaw || undefined,
        symptomKeywordsRaw: diseaseForm.symptomKeywordsRaw,
        signsSummary: diseaseForm.signsSummary,
        causes: diseaseForm.causesText
          .split("\n")
          .map((item) => item.trim())
          .filter(Boolean),
        enabled: diseaseForm.enabled,
        confidenceThreshold: Number(diseaseForm.confidenceThreshold),
        matchThreshold: Number(diseaseForm.matchThreshold),
        priority: Number(diseaseForm.priority || 0),
        canonical: diseaseForm.canonical,
        status: diseaseForm.status,
        treatmentStages: diseaseForm.treatmentStages.map((stage) => ({
          stageTitle: stage.stageTitle,
          instructions: stage.instructionsText
            .split("\n")
            .map((item) => item.trim())
            .filter(Boolean),
          productIds: stage.productIds,
        })),
      };
      if (diseaseForm.id) {
        return aiKnowledgeService.updateDisease(diseaseForm.id, payload);
      }
      return aiKnowledgeService.createDisease(payload);
    },
    onSuccess: async () => {
      toast.success("Đã lưu phác đồ. Phác đồ đang ở trạng thái chờ Admin duyệt trước khi AI dùng để trả lời.");
      setDiseaseForm(DEFAULT_DISEASE_FORM);
      await queryClient.invalidateQueries({ queryKey: ["ai-knowledge", "diseases"] });
      await queryClient.invalidateQueries({ queryKey: ["ai-knowledge", "keyword-sets"] });
      router.push("/agronomist/protocol-status");
    },
    onError: (error: any) => toast.error(error?.message || "Không thể lưu tri thức bệnh."),
  });

  const loadDiseaseToForm = (item: AiDiseaseKnowledge) => {
    setDiseaseForm({
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
            }))
          : DEFAULT_DISEASE_FORM.treatmentStages,
    });
  };

  const updateStage = (index: number, patch: Partial<KnowledgeStageForm>) => {
    setDiseaseForm((current) => ({
      ...current,
      treatmentStages: current.treatmentStages.map((stage, stageIndex) =>
        stageIndex === index ? { ...stage, ...patch } : stage,
      ),
    }));
  };

  const addStage = () => {
    setDiseaseForm((current) => ({
      ...current,
      treatmentStages: [
        ...current.treatmentStages,
        { stageTitle: "", instructionsText: "", productIds: [] },
      ],
    }));
  };

  const removeStage = (index: number) => {
    setDiseaseForm((current) => ({
      ...current,
      treatmentStages:
        current.treatmentStages.length === 1
          ? current.treatmentStages
          : current.treatmentStages.filter((_, stageIndex) => stageIndex !== index),
    }));
  };

  return (
    <section className="rounded-[4px] border border-slate-200 bg-white p-6 shadow-sm">
      <SectionHeader
        icon={<CheckCircle2 className="h-5 w-5 text-blue-600" />}
        title={diseaseForm.id ? "Cập nhật phác đồ" : "Tạo phác đồ mới"}
        description="Bộ từ khóa & câu trả lời cho chatbot được hệ thống tự sinh từ chính phác đồ này. Sau khi lưu, phác đồ vào hàng chờ Admin duyệt."
      />

      <div className="mt-5 grid gap-4 md:grid-cols-4">
        <Field label="Mã bệnh">
          <input
            value={diseaseForm.code}
            onChange={(event) => setDiseaseForm((current) => ({ ...current, code: event.target.value }))}
            className={inputClassName}
            placeholder="WSSV"
          />
        </Field>
        <Field label="Tên bệnh">
          <input
            value={diseaseForm.nameVi}
            onChange={(event) => setDiseaseForm((current) => ({ ...current, nameVi: event.target.value }))}
            className={inputClassName}
            placeholder="Bệnh đốm trắng"
          />
        </Field>
        <Field label="Tên tiếng Anh">
          <input
            value={diseaseForm.nameEn}
            onChange={(event) => setDiseaseForm((current) => ({ ...current, nameEn: event.target.value }))}
            className={inputClassName}
            placeholder="White Spot Syndrome Virus"
          />
        </Field>
        <Field label="Danh mục">
          <select
            value={diseaseForm.categoryId}
            onChange={(event) => setDiseaseForm((current) => ({ ...current, categoryId: event.target.value }))}
            className={inputClassName}
          >
            <option value="">Chưa gán danh mục</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <Field label="Alias / tên gọi khác">
          <textarea
            value={diseaseForm.aliasesRaw}
            onChange={(event) => setDiseaseForm((current) => ({ ...current, aliasesRaw: event.target.value }))}
            className={textareaClassName}
            rows={3}
            placeholder="white spot, đốm trắng, wssv"
          />
        </Field>
        <Field label="Dấu hiệu / triệu chứng match">
          <textarea
            value={diseaseForm.symptomKeywordsRaw}
            onChange={(event) => setDiseaseForm((current) => ({ ...current, symptomKeywordsRaw: event.target.value }))}
            className={textareaClassName}
            rows={3}
            placeholder="đốm trắng trên vỏ, bơi lờ đờ, giảm ăn"
          />
        </Field>
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <Field label="Mô tả dấu hiệu">
          <textarea
            value={diseaseForm.signsSummary}
            onChange={(event) => setDiseaseForm((current) => ({ ...current, signsSummary: event.target.value }))}
            className={textareaClassName}
            rows={4}
            placeholder="Tôm có đốm trắng rõ ở vỏ, giảm ăn nhanh, bơi yếu..."
          />
        </Field>
        <Field label="Nguyên nhân (mỗi dòng một ý)">
          <textarea
            value={diseaseForm.causesText}
            onChange={(event) => setDiseaseForm((current) => ({ ...current, causesText: event.target.value }))}
            className={textareaClassName}
            rows={4}
            placeholder={"môi trường biến động\nmật độ nuôi cao\nnhiễm virus"}
          />
        </Field>
      </div>

      <div className="mt-4">
        <label className="flex items-center gap-2 text-sm text-slate-600">
          <input
            type="checkbox"
            checked={diseaseForm.enabled}
            onChange={(event) => setDiseaseForm((current) => ({ ...current, enabled: event.target.checked }))}
          />
          Đang bật
        </label>
      </div>

      <div className="mt-6 rounded-[4px] border border-slate-200 bg-slate-50 p-5">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="text-sm font-black text-slate-900">Phác đồ điều trị theo giai đoạn</p>
            <p className="text-xs text-slate-500">Mỗi giai đoạn có hướng dẫn và sản phẩm gắn trực tiếp từ catalog.</p>
          </div>
          <button onClick={addStage} className={secondaryButtonClassName}>
            <Plus className="h-4 w-4" />
            Thêm giai đoạn
          </button>
        </div>

        <div className="space-y-4">
          {diseaseForm.treatmentStages.map((stage, index) => (
            <div key={`${index}-${stage.stageTitle}`} className="rounded-[4px] border border-slate-200 bg-white p-4">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-bold text-slate-900">Giai đoạn {index + 1}</p>
                <button onClick={() => removeStage(index)} className={dangerButtonClassName}>
                  Bỏ giai đoạn
                </button>
              </div>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <Field label="Tên giai đoạn">
                  <input
                    value={stage.stageTitle}
                    onChange={(event) => updateStage(index, { stageTitle: event.target.value })}
                    className={inputClassName}
                    placeholder="Giai đoạn ổn định môi trường"
                  />
                </Field>
                <Field label="Sản phẩm áp dụng">
                  <select
                    multiple
                    value={stage.productIds.map(String)}
                    onChange={(event) =>
                      updateStage(index, {
                        productIds: Array.from(event.target.selectedOptions).map((option) => Number(option.value)),
                      })
                    }
                    className="min-h-[120px] w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-blue-500"
                  >
                    {productOptions.map((product) => (
                      <option key={product.id} value={product.id}>
                        {product.label}
                      </option>
                    ))}
                  </select>
                </Field>
              </div>
              <Field label="Hướng dẫn (mỗi dòng một ý)" className="mt-4">
                <textarea
                  value={stage.instructionsText}
                  onChange={(event) => updateStage(index, { instructionsText: event.target.value })}
                  className={textareaClassName}
                  rows={4}
                  placeholder={"Kiểm tra môi trường ao\nGiảm sốc\nTheo dõi sức ăn"}
                />
              </Field>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-5 flex gap-3">
        <button onClick={() => diseaseMutation.mutate()} className={primaryButtonClassName}>
          {diseaseForm.id ? "Cập nhật phác đồ" : "Tạo phác đồ"}
        </button>
        {diseaseForm.id ? (
          <button onClick={() => setDiseaseForm(DEFAULT_DISEASE_FORM)} className={secondaryButtonClassName}>
            Tạo mới
          </button>
        ) : null}
      </div>
    </section>
  );
}

function SectionHeader({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="flex items-start gap-4">
      <div className="flex h-10 w-10 items-center justify-center rounded-[4px] bg-blue-50">{icon}</div>
      <div>
        <h3 className="text-xl font-bold text-slate-900">{title}</h3>
        <p className="mt-1 text-sm leading-6 text-slate-500">{description}</p>
      </div>
    </div>
  );
}

function Field({
  label,
  children,
  className,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">{label}</p>
      {children}
    </div>
  );
}

const inputClassName =
  "h-[38px] w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none transition focus:border-blue-500";
const textareaClassName =
  "w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-blue-500";
const primaryButtonClassName =
  "inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700";
const secondaryButtonClassName =
  "inline-flex items-center gap-2 rounded-md border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50";
const dangerButtonClassName =
  "inline-flex items-center gap-2 rounded-md border border-rose-200 bg-rose-50 px-4 py-2.5 text-sm font-semibold text-rose-700 transition-colors hover:bg-rose-100";
