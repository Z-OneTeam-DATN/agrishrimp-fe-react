"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, MessageSquareWarning, Save } from "lucide-react";
import { toast } from "sonner";
import { aiKnowledgeService } from "@/app/services/aiKnowledge.service";
import type { AiKnowledgeReviewCase } from "@/app/types/ai-knowledge.types";

export default function AgronomistReviewPage() {
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
      toast.success("Đã cập nhật review case.");
      setEditingCaseId(null);
      setResolutionNotes("");
      setMatchedKnowledgeCode("");
      await queryClient.invalidateQueries({ queryKey: ["ai-knowledge", "review-cases"] });
    },
    onError: (error: any) => toast.error(error?.message || "Không thể cập nhật review case."),
  });

  const reviewCases = reviewCasesQuery.data ?? [];

  const startEditing = (item: AiKnowledgeReviewCase) => {
    setEditingCaseId(item.id);
    setResolutionNotes(item.resolutionNotes || "");
    setMatchedKnowledgeCode(item.matchedKnowledgeCode || "");
  };

  return (
    <div className="space-y-6">
      <section className="rounded-[28px] border border-[#d6ded5] bg-white p-6 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#e7f0e9]">
              <MessageSquareWarning className="h-5 w-5 text-[#325b48]" />
            </div>
            <div>
              <p className="text-[12px] font-black uppercase tracking-[0.34em] text-[#7b8c80]">Human Review Queue</p>
              <h3 className="mt-2 text-2xl font-black text-[#203126]">Case không match hoặc confidence thấp</h3>
              <p className="mt-2 max-w-3xl text-sm leading-7 text-slate-600">
                Đây là nơi kỹ sư chốt lại các câu hỏi mà AI không được phép trả lời chắc chắn trong production.
              </p>
            </div>
          </div>

          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            className="h-12 rounded-2xl border border-[#d7dfd8] bg-white px-4 text-sm text-slate-800 outline-none"
          >
            <option value="">Tất cả trạng thái</option>
            <option value="NEW">NEW</option>
            <option value="IN_PROGRESS">IN_PROGRESS</option>
            <option value="RESOLVED">RESOLVED</option>
            <option value="IGNORED">IGNORED</option>
          </select>
        </div>
      </section>

      <section className="space-y-4">
        {reviewCasesQuery.isLoading ? (
          <div className="flex min-h-[240px] items-center justify-center rounded-[28px] border border-[#d6ded5] bg-white">
            <Loader2 className="h-8 w-8 animate-spin text-[#325b48]" />
          </div>
        ) : (
          reviewCases.map((item) => (
            <div key={item.id} className="rounded-[28px] border border-[#d6ded5] bg-white p-6 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-black text-slate-900">Case #{item.id}</p>
                  <p className="mt-1 text-xs text-slate-500">{item.sourceChannel || "UNKNOWN_SOURCE"}</p>
                </div>
                <span className="rounded-full bg-[#eef4ef] px-3 py-1 text-[11px] font-black uppercase tracking-[0.18em] text-[#365847]">
                  {item.status}
                </span>
              </div>

              <div className="mt-4 grid gap-4 lg:grid-cols-2">
                <InfoBlock label="Câu hỏi" value={item.questionText || "Chưa có nội dung"} />
                <InfoBlock label="Dấu hiệu người nuôi mô tả" value={item.userSymptoms || "Chưa ghi nhận"} />
                <InfoBlock label="AI gợi ý" value={item.aiSuggestedDiseaseCode || "Chưa có"} />
                <InfoBlock label="Knowledge đang match" value={item.matchedKnowledgeCode || "Chưa gắn"} />
              </div>

              <div className="mt-5 flex flex-wrap gap-2">
                <button onClick={() => startEditing(item)} className={secondaryButtonClassName}>
                  Xử lý case
                </button>
                <button onClick={() => updateCaseMutation.mutate({ id: item.id, status: "IN_PROGRESS" })} className={secondaryButtonClassName}>
                  Chuyển IN_PROGRESS
                </button>
                <button onClick={() => updateCaseMutation.mutate({ id: item.id, status: "RESOLVED" })} className={successButtonClassName}>
                  Đánh dấu RESOLVED
                </button>
              </div>

              {editingCaseId === item.id ? (
                <div className="mt-5 rounded-[24px] border border-[#dce5dc] bg-[#f8fbf8] p-5">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <p className="mb-2 text-[11px] font-black uppercase tracking-[0.24em] text-[#738676]">
                        Mã knowledge xử lý
                      </p>
                      <input
                        value={matchedKnowledgeCode}
                        onChange={(event) => setMatchedKnowledgeCode(event.target.value)}
                        className={inputClassName}
                        placeholder="WSSV hoặc FAQ_WHITE_SPOT"
                      />
                    </div>
                    <div>
                      <p className="mb-2 text-[11px] font-black uppercase tracking-[0.24em] text-[#738676]">
                        Ghi chú xử lý
                      </p>
                      <textarea
                        value={resolutionNotes}
                        onChange={(event) => setResolutionNotes(event.target.value)}
                        className={textareaClassName}
                        rows={4}
                        placeholder="Mô tả vì sao bot bị thiếu tri thức và hướng cập nhật..."
                      />
                    </div>
                  </div>

                  <div className="mt-4 flex gap-3">
                    <button onClick={() => updateCaseMutation.mutate({ id: item.id, status: "RESOLVED" })} className={primaryButtonClassName}>
                      <Save className="h-4 w-4" />
                      Lưu & chốt case
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
    <div className="rounded-2xl border border-[#e3ebe2] bg-[#f8fbf8] p-4">
      <p className="text-[11px] font-black uppercase tracking-[0.24em] text-[#738676]">{label}</p>
      <p className="mt-3 text-sm leading-6 text-slate-700">{value}</p>
    </div>
  );
}

const inputClassName =
  "h-12 w-full rounded-2xl border border-[#d7dfd8] bg-white px-4 text-sm text-slate-800 outline-none transition focus:border-[#335848]";
const textareaClassName =
  "w-full rounded-2xl border border-[#d7dfd8] bg-white px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-[#335848]";
const primaryButtonClassName =
  "inline-flex items-center gap-2 rounded-2xl bg-[#2f4e3f] px-4 py-3 text-sm font-bold text-white transition-colors hover:bg-[#274338]";
const secondaryButtonClassName =
  "inline-flex items-center gap-2 rounded-2xl border border-[#d2ddd3] bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition-colors hover:bg-[#f4f7f4]";
const successButtonClassName =
  "inline-flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700 transition-colors hover:bg-emerald-100";
