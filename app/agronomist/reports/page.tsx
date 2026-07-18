"use client";

import { useQuery } from "@tanstack/react-query";
import { BarChart3, Loader2 } from "lucide-react";
import { aiKnowledgeService } from "@/app/services/aiKnowledge.service";
import { PermissionGuard } from "@/components/auth/PermissionGuard";
import { P } from "@/lib/permissions";

export default function AgronomistReportsPage() {
  return (
    <PermissionGuard permission={P.AI_KNOWLEDGE_APPROVE}>
      <AgronomistReportsContent />
    </PermissionGuard>
  );
}

function AgronomistReportsContent() {
  const reportQuery = useQuery({
    queryKey: ["ai-knowledge", "reports"],
    queryFn: () => aiKnowledgeService.getReport(),
  });

  const report = reportQuery.data;

  return (
    <div className="space-y-6">
      <section className="rounded-[4px] border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-start gap-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-[4px] bg-blue-50">
            <BarChart3 className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <p className="text-[12px] font-semibold uppercase tracking-[0.24em] text-slate-400">Knowledge Feedback Loop</p>
            <h3 className="mt-2 text-2xl font-bold text-slate-900">Báo cáo hiệu quả trả lời</h3>
            <p className="mt-2 text-sm leading-7 text-slate-600">
              Dựa trên tần suất mismatch để kỹ sư tiếp tục bổ sung tri thức, chỉnh ngưỡng hoặc cập nhật phác đồ.
            </p>
          </div>
        </div>
      </section>

      {reportQuery.isLoading ? (
        <div className="flex min-h-[280px] items-center justify-center rounded-[4px] border border-slate-200 bg-white">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      ) : report ? (
        <>
          <section className="grid gap-4 lg:grid-cols-4">
            <MetricCard label="Tổng câu hỏi" value={report.totalQuestions} />
            <MetricCard label="Match thành công" value={report.matchedQuestions} />
            <MetricCard label="Fallback" value={report.unmatchedQuestions} />
            <MetricCard label="Case chờ người" value={report.reviewCaseCount} />
          </section>

          <section className="grid gap-6 xl:grid-cols-[0.8fr,1.2fr]">
            <div className="rounded-[4px] border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-[12px] font-semibold uppercase tracking-[0.24em] text-slate-400">Matched Type</p>
              <div className="mt-5 space-y-3">
                {Object.entries(report.matchedTypeCounts).map(([key, value]) => (
                  <div key={key} className="flex items-center justify-between rounded-[4px] border border-slate-200 bg-slate-50 px-4 py-4">
                    <span className="text-sm font-semibold text-slate-700">{key}</span>
                    <span className="text-lg font-bold text-slate-900">{value}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[4px] border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-[12px] font-semibold uppercase tracking-[0.24em] text-slate-400">Top câu hỏi chưa match</p>
              <div className="mt-5 space-y-3">
                {report.topUnmatchedQuestions.map((item) => (
                  <div key={`${item.question}-${item.count}`} className="rounded-[4px] border border-slate-200 bg-slate-50 px-4 py-4">
                    <p className="text-sm font-semibold leading-6 text-slate-900">{item.question}</p>
                    <p className="mt-2 text-xs font-bold uppercase tracking-[0.2em] text-slate-400">
                      xuất hiện {item.count} lần
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </>
      ) : null}
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-[4px] border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">{label}</p>
      <p className="mt-3 text-[22px] font-bold text-slate-900">{value}</p>
    </div>
  );
}
