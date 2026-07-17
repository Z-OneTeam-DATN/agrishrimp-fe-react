"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { aiKnowledgeService } from "@/app/services/aiKnowledge.service";
import { ProductService } from "@/app/services/product.service";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { AiDiseaseKnowledge, AiKnowledgeCategory } from "@/app/types/ai-knowledge.types";
import type { ProductListItem } from "@/app/types/product.schema";

type KnowledgeStageForm = {
  stageTitle: string;
  instructionsText: string;
  productIds: number[];
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

const EMPTY_STAGE: KnowledgeStageForm = { stageTitle: "", instructionsText: "", productIds: [] };

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

  const productsQuery = useQuery({
    queryKey: ["agronomist-products"],
    queryFn: () => ProductService.getAll({ status: "ACTIVE" }),
  });
  const productOptions = useMemo(
    () =>
      (productsQuery.data ?? []).map((product: ProductListItem) => ({
        id: product.id,
        label: `${product.name} #${product.id}`,
      })),
    [productsQuery.data],
  );

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        code: form.code,
        nameVi: form.nameVi,
        nameEn: form.nameEn || undefined,
        categoryId: form.categoryId ? Number(form.categoryId) : undefined,
        aliasesRaw: form.aliasesRaw || undefined,
        symptomKeywordsRaw: form.symptomKeywordsRaw,
        signsSummary: form.signsSummary,
        causes: form.causesText.split("\n").map((item) => item.trim()).filter(Boolean),
        enabled: form.enabled,
        confidenceThreshold: Number(form.confidenceThreshold),
        matchThreshold: Number(form.matchThreshold),
        priority: Number(form.priority || 0),
        canonical: form.canonical,
        status: form.status,
        treatmentStages: form.treatmentStages.map((stage) => ({
          stageTitle: stage.stageTitle,
          instructions: stage.instructionsText.split("\n").map((item) => item.trim()).filter(Boolean),
          productIds: stage.productIds,
        })),
      };
      if (form.id) {
        return aiKnowledgeService.updateDisease(form.id, payload);
      }
      return aiKnowledgeService.createDisease(payload);
    },
    onSuccess: () => {
      toast.success("Đã lưu phác đồ. Phác đồ đang ở trạng thái chờ Admin duyệt trước khi AI dùng để trả lời.");
      router.push("/agronomist/diseases");
    },
    onError: (error: any) => toast.error(error?.message || "Không thể lưu tri thức bệnh."),
  });

  const updateStage = (index: number, patch: Partial<KnowledgeStageForm>) => {
    setForm((current) => ({
      ...current,
      treatmentStages: current.treatmentStages.map((stage, stageIndex) =>
        stageIndex === index ? { ...stage, ...patch } : stage,
      ),
    }));
  };

  const addStage = () => {
    setForm((current) => ({
      ...current,
      treatmentStages: [...current.treatmentStages, { ...EMPTY_STAGE }],
    }));
  };

  const removeStage = (index: number) => {
    setForm((current) => ({
      ...current,
      treatmentStages:
        current.treatmentStages.length === 1
          ? current.treatmentStages
          : current.treatmentStages.filter((_, stageIndex) => stageIndex !== index),
    }));
  };

  return (
    <div className="rounded-[4px] border border-[#dcdcdc] bg-white p-6 shadow-sm">
      <div className="grid gap-4 md:grid-cols-4">
        <div className="space-y-2">
          <Label className="text-[10.5px] font-semibold text-slate-500">Mã bệnh</Label>
          <Input
            value={form.code}
            onChange={(event) => setForm((current) => ({ ...current, code: event.target.value }))}
            placeholder="WSSV"
            className="h-[38px] rounded-[4px] bg-white text-[13px] shadow-none"
          />
        </div>
        <div className="space-y-2">
          <Label className="text-[10.5px] font-semibold text-slate-500">Tên bệnh</Label>
          <Input
            value={form.nameVi}
            onChange={(event) => setForm((current) => ({ ...current, nameVi: event.target.value }))}
            placeholder="Bệnh đốm trắng"
            className="h-[38px] rounded-[4px] bg-white text-[13px] shadow-none"
          />
        </div>
        <div className="space-y-2">
          <Label className="text-[10.5px] font-semibold text-slate-500">Tên tiếng Anh</Label>
          <Input
            value={form.nameEn}
            onChange={(event) => setForm((current) => ({ ...current, nameEn: event.target.value }))}
            placeholder="White Spot Syndrome Virus"
            className="h-[38px] rounded-[4px] bg-white text-[13px] shadow-none"
          />
        </div>
        <div className="space-y-2">
          <Label className="text-[10.5px] font-semibold text-slate-500">Danh mục</Label>
          <Select
            value={form.categoryId || undefined}
            onValueChange={(value) => setForm((current) => ({ ...current, categoryId: value }))}
          >
            <SelectTrigger className="h-[38px] rounded-[4px] bg-white text-[13px] shadow-none">
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
        </div>
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label className="text-[10.5px] font-semibold text-slate-500">Alias / tên gọi khác</Label>
          <Textarea
            value={form.aliasesRaw}
            onChange={(event) => setForm((current) => ({ ...current, aliasesRaw: event.target.value }))}
            rows={3}
            placeholder="white spot, đốm trắng, wssv"
            className="resize-none rounded-[4px] bg-white text-[13px] shadow-none"
          />
        </div>
        <div className="space-y-2">
          <Label className="text-[10.5px] font-semibold text-slate-500">Dấu hiệu / triệu chứng match</Label>
          <Textarea
            value={form.symptomKeywordsRaw}
            onChange={(event) => setForm((current) => ({ ...current, symptomKeywordsRaw: event.target.value }))}
            rows={3}
            placeholder="đốm trắng trên vỏ, bơi lờ đờ, giảm ăn"
            className="resize-none rounded-[4px] bg-white text-[13px] shadow-none"
          />
        </div>
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label className="text-[10.5px] font-semibold text-slate-500">Mô tả dấu hiệu</Label>
          <Textarea
            value={form.signsSummary}
            onChange={(event) => setForm((current) => ({ ...current, signsSummary: event.target.value }))}
            rows={4}
            placeholder="Tôm có đốm trắng rõ ở vỏ, giảm ăn nhanh, bơi yếu..."
            className="resize-none rounded-[4px] bg-white text-[13px] shadow-none"
          />
        </div>
        <div className="space-y-2">
          <Label className="text-[10.5px] font-semibold text-slate-500">Nguyên nhân (mỗi dòng một ý)</Label>
          <Textarea
            value={form.causesText}
            onChange={(event) => setForm((current) => ({ ...current, causesText: event.target.value }))}
            rows={4}
            placeholder={"môi trường biến động\nmật độ nuôi cao\nnhiễm virus"}
            className="resize-none rounded-[4px] bg-white text-[13px] shadow-none"
          />
        </div>
      </div>

      <label className="mt-4 flex items-center gap-2 text-[13px] text-slate-600">
        <input
          type="checkbox"
          checked={form.enabled}
          onChange={(event) => setForm((current) => ({ ...current, enabled: event.target.checked }))}
        />
        Đang bật
      </label>

      <div className="mt-6 rounded-[4px] border border-slate-200 bg-slate-50 p-5">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="text-sm font-black text-slate-900">Phác đồ điều trị theo giai đoạn</p>
            <p className="text-xs text-slate-500">Mỗi giai đoạn có hướng dẫn và sản phẩm gắn trực tiếp từ catalog.</p>
          </div>
          <Button type="button" variant="outline" onClick={addStage}
            className="h-9 rounded-[4px] border-slate-300 text-[13px] font-medium text-slate-600 hover:bg-white">
            <Plus size={14} className="mr-1.5" />
            Thêm giai đoạn
          </Button>
        </div>

        <div className="space-y-4">
          {form.treatmentStages.map((stage, index) => (
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
                    placeholder="Giai đoạn ổn định môi trường"
                    className="h-[38px] rounded-[4px] bg-white text-[13px] shadow-none"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10.5px] font-semibold text-slate-500">Sản phẩm áp dụng</Label>
                  <select
                    multiple
                    value={stage.productIds.map(String)}
                    onChange={(event) =>
                      updateStage(index, {
                        productIds: Array.from(event.target.selectedOptions).map((option) => Number(option.value)),
                      })
                    }
                    className="min-h-[104px] w-full rounded-[4px] border border-slate-200 bg-white px-3 py-2 text-[13px] text-slate-800 outline-none transition focus:border-blue-500"
                  >
                    {productOptions.map((product) => (
                      <option key={product.id} value={product.id}>
                        {product.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="mt-4 space-y-2">
                <Label className="text-[10.5px] font-semibold text-slate-500">Hướng dẫn (mỗi dòng một ý)</Label>
                <Textarea
                  value={stage.instructionsText}
                  onChange={(event) => updateStage(index, { instructionsText: event.target.value })}
                  rows={4}
                  placeholder={"Kiểm tra môi trường ao\nGiảm sốc\nTheo dõi sức ăn"}
                  className="resize-none rounded-[4px] bg-white text-[13px] shadow-none"
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-6 flex justify-end gap-3 border-t border-slate-200 pt-4">
        <Button type="button" variant="outline" onClick={() => router.push("/agronomist/diseases")}
          className="h-10 rounded-md border-slate-300 px-6 text-[13px] font-medium text-slate-600 hover:bg-slate-50">
          Hủy
        </Button>
        <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}
          className="h-10 rounded-md bg-blue-600 px-8 text-[13px] font-semibold text-white hover:bg-blue-700">
          {form.id ? "Cập nhật phác đồ" : "Tạo phác đồ"}
        </Button>
      </div>
    </div>
  );
}
