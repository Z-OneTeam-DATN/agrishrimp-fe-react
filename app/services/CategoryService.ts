import { apiJava } from "@/lib/axios";

const PREFIX = "/categories";

// Lấy danh sách danh mục (có lọc theo từ khóa và trạng thái)
export const getCategories = async (keyword?: string, status?: string) => {
  try {
    // Thử gọi không có params để debug lỗi 500
    console.log("DEBUG: Calling GET /categories without params");
    const response = await apiJava.get(PREFIX);
    console.log("DEBUG: Categories response data:", response.data);
    return response.data || [];
  } catch (error: any) {
    console.error("Lỗi khi lấy danh sách danh mục (DEBUG):", error.response?.data || error.message);
    throw error;
  }
};

// Lấy chi tiết 1 danh mục theo ID
export const getCategoryById = async (id: number) => {
  const response = await apiJava.get(`${PREFIX}/${id}`);
  return response.data;
};

// Tạo danh mục mới
export const createCategory = async (data: any) => {
  const response = await apiJava.post(PREFIX, data);
  return response.data;
};

// Cập nhật danh mục
export const updateCategory = async (id: number, data: any) => {
  const response = await apiJava.put(`${PREFIX}/${id}`, data);
  return response.data;
};

// Xóa danh mục
export const deleteCategory = async (id: number) => {
  await apiJava.delete(`${PREFIX}/${id}`);
};

// Thay đổi trạng thái ẩn/hiện
export const toggleCategoryStatus = async (id: number, currentStatus: string) => {
  const category = await getCategoryById(id);
  // Đảo ngược trạng thái
  const newStatus = currentStatus === "Hiển thị" || currentStatus === "ACTIVE" ? "INACTIVE" : "ACTIVE";

  const response = await apiJava.put(`${PREFIX}/${id}`, {
    ...category,
    status: newStatus
  });
  return response.data;
};

// Lấy danh mục công khai cho trang chủ
export const getPublicCategories = async () => {
  try {
    const response = await apiJava.get(`/public/categories`, { isPublic: true } as any);
    return response.data || [];
  } catch (e) {
    console.error("Không thể tải danh mục công khai:", e);
    return [];
  }
};