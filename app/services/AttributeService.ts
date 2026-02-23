import { apiJava } from "@/lib/axios";

const PREFIX = "/attributes";

export const getAttributes = async () => {
  const response = await apiJava.get(PREFIX);
  return response.data;
};

export const getAttributeById = async (id: number) => {
  const response = await apiJava.get(`${PREFIX}/${id}`);
  return response.data;
};

export const createAttribute = async (data: any) => {
  return await apiJava.post(PREFIX, data);
};

export const updateAttribute = async (id: number, data: any) => {
  return await apiJava.put(`${PREFIX}/${id}`, data);
};

export const deleteAttribute = async (id: number) => {
  return await apiJava.delete(`${PREFIX}/${id}`);
};
