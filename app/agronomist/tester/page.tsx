"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Loader2, Send } from "lucide-react";
import { aiKnowledgeService } from "@/app/services/aiKnowledge.service";
import { PermissionGuard } from "@/components/auth/PermissionGuard";
import { P } from "@/lib/permissions";

export default function AgronomistTesterPage() {
  return (
    <PermissionGuard permission={P.AI_KNOWLEDGE_APPROVE}>
      <AgronomistTesterContent />
    </PermissionGuard>
  );
}

function AgronomistTesterContent() {
  const [message, setMessage] = useState("");

  const testChatMutation = useMutation({
    mutationFn: () => aiKnowledgeService.testChat(message),
  });

  const canSubmit = message.trim().length > 0 && !testChatMutation.isPending;

  return (
    <div className="space-y-5">
      <section className="mt-2 px-1">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-2">
            <h1 className="text-[20px] font-semibold uppercase tracking-tight text-slate-900">
              Chat thử nghiệm
            </h1>
            <p className="text-[13px] leading-6 text-slate-500">
              Nhập câu hỏi để xem AI trả lời trước khi dùng thật.
            </p>
          </div>
          <button
            type="button"
            onClick={() => testChatMutation.mutate()}
            disabled={!canSubmit}
            className="inline-flex h-[38px] items-center justify-center gap-1.5 rounded-[4px] bg-blue-600 px-4 text-[13px] font-medium text-white shadow-sm transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            {testChatMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            Chạy thử
          </button>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[0.86fr,1.14fr]">
        <div className="rounded-[4px] border border-[#dcdcdc] bg-white p-4 shadow-sm">
          <label className="mb-2 block text-[11px] font-semibold text-slate-500">
            Câu hỏi
          </label>
          <textarea
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            className="min-h-[170px] w-full resize-y rounded-[4px] border border-slate-200 bg-white px-3 py-3 text-[13px] leading-6 text-slate-800 outline-none transition focus:border-blue-500"
            placeholder="Nhập câu hỏi người nuôi..."
          />
          <div className="mt-3 flex items-center justify-between text-[12px] text-slate-400">
            <span>{message.trim().length} ký tự</span>
            {testChatMutation.isError ? <span className="font-medium text-rose-500">Chạy thử thất bại</span> : null}
          </div>
        </div>

        <div className="rounded-[4px] border border-[#dcdcdc] bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-200 bg-[#f8f9fa] px-4 py-3">
            <h2 className="text-[13px] font-semibold text-slate-900">Kết quả</h2>
            <span className="text-[11px] font-medium text-slate-400">
              {testChatMutation.data ? "Đã có phản hồi" : "Chưa chạy"}
            </span>
          </div>

          <div className="min-h-[260px] p-4">
            {testChatMutation.isPending ? (
              <div className="flex min-h-[220px] items-center justify-center">
                <Loader2 className="h-7 w-7 animate-spin text-blue-600" />
              </div>
            ) : testChatMutation.data ? (
              <div
                className="prose prose-sm max-w-none break-words text-[13px] leading-6 prose-p:my-2 prose-p:text-slate-700 prose-strong:text-slate-900 prose-ul:my-2 prose-li:my-1 [overflow-wrap:anywhere]"
                dangerouslySetInnerHTML={{ __html: testChatMutation.data.reply }}
              />
            ) : (
              <div className="flex min-h-[220px] items-center justify-center rounded-[4px] border border-dashed border-slate-200 bg-slate-50 text-[13px] font-medium text-slate-400">
                Kết quả sẽ hiển thị tại đây.
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
