"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  CheckCircle2,
  Eye,
  EyeOff,
  Loader2,
  Pencil,
  Phone,
  RefreshCcw,
  Save,
  Search,
  ShieldCheck,
  Trash2,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import AdminDataSyncLoader from "@/components/admin/shared/AdminDataSyncLoader";
import { usePermissions } from "@/hooks/usePermissions";
import { P } from "@/lib/permissions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
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
import { cn } from "@/lib/utils";
import { aiKnowledgeService } from "@/app/services/aiKnowledge.service";
import { EmployeeService } from "@/app/services/employee.service";
import type {
  AiDiseaseKnowledge,
  AiKnowledgeChatConfig,
  AiKnowledgeStatus,
} from "@/app/types/ai-knowledge.types";
import type { UserResponse } from "@/app/types/employee.schema";

const PAGE_SIZE = 20;

type StatusTab = {
  id: "all" | "inReview" | "approved" | "draft" | "disabled";
  label: string;
  statuses: readonly AiKnowledgeStatus[] | null;
};

const STATUS_TABS: readonly StatusTab[] = [
  { id: "all", label: "Tất cả", statuses: null },
  { id: "inReview", label: "Chờ duyệt", statuses: ["IN_REVIEW"] },
  { id: "approved", label: "Đã duyệt", statuses: ["APPROVED"] },
  { id: "draft", label: "Nháp / Bị từ chối", statuses: ["DRAFT"] },
  { id: "disabled", label: "Đã tắt", statuses: ["DISABLED", "ARCHIVED"] },
] as const;

type StatusTabId = StatusTab["id"];

const STATUS_LABELS: Record<string, string> = {
  APPROVED: "Đã duyệt",
  IN_REVIEW: "Chờ duyệt",
  DRAFT: "Nháp",
  DISABLED: "Đã tắt",
  ARCHIVED: "Lưu trữ",
};

function normalizeSearch(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase()
    .trim();
}

function countProducts(item: AiDiseaseKnowledge) {
  const productIds = new Set<number>();
  const extraNames = new Set<string>();

  (item.treatmentStages ?? []).forEach((stage) => {
    (stage.products ?? []).forEach((product) => productIds.add(product.id));
    (stage.productIds ?? []).forEach((productId) => productIds.add(productId));
    (stage.extraProductNames ?? []).forEach((name) => {
      const normalizedName = name.trim();
      if (normalizedName) extraNames.add(normalizedName);
    });
    (stage.subStages ?? []).forEach((subStage) => {
      (subStage.products ?? []).forEach((product) =>
        productIds.add(product.id),
      );
      (subStage.productIds ?? []).forEach((productId) =>
        productIds.add(productId),
      );
      (subStage.extraProductNames ?? []).forEach((name) => {
        const normalizedName = name.trim();
        if (normalizedName) extraNames.add(normalizedName);
      });
    });
  });

  return productIds.size + extraNames.size;
}

export default function AdminAiKnowledgeApprovalsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { hasPermission } = usePermissions();
  const canEditDisease = hasPermission(P.AI_KNOWLEDGE_UPDATE);
  const [statusFilter, setStatusFilter] = useState<StatusTabId>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedDetail, setSelectedDetail] =
    useState<AiDiseaseKnowledge | null>(null);
  const [isContactDialogOpen, setIsContactDialogOpen] = useState(false);
  const [contactForm, setContactForm] = useState({
    fallbackContactName: "",
    fallbackContactPhone: "",
  });
  const [selectedEngineerId, setSelectedEngineerId] = useState("");
  const [rejectTarget, setRejectTarget] = useState<AiDiseaseKnowledge | null>(
    null,
  );
  const [rejectReason, setRejectReason] = useState("");

  const diseasesQuery = useQuery({
    queryKey: ["ai-knowledge", "diseases"],
    queryFn: () => aiKnowledgeService.getDiseases(),
  });

  const configQuery = useQuery({
    queryKey: ["ai-knowledge", "config"],
    queryFn: () => aiKnowledgeService.getConfig(),
  });

  const engineersQuery = useQuery({
    queryKey: ["employees", "agronomist-contact-options"],
    queryFn: async () => {
      const response = await EmployeeService.getAll({
        permissionCode: P.AGRONOMIST_WORKSPACE_USE,
        status: "ACTIVE",
        page: 0,
        size: 200,
        sort: "fullName,asc",
      });

      return response.content ?? [];
    },
    enabled: isContactDialogOpen,
  });

  const engineerOptions = useMemo(
    () =>
      (engineersQuery.data ?? []).filter(
        (employee: UserResponse) => employee.status === "ACTIVE",
      ),
    [engineersQuery.data],
  );

  const selectedEngineer = useMemo(
    () =>
      engineerOptions.find(
        (employee) => String(employee.id) === selectedEngineerId,
      ),
    [engineerOptions, selectedEngineerId],
  );

  useEffect(() => {
    if (configQuery.data) {
      setContactForm({
        fallbackContactName: configQuery.data.fallbackContactName ?? "",
        fallbackContactPhone: configQuery.data.fallbackContactPhone ?? "",
      });
    }
  }, [configQuery.data]);

  useEffect(() => {
    if (!configQuery.data || engineerOptions.length === 0) {
      setSelectedEngineerId("");
      return;
    }

    const fallbackName = configQuery.data.fallbackContactName ?? "";
    const fallbackPhone = configQuery.data.fallbackContactPhone ?? "";
    const matchedEngineer = engineerOptions.find((employee) => {
      const samePhone =
        Boolean(fallbackPhone) && employee.phoneNumber === fallbackPhone;
      const sameName =
        Boolean(fallbackName) &&
        normalizeSearch(employee.fullName) === normalizeSearch(fallbackName);

      return samePhone || (sameName && !fallbackPhone);
    });

    if (matchedEngineer) {
      setSelectedEngineerId(String(matchedEngineer.id));
      setContactForm({
        fallbackContactName: matchedEngineer.fullName,
        fallbackContactPhone: matchedEngineer.phoneNumber ?? "",
      });
      return;
    }

    setSelectedEngineerId("");
  }, [configQuery.data, engineerOptions]);

  const contactMutation = useMutation({
    mutationFn: () => {
      if (!selectedEngineer) {
        throw new Error("Vui lòng chọn kỹ sư liên hệ từ danh sách.");
      }

      const engineerPhone = selectedEngineer.phoneNumber?.trim();
      if (!engineerPhone) {
        throw new Error("Kỹ sư được chọn chưa có số điện thoại.");
      }

      const current: Partial<AiKnowledgeChatConfig> = configQuery.data ?? {};
      return aiKnowledgeService.updateConfig({
        greetingMessage: current.greetingMessage,
        fallbackMessage: current.fallbackMessage,
        fallbackContactName: selectedEngineer.fullName,
        fallbackContactPhone: engineerPhone,
      });
    },
    onSuccess: async () => {
      toast.success("Đã cập nhật thông tin kỹ sư liên hệ.");
      await queryClient.invalidateQueries({
        queryKey: ["ai-knowledge", "config"],
      });
      setIsContactDialogOpen(false);
    },
    onError: (error: any) =>
      toast.error(error?.message || "Không thể cập nhật thông tin liên hệ."),
  });

  const diseases = diseasesQuery.data ?? [];
  const normalizedKeyword = normalizeSearch(searchQuery);

  const baseFilteredDiseases = useMemo(() => {
    if (!normalizedKeyword) return diseases;

    return diseases.filter((item) =>
      [
        item.code,
        item.nameVi,
        item.nameEn,
        item.category?.name,
        item.signsSummary,
      ].some((value) =>
        normalizeSearch(String(value ?? "")).includes(normalizedKeyword),
      ),
    );
  }, [diseases, normalizedKeyword]);

  const filteredDiseases = useMemo(() => {
    const activeTab = STATUS_TABS.find((tab) => tab.id === statusFilter);
    const statuses = activeTab?.statuses;
    if (!statuses) return baseFilteredDiseases;

    return baseFilteredDiseases.filter((item) =>
      statuses.includes(item.status as AiKnowledgeStatus),
    );
  }, [baseFilteredDiseases, statusFilter]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter]);

  const summary = useMemo(
    () => ({
      total: baseFilteredDiseases.length,
      pending: baseFilteredDiseases.filter(
        (item) => item.status === "IN_REVIEW",
      ).length,
      approved: baseFilteredDiseases.filter(
        (item) => item.status === "APPROVED" && item.enabled,
      ).length,
      draft: baseFilteredDiseases.filter((item) => item.status === "DRAFT")
        .length,
    }),
    [baseFilteredDiseases],
  );

  const statusCounts = useMemo(
    () =>
      STATUS_TABS.reduce<Record<StatusTabId, number>>(
        (result, tab) => {
          const statuses = tab.statuses;
          result[tab.id] = statuses
            ? baseFilteredDiseases.filter((item) =>
                statuses.includes(item.status as AiKnowledgeStatus),
              ).length
            : baseFilteredDiseases.length;
          return result;
        },
        {
          all: 0,
          inReview: 0,
          approved: 0,
          draft: 0,
          disabled: 0,
        },
      ),
    [baseFilteredDiseases],
  );

  const totalPages = Math.ceil(filteredDiseases.length / PAGE_SIZE);
  const displayData = filteredDiseases.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );
  const firstItem =
    filteredDiseases.length === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1;
  const lastItem = Math.min(currentPage * PAGE_SIZE, filteredDiseases.length);

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ["ai-knowledge", "diseases"] });

  const approveMutation = useMutation({
    mutationFn: (id: number) => aiKnowledgeService.approveDisease(id),
    onSuccess: async () => {
      toast.success("Đã duyệt phác đồ. AI Doctor có thể dùng để trả lời ngay.");
      await invalidate();
    },
    onError: (error: any) =>
      toast.error(error?.message || "Không thể duyệt phác đồ."),
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }: { id: number; reason: string }) =>
      aiKnowledgeService.rejectDisease(id, reason),
    onSuccess: async () => {
      toast.success("Đã gửi yêu cầu chỉnh sửa cho kỹ sư.");
      await invalidate();
      setRejectTarget(null);
      setRejectReason("");
    },
    onError: (error: any) =>
      toast.error(error?.message || "Không thể gửi yêu cầu chỉnh sửa."),
  });

  const visibilityMutation = useMutation({
    mutationFn: ({ id, enabled }: { id: number; enabled: boolean }) =>
      aiKnowledgeService.setDiseaseVisibility(id, enabled),
    onSuccess: async (_data, variables) => {
      toast.success(
        variables.enabled
          ? "Đã hiện phác đồ trên AI Doctor."
          : "Đã ẩn phác đồ khỏi AI Doctor.",
      );
      await invalidate();
    },
    onError: (error: any) =>
      toast.error(error?.message || "Không thể đổi trạng thái hiển thị."),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => aiKnowledgeService.deleteDisease(id),
    onSuccess: async () => {
      toast.success("Đã xoá phác đồ.");
      await invalidate();
    },
    onError: (error: any) =>
      toast.error(error?.message || "Không thể xoá phác đồ."),
  });

  const isMutating =
    approveMutation.isPending ||
    rejectMutation.isPending ||
    visibilityMutation.isPending ||
    deleteMutation.isPending;

  const handleSelectEngineer = (engineerId: string) => {
    const engineer = engineerOptions.find(
      (employee) => String(employee.id) === engineerId,
    );
    if (!engineer) return;

    setSelectedEngineerId(engineerId);
    setContactForm({
      fallbackContactName: engineer.fullName,
      fallbackContactPhone: engineer.phoneNumber ?? "",
    });
  };

  const handleRefresh = async () => {
    await diseasesQuery.refetch();
  };

  return (
    <div className="space-y-4 px-1 pb-8">
      <div className="mb-8 mt-2 space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-[20px] font-semibold uppercase text-slate-900">
            Duyệt phác đồ điều trị
          </h1>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="outline"
              className="h-[38px] border-slate-200 bg-white px-4 text-[13px] font-medium shadow-none"
              onClick={() => setIsContactDialogOpen(true)}
            >
              <Phone size={15} className="mr-2" />
              Kỹ sư liên hệ mặc định
            </Button>
            <Button
              type="button"
              variant="outline"
              className="h-[38px] border-slate-200 bg-white px-4 text-[13px] font-medium shadow-none"
              onClick={() => void handleRefresh()}
              disabled={diseasesQuery.isFetching}
            >
              <RefreshCcw
                size={15}
                className={cn(
                  "mr-2",
                  diseasesQuery.isFetching && "animate-spin",
                )}
              />
              Làm mới
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-2.5 md:grid-cols-2 xl:grid-cols-4">
          {[
            {
              title: "Tổng phác đồ",
              value: summary.total,
              description: "Theo bộ lọc tìm kiếm hiện tại",
            },
            {
              title: "Chờ duyệt",
              value: summary.pending,
              description: "Cần quản trị viên xử lý",
            },
            {
              title: "Đang sử dụng",
              value: summary.approved,
              description: "Đã duyệt và đang bật",
            },
            {
              title: "Nháp / bị từ chối",
              value: summary.draft,
              description: "Cần kỹ sư chỉnh sửa lại",
            },
          ].map((card) => (
            <div
              key={card.title}
              className="rounded-[4px] border border-[#dcdcdc] bg-white p-3 shadow-sm"
            >
              <p className="text-[11px] font-semibold text-slate-400">
                {card.title}
              </p>
              <div className="mt-3 space-y-1">
                <p className="text-[20px] font-semibold leading-none text-slate-900">
                  {card.value}
                </p>
                <p className="text-[10px] leading-4 text-slate-500">
                  {card.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            {STATUS_TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setStatusFilter(tab.id)}
                className={cn(
                  "h-[34px] rounded-[4px] border px-3 text-[12px] font-medium transition-colors",
                  statusFilter === tab.id
                    ? "border-blue-200 bg-blue-50 text-blue-700"
                    : "border-slate-200 bg-white text-slate-500 hover:bg-slate-50 hover:text-slate-700",
                )}
              >
                {tab.label}
                <span className="ml-2 text-[11px] text-slate-400">
                  {statusCounts[tab.id]}
                </span>
              </button>
            ))}
          </div>

          <div className="relative w-full sm:w-[340px]">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300"
            />
            <Input
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Tìm mã, tên bệnh, danh mục..."
              className="h-[38px] border-slate-200 bg-white pl-10 text-[13px] shadow-none"
            />
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-[4px] border border-[#dcdcdc] bg-white shadow-sm">
        {diseasesQuery.isLoading ? (
          <AdminDataSyncLoader message="Đang tải phác đồ" />
        ) : displayData.length > 0 ? (
          <TooltipProvider delayDuration={150}>
            <div className="w-full">
              <Table className="table-custom w-full table-fixed border-collapse">
                <colgroup>
                  <col className="w-[18%]" />
                  <col className="w-[14%]" />
                  <col className="w-[31%]" />
                  <col className="w-[12%]" />
                  <col className="w-[12%]" />
                  <col className="w-[13%]" />
                </colgroup>
                <TableHeader>
                  <TableRow className="border-b border-slate-200 bg-slate-50 hover:bg-slate-50">
                    <TableHead className="p-3 pl-4 text-[10px] font-semibold text-[#1f1f1f]">
                      Phác đồ
                    </TableHead>
                    <TableHead className="p-3 text-[10px] font-semibold text-[#1f1f1f]">
                      Danh mục
                    </TableHead>
                    <TableHead className="p-3 text-[10px] font-semibold text-[#1f1f1f]">
                      Dấu hiệu nhận biết
                    </TableHead>
                    <TableHead className="p-3 text-[10px] font-semibold text-[#1f1f1f]">
                      Điều trị
                    </TableHead>
                    <TableHead className="p-3 text-[10px] font-semibold text-[#1f1f1f]">
                      Trạng thái
                    </TableHead>
                    <TableHead className="p-3 pr-4 text-right text-[10px] font-semibold text-[#1f1f1f]">
                      Thao tác
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {displayData.map((item) => {
                    const stageCount = item.treatmentStages?.length ?? 0;
                    const productCount = countProducts(item);

                    return (
                      <TableRow
                        key={item.id}
                        className="group border-b border-slate-100 hover:bg-slate-50/70"
                      >
                        <TableCell className="p-3 pl-4">
                          <p className="line-clamp-1 text-[12px] font-semibold text-slate-800">
                            {item.nameVi}
                          </p>
                          <p className="mt-1 text-[10px] text-slate-400">
                            {item.code}
                            {item.nameEn ? ` · ${item.nameEn}` : ""}
                          </p>
                        </TableCell>
                        <TableCell className="p-3 text-[11.5px] text-slate-500">
                          {item.category?.name ?? "Chưa gán"}
                        </TableCell>
                        <TableCell className="p-3">
                          <p className="line-clamp-2 text-[11.5px] leading-5 text-slate-600">
                            {item.signsSummary || "Chưa có mô tả dấu hiệu"}
                          </p>
                        </TableCell>
                        <TableCell className="p-3 text-[11.5px] text-slate-500">
                          <p>{stageCount} giai đoạn</p>
                          <p className="mt-1 text-[10px] text-slate-400">
                            {productCount} sản phẩm
                          </p>
                        </TableCell>
                        <TableCell className="p-3">
                          <StatusPill
                            value={item.status}
                            enabled={item.enabled}
                          />
                        </TableCell>
                        <TableCell className="p-3 pr-4 text-right">
                          <div className="flex justify-end">
                            <TableActionButton
                              label="Xem chi tiết"
                              onClick={() => setSelectedDetail(item)}
                            >
                              <Eye size={15} />
                            </TableActionButton>
                            {canEditDisease && (
                              <TableActionButton
                                label="Sửa phác đồ"
                                className="hover:text-blue-600"
                                onClick={() =>
                                  router.push(
                                    `/admin/ai-knowledge/diseases/${item.id}/edit`,
                                  )
                                }
                              >
                                <Pencil size={15} />
                              </TableActionButton>
                            )}
                            {item.status === "IN_REVIEW" && (
                              <>
                                <TableActionButton
                                  label="Duyệt phác đồ"
                                  disabled={isMutating}
                                  className="hover:text-emerald-600"
                                  onClick={() =>
                                    approveMutation.mutate(item.id)
                                  }
                                >
                                  <CheckCircle2 size={15} />
                                </TableActionButton>
                                <TableActionButton
                                  label="Yêu cầu chỉnh sửa"
                                  disabled={isMutating}
                                  className="hover:text-amber-600"
                                  onClick={() => setRejectTarget(item)}
                                >
                                  <XCircle size={15} />
                                </TableActionButton>
                              </>
                            )}
                            {item.status === "APPROVED" && (
                              <TableActionButton
                                label={
                                  item.enabled
                                    ? "Ẩn khỏi AI Doctor"
                                    : "Hiện lại trên AI Doctor"
                                }
                                disabled={visibilityMutation.isPending}
                                className="hover:text-amber-600"
                                onClick={() =>
                                  visibilityMutation.mutate({
                                    id: item.id,
                                    enabled: !item.enabled,
                                  })
                                }
                              >
                                {item.enabled ? (
                                  <EyeOff size={15} />
                                ) : (
                                  <Eye size={15} />
                                )}
                              </TableActionButton>
                            )}
                            {canEditDisease && (
                              <TableActionButton
                                label="Xoá phác đồ"
                                disabled={deleteMutation.isPending}
                                className="hover:text-rose-600"
                                onClick={() => {
                                  if (
                                    confirm(
                                      `Xoá phác đồ "${item.nameVi}"? Không thể hoàn tác.`,
                                    )
                                  ) {
                                    deleteMutation.mutate(item.id);
                                  }
                                }}
                              >
                                <Trash2 size={15} />
                              </TableActionButton>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>

              <div className="flex flex-col gap-3 border-t border-slate-100 bg-[#f8f9fa] px-5 py-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-[11px] text-slate-500">
                  Hiển thị {firstItem} - {lastItem} trong{" "}
                  {filteredDiseases.length}
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-8 text-[11px] font-medium"
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(currentPage - 1)}
                  >
                    Trước
                  </Button>
                  <span className="min-w-[60px] text-center text-[11px] text-slate-500">
                    {currentPage} / {totalPages || 1}
                  </span>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-8 text-[11px] font-medium"
                    disabled={currentPage === totalPages || totalPages === 0}
                    onClick={() => setCurrentPage(currentPage + 1)}
                  >
                    Sau
                  </Button>
                </div>
              </div>
            </div>
          </TooltipProvider>
        ) : (
          <div className="flex flex-col items-center gap-2 py-16 text-center">
            <ShieldCheck className="h-8 w-8 text-slate-300" />
            <p className="text-[12px] text-slate-400">
              Không có phác đồ phù hợp bộ lọc
            </p>
          </div>
        )}
      </div>

      <DiseaseDetailDialog
        disease={selectedDetail}
        onOpenChange={(open) => {
          if (!open) setSelectedDetail(null);
        }}
      />

      <Dialog
        open={Boolean(rejectTarget)}
        onOpenChange={(open) => {
          if (!open) {
            setRejectTarget(null);
            setRejectReason("");
          }
        }}
      >
        <DialogContent className="max-w-[440px] gap-0 rounded-[4px] border-slate-200 bg-white p-0 shadow-xl">
          <DialogHeader className="border-b border-slate-100 px-6 py-5">
            <DialogTitle className="text-[16px] font-semibold text-slate-900">
              Yêu cầu chỉnh sửa
            </DialogTitle>
            <DialogDescription className="mt-1 text-[12px] text-slate-500">
              Phác đồ &quot;{rejectTarget?.nameVi}&quot; sẽ chuyển về trạng thái
              Nháp. Lý do sẽ hiển thị cho kỹ sư khi họ mở lại để sửa.
            </DialogDescription>
          </DialogHeader>
          <div className="px-6 py-5">
            <Textarea
              value={rejectReason}
              onChange={(event) => setRejectReason(event.target.value)}
              placeholder="VD: Bổ sung liều lượng cụ thể cho giai đoạn 2..."
              className="min-h-[100px] border-slate-200 text-[13px]"
            />
          </div>
          <DialogFooter className="border-t border-slate-100 px-6 py-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setRejectTarget(null)}
              className="h-[38px] border-slate-200 bg-white px-4 text-[13px] font-medium shadow-none"
            >
              Hủy
            </Button>
            <Button
              type="button"
              disabled={!rejectReason.trim() || rejectMutation.isPending}
              onClick={() =>
                rejectTarget &&
                rejectMutation.mutate({
                  id: rejectTarget.id,
                  reason: rejectReason.trim(),
                })
              }
              className="h-[38px] bg-amber-600 px-4 text-[13px] font-medium hover:bg-amber-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {rejectMutation.isPending ? (
                <Loader2 size={15} className="mr-2 animate-spin" />
              ) : null}
              Gửi yêu cầu
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isContactDialogOpen} onOpenChange={setIsContactDialogOpen}>
        <DialogContent className="max-w-[440px] gap-0 rounded-[4px] border-slate-200 bg-white p-0 shadow-xl">
          <DialogHeader className="border-b border-slate-100 px-6 py-5">
            <DialogTitle className="text-[16px] font-semibold text-slate-900">
              Kỹ sư liên hệ mặc định
            </DialogTitle>
            <DialogDescription className="mt-1 text-[12px] text-slate-500">
              Dùng khi AI tư vấn tự do (không khớp phác đồ nào đã duyệt) — hệ
              thống tự gắn thông tin này vào cuối câu trả lời.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 px-6 py-5">
            <div>
              <label className="text-[11px] font-bold uppercase text-slate-500">
                Chọn kỹ sư
              </label>
              <Select
                value={selectedEngineerId || undefined}
                onValueChange={handleSelectEngineer}
                disabled={
                  engineersQuery.isLoading || engineerOptions.length === 0
                }
              >
                <SelectTrigger className="mt-1.5 h-[38px] border-slate-200 bg-white text-[13px] shadow-none">
                  <SelectValue
                    placeholder={
                      engineersQuery.isLoading
                        ? "Đang tải danh sách kỹ sư..."
                        : "Chọn kỹ sư liên hệ"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {engineerOptions.map((employee) => (
                    <SelectItem
                      key={employee.id}
                      value={String(employee.id)}
                      className="text-[13px]"
                    >
                      {employee.fullName}
                      {employee.phoneNumber ? ` - ${employee.phoneNumber}` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {engineersQuery.isError ? (
                <p className="mt-1.5 text-[11px] text-rose-500">
                  Không thể tải danh sách kỹ sư.
                </p>
              ) : engineerOptions.length === 0 && !engineersQuery.isLoading ? (
                <p className="mt-1.5 text-[11px] text-slate-400">
                  Chưa có nhân sự đang hoạt động được cấp quyền kỹ sư.
                </p>
              ) : null}
            </div>
            <div>
              <label className="text-[11px] font-bold uppercase text-slate-500">
                Số điện thoại
              </label>
              <Input
                type="text"
                value={contactForm.fallbackContactPhone}
                readOnly
                placeholder="Tự hiển thị sau khi chọn kỹ sư"
                className="mt-1.5 h-[38px] cursor-not-allowed border-slate-200 bg-slate-50 text-[13px] text-slate-600 shadow-none"
              />
            </div>
          </div>

          <DialogFooter className="border-t border-slate-100 px-6 py-4">
            <Button
              type="button"
              variant="outline"
              className="h-[38px] border-slate-200 bg-white px-4 text-[13px] font-medium shadow-none"
              onClick={() => setIsContactDialogOpen(false)}
            >
              Hủy
            </Button>
            <Button
              type="button"
              onClick={() => contactMutation.mutate()}
              disabled={
                !selectedEngineer ||
                !selectedEngineer.phoneNumber?.trim() ||
                contactMutation.isPending
              }
              className="h-[38px] bg-blue-600 px-4 text-[13px] font-medium hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {contactMutation.isPending ? (
                <Loader2 size={15} className="mr-2 animate-spin" />
              ) : (
                <Save size={15} className="mr-2" />
              )}
              Lưu
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function TableActionButton({
  label,
  children,
  onClick,
  disabled,
  className,
}: {
  label: string;
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label={label}
          disabled={disabled}
          className={cn(
            "h-8 w-8 text-slate-400 hover:bg-slate-100 hover:text-blue-600 disabled:cursor-not-allowed disabled:opacity-50",
            className,
          )}
          onClick={onClick}
        >
          {children}
        </Button>
      </TooltipTrigger>
      <TooltipContent side="top">{label}</TooltipContent>
    </Tooltip>
  );
}

function DetailField({
  label,
  value,
}: {
  label: string;
  value?: React.ReactNode;
}) {
  return (
    <div className="rounded-[4px] border border-slate-100 bg-slate-50 px-3 py-2">
      <p className="text-[10px] font-semibold text-slate-400">{label}</p>
      <div className="mt-1 text-[12px] font-medium text-slate-700">
        {value || "Chưa có"}
      </div>
    </div>
  );
}

const HTML_TAG_PATTERN = /<\/?[a-z][\s\S]*>/i;

function TextList({
  items,
  emptyText = "Chưa có dữ liệu",
}: {
  items?: string[];
  emptyText?: string;
}) {
  const visibleItems = (items ?? []).filter((item) => item.trim());

  if (visibleItems.length === 0) {
    return <p className="text-[12px] text-slate-400">{emptyText}</p>;
  }

  return (
    <ul className="space-y-1.5 text-[12px] leading-5 text-slate-600">
      {visibleItems.map((item, index) => (
        <li key={`${item}-${index}`} className="flex gap-2">
          <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-slate-300" />
          {HTML_TAG_PATTERN.test(item) ? (
            <span
              className="prose prose-sm max-w-none text-slate-600 prose-p:my-1 prose-ul:my-1 prose-ol:my-1 prose-li:my-0.5"
              dangerouslySetInnerHTML={{ __html: item }}
            />
          ) : (
            <span>{item}</span>
          )}
        </li>
      ))}
    </ul>
  );
}

function DiseaseDetailDialog({
  disease,
  onOpenChange,
}: {
  disease: AiDiseaseKnowledge | null;
  onOpenChange: (open: boolean) => void;
}) {
  const treatmentStages = disease?.treatmentStages ?? [];

  return (
    <Dialog open={Boolean(disease)} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[88vh] max-w-[860px] gap-0 overflow-hidden rounded-[4px] border-slate-200 bg-white p-0 shadow-xl">
        <DialogHeader className="border-b border-slate-100 px-6 py-5">
          <div className="flex flex-wrap items-start justify-between gap-3 pr-8">
            <div>
              <DialogTitle className="text-[18px] font-semibold text-slate-900">
                {disease?.nameVi ?? "Chi tiết phác đồ"}
              </DialogTitle>
              <DialogDescription className="mt-1 text-[12px] text-slate-500">
                Chỉ xem thông tin phác đồ, không chỉnh sửa tại màn này.
              </DialogDescription>
            </div>
            {disease ? (
              <StatusPill value={disease.status} enabled={disease.enabled} />
            ) : null}
          </div>
        </DialogHeader>

        {disease ? (
          <div className="max-h-[calc(88vh-92px)] overflow-y-auto px-6 py-5">
            <div className="grid gap-3 md:grid-cols-3">
              <DetailField label="Mã phác đồ" value={disease.code} />
              <DetailField
                label="Danh mục"
                value={disease.category?.name ?? "Chưa gán"}
              />
              <DetailField
                label="Trạng thái sử dụng"
                value={disease.enabled ? "Đang bật" : "Đã tắt"}
              />
              <DetailField
                label="Tên tiếng Anh"
                value={disease.nameEn || "Chưa có"}
              />
              <DetailField label="Độ ưu tiên" value={disease.priority} />
              <DetailField
                label="Ngưỡng nhận diện"
                value={`${Math.round((disease.matchThreshold ?? 0) * 100)}%`}
              />
            </div>

            <section className="mt-5 rounded-[4px] border border-slate-200 bg-white">
              <div className="border-b border-slate-100 bg-slate-50 px-4 py-3">
                <p className="text-[12px] font-semibold text-slate-700">
                  Dấu hiệu và nguyên nhân
                </p>
              </div>
              <div className="space-y-4 p-4">
                <div>
                  <p className="mb-2 text-[11px] font-semibold text-slate-400">
                    Dấu hiệu nhận biết
                  </p>
                  <p className="text-[12px] leading-6 text-slate-600">
                    {disease.signsSummary || "Chưa có mô tả dấu hiệu"}
                  </p>
                </div>
                <div>
                  <p className="mb-2 text-[11px] font-semibold text-slate-400">
                    Nguyên nhân
                  </p>
                  <TextList items={disease.causes} />
                </div>
                {disease.symptomKeywordsRaw ? (
                  <div>
                    <p className="mb-2 text-[11px] font-semibold text-slate-400">
                      Từ khóa triệu chứng
                    </p>
                    <p className="text-[12px] leading-6 text-slate-600">
                      {disease.symptomKeywordsRaw}
                    </p>
                  </div>
                ) : null}
              </div>
            </section>

            <section className="mt-5 rounded-[4px] border border-slate-200 bg-white">
              <div className="border-b border-slate-100 bg-slate-50 px-4 py-3">
                <p className="text-[12px] font-semibold text-slate-700">
                  Giai đoạn điều trị
                </p>
              </div>
              <div className="divide-y divide-slate-100">
                {treatmentStages.length > 0 ? (
                  treatmentStages.map((stage, index) => (
                    <div key={`${stage.stageTitle}-${index}`} className="p-4">
                      <p className="text-[12px] font-semibold text-slate-800">
                        {stage.stageTitle || `Giai đoạn ${index + 1}`}
                      </p>
                      {stage.stageSigns ? (
                        <p className="mt-2 text-[12px] leading-6 text-slate-600">
                          {stage.stageSigns}
                        </p>
                      ) : null}
                      {stage.treatmentGoal ? (
                        <p className="mt-2 text-[12px] leading-6 text-slate-600">
                          <span className="font-semibold">Mục tiêu: </span>
                          {stage.treatmentGoal}
                        </p>
                      ) : null}
                      <div className="mt-3 space-y-3">
                        {(stage.subStages?.length
                          ? stage.subStages
                          : [
                              {
                                subStageTitle: stage.stageTitle,
                                instructions: stage.instructions,
                                products: stage.products,
                                extraProductNames: stage.extraProductNames,
                              },
                            ]
                        ).map((subStage, subStageIndex) => (
                          <div
                            key={`${subStage.subStageTitle}-${subStageIndex}`}
                            className="rounded-[4px] border border-slate-100 bg-slate-50 p-3"
                          >
                            <p className="text-[12px] font-semibold text-slate-700">
                              {index + 1}.{subStageIndex + 1} —{" "}
                              {subStage.subStageTitle ||
                                `Giai đoạn con ${subStageIndex + 1}`}
                            </p>
                            <div className="mt-3">
                              <p className="mb-2 text-[11px] font-semibold text-slate-400">
                                Hướng dẫn
                              </p>
                              <TextList items={subStage.instructions} />
                            </div>
                            <div className="mt-3 grid gap-3 md:grid-cols-2">
                              <DetailField
                                label="Sản phẩm đã liên kết"
                                value={
                                  subStage.products?.length ? (
                                    <div className="space-y-1">
                                      {subStage.products.map((product) => (
                                        <p key={product.id}>{product.name}</p>
                                      ))}
                                    </div>
                                  ) : (
                                    "Chưa có"
                                  )
                                }
                              />
                              <DetailField
                                label="Sản phẩm nhập tay"
                                value={
                                  subStage.extraProductNames?.length ? (
                                    <div className="space-y-1">
                                      {subStage.extraProductNames.map(
                                        (name, itemIndex) => (
                                          <p key={`${name}-${itemIndex}`}>
                                            {name}
                                          </p>
                                        ),
                                      )}
                                    </div>
                                  ) : (
                                    "Chưa có"
                                  )
                                }
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="p-4 text-[12px] text-slate-400">
                    Chưa có giai đoạn điều trị.
                  </p>
                )}
              </div>
            </section>

            <section className="mt-5 grid gap-3 md:grid-cols-2">
              <DetailField
                label="Kỹ sư phụ trách"
                value={disease.engineerName || "Chưa gán"}
              />
              <DetailField
                label="SĐT liên hệ"
                value={disease.engineerPhone || "Chưa gán"}
              />
            </section>

            {disease.imageUrls?.length ? (
              <section className="mt-5 rounded-[4px] border border-slate-200 bg-white">
                <div className="border-b border-slate-100 bg-slate-50 px-4 py-3">
                  <p className="text-[12px] font-semibold text-slate-700">
                    Ảnh minh họa
                  </p>
                </div>
                <div className="grid gap-3 p-4 sm:grid-cols-2 md:grid-cols-3">
                  {disease.imageUrls.map((url, index) => (
                    <div
                      key={`${url}-${index}`}
                      className="overflow-hidden rounded-[4px] border border-slate-100 bg-slate-50"
                    >
                      <img
                        src={url}
                        alt={`${disease.nameVi} ${index + 1}`}
                        className="h-32 w-full object-cover"
                      />
                    </div>
                  ))}
                </div>
              </section>
            ) : null}
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

function StatusPill({
  value,
  enabled,
}: {
  value: AiKnowledgeStatus;
  enabled: boolean;
}) {
  const statusKey = !enabled && value === "APPROVED" ? "DISABLED" : value;
  const colorMap: Record<string, string> = {
    APPROVED: "bg-emerald-50 text-emerald-700",
    IN_REVIEW: "bg-amber-50 text-amber-700",
    DRAFT: "bg-slate-100 text-slate-600",
    DISABLED: "bg-rose-50 text-rose-700",
    ARCHIVED: "bg-slate-100 text-slate-500",
  };

  return (
    <span
      className={cn(
        "inline-flex min-w-[82px] items-center justify-center rounded-full px-2.5 py-1 text-[11px] font-medium",
        colorMap[statusKey] ?? "bg-slate-100 text-slate-600",
      )}
    >
      {STATUS_LABELS[statusKey] ?? statusKey}
    </span>
  );
}
