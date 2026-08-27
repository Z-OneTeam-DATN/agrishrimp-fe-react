import axios from "axios"
import { repairVietnameseText } from "@/lib/utils"

const TECHNICAL_SERVER_ERROR_PATTERNS = [
  /jdbc/i,
  /\bsql\b/i,
  /unknown column/i,
  /hikaripool/i,
  /connection is not available/i,
  /communications link failure/i,
  /could not extract/i,
]

const BACKEND_CODE_MESSAGES: Record<string, string> = {
  GHN_NOT_CONFIGURED:
    "He\u0323 th\u1ed1ng ch\u01b0a c\u1ea5u hi\u0300nh \u0111u\u0309 GHN n\u00ean ch\u01b0a th\u00ea\u0309 ti\u0301nh phi\u0301 ship th\u00e2\u0323t. Ba\u0323n c\u00e2\u0300n ch\u01a1\u0300 qua\u0309n tri\u0323 vi\u00ean c\u00e2\u0323p nh\u00e2\u0323t.",
  GHN_MISSING_BRANCH_DISTRICT:
    "Chi nha\u0301nh giao ha\u0300ng \u0111ang thi\u1ebfu District ID GHN. Ba\u0323n ch\u01b0a th\u00ea\u0309 \u0111\u1eb7t \u0111\u01a1n na\u0300y cho t\u01a1\u0301i khi chi nha\u0301nh \u0111\u01b0\u01a1\u0323c c\u00e2\u0301u hi\u0300nh \u0111u\u0301ng.",
  GHN_MISSING_DELIVERY_DISTRICT:
    "\u0110i\u0323a chi\u0309 nh\u00e2\u0323n ha\u0300ng \u0111ang thi\u1ebfu Qu\u00e2\u0323n/Huy\u00ea\u0323n GHN. Ha\u0303y c\u00e2\u0323p nh\u00e2\u0323t la\u0323i \u0111i\u0323a chi\u0309 r\u00f4\u0300i ti\u0301nh phi\u0301 la\u0323i.",
  GHN_MISSING_DELIVERY_WARD:
    "\u0110i\u0323a chi\u0309 nh\u00e2\u0323n ha\u0300ng \u0111ang thi\u1ebfu Ph\u01b0\u01a1\u0300ng/Xa\u0303 GHN. Ha\u0303y c\u00e2\u0323p nh\u00e2\u0323t la\u0323i \u0111i\u0323a chi\u0309 r\u00f4\u0300i ti\u0301nh phi\u0301 la\u0323i.",
  GHN_API_FAILED:
    "GHN \u0111ang kh\u00f4ng tra\u0309 v\u00ea\u0300 phi\u0301 v\u00e2\u0323n chuy\u00ea\u0309n th\u00e2\u0323t. Ha\u0303y th\u01b0\u0309 la\u0323i sau i\u0301t phu\u0301t.",
  ORDER_PREPARE_NO_ACTIVE_BRANCHES:
    "Hi\u00ea\u0323n ch\u01b0a co\u0301 chi nha\u0301nh hoa\u0323t \u0111\u00f4\u0323ng co\u0301 th\u00ea\u0309 phu\u0323c vu\u0323 \u0111\u01a1n ha\u0300ng cu\u0309a ba\u0323n. Vui lo\u0300ng th\u01b0\u0309 la\u0323i sau.",
  ORDER_PREPARE_NO_DELIVERY_BRANCHES:
    "Ch\u01b0a co\u0301 chi nha\u0301nh phu\u0300 h\u01a1\u0323p cho \u0111i\u0323a chi\u0309 giao ha\u0300ng na\u0300y. Ha\u0303y ki\u00ea\u0309m tra ho\u0103\u0323c cho\u0323n \u0111i\u0323a chi\u0309 kha\u0301c.",
  ORDER_PREPARE_NO_BRANCH_IN_REGION:
    "Vu\u0300ng giao ha\u0300ng cu\u0309a \u0111i\u0323a chi\u0309 na\u0300y hi\u00ea\u0323n ch\u01b0a co\u0301 chi nha\u0301nh active \u0111\u00ea\u0309 phu\u0323c vu\u0323 tr\u01b0\u0323c ti\u00ea\u0301p. Ha\u0303y cho\u0323n \u0111i\u0323a chi\u0309 kha\u0301c \u0111\u00ea\u0309 test ho\u0103\u0323c b\u00f4\u0309 sung chi nha\u0301nh trong vu\u0300ng.",
  ORDER_PREPARE_UNSUPPORTED_REGION:
    "He\u0323 th\u1ed1ng ch\u01b0a xa\u0301c \u0111i\u0323nh \u0111\u01b0\u01a1\u0323c vu\u0300ng giao ha\u0300ng cu\u0309a \u0111i\u0323a chi\u0309 na\u0300y. Ha\u0303y c\u00e2\u0323p nh\u00e2\u0323t la\u0323i \u0111i\u0323a chi\u0309 chi ti\u00ea\u0301t h\u01a1n.",
}

const UNKNOWN_ERROR_MESSAGE = "L\u1ed7i kh\u00f4ng x\u00e1c \u0111i\u0323nh"

const isTechnicalServerError = (message: string) =>
  TECHNICAL_SERVER_ERROR_PATTERNS.some((pattern) => pattern.test(message))

const normalizeErrorTextForMatching = (message: string) =>
  repairVietnameseText(message)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()

type ParsedApiError = {
  code: string
  message: string
  retryAfterSeconds?: number
  backendCode?: string
}

export function getBackendCodeMessage(
  backendCode?: string | null,
): string | null {
  if (!backendCode) {
    return null
  }

  return BACKEND_CODE_MESSAGES[backendCode] ?? null
}

export function parseApiError(error: unknown): ParsedApiError {
  if (axios.isAxiosError(error)) {
    const httpStatus = error.response?.status
    const data = error.response?.data
    const fieldErrors =
      Array.isArray(data?.fieldErrors) && data.fieldErrors.length > 0
        ? data.fieldErrors
            .filter(
              (value: unknown): value is string =>
                typeof value === "string" && value.trim().length > 0,
            )
            .map((value: string) => repairVietnameseText(value).trim())
        : []

    const message: string =
      (typeof data?.message === "string"
        ? repairVietnameseText(data.message).trim()
        : undefined) ||
      (typeof data?.detail === "string"
        ? repairVietnameseText(data.detail).trim()
        : undefined) ||
      (typeof data?.error_description === "string"
        ? repairVietnameseText(data.error_description).trim()
        : undefined) ||
      (fieldErrors.length > 0 ? fieldErrors.join(". ") : undefined) ||
      data?.title ||
      UNKNOWN_ERROR_MESSAGE

    const normalizedMessage = repairVietnameseText(message)
    const normalizedMessageForMatching =
      normalizeErrorTextForMatching(normalizedMessage)
    const backendCode = typeof data?.code === "string" ? data.code : undefined
    const backendRetryAfter =
      typeof data?.retryAfterSeconds === "number"
        ? data.retryAfterSeconds
        : undefined
    const retryAfterMatch = normalizedMessage.match(/\((\d+)s\)/i)
    const retryAfterSeconds =
      backendRetryAfter ??
      (retryAfterMatch ? Number(retryAfterMatch[1]) : undefined)

    let code: string
    if (backendCode === "ORDER_RATE_LIMITED") {
      code = "RATE_LIMITED"
    } else if (httpStatus === 409) {
      code =
        normalizedMessageForMatching.includes("qua nhanh") ||
        normalizedMessageForMatching.includes("kiem soat cao")
          ? "RATE_LIMITED"
          : "CONFLICT"
    } else if (httpStatus === 404) {
      code = "NOT_FOUND"
    } else if (httpStatus === 400) {
      if (
        normalizedMessageForMatching.includes("token") &&
        (normalizedMessageForMatching.includes("het han") ||
          normalizedMessageForMatching.includes("khong hop le"))
      ) {
        code = "TOKEN_EXPIRED"
      } else {
        code = "BAD_REQUEST"
      }
    } else if (httpStatus === 401) {
      code = "UNAUTHORIZED"
    } else if (httpStatus === 403) {
      code = "FORBIDDEN"
    } else if (typeof httpStatus === "number" && httpStatus >= 500) {
      code = "SERVER_ERROR"
    } else if (!error.response) {
      code = "NETWORK_ERROR"
    } else {
      code = "UNKNOWN"
    }

    return {
      code,
      message: normalizedMessage,
      retryAfterSeconds,
      backendCode,
    }
  }

  return {
    code: "NETWORK_ERROR",
    message: "Kh\u00f4ng th\u1ec3 k\u1ebft n\u1ed1i \u0111\u1ebfn m\u00e1y ch\u1ee7",
  }
}

export const ERROR_MESSAGES: Record<string, string> = {
  CONFLICT:
    "R\u1ea5t ti\u1ebfc, s\u1ea3n ph\u1ea9m v\u1eeba thay \u0111\u1ed5i. Vui l\u00f2ng ki\u1ec3m tra l\u1ea1i \u0111\u01a1n h\u00e0ng.",
  RATE_LIMITED:
    "B\u1ea1n thao t\u00e1c qu\u00e1 nhanh. Vui l\u00f2ng ch\u1edd r\u1ed3i th\u1eed l\u1ea1i.",
  TOKEN_EXPIRED:
    "Phi\u00ean \u0111\u1eb7t h\u00e0ng \u0111\u00e3 h\u1ebft h\u1ea1n (30 ph\u00fat). Vui l\u00f2ng th\u1ef1c hi\u1ec7n l\u1ea1i.",
  NOT_FOUND: "Kh\u00f4ng t\u00ecm th\u1ea5y th\u00f4ng tin y\u00eau c\u1ea7u.",
  NETWORK_ERROR: "M\u1ea5t k\u1ebft n\u1ed1i. Vui l\u00f2ng th\u1eed l\u1ea1i.",
  UNAUTHORIZED: "Vui l\u00f2ng \u0111\u0103ng nh\u1eadp \u0111\u1ec3 ti\u1ebfp t\u1ee5c.",
}

export function getFriendlyError(error: unknown): string {
  const technicalServerErrorMessage =
    "Kh\u00f4ng th\u1ec3 t\u00ednh ph\u00ed giao h\u00e0ng. Vui l\u00f2ng th\u1eed l\u1ea1i sau ho\u1eb7c ch\u1ecdn \u0111\u1ecba ch\u1ec9 kh\u00e1c."
  const { code, message, backendCode } = parseApiError(error)
  const backendCodeMessage = getBackendCodeMessage(backendCode)

  if (backendCodeMessage) {
    return backendCodeMessage
  }
  if (code === "SERVER_ERROR") {
    return technicalServerErrorMessage
  }
  if (isTechnicalServerError(message)) {
    return technicalServerErrorMessage
  }
  if (message !== UNKNOWN_ERROR_MESSAGE) {
    return message
  }
  if (code === "UNKNOWN") {
    return "M\u00e1y ch\u1ee7 g\u1eb7p l\u1ed7i khi x\u1eed l\u00fd \u0111\u01a1n h\u00e0ng. Vui l\u00f2ng th\u1eed l\u1ea1i sau."
  }
  return ERROR_MESSAGES[code] ?? message
}

export function isConflictError(error: unknown): boolean {
  return parseApiError(error).code === "CONFLICT"
}

export function isRateLimitedError(error: unknown): boolean {
  return parseApiError(error).code === "RATE_LIMITED"
}

export function getRetryAfterSeconds(error: unknown): number {
  const seconds = parseApiError(error).retryAfterSeconds
  return typeof seconds === "number" && seconds > 0 ? seconds : 15
}

export function isTokenExpiredError(error: unknown): boolean {
  return parseApiError(error).code === "TOKEN_EXPIRED"
}
