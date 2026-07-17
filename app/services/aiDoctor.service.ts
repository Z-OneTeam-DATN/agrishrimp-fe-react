import { apiJava } from "@/lib/axios";
import type {
  AiDoctorChatResponse,
  AiDoctorDiagnosisResponse,
  AiDoctorHistoryListResponse,
  AiDoctorPrompt,
} from "@/app/types/ai-doctor.types";
import { useAuthStore } from "@/stores/useAuthStore";

const DIAGNOSIS_STORAGE_PREFIX = "ai-doctor:diagnosis:";
const LAST_DIAGNOSIS_ID_KEY = "ai-doctor:last-id";
const PUBLIC_SESSION_ID_KEY = "ai-doctor:public-session-id";

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

const getPublicSessionId = () => {
  if (!canUseStorage()) return undefined;

  let sessionId = window.localStorage.getItem(PUBLIC_SESSION_ID_KEY);
  if (sessionId) return sessionId;

  sessionId = crypto?.randomUUID?.() ?? `session_${Date.now()}`;
  window.localStorage.setItem(PUBLIC_SESSION_ID_KEY, sessionId);
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
      const sessionId = getPublicSessionId();
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

  async chat(message: string, diagnosisContext?: { diseaseCode?: string; diseaseName?: string }) {
    const isPrivate = hasPrivateAccess();
    const response = await apiJava.post<AiDoctorChatResponse>(
      isPrivate ? "/ai-doctor/chat" : "/public/ai-doctor/chat",
      {
      message,
      sessionId: isPrivate ? undefined : getPublicSessionId(),
      diagnosisContext: diagnosisContext
        ? { diseaseCode: diagnosisContext.diseaseCode, diseaseName: diagnosisContext.diseaseName }
        : undefined,
    },
      { isPublic: !isPrivate } as any,
    );
    return response.data;
  },

  async getPrompts() {
    const response = await apiJava.get<AiDoctorPrompt[]>("/public/ai-doctor/prompts", {
      isPublic: true,
    } as any);
    return response.data;
  },

  getCachedDiagnosis,
  getLastDiagnosisId,
  getPublicSessionId,
};
