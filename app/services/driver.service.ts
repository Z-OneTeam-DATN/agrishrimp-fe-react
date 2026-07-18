import { apiJava } from "@/lib/axios";
import { DriverFormValues, Driver } from "@/app/types/driver.schema";
import { PageResponse } from "@/app/types/supplier.type";

export const driverService = {
  PREFIX: "/drivers",

  getAll: async (
    keyword?: string,
    status?: string,
    page: number = 0,
    size: number = 10,
  ) => {
    const response = await apiJava.get<PageResponse<Driver>>(
      `${driverService.PREFIX}`,
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

  getById: async (id: number) => {
    const response = await apiJava.get<Driver>(
      `${driverService.PREFIX}/${id}`,
    );
    return response.data;
  },

  create: async (data: DriverFormValues) => {
    const payload = {
      ...data,
      status: data.status?.toUpperCase(),
    };
    const response = await apiJava.post<Driver>(
      `${driverService.PREFIX}`,
      payload,
    );
    return response.data;
  },

  update: async (id: number, data: DriverFormValues) => {
    const payload = {
      ...data,
      status: data.status?.toUpperCase(),
    };
    const response = await apiJava.put<Driver>(
      `${driverService.PREFIX}/${id}`,
      payload,
    );
    return response.data;
  },

  delete: async (id: number) => {
    const response = await apiJava.delete<{ message: string }>(
      `${driverService.PREFIX}/${id}`,
    );
    return response.data;
  },
};
