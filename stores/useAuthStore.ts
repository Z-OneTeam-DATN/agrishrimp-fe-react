import { AuthResponse } from "@/app/types/auth.schema";
import { UserType } from "@/app/types/user.schema";
import { create } from "zustand";

interface AuthStore {
  user?: UserType;
  accessToken: string | null;
  refreshToken?: string | null;
  isAuthenticated: boolean;
  isLoadingAuth: boolean;
  setAccessToken: (token: string | null) => void;
  setRefreshToken: (token: string | null) => void;
  setAccessAndRefreshToken: (data: AuthResponse) => void;
  setUser: (user?: UserType) => void;
  setAuth: (accessToken: string | null, refreshToken: string | null) => void;
  setLoadingAuth: (isLoading: boolean) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: undefined,
  accessToken: null,
  refreshToken: null,
  isAuthenticated: false,
  isLoadingAuth: true,
  setAccessToken: (accessToken) =>
    set({ accessToken, isAuthenticated: !!accessToken }),
  setRefreshToken: (refreshToken) => set({ refreshToken }),
  setAccessAndRefreshToken: (data: AuthResponse) =>
    set({
      accessToken: data.accessToken,
      refreshToken: data.refreshToken,
      isAuthenticated: true,
      isLoadingAuth: false, // Ensure loading is off after login
      user: {
        id: data.userId,
        email: data.email,
        displayName: data.fullName,
        fullName: data.fullName,
        phoneNumber: data.phoneNumber,
        avatar: { imageUrl: data.avatarUrl },
      } as any,
    }),
  setUser: (user?: UserType) => set({ user, isAuthenticated: !!user }),
  setAuth: (accessToken: string | null, refreshToken: string | null) =>
    set({ accessToken, refreshToken, isAuthenticated: !!accessToken }),
  setLoadingAuth: (isLoadingAuth: boolean) => set({ isLoadingAuth }),
  clearAuth: () =>
    set({
      accessToken: null,
      refreshToken: null,
      user: undefined,
      isAuthenticated: false,
      isLoadingAuth: false,
    }),
}));
