"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ChevronRight, Loader2 } from "lucide-react";
import DiseaseForm from "@/components/agronomist/DiseaseForm";
import { aiKnowledgeService } from "@/app/services/aiKnowledge.service";
import type { AiDiseaseKnowledge, AiKnowledgeCategory } from "@/app/types/ai-knowledge.types";

export default function EditDiseasePage() {
  const { id } = useParams<{ id: string }>();
  const [disease, setDisease] = useState<AiDiseaseKnowledge | null>(null);
  const [categories, setCategories] = useState<AiKnowledgeCategory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([aiKnowledgeService.getDiseases(), aiKnowledgeService.getCategories()])
      .then(([diseases, cats]) => {
        setDisease(diseases.find((item) => String(item.id) === id) ?? null);
        setCategories(cats);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="flex min-h-[300px] items-center justify-center">
        <Loader2 className="animate-spin text-blue-600" size={28} />
      </div>
    );
  }

  if (!disease) {
    return (
      <div className="py-16 text-center font-medium text-slate-400">
        Không tìm thấy phác đồ.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="mb-3 flex items-center gap-1.5 text-sm text-slate-400">
          <Link href="/agronomist/diseases" className="font-medium transition-colors hover:text-blue-600">
            Phác đồ điều trị
          </Link>
          <ChevronRight size={14} />
          <span className="font-medium text-slate-600">Chỉnh sửa</span>
        </div>
        <h1 className="text-2xl font-black uppercase tracking-tight text-slate-800">Chỉnh sửa phác đồ</h1>
        <p className="mt-1 line-clamp-1 text-sm text-slate-500">{disease.nameVi}</p>
      </div>
      <DiseaseForm categories={categories} initialData={disease} />
    </div>
  );
}
