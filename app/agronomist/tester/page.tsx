"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Loader2, MessageSquareDashed, Send } from "lucide-react";
import { aiKnowledgeService } from "@/app/services/aiKnowledge.service";

export default function AgronomistTesterPage() {
  const [message, setMessage] = useState("");

  const testChatMutation = useMutation({
    mutationFn: () => aiKnowledgeService.testChat(message),
  });

  return (
    <div className="grid gap-6 xl:grid-cols-[0.9fr,1.1fr]">
      <section className="rounded-[28px] border border-[#d6ded5] bg-white p-6 shadow-sm">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#e7f0e9]">
            <MessageSquareDashed className="h-5 w-5 text-[#325b48]" />
          </div>
          <div>
            <p className="text-[12px] font-black uppercase tracking-[0.34em] text-[#7b8c80]">Internal Tester</p>
            <h3 className="mt-2 text-2xl font-black text-[#203126]">Kiểm thử câu trả lời trước khi publish</h3>
            <p className="mt-2 text-sm leading-7 text-slate-600">
              Gõ đúng câu hỏi người nuôi thường hỏi để xem engine deterministic sẽ chọn knowledge nào.
            </p>
          </div>
        </div>

        <div className="mt-6">
          <p className="mb-2 text-[11px] font-black uppercase tracking-[0.24em] text-[#738676]">Câu hỏi thử</p>
          <textarea
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            className="min-h-[200px] w-full rounded-[24px] border border-[#d7dfd8] bg-white px-4 py-4 text-sm text-slate-800 outline-none transition focus:border-[#335848]"
            placeholder="Ví dụ: Tôm có đốm trắng trên vỏ và giảm ăn thì xử lý thế nào?"
          />
        </div>

        <button
          onClick={() => testChatMutation.mutate()}
          className="mt-5 inline-flex items-center gap-2 rounded-2xl bg-[#2f4e3f] px-4 py-3 text-sm font-bold text-white transition-colors hover:bg-[#274338]"
        >
          {testChatMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          Chạy test
        </button>
      </section>

      <section className="rounded-[28px] border border-[#d6ded5] bg-white p-6 shadow-sm">
        <p className="text-[12px] font-black uppercase tracking-[0.34em] text-[#7b8c80]">Bot Output</p>
        <div className="mt-5 min-h-[360px] rounded-[24px] border border-[#dfe6dd] bg-[#f8fbf8] p-5">
          {testChatMutation.isPending ? (
            <div className="flex h-full min-h-[300px] items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-[#325b48]" />
            </div>
          ) : testChatMutation.data ? (
            <div
              className="prose prose-sm max-w-none prose-p:text-slate-700 prose-strong:text-slate-900"
              dangerouslySetInnerHTML={{ __html: testChatMutation.data.reply }}
            />
          ) : (
            <div className="flex h-full min-h-[300px] items-center justify-center text-sm text-slate-400">
              Chưa có kết quả test.
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
