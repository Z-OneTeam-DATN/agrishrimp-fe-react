export interface BrandDTO {
  id: number;
  name: string;
  logoUrl: string | null;
  status?: 'ACTIVE' | 'INACTIVE';
}

