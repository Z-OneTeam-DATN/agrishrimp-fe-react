import { apiJava } from "@/lib/axios";
import { CategoryDTO } from "@/app/types/category.type";

const PREFIX = "/categories";

export const getPublicCategories = async (): Promise<CategoryDTO[]> => {
  try {
    const response = await apiJava.get(`/public/categories`, { isPublic: true } as any);
    const data = response.data;
    if (Array.isArray(data)) return data;
    if (data?.data && Array.isArray(data.data)) return data.data;
    return [];
  } catch (e) {
    console.error("Không thể tải danh sách danh mục:", e);
    return [];
  }
};

export const getCategories = async () => {
  try {
    const response = await apiJava.get(PREFIX);
    return response.data || [];
  } catch (error) {
    console.error("Lỗi khi lấy danh sách danh mục:", error);

    throw error;
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
