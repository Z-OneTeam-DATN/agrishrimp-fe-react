"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ClipboardList, NotebookPen, Tags } from "lucide-react";
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

      <section className="rounded-[4px] border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="text-xl font-bold text-slate-900">Quy trình làm việc</h3>
        <p className="mt-1 text-sm leading-6 text-slate-500">
          Kỹ sư chỉ nhập nội dung chuyên môn. Sau khi lưu, phác đồ ở trạng thái chờ duyệt — chỉ khi Admin duyệt xong,
          AI Doctor mới được dùng phác đồ đó để trả lời khách hàng.
        </p>

        <div className="mt-5 grid gap-4 md:grid-cols-3">
          <QuickLink
            href="/agronomist/categories"
            icon={<Tags className="h-5 w-5 text-blue-600" />}
            title="Thêm danh mục"
            description="Nhóm các bệnh theo mảng chuyên môn để bot gợi ý đúng ngữ cảnh."
          />
          <QuickLink
            href="/agronomist/diseases"
            icon={<NotebookPen className="h-5 w-5 text-blue-600" />}
            title="Quản lý phác đồ"
            description="Nhập tên bệnh, dấu hiệu, nguyên nhân và phác đồ điều trị theo giai đoạn."
          />
          <QuickLink
            href="/agronomist/protocol-status"
            icon={<ClipboardList className="h-5 w-5 text-blue-600" />}
            title="Trạng thái phác đồ"
            description="Theo dõi phác đồ nào đang chờ duyệt, đã duyệt hay bị Admin trả lại."
          />
        </div>
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

function QuickLink({
  href,
  icon,
  title,
  description,
}: {
  href: string;
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <Link
      href={href}
      className="rounded-[4px] border border-slate-200 bg-slate-50 p-4 transition-colors hover:border-blue-200 hover:bg-blue-50/40"
    >
      <div className="flex h-10 w-10 items-center justify-center rounded-[4px] bg-blue-50">{icon}</div>
      <p className="mt-3 text-sm font-bold text-slate-900">{title}</p>
      <p className="mt-1 text-xs leading-5 text-slate-500">{description}</p>
    </Link>
  );
}
