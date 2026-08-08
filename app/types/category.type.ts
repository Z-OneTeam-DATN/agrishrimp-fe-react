export interface CategoryDTO {
  id: number;
  name: string;
  slug?: string | null;
  description: string;
  imageUrl: string;
  status: "ACTIVE";
  parentId: number | null;
  parentName: string | null;
  productCount?: number;
}
