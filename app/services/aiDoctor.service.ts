import { apiJava } from "@/lib/axios";
import type {
  AiDoctorChatResponse,
  AiDoctorClarifyResponse,
  AiDoctorDiagnosisResponse,
  AiDoctorHistoryListResponse,
} from "@/app/types/ai-doctor.types";
import { useAuthStore } from "@/stores/useAuthStore";

const DIAGNOSIS_STORAGE_PREFIX = "ai-doctor:diagnosis:";
const LAST_DIAGNOSIS_ID_KEY = "ai-doctor:last-id";
// Dùng chung cho cả khách vãng lai lẫn user đã đăng nhập: chat có thể chuyển sang hỏi làm rõ
// nhiều lượt (AI mơ hồ/gần đạt ngưỡng bệnh nào đó) nên cần 1 sessionId ổn định xuyên suốt cuộc
// hội thoại, không phải chỉ để định danh khách vãng lai như trước.
const CHAT_SESSION_ID_KEY = "ai-doctor:public-session-id";

const canUseStorage = () => typeof window !== "undefined" && !!window.sessionStorage;

const getDiagnosisStorageKey = (diagnosisId: string) => `${DIAGNOSIS_STORAGE_PREFIX}${diagnosisId}`;

const persistDiagnosis = (diagnosis: AiDoctorDiagnosisResponse) => {
  if (!canUseStorage()) return;
  // HEALTHY không có DB record thực — không persist để tránh fetch lại lỗi
  if (diagnosis.status === "HEALTHY") return;

  const cachedDiagnosis = getCachedDiagnosis(diagnosis.diagnosisId);
  const mergedDiagnosis: AiDoctorDiagnosisResponse = {
    ...cachedDiagnosis,
    ...diagnosis,
    clientImageUrl: diagnosis.clientImageUrl ?? cachedDiagnosis?.clientImageUrl,
  };

  window.sessionStorage.setItem(
    getDiagnosisStorageKey(diagnosis.diagnosisId),
    JSON.stringify(mergedDiagnosis),
  );
  window.sessionStorage.setItem(LAST_DIAGNOSIS_ID_KEY, diagnosis.diagnosisId);
};

const getCachedDiagnosis = (diagnosisId: string) => {
  if (!canUseStorage()) return null;

  const raw = window.sessionStorage.getItem(getDiagnosisStorageKey(diagnosisId));
  if (!raw) return null;

  try {
    return JSON.parse(raw) as AiDoctorDiagnosisResponse;
  } catch {
    return null;
  }
};

const getLastDiagnosisId = () => {
  if (!canUseStorage()) return null;
  return window.sessionStorage.getItem(LAST_DIAGNOSIS_ID_KEY);
};

const getChatSessionId = () => {
  if (!canUseStorage()) return undefined;

  let sessionId = window.localStorage.getItem(CHAT_SESSION_ID_KEY);
  if (sessionId) return sessionId;

  sessionId = crypto?.randomUUID?.() ?? `session_${Date.now()}`;
  window.localStorage.setItem(CHAT_SESSION_ID_KEY, sessionId);
  return sessionId;
};

const hasPrivateAccess = () => Boolean(useAuthStore.getState().accessToken);

export const aiDoctorService = {
  async diagnose(image: File, userSymptoms?: string) {
    const formData = new FormData();
    formData.append("image", image);

    if (userSymptoms?.trim()) {
      formData.append("userSymptoms", userSymptoms.trim());
    }
    if (!hasPrivateAccess()) {
      const sessionId = getChatSessionId();
      if (sessionId) {
        formData.append("sessionId", sessionId);
      }
    }

    const response = await apiJava.post<AiDoctorDiagnosisResponse>(
      hasPrivateAccess() ? "/ai-doctor/diagnosis" : "/public/ai-doctor/diagnosis",
      formData,
      ({
        headers: { "Content-Type": "multipart/form-data" },
        isPublic: !hasPrivateAccess(),
        timeout: 90000,
      } as any),
    );

    persistDiagnosis(response.data);
    return response.data;
  },

  async getHistory(page: number = 0, size: number = 20) {
    const response = await apiJava.get<AiDoctorHistoryListResponse>("/ai-doctor/history", {
      params: { page, size },
    });
    return response.data;
  },

  async getDiagnosisDetail(diagnosisId: string | number) {
    const response = await apiJava.get<AiDoctorDiagnosisResponse>(
      `/ai-doctor/diagnosis/${diagnosisId}`,
    );
    persistDiagnosis(response.data);
    return response.data;
  },

  async generatePrescription(diagnosisId: string | number) {
    const response = await apiJava.post<AiDoctorDiagnosisResponse>(
      `/ai-doctor/diagnosis/${diagnosisId}/prescription`,
      {},
      { timeout: 120000 },
    );
    return response.data;
  },

  saveClientImage(diagnosisId: string | number, clientImageUrl: string) {
    if (!canUseStorage()) return null;

    const normalizedDiagnosisId = String(diagnosisId);
    const cachedDiagnosis = getCachedDiagnosis(normalizedDiagnosisId);
    if (!cachedDiagnosis) return null;

    const mergedDiagnosis: AiDoctorDiagnosisResponse = {
      ...cachedDiagnosis,
      clientImageUrl,
    };

    window.sessionStorage.setItem(
      getDiagnosisStorageKey(normalizedDiagnosisId),
      JSON.stringify(mergedDiagnosis),
    );
    window.sessionStorage.setItem(LAST_DIAGNOSIS_ID_KEY, normalizedDiagnosisId);
    return mergedDiagnosis;
  },

  async chat(
    message: string,
    diagnosisContext?: { diseaseCode?: string; diseaseName?: string },
    image?: { base64: string; mimeType: string },
  ) {
    const isPrivate = hasPrivateAccess();
    const response = await apiJava.post<AiDoctorChatResponse>(
      isPrivate ? "/ai-doctor/chat" : "/public/ai-doctor/chat",
      {
      message,
      // Cần ổn định cho cả user đã đăng nhập: BE có thể mở phiên hỏi làm rõ nhiều lượt
      // (AiChatClarifySession) khoá theo sessionId — sessionId đổi mỗi tin nhắn sẽ khiến BE
      // không nối lại được câu hỏi trước đó với câu trả lời tiếp theo.
      sessionId: getChatSessionId(),
      diagnosisContext: diagnosisContext
        ? { diseaseCode: diagnosisContext.diseaseCode, diseaseName: diagnosisContext.diseaseName }
        : undefined,
      imageBase64: image?.base64,
      imageMimeType: image?.mimeType,
    },
      { isPublic: !isPrivate, timeout: image ? 60000 : undefined } as any,
    );
    return response.data;
  },

  async clarify(
    diagnosisId: string,
    payload: {
      answer?: string;
      candidateDiseaseCodes?: string[];
      // Chỉ cần thiết ở lượt gọi đầu tiên cho khách vãng lai — họ không có history DB để
      // BE tự lấy lại ảnh/triệu chứng, nên FE phải gửi kèm những gì đã có từ /diagnosis.
      imageUrl?: string;
      initialSymptoms?: string;
    },
  ) {
    const isPrivate = hasPrivateAccess();
    const response = await apiJava.post<AiDoctorClarifyResponse>(
      isPrivate
        ? `/ai-doctor/diagnosis/${diagnosisId}/clarify`
        : `/public/ai-doctor/diagnosis/${diagnosisId}/clarify`,
      payload,
      { isPublic: !isPrivate } as any,
    );

    // Khi đã chốt bệnh, cập nhật lại cache — nếu không, /ai-doctor/result?id=X (đặc biệt với
    // khách vãng lai, vốn chỉ đọc từ cache) sẽ vẫn hiển thị kết quả cũ (needsClarification=true,
    // bệnh đoán ban đầu) thay vì kết luận thật vừa chốt.
    if (response.data.type === "DECISION" && response.data.diagnosis) {
      persistDiagnosis({ ...response.data.diagnosis, needsClarification: false });
    }

    return response.data;
  },

  getCachedDiagnosis,
  getLastDiagnosisId,
  getChatSessionId,
};
