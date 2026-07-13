"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Eye,
  FileDown,
  Loader2,
  Package2,
  Plus,
  Search,
  ShoppingBag,
  ShoppingCart,
  Truck,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { orderService } from "@/app/services/order.service";
import type { MyOrder, MyOrderItem } from "@/app/types/order.types";
import { SharedDatePicker } from "@/components/admin/shared/BirthDatePicker";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

type TabId =
  | "all"
  | "pending"
  | "pickup"
  | "shipping"
  | "delivered"
  | "cancelled"
  | "returned";

type ManagedOrderItem = {
  id: string;
  imageUrl: string;
  name: string;
  quantity: number;
  sku: string;
  unitPrice: number;
  variant: string;
};

type ManagedOrder = {
  assignedStaff: string;
  branchName: string;
  carrier: string;
  code: string;
  createdAt: string;
  createdBy: string;
  customerName: string;
  customerPhone: string;
  discount: number;
  expectedDeliveryDate: string;
  id: string;
  internalNote: string;
  items: ManagedOrderItem[];
  note: string;
  paymentMethod: string;
  paymentStatus: "PAID" | "UNPAID";
  receiverName: string;
  receiverPhone: string;
  shippingAddress: string;
  shippingFee: number;
  source: "backend" | "local" | "override";
  sourceChannel: string;
  status: string;
  subtotal: number;
  total: number;
  updatedAt: string;
  updatedBy: string;
};

type OrderFormState = {
  assignedStaff: string;
  branchName: string;
  carrier: string;
  code: string;
  customerName: string;
  customerPhone: string;
  discount: number;
  expectedDeliveryDate: string;
  id?: string;
  internalNote: string;
  items: ManagedOrderItem[];
  note: string;
  paymentMethod: string;
  paymentStatus: "PAID" | "UNPAID";
  receiverName: string;
  receiverPhone: string;
  shippingAddress: string;
  shippingFee: number;
  sourceChannel: string;
  status: string;
};

const STORAGE_KEY = "agrishrimp-admin-orders-local-v2";
const PAGE_SIZE = 8;

const ORDER_TABS: Array<{ id: TabId; label: string; priority?: boolean }> = [
  { id: "all", label: "Tất cả đơn" },
  { id: "pending", label: "Chờ xác nhận", priority: true },
  { id: "pickup", label: "Chờ lấy hàng" },
  { id: "shipping", label: "Đang giao" },
  { id: "delivered", label: "Đã giao" },
  { id: "cancelled", label: "Đã hủy" },
  { id: "returned", label: "Trả hàng/Hoàn tiền" },
];

const STATUS_META: Record<
  string,
  { dot: string; label: string; tone: string }
> = {
  AWAITING_PAYMENT: {
    dot: "bg-amber-500",
    label: "Chờ thanh toán",
    tone: "text-amber-700",
  },
  PENDING: {
    dot: "bg-amber-500",
    label: "Chờ xác nhận",
    tone: "text-amber-700",
  },
  CONFIRMED: {
    dot: "bg-sky-500",
    label: "Đã xác nhận",
    tone: "text-sky-700",
  },
  PROCESSING: {
    dot: "bg-blue-500",
    label: "Chuẩn bị hàng",
    tone: "text-blue-700",
  },
  READY_FOR_PICKUP: {
    dot: "bg-cyan-500",
    label: "Chờ lấy hàng",
    tone: "text-cyan-700",
  },
  SHIPPING: {
    dot: "bg-indigo-500",
    label: "Đang giao",
    tone: "text-indigo-700",
  },
  RECEIVED: {
    dot: "bg-blue-500",
    label: "Đã giao",
    tone: "text-blue-700",
  },
  COMPLETED: {
    dot: "bg-blue-500",
    label: "Đã giao",
    tone: "text-blue-700",
  },
  CANCELLED: {
    dot: "bg-red-500",
    label: "Đã hủy",
    tone: "text-red-700",
  },
  RETURNED: {
    dot: "bg-rose-500",
    label: "Trả hàng/Hoàn tiền",
    tone: "text-rose-700",
  },
  AWAITING_REPLENISHMENT: {
    dot: "bg-orange-500",
    label: "Chờ điều chuyển",
    tone: "text-orange-700",
  },
};

const PAYMENT_OPTIONS = [
  { value: "all", label: "Mọi hình thức" },
  { value: "COD", label: "COD" },
  { value: "CASH", label: "Tiền mặt" },
  { value: "TRANSFER", label: "Chuyển khoản" },
  { value: "PAYOS", label: "Online" },
];

const DATE_FILTERS = [
  { value: "all", label: "Toàn thời gian" },
  { value: "today", label: "Hôm nay" },
  { value: "last7", label: "7 ngày qua" },
];

const CARRIER_OPTIONS = [
  "Giao nhanh nội bộ",
  "GHTK",
  "GHN",
  "SPX Express",
  "Viettel Post",
  "VNPost",
];

const SOURCE_CHANNEL_OPTIONS = [
  "Admin",
  "Website",
  "TikTok Shop",
  "Shopee",
  "Walk-in",
];

const STAFF_OPTIONS = [
  "Admin Z-OneTeam",
  "Nguyễn Hải Nam",
  "Phạm Minh Anh",
  "Trần Bảo Vy",
];

const PRODUCT_CATALOG: ManagedOrderItem[] = [
  {
    id: "catalog-1",
    imageUrl: "https://res.cloudinary.com/demo/image/upload/sample.jpg",
    name: "Cám TOMBOY 0 Dạng Chìm",
    quantity: 1,
    sku: "TOM-0-CHIM",
    unitPrice: 280000,
    variant: "Bao 20kg",
  },
  {
    id: "catalog-2",
    imageUrl: "https://res.cloudinary.com/demo/image/upload/samples/food/pot-mussels.jpg",
    name: "SUPER SHRIMP",
    quantity: 1,
    sku: "SUP-SHRIMP",
    unitPrice: 210000,
    variant: "Gói 10kg",
  },
  {
    id: "catalog-3",
    imageUrl: "https://res.cloudinary.com/demo/image/upload/samples/animals/reindeer.jpg",
    name: "SEA HORSE",
    quantity: 1,
    sku: "SEA-HORSE",
    unitPrice: 360000,
    variant: "Thùng 24 chai",
  },
  {
    id: "catalog-4",
    imageUrl: "https://res.cloudinary.com/demo/image/upload/samples/ecommerce/analog-classic.jpg",
    name: "Florfenicol 10% bột trộn thức ăn",
    quantity: 1,
    sku: "FLOR-10",
    unitPrice: 420000,
    variant: "Hũ 1kg",
  },
];

function createEmptyOrderForm(): OrderFormState {
  const now = new Date();

  return {
    assignedStaff: "Admin Z-OneTeam",
    branchName: "Cửa hàng chính",
    carrier: "Giao nhanh nội bộ",
    code: generateOrderCode(),
    customerName: "",
    customerPhone: "",
    discount: 0,
    expectedDeliveryDate: now.toISOString().slice(0, 10),
    internalNote: "",
    items: [],
    note: "",
    paymentMethod: "COD",
    paymentStatus: "UNPAID",
    receiverName: "",
    receiverPhone: "",
    shippingAddress: "",
    shippingFee: 0,
    sourceChannel: "Admin",
    status: "PENDING",
  };
}

function generateOrderCode() {
  const stamp = Date.now().toString().slice(-6);
  return `DH${stamp}`;
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("vi-VN", {
    currency: "VND",
    style: "currency",
    maximumFractionDigits: 0,
  }).format(value || 0);
}

function formatCompactDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function normalizeStatus(status: string) {
  if (!status) return "PENDING";
  return status.toUpperCase();
}

function getStatusMeta(status: string) {
  return (
    STATUS_META[normalizeStatus(status)] ?? {
      dot: "bg-slate-400",
      label: status,
      tone: "text-slate-700",
    }
  );
}

function matchesTab(status: string, tabId: TabId) {
  const normalized = normalizeStatus(status);

  switch (tabId) {
    case "all":
      return true;
    case "pending":
      return ["PENDING", "AWAITING_PAYMENT"].includes(normalized);
    case "pickup":
      return ["CONFIRMED", "PROCESSING", "READY_FOR_PICKUP"].includes(
        normalized,
      );
    case "shipping":
      return ["SHIPPING"].includes(normalized);
    case "delivered":
      return ["RECEIVED", "COMPLETED"].includes(normalized);
    case "cancelled":
      return ["CANCELLED"].includes(normalized);
    case "returned":
      return ["RETURNED"].includes(normalized);
    default:
      return true;
  }
}

function readLocalManagedOrders(): ManagedOrder[] {
  if (typeof window === "undefined") return [];

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeLocalManagedOrders(orders: ManagedOrder[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(orders));
}

function upsertLocalManagedOrder(order: ManagedOrder) {
  const current = readLocalManagedOrders();
  const index = current.findIndex((item) => item.id === order.id);
  const next = [...current];

  if (index >= 0) {
    next[index] = order;
  } else {
    next.unshift(order);
  }

  writeLocalManagedOrders(next);
}

function transformMyOrderToManagedOrder(order: MyOrder): ManagedOrder {
  const subtotal =
    order.items?.reduce((sum, item) => sum + Number(item.totalPrice || 0), 0) ??
    Number(order.totalAmount || 0);
  const shippingFee = Number(
    order.totalShippingFee ?? order.shippingFee ?? 0,
  );
  const total = Number(order.finalAmount || order.totalAmount || subtotal);
  const branchName =
    order.branchName ||
    order.subOrders?.find((subOrder) => subOrder.branchName)?.branchName ||
    "Cửa hàng chính";
  const carrier =
    order.subOrders?.find((subOrder) => subOrder.carrier)?.carrier ||
    "Giao nhanh nội bộ";

  return {
    assignedStaff: "Admin Z-OneTeam",
    branchName,
    carrier,
    code: order.orderCode || order.code || `#${order.id}`,
    createdAt: order.createdAt || new Date().toISOString(),
    createdBy: "Hệ thống",
    customerName: order.customerName || order.receiverName || "Khách lẻ",
    customerPhone: order.customerPhone || order.receiverPhone || "",
    discount: Math.max(
      0,
      Number(order.totalAmount || subtotal) + shippingFee - total,
    ),
    expectedDeliveryDate: "",
    id: String(order.id),
    internalNote: "",
    items: (order.items || []).map((item: MyOrderItem) => ({
      id: String(item.id),
      imageUrl: item.image || "",
      name: item.productName,
      quantity: Number(item.quantity || 0),
      sku: item.sku || "",
      unitPrice: Number(item.price || 0),
      variant: item.sku || "Mặc định",
    })),
    note: order.note || "",
    paymentMethod: order.paymentMethod || "COD",
    paymentStatus: order.paymentStatus || "UNPAID",
    receiverName: order.receiverName || order.customerName || "",
    receiverPhone: order.receiverPhone || order.customerPhone || "",
    shippingAddress: order.shippingAddress || "",
    shippingFee,
    source: "backend",
    sourceChannel: "Website",
    status: order.status || "PENDING",
    subtotal,
    total,
    updatedAt: order.createdAt || new Date().toISOString(),
    updatedBy: "Hệ thống",
  };
}

function mergeManagedOrders(
  backendOrders: ManagedOrder[],
  localOrders: ManagedOrder[],
) {
  const localById = new Map(localOrders.map((order) => [order.id, order]));
  const merged = backendOrders.map((order) => localById.get(order.id) || order);
  const localOnly = localOrders.filter(
    (order) => !backendOrders.some((backendOrder) => backendOrder.id === order.id),
  );

  return [...localOnly, ...merged].sort(
    (left, right) =>
      new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime(),
  );
}

function buildOrderFormState(order: ManagedOrder): OrderFormState {
  return {
    assignedStaff: order.assignedStaff,
    branchName: order.branchName,
    carrier: order.carrier,
    code: order.code,
    customerName: order.customerName,
    customerPhone: order.customerPhone,
    discount: order.discount,
    expectedDeliveryDate: order.expectedDeliveryDate,
    id: order.id,
    internalNote: order.internalNote,
    items: order.items,
    note: order.note,
    paymentMethod: order.paymentMethod,
    paymentStatus: order.paymentStatus,
    receiverName: order.receiverName,
    receiverPhone: order.receiverPhone,
    shippingAddress: order.shippingAddress,
    shippingFee: order.shippingFee,
    sourceChannel: order.sourceChannel,
    status: order.status,
  };
}

function buildManagedOrderFromForm(
  form: OrderFormState,
  mode: "create" | "edit",
  previous?: ManagedOrder,
): ManagedOrder {
  const subtotal = form.items.reduce(
    (sum, item) => sum + item.unitPrice * item.quantity,
    0,
  );
  const total = Math.max(0, subtotal + form.shippingFee - form.discount);
  const timestamp = new Date().toISOString();
  const baseId = previous?.id || form.id || `local-${Date.now()}`;

  return {
    assignedStaff: form.assignedStaff,
    branchName: form.branchName,
    carrier: form.carrier,
    code: form.code,
    createdAt: previous?.createdAt || timestamp,
    createdBy: previous?.createdBy || "Admin Z-OneTeam",
    customerName: form.customerName,
    customerPhone: form.customerPhone,
    discount: Number(form.discount || 0),
    expectedDeliveryDate: form.expectedDeliveryDate,
    id: baseId,
    internalNote: form.internalNote,
    items: form.items,
    note: form.note,
    paymentMethod: form.paymentMethod,
    paymentStatus: form.paymentStatus,
    receiverName: form.receiverName,
    receiverPhone: form.receiverPhone,
    shippingAddress: form.shippingAddress,
    shippingFee: Number(form.shippingFee || 0),
    source: mode === "create" ? "local" : previous?.source === "local" ? "local" : "override",
    sourceChannel: form.sourceChannel,
    status: form.status,
    subtotal,
    total,
    updatedAt: timestamp,
    updatedBy: "Admin Z-OneTeam",
  };
}

function getRowAction(order: ManagedOrder) {
  const normalized = normalizeStatus(order.status);

  if (normalized === "PENDING" || normalized === "AWAITING_PAYMENT") {
    return { label: "Duyệt đơn", nextStatus: "CONFIRMED" };
  }
  if (normalized === "CONFIRMED" || normalized === "PROCESSING") {
    return { label: "Chuẩn bị hàng", nextStatus: "READY_FOR_PICKUP" };
  }
  if (normalized === "READY_FOR_PICKUP") {
    return { label: "Bàn giao", nextStatus: "SHIPPING" };
  }
  if (normalized === "SHIPPING") {
    return { label: "Hoàn tất", nextStatus: "COMPLETED" };
  }

  return null;
}

async function persistStatusUpdate(order: ManagedOrder, nextStatus: string) {
  if (!order.id.startsWith("local-")) {
    await orderService.updateOrderStatus(order.id, nextStatus);
  }

  upsertLocalManagedOrder({
    ...order,
    source: order.source === "local" ? "local" : "override",
    status: nextStatus,
    updatedAt: new Date().toISOString(),
    updatedBy: "Admin Z-OneTeam",
  });
}

export function AdminOrdersListModule() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabId>("pending");
  const [carrierFilter, setCarrierFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [orders, setOrders] = useState<ManagedOrder[]>([]);
  const [page, setPage] = useState(1);
  const [paymentFilter, setPaymentFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const loadOrders = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const [apiOrders, localOrders] = await Promise.all([
        orderService.getAdminOrders(),
        Promise.resolve(readLocalManagedOrders()),
      ]);

      const transformed = apiOrders.map(transformMyOrderToManagedOrder);
      setOrders(mergeManagedOrders(transformed, localOrders));
    } catch {
      setError("Không thể tải danh sách đơn hàng.");
      setOrders(readLocalManagedOrders());
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadOrders();
  }, [loadOrders]);

  const tabCounts = useMemo(() => {
    return ORDER_TABS.reduce(
      (counts, tab) => ({
        ...counts,
        [tab.id]: orders.filter((order) => matchesTab(order.status, tab.id)).length,
      }),
      {} as Record<TabId, number>,
    );
  }, [orders]);

  const carriers = useMemo(() => {
    const unique = new Set(CARRIER_OPTIONS);
    orders.forEach((order) => {
      if (order.carrier) unique.add(order.carrier);
    });
    return Array.from(unique);
  }, [orders]);

  const filteredOrders = useMemo(() => {
    const now = new Date();
    const lowerSearch = searchTerm.trim().toLowerCase();

    return orders.filter((order) => {
      const matchesSearch =
        !lowerSearch ||
        order.code.toLowerCase().includes(lowerSearch) ||
        order.customerName.toLowerCase().includes(lowerSearch) ||
        order.customerPhone.toLowerCase().includes(lowerSearch);

      const matchesCarrier =
        carrierFilter === "all" || order.carrier === carrierFilter;
      const matchesPayment =
        paymentFilter === "all" || order.paymentMethod === paymentFilter;
      const matchesStatus = matchesTab(order.status, activeTab);

      const createdAt = new Date(order.createdAt);
      const matchesDate =
        dateFilter === "all" ||
        (dateFilter === "today" &&
          createdAt.toDateString() === now.toDateString()) ||
        (dateFilter === "last7" &&
          createdAt.getTime() >= now.getTime() - 7 * 24 * 60 * 60 * 1000);

      return (
        matchesSearch &&
        matchesCarrier &&
        matchesPayment &&
        matchesStatus &&
        matchesDate
      );
    });
  }, [activeTab, carrierFilter, dateFilter, orders, paymentFilter, searchTerm]);

  const totalPages = Math.max(1, Math.ceil(filteredOrders.length / PAGE_SIZE));

  useEffect(() => {
    setPage(1);
  }, [activeTab, carrierFilter, dateFilter, paymentFilter, searchTerm]);

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  const pagedOrders = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filteredOrders.slice(start, start + PAGE_SIZE);
  }, [filteredOrders, page]);

  const allPageSelected =
    pagedOrders.length > 0 &&
    pagedOrders.every((order) => selectedIds.includes(order.id));

  const toggleSelectAllOnPage = (checked: boolean) => {
    if (!checked) {
      setSelectedIds((current) =>
        current.filter((id) => !pagedOrders.some((order) => order.id === id)),
      );
      return;
    }

    setSelectedIds((current) => {
      const next = new Set(current);
      pagedOrders.forEach((order) => next.add(order.id));
      return Array.from(next);
    });
  };

  const toggleOrderSelection = (orderId: string, checked: boolean) => {
    setSelectedIds((current) => {
      if (!checked) return current.filter((id) => id !== orderId);
      return current.includes(orderId) ? current : [...current, orderId];
    });
  };

  const applyLocalOrderUpdate = (updatedOrder: ManagedOrder) => {
    setOrders((current) =>
      current.map((order) =>
        order.id === updatedOrder.id ? updatedOrder : order,
      ),
    );
  };

  const handleRowAction = async (order: ManagedOrder) => {
    const action = getRowAction(order);
    if (!action) return;

    try {
      await persistStatusUpdate(order, action.nextStatus);
      applyLocalOrderUpdate({
        ...order,
        source: order.source === "local" ? "local" : "override",
        status: action.nextStatus,
        updatedAt: new Date().toISOString(),
        updatedBy: "Admin Z-OneTeam",
      });
      toast.success(`Đã cập nhật đơn ${order.code}`);
    } catch {
      toast.error("Không thể cập nhật trạng thái đơn hàng.");
    }
  };

  const handleBatchUpdate = async (nextStatus: string) => {
    const targets = orders.filter((order) => selectedIds.includes(order.id));
    if (targets.length === 0) return;

    try {
      await Promise.all(targets.map((order) => persistStatusUpdate(order, nextStatus)));

      setOrders((current) =>
        current.map((order) =>
          selectedIds.includes(order.id)
            ? {
                ...order,
                source: order.source === "local" ? "local" : "override",
                status: nextStatus,
                updatedAt: new Date().toISOString(),
                updatedBy: "Admin Z-OneTeam",
              }
            : order,
        ),
      );
      setSelectedIds([]);
      toast.success("Đã cập nhật các đơn đã chọn.");
    } catch {
      toast.error("Không thể xử lý hàng loạt. Vui lòng thử lại.");
    }
  };

  const stats = useMemo(
    () => [
      {
        label: "Tổng đơn",
        value: orders.length.toLocaleString("vi-VN"),
        note: "Toàn bộ đơn đang quản lý",
      },
      {
        label: "Chờ xác nhận",
        value: tabCounts.pending?.toLocaleString("vi-VN") || "0",
        note: "Ưu tiên xử lý ngay",
      },
      {
        label: "Chờ lấy hàng",
        value: tabCounts.pickup?.toLocaleString("vi-VN") || "0",
        note: "Đơn đã duyệt cần chuẩn bị",
      },
      {
        label: "Đã giao",
        value: tabCounts.delivered?.toLocaleString("vi-VN") || "0",
        note: "Hoàn tất giao đến khách",
      },
    ],
    [orders.length, tabCounts.delivered, tabCounts.pending, tabCounts.pickup],
  );

  return (
    <div className="space-y-6 bg-slate-50 pb-10">
      <section className="space-y-4">
        <div className="space-y-1">
          <h1 className="text-[20px] font-semibold uppercase text-slate-900">
            Quản lý đơn hàng
          </h1>
          <p className="text-[10.5px] text-slate-500">
            Tập trung vào duyệt đơn nhanh, hành động hàng loạt và nhận diện sản
            phẩm ngay trên danh sách.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="rounded-md border border-slate-200 bg-white p-4 shadow-sm"
            >
              <p className="text-[10.5px] font-semibold text-slate-500">
                {stat.label}
              </p>
              <p className="mt-2 text-[20px] font-semibold text-slate-900">
                {stat.value}
              </p>
              <p className="mt-1 text-[10.5px] text-slate-400">{stat.note}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-md border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
          <div className="grid flex-1 grid-cols-1 gap-x-5 gap-y-3 sm:grid-cols-2 xl:grid-cols-[minmax(280px,1.3fr)_180px_180px_180px]">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Mã đơn, tên khách hàng, số điện thoại"
                className="h-10 border-slate-200 pl-9 text-[13px] shadow-none"
              />
            </div>

            <Select value={dateFilter} onValueChange={setDateFilter}>
              <SelectTrigger className="h-9 border-slate-200 text-[13px] shadow-none">
                <SelectValue placeholder="Ngày đặt" />
              </SelectTrigger>
              <SelectContent>
                {DATE_FILTERS.map((option) => (
                  <SelectItem
                    key={option.value}
                    value={option.value}
                    className="text-[13px]"
                  >
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={carrierFilter} onValueChange={setCarrierFilter}>
              <SelectTrigger className="h-9 border-slate-200 text-[13px] shadow-none">
                <SelectValue placeholder="Đơn vị vận chuyển" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="text-[13px]">
                  Tất cả đơn vị vận chuyển
                </SelectItem>
                {carriers.map((carrier) => (
                  <SelectItem key={carrier} value={carrier} className="text-[13px]">
                    {carrier}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={paymentFilter} onValueChange={setPaymentFilter}>
              <SelectTrigger className="h-9 border-slate-200 text-[13px] shadow-none">
                <SelectValue placeholder="Thanh toán" />
              </SelectTrigger>
              <SelectContent>
                {PAYMENT_OPTIONS.map((option) => (
                  <SelectItem
                    key={option.value}
                    value={option.value}
                    className="text-[13px]"
                  >
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2 xl:ml-auto">
            <Button
              variant="outline"
              onClick={() => void loadOrders()}
              className="h-9 border-slate-200 bg-white px-3 text-[12px] font-medium text-slate-700 shadow-none hover:bg-slate-50"
            >
              <Loader2 className={cn("h-4 w-4", isLoading && "animate-spin")} />
              Làm mới
            </Button>
            <Button
              onClick={() => router.push("/admin/orders/add")}
              className="h-10 rounded-md bg-blue-600 px-4 text-[13px] font-semibold text-white hover:bg-blue-700"
            >
              <Plus className="h-4 w-4" />
              Thêm mới
            </Button>
          </div>
        </div>
      </section>

      <section className="rounded-md border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-4 py-3">
          <div className="flex flex-wrap gap-2">
            {ORDER_TABS.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "inline-flex items-center gap-2 rounded-md border px-3 py-2 text-[12px] font-medium transition-colors",
                    isActive
                      ? "border-slate-300 bg-slate-900 text-white"
                      : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50",
                  )}
                >
                  <span>{tab.label}</span>
                  <span
                    className={cn(
                      "rounded-full px-2 py-0.5 text-[11px] font-semibold",
                      isActive
                        ? "bg-white/15 text-white"
                        : tab.priority
                          ? "bg-amber-100 text-amber-700"
                          : "bg-slate-100 text-slate-700",
                    )}
                  >
                    {tabCounts[tab.id] || 0}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {selectedIds.length > 0 && (
          <div className="sticky top-0 z-10 border-b border-slate-200 bg-slate-50 px-4 py-3">
            <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <p className="text-[12px] font-medium text-slate-700">
                Đã chọn {selectedIds.length} đơn hàng
              </p>
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  onClick={() => void handleBatchUpdate("CONFIRMED")}
                  className="h-9 rounded-md bg-blue-600 px-3 text-[12px] font-semibold text-white hover:bg-blue-700"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  Duyệt hàng loạt
                </Button>
                <Button
                  variant="outline"
                  onClick={() =>
                    toast.success(`Đã tạo lệnh in cho ${selectedIds.length} vận đơn.`)
                  }
                  className="h-9 border-slate-200 bg-white px-3 text-[12px] font-medium text-slate-700 shadow-none hover:bg-slate-50"
                >
                  <FileDown className="h-4 w-4" />
                  In vận đơn
                </Button>
                <Button
                  variant="outline"
                  onClick={() => void handleBatchUpdate("CANCELLED")}
                  className="h-9 border-red-200 bg-white px-3 text-[12px] font-medium text-red-700 shadow-none hover:bg-red-50"
                >
                  <XCircle className="h-4 w-4" />
                  Hủy đơn đã chọn
                </Button>
              </div>
            </div>
          </div>
        )}

        <div className="overflow-x-auto">
          <div className="min-w-[1120px] px-4 py-3">
            <div className="grid grid-cols-[40px_minmax(160px,0.75fr)_minmax(320px,1.6fr)_150px_210px_170px] gap-4 border-b border-slate-200 px-2 py-2 text-[11px] font-medium text-slate-500">
              <div>
                <Checkbox
                  checked={allPageSelected}
                  onCheckedChange={(checked) => toggleSelectAllOnPage(Boolean(checked))}
                  className="border-slate-300 data-[state=checked]:border-blue-600 data-[state=checked]:bg-blue-600"
                />
              </div>
              <div>Mã đơn hàng</div>
              <div>Thông tin sản phẩm</div>
              <div>Tổng tiền</div>
              <div>Trạng thái & vận chuyển</div>
              <div>Hành động</div>
            </div>

            {isLoading ? (
              <div className="flex min-h-[240px] items-center justify-center text-[12px] text-slate-500">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Đang tải đơn hàng...
              </div>
            ) : error && orders.length === 0 ? (
              <div className="flex min-h-[240px] flex-col items-center justify-center gap-2 text-center">
                <AlertCircle className="h-5 w-5 text-red-500" />
                <p className="text-[12px] font-medium text-slate-700">{error}</p>
                <Button
                  variant="outline"
                  onClick={() => void loadOrders()}
                  className="h-9 border-slate-200 bg-white px-3 text-[12px] font-medium"
                >
                  Thử lại
                </Button>
              </div>
            ) : filteredOrders.length === 0 ? (
              <div className="flex min-h-[240px] flex-col items-center justify-center gap-3 text-center">
                <Package2 className="h-5 w-5 text-slate-400" />
                <div className="space-y-1">
                  <p className="text-[12.5px] font-semibold text-slate-700">
                    Không có đơn hàng phù hợp
                  </p>
                  <p className="text-[10.5px] text-slate-400">
                    Hãy thay đổi tab hoặc bộ lọc để xem thêm dữ liệu.
                  </p>
                </div>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {pagedOrders.map((order) => {
                  const statusMeta = getStatusMeta(order.status);
                  const action = getRowAction(order);
                  const extraItems = Math.max(0, order.items.length - 2);

                  return (
                    <div
                      key={order.id}
                      className="grid grid-cols-[40px_minmax(160px,0.75fr)_minmax(320px,1.6fr)_150px_210px_170px] gap-4 px-2 py-4 text-[12px] hover:bg-slate-50"
                    >
                      <div className="pt-1">
                        <Checkbox
                          checked={selectedIds.includes(order.id)}
                          onCheckedChange={(checked) =>
                            toggleOrderSelection(order.id, Boolean(checked))
                          }
                          className="border-slate-300 data-[state=checked]:border-blue-600 data-[state=checked]:bg-blue-600"
                        />
                      </div>

                      <div className="space-y-1">
                        <button
                          type="button"
                          onClick={() => router.push(`/admin/orders/${order.id}`)}
                          className="text-left text-[12.5px] font-semibold text-slate-900 hover:text-blue-700"
                        >
                          {order.code}
                        </button>
                        <p className="text-[11px] text-slate-500">
                          {order.customerName}
                        </p>
                        <p className="text-[10.5px] text-slate-400">
                          {formatCompactDate(order.createdAt)}
                        </p>
                      </div>

                      <div className="space-y-2">
                        {order.items.slice(0, 2).map((item) => (
                          <div key={item.id} className="flex items-start gap-3">
                            <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded border border-slate-200 bg-slate-100">
                              {item.imageUrl ? (
                                <img
                                  src={item.imageUrl}
                                  alt={item.name}
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                <ShoppingBag className="h-4 w-4 text-slate-400" />
                              )}
                            </div>
                            <div className="min-w-0">
                              <p className="line-clamp-2 text-[12.5px] font-semibold text-slate-900">
                                {item.name}
                              </p>
                              <p className="mt-0.5 text-[11px] text-slate-500">
                                {item.variant} • SL {item.quantity}
                              </p>
                            </div>
                          </div>
                        ))}
                        {extraItems > 0 && (
                          <p className="pl-14 text-[10.5px] text-slate-400">
                            + {extraItems} sản phẩm khác
                          </p>
                        )}
                      </div>

                      <div className="space-y-1">
                        <p className="text-[16px] font-semibold text-slate-900">
                          {formatCurrency(order.total)}
                        </p>
                        <p className="text-[10.5px] text-slate-400">
                          Phí ship {formatCurrency(order.shippingFee)}
                        </p>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <span className={cn("h-2 w-2 rounded-full", statusMeta.dot)} />
                          <span className={cn("text-[11.5px] font-medium", statusMeta.tone)}>
                            {statusMeta.label}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-[11.5px] font-medium text-slate-700">
                          <Truck className="h-4 w-4 text-slate-400" />
                          <span>{order.carrier}</span>
                        </div>
                        <p className="text-[10.5px] text-slate-400">
                          {order.paymentMethod} •{" "}
                          {order.paymentStatus === "PAID"
                            ? "Đã thanh toán"
                            : "Chưa thanh toán"}
                        </p>
                      </div>

                      <div className="flex items-start gap-2">
                        {action ? (
                          <Button
                            onClick={() => void handleRowAction(order)}
                            className="h-9 rounded-md bg-blue-600 px-3 text-[12px] font-semibold text-white hover:bg-blue-700"
                          >
                            {action.label}
                          </Button>
                        ) : (
                          <Button
                            variant="outline"
                            onClick={() => router.push(`/admin/orders/${order.id}`)}
                            className="h-9 border-slate-200 bg-white px-3 text-[12px] font-medium text-slate-700 shadow-none hover:bg-slate-50"
                          >
                            Xem trạng thái
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          onClick={() => router.push(`/admin/orders/${order.id}`)}
                          className="h-9 px-2 text-[11.5px] font-medium text-slate-500 hover:bg-slate-100 hover:text-slate-700"
                        >
                          <Eye className="h-4 w-4" />
                          Xem chi tiết
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between border-t border-slate-200 px-4 py-3 text-[12px] font-medium text-slate-600">
          <p>
            Hiển thị{" "}
            <span className="text-slate-900">
              {filteredOrders.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1}
            </span>{" "}
            -{" "}
            <span className="text-slate-900">
              {Math.min(page * PAGE_SIZE, filteredOrders.length)}
            </span>{" "}
            / {filteredOrders.length} đơn hàng
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              disabled={page <= 1}
              onClick={() => setPage((current) => Math.max(1, current - 1))}
              className="h-8 px-2 text-[12px] font-medium"
            >
              <ChevronLeft className="h-4 w-4" />
              Trước
            </Button>
            <span className="px-2 text-[12px] text-slate-500">
              Trang {page}/{totalPages}
            </span>
            <Button
              variant="ghost"
              disabled={page >= totalPages}
              onClick={() =>
                setPage((current) => Math.min(totalPages, current + 1))
              }
              className="h-8 px-2 text-[12px] font-medium"
            >
              Sau
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}

export function AdminOrderEditorModule({
  mode,
  orderId,
}: {
  mode: "create" | "edit";
  orderId?: string;
}) {
  const router = useRouter();
  const [form, setForm] = useState<OrderFormState>(createEmptyOrderForm());
  const [isLoading, setIsLoading] = useState(mode === "edit");
  const [isSaving, setIsSaving] = useState(false);
  const [loadedOrder, setLoadedOrder] = useState<ManagedOrder | null>(null);
  const [productQuery, setProductQuery] = useState("");

  useEffect(() => {
    if (mode !== "edit" || !orderId) return;

    const loadOrder = async () => {
      setIsLoading(true);

      const localMatch = readLocalManagedOrders().find(
        (order) => order.id === orderId,
      );

      if (localMatch) {
        setLoadedOrder(localMatch);
        setForm(buildOrderFormState(localMatch));
        setIsLoading(false);
        return;
      }

      try {
        const order = await orderService.getAdminOrderById(orderId);
        const transformed = transformMyOrderToManagedOrder(order);
        setLoadedOrder(transformed);
        setForm(buildOrderFormState(transformed));
      } catch {
        toast.error("Không thể tải chi tiết đơn hàng.");
      } finally {
        setIsLoading(false);
      }
    };

    void loadOrder();
  }, [mode, orderId]);

  const filteredCatalog = useMemo(() => {
    const lowerQuery = productQuery.trim().toLowerCase();
    if (!lowerQuery) return PRODUCT_CATALOG.slice(0, 3);

    return PRODUCT_CATALOG.filter(
      (product) =>
        product.name.toLowerCase().includes(lowerQuery) ||
        product.sku.toLowerCase().includes(lowerQuery),
    );
  }, [productQuery]);

  const subtotal = useMemo(
    () =>
      form.items.reduce(
        (sum, item) => sum + Number(item.unitPrice || 0) * Number(item.quantity || 0),
        0,
      ),
    [form.items],
  );
  const total = Math.max(0, subtotal + Number(form.shippingFee || 0) - Number(form.discount || 0));

  const updateForm = <Key extends keyof OrderFormState>(
    key: Key,
    value: OrderFormState[Key],
  ) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const updateItem = (
    itemId: string,
    field: keyof ManagedOrderItem,
    value: ManagedOrderItem[keyof ManagedOrderItem],
  ) => {
    setForm((current) => ({
      ...current,
      items: current.items.map((item) =>
        item.id === itemId ? { ...item, [field]: value } : item,
      ),
    }));
  };

  const addEmptyLineItem = () => {
    setForm((current) => ({
      ...current,
      items: [
        ...current.items,
        {
          id: `line-${Date.now()}`,
          imageUrl: "",
          name: "",
          quantity: 1,
          sku: "",
          unitPrice: 0,
          variant: "",
        },
      ],
    }));
  };

  const addCatalogItem = (catalogItem: ManagedOrderItem) => {
    setForm((current) => {
      const existing = current.items.find((item) => item.sku === catalogItem.sku);
      if (existing) {
        return {
          ...current,
          items: current.items.map((item) =>
            item.sku === catalogItem.sku
              ? { ...item, quantity: item.quantity + 1 }
              : item,
          ),
        };
      }

      return {
        ...current,
        items: [
          ...current.items,
          { ...catalogItem, id: `line-${Date.now()}-${catalogItem.sku}` },
        ],
      };
    });
    toast.success(`Đã thêm ${catalogItem.name}`);
  };

  const removeItem = (itemId: string) => {
    setForm((current) => ({
      ...current,
      items: current.items.filter((item) => item.id !== itemId),
    }));
  };

  const validateForm = () => {
    if (!form.customerName.trim()) {
      toast.error("Vui lòng nhập tên khách hàng.");
      return false;
    }

    if (!form.customerPhone.trim()) {
      toast.error("Vui lòng nhập số điện thoại khách hàng.");
      return false;
    }

    if (!form.shippingAddress.trim()) {
      toast.error("Vui lòng nhập địa chỉ giao hàng.");
      return false;
    }

    if (form.items.length === 0) {
      toast.error("Cần thêm ít nhất một sản phẩm vào đơn hàng.");
      return false;
    }

    if (
      form.items.some(
        (item) =>
          !item.name.trim() ||
          !item.sku.trim() ||
          Number(item.quantity || 0) <= 0 ||
          Number(item.unitPrice || 0) < 0,
      )
    ) {
      toast.error("Vui lòng hoàn thiện thông tin sản phẩm trong đơn.");
      return false;
    }

    return true;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    setIsSaving(true);

    try {
      const nextOrder = buildManagedOrderFromForm(form, mode, loadedOrder || undefined);
      upsertLocalManagedOrder(nextOrder);
      setLoadedOrder(nextOrder);

      if (mode === "create") {
        toast.success("Đã tạo đơn hàng mới trên giao diện quản trị.");
        router.push(`/admin/orders/${nextOrder.id}`);
      } else {
        toast.success("Đã lưu cập nhật đơn hàng.");
      }
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[360px] items-center justify-center text-[12px] text-slate-500">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        Đang tải dữ liệu đơn hàng...
      </div>
    );
  }

  return (
    <div className="space-y-6 bg-slate-50 pb-28">
      <div className="space-y-1">
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={() => router.push("/admin/orders")}
            className="h-9 border-slate-200 bg-white px-3 text-[12px] font-medium text-slate-700 shadow-none hover:bg-slate-50"
          >
            <ArrowLeft className="h-4 w-4" />
            Danh sách
          </Button>
          <h1 className="text-[20px] font-semibold uppercase text-slate-900">
            {mode === "create"
              ? "Thêm đơn hàng"
              : `Cập nhật đơn hàng #${form.code}`}
          </h1>
        </div>
        {mode === "edit" && loadedOrder && (
          <p className="text-[10.5px] text-slate-500">
            Tạo bởi {loadedOrder.createdBy} lúc {formatCompactDate(loadedOrder.createdAt)} - Cập nhật bởi{" "}
            {loadedOrder.updatedBy} lúc {formatCompactDate(loadedOrder.updatedAt)}
          </p>
        )}
      </div>

      <EditorSection title="1. THÔNG TIN CHÍNH">
        <div className="grid grid-cols-1 gap-x-5 gap-y-6 sm:grid-cols-2 xl:grid-cols-3">
          <ReadOnlyField label="Mã đơn hàng" value={form.code} />

          <FormField label="Trạng thái">
            <Select value={form.status} onValueChange={(value) => updateForm("status", value)}>
              <SelectTrigger className="h-10 border-slate-200 text-[13px] shadow-none">
                <SelectValue placeholder="Chọn trạng thái" />
              </SelectTrigger>
              <SelectContent>
                {[
                  "PENDING",
                  "CONFIRMED",
                  "PROCESSING",
                  "READY_FOR_PICKUP",
                  "SHIPPING",
                  "COMPLETED",
                  "CANCELLED",
                  "RETURNED",
                ].map((status) => (
                  <SelectItem key={status} value={status} className="text-[13px]">
                    {getStatusMeta(status).label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>

          <FormField label="Kênh bán">
            <Select
              value={form.sourceChannel}
              onValueChange={(value) => updateForm("sourceChannel", value)}
            >
              <SelectTrigger className="h-10 border-slate-200 text-[13px] shadow-none">
                <SelectValue placeholder="Chọn kênh bán" />
              </SelectTrigger>
              <SelectContent>
                {SOURCE_CHANNEL_OPTIONS.map((option) => (
                  <SelectItem key={option} value={option} className="text-[13px]">
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>

          <FormField label="Chi nhánh">
            <Input
              value={form.branchName}
              onChange={(event) => updateForm("branchName", event.target.value)}
              className="h-10 border-slate-200 text-[13px] shadow-none"
            />
          </FormField>

          <FormField label="Nhân viên phụ trách">
            <Select
              value={form.assignedStaff}
              onValueChange={(value) => updateForm("assignedStaff", value)}
            >
              <SelectTrigger className="h-10 border-slate-200 text-[13px] shadow-none">
                <SelectValue placeholder="Chọn nhân viên" />
              </SelectTrigger>
              <SelectContent>
                {STAFF_OPTIONS.map((option) => (
                  <SelectItem key={option} value={option} className="text-[13px]">
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>

          <FormField label="Ngày hẹn giao">
            <SharedDatePicker
              value={form.expectedDeliveryDate}
              onChange={(nextValue) =>
                updateForm("expectedDeliveryDate", nextValue)
              }
              placeholder="Chọn ngày giao"
              variant="compact"
              buttonClassName="h-10 border-slate-200 text-[13px] shadow-none"
            />
          </FormField>
        </div>
      </EditorSection>

      <EditorSection title="2. KHÁCH HÀNG & GIAO HÀNG">
        <div className="grid grid-cols-1 gap-x-5 gap-y-6 sm:grid-cols-2 xl:grid-cols-3">
          <FormField label="Tên khách hàng">
            <Input
              value={form.customerName}
              onChange={(event) => updateForm("customerName", event.target.value)}
              className="h-10 border-slate-200 text-[13px] shadow-none"
            />
          </FormField>

          <FormField label="Số điện thoại">
            <Input
              value={form.customerPhone}
              onChange={(event) => updateForm("customerPhone", event.target.value)}
              className="h-10 border-slate-200 text-[13px] shadow-none"
            />
          </FormField>

          <FormField label="Người nhận">
            <Input
              value={form.receiverName}
              onChange={(event) => updateForm("receiverName", event.target.value)}
              className="h-10 border-slate-200 text-[13px] shadow-none"
            />
          </FormField>

          <FormField label="SĐT người nhận">
            <Input
              value={form.receiverPhone}
              onChange={(event) => updateForm("receiverPhone", event.target.value)}
              className="h-10 border-slate-200 text-[13px] shadow-none"
            />
          </FormField>

          <FormField label="Đơn vị vận chuyển">
            <Select value={form.carrier} onValueChange={(value) => updateForm("carrier", value)}>
              <SelectTrigger className="h-10 border-slate-200 text-[13px] shadow-none">
                <SelectValue placeholder="Chọn đơn vị vận chuyển" />
              </SelectTrigger>
              <SelectContent>
                {CARRIER_OPTIONS.map((option) => (
                  <SelectItem key={option} value={option} className="text-[13px]">
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>

          <FormField label="Phương thức thanh toán">
            <Select
              value={form.paymentMethod}
              onValueChange={(value) => updateForm("paymentMethod", value)}
            >
              <SelectTrigger className="h-10 border-slate-200 text-[13px] shadow-none">
                <SelectValue placeholder="Chọn phương thức thanh toán" />
              </SelectTrigger>
              <SelectContent>
                {PAYMENT_OPTIONS.filter((option) => option.value !== "all").map(
                  (option) => (
                    <SelectItem
                      key={option.value}
                      value={option.value}
                      className="text-[13px]"
                    >
                      {option.label}
                    </SelectItem>
                  ),
                )}
              </SelectContent>
            </Select>
          </FormField>

          <FormField label="Trạng thái thanh toán">
            <Select
              value={form.paymentStatus}
              onValueChange={(value: "PAID" | "UNPAID") =>
                updateForm("paymentStatus", value)
              }
            >
              <SelectTrigger className="h-10 border-slate-200 text-[13px] shadow-none">
                <SelectValue placeholder="Chọn trạng thái thanh toán" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="UNPAID" className="text-[13px]">
                  Chưa thanh toán
                </SelectItem>
                <SelectItem value="PAID" className="text-[13px]">
                  Đã thanh toán
                </SelectItem>
              </SelectContent>
            </Select>
          </FormField>

          <FormField label="Địa chỉ giao hàng" className="xl:col-span-3">
            <Textarea
              value={form.shippingAddress}
              onChange={(event) => updateForm("shippingAddress", event.target.value)}
              className="min-h-[84px] resize-none border-slate-200 text-[13px] shadow-none"
            />
          </FormField>
        </div>
      </EditorSection>

      <EditorSection title="3. SẢN PHẨM TRONG ĐƠN">
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-x-5 gap-y-6 xl:grid-cols-[minmax(0,1fr)_auto]">
            <FormField label="Tìm nhanh sản phẩm">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  value={productQuery}
                  onChange={(event) => setProductQuery(event.target.value)}
                  placeholder="Tên sản phẩm hoặc SKU"
                  className="h-10 border-slate-200 pl-9 text-[13px] shadow-none"
                />
              </div>
            </FormField>

            <div className="self-end">
              <Button
                variant="outline"
                onClick={addEmptyLineItem}
                className="h-9 border-slate-200 bg-white px-3 text-[12px] font-medium text-slate-700 shadow-none hover:bg-slate-50"
              >
                <Plus className="h-4 w-4" />
                Thêm dòng
              </Button>
            </div>
          </div>

          {filteredCatalog.length > 0 && (
            <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
              {filteredCatalog.map((product) => (
                <button
                  key={product.id}
                  type="button"
                  onClick={() => addCatalogItem(product)}
                  className="flex items-center gap-3 rounded-md border border-slate-200 bg-slate-50 px-3 py-3 text-left transition hover:border-slate-300 hover:bg-white"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded border border-slate-200 bg-white">
                    {product.imageUrl ? (
                      <img
                        src={product.imageUrl}
                        alt={product.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <ShoppingBag className="h-4 w-4 text-slate-400" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-[12.5px] font-semibold text-slate-900">
                      {product.name}
                    </p>
                    <p className="text-[10.5px] text-slate-400">
                      {product.sku} • {product.variant}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}

          <div className="overflow-x-auto rounded-md border border-slate-200">
            <div className="min-w-[980px]">
              <div className="grid grid-cols-[minmax(280px,1.4fr)_160px_90px_140px_140px_40px] gap-3 border-b border-slate-200 bg-slate-50 px-4 py-3 text-[11px] font-medium text-slate-500">
                <div>Sản phẩm</div>
                <div>Phân loại / SKU</div>
                <div>SL</div>
                <div>Đơn giá</div>
                <div>Thành tiền</div>
                <div></div>
              </div>

              {form.items.length === 0 ? (
                <div className="flex min-h-[180px] flex-col items-center justify-center gap-2 text-center">
                  <ShoppingCart className="h-5 w-5 text-slate-400" />
                  <p className="text-[12px] font-medium text-slate-600">
                    Chưa có sản phẩm trong đơn hàng
                  </p>
                  <p className="text-[10.5px] text-slate-400">
                    Tìm nhanh sản phẩm ở phía trên hoặc thêm thủ công một dòng mới.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {form.items.map((item) => (
                    <div
                      key={item.id}
                      className="grid grid-cols-[minmax(280px,1.4fr)_160px_90px_140px_140px_40px] gap-3 px-4 py-3"
                    >
                      <div className="flex gap-3">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded border border-slate-200 bg-slate-100">
                          {item.imageUrl ? (
                            <img
                              src={item.imageUrl}
                              alt={item.name}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <Package2 className="h-4 w-4 text-slate-400" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <Input
                            value={item.name}
                            onChange={(event) =>
                              updateItem(item.id, "name", event.target.value)
                            }
                            className="h-10 border-slate-200 text-[13px] shadow-none"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Input
                          value={item.variant}
                          onChange={(event) =>
                            updateItem(item.id, "variant", event.target.value)
                          }
                          placeholder="Phân loại"
                          className="h-10 border-slate-200 text-[13px] shadow-none"
                        />
                        <Input
                          value={item.sku}
                          onChange={(event) =>
                            updateItem(item.id, "sku", event.target.value)
                          }
                          placeholder="SKU"
                          className="h-10 border-slate-200 bg-slate-50 text-[13px] shadow-none"
                        />
                      </div>

                      <Input
                        type="number"
                        min={1}
                        value={item.quantity}
                        onChange={(event) =>
                          updateItem(
                            item.id,
                            "quantity",
                            Math.max(1, Number(event.target.value || 1)),
                          )
                        }
                        className="h-10 border-slate-200 text-[13px] shadow-none"
                      />

                      <Input
                        type="number"
                        min={0}
                        value={item.unitPrice}
                        onChange={(event) =>
                          updateItem(
                            item.id,
                            "unitPrice",
                            Math.max(0, Number(event.target.value || 0)),
                          )
                        }
                        className="h-10 border-slate-200 text-[13px] shadow-none"
                      />

                      <div className="flex h-10 items-center rounded-md border border-slate-200 bg-slate-50 px-3 text-[12.5px] font-semibold text-slate-900">
                        {formatCurrency(item.quantity * item.unitPrice)}
                      </div>

                      <button
                        type="button"
                        onClick={() => removeItem(item.id)}
                        className="flex h-10 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-50 hover:text-red-600"
                      >
                        <XCircle className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </EditorSection>

      <EditorSection title="4. GHI CHÚ & TỔNG KẾT">
        <div className="grid grid-cols-1 gap-x-5 gap-y-6 sm:grid-cols-2 xl:grid-cols-3">
          <FormField label="Ghi chú khách hàng" className="xl:col-span-2">
            <Textarea
              value={form.note}
              onChange={(event) => updateForm("note", event.target.value)}
              className="min-h-[84px] resize-none border-slate-200 text-[13px] shadow-none"
            />
          </FormField>

          <FormField label="Ghi chú nội bộ">
            <Textarea
              value={form.internalNote}
              onChange={(event) => updateForm("internalNote", event.target.value)}
              className="min-h-[84px] resize-none border-slate-200 text-[13px] shadow-none"
            />
          </FormField>

          <FormField label="Phí vận chuyển">
            <Input
              type="number"
              min={0}
              value={form.shippingFee}
              onChange={(event) =>
                updateForm("shippingFee", Math.max(0, Number(event.target.value || 0)))
              }
              className="h-10 border-slate-200 text-[13px] shadow-none"
            />
          </FormField>

          <FormField label="Giảm giá">
            <Input
              type="number"
              min={0}
              value={form.discount}
              onChange={(event) =>
                updateForm("discount", Math.max(0, Number(event.target.value || 0)))
              }
              className="h-10 border-slate-200 text-[13px] shadow-none"
            />
          </FormField>

          <ReadOnlyField label="Tạm tính" value={formatCurrency(subtotal)} />
          <ReadOnlyField label="Tổng thanh toán" value={formatCurrency(total)} />
        </div>
      </EditorSection>

      <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-slate-200 bg-white/95 backdrop-blur">
        <div className="flex items-center justify-end gap-3 px-6 py-4">
          <Button
            variant="outline"
            onClick={() => router.push("/admin/orders")}
            className="h-10 border-slate-200 bg-white px-4 text-[13px] font-medium text-slate-700 shadow-none hover:bg-slate-50"
          >
            Hủy
          </Button>
          <Button
            onClick={() => void handleSave()}
            disabled={isSaving}
            className="h-10 rounded-md bg-blue-600 px-4 text-[13px] font-semibold text-white hover:bg-blue-700"
          >
            {isSaving && <Loader2 className="h-4 w-4 animate-spin" />}
            {mode === "create" ? "Thêm mới" : "Lưu"}
          </Button>
        </div>
      </div>
    </div>
  );
}

function EditorSection({
  children,
  title,
}: {
  children: React.ReactNode;
  title: string;
}) {
  return (
    <section className="rounded-md border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-5">
        <h2 className="text-[12px] font-semibold text-slate-900">{title}</h2>
      </div>
      {children}
    </section>
  );
}

function FormField({
  children,
  className,
  label,
}: {
  children: React.ReactNode;
  className?: string;
  label: string;
}) {
  return (
    <div className={cn("space-y-2", className)}>
      <label className="text-[10.5px] font-semibold text-slate-500">
        {label}
      </label>
      {children}
    </div>
  );
}

function ReadOnlyField({ label, value }: { label: string; value: string }) {
  return (
    <FormField label={label}>
      <div className="flex h-10 items-center rounded-md border border-slate-200 bg-slate-50 px-3 text-[13px] text-slate-700">
        {value}
      </div>
    </FormField>
  );
}

