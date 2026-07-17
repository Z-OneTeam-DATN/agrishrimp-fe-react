"use client";

import { useQuery } from "@tanstack/react-query";
import DiseaseForm from "@/components/agronomist/DiseaseForm";
import { aiKnowledgeService } from "@/app/services/aiKnowledge.service";

export default function NewDiseasePage() {
  const categoriesQuery = useQuery({
    queryKey: ["ai-knowledge", "categories"],
    queryFn: () => aiKnowledgeService.getCategories(),
  });

  return (
    <div className="space-y-3">
      <div className="mt-2 mb-8 space-y-4 px-1">
        <h1 className="text-[20px] font-semibold tracking-tight uppercase text-slate-900">
          Tạo phác đồ mới
        </h1>
      </div>
      <DiseaseForm categories={categoriesQuery.data ?? []} />
    </div>
  );
}
