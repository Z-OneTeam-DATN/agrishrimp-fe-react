import { apiJava, buildJavaApiUrl } from "@/lib/axios";

export interface PublicAiDiseaseSuggestedProduct {
  id: number;
  name: string;
  image?: string | null;
  price?: number | null;
  webUrl?: string | null;
}

export interface PublicAiDiseaseTreatmentStage {
  stageTitle?: string | null;
  instructions: string[];
  products: PublicAiDiseaseSuggestedProduct[];
  extraProductNames: string[];
}

export interface PublicAiDisease {
  slug: string;
  code: string;
  nameVi: string;
  nameEn?: string | null;
  categoryName?: string | null;
  categorySlug?: string | null;
  signsSummary?: string | null;
  causes: string[];
  treatmentStages: PublicAiDiseaseTreatmentStage[];
  imageUrls?: string[];
  createdAt?: string | null;
  updatedAt?: string | null;
}

export const getPublicAiDiseases = async (): Promise<PublicAiDisease[]> => {
  try {
    const response = await apiJava.get<PublicAiDisease[]>(
      buildJavaApiUrl("/public/ai-diseases" as any),
      { isPublic: true } as any,
    );
    return Array.isArray(response.data) ? response.data : [];
  } catch {
    return [];
  }
};

export const getPublicAiDiseaseBySlug = async (
  slug: string,
): Promise<PublicAiDisease | null> => {
  try {
    const response = await apiJava.get<PublicAiDisease>(
      buildJavaApiUrl(`/public/ai-diseases/${slug}` as any),
      { isPublic: true } as any,
    );
    return response.data ?? null;
  } catch {
    return null;
  }
};
