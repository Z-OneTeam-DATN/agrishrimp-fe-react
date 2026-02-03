import axios, { AxiosError, AxiosInstance, AxiosResponse, InternalAxiosRequestConfig, isCancel } from 'axios'
import { toast } from 'sonner'
import { AuthService } from '@/app/services/auth.service'

export interface ErrorResponse {
  statusCode: string
  title: string
  detail: string
  fieldErrors?: string[]
}

type Token = string
type NullableToken = Token | null

type FailedQueueItem = {
  resolve: (token: Token) => void
  reject: (err: unknown) => void
}

type RetriableRequest = InternalAxiosRequestConfig & {
  _retry?: boolean
  _retry429?: boolean
}

type HttpStatus = 401 | 403 | 404 | 422 | 429 | 500 | 502 | 503

// -----------------------------
// Flags + shared state
// -----------------------------

let isRefreshing = false
let failedQueue: FailedQueueItem[] = []

const isClient = () => typeof window !== 'undefined'

const isDev = process.env.NODE_ENV === 'development'

const debugLog = (...args: unknown[]) => {
  if (isDev) console.log(...args)
}

const redact = (data: unknown) => {
  if (!data) return data
  try {
    const text = JSON.stringify(data, (_k, v) => {
      if (typeof v === 'string' && (v.startsWith('Bearer ') || v.length > 200)) {
        return '[REDACTED]'
      }
      return v
    })
    return JSON.parse(text)
  } catch {
    return '[UNSERIALIZABLE]'
  }
}

const getAccessToken = async (): Promise<NullableToken> => {
  if (isClient()) {
    try {
      const { useAuthStore } = await import('@/stores/useAuthStore')
      return useAuthStore.getState().accessToken ?? null
    } catch {
      return null
    }
  }
  try {
    const { cookies } = await import('next/headers')
    const cookieStore = await cookies()
    return cookieStore.get('accessToken')?.value ?? null
  } catch {
    return null
  }
}

const processQueue = (error: unknown, token: NullableToken = null) => {
  failedQueue.forEach((p) => {
    if (error) {
      p.reject(error)
    } else if (token) {
      p.resolve(token)
    } else {
      p.reject(new Error('No token available'))
    }
  })
  failedQueue = []
}

const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms))

const getErrorMessage = (error: AxiosError<ErrorResponse>) => {
  const data = error.response?.data
  if (!data) return 'Đã xảy ra lỗi không xác định.'
  let message = data.detail || data.title || 'Đã xảy ra lỗi không xác định.'
  if (data.fieldErrors?.length) {
    message += ` Lỗi: ${data.fieldErrors.join(', ')}`
  }
  return message
}

const isAuthRefreshUrl = (url?: string | null) => {
  return !!url && url.includes('/api/auth/refresh')
}

const errorHandlers: Record<HttpStatus | 'default', (error: AxiosError<ErrorResponse>) => Promise<never>> = {
  401: async (error) => {
    if (isClient() && !(error.config?.url && error.config.url.includes('/login'))) {
      toast.error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.')
    }
    return Promise.reject(error)
  },
  403: async (error) => {
    if (isClient()) {
      toast.error('Bạn không có quyền truy cập tài nguyên này.')
    }
    return Promise.reject(error)
  },
  404: async (error) => {
    if (isClient()) {
      toast.error(getErrorMessage(error) || 'Không tìm thấy tài nguyên yêu cầu.')
    }
    return Promise.reject(error)
  },
  422: async (error) => {
    if (isClient()) {
      toast.error(getErrorMessage(error) || 'Dữ liệu không hợp lệ.')
    }
    return Promise.reject(error)
  },
  429: async (error) => {
    if (isClient()) {
      toast.error('Bạn đã gửi quá nhiều yêu cầu. Vui lòng thử lại sau.')
    }
    return Promise.reject(error)
  },
  500: async (error) => {
    if (isClient()) {
      toast.error('Lỗi hệ thống. Vui lòng thử lại sau hoặc liên hệ hỗ trợ.')
    }
    return Promise.reject(error)
  },
  502: async (error) => {
    if (isClient()) {
      toast.error(error.response?.data?.detail || 'Máy chủ tạm thời không khả dụng. Vui lòng thử lại sau.')
    }
    return Promise.reject(error)
  },
  503: async (error) => {
    if (isClient()) {
      toast.error(error.response?.data?.detail || 'Dịch vụ tạm thời không khả dụng. Vui lòng thử lại sau.')
    }
    return Promise.reject(error)
  },
  default: async (error) => {
    if (isClient()) {
      toast.error(getErrorMessage(error))
    }
    return Promise.reject(error)
  }
}

const createApi = (baseURL: string): AxiosInstance => {
  const axiosInstance = axios.create({
    baseURL,
    timeout: 15_000,
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json'
    },
    withCredentials: true
  })

  axiosInstance.interceptors.request.use(
    async (config: InternalAxiosRequestConfig) => {
      const token = await getAccessToken()
      if (token) {
        config.headers.Authorization = `Bearer ${token}`
      }
      debugLog('🚀 Request:', {
        method: config.method?.toUpperCase(),
        url: config.url,
        params: redact(config.params),
        data: redact(config.data),
        withCredentials: config.withCredentials
      })
      return config
    },
    (error) => {
      debugLog('❌ Request Error:', error)
      return Promise.reject(error)
    }
  )

  // Response interceptor
  axiosInstance.interceptors.response.use(
    (response: AxiosResponse) => {
      debugLog('✅ Response:', {
        method: response.config.method?.toUpperCase(),
        url: response.config.url,
        status: response.status,
        data: redact(response.data)
      })
      return response
    },
    async (error: AxiosError<ErrorResponse>) => {
      if (isCancel(error)) {
        debugLog('⚠️ Request canceled:', error.message)
        return Promise.reject(error)
      }

      if (error.code === 'ERR_NETWORK' || error.message === 'Network Error' || error.code === 'ECONNABORTED') {
        if (isClient()) {
          toast.error('Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối mạng.')
        }
        return Promise.reject(error)
      }

      if (!error.response) {
        if (isClient()) {
          toast.error('Không nhận được phản hồi từ máy chủ. Vui lòng thử lại sau.')
        }
        return Promise.reject(error)
      }

      const status = error.response.status as HttpStatus
      const original = error.config as RetriableRequest
      debugLog('❌ Response Error:', {
        status,
        statusCode: error.response?.data?.statusCode,
        title: error.response?.data?.title,
        detail: error.response?.data?.detail,
        fieldErrors: error.response?.data?.fieldErrors,
        url: original?.url,
        code: error.code
      })

      // 401: cố gắng refresh token (trừ khi đang gọi refresh)
      if (status === 401 && original && !original._retry && !isAuthRefreshUrl(original.url)) {
        if (isRefreshing) {
          return new Promise((resolve, reject) => {
            failedQueue.push({ resolve, reject })
          })
            .then((token) => {
              if (token) {
                original.headers.set('Authorization', `Bearer ${token}`)
              }
              return axiosInstance(original)
            })
            .catch((err) => Promise.reject(err))
        }

        original._retry = true
        isRefreshing = true

        try {
          const res = await AuthService.refreshAuthTokenNext()
          const newToken = res.accessToken

          axiosInstance.defaults.headers.common.Authorization = `Bearer ${newToken}`
          original.headers.set('Authorization', `Bearer ${newToken}`)

          if (isClient()) {
            // eslint-disable-next-line @typescript-eslint/no-require-imports
            const { useAuthStore } = require('@/stores/useAuthStore')
            useAuthStore.getState().setAccessToken(newToken)
          }

          processQueue(null, newToken)
          return axiosInstance(original)
        } catch (refreshErr) {
          // Nếu lỗi 500 khi refresh token, dừng thử lại và log chi tiết
          const err = refreshErr as AxiosError<ErrorResponse>
          if (err?.response?.status === 500) {
            debugLog('❌ Refresh token failed with 500:', err)
            processQueue(err, null)
            return Promise.reject(err)
          }
          processQueue(refreshErr, null)
          if (isClient()) {
            window.location.href = '/login'
          }
          return Promise.reject(refreshErr)
        } finally {
          isRefreshing = false
        }
      }

      // 429: tôn trọng Retry-After một lần
      if (status === 429 && original) {
        const retryAfterHeader = error.response.headers?.['retry-after'] ?? error.response.headers?.['Retry-After']
        const retryAfterSec = retryAfterHeader ? Number.parseInt(String(retryAfterHeader), 10) : NaN

        if (!original._retry429) {
          original._retry429 = true
          const waitMs = Number.isFinite(retryAfterSec) ? Math.min(retryAfterSec * 1000, 5000) : 1500
          await sleep(waitMs)
          return axiosInstance(original)
        }
      }

      const handler =
        (errorHandlers[status] as ((e: AxiosError<ErrorResponse>) => Promise<never>) | undefined) ??
        errorHandlers.default
      return handler(error)
    }
  )

  return axiosInstance
}

const apiJava = createApi(process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8080/api')

const apiNext = createApi(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000/api')

export { apiJava, apiNext, createApi }
export type { AxiosError, AxiosResponse }
