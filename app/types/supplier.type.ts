export interface Category {
  id: number;
  name: string;
  code?: string;
}

export interface Supplier {
  id: number;
  code: string;
  name: string;
  taxCode: string;

  category: any;

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

  note?: string;
  createdAt: string;
}

export interface PageResponse<T> {
  content: T[];
  totalPages: number;
  totalElements: number;
  size: number;
  number: number;
}
