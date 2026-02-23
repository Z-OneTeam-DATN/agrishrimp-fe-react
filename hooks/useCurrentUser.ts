import { useAuthStore } from "@/stores/useAuthStore";

export function useCurrentUser() {
  const { user, isAuthenticated, isLoadingAuth } = useAuthStore();

  return {
    data: user,
    isAuthenticated,
    isLoading: isLoadingAuth,
  };
}
