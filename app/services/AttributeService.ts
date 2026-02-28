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