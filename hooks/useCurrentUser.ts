import { useAuthStore } from "@/stores/useAuthStore";

export function useCurrentUser() {
  const { user, accessToken, isAuthenticated, isLoadingAuth } = useAuthStore();
  const hasUsableSession = isAuthenticated && Boolean(accessToken);

  return {
    data: hasUsableSession ? user : undefined,
    isAuthenticated: hasUsableSession,
    isLoading: isLoadingAuth,
    error: null as Error | null,
  };
}
