export interface AiDoctorSuggestedProduct {
  id: number;
  variantId?: number;
  name: string;
  image?: string;
  price?: number;
  webUrl?: string;
}

export interface AiDoctorTreatmentStage {
  stageTitle: string;
  instructions: string[];
  products: AiDoctorSuggestedProduct[];
  extraProductNames?: string[];
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
  /** HEALTHY | DISEASE | UNRECOGNIZED — FE dùng để phân nhánh UI */
  status?: "HEALTHY" | "DISEASE" | "UNRECOGNIZED";
  imageUrl?: string;
  clientImageUrl?: string;
  disease?: AiDoctorDiseaseInfo;
  topPredictions?: AiDoctorTopPrediction[];
  causes?: string[];
  signsSummary?: string;
  treatmentStages?: AiDoctorTreatmentStage[];
  purchaseUrl?: string;
  createdAt?: string;
  /** true khi độ tin cậy quá thấp — FE cần gọi clarify() để bác sĩ AI hỏi thêm thay vì kết luận ngay. */
  needsClarification?: boolean;
  /** Narrative HTML: mô tả ảnh của Gemini + trích dẫn độ tin cậy/tên bệnh YOLO, ghép sẵn ở BE.
   *  Chỉ có ở response của POST /diagnosis — luôn absent khi đọc lại qua GET /diagnosis/{id} hoặc /history. */
  aiDescription?: string;
}

/** Response của POST /diagnosis/{id}/clarify — mỗi lượt hỏi-đáp làm rõ bệnh với AI. */
export interface AiDoctorClarifyResponse {
  diagnosisId: string;
  type: "QUESTION" | "DECISION" | "ESCALATED";
  message: string;
  diagnosis?: AiDoctorDiagnosisResponse;
  /** Chỉ để debug/log — không hiển thị như bộ đếm cho nông dân. */
  turnsUsed?: number;
}

export interface AiDoctorHistoryItem {
  diagnosisId: string;
  createdAt: string;
  imageUrl?: string;
  disease?: AiDoctorDiseaseInfo;
  /** true = còn đang chờ hỏi-đáp AI xác nhận, disease ở trên chỉ là dự đoán chưa chốt */
  needsClarification?: boolean;
}

export interface AiDoctorChatResponse {
  success: boolean;
  conversationId?: string;
  reply: string;
  suggestedActions?: string[];
}

export interface AiDoctorHistoryListResponse {
  items: AiDoctorHistoryItem[];
  total: number;
  page: number;
  size: number;
}

/** Danh sách các ngày user đã chat/chẩn đoán với AI Doctor — dùng cho sidebar "Sổ khám". */
export interface AiDoctorDailyRecordListResponse {
  /** "yyyy-MM-dd", mới nhất trước */
  dates: string[];
}

/** Chi tiết "sổ khám" của 1 ngày — gộp on-demand từ chat chữ + chẩn đoán qua ảnh trong ngày đó. */
export interface AiDoctorDailyRecordDetailResponse {
  date: string;
  symptomsDescribed: string[];
  diseasesDiscussed: AiDoctorDiseaseInfo[];
  diagnoses: AiDoctorHistoryItem[];
}
