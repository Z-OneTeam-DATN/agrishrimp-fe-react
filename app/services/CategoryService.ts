import axios from "axios";
const API_URL = "http://localhost:8080/api/categories";

export const getCategories = async () => {
  try {
    const response = await axios.get(API_URL);
    return response.data || [];
  } catch (error) {
    console.error("Lỗi khi lấy danh sách danh mục:", error);
    return [];
  }
};

export const createCategory = async (data: any) => {
  const response = await axios.post(API_URL, data);
  return response.data;
};

export const deleteCategory = async (id: number) => {
  await axios.delete(`${API_URL}/${id}`);
};

// Lấy chi tiết 1 danh mục theo ID
export const getCategoryById = async (id: number) => {
  const response = await axios.get(`${API_URL}/${id}`);
  return response.data;
};

// Cập nhật danh mục
export const updateCategory = async (id: number, data: any) => {
  const response = await axios.put(`${API_URL}/${id}`, data);
  return response.data;
};