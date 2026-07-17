"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Plus, Edit, Trash2, Search, ClipboardCheck } from "lucide-react";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
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
import { cn } from "@/lib/utils";
import { aiKnowledgeService } from "@/app/services/aiKnowledge.service";
import type { AiDiseaseKnowledge } from "@/app/types/ai-knowledge.types";

const PAGE_SIZE = 20;

const STATUS_META: Record<string, { label: string; className: string }> = {
  APPROVED: { label: "Đã duyệt", className: "border-emerald-100 bg-emerald-50 text-emerald-600" },
  IN_REVIEW: { label: "Chờ duyệt", className: "border-amber-100 bg-amber-50 text-amber-600" },
  DRAFT: { label: "Nháp / bị từ chối", className: "border-slate-200 bg-slate-100 text-slate-500" },
  DISABLED: { label: "Đã tắt", className: "border-rose-100 bg-rose-50 text-rose-600" },
};

export default function AgronomistDiseasesPage() {
  const [diseases, setDiseases] = useState<AiDiseaseKnowledge[]>([]);
  const [loading, setLoading] = useState(true);
  const [keyword, setKeyword] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [deleteId, setDeleteId] = useState<number | null>(null);
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

  useEffect(() => { loadData(); }, []);
  useEffect(() => { setPage(0); }, [keyword, statusFilter]);

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await aiKnowledgeService.deleteDisease(deleteId);
      toast.success("Đã xóa phác đồ");
      await loadData();
    } catch {
      toast.error("Xóa phác đồ thất bại");
    } finally {
      setDeleteId(null);
    }
  };

  const normalizedKeyword = keyword.trim().toLowerCase();
  const filtered = diseases
    .filter((item) => {
      if (statusFilter !== "all" && item.status !== statusFilter) return false;
      if (!normalizedKeyword) return true;
      return [item.nameVi, item.nameEn, item.code].some((value) =>
        String(value ?? "").toLowerCase().includes(normalizedKeyword),
      );
    })
    .sort((left, right) => right.priority - left.priority || left.nameVi.localeCompare(right.nameVi));

  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const paginated = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const pendingCount = diseases.filter((item) => item.status === "IN_REVIEW").length;
  const approvedCount = diseases.filter((item) => item.status === "APPROVED").length;
  const miniReports = [
    { label: "Tổng phác đồ", value: diseases.length, note: "Toàn bộ phác đồ đã tạo" },
    { label: "Chờ Admin duyệt", value: pendingCount, note: "Chưa được AI Doctor dùng để trả lời" },
    { label: "Đã duyệt", value: approvedCount, note: "AI Doctor đang dùng để trả lời" },
  ];

  return (
    <div className="space-y-3">
      <div className="mt-2 mb-8 px-1">
        <h1 className="text-[20px] font-semibold tracking-tight uppercase text-slate-900">
          Phác đồ điều trị
        </h1>

        <div className="mt-4 flex flex-col gap-2 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex flex-1 flex-col gap-2 lg:flex-row lg:flex-wrap lg:items-center">
            <div className="relative w-full lg:max-w-[360px]">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" />
              <Input
                value={keyword}
                onChange={(event) => setKeyword(event.target.value)}
                placeholder="Tìm mã bệnh, tên bệnh..."
                className="h-[38px] rounded-md border-slate-200 bg-white pl-10 text-[13px] shadow-none focus-visible:ring-blue-500/20"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="h-[38px] w-full rounded-md border-slate-200 bg-white text-[13px] font-medium text-slate-600 shadow-none focus:ring-0 lg:w-[200px]">
                <SelectValue placeholder="Tất cả trạng thái" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="text-[13px]">Tất cả trạng thái</SelectItem>
                <SelectItem value="IN_REVIEW" className="text-[13px]">Chờ duyệt</SelectItem>
                <SelectItem value="APPROVED" className="text-[13px]">Đã duyệt</SelectItem>
                <SelectItem value="DRAFT" className="text-[13px]">Nháp / bị từ chối</SelectItem>
                <SelectItem value="DISABLED" className="text-[13px]">Đã tắt</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-wrap justify-end gap-2">
            <Link href="/agronomist/diseases/new">
              <Button className="h-[38px] rounded-[4px] bg-blue-600 px-4 text-[13px] font-medium text-white shadow-sm hover:bg-blue-700">
                <Plus size={15} className="mr-1.5" />
                Thêm phác đồ
              </Button>
            </Link>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-2.5 sm:grid-cols-3">
          {miniReports.map((report) => (
            <div key={report.label} className="rounded-[4px] border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-[11px] font-semibold text-slate-400">{report.label}</p>
              <p className="mt-1 text-[18px] font-semibold leading-6 text-slate-900">{report.value}</p>
              <p className="mt-1 text-[10px] leading-4 text-slate-500">{report.note}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="overflow-hidden rounded-[4px] border border-[#dcdcdc] bg-white shadow-sm">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="table-custom min-w-[900px] w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-[#ccc] bg-[#f0f0f0]">
                <th className="w-[56px] px-4 py-3 text-[10px] font-semibold text-[#1f1f1f]">STT</th>
                <th className="px-2 py-3 text-[10px] font-semibold text-[#1f1f1f]">Bệnh / Danh mục</th>
                <th className="px-2 py-3 text-[10px] font-semibold text-[#1f1f1f]">Dấu hiệu</th>
                <th className="w-[130px] px-2 py-3 text-center text-[10px] font-semibold text-[#1f1f1f]">Trạng thái</th>
                <th className="w-[104px] px-4 py-3 text-right text-[10px] font-semibold text-[#1f1f1f]">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b border-[#eee]">
                    <td className="px-4 py-3"><div className="h-3.5 w-6 animate-pulse rounded bg-slate-100" /></td>
                    <td className="px-2 py-3"><div className="h-3.5 w-40 animate-pulse rounded bg-slate-100" /></td>
                    <td className="px-2 py-3"><div className="h-3.5 w-56 animate-pulse rounded bg-slate-100" /></td>
                    <td className="px-2 py-3"><div className="mx-auto h-6 w-20 animate-pulse rounded bg-slate-100" /></td>
                    <td className="px-4 py-3" />
                  </tr>
                ))
              ) : paginated.length > 0 ? (
                paginated.map((item, index) => (
                  <tr key={item.id} className="border-b border-[#eee] transition-colors hover:bg-[#f0f8ff]">
                    <td className="px-4 py-3 text-[11px] font-medium text-slate-500">
                      {page * PAGE_SIZE + index + 1}
                    </td>
                    <td className="px-2 py-3">
                      <p className="text-[11px] font-semibold text-slate-800">
                        {item.nameVi} <span className="font-normal text-slate-400">({item.code})</span>
                      </p>
                      {item.category && (
                        <span className="mt-1 block text-[10px] font-medium text-slate-500">
                          {item.category.name}
                        </span>
                      )}
                    </td>
                    <td className="max-w-[360px] truncate px-2 py-3 text-[11px] text-slate-500">
                      {item.signsSummary}
                    </td>
                    <td className="px-2 py-3 text-center">
                      <span className={cn(
                        "inline-flex min-w-[90px] items-center justify-center rounded-[4px] border px-2 py-1 text-[10px] font-semibold",
                        STATUS_META[item.status]?.className ?? STATUS_META.DRAFT.className,
                      )}>
                        {STATUS_META[item.status]?.label ?? item.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-1">
                        <Link href={`/agronomist/diseases/${item.id}/edit`}>
                          <Button variant="ghost" size="icon" title="Chỉnh sửa"
                            className="h-7 w-7 rounded-[4px] text-slate-400 hover:bg-blue-50 hover:text-blue-600">
                            <Edit size={14} />
                          </Button>
                        </Link>
                        <Button variant="ghost" size="icon" title="Xóa"
                          className="h-7 w-7 rounded-[4px] text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                          onClick={() => setDeleteId(item.id)}>
                          <Trash2 size={14} />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="h-[180px] text-center text-[12px] font-medium text-slate-400">
                    <div className="flex flex-col items-center gap-2">
                      <ClipboardCheck size={20} className="text-slate-300" />
                      {normalizedKeyword ? "Không tìm thấy phác đồ phù hợp." : "Chưa có phác đồ nào."}
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="flex min-w-full shrink-0 items-center justify-between border-t border-slate-100 bg-[#f8f9fa] px-5 py-3">
          <p className="text-[12px] font-semibold text-slate-500">Tổng số: {total} phác đồ</p>
          <div className="flex items-center gap-1">
            <Button variant="ghost" disabled={page === 0 || loading}
              onClick={() => setPage((current) => current - 1)}
              className="h-7 px-3 text-[11px] font-bold uppercase text-slate-400 hover:bg-slate-100">
              Trước
            </Button>
            <span className="rounded-full bg-slate-100 px-4 py-1.5 text-[12px] font-bold text-slate-700">
              {page + 1} / {totalPages}
            </span>
            <Button variant="ghost" disabled={page + 1 >= totalPages || loading}
              onClick={() => setPage((current) => current + 1)}
              className="h-7 px-3 text-[11px] font-bold uppercase text-slate-400 hover:bg-slate-100">
              Sau
            </Button>
          </div>
        </div>
      </div>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent className="max-w-[400px] rounded-[6px] border border-slate-200 bg-white shadow-xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-[16px] font-bold text-rose-600">Xác nhận xóa phác đồ</AlertDialogTitle>
            <AlertDialogDescription className="text-[13px] font-medium text-slate-500">
              Phác đồ sẽ bị xóa vĩnh viễn và không thể khôi phục.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="h-9 rounded-[4px] text-[13px] font-medium">Hủy bỏ</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="h-9 rounded-[4px] bg-rose-600 text-[13px] font-medium text-white hover:bg-rose-700">
              Đồng ý xóa
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
