import { apiJava } from "@/lib/axios"; // 👈 Tuu đã thấy bạn dùng @/lib/axios, hãy giữ nguyên import này
import { SupplierFormValues } from "@/app/types/admin.schema";
import { Supplier, PageResponse } from "@/app/types/supplier.type";

export const supplierService = {
  PREFIX: "/suppliers",
  EXTERNAL_PREFIX: "/external",

  // 1. LẤY DANH SÁCH (Hỗ trợ lọc động)
  getAll: async (
    keyword?: string,
    categoryId?: string,
    status?: string,
    page: number = 0,
    size: number = 10,
  ) => {
    const response = await apiJava.get<PageResponse<Supplier>>(
      `${supplierService.PREFIX}`,
      {
        params: {
          keyword,
          category: categoryId === "all" ? null : categoryId, // BE nhận categoryId (Long)
          status: status === "all" ? null : status, // BE nhận status (Enum String)
          page,
          size,
        },
      },
    );
    return response.data;
  },

  // 2. LẤY CHI TIẾT
  getById: async (id: number) => {
    const response = await apiJava.get<Supplier>(
      `${supplierService.PREFIX}/${id}`,
    );
    return response.data;
  },

  // 3. TẠO MỚI (Lưu ý xử lý category ID)
  create: async (data: SupplierFormValues) => {
    const payload = {
      ...data,
      // Chuyển paymentTerms thành paymentTerm để khớp Entity Java
      paymentTerm: data.paymentTerms?.toUpperCase(),
      category: data.category,
      status: data.status?.toUpperCase(),
      paymentTerms: undefined,
    };

    const response = await apiJava.post<Supplier>(
      `${supplierService.PREFIX}`,
      payload,
    );
    return response.data;
  },

  // 4. CẬP NHẬT
  update: async (id: number, data: SupplierFormValues) => {
    const payload = {
      ...data,
      paymentTerm: data.paymentTerms?.toUpperCase(),
      category: data.category, // Giữ nguyên ID danh mục
      status: data.status?.toUpperCase(),
      paymentTerms: undefined,
    };

    const response = await apiJava.put<Supplier>(
      `${supplierService.PREFIX}/${id}`,
      payload,
    );
    return response.data;
  },

  // 5. XÓA
  delete: async (id: number) => {
    const response = await apiJava.delete<{ message: string }>(
      `${supplierService.PREFIX}/${id}`,
    );
    return response.data;
  },

  // Hàm tra cứu MST
  lookupTaxCode: async (taxCode: string) => {
    const response = await apiJava.get(
      `${supplierService.EXTERNAL_PREFIX}/business/${taxCode}`,
    );
    return response.data;
  },

  // Hàm tra cứu ngân hàng
  lookupBank: async (bin: string, accountNumber: string) => {
    console.log(
      "URL đang gọi:",
      `${supplierService.EXTERNAL_PREFIX}/bank-lookup`,
    );
    const response = await apiJava.post(
      `${supplierService.EXTERNAL_PREFIX}/bank-lookup`,
      {
        bin,
        accountNumber,
      },
    );
    return response.data;
  },

  getCategories: async () => {
    const response = await apiJava.get("/categories");
    return response.data;
  },
};
