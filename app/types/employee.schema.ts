export interface UserRequest {
  fullName: string;
  employeeCode: string;
  email: string;
  password?: string;
  phoneNumber: string;
  address: string;
  dateOfBirth: string;
  avatarUrl?: string;
  status: string; // ACTIVE, INACTIVE
  startDate: string; // Ngày vào làm
  branchId: number;
  roleId: number;
  // Các trường bổ sung nếu cần (theo đặc tả VN)
  citizenId?: string;
  gender?: number; 
}

export interface UserResponse {
  id: number;
  fullName: string;
  employeeCode: string;
  email: string;
  phoneNumber: string;
  address: string;
  dateOfBirth: string;
  avatarUrl?: string;
  status: string;
  startDate: string;
  branch: {
    id: number;
    name: string;
    code: string;
  };
  role: {
    id: number;
    displayName: string;
    slug: string;
  };
  createdAt: string;
}

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

export interface BranchType {
  id: number;
  name: string;
  code: string;
}
