"use client";

import Link from "next/link";
import { MessageCircleMore, Send, Sparkles, Stethoscope, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { aiDoctorService } from "@/app/services/aiDoctor.service";
import type { AiDoctorPrompt } from "@/app/types/ai-doctor.types";

type WidgetMessage = {
  id: string;
  role: "bot" | "user";
  html: string;
};

export default function AIChatButton() {
  const pathname = usePathname();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isBootstrapping, setIsBootstrapping] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<WidgetMessage[]>([]);
  const [prompts, setPrompts] = useState<AiDoctorPrompt[]>([]);

  const shouldHideOnPath = useMemo(
    () =>
      ["/admin", "/login", "/signup", "/reset-password", "/advisor", "/chat", "/agronomist"].some((path) =>
        pathname?.startsWith(path),
      ),
    [pathname],
  );

  useEffect(() => {
    if (!isOpen || messages.length > 0) return;

    let mounted = true;
    setIsBootstrapping(true);

    Promise.all([aiDoctorService.getPrompts(), aiDoctorService.chat("")])
      .then(([promptData, greeting]) => {
        if (!mounted) return;
        setPrompts(promptData);
        setMessages([
          {
            id: "greeting",
            role: "bot",
            html: greeting.reply,
          },
        ]);
      })
      .finally(() => {
        if (mounted) {
          setIsBootstrapping(false);
        }
      });

    return () => {
      mounted = false;
    };
  }, [isOpen, messages.length]);

  useEffect(() => {
    function handlePointerDown(event: MouseEvent | TouchEvent) {
      if (!containerRef.current) return;
      if (containerRef.current.contains(event.target as Node)) return;
      setIsOpen(false);
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("touchstart", handlePointerDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("touchstart", handlePointerDown);
    };
  }, []);

  if (shouldHideOnPath) {
    return null;
  }

  const sendMessage = async (message: string) => {
    const trimmedMessage = message.trim();
    if (!trimmedMessage || isSending) return;

    setMessages((current) => [
      ...current,
      {
        id: `user-${Date.now()}`,
        role: "user",
        html: trimmedMessage,
      },
    ]);
    setInput("");
    setIsSending(true);

    try {
      const response = await aiDoctorService.chat(trimmedMessage);
      setMessages((current) => [
        ...current,
        {
          id: `bot-${Date.now()}`,
          role: "bot",
          html: response.reply,
        },
      ]);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div ref={containerRef} className="fixed bottom-5 right-4 z-50 flex flex-col items-end gap-4 md:bottom-6 md:right-6">
      {isOpen ? (
        <div className="w-[min(92vw,390px)] overflow-hidden rounded-[28px] border border-[#d9e0da] bg-white shadow-[0_30px_80px_rgba(24,39,29,0.16)]">
          <div className="flex items-start justify-between gap-3 border-b border-[#e8eee9] bg-[#f5f8f4] px-5 py-4">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.32em] text-[#6d7f70]">
                AgriShrimp AI Doctor
              </p>
              <h3 className="mt-2 text-lg font-black text-[#1f3125]">Tư vấn bệnh tôm an toàn</h3>
              <p className="mt-1 text-xs leading-5 text-slate-500">
                Chỉ trả lời từ tri thức đã duyệt, không suy đoán tự do.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="rounded-full bg-white p-2 text-slate-500 transition-colors hover:bg-slate-100"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="max-h-[420px] space-y-3 overflow-y-auto bg-white px-4 py-4">
            {isBootstrapping ? (
              <div className="rounded-2xl bg-[#f6faf6] px-4 py-3 text-sm text-slate-500">
                Đang mở tri thức tư vấn...
              </div>
            ) : null}

            {messages.map((message) => (
              <div
                key={message.id}
                className={message.role === "bot" ? "mr-10" : "ml-10 flex justify-end"}
              >
                <div
                  className={
                    message.role === "bot"
                      ? "prose prose-sm max-w-none rounded-[22px] rounded-bl-md bg-[#f5f8f4] px-4 py-3 text-slate-700 shadow-sm prose-p:my-2 prose-strong:text-[#1f3125] prose-li:my-1"
                      : "rounded-[22px] rounded-br-md bg-[#2f4e3f] px-4 py-3 text-sm text-white shadow-sm"
                  }
                  dangerouslySetInnerHTML={{ __html: message.html }}
                />
              </div>
            ))}

            {prompts.length > 0 ? (
              <div className="rounded-2xl border border-[#e4ebe2] bg-[#fafcf9] p-3">
                <div className="mb-2 flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.24em] text-[#6f8174]">
                  <Sparkles className="h-3.5 w-3.5" />
                  Câu hỏi phổ biến
                </div>
                <div className="flex flex-wrap gap-2">
                  {prompts.slice(0, 6).map((prompt) => (
                    <button
                      key={prompt.id}
                      onClick={() => sendMessage(prompt.question)}
                      className="rounded-full border border-[#dce6dd] bg-white px-3 py-2 text-left text-xs font-semibold text-slate-700 transition-colors hover:bg-[#f4f8f4]"
                    >
                      {prompt.question}
                    </button>
                  ))}
                </div>
              </div>
            ) : null}
          </div>

          <div className="border-t border-[#e8eee9] bg-[#fbfcfb] px-4 py-4">
            <div className="mb-3 flex gap-2">
              <Link
                href="/ai-doctor"
                className="inline-flex items-center gap-2 rounded-full border border-[#d2ddd3] bg-white px-3 py-2 text-xs font-bold text-[#2f4e3f] transition-colors hover:bg-[#f4f8f4]"
              >
                <Stethoscope className="h-3.5 w-3.5" />
                Gửi ảnh bệnh
              </Link>
            </div>
            <div className="flex items-end gap-3">
              <textarea
                value={input}
                onChange={(event) => setInput(event.target.value)}
                placeholder="Hỏi dấu hiệu, tên bệnh, phác đồ đã duyệt..."
                className="min-h-[48px] flex-1 resize-none rounded-3xl border border-[#d7dfd8] bg-white px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-[#335848]"
              />
              <button
                type="button"
                disabled={!input.trim() || isSending}
                onClick={() => sendMessage(input)}
                className="rounded-full bg-[#2f4e3f] p-3 text-white transition-colors hover:bg-[#274338] disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Send className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <button
        type="button"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((current) => !current)}
        className="group flex items-center gap-3 rounded-full bg-[#2f4e3f] px-4 py-3 text-white shadow-[0_18px_40px_rgba(32,49,37,0.25)] transition-colors hover:bg-[#274338]"
      >
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-[#2f4e3f]">
          <MessageCircleMore className="h-6 w-6" />
        </span>
        <span className="pr-1 text-left">
          <span className="block text-[11px] font-black uppercase tracking-[0.24em] text-[#cbdbcf]">
            AI Doctor
          </span>
          <span className="block text-sm font-bold">Hỏi nhanh bệnh tôm</span>
        </span>
      </button>
    </div>
  );
}
