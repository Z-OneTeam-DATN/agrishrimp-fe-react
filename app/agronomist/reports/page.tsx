"use client";

import { useQuery } from "@tanstack/react-query";
import { BarChart3, Loader2 } from "lucide-react";
import { aiKnowledgeService } from "@/app/services/aiKnowledge.service";

export default function AgronomistReportsPage() {
  const reportQuery = useQuery({
    queryKey: ["ai-knowledge", "reports"],
    queryFn: () => aiKnowledgeService.getReport(),
  });

  const report = reportQuery.data;

  return (
    <div className="space-y-6">
      <section className="rounded-[28px] border border-[#d6ded5] bg-white p-6 shadow-sm">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#e7f0e9]">
            <BarChart3 className="h-5 w-5 text-[#325b48]" />
          </div>
          <div>
            <p className="text-[12px] font-black uppercase tracking-[0.34em] text-[#7b8c80]">Knowledge Feedback Loop</p>
            <h3 className="mt-2 text-2xl font-black text-[#203126]">Báo cáo hiệu quả trả lời</h3>
            <p className="mt-2 text-sm leading-7 text-slate-600">
              Dựa trên tần suất mismatch để kỹ sư tiếp tục bổ sung tri thức, chỉnh ngưỡng hoặc cập nhật phác đồ.
            </p>
          </div>
        </div>
      </section>

      {reportQuery.isLoading ? (
        <div className="flex min-h-[280px] items-center justify-center rounded-[28px] border border-[#d6ded5] bg-white">
          <Loader2 className="h-8 w-8 animate-spin text-[#325b48]" />
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
            <div className="rounded-[28px] border border-[#d6ded5] bg-white p-6 shadow-sm">
              <p className="text-[12px] font-black uppercase tracking-[0.34em] text-[#7b8c80]">Matched Type</p>
              <div className="mt-5 space-y-3">
                {Object.entries(report.matchedTypeCounts).map(([key, value]) => (
                  <div key={key} className="flex items-center justify-between rounded-2xl border border-[#e3ebe2] bg-[#f8fbf8] px-4 py-4">
                    <span className="text-sm font-semibold text-slate-700">{key}</span>
                    <span className="text-lg font-black text-[#203126]">{value}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[28px] border border-[#d6ded5] bg-white p-6 shadow-sm">
              <p className="text-[12px] font-black uppercase tracking-[0.34em] text-[#7b8c80]">Top câu hỏi chưa match</p>
              <div className="mt-5 space-y-3">
                {report.topUnmatchedQuestions.map((item) => (
                  <div key={`${item.question}-${item.count}`} className="rounded-2xl border border-[#e3ebe2] bg-[#f8fbf8] px-4 py-4">
                    <p className="text-sm font-semibold leading-6 text-slate-900">{item.question}</p>
                    <p className="mt-2 text-xs font-bold uppercase tracking-[0.2em] text-[#708275]">
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
    <div className="rounded-[28px] border border-[#d6ded5] bg-white p-6 shadow-sm">
      <p className="text-[12px] font-black uppercase tracking-[0.3em] text-[#7e8d82]">{label}</p>
      <p className="mt-4 text-4xl font-black text-[#203126]">{value}</p>
    </div>
  );
}
