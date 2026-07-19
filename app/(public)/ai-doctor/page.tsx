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

// Toàn bộ hội thoại là MỘT danh sách theo thứ tự thời gian — mỗi tin nhắn/gửi ảnh/kết quả là
// một entry được nối vào cuối, không bao giờ bị entry sau ghi đè lên entry trước (khác với thiết
// kế cũ dùng các state rời rạc như "assistantMessage"/"result" chỉ giữ được tin nhắn gần nhất).
type ChatEntry =
  | { id: string; kind: "user"; text?: string; previewUrl?: string | null }
  | { id: string; kind: "bot-html"; html: string }
  | { id: string; kind: "bot-plain"; text: string }
  | { id: string; kind: "bot-result"; diagnosis: AiDoctorDiagnosisResponse };

// Omit<Union, K> collapses to the merged member keys instead of distributing per-variant, which
// breaks the discriminated-union excess-property check on the object literals passed to
// pushEntry() below. This variant distributes over each member of the union first.
type DistributiveOmit<T, K extends keyof any> = T extends unknown ? Omit<T, K> : never;

type ClarifySession = {
  diagnosisId: string;
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
  const entryIdRef = useRef(0);
  const { data: user, isAuthenticated } = useCurrentUser();

  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [symptoms, setSymptoms] = useState("");
  const [entries, setEntries] = useState<ChatEntry[]>([]);
  const [clarifySession, setClarifySession] = useState<ClarifySession | null>(null);

  const nextEntryId = () => `e${entryIdRef.current++}`;
  const pushEntry = (entry: DistributiveOmit<ChatEntry, "id">) =>
    setEntries((prev) => [...prev, { ...entry, id: nextEntryId() } as ChatEntry]);

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
  }, [entries, previewUrl, symptoms]);

  useEffect(() => {
    latestComposerPreviewRef.current = previewUrl;
  }, [previewUrl]);

  useEffect(() => {
    return () => {
      if (latestComposerPreviewRef.current?.startsWith("blob:")) {
        URL.revokeObjectURL(latestComposerPreviewRef.current);
      }
    };
  }, []);

  const chatMutation = useMutation({
    mutationFn: (message: string) => aiDoctorService.chat(message),
    onSuccess: (data) => {
      pushEntry({ kind: "bot-html", html: data.reply });
    },
    onError: () => {
      pushEntry({
        kind: "bot-html",
        html: "Bác sĩ đang bận, bà con vui lòng thử lại sau hoặc gửi ảnh tôm để được hỗ trợ nhanh hơn nhé.",
      });
    },
  });

  const clarifyMutation = useMutation({
    mutationFn: (payload: {
      diagnosisId: string;
      answer?: string;
      candidateDiseaseCodes?: string[];
      imageUrl?: string;
      initialSymptoms?: string;
    }) =>
      aiDoctorService.clarify(payload.diagnosisId, {
        answer: payload.answer,
        candidateDiseaseCodes: payload.candidateDiseaseCodes,
        imageUrl: payload.imageUrl,
        initialSymptoms: payload.initialSymptoms,
      }),
    onSuccess: (data) => {
      if (data.type === "DECISION" && data.diagnosis) {
        setClarifySession(null);
        pushEntry({ kind: "bot-result", diagnosis: data.diagnosis });
        toast.success("Bác sĩ đã có kết quả rồi đây!");
        return;
      }

      pushEntry({ kind: "bot-plain", text: data.message });

      if (data.type === "ESCALATED") {
        setClarifySession(null);
      }
    },
    onError: () => {
      pushEntry({
        kind: "bot-plain",
        text: "Bác sĩ đang bận, bà con vui lòng thử lại sau hoặc mô tả thêm dấu hiệu nhé.",
      });
    },
  });

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

      if (data.needsClarification) {
        setClarifySession({ diagnosisId: data.diagnosisId });
        clarifyMutation.mutate({
          diagnosisId: data.diagnosisId,
          candidateDiseaseCodes: (data.topPredictions ?? []).map((prediction) => prediction.diseaseCode),
          // Chỉ có tác dụng với khách vãng lai (BE ưu tiên history nếu có) — để không mất ảnh/triệu
          // chứng đã gửi trong suốt cuộc hỏi-đáp.
          imageUrl: data.imageUrl || variables.clientPreviewUrl,
          initialSymptoms: variables.userSymptoms,
        });
        return;
      }

      setClarifySession(null);
      pushEntry({ kind: "bot-result", diagnosis: hydratedDiagnosis });
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
    event.target.value = "";
  };

  const handleDiagnose = async () => {
    const currentSymptoms = symptoms.trim();

    if (!selectedImage && !currentSymptoms) {
      toast.error("Bà con hãy nhập dấu hiệu hoặc gửi ảnh tôm để bác sĩ hỗ trợ nhé.");
      return;
    }

    // Đang trong hội thoại làm rõ bệnh và không gửi ảnh mới → trả lời tiếp câu hỏi của bác sĩ AI.
    if (clarifySession && !selectedImage) {
      pushEntry({ kind: "user", text: currentSymptoms });
      setSymptoms("");
      clarifyMutation.mutate({ diagnosisId: clarifySession.diagnosisId, answer: currentSymptoms });
      return;
    }

    // Gửi ảnh mới trong lúc đang hỏi-đáp → coi như khám lại từ đầu, bỏ phiên cũ.
    if (clarifySession && selectedImage) {
      setClarifySession(null);
    }

    if (!selectedImage || !previewUrl) {
      pushEntry({ kind: "user", text: currentSymptoms });
      setSymptoms("");
      chatMutation.mutate(currentSymptoms);
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

    pushEntry({
      kind: "user",
      text: currentSymptoms,
      // Ưu tiên dùng clientPreviewUrl (base64) để ảnh không bị mất khi revoke blob
      previewUrl: clientPreviewUrl || currentPreviewUrl,
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

  const openReport = (diagnosisId?: string) => {
    if (!diagnosisId) return;
    router.push(`/ai-doctor/result?id=${diagnosisId}`);
  };

  const handleQuickSymptom = (symptom: string) => {
    setSymptoms((prev) => (prev ? `${prev}, ${symptom.toLowerCase()}` : symptom));
  };

  return (
    <div className="min-h-screen bg-[#e9efeb]">
      <div className="flex min-h-screen w-full flex-col bg-[#f6f8f7] shadow-[0_24px_80px_rgba(28,55,46,0.12)]">
        <div className="sticky top-0 z-20 flex items-center gap-3 border-b border-blue-900/10 bg-[#376E60] px-4 py-3 shadow-md">
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
              <span className="block h-2 w-2 rounded-full bg-blue-400" />
              Tư vấn chẩn đoán bệnh tôm 24/7
            </div>
          </div>

          <Link
            href={isAuthenticated ? "/ai-doctor/history" : "/ai-doctor"}
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

          {entries.length === 0 && (
            <div className="ml-auto max-w-[88%] rounded-[22px] rounded-br-md border border-dashed border-blue-700/30 bg-blue-50 px-5 py-6 text-center shadow-sm">
              <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-white text-[#376E60] shadow-sm">
                <ImageIcon size={24} />
              </div>
              <p className="mb-2 text-sm font-bold text-blue-900">
                Gửi ảnh tôm để bác sĩ khám bệnh
              </p>
              <p className="mb-4 text-xs text-blue-800/70">
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

          {entries.map((entry) => {
            if (entry.kind === "user") {
              return (
                <div key={entry.id} className="ml-auto flex max-w-[88%] flex-col items-end gap-2">
                  {entry.previewUrl && (
                    <div className="overflow-hidden rounded-2xl border-[3px] border-blue-100 bg-white shadow-sm">
                      <div className="relative w-[260px] max-w-full">
                        <Image
                          src={entry.previewUrl}
                          alt="Ảnh tôm bà con gửi"
                          width={260}
                          height={220}
                          className="h-auto w-full object-cover"
                          unoptimized
                        />
                      </div>
                    </div>
                  )}

                  {entry.text && (
                    <div className="max-w-[88%] rounded-[18px] rounded-br-md bg-[#376E60] px-4 py-3 text-sm leading-relaxed text-white shadow-sm">
                      {entry.text}
                    </div>
                  )}
                </div>
              );
            }

            if (entry.kind === "bot-html") {
              return (
                <div key={entry.id} className="flex max-w-full justify-start gap-2.5 pr-12">
                  <div className="relative mt-1 h-8 w-8 shrink-0 overflow-hidden rounded-full">
                    <Image src="/images/logo_arishrimp.jpg" alt="AI" fill className="object-cover" />
                  </div>
                  <div
                    className="prose prose-sm max-w-[78%] rounded-[18px] rounded-bl-md bg-white px-4 py-3 text-gray-700 shadow-sm prose-p:my-2 prose-strong:text-[#1f3125] prose-li:my-1"
                    dangerouslySetInnerHTML={{ __html: entry.html }}
                  />
                </div>
              );
            }

            if (entry.kind === "bot-plain") {
              return (
                <div key={entry.id} className="flex max-w-full justify-start gap-2.5 pr-12">
                  <div className="relative mt-1 h-8 w-8 shrink-0 overflow-hidden rounded-full">
                    <Image src="/images/logo_arishrimp.jpg" alt="AI" fill className="object-cover" />
                  </div>
                  <div className="max-w-[78%] rounded-[18px] rounded-bl-md bg-white px-4 py-3 text-sm leading-relaxed text-gray-800 shadow-sm">
                    {entry.text}
                  </div>
                </div>
              );
            }

            // entry.kind === "bot-result"
            const diagnosis = entry.diagnosis;
            return (
              <div key={entry.id} className="flex max-w-full justify-start gap-2.5 pr-12">
                <div className="relative mt-1 h-8 w-8 shrink-0 overflow-hidden rounded-full">
                  <Image
                    src="/images/logo_arishrimp.jpg"
                    alt="AI"
                    fill
                    className="object-cover"
                  />
                </div>

                {diagnosis.status === "HEALTHY" ? (
                  <div className="max-w-[78%] overflow-hidden rounded-2xl border border-blue-200 bg-white shadow-lg">
                    <div className="flex items-center gap-2 border-b border-blue-100 bg-blue-50 px-4 py-2.5">
                      <span className="text-xl">🦐</span>
                      <span className="text-[13px] font-bold text-blue-700">
                        TÔM KHỎE MẠNH
                      </span>
                    </div>
                    {(diagnosis.imageUrl || diagnosis.clientImageUrl) && (
                      <div className="relative h-[220px] w-full bg-blue-50">
                        <Image
                          src={diagnosis.imageUrl || diagnosis.clientImageUrl || ""}
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
                          {Number(diagnosis.disease?.confidencePercent || 0).toFixed(0)}% tin cậy
                        </span>
                      </div>

                      <div className="space-y-3 p-4">
                        {(diagnosis.imageUrl || diagnosis.clientImageUrl) && (
                          <div className="overflow-hidden rounded-xl border border-red-100 bg-slate-50">
                            <div className="relative h-[220px] w-full">
                              <Image
                                src={diagnosis.imageUrl || diagnosis.clientImageUrl || ""}
                                alt={diagnosis.disease?.nameVi ?? "Ảnh tôm đã được AI phân tích"}
                                fill
                                className="object-cover"
                                unoptimized
                              />
                            </div>
                          </div>
                        )}

                        <div>
                          <h3 className="mb-1 text-[15px] font-extrabold uppercase text-red-600">
                            {diagnosis.disease?.nameVi}
                          </h3>
                        </div>

                        <p className="text-[13px] leading-relaxed text-gray-600">
                          {diagnosis.signsSummary ||
                            "Bác sĩ đã xem xong, bà con nhấn vào nút bên dưới để xem cách chữa trị chi tiết nhé."}
                        </p>

                        {diagnosis.causes && diagnosis.causes.length > 0 && (
                          <div className="rounded-xl bg-amber-50 px-3 py-2 text-[12px] text-amber-900">
                            <div className="mb-1 flex items-center gap-1 font-bold">
                              <AlertTriangle size={13} />
                              Nguyên nhân chính
                            </div>
                            <p className="line-clamp-2">{diagnosis.causes[0]}</p>
                          </div>
                        )}
                      </div>

                      <div className="border-t border-gray-100 p-3">
                        <button
                          onClick={() => openReport(diagnosis.diagnosisId)}
                          className="flex h-12 w-full items-center justify-center gap-1 rounded-xl bg-[#376E60] text-[13px] font-bold uppercase text-white transition-colors hover:bg-[#2f5c50]"
                        >
                          {isAuthenticated ? "Xem cách chữa trị ngay" : "Mở hồ sơ điều trị"}
                          <ArrowRight size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {chatMutation.isPending && (
            <div className="flex max-w-full justify-start gap-2.5 pr-12">
              <div className="relative mt-1 h-8 w-8 shrink-0 overflow-hidden rounded-full">
                <Image src="/images/logo_arishrimp.jpg" alt="AI" fill className="object-cover" />
              </div>
              <div className="max-w-[78%] rounded-[18px] rounded-bl-md bg-white px-4 py-3 text-sm text-gray-700 shadow-sm">
                <div className="flex items-center gap-2 font-semibold text-[#376E60]">
                  <Loader2 size={16} className="animate-spin" />
                  Bác sĩ đang phân tích...
                </div>
              </div>
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

          {clarifyMutation.isPending && (
            <div className="flex max-w-full justify-start gap-2.5 pr-12">
              <div className="relative mt-1 h-8 w-8 shrink-0 overflow-hidden rounded-full">
                <Image src="/images/logo_arishrimp.jpg" alt="AI" fill className="object-cover" />
              </div>
              <div className="max-w-[78%] rounded-[18px] rounded-bl-md bg-white px-4 py-3 text-sm text-gray-700 shadow-sm">
                <div className="flex items-center gap-2 font-semibold text-[#376E60]">
                  <Loader2 size={16} className="animate-spin" />
                  Bác sĩ đang trả lời...
                </div>
              </div>
            </div>
          )}

          <div ref={chatEndRef} />
        </div>

        <div className="sticky bottom-0 border-t border-gray-200 bg-white px-4 py-3 shadow-[0_-8px_24px_rgba(0,0,0,0.04)]">
          {!previewUrl && symptoms.length === 0 && !diagnoseMutation.isPending && !clarifySession && (
            <div className="mb-3 flex flex-wrap gap-2">
              {quickSymptoms.map((s) => (
                <button
                  key={s}
                  onClick={() => handleQuickSymptom(s)}
                  className="rounded-full border border-blue-100 bg-blue-50 px-3 py-1.5 text-[11px] font-medium text-blue-800 transition-colors hover:bg-blue-100"
                >
                  {s}
                </button>
              ))}
            </div>
          )}

          {previewUrl && (
            <div className="mb-3 rounded-2xl border border-blue-200 bg-blue-50 p-3">
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
                placeholder={
                  clarifySession
                    ? "Nhập câu trả lời của bà con..."
                    : "Kể bệnh: tôm bỏ ăn, nổi đầu, có đốm trắng..."
                }
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
              disabled={diagnoseMutation.isPending || clarifyMutation.isPending}
              className="mb-1 rounded-full bg-[#376E60] p-3 text-white transition-colors hover:bg-[#2f5c50] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {diagnoseMutation.isPending || clarifyMutation.isPending ? (
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
