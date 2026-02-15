import { AuthResponse } from "@/app/types/auth.schema";
import { UserType } from "@/app/types/user.schema";
import { create } from "zustand";

interface AuthStore {
  userDetail?: UserType;
  accessToken: string | null;
  refreshToken?: string | null;
  setAccessToken: (token: string | null) => void;
  setRefreshToken: (token: string | null) => void;
  setAccessAndRefreshToken: (data: AuthResponse) => void;
  setUserDetail: (userDetails?: UserType) => void;
}

export const useAuthStore = create<AuthStore>((set) => ({
  userDetail: undefined,
  accessToken: null,
  refreshToken: null,
  setAccessToken: (accessToken) => set({ accessToken }),
  setRefreshToken: (refreshToken) => set({ refreshToken }),
  setAccessAndRefreshToken: (data: AuthResponse) =>
    set({ accessToken: data.accessToken, refreshToken: data.refreshToken }),
  setUserDetail: (userDetail?: UserType) => set({ userDetail }),
}));
