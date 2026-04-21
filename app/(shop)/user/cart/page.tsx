"use client";

import React, {
  useState,
  useEffect,
  useRef,
  useMemo,
  useCallback,
} from "react";
import Image from "next/image";
import Link from "next/link";
import { toast } from "sonner";
import { cartService } from "@/app/services/cart.service";
import {
  voucherService,
  Voucher as VoucherApi,
} from "@/app/services/voucher.service";
import { useRouter } from "next/navigation";
import { useCartStore } from "@/stores/useCartStore";
import {
  Minus,
  Plus,
  Trash2,
  ChevronRight,
  ShoppingBag,
  Tag,
  ArrowRight,
  X,
  Loader2,
  CheckCircle2,
} from "lucide-react";

interface CartItem {
  id: number;
  variantId: number;
  name: string;
  variant: string;
  price: number;
  quantity: number;
  stock: number;
  image: string;
  checked: boolean;
  categoryName?: string;
  brandName?: string;
  productForm?: string;
}

type Voucher = VoucherApi;

const formatMoney = (amount: number | undefined | null) => {
  if (amount === undefined || amount === null) return "0₫";
  return Number(amount).toLocaleString("vi-VN") + "₫";
};

const toVoucherAmount = (value: string | number | null | undefined) =>
  Number(value ?? 0);

function CartSkeleton() {
  return (
    <div className="min-h-screen bg-slate-50 py-6">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="h-5 w-48 bg-slate-200 rounded mb-6 animate-pulse" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-3">
            <div className="bg-white rounded-2xl p-4 animate-pulse">
              <div className="h-4 w-32 bg-slate-200 rounded mb-4" />
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="flex gap-4 py-4 border-t border-slate-100"
                >
                  <div className="w-4 h-4 bg-slate-200 rounded mt-1" />
                  <div className="w-20 h-20 bg-slate-200 rounded-xl shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-slate-200 rounded w-3/4" />
                    <div className="h-3 bg-slate-200 rounded w-1/4" />
                    <div className="h-4 bg-slate-200 rounded w-1/3" />
                  </div>
                  <div className="w-24 h-8 bg-slate-200 rounded-lg" />
                  <div className="w-20 h-4 bg-slate-200 rounded" />
                </div>
              ))}
            </div>
          </div>
          <div className="bg-white rounded-2xl p-5 h-fit animate-pulse space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-4 bg-slate-200 rounded" />
            ))}
            <div className="h-12 bg-slate-200 rounded-xl mt-4" />
          </div>
        </div>
      </div>
    </div>
  );
}

function QtyInput({
  value,
  onUpdate,
  disabled,
}: {
  value: number;
  onUpdate: (delta: number) => void;
  disabled: boolean;
}) {
  const [draft, setDraft] = useState(String(value));
  const prevValue = useRef(value);

  useEffect(() => {
    if (prevValue.current !== value) {
      setDraft(String(value));
      prevValue.current = value;
    }
  }, [value]);

  const commit = () => {
    const parsed = parseInt(draft);
    if (!isNaN(parsed) && parsed >= 1 && parsed !== value) {
      onUpdate(parsed - value);
    } else {
      setDraft(String(value));
    }
  };

  return (
    <div
      className={`inline-flex items-center border border-slate-200 rounded-lg overflow-hidden bg-white ${disabled ? "opacity-50" : ""}`}
    >
      <button
        onClick={() => !disabled && onUpdate(-1)}
        disabled={disabled || value <= 1}
        className="w-8 h-8 flex items-center justify-center text-slate-500 hover:bg-slate-100 disabled:opacity-40 transition-colors"
      >
        <Minus size={13} />
      </button>
      <input
        type="number"
        min={1}
        value={draft}
        disabled={disabled}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => e.key === "Enter" && commit()}
        className="w-11 h-8 text-center text-sm font-bold border-x border-slate-200 focus:outline-none bg-white"
      />
      <button
        onClick={() => !disabled && onUpdate(1)}
        disabled={disabled}
        className="w-8 h-8 flex items-center justify-center text-slate-500 hover:bg-slate-100 disabled:opacity-40 transition-colors"
      >
        <Plus size={13} />
      </button>
    </div>
  );
}

export default function CartPage() {
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingItems, setUpdatingItems] = useState<Record<number, boolean>>(
    {},
  );

  const [availableVouchers, setAvailableVouchers] = useState<Voucher[]>([]);
  const [selectedVoucher, setSelectedVoucher] = useState<Voucher | null>(null);
  const [isVoucherModalOpen, setIsVoucherModalOpen] = useState(false);
  const [voucherInput, setVoucherInput] = useState("");

  const router = useRouter();
  const { fetchCartCount } = useCartStore();

  const fetchCart = useCallback(async () => {
    try {
      setLoading(true);
      const data = (await cartService.getMyCart()) as Array<
        Omit<CartItem, "checked">
      >;
      setItems(data.map((item) => ({ ...item, checked: true })));
    } catch (error: unknown) {
      const apiError = error as {
        response?: { status?: number; data?: { message?: string } };
      };

      if (
        apiError.response?.status === 401 ||
        apiError.response?.status === 403
      ) {
        toast.error("Vui lòng đăng nhập để xem giỏ hàng!");
        router.push("/login");
        return;
      }
      toast.error("Không thể tải giỏ hàng!");
    } finally {
      setLoading(false);
    }
  }, [router]);

  const fetchPublicVouchers = useCallback(async () => {
    try {
      const res = await voucherService.getPublicVouchers();
      let arr = Array.isArray(res) ? res : [];

      const now = new Date().getTime();
      arr = arr.filter((v: Voucher) => new Date(v.endDate).getTime() >= now);

      setAvailableVouchers(arr);
    } catch (error: unknown) {
      console.error("Lỗi tải voucher", error);
    }
  }, []);

  useEffect(() => {
    fetchCart();
    fetchPublicVouchers();
  }, [fetchCart, fetchPublicVouchers]);

  const updateQuantity = async (
    variantId: number,
    currentQty: number,
    delta: number,
  ) => {
    const newQty = currentQty + delta;
    if (newQty < 1) return;
    setUpdatingItems((p) => ({ ...p, [variantId]: true }));
    try {
      await cartService.updateQuantity(variantId, delta);
      setItems((prev) =>
        prev.map((item) =>
          item.variantId === variantId ? { ...item, quantity: newQty } : item,
        ),
      );
      fetchCartCount();
    } catch (error: unknown) {
      const apiError = error as {
        response?: { data?: { message?: string } };
      };

      toast.error(apiError.response?.data?.message || "Lỗi cập nhật số lượng");
    } finally {
      setUpdatingItems((p) => ({ ...p, [variantId]: false }));
    }
  };

  const removeItem = async (cartItemId: number, variantId: number) => {
    if (!confirm("Xóa sản phẩm này khỏi giỏ hàng?")) return;
    setUpdatingItems((p) => ({ ...p, [variantId]: true }));
    try {
      await cartService.removeItem(cartItemId);
      toast.success("Đã xóa khỏi giỏ hàng");
      setItems((prev) => prev.filter((item) => item.id !== cartItemId));
      fetchCartCount();
    } catch {
      toast.error("Lỗi khi xóa sản phẩm");
    } finally {
      setUpdatingItems((p) => ({ ...p, [variantId]: false }));
    }
  };

  const toggleCheck = (id: number) =>
    setItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, checked: !item.checked } : item,
      ),
    );

  const toggleCheckAll = (checked: boolean) =>
    setItems((prev) => prev.map((item) => ({ ...item, checked })));

  const checkedItems = items.filter((i) => i.checked);
  const subTotal = checkedItems.reduce((s, i) => s + i.price * i.quantity, 0);
  const totalCount = checkedItems.reduce((s, i) => s + i.quantity, 0);
  const isAllChecked = items.length > 0 && items.every((i) => i.checked);

  let discountValue = 0;
  if (
    selectedVoucher &&
    subTotal >= toVoucherAmount(selectedVoucher.minOrderValue)
  ) {
    const actualValue = Number(
      selectedVoucher.value || selectedVoucher.discountValue || 0,
    );

    if (selectedVoucher.discountType === "PERCENT") {
      const calculatedDiscount = (subTotal * actualValue) / 100;
      discountValue = selectedVoucher.maxDiscount
        ? Math.min(calculatedDiscount, Number(selectedVoucher.maxDiscount))
        : calculatedDiscount;
    } else {
      discountValue = actualValue;
    }
  } else if (
    selectedVoucher &&
    subTotal < toVoucherAmount(selectedVoucher.minOrderValue)
  ) {
    setSelectedVoucher(null);
  }

  const finalTotal = Math.max(0, subTotal - discountValue);

  const applyVoucherByCode = () => {
    const found = availableVouchers.find(
      (v) => v.code === voucherInput.trim().toUpperCase(),
    );
    if (!found) {
      toast.error("Mã voucher không hợp lệ hoặc đã hết hạn");
      return;
    }
    const minOrderValue = toVoucherAmount(found.minOrderValue);
    if (subTotal < minOrderValue) {
      toast.error(`Đơn chưa đạt ${formatMoney(minOrderValue)}`);
      return;
    }
    setSelectedVoucher(found);
    setIsVoucherModalOpen(false);
    toast.success("Áp dụng voucher thành công!");
  };

  const checkoutUrl = useMemo(() => {
    const params = new URLSearchParams();
    const selectedItemIds = checkedItems.map((item) => item.id);

    if (selectedItemIds.length > 0) {
      params.set("items", selectedItemIds.join(","));
    }

    if (selectedVoucher) {
      params.set("voucher", selectedVoucher.code);
    }

    const query = params.toString();
    return query ? `/checkout?${query}` : "/checkout";
  }, [checkedItems, selectedVoucher]);

  if (loading) return <CartSkeleton />;

  if (items.length === 0) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center bg-gray-50 px-4">
        <div className="text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <ShoppingBag size={28} className="text-gray-400" />
          </div>
          <p className="text-base font-semibold text-gray-700 mb-1">
            Giỏ hàng trống
          </p>
          <p className="text-sm text-gray-400 mb-6">
            Hãy thêm sản phẩm vào giỏ để tiếp tục
          </p>
          <Link
            href="/san-pham"
            className="inline-flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold px-6 py-2.5 rounded-lg transition-colors"
          >
            Mua sắm ngay <ArrowRight size={15} />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24 md:pb-10">
      <div className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 max-w-5xl">
          <nav className="flex items-center gap-1.5 py-4 text-sm text-gray-500">
            <Link href="/" className="hover:text-teal-600 transition-colors">
              Trang chủ
            </Link>
            <ChevronRight size={13} className="text-gray-300" />
            <span className="text-gray-800 font-medium">
              Giỏ hàng ({items.length})
            </span>
          </nav>
        </div>
      </div>

      <div className="container mx-auto px-4 max-w-5xl py-5">
        <div className="space-y-3">
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <div className="flex items-center gap-3 px-5 py-3 border-b border-gray-100 bg-gray-50">
              <input
                type="checkbox"
                id="check-all"
                className="w-4 h-4 accent-teal-600 cursor-pointer"
                checked={isAllChecked}
                onChange={(e) => toggleCheckAll(e.target.checked)}
              />
              <label
                htmlFor="check-all"
                className="text-sm text-gray-600 cursor-pointer select-none"
              >
                Chọn tất cả
              </label>
              <span className="text-xs text-gray-400 ml-auto">
                {checkedItems.length}/{items.length} sản phẩm được chọn
              </span>
            </div>

            <div
              className="hidden md:grid px-5 py-2 border-b border-gray-100"
              style={{
                gridTemplateColumns: "1.5rem 1fr 120px 140px 110px 2rem",
              }}
            >
              {["", "Sản phẩm", "Đơn giá", "Số lượng", "Thành tiền", ""].map(
                (h, i) => (
                  <span
                    key={i}
                    className={`text-[11px] font-semibold uppercase tracking-wide text-gray-400 ${i >= 2 && i <= 4 ? "text-center" : ""} ${i === 4 ? "text-right" : ""}`}
                  >
                    {h}
                  </span>
                ),
              )}
            </div>

            <div className="divide-y divide-gray-100">
              {items.map((item) => {
                const isUpdating = updatingItems[item.variantId];
                const meta = [
                  item.categoryName,
                  item.brandName,
                  item.productForm,
                ]
                  .filter(Boolean)
                  .join(" · ");
                const variantMeta = item.variant || "";

                return (
                  <div
                    key={item.id}
                    className={`px-5 py-4 transition-colors hover:bg-gray-50 ${isUpdating ? "opacity-50 pointer-events-none" : ""}`}
                  >
                    <div
                      className="hidden md:grid items-center gap-3"
                      style={{
                        gridTemplateColumns:
                          "1.5rem 1fr 120px 140px 110px 2rem",
                      }}
                    >
                      <input
                        type="checkbox"
                        className="w-4 h-4 accent-teal-600 cursor-pointer"
                        checked={item.checked}
                        onChange={() => toggleCheck(item.id)}
                      />
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="relative w-16 h-16 rounded-lg overflow-hidden bg-gray-100 border border-gray-200 shrink-0">
                          <Image
                            src={item.image || "/placeholder.svg"}
                            alt={item.name}
                            fill
                            className="object-cover"
                          />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-gray-900 line-clamp-2 leading-snug mb-0.5">
                            {item.name}
                          </p>
                          {meta && (
                            <p className="text-xs text-gray-400 truncate">
                              {meta}
                            </p>
                          )}
                          {variantMeta && (
                            <p className="text-xs text-gray-400 truncate">
                              {variantMeta}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="text-center text-sm font-medium text-gray-700">
                        {formatMoney(item.price)}
                      </div>
                      <div className="flex justify-center">
                        {isUpdating ? (
                          <Loader2
                            size={16}
                            className="animate-spin text-teal-600"
                          />
                        ) : (
                          <QtyInput
                            value={item.quantity}
                            disabled={isUpdating}
                            onUpdate={(delta) =>
                              updateQuantity(
                                item.variantId,
                                item.quantity,
                                delta,
                              )
                            }
                          />
                        )}
                      </div>
                      <div className="text-right text-sm font-bold text-gray-900">
                        {formatMoney(item.price * item.quantity)}
                      </div>
                      <button
                        onClick={() => removeItem(item.id, item.variantId)}
                        className="flex items-center justify-center text-gray-300 hover:text-red-400 transition-colors"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>

                    <div className="flex md:hidden gap-3">
                      <input
                        type="checkbox"
                        className="w-4 h-4 accent-teal-600 cursor-pointer mt-0.5 shrink-0"
                        checked={item.checked}
                        onChange={() => toggleCheck(item.id)}
                      />
                      <div className="relative w-[68px] h-[68px] rounded-lg overflow-hidden bg-gray-100 border border-gray-200 shrink-0">
                        <Image
                          src={item.image || "/placeholder.svg"}
                          alt={item.name}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between gap-2 mb-0.5">
                          <p className="text-sm font-medium text-gray-900 line-clamp-2 flex-1">
                            {item.name}
                          </p>
                          <button
                            onClick={() => removeItem(item.id, item.variantId)}
                            className="text-gray-300 hover:text-red-400 shrink-0 mt-0.5"
                          >
                            {isUpdating ? (
                              <Loader2
                                size={14}
                                className="animate-spin text-teal-600"
                              />
                            ) : (
                              <X size={15} />
                            )}
                          </button>
                        </div>
                        {meta && (
                          <p className="text-xs text-gray-400 truncate">
                            {meta}
                          </p>
                        )}
                        {variantMeta && (
                          <p className="text-xs text-gray-400 mb-2 truncate">
                            {variantMeta}
                          </p>
                        )}
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-gray-700">
                            {formatMoney(item.price)}
                          </span>
                          <QtyInput
                            value={item.quantity}
                            disabled={isUpdating}
                            onUpdate={(delta) =>
                              updateQuantity(
                                item.variantId,
                                item.quantity,
                                delta,
                              )
                            }
                          />
                        </div>
                        <p className="text-right text-sm font-bold text-gray-900 mt-1">
                          {formatMoney(item.price * item.quantity)}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="px-5 py-3 border-t border-gray-100 flex items-center justify-between bg-gray-50">
              <Link
                href="/san-pham"
                className="text-sm text-teal-600 hover:text-teal-700 font-medium flex items-center gap-1.5 transition-colors"
              >
                <ShoppingBag size={14} /> Tiếp tục mua sắm
              </Link>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-5 bg-white border border-gray-200 rounded-xl px-5 py-4">
            <button
              onClick={() => setIsVoucherModalOpen(true)}
              className="flex items-center gap-2 text-sm text-gray-600 hover:text-teal-600 transition-colors border border-gray-200 rounded-lg px-3 py-2 hover:border-teal-400"
            >
              <Tag size={14} />
              {selectedVoucher ? (
                <span className="font-medium">
                  {selectedVoucher.code} ·{" "}
                  <span className="text-teal-600">
                    -{formatMoney(discountValue)}
                  </span>
                </span>
              ) : (
                "Mã giảm giá"
              )}
              <ChevronRight size={13} className="text-gray-400" />
            </button>

            <div className="flex-1" />

            <div className="flex items-center gap-6 text-sm text-gray-600">
              <span>
                Tạm tính ({totalCount} sp):{" "}
                <span className="font-medium text-gray-900">
                  {formatMoney(subTotal)}
                </span>
              </span>
              {discountValue > 0 && (
                <span className="text-gray-500">
                  Giảm:{" "}
                  <span className="font-medium text-gray-700">
                    -{formatMoney(discountValue)}
                  </span>
                </span>
              )}
              <span className="text-gray-700">
                Tổng:{" "}
                <span className="text-lg font-bold text-gray-900">
                  {formatMoney(finalTotal)}
                </span>
              </span>
            </div>

            {/* ĐÃ SỬA: Bọc Link kèm theo mã Voucher */}
            <Link
              href={checkoutUrl}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold text-white transition-colors ${totalCount > 0 ? "bg-teal-600 hover:bg-teal-700" : "bg-gray-300 pointer-events-none"}`}
            >
              Thanh toán <ArrowRight size={15} />
            </Link>
          </div>
        </div>
      </div>

      <div className="md:hidden fixed bottom-0 inset-x-0 bg-white border-t border-gray-200 z-30">
        <div className="flex items-center gap-3 px-4 py-3">
          <div className="flex-1">
            <p className="text-xs text-gray-400">Tổng thanh toán</p>
            <p className="text-base font-bold text-gray-900">
              {formatMoney(finalTotal)}
            </p>
          </div>
          {/* ĐÃ SỬA: Bọc Link kèm theo mã Voucher */}
          <Link
            href={checkoutUrl}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-colors ${totalCount > 0 ? "bg-teal-600 hover:bg-teal-700" : "bg-gray-300 pointer-events-none"}`}
          >
            Thanh toán ({totalCount}) <ArrowRight size={14} />
          </Link>
        </div>
      </div>

      {isVoucherModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setIsVoucherModalOpen(false)}
          />
          <div className="relative z-10 bg-white w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl shadow-xl flex flex-col max-h-[80vh] overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <span className="font-semibold text-gray-800">Mã giảm giá</span>
              <button
                onClick={() => setIsVoucherModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <div className="px-5 py-3 border-b border-gray-100">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={voucherInput}
                  onChange={(e) =>
                    setVoucherInput(e.target.value.toUpperCase())
                  }
                  onKeyDown={(e) => e.key === "Enter" && applyVoucherByCode()}
                  placeholder="Nhập mã voucher..."
                  className="flex-1 px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-teal-400 text-sm"
                />
                <button
                  onClick={applyVoucherByCode}
                  className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold rounded-lg transition-colors"
                >
                  Áp dụng
                </button>
              </div>
            </div>

            <div className="overflow-y-auto flex-1 p-4 space-y-2">
              {availableVouchers.map((voucher) => {
                const minOrderValue = toVoucherAmount(voucher.minOrderValue);
                const eligible = subTotal >= minOrderValue;
                const isSelected = selectedVoucher?.code === voucher.code;

                const actualValue = Number(
                  voucher.value || voucher.discountValue || 0,
                );

                const discountString =
                  voucher.discountType === "PERCENT"
                    ? `${actualValue}%`
                    : `-${formatMoney(actualValue)}`;

                return (
                  <button
                    key={voucher.code}
                    onClick={() => {
                      if (!eligible) {
                        toast.error(
                          `Đơn chưa đạt ${formatMoney(minOrderValue)}`,
                        );
                        return;
                      }
                      setSelectedVoucher(voucher);
                      setIsVoucherModalOpen(false);
                      toast.success("Áp dụng voucher thành công!");
                    }}
                    className={`w-full flex items-center gap-4 p-4 rounded-xl border text-left transition-all ${
                      isSelected
                        ? "border-teal-500 bg-teal-50 ring-1 ring-teal-400"
                        : eligible
                          ? "border-gray-200 hover:border-gray-300"
                          : "border-gray-200 opacity-50"
                    }`}
                  >
                    <div className="shrink-0 text-center min-w-[60px]">
                      <p className="text-base font-bold text-teal-600">
                        {discountString}
                      </p>
                      <p className="text-[10px] text-gray-400 font-mono mt-0.5">
                        {voucher.code}
                      </p>
                    </div>
                    <div className="w-px h-10 bg-gray-200 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800">
                        {voucher.discountType === "PERCENT"
                          ? `Giảm ${actualValue}%`
                          : `Giảm ${actualValue.toLocaleString("vi-VN")}đ`}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        Đơn tối thiểu {formatMoney(minOrderValue)}
                      </p>
                      {!eligible && (
                        <p className="text-xs text-red-400 mt-1">
                          Cần thêm{" "}
                          {formatMoney(Math.max(0, minOrderValue - subTotal))}
                        </p>
                      )}
                    </div>
                    {isSelected && (
                      <CheckCircle2
                        size={16}
                        className="text-teal-600 shrink-0"
                      />
                    )}
                  </button>
                );
              })}
              {availableVouchers.length === 0 && (
                <p className="text-center py-4 text-sm text-gray-400">
                  Không có mã giảm giá nào vào lúc này.
                </p>
              )}
            </div>

            {selectedVoucher && (
              <div className="px-5 py-3 border-t border-gray-100">
                <button
                  onClick={() => {
                    setSelectedVoucher(null);
                    setIsVoucherModalOpen(false);
                  }}
                  className="w-full text-sm text-gray-400 hover:text-red-500 py-1 transition-colors"
                >
                  Bỏ chọn voucher
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
