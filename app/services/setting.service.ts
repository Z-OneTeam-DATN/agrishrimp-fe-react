import { apiJava } from "@/lib/axios";

export const SettingService = {
    PREFIX: "/admin/settings",

    // 1. Lấy biên lợi nhuận hiện tại
    getProfitMargin: async (): Promise<{ margin: string }> => {
        const response = await apiJava.get(`${SettingService.PREFIX}/profit-margin`);
        return response.data;
    },

    // 2. Cập nhật biên lợi nhuận mới
    updateProfitMargin: async (margin: string): Promise<{ success: boolean; message: string }> => {
        const response = await apiJava.put(`${SettingService.PREFIX}/profit-margin`, { margin });
        return response.data;
    },
};