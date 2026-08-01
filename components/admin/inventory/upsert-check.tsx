"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  Boxes,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  Eye,
  EyeOff,
  FileSpreadsheet,
  Loader2,
  MessageSquareText,
  Pencil,
  Plus,
  Save,
  Search,
  Trash2,
  X,
} from "lucide-react";
import * as XLSX from "xlsx";
import { toast } from "sonner";
import { SharedDatePicker } from "@/components/admin/shared/BirthDatePicker";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { branchService } from "@/app/services/branchService";
import { InventoryCheckApiService } from "@/app/services/inventory.service";
import { EmployeeService } from "@/app/services/employee.service";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { usePermissions } from "@/hooks/usePermissions";
import { P } from "@/lib/permissions";
import { isAdminRole } from "@/lib/roles";
import { cn, formatNumber, repairVietnameseText } from "@/lib/utils";
import { useAuthStore } from "@/stores/useAuthStore";

interface InventoryUpsertProps {
  mode: "create" | "edit" | "view";
  initialData?: any;
  code?: string;
}

type InventoryCheckScopeType = "FULL_WAREHOUSE" | "SELECTED_VARIANTS";

type CheckItem = {
  rowId: string;
  productVariantId: number | string;
  name: string;
  sku: string;
  unit: string;
  systemQuantity: number;
  quantityReal: number | null;
  quantityRejected: number | null;
  minThreshold: number;
  reason: string;
  batchNumber?: string;
  expiryDate?: string | null;
  importPrice?: number | null;
};

type CheckWorkflowStatus =
  | "DRAFT"
  | "COUNTING"
  | "PENDING_APPROVAL"
  | "RECOUNT_REQUIRED"
  | "COMPLETED"
  | "CANCELLED";

const getWorkflowStatus = (value: any): CheckWorkflowStatus => {
  const normalized = String(value || "").toUpperCase();
  switch (normalized) {
    case "COUNTING":
    case "COUNTING_IN_PROGRESS":
      return "COUNTING";
    case "PENDING_APPROVAL":
    case "WAITING_FOR_ADJUSTMENT_APPROVAL":
      return "PENDING_APPROVAL";
    case "RECOUNT_REQUIRED":
      return "RECOUNT_REQUIRED";
    case "COMPLETED":
    case "COUNTING_COMPLETED":
      return "COMPLETED";
    case "CANCELLED":
      return "CANCELLED";
    default:
      return "DRAFT";
  }
};

const generatePKKCode = () => {
  const now = new Date();
  const dateStr =
    now.getFullYear().toString() +
    String(now.getMonth() + 1).padStart(2, "0") +
    String(now.getDate()).padStart(2, "0");
  const random = String(Math.floor(Math.random() * 1000)).padStart(3, "0");
  return `PKK-${dateStr}${random}`;
};

const toNumber = (value: unknown, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const normalizeScopeType = (value: unknown): InventoryCheckScopeType =>
  String(value || "").toUpperCase() === "SELECTED_VARIANTS"
    ? "SELECTED_VARIANTS"
    : "FULL_WAREHOUSE";

const getScopeTypeLabel = (value: unknown) =>
  normalizeScopeType(value) === "SELECTED_VARIANTS"
    ? "Một số sản phẩm / SKU"
    : "Toàn bộ kho";

const getVariantId = (item: any) =>
  item?.productVariantId ?? item?.variantId ?? item?.id;

const getLotIdentity = (item: any) =>
  `${String(getVariantId(item) ?? "variant")}::${String(item?.batchNumber ?? "")}::${String(item?.importPrice ?? "")}`;

const getSkuGroupIdentity = (item: any) =>
  `${String(getVariantId(item) ?? "variant")}::${String(item?.sku ?? "")}`;

const serializeExpiryDate = (value: unknown) => {
  if (!value) return null;
  const raw = String(value).trim();
  if (!raw) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;

  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) return raw;

  const year = parsed.getFullYear();
  const month = String(parsed.getMonth() + 1).padStart(2, "0");
  const day = String(parsed.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const serializeCheckDateTime = (value: string) => {
  const raw = String(value || "").trim();
  if (!raw) {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}T00:00:00`;
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    return `${raw}T00:00:00`;
  }

  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) return raw;

  const year = parsed.getFullYear();
  const month = String(parsed.getMonth() + 1).padStart(2, "0");
  const day = String(parsed.getDate()).padStart(2, "0");
  const hours = String(parsed.getHours()).padStart(2, "0");
  const minutes = String(parsed.getMinutes()).padStart(2, "0");
  const seconds = String(parsed.getSeconds()).padStart(2, "0");
  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
};

const normalizeBatchNumber = (value: unknown) => {
  const raw = String(value ?? "").trim();
  if (!raw || raw.toUpperCase() === "N/A") return null;
  return raw;
};

const normalizeImportPrice = (value: unknown) => {
  if (value === null || value === undefined || value === "") return null;
  return toNumber(value);
};

const formatExpiryDate = (value: unknown) => {
  if (!value) return "—";
  const parsed = new Date(String(value));
  if (Number.isNaN(parsed.getTime())) return String(value);
  return parsed.toLocaleDateString("vi-VN");
};

let checkItemRowSeed = 0;

const createCheckItemRowId = (item: any) => {
  const existingRowId = item?.rowId ?? item?.clientRowId;
  if (existingRowId) return String(existingRowId);

  checkItemRowSeed += 1;
  const variantId = getVariantId(item) ?? "variant";
  const sku = item?.sku ?? "sku";
  const batchNumber = item?.batchNumber ?? "batch";
  return `${variantId}-${sku}-${batchNumber}-${checkItemRowSeed}`;
};

const isExpiredLot = (value: unknown) => {
  if (!value) return false;

  const parsed = new Date(String(value));
  if (Number.isNaN(parsed.getTime())) return false;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  parsed.setHours(0, 0, 0, 0);

  return parsed < today;
};

const resolveCheckItemAutoFill = (item: any) => {
  const systemQuantity = Math.max(
    0,
    toNumber(item.systemQuantity ?? item.quantity ?? 0),
  );
  const expiryDate = item.expiryDate || item.expireDate || null;
  const isExpired = isExpiredLot(expiryDate);
  const existingReason = String(item.reason || item.note || "").trim();
  const normalizedRealQty = normalizeOptionalQuantity(item.quantityReal);
  const hasRealQty =
    item.quantityReal !== null &&
    item.quantityReal !== undefined &&
    item.quantityReal !== "" &&
    normalizedRealQty !== null;
  const quantityReal = hasRealQty
    ? normalizedRealQty
    : systemQuantity === 0 || isExpired
      ? systemQuantity
      : null;
  const realQtyForRejected = quantityReal ?? 0;
  const hasRejectedQty =
    item.quantityRejected !== null &&
    item.quantityRejected !== undefined &&
    item.quantityRejected !== "";
  const rawRejectedQty = hasRejectedQty
    ? toNumber(item.quantityRejected, 0)
    : isExpired
      ? realQtyForRejected
      : 0;

  return {
    systemQuantity,
    quantityReal,
    quantityRejected: Math.max(0, Math.min(realQtyForRejected, rawRejectedQty)),
    reason: existingReason || (isExpired ? "Lô hết hạn" : ""),
    expiryDate,
  };
};

const mapItem = (item: any): CheckItem => {
  const autoFill = resolveCheckItemAutoFill(item);

  return {
    rowId: createCheckItemRowId(item),
    productVariantId: getVariantId(item),
    name: item.name || item.productName || item.variantName || "N/A",
    sku: item.sku || "N/A",
    unit: item.unit || "Cái",
    systemQuantity: autoFill.systemQuantity,
    quantityReal: autoFill.quantityReal,
    quantityRejected: autoFill.quantityRejected,
    minThreshold: toNumber(
      item.minThreshold ?? item.minStock ?? item.reorderPoint ?? 10,
      10,
    ),
    reason: autoFill.reason,
    batchNumber: item.batchNumber || "N/A",
    expiryDate: autoFill.expiryDate,
    importPrice: normalizeImportPrice(item.importPrice ?? item.price),
  };
};

const buildCheckPayloadDetails = (items: CheckItem[]) =>
  items.map((item) => ({
    productVariantId: toNumber(item.productVariantId),
    batchNumber: normalizeBatchNumber(item.batchNumber),
    expiryDate: serializeExpiryDate(item.expiryDate),
    importPrice: item.importPrice == null ? null : item.importPrice,
    systemQuantity: toNumber(item.systemQuantity),
    quantityReal: getEffectiveQuantityReal(item),
    quantityRejected: getEffectiveQuantityRejected(item),
    note: item.reason.trim() || null,
  }));

const getInventoryCheckErrorMessage = (error: any, fallback: string) => {
  const fieldErrors = Array.isArray(error?.response?.data?.fieldErrors)
    ? error.response.data.fieldErrors
        .filter((value: unknown): value is string => typeof value === "string" && value.trim().length > 0)
        .join(". ")
    : "";

  return repairVietnameseText(
    error?.response?.data?.message ||
      error?.response?.data?.detail ||
      fieldErrors ||
      error?.response?.data?.error ||
      fallback,
  );
};

const normalizeOptionalQuantity = (value: unknown) => {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    return null;
  }

  return Math.max(0, parsed);
};

const getEffectiveQuantityReal = (
  item: Pick<CheckItem, "systemQuantity" | "quantityReal">,
) => {
  const normalizedRealQty = normalizeOptionalQuantity(item.quantityReal);
  if (normalizedRealQty !== null) {
    return normalizedRealQty;
  }

  return Math.max(0, toNumber(item.systemQuantity)) === 0 ? 0 : null;
};

const getEffectiveQuantityRejected = (
  item: Pick<CheckItem, "systemQuantity" | "quantityReal" | "quantityRejected">,
) => {
  const realQty = getEffectiveQuantityReal(item) ?? 0;
  return Math.max(0, Math.min(realQty, toNumber(item.quantityRejected, 0)));
};

const getUncheckedCheckItems = (items: CheckItem[]) =>
  items.filter((item) => getEffectiveQuantityReal(item) === null);

const getInvalidRejectedCheckItems = (items: CheckItem[]) =>
  items.filter((item) => toNumber(item.quantityRejected, 0) > (getEffectiveQuantityReal(item) ?? 0));

const getMissingReasonCheckItems = (items: CheckItem[]) =>
  items.filter((item) => {
    const realQty = getEffectiveQuantityReal(item);
    const rejectedQty = getEffectiveQuantityRejected(item);
    const diffQty = (realQty ?? 0) - Math.max(0, toNumber(item.systemQuantity));

    return (diffQty !== 0 || rejectedQty > 0) && item.reason.trim().length === 0;
  });

const getItemMetrics = (item: CheckItem) => {
  const realQty = Math.max(0, toNumber(item.quantityReal, 0));
  const rejectedQty = getEffectiveQuantityRejected(item);
  const usableQty = Math.max(0, realQty - rejectedQty);
  const systemQty = Math.max(0, toNumber(item.systemQuantity));
  const minThreshold = Math.max(0, toNumber(item.minThreshold, 10));
  const diffQty = usableQty - systemQty;
  const suggestedImport = 0;
  return {
    realQty,
    rejectedQty,
    usableQty,
    systemQty,
    minThreshold,
    diffQty,
    suggestedImport,
  };
};

type CheckItemMetrics = ReturnType<typeof getItemMetrics>;

const createEmptyMetrics = (): CheckItemMetrics => ({
  realQty: 0,
  rejectedQty: 0,
  usableQty: 0,
  systemQty: 0,
  minThreshold: 0,
  diffQty: 0,
  suggestedImport: 0,
});

const getSharedMinThreshold = (items: Array<Pick<CheckItem, "minThreshold">>) =>
  Math.max(0, toNumber(items[0]?.minThreshold, 10));

const getGroupMetrics = (items: CheckItem[]): CheckItemMetrics =>
  items.reduce(
    (acc, item, index) => {
      const metrics = getItemMetrics(item);
      const nextUsableQty = acc.usableQty + metrics.usableQty;
      const minThreshold =
        index === 0 ? getSharedMinThreshold(items) : acc.minThreshold;

      return {
        realQty: acc.realQty + metrics.realQty,
        rejectedQty: acc.rejectedQty + metrics.rejectedQty,
        usableQty: nextUsableQty,
        systemQty: acc.systemQty + metrics.systemQty,
        minThreshold,
        diffQty: acc.diffQty + metrics.diffQty,
        suggestedImport: Math.max(
          0,
          minThreshold - (acc.systemQty + metrics.systemQty),
        ),
      };
    },
    createEmptyMetrics(),
  );

const mergeMetrics = (
  acc: CheckItemMetrics,
  metrics: CheckItemMetrics,
): CheckItemMetrics => ({
  realQty: acc.realQty + metrics.realQty,
  rejectedQty: acc.rejectedQty + metrics.rejectedQty,
  usableQty: acc.usableQty + metrics.usableQty,
  systemQty: acc.systemQty + metrics.systemQty,
  minThreshold: acc.minThreshold + metrics.minThreshold,
  diffQty: acc.diffQty + metrics.diffQty,
  suggestedImport: acc.suggestedImport + metrics.suggestedImport,
});

const normalizeViText = (value: string) => {
  return repairVietnameseText(String(value || ""));
};
























const getBadgeFromMetrics = (metrics: CheckItemMetrics) => {
  if (metrics.rejectedQty > 0) {
    return {
      label: "Hư hại",
      className: "bg-rose-50 text-rose-700 border-rose-100",
    };
  }
  if (metrics.suggestedImport > 0) {
    return {
      label: "Cần nhập",
      className: "bg-amber-50 text-amber-700 border-amber-100",
    };
  }
  if (metrics.diffQty !== 0) {
    return {
      label: "Chênh lệch",
      className: "bg-sky-50 text-sky-700 border-sky-100",
    };
  }
  return {
    label: "Khớp kho",
    className: "bg-blue-50 text-blue-700 border-blue-100",
  };
};

const getItemBadge = (item: CheckItem) => {
  const metrics = getItemMetrics(item);
  if (metrics.rejectedQty > 0) return { label: "Hư hại", className: "bg-rose-50 text-rose-700 border-rose-100" };
  if (metrics.suggestedImport > 0) return { label: "Cần nhập", className: "bg-amber-50 text-amber-700 border-amber-100" };
  if (metrics.diffQty !== 0) return { label: "Chênh lệch", className: "bg-sky-50 text-sky-700 border-sky-100" };
  return { label: "Khớp kho", className: "bg-blue-50 text-blue-700 border-blue-100" };
};

const getLotBadge = (item: CheckItem) => {
  const metrics = getItemMetrics(item);
  if (metrics.rejectedQty > 0) {
    return {
      label: "Hư hại",
      className: "bg-rose-50 text-rose-700 border-rose-100",
    };
  }
  if (metrics.diffQty !== 0) {
    return {
      label: "Chênh lệch",
      className: "bg-sky-50 text-sky-700 border-sky-100",
    };
  }
  return {
    label: "Khớp kho",
    className: "bg-blue-50 text-blue-700 border-blue-100",
  };
};

const getWorkflowStatusMeta = (status: CheckWorkflowStatus) => {
  switch (status) {
    case "COUNTING":
      return {
        label: "Đang đếm thực tế",
        className: "border-amber-100 bg-amber-50 text-amber-700",
      };
    case "PENDING_APPROVAL":
      return {
        label: "Chờ duyệt cân bằng",
        className: "border-blue-100 bg-blue-50 text-blue-700",
      };
    case "RECOUNT_REQUIRED":
      return {
        label: "Yêu cầu kiểm lại",
        className: "border-rose-100 bg-rose-50 text-rose-700",
      };
    case "COMPLETED":
      return {
        label: "Đã cân bằng",
        className: "border-blue-100 bg-blue-50 text-blue-700",
      };
    case "CANCELLED":
      return {
        label: "Đã hủy",
        className: "border-slate-200 bg-slate-100 text-slate-600",
      };
    default:
      return {
        label: "Nháp",
        className: "border-slate-200 bg-slate-50 text-slate-600",
      };
  }
};

const isInternalEmployee = (employee: any) => {
  const roleSlug = String(employee?.role?.slug || "").toLowerCase();
  return roleSlug !== "user" && roleSlug !== "customer";
};

export default function InventoryUpsert({
  mode,
  initialData,
  code,
}: InventoryUpsertProps) {
  const router = useRouter();
  const { data: user, isLoading: isCurrentUserLoading } = useCurrentUser();
  const warehouseId = useAuthStore((state) => state.warehouseId);
  const { hasPermission } = usePermissions();
  const canViewEmployees = hasPermission(P.STAFF_VIEW);
  const isAdmin = isAdminRole(user?.role);
  const currentUserBranchId =
    user?.branch?.id ?? (user as any)?.branchId ?? warehouseId ?? null;

  const [loading, setLoading] = useState(mode !== "create");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [branches, setBranches] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [employeesLoaded, setEmployeesLoaded] = useState(false);
  const [employeesLoading, setEmployeesLoading] = useState(false);
  const [currentCheckId, setCurrentCheckId] = useState<number | string | null>(
    initialData?.id ?? null,
  );
  const [workflowStatus, setWorkflowStatus] = useState<CheckWorkflowStatus>(
    getWorkflowStatus(initialData?.checkWorkflowStatus || initialData?.status),
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [resultFilter, setResultFilter] = useState("ALL");
  const stockFilter = "ALL";
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>(
    {},
  );
  const [showZeroStockLots, setShowZeroStockLots] = useState(false);
  const [noteDialogIndex, setNoteDialogIndex] = useState<number | null>(null);
  const [noteDraft, setNoteDraft] = useState("");
  const [formErrors, setFormErrors] = useState<{
    branchId?: string;
    items?: string;
  }>({});

  const [formData, setFormData] = useState({
    type: initialData?.type || "PERIODIC",
    branchId: initialData?.branchId?.toString() || "",
    scopeType: normalizeScopeType(initialData?.scopeType),
    code:
      initialData?.code ||
      code ||
      (mode === "create" ? generatePKKCode() : "---"),
    checkDate: initialData?.checkDate || new Date().toISOString().split("T")[0],
    checkedBy: initialData?.checkedBy || "",
    createdByName: initialData?.createdByName || user?.fullName || "Admin",
    note: initialData?.note || "",
  });

  const [items, setItems] = useState<CheckItem[]>(
    (initialData?.details || []).map(mapItem),
  );

  const searchResultGroups = useMemo(() => {
    const groupedMap = new Map<
      string,
      {
        key: string;
        sku: string;
        name: string;
        unit: string;
        totalQuantity: number;
        lotCount: number;
        hasZeroStockLot: boolean;
        earliestExpiryDate: string | null;
        products: any[];
      }
    >();

    searchResults.forEach((product) => {
      const key = getSkuGroupIdentity(product);
      const existingGroup = groupedMap.get(key);
      const quantity = Math.max(0, toNumber(product.quantity));
      const expiryDate = product.expiryDate ? String(product.expiryDate) : null;

      if (existingGroup) {
        existingGroup.products.push(product);
        existingGroup.totalQuantity += quantity;
        existingGroup.lotCount += 1;
        existingGroup.hasZeroStockLot =
          existingGroup.hasZeroStockLot || quantity <= 0;

        if (
          expiryDate &&
          (!existingGroup.earliestExpiryDate ||
            expiryDate < existingGroup.earliestExpiryDate)
        ) {
          existingGroup.earliestExpiryDate = expiryDate;
        }
        return;
      }

      groupedMap.set(key, {
        key,
        sku: product.sku || "N/A",
        name: product.productName || product.name || "N/A",
        unit: product.unit || "Cái",
        totalQuantity: quantity,
        lotCount: 1,
        hasZeroStockLot: quantity <= 0,
        earliestExpiryDate: expiryDate,
        products: [product],
      });
    });

    return Array.from(groupedMap.values());
  }, [searchResults]);

  const fallbackEmployees = useMemo(() => {
    if (!user?.fullName) return [];

    return [
      {
        id: user.id ?? "current-user",
        fullName: user.fullName,
        username: user.email ?? "",
        role: user.role ?? null,
      },
    ].filter(isInternalEmployee);
  }, [user]);

  useEffect(() => {
    if (isCurrentUserLoading) return;
    void fetchBranches();
  }, [currentUserBranchId, isAdmin, isCurrentUserLoading]);

  useEffect(() => {
    if (mode !== "create" && !initialData && code) {
      void fetchDetail();
    } else if (mode === "create") {
      setLoading(false);
    }
  }, [code, initialData, mode]);

  const fetchBranches = async () => {
    try {
      const res = await branchService.getAll();
      const rawList = Array.isArray(res) ? res : res?.content || [];
      const list =
        !isAdmin
          ? rawList.filter(
              (branch: any) =>
                currentUserBranchId != null &&
                String(branch.id) === String(currentUserBranchId),
            )
          : rawList;
      setBranches(list);
      if (list.length === 0) return;
      setFormData((prev) => {
        const hasSelectedBranch = list.some(
          (branch: any) => String(branch.id) === String(prev.branchId),
        );
        if (hasSelectedBranch) return prev;

        const defaultBranchId =
          !isAdmin && currentUserBranchId != null
            ? String(currentUserBranchId)
            : String(list[0].id);

        if (!isAdmin && currentUserBranchId === null) return prev;
        if (!defaultBranchId || prev.branchId === defaultBranchId) return prev;
        return { ...prev, branchId: defaultBranchId };
      });
    } catch {
      toast.error("Không thể tải danh sách chi nhánh");
    }
  };

  const fetchEmployees = async () => {
    if (employeesLoaded || employeesLoading) return;
    if (!canViewEmployees) {
      setEmployees(fallbackEmployees);
      setEmployeesLoaded(true);
      return;
    }

    try {
      setEmployeesLoading(true);
      const res = await EmployeeService.getAll({ status: "ACTIVE", size: 100 });
      const list = Array.isArray(res) ? res : res?.content || [];
      setEmployees(list.filter(isInternalEmployee));
      setEmployeesLoaded(true);
    } catch (error) {
      console.error("Error fetching employees:", error);
      setEmployees(fallbackEmployees);
      setEmployeesLoaded(true);
    } finally {
      setEmployeesLoading(false);
    }
  };

  const fetchDetail = async () => {
    try {
      setLoading(true);
      const res = await InventoryCheckApiService.getDetail(code!);
      const formattedDate = res.checkDate
        ? res.checkDate.split("T")[0]
        : res.createdAt
          ? res.createdAt.split("T")[0]
          : new Date().toISOString().split("T")[0];

      setCurrentCheckId(res.id ?? null);
      setFormData({
        type: res.type || "PERIODIC",
        branchId: res.branchId?.toString() || "",
        scopeType: normalizeScopeType(res.scopeType),
        code: res.code || code || "---",
        checkDate: formattedDate,
        checkedBy: res.checkedBy || "",
        createdByName: res.createdByName || "Admin",
        note: res.note || "",
      });
      setItems((res.details || []).map(mapItem));
      setWorkflowStatus(getWorkflowStatus(res.checkWorkflowStatus || res.status));
    } catch (error) {
      console.error("Error fetching detail:", error);
      toast.error("Không thể tải chi tiết phiếu");
    } finally {
      setLoading(false);
    }
  };

  const loadBranchSnapshot = async (branchId: string) => {
    if (!branchId) return;
    try {
      setIsSearching(true);
      const data = await InventoryCheckApiService.searchProducts("", branchId);
      const productList = Array.isArray(data) ? data : data?.content || [];
      setItems(productList.map(mapItem));
      setSelectedProductIds([]);
      setSearchResults([]);
      setWorkflowStatus("DRAFT");
    } catch (error) {
      console.error(error);
      toast.error("Không thể lấy số tồn kho hiện tại của chi nhánh này");
    } finally {
      setIsSearching(false);
    }
  };

  useEffect(() => {
    if (mode !== "create" || !formData.branchId) return;
    if (formData.scopeType === "FULL_WAREHOUSE") {
      void loadBranchSnapshot(formData.branchId);
      return;
    }

    setItems([]);
    setSelectedProductIds([]);
    setSearchResults([]);
  }, [formData.branchId, formData.scopeType, mode]);

  const handleBranchChange = (value: string) => {
    setFormData((prev) => ({ ...prev, branchId: value }));
    setFormErrors((prev) => ({ ...prev, branchId: undefined, items: undefined }));
    setSearchTerm("");
    setSelectedProductIds([]);
    setSearchResults([]);

    if (!canEditDraftContent || mode === "create") return;

    if (formData.scopeType === "FULL_WAREHOUSE" && value) {
      void loadBranchSnapshot(value);
      return;
    }

    setItems([]);
  };

  const handleScopeTypeChange = (value: InventoryCheckScopeType) => {
    const nextScopeType = normalizeScopeType(value);
    setFormData((prev) => ({ ...prev, scopeType: nextScopeType }));
    setFormErrors((prev) => ({ ...prev, items: undefined }));
    setSearchTerm("");
    setSelectedProductIds([]);
    setSearchResults([]);

    if (!canEditDraftContent) return;

    if (nextScopeType === "FULL_WAREHOUSE") {
      if (formData.branchId && mode !== "create") {
        void loadBranchSnapshot(formData.branchId);
      }
      return;
    }

    setItems([]);
  };

  const handleSearchProduct = async (term: string) => {
    if (!term.trim()) {
      setSearchResults([]);
      return;
    }
    if (!formData.branchId) {
      toast.warning("Vui lòng chọn kho trước khi tìm sản phẩm");
      return;
    }
    setIsSearching(true);
    try {
      const data = await InventoryCheckApiService.searchProducts(
        term,
        formData.branchId,
      );
      const productList = Array.isArray(data) ? data : data?.content || [];
      setSearchResults(productList);
    } catch (error) {
      console.error(error);
      toast.error("Không thể tìm kiếm sản phẩm");
    } finally {
      setIsSearching(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchTerm.trim()) {
        handleSearchProduct(searchTerm);
      } else {
        setSearchResults([]);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm, formData.branchId]);

  const addItems = (variants: any[]) => {
    if (variants.length === 0) return;

    let addedCount = 0;
    let skippedCount = 0;
    let hasInvalidVariant = false;

    setItems((prev) => {
      const nextItems = [...prev];

      variants.forEach((variant) => {
        const variantId = getVariantId(variant);
        if (variantId == null) {
          hasInvalidVariant = true;
          return;
        }

        const exists = nextItems.some(
          (item) =>
            String(item.productVariantId) === String(variantId) &&
            String(item.batchNumber ?? "") === String(variant.batchNumber ?? "") &&
            String(item.importPrice ?? "") === String(variant.importPrice ?? ""),
        );

        if (exists) {
          skippedCount += 1;
          return;
        }

        nextItems.unshift(mapItem(variant));
        addedCount += 1;
      });

      return nextItems;
    });

    if (hasInvalidVariant) {
      toast.error("Không xác định được biến thể sản phẩm cho dòng tồn này");
    }

    if (addedCount === 0 && skippedCount > 0) {
      toast.warning("Các lô của SKU này đã có trong phiếu kiểm kê");
      return;
    }

    if (addedCount > 0 && skippedCount > 0) {
      toast.info(`Đã thêm ${addedCount} lô mới, bỏ qua ${skippedCount} lô đã có`);
    }

    setFormErrors((prev) => ({ ...prev, items: undefined }));
  };

  const toggleSelectedProduct = (productIdentity: string) => {
    setSelectedProductIds((prev) =>
      prev.includes(productIdentity)
        ? prev.filter((id) => id !== productIdentity)
        : [...prev, productIdentity],
    );
  };

  const handleAddSearchGroup = (variants: any[]) => {
    addItems(variants);
    setSearchTerm("");
    setSearchResults([]);
    setSelectedProductIds([]);
  };

  const handleAddSelectedProducts = () => {
    const selectedGroups = searchResultGroups.filter((group) =>
      selectedProductIds.includes(group.key),
    );
    if (selectedGroups.length === 0) {
      toast.warning("Vui lòng chọn ít nhất một sản phẩm");
      return;
    }
    selectedGroups.forEach((group) => addItems(group.products));
    setSearchTerm("");
    setSearchResults([]);
    setSelectedProductIds([]);
  };

  const updateItem = (index: number, field: keyof CheckItem, value: string) => {
    setItems((prev) =>
      prev.map((item, itemIndex) => {
        if (itemIndex !== index) return item;
        if (field === "quantityReal") {
          if (value === "") {
            return { ...item, quantityReal: null, quantityRejected: 0 };
          }

          const nextQuantityReal = Math.max(0, toNumber(value));
          return {
            ...item,
            quantityReal: nextQuantityReal,
            quantityRejected: Math.min(
              nextQuantityReal,
              toNumber(item.quantityRejected, 0),
            ),
          };
        }

        if (field === "quantityRejected") {
          const nextQuantityRejected = Math.max(0, toNumber(value));
          return {
            ...item,
            quantityRejected: Math.min(
              getEffectiveQuantityReal(item) ?? 0,
              nextQuantityRejected,
            ),
          };
        }

        if (field === "systemQuantity" || field === "minThreshold") {
          return { ...item, [field]: Math.max(0, toNumber(value)) };
        }
        return { ...item, [field]: value };
      }),
    );
  };

  const openNoteDialog = (index: number) => {
    setNoteDialogIndex(index);
    setNoteDraft(items[index]?.reason || "");
  };

  const closeNoteDialog = () => {
    setNoteDialogIndex(null);
    setNoteDraft("");
  };

  const revealInvalidItems = (invalidItems: CheckItem[]) => {
    if (invalidItems.length === 0) return;

    setShowZeroStockLots(true);
    setExpandedGroups((prev) => {
      const next = { ...prev };
      invalidItems.forEach((item) => {
        next[getSkuGroupIdentity(item)] = true;
      });
      return next;
    });
  };

  const saveNoteDialog = () => {
    if (noteDialogIndex === null) return;
    updateItem(noteDialogIndex, "reason", noteDraft);
    closeNoteDialog();
  };

  const removeItem = (index: number) => {
    setItems((prev) => prev.filter((_, itemIndex) => itemIndex !== index));
  };

  const updateGroupMinThreshold = (groupKey: string, value: string) => {
    setItems((prev) =>
      prev.map((item) =>
        getSkuGroupIdentity(item) === groupKey
          ? {
              ...item,
              minThreshold:
                value === "" ? 0 : Math.max(0, toNumber(value, item.minThreshold)),
            }
          : item,
      ),
    );
  };

  const removeGroup = (groupKey: string) => {
    const confirmed = window.confirm(
      "Bạn có chắc muốn xóa toàn bộ các lô của SKU này khỏi phiếu kiểm kê không?",
    );
    if (!confirmed) return;

    setItems((prev) =>
      prev.filter((item) => getSkuGroupIdentity(item) !== groupKey),
    );
  };

  const branchName = useMemo(
    () =>
      branches.find((branch) => String(branch.id) === String(formData.branchId))
        ?.name || "ARGISHRIMP CHI NHÁNH CẦN THƠ",
    [branches, formData.branchId],
  );

  const checkedByNames = useMemo<string[]>(
    () =>
      formData.checkedBy.split(", ").filter((name: string) => Boolean(name)),
    [formData.checkedBy],
  );

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const metrics = getItemMetrics(item);
      const badge = getItemBadge(item);

      const matchesResult =
        resultFilter === "ALL" ||
        (resultFilter === "MATCHED" && badge.label === "Khớp kho") ||
        (resultFilter === "REPLENISH" && badge.label === "Cần nhập") ||
        (resultFilter === "DAMAGED" && badge.label === "Hư hại") ||
        (resultFilter === "DIFF" && badge.label === "Chênh lệch");

      const matchesStock =
        stockFilter === "ALL" ||
        (stockFilter === "HAS_DAMAGE" && metrics.rejectedQty > 0) ||
        (stockFilter === "LOW_STOCK" && metrics.suggestedImport > 0) ||
        (stockFilter === "HAS_DIFF" && metrics.diffQty !== 0) ||
        (stockFilter === "ENOUGH" &&
          metrics.rejectedQty === 0 &&
          metrics.suggestedImport === 0 &&
          metrics.diffQty === 0);

      return matchesResult && matchesStock;
    });
  }, [items, resultFilter, stockFilter]);

  const groupedItems = useMemo(() => {
    const groupedMap = new Map<
      string,
      {
        key: string;
        productVariantId: number | string;
        sku: string;
        name: string;
        unit: string;
        entries: Array<{
          index: number;
          item: CheckItem;
          metrics: CheckItemMetrics;
          badge: ReturnType<typeof getLotBadge>;
          isExpired: boolean;
        }>;
      }
    >();

    items.forEach((item, index) => {
      const groupKey = getSkuGroupIdentity(item);
      const entry = {
        index,
        item,
        metrics: getItemMetrics(item),
        badge: getLotBadge(item),
        isExpired: isExpiredLot(item.expiryDate),
      };
      const existingGroup = groupedMap.get(groupKey);

      if (existingGroup) {
        existingGroup.entries.push(entry);
        return;
      }

      groupedMap.set(groupKey, {
        key: groupKey,
        productVariantId: item.productVariantId,
        sku: item.sku,
        name: item.name,
        unit: item.unit,
        entries: [entry],
      });
    });

    return Array.from(groupedMap.values()).map((group) => {
      const metrics = getGroupMetrics(group.entries.map((entry) => entry.item));
      const visibleEntries = showZeroStockLots
        ? group.entries
        : group.entries.filter((entry) => entry.metrics.systemQty > 0);

      return {
        ...group,
        metrics,
        badge: getBadgeFromMetrics(metrics),
        hasUnchecked: group.entries.some(
          (entry) => getEffectiveQuantityReal(entry.item) === null,
        ),
        hasExpiredLot: group.entries.some((entry) => entry.isExpired),
        totalLots: group.entries.length,
        visibleEntries,
        hiddenZeroStockCount: group.entries.length - visibleEntries.length,
      };
    });
  }, [items, showZeroStockLots]);

  const summary = useMemo(
    () =>
      groupedItems.reduce(
        (acc, group) => {
          acc.systemQty += group.metrics.systemQty;
          acc.realQty += group.metrics.realQty;
          acc.rejectedQty += group.metrics.rejectedQty;
          acc.usableQty += group.metrics.usableQty;
          acc.suggestedImport += group.metrics.suggestedImport;
          if (group.metrics.rejectedQty > 0) acc.damagedLines += 1;
          if (group.metrics.suggestedImport > 0) acc.replenishmentLines += 1;
          if (group.metrics.diffQty !== 0) acc.diffLines += 1;
          return acc;
        },
        {
          systemQty: 0,
          realQty: 0,
          rejectedQty: 0,
          usableQty: 0,
          suggestedImport: 0,
          damagedLines: 0,
          replenishmentLines: 0,
          diffLines: 0,
        },
      ),
    [groupedItems],
  );

  const filteredGroups = useMemo(() => {
    return groupedItems.filter((group) => {
      const matchesResult =
        resultFilter === "ALL" ||
        (resultFilter === "MATCHED" &&
          group.metrics.rejectedQty === 0 &&
          group.metrics.suggestedImport === 0 &&
          group.metrics.diffQty === 0) ||
        (resultFilter === "REPLENISH" && group.metrics.suggestedImport > 0) ||
        (resultFilter === "DAMAGED" && group.metrics.rejectedQty > 0) ||
        (resultFilter === "DIFF" &&
          group.metrics.diffQty !== 0 &&
          group.metrics.rejectedQty === 0 &&
          group.metrics.suggestedImport === 0);

      const matchesStock =
        stockFilter === "ALL" ||
        (stockFilter === "HAS_DAMAGE" && group.metrics.rejectedQty > 0) ||
        (stockFilter === "LOW_STOCK" && group.metrics.suggestedImport > 0) ||
        (stockFilter === "HAS_DIFF" && group.metrics.diffQty !== 0) ||
        (stockFilter === "ENOUGH" &&
          group.metrics.rejectedQty === 0 &&
          group.metrics.suggestedImport === 0 &&
          group.metrics.diffQty === 0);

      return matchesResult && matchesStock;
    });
  }, [groupedItems, resultFilter, stockFilter]);

  useEffect(() => {
    setExpandedGroups((prev) => {
      const next = groupedItems.reduce<Record<string, boolean>>((acc, group) => {
        acc[group.key] = prev[group.key] ?? group.hasUnchecked;
        return acc;
      }, {});

      const prevKeys = Object.keys(prev);
      const nextKeys = Object.keys(next);
      const isUnchanged =
        prevKeys.length === nextKeys.length &&
        nextKeys.every((key) => prev[key] === next[key]);

      return isUnchanged ? prev : next;
    });
  }, [groupedItems]);

  const handleExportExcel = () => {
    const lowStockItems = groupedItems
      .map((group, index) => {
        if (group.metrics.suggestedImport <= 0) return null;
        return {
          stt: index + 1,
          sku: group.sku,
          name: group.name,
          currentQty: group.metrics.usableQty,
          minThreshold: group.metrics.minThreshold,
        };
      })
      .filter(Boolean) as {
      stt: number;
      sku: string;
      name: string;
      currentQty: number;
      minThreshold: number;
    }[];

    if (lowStockItems.length === 0) {
      toast.info("Hiện chưa có sản phẩm nào dưới định mức tồn kho");
      return;
    }

    const now = new Date();
    const time = now.toLocaleTimeString("vi-VN");
    const date = now.toLocaleDateString("vi-VN");
    const rows = [
      ["BÁO CÁO CHI TIẾT SẢN PHẨM DƯỚI ĐỊNH MỨC TỒN KHO"],
      [`Chi nhánh: ${String(branchName).toUpperCase()}`],
      [`Thời gian xuất: ${time} ${date}`],
      [],
      ["STT", "SKU", "Tên sản phẩm", "Tồn hiện tại", "Định mức"],
      ...lowStockItems.map((item) => [
        item.stt,
        item.sku,
        item.name,
        item.currentQty,
        item.minThreshold,
      ]),
    ];

    const ws = XLSX.utils.aoa_to_sheet(rows);
    ws["!merges"] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: 4 } },
      { s: { r: 1, c: 0 }, e: { r: 1, c: 4 } },
      { s: { r: 2, c: 0 }, e: { r: 2, c: 4 } },
    ];
    ws["!cols"] = [
      { wch: 8 },
      { wch: 18 },
      { wch: 42 },
      { wch: 15 },
      { wch: 15 },
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Báo cáo tồn");
    XLSX.writeFile(wb, `bao-cao-ton-duoi-dinh-muc-${Date.now()}.xlsx`);
    toast.success("Đã xuất file Excel danh sách cần nhập thêm");
  };

  const handleSubmit = async () => {
    if (!formData.branchId) {
      setFormErrors((prev) => ({
        ...prev,
        branchId: "Vui lòng chọn kho kiểm kê",
      }));
      return;
    }
    if (items.length === 0) {
      setFormErrors((prev) => ({
        ...prev,
        items: "Vui lòng thêm ít nhất một sản phẩm",
      }));
      return;
    }
    setFormErrors({});

    setIsSubmitting(true);
    try {
      const payload: any = {
        branchId: Number(formData.branchId),
        type: formData.type,
        scopeType: formData.scopeType,
        checkDate: serializeCheckDateTime(formData.checkDate),
        checkedBy: formData.checkedBy,
        note: formData.note,
        details: buildCheckPayloadDetails(items),
      };

      if (mode === "edit" && currentCheckId) {
        payload.id = currentCheckId;
      }

      await InventoryCheckApiService.saveCheck(payload);
      toast.success(payload.id ? "Cập nhật phiếu kiểm kê thành công" : "Tạo phiếu kiểm kê thành công");
      router.push("/admin/inventory-checks");
    } catch (error) {
      console.error(error);
      toast.error(
        getInventoryCheckErrorMessage(error, "Lỗi khi lưu phiếu kiểm kê"),
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const validateDraftForm = () => {
    if (!formData.branchId) {
      setFormErrors((prev) => ({
        ...prev,
        branchId: "Vui lòng chọn kho kiểm kê",
      }));
      return false;
    }
    if (items.length === 0) {
      setFormErrors((prev) => ({
        ...prev,
        items: "Vui lòng thêm ít nhất một sản phẩm",
      }));
      return false;
    }
    setFormErrors({});
    return true;
  };

  const validateApprovalForm = () => {
    if (!validateDraftForm()) return false;

    const uncheckedItems = getUncheckedCheckItems(items);
    if (uncheckedItems.length > 0) {
      setFormErrors((prev) => ({
        ...prev,
        items:
          uncheckedItems.length === 1
            ? "Vui lòng nhập số lượng thực tế cho tất cả các dòng trước khi gửi duyệt. Hiện còn 1 dòng chưa nhập."
            : `Vui lòng nhập số lượng thực tế cho tất cả các dòng trước khi gửi duyệt. Hiện còn ${uncheckedItems.length} dòng chưa nhập.`,
      }));
      toast.error("Vui lòng nhập đầy đủ số lượng thực tế trước khi gửi duyệt.");
      return false;
    }

    const invalidRejectedItems = getInvalidRejectedCheckItems(items);
    if (invalidRejectedItems.length > 0) {
      revealInvalidItems(invalidRejectedItems);
      setFormErrors((prev) => ({
        ...prev,
        items:
          invalidRejectedItems.length === 1
            ? "Số lượng hư hỏng không được lớn hơn số lượng thực tế. Hiện còn 1 dòng chưa hợp lệ."
            : `Số lượng hư hỏng không được lớn hơn số lượng thực tế. Hiện còn ${invalidRejectedItems.length} dòng chưa hợp lệ.`,
      }));
      toast.error("Số lượng hư hỏng không được lớn hơn số lượng thực tế.");
      return false;
    }

    const missingReasonItems = getMissingReasonCheckItems(items);
    if (missingReasonItems.length > 0) {
      const sampleLabels = missingReasonItems
        .slice(0, 3)
        .map((item) => `${item.sku}${item.batchNumber ? ` (${item.batchNumber})` : ""}`)
        .join(", ");

      revealInvalidItems(missingReasonItems);
      setFormErrors((prev) => ({
        ...prev,
        items:
          missingReasonItems.length === 1
            ? `Vui lòng nhập ghi chú hoặc nguyên nhân cho dòng lệch/hư hỏng trước khi gửi duyệt: ${sampleLabels}.`
            : `Vui lòng nhập ghi chú hoặc nguyên nhân cho ${missingReasonItems.length} dòng lệch/hư hỏng trước khi gửi duyệt. Ví dụ: ${sampleLabels}.`,
      }));
      toast.error(
        missingReasonItems.length === 1
          ? `Dòng ${sampleLabels} đang lệch hoặc có hàng hư nhưng chưa có ghi chú.`
          : `${missingReasonItems.length} dòng đang lệch hoặc có hàng hư nhưng chưa có ghi chú.`,
      );
      return false;
    }

    setFormErrors((prev) => ({
      ...prev,
      items: undefined,
    }));
    return true;
  };

  const saveCurrentCheck = async () => {
    if (!validateDraftForm()) return null;

    const payload: any = {
      branchId: Number(formData.branchId),
      type: formData.type,
      scopeType: formData.scopeType,
      checkDate: serializeCheckDateTime(formData.checkDate),
      checkedBy: formData.checkedBy,
      note: formData.note,
      details: buildCheckPayloadDetails(items),
    };

    if (currentCheckId) {
      payload.id = currentCheckId;
    }

    const saved = await InventoryCheckApiService.saveCheck(payload);
    setCurrentCheckId(saved?.id ?? currentCheckId ?? null);
    return saved;
  };

  const handleStartCheck = async () => {
    try {
      setIsSubmitting(true);
      const saved = await saveCurrentCheck();
      const checkId = saved?.id;
      if (!checkId) {
        toast.error("Không thể xác định phiếu kiểm kê để bắt đầu");
        return;
      }
      const response = await InventoryCheckApiService.startCheck(checkId);
      setWorkflowStatus(
        getWorkflowStatus(response?.checkWorkflowStatus || response?.status),
      );
      toast.success("Đã bắt đầu kiểm kê và lưu lại số tồn kho hiện tại");
      router.push(
        `/admin/inventory-checks/${response?.code || saved?.code || formData.code}?edit=true`,
      );
    } catch (error: any) {
      console.error(error);
      toast.error(getInventoryCheckErrorMessage(error, "Không thể bắt đầu kiểm kê"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitForApproval = async () => {
    if (!validateApprovalForm()) return;

    try {
      setIsSubmitting(true);
      const saved = await saveCurrentCheck();
      const checkId = saved?.id;
      if (checkId == null) {
        toast.error("Không thể xác định phiếu kiểm kê để gửi duyệt");
        return;
      }
      const response = await InventoryCheckApiService.submitForApproval(checkId);
      setWorkflowStatus(
        getWorkflowStatus(response?.checkWorkflowStatus || response?.status),
      );
      toast.success("Đã gửi phiếu kiểm kê sang bước chờ duyệt");
      router.push("/admin/inventory-checks");
    } catch (error) {
      console.error(error);
      toast.error(
        getInventoryCheckErrorMessage(
          error,
          "Không thể gửi duyệt phiếu kiểm kê",
        ),
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleApproveAdjustment = async () => {
    try {
      setIsSubmitting(true);
      let checkId = currentCheckId;
      if (!checkId) {
        const detail = await InventoryCheckApiService.getDetail(formData.code);
        checkId = detail?.id;
      }
      if (!checkId) {
        toast.error("Không tìm thấy phiếu để duyệt cân bằng");
        return;
      }
      const response = await InventoryCheckApiService.approveAdjustment(checkId);
      setWorkflowStatus(
        getWorkflowStatus(response?.checkWorkflowStatus || response?.status),
      );
      toast.success("Đã duyệt cân bằng và áp tồn hệ thống về đúng số thực tế");
      router.push("/admin/inventory-checks");
    } catch (error) {
      console.error(error);
      toast.error("Không thể duyệt cân bằng phiếu kiểm kê");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleComplete = async () => {
    await handleApproveAdjustment();
  };

  const handleRequestRecount = async () => {
    const reason = window.prompt("Nhập lý do yêu cầu kiểm lại phiếu này:");
    if (!reason?.trim()) return;

    try {
      setIsSubmitting(true);
      let checkId = currentCheckId;
      if (!checkId) {
        const detail = await InventoryCheckApiService.getDetail(formData.code);
        checkId = detail?.id;
      }
      if (!checkId) {
        toast.error("Không tìm thấy phiếu để yêu cầu kiểm lại");
        return;
      }

      const response = await InventoryCheckApiService.requestRecount(
        checkId,
        reason.trim(),
      );
      setWorkflowStatus(
        getWorkflowStatus(response?.checkWorkflowStatus || response?.status),
      );
      toast.success("Đã chuyển phiếu sang trạng thái yêu cầu kiểm lại");
      router.push(`/admin/inventory-checks/${response?.code || formData.code}`);
    } catch (error: any) {
      console.error(error);
      toast.error(
        getInventoryCheckErrorMessage(
          error,
          "Không thể yêu cầu kiểm lại phiếu kiểm kê",
        ),
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelCheck = async () => {
    const requiresReason = workflowStatus !== "DRAFT";
    const reason = requiresReason
      ? window.prompt("Nhập lý do hủy phiếu kiểm kê:")
      : "";

    if (requiresReason && !reason?.trim()) return;

    const confirmed = window.confirm(
      "Bạn có chắc muốn hủy phiếu kiểm kê này không?",
    );
    if (!confirmed) return;

    try {
      setIsSubmitting(true);
      let checkId = currentCheckId;
      if (!checkId) {
        const detail = await InventoryCheckApiService.getDetail(formData.code);
        checkId = detail?.id;
      }
      if (!checkId) {
        toast.error("Không tìm thấy phiếu để hủy");
        return;
      }

      const response = await InventoryCheckApiService.cancelCheck(
        checkId,
        reason?.trim() || undefined,
      );
      setWorkflowStatus(
        getWorkflowStatus(response?.checkWorkflowStatus || response?.status),
      );
      toast.success("Đã hủy phiếu kiểm kê");
      router.push("/admin/inventory-checks");
    } catch (error: any) {
      console.error(error);
      toast.error(
        getInventoryCheckErrorMessage(error, "Không thể hủy phiếu kiểm kê"),
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center text-slate-400">
        <Loader2 className="mb-3 h-8 w-8 animate-spin text-blue-600" />
        <p className="text-[11px] uppercase tracking-widest text-slate-400">
          Đang đồng bộ dữ liệu...
        </p>
      </div>
    );
  }

  const pageTitle =
    mode === "create"
      ? "Thêm phiếu kiểm kê mới"
      : mode === "edit"
        ? `Cập nhật phiếu ${formData.code}`
        : `Chi tiết phiếu ${formData.code}`;
  const workflowStatusMeta = getWorkflowStatusMeta(workflowStatus);
  const canEditDraftContent = mode !== "view" && workflowStatus === "DRAFT";
  const canEditCountResults =
    mode !== "view" &&
    (workflowStatus === "COUNTING" || workflowStatus === "RECOUNT_REQUIRED");
  const canEditCheck = canEditDraftContent || canEditCountResults;
  const canEditFromView =
    workflowStatus === "DRAFT" ||
    workflowStatus === "COUNTING" ||
    workflowStatus === "RECOUNT_REQUIRED";
  const isFullWarehouseScope = formData.scopeType === "FULL_WAREHOUSE";
  const isSelectedScope = formData.scopeType === "SELECTED_VARIANTS";
  const toggleGroupExpansion = (groupKey: string) => {
    setExpandedGroups((prev) => ({
      ...prev,
      [groupKey]: !prev[groupKey],
    }));
  };
  const expandAllGroups = () => {
    setExpandedGroups(
      groupedItems.reduce<Record<string, boolean>>((acc, group) => {
        acc[group.key] = true;
        return acc;
      }, {}),
    );
  };
  const collapseAllGroups = () => {
    setExpandedGroups(
      groupedItems.reduce<Record<string, boolean>>((acc, group) => {
        acc[group.key] = false;
        return acc;
      }, {}),
    );
  };

  return (
    <div className="space-y-3 pb-[100px] text-slate-800">
      <div className="mt-2 mb-8 space-y-4 px-1">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <h1 className="text-[20px] font-semibold tracking-tight uppercase text-slate-900">
              {pageTitle}
            </h1>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {workflowStatus !== "DRAFT" && (
              <Badge
                className={cn(
                  "rounded-[4px] border px-3 py-1 text-[11px] font-medium shadow-none",
                  workflowStatusMeta.className,
                )}
              >
                {normalizeViText(workflowStatusMeta.label)}
              </Badge>
            )}
            <Button
              variant="outline"
              className="h-[38px] border-slate-200 bg-white px-4 text-[13px] font-medium text-slate-600 shadow-none hover:bg-blue-50 hover:text-blue-600"
              onClick={handleExportExcel}
            >
              <FileSpreadsheet size={14} className="mr-2" />
              Xuất Excel
            </Button>
          </div>
        </div>

        <div className="bg-white border border-slate-200 p-6 shadow-sm">
          <div className="border-b border-slate-200 pb-3">
            <span className="text-[11px] font-bold text-slate-800">
              1. Thông tin phiếu kiểm kê
            </span>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-12">
            <div className="space-y-1.5 xl:col-span-4">
              <Label className="text-[10px] font-medium text-slate-400">
                Loại kiểm kê
              </Label>
              <Select
                disabled={!canEditDraftContent}
                value={formData.type}
                onValueChange={(value) =>
                  setFormData((prev) => ({ ...prev, type: value }))
                }
              >
                <SelectTrigger className="h-9 rounded-md border-slate-200 bg-white text-[13px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PERIODIC">Định kỳ</SelectItem>
                  <SelectItem value="UNEXPECTED">Đột xuất</SelectItem>
                  <SelectItem value="YEAR_END">Cuối năm</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5 xl:col-span-4">
              <Label className="text-[10px] font-medium text-slate-400">
                Kho kiểm kê
              </Label>
              <Select
                disabled={!canEditDraftContent}
                value={formData.branchId}
                onValueChange={handleBranchChange}
              >
                <SelectTrigger
                  className={cn(
                    "h-9 rounded-md border-slate-200 bg-white text-[13px]",
                    formErrors.branchId && "border-rose-500",
                  )}
                >
                  <SelectValue placeholder="Chọn kho kiểm kê" />
                </SelectTrigger>
                <SelectContent>
                  {branches.map((branch) => (
                    <SelectItem key={branch.id} value={String(branch.id)}>
                      {branch.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {formErrors.branchId && (
                <p className="mt-1 text-[10px] font-medium text-rose-500">
                  {formErrors.branchId}
                </p>
              )}
            </div>

            <div className="space-y-1.5 xl:col-span-4">
              <Label className="text-[10px] font-medium text-slate-400">
                Số chứng từ
              </Label>
              <div className="flex h-9 items-center rounded-md border border-slate-200 bg-slate-50 px-3 text-[13px] font-medium text-slate-700">
                {formData.code}
              </div>
            </div>

            <div className="space-y-1.5 xl:col-span-4">
              <Label className="text-[10px] font-medium text-slate-400">
                Ngày kiểm kê
              </Label>
              <SharedDatePicker
                disabled={!canEditDraftContent}
                value={formData.checkDate}
                onChange={(nextValue) =>
                  setFormData((prev) => ({
                    ...prev,
                    checkDate: nextValue,
                  }))
                }
                placeholder="Chọn ngày kiểm kê"
                variant="compact"
                buttonClassName="h-9 rounded-md border-slate-200 bg-white text-[13px]"
              />
            </div>

            <div className="space-y-1.5 xl:col-span-4">
              <Label className="text-[10px] font-medium text-slate-400">
                Người kiểm kê
              </Label>
              <Select
                disabled={!canEditDraftContent}
                value=""
                onOpenChange={(open) => {
                  if (open) {
                    void fetchEmployees();
                  }
                }}
                onValueChange={(value) => {
                  const employee = employees.find(
                    (item) => item.fullName === value || item.username === value,
                  );
                  const name = employee?.fullName || value;
                  if (checkedByNames.includes(name)) return;
                  setFormData((prev) => ({
                    ...prev,
                    checkedBy: prev.checkedBy
                      ? `${prev.checkedBy}, ${name}`
                      : name,
                  }));
                }}
              >
                <SelectTrigger className="h-9 rounded-md border-slate-200 bg-white text-[13px]">
                  <SelectValue placeholder="Thêm người kiểm kê" />
                </SelectTrigger>
                <SelectContent>
                  {employeesLoading && employees.length === 0 && (
                    <SelectItem value="__loading" disabled>
                      Đang tải danh sách nhân viên...
                    </SelectItem>
                  )}
                  {employees.map((employee) => (
                    <SelectItem key={employee.id} value={employee.fullName}>
                      {employee.fullName}
                      {employee.username?.trim()
                        ? ` (${employee.username})`
                        : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {checkedByNames.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {checkedByNames.map((name) => (
                    <Badge
                      key={name}
                      className="gap-1 rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] font-normal text-slate-700"
                    >
                      {name}
                      {canEditDraftContent && (
                        <X
                          size={12}
                          className="cursor-pointer text-slate-400 hover:text-rose-500"
                          onClick={() =>
                            setFormData((prev) => ({
                              ...prev,
                              checkedBy: checkedByNames
                                .filter((item) => item !== name)
                                .join(", "),
                            }))
                          }
                        />
                      )}
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-1.5 xl:col-span-4">
              <Label className="text-[10px] font-medium text-slate-400">
                Người tạo
              </Label>
              <div className="flex h-9 items-center rounded-md border border-slate-200 bg-slate-50 px-3 text-[13px] font-medium text-slate-700">
                {formData.createdByName}
              </div>
            </div>

            <div className="space-y-1.5 xl:col-span-12">
              <Label className="text-[10px] font-medium text-slate-400">
                Phạm vi kiểm kê
              </Label>
              <Select
                disabled={!canEditDraftContent}
                value={formData.scopeType}
                onValueChange={(value) =>
                  handleScopeTypeChange(value as InventoryCheckScopeType)
                }
              >
                <SelectTrigger className="h-9 rounded-md border-slate-200 bg-white text-[13px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="FULL_WAREHOUSE">Toàn bộ kho</SelectItem>
                  <SelectItem value="SELECTED_VARIANTS">
                    Một số sản phẩm / SKU
                  </SelectItem>
                </SelectContent>
              </Select>
              <p className="mt-1 text-[10px] text-slate-400">
                {isFullWarehouseScope
                  ? "Phiếu sẽ lưu lại số tồn kho hiện tại của toàn bộ kho khi bắt đầu kiểm kê."
                  : "Chỉ các SKU được chọn mới thuộc phạm vi kiểm kê và bị khóa giao dịch tồn kho."}
              </p>
            </div>

            <div className="space-y-1.5 xl:col-span-12">
              <Label className="text-[10px] font-medium text-slate-400">
                Ghi chú phiếu
              </Label>
              <Input
                disabled={!canEditDraftContent}
                className="h-9 rounded-md border-slate-200 bg-white text-[13px]"
                placeholder="Mô tả đợt kiểm kê hoặc lưu ý xử lý tồn kho..."
                value={formData.note}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, note: e.target.value }))
                }
              />
            </div>
          </div>
        </div>

        <div className="bg-white border border-slate-200 p-6 shadow-sm">
          <div className="border-b border-slate-200 pb-3">
            <span className="text-[11px] font-bold text-slate-800">
              2. Danh sách sản phẩm kiểm kê
            </span>
          </div>

          <div className="mt-5 grid grid-cols-1 gap-2.5 xl:grid-cols-4">
            <div className="rounded-md border border-slate-200 bg-slate-50 p-2.5">
              <p className="text-[10px] font-medium text-slate-400">Tồn hệ thống</p>
              <p className="mt-1 text-[21px] font-semibold tracking-tight text-slate-900">
                {formatNumber(summary.systemQty)}
              </p>
            </div>
            <div className="rounded-md border border-slate-200 bg-slate-50 p-2.5">
              <p className="text-[10px] font-medium text-slate-400">Tồn khả dụng sau kiểm</p>
              <p className="mt-1 text-[21px] font-semibold tracking-tight text-slate-900">
                {formatNumber(summary.usableQty)}
              </p>
            </div>
            <div className="rounded-md border border-slate-200 bg-slate-50 p-2.5">
              <p className="text-[10px] font-medium text-slate-400">Đơn vị hư hại</p>
              <p className="mt-1 text-[21px] font-semibold tracking-tight text-slate-900">
                {formatNumber(summary.rejectedQty)}
              </p>
              <p className="mt-0.5 text-[10px] text-slate-500">
                {summary.damagedLines} dòng có hư hại
              </p>
            </div>
            <div className="rounded-md border border-slate-200 bg-slate-50 p-2.5">
              <p className="text-[10px] font-medium text-slate-400">Cần nhập thêm</p>
              <p className="mt-1 text-[21px] font-semibold tracking-tight text-slate-900">
                {formatNumber(summary.suggestedImport)}
              </p>
              <p className="mt-0.5 text-[10px] text-slate-500">
                {summary.replenishmentLines} dòng dưới định mức
              </p>
            </div>
          </div>

          <div className="mt-6 border-t border-slate-200 pt-6" />

          <div className="mt-5 flex flex-col gap-3 xl:flex-row xl:items-center">
            <div className="w-full xl:flex-1">
              <p className="text-[11px] font-medium text-slate-600">
                {isFullWarehouseScope
                  ? "Phiếu đang kiểm kê toàn bộ SKU hiện có của kho được chọn."
                  : "Phiếu chỉ kiểm kê các SKU bạn chủ động thêm vào danh sách bên dưới."}
              </p>
              <p className="mt-1 text-[10px] text-slate-400">
                Phạm vi hiện tại: {getScopeTypeLabel(formData.scopeType)}
              </p>
            </div>

            {canEditDraftContent && isSelectedScope && (
              <div className="relative w-full xl:max-w-[420px] xl:flex-1">
                <Search
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  size={16}
                />
                <Input
                  className="h-9 rounded-md border-slate-200 bg-white pl-9 pr-9 text-sm"
                  placeholder="Tìm SKU hoặc tên sản phẩm để thêm..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                {isSearching && (
                  <Loader2
                    className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-slate-400"
                    size={15}
                  />
                )}

                {searchResultGroups.length > 0 && (
                  <div className="absolute left-0 right-0 top-[calc(100%+6px)] z-50 overflow-hidden rounded-md border border-slate-200 bg-white shadow-lg">
                    <div className="flex items-center justify-between gap-3 border-b bg-slate-50 px-3 py-2 text-xs">
                      <span className="text-slate-500">
                        Đã chọn{" "}
                        <span className="font-bold text-slate-700">
                          {selectedProductIds.length}
                        </span>{" "}
                        SKU
                      </span>
                      <Button
                        type="button"
                        size="sm"
                        className="h-7 text-[11px]"
                        onClick={handleAddSelectedProducts}
                      >
                        Thêm đã chọn
                      </Button>
                    </div>
                    <div className="max-h-[320px] overflow-y-auto">
                      {searchResultGroups.map((group) => (
                        <div
                          key={group.key}
                          role="button"
                          tabIndex={0}
                          className="flex cursor-pointer items-center justify-between gap-3 border-b border-slate-100 px-3 py-2.5 text-left transition hover:bg-slate-50 focus:bg-slate-50 focus:outline-none"
                          onClick={() => handleAddSearchGroup(group.products)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                              e.preventDefault();
                              handleAddSearchGroup(group.products);
                            }
                          }}
                        >
                          <div className="flex items-center gap-2">
                            <div
                              onClick={(e) => e.stopPropagation()}
                              className="flex items-center"
                            >
                              <Checkbox
                                checked={selectedProductIds.includes(group.key)}
                                onCheckedChange={() =>
                                  toggleSelectedProduct(group.key)
                                }
                              />
                            </div>
                            <div>
                              <p className="text-sm font-medium text-slate-900">
                                {group.name}
                              </p>
                              <p className="mt-1 text-xs text-slate-500">
                                SKU: {group.sku} | tổng tồn:{" "}
                                {formatNumber(group.totalQuantity)} | {group.lotCount} lô
                              </p>
                              <p className="mt-1 text-[11px] text-slate-400">
                                HSD gần nhất:{" "}
                                {formatExpiryDate(group.earliestExpiryDate)}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {group.hasZeroStockLot && (
                              <Badge className="rounded-md border border-amber-100 bg-amber-50 text-[10px] font-medium text-amber-700">
                                Có lô hết hàng
                              </Badge>
                            )}
                            <Badge className="rounded-md border border-slate-200 bg-slate-50 text-[10px] font-medium text-slate-700">
                              Thêm toàn bộ lô
                            </Badge>
                            <Plus size={16} className="text-blue-600" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            <Select value={resultFilter} onValueChange={setResultFilter}>
              <SelectTrigger className="h-9 w-full rounded-md border-slate-200 bg-white text-[12px] xl:w-[170px]">
                <SelectValue placeholder="Lọc kết luận" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Tất cả kết luận</SelectItem>
                <SelectItem value="MATCHED">Khớp kho</SelectItem>
                <SelectItem value="REPLENISH">Cần nhập</SelectItem>
                <SelectItem value="DAMAGED">Hư hại</SelectItem>
                <SelectItem value="DIFF">Chênh lệch</SelectItem>
              </SelectContent>
            </Select>

          </div>

          <div className="mt-4 flex flex-col gap-3 rounded-md border border-slate-200 bg-slate-50/70 p-3 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                variant="outline"
                className="h-8 rounded-md border-slate-200 bg-white px-3 text-[11px] font-medium text-slate-700"
                onClick={expandAllGroups}
              >
                <ChevronDown size={14} className="mr-1.5" />
                Mở rộng tất cả
              </Button>
              <Button
                type="button"
                variant="outline"
                className="h-8 rounded-md border-slate-200 bg-white px-3 text-[11px] font-medium text-slate-700"
                onClick={collapseAllGroups}
              >
                <ChevronUp size={14} className="mr-1.5" />
                Thu gọn tất cả
              </Button>
              <label className="flex items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-[11px] font-medium text-slate-700">
                <Checkbox
                  checked={showZeroStockLots}
                  onCheckedChange={(checked) =>
                    setShowZeroStockLots(Boolean(checked))
                  }
                />
                {showZeroStockLots ? (
                  <Eye size={14} className="text-slate-500" />
                ) : (
                  <EyeOff size={14} className="text-slate-500" />
                )}
                Hiển thị lô hết hàng
              </label>
            </div>
            <p className="text-[11px] text-slate-500">
              Mỗi SKU chỉ cần một dòng cha, bấm mũi tên để xem và nhập kiểm kê
              theo từng lô.
            </p>
          </div>

          <div className="mt-5 overflow-x-auto rounded-[4px] border border-slate-100">
            <Table className="min-w-[1500px]">
              <TableHeader>
                <TableRow className="border-b border-[#d6dde8] bg-[#eef4ff] hover:bg-[#eef4ff]">
                  <TableHead className="w-12 px-2 py-3 text-center text-[10px] font-semibold text-slate-700 whitespace-nowrap">
                    STT
                  </TableHead>
                  <TableHead className="w-[150px] px-2 py-3 text-[10px] font-semibold text-slate-700 whitespace-nowrap">
                    Mã SKU
                  </TableHead>
                  <TableHead className="min-w-[240px] px-2 py-3 text-[10px] font-semibold text-slate-700 whitespace-nowrap">
                    Sản phẩm
                  </TableHead>
                  <TableHead className="w-[110px] px-2 py-3 text-right text-[10px] font-semibold text-slate-700 whitespace-nowrap">
                    Tổng tồn
                  </TableHead>
                  <TableHead className="w-[110px] px-2 py-3 text-right text-[10px] font-semibold text-slate-700 whitespace-nowrap">
                    Tổng đếm
                  </TableHead>
                  <TableHead className="w-[100px] px-2 py-3 text-right text-[10px] font-semibold text-slate-700 whitespace-nowrap">
                    Tổng hư
                  </TableHead>
                  <TableHead className="w-[110px] px-2 py-3 text-right text-[10px] font-semibold text-slate-700 whitespace-nowrap">
                    Tổng khả dụng
                  </TableHead>
                  <TableHead className="w-[150px] px-2 py-3 text-right text-[10px] font-semibold text-slate-700 whitespace-nowrap">
                    Cần nhập / Lệch
                  </TableHead>
                  <TableHead className="w-[120px] px-2 py-3 text-center text-[10px] font-semibold text-slate-700 whitespace-nowrap">
                    Kết luận chung
                  </TableHead>
                  <TableHead className="w-[100px] px-2 py-3 text-center text-[10px] font-semibold text-slate-700 whitespace-nowrap">
                    Số lô
                  </TableHead>
                  <TableHead className="w-[92px] px-2 py-3 text-center text-[10px] font-semibold text-slate-700 whitespace-nowrap">
                    Mở / Đóng
                  </TableHead>
                  <TableHead className="w-[88px] px-2 py-3 text-center text-[10px] font-semibold text-slate-700 whitespace-nowrap">
                    Thao tác
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={12} className="h-32 text-center">
                      <div className="flex flex-col items-center gap-3 text-slate-400">
                        <Boxes size={32} className="opacity-40" />
                        <div>
                          <p className="text-sm font-medium text-slate-700">
                            Chưa có sản phẩm kiểm kê
                          </p>
                          <p className="mt-1 text-sm">
                            Kho này chưa có dữ liệu hàng hóa để lập phiếu kiểm kê.
                          </p>
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : filteredGroups.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={12}
                      className="h-28 text-center text-sm text-slate-500"
                    >
                      Không có sản phẩm phù hợp với điều kiện lọc hiện tại
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredGroups.map((group, groupIndex) => {
                    const isExpanded =
                      expandedGroups[group.key] ?? group.hasUnchecked;

                    return (
                      <React.Fragment key={group.key}>
                        <TableRow
                          className="cursor-pointer border-b border-slate-200 bg-slate-100/90 transition-colors hover:bg-slate-100"
                          onClick={() => toggleGroupExpansion(group.key)}
                        >
                          <TableCell className="px-2 py-3 text-center text-[12px] font-medium text-slate-500">
                            {groupIndex + 1}
                          </TableCell>
                          <TableCell className="px-2 py-3 font-mono text-[11px] font-semibold text-slate-700">
                            {group.sku}
                          </TableCell>
                          <TableCell className="px-2 py-3">
                            <div className="space-y-1">
                              <p className="text-[12px] font-semibold leading-5 text-slate-900">
                                {group.name}
                              </p>
                              <div className="flex flex-wrap items-center gap-2 text-[10px] text-slate-500">
                                <span>{group.totalLots} lô</span>
                                <span>Định mức tối thiểu: {formatNumber(group.metrics.minThreshold)}</span>
                                {group.hiddenZeroStockCount > 0 && (
                                  <span>
                                    Đang ẩn {group.hiddenZeroStockCount} lô hết
                                    hàng
                                  </span>
                                )}
                                {group.hasExpiredLot && (
                                  <span className="inline-flex items-center gap-1 font-medium text-rose-600">
                                    <AlertTriangle size={12} />
                                    Có lô hết hạn
                                  </span>
                                )}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="px-2 py-3 text-right text-[12px] font-semibold text-slate-900">
                            {formatNumber(group.metrics.systemQty)}
                          </TableCell>
                          <TableCell className="px-2 py-3 text-right text-[12px] font-semibold text-slate-900">
                            {formatNumber(group.metrics.realQty)}
                          </TableCell>
                          <TableCell className="px-2 py-3 text-right text-[12px] font-semibold text-slate-900">
                            {formatNumber(group.metrics.rejectedQty)}
                          </TableCell>
                          <TableCell className="px-2 py-3 text-right text-[12px] font-semibold text-slate-900">
                            {formatNumber(group.metrics.usableQty)}
                          </TableCell>
                          <TableCell className="px-2 py-3 text-right">
                            <div className="space-y-0.5">
                              <p className="text-[12px] font-semibold text-slate-900">
                                {formatNumber(group.metrics.suggestedImport)}
                              </p>
                              <p
                                className={cn(
                                  "text-[10px] font-medium",
                                  group.metrics.diffQty < 0
                                    ? "text-rose-600"
                                    : group.metrics.diffQty > 0
                                      ? "text-sky-600"
                                      : "text-slate-500",
                                )}
                              >
                                Lệch{" "}
                                {group.metrics.diffQty > 0
                                  ? `+${group.metrics.diffQty}`
                                  : group.metrics.diffQty}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell className="px-2 py-3 text-center">
                            <Badge
                              className={cn(
                                "rounded-md border px-2 py-1 text-[10px] font-medium",
                                group.badge.className,
                              )}
                            >
                              {normalizeViText(group.badge.label)}
                            </Badge>
                          </TableCell>
                          <TableCell className="px-2 py-3 text-center text-[11px] text-slate-600">
                            <span className="font-semibold text-slate-800">
                              {group.totalLots}
                            </span>
                            <p className="mt-1 text-[10px] text-slate-400">
                              Hiện {group.visibleEntries.length} lô
                            </p>
                          </TableCell>
                          <TableCell className="px-2 py-3 text-center">
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="mx-auto h-8 w-8 rounded-md text-slate-500 hover:bg-white hover:text-slate-700"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleGroupExpansion(group.key);
                              }}
                            >
                              {isExpanded ? (
                                <ChevronDown size={16} />
                              ) : (
                                <ChevronRight size={16} />
                              )}
                            </Button>
                          </TableCell>
                          <TableCell className="px-2 py-3 text-center">
                            {canEditDraftContent ? (
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="mx-auto h-8 w-8 rounded-md text-slate-400 hover:bg-white hover:text-rose-600"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  removeGroup(group.key);
                                }}
                                title="Xóa toàn bộ SKU"
                              >
                                <Trash2 size={16} />
                              </Button>
                            ) : (
                              <span className="text-[11px] text-slate-300">
                                -
                              </span>
                            )}
                          </TableCell>
                        </TableRow>

                        {isExpanded && (
                          <TableRow className="border-b border-slate-200 bg-white hover:bg-white">
                            <TableCell colSpan={12} className="p-0">
                              <div className="bg-slate-50/80 px-6 py-4">
                                <div className="rounded-md border border-slate-200 bg-white">
                                  <Table className="min-w-[1180px]">
                                    <TableHeader>
                                      <TableRow className="border-b border-slate-200 bg-slate-50 hover:bg-slate-50">
                                        <TableHead className="px-3 py-2 text-[10px] font-semibold text-slate-600">
                                          Lô hàng
                                        </TableHead>
                                        <TableHead className="px-3 py-2 text-[10px] font-semibold text-slate-600">
                                          Hạn sử dụng
                                        </TableHead>
                                        <TableHead className="px-3 py-2 text-right text-[10px] font-semibold text-slate-600">
                                          Tồn kho
                                        </TableHead>
                                        <TableHead className="px-3 py-2 text-right text-[10px] font-semibold text-slate-600">
                                          Đếm thực
                                        </TableHead>
                                        <TableHead className="px-3 py-2 text-right text-[10px] font-semibold text-slate-600">
                                          Số lượng hư
                                        </TableHead>
                                        <TableHead className="px-3 py-2 text-right text-[10px] font-semibold text-slate-600">
                                          Khả dụng
                                        </TableHead>
                                        <TableHead className="hidden px-3 py-2 text-right text-[10px] font-semibold text-slate-600">
                                          Định mức
                                        </TableHead>
                                        <TableHead className="px-3 py-2 text-right text-[10px] font-semibold text-slate-600">
                                          Lệch
                                        </TableHead>
                                        <TableHead className="px-3 py-2 text-center text-[10px] font-semibold text-slate-600">
                                          Kết luận
                                        </TableHead>
                                        <TableHead className="px-3 py-2 text-[10px] font-semibold text-slate-600">
                                          Ghi chú
                                        </TableHead>
                                        <TableHead className="px-3 py-2 text-center text-[10px] font-semibold text-slate-600">
                                          Thao tác
                                        </TableHead>
                                      </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                      {group.visibleEntries.length === 0 ? (
                                        <TableRow>
                                          <TableCell
                                            colSpan={11}
                                            className="px-3 py-6 text-center text-[12px] text-slate-500"
                                          >
                                            Tất cả lô của SKU này đang hết
                                            hàng. Bật &quot;Hiển thị lô hết
                                            hàng&quot; để xem chi tiết.
                                          </TableCell>
                                        </TableRow>
                                      ) : (
                                        group.visibleEntries.map((entry) => (
                                          <TableRow
                                            key={entry.item.rowId}
                                            className="border-b border-slate-100 hover:bg-sky-50/40"
                                          >
                                            <TableCell className="px-3 py-3">
                                              <div className="pl-5">
                                                <p className="font-mono text-[11px] font-medium text-slate-700">
                                                  {entry.item.batchNumber ||
                                                    "-"}
                                                </p>
                                                <p className="mt-1 text-[10px] text-slate-400">
                                                  SKU gốc: {group.sku}
                                                </p>
                                              </div>
                                            </TableCell>
                                            <TableCell className="px-3 py-3">
                                              <div className="space-y-1">
                                                <p
                                                  className={cn(
                                                    "text-[11px] text-slate-700",
                                                    entry.isExpired &&
                                                      "font-semibold text-rose-600",
                                                  )}
                                                >
                                                  {formatExpiryDate(
                                                    entry.item.expiryDate,
                                                  )}
                                                </p>
                                                {entry.isExpired && (
                                                  <Badge className="rounded-md border border-rose-100 bg-rose-50 px-2 py-0.5 text-[9px] font-medium text-rose-700">
                                                    Hết hạn
                                                  </Badge>
                                                )}
                                              </div>
                                            </TableCell>
                                            <TableCell className="px-3 py-3 text-right text-[11px] font-medium text-slate-800">
                                              {formatNumber(entry.metrics.systemQty)}
                                            </TableCell>
                                            <TableCell className="px-3 py-3 text-right">
                                              <Input
                                                type="number"
                                                disabled={!canEditCountResults}
                                                className="ml-auto h-7 w-[82px] rounded-md border-slate-200 bg-white px-2 text-right text-[11px] font-medium text-slate-800"
                                                value={
                                                  getEffectiveQuantityReal(
                                                    entry.item,
                                                  ) ?? ""
                                                }
                                                onChange={(e) =>
                                                  updateItem(
                                                    entry.index,
                                                    "quantityReal",
                                                    e.target.value,
                                                  )
                                                }
                                              />
                                            </TableCell>
                                            <TableCell className="px-3 py-3 text-right">
                                              <Input
                                                type="number"
                                                disabled={!canEditCountResults}
                                                className="ml-auto h-7 w-[82px] rounded-md border-slate-200 bg-white px-2 text-right text-[11px] font-medium text-slate-800"
                                                value={
                                                  entry.item.quantityRejected ??
                                                  ""
                                                }
                                                onChange={(e) =>
                                                  updateItem(
                                                    entry.index,
                                                    "quantityRejected",
                                                    e.target.value,
                                                  )
                                                }
                                              />
                                            </TableCell>
                                            <TableCell className="px-3 py-3 text-right text-[11px] font-medium text-slate-800">
                                              {formatNumber(entry.metrics.usableQty)}
                                            </TableCell>
                                            <TableCell className="hidden px-3 py-3 text-right">
                                              {entry.index ===
                                              group.visibleEntries[0]?.index ? (
                                                <span className="font-medium text-slate-700">
                                                  {formatNumber(
                                                    group.metrics.minThreshold,
                                                  )}
                                                </span>
                                              ) : (
                                                "-"
                                              )}
                                            </TableCell>
                                            <TableCell className="px-3 py-3 text-right">
                                              <div className="space-y-0.5">
                                                <p className="text-[10px] font-medium text-slate-500">
                                                  Theo SKU
                                                </p>
                                                <p
                                                  className={cn(
                                                    "text-[10px] font-medium",
                                                    entry.metrics.diffQty < 0
                                                      ? "text-rose-600"
                                                      : entry.metrics.diffQty > 0
                                                        ? "text-sky-600"
                                                        : "text-slate-500",
                                                  )}
                                                >
                                                  Lệch{" "}
                                                  {entry.metrics.diffQty > 0
                                                    ? `+${entry.metrics.diffQty}`
                                                    : entry.metrics.diffQty}
                                                </p>
                                              </div>
                                            </TableCell>
                                            <TableCell className="px-3 py-3 text-center">
                                              <Badge
                                                className={cn(
                                                  "rounded-md border px-2 py-0.5 text-[9px] font-medium",
                                                  entry.badge.className,
                                                )}
                                              >
                                                {normalizeViText(entry.badge.label)}
                                              </Badge>
                                            </TableCell>
                                            <TableCell className="px-3 py-3">
                                              <p className="max-w-[180px] truncate text-[11px] text-slate-500">
                                                {entry.item.reason || "—"}
                                              </p>
                                            </TableCell>
                                            <TableCell className="px-3 py-3">
                                              <div className="flex items-center justify-center gap-1">
                                                <Button
                                                  type="button"
                                                  variant="ghost"
                                                  size="icon"
                                                  className={cn(
                                                    "h-7 w-7 rounded-md hover:bg-slate-100",
                                                    entry.item.reason
                                                      ? "text-blue-600 hover:text-blue-700"
                                                      : "text-slate-400 hover:text-slate-600",
                                                  )}
                                                  onClick={() =>
                                                    openNoteDialog(entry.index)
                                                  }
                                                  title="Ghi chú"
                                                >
                                                  <MessageSquareText
                                                    size={15}
                                                  />
                                                </Button>
                                                {canEditDraftContent && (
                                                  <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-7 w-7 rounded-md text-slate-400 hover:bg-slate-100 hover:text-rose-600"
                                                    onClick={() =>
                                                      removeItem(entry.index)
                                                    }
                                                  >
                                                    <Trash2 size={15} />
                                                  </Button>
                                                )}
                                              </div>
                                            </TableCell>
                                          </TableRow>
                                        ))
                                      )}
                                    </TableBody>
                                  </Table>
                                </div>
                              </div>
                            </TableCell>
                          </TableRow>
                        )}
                      </React.Fragment>
                    );
                  })
                )}
              </TableBody>
            </Table>
            {formErrors.items && (
              <div className="border-t border-rose-100 bg-rose-50 p-3 text-center text-[11px] font-semibold text-rose-500">
                {formErrors.items}
              </div>
            )}
          </div>

          <div className="hidden mt-5 overflow-x-auto rounded-[4px] border border-slate-100">
            <Table className="min-w-[1200px]">
              <TableHeader>
                <TableRow className="border-b border-[#ccc] bg-[#f0f0f0] hover:bg-[#f0f0f0]">
                  <TableHead className="w-10 px-1 py-2 text-center text-[10px] font-semibold text-[#1f1f1f] whitespace-nowrap">STT</TableHead>
                  <TableHead className="w-[98px] px-1 py-2 text-[10px] font-semibold text-[#1f1f1f] whitespace-nowrap">Mã SKU</TableHead>
                  <TableHead className="w-[150px] min-w-[150px] max-w-[150px] px-1 py-2 text-[10px] font-semibold text-[#1f1f1f] whitespace-nowrap">Sản phẩm</TableHead>
                  <TableHead className="px-1 py-2 text-right text-[9px] font-semibold text-[#1f1f1f] whitespace-nowrap">Tồn kho</TableHead>
                  <TableHead className="px-1 py-2 text-right text-[9px] font-semibold text-[#1f1f1f] whitespace-nowrap">Đếm thực</TableHead>
                  <TableHead className="px-1 py-2 text-right text-[9px] font-semibold text-[#1f1f1f] whitespace-nowrap">Số lượng hư</TableHead>
                  <TableHead className="px-1 py-2 text-right text-[9px] font-semibold text-[#1f1f1f] whitespace-nowrap">Khả dụng</TableHead>
                  <TableHead className="px-1 py-2 text-right text-[9px] font-semibold text-[#1f1f1f] whitespace-nowrap">ĐM</TableHead>
                  <TableHead className="px-1 py-2 text-right text-[9px] font-semibold text-[#1f1f1f] whitespace-nowrap">Cần nhập</TableHead>
                  <TableHead className="px-1 py-2 text-center text-[10px] font-semibold text-[#1f1f1f] whitespace-nowrap">Kết luận</TableHead>
                  <TableHead className="w-[72px] px-1 py-2 text-center text-[10px] font-semibold text-[#1f1f1f] whitespace-nowrap">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={11}
                      className="h-32 text-center"
                    >
                      <div className="flex flex-col items-center gap-3 text-slate-400">
                        <Boxes size={32} className="opacity-40" />
                        <div>
                          <p className="text-sm font-medium text-slate-700">Chưa có sản phẩm kiểm kê</p>
                          <p className="mt-1 text-sm">Kho này chưa có dữ liệu hàng hóa để lập phiếu kiểm kê.</p>
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : filteredItems.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={11}
                      className="h-28 text-center text-sm text-slate-500"
                    >
                      Không có sản phẩm phù hợp với điều kiện lọc hiện tại
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredItems.map((item) => {
                    const index = items.findIndex(
                      (sourceItem) => sourceItem.rowId === item.rowId,
                    );
                    if (index === -1) return null;
                    const metrics = getItemMetrics(item);
                    const badge = getItemBadge(item);
                    return (
                      <TableRow
                        key={item.rowId}
                        className="border-b border-[#eee] transition-colors hover:bg-[#f0f8ff]"
                      >
                        <TableCell className="px-1 py-2 text-center text-[12px] text-slate-500">
                          {index + 1}
                        </TableCell>
                        <TableCell className="px-1 py-2 font-mono text-[11px] font-medium whitespace-nowrap text-slate-700">
                          {item.sku}
                        </TableCell>
                        <TableCell className="w-[150px] min-w-[150px] max-w-[150px] px-1 py-2">
                          <div>
                            <p className="max-w-[150px] break-words text-[11px] font-medium leading-4.5 text-slate-900">
                              {item.name}
                            </p>
                            <p className="mt-0.5 text-[10px] text-slate-500">
                              Lô: {item.batchNumber || "—"}
                            </p>
                            <p className="mt-0.5 text-[10px] text-slate-500">
                              HSD: {formatExpiryDate(item.expiryDate)}
                            </p>
                            {metrics.diffQty !== 0 && (
                              <p className={cn("mt-0.5 text-[10px] font-semibold", metrics.diffQty < 0 ? "text-rose-600" : "text-blue-600")}>
                                Lệch {metrics.diffQty > 0 ? `+${metrics.diffQty}` : metrics.diffQty}
                              </p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="px-1 py-2 text-right text-[11px] font-medium text-slate-800">
                          {formatNumber(metrics.systemQty)}
                        </TableCell>
                        <TableCell className="px-1 py-2 text-right">
                          <Input
                            type="number"
                            disabled={!canEditCountResults}
                            className="ml-auto h-6 w-[50px] rounded-md border-slate-200 bg-white px-1 text-right text-[11px] font-medium text-slate-800"
                            value={getEffectiveQuantityReal(item) ?? ""}
                            onChange={(e) =>
                              updateItem(index, "quantityReal", e.target.value)
                            }
                          />
                        </TableCell>
                        <TableCell className="px-1 py-2 text-right">
                          <Input
                            type="number"
                            disabled={!canEditCountResults}
                            className="ml-auto h-6 w-[50px] rounded-md border-slate-200 bg-white px-1 text-right text-[11px] font-medium text-slate-800"
                            value={item.quantityRejected ?? ""}
                            onChange={(e) =>
                              updateItem(
                                index,
                                "quantityRejected",
                                e.target.value,
                              )
                            }
                          />
                        </TableCell>
                        <TableCell className="px-1 py-2 text-right text-[11px] font-medium text-slate-800">
                          {formatNumber(metrics.usableQty)}
                        </TableCell>
                        <TableCell className="px-1 py-2 text-right">
                          <Input
                            type="number"
                            disabled={!canEditDraftContent}
                            className="ml-auto h-6 w-[50px] rounded-md border-slate-200 bg-white px-1 text-right text-[11px] font-medium text-slate-800"
                            value={item.minThreshold}
                            onChange={(e) =>
                              updateItem(index, "minThreshold", e.target.value)
                            }
                          />
                        </TableCell>
                        <TableCell className="px-1 py-2 text-right text-[11px] font-medium text-slate-800">
                          {formatNumber(metrics.suggestedImport)}
                        </TableCell>
                        <TableCell className="px-1 py-2 text-center">
                          <Badge
                            className={cn(
                              "rounded-md border px-1.5 py-0.5 text-[9px] font-normal",
                              badge.className,
                            )}
                          >
                            {badge.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="px-1 py-2">
                          <div className="flex items-center justify-center gap-1">
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className={cn(
                                "h-7 w-7 rounded-md hover:bg-slate-100",
                                item.reason
                                  ? "text-blue-600 hover:text-blue-700"
                                  : "text-slate-400 hover:text-slate-600",
                              )}
                              onClick={() => openNoteDialog(index)}
                              title="Ghi chú"
                            >
                              <MessageSquareText size={15} />
                            </Button>
                            {canEditDraftContent && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 rounded-md text-slate-400 hover:bg-slate-100 hover:text-rose-600"
                                onClick={() => removeItem(index)}
                              >
                                <Trash2 size={15} />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
            {formErrors.items && (
              <div className="border-t border-rose-100 bg-rose-50 p-3 text-center text-[11px] font-semibold text-rose-500">
                {formErrors.items}
              </div>
            )}
          </div>
        </div>

        <Dialog
          open={noteDialogIndex !== null}
          onOpenChange={(open) => !open && closeNoteDialog()}
        >
          <DialogContent className="max-w-md rounded-[6px] border border-slate-200 bg-white p-0 shadow-xl">
            <DialogHeader className="border-b border-slate-200 px-5 py-4">
              <DialogTitle className="text-[16px] font-bold text-slate-900">
                Ghi chú sản phẩm
              </DialogTitle>
              <DialogDescription className="pt-1 text-[12px] leading-relaxed text-slate-500">
                {noteDialogIndex !== null
                  ? items[noteDialogIndex]?.name
                  : "Cập nhật lý do hư hại hoặc ghi chú kiểm kê"}
              </DialogDescription>
            </DialogHeader>

            <div className="px-5 py-4">
              <Textarea
                value={noteDraft}
                disabled={!canEditCheck}
                onChange={(e) => setNoteDraft(e.target.value)}
                placeholder="Ghi rõ nguyên nhân hoặc ghi chú liên quan..."
                className="min-h-[120px] resize-none rounded-md border-slate-200 text-[13px] shadow-none"
              />
            </div>

            <DialogFooter className="border-t border-slate-200 px-5 py-4">
              <Button
                type="button"
                variant="outline"
                className="h-9 rounded-md border-slate-200 px-4 text-[11px] font-medium text-slate-700 shadow-none hover:bg-slate-50"
                onClick={closeNoteDialog}
              >
                {mode === "view" ? "Đóng" : "Hủy"}
              </Button>
              {canEditCheck && (
                <Button
                  type="button"
                  className="h-9 rounded-md bg-blue-600 px-4 text-[11px] font-medium text-white hover:bg-blue-700"
                  onClick={saveNoteDialog}
                >
                  Lưu ghi chú
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <div className="fixed bottom-0 left-0 right-0 z-[999] flex justify-end gap-3 border-t bg-white p-3 lg:left-[260px]">
          <Button
            type="button"
            variant="ghost"
            onClick={() => router.push("/admin/inventory-checks")}
            className="text-[11px] font-medium text-slate-400"
          >
            Quay lại
          </Button>

          {mode === "view" &&
            canEditFromView &&
            hasPermission(P.CHECK_UPDATE) && (
              <Button
                variant="outline"
                className="h-9 border-slate-200 bg-white px-5 text-[11px] font-medium text-slate-700 shadow-sm hover:bg-slate-50"
                onClick={() => router.push(`/admin/inventory-checks/${formData.code}?edit=true`)}
              >
                <Pencil size={14} className="mr-2" />
                Sửa phiếu
              </Button>
            )}

          {mode === "view" &&
            workflowStatus === "PENDING_APPROVAL" &&
            hasPermission(P.CHECK_APPROVE) && (
              <Button
                variant="outline"
                className="h-9 border-slate-200 bg-white px-5 text-[11px] font-medium text-slate-700 shadow-sm hover:bg-slate-50"
                disabled={isSubmitting}
                onClick={handleRequestRecount}
              >
                {isSubmitting ? (
                  <Loader2 size={14} className="mr-2 animate-spin" />
                ) : (
                  <Pencil size={14} className="mr-2" />
                )}
                Yêu cầu kiểm lại
              </Button>
            )}

          {mode === "view" &&
            workflowStatus === "PENDING_APPROVAL" &&
            hasPermission(P.CHECK_APPROVE) && (
              <Button
                className="h-9 bg-blue-600 px-6 text-[11px] font-medium text-white shadow-xl hover:bg-blue-700"
                disabled={isSubmitting}
                onClick={handleComplete}
              >
                {isSubmitting ? (
                  <Loader2 size={14} className="mr-2 animate-spin" />
                ) : (
                  <CheckCircle2 size={14} className="mr-2" />
                )}
                Duyệt cân bằng
              </Button>
            )}

          {(mode === "view" || canEditCheck) &&
            workflowStatus !== "COMPLETED" &&
            workflowStatus !== "CANCELLED" &&
            hasPermission(P.CHECK_CANCEL) && (
              <Button
                variant="outline"
                className="h-9 border-rose-200 bg-white px-5 text-[11px] font-medium text-rose-600 shadow-sm hover:bg-rose-50"
                disabled={isSubmitting}
                onClick={handleCancelCheck}
              >
                {isSubmitting ? (
                  <Loader2 size={14} className="mr-2 animate-spin" />
                ) : (
                  <X size={14} className="mr-2" />
                )}
                Hủy phiếu
              </Button>
            )}

          {mode !== "view" && (
            <>
              {canEditCheck && (
              <Button
                variant="outline"
                className="h-9 border-slate-200 bg-white px-5 text-[11px] font-medium text-slate-700 shadow-sm hover:bg-slate-50"
                disabled={isSubmitting}
                onClick={handleSubmit}
              >
                {isSubmitting ? (
                  <Loader2 size={14} className="mr-2 animate-spin" />
                ) : (
                  <Save size={14} className="mr-2" />
                )}
                Lưu phiếu
              </Button>
              )}
              {workflowStatus === "DRAFT" && hasPermission(P.CHECK_UPDATE) && (
                <Button
                  className="h-9 bg-amber-500 px-6 text-[11px] font-medium text-white shadow-xl hover:bg-amber-600"
                  disabled={isSubmitting}
                  onClick={handleStartCheck}
                >
                  {isSubmitting ? (
                    <Loader2 size={14} className="mr-2 animate-spin" />
                  ) : (
                    <CheckCircle2 size={14} className="mr-2" />
                  )}
                  Bắt đầu kiểm kê
                </Button>
              )}
              {canEditCountResults && hasPermission(P.CHECK_UPDATE) && (
                <Button
                  className="h-9 bg-blue-600 px-6 text-[11px] font-medium text-white shadow-xl hover:bg-blue-700"
                  disabled={isSubmitting}
                  onClick={handleSubmitForApproval}
                >
                  {isSubmitting ? (
                    <Loader2 size={14} className="mr-2 animate-spin" />
                  ) : (
                    <CheckCircle2 size={14} className="mr-2" />
                  )}
                  Gửi duyệt cân bằng
                </Button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

