import { apiJava } from '@/lib/axios'
import { RoleType, PermissionGroup, RoleDetail } from '@/app/types/role.schema'

export class RoleService {
  private static readonly PREFIX = '/roles'

  static async getAll(params?: {
    keyword?: string;
    type?: string;
    status?: string;
    page?: number;
    size?: number;
  }): Promise<any> {
    try {
      const response = await apiJava.get(`${this.PREFIX}`, { params })
      return response.data
    } catch (error) {
      console.error("Error in RoleService.getAll:", error)
      throw error
    }
  }

  static async getById(id: number): Promise<RoleDetail> {
    const response = await apiJava.get<RoleDetail>(`${this.PREFIX}/${id}`)
    return response.data
  }

  static async create(roleData: any): Promise<RoleType> {
    try {
      console.log("Sending role data to BE:", JSON.stringify(roleData, null, 2))
      const response = await apiJava.post<RoleType>(`${this.PREFIX}`, roleData)
      return response.data
    } catch (error: any) {
      if (error.response?.data) {
        console.error("Backend validation error:", error.response.data)
      }
      throw error
    }
  }

  static async update(id: number | string, roleData: any): Promise<RoleType> {
    try {
      console.log(`🚀 PUT REQUEST to: ${this.PREFIX}/${id}`);
      console.log("PAYLOAD:", JSON.stringify(roleData, null, 2));
      const response = await apiJava.put<RoleType>(`${this.PREFIX}/${id}`, roleData)
      return response.data
    } catch (error: any) {
      console.error("FULL UPDATE ERROR:", error);
      if (error.response?.data) {
        console.error("BACKEND DETAIL:", error.response.data);
      }
      throw error
    }
  }

  static async delete(id: number): Promise<void> {
    try {
      await apiJava.delete(`${this.PREFIX}/${id}`)
    } catch (error) {
      console.error("Error in RoleService.delete:", error)
      throw error
    }
  }

  static async fetchPermissionTree(): Promise<PermissionGroup[]> {
    try {
      const response = await apiJava.get<any>(`${this.PREFIX}/permissions`)
      const data = response.data
      if (Array.isArray(data)) return data
      if (data && Array.isArray(data.content)) return data.content
      return []
    } catch (error) {
      // Trả về mảng rỗng thay vì throw error để UI dùng Mock Data
      return []
    }
  }
}
