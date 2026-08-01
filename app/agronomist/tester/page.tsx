"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Loader2, Send } from "lucide-react";
import { aiKnowledgeService } from "@/app/services/aiKnowledge.service";
import { PermissionGuard } from "@/components/auth/PermissionGuard";
import {
  AgronomistPageHeader,
  AgronomistPanel,
  agronomistPrimaryButtonClassName,
  agronomistTextareaClassName,
} from "@/components/agronomist/agronomist-ui";
import { P } from "@/lib/permissions";
import { cn } from "@/lib/utils";

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
      <AgronomistPageHeader
        title="Chat thử nghiệm"
        actions={
          <button
            type="button"
            onClick={() => testChatMutation.mutate()}
            disabled={!canSubmit}
            className={agronomistPrimaryButtonClassName}
          >
            {testChatMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
            Chạy thử
          </button>
        }
      />

      <section className="grid gap-4 xl:grid-cols-[0.86fr,1.14fr]">
        <AgronomistPanel className="p-4">
          <label className="mb-2 block text-[12px] font-semibold text-[#232323]">
            Câu hỏi
          </label>
          <textarea
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            className={cn(
              agronomistTextareaClassName,
              "min-h-[170px] w-full resize-y px-3 py-3",
            )}
            placeholder="Nhập câu hỏi người nuôi..."
          />
          <div className="mt-3 flex items-center justify-between text-[12px] text-slate-400">
            <span>{message.trim().length} ký tự</span>
            {testChatMutation.isError ? (
              <span className="font-medium text-rose-500">
                Chạy thử thất bại
              </span>
            ) : null}
          </div>
        </AgronomistPanel>

        <AgronomistPanel>
          <div className="flex items-center justify-between border-b border-[#e8ebf1] bg-[#f0f1f3] px-4 py-3">
            <h2 className="text-[13px] font-semibold uppercase text-[#232323]">
              Kết quả
            </h2>
            <span className="text-[11px] font-medium text-slate-400">
              {testChatMutation.data ? "Đã có phản hồi" : "Chưa chạy"}
            </span>
          </div>

          <div className="min-h-[260px] p-4">
            {testChatMutation.isPending ? (
              <div className="flex min-h-[220px] items-center justify-center">
                <Loader2 className="h-7 w-7 animate-spin text-[#252896]" />
              </div>
            ) : testChatMutation.data ? (
              <div
                className="prose prose-sm max-w-none break-words text-[13px] leading-6 prose-p:my-2 prose-p:text-slate-700 prose-strong:text-slate-900 prose-ul:my-2 prose-li:my-1 [overflow-wrap:anywhere]"
                dangerouslySetInnerHTML={{
                  __html: testChatMutation.data.reply,
                }}
              />
            ) : (
              <div className="flex min-h-[220px] items-center justify-center rounded-[4px] border border-dashed border-[#d5d8e5] bg-[#f7f8fa] text-[13px] font-medium text-slate-400">
                Kết quả sẽ hiển thị tại đây.
              </div>
            )}
          </div>
        </AgronomistPanel>
      </section>
    </div>
  );
}
