"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Plus, Trash2, Loader2 } from "lucide-react";

import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useAuthStore } from "@/stores/useAuthStore";
import { isAdminRole, isManagerRole } from "@/lib/roles";
import { getErrorMessage } from "@/lib/axios";
import { branchService } from "@/app/services/branchService";
import { PurchaseRequestApiService } from "@/app/services/purchase.service";
import { ProductService } from "@/app/services/product.service";
import { supplierService } from "@/app/services/supplier.service";
import type { BranchDTO } from "@/app/types/branch.type";
import type { ProductListItem } from "@/app/types/product.schema";
import type { Supplier, SupplierProductCatalogItem } from "@/app/types/supplier.type";
import {
  PurchaseRequestSchema,
  type PurchaseRequestForm,
} from "@/app/types/purchase.schema";
import { cn } from "@/lib/utils";

type SupplierCatalogVariant = {
  id: number;
  productId: number;
  sku: string;
  productName: string;
  imageUrl?: string;
  quantity?: number;
  customSpecs?: string;
  specs?: string;
  unit?: string;
};

const AVAILABLE_CATALOG_STATUS = "AVAILABLE";

function buildSupplierCatalogVariants(
  products: ProductListItem[],
  catalogItems: SupplierProductCatalogItem[],
): SupplierCatalogVariant[] {
  const availableVariantIds = new Set(
    catalogItems
      .filter((item) => item.status === AVAILABLE_CATALOG_STATUS)
      .map((item) => item.productVariantId),
  );

  return products
    .flatMap((product) =>
      (product.variants || [])
        .filter((variant) => variant.id && availableVariantIds.has(variant.id) && String(variant.status || "").toUpperCase() === "ACTIVE")
        .map((variant) => ({
          id: Number(variant.id ?? 0),
          productId: product.id,
          sku: variant.sku || "",
          productName: product.name || "",
          imageUrl: variant.imageUrl || product.imageUrls?.[0],
          quantity: variant.quantity,
          specs:
            variant.attributeValues?.length
              ? variant.attributeValues
                  .map((v) => `${v.attributeName}: ${v.value}`)
                  .join(", ")
              : "",
          unit: variant.unitConversions?.[0]?.fromUnit || "Cái",
        })),
    )
    .filter((variant) => Boolean(variant.id) && Boolean(variant.sku))
    .sort(
      (a, b) =>
        a.productName.localeCompare(b.productName) ||
        a.sku.localeCompare(b.sku),
    );
}

function formatCurrency(n: number) {
  return new Intl.NumberFormat("vi-VN").format(n);
}

export default function NewPurchaseRequestPage() {
  const { data: currentUser, isLoading } = useCurrentUser();
  const warehouseId = useAuthStore((state) => state.warehouseId);
  const router = useRouter();
  const currentUserBranch = currentUser?.branch as
    | { id?: number; name?: string; branchType?: string; branchCode?: string }
    | undefined;

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [warehouseBranches, setWarehouseBranches] = useState<BranchDTO[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [allProducts, setAllProducts] = useState<ProductListItem[]>([]);
  const [catalogLoading, setCatalogLoading] = useState(false);
  const [showProductModal, setShowProductModal] = useState(false);
  const [supplierProducts, setSupplierProducts] = useState<
    SupplierCatalogVariant[]
  >([]);
  const [selectedProductSkus, setSelectedProductSkus] = useState<string[]>([]);

  const isWarehouseUser =
    currentUserBranch?.branchType === "WAREHOUSE" || warehouseId === 1;
  const canAccessPurchaseRequests =
    isAdminRole(currentUser?.role) ||
    (isWarehouseUser && isManagerRole(currentUser?.role));

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    control,
    formState: { errors },
  } = useForm<PurchaseRequestForm>({
    resolver: zodResolver(PurchaseRequestSchema),
    defaultValues: {
      supplierCode: "",
      supplierName: "",
      branchId: 0,
      branchName: "",
      expectedDeliveryDate: "",
      note: "",
      items: [],
    },
  });

  const { fields, replace, remove } = useFieldArray({
    control,
    name: "items",
  });

  const watchedItems = watch("items");
  const selectedSupplierCode = watch("supplierCode");
  const watchedBranchId = watch("branchId");

  useEffect(() => {
    if (!isWarehouseUser && !isAdminRole(currentUser?.role)) {
      return;
    }

    (async () => {
      try {
        const branchData = await branchService.getAll();
        const allBranches = Array.isArray(branchData)
          ? branchData
          : (branchData?.content ?? []);
        const warehouseOnly: BranchDTO[] = allBranches.filter(
          (branch: BranchDTO) => {
            const code = String(branch.branchCode || "").toUpperCase();
            const type = String(branch.branchType || "").toUpperCase();
            const name = String(branch.name || "").toLowerCase();

            if (code === "SYSTEM_DEFECT") return false;
            if (code === "MAIN_WH") return true;

            return type === "WAREHOUSE" && name.includes("kho tổng");
          },
        );

        setWarehouseBranches(warehouseOnly);

        const defaultWarehouse =
          warehouseOnly.find(
            (branch: BranchDTO) => branch.name === currentUserBranch?.name,
          ) ??
          warehouseOnly.find(
            (branch: BranchDTO) => branch.id === warehouseId,
          ) ??
          warehouseOnly[0];

        if (defaultWarehouse) {
          setValue("branchId", defaultWarehouse.id, {
            shouldValidate: true,
          });
          setValue("branchName", defaultWarehouse.name, {
            shouldValidate: true,
          });
        }

        const [suppData, productData] = await Promise.all([
          supplierService.getAll(undefined, "ACTIVE", 0, 200),
          ProductService.getAll({ status: "ACTIVE" }),
        ]);
        setSuppliers(
          Array.isArray(suppData) ? suppData : (suppData?.content ?? []),
        );
        setAllProducts(Array.isArray(productData) ? productData : []);
      } catch (error) {
        console.error("Failed to load purchase request dependencies", error);
      }
    })();
  }, [
    currentUserBranch?.name,
    currentUser?.role,
    isWarehouseUser,
    setValue,
    warehouseId,
  ]);

  const totalAmount = watchedItems.reduce((sum, item) => {
    return (
      sum + (Number(item.requestedQty) || 0) * (Number(item.unitPrice) || 0)
    );
  }, 0);

  const openSupplierCatalog = async (supplierCode: string) => {
    const selectedSupplier = suppliers.find(
      (supplier) => supplier.code === supplierCode,
    );

    if (!supplierCode || !selectedSupplier?.id) {
      toast.error("Vui lòng chọn nhà cung cấp trước");
      return;
    }

    setCatalogLoading(true);
    try {
      const catalogItems = await supplierService.getProductCatalog(
        selectedSupplier.id,
      );
      const variants = buildSupplierCatalogVariants(allProducts, catalogItems);
      setSupplierProducts(variants);
      setSelectedProductSkus(
        watchedItems
          .map((item) => item.productCode)
          .filter((sku): sku is string => Boolean(sku)),
      );
      setShowProductModal(true);
    } catch (error) {
      setSupplierProducts([]);
      toast.error(getErrorMessage(error as any));
    } finally {
      setCatalogLoading(false);
    }
  };

  const handleSupplierChange = async (supplierCode: string) => {
    const selectedSupplier = suppliers.find(
      (supplier) => supplier.code === supplierCode,
    );

    setValue("supplierCode", supplierCode, { shouldValidate: true });
    setValue("supplierName", selectedSupplier?.name ?? "");
    replace([]);
    setSupplierProducts([]);
    setSelectedProductSkus([]);

    if (selectedSupplier) {
      await openSupplierCatalog(selectedSupplier.code);
    }
  };

  const toggleProductSelection = (sku: string, checked: boolean) => {
    setSelectedProductSkus((prev) => {
      if (checked) {
        return prev.includes(sku) ? prev : [...prev, sku];
      }
      return prev.filter((itemSku) => itemSku !== sku);
    });
  };

  const applySelectedProducts = () => {
    const existingBySku = new Map(
      watchedItems
        .filter((item) => item.productCode)
        .map((item) => [item.productCode, item]),
    );

    const selectedVariants = supplierProducts.filter((product) =>
      selectedProductSkus.includes(product.sku),
    );

    replace(
      selectedVariants.map((product) => {
        const existing = existingBySku.get(product.sku);
        return {
          productCode: product.sku,
          productName: product.productName ?? existing?.productName ?? "",
          imageUrl: product.imageUrl ?? existing?.imageUrl,
          requestedQty: existing?.requestedQty ?? 1,
          unitPrice: existing?.unitPrice ?? 0,
          note: existing?.note ?? "",
        };
      }),
    );

    setShowProductModal(false);
  };

  const onSubmit = async (data: PurchaseRequestForm) => {
    setIsSubmitting(true);
    try {
      const selectedBranch = warehouseBranches.find(
        (branch) => branch.id === Number(data.branchId),
      );
      const created = await PurchaseRequestApiService.create({
        ...data,
        branchName: selectedBranch?.name ?? data.branchName,
      });
      toast.success(`Đã tạo phiếu yêu cầu "${created.code}"`);
      router.push(`/admin/purchase-requests/${created.id}`);
    } catch (error) {
      toast.error(getErrorMessage(error as any));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return null;
  }

  if (!canAccessPurchaseRequests) {
    return (
      <div className="max-w-2xl mx-auto py-20 text-center text-red-500 font-bold text-lg">
        Chỉ admin hoặc quản lý thuộc kho tổng mới được tạo phiếu yêu cầu nhập
        NCC.
      </div>
    );
  }

  return (
    <div className="min-h-screen space-y-5 px-1 pb-[104px] text-slate-900">
      <div className="pt-2">
        <h1 className="text-[20px] font-semibold uppercase text-slate-900">
          Thêm phiếu yêu cầu
        </h1>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-6 border-b border-slate-200 pb-4">
            <h2 className="text-[12px] font-semibold text-slate-900">
              1. Thông tin chính
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-x-5 gap-y-6 sm:grid-cols-2 xl:grid-cols-3">
            <div>
              <label className="mb-2 block text-[10.5px] font-semibold text-slate-500">
                Nhà cung cấp <span className="text-red-500">*</span>
              </label>
              <select
                {...register("supplierCode")}
                onChange={(event) =>
                  void handleSupplierChange(event.target.value)
                }
                className={cn(
                  "h-10 w-full border px-3 text-[13px] shadow-none outline-none focus:border-emerald-300",
                  errors.supplierCode ? "border-red-400" : "border-slate-200",
                )}
              >
                <option value="">-- Chọn nhà cung cấp --</option>
                {suppliers.map((supplier) => (
                  <option key={supplier.id} value={supplier.code}>
                    {supplier.name}
                  </option>
                ))}
              </select>
              {errors.supplierCode && (
                <p className="text-[11px] text-red-500 mt-1">
                  {errors.supplierCode.message}
                </p>
              )}
            </div>

            <div>
              <label className="mb-2 block text-[10.5px] font-semibold text-slate-500">
                Kho tổng nhận hàng <span className="text-red-500">*</span>
              </label>
              <select
                {...register("branchId", {
                  valueAsNumber: true,
                  onChange: (event) => {
                    const selectedBranch = warehouseBranches.find(
                      (branch) => branch.id === Number(event.target.value),
                    );
                    setValue("branchName", selectedBranch?.name ?? "", {
                      shouldValidate: true,
                    });
                  },
                })}
                className={cn(
                  "h-10 w-full border px-3 text-[13px] shadow-none outline-none focus:border-emerald-300",
                  errors.branchId ? "border-red-400" : "border-slate-200",
                )}
                value={watchedBranchId || ""}
              >
                <option value="">-- Chọn kho nhập --</option>
                {warehouseBranches.map((branch) => (
                  <option key={branch.id} value={branch.id}>
                    {branch.name}
                  </option>
                ))}
              </select>
              {errors.branchId && (
                <p className="text-[11px] text-red-500 mt-1">
                  {errors.branchId.message}
                </p>
              )}
            </div>

            <div>
              <label className="mb-2 block text-[10.5px] font-semibold text-slate-500">
                Ngày tạo phiếu
              </label>
              <input
                type="text"
                value={new Date().toLocaleDateString("vi-VN")}
                disabled
                className="h-10 w-full border border-slate-200 bg-slate-50 px-3 text-[13px] text-slate-500"
              />
            </div>

            <div className="xl:col-span-3">
              <label className="mb-2 block text-[10.5px] font-semibold text-slate-500">
                Ghi chú
              </label>
              <input
                type="text"
                {...register("note")}
                placeholder="Ghi chú nội bộ..."
                className="h-10 w-full border border-slate-200 px-3 text-[13px] shadow-none outline-none focus:border-emerald-300"
              />
            </div>
          </div>
        </div>

        <div className="border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-6 flex items-center justify-between border-b border-slate-200 pb-4">
            <h2 className="text-[12px] font-semibold text-slate-900">
              2. Hàng hóa yêu cầu ({fields.length} mặt hàng)
            </h2>
            <Button
              type="button"
              variant="outline"
              className="h-9 rounded-[4px] border-slate-200 bg-white px-3 text-[12px] font-medium text-slate-700 hover:bg-slate-50"
              onClick={() => void openSupplierCatalog(selectedSupplierCode)}
              disabled={!selectedSupplierCode || catalogLoading}
            >
              <Plus size={12} className="mr-1" />
              Chọn sản phẩm
            </Button>
          </div>

          {errors.items?.root && (
            <p className="text-[12px] text-red-500 mb-3">
              {errors.items.root.message}
            </p>
          )}

          {fields.length === 0 ? (
            <div className="text-center py-8 text-slate-400">
              <p className="text-[12px]">
                Chọn nhà cung cấp để mở popup danh sách hàng hóa đang bán và
                tick các món cần nhập.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] table-fixed text-[12px]">
                <thead>
                  <tr className="bg-slate-50 border-b">
                    <th className="w-8 px-3 py-3 text-left text-[11px] font-medium text-slate-500">
                      #
                    </th>
                    <th className="w-[34%] px-3 py-3 text-left text-[11px] font-medium text-slate-500">
                      Sản phẩm
                    </th>
                    <th className="w-[13%] px-3 py-3 text-center text-[11px] font-medium text-slate-500">
                      SL yêu cầu
                    </th>
                    <th className="w-[15%] px-3 py-3 text-right text-[11px] font-medium text-slate-500">
                      Đơn giá
                    </th>
                    <th className="w-[15%] px-3 py-3 text-right text-[11px] font-medium text-slate-500">
                      Thành tiền
                    </th>
                    <th className="w-[18%] px-3 py-3 text-left text-[11px] font-medium text-slate-500">
                      Ghi chú
                    </th>
                    <th className="w-8" />
                  </tr>
                </thead>
                <tbody>
                  {fields.map((field, idx) => {
                    const item = watchedItems[idx];
                    const subtotal =
                      (Number(item?.requestedQty) || 0) *
                      (Number(item?.unitPrice) || 0);

                    return (
                      <tr
                        key={field.id}
                        className="border-b border-slate-100 hover:bg-slate-50"
                      >
                        <td className="px-3 py-2 text-slate-400">{idx + 1}</td>
                        <td className="px-3 py-2">
                          <div className="flex items-center gap-2">
                            {item?.imageUrl && (
                              <img
                                src={item.imageUrl}
                                alt={item.productName}
                                className="w-8 h-8 rounded object-cover"
                              />
                            )}
                            <div>
                              <div className="text-[12.5px] font-semibold text-slate-800">
                                {item?.productName}
                              </div>
                              <div className="text-[10.5px] text-slate-400">
                                {item?.productCode}
                              </div>
                            </div>
                          </div>
                          {errors.items?.[idx]?.productCode && (
                            <p className="text-[10px] text-red-500 mt-0.5">
                              {errors.items[idx]?.productCode?.message}
                            </p>
                          )}
                        </td>
                        <td className="px-3 py-2">
                          <input
                            type="number"
                            min={1}
                            {...register(`items.${idx}.requestedQty`)}
                            className={cn(
                              "h-9 w-full border px-2 text-center text-[12px] shadow-none outline-none focus:border-emerald-300",
                              errors.items?.[idx]?.requestedQty
                                ? "border-red-400"
                                : "border-slate-200",
                            )}
                          />
                        </td>
                        <td className="px-3 py-2">
                          <input
                            type="number"
                            min={0}
                            {...register(`items.${idx}.unitPrice`)}
                            className="h-9 w-full border border-slate-200 px-2 text-right text-[12px] shadow-none outline-none focus:border-emerald-300"
                          />
                        </td>
                        <td className="px-3 py-2 text-right font-semibold text-slate-700">
                          {formatCurrency(subtotal)}
                        </td>
                        <td className="px-3 py-2">
                          <input
                            type="text"
                            {...register(`items.${idx}.note`)}
                            placeholder="Ghi chú..."
                            className="h-9 w-full border border-slate-200 px-2 text-[12px] shadow-none outline-none focus:border-emerald-300"
                          />
                        </td>
                        <td className="px-3 py-2 text-center">
                          <button
                            type="button"
                            onClick={() => remove(idx)}
                            className="text-slate-300 hover:text-red-500 transition-colors"
                          >
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="border-t border-slate-200 bg-slate-50">
                    <td
                      colSpan={4}
                      className="px-3 py-3 text-right text-[11px] font-medium text-slate-500"
                    >
                      Tổng giá trị yêu cầu
                    </td>
                    <td className="px-3 py-3 text-right text-[13px] font-semibold text-slate-900">
                      {formatCurrency(totalAmount)}
                    </td>
                    <td colSpan={2} />
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>

        <div className="fixed bottom-0 left-0 right-0 z-[999] border-t border-slate-200 bg-white/95 px-6 py-3 shadow-[0_-8px_20px_rgba(15,23,42,0.06)] backdrop-blur lg:left-[260px]">
          <div className="flex justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            className="h-10 min-w-[120px] rounded-[4px] border-slate-200 text-[13px] font-medium"
          >
            Hủy
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting}
            className="h-10 min-w-[160px] rounded-[4px] bg-emerald-600 text-[13px] font-medium text-white hover:bg-emerald-700"
          >
            {isSubmitting ? (
              <>
                <Loader2 size={14} className="animate-spin mr-2" />
                Đang lưu...
              </>
            ) : (
              "Lưu phiếu yêu cầu"
            )}
          </Button>
          </div>
        </div>
      </form>

      <Dialog open={showProductModal} onOpenChange={setShowProductModal}>
        <DialogContent className="max-w-3xl rounded-[6px] border border-slate-200 p-0">
          <div className="border-b border-slate-200 p-5">
            <h3 className="text-[16px] font-semibold text-slate-900">
              Danh sách hàng hóa nhà cung cấp đang bán
            </h3>
          </div>

          <div className="max-h-[60vh] overflow-y-auto p-5">
            {catalogLoading ? (
              <div className="py-12 flex items-center justify-center text-slate-400">
                <Loader2 size={18} className="animate-spin mr-2 text-emerald-600" />
                Đang tải danh mục hàng hóa...
              </div>
            ) : supplierProducts.length === 0 ? (
              <div className="py-12 text-center text-slate-400">
                Không có hàng hóa nào đang bán cho nhà cung cấp này.
              </div>
            ) : (
              <div className="space-y-2">
                {supplierProducts.map((product) => {
                  const checked = selectedProductSkus.includes(product.sku);
                  return (
                    <label
                      key={product.sku}
                      className={cn(
                        "flex cursor-pointer items-center gap-3 rounded-[4px] border px-3 py-3 transition-colors",
                        checked
                          ? "border-emerald-200 bg-emerald-50"
                          : "border-slate-200 hover:bg-slate-50",
                      )}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={(event) =>
                          toggleProductSelection(
                            product.sku,
                            event.target.checked,
                          )
                        }
                        className="h-4 w-4"
                      />
                      {product.imageUrl ? (
                        <img
                          src={product.imageUrl}
                          alt={product.productName}
                          className="w-12 h-12 rounded object-cover border border-slate-200"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded border border-slate-200 bg-slate-100" />
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-[12.5px] font-semibold text-slate-800">
                          {product.productName}
                        </div>
                        <div className="truncate text-[10.5px] text-slate-500">
                          SKU: {product.sku}
                          {product.customSpecs
                            ? ` • ${product.customSpecs}`
                            : ""}
                        </div>
                      </div>
                    </label>
                  );
                })}
              </div>
            )}
          </div>

          <div className="flex items-center justify-between gap-3 border-t border-slate-200 p-5">
            <span className="text-[12px] text-slate-500">
              Đã chọn {selectedProductSkus.length} mặt hàng
            </span>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowProductModal(false)}
              >
                Đóng
              </Button>
              <Button
                type="button"
                className="bg-emerald-600 text-white hover:bg-emerald-700"
                onClick={applySelectedProducts}
              >
                Áp dụng
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
