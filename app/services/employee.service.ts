import { apiJava } from '@/lib/axios'
import { UserRequest, UserResponse, PageResponse } from '@/app/types/employee.schema'

export class EmployeeService {
  private static readonly PREFIX = '/employees'

  static async getAll(params?: {
    keyword?: string;
    roleId?: number;
    branchId?: number;
    status?: string;
    page?: number;
    size?: number;
    sort?: string;
  }): Promise<PageResponse<UserResponse>> {
    const response = await apiJava.get<PageResponse<UserResponse>>(`${this.PREFIX}`, { params })
    return response.data
  }

  static async getById(id: number): Promise<UserResponse> {
    const response = await apiJava.get<UserResponse>(`${this.PREFIX}/${id}`)
    return response.data
  }

  static async create(data: UserRequest): Promise<UserResponse> {
    const response = await apiJava.post<UserResponse>(`${this.PREFIX}`, data)
    return response.data
  }

  static async update(id: number, data: UserRequest): Promise<UserResponse> {
    const response = await apiJava.put<UserResponse>(`${this.PREFIX}/${id}`, data)
    return response.data
  }

  static async delete(id: number): Promise<void> {
    await apiJava.delete(`${this.PREFIX}/${id}`)
  }

  static async updateStatus(id: number, status: string): Promise<void> {
    await apiJava.patch(`${this.PREFIX}/${id}/status`, { status })
  }

  static async resendCredentials(id: number): Promise<void> {
    await apiJava.post(`${this.PREFIX}/${id}/resend-credentials`)
  }
}
