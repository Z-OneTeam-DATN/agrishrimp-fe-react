export type AiKnowledgeStatus = "DRAFT" | "IN_REVIEW" | "APPROVED" | "DISABLED" | "ARCHIVED";
export type AiReviewCaseStatus = "NEW" | "IN_PROGRESS" | "RESOLVED" | "IGNORED";

export interface AiKnowledgeCategory {
  id: number;
  name: string;
  slug: string;
  description?: string | null;
  enabled: boolean;
  sortOrder: number;
}

export interface AiSuggestedProduct {
  id: number;
  name: string;
  image?: string | null;
  price?: number | null;
  webUrl?: string | null;
}

export interface AiKnowledgeTreatmentStage {
  stageTitle: string;
  instructions: string[];
  productIds: number[];
  products: AiSuggestedProduct[];
  extraProductNames: string[];
}

export interface AiKeywordAnswerSet {
  id: number;
  code: string;
  name: string;
  category?: AiKnowledgeCategory | null;
  keywordsRaw: string;
  answerHtml: string;
  enabled: boolean;
  matchThreshold: number;
  priority: number;
  canonical: boolean;
  status: AiKnowledgeStatus;
}

export interface AiDiseaseKnowledge {
  id: number;
  code: string;
  nameVi: string;
  nameEn?: string | null;
  category?: AiKnowledgeCategory | null;
  aliasesRaw?: string | null;
  symptomKeywordsRaw: string;
  signsSummary: string;
  causes: string[];
  treatmentStages: AiKnowledgeTreatmentStage[];
  confidenceThreshold: number;
  matchThreshold: number;
  enabled: boolean;
  priority: number;
  canonical: boolean;
  status: AiKnowledgeStatus;
}

export interface AiKnowledgeReviewCase {
  id: number;
  userId?: number | null;
  sessionId?: string | null;
  sourceChannel?: string | null;
  questionText?: string | null;
  userSymptoms?: string | null;
  imageUrl?: string | null;
  aiSuggestedDiseaseCode?: string | null;
  matchedKnowledgeCode?: string | null;
  matchScore?: number | null;
  reason: string;
  status: AiReviewCaseStatus;
  resolutionNotes?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface AiKnowledgeChatConfig {
  id: number;
  greetingMessage: string;
  fallbackMessage: string;
}

export interface AiKnowledgeImportRow {
  rowNumber: number;
  type: "FAQ" | "DISEASE";
  categoryName: string;
  code: string;
  name: string;
  status: string;
  valid: boolean;
  warnings: string[];
  errors: string[];
  aliasesRaw?: string | null;
  symptomKeywordsRaw?: string | null;
  answerHtml?: string | null;
  signsSummary?: string | null;
  causes: string[];
  treatmentStages: AiKnowledgeTreatmentStage[];
  matchThreshold: number;
  confidenceThreshold: number;
  enabled: boolean;
}

export interface AiKnowledgeImportPreview {
  mode: "OVERWRITE" | "UPSERT_NEW";
  totalRows: number;
  validRows: number;
  invalidRows: number;
  rows: AiKnowledgeImportRow[];
}

export interface AiKnowledgeReport {
  totalQuestions: number;
  matchedQuestions: number;
  unmatchedQuestions: number;
  reviewCaseCount: number;
  matchedTypeCounts: Record<string, number>;
  topUnmatchedQuestions: { question: string; count: number }[];
}
