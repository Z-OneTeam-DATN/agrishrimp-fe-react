"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { aiKnowledgeService } from "@/app/services/aiKnowledge.service";
import { PermissionGuard } from "@/components/auth/PermissionGuard";
import { P } from "@/lib/permissions";
import { getErrorMessage } from "@/lib/axios";
import { cn } from "@/lib/utils";
import type { AiKnowledgeReviewCase, AiReviewCaseStatus } from "@/app/types/ai-knowledge.types";

const STATUS_FILTERS: { value: "" | AiReviewCaseStatus; label: string }[] = [
  { value: "", label: "Tất cả" },
  { value: "NEW", label: "Mới" },
  { value: "IN_PROGRESS", label: "Đang xử lý" },
  { value: "RESOLVED", label: "Đã xử lý" },
  { value: "IGNORED", label: "Bỏ qua" },
];

const REVIEW_STATUS_LABELS: Record<string, string> = {
  NEW: "Mới",
  IN_PROGRESS: "Đang xử lý",
  RESOLVED: "Đã xử lý",
  IGNORED: "Bỏ qua",
};

const REVIEW_STATUS_STYLES: Record<string, string> = {
  NEW: "border-blue-100 bg-blue-50 text-blue-700",
  IN_PROGRESS: "border-amber-100 bg-amber-50 text-amber-700",
  RESOLVED: "border-emerald-100 bg-emerald-50 text-emerald-700",
  IGNORED: "border-slate-200 bg-slate-100 text-slate-500",
};

const emptyValues = new Set(["", "Chưa có", "Chưa gắn", "Chưa ghi nhận", "Chưa có nội dung"]);

type UpdateReviewCasePayload = {
  id: number;
  status: AiReviewCaseStatus;
  matchedKnowledgeCode?: string;
  resolutionNotes?: string;
};

export default function AgronomistReviewPage() {
  return (
    <PermissionGuard permission={P.AI_CASE_REVIEW}>
      <AgronomistReviewContent />
    </PermissionGuard>
  );
}

function AgronomistReviewContent() {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<"" | AiReviewCaseStatus>("");
  const [editingCaseId, setEditingCaseId] = useState<number | null>(null);
  const [resolutionNotes, setResolutionNotes] = useState("");
  const [matchedKnowledgeCode, setMatchedKnowledgeCode] = useState("");

  const reviewCasesQuery = useQuery({
    queryKey: ["ai-knowledge", "review-cases"],
    queryFn: () => aiKnowledgeService.getReviewCases(),
  });

  const updateCaseMutation = useMutation({
    mutationFn: async (payload: UpdateReviewCasePayload) =>
      aiKnowledgeService.updateReviewCase(payload.id, {
        status: payload.status,
        matchedKnowledgeCode: payload.matchedKnowledgeCode || undefined,
        resolutionNotes: payload.resolutionNotes || undefined,
      }),
    onSuccess: async () => {
      toast.success("Đã cập nhật case.");
      closeEditor();
      await queryClient.invalidateQueries({ queryKey: ["ai-knowledge", "review-cases"] });
    },
    onError: (error: unknown) => toast.error(getErrorMessage(error) || "Không thể cập nhật case."),
  });

  const reviewCases = useMemo(() => reviewCasesQuery.data ?? [], [reviewCasesQuery.data]);
  const filteredCases = useMemo(
    () => (statusFilter ? reviewCases.filter((item) => item.status === statusFilter) : reviewCases),
    [reviewCases, statusFilter],
  );

  const startEditing = (item: AiKnowledgeReviewCase) => {
    setEditingCaseId(item.id);
    setResolutionNotes(item.resolutionNotes || "");
    setMatchedKnowledgeCode(item.matchedKnowledgeCode || "");
  };

  const closeEditor = () => {
    setEditingCaseId(null);
    setResolutionNotes("");
    setMatchedKnowledgeCode("");
  };

  const updateStatus = (item: AiKnowledgeReviewCase, status: AiReviewCaseStatus) => {
    updateCaseMutation.mutate({ id: item.id, status });
  };

  const saveCurrentNotes = (item: AiKnowledgeReviewCase, status: AiReviewCaseStatus = item.status) => {
    updateCaseMutation.mutate({
      id: item.id,
      status,
      matchedKnowledgeCode,
      resolutionNotes,
    });
  };

  return (
    <div className="space-y-5">
      <section className="mt-2 px-1">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-2">
            <h1 className="text-[20px] font-semibold uppercase tracking-tight text-slate-900">
              Case cần duyệt
            </h1>
            <p className="text-[13px] leading-6 text-slate-500">
              Kiểm tra các câu hỏi AI chưa chắc chắn.
            </p>
          </div>
          <p className="text-[13px] font-semibold text-slate-500">{filteredCases.length} case</p>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {STATUS_FILTERS.map((filter) => {
            const active = statusFilter === filter.value;
            const count = getStatusCount(reviewCases, filter.value);

            return (
              <button
                key={filter.value || "all"}
                type="button"
                onClick={() => setStatusFilter(filter.value)}
                className={cn(
                  "inline-flex h-8 items-center gap-1.5 rounded-full border px-3 text-[12px] font-medium transition-colors",
                  active
                    ? "border-blue-600 bg-blue-600 text-white"
                    : "border-slate-200 bg-white text-slate-600 hover:border-blue-200 hover:text-blue-700",
                )}
              >
                {filter.label}
                <span className={active ? "text-blue-100" : "text-slate-400"}>{count}</span>
              </button>
            );
          })}
        </div>
      </section>

      <section className="space-y-3">
        {reviewCasesQuery.isLoading ? (
          <LoadingState />
        ) : filteredCases.length === 0 ? (
          <EmptyState />
        ) : (
          filteredCases.map((item) => (
            <ReviewCaseCard
              key={item.id}
              item={item}
              editing={editingCaseId === item.id}
              matchedKnowledgeCode={matchedKnowledgeCode}
              resolutionNotes={resolutionNotes}
              saving={updateCaseMutation.isPending}
              onStartEditing={() => startEditing(item)}
              onCloseEditor={closeEditor}
              onMatchedKnowledgeCodeChange={setMatchedKnowledgeCode}
              onResolutionNotesChange={setResolutionNotes}
              onUpdateStatus={(status) => updateStatus(item, status)}
              onSaveNotes={(status) => saveCurrentNotes(item, status)}
            />
          ))
        )}
      </section>
    </div>
  );
}

function ReviewCaseCard({
  item,
  editing,
  matchedKnowledgeCode,
  resolutionNotes,
  saving,
  onStartEditing,
  onCloseEditor,
  onMatchedKnowledgeCodeChange,
  onResolutionNotesChange,
  onUpdateStatus,
  onSaveNotes,
}: {
  item: AiKnowledgeReviewCase;
  editing: boolean;
  matchedKnowledgeCode: string;
  resolutionNotes: string;
  saving: boolean;
  onStartEditing: () => void;
  onCloseEditor: () => void;
  onMatchedKnowledgeCodeChange: (value: string) => void;
  onResolutionNotesChange: (value: string) => void;
  onUpdateStatus: (status: AiReviewCaseStatus) => void;
  onSaveNotes: (status?: AiReviewCaseStatus) => void;
}) {
  const statusLabel = REVIEW_STATUS_LABELS[item.status] ?? item.status;
  const statusClassName = REVIEW_STATUS_STYLES[item.status] ?? REVIEW_STATUS_STYLES.IGNORED;
  const metaItems = buildMetaItems(item);

  return (
    <article className="rounded-[4px] border border-[#dcdcdc] bg-white shadow-sm">
      <div className="flex flex-col gap-3 border-b border-slate-100 px-4 py-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <span className={cn("rounded-full border px-3 py-1 text-[11px] font-semibold", statusClassName)}>
            {statusLabel}
          </span>
          <span className="text-[12px] font-semibold text-slate-400">#{item.id}</span>
          {item.createdAt ? <span className="text-[12px] text-slate-400">{formatDateTime(item.createdAt)}</span> : null}
        </div>

        <div className="flex flex-wrap gap-2">
          {item.status !== "IN_PROGRESS" && item.status !== "RESOLVED" ? (
            <button type="button" onClick={() => onUpdateStatus("IN_PROGRESS")} className={secondaryButtonClassName}>
              Bắt đầu
            </button>
          ) : null}
          <button type="button" onClick={onStartEditing} className={secondaryButtonClassName}>
            Ghi chú
          </button>
          {item.status !== "RESOLVED" ? (
            <button type="button" onClick={() => onUpdateStatus("RESOLVED")} className={successButtonClassName}>
              Xong
            </button>
          ) : null}
        </div>
      </div>

      <div className="px-4 py-3">
        <p className="whitespace-pre-wrap text-[14px] font-semibold leading-6 text-slate-900">
          {item.questionText || "Chưa có nội dung"}
        </p>

        {metaItems.length > 0 ? (
          <div className="mt-3 grid gap-2 md:grid-cols-2 xl:grid-cols-4">
            {metaItems.map((meta) => (
              <MetaBox key={meta.label} label={meta.label} value={meta.value} />
            ))}
          </div>
        ) : null}

        {editing ? (
          <div className="mt-4 rounded-[4px] border border-slate-200 bg-slate-50 p-4">
            <div className="grid gap-3 md:grid-cols-[0.8fr,1.2fr]">
              <div>
                <label className="mb-1.5 block text-[11px] font-semibold text-slate-500">
                  Mã phác đồ
                </label>
                <input
                  value={matchedKnowledgeCode}
                  onChange={(event) => onMatchedKnowledgeCodeChange(event.target.value)}
                  className={inputClassName}
                />
              </div>
              <div>
                <label className="mb-1.5 block text-[11px] font-semibold text-slate-500">
                  Ghi chú
                </label>
                <textarea
                  value={resolutionNotes}
                  onChange={(event) => onResolutionNotesChange(event.target.value)}
                  className={textareaClassName}
                  rows={3}
                />
              </div>
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => onSaveNotes(item.status)}
                disabled={saving}
                className={primaryButtonClassName}
              >
                Lưu
              </button>
              <button
                type="button"
                onClick={() => onSaveNotes("RESOLVED")}
                disabled={saving}
                className={successButtonClassName}
              >
                Lưu & xong
              </button>
              <button type="button" onClick={onCloseEditor} className={secondaryButtonClassName}>
                Đóng
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </article>
  );
}

function MetaBox({ label, value }: { label: string; value: string }) {
  const muted = emptyValues.has(value);

  return (
    <div className="min-w-0 rounded-[4px] border border-slate-200 bg-slate-50 px-3 py-2">
      <p className="text-[11px] font-semibold text-slate-400">{label}</p>
      <p className={cn("mt-1 truncate text-[13px] font-semibold", muted ? "text-slate-400" : "text-slate-800")}>
        {value}
      </p>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="flex min-h-[260px] items-center justify-center rounded-[4px] border border-slate-200 bg-white">
      <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
    </div>
  );
}

function EmptyState() {
  return (
    <div className="rounded-[4px] border border-dashed border-slate-200 bg-white p-10 text-center text-[13px] font-medium text-slate-400">
      Không có case trong trạng thái này.
    </div>
  );
}

function buildMetaItems(item: AiKnowledgeReviewCase) {
  return [
    { label: "Dấu hiệu", value: item.userSymptoms || "Chưa ghi nhận" },
    { label: "AI gợi ý", value: item.aiSuggestedDiseaseCode || "Chưa có" },
    { label: "Phác đồ", value: item.matchedKnowledgeCode || "Chưa gắn" },
    { label: "Lý do", value: resolveReasonLabel(item.reason) },
  ];
}

function getStatusCount(items: AiKnowledgeReviewCase[], status: "" | AiReviewCaseStatus) {
  if (!status) return items.length;
  return items.filter((item) => item.status === status).length;
}

function formatDateTime(value?: string) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function resolveReasonLabel(reason?: string | null) {
  if (!reason) return "Chưa có";
  const normalized = reason.toUpperCase();
  if (normalized.includes("NO_KNOWLEDGE_MATCH")) return "Chưa có phác đồ phù hợp";
  if (normalized.includes("LOW_CONFIDENCE")) return "Độ tin cậy thấp";
  if (normalized.includes("NO_MATCH") || normalized.includes("UNMATCHED")) return "Chưa match";
  return reason;
}

const inputClassName =
  "h-[38px] w-full rounded-[4px] border border-slate-200 bg-white px-3 text-[13px] text-slate-800 outline-none transition focus:border-blue-500";
const textareaClassName =
  "w-full rounded-[4px] border border-slate-200 bg-white px-3 py-2 text-[13px] text-slate-800 outline-none transition focus:border-blue-500";
const primaryButtonClassName =
  "inline-flex h-8 items-center justify-center rounded-[4px] bg-blue-600 px-3 text-[12px] font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60";
const secondaryButtonClassName =
  "inline-flex h-8 items-center justify-center rounded-[4px] border border-slate-200 bg-white px-3 text-[12px] font-medium text-slate-700 transition-colors hover:bg-slate-50";
const successButtonClassName =
  "inline-flex h-8 items-center justify-center rounded-[4px] border border-emerald-200 bg-emerald-50 px-3 text-[12px] font-medium text-emerald-700 transition-colors hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-60";
