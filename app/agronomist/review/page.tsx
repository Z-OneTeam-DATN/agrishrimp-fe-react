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

const SOURCE_LABELS: Record<string, string> = {
  AI_DOCTOR_PUBLIC: "Người dùng ngoài website",
  AI_DOCTOR_PRIVATE: "Người dùng đã đăng nhập",
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
      toast.success("Đã cập nhật câu hỏi cần kiểm tra.");
      closeEditor();
      await queryClient.invalidateQueries({ queryKey: ["ai-knowledge", "review-cases"] });
    },
    onError: (error: unknown) => toast.error(getErrorMessage(error) || "Không thể cập nhật câu hỏi cần kiểm tra."),
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
      <section className="px-1">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <h3 className="text-2xl font-black text-slate-900">Câu hỏi cần kỹ sư kiểm tra</h3>
            <p className="mt-2 max-w-3xl text-sm leading-7 text-slate-600">
              Những câu hỏi AI chưa đủ chắc chắn sẽ nằm ở đây. Kỹ sư xem nội dung, bổ sung ghi chú nếu cần,
              rồi đánh dấu kết quả xử lý.
            </p>
          </div>
          <p className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600">
            {filteredCases.length} câu hỏi
          </p>
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
                  "rounded-full border px-4 py-2 text-sm font-semibold transition",
                  active
                    ? "border-blue-600 bg-blue-600 text-white shadow-sm"
                    : "border-slate-200 bg-white text-slate-600 hover:border-blue-200 hover:text-blue-700",
                )}
              >
                {filter.label} <span className={active ? "text-blue-100" : "text-slate-400"}>{count}</span>
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
  const createdAt = formatDateTime(item.createdAt);
  const statusLabel = REVIEW_STATUS_LABELS[item.status] ?? "Trạng thái khác";
  const statusClassName = REVIEW_STATUS_STYLES[item.status] ?? REVIEW_STATUS_STYLES.IGNORED;

  return (
    <article className="rounded-[4px] border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className={cn("rounded-full border px-3 py-1 text-[11px] font-bold", statusClassName)}>
              {statusLabel}
            </span>
            <span className="text-xs font-semibold text-slate-400">Câu hỏi #{item.id}</span>
            {createdAt ? <span className="text-xs text-slate-400">{createdAt}</span> : null}
          </div>
          <p className="mt-2 text-xs font-semibold text-slate-500">
            {item.sourceChannel ? SOURCE_LABELS[item.sourceChannel] ?? "Nguồn khác" : "Chưa rõ nguồn"}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {item.status !== "IN_PROGRESS" && item.status !== "RESOLVED" ? (
            <button type="button" onClick={() => onUpdateStatus("IN_PROGRESS")} className={secondaryButtonClassName}>
              Bắt đầu xử lý
            </button>
          ) : null}
          <button type="button" onClick={onStartEditing} className={secondaryButtonClassName}>
            Ghi chú xử lý
          </button>
          {item.status !== "RESOLVED" ? (
            <button type="button" onClick={() => onUpdateStatus("RESOLVED")} className={successButtonClassName}>
              Đã xử lý xong
            </button>
          ) : null}
        </div>
      </div>

      <div className="mt-3 rounded-[4px] border border-blue-100 bg-blue-50/50 px-3 py-2.5">
        <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-blue-500">Người dùng hỏi</span>
        <span className="ml-3 whitespace-pre-wrap text-[14px] font-semibold leading-6 text-slate-900">
          {item.questionText || "Chưa có nội dung"}
        </span>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <MetaPill label="Dấu hiệu" value={item.userSymptoms || "Chưa ghi nhận"} />
        <MetaPill label="AI gợi ý" value={item.aiSuggestedDiseaseCode || "Chưa có"} />
        <MetaPill label="Phác đồ" value={item.matchedKnowledgeCode || "Chưa gắn"} />
        <MetaPill label="Tin cậy" value={formatScore(item.matchScore)} />
        <MetaPill label="Lý do" value={resolveReasonLabel(item.reason)} />
      </div>

      {editing ? (
        <div className="mt-4 rounded-[4px] border border-slate-200 bg-slate-50 p-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                Mã phác đồ liên quan
              </label>
              <input
                value={matchedKnowledgeCode}
                onChange={(event) => onMatchedKnowledgeCodeChange(event.target.value)}
                className={inputClassName}
              />
            </div>
            <div>
              <label className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                Ghi chú xử lý
              </label>
              <textarea
                value={resolutionNotes}
                onChange={(event) => onResolutionNotesChange(event.target.value)}
                className={textareaClassName}
                rows={4}
              />
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => onSaveNotes(item.status)}
              disabled={saving}
              className={primaryButtonClassName}
            >
              Lưu ghi chú
            </button>
            <button
              type="button"
              onClick={() => onSaveNotes("RESOLVED")}
              disabled={saving}
              className={successButtonClassName}
            >
              Lưu và đánh dấu đã xử lý
            </button>
            <button type="button" onClick={onCloseEditor} className={secondaryButtonClassName}>
              Đóng
            </button>
          </div>
        </div>
      ) : null}
    </article>
  );
}

function MetaPill({ label, value }: { label: string; value: string }) {
  const muted = emptyValues.has(value);

  return (
    <span className="inline-flex max-w-full items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs">
      <span className="shrink-0 font-semibold text-slate-400">{label}:</span>
      <span className={cn("truncate font-semibold", muted ? "text-slate-400" : "text-slate-700")}>{value}</span>
    </span>
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
    <div className="rounded-[4px] border border-dashed border-slate-200 bg-white p-10 text-center">
      <p className="text-base font-bold text-slate-900">Không có câu hỏi nào trong trạng thái này.</p>
      <p className="mt-2 text-sm text-slate-500">Khi AI gặp câu hỏi cần kỹ sư kiểm tra, hệ thống sẽ hiển thị ở đây.</p>
    </div>
  );
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

function formatScore(value?: number | null) {
  if (value === null || value === undefined) return "Chưa có";
  const percent = value <= 1 ? value * 100 : value;
  return `${Math.round(percent)}%`;
}

function resolveReasonLabel(reason?: string | null) {
  if (!reason) return "AI chưa ghi nhận lý do cụ thể.";
  const normalized = reason.toUpperCase();
  if (normalized.includes("LOW_CONFIDENCE")) return "AI chưa đủ tự tin để trả lời chắc chắn.";
  if (normalized.includes("NO_MATCH") || normalized.includes("UNMATCHED")) return "AI chưa tìm được phác đồ phù hợp.";
  return reason;
}

const inputClassName =
  "h-[38px] w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none transition focus:border-blue-500";
const textareaClassName =
  "w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-blue-500";
const primaryButtonClassName =
  "inline-flex items-center justify-center rounded-md bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60";
const secondaryButtonClassName =
  "inline-flex items-center justify-center rounded-md border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50";
const successButtonClassName =
  "inline-flex items-center justify-center rounded-md border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm font-semibold text-emerald-700 transition-colors hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-60";
