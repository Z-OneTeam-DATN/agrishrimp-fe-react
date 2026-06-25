import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatNumber(value: number) {
  return new Intl.NumberFormat("vi-VN").format(value);
}

export function formatCurrency(value: number | string) {
  const num = typeof value === "string" ? parseFloat(value) : value;
  if (isNaN(num)) return "0đ";
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(num);
}

export function cleanSupplierName(name: string): string {
  if (!name) return "";
  return name
    .replace(/^(công ty tnhh mtv|công ty tnhh|công ty cổ phần|công ty cp|doanh nghiệp tư nhân|dntn|co\.op|cty tnhh|cty cp)\s+/i, "")
    .trim();
}
