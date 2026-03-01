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
  categoryName?: string;
  brandName?: string;
  category?: { id: number; name: string };
  brand?: { id: number; name: string };
  imageUrls: string[];
  variants: ProductVariant[];
  soldCount?: number;
  ratingAverage?: number;
  reviewCount?: number;
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

export interface ProductDetail extends ProductListItem {
  description: string;
  origin: string;
  categoryId?: number;
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
  barcode?: string;
  costPrice?: number;
  price: number;
  wholesalePrice?: number;
  initialStock?: number;
  shippingWeight?: number;
  image?: string;
  attributeValueIds?: number[];
  unitConversions?: UnitConversion[];
}

export interface UpdateProductRequest {
  name: string;
  categoryId: number;
  brand?: string;
  origin?: string;
  description?: string;
  status?: string;
  images?: string[];
  variants: UpdateProductVariantRequest[];
}

// --- PUBLIC API TYPES (no auth required, no costPrice/quantity/status/warehouseId) ---

export interface PageResponse<T> {
  content: T[];
  totalPages: number;
  totalElements: number;
  number: number; // 0-based current page
  size: number;
}

export interface PublicVariantAttributeValue {
  attributeId: number;
  attributeName: string;
  attributeCode: string;
  valueId: number;
  value: string;
}

export interface PublicProductVariant {
  id: number;
  sku: string;
  barcode: string;
  costPrice: number;
  price: number;
  wholesalePrice: number;
  quantity: number;
  shippingWeight: number;
  unit: string;
  imageUrl: string;
  status: string;
  attributeValues: PublicVariantAttributeValue[];
  unitConversions: UnitConversion[];

    batches?: {
        inventoryId: number;
        batchNumber: string;
        quantity: number;
        sellingPrice: number;
        branchName: string;
    }[];
}

export interface PublicProductCategory {
  id: number;
  name: string;
}

export interface PublicProductListItem {
  id: number;
  name: string;
  slug: string;
  description?: string;
  shortDesc?: string;
  imageUrls: string[];
  isOutOfStock: boolean;
  origin?: string;
  brandName?: string;
  categoryName?: string;
  category?: PublicProductCategory;
  variants: PublicProductVariant[];
  soldCount?: number;
  ratingAverage?: number;
  reviewCount?: number;
}

export interface PublicProductDetail {
  id: number;
  name: string;
  slug: string;
  shortDesc?: string;
  description: string;
  imageUrls: string[];
  isOutOfStock: boolean;
  origin?: string;
  brandName: string;
  category: PublicProductCategory;
  variants: PublicProductVariant[];
}
