"use client";

import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, RefreshCcw, Save } from "lucide-react";
import { toast } from "sonner";
import AdminDataSyncLoader from "@/components/admin/shared/AdminDataSyncLoader";
import { RichTextEditor } from "@/components/admin/shared/RichTextEditor";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { aiKnowledgeService } from "@/app/services/aiKnowledge.service";
import type { AiKnowledgeChatConfig } from "@/app/types/ai-knowledge.types";

const DEFAULT_CHAT_CONFIG: AiKnowledgeChatConfig = {
  id: 1,
  greetingMessage: "",
  fallbackMessage: "",
  fallbackContactName: "",
  fallbackContactPhone: "",
};

function stripHtml(value?: string | null) {
  return (value ?? "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

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
      await queryClient.invalidateQueries({
        queryKey: ["ai-knowledge", "config"],
      });
    },
    onError: (error: any) =>
      toast.error(error?.message || "Không thể cập nhật cấu hình."),
  });

  const stats = useMemo(
    () => [
      {
        title: "Tin chào mở đầu",
        value: stripHtml(form.greetingMessage) ? "Đã cấu hình" : "Chưa có",
        description: "Hiển thị khi người dùng mở chatbot",
      },
      {
        title: "Fallback mặc định",
        value: stripHtml(form.fallbackMessage) ? "Đã cấu hình" : "Chưa có",
        description: "Dùng khi AI không thể tư vấn",
      },
      {
        title: "Kỹ sư liên hệ",
        value: form.fallbackContactName?.trim() || "Chưa gán",
        description: "Thông tin nguồn tư vấn mặc định",
      },
      {
        title: "Số điện thoại",
        value: form.fallbackContactPhone?.trim() || "Chưa gán",
        description: "Liên hệ fallback cho khách hàng",
      },
    ],
    [form],
  );

  return (
    <div className="space-y-4 px-1 pb-8">
      <div className="mb-8 mt-2 space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-[20px] font-semibold uppercase text-slate-900">
            Chatbot mở đầu
          </h1>
          <Button
            type="button"
            variant="outline"
            className="h-[38px] border-slate-200 bg-white px-4 text-[13px] font-medium shadow-none"
            onClick={() => void configQuery.refetch()}
            disabled={configQuery.isFetching}
          >
            <RefreshCcw
              size={15}
              className={configQuery.isFetching ? "mr-2 animate-spin" : "mr-2"}
            />
            Làm mới
          </Button>
        </div>

        <div className="grid grid-cols-1 gap-2.5 md:grid-cols-2 xl:grid-cols-4">
          {stats.map((card) => (
            <div
              key={card.title}
              className="rounded-[4px] border border-[#dcdcdc] bg-white p-3 shadow-sm"
            >
              <p className="text-[11px] font-semibold text-slate-400">
                {card.title}
              </p>
              <div className="mt-3 space-y-1">
                <p className="line-clamp-1 text-[20px] font-semibold leading-none text-slate-900">
                  {card.value}
                </p>
                <p className="text-[10px] leading-4 text-slate-500">
                  {card.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="overflow-hidden rounded-[4px] border border-[#dcdcdc] bg-white shadow-sm">
        {configQuery.isLoading ? (
          <AdminDataSyncLoader message="Đang tải cấu hình" />
        ) : (
          <>
            <div className="border-b border-slate-100 bg-slate-50 px-5 py-3">
              <p className="text-[12px] leading-5 text-slate-500">
                Cấu hình fallback chỉ hiện khi AI không tư vấn được hoặc chưa có
                kết nối. Khi không khớp phác đồ đã duyệt nhưng AI vẫn tư vấn tự
                do, hệ thống sẽ gắn thông tin kỹ sư mặc định vào cuối câu trả
                lời.
              </p>
            </div>

            <div className="space-y-5 p-5">
              <div className="grid gap-5 lg:grid-cols-2">
                <RichTextEditor
                  key={`greeting-config-${configQuery.dataUpdatedAt}`}
                  label="Tin chào mở đầu"
                  placeholder="Nhập câu chào khi người dùng mở widget..."
                  value={form.greetingMessage}
                  onChange={(value) =>
                    setForm((current) => ({
                      ...current,
                      greetingMessage: value,
                    }))
                  }
                  minHeight="180px"
                />
                <RichTextEditor
                  key={`fallback-config-${configQuery.dataUpdatedAt}`}
                  label="Fallback mặc định"
                  placeholder="Nhập câu fallback khi không đủ tri thức..."
                  value={form.fallbackMessage}
                  onChange={(value) =>
                    setForm((current) => ({
                      ...current,
                      fallbackMessage: value,
                    }))
                  }
                  minHeight="180px"
                />
              </div>

              <div className="grid gap-5 lg:grid-cols-2">
                <div>
                  <label className="text-[11px] font-bold uppercase text-slate-500">
                    Tên kỹ sư liên hệ mặc định
                  </label>
                  <Input
                    type="text"
                    value={form.fallbackContactName ?? ""}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        fallbackContactName: event.target.value,
                      }))
                    }
                    placeholder="VD: Kỹ sư Nam"
                    className="mt-1.5 h-[38px] border-slate-200 bg-white text-[13px] shadow-none"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold uppercase text-slate-500">
                    SĐT kỹ sư liên hệ mặc định
                  </label>
                  <Input
                    type="text"
                    value={form.fallbackContactPhone ?? ""}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        fallbackContactPhone: event.target.value,
                      }))
                    }
                    placeholder="VD: 0909123456"
                    className="mt-1.5 h-[38px] border-slate-200 bg-white text-[13px] shadow-none"
                  />
                </div>
              </div>

              <div className="flex justify-end border-t border-slate-100 pt-4">
                <Button
                  type="button"
                  onClick={() => configMutation.mutate()}
                  disabled={configMutation.isPending}
                  className="h-[38px] bg-blue-600 px-4 text-[13px] font-medium hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {configMutation.isPending ? (
                    <Loader2 size={15} className="mr-2 animate-spin" />
                  ) : (
                    <Save size={15} className="mr-2" />
                  )}
                  Cập nhật cấu hình
                </Button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
