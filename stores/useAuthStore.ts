import { AuthResponse } from "@/app/types/auth.schema";
import { UserType } from "@/app/types/user.schema";
import { create } from "zustand";
import { jwtDecode } from "jwt-decode";

interface CustomJwtPayload {
  warehouseId?: number;
  [key: string]: any;
}

interface AuthStore {
  user?: UserType;
  accessToken: string | null;
  refreshToken?: string | null;
  isAuthenticated: boolean;
  isLoadingAuth: boolean;
  warehouseId: number | null;
  permissions: string[];
  setAccessToken: (token: string | null) => void;
  setRefreshToken: (token: string | null) => void;
  setAccessAndRefreshToken: (data: AuthResponse) => void;
  setUser: (user?: UserType) => void;
  setAuth: (accessToken: string | null, refreshToken: string | null) => void;
  setLoadingAuth: (isLoading: boolean) => void;
  setPermissions: (permissions: string[]) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: undefined,
  accessToken: null,
  refreshToken: null,
  isAuthenticated: false,
  isLoadingAuth: true,
  warehouseId: null,
  permissions: [],
  setAccessToken: (accessToken) => {
    let warehouseId = null;
    if (accessToken) {
      try {
        const decoded = jwtDecode<CustomJwtPayload>(accessToken);
        warehouseId = decoded.warehouseId || null;
      } catch (e) {
        console.error("Error decoding token", e);
      }
    }
    set({ accessToken, isAuthenticated: !!accessToken, warehouseId });
  },
  setRefreshToken: (refreshToken) => set({ refreshToken }),
  setAccessAndRefreshToken: (data: AuthResponse) =>
    set((state) => {
      let warehouseId = null;
      try {
        const decoded = jwtDecode<CustomJwtPayload>(data.accessToken);
        warehouseId = decoded.warehouseId || null;
      } catch (e) {
        console.error("Error decoding token in setAccessAndRefreshToken", e);
      }

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
        branch: data.branch || state.user?.branch || (warehouseId ? { id: warehouseId, name: "" } : undefined),
        avatar: data.avatarUrl
          ? { imageUrl: data.avatarUrl }
          : state.user?.avatar,
      };

      return {
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
        isAuthenticated: true,
        isLoadingAuth: false,
        warehouseId: warehouseId || state.warehouseId,
        permissions: [],
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
  setPermissions: (permissions: string[]) => set({ permissions }),
  clearAuth: () =>
    set({
      accessToken: null,
      refreshToken: null,
      user: undefined,
      isAuthenticated: false,
      isLoadingAuth: false,
      warehouseId: null,
      permissions: [],
    }),
}));
