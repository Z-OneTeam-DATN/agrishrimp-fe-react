import { apiJava } from "@/lib/axios";
import { SupplierFormValues } from "@/app/types/admin.schema";
import { Supplier, PageResponse, SupplierProductCatalogItem, SupplierProductCatalogStatus } from "@/app/types/supplier.type";

export const supplierService = {
    PREFIX: "/suppliers",
    EXTERNAL_PREFIX: "/external",

    getAll: async (
        keyword?: string,
        status?: string,
        page: number = 0,
        size: number = 10,
    ) => {
        const response = await apiJava.get<PageResponse<Supplier>>(
            `${supplierService.PREFIX}`,
            {
                params: {
                    keyword,
                    status: status === "all" ? null : status,
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

    // 3. TẠO MỚI (Đã xóa category và paymentTerms)
    create: async (data: SupplierFormValues) => {
        const payload = {
            ...data,
            status: data.status?.toUpperCase(),
        };

        const response = await apiJava.post<Supplier>(
            `${supplierService.PREFIX}`,
            payload,
        );
        return response.data;
    },

    // 4. CẬP NHẬT (Đã xóa category và paymentTerms)
    update: async (id: number, data: SupplierFormValues) => {
        const payload = {
            ...data,
            status: data.status?.toUpperCase(),
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

    // Lấy lịch sử nhập hàng của 1 NCC
    getImportHistory: async (id: number) => {
        const response = await apiJava.get(`${supplierService.PREFIX}/${id}/imports`);
        return response.data;
    },

    getProductCatalog: async (id: number): Promise<SupplierProductCatalogItem[]> => {
        const response = await apiJava.get(`${supplierService.PREFIX}/${id}/product-catalog`);
        return response.data;
    },

    saveProductCatalog: async (
        id: number,
        items: Array<{
            productId: number;
            status: SupplierProductCatalogStatus;
            note?: string;
        }>,
    ): Promise<SupplierProductCatalogItem[]> => {
        const response = await apiJava.put(`${supplierService.PREFIX}/${id}/product-catalog`, items);
        return response.data;
    },
};