"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { AlertCircle, Download, Loader2, Upload } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
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
  AgronomistPanel,
  agronomistInputClassName,
  agronomistOutlineButtonClassName,
  agronomistPrimaryButtonClassName,
  agronomistTableHeadClassName,
} from "@/components/agronomist/agronomist-ui";
import { aiKnowledgeService } from "@/app/services/aiKnowledge.service";
import { getErrorMessage } from "@/lib/axios";
import { cn } from "@/lib/utils";
import { P } from "@/lib/permissions";
import type {
  AiKnowledgeImportPreview,
  AiKnowledgeImportRow,
} from "@/app/types/ai-knowledge.types";

type ImportMode = "UPSERT_NEW" | "OVERWRITE";

export default function AgronomistImportPage() {
  return (
    <PermissionGuard permission={P.AI_IMPORT_KNOWLEDGE}>
      <AgronomistImportContent />
    </PermissionGuard>
  );
}

function AgronomistImportContent() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [mode, setMode] = useState<ImportMode>("UPSERT_NEW");
  const [preview, setPreview] = useState<AiKnowledgeImportPreview | null>(null);

  const previewMutation = useMutation({
    mutationFn: async () => {
      if (!file) throw new Error("Vui lòng chọn file Excel trước.");
      return aiKnowledgeService.previewImport(file, mode);
    },
    onSuccess: (data) => {
      setPreview(data);
      toast.success("Đã kiểm tra dữ liệu import.");
    },
    onError: (error: unknown) =>
      toast.error(getErrorMessage(error) || "Không thể đọc file Excel."),
  });

  const applyMutation = useMutation({
    mutationFn: async () => {
      if (!preview) throw new Error("Chưa có dữ liệu preview.");
      return aiKnowledgeService.applyImport(preview);
    },
    onSuccess: (data) => {
      setPreview(data);
      toast.success(`Đã import ${data.validRows} dòng hợp lệ.`);
      router.push("/agronomist");
    },
    onError: (error: unknown) =>
      toast.error(getErrorMessage(error) || "Không thể xác nhận import."),
  });

  return (
    <div className={cn("space-y-4", preview && "pb-24")}>
      <AgronomistPageHeader
        title="Import tri thức AI (Excel)"
        actions={
          <a
            href={aiKnowledgeService.getTemplateDownloadUrl()}
            className={agronomistOutlineButtonClassName}
          >
            <Download className="h-4 w-4" />
            Tải file mẫu
          </a>
        }
      />

      <AgronomistPanel className="p-4">
        <div className="grid gap-4 lg:grid-cols-[1fr,1fr,160px] lg:items-end">
          <div className="space-y-2">
            <p className="text-[12px] font-semibold text-[#232323]">
              File Excel dữ liệu (.xls/.xlsx)
            </p>
            <div className="flex h-[38px] overflow-hidden rounded-[4px] border border-[#d5d8e5] bg-white">
              <label
                htmlFor="agronomist-import-file"
                className="flex w-[92px] cursor-pointer items-center justify-center border-r border-[#d5d8e5] bg-white text-[12px] font-semibold text-[#232323]"
              >
                Chọn tệp
              </label>
              <span className="min-w-0 flex-1 truncate bg-[#f5f6fa] px-3 py-2.5 text-[12px] text-slate-500">
                {file?.name || "Chưa có tệp nào"}
              </span>
              <input
                id="agronomist-import-file"
                type="file"
                accept=".xlsx,.xls"
                className="hidden"
                onChange={(event) => {
                  setFile(event.target.files?.[0] ?? null);
                  setPreview(null);
                }}
              />
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-[12px] font-semibold text-[#232323]">Nội dung</p>
            <Select
              value={mode}
              onValueChange={(value) => {
                setMode(value as ImportMode);
                setPreview(null);
              }}
            >
              <SelectTrigger className={agronomistInputClassName}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="UPSERT_NEW" className="text-[12px]">
                  Thêm mới - Chỉ thêm thông tin mới, không xóa thông tin cũ đang
                  có
                </SelectItem>
                <SelectItem value="OVERWRITE" className="text-[12px]">
                  Ghi đè - Cập nhật bản ghi trùng mã
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <button
            type="button"
            onClick={() => previewMutation.mutate()}
            disabled={!file || previewMutation.isPending}
            className={agronomistPrimaryButtonClassName}
          >
            {previewMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Upload className="h-4 w-4" />
            )}
            Tải file lên
          </button>
        </div>
      </AgronomistPanel>

      {preview ? <ImportPreview preview={preview} /> : null}

      {preview ? (
        <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-[#dcdfe8] bg-white px-6 py-4 shadow-[0_-4px_16px_rgba(15,23,42,0.08)] lg:left-[260px]">
          <div className="ml-auto flex max-w-[420px] items-center justify-end gap-4">
            <Link
              href="/agronomist"
              className="inline-flex h-[38px] items-center px-4 text-[14px] font-semibold text-[#d2453f]"
            >
              Hủy import
            </Link>
            <Button
              type="button"
              onClick={() => applyMutation.mutate()}
              disabled={applyMutation.isPending || preview.validRows === 0}
              className="h-[46px] min-w-[180px] rounded-[4px] bg-[#252896] text-[13px] font-semibold text-white shadow-none hover:bg-[#1d2078]"
            >
              {applyMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : null}
              Xác nhận
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function ImportPreview({ preview }: { preview: AiKnowledgeImportPreview }) {
  const invalidRows = preview.rows.filter((row) => !row.valid);
  const validRows = preview.rows.filter((row) => row.valid);

  return (
    <AgronomistPanel className="p-4">
      <div className="mb-4 flex items-center gap-2 border-l-4 border-[#d2453f] pl-3">
        <h2 className="text-[18px] font-semibold uppercase text-[#252896]">
          Kiểm tra dữ liệu nhập
        </h2>
      </div>

      <div className="mb-5 rounded-[4px] bg-[#f0f1f3] px-4 py-3 text-[13px] font-semibold text-slate-700">
        Đã đọc {preview.totalRows} dòng
        <span className="mx-2 text-slate-400">-</span>
        <span className="text-emerald-700">{preview.validRows} hợp lệ</span>
        <span className="mx-2 text-slate-400">|</span>
        <span className="text-[#d2453f]">{preview.invalidRows} lỗi</span>
      </div>

      {invalidRows.length > 0 ? (
        <section className="mb-6">
          <div className="mb-3 flex items-center gap-2 text-[13px] font-semibold text-[#d2453f]">
            <AlertCircle className="h-4 w-4" />
            Danh sách dòng lỗi ({invalidRows.length})
          </div>
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full min-w-[760px] border-collapse overflow-hidden rounded-[4px] border border-[#e1e4ec] text-left">
              <thead className={agronomistTableHeadClassName}>
                <tr>
                  <th className="w-[120px] px-4 py-3 text-center">Dòng</th>
                  <th className="w-[220px] px-4 py-3">Lý do lỗi</th>
                  <th className="px-4 py-3">Nội dung</th>
                </tr>
              </thead>
              <tbody>
                {invalidRows.map((row) => (
                  <tr
                    key={`invalid-${row.rowNumber}-${row.code}`}
                    className="border-t border-[#e7eaf0]"
                  >
                    <td className="px-4 py-3 text-center text-[12px] text-slate-600">
                      {row.rowNumber}
                    </td>
                    <td className="px-4 py-3 text-[12px] font-medium text-[#d2453f]">
                      {row.errors.join(", ")}
                    </td>
                    <td className="px-4 py-3 text-[12px] text-[#d2453f]">
                      {rowContent(row)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}

      <section>
        <h3 className="mb-3 text-[13px] font-semibold text-[#232323]">
          Xem trước dữ liệu hợp lệ ({validRows.length})
        </h3>
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full min-w-[920px] border-collapse overflow-hidden rounded-[4px] border border-[#e1e4ec] text-left">
            <thead className={agronomistTableHeadClassName}>
              <tr>
                <th className="w-[90px] px-4 py-3">STT</th>
                <th className="w-[210px] px-4 py-3">Chủ đề</th>
                <th className="px-4 py-3">Nội dung</th>
                <th className="w-[240px] px-4 py-3">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {validRows.length > 0 ? (
                validRows.map((row, index) => (
                  <tr
                    key={`valid-${row.rowNumber}-${row.code}`}
                    className="border-t border-[#e7eaf0]"
                  >
                    <td className="px-4 py-4 text-[12px] text-slate-600">
                      {index + 1}
                    </td>
                    <td className="px-4 py-4 text-[12px] font-medium text-[#232323]">
                      {row.name || row.code}
                    </td>
                    <td className="px-4 py-4">
                      <p className="line-clamp-1 text-[12px] text-slate-600">
                        {rowContent(row)}
                      </p>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex flex-wrap gap-1.5">
                        {previewTags(row).map((tag) => (
                          <span
                            key={tag}
                            className="inline-flex h-6 items-center rounded-full bg-[#dfe4ff] px-2.5 text-[11px] text-[#252896]"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={4}
                    className="h-[120px] px-4 text-center text-[12px] text-slate-400"
                  >
                    Chưa có dòng hợp lệ để import.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </AgronomistPanel>
  );
}

function rowContent(row: AiKnowledgeImportRow) {
  if (row.type === "FAQ") {
    return (
      stripHtml(row.answerHtml || "") ||
      row.aliasesRaw ||
      row.symptomKeywordsRaw ||
      row.name ||
      "-"
    );
  }
  return row.signsSummary || row.symptomKeywordsRaw || row.name || "-";
}

function previewTags(row: AiKnowledgeImportRow) {
  const raw =
    row.type === "FAQ"
      ? row.aliasesRaw || row.symptomKeywordsRaw || ""
      : row.symptomKeywordsRaw || row.aliasesRaw || "";
  return raw
    .split(/[,\n]/)
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 3);
}

function stripHtml(value: string) {
  return value
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}
