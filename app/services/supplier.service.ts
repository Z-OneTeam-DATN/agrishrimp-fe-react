import { apiJava } from "@/lib/axios";
import { SupplierFormValues } from "@/app/types/supplier.schema";

export class SupplierService {
  private static readonly PREFIX = "/admin/suppliers";

  static async createSupplier(data: SupplierFormValues) {
    const response = await apiJava.post(`${this.PREFIX}/create`, data);
    return response.data;
  }

  static async getAllSuppliers() {
    const response = await apiJava.get(`${this.PREFIX}/list`);
    return response.data;
  }
}
