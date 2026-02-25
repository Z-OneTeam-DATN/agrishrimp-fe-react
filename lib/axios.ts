import axios, {
  AxiosError,
  AxiosInstance,
  InternalAxiosRequestConfig,
  isCancel,
} from "axios";
import { toast } from "sonner";
import { jwtDecode, JwtPayload } from "jwt-decode";

type Token = string;
type NullableToken = Token | null;

type FailedQueueItem = {
  resolve: (token: Token) => void;
  reject: (err: unknown) => void;
};

type RetriableRequest = InternalAxiosRequestConfig & {
  _retry?: boolean;
  isPublic?: boolean;
};

let isRefreshing = false;
let failedQueue: FailedQueueItem[] = [];

const isClient = () => typeof window !== "undefined";
const isDev = process.env.NODE_ENV === "development";

const debugLog = (...args: unknown[]) => {
  if (isDev) console.log(...args);
};

const redact = (data: unknown) => {
  if (!data) return data;
  try {
    return JSON.parse(
      JSON.stringify(data, (_k, v) =>
        typeof v === "string" && (v.startsWith("Bearer ") || v.length > 200)
          ? "[REDACTED]"
          : v,
      ),
    );
  } catch {
    return "[UNSERIALIZABLE]";
  }
};

const getAccessToken = async (): Promise<NullableToken> => {
  if (isClient()) {
    try {
      const { useAuthStore } = await import("@/stores/useAuthStore");
      return useAuthStore.getState().accessToken ?? null;
    } catch {
      return null;
    }
  }
  return null;
};

const processQueue = (error: unknown, token: NullableToken = null) => {
  failedQueue.forEach((p) => (error ? p.reject(error) : p.resolve(token!)));
  failedQueue = [];
};

const getErrorMessage = (error: AxiosError<any>) => {
  const data = error.response?.data;
  if (!data) return "Lỗi hệ thống, vui lòng thử lại.";

  // Nếu có mảng chi tiết lỗi (Validation errors)
  if (Array.isArray(data.details) && data.details.length > 0) {
    return data.details.map((d: any) => d.message).join(". ");
  }

  return (
    data.detail ||
    data.message ||
    data.error_description ||
    data.error ||
    data.title ||
    (typeof data === "string" ? data : null) ||
    "Lỗi hệ thống, vui lòng thử lại."
  );
};

const isAuthRefreshUrl = (url?: string | null) =>
  !!url &&
  (url.includes("/api/auth/refresh") ||
    url.includes("/auth/refresh") ||
    url.includes("/api/auth/me") ||
    url.includes("/auth/me") ||
    url.includes("/api/auth/me-token") ||
    url.includes("/auth/me-token"));

const errorHandlers: Record<
  number | "default",
  (error: AxiosError<any>) => Promise<never>
> = {
  400: async (e) => Promise.reject(e),
  409: async (e) => Promise.reject(e),
  422: async (e) => Promise.reject(e),
  403: async (e) => Promise.reject(e),
  404: async (e) => Promise.reject(e),
  429: async (e) => Promise.reject(e),

  401: async (error) => {
    if (isClient()) {
      const url = error.config?.url || "";
      const isAuthFlow =
        url.includes("/login") ||
        url.includes("/signup") ||
        url.includes("/google-login") ||
        url.includes("/me-token");

      if (!isAuthFlow) {
        // Không hiện toast nếu đang ở trang login/signup
        const path = window.location.pathname;
        const isAuthPage =
          path.startsWith("/login") ||
          path.startsWith("/signup") ||
          path.startsWith("/reset-password");

        if (isAuthPage) return Promise.reject(error);

        // Chỉ hiện toast nếu request này được gửi đi với token (nghĩa là nó bị từ chối do hết hạn)
        // và hiện tại trong store vẫn đang có token.
        const authHeader = error.config?.headers?.Authorization;
        const hasTokenInRequest =
          typeof authHeader === "string" && authHeader.startsWith("Bearer ");

        const { useAuthStore } = await import("@/stores/useAuthStore");
        const hasTokenInStore = !!useAuthStore.getState().accessToken;

        if (hasTokenInRequest && hasTokenInStore) {
          toast.error("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");
        }
      }
    }
    return Promise.reject(error);
  },

  500: async (e) => {
    if (isClient()) toast.error("Lỗi hệ thống máy chủ. Vui lòng thử lại.");
    return Promise.reject(e);
  },
  502: async (e) => {
    if (isClient()) toast.error("Máy chủ không phản hồi (502).");
    return Promise.reject(e);
  },
  503: async (e) => {
    if (isClient()) toast.error("Dịch vụ tạm thời gián đoạn (503).");
    return Promise.reject(e);
  },

  default: async (e) => Promise.reject(e),
};

const createApi = (baseURL: string): AxiosInstance => {
  const axiosInstance = axios.create({
    baseURL,
    timeout: 15000,
    headers: { "Content-Type": "application/json" },
    withCredentials: true,
  });

  axiosInstance.interceptors.request.use(async (config: RetriableRequest) => {
    // 1. Tuyệt đối không gắn Token cho các request công khai
    if (config.isPublic) {
      if (config.headers) {
        config.headers.Authorization = undefined;
        if (typeof config.headers.delete === 'function') {
          config.headers.delete('Authorization');
        }
      }
      return config;
    }

    let token = await getAccessToken();

    // Tự động làm mới token nếu sắp hết hạn (pre-emptive refresh)
    if (token && isClient() && !isAuthRefreshUrl(config.url)) {
      try {
        const decoded = jwtDecode<JwtPayload>(token);
        const now = Date.now() / 1000;
        // Nếu token sắp hết hạn trong 30 giây tới
        if (decoded.exp && decoded.exp - now < 30) {
          if (!isRefreshing) {
            isRefreshing = true;
            try {
              const { AuthService } = await import("@/app/services/auth.service");
              const res = await AuthService.refreshAuthTokenNext();
              const { useAuthStore } = await import("@/stores/useAuthStore");
              useAuthStore.getState().setAccessAndRefreshToken(res);
              token = res.accessToken;
              processQueue(null, token);
            } catch (refreshError) {
              processQueue(refreshError, null);
              const { useAuthStore } = await import("@/stores/useAuthStore");
              useAuthStore.getState().clearAuth();
            } finally {
              isRefreshing = false;
            }
          } else {
            // Đợi token mới từ queue
            token = await new Promise((res, rej) =>
              failedQueue.push({ resolve: res, reject: rej }),
            );
          }
        }
      } catch (e) {
        console.warn("Lỗi giải mã token trong request interceptor", e);
      }
    }

    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  });

  axiosInstance.interceptors.response.use(
    (res) => res,
    async (error: AxiosError<any>) => {
      if (isCancel(error)) return Promise.reject(error);

      // Handle Network Error (Backend down)
      if (!error.response && error.message === "Network Error") {
        if (isClient()) {
          toast.error(
            "Không thể kết nối đến máy chủ. Vui lòng kiểm tra lại kết nối mạng hoặc liên hệ quản trị viên.",
          );
        }
        return Promise.reject(error);
      }

      const status = error.response?.status;
      const original = error.config as RetriableRequest;

      // Không bao giờ refresh token cho các request public
      if (original?.isPublic) {
        return Promise.reject(error);
      }

      if (
        status === 401 &&
        original &&
        !original._retry &&
        !isAuthRefreshUrl(original.url)
      ) {
        const isAuthFlow =
          original.url?.includes("/login") ||
          original.url?.includes("/signup") ||
          original.url?.includes("/google-login") ||
          original.url?.includes("/me-token");

        if (!isAuthFlow) {
          if (isRefreshing) {
            return new Promise((res, rej) =>
              failedQueue.push({ resolve: res, reject: rej }),
            ).then((token) => {
              original.headers.Authorization = `Bearer ${token}`;
              return axiosInstance(original);
            });
          }

          original._retry = true;
          isRefreshing = true;

          try {
            const { AuthService } = await import("@/app/services/auth.service");
            const res = await AuthService.refreshAuthTokenNext();
            
            // 1. Update Global Store (Zustand) with new tokens and user info
            const { useAuthStore } = await import("@/stores/useAuthStore");
            useAuthStore.getState().setAccessAndRefreshToken(res);

            const newToken = res.accessToken;
            processQueue(null, newToken);

            // 2. Update current request and retry
            original.headers.Authorization = `Bearer ${newToken}`;
            return axiosInstance(original);
          } catch (err) {
            processQueue(err, null);
            
            // 3. Force logout on refresh failure
            const { useAuthStore } = await import("@/stores/useAuthStore");
            useAuthStore.getState().clearAuth();
            
            if (isClient()) {
              const path = window.location.pathname;
              const isProtectedPath = ["/profile", "/orders", "/user/checkout", "/admin"].some(p => path.startsWith(p));
              
              if (isProtectedPath) {
                toast.error("Phiên đăng nhập hết hạn, vui lòng đăng nhập lại.");
                window.location.href = "/login";
              }
            }
            return Promise.reject(err);
          } finally {
            isRefreshing = false;
          }
        }
      }

      // Silence 401 errors from auth/me or refresh to avoid console noise for guests
      if (status === 401 && isAuthRefreshUrl(original?.url)) {
        return Promise.reject({ ...error, silent: true });
      }

      const handler = errorHandlers[status as number] || errorHandlers.default;
      return handler(error);
    },
  );

  return axiosInstance;
};

const apiJava = createApi(
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080/api",
);
const apiNext = createApi(
  process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000/api",
);

export { apiJava, apiNext, createApi, getErrorMessage };
