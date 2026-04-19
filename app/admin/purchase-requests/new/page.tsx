"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import {
  ShoppingCart,
  Plus,
  Trash2,
  Loader2,
  ChevronLeft,
} from "lucide-react";

import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { getErrorMessage, apiJava } from "@/lib/axios";
import { PurchaseRequestApiService } from "@/app/services/purchase.service";
import { supplierService } from "@/app/services/supplier.service";
import type { Supplier } from "@/app/types/supplier.type";
import {
  PurchaseRequestSchema,
  type PurchaseRequestForm,
} from "@/app/types/purchase.schema";
import { cn } from "@/lib/utils";

type SupplierCatalogVariant = {
  id: number;
  sku: string;
  productName: string;
  imageUrl?: string;
  quantity?: number;
  customSpecs?: string;
};

function formatCurrency(n: number) {
  return new Intl.NumberFormat("vi-VN").format(n);
}

export default function NewPurchaseRequestPage() {
  const { data: currentUser, isLoading } = useCurrentUser();
  const router = useRouter();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [catalogLoading, setCatalogLoading] = useState(false);
  const [showProductModal, setShowProductModal] = useState(false);
  const [supplierProducts, setSupplierProducts] = useState<SupplierCatalogVariant[]>([]);
  const [selectedProductSkus, setSelectedProductSkus] = useState<string[]>([]);

  const isWarehouseUser =
    currentUser?.branch?.name?.toLowerCase().includes("kho tổng") ?? false;

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
  const watchedBranchName = watch("branchName");

  useEffect(() => {
    if (currentUser?.branch?.name) {
      setValue("branchName", currentUser.branch.name, { shouldValidate: true });
    }
  }, [currentUser?.branch?.name, setValue]);

  useEffect(() => {
    if (!isWarehouseUser) {
      return;
    }

    (async () => {
      try {
        const suppData = await supplierService.getAll(undefined, "ACTIVE", 0, 200);
        setSuppliers(Array.isArray(suppData) ? suppData : (suppData?.content ?? []));
      } catch (error) {
        console.error("Failed to load suppliers", error);
      }
    })();
  }, [isWarehouseUser]);

  const totalAmount = watchedItems.reduce((sum, item) => {
    return sum + (Number(item.requestedQty) || 0) * (Number(item.unitPrice) || 0);
  }, 0);

  const openSupplierCatalog = async (supplierCode: string) => {
    if (!supplierCode) {
      toast.error("Vui lòng chọn nhà cung cấp trước");
      return;
    }

    setCatalogLoading(true);
    try {
      const response = await apiJava.get("/product-variants/search", {
        params: {
          supplierCode,
        },
      });

      const variants = Array.isArray(response.data) ? response.data : [];
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
    const selectedSupplier = suppliers.find((supplier) => supplier.code === supplierCode);

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
      const created = await PurchaseRequestApiService.create(data);
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

  if (!isWarehouseUser) {
    return (
      <div className="max-w-2xl mx-auto py-20 text-center text-red-500 font-bold text-lg">
        Chỉ tài khoản thuộc kho tổng mới được tạo phiếu yêu cầu nhập NCC.
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto py-6 px-4">
      <div className="flex items-center gap-3 mb-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.back()}
          className="h-8 px-2"
        >
          <ChevronLeft size={16} />
        </Button>
        <div>
          <h1 className="text-[18px] font-black uppercase tracking-tight text-slate-700 flex items-center gap-2">
            <ShoppingCart size={18} className="text-blue-600" />
            Lập phiếu yêu cầu mua hàng NCC
          </h1>
          <p className="text-[12px] text-slate-400 mt-0.5">
            Chỉ kho tổng được tạo phiếu yêu cầu nhập NCC. Hàng hóa được chọn từ danh mục đang bán của nhà cung cấp.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <input type="hidden" {...register("branchName")} />
        <div className="bg-white border border-slate-200 rounded-sm shadow-sm p-5">
          <h2 className="text-[13px] font-black uppercase tracking-wider text-slate-600 mb-4 border-b pb-2">
            Thông tin chung
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-black uppercase tracking-wider text-slate-500 mb-1.5">
                Nhà cung cấp <span className="text-red-500">*</span>
              </label>
              <div className="flex gap-2">
                <select
                  {...register("supplierCode")}
                  onChange={(event) => void handleSupplierChange(event.target.value)}
                  className={cn(
                    "w-full h-9 border rounded-[3px] px-3 text-[13px] focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white",
                    errors.supplierCode ? "border-red-400" : "border-slate-200",
                  )}
                >
                  <option value="">-- Chọn nhà cung cấp --</option>
                  {suppliers.map((supplier) => (
                    <option key={supplier.id} value={supplier.code}>
                      {supplier.name} ({supplier.code})
                    </option>
                  ))}
                </select>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => void openSupplierCatalog(selectedSupplierCode)}
                  disabled={!selectedSupplierCode || catalogLoading}
                >
                  {catalogLoading ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    "Chọn hàng NCC"
                  )}
                </Button>
              </div>
              {errors.supplierCode && (
                <p className="text-[11px] text-red-500 mt-1">
                  {errors.supplierCode.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-[11px] font-black uppercase tracking-wider text-slate-500 mb-1.5">
                Kho tổng nhận hàng <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={watchedBranchName || currentUser?.branch?.name || ""}
                disabled
                className="w-full h-9 border border-slate-200 rounded-[3px] px-3 text-[13px] bg-slate-100 text-slate-600"
              />
              {errors.branchName && (
                <p className="text-[11px] text-red-500 mt-1">
                  {errors.branchName.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-[11px] font-black uppercase tracking-wider text-slate-500 mb-1.5">
                Ngày tạo phiếu
              </label>
              <input
                type="text"
                value={new Date().toLocaleDateString("vi-VN")}
                disabled
                className="w-full h-9 border border-slate-200 rounded-[3px] px-3 text-[13px] bg-slate-100 text-slate-600"
              />
            </div>

            <div>
              <label className="block text-[11px] font-black uppercase tracking-wider text-slate-500 mb-1.5">
                Ghi chú
              </label>
              <input
                type="text"
                {...register("note")}
                placeholder="Ghi chú nội bộ..."
                className="w-full h-9 border border-slate-200 rounded-[3px] px-3 text-[13px] focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-sm shadow-sm p-5">
          <div className="flex items-center justify-between mb-4 border-b pb-2">
            <h2 className="text-[13px] font-black uppercase tracking-wider text-slate-600">
              Danh sách hàng hóa ({fields.length} mặt hàng)
            </h2>
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="h-7 text-[11px] font-bold border-blue-300 text-blue-600 hover:bg-blue-50"
              onClick={() => void openSupplierCatalog(selectedSupplierCode)}
              disabled={!selectedSupplierCode || catalogLoading}
            >
              <Plus size={12} className="mr-1" />
              Chọn từ NCC
            </Button>
          </div>

          {errors.items?.root && (
            <p className="text-[12px] text-red-500 mb-3">
              {errors.items.root.message}
            </p>
          )}

          {fields.length === 0 ? (
            <div className="text-center py-8 text-slate-400">
              <ShoppingCart size={32} className="mx-auto opacity-20 mb-2" />
              <p className="text-[12px]">
                Chọn nhà cung cấp để mở popup danh sách hàng hóa đang bán và tick các món cần nhập.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-[12px]">
                <thead>
                  <tr className="bg-slate-50 border-b">
                    <th className="px-3 py-2 text-left font-black text-slate-500 uppercase tracking-wider w-8">
                      #
                    </th>
                    <th className="px-3 py-2 text-left font-black text-slate-500 uppercase tracking-wider min-w-[220px]">
                      Sản phẩm
                    </th>
                    <th className="px-3 py-2 text-center font-black text-slate-500 uppercase tracking-wider w-[110px]">
                      SL yêu cầu
                    </th>
                    <th className="px-3 py-2 text-right font-black text-slate-500 uppercase tracking-wider w-[130px]">
                      Đơn giá
                    </th>
                    <th className="px-3 py-2 text-right font-black text-slate-500 uppercase tracking-wider w-[130px]">
                      Thành tiền
                    </th>
                    <th className="px-3 py-2 text-left font-black text-slate-500 uppercase tracking-wider min-w-[120px]">
                      Ghi chú
                    </th>
                    <th className="w-8" />
                  </tr>
                </thead>
                <tbody>
                  {fields.map((field, idx) => {
                    const item = watchedItems[idx];
                    const subtotal =
                      (Number(item?.requestedQty) || 0) * (Number(item?.unitPrice) || 0);

                    return (
                      <tr key={field.id} className="border-b hover:bg-slate-50/50">
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
                              <div className="font-medium text-slate-700">
                                {item?.productName}
                              </div>
                              <div className="text-[10px] text-slate-400">
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
                              "w-full h-7 border rounded-[3px] px-2 text-[12px] text-center focus:outline-none focus:ring-1 focus:ring-blue-500",
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
                            className="w-full h-7 border border-slate-200 rounded-[3px] px-2 text-[12px] text-right focus:outline-none focus:ring-1 focus:ring-blue-500"
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
                            className="w-full h-7 border border-slate-200 rounded-[3px] px-2 text-[12px] focus:outline-none focus:ring-1 focus:ring-blue-500"
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
                  <tr className="border-t bg-slate-50">
                    <td
                      colSpan={4}
                      className="px-3 py-2 text-right font-black text-slate-700 uppercase text-[11px] tracking-wider"
                    >
                      Tổng giá trị yêu cầu:
                    </td>
                    <td className="px-3 py-2 text-right font-black text-blue-700 text-[13px]">
                      {formatCurrency(totalAmount)}
                    </td>
                    <td colSpan={2} />
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            className="h-9 text-[12px] font-bold rounded-[3px]"
          >
            Hủy bỏ
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting}
            className="h-9 bg-blue-600 hover:bg-blue-700 text-white text-[12px] font-bold rounded-[3px] min-w-[140px]"
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
      </form>

      <Dialog open={showProductModal} onOpenChange={setShowProductModal}>
        <DialogContent className="max-w-3xl p-0">
          <div className="p-5 border-b">
            <h3 className="text-[16px] font-black text-slate-800 uppercase tracking-tight">
              Danh sách hàng hóa nhà cung cấp đang bán
            </h3>
            <p className="text-[12px] text-slate-500 mt-1">
              Tick từng món hàng để thêm vào phiếu yêu cầu nhập.
            </p>
          </div>

          <div className="max-h-[60vh] overflow-y-auto p-5">
            {catalogLoading ? (
              <div className="py-12 flex items-center justify-center text-slate-400">
                <Loader2 size={18} className="animate-spin mr-2" />
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
                        "flex items-center gap-3 rounded-[6px] border px-3 py-3 cursor-pointer transition-colors",
                        checked
                          ? "border-blue-300 bg-blue-50"
                          : "border-slate-200 hover:border-blue-200 hover:bg-slate-50",
                      )}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={(event) =>
                          toggleProductSelection(product.sku, event.target.checked)
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
                        <div className="font-bold text-slate-700 truncate">
                          {product.productName}
                        </div>
                        <div className="text-[11px] text-slate-500 truncate">
                          SKU: {product.sku}
                          {product.customSpecs ? ` • ${product.customSpecs}` : ""}
                        </div>
                      </div>
                    </label>
                  );
                })}
              </div>
            )}
          </div>

          <div className="flex items-center justify-between gap-3 border-t p-5">
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
              <Button type="button" onClick={applySelectedProducts}>
                Áp dụng
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
