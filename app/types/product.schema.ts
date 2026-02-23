export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data: T | null;
}

export interface AttributeSuggestion {
  name: string;
  values: string[];
}

export interface ProductListItem {
  id: number;
  name: string;
  slug: string;
  baseSku: string;
  categoryName: string;
  brandName: string;
  status: string;
  imageUrls: string[];
  variants: any[];
}

export interface UnitConversion {
  fromUnit: string;
  toUnit: string;
  rate: number;
}

export interface VariantAttribute {
  name: string;
  value: string;
}

export interface ProductVariant {
  id?: number;
  sku: string;
  barcode: string;
  formulation: string;
  packaging: string;
  unit: string;
  price: number;
  wholesalePrice: number;
  costPrice?: number; // Added for creation
  initialStock?: number; // Added for creation
  quantity?: number; // From GET
  status?: string;
  netWeight?: number;
  netWeightUnit?: string;
  shippingWeight?: number;
  attributes: VariantAttribute[];
  unitConversions: UnitConversion[];
}

export interface ProductDetail {
  id: number;
  name: string;
  description: string;
  baseSku: string;
  brand: string;
  origin: string;
  categoryId: number;
  status: string;
  variants: ProductVariant[];
}

export interface CreateProductRequest {
  name: string;
  categoryId: number;
  brand: string;
  origin: string;
  baseSku: string;
  description: string;
  status: string;
  variants: Omit<ProductVariant, "id" | "quantity">[];
}

export interface UpdateProductVariantRequest {
  sku: string;
  price: number;
  attributes: VariantAttribute[];
}

export interface UpdateProductRequest {
  name: string;
  categoryId: number;
  brand: string;
  description: string;
  variants: UpdateProductVariantRequest[];
}
