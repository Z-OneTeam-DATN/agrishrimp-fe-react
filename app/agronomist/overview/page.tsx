"use client";

import { useQuery } from "@tanstack/react-query";
import { aiKnowledgeService } from "@/app/services/aiKnowledge.service";
import { ProductService } from "@/app/services/product.service";

export default function AgronomistOverviewPage() {
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
  const productsQuery = useQuery({
    queryKey: ["agronomist-products"],
    queryFn: () => ProductService.getAll({ status: "ACTIVE" }),
  });

  const categories = categoriesQuery.data ?? [];
  const keywordSets = keywordSetsQuery.data ?? [];
  const diseases = diseasesQuery.data ?? [];
  const products = productsQuery.data ?? [];

  const pendingCount = diseases.filter((item) => item.status === "IN_REVIEW").length;
  const approvedCount = diseases.filter((item) => item.status === "APPROVED").length;

  return (
    <div className="space-y-8">
      <section className="grid gap-4 xl:grid-cols-4">
        <StatCard label="Danh mục" value={categories.length} />
        <StatCard label="Tri thức bệnh" value={diseases.length} />
        <StatCard label="Bộ từ khóa (tự động)" value={keywordSets.length} />
        <StatCard label="Sản phẩm hoạt động" value={products.length} />
      </section>

      <section className="grid gap-4 sm:grid-cols-2">
        <StatCard label="Đang chờ Admin duyệt" value={pendingCount} accent="text-amber-600" />
        <StatCard label="Đã được duyệt (AI đang dùng)" value={approvedCount} accent="text-emerald-600" />
      </section>
    </div>
  );
}

function StatCard({ label, value, accent }: { label: string; value: number; accent?: string }) {
  return (
    <div className="rounded-[4px] border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">{label}</p>
      <p className={`mt-3 text-[22px] font-bold ${accent ?? "text-slate-900"}`}>{value}</p>
    </div>
  );
}
