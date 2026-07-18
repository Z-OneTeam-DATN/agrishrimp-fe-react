"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Save } from "lucide-react";
import { toast } from "sonner";
import { aiKnowledgeService } from "@/app/services/aiKnowledge.service";
import { PermissionGuard } from "@/components/auth/PermissionGuard";
import { P } from "@/lib/permissions";
import type { AiKnowledgeReviewCase } from "@/app/types/ai-knowledge.types";

const REVIEW_STATUS_LABELS: Record<string, string> = {
  NEW: "Mới",
  IN_PROGRESS: "Đang xử lý",
  RESOLVED: "Đã xử lý",
  IGNORED: "Bỏ qua",
};

const SOURCE_LABELS: Record<string, string> = {
  AI_DOCTOR_PUBLIC: "Người dùng ngoài website",
  AI_DOCTOR_PRIVATE: "Người dùng đã đăng nhập",
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
  const [statusFilter, setStatusFilter] = useState("");
  const [editingCaseId, setEditingCaseId] = useState<number | null>(null);
  const [resolutionNotes, setResolutionNotes] = useState("");
  const [matchedKnowledgeCode, setMatchedKnowledgeCode] = useState("");

  const reviewCasesQuery = useQuery({
    queryKey: ["ai-knowledge", "review-cases", statusFilter],
    queryFn: () => aiKnowledgeService.getReviewCases(statusFilter || undefined),
  });

  const updateCaseMutation = useMutation({
    mutationFn: async (payload: { id: number; status: string }) =>
      aiKnowledgeService.updateReviewCase(payload.id, {
        status: payload.status,
        matchedKnowledgeCode: matchedKnowledgeCode || undefined,
        resolutionNotes: resolutionNotes || undefined,
    }),
    onSuccess: async () => {
      toast.success("Đã cập nhật câu hỏi cần kiểm tra.");
      setEditingCaseId(null);
      setResolutionNotes("");
      setMatchedKnowledgeCode("");
      await queryClient.invalidateQueries({ queryKey: ["ai-knowledge", "review-cases"] });
    },
    onError: (error: unknown) => toast.error(getErrorMessage(error, "Không thể cập nhật câu hỏi cần kiểm tra.")),
  });

  const reviewCases = reviewCasesQuery.data ?? [];

  const startEditing = (item: AiKnowledgeReviewCase) => {
    setEditingCaseId(item.id);
    setResolutionNotes(item.resolutionNotes || "");
    setMatchedKnowledgeCode(item.matchedKnowledgeCode || "");
  };

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-4 px-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h3 className="text-2xl font-bold text-slate-900">Câu hỏi AI cần kỹ sư kiểm tra</h3>
          <p className="mt-2 max-w-3xl text-sm leading-7 text-slate-600">
            Danh sách câu hỏi AI chưa đủ tự tin hoặc chưa tìm được phác đồ phù hợp.
          </p>
        </div>

        <select
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value)}
          className="h-[38px] rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none"
        >
          <option value="">Tất cả trạng thái</option>
          <option value="NEW">Mới</option>
          <option value="IN_PROGRESS">Đang xử lý</option>
          <option value="RESOLVED">Đã xử lý</option>
          <option value="IGNORED">Bỏ qua</option>
        </select>
      </section>

      <section className="space-y-4">
        {reviewCasesQuery.isLoading ? (
          <div className="flex min-h-[240px] items-center justify-center rounded-[4px] border border-slate-200 bg-white">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          </div>
        ) : (
          reviewCases.map((item) => (
            <div key={item.id} className="rounded-[4px] border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-black text-slate-900">Câu hỏi #{item.id}</p>
                  <p className="mt-1 text-xs text-slate-500">
                    {item.sourceChannel ? SOURCE_LABELS[item.sourceChannel] ?? "Nguồn khác" : "Chưa rõ nguồn"}
                  </p>
                </div>
                <span className="rounded-full bg-blue-50 px-3 py-1 text-[11px] font-black uppercase tracking-[0.18em] text-blue-700">
                  {REVIEW_STATUS_LABELS[item.status] ?? item.status}
                </span>
              </div>

              <div className="mt-4 grid gap-4 lg:grid-cols-2">
                <InfoBlock label="Câu hỏi" value={item.questionText || "Chưa có nội dung"} />
                <InfoBlock label="Dấu hiệu người nuôi mô tả" value={item.userSymptoms || "Chưa ghi nhận"} />
                <InfoBlock label="AI gợi ý" value={item.aiSuggestedDiseaseCode || "Chưa có"} />
                <InfoBlock label="Phác đồ đang gắn" value={item.matchedKnowledgeCode || "Chưa gắn"} />
              </div>

              <div className="mt-5 flex flex-wrap gap-2">
                <button onClick={() => startEditing(item)} className={secondaryButtonClassName}>
                  Xem và ghi chú
                </button>
                <button onClick={() => updateCaseMutation.mutate({ id: item.id, status: "IN_PROGRESS" })} className={secondaryButtonClassName}>
                  Đánh dấu đang xử lý
                </button>
                <button onClick={() => updateCaseMutation.mutate({ id: item.id, status: "RESOLVED" })} className={successButtonClassName}>
                  Đánh dấu đã xử lý
                </button>
              </div>

              {editingCaseId === item.id ? (
                <div className="mt-5 rounded-[4px] border border-slate-200 bg-slate-50 p-5">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                        Mã phác đồ xử lý
                      </p>
                      <input
                        value={matchedKnowledgeCode}
                        onChange={(event) => setMatchedKnowledgeCode(event.target.value)}
                        className={inputClassName}
                      />
                    </div>
                    <div>
                      <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                        Ghi chú xử lý
                      </p>
                      <textarea
                        value={resolutionNotes}
                        onChange={(event) => setResolutionNotes(event.target.value)}
                        className={textareaClassName}
                        rows={4}
                      />
                    </div>
                  </div>

                  <div className="mt-4 flex gap-3">
                    <button onClick={() => updateCaseMutation.mutate({ id: item.id, status: "RESOLVED" })} className={primaryButtonClassName}>
                      <Save className="h-4 w-4" />
                      Lưu và chốt
                    </button>
                    <button onClick={() => setEditingCaseId(null)} className={secondaryButtonClassName}>
                      Đóng
                    </button>
                  </div>
                </div>
              ) : null}
            </div>
          ))
        )}
      </section>
    </div>
  );
}

function InfoBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[4px] border border-slate-200 bg-slate-50 p-4">
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">{label}</p>
      <p className="mt-3 text-sm leading-6 text-slate-700">{value}</p>
    </div>
  );
}

const inputClassName =
  "h-[38px] w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none transition focus:border-blue-500";
const textareaClassName =
  "w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-blue-500";
const primaryButtonClassName =
  "inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700";
const secondaryButtonClassName =
  "inline-flex items-center gap-2 rounded-md border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50";
const successButtonClassName =
  "inline-flex items-center gap-2 rounded-md border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm font-semibold text-emerald-700 transition-colors hover:bg-emerald-100";

function getErrorMessage(error: unknown, fallback: string) {
  if (error && typeof error === "object" && "message" in error && typeof error.message === "string") {
    return error.message;
  }
  return fallback;
}
