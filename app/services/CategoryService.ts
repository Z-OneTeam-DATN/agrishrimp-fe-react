import { apiJava } from "@/lib/axios";

const PREFIX = "/categories";

export const getCategories = async () => {
  try {
    const response = await apiJava.get(PREFIX, { isPublic: true } as any);
    return response.data || [];
  } catch (error) {
    console.error("Lỗi khi lấy danh sách danh mục:", error);
    return [];
  }
};

export const createCategory = async (data: any) => {
  const response = await apiJava.post(PREFIX, data);
  return response.data;
};

export const deleteCategory = async (id: number) => {
  await apiJava.delete(`${PREFIX}/${id}`);
};

// Lấy chi tiết 1 danh mục theo ID
export const getCategoryById = async (id: number) => {
  const response = await apiJava.get(`${PREFIX}/${id}`);
  return response.data;
};

// Cập nhật danh mục
export const updateCategory = async (id: number, data: any) => {
  const response = await apiJava.put(`${PREFIX}/${id}`, data);
  return response.data;
};
