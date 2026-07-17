"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, ShieldCheck, XCircle } from "lucide-react";
import { toast } from "sonner";
import { aiKnowledgeService } from "@/app/services/aiKnowledge.service";

const STATUS_FILTERS = [
  { value: "IN_REVIEW", label: "Chờ duyệt" },
  { value: "APPROVED", label: "Đã duyệt" },
  { value: "DRAFT", label: "Nháp / Bị từ chối" },
  { value: "DISABLED", label: "Đã tắt" },
  { value: "ALL", label: "Tất cả" },
] as const;

export default function AdminAiKnowledgeApprovalsPage() {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<(typeof STATUS_FILTERS)[number]["value"]>("IN_REVIEW");

  const diseasesQuery = useQuery({
    queryKey: ["ai-knowledge", "diseases"],
    queryFn: () => aiKnowledgeService.getDiseases(),
  });

  const diseases = diseasesQuery.data ?? [];

  const filteredDiseases = useMemo(() => {
    if (statusFilter === "ALL") return diseases;
    return diseases.filter((item) => item.status === statusFilter);
  }, [diseases, statusFilter]);

  const pendingCount = useMemo(
    () => diseases.filter((item) => item.status === "IN_REVIEW").length,
    [diseases],
  );

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["ai-knowledge", "diseases"] });

  const approveMutation = useMutation({
    mutationFn: (id: number) => aiKnowledgeService.approveDisease(id),
    onSuccess: async () => {
      toast.success("Đã duyệt phác đồ. AI Doctor có thể dùng để trả lời ngay.");
      await invalidate();
    },
    onError: (error: any) => toast.error(error?.message || "Không thể duyệt phác đồ."),
  });

  const rejectMutation = useMutation({
    mutationFn: (id: number) => aiKnowledgeService.rejectDisease(id),
    onSuccess: async () => {
      toast.success("Đã từ chối, chuyển về trạng thái nháp cho kỹ sư sửa lại.");
      await invalidate();
    },
    onError: (error: any) => toast.error(error?.message || "Không thể từ chối phác đồ."),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-[20px] font-semibold uppercase text-slate-900">Duyệt phác đồ điều trị</h1>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Chờ duyệt" value={pendingCount} accent="text-amber-600" />
        <StatCard label="Đã duyệt" value={diseases.filter((item) => item.status === "APPROVED").length} accent="text-emerald-600" />
        <StatCard label="Nháp / bị từ chối" value={diseases.filter((item) => item.status === "DRAFT").length} accent="text-slate-500" />
        <StatCard label="Tổng số phác đồ" value={diseases.length} accent="text-blue-600" />
      </div>

      <div className="flex flex-wrap gap-2 rounded-[4px] border border-slate-200 bg-white p-2">
        {STATUS_FILTERS.map((filter) => (
          <button
            key={filter.value}
            onClick={() => setStatusFilter(filter.value)}
            className={`rounded-[4px] px-3 py-1.5 text-[13px] font-medium transition-colors ${
              statusFilter === filter.value
                ? "bg-blue-600 text-white"
                : "text-slate-600 hover:bg-slate-50"
            }`}
          >
            {filter.label}
          </button>
        ))}
      </div>

      <div className="grid gap-4">
        {diseasesQuery.isLoading ? (
          <div className="rounded-[4px] border border-slate-200 bg-white p-8 text-center text-sm text-slate-400">
            Đang tải...
          </div>
        ) : filteredDiseases.length === 0 ? (
          <div className="flex flex-col items-center gap-2 rounded-[4px] border border-slate-200 bg-white p-10 text-center">
            <ShieldCheck className="h-8 w-8 text-slate-300" />
            <p className="text-sm text-slate-500">Không có phác đồ nào ở trạng thái này.</p>
          </div>
        ) : (
          filteredDiseases.map((item) => (
            <div key={item.id} className="rounded-[4px] border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-bold text-slate-900">{item.nameVi}</p>
                    {item.nameEn ? <p className="text-xs text-slate-400">({item.nameEn})</p> : null}
                  </div>
                  <p className="mt-1 text-xs text-slate-500">
                    Mã: {item.code} · Danh mục: {item.category?.name ?? "Chưa gán"}
                  </p>
                </div>
                <StatusPill value={item.status} />
              </div>

              <p className="mt-3 text-sm leading-6 text-slate-600">{item.signsSummary}</p>

              {item.causes?.length ? (
                <div className="mt-3">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">Nguyên nhân</p>
                  <ul className="mt-1 list-inside list-disc text-sm text-slate-600">
                    {item.causes.map((cause) => (
                      <li key={cause}>{cause}</li>
                    ))}
                  </ul>
                </div>
              ) : null}

              {item.treatmentStages?.length ? (
                <p className="mt-3 text-xs text-slate-500">
                  {item.treatmentStages.length} giai đoạn điều trị đã khai báo.
                </p>
              ) : null}

              {item.status === "IN_REVIEW" ? (
                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    onClick={() => approveMutation.mutate(item.id)}
                    disabled={approveMutation.isPending}
                    className="inline-flex items-center gap-2 rounded-md border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700 transition-colors hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    Duyệt
                  </button>
                  <button
                    onClick={() => rejectMutation.mutate(item.id)}
                    disabled={rejectMutation.isPending}
                    className="inline-flex items-center gap-2 rounded-md border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-700 transition-colors hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <XCircle className="h-4 w-4" />
                    Từ chối
                  </button>
                </div>
              ) : null}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value, accent }: { label: string; value: number; accent: string }) {
  return (
    <div className="rounded-[4px] border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">{label}</p>
      <p className={`mt-3 text-[22px] font-bold ${accent}`}>{value}</p>
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
