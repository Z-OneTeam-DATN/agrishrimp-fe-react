import { apiJava, apiNext } from "@/lib/axios";
import {
  RegisterRequest,
  UserResponse,
  AuthResponse,
} from "@/app/types/auth.schema";

import { LoginFormValues, UserType } from "../types/user.schema";
export class AuthService {
  private static readonly PREFIX = "/auth";

  static async meTokenNext(): Promise<AuthResponse> {
    const response = await apiNext.get<AuthResponse>(`${this.PREFIX}/me-token`);
    return response.data;
  }

  static async me(): Promise<UserType> {
    const response = await apiJava.get<UserType>(`${this.PREFIX}/me`);
    return response.data;
  }

  static async login(userData: LoginFormValues): Promise<AuthResponse> {
    const response = await apiJava.post<AuthResponse>(
      `${this.PREFIX}/login`,
      userData,
    );
    return response.data;
  }

  static async loginNext(request: LoginFormValues): Promise<AuthResponse> {
    const response = await apiNext.post<AuthResponse>(
      `${this.PREFIX}/login`,
      request,
    );
    return response.data;
  }

  static async logout(): Promise<{ res: { message: string } }> {
    const response = await apiJava.post<{ res: { message: string } }>(
      `${this.PREFIX}/logout`,
    );
    return response.data;
  }

  static async logoutNext(): Promise<UserType> {
    const response = await apiNext.post<UserType>(`${this.PREFIX}/logout`);
    return response.data;
  }

  static async refreshAuthTokenNext(): Promise<AuthResponse> {
    const response = await apiNext.post<AuthResponse>(`${this.PREFIX}/refresh`);
    return response.data;
  }

  static async refresh(refreshToken: string): Promise<AuthResponse> {
    const response = await apiJava.post<AuthResponse>(
      `${this.PREFIX}/refresh`,
      { refreshToken },
    );
    return response.data;
  }

  // ĐĂNG KÝ
  static async register(userData: RegisterRequest): Promise<UserResponse> {
    const response = await apiJava.post<UserResponse>("/auth/signup", userData);
    return response.data;
  }

  // ĐĂNG NHẬP GG
  static async loginWithGoogle(token: string): Promise<AuthResponse> {
    const response = await apiJava.post<AuthResponse>(
      `${this.PREFIX}/google-login`,
      {
        token: token,
      },
    );
    return response.data;
  }
}
