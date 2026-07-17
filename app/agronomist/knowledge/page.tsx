"use client";

import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, Database, FilePenLine, Plus, RefreshCw, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { RichTextEditor } from "@/components/admin/shared/RichTextEditor";
import { aiKnowledgeService } from "@/app/services/aiKnowledge.service";
import { ProductService } from "@/app/services/product.service";
import type {
  AiDiseaseKnowledge,
  AiKnowledgeCategory,
  AiKnowledgeChatConfig,
  AiKeywordAnswerSet,
} from "@/app/types/ai-knowledge.types";
import type { ProductListItem } from "@/app/types/product.schema";

type KnowledgeStageForm = {
  stageTitle: string;
  instructionsText: string;
  productIds: number[];
};

const DEFAULT_CATEGORY_FORM = {
  id: null as number | null,
  name: "",
  slug: "",
  description: "",
  enabled: true,
  sortOrder: 0,
};

const DEFAULT_FAQ_FORM = {
  id: null as number | null,
  code: "",
  name: "",
  categoryId: "",
  keywordsRaw: "",
  answerHtml: "",
  enabled: true,
  matchThreshold: 0.35,
  priority: 0,
  canonical: false,
  status: "IN_REVIEW",
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

const DEFAULT_CHAT_CONFIG: AiKnowledgeChatConfig = {
  id: 1,
  greetingMessage: "",
  fallbackMessage: "",
};

export default function AgronomistKnowledgePage() {
  const queryClient = useQueryClient();
  const [categoryForm, setCategoryForm] = useState(DEFAULT_CATEGORY_FORM);
  const [faqForm, setFaqForm] = useState(DEFAULT_FAQ_FORM);
  const [diseaseForm, setDiseaseForm] = useState(DEFAULT_DISEASE_FORM);
  const [chatConfigForm, setChatConfigForm] = useState<AiKnowledgeChatConfig>(DEFAULT_CHAT_CONFIG);

  const categoriesQuery = useQuery({
    queryKey: ["ai-knowledge", "categories"],
    queryFn: () => aiKnowledgeService.getCategories(),
  });
  const keywordSetsQuery = useQuery({
    queryKey: ["ai-knowledge", "keyword-sets"],
    queryFn: () => aiKnowledgeService.getKeywordSets(),
  });
  const diseasesQuery = useQuery({
    queryKey: ["ai-knowledge", "diseases"],
    queryFn: () => aiKnowledgeService.getDiseases(),
  });
  const chatConfigQuery = useQuery({
    queryKey: ["ai-knowledge", "config"],
    queryFn: () => aiKnowledgeService.getConfig(),
  });
  const productsQuery = useQuery({
    queryKey: ["agronomist-products"],
    queryFn: () => ProductService.getAll({ status: "ACTIVE" }),
  });

  useEffect(() => {
    if (chatConfigQuery.data) {
      setChatConfigForm(chatConfigQuery.data);
    }
  }, [chatConfigQuery.data]);

  const categories = categoriesQuery.data ?? [];
  const keywordSets = keywordSetsQuery.data ?? [];
  const diseases = diseasesQuery.data ?? [];
  const products = productsQuery.data ?? [];

  const invalidateKnowledgeQueries = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["ai-knowledge", "categories"] }),
      queryClient.invalidateQueries({ queryKey: ["ai-knowledge", "keyword-sets"] }),
      queryClient.invalidateQueries({ queryKey: ["ai-knowledge", "diseases"] }),
      queryClient.invalidateQueries({ queryKey: ["ai-knowledge", "config"] }),
    ]);
  };

  const categoryMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        name: categoryForm.name,
        slug: categoryForm.slug || undefined,
        description: categoryForm.description || undefined,
        enabled: categoryForm.enabled,
        sortOrder: Number(categoryForm.sortOrder || 0),
      };
      if (categoryForm.id) {
        return aiKnowledgeService.updateCategory(categoryForm.id, payload);
      }
      return aiKnowledgeService.createCategory(payload);
    },
    onSuccess: async () => {
      toast.success("Đã lưu danh mục tri thức.");
      setCategoryForm(DEFAULT_CATEGORY_FORM);
      await invalidateKnowledgeQueries();
    },
    onError: (error: any) => toast.error(error?.message || "Không thể lưu danh mục."),
  });

  const faqMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        code: faqForm.code,
        name: faqForm.name,
        categoryId: faqForm.categoryId ? Number(faqForm.categoryId) : undefined,
        keywordsRaw: faqForm.keywordsRaw,
        answerHtml: faqForm.answerHtml,
        enabled: faqForm.enabled,
        matchThreshold: Number(faqForm.matchThreshold),
        priority: Number(faqForm.priority || 0),
        canonical: faqForm.canonical,
        status: faqForm.status,
      };
      if (faqForm.id) {
        return aiKnowledgeService.updateKeywordSet(faqForm.id, payload);
      }
      return aiKnowledgeService.createKeywordSet(payload);
    },
    onSuccess: async () => {
      toast.success("Đã lưu bộ từ khóa.");
      setFaqForm(DEFAULT_FAQ_FORM);
      await invalidateKnowledgeQueries();
    },
    onError: (error: any) => toast.error(error?.message || "Không thể lưu bộ từ khóa."),
  });

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
      toast.success("Đã lưu tri thức bệnh.");
      setDiseaseForm(DEFAULT_DISEASE_FORM);
      await invalidateKnowledgeQueries();
    },
    onError: (error: any) => toast.error(error?.message || "Không thể lưu tri thức bệnh."),
  });

  const configMutation = useMutation({
    mutationFn: () =>
      aiKnowledgeService.updateConfig({
        greetingMessage: chatConfigForm.greetingMessage,
        fallbackMessage: chatConfigForm.fallbackMessage,
      }),
    onSuccess: async () => {
      toast.success("Đã cập nhật cấu hình chatbot.");
      await queryClient.invalidateQueries({ queryKey: ["ai-knowledge", "config"] });
    },
    onError: (error: any) => toast.error(error?.message || "Không thể cập nhật cấu hình."),
  });

  const productOptions = useMemo(
    () =>
      products.map((product: ProductListItem) => ({
        id: product.id,
        label: `${product.name} #${product.id}`,
      })),
    [products],
  );

  const deleteCategory = async (id: number) => {
    if (!confirm("Xóa danh mục này?")) return;
    await aiKnowledgeService.deleteCategory(id);
    toast.success("Đã xóa danh mục.");
    await invalidateKnowledgeQueries();
  };

  const deleteFaq = async (id: number) => {
    if (!confirm("Xóa bộ từ khóa này?")) return;
    await aiKnowledgeService.deleteKeywordSet(id);
    toast.success("Đã xóa bộ từ khóa.");
    await invalidateKnowledgeQueries();
  };

  const deleteDisease = async (id: number) => {
    if (!confirm("Xóa tri thức bệnh này?")) return;
    await aiKnowledgeService.deleteDisease(id);
    toast.success("Đã xóa tri thức bệnh.");
    await invalidateKnowledgeQueries();
  };

  const quickApproveFaq = async (item: AiKeywordAnswerSet) => {
    await aiKnowledgeService.updateKeywordSet(item.id, { ...item, categoryId: item.category?.id, status: "APPROVED" });
    toast.success("Đã duyệt bộ từ khóa.");
    await invalidateKnowledgeQueries();
  };

  const quickApproveDisease = async (item: AiDiseaseKnowledge) => {
    await aiKnowledgeService.updateDisease(item.id, {
      ...item,
      categoryId: item.category?.id,
      treatmentStages: item.treatmentStages.map((stage) => ({
        stageTitle: stage.stageTitle,
        instructions: stage.instructions,
        productIds: stage.productIds,
      })),
      status: "APPROVED",
    });
    toast.success("Đã duyệt tri thức bệnh.");
    await invalidateKnowledgeQueries();
  };

  const loadFaqToForm = (item: AiKeywordAnswerSet) => {
    setFaqForm({
      id: item.id,
      code: item.code,
      name: item.name,
      categoryId: item.category?.id ? String(item.category.id) : "",
      keywordsRaw: item.keywordsRaw,
      answerHtml: item.answerHtml,
      enabled: item.enabled,
      matchThreshold: item.matchThreshold,
      priority: item.priority,
      canonical: item.canonical,
      status: item.status,
    });
  };

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
    <div className="space-y-8">
      <section className="grid gap-4 xl:grid-cols-4">
        <div className="rounded-[4px] border border-slate-200 bg-white p-6 shadow-sm xl:col-span-2">
          <p className="text-[12px] font-semibold uppercase tracking-[0.24em] text-slate-400">
            Approved Knowledge Hub
          </p>
          <h3 className="mt-3 text-3xl font-bold leading-tight text-slate-900">
            Xây kho tri thức có duyệt cho AI Doctor
          </h3>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600">
            Mọi câu trả lời production chỉ được đi từ tri thức đã duyệt. Ảnh AI chỉ đóng vai trò tín hiệu đầu vào,
            không được tự suy diễn phác đồ ngoài kho tri thức này.
          </p>
        </div>

        <StatCard label="Danh mục" value={categories.length} />
        <StatCard label="Tri thức bệnh" value={diseases.length} />
        <StatCard label="Bộ từ khóa" value={keywordSets.length} />
        <StatCard label="Sản phẩm hoạt động" value={products.length} />
      </section>

      <section className="grid gap-6 xl:grid-cols-12">
        <div className="rounded-[4px] border border-slate-200 bg-white p-6 shadow-sm xl:col-span-4">
          <SectionHeader
            icon={<Database className="h-5 w-5 text-blue-600" />}
            title="Danh mục tri thức"
            description="Nhóm các bộ FAQ và bệnh theo mảng chuyên môn để bot gợi ý đúng ngữ cảnh."
          />

          <div className="mt-5 space-y-3">
            <Field label="Tên danh mục">
              <input
                value={categoryForm.name}
                onChange={(event) => setCategoryForm((current) => ({ ...current, name: event.target.value }))}
                className={inputClassName}
                placeholder="Bệnh virus"
              />
            </Field>
            <Field label="Slug">
              <input
                value={categoryForm.slug}
                onChange={(event) => setCategoryForm((current) => ({ ...current, slug: event.target.value }))}
                className={inputClassName}
                placeholder="benh-virus"
              />
            </Field>
            <Field label="Mô tả">
              <textarea
                value={categoryForm.description}
                onChange={(event) => setCategoryForm((current) => ({ ...current, description: event.target.value }))}
                className={textareaClassName}
                rows={3}
                placeholder="Nhóm bệnh do virus hoặc tác nhân lây nhiễm nhanh."
              />
            </Field>
            <Field label="Thứ tự">
              <input
                type="number"
                value={categoryForm.sortOrder}
                onChange={(event) => setCategoryForm((current) => ({ ...current, sortOrder: Number(event.target.value) }))}
                className={inputClassName}
              />
            </Field>
            <label className="flex items-center gap-2 text-sm text-slate-600">
              <input
                type="checkbox"
                checked={categoryForm.enabled}
                onChange={(event) => setCategoryForm((current) => ({ ...current, enabled: event.target.checked }))}
              />
              Đang bật
            </label>

            <div className="flex gap-3">
              <button onClick={() => categoryMutation.mutate()} className={primaryButtonClassName}>
                {categoryForm.id ? "Cập nhật danh mục" : "Tạo danh mục"}
              </button>
              {categoryForm.id ? (
                <button onClick={() => setCategoryForm(DEFAULT_CATEGORY_FORM)} className={secondaryButtonClassName}>
                  Làm mới form
                </button>
              ) : null}
            </div>
          </div>

          <div className="mt-6 space-y-3">
            {categories.map((category) => (
              <div key={category.id} className="rounded-[4px] border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-bold text-slate-900">{category.name}</p>
                    <p className="mt-1 text-xs text-slate-500">{category.slug}</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setCategoryForm({
                        id: category.id,
                        name: category.name,
                        slug: category.slug,
                        description: category.description || "",
                        enabled: category.enabled,
                        sortOrder: category.sortOrder,
                      })}
                      className={iconButtonClassName}
                    >
                      <FilePenLine className="h-4 w-4" />
                    </button>
                    <button onClick={() => deleteCategory(category.id)} className={iconButtonClassName}>
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                {category.description ? (
                  <p className="mt-2 text-sm text-slate-600">{category.description}</p>
                ) : null}
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[4px] border border-slate-200 bg-white p-6 shadow-sm xl:col-span-8">
          <SectionHeader
            icon={<RefreshCw className="h-5 w-5 text-blue-600" />}
            title="Bộ từ khóa & câu trả lời"
            description="Dùng cho các câu FAQ, fallback theo ngữ cảnh và những case không cần suy luận bệnh."
          />

          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <Field label="Mã bộ từ khóa">
              <input
                value={faqForm.code}
                onChange={(event) => setFaqForm((current) => ({ ...current, code: event.target.value }))}
                className={inputClassName}
                placeholder="FAQ_WHITE_SPOT"
              />
            </Field>
            <Field label="Tên hiển thị">
              <input
                value={faqForm.name}
                onChange={(event) => setFaqForm((current) => ({ ...current, name: event.target.value }))}
                className={inputClassName}
                placeholder="Dấu hiệu bệnh đốm trắng"
              />
            </Field>
            <Field label="Danh mục">
              <select
                value={faqForm.categoryId}
                onChange={(event) => setFaqForm((current) => ({ ...current, categoryId: event.target.value }))}
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
            <Field label="Ngưỡng match">
              <input
                type="number"
                min={0}
                max={1}
                step={0.01}
                value={faqForm.matchThreshold}
                onChange={(event) => setFaqForm((current) => ({ ...current, matchThreshold: Number(event.target.value) }))}
                className={inputClassName}
              />
            </Field>
          </div>

          <Field label="Danh sách từ khóa (phân tách dấu phẩy)" className="mt-4">
            <textarea
              value={faqForm.keywordsRaw}
              onChange={(event) => setFaqForm((current) => ({ ...current, keywordsRaw: event.target.value }))}
              className={textareaClassName}
              rows={3}
              placeholder="bệnh đốm trắng, white spot, đốm trắng trên vỏ"
            />
          </Field>

          <div className="mt-4">
            <RichTextEditor
              key={faqForm.id ?? "faq-new"}
              label="Câu trả lời rich text"
              placeholder="Soạn nội dung trả lời đã duyệt..."
              value={faqForm.answerHtml}
              onChange={(value) => setFaqForm((current) => ({ ...current, answerHtml: value }))}
              minHeight="180px"
            />
          </div>

          <div className="mt-4 grid gap-4 md:grid-cols-4">
            <label className="flex items-center gap-2 text-sm text-slate-600">
              <input
                type="checkbox"
                checked={faqForm.enabled}
                onChange={(event) => setFaqForm((current) => ({ ...current, enabled: event.target.checked }))}
              />
              Đang bật
            </label>
            <label className="flex items-center gap-2 text-sm text-slate-600">
              <input
                type="checkbox"
                checked={faqForm.canonical}
                onChange={(event) => setFaqForm((current) => ({ ...current, canonical: event.target.checked }))}
              />
              Canonical
            </label>
            <Field label="Ưu tiên">
              <input
                type="number"
                value={faqForm.priority}
                onChange={(event) => setFaqForm((current) => ({ ...current, priority: Number(event.target.value) }))}
                className={inputClassName}
              />
            </Field>
            <Field label="Trạng thái">
              <select
                value={faqForm.status}
                onChange={(event) => setFaqForm((current) => ({ ...current, status: event.target.value }))}
                className={inputClassName}
              >
                <option value="DRAFT">DRAFT</option>
                <option value="IN_REVIEW">IN_REVIEW</option>
                <option value="APPROVED">APPROVED</option>
                <option value="DISABLED">DISABLED</option>
              </select>
            </Field>
          </div>

          <div className="mt-5 flex gap-3">
            <button onClick={() => faqMutation.mutate()} className={primaryButtonClassName}>
              {faqForm.id ? "Cập nhật bộ từ khóa" : "Tạo bộ từ khóa"}
            </button>
            {faqForm.id ? (
              <button onClick={() => setFaqForm(DEFAULT_FAQ_FORM)} className={secondaryButtonClassName}>
                Tạo mới
              </button>
            ) : null}
          </div>

          <div className="mt-6 grid gap-4 lg:grid-cols-2">
            {keywordSets.map((item) => (
              <div key={item.id} className="rounded-[4px] border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-black text-slate-900">{item.name}</p>
                    <p className="mt-1 text-xs text-slate-500">{item.code}</p>
                  </div>
                  <StatusPill value={item.status} />
                </div>
                <p className="mt-3 text-sm text-slate-600">{item.keywordsRaw}</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <button onClick={() => loadFaqToForm(item)} className={secondaryButtonClassName}>
                    Sửa
                  </button>
                  <button onClick={() => quickApproveFaq(item)} className={successButtonClassName}>
                    Duyệt nhanh
                  </button>
                  <button onClick={() => deleteFaq(item.id)} className={dangerButtonClassName}>
                    Xóa
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="rounded-[4px] border border-slate-200 bg-white p-6 shadow-sm">
        <SectionHeader
          icon={<CheckCircle2 className="h-5 w-5 text-blue-600" />}
          title="Bệnh & phác đồ điều trị"
          description="AI ảnh chỉ được map sang tri thức APPROVED tại đây. Nếu không có tri thức, hệ thống phải hỏi thêm dấu hiệu hoặc đưa case sang hàng chờ."
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

        <div className="mt-4 grid gap-4 md:grid-cols-5">
          <Field label="Ngưỡng confidence AI">
            <input
              type="number"
              min={0}
              max={1}
              step={0.01}
              value={diseaseForm.confidenceThreshold}
              onChange={(event) => setDiseaseForm((current) => ({ ...current, confidenceThreshold: Number(event.target.value) }))}
              className={inputClassName}
            />
          </Field>
          <Field label="Ngưỡng match text">
            <input
              type="number"
              min={0}
              max={1}
              step={0.01}
              value={diseaseForm.matchThreshold}
              onChange={(event) => setDiseaseForm((current) => ({ ...current, matchThreshold: Number(event.target.value) }))}
              className={inputClassName}
            />
          </Field>
          <Field label="Ưu tiên">
            <input
              type="number"
              value={diseaseForm.priority}
              onChange={(event) => setDiseaseForm((current) => ({ ...current, priority: Number(event.target.value) }))}
              className={inputClassName}
            />
          </Field>
          <Field label="Trạng thái">
            <select
              value={diseaseForm.status}
              onChange={(event) => setDiseaseForm((current) => ({ ...current, status: event.target.value }))}
              className={inputClassName}
            >
              <option value="DRAFT">DRAFT</option>
              <option value="IN_REVIEW">IN_REVIEW</option>
              <option value="APPROVED">APPROVED</option>
              <option value="DISABLED">DISABLED</option>
            </select>
          </Field>
          <div className="flex flex-col gap-2 pt-6 text-sm text-slate-600">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={diseaseForm.enabled}
                onChange={(event) => setDiseaseForm((current) => ({ ...current, enabled: event.target.checked }))}
              />
              Đang bật
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={diseaseForm.canonical}
                onChange={(event) => setDiseaseForm((current) => ({ ...current, canonical: event.target.checked }))}
              />
              Canonical
            </label>
          </div>
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
            {diseaseForm.id ? "Cập nhật tri thức bệnh" : "Tạo tri thức bệnh"}
          </button>
          {diseaseForm.id ? (
            <button onClick={() => setDiseaseForm(DEFAULT_DISEASE_FORM)} className={secondaryButtonClassName}>
              Tạo mới
            </button>
          ) : null}
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          {diseases.map((item) => (
            <div key={item.id} className="rounded-[4px] border border-slate-200 bg-slate-50 p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-black text-slate-900">{item.nameVi}</p>
                  <p className="mt-1 text-xs text-slate-500">{item.code}</p>
                </div>
                <StatusPill value={item.status} />
              </div>
              <p className="mt-3 text-sm leading-6 text-slate-600">{item.signsSummary}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                <button onClick={() => loadDiseaseToForm(item)} className={secondaryButtonClassName}>
                  Sửa
                </button>
                <button onClick={() => quickApproveDisease(item)} className={successButtonClassName}>
                  Duyệt nhanh
                </button>
                <button onClick={() => deleteDisease(item.id)} className={dangerButtonClassName}>
                  Xóa
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-[4px] border border-slate-200 bg-white p-6 shadow-sm">
        <SectionHeader
          icon={<FilePenLine className="h-5 w-5 text-blue-600" />}
          title="Chào mở đầu & fallback mặc định"
          description="Giữ phản hồi production an toàn: khi không đủ chắc chắn, bot phải dùng fallback đã duyệt thay vì trả lời tự do."
        />

        <div className="mt-5 grid gap-5 lg:grid-cols-2">
          <div>
            <RichTextEditor
              key="greeting-config"
              label="Tin chào mở đầu"
              placeholder="Nhập câu chào khi người dùng mở widget..."
              value={chatConfigForm.greetingMessage}
              onChange={(value) => setChatConfigForm((current) => ({ ...current, greetingMessage: value }))}
              minHeight="180px"
            />
          </div>
          <div>
            <RichTextEditor
              key="fallback-config"
              label="Fallback mặc định"
              placeholder="Nhập câu fallback khi không đủ tri thức..."
              value={chatConfigForm.fallbackMessage}
              onChange={(value) => setChatConfigForm((current) => ({ ...current, fallbackMessage: value }))}
              minHeight="180px"
            />
          </div>
        </div>

        <div className="mt-5">
          <button onClick={() => configMutation.mutate()} className={primaryButtonClassName}>
            Cập nhật cấu hình chatbot
          </button>
        </div>
      </section>
    </div>
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
      <div className="flex h-10 w-10 items-center justify-center rounded-[4px] bg-blue-50">
        {icon}
      </div>
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

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-[4px] border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">{label}</p>
      <p className="mt-3 text-[22px] font-bold text-slate-900">{value}</p>
    </div>
  );
}

function StatusPill({ value }: { value: string }) {
  const colorMap: Record<string, string> = {
    APPROVED: "bg-emerald-100 text-emerald-700",
    IN_REVIEW: "bg-amber-100 text-amber-700",
    DRAFT: "bg-slate-200 text-slate-700",
    DISABLED: "bg-rose-100 text-rose-700",
  };

  return (
    <span className={`rounded-full px-3 py-1 text-[11px] font-black uppercase tracking-[0.18em] ${colorMap[value] ?? "bg-slate-200 text-slate-700"}`}>
      {value}
    </span>
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
const successButtonClassName =
  "inline-flex items-center gap-2 rounded-md border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm font-semibold text-emerald-700 transition-colors hover:bg-emerald-100";
const iconButtonClassName =
  "inline-flex items-center justify-center rounded-md border border-slate-200 bg-white p-2 text-slate-600 transition-colors hover:bg-slate-50";
