export interface BranchDTO {
  id: number;
  branchCode: string;
  branchType: string;
  name: string;
  phone: string;
  email: string;
  addressDetail: string;
  provinceId: number;
  districtId: number;
  wardId: number;
  provinceName: string;
  districtName: string;
  wardName: string;
  managerNames: string[];
  managerIds?: number[];
  status: "ACTIVE" | "INACTIVE";
  lat?: number;
  lng?: number;
}
