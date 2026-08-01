"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import {
  ClipboardCheck,
  Download,
  Edit,
  FileSpreadsheet,
  Loader2,
  Plus,
  Search,
  Trash2,
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PermissionGuard } from "@/components/auth/PermissionGuard";
import { usePermissions } from "@/hooks/usePermissions";
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
  agronomistPrimaryButtonClassName,
  agronomistTableHeadClassName,
} from "@/components/agronomist/agronomist-ui";
import { cn } from "@/lib/utils";
import { P } from "@/lib/permissions";
import { aiKnowledgeService } from "@/app/services/aiKnowledge.service";
import type { AiDiseaseKnowledge } from "@/app/types/ai-knowledge.types";

const PAGE_SIZE = 10;

export default function AgronomistDiseasesPage() {
  return (
    <PermissionGuard
      anyOf={[
        P.AI_KNOWLEDGE_VIEW,
        P.AI_KNOWLEDGE_CREATE,
        P.AI_KNOWLEDGE_UPDATE,
        P.AI_IMPORT_KNOWLEDGE,
      ]}
    >
      <AgronomistDiseasesContent />
    </PermissionGuard>
  );
}

function AgronomistDiseasesContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { hasPermission } = usePermissions();
  const canCreate = hasPermission(P.AI_KNOWLEDGE_CREATE);
  const canUpdate = hasPermission(P.AI_KNOWLEDGE_UPDATE);
  const canImportKnowledge = hasPermission(P.AI_IMPORT_KNOWLEDGE);

  const [diseases, setDiseases] = useState<AiDiseaseKnowledge[]>([]);
  const [loading, setLoading] = useState(true);
  const [keyword, setKeyword] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [deleteTarget, setDeleteTarget] = useState<AiDiseaseKnowledge | null>(
    null,
  );
  const [page, setPage] = useState(0);

  const loadData = async () => {
    setLoading(true);
    try {
      setDiseases(await aiKnowledgeService.getDiseases());
    } catch {
      toast.error("Không thể tải danh sách phác đồ");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (searchParams.get("panel") === "import" && canImportKnowledge) {
      router.replace("/agronomist/import", { scroll: false });
    }
  }, [canImportKnowledge, router, searchParams]);

  useEffect(() => {
    setPage(0);
  }, [keyword, statusFilter]);

  const filtered = useMemo(() => {
    const normalizedKeyword = normalizeText(keyword);
    return diseases
      .filter((item) => {
        if (statusFilter !== "all" && item.status !== statusFilter)
          return false;
        if (!normalizedKeyword) return true;
        return [
          item.nameVi,
          item.nameEn,
          item.code,
          item.signsSummary,
          item.category?.name,
        ].some((value) =>
          normalizeText(String(value ?? "")).includes(normalizedKeyword),
        );
      })
      .sort(
        (left, right) =>
          right.priority - left.priority ||
          left.nameVi.localeCompare(right.nameVi),
      );
  }, [diseases, keyword, statusFilter]);

  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const paginated = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  useEffect(() => {
    if (page > totalPages - 1) setPage(totalPages - 1);
  }, [page, totalPages]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await aiKnowledgeService.deleteDisease(deleteTarget.id);
      toast.success("Đã xóa phác đồ");
      await loadData();
    } catch {
      toast.error("Xóa phác đồ thất bại");
    } finally {
      setDeleteTarget(null);
    }
  };

  return (
    <div className="space-y-5">
      <AgronomistPageHeader
        title="Quản lý phác đồ AI Doctor"
        actions={
          <>
            {canImportKnowledge ? (
              <>
                <a
                  href={aiKnowledgeService.getTemplateDownloadUrl()}
                  className={agronomistOutlineButtonClassName}
                >
                  <Download className="h-4 w-4" />
                  Tải file mẫu
                </a>
                <Link
                  href="/agronomist/import"
                  className={agronomistOutlineButtonClassName}
                >
                  <FileSpreadsheet className="h-4 w-4" />
                  Import Excel
                </Link>
              </>
            ) : null}
            {canCreate ? (
              <Link
                href="/agronomist/diseases/new"
                className={agronomistPrimaryButtonClassName}
              >
                <Plus className="h-4 w-4" />
                Thêm phác đồ
              </Link>
            ) : null}
          </>
        }
      />

      <AgronomistStatGrid>
        <AgronomistStatCard label="Tổng phác đồ" value={diseases.length} />
        <AgronomistStatCard
          label="Chờ duyệt"
          value={diseases.filter((item) => item.status === "IN_REVIEW").length}
        />
        <AgronomistStatCard
          label="Đang sử dụng"
          value={
            diseases.filter(
              (item) => item.status === "APPROVED" && item.enabled,
            ).length
          }
          valueClassName="text-[#252896]"
        />
      </AgronomistStatGrid>

      <AgronomistPanel>
        <AgronomistToolbar>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger
              className={cn(agronomistInputClassName, "w-full sm:w-[190px]")}
            >
              <SelectValue placeholder="Tất cả trạng thái" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="text-[12px]">
                Tất cả trạng thái
              </SelectItem>
              <SelectItem value="IN_REVIEW" className="text-[12px]">
                Chờ duyệt
              </SelectItem>
              <SelectItem value="APPROVED" className="text-[12px]">
                Đã duyệt
              </SelectItem>
              <SelectItem value="DRAFT" className="text-[12px]">
                Nháp / bị từ chối
              </SelectItem>
              <SelectItem value="DISABLED" className="text-[12px]">
                Đã tắt
              </SelectItem>
            </SelectContent>
          </Select>
          <div className="relative w-full sm:max-w-[360px]">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
            <Input
              value={keyword}
              onChange={(event) => setKeyword(event.target.value)}
              placeholder="Tìm mã bệnh, tên bệnh..."
              className={cn(agronomistInputClassName, "pl-9")}
            />
          </div>
        </AgronomistToolbar>

        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full min-w-[960px] border-collapse text-left">
            <thead className={agronomistTableHeadClassName}>
              <tr>
                <th className="w-[70px] px-4 py-4">STT</th>
                <th className="w-[240px] px-4 py-4">Bệnh / Danh mục</th>
                <th className="px-4 py-4">Dấu hiệu</th>
                <th className="w-[150px] px-4 py-4 text-center">Trạng thái</th>
                <th className="w-[140px] px-4 py-4 text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, index) => (
                  <tr key={index} className="border-t border-[#e7eaf0]">
                    <td className="px-4 py-4">
                      <div className="h-4 w-6 animate-pulse rounded bg-slate-100" />
                    </td>
                    <td className="px-4 py-4">
                      <div className="h-4 w-40 animate-pulse rounded bg-slate-100" />
                    </td>
                    <td className="px-4 py-4">
                      <div className="h-4 w-72 animate-pulse rounded bg-slate-100" />
                    </td>
                    <td className="px-4 py-4">
                      <div className="mx-auto h-5 w-24 animate-pulse rounded-full bg-slate-100" />
                    </td>
                    <td className="px-4 py-4" />
                  </tr>
                ))
              ) : paginated.length > 0 ? (
                paginated.map((item, index) => (
                  <tr
                    key={item.id}
                    className="border-t border-[#e7eaf0] transition-colors hover:bg-[#f9fafc]"
                  >
                    <td className="px-4 py-4 text-[12px] text-slate-500">
                      {page * PAGE_SIZE + index + 1}
                    </td>
                    <td className="px-4 py-4 align-top">
                      <p className="text-[12px] font-semibold text-[#232323]">
                        {item.nameVi}{" "}
                        <span className="font-normal text-slate-400">
                          ({item.code})
                        </span>
                      </p>
                      <p className="mt-1 text-[11px] text-slate-500">
                        {item.category?.name ?? "Chưa phân loại"}
                      </p>
                    </td>
                    <td className="max-w-[420px] px-4 py-4 align-top">
                      <p className="line-clamp-2 text-[12px] leading-5 text-slate-600">
                        {item.signsSummary || "-"}
                      </p>
                    </td>
                    <td className="px-4 py-4 text-center align-top">
                      <DiseaseStatusPill item={item} />
                    </td>
                    <td className="px-4 py-4 align-top">
                      <div className="flex justify-center gap-2">
                        <Link href={`/agronomist/diseases/${item.id}/edit`}>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            disabled={!canUpdate}
                            className="h-8 rounded-[4px] border-[#f3a340] bg-white px-3 text-[12px] font-medium text-[#e58a00] shadow-none hover:bg-orange-50"
                          >
                            <Edit className="h-3.5 w-3.5" />
                            Sửa
                          </Button>
                        </Link>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          disabled={!canUpdate}
                          onClick={() => setDeleteTarget(item)}
                          className="h-8 rounded-[4px] border-[#f04438] bg-white px-3 text-[12px] font-medium text-[#f04438] shadow-none hover:bg-rose-50"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          Xóa
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={5}
                    className="h-[180px] px-4 text-center text-[12px] font-medium text-slate-400"
                  >
                    <div className="flex flex-col items-center gap-2">
                      <ClipboardCheck className="h-5 w-5 text-slate-300" />
                      Không có phác đồ phù hợp.
                    </div>
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
          disabled={loading}
          onPageChange={setPage}
        />
      </AgronomistPanel>

      <AlertDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <AlertDialogContent className="max-w-[420px] rounded-[4px] border border-[#dcdfe8] bg-white p-0 shadow-xl">
          <AlertDialogHeader className="border-b border-[#e8ebf1] px-6 py-5">
            <AlertDialogTitle className="text-[18px] font-semibold text-[#232323]">
              Xóa phác đồ này?
            </AlertDialogTitle>
            <AlertDialogDescription className="pt-4 text-[13px] leading-6 text-slate-500">
              Phác đồ sẽ bị xóa vĩnh viễn và không thể khôi phục.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {deleteTarget ? (
            <div className="mx-6 mt-5 overflow-hidden rounded-[4px] border border-[#e8ebf1]">
              <div className="bg-[#f2f3f5] px-4 py-3 text-[11px] font-semibold uppercase text-slate-500">
                Phác đồ
              </div>
              <div className="px-4 py-3 text-[13px] font-medium text-slate-700">
                {deleteTarget.nameVi}
              </div>
            </div>
          ) : null}
          <AlertDialogFooter className="border-t border-[#e8ebf1] px-6 py-4">
            <AlertDialogCancel className="h-9 rounded-[4px] border-[#aeb5c4] px-5 text-[12px] font-medium shadow-none">
              Hủy
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="h-9 rounded-[4px] bg-[#d2453f] px-5 text-[12px] font-semibold text-white shadow-none hover:bg-[#b93632]"
            >
              Đồng ý xóa
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function DiseaseStatusPill({ item }: { item: AiDiseaseKnowledge }) {
  if (
    !item.enabled ||
    item.status === "DISABLED" ||
    item.status === "ARCHIVED"
  ) {
    return <AgronomistStatusPill tone="gray">Đã tắt</AgronomistStatusPill>;
  }
  if (item.status === "APPROVED") {
    return (
      <AgronomistStatusPill tone="blue">Đang sử dụng</AgronomistStatusPill>
    );
  }
  if (item.status === "IN_REVIEW") {
    return <AgronomistStatusPill tone="amber">Chờ duyệt</AgronomistStatusPill>;
  }
  return <AgronomistStatusPill tone="gray">Bản nháp</AgronomistStatusPill>;
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
