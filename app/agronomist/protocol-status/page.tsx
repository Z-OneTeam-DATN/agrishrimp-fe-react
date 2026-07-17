"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ClipboardList, FilePenLine, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { aiKnowledgeService } from "@/app/services/aiKnowledge.service";

const STATUS_FILTERS = [
  { value: "ALL", label: "Tất cả" },
  { value: "IN_REVIEW", label: "Chờ duyệt" },
  { value: "APPROVED", label: "Đã duyệt" },
  { value: "DRAFT", label: "Nháp / bị từ chối" },
  { value: "DISABLED", label: "Đã tắt" },
] as const;

export default function AgronomistProtocolStatusPage() {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<(typeof STATUS_FILTERS)[number]["value"]>("ALL");

  const diseasesQuery = useQuery({
    queryKey: ["ai-knowledge", "diseases"],
    queryFn: () => aiKnowledgeService.getDiseases(),
  });
  const diseases = diseasesQuery.data ?? [];

  const filteredDiseases = useMemo(() => {
    if (statusFilter === "ALL") return diseases;
    return diseases.filter((item) => item.status === statusFilter);
  }, [diseases, statusFilter]);

  const deleteDisease = async (id: number) => {
    if (!confirm("Xóa phác đồ này?")) return;
    await aiKnowledgeService.deleteDisease(id);
    toast.success("Đã xóa phác đồ.");
    await queryClient.invalidateQueries({ queryKey: ["ai-knowledge", "diseases"] });
  };

  return (
    <section className="rounded-[4px] border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-start gap-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-[4px] bg-blue-50">
          <ClipboardList className="h-5 w-5 text-blue-600" />
        </div>
        <div>
          <h3 className="text-xl font-bold text-slate-900">Trạng thái phác đồ</h3>
          <p className="mt-1 text-sm leading-6 text-slate-500">
            Theo dõi phác đồ đã nộp. Việc duyệt do Admin thực hiện — trang này chỉ để xem trạng thái, sửa nội dung hoặc xóa.
          </p>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap gap-2 rounded-[4px] border border-slate-200 bg-slate-50 p-2">
        {STATUS_FILTERS.map((filter) => (
          <button
            key={filter.value}
            onClick={() => setStatusFilter(filter.value)}
            className={`rounded-[4px] px-3 py-1.5 text-[13px] font-medium transition-colors ${
              statusFilter === filter.value
                ? "bg-blue-600 text-white"
                : "text-slate-600 hover:bg-white"
            }`}
          >
            {filter.label}
          </button>
        ))}
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        {diseasesQuery.isLoading ? (
          <p className="text-sm text-slate-400">Đang tải...</p>
        ) : filteredDiseases.length === 0 ? (
          <p className="text-sm text-slate-400">Không có phác đồ nào ở trạng thái này.</p>
        ) : (
          filteredDiseases.map((item) => (
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
                <Link
                  href={`/agronomist/diseases?id=${item.id}`}
                  className="inline-flex items-center gap-2 rounded-md border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-100"
                >
                  <FilePenLine className="h-4 w-4" />
                  Sửa
                </Link>
                <button
                  onClick={() => deleteDisease(item.id)}
                  className="inline-flex items-center gap-2 rounded-md border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-700 transition-colors hover:bg-rose-100"
                >
                  <Trash2 className="h-4 w-4" />
                  Xóa
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </section>
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
