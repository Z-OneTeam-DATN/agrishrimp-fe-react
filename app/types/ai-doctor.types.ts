export interface AiDoctorSuggestedProduct {
  id: number;
  name: string;
  image?: string;
  price?: number;
  webUrl?: string;
}

export interface AiDoctorTreatmentStage {
  stageTitle: string;
  instructions: string[];
  products: AiDoctorSuggestedProduct[];
}

export interface AiDoctorDiseaseInfo {
  code: string;
  nameVi: string;
  nameEn: string;
  confidencePercent: number;
}

export interface AiDoctorTopPrediction {
  diseaseCode: string;
  nameVi: string;
  nameEn: string;
  confidencePercent: number;
}

export interface AiDoctorDiagnosisResponse {
  diagnosisId: string;
  /** HEALTHY | DISEASE — FE dùng để phân nhánh UI */
  status?: "HEALTHY" | "DISEASE";
  imageUrl?: string;
  disease?: AiDoctorDiseaseInfo;
  topPredictions?: AiDoctorTopPrediction[];
  causes?: string[];
  signsSummary?: string;
  treatmentStages?: AiDoctorTreatmentStage[];
  purchaseUrl?: string;
  createdAt?: string;
}

export interface AiDoctorHistoryItem {
  diagnosisId: string;
  createdAt: string;
  imageUrl?: string;
  disease?: AiDoctorDiseaseInfo;
}

export interface AiDoctorHistoryListResponse {
  items: AiDoctorHistoryItem[];
  total: number;
  page: number;
  size: number;
}
