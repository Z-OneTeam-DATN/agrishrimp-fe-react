"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { RichTextEditor } from "@/components/admin/shared/RichTextEditor";
import { aiKnowledgeService } from "@/app/services/aiKnowledge.service";
import type { AiKnowledgeChatConfig } from "@/app/types/ai-knowledge.types";

const DEFAULT_CHAT_CONFIG: AiKnowledgeChatConfig = {
  id: 1,
  greetingMessage: "",
  fallbackMessage: "",
  fallbackContactName: "",
  fallbackContactPhone: "",
};

export default function AdminAiKnowledgeChatbotPage() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<AiKnowledgeChatConfig>(DEFAULT_CHAT_CONFIG);

  const configQuery = useQuery({
    queryKey: ["ai-knowledge", "config"],
    queryFn: () => aiKnowledgeService.getConfig(),
  });

  useEffect(() => {
    if (configQuery.data) {
      setForm(configQuery.data);
    }
  }, [configQuery.data]);

  const configMutation = useMutation({
    mutationFn: () =>
      aiKnowledgeService.updateConfig({
        greetingMessage: form.greetingMessage,
        fallbackMessage: form.fallbackMessage,
        fallbackContactName: form.fallbackContactName,
        fallbackContactPhone: form.fallbackContactPhone,
      }),
    onSuccess: async () => {
      toast.success("Đã cập nhật cấu hình chatbot.");
      await queryClient.invalidateQueries({ queryKey: ["ai-knowledge", "config"] });
    },
    onError: (error: any) => toast.error(error?.message || "Không thể cập nhật cấu hình."),
  });

  return (
    <div className="space-y-6">
      <h1 className="text-[20px] font-semibold uppercase text-slate-900">Chatbot mở đầu</h1>

      <div className="rounded-[4px] border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm leading-6 text-slate-500">
          Fallback mặc định chỉ hiện khi AI không tư vấn được (mất kết nối/chưa cấu hình Gemini).
          Khi không khớp bệnh nào đã duyệt nhưng AI vẫn tư vấn tự do được, hệ thống tự thêm dòng
          khuyến cáo kèm tên/SĐT kỹ sư bên dưới vào cuối câu trả lời — không dùng làm phác đồ chính
          thức.
        </p>

        <div className="mt-5 grid gap-5 lg:grid-cols-2">
          <div>
            <RichTextEditor
              key="greeting-config"
              label="Tin chào mở đầu"
              placeholder="Nhập câu chào khi người dùng mở widget..."
              value={form.greetingMessage}
              onChange={(value) => setForm((current) => ({ ...current, greetingMessage: value }))}
              minHeight="180px"
            />
          </div>
          <div>
            <RichTextEditor
              key="fallback-config"
              label="Fallback mặc định"
              placeholder="Nhập câu fallback khi không đủ tri thức..."
              value={form.fallbackMessage}
              onChange={(value) => setForm((current) => ({ ...current, fallbackMessage: value }))}
              minHeight="180px"
            />
          </div>
        </div>

        <div className="mt-5 grid gap-5 lg:grid-cols-2">
          <div>
            <label className="text-sm font-medium text-slate-700">Tên kỹ sư liên hệ mặc định</label>
            <input
              type="text"
              value={form.fallbackContactName ?? ""}
              onChange={(event) =>
                setForm((current) => ({ ...current, fallbackContactName: event.target.value }))
              }
              placeholder="VD: Kỹ sư Nam"
              className="mt-1.5 w-full rounded-md border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700">SĐT kỹ sư liên hệ mặc định</label>
            <input
              type="text"
              value={form.fallbackContactPhone ?? ""}
              onChange={(event) =>
                setForm((current) => ({ ...current, fallbackContactPhone: event.target.value }))
              }
              placeholder="VD: 0909123456"
              className="mt-1.5 w-full rounded-md border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500"
            />
          </div>
        </div>

        <div className="mt-5">
          <button
            onClick={() => configMutation.mutate()}
            disabled={configMutation.isPending}
            className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Cập nhật cấu hình chatbot
          </button>
        </div>
      </div>
    </div>
  );
}
