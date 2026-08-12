"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ChevronRight, Loader2 } from "lucide-react";
import DiseaseForm from "@/components/agronomist/DiseaseForm";
import {
  AgronomistPageHeader,
  agronomistOutlineButtonClassName,
} from "@/components/agronomist/agronomist-ui";
import { aiKnowledgeService } from "@/app/services/aiKnowledge.service";
import type {
  AiDiseaseKnowledge,
  AiKnowledgeCategory,
} from "@/app/types/ai-knowledge.types";

export default function EditDiseasePage() {
  const { id } = useParams<{ id: string }>();
  const [disease, setDisease] = useState<AiDiseaseKnowledge | null>(null);
  const [categories, setCategories] = useState<AiKnowledgeCategory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      aiKnowledgeService.getDiseases(),
      aiKnowledgeService.getCategories(),
    ])
      .then(([diseases, cats]) => {
        setDisease(diseases.find((item) => String(item.id) === id) ?? null);
        setCategories(cats);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="flex min-h-[300px] items-center justify-center rounded-[8px] border border-[#e1e4ec] bg-white">
        <Loader2 className="h-7 w-7 animate-spin text-[#252896]" />
      </div>
    );
  }

  if (!disease) {
    return (
      <div className="rounded-[8px] border border-[#e1e4ec] bg-white py-16 text-center text-[13px] font-medium text-slate-400">
        Không tìm thấy phác đồ.
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <div className="mb-3 flex items-center gap-1.5 text-[12px] text-slate-400">
          <Link
            href="/admin/ai-knowledge/diseases"
            className="font-medium transition-colors hover:text-[#252896]"
          >
            Phác đồ điều trị
          </Link>
          <ChevronRight size={14} />
          <span className="font-medium text-slate-600">Chỉnh sửa</span>
        </div>
        <AgronomistPageHeader
          title="Chỉnh sửa phác đồ"
          actions={
            <Link
              href="/admin/ai-knowledge/diseases"
              className={agronomistOutlineButtonClassName}
            >
              Quay lại
            </Link>
          }
        />
        <p className="mt-2 line-clamp-1 text-[12px] text-slate-500">
          {disease.nameVi}
        </p>
      </div>
      <DiseaseForm categories={categories} initialData={disease} />
    </div>
  );
}
