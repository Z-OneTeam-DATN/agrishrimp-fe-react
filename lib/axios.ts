import axios, {
  AxiosError,
  AxiosInstance,
  InternalAxiosRequestConfig,
  isCancel
} from 'axios'
import { toast } from 'sonner'
import { AuthService } from '@/app/services/auth.service'

type Token = string
type NullableToken = Token | null

type FailedQueueItem = {
  resolve: (token: Token) => void
  reject: (err: unknown) => void
}

type RetriableRequest = InternalAxiosRequestConfig & {
  _retry?: boolean
}


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
    return JSON.parse(
      JSON.stringify(data, (_k, v) =>
        typeof v === 'string' && (v.startsWith('Bearer ') || v.length > 200)
          ? '[REDACTED]'
          : v
      )
    )
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
  return null
}

const processQueue = (error: unknown, token: NullableToken = null) => {
  failedQueue.forEach((p) => (error ? p.reject(error) : p.resolve(token!)))
  failedQueue = []
}


const getErrorMessage = (error: AxiosError<any>) => {
  const data = error.response?.data
  if (!data) return 'Lỗi hệ thống, vui lòng thử lại.'

  return (
    data.detail ||
    data.message ||
    data.error_description ||
    data.error ||
    data.title ||
    (typeof data === 'string' ? data : null) ||
    'Lỗi hệ thống, vui lòng thử lại.'
  )
}

const isAuthRefreshUrl = (url?: string | null) =>
  !!url && url.includes('/api/auth/refresh')

const errorHandlers: Record<number | 'default', (error: AxiosError<any>) => Promise<never>> = {
  400: async (e) => Promise.reject(e),
  409: async (e) => Promise.reject(e),
  422: async (e) => Promise.reject(e),
  403: async (e) => Promise.reject(e),
  404: async (e) => Promise.reject(e),
  429: async (e) => Promise.reject(e),

  401: async (error) => {
    if (isClient()) {
      const url = error.config?.url || ''
      const isAuthFlow =
        url.includes('/login') ||
        url.includes('/signup') ||
        url.includes('/google-login')

      if (!isAuthFlow) {
        toast.error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.')
      }
    }
    return Promise.reject(error)
  },

  500: async (e) => {
    if (isClient()) toast.error('Lỗi hệ thống máy chủ. Vui lòng thử lại.')
    return Promise.reject(e)
  },
  502: async (e) => {
    if (isClient()) toast.error('Máy chủ không phản hồi (502).')
    return Promise.reject(e)
  },
  503: async (e) => {
    if (isClient()) toast.error('Dịch vụ tạm thời gián đoạn (503).')
    return Promise.reject(e)
  },

  default: async (e) => Promise.reject(e)
}


const createApi = (baseURL: string): AxiosInstance => {
  const axiosInstance = axios.create({
    baseURL,
    timeout: 15000,
    headers: { 'Content-Type': 'application/json' },
    withCredentials: true
  })

  axiosInstance.interceptors.request.use(async (config) => {
    const token = await getAccessToken()
    if (token) config.headers.Authorization = `Bearer ${token}`

    debugLog('🚀 Request:', {
      method: config.method?.toUpperCase(),
      url: config.url,
      data: redact(config.data)
    })
    return config
  })

  axiosInstance.interceptors.response.use(
    (res) => res,
    async (error: AxiosError<any>) => {
      if (isCancel(error)) return Promise.reject(error)

      // Handle Network Error (Backend down)
      if (!error.response && error.message === 'Network Error') {
        if (isClient()) {
          toast.error('Không thể kết nối đến máy chủ. Vui lòng kiểm tra lại kết nối mạng hoặc liên hệ quản trị viên.')
        }
        return Promise.reject(error)
      }

      const status = error.response?.status
      const original = error.config as RetriableRequest
      if (status === 401 && original && !original._retry && !isAuthRefreshUrl(original.url)) {
        const isAuthFlow =
          original.url?.includes('/login') ||
          original.url?.includes('/signup') ||
          original.url?.includes('/google-login')

        if (!isAuthFlow) {
          if (isRefreshing) {
            return new Promise((res, rej) =>
              failedQueue.push({ resolve: res, reject: rej })
            ).then((token) => {
              original.headers.Authorization = `Bearer ${token}`
              return axiosInstance(original)
            })
          }

          original._retry = true
          isRefreshing = true

          try {
            const res = await AuthService.refreshAuthTokenNext()
            const newToken = res.accessToken
            processQueue(null, newToken)
            original.headers.Authorization = `Bearer ${newToken}`
            return axiosInstance(original)
          } catch (err) {
            processQueue(err, null)
            if (isClient()) window.location.href = '/login'
            return Promise.reject(err)
          } finally {
            isRefreshing = false
          }
        }
      }

      const handler = errorHandlers[status as number] || errorHandlers.default
      return handler(error)
    }
  )

  return axiosInstance
}

const apiJava = createApi(process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8080/api')
const apiNext = createApi(process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000/api')

export { apiJava, apiNext, createApi, getErrorMessage }
