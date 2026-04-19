"use client";

import React, { useState, useEffect } from "react";
import Modal from "@/components/ui/modal";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useRouter } from "next/navigation";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import {
  ShoppingCart,
  Plus,
  Trash2,
  Loader2,
  ChevronLeft,
  Search,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { getErrorMessage } from "@/lib/axios";
import { PurchaseRequestApiService } from "@/app/services/purchase.service";
import { supplierService } from "@/app/services/supplier.service";
import { branchService } from "@/app/services/branchService";
import { apiJava } from "@/lib/axios";
import {
  PurchaseRequestSchema,
  type PurchaseRequestForm,
} from "@/app/types/purchase.schema";
import { cn } from "@/lib/utils";

// ─────────────────────────────────────────────────────────────────────────────

function formatCurrency(n: number) {
  return new Intl.NumberFormat("vi-VN").format(n);
}

export default function NewPurchaseRequestPage() {
  const { data: currentUser, isLoading } = useCurrentUser();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  const [productSearch, setProductSearch] = useState("");
  const [productResults, setProductResults] = useState<any[]>([]);
  const [activeItemIdx, setActiveItemIdx] = useState<number | null>(null);
  const [searchLoading, setSearchLoading] = useState(false);
  // Popup chọn hàng hóa NCC
  const [showProductModal, setShowProductModal] = useState(false);
  const [supplierProducts, setSupplierProducts] = useState<any[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<any[]>([]);

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
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

  const { fields, append, remove } = useFieldArray({ control, name: "items" });
  const watchedItems = watch("items");

  // ── Load dữ liệu master ────────────────────────────────────────────────────

  useEffect(() => {
    (async () => {
      try {
        const [suppData, branchData] = await Promise.all([
          supplierService.getAll(),
          branchService.getAll(),
        ]);
        setSuppliers(
          Array.isArray(suppData) ? suppData : (suppData?.content ?? []),
        );
        // Lọc chỉ lấy kho tổng
        const mainWarehouse = Array.isArray(branchData)
          ? branchData.filter((b) => b.name?.toLowerCase().includes("kho tổng"))
          : (branchData?.content ?? []).filter((b) =>
              b.name?.toLowerCase().includes("kho tổng"),
            );
        setBranches(mainWarehouse);
      } catch (e) {
        console.error("Lỗi tải master data", e);
      }
    })();
  }, []);

  // ── Tìm kiếm sản phẩm ────────────────────────────────────────────────────

  useEffect(() => {
    if (!productSearch.trim()) {
      setProductResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setSearchLoading(true);
      try {
        const res = await apiJava.get("/product-variants/search", {
          params: { keyword: productSearch, size: 20 },
        });
        const variants = Array.isArray(res.data)
          ? res.data
          : (res.data?.content ?? []);
        setProductResults(variants);
      } catch {
        setProductResults([]);
      } finally {
        setSearchLoading(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [productSearch]);

  const addProduct = (variant: any, index: number) => {
    setValue(`items.${index}.productCode`, variant.sku);
    setValue(
      `items.${index}.productName`,
      variant.productName ?? variant.name ?? "",
    );
    setValue(`items.${index}.imageUrl`, variant.imageUrl ?? "");
    setProductSearch("");
    setProductResults([]);
    setActiveItemIdx(null);
  };

  // ── Tổng tiền ────────────────────────────────────────────────────────────

  const totalAmount = watchedItems.reduce((sum, item) => {
    return (
      sum + (Number(item.requestedQty) || 0) * (Number(item.unitPrice) || 0)
    );
  }, 0);

  // ── Submit ────────────────────────────────────────────────────────────────

  const onSubmit = async (data: PurchaseRequestForm) => {
    setIsSubmitting(true);
    try {
      const created = await PurchaseRequestApiService.create(data);
      toast.success(`Đã tạo phiếu yêu cầu "${created.code}"`);
      router.push(`/admin/purchase-requests/${created.id}`);
    } catch (err) {
      toast.error(getErrorMessage(err as any));
    } finally {
      setIsSubmitting(false);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────────

  // Nếu chưa load user hoặc user không phải kho tổng thì ẩn trang
  if (isLoading) return null;
  if (!currentUser?.branch?.name?.toLowerCase().includes("kho tổng")) {
    return (
      <div className="max-w-2xl mx-auto py-20 text-center text-red-500 font-bold text-lg">
        Chỉ tài khoản thuộc Kho tổng mới được tạo phiếu yêu cầu nhập NCC
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto py-6 px-4">
      {/* Page Header */}
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
            Phiếu được tạo ở trạng thái Nháp, cần gửi duyệt trước khi gửi NCC.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* ── Section 1: Thông tin chung ──────────────────────────────────── */}
        <div className="bg-white border border-slate-200 rounded-sm shadow-sm p-5">
          <h2 className="text-[13px] font-black uppercase tracking-wider text-slate-600 mb-4 border-b pb-2">
            Thông tin chung
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Nhà cung cấp */}
            <div>
              <label className="block text-[11px] font-black uppercase tracking-wider text-slate-500 mb-1.5">
                Nhà cung cấp <span className="text-red-500">*</span>
              </label>
              <div className="flex gap-2">
                <select
                  {...register("supplierCode")}
                  onChange={async (e) => {
                    const selected = suppliers.find(
                      (s) => s.code === e.target.value,
                    );
                    setValue("supplierCode", e.target.value);
                    setValue("supplierName", selected?.name ?? "");
                    setSelectedProducts([]);
                    if (selected) {
                      // Lấy danh sách sản phẩm NCC
                      setShowProductModal(true);
                      try {
                        const products =
                          await supplierService.getProductCatalog(selected.id);
                        setSupplierProducts(products);
                      } catch {
                        setSupplierProducts([]);
                      }
                    }
                  }}
                  className={cn(
                    "w-full h-9 border rounded-[3px] px-3 text-[13px] focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white",
                    errors.supplierCode ? "border-red-400" : "border-slate-200",
                  )}
                >
                  <option value="">— Chọn nhà cung cấp —</option>
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.code}>
                      {s.name} ({s.code})
                    </option>
                  ))}
                </select>
                {supplierProducts.length > 0 && (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => setShowProductModal(true)}
                  >
                    Chọn hàng NCC
                  </Button>
                )}
              </div>
              {errors.supplierCode && (
                <p className="text-[11px] text-red-500 mt-1">
                  {errors.supplierCode.message}
                </p>
              )}
              {/* Modal chọn hàng hóa NCC */}
              <Modal
                open={showProductModal}
                onClose={() => setShowProductModal(false)}
              >
                <div className="p-4 max-w-xl w-full bg-white rounded shadow-lg">
                  <h3 className="font-bold mb-2">
                    Danh sách hàng NCC đang bán
                  </h3>
                  <div className="max-h-72 overflow-y-auto border rounded mb-3">
                    {supplierProducts.length === 0 && (
                      <div className="p-4 text-center text-slate-400">
                        Không có hàng hóa nào
                      </div>
                    )}
                    {supplierProducts.map((prod) => (
                      <label
                        key={prod.productId}
                        className="flex items-center gap-2 px-3 py-2 border-b last:border-b-0 cursor-pointer hover:bg-blue-50"
                      >
                        <input
                          type="checkbox"
                          checked={selectedProducts.some(
                            (p) => p.productId === prod.productId,
                          )}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedProducts((prev) => [...prev, prod]);
                            } else {
                              setSelectedProducts((prev) =>
                                prev.filter(
                                  (p) => p.productId !== prod.productId,
                                ),
                              );
                            }
                          }}
                        />
                        <span className="font-medium">{prod.productName}</span>
                        <span className="text-xs text-slate-400">
                          ({prod.productId})
                        </span>
                      </label>
                    ))}
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowProductModal(false)}
                    >
                      Đóng
                    </Button>
                    <Button
                      type="button"
                      onClick={() => {
                        // Thêm các sản phẩm đã chọn vào danh sách items
                        selectedProducts.forEach((prod) => {
                          if (
                            !fields.some(
                              (item) =>
                                item.productCode === prod.productId?.toString(),
                            )
                          ) {
                            append({
                              productCode: prod.productId?.toString() ?? "",
                              productName: prod.productName ?? "",
                              requestedQty: 1,
                              unitPrice: 0,
                              note: "",
                            });
                          }
                        });
                        setShowProductModal(false);
                      }}
                    >
                      Chọn
                    </Button>
                  </div>
                </div>
              </Modal>
            </div>

            {/* Chi nhánh nhận */}
            <div>
              <label className="block text-[11px] font-black uppercase tracking-wider text-slate-500 mb-1.5">
                Chi nhánh nhận hàng <span className="text-red-500">*</span>
              </label>
              <select
                {...register("branchName")}
                className={cn(
                  "w-full h-9 border rounded-[3px] px-3 text-[13px] focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white",
                  errors.branchName ? "border-red-400" : "border-slate-200",
                )}
              >
                <option value="">— Chọn chi nhánh —</option>
                {branches.map((b) => (
                  <option key={b.id} value={b.name}>
                    {b.name}
                  </option>
                ))}
              </select>
              {errors.branchName && (
                <p className="text-[11px] text-red-500 mt-1">
                  {errors.branchName.message}
                </p>
              )}
            </div>

            {/* Ngày tạo phiếu */}
            <div>
              <label className="block text-[11px] font-black uppercase tracking-wider text-slate-500 mb-1.5">
                Ngày tạo phiếu
              </label>
              <input
                type="text"
                value={new Date().toLocaleDateString("vi-VN")}
                disabled
                className="w-full h-9 border border-slate-200 rounded-[3px] px-3 text-[13px] bg-gray-100 text-gray-500"
              />
            </div>

            {/* Ghi chú */}
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

        {/* ── Section 2: Danh sách hàng hóa ──────────────────────────────── */}
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
              onClick={() =>
                append({
                  productCode: "",
                  productName: "",
                  requestedQty: 1,
                  unitPrice: 0,
                  note: "",
                })
              }
            >
              <Plus size={12} className="mr-1" /> Thêm hàng
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
                Chưa có hàng hóa. Nhấn "Thêm hàng" để bắt đầu.
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
                    <th className="px-3 py-2 text-left font-black text-slate-500 uppercase tracking-wider min-w-[200px]">
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
                    <th className="w-8"></th>
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
                        className="border-b hover:bg-slate-50/50"
                      >
                        <td className="px-3 py-2 text-slate-400">{idx + 1}</td>

                        {/* Sản phẩm */}
                        <td className="px-3 py-2">
                          <div className="relative">
                            {item?.productCode ? (
                              <div className="flex items-center gap-1.5">
                                {item.imageUrl && (
                                  <img
                                    src={item.imageUrl}
                                    alt=""
                                    className="w-6 h-6 rounded object-cover"
                                  />
                                )}
                                <span className="font-medium text-slate-700">
                                  {item.productName}
                                </span>
                                <span className="text-slate-400 text-[10px]">
                                  ({item.productCode})
                                </span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setValue(`items.${idx}.productCode`, "");
                                    setValue(`items.${idx}.productName`, "");
                                  }}
                                  className="ml-auto text-slate-400 hover:text-red-500"
                                >
                                  <X size={12} />
                                </button>
                              </div>
                            ) : (
                              <div>
                                <div className="relative">
                                  <Search
                                    size={12}
                                    className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400"
                                  />
                                  <input
                                    type="text"
                                    value={
                                      activeItemIdx === idx ? productSearch : ""
                                    }
                                    onChange={(e) => {
                                      setActiveItemIdx(idx);
                                      setProductSearch(e.target.value);
                                    }}
                                    onFocus={() => setActiveItemIdx(idx)}
                                    placeholder="Tìm sản phẩm..."
                                    className="w-full h-7 pl-6 pr-2 border border-slate-200 rounded-[3px] text-[12px] focus:outline-none focus:ring-1 focus:ring-blue-500"
                                  />
                                  {searchLoading && activeItemIdx === idx && (
                                    <Loader2
                                      size={10}
                                      className="absolute right-2 top-1/2 -translate-y-1/2 animate-spin text-slate-400"
                                    />
                                  )}
                                </div>
                                {activeItemIdx === idx &&
                                  productResults.length > 0 && (
                                    <div className="absolute z-50 left-0 right-0 mt-0.5 bg-white border border-slate-200 rounded-[3px] shadow-lg max-h-[200px] overflow-y-auto">
                                      {productResults.map((v) => (
                                        <button
                                          key={v.id}
                                          type="button"
                                          onClick={() => addProduct(v, idx)}
                                          className="w-full px-3 py-2 text-left hover:bg-blue-50 flex items-center gap-2"
                                        >
                                          {v.imageUrl && (
                                            <img
                                              src={v.imageUrl}
                                              alt=""
                                              className="w-6 h-6 rounded object-cover"
                                            />
                                          )}
                                          <div>
                                            <div className="font-medium text-slate-700 text-[12px]">
                                              {v.productName}
                                            </div>
                                            <div className="text-[10px] text-slate-400">
                                              {v.sku} · {v.customSpecs}
                                            </div>
                                          </div>
                                        </button>
                                      ))}
                                    </div>
                                  )}
                              </div>
                            )}
                            {errors.items?.[idx]?.productCode && (
                              <p className="text-[10px] text-red-500 mt-0.5">
                                {errors.items[idx]?.productCode?.message}
                              </p>
                            )}
                          </div>
                        </td>

                        {/* SL yêu cầu */}
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

                        {/* Đơn giá */}
                        <td className="px-3 py-2">
                          <input
                            type="number"
                            min={0}
                            {...register(`items.${idx}.unitPrice`)}
                            className="w-full h-7 border border-slate-200 rounded-[3px] px-2 text-[12px] text-right focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />
                        </td>

                        {/* Thành tiền */}
                        <td className="px-3 py-2 text-right font-semibold text-slate-700">
                          {formatCurrency(subtotal)}
                        </td>

                        {/* Ghi chú */}
                        <td className="px-3 py-2">
                          <input
                            type="text"
                            {...register(`items.${idx}.note`)}
                            placeholder="Ghi chú..."
                            className="w-full h-7 border border-slate-200 rounded-[3px] px-2 text-[12px] focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />
                        </td>

                        {/* Xóa */}
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

        {/* ── Actions ─────────────────────────────────────────────────────── */}
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
    </div>
  );
}
