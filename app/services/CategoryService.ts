import { apiJava, buildJavaApiUrl } from "@/lib/axios";
import { CategoryDTO } from "@/app/types/category.type";

const PREFIX = "/categories";
const PUBLIC_CATEGORIES_RETRY_DELAY_MS = 30_000;

const normalizeCategoryName = (value: unknown) => {
  if (typeof value !== "string") {
    return "";
  }

  const trimmedValue = value.trim().replace(/\s+/g, " ");
  if (!trimmedValue) {
    return "";
  }

  const lowerCaseValue = trimmedValue.toLocaleLowerCase("vi");
  return (
    lowerCaseValue.charAt(0).toLocaleUpperCase("vi") + lowerCaseValue.slice(1)
  );
};

let publicCategoriesCache: CategoryDTO[] | null = null;
let publicCategoriesInFlight: Promise<CategoryDTO[]> | null = null;
let publicCategoriesLastFailedAt = 0;

type CategoryStatus = "ACTIVE" | "INACTIVE";

interface ApiEnvelope<T> {
  data: T | null;
  message?: string;
  success?: boolean;
}

export interface CategoryPayload {
  name: string;
  imageUrl?: string;
  status: CategoryStatus;
  parentId: number | null;
}

export interface CategoryItem extends CategoryPayload {
  id: number;
  parentName?: string | null;
  productCount?: number;
}

interface CategoryStatusUpdatePayload {
  name: string;
  status: CategoryStatus;
}

const normalizeCategoryItem = <T extends CategoryItem | CategoryDTO>(
  category: T,
): T => ({
  ...category,
  name: normalizeCategoryName(category.name),
  parentName:
    "parentName" in category && typeof category.parentName === "string"
      ? normalizeCategoryName(category.parentName)
      : category.parentName,
});

const normalizeCategoryPayload = (data: CategoryPayload): CategoryPayload => ({
  ...data,
  name: normalizeCategoryName(data.name),
});

const hasDataField = <T>(value: unknown): value is ApiEnvelope<T> =>
  typeof value === "object" && value !== null && "data" in value;

const unwrapData = <T>(payload: T | ApiEnvelope<T>): T | null =>
  hasDataField<T>(payload) ? payload.data : payload;

// Lấy danh sách danh mục (có lọc theo từ khóa và trạng thái)
export const getCategories = async (keyword?: string, status?: string) => {
  const response = await apiJava.get<ApiEnvelope<CategoryItem[]>>(PREFIX, {
    params: {
      keyword: keyword || undefined,
      status: status && status !== "all" ? status : undefined,
    },
  });
  const categories = unwrapData(response.data) ?? [];
  return Array.isArray(categories)
    ? categories.map((category) => normalizeCategoryItem(category))
    : [];
};

// Lấy chi tiết 1 danh mục theo ID
export const getCategoryById = async (id: number) => {
  const response = await apiJava.get<ApiEnvelope<CategoryItem>>(`${PREFIX}/${id}`);
  const category = unwrapData(response.data);
  return category ? normalizeCategoryItem(category) : null;
};

// Tạo danh mục mới
export const createCategory = async (data: CategoryPayload) => {
  const response = await apiJava.post(PREFIX, normalizeCategoryPayload(data));
  return response.data;
};

// Cập nhật danh mục
export const updateCategory = async (id: number, data: CategoryPayload) => {
  const response = await apiJava.put(
    `${PREFIX}/${id}`,
    normalizeCategoryPayload(data),
  );
  return response.data;
};

// Xóa danh mục
export const deleteCategory = async (id: number) => {
  await apiJava.delete(`${PREFIX}/${id}`);
};

// Thay đổi trạng thái ẩn/hiện
export const toggleCategoryStatus = async (
  id: number,
  data: CategoryStatusUpdatePayload
) => {
  const category = await getCategoryById(id);
  if (!category) {
    throw new Error("Không tìm thấy danh mục");
  }

  const response = await apiJava.put(`${PREFIX}/${id}`, {
    name: normalizeCategoryName(data.name),
    imageUrl: category.imageUrl,
    parentId: category.parentId,
    status: data.status,
  });
  return response.data;
};

// Lấy danh mục công khai cho trang chủ
export const getPublicCategories = async (): Promise<CategoryDTO[]> => {
  if (publicCategoriesCache) {
    return publicCategoriesCache;
  }

  if (publicCategoriesInFlight) {
    return publicCategoriesInFlight;
  }

  if (
    publicCategoriesLastFailedAt > 0 &&
    Date.now() - publicCategoriesLastFailedAt < PUBLIC_CATEGORIES_RETRY_DELAY_MS
  ) {
    return [];
  }

  const publicRequestConfig = { isPublic: true } as Parameters<
    typeof apiJava.get
  >[1] & { isPublic: true };

  publicCategoriesInFlight = apiJava
    .get<CategoryDTO[]>(buildJavaApiUrl("/public/categories"), publicRequestConfig)
    .then((response) => {
      const data = Array.isArray(response.data)
        ? response.data.map((category) => normalizeCategoryItem(category))
        : [];
      publicCategoriesCache = data;
      publicCategoriesLastFailedAt = 0;
      return data;
    })
    .catch(() => {
      publicCategoriesLastFailedAt = Date.now();
      return [];
    })
    .finally(() => {
      publicCategoriesInFlight = null;
    });

  return publicCategoriesInFlight;
};
