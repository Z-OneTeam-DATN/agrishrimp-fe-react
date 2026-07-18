import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

const MOJIBAKE_PATTERN =
  /(?:\u00c2[\u0080-\u017f]|\u00c3[\u0080-\u017f]|\u00c4[\u0080-\u017f]|\u00c6[\u0080-\u017f]|\u00e1[\u0080-\u017f]|\u00e2[\u0080-\u017f])/;

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

export function looksLikeMojibake(value: string) {
  return MOJIBAKE_PATTERN.test(value);
}

export function repairVietnameseText(value: string) {
  if (!value || !looksLikeMojibake(value)) {
    return value;
  }

  let repaired = value;

  for (let attempt = 0; attempt < 3; attempt += 1) {
    if (!looksLikeMojibake(repaired)) {
      break;
    }

    const bytes = Uint8Array.from(
      Array.from(repaired, (char) => char.charCodeAt(0) & 0xff),
    );
    const decoded = new TextDecoder("utf-8").decode(bytes);

    if (!decoded || decoded === repaired || decoded.includes("\ufffd")) {
      break;
    }

    repaired = decoded;
  }

  return repaired;
}

export function repairVietnameseData<T>(value: T): T {
  if (typeof value === "string") {
    return repairVietnameseText(value) as T;
  }

  if (Array.isArray(value)) {
    return value.map((item) => repairVietnameseData(item)) as T;
  }

  if (value && typeof value === "object") {
    const repairedEntries = Object.entries(value as Record<string, unknown>).map(
      ([key, entryValue]) => [key, repairVietnameseData(entryValue)],
    );

    return Object.fromEntries(repairedEntries) as T;
  }

  return value;
}

export function resolveExportPartnerName(item: {
  exportType?: string;
  displayPartnerName?: string;
  supplierName?: string;
  partnerBranchName?: string;
}) {
  const exportType = repairVietnameseText(item.exportType || "").toUpperCase();
  const displayPartnerName = repairVietnameseText(item.displayPartnerName || "");
  const supplierName = repairVietnameseText(item.supplierName || "");
  const partnerBranchName = repairVietnameseText(item.partnerBranchName || "");
  const isInternal =
    exportType === "INTERNAL" || displayPartnerName.includes("Nội bộ");

  if (isInternal) {
    return partnerBranchName
      ? `[Nội bộ] ${partnerBranchName}`
      : displayPartnerName || "[Nội bộ] Chi nhánh nhận";
  }

  if (supplierName) {
    return `[Trả NCC] ${supplierName}`;
  }

  return displayPartnerName || partnerBranchName || "N/A";
}
