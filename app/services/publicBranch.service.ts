import { apiJava, buildJavaApiUrl, type ApiPath } from "@/lib/axios";
import { BranchDTO } from "@/app/types/branch.type";

export const PublicBranchService = {
  PREFIX: "/public/branches" as const,

  getAll: async (): Promise<BranchDTO[]> => {
    const response = await apiJava.get(
      buildJavaApiUrl(PublicBranchService.PREFIX),
      {
        isPublic: true,
      } as any,
    );
    return response.data;
  },

  getById: async (id: number | string): Promise<BranchDTO> => {
    const response = await apiJava.get(
      buildJavaApiUrl(`${PublicBranchService.PREFIX}/${id}` as ApiPath),
      {
        isPublic: true,
      } as any,
    );
    return response.data;
  },
};
