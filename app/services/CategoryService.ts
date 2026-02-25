import { apiJava } from "@/lib/axios";
import { CategoryDTO } from "@/app/types/category.type";

const PREFIX = "/categories";

export const getPublicCategories = async (): Promise<CategoryDTO[]> => {
  // Thử đường dẫn chính thức trước
  try {
    const response = await apiJava.get(`${PREFIX}/public`, { isPublic: true } as any);
    const data = response.data;
    if (data) {
      if (Array.isArray(data)) return data;
      if (data.data && Array.isArray(data.data)) return data.data;
      if (data.success && Array.isArray(data.data)) return data.data;
    }
  } catch (e) {
    console.warn("Thử /categories/public không thành công, đang thử đường dẫn dự phòng...");
  }

  // Thử đường dẫn dự phòng nếu cái trên thất bại
  try {
    const response = await apiJava.get(`/public/categories`, { isPublic: true } as any);
    const data = response.data;
    if (data) {
      if (Array.isArray(data)) return data;
      if (data.data && Array.isArray(data.data)) return data.data;
    }
  } catch (e) {
    // Chỉ log lỗi nếu cả 2 đường dẫn đều thất bại
    console.error("Không thể kết nối tới bất kỳ API danh mục nào.");
  }

  return [];
};

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
