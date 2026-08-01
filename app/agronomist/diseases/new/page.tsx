"use client";

import { useQuery } from "@tanstack/react-query";
import DiseaseForm from "@/components/agronomist/DiseaseForm";
import { AgronomistPageHeader } from "@/components/agronomist/agronomist-ui";
import { aiKnowledgeService } from "@/app/services/aiKnowledge.service";

export default function NewDiseasePage() {
  const categoriesQuery = useQuery({
    queryKey: ["ai-knowledge", "categories"],
    queryFn: () => aiKnowledgeService.getCategories(),
  });

  return (
    <div className="space-y-5">
      <AgronomistPageHeader title="Tạo phác đồ mới" />
      <DiseaseForm categories={categoriesQuery.data ?? []} />
    </div>
  );
}
