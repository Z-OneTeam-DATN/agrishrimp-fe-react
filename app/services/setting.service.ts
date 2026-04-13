import { apiJava } from "@/lib/axios";

export type PriceRoundingRule = "NONE" | "STEP_500" | "STEP_1000" | "TAIL_99000";

export type ProfitSettingResponse = {
    margin: string;
    roundingRule?: PriceRoundingRule;
};

export const SettingService = {
    PREFIX: "/admin/settings",

    // 1. Lấy biên lợi nhuận hiện tại
    getProfitMargin: async (): Promise<ProfitSettingResponse> => {
        const response = await apiJava.get(`${SettingService.PREFIX}/profit-margin`);
        return response.data;
    },

    // 2. Cập nhật biên lợi nhuận mới
    updateProfitMargin: async (
        margin: string,
        roundingRule?: PriceRoundingRule
    ): Promise<{ success: boolean; message: string; roundingRule?: PriceRoundingRule }> => {
        const response = await apiJava.put(`${SettingService.PREFIX}/profit-margin`, { margin, roundingRule });
        return response.data;
    },
};