export interface CategoryDTO {
  id: number;
  name: string;
  description: string;
  imageUrl: string;
  status: "ACTIVE";
  parentId: number | null;
  parentName: string | null;
}
