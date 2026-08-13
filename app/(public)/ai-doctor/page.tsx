"use client";

import {
  ChangeEvent,
  KeyboardEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  AlertTriangle,
  ArrowRight,
  ChevronLeft,
  ImageIcon,
  Loader2,
  NotebookText,
  Send,
  ShieldAlert,
  Sparkles,
  XCircle,
} from "lucide-react";
import { AxiosError } from "axios";
import { toast } from "sonner";

import { aiDoctorService } from "@/app/services/aiDoctor.service";
import type {
  AiDoctorConversationTurn,
  AiDoctorDiagnosisResponse,
  AiDoctorTreatmentStageOption,
} from "@/app/types/ai-doctor.types";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useAuthStore } from "@/stores/useAuthStore";
import { getErrorMessage } from "@/lib/axios";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import AiDoctorHistorySidebar from "@/components/ai-doctor/AiDoctorHistorySidebar";

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
  | { id: string; kind: "bot-diagnosis"; diagnosis: AiDoctorDiagnosisResponse }
  | { id: string; kind: "bot-result"; diagnosis: AiDoctorDiagnosisResponse };

// Omit<Union, K> collapses to the merged member keys instead of distributing per-variant, which
// breaks the discriminated-union excess-property check on the object literals passed to
// pushEntry() below. This variant distributes over each member of the union first.
type DistributiveOmit<T, K extends keyof any> = T extends unknown
  ? Omit<T, K>
  : never;

type ClarifySession = {
  diagnosisId: string;
};

type DiagnosePayload = {
  image: File;
  userSymptoms?: string;
  clientPreviewUrl?: string;
};

function StageSelectionBubble({
  message,
  options,
  pendingStageIndex,
  disabled,
  onSelect,
}: {
  message?: string;
  options: AiDoctorTreatmentStageOption[];
  pendingStageIndex: number | null;
  disabled: boolean;
  onSelect: (stageIndex: number) => void;
}) {
  return (
    <div className="ml-[42px] w-full max-w-[78%] overflow-hidden rounded-2xl border border-[#c8d7f1] bg-white shadow-sm">
      <div className="border-b border-[#c8d7f1] bg-[#eaf2fc] px-4 py-3">
        <div className="text-[13px] font-extrabold uppercase text-[#1965A2]">
          Chọn giai đoạn bệnh
        </div>
        <p className="mt-1 text-[12px] leading-relaxed text-slate-600">
          {message ||
            "Bà con chọn đúng giai đoạn hiện tại để bác sĩ đưa phác đồ phù hợp."}
        </p>
      </div>

      <div className="divide-y divide-slate-100 p-2">
        {options.map((option) => {
          const isPending = pendingStageIndex === option.stageIndex;
          return (
            <button
              key={option.stageIndex}
              type="button"
              disabled={disabled}
              onClick={() => onSelect(option.stageIndex)}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition-colors hover:bg-[#f2f7fb] disabled:cursor-not-allowed disabled:opacity-70"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-sm font-extrabold text-[#1965A2]">
                {option.stageNumber}
              </span>
              <span className="min-w-0 flex-1 text-[13px] font-semibold leading-relaxed text-slate-800">
                {option.stageTitle || `Giai đoạn ${option.stageNumber}`}
              </span>
              {isPending ? (
                <Loader2
                  size={17}
                  className="shrink-0 animate-spin text-[#1965A2]"
                />
              ) : (
                <ArrowRight size={17} className="shrink-0 text-slate-400" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// Dung chung de phat lai (replay) 1 ngay bat ky — vua cho "khoi phuc hom nay" luc mount, vua cho
// "xem lai 1 ngay cu" khi bam sidebar. idPrefix de tranh dung id voi cac entry dang go song.
const mapTurnsToEntries = (
  turns: AiDoctorConversationTurn[],
  idPrefix: string,
): ChatEntry[] => {
  const result: ChatEntry[] = [];
  turns.forEach((turn, index) => {
    const uId = `${idPrefix}-${index}-u`;
    const bId = `${idPrefix}-${index}-b`;

    if (turn.type === "CHAT") {
      result.push({ id: uId, kind: "user", text: turn.questionText });
      result.push({ id: bId, kind: "bot-html", html: turn.answerHtml || "" });
      return;
    }

    result.push({
      id: uId,
      kind: "user",
      text: turn.userSymptoms,
      previewUrl: turn.imageUrl,
    });

    // HEALTHY dung the ket qua tinh "TOM KHOE MANH" (bot-result), khong phai bong bong tuong thuat
    // — khop dung UI cua luong song (xem nhanh "bot-result" trong JSX render).
    if (turn.status === "HEALTHY") {
      result.push({
        id: bId,
        kind: "bot-result",
        diagnosis: {
          diagnosisId: turn.diagnosisId || "",
          status: "HEALTHY",
          imageUrl: turn.imageUrl,
        },
      });
      return;
    }

    result.push({
      id: bId,
      kind: "bot-diagnosis",
      diagnosis: {
        diagnosisId: turn.diagnosisId || "",
        status: turn.status === "UNRECOGNIZED" ? "UNRECOGNIZED" : "DISEASE",
        imageUrl: turn.imageUrl,
        disease: turn.disease,
        signsSummary: turn.signsSummary,
        needsClarification: turn.needsClarification,
        aiDescription: turn.aiDescription,
      },
    });
  });
  return result;
};

// Lay ngay "yyyy-MM-dd" theo gio dia phuong trinh duyet — KHONG dung toISOString() vi no quy ve
// UTC, de lech lui 1 ngay vao buoi toi gio VN.
const getTodayIsoDate = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

// Parse thu cong "yyyy-MM-dd" thay vi new Date(...) — cung ly do tren.
const formatDateLabel = (isoDate: string) => {
  const [, month, day] = isoDate.split("-").map(Number);
  return `${day}/${month}`;
};

const createPersistentPreview = async (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();

    reader.onerror = () =>
      reject(new Error("Không thể đọc ảnh để lưu preview."));
    reader.onload = () => {
      const fileDataUrl =
        typeof reader.result === "string" ? reader.result : "";
      if (!fileDataUrl) {
        reject(new Error("Không thể đọc dữ liệu ảnh preview."));
        return;
      }

      const previewImage = new window.Image();
      previewImage.onload = () => {
        const longestEdge = Math.max(
          previewImage.naturalWidth,
          previewImage.naturalHeight,
        );
        const scale =
          longestEdge > MAX_STORED_PREVIEW_EDGE
            ? MAX_STORED_PREVIEW_EDGE / longestEdge
            : 1;
        const canvas = document.createElement("canvas");
        canvas.width = Math.max(
          1,
          Math.round(previewImage.naturalWidth * scale),
        );
        canvas.height = Math.max(
          1,
          Math.round(previewImage.naturalHeight * scale),
        );

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

// Chua margin duoi gioi han cung 500 ky tu cua BE (AiDoctorDiagnosisService.MAX_SYMPTOMS_LENGTH).
const MAX_SYMPTOMS_CHARS = 480;

// Gop toan bo tin nhan chu nguoi dung da go truoc do (qua chatMutation) + o nhap hien tai thanh 1
// chuoi userSymptoms khi gui anh — de enrichDiagnosis's text-match fallback thuc su ket hop duoc
// voi YOLO/Gemini thay vi chi dua vao noi dung o nhap luc bam gui. Neu vuot ngan sach ky tu, uu
// tien giu cac cau GAN NHAT (matchDiseaseFromText cham diem theo tokenize/containment, khong phu
// thuoc thu tu cau, nen cat bot tu dau khong lam hong co che khop).
const buildCumulativeSymptoms = (entries: ChatEntry[], currentText: string) => {
  const priorTexts = entries
    .filter(
      (entry): entry is Extract<ChatEntry, { kind: "user" }> =>
        entry.kind === "user",
    )
    .map((entry) => entry.text?.trim())
    .filter((text): text is string => Boolean(text));
  const allTexts = currentText ? [...priorTexts, currentText] : priorTexts;
  if (allTexts.length === 0) return undefined;

  const kept: string[] = [];
  let total = 0;
  for (let i = allTexts.length - 1; i >= 0; i--) {
    const next = allTexts[i];
    if (total + next.length + 2 > MAX_SYMPTOMS_CHARS && kept.length > 0) break;
    kept.unshift(next);
    total += next.length + 2;
  }
  return kept.join(". ");
};

export default function AiDoctorChatPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const latestComposerPreviewRef = useRef<string | null>(null);
  const entryIdRef = useRef(0);
  const { isAuthenticated } = useCurrentUser();
  // isAuthenticated co the true truoc khi accessToken thuc su co trong store (nhanh cachedUser luc
  // hydrate — xem layoutClient.tsx: setUser() set isAuthenticated ngay nhung accessToken chi den
  // sau, async). Ban query voi enabled: isAuthenticated se bi 401 (retry:0 -> fail vinh vien cho
  // lan mount do) neu ban dung luc do — gate them accessToken de doi token thuc su san sang.
  const accessToken = useAuthStore((state) => state.accessToken);

  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  // null = dang xem chat song hom nay; co gia tri = dang xem lai (read-only) mot ngay cu tu sidebar.
  const [viewingDate, setViewingDate] = useState<string | null>(null);
  const isViewingHistory = viewingDate !== null;

  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [symptoms, setSymptoms] = useState("");
  const [entries, setEntries] = useState<ChatEntry[]>([]);
  const [clarifySession, setClarifySession] = useState<ClarifySession | null>(
    null,
  );
  const [pendingStageChoice, setPendingStageChoice] = useState<{
    diagnosisId: string;
    stageIndex: number;
  } | null>(null);

  const nextEntryId = () => `e${entryIdRef.current++}`;
  const pushEntry = (entry: DistributiveOmit<ChatEntry, "id">) =>
    setEntries((prev) => [
      ...prev,
      { ...entry, id: nextEntryId() } as ChatEntry,
    ]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [entries, previewUrl, symptoms, viewingDate]);

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

  // Khoi phuc lai dung cac bong bong chat CUA HOM NAY sau khi tai lai trang — chi phat lai (khong
  // goi Gemini lai), dua tren du lieu da luu san o AiKnowledgeChatLog (chat chu) +
  // AiDoctorDiagnosisHistory (chan doan anh). KHONG bao gom cac luot hoi-dap lam ro benh (luu o
  // bang khac, gioi han co chu dich) — bu lai, neu chan doan gan nhat hom nay van needsClarification
  // thi khoi phuc luon clarifySession de go tiep van noi dung phien dang mo.
  const todayIso = getTodayIsoDate();
  const hasRestoredTodayRef = useRef(false);
  const todayConversationQuery = useQuery({
    queryKey: ["ai-doctor-conversation", todayIso],
    queryFn: () => aiDoctorService.getConversation(todayIso),
    enabled: isAuthenticated && Boolean(accessToken),
  });

  useEffect(() => {
    if (hasRestoredTodayRef.current || !todayConversationQuery.data) return;
    hasRestoredTodayRef.current = true;
    if (todayConversationQuery.data.length === 0) return;

    setEntries(mapTurnsToEntries(todayConversationQuery.data, "restored"));

    const lastDiagnosisTurn = [...todayConversationQuery.data]
      .reverse()
      .find((turn) => turn.type === "DIAGNOSIS");
    if (
      lastDiagnosisTurn?.needsClarification &&
      lastDiagnosisTurn.diagnosisId
    ) {
      setClarifySession({ diagnosisId: lastDiagnosisTurn.diagnosisId });
    }
  }, [todayConversationQuery.data]);

  // Xem lai (read-only) 1 ngay cu duoc chon tu sidebar — dung CHUNG co che phat lai voi khoi phuc
  // hom nay o tren, chi khac nguon du lieu la ngay dang duoc chon thay vi hom nay.
  const historyConversationQuery = useQuery({
    queryKey: ["ai-doctor-conversation", viewingDate],
    queryFn: () => aiDoctorService.getConversation(viewingDate as string),
    enabled: isViewingHistory && Boolean(accessToken),
  });
  const historyEntries = useMemo(
    () => mapTurnsToEntries(historyConversationQuery.data ?? [], "hist"),
    [historyConversationQuery.data],
  );
  const displayEntries = isViewingHistory ? historyEntries : entries;

  const chatMutation = useMutation({
    mutationFn: ({
      message,
      image,
    }: {
      message: string;
      image?: { base64: string; mimeType: string };
    }) => aiDoctorService.chat(message, undefined, image),
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
        if (data.diagnosis.stageSelection?.options?.length) {
          pushEntry({ kind: "bot-diagnosis", diagnosis: data.diagnosis });
        } else {
          pushEntry({ kind: "bot-result", diagnosis: data.diagnosis });
        }
        toast.success("Bác sĩ đã có kết quả rồi đây!");
        return;
      }

      // Tu Buoc "cho vao bang" — message gio la HTML co cau truc (bang benh nghi ngo + anh neu co),
      // khong con la van ban thuan, nen render bang bot-html (dangerouslySetInnerHTML) thay vi bot-plain.
      pushEntry({ kind: "bot-html", html: data.message });

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
        ? (aiDoctorService.saveClientImage(
            data.diagnosisId,
            variables.clientPreviewUrl,
          ) ?? {
            ...data,
            clientImageUrl: variables.clientPreviewUrl,
          })
        : data;

      if (data.needsClarification) {
        pushEntry({ kind: "bot-diagnosis", diagnosis: hydratedDiagnosis });
        setClarifySession({ diagnosisId: data.diagnosisId });
        clarifyMutation.mutate({
          diagnosisId: data.diagnosisId,
          candidateDiseaseCodes: (data.topPredictions ?? []).map(
            (prediction) => prediction.diseaseCode,
          ),
          // Chỉ có tác dụng với khách vãng lai (BE ưu tiên history nếu có) — để không mất ảnh/triệu
          // chứng đã gửi trong suốt cuộc hỏi-đáp.
          imageUrl: data.imageUrl || variables.clientPreviewUrl,
          initialSymptoms: variables.userSymptoms,
        });
        return;
      }

      setClarifySession(null);

      // UNRECOGNIZED: YOLO khong nhan ra benh cu the nao tu anh — Bac si Tom da tu van goi y mo +
      // luu san thong tin ky su lien he trong aiDescription, khong con phac do de xem nen khong tu
      // dong mo them clarify (candidate rong se escalate ngay lap tuc, ra 2 bubble du thua).
      if (data.status === "UNRECOGNIZED") {
        pushEntry({ kind: "bot-diagnosis", diagnosis: hydratedDiagnosis });
        return;
      }

      // HEALTHY khong di qua enrichDiagnosis o BE nen khong co aiDescription — giu nguyen the bot-result
      // "TÔM KHỎE MẠNH" nhu cu. Cac ca DISEASE gio day dung bubble tuong thuat bot-diagnosis thay vi
      // the ket qua tinh nhu truoc.
      if (data.status === "HEALTHY") {
        pushEntry({ kind: "bot-result", diagnosis: hydratedDiagnosis });
        return;
      }

      pushEntry({ kind: "bot-diagnosis", diagnosis: hydratedDiagnosis });
      toast.success("Bác sĩ đã có kết quả rồi đây!");
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error as AxiosError));

      if ((error as AxiosError)?.response?.status === 401) {
        router.push("/login");
      }
    },
  });

  const stagePrescriptionMutation = useMutation({
    mutationFn: ({
      diagnosisId,
      stageIndex,
    }: {
      diagnosisId: string;
      stageIndex: number;
    }) => aiDoctorService.generatePrescriptionForStage(diagnosisId, stageIndex),
    onMutate: (variables) => {
      setPendingStageChoice(variables);
    },
    onSuccess: (data, variables) => {
      setEntries((prev) =>
        prev.map((entry) => {
          if (
            entry.kind !== "bot-diagnosis" ||
            entry.diagnosis.diagnosisId !== variables.diagnosisId
          ) {
            return entry;
          }
          return {
            ...entry,
            diagnosis: {
              ...entry.diagnosis,
              ...data,
              stageSelection: undefined,
            },
          };
        }),
      );
      toast.success("Đã chọn giai đoạn và lập phác đồ phù hợp.");
      router.push(
        `/ai-doctor/result?id=${data.diagnosisId || variables.diagnosisId}`,
      );
    },
    onError: () => {
      toast.error(
        "Không thể lấy phác đồ cho giai đoạn này. Bà con thử lại nhé.",
      );
    },
    onSettled: () => {
      setPendingStageChoice(null);
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
      toast.error(
        "Bà con hãy nhập dấu hiệu hoặc gửi ảnh tôm để bác sĩ hỗ trợ nhé.",
      );
      return;
    }

    // Đang trong hội thoại làm rõ bệnh và không gửi ảnh mới → trả lời tiếp câu hỏi của bác sĩ AI.
    if (clarifySession && !selectedImage) {
      pushEntry({ kind: "user", text: currentSymptoms });
      setSymptoms("");
      clarifyMutation.mutate({
        diagnosisId: clarifySession.diagnosisId,
        answer: currentSymptoms,
      });
      return;
    }

    // Gửi ảnh mới trong lúc đang hỏi-đáp → coi như khám lại từ đầu, bỏ phiên cũ.
    if (clarifySession && selectedImage) {
      setClarifySession(null);
    }

    if (!selectedImage || !previewUrl) {
      pushEntry({ kind: "user", text: currentSymptoms });
      setSymptoms("");
      chatMutation.mutate({ message: currentSymptoms });
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
      userSymptoms: buildCumulativeSymptoms(entries, currentSymptoms),
      clientPreviewUrl,
    });
  };

  const handleComposerKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      handleDiagnose();
    }
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

  const selectStage = (diagnosisId: string, stageIndex: number) => {
    if (!diagnosisId || stagePrescriptionMutation.isPending) return;
    stagePrescriptionMutation.mutate({ diagnosisId, stageIndex });
  };

  const goToToday = () => {
    setViewingDate(null);
    setIsMobileSidebarOpen(false);
  };

  const selectHistoryDate = (date: string) => {
    // Ngay hom nay co the xuat hien trong danh sach So kham (da co hoat dong hom nay) — chon no
    // phai tuong duong bam "Kham hom nay" (ve chat song), khong roi vao che do xem lai read-only.
    if (date === todayIso) {
      goToToday();
      return;
    }
    setViewingDate(date);
    setIsMobileSidebarOpen(false);
  };

  return (
    <div className="flex min-h-screen w-full bg-[#eef3f9]">
      <aside className="hidden w-[280px] shrink-0 bg-[#1965A2] lg:sticky lg:top-0 lg:flex lg:h-screen lg:flex-col">
        {isAuthenticated ? (
          <AiDoctorHistorySidebar
            activeDate={viewingDate}
            todayDate={todayIso}
            onSelectToday={goToToday}
            onSelectDate={selectHistoryDate}
          />
        ) : (
          <div className="flex flex-1 items-center justify-center p-6 text-center text-sm text-white/70">
            Đăng nhập để dùng Bác sĩ Tôm AI và xem lại Sổ khám các ngày trước.
          </div>
        )}
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="sticky top-0 z-20 flex items-center gap-3 bg-[#1965A2] px-4 py-3 shadow-sm lg:hidden">
          <Link
            href="/"
            className="text-white transition-opacity hover:opacity-80"
          >
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
              <span className="block h-2 w-2 rounded-full bg-emerald-400" />
              Tư vấn chẩn đoán bệnh tôm 24/7
            </div>
          </div>

          {isAuthenticated && (
            <button
              type="button"
              aria-label="Sổ khám"
              onClick={() => setIsMobileSidebarOpen(true)}
              className="rounded-full bg-white/10 p-2 text-white transition-colors hover:bg-white/15 lg:hidden"
            >
              <NotebookText size={22} />
            </button>
          )}
        </div>

        <div className="flex-1 space-y-5 overflow-y-auto p-4 pb-32">
          <div className="text-center">
            <span className="rounded-full bg-black/5 px-3 py-1 text-[11px] text-gray-500">
              {isViewingHistory
                ? formatDateLabel(viewingDate as string)
                : "Hôm nay"}
            </span>
          </div>

          {!isViewingHistory && (
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
                Xin chào bà con! Tôi là Bác sĩ Tôm 🦐
                <br />
                <br />
                Bà con gửi cho tôi 1 tấm ảnh tôm kèm mô tả dấu hiệu, tôi sẽ giúp
                chẩn đoán bệnh và đưa ra cách chữa trị hiệu quả nhé!
              </div>
            </div>
          )}

          {isViewingHistory && historyConversationQuery.isLoading && (
            <div className="flex justify-center py-10">
              <Loader2 className="animate-spin text-[#1965A2]" size={24} />
            </div>
          )}

          {displayEntries.map((entry) => {
            if (entry.kind === "user") {
              return (
                <div
                  key={entry.id}
                  className="ml-auto flex max-w-[88%] flex-col items-end gap-2"
                >
                  {entry.previewUrl && (
                    <div className="overflow-hidden rounded-2xl border border-white bg-white shadow-sm">
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
                    <div className="max-w-[88%] whitespace-pre-line rounded-[18px] rounded-br-md bg-[#1965A2] px-4 py-3 text-sm leading-relaxed text-white shadow-sm">
                      {entry.text}
                    </div>
                  )}
                </div>
              );
            }

            if (entry.kind === "bot-html") {
              return (
                <div
                  key={entry.id}
                  className="flex max-w-full justify-start gap-2.5 pr-12"
                >
                  <div className="relative mt-1 h-8 w-8 shrink-0 overflow-hidden rounded-full">
                    <Image
                      src="/images/logo_arishrimp.jpg"
                      alt="AI"
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div
                    className="prose prose-sm max-w-[78%] rounded-[18px] rounded-bl-md bg-white px-4 py-3 text-gray-700 shadow-sm prose-p:my-2 prose-strong:text-[#12385a] prose-li:my-1"
                    dangerouslySetInnerHTML={{ __html: entry.html }}
                  />
                </div>
              );
            }

            if (entry.kind === "bot-plain") {
              return (
                <div
                  key={entry.id}
                  className="flex max-w-full justify-start gap-2.5 pr-12"
                >
                  <div className="relative mt-1 h-8 w-8 shrink-0 overflow-hidden rounded-full">
                    <Image
                      src="/images/logo_arishrimp.jpg"
                      alt="AI"
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="max-w-[78%] whitespace-pre-line rounded-[18px] rounded-bl-md bg-white px-4 py-3 text-sm leading-relaxed text-gray-800 shadow-sm">
                    {entry.text}
                  </div>
                </div>
              );
            }

            if (entry.kind === "bot-diagnosis") {
              const diagnosis = entry.diagnosis;
              const hasNarrative = Boolean(
                diagnosis.aiDescription && diagnosis.aiDescription.trim(),
              );
              return (
                <div
                  key={entry.id}
                  className="flex max-w-full flex-col items-start gap-2 pr-12"
                >
                  <div className="flex max-w-full justify-start gap-2.5">
                    <div className="relative mt-1 h-8 w-8 shrink-0 overflow-hidden rounded-full">
                      <Image
                        src="/images/logo_arishrimp.jpg"
                        alt="AI"
                        fill
                        className="object-cover"
                      />
                    </div>
                    {hasNarrative ? (
                      <div
                        className="prose prose-sm max-w-[78%] rounded-[18px] rounded-bl-md bg-white px-4 py-3 text-gray-700 shadow-sm prose-p:my-2 prose-strong:text-[#12385a] prose-li:my-1"
                        dangerouslySetInnerHTML={{
                          __html: diagnosis.aiDescription as string,
                        }}
                      />
                    ) : (
                      <div className="max-w-[78%] whitespace-pre-line rounded-[18px] rounded-bl-md bg-white px-4 py-3 text-sm leading-relaxed text-gray-800 shadow-sm">
                        {diagnosis.signsSummary ||
                          "Bác sĩ đã xem xong ảnh của bà con."}
                      </div>
                    )}
                  </div>

                  {!diagnosis.needsClarification &&
                  diagnosis.status !== "UNRECOGNIZED" &&
                  diagnosis.stageSelection?.options?.length ? (
                    <StageSelectionBubble
                      message={diagnosis.stageSelection.message}
                      options={diagnosis.stageSelection.options}
                      pendingStageIndex={
                        pendingStageChoice?.diagnosisId ===
                        diagnosis.diagnosisId
                          ? pendingStageChoice.stageIndex
                          : null
                      }
                      disabled={stagePrescriptionMutation.isPending}
                      onSelect={(stageIndex) =>
                        selectStage(diagnosis.diagnosisId, stageIndex)
                      }
                    />
                  ) : !diagnosis.needsClarification &&
                    diagnosis.status !== "UNRECOGNIZED" ? (
                    <button
                      onClick={() => openReport(diagnosis.diagnosisId)}
                      className="ml-[42px] flex h-11 items-center justify-center gap-1 rounded-xl bg-[#1965A2] px-4 text-[13px] font-bold uppercase text-white shadow-sm transition-colors hover:bg-[#15588D]"
                    >
                      {isAuthenticated
                        ? "Xem cách chữa trị ngay"
                        : "Mở hồ sơ điều trị"}
                      <ArrowRight size={16} />
                    </button>
                  ) : null}
                </div>
              );
            }

            // entry.kind === "bot-result"
            const diagnosis = entry.diagnosis;
            return (
              <div
                key={entry.id}
                className="flex max-w-full justify-start gap-2.5 pr-12"
              >
                <div className="relative mt-1 h-8 w-8 shrink-0 overflow-hidden rounded-full">
                  <Image
                    src="/images/logo_arishrimp.jpg"
                    alt="AI"
                    fill
                    className="object-cover"
                  />
                </div>

                {diagnosis.status === "HEALTHY" ? (
                  <div className="max-w-[78%] overflow-hidden rounded-2xl border border-[#c8d7f1] bg-white shadow-lg">
                    <div className="flex items-center gap-2 border-b border-[#c8d7f1] bg-[#eaf2fc] px-4 py-2.5">
                      <span className="text-xl">🦐</span>
                      <span className="text-[13px] font-bold text-[#1965A2]">
                        TÔM KHỎE MẠNH
                      </span>
                    </div>
                    {(diagnosis.imageUrl || diagnosis.clientImageUrl) && (
                      <div className="relative h-[220px] w-full bg-[#eaf2fc]">
                        <Image
                          src={
                            diagnosis.imageUrl || diagnosis.clientImageUrl || ""
                          }
                          alt="Ảnh tôm đã được AI phân tích"
                          fill
                          className="object-cover"
                          unoptimized
                        />
                      </div>
                    )}
                    <div className="p-4 text-[13px] leading-relaxed text-gray-600">
                      Bác sĩ không thấy dấu hiệu bệnh gì lạ trên ảnh này. Bà con
                      cứ yên tâm tiếp tục chăm sóc ao thật tốt nhé!
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
                          {Number(
                            diagnosis.disease?.confidencePercent || 0,
                          ).toFixed(0)}
                          % tin cậy
                        </span>
                      </div>

                      <div className="space-y-3 p-4">
                        {(diagnosis.imageUrl || diagnosis.clientImageUrl) && (
                          <div className="overflow-hidden rounded-xl border border-red-100 bg-slate-50">
                            <div className="relative h-[220px] w-full">
                              <Image
                                src={
                                  diagnosis.imageUrl ||
                                  diagnosis.clientImageUrl ||
                                  ""
                                }
                                alt={
                                  diagnosis.disease?.nameVi ??
                                  "Ảnh tôm đã được AI phân tích"
                                }
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
                            <p className="line-clamp-2">
                              {diagnosis.causes[0]}
                            </p>
                          </div>
                        )}
                      </div>

                      <div className="border-t border-gray-100 p-3">
                        <button
                          onClick={() => openReport(diagnosis.diagnosisId)}
                          className="flex h-12 w-full items-center justify-center gap-1 rounded-xl bg-[#1965A2] text-[13px] font-bold uppercase text-white transition-colors hover:bg-[#15588D]"
                        >
                          {isAuthenticated
                            ? "Xem cách chữa trị ngay"
                            : "Mở hồ sơ điều trị"}
                          <ArrowRight size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {!isViewingHistory && chatMutation.isPending && (
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
                <div className="flex items-center gap-2 font-semibold text-[#1965A2]">
                  <Loader2 size={16} className="animate-spin" />
                  Bác sĩ đang phân tích...
                </div>
              </div>
            </div>
          )}

          {!isViewingHistory && diagnoseMutation.isPending && (
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
                <div className="mb-2 flex items-center gap-2 font-semibold text-[#1965A2]">
                  <Loader2 size={16} className="animate-spin" />
                  Bác sĩ đang xem ảnh, bà con đợi xíu nhé...
                </div>
                <p className="text-xs text-gray-500">
                  Hệ thống đang phân tích các dấu hiệu bệnh và tìm cách chữa trị
                  tốt nhất cho ao nhà mình.
                </p>
              </div>
            </div>
          )}

          {!isViewingHistory && clarifyMutation.isPending && (
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
                <div className="flex items-center gap-2 font-semibold text-[#1965A2]">
                  <Loader2 size={16} className="animate-spin" />
                  Bác sĩ đang trả lời...
                </div>
              </div>
            </div>
          )}

          <div ref={chatEndRef} />
        </div>

        {!isAuthenticated ? (
          <div className="sticky bottom-0 border-t border-gray-200 bg-white p-4 text-center shadow-[0_-8px_24px_rgba(0,0,0,0.04)]">
            <p className="mb-2 text-sm text-gray-600">
              Đăng nhập để trò chuyện và gửi ảnh cho Bác sĩ Tôm AI chẩn đoán
              bệnh.
            </p>
            <button
              type="button"
              onClick={() => router.push("/login")}
              className="rounded-full bg-[#1965A2] px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-[#15588D]"
            >
              Đăng nhập ngay
            </button>
          </div>
        ) : isViewingHistory ? (
          <div className="sticky bottom-0 border-t border-gray-200 bg-white p-4 text-center shadow-[0_-8px_24px_rgba(0,0,0,0.04)]">
            <button
              type="button"
              onClick={goToToday}
              className="rounded-full bg-[#1965A2] px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-[#15588D]"
            >
              Quay lại hôm nay
            </button>
          </div>
        ) : (
          <div className="sticky bottom-0 border-t border-gray-200 bg-white px-4 py-3 shadow-[0_-8px_24px_rgba(0,0,0,0.04)]">
            {previewUrl && (
              <div className="mb-3 rounded-2xl border border-[#c8d7f1] bg-[#eaf2fc] p-3">
                <div className="mb-2 flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold uppercase tracking-wide text-[#1965A2]">
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
                className="mb-3 text-[#1965A2]"
                title="Chọn ảnh"
              >
                <ImageIcon size={24} />
              </button>

              <div className="flex-1 rounded-3xl border border-gray-200 bg-gray-50 px-4 py-2">
                <textarea
                  value={symptoms}
                  onChange={(event) =>
                    setSymptoms(event.target.value.slice(0, 300))
                  }
                  onKeyDown={handleComposerKeyDown}
                  placeholder={
                    clarifySession
                      ? "Nhập câu trả lời của bà con..."
                      : "Kể bệnh: tôm bỏ ăn, nổi đầu, có đốm trắng..."
                  }
                  className="min-h-[28px] w-full resize-none bg-transparent text-sm text-gray-800 outline-none"
                />
                <div className="mt-0.5 flex items-center justify-between text-[11px] text-gray-400">
                  <span className="inline-flex items-center gap-1">
                    <Sparkles size={12} />
                    Gửi ảnh để bác sĩ AI xem bệnh kỹ hơn — kết quả chỉ mang tính
                    tham khảo
                  </span>
                  <span>{symptoms.length}/300</span>
                </div>
              </div>

              <button
                onClick={handleDiagnose}
                disabled={
                  diagnoseMutation.isPending || clarifyMutation.isPending
                }
                className="mb-1 rounded-full bg-[#1965A2] p-3 text-white transition-colors hover:bg-[#15588D] disabled:cursor-not-allowed disabled:opacity-60"
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
        )}
      </div>

      {isAuthenticated && (
        <Sheet open={isMobileSidebarOpen} onOpenChange={setIsMobileSidebarOpen}>
          <SheetContent
            side="left"
            className="flex h-full w-full max-w-[320px] flex-col border-r-0 bg-[#1965A2] p-0 [&>button]:hidden"
          >
            <SheetTitle className="sr-only">Sổ khám</SheetTitle>
            <AiDoctorHistorySidebar
              activeDate={viewingDate}
              todayDate={todayIso}
              onSelectToday={goToToday}
              onSelectDate={selectHistoryDate}
            />
          </SheetContent>
        </Sheet>
      )}
    </div>
  );
}
