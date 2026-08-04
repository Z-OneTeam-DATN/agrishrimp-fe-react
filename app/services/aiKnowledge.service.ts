import { apiJava, buildJavaApiUrl } from "@/lib/axios";
import type {
  AiDiseaseKnowledge,
  AiKnowledgeCategory,
  AiKnowledgeChatConfig,
  AiKnowledgeImportPreview,
  AiKnowledgeReviewCase,
  AiKeywordAnswerSet,
} from "@/app/types/ai-knowledge.types";
import type { AiDoctorChatResponse } from "@/app/types/ai-doctor.types";

export const aiKnowledgeService = {
  async getCategories() {
    const response = await apiJava.get<AiKnowledgeCategory[]>("/ai-knowledge/categories");
    return response.data;
  },

  async createCategory(payload: Record<string, unknown>) {
    const response = await apiJava.post<AiKnowledgeCategory>("/ai-knowledge/categories", payload);
    return response.data;
  },

  async updateCategory(id: number, payload: Record<string, unknown>) {
    const response = await apiJava.put<AiKnowledgeCategory>(`/ai-knowledge/categories/${id}`, payload);
    return response.data;
  },

  async deleteCategory(id: number) {
    await apiJava.delete(`/ai-knowledge/categories/${id}`);
  },

  async getKeywordSets() {
    const response = await apiJava.get<AiKeywordAnswerSet[]>("/ai-knowledge/keyword-sets");
    return response.data;
  },

  async createKeywordSet(payload: Record<string, unknown>) {
    const response = await apiJava.post<AiKeywordAnswerSet>("/ai-knowledge/keyword-sets", payload);
    return response.data;
  },

  async updateKeywordSet(id: number, payload: Record<string, unknown>) {
    const response = await apiJava.put<AiKeywordAnswerSet>(`/ai-knowledge/keyword-sets/${id}`, payload);
    return response.data;
  },

  async deleteKeywordSet(id: number) {
    await apiJava.delete(`/ai-knowledge/keyword-sets/${id}`);
  },

  async getDiseases() {
    const response = await apiJava.get<AiDiseaseKnowledge[]>("/ai-knowledge/diseases");
    return response.data;
  },

  async createDisease(payload: Record<string, unknown>) {
    const response = await apiJava.post<AiDiseaseKnowledge>("/ai-knowledge/diseases", payload);
    return response.data;
  },

  async updateDisease(id: number, payload: Record<string, unknown>) {
    const response = await apiJava.put<AiDiseaseKnowledge>(`/ai-knowledge/diseases/${id}`, payload);
    return response.data;
  },

  async deleteDisease(id: number) {
    await apiJava.delete(`/ai-knowledge/diseases/${id}`);
  },

  async approveDisease(id: number) {
    const response = await apiJava.patch<AiDiseaseKnowledge>(`/ai-knowledge/diseases/${id}/approve`);
    return response.data;
  },

  async rejectDisease(id: number, reason?: string) {
    const response = await apiJava.patch<AiDiseaseKnowledge>(`/ai-knowledge/diseases/${id}/reject`, { reason });
    return response.data;
  },

  async setDiseaseVisibility(id: number, enabled: boolean) {
    const response = await apiJava.patch<AiDiseaseKnowledge>(`/ai-knowledge/diseases/${id}/visibility`, { enabled });
    return response.data;
  },

  async getConfig() {
    const response = await apiJava.get<AiKnowledgeChatConfig>("/ai-knowledge/config");
    return response.data;
  },

  async updateConfig(payload: Record<string, unknown>) {
    const response = await apiJava.put<AiKnowledgeChatConfig>("/ai-knowledge/config", payload);
    return response.data;
  },

  async getReviewCases(status?: string) {
    const response = await apiJava.get<AiKnowledgeReviewCase[]>("/ai-knowledge/review-cases", {
      params: status ? { status } : undefined,
    });
    return response.data;
  },

  async updateReviewCase(id: number, payload: { status?: string; matchedKnowledgeCode?: string; resolutionNotes?: string }) {
    const response = await apiJava.put<AiKnowledgeReviewCase>(`/ai-knowledge/review-cases/${id}`, payload);
    return response.data;
  },

  async previewImport(file: File, mode: "OVERWRITE" | "UPSERT_NEW") {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("mode", mode);
    const response = await apiJava.post<AiKnowledgeImportPreview>("/ai-knowledge/import/preview", formData, {
      headers: { "Content-Type": "multipart/form-data" },
      timeout: 120000,
    });
    return response.data;
  },

  async applyImport(payload: AiKnowledgeImportPreview) {
    const response = await apiJava.post<AiKnowledgeImportPreview>("/ai-knowledge/import/apply", {
      mode: payload.mode,
      rows: payload.rows,
    });
    return response.data;
  },

  getTemplateDownloadUrl() {
    return buildJavaApiUrl("/ai-knowledge/import/template");
  },

  async testChat(message: string) {
    const response = await apiJava.post<AiDoctorChatResponse>("/ai-knowledge/test-chat", { message });
    return response.data;
  },
};
