import { apiJava } from "@/lib/axios";
import type {
  AiDoctorChatResponse,
  AiDoctorClarifyResponse,
  AiDoctorConversationTurn,
  AiDoctorDailyRecordListResponse,
  AiDoctorDiagnosisResponse,
} from "@/app/types/ai-doctor.types";

const DIAGNOSIS_STORAGE_PREFIX = "ai-doctor:diagnosis:";
const LAST_DIAGNOSIS_ID_KEY = "ai-doctor:last-id";
// Chat có thể chuyển sang hỏi làm rõ nhiều lượt (AI mơ hồ/gần đạt ngưỡng bệnh nào đó) nên cần 1
// sessionId ổn định xuyên suốt cuộc hội thoại.
const CHAT_SESSION_ID_KEY = "ai-doctor:public-session-id";

const canUseStorage = () =>
  typeof window !== "undefined" && !!window.sessionStorage;

const getDiagnosisStorageKey = (diagnosisId: string) =>
  `${DIAGNOSIS_STORAGE_PREFIX}${diagnosisId}`;

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

  if (
    diagnosis.stageSelection?.options?.length &&
    !diagnosis.treatmentStages?.length
  ) {
    mergedDiagnosis.treatmentStages = [];
  }

  if (diagnosis.treatmentStages?.length) {
    delete mergedDiagnosis.stageSelection;
  }

  window.sessionStorage.setItem(
    getDiagnosisStorageKey(diagnosis.diagnosisId),
    JSON.stringify(mergedDiagnosis),
  );
  window.sessionStorage.setItem(LAST_DIAGNOSIS_ID_KEY, diagnosis.diagnosisId);
};

const getCachedDiagnosis = (diagnosisId: string) => {
  if (!canUseStorage()) return null;

  const raw = window.sessionStorage.getItem(
    getDiagnosisStorageKey(diagnosisId),
  );
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

// AI Doctor bat buoc dang nhap — khong con nhanh khach vang lai goi "/public/ai-doctor/*" nua,
// moi request deu di qua "/ai-doctor/*" (yeu cau JWT hop le, BE tra 401 neu chua dang nhap).
export const aiDoctorService = {
  async diagnose(image: File, userSymptoms?: string) {
    const formData = new FormData();
    formData.append("image", image);

    if (userSymptoms?.trim()) {
      formData.append("userSymptoms", userSymptoms.trim());
    }

    const response = await apiJava.post<AiDoctorDiagnosisResponse>(
      "/ai-doctor/diagnosis",
      formData,
      { headers: { "Content-Type": "multipart/form-data" }, timeout: 90000 },
    );

    persistDiagnosis(response.data);
    return response.data;
  },

  async getDailyRecordDates() {
    const response = await apiJava.get<AiDoctorDailyRecordListResponse>(
      "/ai-doctor/daily-records",
    );
    return response.data;
  },

  async getConversation(date: string) {
    const response = await apiJava.get<AiDoctorConversationTurn[]>(
      `/ai-doctor/conversation/${date}`,
    );
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
    persistDiagnosis(response.data);
    return response.data;
  },

  async generatePrescriptionForStage(
    diagnosisId: string | number,
    stageIndex: number,
  ) {
    const response = await apiJava.post<AiDoctorDiagnosisResponse>(
      `/ai-doctor/diagnosis/${diagnosisId}/prescription/stages/${stageIndex}`,
      {},
      { timeout: 120000 },
    );
    persistDiagnosis(response.data);
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
    const response = await apiJava.post<AiDoctorChatResponse>(
      "/ai-doctor/chat",
      {
        message,
        // BE co the mo phien hoi lam ro nhieu luot (AiChatClarifySession) khoa theo sessionId —
        // sessionId doi moi tin nhan se khien BE khong noi lai duoc cau hoi truoc do voi cau tra
        // loi tiep theo.
        sessionId: getChatSessionId(),
        diagnosisContext: diagnosisContext
          ? {
              diseaseCode: diagnosisContext.diseaseCode,
              diseaseName: diagnosisContext.diseaseName,
            }
          : undefined,
        imageBase64: image?.base64,
        imageMimeType: image?.mimeType,
      },
      { timeout: image ? 60000 : undefined },
    );
    return response.data;
  },

  async clarify(
    diagnosisId: string,
    payload: {
      answer?: string;
      candidateDiseaseCodes?: string[];
      imageUrl?: string;
      initialSymptoms?: string;
    },
  ) {
    const response = await apiJava.post<AiDoctorClarifyResponse>(
      `/ai-doctor/diagnosis/${diagnosisId}/clarify`,
      payload,
    );

    // Khi đã chốt bệnh, cập nhật lại cache — nếu không, /ai-doctor/result?id=X sẽ vẫn hiển thị
    // kết quả cũ (needsClarification=true, bệnh đoán ban đầu) thay vì kết luận thật vừa chốt.
    if (response.data.type === "DECISION" && response.data.diagnosis) {
      persistDiagnosis({
        ...response.data.diagnosis,
        needsClarification: false,
      });
    }

    return response.data;
  },

  getCachedDiagnosis,
  getLastDiagnosisId,
  getChatSessionId,
};
