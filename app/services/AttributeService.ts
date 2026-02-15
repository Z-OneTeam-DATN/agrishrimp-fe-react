import axios from "axios";

const API_URL = "http://localhost:8080/api/attributes";

export const getAttributes = async () => {
  const response = await axios.get(API_URL);
  return response.data;
};

export const getAttributeById = async (id: number) => {
  const response = await axios.get(`${API_URL}/${id}`);
  return response.data;
};

export const createAttribute = async (data: any) => {
  return await axios.post(API_URL, data);
};

export const updateAttribute = async (id: number, data: any) => {
  return await axios.put(`${API_URL}/${id}`, data);
};

export const deleteAttribute = async (id: number) => {
  return await axios.delete(`${API_URL}/${id}`);
};
