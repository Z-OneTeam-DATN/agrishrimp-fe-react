"use client";

import React, {
  useState,
  useEffect,
  useRef,
  useMemo,
  useCallback,
} from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import Link from "next/link";
import { toast } from "sonner";
import { cartService } from "@/app/services/cart.service";
import {
  voucherService,
  Voucher as VoucherApi,
} from "@/app/services/voucher.service";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useCartStore } from "@/stores/useCartStore";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useAuthStore } from "@/stores/useAuthStore";
import { resolveImageUrl } from "@/lib/resolveImageUrl";
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
import type { CartItem as CheckoutStoreCartItem } from "@/app/types/order.types";

interface CartItem {
  id: number;
  productId?: number;
  productSlug?: string;
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

const SAVED_VOUCHERS_KEY = "agrishrimp.savedVoucherCodes";

const formatMoney = (amount: number | string | undefined | null) => {
  if (amount === undefined || amount === null) return "0₫";
  return Number(amount).toLocaleString("vi-VN") + "₫";
};

const toVoucherAmount = (value: string | number | null | undefined) =>
  Number(value ?? 0);

const loadSavedVoucherCodes = () => {
  if (typeof window === "undefined") return [] as string[];

  try {
    const raw = window.localStorage.getItem(SAVED_VOUCHERS_KEY);
    if (!raw) return [];

    const parsed = JSON.parse(raw);
    return Array.isArray(parsed)
      ? parsed.map((code) => String(code).trim().toUpperCase()).filter(Boolean)
      : [];
  } catch {
    return [];
  }
};

const isVoucherActive = (voucher: Voucher) => {
  const now = Date.now();
  const startOk = !voucher.startDate || new Date(voucher.startDate).getTime() <= now;
  const endOk = !voucher.endDate || new Date(voucher.endDate).getTime() >= now;
  return voucher.status === "ACTIVE" && startOk && endOk;
};

const getVoucherDiscountForSubtotal = (voucher: Voucher, amount: number) => {
  const minOrderValue = toVoucherAmount(voucher.minOrderValue);
  if (amount < minOrderValue) {
    return 0;
  }

  const value = Number(voucher.value ?? voucher.discountValue ?? 0);
  if (voucher.discountType === "PERCENT") {
    const calculatedDiscount = (amount * value) / 100;
    return voucher.maxDiscount
      ? Math.min(calculatedDiscount, Number(voucher.maxDiscount))
      : calculatedDiscount;
  }

  return value;
};

const formatVoucherBenefit = (voucher: Voucher) => {
  const value = Number(voucher.value ?? voucher.discountValue ?? 0);

  if (voucher.discountType === "PERCENT") {
    const maxDiscount = voucher.maxDiscount
      ? `, tối đa ${formatMoney(voucher.maxDiscount)}`
      : "";
    return `Giảm ${value}%${maxDiscount}`;
  }

  return `Giảm ${formatMoney(value)}`;
};

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
  compact = false,
}: {
  value: number;
  onUpdate: (delta: number) => void;
  disabled: boolean;
  compact?: boolean;
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
      className={`inline-flex items-center overflow-hidden border border-slate-200 bg-white ${disabled ? "opacity-50" : ""}`}
    >
      <button
        onClick={() => !disabled && onUpdate(-1)}
        disabled={disabled || value <= 1}
        className={`flex items-center justify-center border-r border-slate-200 text-slate-500 transition-colors hover:bg-slate-100 disabled:opacity-40 ${
          compact ? "h-7 w-7" : "h-8 w-8"
        }`}
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
        className={`bg-white text-center font-semibold focus:outline-none ${
          compact ? "h-7 w-9 text-[12px]" : "h-8 w-11 text-[14px]"
        }`}
      />
      <button
        onClick={() => !disabled && onUpdate(1)}
        disabled={disabled}
        className={`flex items-center justify-center border-l border-slate-200 text-slate-500 transition-colors hover:bg-slate-100 disabled:opacity-40 ${
          compact ? "h-7 w-7" : "h-8 w-8"
        }`}
      >
        <Plus size={13} />
      </button>
    </div>
  );
}

export default function CartPage() {
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [breadcrumbHost, setBreadcrumbHost] = useState<HTMLElement | null>(null);
  const [updatingItems, setUpdatingItems] = useState<Record<number, boolean>>(
    {},
  );

  const [availableVouchers, setAvailableVouchers] = useState<Voucher[]>([]);
  const [selectedVoucher, setSelectedVoucher] = useState<Voucher | null>(null);
  const [voucherInput, setVoucherInput] = useState("");
  const [savedVoucherCodes, setSavedVoucherCodes] = useState<string[]>([]);
  const [isVoucherDialogOpen, setIsVoucherDialogOpen] = useState(false);
  const [pendingDeleteItem, setPendingDeleteItem] = useState<CartItem | null>(null);

  const { fetchCartCount, setItems: setCheckoutStoreItems } = useCartStore();
  const { isAuthenticated, data: user, isLoading: isLoadingAuth } = useCurrentUser();
  const accessToken = useAuthStore((state) => state.accessToken);
  const clearAuth = useAuthStore((state) => state.clearAuth);
  const isLoggedIn = isAuthenticated && !!user;

  const resolveProductHref = useCallback((item: CartItem) => {
    if (item.productSlug) {
      return `/san-pham/${item.productSlug}`;
    }

    if (item.productId) {
      return `/product/${item.productId}`;
    }

    return "/san-pham";
  }, []);

  const syncCheckoutStoreItems = useCallback(
    (nextItems: CartItem[]) => {
      const normalizedItems: CheckoutStoreCartItem[] = nextItems.map((item) => ({
        productVariantId: item.variantId,
        quantity: item.quantity,
        cartItemId: item.id,
        productId: item.productId,
        productSlug: item.productSlug,
        productName: item.name,
        variantName: item.variant,
        unitPrice: item.price,
        imageUrl: resolveImageUrl(item.image, "/placeholder.svg"),
      }));

      setCheckoutStoreItems(normalizedItems);
    },
    [setCheckoutStoreItems],
  );

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

      if (apiError.response?.status === 401 || apiError.response?.status === 403) {
        clearAuth();
        setItems([]);
        return;
      }
      toast.error("Không thể tải giỏ hàng!");
    } finally {
      setLoading(false);
    }
  }, [clearAuth]);

  const fetchPublicVouchers = useCallback(async () => {
    try {
      const res = await voucherService.getPublicVouchers();
      let arr = Array.isArray(res) ? res : [];
      arr = arr.filter((v: Voucher) => isVoucherActive(v));

      setAvailableVouchers(arr);
    } catch (error: unknown) {
      console.error("Lỗi tải voucher", error);
    }
  }, []);

  useEffect(() => {
    setSavedVoucherCodes(loadSavedVoucherCodes());

    const syncSavedCodes = () => {
      setSavedVoucherCodes(loadSavedVoucherCodes());
    };

    window.addEventListener("storage", syncSavedCodes);
    return () => window.removeEventListener("storage", syncSavedCodes);
  }, []);

  useEffect(() => {
    void fetchPublicVouchers();

    if (isLoadingAuth) {
      return;
    }

    if (!isLoggedIn || !accessToken) {
      setItems([]);
      setLoading(false);
      return;
    }

    void fetchCart();
  }, [accessToken, fetchCart, fetchPublicVouchers, isLoadingAuth, isLoggedIn]);

  useEffect(() => {
    syncCheckoutStoreItems(items);
  }, [items, syncCheckoutStoreItems]);

  useEffect(() => {
    if (typeof document === "undefined") {
      return;
    }

    setBreadcrumbHost(document.getElementById("site-breadcrumb-slot"));
  }, []);

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
    setUpdatingItems((p) => ({ ...p, [variantId]: true }));
    try {
      await cartService.removeItem(cartItemId);
      toast.success("Đã xóa khỏi giỏ hàng");
      setItems((prev) => prev.filter((item) => item.id !== cartItemId));
      fetchCartCount();
      setPendingDeleteItem(null);
    } catch {
      toast.error("Lỗi khi xóa sản phẩm");
    } finally {
      setUpdatingItems((p) => ({ ...p, [variantId]: false }));
    }
  };

  const confirmDeleteItem = () => {
    if (!pendingDeleteItem) return;
    void removeItem(pendingDeleteItem.id, pendingDeleteItem.variantId);
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
  const savedVoucherCodeSet = useMemo(
    () => new Set(savedVoucherCodes),
    [savedVoucherCodes],
  );

  const recommendedVouchers = useMemo(() => {
    return availableVouchers
      .map((voucher) => ({
        voucher,
        estimatedDiscount: getVoucherDiscountForSubtotal(voucher, subTotal),
      }))
      .filter(({ estimatedDiscount }) => estimatedDiscount > 0)
      .sort((left, right) => {
        if (right.estimatedDiscount !== left.estimatedDiscount) {
          return right.estimatedDiscount - left.estimatedDiscount;
        }

        const leftMin = toVoucherAmount(left.voucher.minOrderValue);
        const rightMin = toVoucherAmount(right.voucher.minOrderValue);
        if (leftMin !== rightMin) {
          return leftMin - rightMin;
        }

        return (right.voucher.id || 0) - (left.voucher.id || 0);
      })
      .slice(0, 3);
  }, [availableVouchers, subTotal]);

  const voucherDialogOptions = useMemo(() => {
    return availableVouchers
      .map((voucher) => ({
        voucher,
        estimatedDiscount: getVoucherDiscountForSubtotal(voucher, subTotal),
      }))
      .sort((left, right) => {
        const leftSelected = selectedVoucher?.code === left.voucher.code ? 1 : 0;
        const rightSelected = selectedVoucher?.code === right.voucher.code ? 1 : 0;

        const leftEligible = left.estimatedDiscount > 0 ? 1 : 0;
        const rightEligible = right.estimatedDiscount > 0 ? 1 : 0;
        if (rightEligible !== leftEligible) {
          return rightEligible - leftEligible;
        }

        if (right.estimatedDiscount !== left.estimatedDiscount) {
          return right.estimatedDiscount - left.estimatedDiscount;
        }

        if (rightSelected !== leftSelected) {
          return rightSelected - leftSelected;
        }

        return (right.voucher.id || 0) - (left.voucher.id || 0);
      });
  }, [availableVouchers, selectedVoucher?.code, subTotal]);

  useEffect(() => {
    if (
      selectedVoucher &&
      subTotal < toVoucherAmount(selectedVoucher.minOrderValue)
    ) {
      setSelectedVoucher(null);
    }
  }, [selectedVoucher, subTotal]);

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
  }

  const finalTotal = Math.max(0, subTotal - discountValue);

  const applyVoucherSelection = (voucher: Voucher) => {
    const minOrderValue = toVoucherAmount(voucher.minOrderValue);
    if (subTotal < minOrderValue) {
      toast.error(`Đơn chưa đạt ${formatMoney(minOrderValue)}`);
      return;
    }
    setSelectedVoucher(voucher);
    setVoucherInput(voucher.code);
    toast.success("Áp dụng voucher thành công!");
  };

  const applyVoucherByCode = () => {
    const found = availableVouchers.find(
      (v) => v.code === voucherInput.trim().toUpperCase(),
    );
    if (!found) {
      toast.error("Mã voucher không hợp lệ hoặc đã hết hạn");
      return;
    }
    applyVoucherSelection(found);
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
            className="inline-flex items-center gap-2 bg-blue-700 px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-800"
          >
            Mua sắm ngay <ArrowRight size={15} />
          </Link>
        </div>
      </div>
    );
  }

  const breadcrumbBar = (
    <div className="border-b border-gray-200 bg-white/95 shadow-sm backdrop-blur">
      <div className="container mx-auto max-w-[1320px] px-4">
        <nav className="flex items-center gap-1.5 py-3 text-[13px] text-gray-500">
          <Link href="/" className="hover:text-blue-600 transition-colors">
            Trang chủ
          </Link>
          <ChevronRight size={13} className="text-gray-300" />
          <span className="text-gray-800 font-medium">
            Giỏ hàng ({items.length})
          </span>
        </nav>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 pb-10">
      {breadcrumbHost
        ? createPortal(breadcrumbBar, breadcrumbHost)
        : (
          <div
            className="sticky z-[49]"
            style={{ top: "var(--site-header-height, 96px)" }}
          >
            {breadcrumbBar}
          </div>
        )}

      <div className="container mx-auto max-w-[1320px] px-4 py-5">
        <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_380px]">
          <section className="space-y-4">
            <div className="border border-slate-200 bg-white">
              <div className="flex items-center gap-3 border-b border-slate-200 px-4 py-3">
                <input
                  type="checkbox"
                  id="check-all"
                  className="h-4 w-4 cursor-pointer accent-blue-700"
                  checked={isAllChecked}
                  onChange={(e) => toggleCheckAll(e.target.checked)}
                />
                <label
                  htmlFor="check-all"
                  className="cursor-pointer select-none text-[12px] font-medium text-slate-700"
                >
                  Chọn tất cả
                </label>
                <span className="ml-auto text-[11px] text-slate-500">
                  {checkedItems.length}/{items.length} sản phẩm được chọn
                </span>
              </div>

              <div
                className="hidden border-b border-slate-200 px-4 py-4 lg:grid"
                style={{ gridTemplateColumns: "minmax(0,1fr) 140px 156px 160px" }}
              >
                <span className="text-[13px] font-semibold text-slate-950">Sản phẩm</span>
                <span className="text-center text-[13px] font-semibold text-slate-950">Giá</span>
                <span className="text-center text-[13px] font-semibold text-slate-950">Số lượng</span>
                <span className="text-right text-[13px] font-semibold text-slate-950">Tạm tính</span>
              </div>

              <div className="divide-y divide-slate-200">
                {items.map((item) => {
                  const isUpdating = updatingItems[item.variantId];
                  const imageSrc = resolveImageUrl(item.image, "/placeholder.svg");
                  const meta = [item.categoryName, item.brandName, item.productForm]
                    .filter(Boolean)
                    .join(" · ");

                  return (
                  <div
                    key={item.id}
                    className={`px-4 py-4 transition-colors ${isUpdating ? "pointer-events-none opacity-50" : ""}`}
                  >
                      <div
                        className="hidden items-center gap-4 lg:grid"
                        style={{ gridTemplateColumns: "minmax(0,1fr) 140px 156px 160px" }}
                      >
                        <div className="flex min-w-0 items-center gap-4">
                          <input
                            type="checkbox"
                            checked={item.checked}
                            onChange={() => toggleCheck(item.id)}
                            className="h-4 w-4 shrink-0 cursor-pointer accent-blue-700"
                          />
                          <Link href={resolveProductHref(item)} className="flex min-w-0 items-center gap-4 group">
                            <div className="relative h-20 w-20 shrink-0 overflow-hidden border border-slate-200 bg-slate-50">
                              <Image
                                src={imageSrc}
                                alt={item.name}
                                fill
                                className="object-cover"
                                onError={(event) => {
                                  (event.target as HTMLImageElement).src = "/placeholder.svg";
                                }}
                              />
                            </div>
                            <div className="min-w-0">
                              <p className="line-clamp-2 text-[14px] font-medium leading-snug text-blue-800 transition-colors group-hover:text-blue-900">
                                {item.name}
                              </p>
                              {meta && <p className="mt-1 truncate text-[11px] text-slate-500">{meta}</p>}
                            </div>
                          </Link>
                        </div>

                        <div className="text-center text-[14px] font-semibold text-blue-800">
                          {formatMoney(item.price)}
                        </div>

                        <div className="flex justify-center">
                          {isUpdating ? (
                            <Loader2 size={18} className="animate-spin text-blue-700" />
                          ) : (
                            <QtyInput
                              value={item.quantity}
                              disabled={isUpdating}
                              onUpdate={(delta) => updateQuantity(item.variantId, item.quantity, delta)}
                            />
                          )}
                        </div>

                        <div className="flex items-center justify-end gap-3">
                          <span className="text-right text-[14px] font-semibold text-blue-800">
                            {formatMoney(item.price * item.quantity)}
                          </span>
                          <button
                            onClick={() => setPendingDeleteItem(item)}
                            className="flex h-8 w-8 shrink-0 items-center justify-center text-slate-400 transition-colors hover:text-red-500"
                            aria-label={`Xóa ${item.name} khỏi giỏ hàng`}
                          >
                            {isUpdating ? (
                              <Loader2 size={14} className="animate-spin text-blue-700" />
                            ) : (
                              <Trash2 size={15} />
                            )}
                          </button>
                        </div>
                      </div>

                      <div className="lg:hidden">
                        <div className="flex items-start gap-3">
                          <input
                            type="checkbox"
                            checked={item.checked}
                            onChange={() => toggleCheck(item.id)}
                            className="mt-7 h-4 w-4 shrink-0 cursor-pointer accent-blue-700"
                          />

                          <Link href={resolveProductHref(item)} className="group relative h-[84px] w-[84px] shrink-0 overflow-hidden border border-slate-200 bg-slate-50">
                            <Image
                              src={imageSrc}
                              alt={item.name}
                              fill
                              className="object-cover"
                              onError={(event) => {
                                (event.target as HTMLImageElement).src = "/placeholder.svg";
                              }}
                            />
                          </Link>

                          <div className="min-w-0 flex-1">
                            <div className="flex items-start gap-2">
                              <Link href={resolveProductHref(item)} className="min-w-0 flex-1">
                                <p className="truncate text-[13px] font-medium leading-snug text-blue-800 transition-colors hover:text-blue-900">
                                  {item.name}
                                </p>
                              </Link>
                            </div>

                            {meta && <p className="mt-1 truncate text-[10px] text-slate-500">{meta}</p>}

                            <div className="mt-3 flex items-end justify-between gap-3">
                              <div className="min-w-0">
                                <p className="whitespace-nowrap text-[16px] font-semibold text-blue-800">
                                  {formatMoney(item.price * item.quantity)}
                                </p>
                                {item.quantity > 1 && (
                                  <p className="mt-0.5 text-[10px] text-slate-400">
                                    {formatMoney(item.price)} x {item.quantity}
                                  </p>
                                )}
                              </div>

                              <div className="flex shrink-0 items-center gap-2">
                                {isUpdating ? (
                                  <Loader2 size={18} className="animate-spin text-blue-700" />
                                ) : (
                                  <QtyInput
                                    value={item.quantity}
                                    disabled={isUpdating}
                                    compact
                                    onUpdate={(delta) => updateQuantity(item.variantId, item.quantity, delta)}
                                  />
                                )}
                                <button
                                  onClick={() => setPendingDeleteItem(item)}
                                  className="flex h-8 w-8 shrink-0 items-center justify-center text-slate-400 transition-colors hover:text-red-500"
                                  aria-label={`Xóa ${item.name} khỏi giỏ hàng`}
                                >
                                  {isUpdating ? (
                                    <Loader2 size={13} className="animate-spin text-blue-700" />
                                  ) : (
                                    <Trash2 size={15} />
                                  )}
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex">
              <Link
                href="/san-pham"
                className="inline-flex h-10 items-center gap-2 border-2 border-blue-700 px-4 text-[12px] font-semibold text-blue-800 transition-colors hover:bg-blue-50"
              >
                <ArrowRight size={14} className="rotate-180" />
                Tiếp tục xem sản phẩm
              </Link>
            </div>
          </section>

          <aside className="h-fit border border-slate-200 bg-white xl:sticky xl:top-28">
            <div className="border-b border-slate-200 px-5 py-4">
              <h2 className="text-[18px] font-semibold text-slate-950">Tổng cộng giỏ hàng</h2>
            </div>

            <div className="px-5 py-4">
              <div className="border-b border-slate-200 pb-3">
                <div className="flex items-center justify-between py-2 text-[14px] text-slate-700">
                  <span>Tạm tính</span>
                  <span className="font-semibold text-blue-800">{formatMoney(subTotal)}</span>
                </div>
                {discountValue > 0 && (
                  <div className="flex items-center justify-between py-2 text-[14px] text-slate-700">
                    <span>Giảm giá</span>
                    <span className="font-semibold text-emerald-700">-{formatMoney(discountValue)}</span>
                  </div>
                )}
                <div className="flex items-center justify-between py-2 text-[14px] text-slate-900">
                  <span className="font-semibold">Tổng</span>
                  <span className="text-[16px] font-semibold text-blue-800">{formatMoney(finalTotal)}</span>
                </div>
              </div>

              <Link
                href={checkoutUrl}
                className={`mt-5 flex h-14 w-full items-center justify-center bg-[rgb(25,101,162)] px-4 text-center text-[14px] font-semibold uppercase tracking-wide text-white shadow-[0_8px_20px_rgba(25,101,162,0.18)] transition-colors ${
                  totalCount > 0
                    ? "hover:bg-[rgb(21,88,141)]"
                    : "pointer-events-none bg-slate-300 shadow-none"
                }`}
              >
                Tiến hành thanh toán
              </Link>

              <div className="mt-8">
                <div className="flex items-center justify-between gap-3 border-b border-slate-200 pb-3">
                  <div className="flex items-center gap-2">
                    <Tag size={16} className="text-slate-500" />
                    <h3 className="text-[15px] font-semibold text-slate-950">Mã ưu đãi</h3>
                  </div>

                  {selectedVoucher && (
                    <button
                      type="button"
                      onClick={() => setIsVoucherDialogOpen(true)}
                      className="shrink-0 text-[11px] font-medium text-blue-800 transition-colors hover:text-blue-900"
                    >
                      Đổi voucher
                    </button>
                  )}
                </div>

                {selectedVoucher && (
                  <div className="mt-4 border border-emerald-200 bg-emerald-50 px-4 py-3 text-emerald-900">
                    <div className="flex items-start gap-3">
                      <CheckCircle2 size={16} className="mt-0.5 shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="text-[10px] font-medium uppercase tracking-wide text-emerald-700">
                          Đã áp dụng voucher
                        </p>
                        <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1">
                          <span className="text-[13px] font-semibold">
                            {selectedVoucher.code}
                          </span>
                          <span className="text-[11px] text-emerald-800">
                            {formatVoucherBenefit(selectedVoucher)}
                          </span>
                        </div>
                        <p className="mt-1 text-[11px] text-emerald-800">
                          Tiết kiệm {formatMoney(discountValue)}
                        </p>
                      </div>

                      <div className="flex items-center gap-3 pl-2">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedVoucher(null);
                            setVoucherInput("");
                          }}
                          className="text-slate-400 transition-colors hover:text-red-500"
                        >
                          <X size={15} />
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {!selectedVoucher && (
                  <>
                    <div className="mt-4 space-y-3">
                      <input
                        type="text"
                        value={voucherInput}
                        onChange={(e) => setVoucherInput(e.target.value.toUpperCase())}
                        onKeyDown={(e) => e.key === "Enter" && applyVoucherByCode()}
                        placeholder="Nhập mã giảm giá"
                        className="h-11 w-full border border-slate-200 bg-white px-4 text-[13px] text-slate-900 outline-none transition-colors placeholder:text-slate-400 focus:border-blue-700"
                      />
                      <button
                        type="button"
                        onClick={applyVoucherByCode}
                        className="flex h-11 w-full items-center justify-center border border-slate-200 bg-white text-[14px] font-medium text-slate-700 transition-colors hover:border-blue-700 hover:text-blue-800"
                      >
                        Áp dụng
                      </button>
                    </div>

                    {availableVouchers.length > 0 && (
                      <div className="mt-4 space-y-2">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
                              Mã ưu đãi phù hợp nhất
                            </p>
                          </div>

                          <button
                            type="button"
                            onClick={() => setIsVoucherDialogOpen(true)}
                            className="shrink-0 text-[11px] font-medium text-blue-800 transition-colors hover:text-blue-900"
                          >
                            Chọn voucher khác
                          </button>
                        </div>

                        <div className="space-y-2">
                          {recommendedVouchers.length > 0 ? (
                            recommendedVouchers.map(({ voucher, estimatedDiscount }) => (
                              <button
                                key={voucher.code}
                                type="button"
                                onClick={() => applyVoucherSelection(voucher)}
                                className="flex w-full items-center justify-between gap-3 border border-slate-200 bg-white px-3 py-3 text-left text-slate-700 transition-colors hover:border-blue-300 hover:text-blue-800"
                              >
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center gap-2">
                                    <p className="truncate text-[12px] font-semibold">{voucher.code}</p>
                                    <span className="shrink-0 text-[10px] text-emerald-700">
                                      Dùng được ngay
                                    </span>
                                  </div>
                                  <p className="mt-1 text-[11px] leading-snug text-slate-600">
                                    {formatVoucherBenefit(voucher)}
                                  </p>
                                  <p className="mt-1 text-[10px] text-slate-500">
                                    Đơn từ {formatMoney(voucher.minOrderValue)}
                                  </p>
                                </div>

                                <div className="shrink-0 text-right">
                                  <p className="text-[10px] uppercase tracking-wide text-slate-400">
                                    Tiết kiệm
                                  </p>
                                  <p className="mt-1 whitespace-nowrap text-[12px] font-semibold text-blue-800">
                                    {formatMoney(estimatedDiscount)}
                                  </p>
                                </div>
                              </button>
                            ))
                          ) : (
                            <div className="border border-dashed border-slate-200 px-3 py-3 text-[11px] text-slate-500">
                              Chưa có voucher nào đáp ứng điều kiện của đơn hàng hiện tại.
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </aside>
        </div>
      </div>

      <Dialog
        open={!!pendingDeleteItem}
        onOpenChange={(open) => {
          if (!open) setPendingDeleteItem(null);
        }}
      >
        <DialogContent className="max-w-[420px] rounded-none border border-slate-200 bg-white p-0">
          <DialogHeader className="border-b border-slate-200 px-5 py-4">
            <DialogTitle className="text-[16px] font-semibold text-slate-950">
              Xóa sản phẩm khỏi giỏ hàng
            </DialogTitle>
            <DialogDescription className="text-[13px] text-slate-500">
              Bạn có chắc chắn muốn xóa sản phẩm này khỏi giỏ hàng?
            </DialogDescription>
          </DialogHeader>

          <div className="px-5 py-4">
            {pendingDeleteItem && (
              <div className="border border-slate-200 bg-slate-50 px-4 py-3">
                <p className="line-clamp-2 text-[14px] font-semibold text-slate-900">
                  {pendingDeleteItem.name}
                </p>
                {pendingDeleteItem.variant && (
                  <p className="mt-1 text-[12px] text-slate-500">
                    {pendingDeleteItem.variant}
                  </p>
                )}
              </div>
            )}

            <div className="mt-5 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setPendingDeleteItem(null)}
                disabled={pendingDeleteItem ? updatingItems[pendingDeleteItem.variantId] : false}
                className="h-10 border border-slate-200 bg-white px-5 text-[13px] font-semibold text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={confirmDeleteItem}
                disabled={pendingDeleteItem ? updatingItems[pendingDeleteItem.variantId] : false}
                className="inline-flex h-10 items-center justify-center gap-2 bg-red-600 px-5 text-[13px] font-semibold text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {pendingDeleteItem && updatingItems[pendingDeleteItem.variantId] ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    Đang xóa...
                  </>
                ) : (
                  "Xóa khỏi giỏ hàng"
                )}
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isVoucherDialogOpen} onOpenChange={setIsVoucherDialogOpen}>
        <DialogContent className="max-w-[680px] rounded-none border border-slate-200 bg-white p-0">
          <DialogHeader className="border-b border-slate-200 px-5 py-4">
            <DialogTitle className="text-[16px] font-semibold text-slate-950">
              Đổi voucher
            </DialogTitle>
            <DialogDescription className="text-[12px] text-slate-500">
              Tất cả voucher khả dụng được sắp theo mức tiết kiệm giảm dần cho đơn hàng hiện tại.
            </DialogDescription>
          </DialogHeader>

          <div className="max-h-[70vh] overflow-y-auto px-5 py-4">
            {voucherDialogOptions.length > 0 ? (
              <div className="space-y-2">
                {voucherDialogOptions.map(({ voucher, estimatedDiscount }) => {
                  const eligible = estimatedDiscount > 0;
                  const isSelected = selectedVoucher?.code === voucher.code;
                  const isSaved = savedVoucherCodeSet.has(
                    voucher.code.toUpperCase(),
                  );

                  return (
                    <button
                      key={voucher.code}
                      type="button"
                      onClick={() => {
                        if (!eligible) {
                          toast.error(
                            `Đơn chưa đạt ${formatMoney(voucher.minOrderValue)}`,
                          );
                          return;
                        }

                        applyVoucherSelection(voucher);
                        setIsVoucherDialogOpen(false);
                      }}
                      className={`flex w-full items-center justify-between gap-3 border px-3 py-3 text-left transition-colors ${
                        isSelected
                          ? "border-blue-700 bg-blue-50 text-blue-800"
                          : eligible
                            ? "border-slate-200 bg-white text-slate-700 hover:border-blue-300 hover:text-blue-800"
                            : "border-slate-200 bg-slate-50 text-slate-500"
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="truncate text-[12px] font-semibold">{voucher.code}</p>
                          {isSelected && (
                            <span className="shrink-0 text-[10px] text-blue-800">
                              Đang chọn
                            </span>
                          )}
                          {isSaved && (
                            <span className="shrink-0 text-[10px] text-slate-500">
                              Đã lưu
                            </span>
                          )}
                          {!isSelected && (
                            <span
                              className={`shrink-0 text-[10px] ${
                                eligible ? "text-emerald-700" : "text-amber-600"
                              }`}
                            >
                              {eligible ? "Dùng được" : "Chưa đủ điều kiện"}
                            </span>
                          )}
                        </div>
                        <p className="mt-1 text-[11px] leading-snug text-slate-600">
                          {formatVoucherBenefit(voucher)}
                        </p>
                        <p className="mt-1 text-[10px] text-slate-500">
                          Đơn từ {formatMoney(voucher.minOrderValue)}
                        </p>
                      </div>

                      <div className="shrink-0 text-right">
                        <p className="text-[10px] uppercase tracking-wide text-slate-400">
                          {eligible ? "Tiết kiệm" : "Cần thêm"}
                        </p>
                        <p className="mt-1 whitespace-nowrap text-[12px] font-semibold text-blue-800">
                          {eligible
                            ? formatMoney(estimatedDiscount)
                            : formatMoney(
                                Math.max(
                                  0,
                                  toVoucherAmount(voucher.minOrderValue) - subTotal,
                                ),
                              )}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="space-y-3 py-6 text-center">
                <p className="text-[13px] font-medium text-slate-700">
                  Hiện chưa có voucher khả dụng
                </p>
                <p className="text-[12px] text-slate-500">
                  Hãy quay lại sau hoặc kiểm tra thêm ở ví voucher.
                </p>
                <div className="flex justify-center">
                  <Link
                    href="/voucher"
                    onClick={() => setIsVoucherDialogOpen(false)}
                    className="inline-flex h-10 items-center border border-blue-700 px-4 text-[12px] font-medium text-blue-800 transition-colors hover:bg-blue-50"
                  >
                    Mở ví voucher
                  </Link>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

