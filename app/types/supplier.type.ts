export interface Category {
  id: number;
  name: string;
  code?: string;
}

export interface SupplierWarning {
  code: string;
  severity: "WARNING" | "INFO" | string;
  message: string;
}

export interface Supplier {
  id: number;
  code: string;
  name: string;
  taxCode: string;

  category: unknown;

  contactName: string;
  phone: string;
  email: string;
  addressDetail: string;
  provinceId: string;
  paymentTerm: string;
  creditLimit: number;
  discount: number;
  currentDebt: number;
  bankAccountNumber: string;
  bankName: string;
  bankAccountHolder: string;
  status: "ACTIVE" | "INACTIVE";

  issueDate?: string;
  taxAuthority?: string;
  mainBusinessSector?: string;

  note?: string;
  createdAt: string;
  updatedAt?: string;
  createdByUserId?: number;
  updatedByUserId?: number;
  createdByName?: string;
  updatedByName?: string;
  catalogProductCount?: number;
  availableProductCount?: number;
  unavailableProductCount?: number;
  checkingProductCount?: number;
  warnings?: SupplierWarning[];
}

export type SupplierProductCatalogStatus = "AVAILABLE" | "UNAVAILABLE" | "CHECKING";

export interface SupplierProductCatalogItem {
  id: number;
  supplierId: number;
  supplierCode: string;
  productVariantId: number;
  sku: string;
  productId: number;
  productName: string;
  productSlug: string;
  imageUrl?: string;
  brandName?: string;
  origin?: string;
  categoryName?: string;
  status: SupplierProductCatalogStatus;
  price?: number;
  note?: string;
  statusChangedAt?: string;
  version: number;
  createdAt?: string;
  updatedAt?: string;
  createdByUserId?: number;
  updatedByUserId?: number;
  createdByName?: string;
  updatedByName?: string;
  checkingAgeDays?: number;
  checkingTooLong?: boolean;
  systemStockQuantity?: number;
  lowStock?: boolean;
}

export interface PageResponse<T> {
  content: T[];
  totalPages: number;
  totalElements: number;
  size: number;
  number: number;
}
