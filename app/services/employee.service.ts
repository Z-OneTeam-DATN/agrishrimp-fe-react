import { apiJava } from '@/lib/axios'
import { UserRequest, UserResponse, PageResponse, EmployeeCitizenIdOcrResponse } from '@/app/types/employee.schema'

export class EmployeeService {
  private static readonly PREFIX = '/employees'

  static async getAll(params?: {
    keyword?: string;
    roleId?: number;
    branchId?: number;
    permissionCode?: string;
    status?: string;
    page?: number;
    size?: number;
    sort?: string;
  }): Promise<PageResponse<UserResponse>> {
    const response = await apiJava.get<PageResponse<UserResponse>>(`${this.PREFIX}`, {
      params,
      timeout: 60000,
    })
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

  static async ocrCitizenId(file: File): Promise<EmployeeCitizenIdOcrResponse> {
    const formData = new FormData()
    formData.append('image', file)

    const response = await apiJava.post<EmployeeCitizenIdOcrResponse>(
      `${this.PREFIX}/ocr-citizen-id`,
      formData,
    )

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

  static async resendCredentials(id: number): Promise<string> {
    const response = await apiJava.post<string>(`${this.PREFIX}/${id}/resend-credentials`)
    return response.data
  }

  static async deletePermanently(id: number): Promise<void> {
    await apiJava.delete(`${this.PREFIX}/${id}/permanent`)
  }
}
