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
    set((state) => {
      // Merge current user with new data from refresh/login
      const updatedUser = {
        ...(state.user || {}),
        id: data.userId || state.user?.id,
        email: data.email || state.user?.email,
        fullName: data.fullName || state.user?.fullName,
        displayName: data.fullName || state.user?.displayName,
        phoneNumber: data.phoneNumber || state.user?.phoneNumber,
        mustChangePassword: data.mustChangePassword ?? state.user?.mustChangePassword,
        // Only update role if it's not already a rich object, or keep existing rich object
        role: typeof state.user?.role === "object" ? state.user.role : data.role,
        avatar: data.avatarUrl
          ? { imageUrl: data.avatarUrl }
          : state.user?.avatar,
      };

      return {
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
        isAuthenticated: true,
        isLoadingAuth: false,
        user: updatedUser as UserType,
      };
    }),
  setUser: (user?: UserType) => {
    if (user) {
      // Normalize user data (handle fullname vs fullName)
      const normalizedUser = {
        ...user,
        fullName: user.fullName || (user as any).fullname,
        displayName:
          user.displayName || user.fullName || (user as any).fullname,
      };
      set({
        user: normalizedUser as UserType,
        isAuthenticated: true,
        isLoadingAuth: false,
      });
    } else {
      set({ user: undefined, isAuthenticated: false, isLoadingAuth: false });
    }
  },
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
