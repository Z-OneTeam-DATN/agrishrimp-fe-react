import axios, {
  AxiosError,
  AxiosInstance,
  InternalAxiosRequestConfig,
  isCancel,
} from "axios";
import { toast } from "sonner";
import { jwtDecode, JwtPayload } from "jwt-decode";
import { repairVietnameseText } from "@/lib/utils";

type Token = string;
type NullableToken = Token | null;
export type ApiPath = `/${string}`;

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
const DEFAULT_PUBLIC_API_BASE_URL = "https://api.agrishrimp.io.vn/api";
const DEFAULT_SERVER_API_BASE_URL = "http://api:8004/api";

const trimTrailingSlash = (value: string) => value.replace(/\/+$/, "");

const joinApiUrl = (baseURL: string, path: ApiPath) =>
  `${trimTrailingSlash(baseURL)}${path}`;

const getBrowserApiBaseUrl = () =>
  trimTrailingSlash(
    process.env.NEXT_PUBLIC_API_URL ?? DEFAULT_PUBLIC_API_BASE_URL,
  );

const isRelativeProxyBaseUrl = (value: string) =>
  value.startsWith("/");

const getServerApiBaseUrl = () =>
  trimTrailingSlash(
    process.env.JAVA_API_URL ??
      process.env.NEXT_PUBLIC_API_URL ??
      DEFAULT_SERVER_API_BASE_URL,
  );

export const buildJavaApiUrl = (path: ApiPath) =>
  typeof window !== "undefined"
    ? (() => {
        const browserBaseUrl = getBrowserApiBaseUrl();

        // When the browser uses a same-origin proxy base such as "/be-api",
        // apiJava already prefixes requests with that baseURL. Returning the
        // raw API path here avoids accidental "/be-api/be-api/..." URLs.
        return isRelativeProxyBaseUrl(browserBaseUrl)
          ? path
          : joinApiUrl(browserBaseUrl, path);
      })()
    : joinApiUrl(getServerApiBaseUrl(), path);

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

const joinErrorList = (value: unknown) => {
  if (!Array.isArray(value) || value.length === 0) return "";

  return value
    .map((item) => {
      if (typeof item === "string") return repairVietnameseText(item).trim();
      if (item && typeof item === "object") {
        const record = item as Record<string, unknown>;
        if (typeof record.message === "string") {
          return repairVietnameseText(record.message).trim();
        }
        if (typeof record.detail === "string") {
          return repairVietnameseText(record.detail).trim();
        }
      }
      return "";
    })
    .filter(Boolean)
    .join(". ");
};

const getClientErrorFallback = (message: string) => {
  const normalized = message.trim().toLowerCase();

  if (!normalized) return "";
  if (normalized === "network error") {
    return "Không thể kết nối máy chủ. Vui lòng kiểm tra mạng và thử lại.";
  }
  if (normalized.includes("timeout") || normalized.includes("exceeded")) {
    return "Yêu cầu quá thời gian phản hồi. Vui lòng thử lại.";
  }
  if (normalized.includes("request aborted")) {
    return "Yêu cầu đã bị hủy. Vui lòng thử lại.";
  }

  return "";
};

const getErrorMessage = (error: unknown) => {
  const axiosError = error as AxiosError<unknown> | undefined;
  const data = axiosError?.response?.data;

  if (typeof data === "string" && data.trim()) {
    return repairVietnameseText(data).trim();
  }

  if (data && typeof data === "object") {
    const record = data as Record<string, unknown>;
    const listMessage =
      joinErrorList(record.fieldErrors) ||
      joinErrorList(record.details) ||
      joinErrorList(record.errors);
    if (listMessage) return listMessage;

    for (const key of ["detail", "message", "error_description", "error", "title"]) {
      const value = record[key];
      if (typeof value === "string" && value.trim()) {
        return repairVietnameseText(value).trim();
      }
    }
  }

  const message =
    error && typeof error === "object" && "message" in error && typeof error.message === "string"
      ? repairVietnameseText(error.message)
      : "";
  const clientFallback = getClientErrorFallback(message);
  if (clientFallback) return clientFallback;
  if (message && !message.startsWith("Request failed with status code")) return message;

  switch (axiosError?.response?.status) {
    case 400:
      return "Dữ liệu gửi lên không hợp lệ. Vui lòng kiểm tra lại thông tin.";
    case 401:
      return "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.";
    case 403:
      return "Bạn không có quyền thực hiện thao tác này.";
    case 404:
      return "Không tìm thấy dữ liệu yêu cầu.";
    case 409:
      return "Dữ liệu đang xung đột. Vui lòng tải lại và thử lại.";
    case 422:
      return "Dữ liệu chưa hợp lệ. Vui lòng kiểm tra lại thông tin.";
    case 429:
      return "Bạn thao tác quá nhanh. Vui lòng thử lại sau ít phút.";
    case 500:
      return "Lỗi hệ thống máy chủ. Vui lòng thử lại.";
    case 502:
      return "Máy chủ không phản hồi. Vui lòng thử lại.";
    case 503:
      return "Dịch vụ tạm thời gián đoạn. Vui lòng thử lại.";
    default:
      break;
  }

  return "Lỗi hệ thống, vui lòng thử lại.";
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
          toast.error("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.", { id: "session-expired" });
        }
      }
    }
    return Promise.reject(error);
  },

  500: async (e) => {
//     if (isClient()) toast.error("Lỗi hệ thống máy chủ. Vui lòng thử lại.", { id: "error-500" });
    return Promise.reject(e);
  },
  502: async (e) => {
    if (isClient()) toast.error("Máy chủ không phản hồi (502).", { id: "error-502" });
    return Promise.reject(e);
  },
  503: async (e) => {
    if (isClient()) toast.error("Dịch vụ tạm thời gián đoạn (503).", { id: "error-503" });
    return Promise.reject(e);
  },

  default: async (e) => Promise.reject(e),
};

const createApi = (baseURL: string, timeout: number = 30000): AxiosInstance => {
  const axiosInstance = axios.create({
    baseURL,
    timeout,
    headers: { Accept: "application/json" },
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
      let decoded: JwtPayload | null = null;
      try {
        decoded = jwtDecode<JwtPayload>(token);
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
        const { useAuthStore } = await import("@/stores/useAuthStore");
        useAuthStore.getState().clearAuth();
        token = null;
      }
    }

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    } else if (config.headers) {
      config.headers.Authorization = undefined;
      if (typeof config.headers.delete === "function") {
        config.headers.delete("Authorization");
      }
    }
    return config;
  });

  axiosInstance.interceptors.response.use(
    (res) => res,
    async (error: AxiosError<any>) => {
      if (isCancel(error)) return Promise.reject(error);

      // Xử lý lỗi mạng khi máy chủ không phản hồi.
      if (!error.response && error.message === "Network Error") {
        if (isClient()) {
          toast.error(
            "Không thể kết nối đến máy chủ. Vui lòng kiểm tra lại kết nối mạng hoặc liên hệ quản trị viên.",
            { id: "network-error" },
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
              const isProtectedPath = ["/profile", "/orders", "/checkout", "/user/checkout", "/admin"].some(
                (p) => path.startsWith(p),
              );
              
              if (isProtectedPath) {
                toast.error("Phiên đăng nhập hết hạn, vui lòng đăng nhập lại.", { id: "session-expired" });
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

// Always resolve the Java API to an absolute URL so browser-side requests never
// fall back to relative paths such as "/categories" or "/products".
const apiJava = createApi(
  typeof window !== "undefined"
    ? getBrowserApiBaseUrl()
    : getServerApiBaseUrl(),
  30000,
);

// On the browser, use a relative URL so requests go to the same origin
// (avoids ERR_CONNECTION_REFUSED when NEXT_PUBLIC_APP_URL points to an
// internal container-only address that is unreachable from the client).
// On the server, use the absolute internal URL.
const apiNext = createApi(
  typeof window !== "undefined"
    ? "/api"
    : (process.env.NEXT_SERVER_APP_URL ??
        process.env.NEXT_PUBLIC_APP_URL ??
        "https://agrishrimp.io.vn") + "/api",
  40000,
);

export { apiJava, apiNext, createApi, getErrorMessage };
