"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowRight,
  CalendarDays,
  Download,
  Loader2,
  Plus,
  Save,
  Search,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PermissionGuard } from "@/components/auth/PermissionGuard";
import {
  AgronomistPageHeader,
  AgronomistPagination,
  AgronomistPanel,
  AgronomistStatCard,
  AgronomistStatGrid,
  AgronomistStatusPill,
  AgronomistToolbar,
  agronomistInputClassName,
  agronomistOutlineButtonClassName,
  agronomistTableCellClassName,
  agronomistTableHeadClassName,
  agronomistTextareaClassName,
} from "@/components/agronomist/agronomist-ui";
import { aiKnowledgeService } from "@/app/services/aiKnowledge.service";
import { getErrorMessage } from "@/lib/axios";
import { cn } from "@/lib/utils";
import { P } from "@/lib/permissions";
import type {
  AiKnowledgeReviewCase,
  AiReviewCaseStatus,
} from "@/app/types/ai-knowledge.types";

const PAGE_SIZE = 10;

type DateRange = "7" | "30" | "all";
type SortMode = "count-desc" | "latest-desc" | "status";

type ReviewQuestionGroup = {
  key: string;
  questionText: string;
  count: number;
  latestAt?: string;
  status: AiReviewCaseStatus;
  cases: AiKnowledgeReviewCase[];
  representative: AiKnowledgeReviewCase;
  matchedKnowledgeCode?: string | null;
  resolutionNotes?: string | null;
};

type ReviewEditorState = {
  group: ReviewQuestionGroup;
  matchedKnowledgeCode: string;
  resolutionNotes: string;
};

type UpdateReviewGroupPayload = {
  group: ReviewQuestionGroup;
  status: AiReviewCaseStatus;
  matchedKnowledgeCode?: string;
  resolutionNotes?: string;
};

export default function AgronomistReviewPage() {
  return (
    <PermissionGuard permission={P.AI_CASE_REVIEW}>
      <AgronomistReviewContent />
    </PermissionGuard>
  );
}

function AgronomistReviewContent() {
  const queryClient = useQueryClient();
  const [dateRange, setDateRange] = useState<DateRange>("7");
  const [keyword, setKeyword] = useState("");
  const [sortMode, setSortMode] = useState<SortMode>("count-desc");
  const [page, setPage] = useState(0);
  const [editor, setEditor] = useState<ReviewEditorState | null>(null);

  const reviewCasesQuery = useQuery({
    queryKey: ["ai-knowledge", "review-cases"],
    queryFn: () => aiKnowledgeService.getReviewCases(),
  });

  const reviewCases = reviewCasesQuery.data ?? [];

  const groupedCases = useMemo(
    () =>
      buildReviewGroups(
        reviewCases.filter((item) => isInDateRange(item.createdAt, dateRange)),
      ),
    [dateRange, reviewCases],
  );

  const filteredGroups = useMemo(() => {
    const normalizedKeyword = normalizeText(keyword);
    const filtered = groupedCases.filter((group) => {
      if (!normalizedKeyword) return true;
      return [
        group.questionText,
        group.representative.userSymptoms,
        group.matchedKnowledgeCode,
        group.resolutionNotes,
      ].some((value) => normalizeText(value || "").includes(normalizedKeyword));
    });

    return filtered.sort((left, right) => {
      if (sortMode === "latest-desc") {
        return toTime(right.latestAt) - toTime(left.latestAt);
      }
      if (sortMode === "status") {
        return (
          statusOrder(left.status) - statusOrder(right.status) ||
          toTime(right.latestAt) - toTime(left.latestAt)
        );
      }
      return (
        right.count - left.count ||
        toTime(right.latestAt) - toTime(left.latestAt)
      );
    });
  }, [groupedCases, keyword, sortMode]);

  const stats = useMemo(() => {
    const unresolved = groupedCases.reduce(
      (sum, group) =>
        sum +
        group.cases.filter(
          (item) => item.status === "NEW" || item.status === "IN_PROGRESS",
        ).length,
      0,
    );
    const mostRepeated = Math.max(
      0,
      ...groupedCases.map((group) => group.count),
    );
    const resolvedCount = groupedCases.reduce(
      (sum, group) =>
        sum + group.cases.filter((item) => item.status === "RESOLVED").length,
      0,
    );
    const totalCases = groupedCases.reduce(
      (sum, group) => sum + group.count,
      0,
    );
    const replyRate =
      totalCases === 0 ? 100 : Math.round((resolvedCount / totalCases) * 100);
    return { unresolved, mostRepeated, replyRate };
  }, [groupedCases]);

  const total = filteredGroups.length;
  const paginatedGroups = filteredGroups.slice(
    page * PAGE_SIZE,
    (page + 1) * PAGE_SIZE,
  );

  const updateCaseMutation = useMutation({
    mutationFn: async (payload: UpdateReviewGroupPayload) => {
      const targetCases = payload.group.cases.filter((item) => {
        if (payload.status === "RESOLVED") return item.status !== "RESOLVED";
        return true;
      });

      await Promise.all(
        targetCases.map((item) =>
          aiKnowledgeService.updateReviewCase(item.id, {
            status: payload.status,
            matchedKnowledgeCode: payload.matchedKnowledgeCode || undefined,
            resolutionNotes: payload.resolutionNotes || undefined,
          }),
        ),
      );
    },
    onSuccess: async () => {
      toast.success("Đã cập nhật câu hỏi.");
      setEditor(null);
      await queryClient.invalidateQueries({
        queryKey: ["ai-knowledge", "review-cases"],
      });
    },
    onError: (error: unknown) =>
      toast.error(getErrorMessage(error) || "Không thể cập nhật câu hỏi."),
  });

  const openEditor = (group: ReviewQuestionGroup) => {
    setEditor({
      group,
      matchedKnowledgeCode: group.matchedKnowledgeCode || "",
      resolutionNotes: group.resolutionNotes || "",
    });
  };

  const exportExcel = async () => {
    const XLSX = await import("xlsx");
    const rows = filteredGroups.map((group) => ({
      "Nội dung câu hỏi": group.questionText,
      "Số lần hỏi": group.count,
      "Lần hỏi gần nhất": formatDateTime(group.latestAt),
      "Trạng thái": REVIEW_STATUS_LABELS[group.status] ?? group.status,
      "Mã tri thức": group.matchedKnowledgeCode || "",
      "Ghi chú": group.resolutionNotes || "",
    }));
    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "review");
    XLSX.writeFile(workbook, "agronomist-review-cases.xlsx");
  };

  return (
    <div className="space-y-5">
      <AgronomistPageHeader
        title="Hộp câu hỏi chưa giải đáp"
        actions={
          <button
            type="button"
            onClick={exportExcel}
            className={agronomistOutlineButtonClassName}
          >
            <Download className="h-4 w-4" />
            Xuất Excel
          </button>
        }
      />

      <AgronomistStatGrid>
        <AgronomistStatCard
          label="Tổng câu hỏi chưa trả lời (7 ngày)"
          value={stats.unresolved}
        />
        <AgronomistStatCard
          label="Trùng lặp nhiều nhất"
          value={stats.mostRepeated}
        />
        <AgronomistStatCard
          label="Tỷ lệ bot trả lời"
          value={`${stats.replyRate}%`}
          valueClassName="text-[#252896]"
        />
      </AgronomistStatGrid>

      <AgronomistPanel>
        <AgronomistToolbar>
          <Select
            value={dateRange}
            onValueChange={(value) => setDateRange(value as DateRange)}
          >
            <SelectTrigger
              className={cn(agronomistInputClassName, "w-full sm:w-[150px]")}
            >
              <div className="flex items-center gap-2">
                <CalendarDays className="h-3.5 w-3.5 text-slate-500" />
                <SelectValue />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7" className="text-[12px]">
                7 ngày qua
              </SelectItem>
              <SelectItem value="30" className="text-[12px]">
                30 ngày qua
              </SelectItem>
              <SelectItem value="all" className="text-[12px]">
                Tất cả thời gian
              </SelectItem>
            </SelectContent>
          </Select>

          <div className="relative w-full sm:max-w-[300px]">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
            <Input
              value={keyword}
              onChange={(event) => setKeyword(event.target.value)}
              placeholder="Tìm câu hỏi..."
              className={cn(agronomistInputClassName, "pl-9")}
            />
          </div>

          <Select
            value={sortMode}
            onValueChange={(value) => setSortMode(value as SortMode)}
          >
            <SelectTrigger
              className={cn(agronomistInputClassName, "w-full sm:w-[210px]")}
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="count-desc" className="text-[12px]">
                Sắp xếp theo: Tần suất cao nhất
              </SelectItem>
              <SelectItem value="latest-desc" className="text-[12px]">
                Sắp xếp theo: Mới nhất
              </SelectItem>
              <SelectItem value="status" className="text-[12px]">
                Sắp xếp theo: Trạng thái
              </SelectItem>
            </SelectContent>
          </Select>
        </AgronomistToolbar>

        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full min-w-[900px] border-collapse text-left">
            <thead className={agronomistTableHeadClassName}>
              <tr>
                <th className="px-4 py-4">Nội dung câu hỏi</th>
                <th className="w-[120px] px-4 py-4">Số lần hỏi</th>
                <th className="w-[170px] px-4 py-4">Lần hỏi gần nhất</th>
                <th className="w-[160px] px-4 py-4 text-center">Trạng thái</th>
                <th className="w-[190px] px-4 py-4 text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {reviewCasesQuery.isLoading ? (
                Array.from({ length: 4 }).map((_, index) => (
                  <tr key={index} className="border-t border-[#e7eaf0]">
                    <td className={agronomistTableCellClassName}>
                      <div className="h-4 w-72 animate-pulse rounded bg-slate-100" />
                    </td>
                    <td className={agronomistTableCellClassName}>
                      <div className="h-5 w-9 animate-pulse rounded bg-slate-100" />
                    </td>
                    <td className={agronomistTableCellClassName}>
                      <div className="h-4 w-24 animate-pulse rounded bg-slate-100" />
                    </td>
                    <td className={agronomistTableCellClassName}>
                      <div className="mx-auto h-5 w-24 animate-pulse rounded-full bg-slate-100" />
                    </td>
                    <td className={agronomistTableCellClassName} />
                  </tr>
                ))
              ) : paginatedGroups.length > 0 ? (
                paginatedGroups.map((group) => (
                  <tr
                    key={group.key}
                    className="border-t border-[#e7eaf0] transition-colors hover:bg-[#f9fafc]"
                  >
                    <td className="px-4 py-4 align-top">
                      <p className="max-w-[390px] text-[12px] font-semibold leading-5 text-[#232323]">
                        {group.questionText}
                      </p>
                    </td>
                    <td className="px-4 py-4 align-top">
                      <span className="inline-flex min-w-8 items-center justify-center rounded-[2px] bg-[#e8ebf1] px-2 py-1 text-[11px] font-semibold text-slate-600">
                        {group.count}
                      </span>
                    </td>
                    <td
                      className={cn(agronomistTableCellClassName, "align-top")}
                    >
                      {formatRelativeTime(group.latestAt)}
                    </td>
                    <td className="px-4 py-4 text-center align-top">
                      <ReviewStatusPill status={group.status} />
                    </td>
                    <td className="px-4 py-4 text-center align-top">
                      {group.status === "RESOLVED" ? (
                        <button
                          type="button"
                          onClick={() => openEditor(group)}
                          className="inline-flex h-8 items-center justify-center gap-1 text-[11px] font-semibold text-[#252896]"
                        >
                          Xem tri thức đã thêm
                          <ArrowRight className="h-3.5 w-3.5" />
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => openEditor(group)}
                          className="inline-flex h-8 items-center justify-center rounded-[2px] border border-[#252896] bg-white px-3 text-[11px] font-semibold text-[#252896] hover:bg-[#eef0ff]"
                        >
                          <Plus className="h-3.5 w-3.5" />
                          Thêm vào tri thức
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={5}
                    className="h-[180px] px-4 text-center text-[12px] font-medium text-slate-400"
                  >
                    Không có câu hỏi phù hợp.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <AgronomistPagination
          page={page}
          pageSize={PAGE_SIZE}
          total={total}
          disabled={reviewCasesQuery.isLoading}
          onPageChange={setPage}
        />
      </AgronomistPanel>

      <Dialog
        open={Boolean(editor)}
        onOpenChange={(open) => !open && setEditor(null)}
      >
        <DialogContent className="max-h-[92vh] w-[95vw] max-w-[560px] gap-0 overflow-hidden rounded-[4px] border border-[#dcdfe8] bg-white p-0 shadow-xl">
          <DialogHeader className="border-b border-[#e8ebf1] px-6 py-5">
            <DialogTitle className="text-left text-[18px] font-semibold text-[#232323]">
              {editor?.group.status === "RESOLVED"
                ? "Tri thức đã thêm"
                : "Thêm vào tri thức"}
            </DialogTitle>
          </DialogHeader>

          {editor ? (
            <div className="max-h-[calc(92vh-145px)] overflow-y-auto px-6 py-5">
              <div className="rounded-[3px] border border-[#bcc6ff] bg-[#e4e8ff] px-4 py-3 text-[12px] leading-5 text-[#252896]">
                {editor.group.questionText}
              </div>
              <div className="mt-5 grid gap-4 sm:grid-cols-[160px,1fr]">
                <div className="space-y-2">
                  <Label className="text-[12px] font-semibold text-[#232323]">
                    Mã tri thức
                  </Label>
                  <Input
                    value={editor.matchedKnowledgeCode}
                    onChange={(event) =>
                      setEditor({
                        ...editor,
                        matchedKnowledgeCode: event.target.value,
                      })
                    }
                    placeholder="VD: FAQ_DOM_TRANG"
                    className={agronomistInputClassName}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[12px] font-semibold text-[#232323]">
                    Ghi chú xử lý
                  </Label>
                  <Textarea
                    value={editor.resolutionNotes}
                    onChange={(event) =>
                      setEditor({
                        ...editor,
                        resolutionNotes: event.target.value,
                      })
                    }
                    rows={4}
                    placeholder="Mô tả tri thức đã thêm hoặc lý do xử lý..."
                    className={cn(
                      agronomistTextareaClassName,
                      "min-h-[102px] resize-none",
                    )}
                  />
                </div>
              </div>
            </div>
          ) : null}

          <DialogFooter className="border-t border-[#e8ebf1] bg-[#f8f8f8] px-6 py-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setEditor(null)}
              className="h-9 rounded-[4px] border-[#aeb5c4] px-5 text-[12px] font-medium shadow-none"
            >
              Hủy
            </Button>
            {editor?.group.status !== "RESOLVED" ? (
              <Button
                type="button"
                variant="outline"
                disabled={updateCaseMutation.isPending}
                onClick={() =>
                  editor &&
                  updateCaseMutation.mutate({
                    group: editor.group,
                    status: "IGNORED",
                    matchedKnowledgeCode: editor.matchedKnowledgeCode,
                    resolutionNotes: editor.resolutionNotes,
                  })
                }
                className="h-9 rounded-[4px] border-[#d2453f] px-5 text-[12px] font-semibold text-[#d2453f] shadow-none hover:bg-rose-50"
              >
                Bỏ qua
              </Button>
            ) : null}
            <Button
              type="button"
              disabled={!editor || updateCaseMutation.isPending}
              onClick={() =>
                editor &&
                updateCaseMutation.mutate({
                  group: editor.group,
                  status: "RESOLVED",
                  matchedKnowledgeCode: editor.matchedKnowledgeCode,
                  resolutionNotes: editor.resolutionNotes,
                })
              }
              className="h-9 rounded-[4px] bg-[#252896] px-5 text-[12px] font-semibold text-white shadow-none hover:bg-[#1d2078]"
            >
              {updateCaseMutation.isPending ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Save className="h-3.5 w-3.5" />
              )}
              Cập nhật
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

const REVIEW_STATUS_LABELS: Record<AiReviewCaseStatus, string> = {
  NEW: "Chưa xử lý",
  IN_PROGRESS: "Đang xử lý",
  RESOLVED: "Đã thêm tri thức",
  IGNORED: "Bỏ qua",
};

function ReviewStatusPill({ status }: { status: AiReviewCaseStatus }) {
  if (status === "RESOLVED")
    return (
      <AgronomistStatusPill tone="gray">
        {REVIEW_STATUS_LABELS[status]}
      </AgronomistStatusPill>
    );
  if (status === "IN_PROGRESS")
    return (
      <AgronomistStatusPill tone="amber">
        {REVIEW_STATUS_LABELS[status]}
      </AgronomistStatusPill>
    );
  if (status === "IGNORED")
    return (
      <AgronomistStatusPill tone="red">
        {REVIEW_STATUS_LABELS[status]}
      </AgronomistStatusPill>
    );
  return (
    <AgronomistStatusPill tone="blue">
      {REVIEW_STATUS_LABELS[status]}
    </AgronomistStatusPill>
  );
}

function buildReviewGroups(
  items: AiKnowledgeReviewCase[],
): ReviewQuestionGroup[] {
  const map = new Map<string, AiKnowledgeReviewCase[]>();
  for (const item of items) {
    const questionText = item.questionText?.trim() || "Chưa có nội dung";
    const key = normalizeText(questionText) || `case-${item.id}`;
    const current = map.get(key) ?? [];
    current.push(item);
    map.set(key, current);
  }

  return Array.from(map.entries()).map(([key, cases]) => {
    const sortedCases = [...cases].sort(
      (left, right) => toTime(right.createdAt) - toTime(left.createdAt),
    );
    const representative = sortedCases[0];
    return {
      key,
      questionText: representative.questionText?.trim() || "Chưa có nội dung",
      count: cases.length,
      latestAt: representative.createdAt,
      status: resolveGroupStatus(cases),
      cases,
      representative,
      matchedKnowledgeCode: sortedCases.find(
        (item) => item.matchedKnowledgeCode,
      )?.matchedKnowledgeCode,
      resolutionNotes: sortedCases.find((item) => item.resolutionNotes)
        ?.resolutionNotes,
    };
  });
}

function resolveGroupStatus(
  items: AiKnowledgeReviewCase[],
): AiReviewCaseStatus {
  if (items.some((item) => item.status === "NEW")) return "NEW";
  if (items.some((item) => item.status === "IN_PROGRESS")) return "IN_PROGRESS";
  if (items.every((item) => item.status === "RESOLVED")) return "RESOLVED";
  return "IGNORED";
}

function isInDateRange(value: string | undefined, range: DateRange) {
  if (range === "all") return true;
  if (!value) return false;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return false;
  const days = Number(range);
  return Date.now() - date.getTime() <= days * 24 * 60 * 60 * 1000;
}

function formatRelativeTime(value?: string) {
  if (!value) return "Chưa ghi nhận";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Chưa ghi nhận";
  const diffMs = Date.now() - date.getTime();
  const minutes = Math.max(0, Math.floor(diffMs / 60000));
  if (minutes < 1) return "Vừa xong";
  if (minutes < 60) return `${minutes} phút trước`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} giờ trước`;
  const days = Math.floor(hours / 24);
  return `${days} ngày trước`;
}

function formatDateTime(value?: string) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function statusOrder(status: AiReviewCaseStatus) {
  return { NEW: 0, IN_PROGRESS: 1, RESOLVED: 2, IGNORED: 3 }[status] ?? 9;
}

function toTime(value?: string) {
  if (!value) return 0;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 0 : date.getTime();
}

function normalizeText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase()
    .trim();
}
