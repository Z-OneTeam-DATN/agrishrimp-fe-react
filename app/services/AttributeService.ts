import { apiJava, buildJavaApiUrl } from "@/lib/axios";

const PREFIX = "/attributes";

export interface PublicAttributeValueDetail {
  attributeId?: number;
  attributeName?: string;
  attributeCode?: string;
  valueId?: number;
  value: string;
}

export interface PublicAttributeDTO {
  id: number;
  name: string;
  code?: string;
  status?: "ACTIVE" | "INACTIVE";
  values?: string[];
  valueDetails?: PublicAttributeValueDetail[];
}

export const getAttributes = async () => {
  const response = await apiJava.get(PREFIX);
  return response.data;
};

export const getPublicAttributes = async (): Promise<PublicAttributeDTO[]> => {
  try {
    const response = await apiJava.get(
      buildJavaApiUrl("/public/attributes"),
      { isPublic: true } as any,
    );
    return Array.isArray(response.data) ? response.data : [];
  } catch (error) {
    console.error("Lỗi khi lấy thuộc tính public:", error);
    return [];
  }
};

export const getAttributeById = async (id: number) => {
  const response = await apiJava.get(`${PREFIX}/${id}`);
  return response.data;
};

export const createAttribute = async (data: any) => {
  const response = await apiJava.post(PREFIX, data);
  return response.data;
};

export const updateAttribute = async (id: number, data: any) => {
  const response = await apiJava.put(`${PREFIX}/${id}`, data);
  return response.data;
};

export const deleteAttribute = async (id: number) => {
  const response = await apiJava.delete(`${PREFIX}/${id}`);
  return response.data;
};
