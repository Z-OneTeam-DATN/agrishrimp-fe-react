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
const MAX_STORED_PREVIEW_EDGE = 960;
const STORED_PREVIEW_QUALITY = 0.82;

type SubmittedMessage = {
  previewUrl?: string | null;
  symptoms: string;
};

type DiagnosePayload = {
  image: File;
  userSymptoms?: string;
  clientPreviewUrl?: string;
};

const createPersistentPreview = async (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();

    reader.onerror = () => reject(new Error("Không thể đọc ảnh để lưu preview."));
    reader.onload = () => {
      const fileDataUrl = typeof reader.result === "string" ? reader.result : "";
      if (!fileDataUrl) {
        reject(new Error("Không thể đọc dữ liệu ảnh preview."));
        return;
      }

      const previewImage = new window.Image();
      previewImage.onload = () => {
        const longestEdge = Math.max(previewImage.naturalWidth, previewImage.naturalHeight);
        const scale = longestEdge > MAX_STORED_PREVIEW_EDGE
          ? MAX_STORED_PREVIEW_EDGE / longestEdge
          : 1;
        const canvas = document.createElement("canvas");
        canvas.width = Math.max(1, Math.round(previewImage.naturalWidth * scale));
        canvas.height = Math.max(1, Math.round(previewImage.naturalHeight * scale));

        const context = canvas.getContext("2d");
        if (!context) {
          resolve(fileDataUrl);
          return;
        }

        context.drawImage(previewImage, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", STORED_PREVIEW_QUALITY));
      };
      previewImage.onerror = () => resolve(fileDataUrl);
      previewImage.src = fileDataUrl;
    };

    reader.readAsDataURL(file);
  });

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
  const [assistantMessage, setAssistantMessage] = useState<string | null>(null);

  const quickSymptoms = [
    "Tôm bơi lờ đờ, tấp mé",
    "Thân tôm đỏ hoặc có đốm trắng",
    "Đường ruột tôm đứt khúc, trống ruột",
    "Gan tụy teo, đổi màu",
    "Tôm bị mềm vỏ, khó lột",
    "Đuôi tôm bị xòe, tưa đuôi"
  ];

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [previewUrl, symptoms, result, assistantMessage]);

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
    mutationFn: ({ image, userSymptoms }: DiagnosePayload) =>
      aiDoctorService.diagnose(image, userSymptoms),
    onSuccess: (data, variables) => {
      const hydratedDiagnosis = variables.clientPreviewUrl
        ? (aiDoctorService.saveClientImage(data.diagnosisId, variables.clientPreviewUrl) ?? {
            ...data,
            clientImageUrl: variables.clientPreviewUrl,
          })
        : data;

      setAssistantMessage(null);
      setResult(hydratedDiagnosis);
      setSelectedImage(null);
      setPreviewUrl(null);
      setSymptoms("");
      toast.success("Bác sĩ đã có kết quả rồi đây!");
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
      toast.error("Ảnh nặng quá (hơn 10MB). Bà con hãy chọn ảnh nhẹ hơn nhé.");
      return;
    }

    if (previewUrl?.startsWith("blob:")) {
      URL.revokeObjectURL(previewUrl);
    }

    setSelectedImage(file);
    setPreviewUrl(URL.createObjectURL(file));
    setAssistantMessage(null);
    setResult(null);
    event.target.value = "";
  };

  const handleDiagnose = async () => {
    const currentSymptoms = symptoms.trim();

    if (!selectedImage && !currentSymptoms) {
      toast.error("Bà con hãy nhập dấu hiệu hoặc gửi ảnh tôm để bác sĩ hỗ trợ nhé.");
      return;
    }

    if (!selectedImage || !previewUrl) {
      setResult(null);
      setSubmittedMessage((current) => {
        if (current?.previewUrl?.startsWith("blob:")) {
          URL.revokeObjectURL(current.previewUrl);
        }

        return {
          previewUrl: null,
          symptoms: currentSymptoms,
        };
      });
      setAssistantMessage(
        "Bác sĩ đã ghi nhận các dấu hiệu bà con mô tả. Tuy nhiên để xác định bệnh chính xác hơn và chỉ rõ vùng tổn thương trên tôm, bà con vui lòng gửi thêm một ảnh chụp rõ con tôm. Có ảnh thì bác sĩ sẽ chẩn đoán chuẩn hơn nhiều.",
      );
      setSymptoms("");
      return;
    }

    const currentImage = selectedImage;
    const currentPreviewUrl = previewUrl;
    let clientPreviewUrl: string | undefined;

    try {
      clientPreviewUrl = await createPersistentPreview(currentImage);
    } catch {
      clientPreviewUrl = undefined;
    }

    setResult(null);
    setAssistantMessage(null);
    setSubmittedMessage((current) => {
      // Chỉ revoke nếu là blob URL cũ và khác với cái đang dùng
      if (current?.previewUrl?.startsWith("blob:") && current.previewUrl !== currentPreviewUrl) {
        URL.revokeObjectURL(current.previewUrl);
      }

      return {
        // Ưu tiên dùng clientPreviewUrl (base64) để ảnh không bị mất khi revoke blob
        previewUrl: clientPreviewUrl || currentPreviewUrl,
        symptoms: currentSymptoms,
      };
    });

    setSelectedImage(null);
    setPreviewUrl(null);
    setSymptoms("");

    diagnoseMutation.mutate({
      image: currentImage,
      userSymptoms: currentSymptoms || undefined,
      clientPreviewUrl,
    });
  };

  const removeImage = () => {
    if (previewUrl?.startsWith("blob:")) {
      URL.revokeObjectURL(previewUrl);
    }

    setPreviewUrl(null);
    setSelectedImage(null);
  };

  const openReport = () => {
    if (!result?.diagnosisId) return;
    router.push(`/ai-doctor/result?id=${result.diagnosisId}`);
  };

  const handleQuickSymptom = (symptom: string) => {
    setSymptoms((prev) => (prev ? `${prev}, ${symptom.toLowerCase()}` : symptom));
  };

  return (
    <div className="min-h-screen bg-[#e9efeb]">
      <div className="flex min-h-screen w-full flex-col bg-[#f6f8f7] shadow-[0_24px_80px_rgba(28,55,46,0.12)]">
        <div className="sticky top-0 z-20 flex items-center gap-3 border-b border-emerald-900/10 bg-[#376E60] px-4 py-3 shadow-md">
          <Link href="/" className="text-white transition-opacity hover:opacity-80">
            <ChevronLeft size={28} />
          </Link>

          <div className="relative h-[42px] w-[42px] overflow-hidden rounded-full border-2 border-white bg-white">
            <Image
              src="/images/logo_arishrimp.jpg"
              alt="Bác sĩ Tôm"
              fill
              className="object-cover"
            />
          </div>

          <div className="min-w-0 flex-1">
            <h1 className="truncate text-base font-bold text-white">
              Bác sĩ Tôm AgriShrimp
            </h1>
            <div className="flex items-center gap-1.5 text-[11px] text-white/90">
              <span className="block h-2 w-2 rounded-full bg-green-400" />
              Tư vấn chẩn đoán bệnh tôm 24/7
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
              Chào bà con {user?.displayName || user?.fullName || "mình"}! Tôi là Bác sĩ Tôm. 🦐
              <br /><br />
              Bà con hãy gửi cho tôi 1 tấm ảnh chụp rõ tôm bị bệnh và kể thêm các dấu hiệu lạ thấy trong ao. Tôi sẽ giúp bà con nhận diện bệnh và đưa ra cách chữa trị hiệu quả nhất nhé!
            </div>
          </div>

          {!previewUrl && !submittedMessage && !result && !assistantMessage && (
            <div className="ml-auto max-w-[88%] rounded-[22px] rounded-br-md border border-dashed border-emerald-700/30 bg-emerald-50 px-5 py-6 text-center shadow-sm">
              <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-white text-[#376E60] shadow-sm">
                <ImageIcon size={24} />
              </div>
              <p className="mb-2 text-sm font-bold text-emerald-900">
                Gửi ảnh tôm để bác sĩ khám bệnh
              </p>
              <p className="mb-4 text-xs text-emerald-800/70">
                Bà con hãy chọn ảnh chụp tôm rõ nét để bác sĩ nhìn được chuẩn xác nhất.
              </p>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex h-11 items-center gap-2 rounded-full bg-[#376E60] px-5 text-sm font-bold text-white transition-colors hover:bg-[#2f5c50]"
              >
                <PlusCircle size={18} />
                Chụp hoặc Chọn ảnh
              </button>
            </div>
          )}

          {submittedMessage && (
            <div className="ml-auto flex max-w-[88%] flex-col items-end gap-2">
              {submittedMessage.previewUrl && (
                <div className="overflow-hidden rounded-2xl border-[3px] border-emerald-100 bg-white shadow-sm">
                  <div className="relative w-[260px] max-w-full">
                    <Image
                      src={submittedMessage.previewUrl}
                      alt="Ảnh tôm bà con gửi"
                      width={260}
                      height={220}
                      className="h-auto w-full object-cover"
                      unoptimized
                    />
                  </div>
                </div>
              )}

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
                  Bác sĩ đang xem ảnh, bà con đợi xíu nhé...
                </div>
                <p className="text-xs text-gray-500">
                  Hệ thống đang phân tích các dấu hiệu bệnh và tìm cách chữa trị tốt nhất cho ao nhà mình.
                </p>
              </div>
            </div>
          )}

          {assistantMessage && !diagnoseMutation.isPending && !result && (
            <div className="flex max-w-full justify-start gap-2.5 pr-12">
              <div className="relative mt-1 h-8 w-8 shrink-0 overflow-hidden rounded-full">
                <Image
                  src="/images/logo_arishrimp.jpg"
                  alt="AI"
                  fill
                  className="object-cover"
                />
              </div>

              <div className="max-w-[78%] rounded-[18px] rounded-bl-md bg-white px-4 py-3 text-sm leading-relaxed text-gray-700 shadow-sm">
                {assistantMessage}
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

              {result.status === "HEALTHY" ? (
                <div className="max-w-[78%] overflow-hidden rounded-2xl border border-green-200 bg-white shadow-lg">
                  <div className="flex items-center gap-2 border-b border-green-100 bg-green-50 px-4 py-2.5">
                    <span className="text-xl">🦐</span>
                    <span className="text-[13px] font-bold text-green-700">
                      TÔM KHỎE MẠNH
                    </span>
                  </div>
                  {(result.imageUrl || result.clientImageUrl) && (
                    <div className="relative h-[220px] w-full bg-green-50">
                      <Image
                        src={result.imageUrl || result.clientImageUrl || ""}
                        alt="Ảnh tôm đã được AI phân tích"
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    </div>
                  )}
                  <div className="p-4 text-[13px] leading-relaxed text-gray-600">
                    Bác sĩ không thấy dấu hiệu bệnh gì lạ trên ảnh này. Bà con cứ yên tâm tiếp tục chăm sóc ao thật tốt nhé!
                  </div>
                </div>
              ) : (
                <div className="flex max-w-[78%] flex-col gap-2">
                  <div className="overflow-hidden rounded-2xl border border-red-100 bg-white shadow-lg">
                    <div className="flex items-center justify-between border-b border-red-100 bg-red-50 px-4 py-2.5">
                      <span className="flex items-center gap-1.5 text-[13px] font-bold text-red-600">
                        <ShieldAlert size={14} />
                        KẾT QUẢ KHÁM BỆNH
                      </span>
                      <span className="rounded-full bg-white px-2 py-1 text-[11px] font-semibold text-red-500">
                        {Number(result.disease?.confidencePercent || 0).toFixed(0)}% tin cậy
                      </span>
                    </div>

                    <div className="space-y-3 p-4">
                      {(result.imageUrl || result.clientImageUrl) && (
                        <div className="overflow-hidden rounded-xl border border-red-100 bg-slate-50">
                          <div className="relative h-[220px] w-full">
                            <Image
                              src={result.imageUrl || result.clientImageUrl || ""}
                              alt={result.disease?.nameVi ?? "Ảnh tôm đã được AI phân tích"}
                              fill
                              className="object-cover"
                              unoptimized
                            />
                          </div>
                        </div>
                      )}

                      <div>
                        <h3 className="mb-1 text-[15px] font-extrabold uppercase text-red-600">
                          {result.disease?.nameVi}
                        </h3>
                      </div>

                      <p className="text-[13px] leading-relaxed text-gray-600">
                        {result.signsSummary ||
                          "Bác sĩ đã xem xong, bà con nhấn vào nút bên dưới để xem cách chữa trị chi tiết nhé."}
                      </p>

                      {result.causes && result.causes.length > 0 && (
                        <div className="rounded-xl bg-amber-50 px-3 py-2 text-[12px] text-amber-900">
                          <div className="mb-1 flex items-center gap-1 font-bold">
                            <AlertTriangle size={13} />
                            Nguyên nhân chính
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
                        Xem cách chữa trị ngay
                        <ArrowRight size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          <div ref={chatEndRef} />
        </div>

        <div className="sticky bottom-0 border-t border-gray-200 bg-white px-4 py-3 shadow-[0_-8px_24px_rgba(0,0,0,0.04)]">
          {!previewUrl && symptoms.length === 0 && !diagnoseMutation.isPending && (
            <div className="mb-3 flex flex-wrap gap-2">
              {quickSymptoms.map((s) => (
                <button
                  key={s}
                  onClick={() => handleQuickSymptom(s)}
                  className="rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1.5 text-[11px] font-medium text-emerald-800 transition-colors hover:bg-emerald-100"
                >
                  {s}
                </button>
              ))}
            </div>
          )}

          {previewUrl && (
            <div className="mb-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-3">
              <div className="mb-2 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold uppercase tracking-wide text-[#376E60]">
                    Ảnh bà con đính kèm
                  </div>
                </div>
                <button
                  onClick={removeImage}
                  className="rounded-full bg-white p-1.5 text-gray-500 transition-colors hover:bg-red-500 hover:text-white"
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
                    {selectedImage?.name || "Ảnh tôm khám bệnh"}
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="flex items-end gap-3">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="mb-3 text-[#376E60]"
              title="Chọn ảnh"
            >
              <PlusCircle size={26} />
            </button>

            <div className="flex-1 rounded-3xl border border-gray-200 bg-gray-50 px-4 py-3">
              <textarea
                value={symptoms}
                onChange={(event) => setSymptoms(event.target.value.slice(0, 300))}
                placeholder="Kể bệnh: tôm bỏ ăn, nổi đầu, có đốm trắng..."
                className="min-h-[48px] w-full resize-none bg-transparent text-sm text-gray-800 outline-none"
              />
              <div className="mt-1 flex items-center justify-between text-[11px] text-gray-400">
                <span className="inline-flex items-center gap-1">
                  <Sparkles size={12} />
                  Gửi ảnh để bác sĩ xem bệnh kỹ hơn
                </span>
                <span>{symptoms.length}/300</span>
              </div>
            </div>

            <button
              onClick={handleDiagnose}
              disabled={diagnoseMutation.isPending}
              className="mb-1 rounded-full bg-[#376E60] p-3 text-white transition-colors hover:bg-[#2f5c50] disabled:cursor-not-allowed disabled:opacity-60"
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
