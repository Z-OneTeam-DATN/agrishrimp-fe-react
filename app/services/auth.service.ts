import { apiJava, apiNext } from "@/lib/axios";
import {
  RegisterRequest,
  AuthResponse,
  LoginFormValues,
} from "@/app/types/auth.schema";

import { UserType } from "../types/user.schema";
export class AuthService {
  private static readonly PREFIX = "/auth";

  static async meTokenNext(): Promise<AuthResponse> {
    const response = await apiNext.get<AuthResponse>(`${this.PREFIX}/me-token`);
    return response.data;
  }

  static async meNext(): Promise<UserType> {
    const response = await apiNext.get<UserType>(`${this.PREFIX}/me`);
    return response.data;
  }

  static async getMyPermissionsNext(): Promise<string[]> {
    const response = await apiNext.get<string[]>(`${this.PREFIX}/permissions`);
    return Array.isArray(response.data) ? response.data : [];
  }

  static async me(): Promise<UserType> {
      const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;

      const response = await apiJava.get<UserType>(`${this.PREFIX}/me`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
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

  static async logout(token?: string): Promise<{ res: { message: string } }> {
    const config = token
      ? { headers: { Authorization: `Bearer ${token}` } }
      : {};

    const response = await apiJava.post<{ res: { message: string } }>(
      `${this.PREFIX}/logout`,
      {},
      {
        ...config,
        timeout: 5000, // Shorter timeout for logout as it's best-effort
      },
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
      {
        timeout: 8000,
      },
    );
    return response.data;
  }

  // ĐĂNG KÝ
  static async registerJava(userData: RegisterRequest): Promise<AuthResponse> {
    const response = await apiJava.post<AuthResponse>("/auth/signup", userData);
    return response.data;
  }

  static async registerNext(userData: RegisterRequest): Promise<AuthResponse> {
    const response = await apiNext.post<AuthResponse>(
      `${this.PREFIX}/signup`,
      userData,
    );
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

  static async loginWithGoogleNext(token: string): Promise<AuthResponse> {
    const response = await apiNext.post<AuthResponse>(
      `${this.PREFIX}/google-login`,
      {
        token,
      },
    );
    return response.data;
  }

  // QUÊN MẬT KHẨU
  static async forgotPassword(
    email: string,
    captchaToken: string,
  ): Promise<{ message: string }> {
    const response = await apiJava.post<{ message: string }>(
      `${this.PREFIX}/forgot-password`,
      { email, captchaToken },
    );
    return response.data;
  }

  // ĐẶT LẠI MẬT KHẨU (từ token trong email)
  static async resetPassword(
    token: string,
    newPassword: string,
    confirmPassword: string,
  ): Promise<{ message: string }> {
    const response = await apiJava.post<{ message: string }>(
      `${this.PREFIX}/reset-password`,
      { token, newPassword, confirmPassword },
    );
    return response.data;
  }
}
