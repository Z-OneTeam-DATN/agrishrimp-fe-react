export function getTransferStatusLabel(
  status: string | null | undefined,
  transferBusinessType?: string | null,
): string {
  const normalizedStatus = String(status || "").trim().toUpperCase();
  const normalizedBusinessType = String(transferBusinessType || "")
    .trim()
    .toUpperCase();

  switch (normalizedStatus) {
    case "PENDING":
      return normalizedBusinessType === "INTERNAL_SALE"
        ? "Chờ xác nhận nguồn"
        : "Chờ duyệt";
    case "SOURCE_CONFIRMED":
      return "Đã xác nhận nguồn";
    case "APPROVED":
      return "Đã duyệt";
    case "TRANSIT":
    case "SHIPPING":
      return "Đang vận chuyển";
    case "INSPECTING":
      return "Đang kiểm hàng";
    case "COMPLETED":
      return "Hoàn thành";
    case "CANCELLED":
      return "Đã hủy";
    case "REJECTED":
      return "Từ chối";
    case "OVERDUE":
      return "Quá hạn";
    case "DRAFT":
      return "Nháp";
    default:
      return normalizedStatus || "---";
  }
}
