import { apiJava } from "@/lib/axios";
import type {
  AiDoctorDiagnosisResponse,
  AiDoctorHistoryListResponse,
} from "@/app/types/ai-doctor.types";

const DIAGNOSIS_STORAGE_PREFIX = "ai-doctor:diagnosis:";
const LAST_DIAGNOSIS_ID_KEY = "ai-doctor:last-id";

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

export const aiDoctorService = {
  async diagnose(image: File, userSymptoms?: string) {
    const formData = new FormData();
    formData.append("image", image);

    if (userSymptoms?.trim()) {
      formData.append("userSymptoms", userSymptoms.trim());
    }

    const response = await apiJava.post<AiDoctorDiagnosisResponse>(
      "/miniapp/diagnosis",
      formData,
      {
        headers: { "Content-Type": "multipart/form-data" },
        timeout: 90000,
      },
    );

    persistDiagnosis(response.data);
    return response.data;
  },

  async getHistory(page: number = 0, size: number = 20) {
    const response = await apiJava.get<AiDoctorHistoryListResponse>("/miniapp/history", {
      params: { page, size },
    });
    return response.data;
  },

  async getDiagnosisDetail(diagnosisId: string | number) {
    const response = await apiJava.get<AiDoctorDiagnosisResponse>(
      `/miniapp/diagnosis/${diagnosisId}`,
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

  getCachedDiagnosis,
  getLastDiagnosisId,
};
