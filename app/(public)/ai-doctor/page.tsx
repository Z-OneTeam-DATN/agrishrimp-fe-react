"use client";

import { ChangeEvent, useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import {
  AlertTriangle,
  ArrowRight,
  ChevronLeft,
  ImageIcon,
  Loader2,
  MoreVertical,
  PlusCircle,
  Send,
  ShieldAlert,
  Sparkles,
  XCircle,
} from "lucide-react";
import { AxiosError } from "axios";
import { toast } from "sonner";

import { aiDoctorService } from "@/app/services/aiDoctor.service";
import type { AiDoctorDiagnosisResponse } from "@/app/types/ai-doctor.types";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { getErrorMessage } from "@/lib/axios";

const MAX_IMAGE_SIZE = 10 * 1024 * 1024;

type SubmittedMessage = {
  previewUrl: string;
  symptoms: string;
};

export default function AiDoctorChatPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const latestComposerPreviewRef = useRef<string | null>(null);
  const latestSubmittedPreviewRef = useRef<string | null>(null);
  const { data: user } = useCurrentUser();

  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [symptoms, setSymptoms] = useState("");
  const [result, setResult] = useState<AiDoctorDiagnosisResponse | null>(null);
  const [submittedMessage, setSubmittedMessage] = useState<SubmittedMessage | null>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [previewUrl, symptoms, result]);

  useEffect(() => {
    latestComposerPreviewRef.current = previewUrl;
  }, [previewUrl]);

  useEffect(() => {
    latestSubmittedPreviewRef.current = submittedMessage?.previewUrl ?? null;
  }, [submittedMessage]);

  useEffect(() => {
    return () => {
      if (latestComposerPreviewRef.current?.startsWith("blob:")) {
        URL.revokeObjectURL(latestComposerPreviewRef.current);
      }

      if (
        latestSubmittedPreviewRef.current?.startsWith("blob:") &&
        latestSubmittedPreviewRef.current !== latestComposerPreviewRef.current
      ) {
        URL.revokeObjectURL(latestSubmittedPreviewRef.current);
      }
    };
  }, []);

  const diagnoseMutation = useMutation({
    mutationFn: ({ image, userSymptoms }: { image: File; userSymptoms?: string }) =>
      aiDoctorService.diagnose(image, userSymptoms),
    onSuccess: (data) => {
      setResult(data);
      setSelectedImage(null);
      setPreviewUrl(null);
      setSymptoms("");
      toast.success("Bác sĩ AI đã trả kết quả chẩn đoán.");
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error as AxiosError));

      if ((error as AxiosError)?.response?.status === 401) {
        router.push("/login");
      }
    },
  });

  const handleSelectImage = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Vui lòng chọn file ảnh hợp lệ.");
      return;
    }

    if (file.size > MAX_IMAGE_SIZE) {
      toast.error("Ảnh vượt quá 10MB. Vui lòng chọn ảnh nhỏ hơn.");
      return;
    }

    if (previewUrl?.startsWith("blob:")) {
      URL.revokeObjectURL(previewUrl);
    }

    setSelectedImage(file);
    setPreviewUrl(URL.createObjectURL(file));
    setResult(null);
    event.target.value = "";
  };

  const handleDiagnose = () => {
    if (!selectedImage || !previewUrl) {
      toast.error("Hãy tải ảnh tôm lên trước khi gửi bác sĩ AI.");
      return;
    }

    setResult(null);
    setSubmittedMessage((current) => {
      if (current?.previewUrl?.startsWith("blob:")) {
        URL.revokeObjectURL(current.previewUrl);
      }

      return {
        previewUrl,
        symptoms: symptoms.trim(),
      };
    });

    setSelectedImage(null);
    setPreviewUrl(null);
    setSymptoms("");

    diagnoseMutation.mutate({
      image: selectedImage,
      userSymptoms: symptoms.trim() || undefined,
    });
  };

  const removeImage = () => {
    if (previewUrl?.startsWith("blob:")) {
      URL.revokeObjectURL(previewUrl);
    }

    setPreviewUrl(null);
    setSelectedImage(null);
    setResult(null);
  };

  const openReport = () => {
    if (!result?.diagnosisId) return;
    router.push(`/ai-doctor/result?id=${result.diagnosisId}`);
  };

  return (
    <div className="min-h-screen bg-[#e9efeb]">
      <div className="flex min-h-screen w-full flex-col bg-[#f6f8f7] shadow-[0_24px_80px_rgba(28,55,46,0.12)]">
        <div className="sticky top-0 z-20 flex items-center gap-3 border-b border-emerald-900/10 bg-[#376E60] px-4 py-3 shadow-sm">
          <Link href="/" className="text-white transition-opacity hover:opacity-80">
            <ChevronLeft size={28} />
          </Link>

          <div className="relative h-[42px] w-[42px] overflow-hidden rounded-full border-2 border-white bg-white">
            <Image
              src="/images/logo_arishrimp.jpg"
              alt="Bác sĩ AI"
              fill
              className="object-cover"
            />
          </div>

          <div className="min-w-0 flex-1">
            <h1 className="truncate text-base font-bold text-white">
              Bác sĩ AI AgriShrimp
            </h1>
            <div className="flex items-center gap-1.5 text-[11px] text-white/90">
              <span className="block h-2 w-2 rounded-full bg-green-400" />
              Luồng chẩn đoán trực tiếp từ AI
            </div>
          </div>

          <Link
            href="/ai-doctor/history"
            className="rounded-full bg-white/10 p-2 text-white transition-colors hover:bg-white/15"
          >
            <MoreVertical size={22} />
          </Link>
        </div>

        <div className="flex-1 space-y-5 overflow-y-auto p-4 pb-32">
          <div className="text-center">
            <span className="rounded-full bg-black/5 px-3 py-1 text-[11px] text-gray-500">
              Hôm nay
            </span>
          </div>

          <div className="flex max-w-full justify-start gap-2.5 pr-12">
            <div className="relative mt-1 h-8 w-8 shrink-0 overflow-hidden rounded-full">
              <Image
                src="/images/logo_arishrimp.jpg"
                alt="AI"
                fill
                className="object-cover"
              />
            </div>

            <div className="max-w-[78%] rounded-[18px] rounded-bl-md bg-white px-4 py-3 text-sm leading-relaxed text-gray-800 shadow-sm">
              Xin chào {user?.displayName || user?.fullName || "bạn"}! Hãy gửi ảnh
              tôm bệnh và mô tả thêm triệu chứng nếu có. Tôi sẽ chẩn đoán và trả
              phác đồ điều trị ngay trên web.
            </div>
          </div>

          {!previewUrl && (
            <div className="ml-auto max-w-[88%] rounded-[22px] rounded-br-md border border-dashed border-emerald-700/30 bg-emerald-50 px-5 py-6 text-center shadow-sm">
              <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-white text-[#376E60] shadow-sm">
                <ImageIcon size={24} />
              </div>
              <p className="mb-2 text-sm font-bold text-emerald-900">
                Tải ảnh tôm để bắt đầu hội thoại
              </p>
              <p className="mb-4 text-xs text-emerald-800/70">
                Hỗ trợ JPG, PNG, WEBP. Kích thước tối đa 10MB.
              </p>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex h-11 items-center gap-2 rounded-full bg-[#376E60] px-5 text-sm font-bold text-white transition-colors hover:bg-[#2f5c50]"
              >
                <PlusCircle size={18} />
                Chọn ảnh
              </button>
            </div>
          )}

          {submittedMessage && (
            <div className="ml-auto flex max-w-[88%] flex-col items-end gap-2">
              <div className="overflow-hidden rounded-2xl border-[3px] border-emerald-100 bg-white shadow-sm">
                <div className="relative w-[260px] max-w-full">
                  <Image
                    src={submittedMessage.previewUrl}
                    alt="Ảnh tôm đã gửi"
                    width={260}
                    height={220}
                    className="h-auto w-full object-cover"
                    unoptimized
                  />
                </div>
              </div>

              {submittedMessage.symptoms && (
                <div className="max-w-[88%] rounded-[18px] rounded-br-md bg-[#376E60] px-4 py-3 text-sm leading-relaxed text-white shadow-sm">
                  {submittedMessage.symptoms}
                </div>
              )}
            </div>
          )}

          {diagnoseMutation.isPending && (
            <div className="flex max-w-full justify-start gap-2.5 pr-12">
              <div className="relative mt-1 h-8 w-8 shrink-0 overflow-hidden rounded-full">
                <Image
                  src="/images/logo_arishrimp.jpg"
                  alt="AI"
                  fill
                  className="object-cover"
                />
              </div>

              <div className="max-w-[78%] rounded-[18px] rounded-bl-md bg-white px-4 py-3 text-sm text-gray-700 shadow-sm">
                <div className="mb-2 flex items-center gap-2 font-semibold text-[#376E60]">
                  <Loader2 size={16} className="animate-spin" />
                  Đang phân tích ảnh và sinh phác đồ điều trị...
                </div>
                <p className="text-xs text-gray-500">
                  AI đang gọi luồng chẩn đoán, nhận diện bệnh và chuẩn bị gợi ý sản phẩm.
                </p>
              </div>
            </div>
          )}

          {result && (
            <div className="flex max-w-full justify-start gap-2.5 pr-12">
              <div className="relative mt-1 h-8 w-8 shrink-0 overflow-hidden rounded-full">
                <Image
                  src="/images/logo_arishrimp.jpg"
                  alt="AI"
                  fill
                  className="object-cover"
                />
              </div>

              <div className="flex max-w-[78%] flex-col gap-2">
                <div className="overflow-hidden rounded-2xl border border-red-100 bg-white shadow-lg">
                  <div className="flex items-center justify-between border-b border-red-100 bg-red-50 px-4 py-2.5">
                    <span className="flex items-center gap-1.5 text-[13px] font-bold text-red-600">
                      <ShieldAlert size={14} />
                      KẾT QUẢ CHẨN ĐOÁN
                    </span>
                    <span className="rounded-full bg-white px-2 py-1 text-[11px] font-semibold text-red-500">
                      {Number(result.disease.confidencePercent || 0).toFixed(1)}%
                    </span>
                  </div>

                  <div className="space-y-3 p-4">
                    <div>
                      <h3 className="mb-1 text-[15px] font-extrabold uppercase text-red-600">
                        {result.disease.nameVi}
                      </h3>
                      {result.disease.nameEn && (
                        <p className="text-xs italic text-gray-500">{result.disease.nameEn}</p>
                      )}
                    </div>

                    <p className="text-[13px] leading-relaxed text-gray-600">
                      {result.signsSummary ||
                        "AI đã hoàn tất chẩn đoán, bạn có thể xem báo cáo chi tiết bên dưới."}
                    </p>

                    {result.causes?.length > 0 && (
                      <div className="rounded-xl bg-amber-50 px-3 py-2 text-[12px] text-amber-900">
                        <div className="mb-1 flex items-center gap-1 font-bold">
                          <AlertTriangle size={13} />
                          Nguyên nhân nổi bật
                        </div>
                        <p className="line-clamp-2">{result.causes[0]}</p>
                      </div>
                    )}
                  </div>

                  <div className="border-t border-gray-100 p-3">
                    <button
                      onClick={openReport}
                      className="flex h-12 w-full items-center justify-center gap-1 rounded-xl bg-[#376E60] text-[13px] font-bold uppercase text-white transition-colors hover:bg-[#2f5c50]"
                    >
                      Xem phác đồ chi tiết
                      <ArrowRight size={16} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div ref={chatEndRef} />
        </div>

        <div className="sticky bottom-0 border-t border-gray-200 bg-white px-4 py-3 shadow-[0_-8px_24px_rgba(0,0,0,0.04)]">
          {previewUrl && (
            <div className="mb-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-3">
              <div className="mb-2 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold uppercase tracking-wide text-[#376E60]">
                    Ảnh đính kèm
                  </div>
                  <div className="text-[11px] text-emerald-900/70">
                    Ảnh này sẽ được gửi khi bạn nhấn nút gửi.
                  </div>
                </div>
                <button
                  onClick={removeImage}
                  className="rounded-full bg-white p-1.5 text-gray-500 transition-colors hover:bg-red-500 hover:text-white"
                  title="Xóa ảnh đính kèm"
                >
                  <XCircle size={16} />
                </button>
              </div>

              <div className="flex items-center gap-3">
                <div className="relative h-16 w-16 overflow-hidden rounded-xl border border-white bg-white shadow-sm">
                  <Image
                    src={previewUrl}
                    alt="Ảnh đính kèm"
                    fill
                    className="object-cover"
                    unoptimized
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-semibold text-slate-800">
                    {selectedImage?.name || "Ảnh tôm chẩn đoán"}
                  </div>
                  <div className="mt-1 text-xs text-gray-500">
                    {selectedImage ? `${(selectedImage.size / 1024 / 1024).toFixed(2)} MB` : ""}
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="flex items-end gap-3">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="text-[#376E60]"
              title="Chọn ảnh"
            >
              <PlusCircle size={26} />
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="text-[#376E60]"
              title="Tải ảnh"
            >
              <ImageIcon size={26} />
            </button>

            <div className="flex-1 rounded-3xl border border-gray-200 bg-gray-50 px-4 py-3">
              <textarea
                value={symptoms}
                onChange={(event) => setSymptoms(event.target.value.slice(0, 300))}
                placeholder="Mô tả thêm: tôm bỏ ăn, nổi đầu, có đốm trắng..."
                className="min-h-[48px] w-full resize-none bg-transparent text-sm text-gray-800 outline-none"
              />
              <div className="mt-1 flex items-center justify-between text-[11px] text-gray-400">
                <span className="inline-flex items-center gap-1">
                  <Sparkles size={12} />
                  Gửi ảnh để AI chẩn đoán chính xác hơn
                </span>
                <span>{symptoms.length}/300</span>
              </div>
            </div>

            <button
              onClick={handleDiagnose}
              disabled={diagnoseMutation.isPending}
              className="rounded-full bg-[#376E60] p-3 text-white transition-colors hover:bg-[#2f5c50] disabled:cursor-not-allowed disabled:opacity-60"
              title="Gửi cho bác sĩ AI"
            >
              {diagnoseMutation.isPending ? (
                <Loader2 size={20} className="animate-spin" />
              ) : (
                <Send size={20} />
              )}
            </button>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleSelectImage}
            className="hidden"
          />
        </div>
      </div>
    </div>
  );
}
