import { apiJava } from "@/lib/axios";
import { BranchDTO } from "@/app/types/branch.type";

export const PublicBranchService = {
  PREFIX: "/public/branches",

  getAll: async (): Promise<BranchDTO[]> => {
    const response = await apiJava.get(PublicBranchService.PREFIX, {
      isPublic: true,
    } as any);
    return response.data;
  },

  getById: async (id: number | string): Promise<BranchDTO> => {
    const response = await apiJava.get(`${PublicBranchService.PREFIX}/${id}`, {
      isPublic: true,
    } as any);
    return response.data;
  },
};
