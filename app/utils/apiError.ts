import axios from "axios"

/** BE trả về lỗi dạng: { status: 400, message: "..." } */
export function parseApiError(error: unknown): { code: string; message: string } {
  if (axios.isAxiosError(error)) {
    const httpStatus = error.response?.status
    const data = error.response?.data
    const message: string =
      data?.message || data?.detail || data?.error_description || "Lỗi không xác định"

    // Map HTTP status → semantic code
    let code: string
    if (httpStatus === 409) {
      code = "CONFLICT"
    } else if (httpStatus === 404) {
      code = "NOT_FOUND"
    } else if (httpStatus === 400) {
      // Phân biệt token hết hạn vs lỗi 400 khác
      const lower = message.toLowerCase()
      if (lower.includes("token") && (lower.includes("hết hạn") || lower.includes("không hợp lệ"))) {
        code = "TOKEN_EXPIRED"
      } else {
        code = "BAD_REQUEST"
      }
    } else if (httpStatus === 401) {
      code = "UNAUTHORIZED"
    } else if (httpStatus === 403) {
      code = "FORBIDDEN"
    } else if (!error.response) {
      code = "NETWORK_ERROR"
    } else {
      code = "UNKNOWN"
    }

    return { code, message }
  }

  return { code: "NETWORK_ERROR", message: "Không thể kết nối đến máy chủ" }
}

export const ERROR_MESSAGES: Record<string, string> = {
  CONFLICT: "Rất tiếc, sản phẩm vừa thay đổi. Vui lòng kiểm tra lại đơn hàng.",
  TOKEN_EXPIRED: "Phiên đặt hàng đã hết hạn (30 phút). Vui lòng thực hiện lại.",
  NOT_FOUND: "Không tìm thấy thông tin yêu cầu.",
  NETWORK_ERROR: "Mất kết nối. Vui lòng thử lại.",
  UNAUTHORIZED: "Vui lòng đăng nhập để tiếp tục.",
}

export function getFriendlyError(error: unknown): string {
  const { code, message } = parseApiError(error)
  // Ưu tiên message từ BE (tiếng Việt), fallback sang map
  return message !== "Lỗi không xác định" ? message : (ERROR_MESSAGES[code] ?? message)
}

/** Kiểm tra nhanh lỗi 409 Conflict (race condition tồn kho) */
export function isConflictError(error: unknown): boolean {
  return parseApiError(error).code === "CONFLICT"
}

/** Kiểm tra nhanh lỗi token hết hạn */
export function isTokenExpiredError(error: unknown): boolean {
  return parseApiError(error).code === "TOKEN_EXPIRED"
}
