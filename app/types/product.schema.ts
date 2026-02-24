export interface ApiError {
  field: string;
  message: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data: T | null;
  errors?: ApiError[];
  timestamp?: string;
}

export interface AttributeValue {
  id: number;
  value: string;
}

export interface Attribute {
  id: number;
  name: string;
  code: string;
  type: string;
  description: string;
  status: "ACTIVE" | "INACTIVE";
  values: AttributeValue[];
}

export interface VariantAttributeValue {
  attributeId: number;
  attributeName: string;
  attributeCode: string;
  valueId: number;
  value: string;
}

export interface ProductListItem {
  id: number;
  name: string;
  slug: string;
  description: string;
  status: string;
  origin: string;
  baseSku: string;
  categoryName: string;
  brandName: string;
  imageUrls: string[];
  variants: ProductVariant[];
}

export interface UnitConversion {
  id?: number;
  fromUnit: string;
  toUnit: string;
  rate: number;
}

export interface ProductVariant {
  id?: number;
  sku: string;
  barcode: string;
  price: number;
  wholesalePrice: number;
  costPrice: number;
  quantity: number;
  status: string;
  shippingWeight?: number;
  imageUrl?: string;
  attributeValueIds?: number[];
  attributeValues?: VariantAttributeValue[];
  unitConversions: UnitConversion[];
}

export interface ProductDetail extends Omit<ProductListItem, "categoryName" | "brandName"> {
  description: string;
  brand: string;
  origin: string;
  categoryId: number;
}

export interface CreateProductRequest {
  name: string;
  categoryId: number;
  brand: string;
  origin: string;
  description: string;
  status: string;
  variants: Omit<ProductVariant, "id" | "quantity" | "attributeValues">[];
}

export interface UpdateProductVariantRequest {
  sku: string;
  price: number;
  attributes: VariantAttributeValue[];
}

export interface UpdateProductRequest {
  name: string;
  categoryId: number;
  brand: string;
  description: string;
  variants: UpdateProductVariantRequest[];
}
