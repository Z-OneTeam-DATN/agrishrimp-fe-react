"use client";

import { type ElementType, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowDownToLine,
  ArrowUpFromLine,
  ClipboardList,
  Clock,
  Truck,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  InventoryApiService,
  InventoryCheckApiService,
  InventoryExportApiService,
} from "@/app/services/inventory.service";
import { transferService } from "@/app/services/transfer.service";
import { usePermissions } from "@/hooks/usePermissions";
import { P } from "@/lib/permissions";
import { useAuthStore } from "@/stores/useAuthStore";

type WorkflowStat = {
  label: string;
  value: number;
  colorClass: string;
  bgClass: string;
  width: string;
};

type WorkflowCard = {
  title: string;
  totalAction: string;
  href: string;
  icon: ElementType;
  iconColor: string;
  stats: WorkflowStat[];
};

type RecordLike = Record<string, unknown>;

const toObjectArray = (value: unknown): RecordLike[] =>
  Array.isArray(value)
    ? value.filter(
        (item): item is RecordLike => Boolean(item && typeof item === "object"),
      )
    : [];

const extractContentArray = (value: unknown): RecordLike[] => {
  if (value && typeof value === "object" && "content" in value) {
    return toObjectArray((value as { content?: unknown }).content);
  }

  return [];
};

const getStatusValue = (item: RecordLike) =>
  String(item.status ?? "").toUpperCase().trim();

const countStatuses = (items: RecordLike[], statuses: string[]) => {
  const matched = new Set(statuses.map((status) => status.toUpperCase()));
  return items.filter((item) => matched.has(getStatusValue(item))).length;
};

const getInventoryCheckWorkflowStatus = (item: RecordLike) => {
  const normalized = String(
    item.checkWorkflowStatus ?? item.status ?? "",
  ).toUpperCase().trim();

  if (
    normalized === "COUNTING_INIT" ||
    normalized === "COUNTING_IN_PROGRESS" ||
    normalized === "WAITING_FOR_ADJUSTMENT_APPROVAL" ||
    normalized === "COUNTING_COMPLETED"
  ) {
    return normalized;
  }

  if (normalized === "COMPLETED") {
    return "COUNTING_COMPLETED";
  }

  return "COUNTING_INIT";
};

const getWidth = (value: number, total: number) => {
  if (total <= 0) return "0%";
  return `${Math.round((value / total) * 100)}%`;
};

const WorkflowCard = ({
  href,
  icon: Icon,
  iconColor,
  stats,
  title,
  totalAction,
  updatedAt,
}: WorkflowCard & { updatedAt: string }) => {
  const router = useRouter();

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-[4px] border border-slate-200 bg-white shadow-sm transition-all duration-300 hover:shadow-md">
      <div className="flex items-start justify-between gap-2 p-3">
        <div className="flex min-w-0 flex-1 gap-2.5">
          <div
            className={cn(
              "flex-shrink-0 rounded-[4px] p-2 transition-colors",
              iconColor,
            )}
          >
            <Icon size={18} />
          </div>
          <div className="min-w-0">
            <h5
              className="text-[13px] font-bold uppercase leading-tight text-slate-800"
              title={title}
            >
              {title}
            </h5>
            <p className="mt-0.5 flex items-center gap-1 whitespace-nowrap text-[10px] font-bold text-slate-400">
              <Clock size={10} className="flex-shrink-0" />
              CẬP NHẬT: {updatedAt}
            </p>
          </div>
        </div>
        <button
          onClick={() => router.push(href)}
          className="flex flex-shrink-0 items-center gap-0.5 whitespace-nowrap rounded-[4px] border border-blue-100 bg-blue-50 px-2 py-0.5 text-[10px] font-black uppercase text-blue-600 transition-all hover:bg-blue-600 hover:text-white"
        >
          {totalAction}
          <ChevronRight size={10} className="flex-shrink-0" />
        </button>
      </div>

      <div className="flex items-center justify-between gap-1 overflow-hidden px-4 py-2">
        {stats.map((item, index) => (
          <div
            key={`${title}-${item.label}`}
            className={cn(
              "flex min-w-0 flex-1 items-start",
              index < stats.length - 1 && "border-r border-slate-100 pr-2",
            )}
          >
            <div className="min-w-0">
              <span
                className={cn(
                  "whitespace-nowrap text-[16px] font-black tracking-tight",
                  item.colorClass,
                )}
              >
                {item.value}
              </span>
              <span
                className="block w-full truncate whitespace-nowrap text-[9px] font-bold uppercase tracking-tighter text-slate-400"
                title={item.label}
              >
                {item.label}
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="mb-4 mt-3 px-4">
        <div className="flex h-1.5 w-full overflow-hidden rounded-[4px] bg-slate-100 ring-1 ring-slate-50">
          {stats.map((item) => (
            <div
              key={`${title}-${item.label}-bar`}
              className={cn("h-full flex-shrink-0", item.bgClass)}
              style={{ width: item.width }}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default function WarehouseWorkflowCards({
  refreshToken = 0,
}: {
  refreshToken?: number;
}) {
  const { accessToken } = useAuthStore();
  const { hasPermission } = usePermissions();
  const canViewReceipts = hasPermission(P.IMPORT_VIEW);
  const canViewExports = hasPermission(P.EXPORT_VIEW);
  const canViewTransfers = hasPermission(P.TRANSFER_VIEW);
  const canViewChecks = hasPermission(P.CHECK_VIEW);
  const [loading, setLoading] = useState(true);
  const [cards, setCards] = useState<WorkflowCard[]>([]);
  const [updatedAt, setUpdatedAt] = useState("Đang tải");

  useEffect(() => {
    const fetchCards = async () => {
      if (
        !accessToken ||
        (!canViewReceipts &&
          !canViewExports &&
          !canViewTransfers &&
          !canViewChecks)
      ) {
        setCards([]);
        setLoading(false);
        return;
      }

      setLoading(true);

      try {
        const [
          receiptsResponse,
          exportCommandsResponse,
          exportReceiptsResponse,
          transfersResponse,
          inventoryChecksResponse,
        ] = await Promise.all([
          canViewReceipts
            ? InventoryApiService.getAllReceipts().catch(() => [])
            : Promise.resolve([]),
          canViewExports
            ? InventoryExportApiService.getAllExportCommands().catch(() => [])
            : Promise.resolve([]),
          canViewExports
            ? InventoryExportApiService.getAllExportReceipts().catch(() => [])
            : Promise.resolve([]),
          canViewTransfers
            ? transferService
                .getAll("", "all", 0, 1000)
                .catch(() => ({ content: [] }))
            : Promise.resolve({ content: [] }),
          canViewChecks
            ? InventoryCheckApiService.getAll().catch(() => [])
            : Promise.resolve([]),
        ]);

        const receipts = [
          ...toObjectArray(receiptsResponse),
          ...extractContentArray(receiptsResponse),
        ];
        const exportCommands = toObjectArray(exportCommandsResponse);
        const exportReceipts = toObjectArray(exportReceiptsResponse);
        const transfers = extractContentArray(transfersResponse);
        const inventoryChecks = [
          ...toObjectArray(inventoryChecksResponse),
          ...extractContentArray(inventoryChecksResponse),
        ];

        const pendingReceipts = countStatuses(receipts, ["PENDING", "PO"]);
        const completedReceipts = countStatuses(receipts, [
          "COMPLETED",
          "IMPORTED",
        ]);
        const totalReceipts = pendingReceipts + completedReceipts;

        const pendingExports = exportCommands.length;
        const completedExports = exportReceipts.length;
        const totalExports = pendingExports + completedExports;

        const pendingTransfers = countStatuses(transfers, ["PENDING"]);
        const shippingTransfers = countStatuses(transfers, ["SHIPPING"]);
        const completedTransfers = countStatuses(transfers, ["COMPLETED"]);
        const totalTransfers =
          pendingTransfers + shippingTransfers + completedTransfers;

        const countingChecks = inventoryChecks.filter((item) => {
          const status = getInventoryCheckWorkflowStatus(item);
          return status === "COUNTING_INIT" || status === "COUNTING_IN_PROGRESS";
        }).length;
        const waitingApprovalChecks = inventoryChecks.filter(
          (item) =>
            getInventoryCheckWorkflowStatus(item) ===
            "WAITING_FOR_ADJUSTMENT_APPROVAL",
        ).length;
        const completedChecks = inventoryChecks.filter(
          (item) =>
            getInventoryCheckWorkflowStatus(item) === "COUNTING_COMPLETED",
        ).length;
        const totalChecks =
          countingChecks + waitingApprovalChecks + completedChecks;

        const nextCards: WorkflowCard[] = [];

        if (canViewReceipts) {
          nextCards.push({
            title: "Phiếu nhập kho",
            totalAction: `${pendingReceipts} cần làm`,
            href: "/admin/receipts",
            icon: ArrowDownToLine,
            iconColor: "bg-blue-50 text-blue-600",
            stats: [
              {
                label: "Chờ xử lý",
                value: pendingReceipts,
                colorClass: "text-amber-500",
                bgClass: "bg-amber-500",
                width: getWidth(pendingReceipts, totalReceipts),
              },
              {
                label: "Đã nhập xong",
                value: completedReceipts,
                colorClass: "text-blue-600",
                bgClass: "bg-blue-500",
                width: getWidth(completedReceipts, totalReceipts),
              },
            ],
          });
        }

        if (canViewExports) {
          nextCards.push({
            title: "Phiếu xuất kho",
            totalAction: `${pendingExports} cần làm`,
            href: "/admin/exports",
            icon: ArrowUpFromLine,
            iconColor: "bg-blue-50 text-blue-600",
            stats: [
              {
                label: "Chờ xuất",
                value: pendingExports,
                colorClass: "text-amber-600",
                bgClass: "bg-amber-500",
                width: getWidth(pendingExports, totalExports),
              },
              {
                label: "Đã xuất kho",
                value: completedExports,
                colorClass: "text-blue-600",
                bgClass: "bg-blue-500",
                width: getWidth(completedExports, totalExports),
              },
            ],
          });
        }

        if (canViewTransfers) {
          nextCards.push({
            title: "Phiếu điều chuyển",
            totalAction: `${pendingTransfers} cần làm`,
            href: "/admin/transfers",
            icon: Truck,
            iconColor: "bg-cyan-50 text-cyan-600",
            stats: [
              {
                label: "Chờ xử lý",
                value: pendingTransfers,
                colorClass: "text-amber-500",
                bgClass: "bg-amber-500",
                width: getWidth(pendingTransfers, totalTransfers),
              },
              {
                label: "Đang đi",
                value: shippingTransfers,
                colorClass: "text-cyan-600",
                bgClass: "bg-cyan-500",
                width: getWidth(shippingTransfers, totalTransfers),
              },
              {
                label: "Hoàn thành",
                value: completedTransfers,
                colorClass: "text-blue-600",
                bgClass: "bg-blue-500",
                width: getWidth(completedTransfers, totalTransfers),
              },
            ],
          });
        }

        if (canViewChecks) {
          nextCards.push({
            title: "Phiếu kiểm kê",
            totalAction: `${countingChecks + waitingApprovalChecks} cần làm`,
            href: "/admin/inventory-checks",
            icon: ClipboardList,
            iconColor: "bg-indigo-50 text-indigo-600",
            stats: [
              {
                label: "Đang kiểm kê",
                value: countingChecks,
                colorClass: "text-amber-500",
                bgClass: "bg-amber-500",
                width: getWidth(countingChecks, totalChecks),
              },
              {
                label: "Chờ duyệt lệch",
                value: waitingApprovalChecks,
                colorClass: "text-rose-500",
                bgClass: "bg-rose-500",
                width: getWidth(waitingApprovalChecks, totalChecks),
              },
              {
                label: "Đã chốt",
                value: completedChecks,
                colorClass: "text-blue-600",
                bgClass: "bg-blue-500",
                width: getWidth(completedChecks, totalChecks),
              },
            ],
          });
        }

        setCards(nextCards);

        const now = new Date();
        setUpdatedAt(
          now.toLocaleTimeString("vi-VN", {
            hour: "2-digit",
            minute: "2-digit",
          }),
        );
      } catch (error) {
        console.error("Không thể tải khối phiếu kho:", error);
        setCards([]);
      } finally {
        setLoading(false);
      }
    };

    void fetchCards();
  }, [
    accessToken,
    canViewChecks,
    canViewExports,
    canViewReceipts,
    canViewTransfers,
    refreshToken,
  ]);

  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className="h-[170px] rounded-[4px] border border-slate-200 bg-slate-50 animate-pulse"
          />
        ))}
      </div>
    );
  }

  if (cards.length === 0) {
    return (
      <div className="rounded-[4px] border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center text-[12px] text-slate-500">
        Chưa có dữ liệu phiếu kho để hiển thị.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => (
        <WorkflowCard
          key={card.title}
          {...card}
          updatedAt={updatedAt}
        />
      ))}
    </div>
  );
}
