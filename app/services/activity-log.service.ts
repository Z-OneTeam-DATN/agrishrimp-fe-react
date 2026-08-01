import { apiJava } from "@/lib/axios";
import { repairVietnameseData } from "@/lib/utils";

export type ActivityLogItem = {
  id: number;
  actorUserId?: number | null;
  actorName?: string | null;
  actorRoleSlug?: string | null;
  branchId?: number | null;
  branchName?: string | null;
  module: string;
  moduleLabel?: string | null;
  action: string;
  actionLabel?: string | null;
  permissionCode?: string | null;
  targetType?: string | null;
  targetId?: string | null;
  targetLabel?: string | null;
  message: string;
  httpMethod?: string | null;
  requestPath?: string | null;
  ipAddress?: string | null;
  createdAt: string;
};

export type ActivityLogModule = {
  code: string;
  label: string;
};

export type ActivityLogPage = {
  content: ActivityLogItem[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
};

export type ActivityLogSearchParams = {
  branchId?: number;
  module?: string;
  fromDate?: string;
  toDate?: string;
  keyword?: string;
  page?: number;
  size?: number;
};

export const activityLogService = {
  PREFIX: "/admin/activity-logs",

  search: async (params: ActivityLogSearchParams): Promise<ActivityLogPage> => {
    const response = await apiJava.get<ActivityLogPage>(activityLogService.PREFIX, {
      params: {
        ...params,
        branchId: params.branchId || undefined,
        module: params.module && params.module !== "all" ? params.module : undefined,
        keyword: params.keyword?.trim() || undefined,
      },
    });

    return repairVietnameseData(response.data);
  },

  getModules: async (): Promise<ActivityLogModule[]> => {
    const response = await apiJava.get<ActivityLogModule[]>(`${activityLogService.PREFIX}/modules`);
    return repairVietnameseData(response.data);
  },
};
